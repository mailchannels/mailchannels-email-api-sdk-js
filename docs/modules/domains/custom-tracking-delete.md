---
title: Delete Custom Tracking Domain
titleTemplate: 🌐 Domains
---

# Delete Custom Tracking Domain<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/domains">🌐 Domains</a></Badge></llm-exclude>

Permanently delete an existing custom tracking domain for the given hostname and scope. The domain can be re-registered if needed.

> [!WARNING]
> Any tracking links or unsubscribe URLs in previously sent emails using this domain will stop working immediately.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, Domains } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const domains = new Domains(mailchannels)

const { success, error } = await domains.customTracking.delete('click.example.com', 'click')
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { success, error } = await mailchannels.domains.customTracking.delete('click.example.com', 'click')
```
:::

## Params

- `hostname` `string` <Badge type="danger">required</Badge>: The hostname of the custom tracking domain to delete.
- `scope` `DomainsCustomTrackingScope` <Badge type="danger">required</Badge>: The scope of the custom tracking domain to delete (`click`, `open`, `unsubscribe`).

## Response

- `success` `boolean` <Badge>guaranteed</Badge>: Whether the operation was successful.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/domains-custom-tracking-method-delete.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/success-response.ts

**Custom Tracking Domain type declarations**

<<< @/snippets/domains-custom-tracking-scope.ts
