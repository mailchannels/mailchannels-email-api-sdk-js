# DKIM

MailChannels can host the **private** DKIM key for you. You publish the **public** key in the
domain's DNS as a TXT record. The public DNS record is **not** hosted by MailChannels — you
must publish it yourself in whatever DNS provider holds the zone.

All commands here live under `mailchannels dkim`. To verify what receivers will see, use
`dkim check-domain` — see [domain-checks](domain-checks.md).

## Create A Hosted Key

```sh
mailchannels dkim create \
  --domain "example.com" \
  --selector "mcdkim"
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--domain <domain>` | Domain for the key pair. | Yes | |
| `--selector <selector>` | Selector for the key pair. | Yes | |
| `--algorithm <algorithm>` | Key algorithm. Only `rsa` is supported. | No | `rsa` |
| `--length <bits>` | RSA key length: `1024`, `2048`, `3072`, or `4096`. | No | `2048` |

The output shows the key details followed by a `DNS Records` section — the TXT record you must
publish:

```text
[MailChannels-CLI] [DKIM] DKIM key created successfully:
  …
[MailChannels-CLI] [DKIM] DNS Records:
── [0] ─────────────────────────────────────────────────────────
  Name   'mcdkim._domainkey.example.com'
  Type   'TXT'
  Value  'v=DKIM1; k=rsa; p=MIIBIj…'
────────────────────────────────────────────────────────────────
```

The single quotes around values are the CLI's display formatting, **not part of the value**.
Publish the text between them verbatim.

Creating a key for a domain and selector that already exist fails with
`Key pair already created for domain, and selector.` Choose a different selector, or rotate the
existing key.

### Selector Format

- 1–63 characters.
- Lowercase letters, numbers, and `-` work everywhere. Avoid `_` in the selector itself.

## List Keys

```sh
mailchannels dkim list \
  --domain "example.com" \
  --status active \
  --include-dns-record \
  --limit 10 \
  --offset 0
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--domain <domain>` | Domain to search. | Yes | |
| `--selector <selector>` | Filter by selector; returns at most one key. | No | |
| `--status <status>` | Filter by status: `active`, `retired`, `revoked`, or `rotated`. | No | |
| `--include-dns-record` | Include the suggested DNS TXT record for each key. | No | `false` |
| `--limit <number>`, `-l` | Maximum keys to return (1–100). | No | `10` |
| `--offset <number>`, `-o` | Number of keys to skip. | No | `0` |

With no matches the CLI prints `[DKIM] No DKIM keys found.` and exits `0`.

## Key Lifecycle

| Status | Meaning |
| --- | --- |
| `active` | Currently used for signing. |
| `rotated` | Being rotated out. Still valid for signing for a 3-day grace period; becomes `retired` 2 weeks after rotation. |
| `retired` | No longer in use. |
| `revoked` | Marked compromised. Stop using immediately. |

### Update Status Directly

```sh
mailchannels dkim update-status \
  --domain "example.com" \
  --selector "mcdkim" \
  --status revoked
```

| Flag | Description | Required |
| --- | --- | --- |
| `--domain <domain>` | Domain associated with the key. | Yes |
| `--selector <selector>` | Selector of the key to update. | Yes |
| `--status <status>` | New status: `retired`, `revoked`, or `rotated`. | Yes |

Only `active` keys can move to `rotated`. Marking a key `revoked` or `retired` takes it out of
use — confirm with the user first.

### Rotate (Recommended For Routine Rollover)

```sh
mailchannels dkim rotate \
  --domain "example.com" \
  --selector "mcdkim" \
  --new-selector "mcdkim2"
```

| Flag | Description | Required |
| --- | --- | --- |
| `--domain <domain>` | Domain associated with the key. | Yes |
| `--selector <selector>` | Selector of the active key. | Yes |
| `--new-selector <selector>` | Selector for the new key pair. | Yes |

Rotation:

1. Marks the existing key `rotated` (still valid for **3 days**).
2. Creates a new active key with the new selector, reusing the same algorithm and key length.
3. Auto-retires the rotated key **2 weeks** after rotation.

Before the old key's **3-day signing grace period** ends, publish the new key's DNS TXT record
using the `Name` and `Value` printed by `rotate`, wait for DNS propagation, then verify it with
`mailchannels dkim check-domain --domain "example.com" --dkim-selector "mcdkim2"`. Then update
every sending command or configuration that explicitly selects the old key to use
`--dkim-selector "mcdkim2"`; for example, change the selector in the sending command below.
Otherwise, those callers keep selecting the old key and mail may fail DKIM after the grace period.

The command prints only the **new** key's details and its DNS record. To read the old key's
`Grace Period Expires At`, list it afterwards:

```sh
mailchannels dkim list --domain "example.com" --selector "mcdkim"
```

## Sending With A Hosted Key

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Signed" \
  --text "Signed by hosted DKIM." \
  --dkim-domain "example.com" \
  --dkim-selector "mcdkim"
```

If you pass `--dkim-selector` without `--dkim-domain`, MailChannels takes the domain from the
`--from` address. See [sending](sending.md#dkim-signing) for customer-managed keys.

## DNS Publication

| Field | Value |
| --- | --- |
| `Name` | DNS host. Always `{selector}._domainkey.{domain}`. |
| `Type` | Always `TXT`. |
| `Value` | Public key material. **Publish verbatim** — don't re-wrap, strip, or split it. |

### Required Steps

1. **Create** the key with `dkim create` and note the `Name` and `Value` from `DNS Records`.
2. **Create or update** the TXT record at `Name` with `Value` in your DNS provider. Use a short
   TTL (300 s) so future rotations propagate quickly.
3. **Wait for propagation**, then verify with
   `mailchannels dkim check-domain --domain "example.com" --dkim-selector "mcdkim"`.
   The `DKIM checks:` line must read `PASSED` before you send real traffic.
4. **For rotations**, leave the old TXT record in place until the old key's grace period ends.
