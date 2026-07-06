---
title: Update Custom Tracking Domain
titleTemplate: 🌐 Domains
---

# Update Custom Tracking Domain<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/domains">🌐 Domains</a></Badge></llm-exclude>

Update an existing custom tracking domain by its hostname and scope. Supports updating the custom tracking domain's name or toggling its active status.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, Domains } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const domains = new Domains(mailchannels)

const { data, error } = await domains.customTracking.update('click.example.com', 'click', {
  name: 'newclickname',
  status: 'active'
})

if (error) {
  throw new Error(error.message)
}

if (data.dnsSetupRequired) {
  // DNS setup required fields available here
}
else {
  // Domain fields available here
}
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.domains.customTracking.update('click.example.com', 'click', {
  name: 'newclickname',
  status: 'active'
})

if (error) {
  throw new Error(error.message)
}

if (data.dnsSetupRequired) {
  // DNS setup required fields available here
}
else {
  // Domain fields available here
}
```
:::

## Params

- `hostname` `string` <Badge type="danger">required</Badge>: The hostname of the custom tracking domain to update.
- `scope` `DomainsCustomTrackingScope` <Badge type="danger">required</Badge>: The scope of the custom tracking domain to update (`click`, `open`, `unsubscribe`).
- `options` `DomainsCustomTrackingUpdateOptions` <Badge type="danger">required</Badge>: The options for updating the custom tracking domain.
  - `name` `string` <Badge type="info">optional</Badge>: New label for this custom tracking domain.
    > [!IMPORTANT]
    > Maximum length is `64` characters. Must match the pattern `^[a-z0-9-]+$`.
  - `status` `"active" | "disabled"` <Badge type="info">optional</Badge>: New status. Re-activation requires DNS verification — add the TXT record and CNAME record described in the response body, then retry.

## Response

- `data` `DomainsCustomTrackingWithDnsSetupRequired | null` <Badge type="warning">nullable</Badge>: The updated domain or DNS verification info when pending.
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

<<< @/snippets/domains-custom-tracking-method-update.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/data-response.ts

**Custom Tracking Domain type declarations**

<<< @/snippets/domains-custom-tracking-scope.ts
<<< @/snippets/domains-custom-tracking-domain.ts

**Update Custom Tracking Domain type declarations**

<<< @/snippets/domains-custom-tracking-update-options.ts
<<< @/snippets/domains-custom-tracking-dns-setup-required.ts
<<< @/snippets/domains-custom-tracking-with-dns-setup-required.ts
<<< @/snippets/domains-custom-tracking-update-response.ts
