import { MailChannels } from "../../src/mailchannels";

process.loadEnvFile();

const {
  MAILCHANNELS_API_KEY: apiKey
} = process.env;

if (!apiKey) {
  throw new Error("Missing environment variables");
}

const mailchannels = new MailChannels(apiKey);
const { data, error } = await mailchannels.domains.customTracking.update("click.example.com", "click", {
  name: "clickdemo",
  status: "disabled"
});

console.info(JSON.stringify({ data, error }, null, 2));
