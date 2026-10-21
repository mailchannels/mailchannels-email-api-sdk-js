import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { Domains, MailChannelsClient } from "../../../mailchannels";
import type { DomainsDkimCreateOptions } from "../../../types/domains/dkim-create";

export default defineCommand({
  meta: {
    name: "create",
    description: "Create a DKIM key pair for a specified domain and selector"
  },
  args: {
    ...sharedArgs,
    domain: { type: "string", required: true, valueHint: "domain" },
    selector: { type: "string", required: true, valueHint: "selector" },
    algorithm: { type: "string", valueHint: "algorithm" },
    length: { type: "string", valueHint: "bits" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.dkim.create(args["domain"], {
      selector: args["selector"],
      algorithm: args["algorithm"] as DomainsDkimCreateOptions["algorithm"],
      length: args["length"] ? Number(args["length"]) as DomainsDkimCreateOptions["length"] : undefined
    });

    if (error) {
      console.error(`[DKIM] ${error.message}`);
      process.exit(1);
    }

    const { dnsRecords, ...dkimData } = data;

    console.info("[DKIM] DKIM key created successfully:"
      + tabulatedSections(dkimData)
    );

    if (dnsRecords && dnsRecords.length > 0) {
      console.info("[DKIM] DNS Records:"
        + tabulatedSections(dnsRecords)
      );
    }
  }
});
