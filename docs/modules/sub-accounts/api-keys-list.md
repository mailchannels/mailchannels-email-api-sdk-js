---
title: List API Keys
titleTemplate: 🪪 Sub-Accounts
---

# List API Keys<llm-exclude> <Badge type="info">method</Badge> <Badge><a href="/modules/sub-accounts">🪪 Sub-Accounts</a></Badge></llm-exclude>

Retrieves details of all API keys associated with the specified sub-account. For security reasons, the full API key is not returned; only the key ID and a partially redacted version are provided.

## Usage

::: code-group
```ts [modular.ts]
import { MailChannelsClient, SubAccounts } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const subAccounts = new SubAccounts(mailchannels)

const { data, error } = await subAccounts.apiKeys.list('validhandle123')
```

```ts [full.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.subAccounts.apiKeys.list('validhandle123')
```
:::

## Params

- `handle` `string` <Badge type="danger">required</Badge>: The handle of the sub-account to retrieve the API keys for.
- `options` `SubAccountsApiKeysListOptions` <Badge type="info">optional</Badge>: List API keys options.
  - `limit` `number` <Badge type="info">optional</Badge>: The maximum number of API keys included in the response. Possible values are `1` to `1000`.
  - `offset` `number` <Badge type="info">optional</Badge>: Offset into the list of API keys to return.
  > [!TIP]
  > If no options are provided, the default limit is `100` and the offset is `0`.

## Response

- `data` `SubAccountsApiKey[] | null` <Badge type="warning">nullable</Badge>
  - `id` `number` <Badge>guaranteed</Badge>: The API key ID for the sub-account.
  - `key` `string` <Badge>guaranteed</Badge>: API key for the sub-account.
<!-- @include: ../_parts/error-response.md -->

## Type declarations

**Signature**

<<< @/snippets/sub-accounts-api-keys-method-list.ts

**Response type declarations**

<<< @/snippets/error-response.ts
<<< @/snippets/data-response.ts

**API Keys type declarations**

<<< @/snippets/sub-accounts-api-key.ts
<<< @/snippets/sub-accounts-api-keys-list-response.ts
