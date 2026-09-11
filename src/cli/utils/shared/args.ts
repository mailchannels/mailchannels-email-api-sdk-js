import type { ArgsDef } from "citty";

export const sharedArgs = {
  "api-key": { type: "string", alias: "k", valueHint: "key" }
} satisfies ArgsDef;
