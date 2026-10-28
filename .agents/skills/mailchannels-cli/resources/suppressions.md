# Suppressions

A suppression list keeps known-bad or opted-out recipients out of future sends. MailChannels
suppresses by recipient + suppression type + source.

All commands live under `mailchannels suppressions`.

## Create Entries

### A Single Entry

```sh
mailchannels suppressions create \
  --recipient "out@example.net" \
  --types "non-transactional" \
  --notes "Opted out through the preference center" \
  --add-to-sub-accounts
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--recipient <address>` | Recipient to suppress. | Yes, unless `--entries` is used | |
| `--types <types>` | Comma-separated suppression types: `transactional`, `non-transactional`. | No | `non-transactional` |
| `--notes <notes>` | Note for the entry (up to 1024 characters). | No | |
| `--entries` | Read a JSON array of entries from stdin instead. | Yes, unless `--recipient` is used | `false` |
| `--add-to-sub-accounts` | Also create the entries for every sub-account (parent accounts only). | No | `false` |

On success the CLI prints `[Suppressions] Suppression entries created successfully.` If neither
`--recipient` nor `--entries` is given it fails with
`Either '--entries' or '--recipient' is required.`

### Bulk Creation

With `--entries` the CLI reads a JSON array from **stdin**. Each entry needs `recipient`;
`types` (an array) and `notes` are optional.

```json
[
  {
    "recipient": "recipient1@example.net",
    "types": ["non-transactional"],
    "notes": "Opted out through the preference center"
  },
  {
    "recipient": "recipient2@example.net",
    "types": ["transactional", "non-transactional"]
  }
]
```

```sh
cat suppressions.json | mailchannels suppressions create --entries --add-to-sub-accounts

# or, in bash / zsh / cmd.exe
mailchannels suppressions create --add-to-sub-accounts --entries < suppressions.json
```

```powershell
Get-Content suppressions.json -Raw | mailchannels suppressions create --entries --add-to-sub-accounts
```

- When `--entries` is set, `--recipient`, `--types`, and `--notes` are ignored with a warning on
  stderr.
- Run without piped stdin it fails with `'--entries' requires JSON input piped to stdin.`
- Input that isn't a JSON array of objects with a `recipient` string (and, if present, a `types`
  array) fails with `'--entries' must be a JSON array of suppression entries.`

Constraints enforced by MailChannels:

- **Atomic**: either every entry in the request is added, or none are.
- At most **1000** entries per request, counted across the parent and any sub-accounts.
- `recipient` up to 255 characters; `notes` up to 1024.
- If any entry already exists the request fails with a conflict error.

All entries created this way have the source `api`; the CLI cannot set a different source.

## List Entries

```sh
mailchannels suppressions list \
  --source "api" \
  --created-after "2026-09-01" \
  --limit 100 \
  --offset 0
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--recipient <address>` | Filter by recipient (exact match). | No | |
| `--source <source>` | Filter by source (see below). | No | |
| `--created-after <datetime>` | Return entries created after this time. | No | |
| `--created-before <datetime>` | Return entries created before this time. | No | |
| `--limit <number>`, `-l` | Maximum entries to return (1–1000). | No | `1000` |
| `--offset <number>`, `-o` | Number of entries to skip. | No | `0` |

`--source` values for listing:

- `api` — explicitly created via the API or CLI.
- `unsubscribe_link` — the recipient used the hosted unsubscribe URL.
- `list_unsubscribe` — the recipient used a one-click `List-Unsubscribe` header.
- `hard_bounce` — bounced as undeliverable.
- `spam_complaint` — the recipient reported spam at their provider.

`all` is **not** valid for `list`. Date formats: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ` (or with
a UTC offset); a timestamp without `Z` or an offset is rejected.

Results print as indexed sections (`Created At`, `Notes`, `Recipient`, `Sender`, `Source`,
`Types`; fields the API doesn't return are omitted), followed by
`Total suppression entries retrieved: N (with limit: …, offset: …)`. With no matches the CLI
prints `[Suppressions] No suppression entries found.` and exits `0`.

## Delete An Entry

> **Warning:** Don't remove entries from the suppression list unless the recipient has
> explicitly opted back in. Doing so can hurt deliverability and may violate anti-spam laws and
> MailChannels policies.

```sh
mailchannels suppressions delete \
  --recipient "recipient@example.net" \
  --source "api"
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--recipient <address>` | Recipient whose entry should be deleted. | Yes | |
| `--source <source>` | Source of the entry to delete: `api`, `unsubscribe_link`, `list_unsubscribe`, `hard_bounce`, `spam_complaint`, or `all`. | No | `api` |

`--source all` removes every suppression for that recipient regardless of origin. An invalid
source fails with `Source must be one of 'api', 'unsubscribe_link', 'list_unsubscribe',
'hard_bounce', 'spam_complaint', 'all'.`

## Patterns

- **Preference center opt-out**: set `--types` according to the email category —
  `non-transactional` for marketing mail, `transactional` for order updates. Use
  `--add-to-sub-accounts` when the preference applies to every tenant, and add a note such as
  "Opted out via preference center" to record the origin.
- **Migrating from another ESP**: bulk-create with `--entries` and `--add-to-sub-accounts` so
  every tenant inherits the list.
