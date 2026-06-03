# DKIM

MailChannels can host the **private** DKIM key for you. You publish the **public** key in
the domain's DNS as a TXT record. The public DNS record is **not** hosted by MailChannels —
you must publish it yourself in whatever DNS provider holds the zone.

### Create A Hosted Key

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { data, error } = await mc.domains.dkim.create('example.com', {
  selector: 'mcdkim',
  algorithm: 'rsa',    // only 'rsa' is currently supported
  length: 2048         // 1024 or 2048; default 2048; multiples of 1024
})

if (error) throw new Error(error.message)

for (const record of data?.dnsRecords ?? []) {
  console.log(record.name, record.type, record.value)
  // e.g. mcdkim._domainkey.example.com  TXT  "v=DKIM1; k=rsa; p=MIIBIj..."
}
```

The returned `data.dnsRecords` contains TXT records you must publish in DNS.

### List, Filter, And Include DNS Records

```ts
const { data, error } = await mc.domains.dkim.list('example.com', {
  selector: 'mcdkim',          // optional; returns at most one
  status: 'active',            // 'active' | 'retired' | 'revoked' | 'rotated'
  includeDnsRecord: true,      // include suggested DNS record per key
  limit: 10,
  offset: 0
})
```

### Key Lifecycle

| Status | Meaning |
| --- | --- |
| `active` | Currently used for signing. |
| `rotated` | Being rotated out. Still valid for signing for a 3-day grace period; auto-changes to `retired` 2 weeks after rotation. |
| `retired` | No longer in use. |
| `revoked` | Marked compromised. Stop using immediately. |

#### Update status directly

```ts
const { success, error } = await mc.domains.dkim.updateStatus('example.com', {
  selector: 'mcdkim',
  status: 'revoked'      // 'revoked' | 'retired' | 'rotated'
})
```

Only `active` keys can move to `rotated`. Only `revoked`, `retired`, and `rotated` are
valid update targets.

#### Rotate (recommended for routine rollover)

```ts
const { data, error } = await mc.domains.dkim.rotate('example.com', 'mcdkim', {
  newKey: { selector: 'mcdkim2' }
})

// data.new     is the new key info; data.rotated is the old one.
// data.rotated.gracePeriodExpiresAt says when signing with it stops.
```

Rotation:

1. Marks the existing key `rotated` (still valid for **3 days** — cut-off in
   `gracePeriodExpiresAt`).
2. Creates a new active key with the new selector, reusing the same algorithm and key
   length.
3. The rotated key is auto-retired **2 weeks** after rotation.

**Publish the new DNS record before `gracePeriodExpiresAt`** or emails signed with the new
key will fail DKIM at receiving providers.

### Sending With A Hosted Key

```ts
await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Signed',
  text: 'Signed by hosted DKIM.',
  dkim: {
    domain: 'example.com',
    selector: 'mcdkim'
  }
})
```

If `dkim.selector` is set without `dkim.domain`, MailChannels takes the domain from the
`from` address.

### Sending With A Customer-Managed Key

If you keep the private key yourself, pass it Base64-encoded (PEM headers are stripped
automatically):

```ts
await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Signed',
  text: 'Signed by my own DKIM key.',
  dkim: {
    domain: 'example.com',
    selector: 'mcdkim',
    privateKey: '<base64-encoded-or-PEM-private-key>'
  }
})
```

`dkim` can also be set per-personalization to override the root value.

### DNS Publication

MailChannels does not host the public DKIM DNS record — you do. The SDK returns the exact
record to publish in `data.dnsRecords`:

| Field | Value |
| --- | --- |
| `name` | DNS host. Always `{selector}._domainkey.{domain}`. |
| `type` | Always `TXT`. |
| `value` | Public key material. **Publish verbatim** — do not re-wrap, strip quotes, or split lines. |

#### Required Steps

1. **Create** with `mc.domains.dkim.create(domain, { selector })`. Capture `dnsRecords`.
2. **Resolve the DNS zone** in your provider's API.
3. **Create or update** the TXT record at `record.name` with `record.value`. Use a short
   TTL (300 s) so future rotations propagate quickly.
4. **Wait for propagation**, then verify with `mc.domains.check(domain, { dkim: [{ selector }] })`.
   The `dkim[].verdict` must be `'passed'` before sending real traffic.
5. **For rotations**, leave the old TXT record in place until `gracePeriodExpiresAt`.

### Selector Format

- 1–63 characters.
- Lowercase letters, numbers, and `-` work everywhere. Avoid `_` in the selector itself.
