---
title: Create
titleTemplate: 📢 Webhooks
---

# Create<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/webhooks">📢 Webhooks</a></Badge></llm-exclude>

Enrolls the user to receive event notifications via webhooks.

An optional `failureThreshold` may be supplied in the `options` object to enable failure alerts for
the new webhook. If it is not supplied, no failure threshold is set for the webhook.

If a webhook is already enrolled for this customer, the request returns 409, even when the endpoint
is the same, and the existing webhook is not changed. To set or change the threshold on an enrolled
webhook, use `webhooks.update()`.

`webhooks.create()` can succeed in enrolling the webhook without setting the threshold (the API
answers 201 instead of 204). The SDK returns normally in both cases, so check `webhooks.list()`
afterwards and call `webhooks.update()` if the threshold is missing.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, Webhooks } from '@mailchannels/sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const webhooks = new Webhooks(mailchannels)

const { success, error } = await webhooks.create('https://example.com/webhook', {
  failureThreshold: 1
})
```

```ts [full.ts]
import { MailChannels } from '@mailchannels/sdk'

const mailchannels = new MailChannels('your-api-key')

const { success, error } = await mailchannels.webhooks.create('https://example.com/webhook', {
  failureThreshold: 1
})
```
:::

## Params

- `endpoint` `string` <Badge type="danger">required</Badge>: The URL to receive event notifications.
  Must be no longer than `8000` characters.
- `options` `WebhooksCreateOptions` <Badge type="info">optional</Badge>: The options for webhook
  creation.
  - `failureThreshold` `number | null` <Badge type="info">optional</Badge>: The number of
    consecutive failed deliveries to this webhook before a failure alert is triggered.integer. Must
    be 1 or greater to enable failure alerts. If omitted, `null`, or `0`, no failure threshold is
    set for the webhook.

## Response

- `success` `boolean` <Badge>guaranteed</Badge>: Whether the operation was successful.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/webhooks-method-create.ts
<<< @/snippets/webhooks-create-options.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/success-response.ts
