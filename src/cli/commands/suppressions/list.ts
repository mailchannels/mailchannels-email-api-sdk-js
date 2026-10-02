import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { parsePagination } from "../../utils/shared/parse-pagination";
import { tabulatedSections } from "../../utils/shared/sections";
import { styleText } from "../../utils/shared/style";
import { MailChannelsClient, Suppressions, type SuppressionsSource } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "list",
    description: "List suppression entries"
  },
  args: {
    ...sharedArgs,
    "recipient": { type: "string", valueHint: "address" },
    "source": { type: "string", valueHint: "source" },
    "created-after": { type: "string", valueHint: "datetime" },
    "created-before": { type: "string", valueHint: "datetime" },
    "limit": { type: "string", alias: "l", valueHint: "number" },
    "offset": { type: "string", alias: "o", valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const suppressions = new Suppressions(client);

    const { data, error } = await suppressions.list({
      recipient: args["recipient"],
      source: args["source"] as SuppressionsSource | undefined,
      createdAfter: args["created-after"],
      createdBefore: args["created-before"],
      ...parsePagination(args["limit"], args["offset"])
    });

    if (error) {
      console.error(`[Suppressions] ${error.message}`);
      process.exit(1);
    }

    if (!data.length) {
      console.info("[Suppressions] No suppression entries found.");
      return;
    }

    console.info("[Suppressions] Retrieved suppression entries:"
      + tabulatedSections(data)
    );
    console.info(
      "[Suppressions] Total suppression entries retrieved:", data.length,
      `(with limit: ${styleText("yellow", args["limit"] ?? "1000")}, offset: ${styleText("yellow", args["offset"] ?? "0")})`
    );
  }
});
