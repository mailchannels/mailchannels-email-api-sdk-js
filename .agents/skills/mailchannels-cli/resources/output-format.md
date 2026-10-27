# Output Format

The CLI prints human-readable text. There is no JSON mode and no `--quiet` or `--verbose` flag.
This resource explains how to read that output, and how to script around it when you must.

## Streams

| Stream | What goes there |
| --- | --- |
| stdout | Results, confirmations, tables, the usage text printed when a required flag is missing or a command is unknown, and the `Instructions:` line after a failed `custom-tracking create` / `update`. |
| stderr | Errors, warnings, validation messages, `Missing required argument: --<flag>`, and update notices. |

Every `info`, `warn`, and `error` line starts with `[MailChannels-CLI]` followed by an area tag:
`[Emails]`, `[DKIM]` (also `dkim check-domain`), `[Custom Tracking]`, `[Metrics]`, `[Usage]`,
`[Suppressions]`, `[Sub-Accounts]`, `[Webhooks]`, or `[Simulator]`. Table bodies and the lines
inside a section are not prefixed.

## Layouts

### Confirmations

Commands with nothing to show print one line:

```text
[MailChannels-CLI] [Suppressions] Suppression entries created successfully.
```

### A Single Record

Detail views print the prefixed heading, then a 64-character rule, aligned `Label  value`
lines, and a closing rule:

```text
[MailChannels-CLI] [Sub-Accounts] Sub-account created successfully:
────────────────────────────────────────────────────────────────
  Company Name  'Acme Corporation'
  Enabled       true
  Handle        'acme'
────────────────────────────────────────────────────────────────
```

### A List Of Records

Lists print one block per record, each opened by an indexed rule, with a single closing rule and
a footer:

```text
[MailChannels-CLI] [Suppressions] Retrieved suppression entries:
── [0] ─────────────────────────────────────────────────────────
  Created At  '2026-10-26T17:29:26.556Z'
  Notes       'Opted out'
  Recipient   'out@example.net'
  Source      'api'
  Types       [ 'non-transactional' ]
── [1] ─────────────────────────────────────────────────────────
  Created At  '2026-10-26T17:29:26.658Z'
  Recipient   'r1@example.net'
  Source      'api'
  Types       [ 'transactional', 'non-transactional' ]
────────────────────────────────────────────────────────────────
[MailChannels-CLI] [Suppressions] Total suppression entries retrieved: 2 (with limit: 1000, offset: 0)
```

### Tables

Some commands print Node's `console.table` box drawing instead — `webhooks list`,
`webhooks validate`, `sub-accounts api-keys list`, `sub-accounts smtp-passwords list`, the
`metrics` time series and sender tables, and every table in `dkim check-domain`:

```text
[MailChannels-CLI] [Webhooks] Registered webhook endpoints:
┌─────────┬────────────────────────────────────────────┐
│ (index) │ Webhook                                    │
├─────────┼────────────────────────────────────────────┤
│ 0       │ 'https://example.com/mailchannels/webhook' │
└─────────┴────────────────────────────────────────────┘
```

### Empty Results

An empty list prints a `No … found.` line, for example `[DKIM] No DKIM keys found.`, and the
command exits `0`.

### Reading Values

- Labels come from the SDK field names, split into Title Case words (`gracePeriodExpiresAt` →
  `Grace Period Expires At`). They can change between versions.
- Strings are shown in single quotes. The quotes are display formatting, **not part of the
  value** — don't copy them into DNS records or config.
- Numbers, booleans, and `null` are unquoted. Arrays look like `[ 'a', 'b' ]` and nested objects
  like `{ Name: 'x', Type: 'TXT' }`.
- Timestamps are ISO-8601 in UTC.

## ANSI Colors

The CLI's own output styling does **not** check whether stdout is a terminal and ignores
`NO_COLOR`: escape sequences are emitted even when output is piped or redirected. Strings and
verdicts such as `PASSED` are green (`ESC[32m`), numbers, booleans, and limit/offset values are
yellow (`ESC[33m`), URLs in references are underlined cyan, and update notices are dim. Strip
them before matching or storing output:

```sh
# bash / zsh
mailchannels usage | sed 's/\x1b\[[0-9;]*m//g'
```

```powershell
# PowerShell
mailchannels usage | ForEach-Object { $_ -replace '\x1b\[[0-9;]*m', '' }
```

The usage text from `--help` and missing-argument errors is styled by the argument parser
instead and is plain when `CI` or `NO_COLOR=1` is set or `TERM=dumb`.

## Pagination

List commands print a footer such as `Total … retrieved: N (with limit: L, offset: O)`. `N` is
the number of rows on **this page**. `L` and `O` echo the flags you passed, or a default label
when you omitted them. To read everything, re-run with `--offset` increased by `--limit` until a
page returns fewer than `--limit` rows.

| Command | Default limit | Maximum |
| --- | --- | --- |
| `dkim list` | 10 | 100 |
| `custom-tracking list` | 100 | 1000 |
| `suppressions list` | 1000 | 1000 |
| `sub-accounts list` | 1000 | 1000 |
| `sub-accounts api-keys list` | 100 (the footer's default label says 1000) | 1000 |
| `metrics senders` | 10 | 1000 |
| `webhooks batches` | 500 | 500 |

## Update Notices

After an interactive run, the CLI may check the npm registry for a newer release and write a
notice to stderr:

```text
Update available: v1.8.0 -> v1.9.0
Install globally: npm install -g @mailchannels/sdk
Or run with npx: npx @mailchannels/sdk@latest
```

The check is skipped when stdout is not a terminal or when `CI`, `GITHUB_ACTIONS`, or
`NO_UPDATE` is set. It is best-effort (5-second timeout, failures ignored) and never changes the
exit code. Set `NO_UPDATE=1` in automated or offline sessions to avoid the network call.

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | The command ran to completion — including empty results, `--help`, and `--version`. It does **not** mean the checks a command reported passed. |
| `1` | Anything failed: a missing or invalid flag, an unknown command, a validation error, an API error, an unreadable file or stdin, or a missing API key. `docs` also exits `1` if no browser can be opened. |

See [error-handling](error-handling.md) for what each failure looks like.
