# Authentication

Every command that calls the Email API needs an API key. Only `simulate`, `docs`, `--help`, and
`--version` run without one.

## Providing The Key

| Method | How | Notes |
| --- | --- | --- |
| Environment variable (preferred) | `MAILCHANNELS_API_KEY` | Read on every run. Keeps the key out of command lines. |
| Flag | `--api-key <key>` or `-k <key>` | Wins when both are set. The value shows up in shell history and process listings. |

```sh
# bash / zsh
export MAILCHANNELS_API_KEY="YOUR-API-KEY"
mailchannels usage
```

```powershell
# PowerShell
$env:MAILCHANNELS_API_KEY = "YOUR-API-KEY"
mailchannels usage
```

```sh
# One-off override with a different key (for example a sub-account's)
MAILCHANNELS_API_KEY="$TENANT_A_API_KEY" mailchannels usage
```

A missing key stops the command before any request is made, with exit code `1`:

```text
[MailChannels-CLI] Missing API key. Provide it using the '--api-key' flag or set the 'MAILCHANNELS_API_KEY' environment variable.
```

An invalid or revoked key is only detected by the API. The command then fails with
`Invalid API key.` (the message may carry extra details) and exits `1`.

A valid key for another account can authenticate successfully and run the command against that
account. Select the credential for the intended account; successful authentication alone does
not verify that you selected the right account.

## Keeping The Key Safe

- Set `MAILCHANNELS_API_KEY` once for the session instead of repeating `--api-key` in every
  command. Flags are recorded in shell history and visible in process listings.
- Never echo the key, commit it, or paste it into chat or tickets. The CLI never prints the key
  you pass.
- `sub-accounts api-keys create` and `sub-accounts smtp-passwords create` print the **new
  secret once**; later `list` output is redacted. Treat that output as sensitive and store the
  secret immediately.
- `--dkim-private-key` takes the private key as an argument, so it is visible in process
  listings and shell history; the CLI has no file-based option for it. Prefer a hosted DKIM key
  (`--dkim-selector`) where you can.

## Parent And Sub-Account Keys

The key decides whose account a command acts on:

- Use the **parent account key** for account management — the `sub-accounts …` commands — and
  for the parent account's own `usage`, `metrics`, suppressions, and webhooks.
- Use a **sub-account's own API key** when a command should act as that tenant, for example
  `emails queue` sending on its behalf.

Name the variables distinctly so the wrong key can't be used by accident, and set
`MAILCHANNELS_API_KEY` to the key each command should use:

```sh
export PARENT_API_KEY="…"
export TENANT_A_API_KEY="…"

MAILCHANNELS_API_KEY="$PARENT_API_KEY" mailchannels sub-accounts list
MAILCHANNELS_API_KEY="$TENANT_A_API_KEY" mailchannels emails queue \
  --from "sender@client.example" \
  --to "recipient@example.net" \
  --subject "From a tenant" \
  --text "Hello"
```

See [sub-accounts](sub-accounts.md) for creating and managing tenant credentials.

## No Base URL, Timeout, Or Retry Options

The CLI always calls `https://api.mailchannels.net` with a 120-second timeout and no retries. It
has no flag or environment variable for a different base URL, so CLI commands cannot be pointed
at the [simulator](simulator.md) or any alternate endpoint. Use the SDK's `baseUrl`,
`timeout`, and `retry` options (the `mailchannels-js` skill's `clients-and-transport.md`) when
you need them.

## CI

- Store the key in the CI secret store and expose it as `MAILCHANNELS_API_KEY`.
- Pin the package version (`npx @mailchannels/sdk@<version> …`) so behaviour doesn't change
  between runs.
- Update notices are skipped automatically when `CI`, `GITHUB_ACTIONS`, or `NO_UPDATE` is set.
  See [output-format](output-format.md#update-notices).
