import { MailChannels } from "mailchannels-sdk";
import { render } from "@vue-email/render";
import EmailTemplate from "./EmailTemplate.vue";

process.loadEnvFile();

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!);

const emailHtml = await render(EmailTemplate, {
  lang: "en",
  url: "https://example.com"
});

const { data, error } = await mailchannels.emails.send({
  from: "Name <from@example.com>",
  to: "to@example.com",
  subject: "Test email",
  html: emailHtml
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.info(data);
