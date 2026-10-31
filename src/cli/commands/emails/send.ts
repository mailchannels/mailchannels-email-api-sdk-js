import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { emailArgs } from "../../utils/emails/args";
import { parseOptions } from "../../utils/emails/parse-options";
import { tabulatedSections } from "../../utils/shared/sections";
import { Emails, MailChannelsClient } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "send",
    description: "Send an email"
  },
  args: {
    ...emailArgs,
    "dry-run": { type: "boolean", default: false }
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const emails = new Emails(client);

    const sendOptions = await parseOptions(args);
    const { data, error } = await emails.send(sendOptions, args["dry-run"]);

    if (error) {
      console.error(`[Emails] ${error.message}`);
      process.exit(1);
    }

    const { requestId, rendered, results } = data;
    if (args["dry-run"]) {
      console.info("[Emails] Dry run performed, no email was actually sent.");
      if (rendered && rendered.length > 0) {
        console.info("[Emails] Rendered output:" + tabulatedSections(rendered));
      }
    }
    else {
      console.info(`[Emails] Request ID: ${requestId}`);
      console.info("[Emails] Email sent successfully."
        + (results && results.length > 0 ? tabulatedSections(results) : " No results returned")
      );
    }
  }
});
