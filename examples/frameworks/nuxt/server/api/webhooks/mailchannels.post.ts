import { Webhooks } from "mailchannels-sdk";

export default defineEventHandler(async (event) => {
  const headers = getHeaders(event);
  const rawBody = await readRawBody(event);

  const contentDigest = headers["content-digest"];
  const signature = headers["signature"];
  const signatureInput = headers["signature-input"];

  if (!contentDigest || !signature || !signatureInput) {
    throw createError({
      status: 400,
      message: "Missing webhook headers"
    });
  }

  const { data, error } = await Webhooks.verify({
    payload: rawBody || "",
    headers: {
      "content-digest": contentDigest,
      "signature": signature,
      "signature-input": signatureInput
    }
  });

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    });
  }

  for (const webhook of data) {
    switch (webhook.event) {
      case "processed":
        console.info("Email processed:", webhook.email);
        break;
      case "delivered":
        console.info("Email delivered:", webhook.smtpId);
        break;
      case "dropped":
        console.info("Email dropped:", webhook.smtpId);
        break;
      case "unsubscribed":
        console.info("Email unsubscribed:", webhook.email);
        break;
      case "hard-bounced":
        console.info("Email hard bounced:", webhook.smtpId);
        break;
      case "soft-bounced":
        console.info("Email soft bounced:", webhook.smtpId);
        break;
      case "open":
        console.info("Email opened:", webhook.smtpId);
        break;
      case "click":
        console.info("Email clicked:", webhook.smtpId);
        break;
      case "complained":
        console.info("Email complained:", webhook.smtpId);
        break;
      case "test":
        console.info("Test webhook received");
        break;
    }
  }

  return {
    received: true,
    types: data.map(webhook => webhook.event)
  };
});
