import { parseArgs } from "node:util";
import { createSimulator } from "../../simulator/index.ts";

export default async (args: string[]) => {
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

  const simulator = createSimulator({
    host: values.host,
    port: values.port !== undefined ? Number.parseInt(values.port, 10) : undefined,
    silent: values.silent
  });

  await simulator.listen();

  const shutdown = async () => {
    await simulator.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};
