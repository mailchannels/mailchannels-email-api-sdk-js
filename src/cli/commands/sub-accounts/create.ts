import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { MailChannelsClient, SubAccounts } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "create",
    description: "Create a sub-account"
  },
  args: {
    ...sharedArgs,
    "company-name": { type: "string", required: true, valueHint: "name" },
    "handle": { type: "string", valueHint: "handle" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { data, error } = await subAccounts.create(args["company-name"], args["handle"]);

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    console.info("[Sub-Accounts] Sub-account created successfully:"
      + tabulatedSections(data)
    );
  }
});
