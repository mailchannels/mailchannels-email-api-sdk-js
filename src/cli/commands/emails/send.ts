import { defineCommand } from "citty";
import { emailArgs } from "../../utils/emails/args";
import { getApiKey } from "../../utils/emails/get-api-key";
import { parseOptions } from "../../utils/emails/parse-options";
import { Emails, MailChannelsClient } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "send",
    description: "Send an email using the MailChannels Email API"
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
    const { error } = await emails.send(sendOptions, args["dry-run"]);

    if (error) {
      console.error(`[Emails] ${error.message}`);
      process.exit(1);
    }

    console.info("[Emails] Email sent successfully.");
  }
});
