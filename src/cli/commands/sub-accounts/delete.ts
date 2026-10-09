import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, SubAccounts } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "delete",
    description: "Delete a sub-account"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { error } = await subAccounts.delete(args["handle"]);

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    console.info("[Sub-Accounts] Sub-account deleted successfully.");
  }
});
