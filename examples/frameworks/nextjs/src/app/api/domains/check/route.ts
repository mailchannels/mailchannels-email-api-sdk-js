import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY as string);

export async function POST (request: Request) {
  const body = await request.json();

  const { data, error } = await mailchannels.domains.check(body.domain);

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json(data);
}
