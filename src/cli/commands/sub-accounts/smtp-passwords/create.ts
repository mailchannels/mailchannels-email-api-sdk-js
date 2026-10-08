import { defineCommand } from "citty";
import { getApiKey } from "../../../utils/shared/get-api-key";
import { sharedArgs } from "../../../utils/shared/args";
import { tabulatedSections } from "../../../utils/shared/sections";
import { MailChannelsClient, SubAccounts } from "../../../../mailchannels";

export default defineCommand({
  meta: {
    name: "create",
    description: "Create a sub-account SMTP password"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { data, error } = await subAccounts.smtpPasswords.create(args["handle"]);

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    console.info("[Sub-Accounts] Sub-account SMTP password created:"
      + tabulatedSections(data)
    );
  }
});
