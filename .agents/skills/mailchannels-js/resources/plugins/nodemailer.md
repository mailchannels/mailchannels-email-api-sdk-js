# Nodemailer Integration

The SDK ships a transport for Nodemailer so existing code that uses Nodemailer can be
easily adapted to send via MailChannels Email API. The transport method
`mailchannelsTransport` can be imported from `mailchannels-sdk/nodemailer`. This
integration is optional — it requires the `nodemailer` package which the SDK does not
include as a dependency.

## Sending

```ts
import nodemailer from 'nodemailer'
import { mailchannelsTransport } from 'mailchannels-sdk/nodemailer'

const transport = nodemailer.createTransport(
  mailchannelsTransport({
    apiKey: 'YOUR-API-KEY',
    sendMode: 'async', // 'async' or 'sync'. Default is 'async'
    // SDK client options: `baseUrl`, `timeout`, `signal`, `retry`
  })
)

transport.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from Nodemailer',
  html: '<p>Hello World</p>',
  mailchannels: {
    // SDK send options: `campaignId`, `tracking`, `transactional`, `unsubscribe`
  }
}, (error, info) => {
  if (error) {
    console.error('Error sending email:', error)
    return;
  }
  console.log('Sent message info:', info)
})
```

## Transport Options

The transport accepts `apiKey` and `sendMode` options, as well as any SDK client
options (`baseUrl`, `timeout`, `signal`, `retry`).

Refer to the [clients-and-transport](../clients-and-transport.md) documentation for
details and full explanations of each client option.

## Field Mapping

The transport converts Nodemailer `Mail.Options` in the `sendMail`
call into the SDK's `EmailsSendOptions`. The HTTP request itself is
entirely delegated to the SDK `MailChannelsClient`.

| `Mail.Options` | `EmailsSendOptions` |
| --- | --- |
| `from` | `from` |
| `to`, `cc`, `bcc` | `to`, `cc`, `bcc` (parsed into SDK `EmailsSendRecipient` objects or strings) |
| `replyTo` | `replyTo` (if array, only the first address is used) |
| `subject` | `subject` |
| `text` | `text` |
| `html` | `html` |
| `headers` | `headers` (converted to a `Record<string,string>`) |
| `attachments` | `attachments` (only inline buffers/strings supported — `path`/`href` are not supported) |
| `icalEvent` | added as an attachment |
| `dkim` | `dkim` (see DKIM notes below) |
| `mailchannels` (augmented field on the send options) | merged into the SDK send params |

### MailChannels-specific Options

The SDK augments Nodemailer's `Mail.Options` type with a `mailchannels` property,
allowing MailChannels-specific send options to be passed directly through the
`sendMail` options object.

Supported options: `campaignId`, `tracking`, `transactional`, `unsubscribe`

Refer back to the original SKILL.md for links to full explanations of each field.

### DKIM

- Multiple DKIM signatures with the Nodemailer's `dkim.keys` field are not
  supported; specify a single DKIM signature with `dkim.domainName`,
  `dkim.keySelector`, and `dkim.privateKey`.
- When providing `dkim.privateKey` as a `{ key, passphrase }` object the
  transport attempts to convert it into a PEM via Node's `createPrivateKey`.
  Only RSA private keys are supported when using the `key+passphrase` object form.

## Errors and Result Structure

The transport follows the Nodemailer `Transport` contract. The callback is
called with an `error` object (if any; including SDK errors) and an `info` object
with the following structure:

```ts
interface MailChannelsTransportInfo<T extends MailChannelsTransportSendMode> {
  messageId: string | null; // null for async sends
  accepted: string[]; // empty array for async sends
  rejected: string[]; // empty array for async sends
  envelope: MimeNode.Envelope; // `to` includes all recipients (to, cc, bcc)
  response: (T extends "sync" ? EmailsSendResponse : EmailsQueueResponse) | null; // SDK response
}
```

## Limitations

- Only a single `replyTo` address is supported.
- Multiple DKIM signatures are not supported.
- Attachment `path`, `href`, and other URL-based attachment sources are not supported;
  attachments should be provided as buffers or strings.
- For async sends (`sendMode: 'async'`) the transport returns a `messageId` of `null`
  and empty `accepted` / `rejected` arrays — this is an API limitation for queued sends.
- MailChannels-specific options must be passed using the `mailchannels` augmentation on
  the `sendMail` options object.
