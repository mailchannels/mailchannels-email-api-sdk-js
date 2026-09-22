import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { MailChannelsClient, Suppressions, type SuppressionsSource } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "delete",
    description: "Delete a suppression entry"
  },
  args: {
    ...sharedArgs,
    recipient: { type: "string", required: true, valueHint: "address" },
    source: { type: "string", valueHint: "source" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const suppressions = new Suppressions(client);

    const { error } = await suppressions.delete(
      args["recipient"],
      args["source"] as SuppressionsSource | "all" | undefined
    );

    if (error) {
      console.error(`[Suppressions] ${error.message}`);
      process.exit(1);
    }

    console.info("[Suppressions] Suppression entry deleted successfully.");
  }
});
