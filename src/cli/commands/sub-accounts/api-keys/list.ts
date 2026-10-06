import { defineCommand } from "citty";
import { getApiKey } from "../../../utils/shared/get-api-key";
import { sharedArgs } from "../../../utils/shared/args";
import { parsePagination } from "../../../utils/shared/parse-pagination";
import { styleText, toWordsKeys } from "../../../utils/shared/style";
import { MailChannelsClient, SubAccounts } from "../../../../mailchannels";

export default defineCommand({
  meta: {
    name: "list",
    description: "List sub-account API keys"
  },
  args: {
    ...sharedArgs,
    handle: { type: "string", required: true, valueHint: "handle" },
    limit: { type: "string", alias: "l", valueHint: "number" },
    offset: { type: "string", alias: "o", valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const subAccounts = new SubAccounts(client);

    const { data, error } = await subAccounts.apiKeys.list(args["handle"], {
      ...parsePagination(args["limit"], args["offset"])
    });

    if (error) {
      console.error(`[Sub-Accounts] ${error.message}`);
      process.exit(1);
    }

    if (!data.length) {
      console.info("[Sub-Accounts] No API keys found for this sub-account.");
      return;
    }

    console.info("[Sub-Accounts] Sub-account API keys:");
    console.table(toWordsKeys(data));
    console.info(
      "[Sub-Accounts] Total API keys retrieved:", data.length,
      `(with limit: ${styleText("yellow", args["limit"] ?? "1000")}, offset: ${styleText("yellow", args["offset"] ?? "0")})`
    );
  }
});
