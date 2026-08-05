import { defineCommand } from "citty";
import send from "./send";
import queue from "./queue";

export default defineCommand({
  meta: {
    name: "emails",
    description: "Commands for sending emails using the MailChannels Email API"
  },
  args: {},
  subCommands: {
    send,
    queue
  }
});
