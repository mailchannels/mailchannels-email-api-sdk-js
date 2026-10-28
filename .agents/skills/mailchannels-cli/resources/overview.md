# CLI Overview

The `@mailchannels/sdk` npm package includes a command-line interface for sending email and
running Email API operations from a terminal, script, or CI job. The package installs two
binaries that run the same entry file:

| Binary | Notes |
| --- | --- |
| `@mailchannels/sdk` | What `npx @mailchannels/sdk <command>` runs. Nothing to install first. |
| `mailchannels` | Shorter alias, available once the package is installed (for example globally). |

```sh
# One-off use, nothing installed
npx @mailchannels/sdk --help

# Frequent use
npm install -g @mailchannels/sdk
mailchannels --help
```

The resources write `mailchannels …`; `npx @mailchannels/sdk …` behaves identically. The CLI
requires Node.js 20 or newer.

## Command Inventory

| Command | What it does | Resource |
| --- | --- | --- |
| `emails send`, `emails queue` | Send an email synchronously, or queue it for async sending. | [sending](sending.md), [attachments](attachments.md) |
| `dkim list`, `create`, `update-status`, `rotate` | Manage hosted DKIM keys. | [dkim](dkim.md) |
| `dkim check-domain` | Check a domain's DKIM, SPF, Domain Lockdown, and sender-domain DNS. | [domain-checks](domain-checks.md) |
| `custom-tracking list`, `create`, `update`, `delete` | Manage branded click, open, and unsubscribe domains. | [custom-tracking-domains](custom-tracking-domains.md) |
| `metrics volume`, `engagement`, `performance`, `recipient-behaviour`, `senders` | Traffic analytics. | [metrics-and-usage](metrics-and-usage.md) |
| `usage` | Usage and monthly limit for the current billing period. | [metrics-and-usage](metrics-and-usage.md) |
| `suppressions create`, `list`, `delete` | Manage the suppression list. | [suppressions](suppressions.md) |
| `sub-accounts create`, `list`, `delete`, `suspend`, `activate`, `usage` | Manage sub-accounts. | [sub-accounts](sub-accounts.md) |
| `sub-accounts api-keys`, `smtp-passwords`, `limit` | Sub-account credentials and monthly send caps. | [sub-accounts](sub-accounts.md) |
| `webhooks create`, `list`, `delete-all`, `validate`, `batches`, `resend-batch` | Manage delivery-event webhooks. | [webhooks](webhooks.md) |
| `simulate` | Start the local API simulator. | [simulator](simulator.md) |
| `docs` | Open https://docs.mailchannels.com in the default browser. | — |

`docs` launches a GUI browser (`cmd /c start`, `open`, or `xdg-open`). Skip it in headless or
agent sessions.

## Getting Help

```sh
mailchannels --help                 # top-level commands
mailchannels emails --help          # subcommands of a group
mailchannels emails queue --help    # flags for one command
mailchannels --version              # package version
```

`--help` (or `-h`) anywhere in the arguments prints help for the deepest command named and
exits `0` without running anything. Help marks required flags with `(Required)` and shows
defaults. Because `-h` always means help, no command can use it as a value alias — `simulate`
takes `--host`, not `-h`.

Omitting a required flag prints that command's usage to stdout, then
`[MailChannels-CLI] Missing required argument: --<flag>` to stderr, and exits `1`.

## Flag Syntax

| Syntax | Behaviour |
| --- | --- |
| `--flag value` or `--flag=value` | Sets a string or number flag. |
| `--flag` | Sets a boolean flag to `true`. |
| `--no-flag` or `--flag=false` | Sets a boolean flag to `false`, for example `--no-transactional`. |
| `--flag false` | Does **not** work for booleans: `false` becomes a stray argument and the flag keeps its default. |
| `--camelCase` | Accepted as an alias of the kebab-case flag (`--campaignId` = `--campaign-id`). Prefer kebab-case. |
| Unknown flags | **Ignored silently.** |

Short aliases exist for a few flags: `-k` (`--api-key`), `-l` (`--limit`), `-o` (`--offset`),
`-a` (`--attachments`), `-e` (`--endpoint`), `-s` (`--statuses`, or `--silent` on `simulate`),
`-r` (`--request-id`), `-b` (`--batch-id`), `-p` (`--port`). Each command's flag table lists
its aliases.

Numbers are passed as text (`--limit 25`) and converted by the CLI. A value that isn't an
integer fails with an error such as `The limit value must be an integer.`

## Shell Differences

Examples use bash/zsh syntax. Translate them for other shells:

| | bash / zsh | PowerShell | cmd.exe |
| --- | --- | --- | --- |
| Continue a command on the next line | `\` | `` ` `` | `^` |
| Set the API key for the session | `export MAILCHANNELS_API_KEY="…"` | `$env:MAILCHANNELS_API_KEY = "…"` | `set MAILCHANNELS_API_KEY=…` |
| Feed a file to stdin | `mailchannels … < file.json` | `Get-Content file.json -Raw \| mailchannels …` | `mailchannels … < file.json` |

### JSON In A Flag

`--headers` takes a JSON object. Quote it so the shell passes a single argument:

```sh
# bash / zsh
mailchannels emails send \
  --from "sender@example.com" --to "recipient@example.net" \
  --subject "Custom header" --text "Hello" \
  --headers '{"X-Campaign-ID": "spring"}'
```

```powershell
# PowerShell — escape the inner double quotes
mailchannels emails send `
  --from "sender@example.com" --to "recipient@example.net" `
  --subject "Custom header" --text "Hello" `
  --headers '{\"X-Campaign-ID\": \"spring\"}'
```

With default settings, PowerShell strips unescaped double quotes from arguments passed to
`.cmd` shims — which is how a global npm install and `npx` launch the CLI on Windows. The CLI
then reports `Invalid JSON for '--headers'`. In cmd.exe, wrap the JSON in double quotes and
escape the inner ones as `\"`. JSON read from stdin (`--attachments`, `--entries`) is not
affected.

## Commands That Change Or Delete Things

Only run these when the user has asked for the effect. Several cannot be undone.

| Command | Effect |
| --- | --- |
| `emails send`, `emails queue` | Delivers real email. Not idempotent — re-running sends again. |
| `suppressions delete` | Re-enables sending to a recipient. Don't remove entries unless the recipient explicitly opted back in. |
| `webhooks delete-all` | Removes **every** enrolled webhook. There is no per-URL delete. |
| `webhooks resend-batch` | Re-delivers a batch of events to your endpoint, so your handler sees duplicates. |
| `sub-accounts delete`, `sub-accounts suspend` | Deletes a sub-account, or blocks it from sending until `activate`. |
| `sub-accounts api-keys delete`, `sub-accounts smtp-passwords delete` | Revokes a credential; anything using it starts failing. |
| `sub-accounts api-keys create`, `sub-accounts smtp-passwords create` | Creates a credential and prints its secret **once**. |
| `sub-accounts limit set`, `sub-accounts limit delete` | Changes a tenant's monthly send cap (`delete` returns it to inheriting the parent's). |
| `custom-tracking delete` | Tracking links and unsubscribe URLs in already-sent mail stop working immediately. |
| `dkim update-status`, `dkim rotate` | Changes which keys sign mail. Unpublished keys fail DKIM at receiving providers. |

Read-only commands — every `list`, `usage`, `metrics …`, `dkim check-domain`, `webhooks batches`
— are safe to run. `webhooks validate` sends a harmless test event to each enrolled endpoint.

## CLI Or SDK?

| Use the CLI for | Use the SDK (the `mailchannels-js` skill) for |
| --- | --- |
| One-off operations, ops checks, shell scripts, CI smoke tests, DNS preparation (DKIM keys, custom tracking domains), quick metrics. | Application code, structured results, mustache templates, personalizations, webhook signature verification, client options, tests against the simulator. |

## What The CLI Does Not Cover

- Mustache templates, per-recipient personalizations, and explicit `content` parts for
  `emails send` / `emails queue`.
- Webhook signature verification and signing-key lookup.
- More than one DKIM setting per `dkim check-domain` call.
- Client options: base URL, timeout (fixed at 120 seconds), retries (none), cancellation.
