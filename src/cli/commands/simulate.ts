import { defineCommand } from "citty";
import { createSimulator } from "../../simulator";

export default defineCommand({
  meta: {
    name: "simulate",
    description: "Start a local MailChannels simulator server"
  },
  args: {
    port: { type: "string", alias: "p" },
    host: { type: "string", alias: "h" },
    silent: { type: "boolean", alias: "s", default: false }
  },
  async run ({ args }) {
    const { MAILCHANNELS_SIMULATOR_HOST, MAILCHANNELS_SIMULATOR_PORT } = process.env;

    const host = args.host || MAILCHANNELS_SIMULATOR_HOST;
    const port = args.port || MAILCHANNELS_SIMULATOR_PORT;

    const simulator = createSimulator({
      host: host,
      port: port !== undefined ? Number.parseInt(port, 10) : undefined,
      silent: args.silent
    });

    await simulator.listen();

    const shutdown = async () => {
      await simulator.close();
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
});
