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
    "endpoint": { type: "string", alias: "e", required: true, valueHint: "url" },
    "failure-threshold": { type: "string", required: false, valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const webhooks = new Webhooks(client);

    const failureThreshold = args["failure-threshold"];

    if (failureThreshold !== undefined && !/^[+-]?\d+(?:\.0+)?$/.test(failureThreshold)) {
      console.error("[Webhooks] '--failure-threshold' must be an integer value.");
      process.exit(1);
    }

    const { error } = await webhooks.create(args["endpoint"], {
      failureThreshold: failureThreshold !== undefined ? Number(failureThreshold) : undefined
    });

    if (error) {
      console.error(`[Webhooks] ${error.message}`);
      process.exit(1);
    }

    console.info("[Webhooks] Webhook created successfully.");
  }
});
