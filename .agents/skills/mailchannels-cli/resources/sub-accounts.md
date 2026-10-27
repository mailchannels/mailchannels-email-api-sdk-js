# Sub-Accounts

Sub-accounts are first-class on MailChannels. Use them for tenants, customers, or isolated
senders so that one customer's reputation, limits, and bad traffic don't contaminate the parent
account or other tenants.

All commands live under `mailchannels sub-accounts` and need the **parent account's** API key
(see [authentication](authentication.md#parent-and-sub-account-keys)).

## Handles

A handle uniquely identifies a sub-account. Rules:

- 3–128 characters.
- **Lowercase alphanumeric only.** No hyphens, underscores, or uppercase.
- Unique per parent account.
- If omitted on create, a random handle is generated and shown in the output.

The company name must be 3–128 characters.

## Lifecycle

### Create

```sh
mailchannels sub-accounts create \
  --company-name "Acme Corporation" \
  --handle "acme"
```

| Flag | Description | Required |
| --- | --- | --- |
| `--company-name <name>` | Company name for the sub-account (3–128 characters). | Yes |
| `--handle <handle>` | Unique lowercase alphanumeric ID. | No |

```text
[MailChannels-CLI] [Sub-Accounts] Sub-account created successfully:
────────────────────────────────────────────────────────────────
  Company Name  'Acme Corporation'
  Enabled       true
  Handle        'acme'
────────────────────────────────────────────────────────────────
```

### List

```sh
mailchannels sub-accounts list --limit 100 --offset 0
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--limit <number>`, `-l` | Maximum accounts to return (1–1000). | No | `1000` |
| `--offset <number>`, `-o` | Number of accounts to skip. | No | `0` |

With none the CLI prints `[Sub-Accounts] No sub-accounts found.` and exits `0`.

### Suspend, Activate, Delete

```sh
mailchannels sub-accounts suspend --handle "acme"
mailchannels sub-accounts activate --handle "acme"
mailchannels sub-accounts delete --handle "acme"
```

Each takes `--handle <handle>` (required). Suspending disables email sending for the
sub-account until you activate it. Deleting is permanent — confirm with the user first.

## Credentials

Each sub-account has its own API keys and SMTP passwords.

```sh
mailchannels sub-accounts api-keys create --handle "acme"
mailchannels sub-accounts api-keys list --handle "acme" --limit 50 --offset 0
mailchannels sub-accounts api-keys delete --handle "acme" --id 123

mailchannels sub-accounts smtp-passwords create --handle "acme"
mailchannels sub-accounts smtp-passwords list --handle "acme"
mailchannels sub-accounts smtp-passwords delete --handle "acme" --id 123
```

| Command | Flags |
| --- | --- |
| `api-keys create` | `--handle` (required) |
| `api-keys list` | `--handle` (required), `--limit`/`-l` (1–1000, default 100), `--offset`/`-o` (default 0) |
| `api-keys delete` | `--handle` and `--id` (both required) — the numeric ID shown by `list` |
| `smtp-passwords create` | `--handle` (required) |
| `smtp-passwords list` | `--handle` (required); no pagination |
| `smtp-passwords delete` | `--handle` and `--id` (both required) — the numeric ID shown by `list` |

**Secrets are shown once.** `create` prints the full `Key` / `Smtp Password` in its output.
`list` output is redacted, so store the secret immediately (or delete it and create another).
Each sub-account has server-side caps on how many API keys and SMTP passwords it can hold. At
the cap, `create` fails (for API keys:
`You have reached the limit of API keys you can create for this sub-account.`) — delete an
unused credential first.

`api-keys list` and `smtp-passwords list` print a table; `api-keys list` adds a footer
`Total API keys retrieved: N (with limit: …, offset: …)`. When `--limit` is omitted the footer
shows a default label of `1000`, but the API default is 100 — pass `--limit` explicitly when you
need to be sure how many were requested.

## Limits

Per-sub-account monthly send caps. A sub-account without a limit inherits the parent's
capacity.

```sh
mailchannels sub-accounts limit get --handle "acme"
mailchannels sub-accounts limit set --handle "acme" --sends 5000
mailchannels sub-accounts limit delete --handle "acme"
```

| Command | Flags |
| --- | --- |
| `limit get` | `--handle` (required) |
| `limit set` | `--handle` and `--sends <number>` (both required; a whole number, 0 or more) |
| `limit delete` | `--handle` (required) — the sub-account goes back to inheriting the parent's limit |

`limit get` prints `Sends`; a value of **`-1` means the sub-account inherits the parent's
limit**:

```text
[MailChannels-CLI] [Sub-Accounts] Sub-account limit:
────────────────────────────────────────────────────────────────
  Sends  -1
────────────────────────────────────────────────────────────────
```

## Usage

```sh
mailchannels usage                                  # the parent account
mailchannels sub-accounts usage --handle "acme"     # one sub-account
```

Both print `End Date`, `Start Date`, `Total`, and `Monthly Limit` for the current billing
period. `usage` (without `sub-accounts`) is for the account whose key is in use.

## Sending As A Sub-Account

Pass the sub-account's own API key so the account boundary is explicit in the command:

```sh
mailchannels emails queue \
  --api-key "$TENANT_A_API_KEY" \
  --from "sender@client.example" \
  --to "recipient@example.net" \
  --subject "From a tenant" \
  --text "Hello"
```

This avoids hard-to-debug mix-ups where the parent key is used by mistake.

## Suppressions And Sub-Accounts

When creating suppressions on the parent, add `--add-to-sub-accounts` to copy the entries into
every sub-account. See [suppressions](suppressions.md).

## Patterns

- **Onboard a tenant**: `sub-accounts create` → `limit set` → `api-keys create`, storing the new
  key in the tenant's secret store straight away.
- **Pause or remove a tenant**: `suspend` stops sending and is reversible with `activate`;
  `delete` is permanent, so suspend first and delete only once the user confirms.
