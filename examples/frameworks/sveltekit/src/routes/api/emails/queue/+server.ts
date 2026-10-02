import { MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$app/env/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async () => {
  const { data, error } = await mailchannels.emails.queue({
    from: "Name <from@example.com>",
    to: "to@example.com",
    subject: "Test email",
    html: "<p>Hello World</p>"
  });

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json(data);
};
