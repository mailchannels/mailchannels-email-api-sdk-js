import { MailChannels } from "mailchannels-sdk";

const mailchannels = new MailChannels("your-api-key");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/send" && req.method === "POST") {
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
  }

  return new Response("Not Found", { status: 404 });
});
