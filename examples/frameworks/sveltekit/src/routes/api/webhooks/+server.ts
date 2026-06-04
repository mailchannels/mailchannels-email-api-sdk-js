import { json } from "@sveltejs/kit";
import { MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$env/static/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const { success, error } = await mailchannels.webhooks.create(body.endpoint);

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    });
  }

  return json({ success });
};

export const GET: RequestHandler = async () => {
  const { data, error } = await mailchannels.webhooks.list();

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    });
  }

  return json(data);
};

export const DELETE: RequestHandler = async () => {
  const { success, error } = await mailchannels.webhooks.deleteAll();

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    });
  }

  return json({ success });
};
