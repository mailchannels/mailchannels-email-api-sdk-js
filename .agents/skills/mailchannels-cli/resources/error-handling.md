# Error Handling

Every failure ends the same way: one line on **stderr** and exit code `1`.

```text
[MailChannels-CLI] [<Area>] <message>
```

The message is the SDK's `error.message`. The CLI does **not** print the error `type` or the
HTTP status code, so infer them from the wording. (The `mailchannels-js` skill's
`error-handling.md` lists the error types and the statuses behind them.) Failures raised before
a command's own code runs — a missing API key, argument-parsing errors — have no `[<Area>]`
tag.

## Where Failures Come From

| Source | Examples | Happens |
| --- | --- | --- |
| Argument parsing | `Missing required argument: --to`, `Unknown command bogus` (usage text goes to stdout) | Before anything runs. |
| CLI pre-flight | `Missing API key. …`, `Invalid JSON for '--headers'`, `'--attachments' requires JSON input piped to stdin.`, unreadable `--text-file` | Before any request. |
| SDK validation | `Interval must be one of 'hour', 'day', 'week', 'month'.`, `The limit value must be between 1 and 100.` | Before any request. |
| API response | `Invalid API key.`, conflicts, `User does not have access to this feature.` | After the request. |
| Network or runtime | Connection failures, the 120-second timeout | During the request. |

## Common Messages

| Message | Cause and fix |
| --- | --- |
| `Missing API key. Provide it using the '--api-key' flag or set the 'MAILCHANNELS_API_KEY' environment variable.` | No key. Set the variable or pass `-k`. See [authentication](authentication.md). |
| `Missing required argument: --<flag>` | A required flag was omitted. The command's usage is printed above it. |
| `Unknown command <name>` | Misspelled command or group. Run `mailchannels --help`. |
| `Invalid API key.` | The key is wrong, revoked, or belongs to another account. |
| `User does not have access to this feature.` | The account lacks access to what the command uses (for example sending or domain checks). Not retryable. |
| `No email content provided` | Neither `--text` nor `--html` (nor a `-file` form) was given. |
| `No recipients provided. …` | Every `--to` address was malformed, so none survived parsing. |
| `No sender provided. Use the 'from' option to specify a sender.` | `--from` isn't a valid address. |
| `Non-transactional messages must be DKIM signed.` | `--no-transactional` without `--dkim-selector`. See [sending](sending.md#transactional-and-non-transactional). |
| `Non-transactional messages must have exactly one recipient per personalization.` | `--no-transactional` with more than one address across `--to`/`--cc`/`--bcc`. |
| `Root headers cannot include the reserved header '<name>'.` | A reserved header in `--headers`; use the matching flag. |
| `Invalid click tracking: The custom tracking domain name must match ^[a-z0-9-]+$` | A custom-domain flag was given the hostname or an invalid label instead of the `name`. |
| `The '<field>' value is not a valid date.` | A datetime flag isn't `YYYY-MM-DD` or ISO-8601 with `Z`/an offset. The field is `startTime`, `endTime`, `createdAfter`, or `createdBefore`. |
| `The limit value must be between 1 and N.` / `… must be an integer.` | `--limit` is out of range or not a whole number. Maximums are in [output-format](output-format.md#pagination). |
| `Source must be one of …`, `Scope must be one of …`, `Interval must be one of …`, `Sender type must be one of …`, `Sort order must be one of …`, `Status must be one of …` | A flag value outside its allowed set; the message lists the allowed values. |
| `Invalid handle. Sub-account handle must be between 3 and 128 characters and contain only lowercase letters and numbers.` | Fix the `--handle`. |
| `… already exists`, `… already enrolled …`, `Conflict. …`, `Key pair already created for domain, and selector.` | HTTP 409. The resource exists already; don't retry. |
| `… not found.` | HTTP 404. Check the handle, hostname, selector, or ID. Use the matching `list` command. |
| `The total message size should not exceed 30MB. …` | HTTP 413. Shrink the attachments or split the send. |

## What To Retry

| Failure | Retry? |
| --- | --- |
| Missing or invalid flags, validation messages, `Invalid API key.`, access denied, conflicts, payload too large | **No.** The caller must fix the input or credentials. |
| Rate limiting, server errors, network failures, timeouts | Yes, after backing off. The CLI has no built-in retry. |

Rate-limit (429) and server (5xx) responses reach you as generic wording such as
`Unknown error.` plus whatever detail the API sent — the status code is not printed. Treat an
unexplained failure as possibly transient.

**Don't blindly re-run `emails send` or `emails queue`.** There are no idempotency keys, so a
timeout or error may still have delivered the message. Check `webhooks batches` or
`metrics volume --campaign-id …` (see [metrics-and-usage](metrics-and-usage.md)) before sending
again.

## Warnings

Non-fatal warnings go to stderr and do not change the exit code:

- Both `--text` and `--text-file` (or `--html` and `--html-file`) — the file wins.
- `suppressions create --entries` together with `--recipient`, `--types`, or `--notes` — the
  entries win and the rest are ignored.

## Unexpected Crashes

Input the CLI doesn't validate can surface as an uncaught exception: a line such as
`[MailChannels-CLI] TypeError: inputAttachments.map is not a function` followed by a stack
trace, and exit code `1`. That particular one means the attachments JSON was an object, not an
array — see [attachments](attachments.md#errors). Fix the input rather than the CLI.

## Debugging Checklist

1. Run the command with `--help` and confirm every flag you used exists — unknown flags are
   ignored, so a misspelled flag fails silently.
2. Confirm the key works with a read-only call such as `mailchannels usage`.
3. Check shell quoting, especially JSON on PowerShell and cmd.exe
   ([overview](overview.md#json-in-a-flag)).
4. Shrink the command to the smallest one that still fails.
5. For API wording you don't recognise, look up the status in the `mailchannels-js` skill's
   `error-handling.md`.
