import { MailChannels } from "mailchannels-sdk";
import type { Config } from "@netlify/edge-functions";

export default async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = Netlify.env.get("MAILCHANNELS_API_KEY");
  const mailchannels = new MailChannels(apiKey!);

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: "to@example.com",
    subject: "Test email",
    html: "<p>Hello World</p>"
  });

  if (error) {
    return Response.json(error, { status: error.statusCode || 500 });
  }

  return Response.json(data, { status: 200 });
};

export const config: Config = {
  path: "/api/send"
};
