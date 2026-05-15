#!/usr/bin/env node
import { parseArgs } from "node:util";

const LOGGER_NAME = "[MailChannels-CLI]";
console.info = console.info.bind(console.info, LOGGER_NAME);
console.error = console.error.bind(console.error, LOGGER_NAME);

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "simulate":
    const { createSimulator } = await import("./simulator/index.ts");
    const {
      MAILCHANNELS_SIMULATOR_PORT,
      MAILCHANNELS_SIMULATOR_HOST
    } = process.env;

    const { values } = parseArgs({
      args,
      options: {
        port: { type: "string", short: "p", default: MAILCHANNELS_SIMULATOR_PORT },
        host: { type: "string", short: "h", default: MAILCHANNELS_SIMULATOR_HOST },
        silent: { type: "boolean", short: "s", default: false }
      }
    });

    const port = values.port !== undefined ? Number.parseInt(values.port, 10) : undefined;
    if (port !== undefined && (isNaN(port) || port < 0 || port > 65535)) {
      console.error("[Simulator]", `Invalid port "${values.port}": must be an integer between 0 and 65535.`);
      process.exit(1);
    }

    const simulator = createSimulator({
      host: values.host,
      port,
      silent: values.silent
    });

    await simulator.listen();

    const shutdown = async () => {
      await simulator.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    break;
}
