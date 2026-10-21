import { spawn } from "node:child_process";
import { platform } from "node:os";
import { defineCommand } from "citty";
import { styleText } from "../utils/shared/style";

const DOCS_URL = "https://docs.mailchannels.com";

const getBrowserLauncher = (os: NodeJS.Platform) => {
  switch (os) {
    case "win32":
      return { command: "cmd", args: ["/c", "start", "", DOCS_URL] };
    case "darwin":
      return { command: "open", args: [DOCS_URL] };
    case "linux":
      return { command: "xdg-open", args: [DOCS_URL] };
    default:
      return null;
  }
};

export default defineCommand({
  meta: {
    name: "docs",
    description: "Open the MailChannels documentation in your default browser"
  },
  run () {
    const os = platform();
    const launcher = getBrowserLauncher(os);

    if (!launcher) {
      console.error(`Opening the documentation is not supported on ${os}.`);
      process.exitCode = 1;
      return;
    }

    const child = spawn(launcher.command, launcher.args, {
      detached: true,
      stdio: "ignore"
    });

    child.on("spawn", () => {
      console.info(`Opened ${styleText(["cyan", "underline"], DOCS_URL)} in your browser.`);
    });

    child.on("error", (error) => {
      console.error(`Could not open the browser: ${error.message}`);
      process.exitCode = 1;
    });

    child.unref();
  }
});
