import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { Domains, MailChannelsClient } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "rotate",
    description: "Rotate an active DKIM key pair"
  },
  args: {
    ...sharedArgs,
    "domain": { type: "string", required: true, valueHint: "domain" },
    "selector": { type: "string", required: true, valueHint: "selector" },
    "new-selector": { type: "string", required: true, valueHint: "selector" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.dkim.rotate(args["domain"], args["selector"], {
      newKey: {
        selector: args["new-selector"]
      }
    });

    if (error) {
      console.error(`[DKIM] ${error.message}`);
      process.exit(1);
    }

    console.info("[DKIM] DKIM key rotated successfully.");

    const { dnsRecords, ...newDkimData } = data.new;

    console.info("[DKIM] New DKIM key details:"
      + tabulatedSections(newDkimData)
    );

    if (dnsRecords && dnsRecords.length > 0) {
      console.info("[DKIM] DNS Records for the new key:"
        + tabulatedSections(dnsRecords)
      );
    }
  }
});
