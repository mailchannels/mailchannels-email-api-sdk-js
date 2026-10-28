# Sending Email

Use `mailchannels emails queue` as the default. Switch to `mailchannels emails send` only when
you specifically need synchronous processing, or a dry run.

## Quickest Send

```sh
mailchannels emails queue \
  --from "Sender <sender@example.com>" \
  --to "recipient@example.net" \
  --subject "Hello" \
  --text "Plain text body." \
  --html "<p>HTML body.</p>"
```

```text
[MailChannels-CLI] [Emails] Email queued successfully.
```

Provide both `--text` and `--html` whenever possible — receiving clients prefer the last
matching content type and a plain-text fallback improves deliverability.

That one line is all the CLI prints. It does **not** show the `requestId`, `queuedAt`,
`messageId`, or per-recipient results the API returns, so tag sends with
[`--campaign-id`](#campaign-ids) if you need to find them later in webhook events and
[metrics](metrics-and-usage.md). Exit code `0` means the API accepted the request, not that the
message was delivered; delivery outcomes arrive through [webhooks](webhooks.md).

## `send` vs `queue`

| Command | Server behaviour | When to use |
| --- | --- | --- |
| `emails queue` | Queued — per-recipient work runs in the background; returns immediately. | Default for real sends. |
| `emails send` | Synchronous — full per-recipient processing inside the request. | Small numbers of messages. |
| `emails send --dry-run` | The API validates and renders the message without delivering it. | Checking a payload before a real send. |

### Dry Run

```sh
mailchannels emails send \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Preview" \
  --text "Hello" \
  --dry-run
```

- `--dry-run` exists **only on `emails send`**. `emails queue` ignores unknown flags, so
  `emails queue … --dry-run` queues a real message.
- The CLI discards the rendered output and still prints `[Emails] Email sent successfully.`
  Exit code `0` means the API accepted and rendered the payload; nothing was delivered. To see
  the rendered message, use the SDK (the `mailchannels-js` skill's `sending.md`).

## Flags

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--from <address>` | Sender address (one address; a display name is allowed). | Yes | |
| `--to <addresses>` | Comma-separated recipient addresses. | Yes | |
| `--subject <subject>` | Subject line. | Yes | |
| `--text <text>` | Plain-text body. | Yes if no HTML body | empty |
| `--text-file <path>` | Read the plain-text body from a file; wins over `--text`. | Yes if no HTML body | |
| `--html <html>` | HTML body. | Yes if no text body | empty |
| `--html-file <path>` | Read the HTML body from a file; wins over `--html`. | Yes if no text body | |
| `--cc <addresses>` | Comma-separated CC addresses. | No | |
| `--bcc <addresses>` | Comma-separated BCC addresses. | No | |
| `--reply-to <address>` | Reply-to address (one address). | No | |
| `--headers <json>` | Custom headers as a JSON object. | No | |
| `--attachments`, `-a` | Read a JSON array of attachments from stdin. | No | `false` |
| `--campaign-id <id>` | Campaign identifier. | No | |
| `--envelope-from <address>` | Envelope sender; defaults to the `--from` address. Only the email portion is used. | No | |
| `--dkim-domain <domain>` | DKIM signing domain. | No | |
| `--dkim-selector <selector>` | DKIM selector. | No | |
| `--dkim-private-key <key>` | Customer-managed DKIM private key. | No | |
| `--tracking-click` | Enable click tracking. | No | `false` |
| `--tracking-click-custom-domain-name <name>` | Custom domain for click tracking; also enables click tracking. | No | |
| `--tracking-open` | Enable open tracking. | No | `false` |
| `--tracking-open-custom-domain-name <name>` | Custom domain for open tracking; also enables open tracking. | No | |
| `--unsubscribe-custom-domain-name <name>` | Custom domain for unsubscribe links. | No | |
| `--transactional` | Mark the message transactional. Use `--no-transactional` to turn it off. | No | `true` |
| `--dry-run` | `send` only: validate and render without delivering. | No | `false` |

Both commands also accept `--api-key`/`-k` (see [authentication](authentication.md)).

## Recipients

`--to`, `--cc`, and `--bcc` take comma-separated lists. Whitespace around each address is
trimmed.

```sh
mailchannels emails queue \
  --from "Sender <sender@example.com>" \
  --to "alice@example.net,Bob Jones <bob@example.net>" \
  --cc "cc@example.net" \
  --subject "Update" \
  --text "Hello"
```

- Addresses are `user@example.net` or `Display Name <user@example.net>`.
- `--from`, `--reply-to`, and `--envelope-from` each take **one** address.
- **No commas in display names** in `--to` / `--cc` / `--bcc`. The CLI splits on every comma, so
  `"Smith, Jane <jane@example.net>"` becomes two entries and the first is silently dropped.
- **Malformed addresses are dropped silently.** The command only fails
  (`No recipients provided. Use the 'to' option to specify at least one recipient`) when no
  valid recipient remains, so check the lists yourself before sending.
- Up to 1000 recipients each in `--to`, `--cc`, and `--bcc`.

## Message Bodies

At least one of `--text` / `--html` (or their `-file` forms) is required; otherwise the command
fails with `No email content provided`.

Prefer `--text-file` and `--html-file` for anything longer than a sentence. Reading from files
avoids shell quoting problems and command-line length limits. Paths are resolved from the
current directory and files are read as UTF-8. If an inline flag and its file flag are both
given, the file wins and a warning goes to stderr.

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Test Email" \
  --text-file "./emails/hello.txt" \
  --html-file "./emails/hello.html"
```

A file that can't be read ends the command, for example
`[Emails] Error: ENOENT: no such file or directory, open '…'`.

## Custom Headers

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Custom header" \
  --text "Hello" \
  --headers '{"X-Campaign-ID": "newsletter-2026-05", "X-Project": "growth"}'
```

Header names and values must be strings. Reserved headers are rejected before any request is
made (names are compared case-insensitively): `From`, `To`, `CC`, `BCC`, `Subject`,
`Reply-To`, `DKIM-Signature`, `Content-Type`, `Content-Transfer-Encoding`, `Message-ID`,
`Authentication-Results`, and `Received`. Use the matching flag instead.

```text
[MailChannels-CLI] [Emails] Invalid JSON for '--headers'
[MailChannels-CLI] [Emails] Root headers cannot include the reserved header 'Subject'.
```

On PowerShell, inner double quotes need escaping — see
[overview](overview.md#json-in-a-flag).

## Attachments

`--attachments` (`-a`) reads a JSON array from stdin. See [attachments](attachments.md) for the
format and recipes for building it from real files.

## Tracking

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Tracked" \
  --html '<p>Hello <a href="https://example.com">click here</a></p>' \
  --tracking-click \
  --tracking-open
```

Open and click tracking require a subscription that supports them. Click tracking only rewrites
`<a>` tags whose URL is non-empty, starts with `http`/`https`, and does not have
`clicktracking="off"`.

### Custom Tracking Domains

`--tracking-click-custom-domain-name`, `--tracking-open-custom-domain-name`, and
`--unsubscribe-custom-domain-name` route those links through a domain you registered instead of
the shared MailChannels domain. The click and open flags turn their tracking type on
automatically, so `--tracking-click` is not needed alongside them.

The value is the domain's **`name`** label, not its hostname. It must match `^[a-z0-9-]+$` and
belong to an **active** custom tracking domain for that scope. See
[custom-tracking-domains](custom-tracking-domains.md) for registration and DNS verification.

## DKIM Signing

Sign with a hosted key (see [dkim](dkim.md)):

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Signed" \
  --text "Signed by hosted DKIM." \
  --dkim-domain "example.com" \
  --dkim-selector "mcdkim"
```

| Flags | Result |
| --- | --- |
| `--dkim-selector` only | The domain is taken from the `--from` address. |
| `--dkim-domain` + `--dkim-selector` | Signs with the hosted key for that domain and selector. |
| `--dkim-domain` without `--dkim-selector` | Rejected: `Root DKIM domain requires a selector.` |
| `--dkim-private-key` | Customer-managed key; requires both `--dkim-domain` and `--dkim-selector` (`Root DKIM privateKey requires both a domain and selector.`). Accepts Base64 or PEM — header and footer lines and whitespace are stripped. |

## Transactional And Non-Transactional

Messages are **transactional** by default (receipts, password resets, confirmations). Mark bulk
or marketing mail as non-transactional with `--no-transactional` (or `--transactional=false`):

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Monthly newsletter" \
  --html "<p>News…</p>" \
  --dkim-domain "example.com" \
  --dkim-selector "mcdkim" \
  --no-transactional
```

A non-transactional message must be DKIM signed and have **exactly one recipient** in total
across `--to`, `--cc`, and `--bcc`. Otherwise the command fails before any request:

```text
[MailChannels-CLI] [Emails] Non-transactional messages must be DKIM signed.
[MailChannels-CLI] [Emails] Non-transactional messages must have exactly one recipient per personalization.
```

MailChannels then adds `List-Unsubscribe` and `List-Unsubscribe-Post` headers automatically.
The hosted in-body unsubscribe link (`{{mc-unsubscribe-url}}`) is only substituted when the
message uses a mustache template, and the CLI cannot enable one — for compliant bulk mail use
the SDK (the `mailchannels-js` skill's `unsubscribe.md`).

## Campaign IDs

`--campaign-id` must be 48 characters or fewer and contain no whitespace; otherwise the command
fails with `campaignId must be 48 characters or fewer and must not contain spaces.` Use the
same value with `metrics … --campaign-id` and `metrics senders --type campaigns` to follow a
campaign. Webhook events carry it too.

## Limits

- The total message — headers, body, and attachments together — is limited to **30 MB**. The
  API rejects larger payloads with `The total message size should not exceed 30MB. …`.
- Up to 1000 attachments per message and 1000 recipients in each of `--to`, `--cc`, `--bcc`.
- There are no idempotency keys. Re-running a `send` or `queue` command after a timeout or an
  error can deliver the message twice. Check webhooks or metrics before retrying.
