import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { MailChannelsClient, Webhooks } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "resend-batch",
    description: "Resend a webhook batch"
  },
  args: {
    ...sharedArgs,
    "batch-id": { type: "string", alias: "b", required: true, valueHint: "id" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const { data, error } = await webhooks.resendBatch(Number(args["batch-id"]));

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    console.info("[Webhooks] Webhook batch resent:"
      + tabulatedSections(data)
    );
  }
});
