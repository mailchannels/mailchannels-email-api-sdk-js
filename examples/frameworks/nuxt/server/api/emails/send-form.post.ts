import { MailChannels } from "mailchannels-sdk";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig(event);

  const mailchannels = new MailChannels(config.mailchannels.apiKey);

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: body.to,
    subject: body.subject,
    html: `<p>${body.message}</p>`,
    text: body.message
  });

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    });
  }

  return data;
});
