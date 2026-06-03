# Testing

The SDK ships a built-in API simulator that runs a local HTTP server mimicking the real
MailChannels API. Use it for integration tests without hitting the live API.

### Starting The Simulator

Start the simulator as a background process before your test run:

```bash
npx mailchannels-sdk simulate --port 8787 --silent
```

| Flag | Env var | Default |
| --- | --- | --- |
| `-p` / `--port` | `MAILCHANNELS_SIMULATOR_PORT` | `8787` |
| `-h` / `--host` | `MAILCHANNELS_SIMULATOR_HOST` | (system default) |
| `-s` / `--silent` | — | `false` |

In CI or npm scripts, use `start-server-and-test` or `concurrently` to manage the process
alongside your test runner:

```bash
# package.json script example
"test:integration": "start-server-and-test 'npx mailchannels-sdk simulate --silent' http://localhost:8787 vitest"
```

### Example Test (Vitest / Jest)

Point the `MailChannels` client at the running simulator via `baseUrl`:

```ts
import { describe, it, expect } from 'vitest'
import { MailChannels } from 'mailchannels-sdk'

// Simulator must already be running: npx mailchannels-sdk simulate --port 8787 --silent
const mc = new MailChannels('test-key', { baseUrl: 'http://localhost:8787' })

it('queues an email', async () => {
  const { data, error } = await mc.emails.queue({
    from: 'sender@example.com',
    to: 'recipient@example.net',
    subject: 'Test',
    text: 'Hello'
  })

  expect(error).toBeNull()
  expect(data?.requestId).toBeDefined()
})
```

### Client-Side Validation Without A Simulator

The SDK validates payloads before making any HTTP call — `validation_error` results are
returned synchronously (no network required). Tests for client-side validation rules don't
need the simulator at all:

```ts
it('rejects reserved headers', async () => {
  const mc = new MailChannels('test-key', { baseUrl: 'http://localhost:9999' })

  const { error } = await mc.emails.queue({
    from: 'sender@example.com',
    to: 'recipient@example.net',
    subject: 'Test',
    text: 'Hello',
    headers: { 'From': 'evil@attacker.example' }  // reserved header
  })

  expect(error?.type).toBe('validation_error')
})
```

No network call is made because the error is caught before `_fetch` runs.

### Dry Run For Template Assertions

Use `emails.send(options, true)` (dry-run) against the real API in a staging pipeline to
assert templates render correctly before shipping:

```ts
const { data, error } = await mc.emails.send(
  {
    from: 'sender@example.com',
    to: 'preview@example.net',
    subject: 'Hi {{name}}',
    text: 'Hi {{name}}',
    template: { type: 'mustache', data: { name: 'Alice' } }
  },
  true
)

expect(error).toBeNull()
expect(data?.rendered?.[0]).toContain('Hi Alice')
```
