import { json } from "@sveltejs/kit";
import { MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$env/static/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: body.to,
    subject: body.subject,
    html: "<p>Hello {{ name }}!</p>",
    text: "Hello {{ name }}!",
    template: {
      type: "mustache",
      data: {
        name: body.name
      }
    }
  }, true);

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    });
  }

  return json(data);
};
