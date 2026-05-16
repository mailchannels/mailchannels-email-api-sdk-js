import { beforeEach, describe, expect, it, vi } from "vitest";
import { $fetch } from "ofetch";
import { generateKeyPairSync, subtle } from "node:crypto";
import { Buffer } from "node:buffer";
import type { MailChannelsClient } from "~/client";
import { Webhooks } from "~/modules/webhooks";
import { stripPemHeaders } from "~/utils/helpers";
import { DEFAULT_TOLERANCE, ED25519, HMAC_SHA256, encoder } from "~/utils/webhooks-validator";
import type { WebhooksVerifyOptions, WebhooksVerifyResponse } from "~/types/webhooks/verify";
import type { WebhookEventDelivered, WebhookEventProcessed } from "~/types/webhooks/events";

const generateTestingKeys = () => {
  const ed25519Keys = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  return { ed25519Keys };
};

const body = [
  {
    email: "test@mailchannels.com",
    event: "processed",
    customer_handle: "test_handle",
    timestamp: 1778959788
  } satisfies WebhookEventProcessed,
  {
    email: "test@mailchannels.com",
    event: "delivered",
    customer_handle: "test_handle",
    timestamp: 1778959788
  } satisfies WebhookEventDelivered
];

const rawBody = JSON.stringify(body);
const { ed25519Keys } = generateTestingKeys();

const privateKeyBuffer = Buffer.from(stripPemHeaders(ed25519Keys.privateKey), "base64");
const privateKey = await subtle.importKey("pkcs8", privateKeyBuffer, ED25519, false, ["sign"]);
const timestamp = Math.floor(Date.now() / 1000);

const getHeaders = async (body: string) => {
  const bodyBuffer = await subtle.digest(HMAC_SHA256.hash, Buffer.from(body));
  const bodyHash = Buffer.from(bodyBuffer).toString("base64");
  const contentDigest = `sha-256=:${bodyHash}:`;

  const signatureInputValues = `("content-digest");created=${timestamp};alg="ed25519";keyid="mckey"`;
  const signatureInput = `sig_123456=${signatureInputValues}`;
  const signingString = `"content-digest": ${contentDigest}
"@signature-params": ${signatureInputValues}`;

  const signatureBuffer = await subtle.sign(ED25519.name, privateKey, encoder.encode(signingString));
  const signature = `sig_123456=:${Buffer.from(signatureBuffer).toString("base64")}:`;

  return { contentDigest, signature, signatureInput };
};

const headers = await getHeaders(rawBody);

const fake = {
  options: {
    payload: rawBody,
    headers: {
      "content-digest": headers.contentDigest,
      "signature": headers.signature,
      "signature-input": headers.signatureInput
    },
    publicKey: ed25519Keys.publicKey
  } satisfies WebhooksVerifyOptions,
  expectedResponse: {
    data: [
      { event: "processed" },
      { event: "delivered" }
    ] satisfies WebhooksVerifyResponse["data"],
    error: null
  }
};

vi.mock("ofetch", () => ({
  $fetch: vi.fn()
}));

describe("verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully verify the webhook and return event types for valid webhook request", async () => {
    const mockClient = {} as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);

    const { data: dataFromClient } = await webhooks.verify(fake.options);
    const { data: dataFromStatic } = await Webhooks.verify(fake.options);

    expect(dataFromStatic).toStrictEqual(fake.expectedResponse.data);
    expect(dataFromClient).toStrictEqual(fake.expectedResponse.data);
  });

  it("should contain error on invalid content digest", async () => {
    const { data, error } = await Webhooks.verify({
      ...fake.options,
      headers: {
        ...fake.options.headers,
        "content-digest": "invalid-content-digest"
      }
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error on missing content digest", async () => {
    const { data, error } = await Webhooks.verify({
      ...fake.options,
      headers: {
        ...fake.options.headers,
        "content-digest": "sha-256=::"
      }
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error on unsupported digest algorithm", async () => {
    const { data, error } = await Webhooks.verify({
      ...fake.options,
      headers: {
        ...fake.options.headers,
        "content-digest": "sha-512=:hash:"
      }
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error on invalid signature", async () => {
    const { data, error } = await Webhooks.verify({
      ...fake.options,
      headers: {
        ...fake.options.headers,
        signature: "invalid-signature"
      }
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error on missing signature input", async () => {
    const { data, error } = await Webhooks.verify({
      ...fake.options,
      headers: {
        ...fake.options.headers,
        "signature-input": "invalid-signature-input"
      }
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error on expired timestamp", async () => {
    const pastTimestamp = timestamp - (DEFAULT_TOLERANCE + 1);
    const expiredSignatureInputValues = `("content-digest");created=${pastTimestamp};alg="ed25519";keyid="mckey"`;
    const expiredSignatureInput = `sig_123456=${expiredSignatureInputValues}`;
    const expiredSigningString = `"content-digest": ${headers.contentDigest}
"@signature-params": ${expiredSignatureInputValues}`;
    const expiredSignatureBuffer = await subtle.sign(ED25519.name, privateKey, encoder.encode(expiredSigningString));
    const expiredSignature = `sig_123456=:${Buffer.from(expiredSignatureBuffer).toString("base64")}:`;

    const { data, error } = await Webhooks.verify({
      ...fake.options,
      headers: {
        ...fake.options.headers,
        "signature-input": expiredSignatureInput,
        "signature": expiredSignature
      }
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should return events for valid webhook request with public key fetch", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({
      id: "mckey",
      key: fake.options.publicKey
    });

    const { data, error } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined,
      cache: false
    });

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect($fetch).toHaveBeenCalled();
  });

  it("should contain error when public key fetch fails", async () => {
    vi.mocked($fetch).mockRejectedValueOnce(new Error("Failed to fetch public key"));

    const { data, error } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined,
      cache: false
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should cache signing key by default", async () => {
    vi.mocked($fetch).mockResolvedValue({
      id: "mckey",
      key: fake.options.publicKey
    });

    const { data: firstData } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined
    });

    const { data: secondData } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined
    });

    expect(firstData).toStrictEqual(fake.expectedResponse.data);
    expect(secondData).toStrictEqual(fake.expectedResponse.data);
    expect($fetch).toHaveBeenCalledTimes(1);
  });

  it("should not use cache when cache is disabled", async () => {
    vi.mocked($fetch).mockResolvedValue({
      id: "mckey",
      key: fake.options.publicKey
    });

    const { data: firstData } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined,
      cache: false
    });

    const { data: secondData } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined,
      cache: false
    });

    expect(firstData).toStrictEqual(fake.expectedResponse.data);
    expect(secondData).toStrictEqual(fake.expectedResponse.data);
    expect($fetch).toHaveBeenCalledTimes(2);
  });

  it("should contain error when public key is not found", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({} as never);

    const { data, error } = await Webhooks.verify({
      ...fake.options,
      publicKey: undefined,
      cache: false
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error when signature verification throws an error", async () => {
    vi.spyOn(subtle, "verify").mockRejectedValueOnce(new Error("Verification error"));

    const { data, error } = await Webhooks.verify(fake.options);

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook signature.", statusCode: null });
  });

  it("should contain error when payload is malformed json", async () => {
    const malformedRawBody = "{invalid-json";
    const malformedHeaders = await getHeaders(malformedRawBody);

    const { data, error } = await Webhooks.verify({
      payload: malformedRawBody,
      headers: {
        "content-digest": malformedHeaders.contentDigest,
        "signature": malformedHeaders.signature,
        "signature-input": malformedHeaders.signatureInput
      },
      publicKey: ed25519Keys.publicKey
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook payload.", statusCode: null });
  });

  it("should contain error when payload is not an array", async () => {
    const objectRawBody = JSON.stringify(body[0]);
    const objectHeaders = await getHeaders(objectRawBody);

    const { data, error } = await Webhooks.verify({
      payload: objectRawBody,
      headers: {
        "content-digest": objectHeaders.contentDigest,
        "signature": objectHeaders.signature,
        "signature-input": objectHeaders.signatureInput
      },
      publicKey: ed25519Keys.publicKey
    });

    expect(data).toBeNull();
    expect(error).toStrictEqual({ message: "Invalid webhook payload.", statusCode: null });
  });
});
