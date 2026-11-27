---
title: Update
titleTemplate: 📢 Webhooks
---

# Update<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/webhooks">📢 Webhooks</a></Badge></llm-exclude>

Updates settings on an enrolled webhook.

Currently, `failureThreshold` is the only setting, and it must be included in the request body. To
remove the threshold and disable failure alerts, use `webhooks.deleteFailureThreshold()`.

## Usage

::: code-group

```ts [modular.ts]
import { MailChannelsClient, Webhooks } from '@mailchannels/sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const webhooks = new Webhooks(mailchannels)

const { success, error } = await webhooks.update('https://example.com/webhook', 2)
```

```ts [full.ts]
import { MailChannels } from '@mailchannels/sdk'

const mailchannels = new MailChannels('your-api-key')

const { success, error } = await mailchannels.webhooks.update('https://example.com/webhook', 2)
```

:::

## Params

- `endpoint` `string` <Badge type="danger">required</Badge>: The URL of the webhook endpoint to
  update.
- `failureThreshold` `number` <Badge type="danger">required</Badge>: The new failure threshold for
  the webhook.

## Response

- `success` `boolean` <Badge>guaranteed</Badge> indicates whether the update succeeded.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/webhooks-method-update.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/success-response.ts
