# Nodemailer

Switch an existing [Nodemailer](https://nodemailer.com/) app from SMTP to the MailChannels Email API
by changing only the transport. Your `sendMail` calls stay the same.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add `@mailchannels/sdk` next to `nodemailer`. The SDK does not install Nodemailer for you.

::: code-group
```sh [npm]
npm i @mailchannels/sdk nodemailer
```

```sh [yarn]
yarn add @mailchannels/sdk nodemailer
```

```sh [pnpm]
pnpm add @mailchannels/sdk nodemailer
```
:::

## 2. Replace the SMTP transport

Before, sending through SMTP:

```ts
import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  host: 'smtp.mailchannels.net',
  port: 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
})
```

After, sending through the Email API:

```ts
import nodemailer from 'nodemailer'
import { mailchannelsTransport } from '@mailchannels/sdk/nodemailer'

const transport = nodemailer.createTransport(
  mailchannelsTransport({
    apiKey: process.env.MAILCHANNELS_API_KEY!,
    sendMode: 'sync' // 'async' (default) queues the message; 'sync' waits for the delivery result
  })
)
```

## 3. Send as before

```ts
const info = await transport.sendMail({
  from: '"Acme" <noreply@example.com>',
  to: 'Jane <jane@example.com>, john@example.com',
  cc: 'team@example.com',
  bcc: 'audit@example.com',
  replyTo: 'support@example.com',
  subject: 'Your invoice',
  text: 'Your invoice is attached.',
  html: '<p>Your invoice is attached.</p>',
  headers: { 'X-Invoice-Id': 'INV-1001' },
  attachments: [
    { filename: 'invoice.pdf', path: './invoice.pdf' },
    { filename: 'notes.txt', content: Buffer.from('Thanks!') }
  ],
  mailchannels: {
    // Optional Email API options: `campaignId`, `tracking`, `transactional`, `unsubscribe`
  }
})

console.log(info.messageId, info.accepted, info.response)
```

Attachments given as a `Buffer`, a string, a stream or a file `path` are read by Nodemailer and sent
base64-encoded.

`info` contains:

| Field                   | Value                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `messageId`             | The Email API message ID (`sync` mode), or `null` for queued (`async`) sends               |
| `accepted` / `rejected` | All envelope recipients, according to the delivery status (`sync` mode); empty for `async` |
| `envelope`              | The Nodemailer envelope; `to` includes to, cc and bcc recipients                           |
| `response`              | The SDK response, including the API `requestId`                                            |

## Handling errors

When the API rejects a message, `sendMail` rejects with a `MailChannelsTransportError`. Like SMTP
transport errors, it carries `responseCode`:

```ts
import { MailChannelsTransportError } from '@mailchannels/sdk/nodemailer'

try {
  await transport.sendMail(message)
} catch (error) {
  if (error instanceof MailChannelsTransportError) {
    console.error(error.responseCode, error.code, error.message) // e.g. 400 invalid_request_error "Bad request. ..."
  }
  throw error
}
```

| Property       | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| `message`      | The API error message                                                            |
| `statusCode`   | The HTTP status from the API, or `null` if no response was received              |
| `responseCode` | The HTTP status, as on Nodemailer SMTP errors; unset if no response was received |
| `code`         | The SDK error type, e.g. `invalid_request_error` or `authentication_error`       |
| `response`     | The API response body as JSON text, if any                                       |
| `apiResponse`  | The parsed API response body, or `null`                                          |

## Limitations

- Only a single `replyTo` address is used.
- Only one DKIM signature, with an RSA key, is supported.
- MailChannels-specific options go in the `mailchannels` field of the `sendMail` options.
