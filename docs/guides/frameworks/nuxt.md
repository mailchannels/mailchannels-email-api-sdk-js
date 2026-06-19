# Nuxt

Send emails using [Nuxt](https://nuxt.com/) and the MailChannels Node.js SDK.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://console.mailchannels.net/settings/accountSettings#APIKeys)

## 1. Install

Add the `mailchannels-sdk` package dependency to your Nuxt project.

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

## 2. Configure your API key

Add your MailChannels API key to your `.env` file.

```sh [.env]
NUXT_MAILCHANNELS_API_KEY=your-api-key
```

Then, add the `mailchannels` object and `apiKey` property to the `runtimeConfig` in your `nuxt.config.ts`. The value of `apiKey` should be an empty string, which will be automatically set at runtime using the value of `process.env.NUXT_MAILCHANNELS_API_KEY`.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  runtimeConfig: {
    mailchannels: {
      apiKey: '' // This should be an empty string here
    }
  }
})
```

## 3. Send email using HTML

Register a [Server handler](https://nuxt.com/docs/guide/directory-structure/server) under `server/api/emails/send.post.ts`.

Use the `html` property to send an email with HTML content.

```ts [server/api/emails/send.post.ts]
import { MailChannels } from 'mailchannels-sdk'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const mailchannels = new MailChannels(config.mailchannels.apiKey)

  const { data, error } = await mailchannels.emails.send({
    from: 'Name <from@example.com>',
    to: 'to@example.com',
    subject: 'Test email',
    html: '<p>Hello World</p>'
  })

  if (error) {
    throw createError({
      status: error.statusCode || 500,
      message: error.message
    })
  }

  return data
})
```

## 4. Call the API route

Create a form in your Nuxt app to call the `send` API route.

```vue [app/pages/emails/send.vue]
<script setup lang="ts">
import type { EmailsSendResponse } from 'mailchannels-sdk'

const loading = ref(false)
const result = ref<EmailsSendResponse['data']>()

const sendEmail = async () => {
  loading.value = true
  $fetch('/api/emails/send', {
    method: "POST"
  }).then((response) => {
    result.value = response
  }).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <h1>Send a predefined email</h1>

  <form class="form" @submit.prevent="sendEmail">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send Email' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
```

## Examples

<ExampleBoxes :examples="[
  {
    title: 'Send',
    description: 'Send a predefined email',
    path: '/examples/frameworks/nuxt/server/api/emails/send.post.ts'
  },
  {
    title: 'Queue email',
    description: 'Queue a predefined email',
    path: '/examples/frameworks/nuxt/server/api/emails/queue.post.ts'
  },
  {
    title: 'Send with form',
    description: 'Send an email using a form',
    path: '/examples/frameworks/nuxt/server/api/emails/send-form.post.ts'
  },
  {
    title: 'Send with attachment',
    description: 'Send an email with an attachment using a form',
    path: '/examples/frameworks/nuxt/server/api/emails/send-attachment.post.ts'
  },
  {
    title: 'Send with template',
    description: 'Send an email using a template engine with a form',
    path: '/examples/frameworks/nuxt/server/api/emails/send-template.post.ts'
  },
  {
    title: 'Check domain',
    description: 'Perform a DKIM, SPF & Domain Lockdown Check',
    path: '/examples/frameworks/nuxt/server/api/domains/check.post.ts'
  },
  {
    title: 'Create webhook',
    description: 'Create a webhook',
    path: '/examples/frameworks/nuxt/server/api/webhooks/index.post.ts'
  },
  {
    title: 'Webhooks events',
    description: 'Handle webhook events',
    path: '/examples/frameworks/nuxt/server/api/webhooks/mailchannels.post.ts'
  }
]" />
