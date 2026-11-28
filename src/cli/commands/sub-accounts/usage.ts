import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { SubAccounts } from "../../../mailchannels";
import { MailChannelsCliClient } from "../../client";

export default defineCommand({
  meta: {
    name: "usage",
    description: "Get sub-account usage"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsCliClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { data, error } = await subAccounts.getUsage(args["handle"]);

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    console.info("[Sub-Accounts] Sub-account usage:"
      + tabulatedSections(data)
    );
  }
});
