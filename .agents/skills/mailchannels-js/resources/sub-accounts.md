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
const { data: sub, error: createError } = await mc.subAccounts.create('Client A', 'clienta')
if (createError) { /*...*/ }

// List (paginated; default limit 1000)
const { data: page, error: listErr } = await mc.subAccounts.list({ limit: 100, offset: 0 })
if (listErr) { /*...*/ }


// Suspend / activate
const { error: suspendErr } = await mc.subAccounts.suspend('clienta')
if (suspendErr) { /*...*/ }

const { error: activateErr } = await mc.subAccounts.activate('clienta')
if (activateErr) { /*...*/ }

// Delete
const { error: deleteError } = await mc.subAccounts.delete('clienta')
if (deleteError) { /*...*/ }
```

### Credentials

Each sub-account has its own API keys and SMTP passwords.

```ts
// API keys
const { data: createdKey, error: createErr } = await mc.subAccounts.apiKeys.create('clienta')
if (createErr) { /*...*/ }
// Store createdKey.key immediately — only returned once

const { data: keys, error: listErr } = await mc.subAccounts.apiKeys.list('clienta')
if (listErr) { /*...*/ }

const { error: deleteErr } = await mc.subAccounts.apiKeys.delete('clienta', storedKeyId)
if (deleteErr) { /*...*/ }

// SMTP passwords
const { data: createdPwd, error: createPwdErr } = await mc.subAccounts.smtpPasswords.create('clienta')
if  (createPwdErr) { /*...*/ }
// Store createdPwd.smtpPassword immediately — only returned once

const { data: passwords, error: listPwdErr } = await mc.subAccounts.smtpPasswords.list('clienta')
if (listPwdErr) { /*...*/ }

const { error: deletePwdErr } = await mc.subAccounts.smtpPasswordss.delete('clienta', storedPasswordId)
if (deletePwdErr) { /*...*/ }
```

**Listed keys and passwords are redacted.** The full secret is only returned once, at
create time. Store it immediately or rotate. Each sub-account has server-side caps on how
many API keys and SMTP passwords it can hold — once at the cap, create returns
`unprocessable_entity_error`; delete an unused credential first.

### Limits

Per-sub-account monthly send caps. A sub-account without a limit inherits the parent's
capacity.

```ts
const { error: setLimitErr } = await mc.subAccounts.limits.set('clienta', { sends: 100_000 })
if (setLimitErr) { /*...*/ }

const { data: limit, error: getLimitErr } = await mc.subAccounts.limits.get('clienta')
if (getLimitErr) { /*...*/ }

const { error: deleteLimitErr } = await mc.subAccounts.limits.delete('clienta')   // back to inheriting parent
if (deleteLimitErr) { /*...*/ }
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

const { error } = await subClient.emails.queue({
  from: 'sender@client.example',
  to: 'recipient@example.net',
  subject: 'From a tenant',
  text: 'Hello'
})
if (error) { /*...*/ }
```

This keeps the account boundary explicit in code and avoids hard-to-debug issues where the
wrong key is used at the wrong call site.

### Suppressions And Sub-Accounts

When creating suppressions on the parent, set `addToSubAccounts: true` to also copy entries
into every sub-account. See [suppressions](suppressions.md).
