import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { parsePagination } from "../../utils/shared/parse-pagination";
import { MailChannelsClient, Webhooks, type WebhooksBatchStatus } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "batches",
    description: "Retrieve paged webhook batches"
  },
  args: {
    ...sharedArgs,
    "created-after": { type: "string", valueHint: "datetime" },
    "created-before": { type: "string", valueHint: "datetime" },
    "statuses": { type: "string", alias: "s" },
    "webhook": { type: "string", alias: ["e", "endpoint"], valueHint: "url" },
    "limit": { type: "string", alias: "l", valueHint: "number" },
    "offset": { type: "string", alias: "o", valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const { data, error } = await webhooks.batches({
      createdAfter: args["created-after"],
      createdBefore: args["created-before"],
      statuses: args["statuses"]?.split(",").map(s => s.trim()) as WebhooksBatchStatus[] | undefined,
      webhook: args["webhook"],
      ...parsePagination(args["limit"], args["offset"])
    });

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    if (!data.length) {
      console.info("[Webhooks] No webhook batches found.");
      return;
    }

    console.info("[Webhooks] Retrieved webhook batches:");
    console.table(
      data.map(batch => ({
        ...batch,
        duration: batch.duration ? `${batch.duration.value} ${batch.duration.unit}` : ""
      }))
    );
    console.info(
      "[Webhooks] Total batches retrieved:", data.length,
      `(with limit: ${args["limit"] ?? 500}, offset: ${args["offset"] ?? 0})`
    );
  }
});
