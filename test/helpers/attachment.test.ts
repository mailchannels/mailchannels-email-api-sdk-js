import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { FetchHooks } from "ofetch";
import { Attachment } from "~/helpers/attachment";

const $fetch = vi.hoisted(() => vi.fn());
vi.mock("ofetch", () => ({ $fetch }));

const fixtureURL = new URL("../fixtures/email-api-endpoints.json", import.meta.url);

describe("Attachment", () => {
  it("should create fromBytes with Uint8Array", () => {
    const bytes = new Uint8Array([65, 66, 67]);
    const result = Attachment.fromBytes(bytes, { filename: "abc.txt" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("abc.txt");
    expect(result.type).toBe("text/plain");
    expect(result.disposition).toBe("attachment");
  });

  it("should create fromBytes with ArrayBuffer", () => {
    const buffer = new Uint8Array([68, 69, 70]).buffer;
    const result = Attachment.fromBytes(buffer, { filename: "def.txt" });

    expect(result.content).toBe(Buffer.from(buffer).toString("base64"));
    expect(result.filename).toBe("def.txt");
    expect(result.type).toBe("text/plain");
    expect(result.disposition).toBe("attachment");
  });

  it("should use default filename in fromBytes when it's an empty string", () => {
    const bytes = new Uint8Array([71, 72, 73]);
    const result = Attachment.fromBytes(bytes, { filename: "" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("attachment");
    expect(result.type).toBeUndefined();
    expect(result.disposition).toBe("attachment");
  });

  it("should use decoded filename in fromBytes when it contains URL-encoded characters", async () => {
    const buffer = new Uint8Array([68, 69, 70]).buffer;
    const result = Attachment.fromBytes(buffer, { filename: "file%20with%20spaces.txt" });

    expect(result.content).toBe(Buffer.from(buffer).toString("base64"));
    expect(result.filename).toBe("file with spaces.txt");
    expect(result.type).toBe("text/plain");
    expect(result.disposition).toBe("attachment");
  });

  it("should read file with fromFile from URL", async () => {
    const result = await Attachment.fromFile(fixtureURL);

    expect(result.content).toBe(Buffer.from(await readFile(fixtureURL)).toString("base64"));
    expect(result.filename).toBe("email-api-endpoints.json");
    expect(result.type).toBe("application/json");
    expect(result.disposition).toBe("attachment");
  });

  it("should read file with fromFile from string path", async () => {
    const path = fileURLToPath(fixtureURL);
    const result = await Attachment.fromFile(path);

    expect(result.content).toBe(Buffer.from(await readFile(fixtureURL)).toString("base64"));
    expect(result.filename).toBe("email-api-endpoints.json");
    expect(result.type).toBe("application/json");
    expect(result.disposition).toBe("attachment");
  });

  it("should throw on missing file in fromFile", async () => {
    const filePath = "not-found.txt";
    await expect(Attachment.fromFile(filePath, { filename: "x.txt" })).rejects.toThrow(`Unable to read attachment file: ${filePath}`);
  });

  it("should use content-type header in fromUrl if present", async () => {
    $fetch.mockImplementation(async (_url: string, opts: { onResponse?: Partial<FetchHooks["onResponse"]> }) => {
      if (opts && typeof opts.onResponse === "function") {
        opts.onResponse({ response: { headers: new Headers({ "content-type": "text/plain" }) } });
      }
      return new Uint8Array([88, 89, 90]);
    });

    const result = await Attachment.fromUrl("https://example.com/file.txt");

    expect(result.content).toBe(Buffer.from([88, 89, 90]).toString("base64"));
    expect(result.filename).toBe("file.txt");
    expect(result.type).toBe("text/plain");
    expect(result.disposition).toBe("attachment");

    $fetch.mockReset();
    vi.clearAllMocks();
  });

  it("should override content-type header in fromUrl if type is provided", async () => {
    $fetch.mockImplementation(async (_url: string, opts: { onResponse?: Partial<FetchHooks["onResponse"]> }) => {
      if (opts && typeof opts.onResponse === "function") {
        opts.onResponse({ response: { headers: new Headers({ "content-type": "text/plain" }) } });
      }
      return new Uint8Array([88, 89, 90]);
    });

    const result = await Attachment.fromUrl("https://example.com/file.txt", { type: "text/html" });

    expect(result.content).toBe(Buffer.from([88, 89, 90]).toString("base64"));
    expect(result.filename).toBe("file.txt");
    expect(result.type).toBe("text/html");
    expect(result.disposition).toBe("attachment");

    $fetch.mockReset();
    vi.clearAllMocks();
  });

  it("should set type undefined in fromUrl if header is missing, type not provided, and can't be guessed", async () => {
    $fetch.mockImplementation(async (_url: string, opts: { onResponse?: Partial<FetchHooks["onResponse"]> }) => {
      if (opts && typeof opts.onResponse === "function") {
        opts.onResponse({ response: { headers: new Headers({}) } });
      }
      return new Uint8Array([88, 89, 90]);
    });

    const result = await Attachment.fromUrl("https://example.com/file");

    expect(result.content).toBe(Buffer.from([88, 89, 90]).toString("base64"));
    expect(result.filename).toBe("file");
    expect(result.type).toBeUndefined();
    expect(result.disposition).toBe("attachment");
    $fetch.mockReset();
    vi.clearAllMocks();
  });

  it("should set disposition to inline in inlineFile", async () => {
    const result = await Attachment.inlineFile(fixtureURL);

    expect(result.content).toBe(Buffer.from(await readFile(fixtureURL)).toString("base64"));
    expect(result.filename).toBe("email-api-endpoints.json");
    expect(result.type).toBe("application/json");
    expect(result.disposition).toBe("inline");
  });

  it("should set type undefined in fromBytes if content type cannot be guessed", () => {
    const bytes = new Uint8Array([65, 66, 67]);
    const result = Attachment.fromBytes(bytes, { filename: "abc" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("abc");
    expect(result.type).toBeUndefined();
    expect(result.disposition).toBe("attachment");
  });

  it("should throw error in fromUrl if fetch fails", async () => {
    $fetch.mockRejectedValue(new Error("Network error"));

    await expect(Attachment.fromUrl("https://example.com/file.txt")).rejects.toThrow("Unable to fetch attachment from URL: https://example.com/file.txt");

    $fetch.mockReset();
    vi.clearAllMocks();
  });
});
