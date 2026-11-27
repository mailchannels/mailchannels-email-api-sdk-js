import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { Webhooks } from "../../../mailchannels";
import { MailChannelsCliClient } from "../../client";

export default defineCommand({
  meta: {
    name: "delete-all",
    description: "Delete all webhook endpoints"
  },
  args: {
    ...sharedArgs
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsCliClient(apiKey);
    const webhooks = new Webhooks(client);

    const { error } = await webhooks.deleteAll();

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    console.info("[Webhooks] All webhooks deleted successfully.");
  }
});
