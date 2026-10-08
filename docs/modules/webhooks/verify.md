---
title: Verify
titleTemplate: 📢 Webhooks
---

# Verify<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/webhooks">📢 Webhooks</a></Badge></llm-exclude>

Verifies the authenticity of incoming webhook requests by validating their signatures using the provided options.

All webhooks are signed by default. There are three HTTP headers to consider during the signature verification process:

- `Content-Digest`: hash of the message body
- `Signature-Input`: describes what parts of the message are signed, along with other data about the signing method
- `Signature`: the cryptographic signature

The verifier requires the `Signature` entry matching the `Signature-Input` label
and supports the signed `"content-digest"` component. It verifies the original
signature parameters without rewriting them; altered covered components or
timestamp text are rejected even when the body digest is unchanged. Signature
verification does not replace application-level event idempotency.

## Usage

::: code-group
```ts [static.ts]
import { Webhooks } from 'mailchannels-sdk'

const { data, error } = await Webhooks.verify({
  payload: rawBody,
  headers: {
    'content-digest': req.headers['content-digest'],
    'signature': req.headers['signature'],
    'signature-input': req.headers['signature-input']
  },
  publicKey: 'MCowBQYD...'
})
```

```ts [modular.ts]
import { MailChannelsClient, Webhooks } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const webhooks = new Webhooks(mailchannels)

const { data, error } = await webhooks.verify({
  payload: rawBody,
  headers: {
    'content-digest': req.headers['content-digest'],
    'signature': req.headers['signature'],
    'signature-input': req.headers['signature-input']
  },
  publicKey: 'MCowBQYD...'
})
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.webhooks.verify({
  payload: rawBody,
  headers: {
    'content-digest': req.headers['content-digest'],
    'signature': req.headers['signature'],
    'signature-input': req.headers['signature-input']
  },
  publicKey: 'MCowBQYD...'
})
```
:::

> [!NOTE]
> The `Webhooks` class provides both a static and an instance `verify` method. The static method is useful for quickly verifying webhook requests without needing to create an instance of the `MailChannels` class using your API Key. However, you can also use the instance method if you prefer, as both will yield the same result.

## Params

- `options` `WebhooksVerifyOptions` <Badge type="danger">required</Badge>: The options for verifying the webhook.
  - `payload` `string` <Badge type="danger">required</Badge>: The raw body of the incoming webhook request as a string. This should be the exact payload received from the webhook, without any modifications or parsing, to ensure accurate signature verification.
  - `headers` `Record<string, string>` <Badge type="danger">required</Badge>: The headers of the incoming webhook request as a record of key-value pairs. These headers should include `content-digest`, `signature`, and `signature-input` required for validating the authenticity of the webhook request.
  - `publicKey` `string` <Badge type="info">optional</Badge>: The public key used to verify the webhook signature. If not provided, the SDK will attempt to retrieve the appropriate public key based on the `keyid` specified in the `signature-input` header.
    > [!NOTE]
    > The key ID included in the `signature-input` header of each incoming webhook is used to identify the key used to sign the request.
    >
    <!---->
    > [!TIP]
    > The intended pattern is to [fetch the public key](/modules/webhooks/get-signing-key) once, cache it, and then reuse it for all subsequent requests. You'd only need to call the `getSigningKey` method again if you see a key ID you haven't encountered before (e.g. if MailChannels rotate the key), which is a rare event.
    >
    > The public key can be provided in PEM format or as a raw base64 string. The SDK will handle both formats correctly.
  - `cache` `boolean` <Badge type="info">optional</Badge>: Whether to cache signing keys fetched from the API by their `keyId`. Defaults to `true`.

## Response

- `data` `WebhookEvent[] | null` <Badge type="warning">nullable</Badge>
  - `event` `WebhookEventType` <Badge>guaranteed</Badge>: The type of event that occurred.
  - `customerHandle` `string` <Badge>guaranteed</Badge>: The MailChannels account ID that generated the webhook. If the message was sent by a sub-account, this field contains the sub-account handle.
  - `timestamp` `number` <Badge>guaranteed</Badge>: The Unix timestamp (in seconds) when the event occurred; the timezone is always UTC.
  - `email` `string` <Badge type="info">optional</Badge>: The sender's email address.
  - `smtpId` `string` <Badge type="info">optional</Badge>: The Message-Id of the message that generated the event.
  - `requestId` `string` <Badge type="info">optional</Badge>: A unique identifier generated to track the original HTTP request.
  - `campaignId` `string` <Badge type="info">optional</Badge>: The campaign identifier for the message that generated the event.
  - `recipients` `string[]` <Badge type="info">optional</Badge>: The recipients of the message.
  - `userAgent` `string` <Badge type="info">optional</Badge>: The User-Agent header given when the recipient opened the message. This field is only present for `open` and `click` events.
  - `ip` `string` <Badge type="info">optional</Badge>: The IP address of the host that made the HTTP request. This field is only present for `open` and `click` events.
  - `url` `string` <Badge type="info">optional</Badge>: The URL that was clicked by the recipient. This field is only present for `click` events.
  - `status` `string` <Badge type="info">optional</Badge>: The SMTP status code that caused the bounce. This field is only present for `hard-bounced`, `soft-bounced`, and `dropped` events.
  - `reason` `string` <Badge type="info">optional</Badge>: A human-readable explanation of why the message bounced or was dropped. This field is only present for `hard-bounced`, `soft-bounced`, and `dropped` events.
<!-- @include: ../_parts/error-response.md -->

> [!TIP]
> This method returns `data` as an array of events if the webhook request is authentic and valid. If the verification fails, `data` will be `null`, indicating the signature verification failed and the request may not be from MailChannels or could have been tampered with.

## Type declarations

**Signature**

<<< @/snippets/webhooks-method-verify.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/data-response.ts

**Event type declarations**

<<< @/snippets/webhook-event-type.ts
<<< @/snippets/webhook-event-processed.ts
<<< @/snippets/webhook-event-delivered.ts
<<< @/snippets/webhook-event-open.ts
<<< @/snippets/webhook-event-click.ts
<<< @/snippets/webhook-event-hard-bounced.ts
<<< @/snippets/webhook-event-soft-bounced.ts
<<< @/snippets/webhook-event-dropped.ts
<<< @/snippets/webhook-event-complained.ts
<<< @/snippets/webhook-event-unsubscribed.ts
<<< @/snippets/webhook-event-test.ts
<<< @/snippets/webhook-event.ts

**Verify type declarations**

<<< @/snippets/webhooks-verify-options.ts
<<< @/snippets/webhooks-verify-response.ts

The verifier requires the `Signature` entry matching the `Signature-Input` label
and supports the signed `"content-digest"` component. It verifies the original
signature parameters without rewriting them; altered covered components or
timestamp text are rejected even when the body digest is unchanged. Signature
verification does not replace application-level event idempotency.
