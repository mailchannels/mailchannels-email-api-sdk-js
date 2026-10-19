import { defineCommand } from "citty";
import { getApiKey } from "../utils/shared/get-api-key";
import { sharedArgs } from "../utils/shared/args";
import { tabulatedSections } from "../utils/shared/sections";
import { MailChannelsClient, Metrics } from "../../mailchannels";

export default defineCommand({
  meta: {
    name: "usage",
    description: "Retrieves usage statistics during the current billing period"
  },
  args: {
    ...sharedArgs
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const metrics = new Metrics(client);

    const { data, error } = await metrics.usage();

    if (error) {
      console.error(`[Usage] ${error.message}`);
      process.exit(1);
    }

    console.info("[Usage] Account usage:"
      + tabulatedSections(data)
    );
  }
});
