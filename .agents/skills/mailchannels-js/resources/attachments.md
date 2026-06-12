# Attachments

MailChannels expects every attachment to be Base64-encoded with a `filename` and ideally a
MIME `type`. Use the `Attachment` static helpers — they encode for you and infer the MIME
type from the filename.

### From In-Memory Bytes

`fromBytes` is synchronous and accepts any `ArrayBuffer` or `Uint8Array`:

```ts
import { MailChannels, Attachment } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const report = Attachment.fromBytes(
  new Uint8Array([...csvBytes]),
  {
    filename: 'report.csv',
    type: 'text/csv'           // optional; inferred from filename when omitted
  }
)

// Also accepts ArrayBuffer:
const pdf = Attachment.fromBytes(arrayBuffer, { filename: 'doc.pdf' })

const { data, error } = await mc.emails.queue({
  from: 'billing@example.com',
  to: 'recipient@example.net',
  subject: 'Your invoice',
  text: 'See attached.',
  attachments: [report, pdf]
})
```

### From A Blob

`fromBlob` is async and accepts any Web API `Blob`. The Blob's own `type` property is used
as the MIME type unless you override it in options:

```ts
const blob = new Blob(['Hello world'], { type: 'text/plain' })
const attachment = await Attachment.fromBlob(blob, { filename: 'hello.txt' })
```

### Inline Images (CID References)

Pass `disposition: 'inline'` and a `contentId` to embed an image inside the HTML body:

```ts
const logo = Attachment.fromBytes(bytes, {
  filename: 'logo.png',
  disposition: 'inline',
  contentId: 'company-logo'
})

const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Inline image',
  html: "<img src='cid:company-logo' alt='Company logo'>",
  attachments: [logo]
})
```

### Attachment Options

Both `fromBytes` and `fromBlob` accept an `AttachmentOptions` object:

| Field | Type | Notes |
| --- | --- | --- |
| `filename` | `string` | Required. MIME type is inferred from it when `type` is omitted. |
| `type` | `string` | MIME type. Inferred from `filename` if omitted. For `fromBlob`, defaults to the Blob's own `type`. |
| `contentId` | `string` | For `cid:` inline image references. |
| `disposition` | `'attachment' \| 'inline'` | Defaults to `'attachment'`. |

### Awaiting Attachments Lazily

The `attachments` field accepts `(EmailsSendAttachment | Promise<EmailsSendAttachment>)[]`,
so you can pass unresolved promises and the SDK will await them before sending:

```ts
const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Reports',
  text: 'Reports attached.',
  attachments: [
    Attachment.fromBlob(blob1, { filename: 'q1.pdf' }),   // Promise<...>
    Attachment.fromBlob(blob2, { filename: 'q2.pdf' })    // Promise<...>
  ]
})
```

### Limits

- Up to **1000 attachments** per send.
- Combined message + headers + attachments must stay under **30 MB**. Exceeding this
  returns `payload_too_large_error` (HTTP 413) in the `error` field.

### Raw Attachment Shape

If you need to construct one by hand:

```ts
const attachment: EmailsSendAttachment = {
  content: Buffer.from(new Uint8Array(bytes)).toString("base64"),
  filename: 'report.pdf',
  type: 'application/pdf'        // recommended but optional
}
```

`content` and `filename` are required. `type` is recommended.
