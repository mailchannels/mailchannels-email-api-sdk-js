import { MailChannels } from "mailchannels-sdk";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const mailchannels = new MailChannels(config.mailchannels.apiKey);

  const { success, error } = await mailchannels.webhooks.deleteAll();

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    });
  }

  return { success };
});
