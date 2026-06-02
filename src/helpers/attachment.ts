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
    const { filename, type, contentId, disposition = "attachment" } = options;

    return {
      content: base64Content(data),
      filename: decodeURIComponent(filename) || "attachment",
      type: type || guessContentType(filename),
      contentId,
      disposition
    };
  }
}
