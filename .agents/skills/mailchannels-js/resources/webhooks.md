# Webhooks

MailChannels posts batched delivery events to a URL you register. Events cover both
`emails.send()` and `emails.queue()` sends and use the same payload shape.

## Enroll And Manage

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { error: createError } = await mc.webhooks.create('https://example.com/mailchannels/events')
if (createError) { /*...*/ }

const { data: webhooks, error: listError } = await mc.webhooks.list() // enrolled URLs
if (listError) { /*...*/ }

const { error: deleteError } = await mc.webhooks.deleteAll() // removes ALL enrolled webhooks
if (deleteError) { /*...*/ }
```

There is no per-URL delete — `deleteAll()` removes every enrolled webhook for the account.
Enroll the replacement first if you're swapping URLs.

If the endpoint is already enrolled, `create()` returns `conflict_error`.

## Validate

`mc.webhooks.validate()` sends a synthetic test request to **every** enrolled webhook and
reports each one's response. Useful as a deploy check.

```ts
const { data, error } = await mc.webhooks.validate('deploy-smoke-test')  // requestId optional, max 28 chars
if (error) {
    console.error('Webhook validation failed:', error.message)
    return
}

if (data?.allPassed) {
  console.log('All webhooks responded with 2xx')
}
for (const entry of data?.results ?? []) {
  console.log(entry.webhook, entry.result, entry.response)
}
```

The test payload carries `event: 'test'` and a hardcoded sender of `test@mailchannels.com`.

## Inspect Batches

`mc.webhooks.batches()` returns up to 500 batch summaries with status, status code,
duration, and event count. Use it to investigate failed deliveries.

```ts
const { data, error } = await mc.webhooks.batches({
  statuses:      ['4xx', '5xx', 'no_response'],  // '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'no_response'
  createdAfter:  '2026-05-20',
  createdBefore: '2026-05-25',                   // range cannot exceed 31 days
  webhook:       'https://example.com/mailchannels/events',
  limit:         500,                             // 1..500, default 500
  offset:        0
})

// Date objects are also accepted
const { data: recent } = await mc.webhooks.batches({
  createdAfter:  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 days ago
  createdBefore: new Date()
})
```

Time formats accepted: `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM:SSZ`, or a `Date` object. If neither `createdAfter`
nor `createdBefore` is set, the default range is the last 3 days.

## Resend A Batch

```ts
const { data, error } = await mc.webhooks.resendBatch(12345)

console.log(data?.statusCode, data?.duration)
```

A successful call means the resend attempt completed — not that your webhook returned 2xx.
Check `data.statusCode` to see what your endpoint actually returned.

## Verify Incoming Webhooks (Crucial)

MailChannels signs every webhook request with an Ed25519 signature. `Webhooks.verify()`
does the full verification — content digest, freshness, and signature — in one call.
**Always verify before processing.**

```ts
import { Webhooks } from 'mailchannels-sdk'

// In your HTTP handler (example using Node.js / Express):
app.post('/mailchannels/events', express.raw({ type: '*/*' }), async (req, res) => {
  const { data, error } = await Webhooks.verify({
    payload: req.body.toString(),  // raw string body — do NOT pass the parsed JSON object
    headers: req.headers as Record<string, string>
  })

  if (error) {
    return res.status(401).send('Invalid signature')
  }

  // data is a typed array of webhook events
  for (const event of data) {
    console.log(event.event, event.email, event.requestId)
  }

  res.sendStatus(200)
})
```

`Webhooks.verify()` is a **static method** — you can call it without a `MailChannels`
instance (no API key needed). It is also available as an instance method on
`mc.webhooks.verify()`.

`verify()` checks all three things in one call:

1. **Content-Digest** — SHA-256 of the raw body matches the header.
2. **Freshness** — `created` timestamp is within the default replay window (less than 300 s old)
3. **Signature** — Ed25519 verifies against the public key for the given `keyId`.

**`payload` must be the raw request body string.** Do not pass the parsed JSON object or
the signature will never match. Use `req.body.toString()` (Express with raw middleware),
`await request.text()` (Fetch API / Hono / Cloudflare Workers), or the framework equivalent.

### Supplying The Public Key Manually

By default `verify()` fetches and caches the public key automatically from MailChannels.
You can supply it yourself to avoid the outbound call:

```ts
const { data: keyData, error: getKeyErr } = await mc.webhooks.getSigningKey(keyId)
if (getKeyErr) { /*...*/ }

const { data, error } = await Webhooks.verify({
  payload: rawBody,
  headers,
  publicKey: keyData?.key,
  cache: false   // disable built-in caching when you manage the key yourself
})
if (error) { /*...*/ }
```

Cache the key — it only changes on rotation, and MailChannels may publish multiple active
keys at once during a rollover. Always fetch by the `keyId` from the incoming request
rather than holding a single "current" key.

## Event Payload Shape

After successful verification `data` is typed as an array of webhook events. Common shared
fields:

| Field | Type | Notes                                                                                                                                                   |
| --- | --- |---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `event` | `string` | `'processed'` / `'delivered'` / `'open'` / `'click'` / `'hard-bounced'` / `'soft-bounced'` / `'dropped'` / `'complained'` / `'unsubscribed'` / `'test'` |
| `email` | `string` | Sender email address.                                                                                                                                   |
| `customerHandle` | `string` | Your MailChannels account (or sub-account) handle.                                                                                                      |
| `timestamp` | `number` | Unix timestamp.                                                                                                                                         |
| `requestId` | `string` | Correlates to the `requestId` from `queue()` / `send()`.                                                                                                |
| `smtpId` | `string` | SMTP message ID.                                                                                                                                        |
| `campaignId` | `string?` | Present when `campaignId` was set on the send.                                                                                                          |
| `recipients` | `string[]?` | All recipients in the personalization.                                                                                                                  |
| `status` | `string?` | The SMTP status code received for the message. Use for system logic. Present on `hard-bounced`, `soft-bounced` events.                                  |
| `reason` | `string?` | A human readable explanation of the status code. Do not use for system logic. Present on `hard-bounced`, `soft-bounced` events.                         |
| `url` / `userAgent` / `ip` | `string?` | Present on `click` / `open` events.                                                                                                                     |

## Responding

Return any 2xx status code quickly. MailChannels treats anything else as a failure and may
retry. Keep your handler thin: enqueue the event and return, then do the actual processing
on a worker.
