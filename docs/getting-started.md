---
outline: deep
---

# Getting Started

Getting started with `mailchannels-sdk`

## Overview

<!-- @include: ../README.md#overview -->

## Features

<!-- @include: ../README.md#features -->

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## Installation

Add `mailchannels-sdk` dependency to your project

::: code-group
```sh [npm]
npm i mailchannels-sdk
```

```sh [yarn]
yarn add mailchannels-sdk
```

```sh [pnpm]
pnpm add mailchannels-sdk
```

```sh [bun]
bun add mailchannels-sdk
```

```sh [deno]
deno add npm:mailchannels-sdk
```
:::

## Quick Start

This library can be used in two ways:

- Importing the whole library
- Importing the client and only the modules you need

### Importing the whole library

In this example, we import the whole library and use the `MailChannels` class to send an email.

```ts {1}
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.emails.send({
  from: 'Name <from@example.com>',
  to: 'to@example.com',
  subject: 'Test email',
  html: '<p>Hello World</p>'
})
```

This approach is useful when building an application on top of MailChannels and you need to use all or multiple modules from the library.

### Importing only the modules you need

In this example, we import the `MailChannelsClient` and the `Emails` module to send an email.

```ts {1}
import { MailChannelsClient, Emails } from 'mailchannels-sdk'

const mailchannels = new MailChannelsClient('your-api-key')
const emails = new Emails(mailchannels)

const { data, error } = await emails.send({
  from: 'Name <from@example.com>',
  to: 'to@example.com',
  subject: 'Test email',
  html: '<p>Hello World</p>'
})
```

This approach is tree-shakable and is useful when you only need to use specific modules from the library and want to reduce the bundle size of your application.

### Client Options

Both `MailChannels` and `MailChannelsClient` accept an optional second argument to configure the client.

```ts
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key', {
  baseUrl: 'http://localhost:8787', // default: 'https://api.mailchannels.net'
  retry: 1, // default: false (no retries)
  timeout: 30000, // default: 120000 (120 seconds)
  signal: undefined // default: undefined (no abort signal)
})
```
<div class="vp-doc _modules">

- `baseUrl` `string` <Badge type="info">optional</Badge>: Override the MailChannels client base URL. Useful for local testing against a [simulator](/simulator).
- `retry` `number | false` <Badge type="info">optional</Badge>: Number of times to retry a request on failure.
  > [!NOTE]
  > Retries apply only to the following status codes:
  >
  > `408`, `409`, `425`, `429`, `500`, `502`, `503`, `504`.
  >
  > See [ofetch](https://github.com/unjs/ofetch) documentation for more details on retry behavior.
- `timeout` `number | false` <Badge type="info">optional</Badge>: Request timeout in milliseconds. Set to `false` or `0` to disable timeout handling. Default is `120000` (120 seconds/2 minutes).
- `signal` `AbortSignal` <Badge type="info">optional</Badge>: Abort signal applied to requests made by the client.

</div>

**Type declaration**

<<< @/snippets/mail-channels-client-options.ts

### Error handling

All methods in this SDK return an object with both `data` and `error` properties to avoid throwing exceptions, making error handling more predictable and easier to manage.

**Success case:**

- `data`: Contains the response data
- `error`: Will be `null`

**Error case:**

- `data`: Will be `null`
- `error`: Contains an `ErrorResponse` object with the following properties:
  - `message`: A human-readable description of the error
  - `statusCode`: The HTTP status code from the API (e.g., `400`, `404`), or `null` if the error is not related to an HTTP request
  - `type`: A string identifier for the type of error

```ts {5,13-15,18}
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

const { data, error } = await mailchannels.emails.send({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test email',
  html: '<p>Hello World</p>'
})

// handle the error as needed
if (error) {
  throw new Error(error.message)
}

// data is guaranteed to be non-null here
console.log({ data })
```

## Naming Conventions

<!-- @include: ../README.md#naming-conventions -->
