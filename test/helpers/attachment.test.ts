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
});
