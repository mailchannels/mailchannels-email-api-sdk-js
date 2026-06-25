---
title: Create Custom Tracking Domain
titleTemplate: 🌐 Domains
---

# Create Custom Tracking Domain<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/domains">🌐 Domains</a></Badge></llm-exclude>

Register a custom branded domain for click tracking, open tracking, or unsubscribe handling. By default, MailChannels uses shared domains for these links. Using a custom domain improves brand consistency by replacing shared domains with your own (e.g., `click.example.com`). Once registered, select the domain at send time using its `name`.

Before registration completes, two DNS records must be in place:

1. A TXT record at `_mailchannels-verify.<hostname>` containing the verification token (returned when DNS setup is required).
2. A CNAME record at `<hostname>` pointing to `links.mailchannels.net`.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, Domains } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const domains = new Domains(mailchannels)

const { data, error } = await domains.customTracking.create({
  name: 'clickdemo',
  hostname: 'click.example.com',
  scope: 'click'
})

if (error) {
  throw new Error(error.message)
}

if (data.dnsSetupRequired) {
  // DNS setup required types available here
}
else {
  // Domain types available here
}
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.domains.customTracking.create({
  name: 'clickdemo',
  hostname: 'click.example.com',
  scope: 'click'
})

if (error) {
  throw new Error(error.message)
}

if (data.dnsSetupRequired) {
  // DNS setup required types available here
}
else {
  // Domain types available here
}
```
:::

## Params

- `options` `DomainsCustomTrackingCreateOptions` <Badge type="danger">required</Badge>: Create options.
  - `name` `string` <Badge type="danger">required</Badge>: A unique label used to select this domain at message send time.
    > [!IMPORTANT]
    > Maximum length is `64` characters. Must match the pattern `^[a-z0-9-]+$`.
  - `hostname` `string` <Badge type="danger">required</Badge>: The hostname to register as a custom tracking domain. The hostname must have a CNAME record pointing to `links.mailchannels.net`.
  - `scope` `DomainsCustomTrackingScope` <Badge type="danger">required</Badge>: The event type this domain handles (`click`, `open`, `unsubscribe`).

## Response

- `data` `DomainsCustomTrackingWithDnsSetupRequired | null` <Badge type="warning">nullable</Badge>: The created domain or DNS verification info when pending.
  - When DNS setup is complete:
    - `dnsSetupRequired` `false` <Badge>guaranteed</Badge>: Whether DNS setup is required for this domain.
    - `name` `string` <Badge>guaranteed</Badge>: The label for this custom tracking domain.
    - `hostname` `string` <Badge>guaranteed</Badge>: The registered domain hostname.
    - `scope` `DomainsCustomTrackingScope` <Badge>guaranteed</Badge>: The event type this domain handles (`click`, `open`, `unsubscribe`).
    - `status` `"active" | "disabled"` <Badge>guaranteed</Badge>: Current status of the custom tracking domain.
    - `createdAt` `string` <Badge>guaranteed</Badge>: ISO 8601 timestamp when the domain was registered.
  - When DNS setup is required:
    - `dnsSetupRequired` `true` <Badge>guaranteed</Badge>: Whether DNS setup is required for this domain.
    - `token` `string` <Badge type="info">optional</Badge>: UUID v4 nonce; also the TXT record value to set. Present only when TXT ownership verification is pending.
    - `txtRecordName` `string` <Badge type="info">optional</Badge>: Fully-qualified DNS TXT record name to add. Present only when TXT ownership verification is pending.
    - `txtRecordValue` `string` <Badge type="info">optional</Badge>: Value for the DNS TXT record. Present only when TXT ownership verification is pending.
    - `instructions` `string` <Badge type="info">optional</Badge>: Human-readable guidance for the DNS records that must be in place before retrying.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/domains-custom-tracking-method-create.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/data-response.ts

**Custom Tracking Domain type declarations**

<<< @/snippets/domains-custom-tracking-scope.ts
<<< @/snippets/domains-custom-tracking-domain.ts

**Create Custom Tracking Domain type declarations**

<<< @/snippets/domains-custom-tracking-create-options.ts
<<< @/snippets/domains-custom-tracking-dns-setup-required.ts
<<< @/snippets/domains-custom-tracking-with-dns-setup-required.ts
<<< @/snippets/domains-custom-tracking-create-response.ts
