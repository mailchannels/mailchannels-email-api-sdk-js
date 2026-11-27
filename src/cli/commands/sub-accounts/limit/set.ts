import { defineCommand } from "citty";
import { getApiKey } from "../../../utils/shared/get-api-key";
import { sharedArgs } from "../../../utils/shared/args";
import { SubAccounts } from "../../../../mailchannels";
import { MailChannelsCliClient } from "../../../client";

export default defineCommand({
  meta: {
    name: "set",
    description: "Set sub-account limit"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" },
    sends: { type: "string", required: true, valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsCliClient(apiKey);
    const subAccounts = new SubAccounts(client);

    if (!/^[+-]?\d+(?:\.0+)?$/.test(args["sends"])) {
      console.error("[Sub-Accounts] '--sends' must be an integer value.");
      process.exit(1);
    }

    const { error } = await subAccounts.limits.set(args["handle"], {
      sends: Number(args["sends"])
    });

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    console.info("[Sub-Accounts] Sub-account limit set successfully.");
  }
});
