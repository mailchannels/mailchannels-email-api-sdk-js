import type { ArgsDef } from "citty";
import { sharedArgs } from "../shared/args";

export const emailArgs = {
  ...sharedArgs,
  "campaign-id": { type: "string" },
  "dkim-domain": { type: "string" },
  "dkim-selector": { type: "string" },
  "dkim-private-key": { type: "string" },
  "envelope-from": { type: "string" },
  "tracking-click": { type: "boolean", default: false },
  "tracking-click-custom-domain-name": { type: "string", valueHint: "name" },
  "tracking-open": { type: "boolean", default: false },
  "tracking-open-custom-domain-name": { type: "string", valueHint: "name" },
  "from": { type: "string", required: true },
  "headers": { type: "string", alias: "h", valueHint: "JSON" },
  "to": { type: "string", required: true },
  "subject": { type: "string", required: true },
  "text": { type: "string", default: "" },
  "html": { type: "string", default: "" },
  "cc": { type: "string" },
  "bcc": { type: "string" },
  "reply-to": { type: "string" },
  "attachments": { type: "boolean", alias: "a", default: false },
  "transactional": { type: "boolean", default: true },
  "unsubscribe-custom-domain-name": { type: "string", valueHint: "name" }
} satisfies ArgsDef;
