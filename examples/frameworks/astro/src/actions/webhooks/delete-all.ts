import { ActionError, defineAction } from "astro:actions";
import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(import.meta.env.MAILCHANNELS_API_KEY);

export default defineAction({
  accept: "json",
  handler: async () => {
    const { success, error } = await mailchannels.webhooks.deleteAll();

    if (error) {
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message
      });
    }

    return { success };
  }
});
