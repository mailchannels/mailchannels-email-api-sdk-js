import { Attachment, MailChannels } from "mailchannels-sdk";

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);
  const file = formData.get("file") as File;
  const payload = formData.get("payload") as string;
  const body = JSON.parse(payload);

  const config = useRuntimeConfig(event);

  const mailchannels = new MailChannels(config.mailchannels.apiKey);

  const fileData = await file.arrayBuffer();

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: body.to,
    subject: body.subject,
    html: `<p>${body.message}</p>`,
    text: body.message,
    attachments: [
      Attachment.fromBytes(fileData, { filename: body.filename })
    ]
  });

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    });
  }

  return data;
});
