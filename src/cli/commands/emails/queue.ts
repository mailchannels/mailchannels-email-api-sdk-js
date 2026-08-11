import { defineCommand } from "citty";
import { emailArgs } from "../../utils/emails/args";
import { getApiKey } from "../../utils/emails/get-api-key";
import { parseOptions } from "../../utils/emails/parse-options";
import { Emails, MailChannelsClient } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "queue",
    description: "Queue an email to be sent using the MailChannels Email API"
  },
  args: emailArgs,
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const emails = new Emails(client);

    const sendOptions = await parseOptions(args);
    const { error } = await emails.queue(sendOptions);

    if (error) {
      console.error(`[Emails] ${error.message}`);
      process.exit(1);
    }

    console.info("[Emails] Email queued successfully.");
  }
});
