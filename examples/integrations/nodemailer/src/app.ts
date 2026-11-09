import { mailchannelsTransport } from "@mailchannels/sdk/nodemailer";
import nodemailer from "nodemailer";
import "dotenv/config";

const transport = nodemailer.createTransport(
  mailchannelsTransport({
    apiKey: process.env.MAILCHANNELS_API_KEY!,
    sendMode: "sync"
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

  console.info(info);
});
