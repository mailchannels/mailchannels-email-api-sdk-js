# Sending Email

Use `mc.emails.queue()` as the default. Switch to `mc.emails.send()` only when you
specifically need immediate results for a small number of messages, or the dry-run preview.

### Quickest Send

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Hello',
  text: 'Plain text body.',
  html: '<p>HTML body.</p>'
})

if (error) throw new Error(error.message)
console.log(data.requestId)
```

Provide both `text` and `html` whenever possible — receiving clients prefer the last
matching content type and a plain-text fallback improves deliverability.

### Recipient Formats

All recipient fields (`to`, `from`, `cc`, `bcc`, `replyTo`, `envelopeFrom`) accept multiple formats
interchangeably. Note: `from`, `replyTo`, `envelopeFrom` must be single
recipient values (a string or an object) and do NOT accept array:

```ts
const r1 = 'recipient@example.net'                                          // string
const r2 = 'Jane Smith <recipient@example.net>'                             // display-name string
const r3 = { email: 'recipient@example.net', name: 'Jane Smith' }          // object
const r4 = ['a@example.net', { email: 'b@example.net', name: 'Bob' }]      // array
```

### Per-Recipient Personalization

`personalizations` is the advanced form — each entry is one fully-rendered outgoing message
with optional per-recipient overrides:

```ts
const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  subject: 'Your update',
  text: 'Hello!',
  personalizations: [
    {
      to: 'alice@example.net',
      subject: "Alice's update"  // overrides root subject
    },
    {
      to: 'bob@example.net'       // inherits root subject
    }
  ]
})
```

Per-personalization overridable fields: `to`, `cc`, `bcc`, `from`, `subject`, `replyTo`,
`envelopeFrom`, `headers`, `dkim`, `template.data`.

### Body Content Fields

At least one of `html`, `text`, or `content` is required. The shorthand fields are the
simplest form; `content` is the explicit array form for more control.

| Field | Type | When to use |
| --- | --- | --- |
| `html` | `string` | HTML body. Shorthand for a `text/html` content part. |
| `text` | `string` | Plain text body. Shorthand for a `text/plain` content part. |
| `content` | `EmailsSendContent[]` | Explicit list of `{ type, value }` parts. Required when using non-standard MIME types or when you need strict ordering. |

Mixing rules: you cannot include a `text/html` entry in `content` when `html` is also set,
and cannot include `text/plain` when `text` is also set.

```ts
// Shorthand — simplest form for most sends
const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Hello',
  text: 'Plain text fallback.',
  html: '<p>HTML body.</p>'
})

// Explicit content array — use when you need a non-standard MIME type
// or want precise control over part ordering
const { data: data1, error: err1 } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Hello',
  content: [
    { type: 'text/plain', value: 'Plain text fallback.' },
    { type: 'text/html',  value: '<p>HTML body.</p>' }
  ]
})

// Mixed — shorthand + extra content parts (no type collision)
const { data: data2, error: err2 } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Hello',
  text: 'Plain text fallback.',
  html: '<p>HTML body.</p>',
  content: [
    { type: 'text/calendar', value: iCalString }  // additional part; no text/plain or text/html here
  ]
})
```

### Dry Run (send endpoint only)

`emails.send()` supports `dryRun: true`. The API validates and renders the message without
delivering it. Useful for asserting templates render before launch:

```ts
const { data, error } = await mc.emails.send(
  {
    from: 'sender@example.com',
    to: 'recipient@example.net',
    subject: 'Preview {{name}}',
    text: 'Hello {{name}}',
    template: { type: 'mustache', data: { name: 'World' } }
  },
  true  // dryRun
)
if (error) { /* ... */ }

// data.rendered is a string[] — one rendered message per personalization
console.log(data?.rendered?.[0])
```

`emails.queue()` does **not** support dry-run.

### When To Pick Which

| Situation                                                        | Method |
|------------------------------------------------------------------| --- |
| Web request handler, background worker, high throughput          | `mc.emails.queue()` |
| Sending to many recipients in one call                           | `mc.emails.queue()` |
| Need the rendered message for inspection                         | `mc.emails.send(options, true)` |
| Need `status` results immediately for a small number of messages | `mc.emails.send()` |

### send() Response Details

```ts
const { data, error } = await mc.emails.send({ ... })
if (error) { /* ... */ }

data?.results?.forEach(r => {
  console.log(r.messageId, r.status, r.reason)
  // r.status is 'sent' or 'failed'
  // 'sent' is a temporary status; final outcome arrives via webhooks
})
```

### Common Pitfalls

- **Reserved headers**: don't set `From`, `To`, `Subject`, `Reply-To`, `Message-ID`,
  `Content-Type`, `DKIM-Signature`, etc. in `headers`. Use the payload fields instead.
  See [custom-headers](custom-headers.md).
- **Payload size limit**: 30 MB total (headers + body + attachments). The API returns
  `payload_too_large_error` with `statusCode: 413`.
- **Per-personalization limits**: up to 1000 `to` recipients per personalization, 1000
  personalizations per call, 1000 attachments per call.
- **Non-transactional sends** require exactly one recipient per personalization and DKIM
  signing. See [unsubscribe](unsubscribe.md).
- **`campaignId`**: ≤ 48 UTF-8 characters, no spaces. Validated before the request leaves
  the client.
- **Click tracking** only rewrites `<a>` tags whose URL is non-empty, starts with
  `http`/`https`, and does not have `clicktracking="off"`.
- **No idempotency keys**: retrying after a transient failure can duplicate sends. Build
  idempotency into the caller (e.g. a unique `campaignId` + recipient-set check) when
  at-most-once delivery matters.

### Tracking

```ts
const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Tracked',
  html: '<p>Hello <a href="https://example.com">click here</a></p>',
  tracking: {
    open:  { enable: true },
    click: { enable: true }
  }
})
```

Open and click tracking require a subscription that supports them.
