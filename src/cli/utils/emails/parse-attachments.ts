import { text } from "node:stream/consumers";
import { Attachment, type EmailsSendAttachment } from "../../../mailchannels";
import type { EmailsSendPayloadAttachment } from "../../../types/emails/internal";

export const parseAttachments = async (rawAttachments: boolean) => {
  if (!rawAttachments) return;

  const stdin = process.stdin;

  if (stdin.isTTY) {
    console.error("[Emails] '--attachments' requires JSON input piped to stdin.");
    process.exit(1);
  }

  const input = await text(stdin);
  let parsedAttachments: EmailsSendPayloadAttachment[];

  try {
    parsedAttachments = JSON.parse(input);
  }
  catch {
    console.error("[Emails] JSON input for '--attachments' is not valid.");
    process.exit(1);
  }

  const attachments: EmailsSendAttachment[] = parsedAttachments.map((attachment, index) => {
    if (!attachment.content || !attachment.filename) {
      console.error(
        `[Emails] Attachment at index ${index} is missing required fields 'content' or 'filename'.`
      );
      process.exit(1);
    }

    if (attachment.type) {
      return {
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type,
        contentId: attachment.content_id
      };
    }

    return Attachment.fromBytes(Buffer.from(attachment.content, "base64"), {
      filename: attachment.filename,
      type: attachment.type,
      contentId: attachment.content_id
    });
  });

  return attachments;
};
