import { Buffer } from "node:buffer";
import mime from "mime";
import type { EmailsSendAttachment } from "../types/emails/send";

const base64Content = (data: ArrayBuffer | Uint8Array): string => {
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("base64");
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("base64");
};

const guessContentType = (filename: string) => {
  return mime.getType(filename) || undefined;
};

type AttachmentOptions = Omit<EmailsSendAttachment, "content">;

export class Attachment {
  static fromBytes (data: ArrayBuffer | Uint8Array, options: AttachmentOptions): EmailsSendAttachment {
    const { filename, type, contentId } = options;

    return {
      content: base64Content(data),
      filename: decodeURIComponent(filename) || "attachment",
      type: type || guessContentType(filename),
      contentId
    };
  }

  static async fromBlob (blob: Blob, options: AttachmentOptions): Promise<EmailsSendAttachment> {
    if (!(blob instanceof Blob)) {
      throw new Error("Unable to create attachment: expected a Blob");
    }

    const bytes = await blob.arrayBuffer();

    return Attachment.fromBytes(bytes, {
      type: blob.type,
      ...options
    });
  }
}
