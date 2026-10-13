import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { parsePagination } from "../../utils/shared/parse-pagination";
import { tabulatedSections } from "../../utils/shared/sections";
import { toWordsKeys } from "../../utils/shared/style";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, Metrics, type MetricsSendersOptions, type MetricsSendersType } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "senders",
    description: "Retrieves a list of senders, either sub-accounts or campaigns, with their associated message metrics"
  },
  args: {
    ...sharedArgs,
    "start-time": { type: "string", valueHint: "datetime" },
    "end-time": { type: "string", valueHint: "datetime" },
    "type": { type: "string", required: true, valueHint: "type" },
    "limit": { type: "string", alias: "l", valueHint: "number" },
    "offset": { type: "string", alias: "o", valueHint: "number" },
    "sort-order": { type: "string", valueHint: "asc|desc" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const metrics = new Metrics(client);

    const { data, error } = await metrics.senders(args["type"] as MetricsSendersType, {
      startTime: args["start-time"],
      endTime: args["end-time"],
      sortOrder: args["sort-order"] as MetricsSendersOptions["sortOrder"],
      ...parsePagination(args["limit"], args["offset"])
    });

    if (error) {
      console.error(`[Metrics] ${error.message}`);
      process.exit(1);
    }

    const { senders, ...summary } = data;

    if (senders.length === 0) {
      console.info("[Metrics] No sender data available for the specified period.");
    }
    else {
      console.info("[Metrics] Sender metrics by sender:");
      console.table(toWordsKeys(senders));
    }

    console.info("[Metrics] Sender metrics summary:"
      + tabulatedSections(summary)
    );
  }
});
