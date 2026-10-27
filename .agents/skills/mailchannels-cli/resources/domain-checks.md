# Domain Checks

`mailchannels dkim check-domain` confirms a sender domain is properly authenticated before you
send from it. Although it lives under `dkim`, the check covers four things:

- **DKIM** — does the domain publish a DKIM public key matching the selectors MailChannels
  signs with?
- **SPF** — is MailChannels in the domain's SPF record?
- **Sender-domain DNS** — does the domain have at least one `A` or `MX` record? Receivers
  reject mail without either as **SDNF** ("Sender Domain Not Found").
- **Domain Lockdown** — a MailChannels feature that ties a sending domain to your account so
  other MailChannels customers cannot spoof it.

## Basic Check

```sh
mailchannels dkim check-domain --domain "example.com"
```

The output has one block per check — a verdict line followed by a table — and a `References`
list when MailChannels has support links to show:

```text
[MailChannels-CLI] [DKIM] SPF checks: PASSED
  …table with the verdict and the SPF record…
[MailChannels-CLI] [DKIM] Domain Lockdown checks: PASSED
  …
[MailChannels-CLI] [DKIM] Sender Domain checks: PASSED
  …table with the A and MX results…
[MailChannels-CLI] [DKIM] DKIM checks: PASSED
  …table with one row per selector (domain, key status, selector, verdict)…
[MailChannels-CLI] [DKIM] References:
— https://…
```

**The exit code is `0` even when checks fail.** It is `1` only when the request itself fails
(for example an invalid API key). Always read the four `… checks:` lines.

## Flags

| Flag | Description | Required |
| --- | --- | --- |
| `--domain <domain>` | Domain used for sending email. | Yes |
| `--dkim-domain <domain>` | Domain used for DKIM verification. | No |
| `--dkim-selector <selector>` | Selector of the DKIM key to verify. | No |
| `--dkim-private-key <key>` | Private key to verify with; requires `--dkim-selector`. Base64 or PEM. | No |
| `--envelope-from-domain <domain>` | Envelope-from domain, if different from `--domain`. | No |
| `--sender-id <id>` | Sender ID to check with Domain Lockdown. | No |

The CLI sends at most **one** DKIM setting per call. (The SDK accepts up to 10.)

### DKIM Settings Resolution

If you pass no `--dkim-*` flags, MailChannels uses all stored keys for `--domain`. To target a
specific key:

```sh
mailchannels dkim check-domain \
  --domain "example.com" \
  --dkim-domain "example.com" \
  --dkim-selector "mcdkim-2026"
```

| Flags provided | Behaviour |
| --- | --- |
| `--dkim-domain`, `--dkim-selector`, and `--dkim-private-key` | Verify with the provided key. |
| `--dkim-domain` and `--dkim-selector` | Use the stored private key for that domain and selector. |
| `--dkim-domain` only | Use **all** stored keys for that domain. |
| `--dkim-selector` only | Use `--domain` as the DKIM domain. |
| `--dkim-private-key` | `--dkim-selector` is required too, otherwise the command fails with a validation error. |
| None | Use all stored keys for `--domain`. |

## With A Sender ID (Domain Lockdown)

If your lockdown record uses `senderid=` or `sidw=` fields, pass the sender identity:

```sh
mailchannels dkim check-domain \
  --domain "example.com" \
  --sender-id "example|domain|example.com"
```

If your lockdown record uses `auth=` (account-wide authorization), omit `--sender-id`.

## With A Different Envelope-From Domain

If the envelope-from domain differs from `--domain`, pass it as `--envelope-from-domain` so SPF
and Domain Lockdown are evaluated against the correct domain — otherwise SPF or Domain
Lockdown failures can cause message delivery to fail.

```sh
mailchannels dkim check-domain \
  --domain "example.com" \
  --envelope-from-domain "bounce.example.net"
```

## Reading The Verdicts

| Line | What it reports |
| --- | --- |
| `SPF checks:` | `PASSED` when MailChannels is authorized. Other verdicts: `FAILED`, `SOFT FAILED`, `TEMPORARY ERROR`, `PERMANENT ERROR`, `NEUTRAL`, `NONE`, `UNKNOWN`. |
| `Domain Lockdown checks:` | `PASSED` or `FAILED`. |
| `Sender Domain checks:` | `PASSED` if **either** the A or the MX check passes, otherwise `FAILED`. |
| `DKIM checks:` | `PASSED` only if at least one DKIM result exists and **every** one passed. No stored keys at all reads `FAILED`. |

`PASSED` is printed in green, `NEUTRAL` in yellow, and failing verdicts in red — but the colours
are plain ANSI escapes, so match on the words. See [output-format](output-format.md#ansi-colors).

Anything other than `PASSED` needs attention before real traffic goes out. When scripting, strip
the ANSI codes, require all four `… checks:` lines to say `PASSED`, and treat a non-zero exit
code as the command itself failing.

## When To Use

- During onboarding for every new sending domain, after publishing the DNS record from
  [dkim](dkim.md).
- After rotating DKIM keys, to verify the new DNS record propagated.
- In a periodic monitoring job — verdicts can drift if DNS changes.
