# vue-email

Use Vue components as server-side templates to render HTML for emails.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add the SDK and other dependencies to your project:

::: code-group
```sh [npm]
npm i mailchannels-sdk @vue-email/components @vue-email/render vue
npm i -D tsdown typescript unplugin-vue vue-tsc
```

```sh [pnpm]
pnpm add mailchannels-sdk @vue-email/components @vue-email/render vue
pnpm add -D tsdown typescript unplugin-vue vue-tsc
```
:::

If your templates use Vue single-file components (`.vue`) in a bundler other than `tsdown`, ensure you have the appropriate Rollup/Rolldown/Vite plugin or loader configured to import `.vue` files.

## 2. Configure your API key

Add your MailChannels API key to your `.env` file.

```sh [.env]
MAILCHANNELS_API_KEY=your-api-key
```

## 3. Send an email with a Vue template

### Create a Vue component

This component will serve as the email template.

```vue [src/EmailTemplate.vue]
<script setup lang="ts">
import { Button, Html, Text } from '@vue-email/components'

defineProps<{
  lang: string
  url: string
}>()
</script>

<template>
  <Html :lang="lang">
    <Text>Hello from Vue Email</Text>
    <Button :href="url">Click me</Button>
  </Html>
</template>

```

### Entry point file

Create an entry point file that uses the `@vue-email/render` package to render a Vue component to HTML and send it using the MailChannels SDK.

```ts [src/index.ts]
import { MailChannels } from 'mailchannels-sdk'
import { render } from '@vue-email/render'
import EmailTemplate from './EmailTemplate.vue'

process.loadEnvFile()

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!)

const emailHtml = await render(EmailTemplate, {
  lang: 'en',
  url: 'https://example.com'
})

const { data, error } = await mailchannels.emails.send({
  from: 'Name <from@example.com>',
  to: 'to@example.com',
  subject: 'Test email',
  html: emailHtml
})

if (error) {
  console.error(error)
  process.exit(1)
}

console.info(data)
```

## 4. Build and run

In our example, we use `tsdown` to bundle the code into a single file. You can use any bundler that supports Vue single-file components (`.vue`) and the Vue compiler.

### Configure `tsdown` and build the project

```ts [tsdown.config.ts]
import { defineConfig } from 'tsdown'
import vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  plugins: [vue({ isProduction: true })]
})
```

Run the following command to build the project:

```sh
tsdown
```

### Run the project

Run the generated file with Node.js to send the email:

```sh
node dist/index.js
```
