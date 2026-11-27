import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { SubAccounts } from "../../../mailchannels";
import { MailChannelsCliClient } from "../../client";

export default defineCommand({
  meta: {
    name: "suspend",
    description: "Suspend a sub-account"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsCliClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { error } = await subAccounts.suspend(args["handle"]);

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    console.info("[Sub-Accounts] Sub-account suspended successfully.");
  }
});
