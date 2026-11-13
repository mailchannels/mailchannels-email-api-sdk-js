import { defineCommand } from "citty";
import { openUrl } from "../utils/shared/open-url";

const DOCS_URL = "https://docs.mailchannels.com";

export default defineCommand({
  meta: {
    name: "docs",
    description: "Open the MailChannels documentation in your default browser"
  },
  run () {
    openUrl(DOCS_URL);
  }
});
