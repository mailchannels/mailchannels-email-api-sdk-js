import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { styleText } from "../../utils/shared/style";
import {
  Domains,
  type DomainsCustomTrackingScope,
  MailChannelsClient
} from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "create",
    description: "Register a custom branded domain for click tracking, open tracking, or unsubscribe handling"
  },
  args: {
    ...sharedArgs,
    name: { type: "string", required: true, valueHint: "name" },
    hostname: { type: "string", required: true, valueHint: "hostname" },
    scope: { type: "string", required: true, valueHint: "scope" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.customTracking.create(
      args["name"],
      args["hostname"],
      args["scope"] as DomainsCustomTrackingScope
    );

    if (error) {
      console.error(`[Custom Tracking] ${error.message}`);
      if (error.response && error.response.instructions) {
        console.info(
          `[Custom Tracking] Instructions: ${styleText("yellow", error.response.instructions as string)}`
        );
      }
      process.exit(1);
    }

    const message = data.dnsSetupRequired
      ? "DNS setup required to complete domain creation."
      : "Custom tracking domain created successfully:";
    console.info(`[Custom Tracking] ${message}`
      + tabulatedSections(data)
    );
  }
});
