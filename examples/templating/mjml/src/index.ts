import { readFile } from "node:fs/promises";
import { MailChannels } from "mailchannels-sdk";
import mjml2html from "mjml";

process.loadEnvFile();

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!);

const emailTemplate = await readFile("./src/email-template.mjml", "utf-8");
const mjml = await mjml2html(emailTemplate);

const { data, error } = await mailchannels.emails.send({
  from: "Name <from@example.com>",
  to: "to@example.com",
  subject: "Test email",
  html: mjml.html
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.info(data);
