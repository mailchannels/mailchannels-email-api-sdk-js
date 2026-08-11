import type { ParsedArgs } from "citty";
import type { emailArgs } from "./args";
import { parseAttachments } from "./parse-attachments";
import { parseHeaders } from "./parse-headers";
import type { EmailsSendOptions } from "../../../mailchannels";

export const parseOptions = async (args: ParsedArgs<typeof emailArgs>) => {
  const attachments = await parseAttachments(args["attachments"]);
  const headers = parseHeaders(args["headers"]);

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
    html: args["html"],
    text: args["text"],
    transactional: args["transactional"],
    unsubscribe: {
      customDomainName: args["unsubscribe-custom-domain-name"]
    }
  } satisfies EmailsSendOptions;
};
