import { Attachment, MailChannels } from "../../src/mailchannels";

process.loadEnvFile();

const {
  MAILCHANNELS_API_KEY: apiKey
} = process.env;

if (!apiKey) {
  throw new Error("Missing environment variables");
}

const fileData1 = await fetch("https://picsum.photos/id/1/50/50").then(res => res.arrayBuffer());

const mailchannels = new MailChannels(apiKey);
const { data, error } = await mailchannels.emails.send({
  from: "Name From <from@example.com>",
  to: "to@example.com",
  subject: "Test",
  html: "<p>Hello world</p><img src='cid:example-image' alt='Example image'>",
  text: "Hello world",
  attachments: [
    Attachment.fromBytes(fileData1, { filename: "test-image-1.jpg" })
  ]
}, true);

console.info(JSON.stringify({ data, error }, null, 2));
