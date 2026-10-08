import { defineCommand } from "citty";
import { getApiKey } from "../../../utils/shared/get-api-key";
import { sharedArgs } from "../../../utils/shared/args";
import { toWordsKeys } from "../../../utils/shared/style";
import { MailChannelsClient, SubAccounts } from "../../../../mailchannels";

export default defineCommand({
  meta: {
    name: "list",
    description: "List sub-account SMTP passwords"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { data, error } = await subAccounts.smtpPasswords.list(args["handle"]);

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    if (!data.length) {
      console.info("[Sub-Accounts] No SMTP passwords found for this sub-account.");
      return;
    }

    console.info("[Sub-Accounts] Sub-account SMTP passwords:");
    console.table(toWordsKeys(data));
  }
});
