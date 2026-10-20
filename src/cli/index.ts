#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import pkg from "../../package.json";
import simulate from "./commands/simulate";
import emails from "./commands/emails";
import customTracking from "./commands/custom-tracking";
import metrics from "./commands/metrics";
import suppressions from "./commands/suppressions";
import subAccounts from "./commands/sub-accounts";
import usage from "./commands/usage";
import webhooks from "./commands/webhooks";
import docs from "./commands/docs";
import { checkUpdate } from "./utils/shared/check-update";

const main = defineCommand({
  meta: {
    name: pkg.name,
    description: "MailChannels CLI",
    version: pkg.version
  },
  subCommands: {
    simulate,
    emails,
    "custom-tracking": customTracking,
    metrics,
    suppressions,
    "sub-accounts": subAccounts,
    usage,
    webhooks,
    docs
  },
  setup () {
    const LOGGER_NAME = "[MailChannels-CLI]";
    console.info = console.info.bind(console, LOGGER_NAME);
    console.warn = console.warn.bind(console, LOGGER_NAME);
    console.error = console.error.bind(console, LOGGER_NAME);
  },
  run () {
    checkUpdate().catch(() => {});
  }
});

runMain(main);
