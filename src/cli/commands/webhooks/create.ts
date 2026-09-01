import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, Webhooks } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "create",
    description: "Enroll a new webhook endpoint"
  },
  args: {
    ...sharedArgs,
    endpoint: { type: "string", alias: "e", required: true, valueHint: "url" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const { error } = await webhooks.create(args["endpoint"]);

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    console.info("[Webhooks] Webhook created successfully.");
  }
});
