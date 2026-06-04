import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY as string);

export async function POST (request: Request) {
  const body = await request.json();

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: body.to,
    subject: body.subject,
    html: `<p>${body.message}</p>`,
    text: body.message
  });

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json(data);
}
