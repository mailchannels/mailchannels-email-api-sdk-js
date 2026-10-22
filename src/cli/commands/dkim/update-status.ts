import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { Domains, MailChannelsClient } from "../../../mailchannels";
import type { DomainsDkimUpdateStatusOptions } from "../../../types/domains/dkim-update-status";

export default defineCommand({
  meta: {
    name: "update-status",
    description: "Update fields of an existing DKIM key pair for the specified domain and selector"
  },
  args: {
    ...sharedArgs,
    domain: { type: "string", required: true, valueHint: "domain" },
    selector: { type: "string", required: true, valueHint: "selector" },
    status: { type: "string", required: true, valueHint: "status" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { error } = await domains.dkim.updateStatus(args["domain"], {
      selector: args["selector"],
      status: args["status"] as DomainsDkimUpdateStatusOptions["status"]
    });

    if (error) {
      console.error(`[DKIM] ${error.message}`);
      process.exit(1);
    }

    console.info("[DKIM] DKIM key status updated successfully.");
  }
});
