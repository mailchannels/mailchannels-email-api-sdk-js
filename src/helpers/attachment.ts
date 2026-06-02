import { Buffer } from "node:buffer";
import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { $fetch } from "ofetch";
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

  static async fromFile (path: string | URL, options?: Partial<AttachmentOptions>): Promise<EmailsSendAttachment> {
    try {
      const data = await readFile(path);

      return Attachment.fromBytes(data, {
        filename: basename(path.toString()),
        ...options
      });
    }
    catch (error) {
      throw new Error(`Unable to read attachment file: ${path}`, { cause: error });
    }
  }

  static async fromUrl (url: string, options?: Partial<AttachmentOptions>): Promise<EmailsSendAttachment> {
    try {
      let contentType: string | undefined;
      const data = await $fetch(url, {
        responseType: "arrayBuffer",
        timeout: 120000,
        onResponse: ({ response }) => {
          const contentTypeHeader = response.headers.get("content-type");
          if (contentTypeHeader) {
            contentType = contentTypeHeader.split(";", 1)[0]?.trim();
          }
        }
      });

      return Attachment.fromBytes(data, {
        type: contentType,
        filename: basename(new URL(url).pathname),
        ...options
      });
    }
    catch (error) {
      throw new Error(`Unable to fetch attachment from URL: ${url}`, { cause: error });
    }
  }

  static inlineFile (path: string | URL, options?: Partial<Omit<AttachmentOptions, "disposition">>): Promise<EmailsSendAttachment> {
    return Attachment.fromFile(path, { ...options, disposition: "inline" });
  }
}
