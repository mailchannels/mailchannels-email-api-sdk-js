import { defineCommand } from "citty";
import { openUrl } from "../utils/shared/open-url";

const DASHBOARD_URL = "https://dash.mailchannels.com";

export default defineCommand({
  meta: {
    name: "dashboard",
    description: "Open the MailChannels dashboard in your default browser"
  },
  run () {
    openUrl(DASHBOARD_URL);
  }
});
