import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY as string);

export async function POST (request: Request) {
  const body = await request.json();
  const { success, error } = await mailchannels.webhooks.create(body.endpoint);

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json({ success });
}

export async function GET () {
  const { data, error } = await mailchannels.webhooks.list();

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json(data);
}

export async function DELETE () {
  const { success, error } = await mailchannels.webhooks.deleteAll();

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  return Response.json({ success });
}
