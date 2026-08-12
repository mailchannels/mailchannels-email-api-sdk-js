import { createPrivateKey } from "node:crypto";
import { Buffer } from "node:buffer";
import type Mail from "nodemailer/lib/mailer";
import type { EmailsSendAttachment, EmailsSendDkim, EmailsSendRecipient } from "../../mailchannels";

export const parseAddress = (address: Mail.Options["from"]): EmailsSendRecipient | string => {
  if (!address) return "";

  if (Array.isArray(address)) return parseAddress(address[0]);

  if (typeof address === "string") return address;

  return { email: address.address, name: address.name || undefined };
};

export const parseAddresses = (addresses?: Mail.Options["to"]): (EmailsSendRecipient | string)[] => {
  if (!addresses) return [];

  if (typeof addresses === "string") {
    return addresses.split(",").map(s => s.trim()).filter(Boolean);
  }

  if (Array.isArray(addresses)) {
    return addresses.map(address => parseAddress(address));
  }

  if (typeof addresses === "object" && addresses.address) {
    return [{ email: addresses.address, name: addresses.name || undefined }];
  }

  return [];
};

export const parseAttachments = (attachments: Mail.Options["attachments"]): EmailsSendAttachment[] | undefined => {
  if (!attachments) return;

  return attachments.map((attachment): EmailsSendAttachment => {
    if (!attachment.filename || attachment.content === undefined) {
      throw new Error("Attachment is missing filename or content");
    }

    if (typeof attachment.content === "string") {
      const encoding = attachment.encoding as BufferEncoding || "utf-8";

      return {
        content: encoding === "base64" ? attachment.content : Buffer.from(attachment.content, encoding).toString("base64"),
        filename: decodeURIComponent(attachment.filename),
        type: attachment.contentType,
        contentId: attachment.cid
      };
    }

    throw new Error("Attachment content must be a string or Buffer");
  });
};

export const parseDkim = (dkim: Mail.Options["dkim"]): EmailsSendDkim | undefined => {
  if (!dkim) return;

  if ("keys" in dkim) {
    throw new Error("Multiple DKIM signatures are not supported");
  }

  let privateKey: string | undefined;

  if (typeof dkim.privateKey === "string") {
    privateKey = dkim.privateKey;
  }
  else if (dkim.privateKey?.key && dkim.privateKey?.passphrase) {
    try {
      privateKey = createPrivateKey({
        key: dkim.privateKey.key,
        passphrase: dkim.privateKey.passphrase
      }).export({ format: "pem", type: "pkcs1" });
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS") {
        throw new Error("Only RSA private keys are supported for DKIM signing");
      }
      throw error;
    }
  }

  return {
    selector: dkim.keySelector,
    privateKey,
    domain: dkim.domainName
  };
};

export const parseHeaders = (headers: Mail.Options["headers"]): Record<string, string> | undefined => {
  if (!headers) return;

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(",") : value
        && typeof value === "object"
        && "value" in value ? String((value as { value: unknown }).value) : String(value)
    ])
  );
};

export const parseIcalEvent = (icalEvent: Mail.Options["icalEvent"]): EmailsSendAttachment => {
  if (typeof icalEvent === "string") {
    return {
      content: Buffer.from(icalEvent).toString("base64"),
      filename: "invite.ics",
      type: "text/calendar"
    };
  }

  if (typeof icalEvent === "object" && icalEvent && "content" in icalEvent) {
    return parseAttachments([{
      filename: icalEvent.filename || "invite.ics",
      content: icalEvent.content,
      encoding: icalEvent.encoding,
      contentType: "text/calendar"
    }])![0]!;
  }

  throw new Error("Not supported icalEvent format");
};
