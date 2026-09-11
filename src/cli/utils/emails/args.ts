import type { ArgsDef } from "citty";
import { sharedArgs } from "../shared/args";

export const emailArgs = {
  ...sharedArgs,
  "campaign-id": { type: "string", valueHint: "id" },
  "dkim-domain": { type: "string", valueHint: "domain" },
  "dkim-selector": { type: "string", valueHint: "selector" },
  "dkim-private-key": { type: "string", valueHint: "key" },
  "envelope-from": { type: "string", valueHint: "address" },
  "tracking-click": { type: "boolean", default: false },
  "tracking-click-custom-domain-name": { type: "string", valueHint: "name" },
  "tracking-open": { type: "boolean", default: false },
  "tracking-open-custom-domain-name": { type: "string", valueHint: "name" },
  "from": { type: "string", required: true, valueHint: "address" },
  "headers": { type: "string", valueHint: "json" },
  "to": { type: "string", required: true, valueHint: "addresses" },
  "subject": { type: "string", required: true },
  "text": { type: "string", default: "" },
  "html": { type: "string", default: "" },
  "cc": { type: "string", valueHint: "addresses" },
  "bcc": { type: "string", valueHint: "addresses" },
  "reply-to": { type: "string", valueHint: "address" },
  "attachments": { type: "boolean", alias: "a", default: false },
  "transactional": { type: "boolean", default: true },
  "unsubscribe-custom-domain-name": { type: "string", valueHint: "name" }
} satisfies ArgsDef;
