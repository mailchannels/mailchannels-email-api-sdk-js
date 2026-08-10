# Clients and Transport

The JS SDK requires explicit client instantiation — there is no module-level singleton or
environment-variable auto-configuration. Create one `MailChannels` instance per credential
set and reuse it for the lifetime of the process.

```ts
import { MailChannels } from 'mailchannels-sdk'
import process from 'node:process'

const mc = new MailChannels(process.env.MAILCHANNELS_API_KEY)
```

A missing or empty API key throws synchronously at construction:

```ts
new MailChannels('')   // throws Error: "Missing MailChannels API key."
```

## Constructor Options

```ts
// new MailChannels(apiKey: string, options?: MailChannelsClientOptions)
```

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `https://api.mailchannels.net` | Only override if MailChannels gives you a specific alternate endpoint (sandbox, regional URL). |
| `timeout` | `number \| false` | `120000` (ms) | Pass `false` to disable the timeout entirely. |
| `retry` | `boolean \| number \| RetryOptions` | `false` | `ofetch` retry options. |
| `signal` | `AbortSignal` | `undefined` | Propagated to every fetch call made by this instance. |

## Multi-Tenant: One Client Per Credential

Never share a parent key and a sub-account key on the same instance. Create a separate
`MailChannels` for each credential:

```ts
const parent  = new MailChannels(process.env.PARENT_API_KEY)
const tenantA = new MailChannels(process.env.TENANT_A_API_KEY)
const tenantB = new MailChannels(process.env.TENANT_B_API_KEY)

const { data: accounts, error: listErr } = await parent.subAccounts.list()
if (listErr) { /*...*/ }

const { data: queueA, error: queueErrA } = await tenantA.emails.queue({ ... })
if (queueErrA) { /*...*/ }

const { data: queueB, error: queueErrB } = await tenantB.emails.queue({ ... })
if (queueErrB) { /*...*/ }
```

## Request Cancellation

Pass an `AbortSignal` to cancel in-flight requests:

```ts
const controller = new AbortController()

const mc = new MailChannels(apiKey, { signal: controller.signal })

// Later:
controller.abort()
```

## Headers Sent On Every Request

The SDK sets these on every request and they cannot be overridden via `MailChannelsClientOptions`:

- `X-API-Key: <your key>`
- `Accept: application/json`
- `Content-Type: application/json`
- `User-Agent: mailchannels-node/<version>`

## Extending The Client

The `MailChannels` class extends the public `MailChannelsClient` base. If you need to
intercept, proxy, or instrument requests you can subclass `MailChannelsClient` and override
`_fetch<T>()` (a `protected` method).

```ts
import { MailChannelsClient } from 'mailchannels-sdk'

class InstrumentedClient extends MailChannelsClient {
  protected override async _fetch<T>(path: string, options: FetchOptions<'json'>) {
    const start = performance.now()
    try {
      const result = await super._fetch<T>(path, options)
      recordLatency(path, performance.now() - start)
      return result
    }
    catch (err) {
      recordError(path)
      throw err
    }
  }
}
```
