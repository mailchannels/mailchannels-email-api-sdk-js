import { defineCommand } from "citty";
import send from "./send";
import queue from "./queue";

export default defineCommand({
  meta: {
    name: "emails",
    description: "Commands for sending emails"
  },
  args: {},
  subCommands: {
    send,
    queue
  }
});
