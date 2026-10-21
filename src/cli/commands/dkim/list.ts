import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { parsePagination } from "../../utils/shared/parse-pagination";
import { tabulatedSections } from "../../utils/shared/sections";
import { styleText } from "../../utils/shared/style";
import { Domains, MailChannelsClient } from "../../../mailchannels";
import type { DomainsDkimKeyStatus } from "../../../types/domains/dkim-create";

export default defineCommand({
  meta: {
    name: "list",
    description: "Search for DKIM keys by domain, with optional filters"
  },
  args: {
    ...sharedArgs,
    "domain": { type: "string", required: true, valueHint: "domain" },
    "selector": { type: "string", valueHint: "selector" },
    "status": { type: "string", valueHint: "status" },
    "include-dns-record": { type: "boolean" },
    "limit": { type: "string", alias: "l", valueHint: "number" },
    "offset": { type: "string", alias: "o", valueHint: "number" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.dkim.list(args["domain"], {
      selector: args["selector"],
      status: args["status"] as DomainsDkimKeyStatus | undefined,
      includeDnsRecord: args["include-dns-record"],
      ...parsePagination(args["limit"], args["offset"])
    });

    if (error) {
      console.error(`[DKIM] ${error.message}`);
      process.exit(1);
    }

    if (!data.length) {
      console.info("[DKIM] No DKIM keys found.");
      return;
    }

    console.info("[DKIM] Retrieved DKIM keys:"
      + tabulatedSections(data)
    );
    console.info(
      "[DKIM] Total DKIM keys retrieved:", data.length,
      `(with limit: ${styleText("yellow", args["limit"] ?? "10")}, offset: ${styleText("yellow", args["offset"] ?? "0")})`
    );
  }
});
