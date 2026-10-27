# Webhooks

MailChannels posts batched delivery events to a URL you register. Events cover both
`emails send` and `emails queue` sends and use the same payload shape. The CLI manages
enrollment and inspects delivery batches; it cannot verify incoming signatures (see
[Not In The CLI](#not-in-the-cli)).

All commands live under `mailchannels webhooks`.

## Enroll And Manage

```sh
mailchannels webhooks create --endpoint "https://example.com/mailchannels/webhook"
mailchannels webhooks list
mailchannels webhooks delete-all
```

| Command | Flags | Output |
| --- | --- | --- |
| `create` | `--endpoint <url>`, `-e` (required; at most 8000 characters) | `[Webhooks] Webhook created successfully.` |
| `list` | none | A table of enrolled endpoints, or `[Webhooks] No registered webhooks found.` |
| `delete-all` | none | `[Webhooks] All webhooks deleted successfully.` |

There is no per-URL delete — `delete-all` removes **every** enrolled webhook for the account.
Enroll the replacement first if you are swapping URLs, and confirm with the user before running
it.

Enrolling an endpoint that already exists fails with
`Endpoint '<url>' is already enrolled to receive notifications.`

## Validate

`webhooks validate` sends a synthetic test request to **every** enrolled webhook and reports
each one's response. It is useful as a deploy check.

```sh
mailchannels webhooks validate --request-id "deploy-smoke-test"
```

| Flag | Description | Required |
| --- | --- | --- |
| `--request-id <id>`, `-r` | Request ID to put in the test payload (at most 28 characters). | No |

```text
[MailChannels-CLI] [Webhooks] Webhook validation result:
┌─────────┬──────────┬────────────────────────────────────────────┬────────┐
│ (index) │ Result   │ Webhook                                    │ Status │
├─────────┼──────────┼────────────────────────────────────────────┼────────┤
│ 0       │ 'passed' │ 'https://example.com/mailchannels/webhook' │ 200    │
└─────────┴──────────┴────────────────────────────────────────────┴────────┘
[MailChannels-CLI] [Webhooks] Total webhooks validated: 1 all passed?: true
```

**The exit code is `0` even when a webhook fails.** Read the `Result` and `Status` columns and
the `all passed?:` value. With no webhooks enrolled the API answers
`No webhooks found for the account.` and the command exits `1`.

The test payload carries `event: 'test'` and a hardcoded sender of `test@mailchannels.com`.

## Inspect Batches

`webhooks batches` returns batch summaries — use it to investigate failed deliveries.

```sh
mailchannels webhooks batches \
  --statuses "4xx,5xx,no_response" \
  --created-after "2026-10-20" \
  --created-before "2026-10-25" \
  --webhook "https://example.com/mailchannels/webhook" \
  --limit 50 \
  --offset 0
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--created-after <datetime>` | Return batches created after this time. | No | |
| `--created-before <datetime>` | Return batches created before this time. | No | |
| `--statuses <statuses>`, `-s` | Comma-separated response status groups: `1xx`, `2xx`, `3xx`, `4xx`, `5xx`, `no_response`. | No | |
| `--webhook <url>`, `-e`, `--endpoint` | Filter by webhook endpoint. | No | |
| `--limit <number>`, `-l` | Maximum batches to return (1–500). | No | `500` |
| `--offset <number>`, `-o` | Number of batches to skip. | No | `0` |

Constraints:

- The range between `--created-after` and `--created-before` must not exceed **31 days**, and
  `--created-before` must be later than `--created-after`. If neither is set, the default range
  is the last 3 days.
- Up to 6 unique `--statuses` values. An unknown value fails with
  `Invalid status filter provided. Valid values are: '1xx', '2xx', '3xx', '4xx', '5xx', 'no_response'.`
- Date formats: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ` (or with a UTC offset).

Results print as indexed sections (`Batch Id`, `Created At`, `Customer Handle`, `Duration`,
`Event Count`, `Status`, `Status Code`, `Webhook`) followed by
`Total batches retrieved: N (with limit: …, offset: …)`. With no matches the CLI prints
`[Webhooks] No webhook batches found.` and exits `0`.

## Resend A Batch

```sh
mailchannels webhooks resend-batch --batch-id "12345"
```

| Flag | Description | Required |
| --- | --- | --- |
| `--batch-id <id>`, `-b` | Batch ID to resend (a number, from `webhooks batches`). | Yes |

The CLI prints `Webhook batch resent:` followed by the response (`Batch Id`, `Customer Handle`,
`Webhook`, `Created At`, `Event Count`, `Duration` in milliseconds, `Status Code`).

A successful call means the resend attempt completed — **not** that your webhook returned `2xx`.
Check `Status Code` to see what your endpoint actually answered. Resending delivers the events
again, so make sure your handler is idempotent.

## Patterns

- **Deploy smoke test**: after deploying a handler, run `webhooks validate` and require
  `all passed?: true`.
- **Investigate failures**: `webhooks batches --statuses 4xx,5xx,no_response` over the affected
  window, fix the handler, then `webhooks resend-batch` for each failed `Batch Id`.

## Not In The CLI

- **Signature verification** of incoming webhook requests and **signing-key lookup**. Use the
  SDK (the `mailchannels-js` skill's `webhooks.md`) — always verify before processing events.
- The event payload reference (`processed`, `delivered`, `hard-bounced`, …); it is documented
  in the same SDK resource.
