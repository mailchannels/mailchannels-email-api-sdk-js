import { MailChannels } from "../../src/mailchannels";

process.loadEnvFile();

const {
  MAILCHANNELS_API_KEY: apiKey
} = process.env;

if (!apiKey) {
  throw new Error("Missing environment variables");
}

const mailchannels = new MailChannels(apiKey);
const { data, error } = await mailchannels.emails.send({
  from: "Name From <from@example.com>",
  to: "to@example.com",
  subject: "Test",
  html: "<p>Hello {{ world }}</p>",
  text: "Hello {{ world }}",
  template: {
    type: "mustache",
    data: {
      world: "World"
    }
  }
}, true);

console.info(JSON.stringify({ data, error }, null, 2));
