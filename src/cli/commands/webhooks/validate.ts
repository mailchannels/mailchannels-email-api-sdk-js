import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, Webhooks } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "validate",
    description: "Validate enrolled webhooks"
  },
  args: {
    ...sharedArgs,
    "request-id": { type: "string", alias: "r", valueHint: "id" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const { data, error } = await webhooks.validate(args["request-id"]);

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    console.info("[Webhooks] Webhook validation result:");
    console.table(
      data.results.map(({ result, webhook, response }) => ({
        result,
        webhook,
        status: response?.status
      }))
    );
    console.info("[Webhooks] Total webhooks validated:", data.results.length, "all passed?:", data.allPassed);
  }
});
