import { Webhooks } from "mailchannels-sdk";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const contentDigest = request.headers.get("content-digest");
  const signature = request.headers.get("signature");
  const signatureInput = request.headers.get("signature-input");

  if (!contentDigest || !signature || !signatureInput) {
    return Response.json({ message: "Missing webhook headers" }, {
      status: 400
    });
  }

  const { data, error } = await Webhooks.verify({
    payload: await request.text(),
    headers: {
      "content-digest": contentDigest,
      "signature": signature,
      "signature-input": signatureInput
    }
  });

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    });
  }

  for (const event of data) {
    switch (event.event) {
      case "processed":
        console.info("Email processed:", event.email);
        break;
      case "delivered":
        console.info("Email delivered:", event.smtpId);
        break;
      case "dropped":
        console.info("Email dropped:", event.smtpId);
        break;
      case "unsubscribed":
        console.info("Email unsubscribed:", event.email);
        break;
      case "hard-bounced":
        console.info("Email hard bounced:", event.smtpId);
        break;
      case "soft-bounced":
        console.info("Email soft bounced:", event.smtpId);
        break;
      case "open":
        console.info("Email opened:", event.smtpId);
        break;
      case "click":
        console.info("Email clicked:", event.smtpId);
        break;
      case "complained":
        console.info("Email complained:", event.smtpId);
        break;
      case "test":
        console.info("Test webhook received");
        break;
    }
  }

  return Response.json({
    received: true,
    types: data.map(event => event.event)
  });
};
