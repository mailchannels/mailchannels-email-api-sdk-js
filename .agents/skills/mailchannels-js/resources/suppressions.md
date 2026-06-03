# Suppressions

A suppression list keeps known-bad or opted-out recipients out of future sends. MailChannels
suppresses by recipient + suppression type + source.

### Create Entries

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { success, error } = await mc.suppressions.create({
  entries: [
    {
      recipient: 'out@example.net',
      types: ['non-transactional'],          // optional; defaults to non-transactional
      notes: 'Imported from preference center'  // optional, max 1024 chars
    },
    {
      recipient: 'complainer@example.net',
      types: ['transactional', 'non-transactional']
    }
  ],
  addToSubAccounts: true   // parent only; copies entries to every sub-account
})
```

Constraints:

- **Atomic**: either every entry in the request is added, or none are.
- A single request can carry at most **1000** entries combined across the parent and any
  sub-accounts.
- Each `recipient` is up to 255 characters; `notes` up to 1024.
- `types` items must be `'transactional'` or `'non-transactional'`.
- If any entry already exists, the API returns `conflict_error`.

### List Entries

```ts
const { data, error } = await mc.suppressions.list({
  recipient:     'recipient@example.net',   // exact-match filter
  source:        'api',                      // see source values below
  createdAfter:  '2026-04-01',
  createdBefore: '2026-05-01T00:00:00Z',
  limit:         100,                        // 1..1000, default 1000
  offset:        0
})
```

`source` values:

- `'api'` — explicitly created via the API.
- `'unsubscribe_link'` — recipient used the hosted unsubscribe URL.
- `'list_unsubscribe'` — recipient used a one-click `List-Unsubscribe` header.
- `'hard_bounce'` — bounced as undeliverable.
- `'spam_complaint'` — recipient reported spam at their provider.

Date formats accepted: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`.

### Delete An Entry

```ts
await mc.suppressions.delete('recipient@example.net', 'api')
await mc.suppressions.delete('recipient@example.net', 'all')  // all sources
```

If `source` is omitted it defaults to `'api'`. Use `'all'` to remove every suppression for
that recipient regardless of origin.

### Patterns

- **Preference center opt-out**: write `source: 'api'`, type `'non-transactional'`, with
  `notes` pointing back to the row in your preference DB.
- **Migrating from another ESP**: bulk-create with `addToSubAccounts: true` so every tenant
  inherits the list.
- **Re-engagement campaign**: list with `source: 'hard_bounce'` and your re-engagement
  filter; only resurrect recipients you've manually verified.
