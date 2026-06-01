import { ActionError, defineAction } from "astro:actions";
import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(import.meta.env.MAILCHANNELS_API_KEY);

export default defineAction({
  accept: "json",
  handler: async (input) => {
    const body = input;

    const { data, error } = await mailchannels.emails.send({
      from: "Name <from@example.com>",
      to: body.to,
      subject: body.subject,
      html: `<p>${body.message}</p>`,
      text: body.message
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
