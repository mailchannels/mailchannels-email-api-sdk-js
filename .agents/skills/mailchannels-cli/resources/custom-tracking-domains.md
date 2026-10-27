# Custom Tracking Domains

Register your own hostname for click tracking, open tracking, or unsubscribe links instead of
MailChannels' shared domains. Once a domain is `active`, select it by its **`name`** when
sending with `--tracking-click-custom-domain-name`, `--tracking-open-custom-domain-name`, or
`--unsubscribe-custom-domain-name` — see [sending](sending.md#custom-tracking-domains).

All commands live under `mailchannels custom-tracking`.

## Register A Domain

```sh
mailchannels custom-tracking create \
  --name "clickdemo" \
  --hostname "click.example.com" \
  --scope click
```

| Flag | Description | Required |
| --- | --- | --- |
| `--name <name>` | Unique label used at send time: 1–64 lowercase letters, numbers, or hyphens (`^[a-z0-9-]+$`). | Yes |
| `--hostname <hostname>` | Tracking hostname, which needs a CNAME pointing to `links.mailchannels.net`. | Yes |
| `--scope <scope>` | Event type the domain handles: `click`, `open`, or `unsubscribe`. | Yes |

Before registration can complete, two DNS records must be in place:

1. A **CNAME** at `<hostname>` pointing to `links.mailchannels.net`.
2. A **TXT** record at `_mailchannels-verify.<hostname>` containing the verification token the
   API returns when DNS setup is required.

## DNS Verification Is A Two-Step, Non-Error Flow

`create` (and `update` when re-activating a disabled domain) ends one of two ways. Both exit `0`:

- **Registered** — `Dns Setup Required` is `false` and the output lists `Name`, `Hostname`,
  `Scope`, `Status`, and `Created At`:

  ```text
  [MailChannels-CLI] [Custom Tracking] Custom tracking domain created successfully:
    Dns Setup Required  false
    Name                'clickdemo'
    Hostname            'click.example.com'
    Scope               'click'
    Status              'active'
    Created At          '2026-10-27T16:21:38.03247709Z'
  ```

- **DNS setup required** — `Dns Setup Required` is `true`, and the output carries `Token`,
  `Txt Record Name`, `Txt Record Value`, and `Instructions` (a CNAME-only failure can omit the
  TXT fields). `create` says `DNS setup required to complete domain creation.`

When setup is required, add the TXT record alongside the CNAME, wait for propagation, then run
the **same** `create` command again.

If DNS is still incomplete on that retry, MailChannels answers with a real error: the command
exits `1`, prints the error, and then prints the instructions it received:

```text
[MailChannels-CLI] [Custom Tracking] DNS verification incomplete. …
[MailChannels-CLI] [Custom Tracking] Instructions: …
```

## List

```sh
mailchannels custom-tracking list \
  --status active \
  --scope click \
  --limit 100 \
  --offset 0
```

| Flag | Description | Required | Default |
| --- | --- | --- | --- |
| `--name <name>` | Filter by custom tracking domain name. | No | |
| `--status <status>` | Filter by status: `active` or `disabled`. | No | |
| `--scope <scope>` | Filter by scope: `click`, `open`, or `unsubscribe`. | No | |
| `--limit <number>`, `-l` | Maximum domains to return (1–1000). | No | `100` |
| `--offset <number>`, `-o` | Number of domains to skip. | No | `0` |

With no matches the CLI prints `[Custom Tracking] No custom tracking domains found.` and exits
`0`.

## Update

```sh
mailchannels custom-tracking update \
  --hostname "click.example.com" \
  --scope click \
  --status disabled
```

| Flag | Description | Required |
| --- | --- | --- |
| `--hostname <hostname>` | Hostname of the domain to update. | Yes |
| `--scope <scope>` | Scope of the domain: `click`, `open`, or `unsubscribe`. | Yes |
| `--name <name>` | New domain label. | One of `--name` or `--status` |
| `--status <status>` | New status: `active` or `disabled`. | One of `--name` or `--status` |

Providing neither `--name` nor `--status` fails with
`At least one of 'name' or 'status' must be provided.`

`update` always prints `Custom tracking domain updated successfully:` — **even when re-activating
a domain whose DNS verification has lapsed**. Check the `Dns Setup Required` field in the output:
when it is `true`, follow the same DNS flow as for `create`.

## Delete

```sh
mailchannels custom-tracking delete \
  --hostname "click.example.com" \
  --scope click
```

| Flag | Description | Required |
| --- | --- | --- |
| `--hostname <hostname>` | Hostname of the domain to delete. | Yes |
| `--scope <scope>` | Scope of the domain: `click`, `open`, or `unsubscribe`. | Yes |

Deleting a domain takes effect immediately — tracking links and unsubscribe URLs already sent
using that domain stop working right away. Confirm with the user first. The domain can be
re-registered later.
