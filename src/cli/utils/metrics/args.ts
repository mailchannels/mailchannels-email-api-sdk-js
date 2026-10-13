import type { ArgsDef } from "citty";
import { sharedArgs } from "../shared/args";

export const metricsReportArgs = {
  ...sharedArgs,
  "start-time": { type: "string", valueHint: "datetime" },
  "end-time": { type: "string", valueHint: "datetime" },
  "campaign-id": { type: "string", valueHint: "id" },
  "interval": { type: "string", valueHint: "interval" }
} satisfies ArgsDef;
