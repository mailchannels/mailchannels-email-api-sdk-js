import { spawn } from "node:child_process";
import { styleText } from "./style";

const getBrowserLauncher = (os: NodeJS.Platform) => {
  switch (os) {
    case "win32":
      return { command: "cmd", args: ["/c", "start", ""] };
    case "darwin":
      return { command: "open", args: [] };
    case "linux":
      return { command: "xdg-open", args: [] };
    default:
      return null;
  }
};

export const openUrl = (url: string) => {
  const os = process.platform;
  const launcher = getBrowserLauncher(os);

  if (!launcher) {
    console.error(`Opening a browser is not supported on ${os}.`);
    process.exitCode = 1;
    return;
  }

  const args = [...launcher.args, url];
  const child = spawn(launcher.command, args, {
    detached: true,
    stdio: "ignore"
  });

  child.on("spawn", () => {
    console.info(`Opened ${styleText(["cyan", "underline"], url)} in your browser.`);
  });

  child.on("error", (error) => {
    console.error(`Could not open the browser: ${error.message}`);
    process.exitCode = 1;
  });

  child.unref();
};
