import { json } from "@sveltejs/kit";
import { MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$env/static/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const { data, error } = await mailchannels.domains.check(body.domain);

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    });
  }

  return json(data);
};
