# Sub-Accounts

Sub-accounts are first-class on MailChannels. Use them for tenants, customers, or isolated
senders so that one customer's reputation, limits, and bad traffic don't contaminate the
parent account or other tenants.

> Sub-accounts are only available on parent accounts on the 100K and higher plans.

### Handles

A handle uniquely identifies a sub-account. Rules:

- 3–128 characters.
- **Lowercase alphanumeric only.** No hyphens, underscores, or uppercase.
- Unique per parent account.
- If omitted on create, a random handle is generated.

### Lifecycle

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('PARENT-ACCOUNT-API-KEY')

// Create
const { data: sub } = await mc.subAccounts.create('Client A', 'clienta')

// List (paginated; default limit 1000)
const { data: page } = await mc.subAccounts.list({ limit: 100, offset: 0 })

// Suspend / activate
await mc.subAccounts.suspend('clienta')
await mc.subAccounts.activate('clienta')

// Delete
await mc.subAccounts.delete('clienta')
```

### Credentials

Each sub-account has its own API keys and SMTP passwords.

```ts
// API keys
const { data: createdKey } = await mc.subAccounts.createApiKey('clienta')
// Store createdKey.key immediately — only returned once

const { data: keys } = await mc.subAccounts.listApiKeys('clienta')
await mc.subAccounts.deleteApiKey('clienta', storedKeyId)

// SMTP passwords
const { data: createdPwd } = await mc.subAccounts.createSmtpPassword('clienta')
// Store createdPwd.password immediately — only returned once

const { data: passwords } = await mc.subAccounts.listSmtpPasswords('clienta')
await mc.subAccounts.deleteSmtpPassword('clienta', storedPasswordId)
```

**Listed keys and passwords are redacted.** The full secret is only returned once, at
create time. Store it immediately or rotate. Each sub-account has server-side caps on how
many API keys and SMTP passwords it can hold — once at the cap, create returns
`invalid_request_error`; delete an unused credential first.

### Limits

Per-sub-account monthly send caps. A sub-account without a limit inherits the parent's
capacity.

```ts
await mc.subAccounts.setLimit('clienta', { sends: 100_000 })
const { data: limit } = await mc.subAccounts.getLimit('clienta')
await mc.subAccounts.deleteLimit('clienta')   // back to inheriting parent
```

### Usage

```ts
const { data: parentUsage } = await mc.metrics.usage()
const { data: subUsage }    = await mc.subAccounts.getUsage('clienta')

console.log(parentUsage?.total, parentUsage?.startDate, parentUsage?.endDate)
```

`mc.metrics.usage()` is for the parent account. Use `mc.subAccounts.getUsage(handle)` for
one specific sub-account.

### Sending As A Sub-Account

Create a separate `MailChannels` instance with the sub-account's API key:

```ts
const subClient = new MailChannels('SUB-ACCOUNT-API-KEY')

await subClient.emails.queue({
  from: 'sender@client.example',
  to: 'recipient@example.net',
  subject: 'From a tenant',
  text: 'Hello'
})
```

This keeps the account boundary explicit in code and avoids hard-to-debug issues where the
wrong key is used at the wrong call site.

### Suppressions And Sub-Accounts

When creating suppressions on the parent, set `addToSubAccounts: true` to also copy entries
into every sub-account. See [suppressions](suppressions.md).
