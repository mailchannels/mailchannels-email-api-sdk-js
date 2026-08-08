import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { MailChannels } from "mailchannels-sdk";

const app = new Hono();

process.loadEnvFile();

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!);

app.post("/api/send", async (c) => {
  const body = await c.req.json();

  if (!body.to || !body.subject || !body.message) {
    return c.json({
      message: "Missing required fields: 'to', 'subject', 'message'"
    }, 400);
  }

  const { data, error } = await mailchannels.emails.send({
    from: "Name <from@example.com>",
    to: body.to,
    subject: body.subject,
    html: `<p>${body.message}</p>`
  });

  if (error) {
    return c.json(error, 500);
  }

  return c.json(data);
});

app.post("/webhooks/mailchannels", async (c) => {
  const { data, error } = await mailchannels.webhooks.verify({
    payload: await c.req.text(),
    headers: c.req.header()
  });

  if (error) {
    return c.json(error, 400);
  }

  for (const webhook of data) {
    console.info(webhook.event, webhook.email, webhook.requestId);
  }

  return c.json({
    received: true,
    types: data.map(webhook => webhook.event)
  });
});

serve(app);
console.info("Listening on http://localhost:3000");
