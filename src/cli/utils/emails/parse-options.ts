import { readFile } from "node:fs/promises";
import type { ParsedArgs } from "citty";
import type { emailArgs } from "./args";
import { parseAttachments } from "./parse-attachments";
import { parseHeaders } from "./parse-headers";
import type { EmailsSendOptions } from "../../../mailchannels";

export const parseOptions = async (args: ParsedArgs<typeof emailArgs>) => {
  const attachments = await parseAttachments(args["attachments"]);
  const headers = parseHeaders(args["headers"]);

  const htmlContent = args["html"];
  const htmlPath = args["html-file"];
  const textContent = args["text"];
  const textPath = args["text-file"];

  if (textContent && textPath) {
    console.warn(
      "[Emails] Warning: both '--text' and '--text-file' are provided. Using '--text-file'."
    );
  }

  if (htmlContent && htmlPath) {
    console.warn(
      "[Emails] Warning: both '--html' and '--html-file' are provided. Using '--html-file'."
    );
  }

  const [text, html] = await Promise.all([
    textPath ? readFile(textPath, "utf8") : textContent,
    htmlPath ? readFile(htmlPath, "utf8") : htmlContent
  ]).catch((error) => {
    console.error("[Emails]", String(error));
    process.exit(1);
  });

  return {
    attachments,
    campaignId: args["campaign-id"],
    dkim: {
      domain: args["dkim-domain"],
      selector: args["dkim-selector"],
      privateKey: args["dkim-private-key"]
    },
    envelopeFrom: args["envelope-from"],
    tracking: {
      click: {
        customDomainName: args["tracking-click-custom-domain-name"],
        enable: args["tracking-click"] || Boolean(args["tracking-click-custom-domain-name"])
      },
      open: {
        customDomainName: args["tracking-open-custom-domain-name"],
        enable: args["tracking-open"] || Boolean(args["tracking-open-custom-domain-name"])
      }
    },
    headers,
    from: args["from"],
    to: args["to"].split(",").map(r => r.trim()),
    subject: args["subject"],
    cc: args["cc"]?.split(",").map(r => r.trim()),
    bcc: args["bcc"]?.split(",").map(r => r.trim()),
    replyTo: args["reply-to"],
    html,
    text,
    transactional: args["transactional"],
    unsubscribe: {
      customDomainName: args["unsubscribe-custom-domain-name"]
    }
  } satisfies EmailsSendOptions;
};
