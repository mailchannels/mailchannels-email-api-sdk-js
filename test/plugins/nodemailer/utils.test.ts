import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import Mail from "nodemailer/lib/mailer";
import MailMessage from "nodemailer/lib/mailer/mail-message";
import MailComposer from "nodemailer/lib/mail-composer";
import { parseAddress, parseAddresses, parseAttachments, parseDkim, parseHeaders, parseIcalEvent } from "~/plugins/nodemailer/utils";
import type { EmailsSendRecipient, EmailsSendRecipientInput } from "~/types/emails/send";

const fake = {
  transport: { name: "test", version: "0.0.0", send: () => {} },
  nodemailerAddress: { address: "recipient@example.com", name: "Recipient Name" }
};

const mailer = new Mail(fake.transport);

const normalize = async (raw: Mail.Options): Promise<Mail.Options> => {
  const mailMessage = new MailMessage(mailer, raw);
  mailMessage.message = new MailComposer(mailMessage.data).compile();
  return new Promise((resolve, reject) => {
    mailMessage.normalize((error, data) => {
      if (error) reject(error);
      else resolve(data!);
    });
  });
};

describe("parseAddress", () => {
  it("should return empty string for falsy input", () => {
    expect(parseAddress(undefined)).toBe("");
  });

  it("should return string address unchanged", () => {
    expect(parseAddress(fake.nodemailerAddress.address)).toBe(fake.nodemailerAddress.address);
  });

  it("should parse object address into EmailsSendRecipient", () => {
    expect(parseAddress(fake.nodemailerAddress)).toEqual({
      email: fake.nodemailerAddress.address,
      name: fake.nodemailerAddress.name
    } satisfies EmailsSendRecipient);
  });

  it("should return first element when given an array", () => {
    expect(parseAddress([fake.nodemailerAddress])).toEqual({
      email: fake.nodemailerAddress.address,
      name: fake.nodemailerAddress.name
    } satisfies EmailsSendRecipient);
  });

  it("should handle address object without name", () => {
    expect(parseAddress({ address: "no-name@example.com" })).toEqual({
      email: "no-name@example.com",
      name: undefined
    } satisfies EmailsSendRecipient);
  });
});

describe("parseAddresses", () => {
  it("should return empty array for falsy input", () => {
    expect(parseAddresses(undefined)).toEqual([]);
  });

  it("should wrap string address in an array", () => {
    expect(parseAddresses(fake.nodemailerAddress.address)).toEqual([fake.nodemailerAddress.address]);
  });

  it("should parse array of mixed addresses", () => {
    expect(parseAddresses([
      "test@example.com",
      fake.nodemailerAddress
    ])).toEqual([
      "test@example.com",
      { email: fake.nodemailerAddress.address, name: fake.nodemailerAddress.name }
    ] satisfies EmailsSendRecipientInput);
  });

  it("should parse single address object", () => {
    expect(parseAddresses(fake.nodemailerAddress)).toEqual([
      { email: fake.nodemailerAddress.address, name: fake.nodemailerAddress.name }
    ]);
  });

  it("should return empty array if address property is empty string", () => {
    expect(parseAddresses({ name: "No Address", address: "" })).toEqual([]);
  });

  it("should parse object address with missing name into undefined name", () => {
    expect(parseAddresses({ address: "solo@example.com" })).toEqual([
      { email: "solo@example.com", name: undefined }
    ]);
  });

  it("should return a list of addresses when given a comma-separated string", () => {
    const input = "recipient1@example.com,recipient2@example.com";
    expect(parseAddresses(input)).toEqual([
      "recipient1@example.com",
      "recipient2@example.com"
    ]);
  });
});

describe("parseHeaders", () => {
  it("should return undefined for falsy input", () => {
    expect(parseHeaders(undefined)).toBeUndefined();
  });

  it("should convert string and array header values to strings", () => {
    const headers = {
      "x-single": "one",
      "x-multi": ["a", "b"]
    };
    expect(parseHeaders(headers)).toEqual({
      "x-single": "one",
      "x-multi": "a,b"
    });
  });

  it("should convert array of headers to object", () => {
    const headersArray = [
      { key: "x-header1", value: "value1" },
      { key: "x-header2", value: "value2" }
    ];
    expect(parseHeaders(headersArray)).toStrictEqual({
      "x-header1": "value1",
      "x-header2": "value2"
    });
  });

  it("should convert header value objects to their `value` property", () => {
    const headers = { "x-obj": { value: "objval" } };
    // @ts-expect-error - testing object value conversion
    expect(parseHeaders(headers)).toEqual({ "x-obj": "objval" });
  });
});

describe("parseAttachments", () => {
  it("should return undefined when no attachments provided", () => {
    expect(parseAttachments(undefined)).toBeUndefined();
  });

  it("should throw when attachment missing filename or content", () => {
    expect(() => parseAttachments([{ filename: "a.txt" }])).toThrow(
      "Attachment is missing filename or content"
    );
    expect(() => parseAttachments([{ content: "hi" }])).toThrow(
      "Attachment is missing filename or content"
    );
  });

  it("should parse string content attachments", () => {
    const out = parseAttachments([
      {
        filename: "note.txt",
        content: "hello",
        contentType: "text/plain",
        cid: "cid1",
        contentDisposition: "inline"
      }
    ]);
    expect(out).toStrictEqual([
      {
        filename: "note.txt",
        content: Buffer.from("hello").toString("base64"),
        type: "text/plain",
        contentId: "cid1"
      }
    ]);
  });

  it("should parse Buffer attachments", async () => {
    const buf = Buffer.from("bytes!");
    const normalized = await normalize({
      attachments: [
        { filename: "bin.bin", content: buf, contentType: "application/octet-stream", cid: "cid2" }
      ]
    });

    const out = parseAttachments(normalized.attachments)!;

    expect(out).toStrictEqual([
      {
        filename: "bin.bin",
        content: Buffer.from(buf).toString("base64"),
        type: "application/octet-stream",
        contentId: "cid2"
      }
    ]);
  });

  it("should parse base64 string content attachments", () => {
    const base64Content = Buffer.from("hello").toString("base64");
    const out = parseAttachments([
      {
        filename: "note.txt",
        content: base64Content,
        encoding: "base64",
        contentType: "text/plain"
      }
    ]);
    expect(out).toStrictEqual([
      {
        filename: "note.txt",
        content: base64Content,
        type: "text/plain",
        contentId: undefined
      }
    ]);
  });

  it("should throw when content is not string or Buffer", () => {
    expect(() => parseAttachments([{ filename: "x", content: new Readable() }])).toThrow(
      "Attachment content must be a string or Buffer"
    );
  });
});

describe("parseIcalEvent", () => {
  it("should accept string icalEvent", () => {
    const out = parseIcalEvent("BEGIN:VCAL");
    expect(out.filename).toBe("invite.ics");
    expect(out.type).toBe("text/calendar");
    expect(out.content).toBe(Buffer.from("BEGIN:VCAL").toString("base64"));
  });

  it("should accept Buffer icalEvent", async () => {
    const buf = Buffer.from("icalbytes");
    const normalized = await normalize({ icalEvent: buf });
    const out = parseIcalEvent(normalized.icalEvent);
    expect(out.filename).toBe("invite.ics");
    expect(out.type).toBe("text/calendar");
    expect(out.content).toBe(Buffer.from("icalbytes").toString("base64"));
  });

  it("should accept object with filename and content", () => {
    const out = parseIcalEvent({ filename: "meet.ics", content: "icaltext" });
    expect(out.filename).toBe("meet.ics");
    expect(out.content).toBe(Buffer.from("icaltext").toString("base64"));
  });

  it("should default empty filename to invite.ics when provided in object", () => {
    const out = parseIcalEvent({ filename: "", content: "icaltext" });
    expect(out.filename).toBe("invite.ics");
    expect(out.content).toBe(Buffer.from("icaltext").toString("base64"));
  });

  it("should throw on invalid format", () => {
    expect(() => parseIcalEvent(new Readable())).toThrow("Not supported icalEvent format");
  });
});

describe("parseDkim", () => {
  it("returns undefined for falsy input", () => {
    expect(parseDkim(undefined)).toBeUndefined();
  });

  it("throws for multiple signatures", () => {
    expect(() => parseDkim({ keys: [] })).toThrow("Multiple DKIM signatures are not supported");
  });

  it("parses string privateKey and domain", () => {
    expect(
      parseDkim({
        keySelector: "sel",
        privateKey: "priv",
        domainName: "example.com"
      }))
      .toStrictEqual({
        selector: "sel",
        privateKey: "priv",
        domain: "example.com"
      });
  });

  it("parses missing privateKey as undefined", () => {
    expect(
      // @ts-expect-error - testing missing privateKey
      parseDkim({ keySelector: "sel", domainName: "example.com" }))
      .toStrictEqual({
        selector: "sel",
        privateKey: undefined,
        domain: "example.com"
      });
  });

  it("parses object privateKey with key and passphrase", () => {
    const passphrase = "testpass";
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs1", format: "pem", cipher: "aes-256-cbc", passphrase }
    });

    const out = parseDkim({
      keySelector: "mc-test",
      privateKey: { key: privateKey, passphrase },
      domainName: "example.com"
    });

    expect(out).toStrictEqual({
      selector: "mc-test",
      privateKey: createPrivateKey({
        key: privateKey,
        passphrase
      }).export({ format: "pem", type: "pkcs1" }),
      domain: "example.com"
    });
  });

  it("should throw for non-RSA private keys", () => {
    const { privateKey } = generateKeyPairSync("ed25519", {
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        passphrase: "test",
        cipher: "aes128"
      }
    });

    expect(() => parseDkim({
      keySelector: "mc-test",
      privateKey: { key: privateKey, passphrase: "test" },
      domainName: "example.com"
    })).toThrow("Only RSA private keys are supported for DKIM signing");
  });

  it("should rethrow errors from createPrivateKey", () => {
    expect(() => parseDkim({
      keySelector: "mc-test",
      privateKey: { key: "invalid", passphrase: "test" },
      domainName: "example.com"
    })).toThrow();
  });
});
