import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, Webhooks } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "list",
    description: "List all webhook endpoints"
  },
  args: {
    ...sharedArgs
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const { data, error } = await webhooks.list();

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    if (!data.length) {
      console.info("[Webhooks] No registered webhooks found.");
      return;
    }

    console.info("[Webhooks] Registered webhook endpoints:");
    console.table(data);
  }
});
