---
title: Remove Failure Threshold
titleTemplate: 📢 Webhooks
---

# Remove Failure Threshold<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/webhooks">📢 Webhooks</a></Badge></llm-exclude>

Removes the `failureThreshold` from an enrolled webhook, disabling failure alerts for that webhook.
The webhook itself remains enrolled and continues to receive events.

## Usage

::: code-group

```ts [modular.ts]
import { MailChannelsClient, Webhooks } from '@mailchannels/sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const webhooks = new Webhooks(mailchannels)

const endpoint = 'https://example.com/webhook'
const { success, error } = await webhooks.deleteFailureThreshold(endpoint)
```

```ts [full.ts]
import { MailChannels } from '@mailchannels/sdk'

const mailchannels = new MailChannels('your-api-key')

const endpoint = 'https://example.com/webhook'
const { success, error } = await mailchannels.webhooks.deleteFailureThreshold(endpoint)
```

:::

## Params

- `endpoint` `string` <Badge type="danger">required</Badge>: The URL of the webhook endpoint to
  remove the failure threshold from.

## Response

- `success` `boolean` <Badge>guaranteed</Badge> indicates whether the removal succeeded.

<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/webhooks-method-delete-failure-threshold.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/success-response.ts
