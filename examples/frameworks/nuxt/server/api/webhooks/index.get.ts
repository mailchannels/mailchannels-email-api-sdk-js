import { MailChannels } from "mailchannels-sdk";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const mailchannels = new MailChannels(config.mailchannels.apiKey);

  const { data, error } = await mailchannels.webhooks.list();

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    });
  }

  return data;
});
