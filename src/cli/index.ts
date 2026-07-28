#!/usr/bin/env node
const LOGGER_NAME = "[MailChannels-CLI]";
console.info = console.info.bind(console.info, LOGGER_NAME);
console.error = console.error.bind(console.error, LOGGER_NAME);

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "simulate":
    const { default: simulate } = await import("./commands/simulate.ts");
    await simulate(args);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
