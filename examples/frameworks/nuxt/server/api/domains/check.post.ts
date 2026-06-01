import { MailChannels } from "mailchannels-sdk";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig(event);

  const mailchannels = new MailChannels(config.mailchannels.apiKey);

  const { data, error } = await mailchannels.domains.check(body.domain);

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    });
  }

  return data;
});
