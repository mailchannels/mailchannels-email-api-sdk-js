---
title: Delete API Key
titleTemplate: 🪪 Sub-Accounts
---

# Delete API Key<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/sub-accounts">🪪 Sub-Accounts</a></Badge></llm-exclude>

Deletes the API key identified by its ID for the specified sub-account.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, SubAccounts } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const subAccounts = new SubAccounts(mailchannels)

const { success, error } = await subAccounts.apiKeys.delete('validhandle123', 1)
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { success, error } = await mailchannels.subAccounts.apiKeys.delete('validhandle123', 1)
```
:::

## Params

- `handle` `string` <Badge type="danger">required</Badge>: The handle of the sub-account for which the API key should be deleted.
- `id` `number` <Badge type="danger">required</Badge>: The ID of the API key to delete.

## Response

- `success` `boolean` <Badge>guaranteed</Badge>: Whether the operation was successful.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/sub-accounts-api-keys-method-delete.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/success-response.ts
