# MailChannels CLI

The `@mailchannels/sdk` package includes a command-line interface for sending emails and performing Email API operations directly from the terminal.

## Installation

For one-off use, run the CLI with `npx`.

```sh
npx @mailchannels/sdk --help
```

For frequent use, the package also provides `mailchannels` as an alias when installed. Install the package globally to use it directly:

```sh
npm install @mailchannels/sdk -g
mailchannels --help
```

This documentation uses `mailchannels` as the command name.

## Usage

```text
mailchannels <command> [options]
```

Use `--help` at any level to list the available commands and options:

```sh
mailchannels --help
mailchannels emails --help
mailchannels emails queue --help
```

Open the MailChannels documentation in your default browser:

```sh
mailchannels docs
```

## Authentication

Commands that call the Email API require an API key. Provide it with `--api-key`, or set the `MAILCHANNELS_API_KEY` environment variable:

```sh
# In Linux/macOS:
export MAILCHANNELS_API_KEY="your-api-key"

# In Windows PowerShell:
$env:MAILCHANNELS_API_KEY="your-api-key"

# In Windows Command Prompt:
set MAILCHANNELS_API_KEY=your-api-key
```

The flag can be passed directly when needed:

```sh
mailchannels webhooks list \
  --api-key "your-api-key"
```

When both are provided, `--api-key` takes precedence.

| Flag              | Description          | Required                                  |
| ----------------- | -------------------- | ----------------------------------------- |
| `--api-key <key>` | MailChannels API key | Yes if `MAILCHANNELS_API_KEY` is not set. |

## Emails

Send and queue emails.

### Send an email

`mailchannels emails send`

Send an email synchronously:

```sh
mailchannels emails send \
  --from "Sender <sender@example.com>" \
  --to "recipient@example.com" \
  --subject "Test email" \
  --text "Hello from the MailChannels CLI"
```

### Queue an email

`mailchannels emails queue`

Queue an email for asynchronous processing:

```sh
mailchannels emails queue \
  --from "Sender <sender@example.com>" \
  --to "recipient@example.com" \
  --subject "Queued email" \
  --html "<p>This email was queued.</p>"
```

Queued messages are processed asynchronously. Delivery status events are delivered through the webhook system when webhooks are configured.

### Email delivery flags

These options are available for both sending and queuing emails.

| Flag                                         | Description                                 | Required                        | Default |
| -------------------------------------------- | ------------------------------------------- | ------------------------------- | ------- |
| `--from <address>`                           | Sender address                              | Yes                             |         |
| `--to <addresses>`                           | Comma-separated recipient addresses         | Yes                             |         |
| `--subject <subject>`                        | Email subject                               | Yes                             |         |
| `--text <text>`                              | Plain-text message body                     | Yes if no HTML body is provided | Empty   |
| `--text-file <path>` (preferred)             | Path to a plain-text file                   | Yes if no HTML body is provided |         |
| `--html <html>`                              | HTML message body                           | Yes if no text body is provided | Empty   |
| `--html-file <path>` (preferred)             | Path to an HTML file                        | Yes if no text body is provided |         |
| `--cc <addresses>`                           | Comma-separated CC addresses                | No                              |         |
| `--bcc <addresses>`                          | Comma-separated BCC addresses               | No                              |         |
| `--reply-to <address>`                       | Reply-to address                            | No                              |         |
| `--headers <json>`                           | Custom headers as a JSON object             | No                              |         |
| `--attachments` (`-a`)                       | Read a JSON array of attachments from stdin | No                              | `false` |
| `--campaign-id <id>`                         | Campaign identifier                         | No                              |         |
| `--envelope-from <address>`                  | Envelope-from address                       | No                              |         |
| `--dkim-domain <domain>`                     | DKIM signing domain                         | No                              |         |
| `--dkim-selector <selector>`                 | DKIM selector                               | No                              |         |
| `--dkim-private-key <key>`                   | DKIM private key                            | No                              |         |
| `--tracking-click`                           | Enable click tracking                       | No                              | `false` |
| `--tracking-click-custom-domain-name <name>` | Custom domain for click tracking            | No                              |         |
| `--tracking-open`                            | Enable open tracking                        | No                              | `false` |
| `--tracking-open-custom-domain-name <name>`  | Custom domain for open tracking             | No                              |         |
| `--unsubscribe-custom-domain-name <name>`    | Custom domain for unsubscribe links         | No                              |         |
| `--transactional`                            | Mark the message as transactional           | No                              | `true`  |

The `emails send` command also supports:

| Flag        | Description                                        | Default |
| ----------- | -------------------------------------------------- | ------- |
| `--dry-run` | Validate and render the message without sending it | `false` |

### Read email content from files

Prefer `--text-file` and `--html-file` for message bodies, especially for longer content. Reading
from files avoids shell quoting issues and command-line length limits. Use `--text` and `--html` for
short bodies or quick commands. If both forms of a body are provided, the file option takes
precedence.

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.com" \
  --subject "Test Email" \
  --text-file "./emails/hello.txt" \
  --html-file "./emails/hello.html"
```

### Custom headers

Pass headers as a JSON object. Quote the JSON so your shell passes it as one argument:

```sh
mailchannels emails send \
  --from "sender@example.com" \
  --to "recipient@example.com" \
  --subject "Custom header" \
  --text "Hello" \
  --headers '{"X-Custom-Header": "Custom value"}'
```

### Attachments

When `--attachments` is provided, the CLI reads a JSON array from standard input. Every attachment requires `filename` and `content` (must be base64-encoded). Optional properties include `type` (MIME type) and `content_id` (for inline attachments).

```json
[
  {
    "filename": "file_1.txt",
    "content": "dGVzdA==",
    "type": "text/plain",
    "content_id": "test"
  },
  {
    "filename": "file_2.txt",
    "content": "dGVzdDI="
  }
]
```

Save the JSON as a file (e.g., `attachments.json`) and pipe it to the CLI:

```sh
cat attachments.json | mailchannels emails send \
  --from "sender@example.com" \
  --to "recipient@example.com" \
  --subject "Report" \
  --attachments
```

Or using input redirection:

```sh
 mailchannels emails send \
  --from "sender@example.com" \
  --to "recipient@example.com" \
  --subject "Report" \
  --attachments < attachments.json
```

## DKIM

Manage hosted DKIM keys and validate email authentication for a domain.

### Check domain authentication

`mailchannels dkim check-domain`

```sh
mailchannels dkim check-domain \
  --domain "example.com"
```

| Flag                              | Description                                                   | Required |
| --------------------------------- | ------------------------------------------------------------- | -------- |
| `--domain <domain>`               | Domain used for sending email                                 | Yes      |
| `--dkim-domain <domain>`          | Domain used for DKIM verification                             | No       |
| `--dkim-private-key <key>`        | Private key for DKIM verification; requires `--dkim-selector` | No       |
| `--dkim-selector <selector>`      | Selector of the DKIM key to verify                            | No       |
| `--envelope-from-domain <domain>` | Envelope-from domain, if different from `--domain`            | No       |
| `--sender-id <id>`                | Sender ID to check with Domain Lockdown                       | No       |

By default, stored DKIM keys for `--domain` are checked. The command outputs SPF, Domain Lockdown,
Sender Domain, and DKIM results, along with reference links when available.

### List DKIM keys

`mailchannels dkim list`

```sh
mailchannels dkim list \
  --domain "example.com" \
  --limit 10 \
  --offset 0
```

| Flag                       | Description                                                    | Required | Default |
| -------------------------- | -------------------------------------------------------------- | -------- | ------- |
| `--domain <domain>`        | Domain to search                                               | Yes      |         |
| `--selector <selector>`    | Filter by selector                                             | No       |         |
| `--status <status>`        | Filter by status: `active`, `retired`, `revoked`, or `rotated` | No       |         |
| `--include-dns-record`     | Include the suggested DNS TXT record                           | No       | `false` |
| `--limit <number>` (`-l`)  | Maximum number of keys to return                               | No       | `10`    |
| `--offset <number>` (`-o`) | Number of keys to skip                                         | No       | `0`     |

### Create a DKIM key

`mailchannels dkim create`

```sh
mailchannels dkim create \
  --domain "example.com" \
  --selector "mailchannels"
```

| Flag                      | Description                                       | Required | Default |
| ------------------------- | ------------------------------------------------- | -------- | ------- |
| `--domain <domain>`       | Domain for the key pair                           | Yes      |         |
| `--selector <selector>`   | Selector for the key pair                         | Yes      |         |
| `--algorithm <algorithm>` | Key algorithm; currently only `rsa`               | No       | `rsa`   |
| `--length <bits>`         | RSA key length: `1024`, `2048`, `3072`, or `4096` | No       | `2048`  |

The result includes the public key and suggested DNS TXT record. Publish the DNS record yourself.

### Update a DKIM key status

`mailchannels dkim update-status`

```sh
mailchannels dkim update-status \
  --domain "example.com" \
  --selector "mailchannels" \
  --status "retired"
```

| Flag                    | Description                                    | Required |
| ----------------------- | ---------------------------------------------- | -------- |
| `--domain <domain>`     | Domain associated with the key                 | Yes      |
| `--selector <selector>` | Selector of the key to update                  | Yes      |
| `--status <status>`     | New status: `retired`, `revoked`, or `rotated` | Yes      |

### Rotate a DKIM key

`mailchannels dkim rotate`

```sh
mailchannels dkim rotate \
  --domain "example.com" \
  --selector "mailchannels" \
  --new-selector "mailchannels2"
```

| Flag                        | Description                    | Required |
| --------------------------- | ------------------------------ | -------- |
| `--domain <domain>`         | Domain associated with the key | Yes      |
| `--selector <selector>`     | Selector of the active key     | Yes      |
| `--new-selector <selector>` | Selector for the new key pair  | Yes      |

The command prints both key details. Publish the new key's DNS TXT record before the rotated key's
`gracePeriodExpiresAt` time.

## Custom Tracking

Manage branded domains used for click tracking, open tracking, and unsubscribe links.

### List custom tracking domains

```sh
mailchannels custom-tracking list \
  --status active \
  --scope click \
  --limit 100 \
  --offset 0
```

| Flag                       | Description                                        | Required | Default |
| -------------------------- | -------------------------------------------------- | -------- | ------- |
| `--name <name>`            | Filter by custom tracking domain name              | No       |         |
| `--status <status>`        | Filter by status: `active` or `disabled`           | No       |         |
| `--scope <scope>`          | Filter by scope: `click`, `open`, or `unsubscribe` | No       |         |
| `--limit <number>` (`-l`)  | Maximum number of domains to return (1-1000)       | No       | `100`   |
| `--offset <number>` (`-o`) | Number of domains to skip                          | No       | `0`     |

### Create a custom tracking domain

```sh
mailchannels custom-tracking create \
  --name "clickdemo" \
  --hostname "click.example.com" \
  --scope click
```

| Flag                    | Description                                                         | Required |
| ----------------------- | ------------------------------------------------------------------- | -------- |
| `--name <name>`         | Unique label (1-64 lowercase letters, numbers, or hyphens)          | Yes      |
| `--hostname <hostname>` | Tracking hostname with a CNAME pointing to `links.mailchannels.net` | Yes      |
| `--scope <scope>`       | Event type: `click`, `open`, or `unsubscribe`                       | Yes      |

The command prints the registered domain or, when DNS setup is required, the TXT record details and
instructions.

### Update a custom tracking domain

```sh
mailchannels custom-tracking update \
  --hostname "click.example.com" \
  --scope click \
  --name "click-links" \
  --status disabled
```

| Flag                    | Description                                         | Required                      |
| ----------------------- | --------------------------------------------------- | ----------------------------- |
| `--hostname <hostname>` | Hostname of the domain to update                    | Yes                           |
| `--scope <scope>`       | Scope of the domain: `click`, `open`, `unsubscribe` | Yes                           |
| `--name <name>`         | New custom tracking domain label                    | One of `--name` or `--status` |
| `--status <status>`     | New status: `active` or `disabled`                  | One of `--name` or `--status` |

Re-activating a domain may require DNS verification. The command prints the required DNS record
details when verification is pending.

### Delete a custom tracking domain

```sh
mailchannels custom-tracking delete \
  --hostname "click.example.com" \
  --scope click
```

| Flag                    | Description                                         | Required |
| ----------------------- | --------------------------------------------------- | -------- |
| `--hostname <hostname>` | Hostname of the domain to delete                    | Yes      |
| `--scope <scope>`       | Scope of the domain: `click`, `open`, `unsubscribe` | Yes      |

Deleting a domain immediately stops previously sent emails' tracking links and unsubscribe URLs from
working.

## Metrics

### Time-series metrics

```sh
mailchannels metrics engagement
mailchannels metrics performance
mailchannels metrics recipient-behaviour
mailchannels metrics volume
```

```sh
mailchannels metrics engagement \
  --start-time "2026-10-01" \
  --end-time "2026-11-01" \
  --interval "day" \
  --campaign-id "spring-campaign"
```

The `engagement`, `performance`, `recipient-behaviour`, and `volume` commands accept these optional
filters:

| Flag                      | Description                         | Default       |
| ------------------------- | ----------------------------------- | ------------- |
| `--start-time <datetime>` | Inclusive start of the time range   | One month ago |
| `--end-time <datetime>`   | Exclusive end of the time range     | Current time  |
| `--campaign-id <id>`      | Filter metrics to a campaign        | All campaigns |
| `--interval <interval>`   | Bucket interval for metrics reports | `day`         |

### Sender metrics

Retrieve metrics for campaigns or sub-accounts

`mailchannels metrics senders`

```sh
mailchannels metrics senders \
  --type "campaigns" \
  --start-time "2026-10-01" \
  --limit 25 \
  --sort-order "desc"
```

The sender metrics command supports these flags:

| Flag                       | Description                                     | Required | Default       |
| -------------------------- | ----------------------------------------------- | -------- | ------------- |
| `--type <type>`            | Sender group: `campaigns` or `sub-accounts`     | Yes      | None          |
| `--start-time <datetime>`  | Inclusive start of the time range               | No       | One month ago |
| `--end-time <datetime>`    | Exclusive end of the time range                 | No       | Current time  |
| `--limit <number>` (`-l`)  | Number of senders to return (1-1000)            | No       | `10`          |
| `--offset <number>` (`-o`) | Number of senders to skip                       | No       | `0`           |
| `--sort-order <order>`     | Sort by total messages; accepts `asc` or `desc` | No       | `desc`        |

## Suppressions

Manage account suppressions list.

### Create suppression entries

`mailchannels suppressions create`

Create a single suppression entry:

```sh
mailchannels suppressions create \
  --recipient "recipient@example.com" \
  --types "non-transactional" \
  --notes "Opted out through the preference center" \
  --add-to-sub-accounts
```

| Flag                          | Description                                          | Required                             | Default |
| ----------------------------- | -----------------------------------------------------| ------------------------------------ | ------- |
| `--recipient <address>`       | Recipient to suppress for a single entry             | Yes if `--entries` is not provided   |         |
| `--types <types>`             | Comma-separated suppression types for a single entry | No                                   |         |
| `--notes <notes>`             | Optional note for a single entry                     | No                                   |         |
| `--entries`                   | Read a JSON array of suppression entries from stdin  | Yes if `--recipient` is not provided | `false` |
| `--add-to-sub-accounts`       | Create entries for all associated sub-accounts       | No                                   | `false` |

The supported suppression types are `transactional` and `non-transactional`.

When both `--entries` and `--recipient` are provided, `--entries` takes precedence ignoring  `--recipient`, `--types`, and `--notes`.

#### Bulk creation

For bulk creation, the CLI reads a JSON array from standard input when `--entries` is provided.

Every entry requires `recipient`. Optional properties include `types` and `notes`.

```json
[
  {
    "recipient": "recipient1@example.com",
    "types": ["non-transactional"],
    "notes": "Opted out through the preference center"
  },
  {
    "recipient": "recipient2@example.com",
    "types": ["transactional", "non-transactional"]
  }
]
```

Save the JSON as a file (for example, `suppressions.json`) and pipe it to the CLI:

```sh
cat suppressions.json | mailchannels suppressions create \
  --entries \
  --add-to-sub-accounts
```

Or use input redirection:

```sh
mailchannels suppressions create \
  --add-to-sub-accounts \
  --entries < suppressions.json
```

### List suppression entries

`mailchannels suppressions list`

```sh
mailchannels suppressions list \
  --source "api" \
  --limit 100 \
  --offset 0
```

| Flag                          | Description                             | Required |
| ----------------------------- | ----------------------------------------| -------- |
| `--recipient <address>`       | Filter by recipient                     | No       |
| `--source <source>`           | Filter by suppression source            | No       |
| `--created-after <datetime>`  | Return entries created after this date  | No       |
| `--created-before <datetime>` | Return entries created before this date | No       |
| `--limit <number>`, `-l`      | Maximum number of entries to return     | No       |
| `--offset <number>`, `-o`     | Number of entries to skip               | No       |

Results are printed as a table. The default pagination is a limit of `1000` and an offset of `0`.

### Delete a suppression entry

`mailchannels suppressions delete`

```sh
mailchannels suppressions delete \
  --recipient "recipient@example.com" \
  --source "api"
```

| Flag                    | Description                                         | Required | Default |
| ----------------------- | --------------------------------------------------- | -------- | ------- |
| `--recipient <address>` | Recipient whose suppression entry should be deleted | Yes      |         |
| `--source <source>`     | The source of the suppression entry to be deleted   | No       | `api`   |

Possible values for `--source` are `api`, `unsubscribe_link`, `list_unsubscribe`, `hard_bounce`, `spam_complaint`, or `all`.

If `--source` is set to `all`, all suppression entries related to the specified recipient will be deleted.

## Sub-Accounts

Manage sub-accounts associated with your parent account.

### Create a sub-account

`mailchannels sub-accounts create`

```sh
mailchannels sub-accounts create \
  --company-name "Acme Corporation" \
  --handle "acme"
```

| Flag                    | Description                      | Required |
| ----------------------- | -------------------------------- | -------- |
| `--company-name <name>` | Company name for the sub-account | Yes      |
| `--handle <handle>`     | Unique lowercase alphanumeric ID | No       |

If `--handle` is omitted, a random handle will be generated.

### List sub-accounts

`mailchannels sub-accounts list`

```sh
mailchannels sub-accounts list \
  --limit 100 \
  --offset 0 \
```

| Flag                       | Description                | Required |
| -------------------------- | -------------------------- | -------- |
| `--limit <number>` (`-l`)  | Maximum number of accounts | No       |
| `--offset <number>` (`-o`) | Number of accounts to skip | No       |

The default pagination is a limit of `1000` and an offset of `0`.

### Delete, suspend, or activate a sub-account

```sh
mailchannels sub-accounts delete --handle "acme"
mailchannels sub-accounts suspend --handle "acme"
mailchannels sub-accounts activate --handle "acme"
```

| Flag                    | Description        | Required |
| ----------------------- | ------------------ | -------- |
| `--handle <handle>`     | Sub-account handle | Yes      |

Suspending disables email sending for the sub-account; activating restores it.

### Retrieve sub-account usage

`mailchannels sub-accounts usage`

```sh
mailchannels sub-accounts usage --handle "acme"
```

| Flag                    | Description        | Required |
| ----------------------- | ------------------ | -------- |
| `--handle <handle>`     | Sub-account handle | Yes      |

The result includes usage and the effective monthly limit for the current billing period.

### Manage sub-account limit

```sh
mailchannels sub-accounts limit get --handle "acme"
mailchannels sub-accounts limit set --handle "acme" --sends 5000
mailchannels sub-accounts limit delete --handle "acme"
```

All limit commands require `--handle`.

#### Set sub-account limit flags

| Flag                    | Description        | Required |
| ----------------------- | ------------------ | -------- |
| `--handle <handle>`     | Sub-account handle | Yes      |
| `--sends <number>`      | Maximum sends      | Yes      |

### Manage sub-account API keys

```sh
mailchannels sub-accounts api-keys create --handle "acme"
mailchannels sub-accounts api-keys list --handle "acme" --limit 50 --offset 0
mailchannels sub-accounts api-keys delete --handle "acme" --id 123
```

All API keys commands require `--handle`.

#### Retrieve sub-account API keys flags

`mailchannels sub-accounts api-keys list`

| Flag                       | Description                | Required |
| -------------------------- | -------------------------- | -------- |
| `--handle <handle>`        | Sub-account handle         | Yes      |
| `--limit <number>` (`-l`)  | Maximum number of API keys | No       |
| `--offset <number>` (`-o`) | Number of API keys to skip | No       |

The default pagination is a limit of `100` and an offset of `0`.

#### Delete sub-account API keys flags

`mailchannels sub-accounts api-keys delete`

| Flag                | Description        | Required |
| ------------------- | ------------------ | -------- |
| `--handle <handle>` | Sub-account handle | Yes      |
| `--id <id>`         | API key ID         | Yes      |

### Manage sub-account SMTP passwords

```sh
mailchannels sub-accounts smtp-passwords create --handle "acme"
mailchannels sub-accounts smtp-passwords list --handle "acme"
mailchannels sub-accounts smtp-passwords delete --handle "acme" --id 123
```

All SMTP passwords commands require `--handle`.

#### Delete sub-account SMTP passwords flags

`mailchannels sub-accounts smtp-passwords delete`

| Flag                | Description        | Required |
| ------------------- | ------------------ | -------- |
| `--handle <handle>` | Sub-account handle | Yes      |
| `--id <id>`         | SMTP password ID   | Yes      |

## Usage Stats

Retrieve usage stats for the authenticated account:

```sh
mailchannels usage
```

The result includes the current billing-period dates, total usage, and effective monthly limit.

## Webhooks

Register webhook endpoints to receive notifications about email delivery events.

### Create a webhook

`mailchannels webhooks create`

Register a webhook endpoint:

```sh
mailchannels webhooks create \
  --endpoint "https://example.com/mailchannels/webhook"
```

| Flag                      | Description          | Required |
| ------------------------- | -------------------- | -------- |
| `--endpoint <url>` (`-e`) | Webhook endpoint URL | Yes      |

### List webhooks

```sh
mailchannels webhooks list
```

Registered endpoints are printed as a table. If none are registered, the CLI reports that no webhooks were found.

### Delete all webhooks

`mailchannels webhooks delete-all`

Delete all registered webhook endpoints:

```sh
mailchannels webhooks delete-all
```

### Validate webhooks

`mailchannels webhooks validate`

Validate enrolled endpoints, optionally using a request ID:

```sh
mailchannels webhooks validate \
  --request-id "1234567890"
```

| Flag                       | Description                      | Required |
| -------------------------- | -------------------------------- | -------- |
| `--request-id <id>` (`-r`) | Request ID to use for validation | No       |

The result includes each endpoint's validation result and response status.

### Retrieve webhook batches

`mailchannels webhooks batches`

Retrieve delivery batches with optional filters and pagination:

```sh
mailchannels webhooks batches \
  --created-after "2026-06-01" \
  --created-before "2026-06-15" \
  --statuses "2xx,5xx" \
  --webhook "https://example.com/webhooks/mailchannels" \
  --limit 50 \
  --offset 0
```

| Flag                                  | Description                                         | Required |
| ------------------------------------- | --------------------------------------------------- | -------- |
| `--created-after <datetime>`          | Return batches created after this date              | No       |
| `--created-before <datetime>`         | Return batches created before this date             | No       |
| `--statuses <statuses>`, `-s`         | Comma-separated response status groups to filter by | No       |
| `--webhook <url>`, `-e`, `--endpoint` | Filter by webhook endpoint                          | No       |
| `--limit <number>`, `-l`              | Maximum number of batches to return                 | No       |
| `--offset <number>`, `-o`             | Number of batches to skip                           | No       |

Results are printed as a table. The default pagination is a limit of `500` and an offset of `0`.

### Resend a webhook batch

`mailchannels webhooks resend-batch`

Resend a webhook batch by its ID:

```sh
mailchannels webhooks resend-batch \
  --batch-id "1234567890"
```

| Flag                    | Description        | Required |
| ----------------------- | ------------------ | -------- |
| `--batch-id <id>`, `-b` | Batch ID to resend | Yes      |

The CLI prints the response returned after the batch is queued for resend.

## Local Simulator

See the [Local Simulator](./simulator.md) page for instructions and limitations on running the simulator with the CLI.

## Exit behavior

The CLI exits with exit code `1` when required input is missing or invalid, an API request fails, or an operation cannot be completed.
