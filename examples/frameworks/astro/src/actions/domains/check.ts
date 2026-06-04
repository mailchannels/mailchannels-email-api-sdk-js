import { ActionError, defineAction } from "astro:actions";
import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(import.meta.env.MAILCHANNELS_API_KEY);

export default defineAction({
  accept: "json",
  handler: async (input) => {
    const body = input;

    const { data, error } = await mailchannels.domains.check(body.domain);

    if (error) {
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message
      });
    }

    return data;
  }
});
