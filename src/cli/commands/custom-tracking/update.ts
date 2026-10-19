import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { tabulatedSections } from "../../utils/shared/sections";
import { styleText } from "../../utils/shared/style";
import { Domains, type DomainsCustomTrackingScope, type DomainsCustomTrackingUpdateOptions, MailChannelsClient } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "update",
    description: "Update an existing custom tracking domain by its hostname and scope"
  },
  args: {
    ...sharedArgs,
    hostname: { type: "string", required: true, valueHint: "hostname" },
    scope: { type: "string", required: true, valueHint: "scope" },
    name: { type: "string", valueHint: "name" },
    status: { type: "string", valueHint: "status" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.customTracking.update(
      args["hostname"],
      args["scope"] as DomainsCustomTrackingScope,
      {
        name: args["name"],
        status: args["status"] as DomainsCustomTrackingUpdateOptions["status"]
      }
    );

    if (error) {
      console.error(`[Custom Tracking] ${error.message}`);
      if (error.response && error.response.instructions) {
        console.info(`[Custom Tracking] Instructions: ${styleText("yellow", error.response.instructions as string)}`);
      }
      process.exit(1);
    }

    console.info("[Custom Tracking] Custom tracking domain updated successfully:"
      + tabulatedSections(data)
    );
  }
});
