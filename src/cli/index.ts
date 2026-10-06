#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import pkg from "../../package.json";
import simulate from "./commands/simulate";
import emails from "./commands/emails";
import suppressions from "./commands/suppressions";
import subAccounts from "./commands/sub-accounts";
import webhooks from "./commands/webhooks";

const main = defineCommand({
  meta: {
    name: pkg.name,
    description: "MailChannels CLI",
    version: pkg.version
  },
  subCommands: {
    simulate,
    emails,
    suppressions,
    "sub-accounts": subAccounts,
    webhooks
  },
  setup () {
    const LOGGER_NAME = "[MailChannels-CLI]";
    console.info = console.info.bind(console, LOGGER_NAME);
    console.warn = console.warn.bind(console, LOGGER_NAME);
    console.error = console.error.bind(console, LOGGER_NAME);
  }
});

runMain(main);
