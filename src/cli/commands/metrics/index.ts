import { defineCommand } from "citty";
import engagement from "./engagement";
import performance from "./performance";
import recipientBehaviour from "./recipient-behaviour";
import senders from "./senders";
import volume from "./volume";

export default defineCommand({
  meta: {
    name: "metrics",
    description: "Commands for retrieving message metrics"
  },
  args: {},
  subCommands: {
    engagement,
    performance,
    "recipient-behaviour": recipientBehaviour,
    senders,
    volume
  }
});
