import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { sharedArgs } from "../../utils/shared/args";
import { styleText, styleUrls, toWordsKeys } from "../../utils/shared/style";
import { Domains, type DomainsCheckVerdict, MailChannelsClient } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "check-domain",
    description: "Validate a domain's email authentication"
  },
  args: {
    ...sharedArgs,
    "domain": { type: "string", required: true, valueHint: "domain" },
    "dkim-domain": { type: "string", valueHint: "domain" },
    "dkim-private-key": { type: "string", valueHint: "key" },
    "dkim-selector": { type: "string", valueHint: "selector" },
    "envelope-from-domain": { type: "string", valueHint: "domain" },
    "sender-id": { type: "string", valueHint: "id" }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const domains = new Domains(client);

    const { data, error } = await domains.check(args["domain"], {
      dkim: {
        domain: args["dkim-domain"],
        privateKey: args["dkim-private-key"],
        selector: args["dkim-selector"]
      },
      envelopeFromDomain: args["envelope-from-domain"],
      senderId: args["sender-id"]
    });

    if (error) {
      console.error(`[DKIM] ${error.message}`);
      process.exit(1);
    }

    const { spf, domainLockdown, senderDomain, dkim, references } = data;

    const styleVerdict = (verdict: DomainsCheckVerdict) => {
      const upperVerdict = verdict.toUpperCase();
      switch (verdict) {
        case "passed":
          return styleText("green", upperVerdict);
        case "failed":
        case "none":
        case "unknown":
        case "permanent error":
        case "soft failed":
        case "temporary error":
          return styleText("red", upperVerdict);
        case "neutral":
          return styleText("yellow", upperVerdict);
        default:
          return upperVerdict;
      }
    };

    console.info("[DKIM] SPF checks:", styleVerdict(spf.verdict));
    console.table(toWordsKeys(spf));

    console.info("[DKIM] Domain Lockdown checks:", styleVerdict(domainLockdown.verdict));
    console.table(toWordsKeys({
      result: domainLockdown
    }));

    console.info("[DKIM] Sender Domain checks:", styleVerdict(senderDomain.verdict));
    console.table(
      toWordsKeys({
        result: { verdict: senderDomain.verdict },
        a: senderDomain.a,
        mx: senderDomain.mx
      })
    );

    const dkimVerdict = dkim.length > 0 && dkim.every(record => record.verdict === "passed");
    console.info("[DKIM] DKIM checks:", styleVerdict(dkimVerdict ? "passed" : "failed"));
    console.table(toWordsKeys(dkim));

    if (references?.length) {
      console.info("[DKIM] References:\n"
        + references.map(r => "— " + styleUrls(r)).join("\n")
      );
    }
  }
});
