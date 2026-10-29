import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import {
  Domains,
  type DomainsCustomTrackingScope,
  MailChannelsClient
} from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "delete",
    description: "Permanently delete an existing custom tracking domain for the given hostname and scope"
  },
  args: {
    ...sharedArgs,
    hostname: { type: "string", required: true, valueHint: "hostname" },
    scope: { type: "string", required: true, valueHint: "scope" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { error } = await domains.customTracking.delete(
      args["hostname"],
      args["scope"] as DomainsCustomTrackingScope
    );

    if (error) {
      console.error(`[Custom Tracking] ${error.message}`);
      process.exit(1);
    }

    console.info("[Custom Tracking] Custom tracking domain deleted successfully.");
  }
});
