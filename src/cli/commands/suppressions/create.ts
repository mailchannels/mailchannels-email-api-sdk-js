import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { parseEntries } from "../../utils/suppressions/parse-entries";
import { MailChannelsClient, Suppressions } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "create",
    description: "Create suppression entries"
  },
  args: {
    ...sharedArgs,
    "recipient": { type: "string", valueHint: "address" },
    "types": { type: "string", valueHint: "types" },
    "notes": { type: "string" },
    "entries": { type: "boolean", default: false },
    "add-to-sub-accounts": { type: "boolean", default: false }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const suppressions = new Suppressions(client);

    const entries = await parseEntries(
      args["entries"],
      args["recipient"],
      args["types"],
      args["notes"]
    );

    const { error } = await suppressions.create(entries, {
      addToSubAccounts: args["add-to-sub-accounts"]
    });

    if (error) {
      console.error(`[Suppressions] ${error.message}`);
      process.exit(1);
    }

    console.info("[Suppressions] Suppression entries created successfully.");
  }
});
