import { json } from "@sveltejs/kit";
import { Attachment, MailChannels } from "mailchannels-sdk";
import { MAILCHANNELS_API_KEY } from "$env/static/private";
import type { RequestHandler } from "./$types";

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const payload = formData.get("payload") as string;
  const body = JSON.parse(payload);

  const fileData = await file.arrayBuffer();

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: body.to,
    subject: body.subject,
    html: `<p>${body.message}</p>`,
    text: body.message,
    attachments: [
      Attachment.fromBytes(fileData, { filename: body.filename })
    ]
  });

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    });
  }

  return json(data);
};
