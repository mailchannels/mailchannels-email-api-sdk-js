import nodemailer from "nodemailer";
import { mailchannelsTransport } from "../../src/plugins/nodemailer";

process.loadEnvFile();

const {
  MAILCHANNELS_API_KEY: apiKey
} = process.env;

if (!apiKey) {
  throw new Error("Missing environment variables");
}

const transport = nodemailer.createTransport(
  mailchannelsTransport({
    apiKey,
    sendMode: "async"
  })
);

transport.sendMail({
  from: "Sender Name <email@example.com>",
  to: "recipient@example.com",
  cc: "recipient-cc@example.com",
  bcc: "recipient-bcc@example.com",
  subject: "Test Email",
  html: "<p>Hello {{ world }}</p>",
  mailchannels: {
    transactional: true
  }
}, (error, info) => {
  if (error) {
    console.error(error);
    return;
  }

  console.info(JSON.stringify(info, null, 2));
});
