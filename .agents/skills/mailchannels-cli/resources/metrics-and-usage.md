# Metrics And Usage

The `metrics` commands show the operational view of your traffic. `usage` shows
billing-period totals. All of them are read-only.

## Time-Series Metrics

Four commands share the same optional filters:

```sh
mailchannels metrics volume
mailchannels metrics engagement
mailchannels metrics performance
mailchannels metrics recipient-behaviour
```

```sh
mailchannels metrics volume \
  --start-time "2026-09-01" \
  --end-time "2026-10-01" \
  --interval day \
  --campaign-id "welcome"
```

| Flag | Description | Default |
| --- | --- | --- |
| `--start-time <datetime>` | Inclusive start of the time range. | One month ago |
| `--end-time <datetime>` | Exclusive end of the time range. | Now |
| `--campaign-id <id>` | Filter to one campaign. | All campaigns |
| `--interval <interval>` | Bucket size: `hour`, `day`, `week`, or `month`. | `day` |

### Time Formats

| Accepted | Example |
| --- | --- |
| Date | `2026-09-01` |
| Date and time with `Z` or a UTC offset | `2026-09-01T00:00:00Z`, `2026-09-01T00:00:00+02:00` |

A timestamp **without** `Z` or an offset (`2026-09-01T00:00:00`) is rejected:
`The 'startTime' value is not a valid date.` Offsets are converted to UTC. An unknown
`--interval` fails with `Interval must be one of 'hour', 'day', 'week', 'month'.`

### Reading The Output

Each command prints a **time-series table** — one row per bucket, keyed by `Period Start` —
followed by a **summary** section with totals and the queried time range:

| Command | Columns / totals |
| --- | --- |
| `volume` | `Processed`, `Delivered`, `Dropped`. |
| `engagement` | `Open`, `Click`, `Open Tracking Delivered`, `Click Tracking Delivered`; a second table for the unique variants when the API returns them. |
| `performance` | `Processed`, `Delivered`, `Bounced`, `Complained`. |
| `recipient-behaviour` | `Unsubscribed`, `Unsubscribe Delivered`. |

With no data the CLI prints a line such as
`[Metrics] No volume data available for the specified period.` before the summary, and exits
`0`.

## Sender Metrics

`mailchannels metrics senders` lists per-sender totals grouped by campaign or sub-account.

```sh
mailchannels metrics senders \
  --type "campaigns" \
  --start-time "2026-09-01" \
  --limit 25 \
  --sort-order desc
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--type <type>` | Sender group: `campaigns` or `sub-accounts`. | Yes | |
| `--start-time <datetime>` | Inclusive start of the time range. | No | One month ago |
| `--end-time <datetime>` | Exclusive end of the time range. | No | Now |
| `--limit <number>`, `-l` | Senders to return (1–1000). | No | `10` |
| `--offset <number>`, `-o` | Senders to skip. | No | `0` |
| `--sort-order <order>` | `asc` or `desc`, by total messages (processed + dropped). | No | `desc` |

The output is a table of senders (`Name`, `Processed`, `Delivered`, `Dropped`, `Bounced`)
followed by a summary with `Limit`, `Offset`, `Total`, and the time range. Senders with **zero
traffic in the time range are omitted**.

## Usage

```sh
mailchannels usage
```

```text
[MailChannels-CLI] [Usage] Account usage:
────────────────────────────────────────────────────────────────
  End Date       '2026-11-23'
  Start Date     '2026-10-23'
  Total          4
  Monthly Limit  3100
────────────────────────────────────────────────────────────────
```

The result covers the current billing period for the account whose API key is in use. For one
sub-account use `mailchannels sub-accounts usage --handle "acme"` — see
[sub-accounts](sub-accounts.md).

## Common Patterns

- **Daily dashboard**: `metrics volume --interval day` plus `metrics engagement --interval day`
  over the same range.
- **Campaign post-mortem**: pass `--campaign-id` to each time-series command, then read the
  totals and buckets.
- **Top senders by sub-account**: `metrics senders --type sub-accounts --sort-order desc`.
- **Billing reconciliation**: `usage` plus `sub-accounts usage --handle …` for each tenant should
  sum within the parent's limit.
