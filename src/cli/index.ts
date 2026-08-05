#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import pkg from "../../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: pkg.name,
    description: "MailChannels CLI",
    version: pkg.version
  },
  subCommands: {
    simulate: () => import("./commands/simulate.ts").then(m => m.default)
  },
  setup () {
    const LOGGER_NAME = "[MailChannels-CLI]";
    console.info = console.info.bind(console, LOGGER_NAME);
    console.error = console.error.bind(console, LOGGER_NAME);
  }
});

runMain(main);
