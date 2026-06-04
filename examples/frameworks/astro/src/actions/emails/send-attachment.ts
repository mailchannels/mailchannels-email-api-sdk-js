import { ActionError, defineAction } from "astro:actions";
import { Attachment, MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(import.meta.env.MAILCHANNELS_API_KEY);

export default defineAction({
  accept: "json",
  handler: async (input) => {
    const body = input;

    const fileData = await fetch(body.url).then(res => res.arrayBuffer());

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
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message
      });
    }

    return data;
  }
});
