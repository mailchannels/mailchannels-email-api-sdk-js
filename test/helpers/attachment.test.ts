import { describe, expect, it } from "vitest";
import { Attachment } from "~/helpers/attachment";

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

  it("should set type undefined in fromBytes if content type cannot be guessed", () => {
    const bytes = new Uint8Array([65, 66, 67]);
    const result = Attachment.fromBytes(bytes, { filename: "abc" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("abc");
    expect(result.type).toBeUndefined();
    expect(result.disposition).toBe("attachment");
  });

  it("should create fromBlob with Blob", async () => {
    const bytes = new Uint8Array([74, 75, 76]);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const result = await Attachment.fromBlob(blob, { filename: "file.pdf" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("file.pdf");
    expect(result.type).toBe("application/pdf");
    expect(result.disposition).toBe("attachment");
  });

  it("should prioritize options.type over blob.type in fromBlob", async () => {
    const bytes = new Uint8Array([77, 78, 79]);
    const blob = new Blob([bytes], { type: "image/png" });
    const result = await Attachment.fromBlob(blob, { filename: "example", type: "text/plain" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("example");
    expect(result.type).toBe("text/plain");
    expect(result.disposition).toBe("attachment");
  });

  it("should use guessed content type when blob.type is empty in fromBlob", async () => {
    const bytes = new Uint8Array([80, 81, 82]);
    const blob = new Blob([bytes]);
    const result = await Attachment.fromBlob(blob, { filename: "file.txt" });

    expect(result.content).toBe(Buffer.from(bytes).toString("base64"));
    expect(result.filename).toBe("file.txt");
    expect(result.type).toBe("text/plain");
    expect(result.disposition).toBe("attachment");
  });

  it("should throw an error in fromBlob if input is not a Blob", async () => {
    await expect(
      // @ts-expect-error
      Attachment.fromBlob("not a blob", { filename: "invalid.txt" })
    ).rejects.toThrow("Unable to create attachment: expected a Blob");
  });
});
