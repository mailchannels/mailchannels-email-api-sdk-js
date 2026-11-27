---
title: List
titleTemplate: 📢 Webhooks
---

# List<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/webhooks">📢 Webhooks</a></Badge></llm-exclude>

Lists all the webhook endpoints that are enrolled to receive event notifications.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, Webhooks } from '@mailchannels/sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const webhooks = new Webhooks(mailchannels)

const { data, error } = await webhooks.list()
```

```ts [full.ts]
import { MailChannels } from '@mailchannels/sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.webhooks.list()
```
:::

## Response

- `data` `object[] | null` <Badge type="warning">nullable</Badge>
  - `webhook` `string` <Badge>guaranteed</Badge>: A customer's webhook that events will be sent to.
  - `failureThreshold` `number | null` <Badge type="info">optional</Badge>: The number of consecutive
    failed deliveries to this webhook before a failure alert is triggered. No value means failure
    alerts are disabled for this webhook. A value of `1` means an alert is triggered on every
    failure.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/webhooks-method-list.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/data-response.ts

**List type declarations**

<<< @/snippets/webhooks-list-response.ts
