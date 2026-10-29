import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { parsePagination } from "../../utils/shared/parse-pagination";
import { tabulatedSections } from "../../utils/shared/sections";
import { styleText } from "../../utils/shared/style";
import {
  Domains,
  type DomainsCustomTrackingListOptions,
  type DomainsCustomTrackingScope,
  MailChannelsClient
} from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "list",
    description: "Retrieve all custom tracking domains registered under your account"
  },
  args: {
    ...sharedArgs,
    name: { type: "string", valueHint: "name" },
    status: { type: "string", valueHint: "status" },
    scope: { type: "string", valueHint: "scope" },
    limit: { type: "string", alias: "l", valueHint: "number" },
    offset: { type: "string", alias: "o", valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.customTracking.list({
      name: args["name"],
      status: args["status"] as DomainsCustomTrackingListOptions["status"],
      scope: args["scope"] as DomainsCustomTrackingScope | undefined,
      ...parsePagination(args["limit"], args["offset"])
    });

    if (error) {
      console.error(`[Custom Tracking] ${error.message}`);
      process.exit(1);
    }

    if (!data.customTrackingDomains.length) {
      console.info("[Custom Tracking] No custom tracking domains found.");
      return;
    }

    console.info("[Custom Tracking] Retrieved custom tracking domains:"
      + tabulatedSections(data.customTrackingDomains)
    );
    console.info(
      "[Custom Tracking] Total custom tracking domains retrieved:",
      data.customTrackingDomains.length,
      `(with limit: ${styleText("yellow", args["limit"] ?? "100")}, offset: ${styleText("yellow", args["offset"] ?? "0")})`
    );
  }
});
