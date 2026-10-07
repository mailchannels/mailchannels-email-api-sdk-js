import { MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$app/env/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const { data, error } = await mailchannels.domains.check(body.domain);

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json(data);
};
