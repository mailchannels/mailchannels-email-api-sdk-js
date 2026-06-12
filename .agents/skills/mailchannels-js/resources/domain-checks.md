# Domain Checks

Use `mc.domains.check()` to confirm a sender domain is properly authenticated before
sending from it. The check covers four things:

- **DKIM** — does the domain publish a DKIM public key matching the selectors MailChannels
  signs with?
- **SPF** — is MailChannels in the domain's SPF record?
- **Sender-domain DNS** — does the domain have at least one `A` or `MX` record? Receivers
  reject mail without either as **SDNF** ("Sender Domain Not Found").
- **Domain Lockdown** — a MailChannels feature that ties a sending domain to your account
  so other MailChannels customers cannot spoof it.

### Basic Check

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { data, error } = await mc.domains.check('example.com')

if (error) throw new Error(error.message)

console.log(data?.spf?.verdict)            // 'passed' | 'failed' | …
console.log(data?.domainLockdown?.verdict) // 'passed' | 'failed'
console.log(data?.senderDomain?.verdict)   // 'passed' | 'failed'
console.log(data?.dkim)                    // array of per-selector results
console.log(data?.references)             // support links if anything failed
```

### With Specific DKIM Settings

If you don't pass `dkim`, MailChannels uses all stored keys for the domain. To target
specific selectors:

```ts
const { data, error } = await mc.domains.check('example.com', {
  dkim: [
    {
      domain: 'example.com',
      selector: 'mcdkim-2025'
    },
    {
      domain: 'example.com',
      selector: 'mcdkim-2026'
    }
  ]
})
```

You can pass up to **10** DKIM settings per call.

If you only need to provide a single DKIM setting, you may pass it as an object instead
of an array:

```ts
const { data, error } = await mc.domains.check('example.com', {
  dkim: {
    domain: 'example.com',
    selector: 'mcdkim'
  }
})
```

#### DKIM Settings Resolution Rules

| Provided fields | Behavior |
| --- | --- |
| `domain`, `selector`, `privateKey` all present | Verify with the provided key. |
| `domain`, `selector` | Use the stored private key for that domain + selector. |
| `domain` only | Use **all** stored keys for that domain. |
| `selector` only | Use the `domain` from the request body. |
| `privateKey` set | `selector` is required too. |
| `dkim` empty / absent | Use all stored keys for the request domain. |

### With A Sender ID (Domain Lockdown)

If your lockdown record uses `senderid=` or `sidw=` fields, pass the sender identity:

```ts
const { data, error } = await mc.domains.check('example.com', {
  senderId: 'example|domain|example.com'
})
```

If your lockdown record uses `auth=` (account-wide authorization), omit `senderId`.

### Verdicts Reference

- DKIM, Domain Lockdown, A, and MX verdicts: `'passed'` or `'failed'`.
- SPF has a richer set: `'passed'`, `'failed'`, `'soft failed'`, `'temporary error'`,
  `'permanent error'`, `'neutral'`, `'none'`, `'unknown'`.
- `senderDomain` passes if **either** the A or MX check passes.

### When To Use

- During onboarding for every new sending domain.
- In CI after rotating DKIM keys, to verify the new DNS record propagated.
- In a periodic monitoring job (verdicts can drift if DNS changes).
