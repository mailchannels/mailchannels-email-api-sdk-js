# SDK Overview

The `mailchannels-sdk` npm package exports a `MailChannels` class. Instantiate it once with
your API key and use the attached module properties for every operation.

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels(process.env.MAILCHANNELS_API_KEY)
    
// Send email
const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Hello',
  text: 'Plain text body.'
})
```

### Module Inventory

| Property | What it does |
| --- | --- |
| `mc.emails` | Send (`send`) and queue (`queue`) email. |
| `mc.domains` | Check domain auth posture; manage hosted DKIM keys via `mc.domains.dkim`. |
| `mc.webhooks` | Enroll, validate, inspect batches, verify signatures. |
| `mc.subAccounts` | Manage sub-accounts (multi-tenant). |
| `mc.metrics` | Volume, engagement, performance, recipient-behaviour, sender metrics. |
| `mc.suppressions` | List, create, delete suppression entries. |

### Key Concept: Personalizations

A single `emails.send()` or `emails.queue()` call can produce **many individually messages**. 
The `personalizations` array is the advanced form: each entry is one
fully-resolved outgoing message with its own `to` / `cc` / `bcc`, per-recipient template
variables, header overrides, and so on. The top-level `from` / `subject` / `html` / `text`
act as defaults that each personalization can override.

For simple sends the shorthand fields (`to`, `cc`, `bcc`, `html`, `text`) cover most cases
without needing to write out personalizations explicitly.

### `send` vs `queue`

| Method | Server behaviour | When to use                                                                       |
| --- | --- |-----------------------------------------------------------------------------------|
| `emails.send()` | Synchronous — full per-recipient processing in the request. Returns per-personalization `results` with `messageId` and `status`. Supports `dryRun`. | When you need the rendered output back immediately for small numbers of messages. |
| `emails.queue()` | Queued — per-recipient work runs in the background. Returns `requestId` and `queuedAt` immediately. | Most production sends: web handlers, background workers, high throughput.         |

`emails.sendAsync()` is a deprecated alias for `queue()` — use `queue()` in new code.

### Response Shape

Every SDK method returns one of two shapes:

```ts
// Methods that return data:
type DataResponse<T> =
  | { data: T;    error: null }
  | { data: null; error: ErrorResponse }

// Methods that confirm an operation:
type SuccessResponse = {
  success: boolean
  error: ErrorResponse | null
}
```

Always check `error` before using `data` or `success`:

```ts
const { data, error } = await mc.emails.queue({ ... })
if (error) {
  console.error(error.message, error.type, error.statusCode)
  return
}
console.log(data.requestId)
```

### Configuration

```ts
const mc = new MailChannels('YOUR-API-KEY', {
  baseUrl: 'https://api.mailchannels.net', // rarely needed
  timeout: 120000,                          // ms, default 120s; false to disable
  retry: false,                             // ofetch retry options
  signal: controller.signal                 // AbortSignal for cancellation
})
```

Missing API key throws synchronously at construction time. All
other errors surface as `error` in the returned result object.
