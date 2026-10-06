import { MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$app/env/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const { success, error } = await mailchannels.webhooks.create(body.endpoint);

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json({ success });
};

export const GET: RequestHandler = async () => {
  const { data, error } = await mailchannels.webhooks.list();

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json(data);
};

export const DELETE: RequestHandler = async () => {
  const { success, error } = await mailchannels.webhooks.deleteAll();

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json({ success });
};
