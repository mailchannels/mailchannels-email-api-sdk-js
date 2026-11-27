import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, Webhooks } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "update",
    description: "Update the failure threshold for an enrolled webhook"
  },
  args: {
    ...sharedArgs,
    "endpoint": { type: "string", alias: "e", required: true, valueHint: "url" },
    "failure-threshold": { type: "string", required: true, valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const { error } = await webhooks.update(args["endpoint"], Number(args["failure-threshold"]));

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    console.info("[Webhooks] Webhook updated successfully.");
  }
});
