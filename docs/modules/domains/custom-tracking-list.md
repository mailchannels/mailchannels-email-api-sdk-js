---
title: List Custom Tracking Domains
titleTemplate: 🌐 Domains
---

# List Custom Tracking Domains<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/domains">🌐 Domains</a></Badge></llm-exclude>

Retrieve all custom tracking domains registered under your account.
Optional filters include domain name, status, scope, limit and offset.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, Domains } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const domains = new Domains(mailchannels)

const { data, error } = await domains.customTracking.list({
  status: 'active'
})
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.domains.customTracking.list({
  status: 'active'
})
```
:::

## Params

- `options` `DomainsCustomTrackingListOptions` <Badge type="info">optional</Badge>: Optional filter options.
  - `name` `string` <Badge type="info">optional</Badge>: Filter by custom tracking domain label.
  - `status` `"active" | "disabled"` <Badge type="info">optional</Badge>: Filter by status.
  - `scope` `DomainsCustomTrackingScope` <Badge type="info">optional</Badge>: Filter by scope (`click`, `open`, `unsubscribe`).
  - `limit` `number` <Badge type="info">optional</Badge>: Maximum number of domains to return (1–1000). Default: 100.
  - `offset` `number` <Badge type="info">optional</Badge>: Number of domains to skip before returning results. Default: 0.

## Response

- `data` `object | null` <Badge type="warning">nullable</Badge>: List of custom tracking domains matching the filter. Empty if no domains match the filter.
  - `customTrackingDomains` `DomainsCustomTrackingDomain[]` <Badge>guaranteed</Badge>: List of custom tracking domains matching the filter criteria.
    - `name` `string` <Badge>guaranteed</Badge>: The label for this custom tracking domain.
    - `hostname` `string` <Badge>guaranteed</Badge>: The registered domain hostname.
    - `scope` `DomainsCustomTrackingScope` <Badge>guaranteed</Badge>: The event type this domain handles (`click`, `open`, `unsubscribe`).
    - `status` `"active" | "disabled"` <Badge>guaranteed</Badge>: Current status of the custom tracking domain.
    - `createdAt` `string` <Badge>guaranteed</Badge>: ISO 8601 timestamp when the domain was registered.
  - `total` `number` <Badge>guaranteed</Badge>: Total number of custom tracking domains.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/domains-custom-tracking-method-list.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/data-response.ts

**Custom Tracking Domain type declarations**

<<< @/snippets/domains-custom-tracking-scope.ts
<<< @/snippets/domains-custom-tracking-domain.ts

**List Custom Tracking Domains response type declarations**

<<< @/snippets/domains-custom-tracking-list-options.ts
<<< @/snippets/domains-custom-tracking-list-response.ts
