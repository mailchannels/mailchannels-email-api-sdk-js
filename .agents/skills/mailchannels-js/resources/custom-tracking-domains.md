# Custom Tracking Domains

Register your own hostname for click tracking, open tracking, or unsubscribe
links instead of MailChannels' shared domains. Once a domain is `active`,
select it by `name` via `customDomainName` on the send payload — see
[sending.md](sending.md#custom-tracking-domains).

## Register A Domain

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { data, error } = await mc.domains.customTracking.create(
  'newsletter-clicks',     // label used at send time, ^[a-z0-9-]+$, max 64
  'click.example.com',
  'click'                 // click | open | unsubscribe
)
```

Before this can complete, `hostname` needs a CNAME record pointing to
`links.mailchannels.net`.

## DNS Verification Is A Two-Step, Non-Error Flow

`create()` and `update()` (when re-activating a disabled domain) return one
of two shapes in `data` — both are 2xx responses, not errors:

- **Registered**: `dnsSetupRequired: false` with `name`, `hostname`, `scope`,
  `status`, `createdAt` are all present..
- **Pending**: `dnsSetupRequired: true` with `token`, `txtRecordName`,
  `txtRecordValue`, `instructions` is present (a CNAME-only failure can omit the TXT
  fields; a fresh registration includes all of them).

Add the TXT record alongside the CNAME, wait for propagation, then call
`create()` again with the same `name`/`hostname`/`scope`.

If DNS still isn't in place on retry, MailChannels responds `422` instead of
`202` — that's a real error status, so the SDK returns an `error` object.
The same pending-verification body is on `error.response`:

```ts
const { data, error } = await mc.domains.customTracking.create(
  'newsletter-clicks',
  'click.example.com',
  'click'
)

if (error) {
  if (error.statusCode === 422 && error.response) {
    console.log(error.response.instructions)
  }
  return;
}
```

## List, Update, Delete

```ts
// List
const { data: listData, error: listError } = await mc.domains.customTracking.list({
  scope: 'click',       // optional filter
  status: 'active',     // optional filter: active | disabled
  limit: 100,
  offset: 0
})

// Update
const { data: updateData, error: updateError } = await mc.domains.customTracking.update(
  'click.example.com',
  'click',
  { status: 'disabled' }   // or { name: 'new-label' } to rename
)

// Delete
const { success, error: deleteError } = await mc.domains.customTracking.delete('click.example.com', 'click')
```

Deleting a domain takes effect immediately — tracking links and unsubscribe
URLs already sent using that domain stop working right away. Re-activating a
domain whose DNS verification has since lapsed goes through the same
pending-result flow as `create()`.
