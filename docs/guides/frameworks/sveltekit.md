# SvelteKit

Send emails using [SvelteKit](https://svelte.dev/docs/kit) and the MailChannels Node.js SDK.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add the `mailchannels-sdk` package dependency to your SvelteKit project.

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
MAILCHANNELS_API_KEY=your-api-key
```

## 3. Send email using HTML

Create a [server API route](https://svelte.dev/docs/kit/routing#server) under `src/routes/api/emails/send/+server.ts`.

Use the `html` property to send an email with HTML content.

```ts [src/routes/api/emails/send/+server.ts]
import { json } from '@sveltejs/kit'
import { MailChannels } from 'mailchannels-sdk'
import { MAILCHANNELS_API_KEY } from '$env/static/private'
import type { RequestHandler } from './$types'

const mailchannels = new MailChannels(MAILCHANNELS_API_KEY)

export const POST: RequestHandler = async () => {
  const { data, error } = await mailchannels.emails.send({
    from: 'Name <from@example.com>',
    to: 'to@example.com',
    subject: 'Test email',
    html: '<p>Hello World</p>'
  })

  if (error) {
    return json(error, {
      status: error.statusCode || 500
    })
  }

  return json(data)
}
```

## 4. Call the API route

Create a form in your SvelteKit app to call the `send` API route.

```svelte [src/routes/emails/send/+page.svelte]
<script lang="ts">
import type { EmailsSendResponse } from 'mailchannels-sdk'

let loading = $state(false)
let result = $state<EmailsSendResponse['data']>()

async function sendEmail (e: SubmitEvent) {
  e.preventDefault()
  loading = true

  const response = await fetch('/api/emails/send', {
    method: "POST"
  })

  result = await response.json()
  loading = false
}
</script>

<h1>Send a predefined email</h1>

<form class="form" onsubmit={sendEmail}>
  <button type="submit" disabled={loading}>
    {loading ? 'Sending...' : 'Send Email'}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
```

## Examples

<ExampleBoxes :examples="[
  {
    title: 'Send',
    description: 'Send a predefined email',
    path: '/examples/frameworks/sveltekit/src/routes/api/emails/send/+server.ts'
  },
  {
    title: 'Queue email',
    description: 'Queue a predefined email',
    path: '/examples/frameworks/sveltekit/src/routes/api/emails/queue/+server.ts'
  },
  {
    title: 'Send with form',
    description: 'Send an email using a form',
    path: '/examples/frameworks/sveltekit/src/routes/api/emails/send-form/+server.ts'
  },
  {
    title: 'Send with attachment',
    description: 'Send an email with an attachment using a form',
    path: '/examples/frameworks/sveltekit/src/routes/api/emails/send-attachment/+server.ts'
  },
  {
    title: 'Send with template',
    description: 'Send an email using a template engine with a form',
    path: '/examples/frameworks/sveltekit/src/routes/api/emails/send-template/+server.ts'
  },
  {
    title: 'Check domain',
    description: 'Perform a DKIM, SPF & Domain Lockdown Check',
    path: '/examples/frameworks/sveltekit/src/routes/api/domains/check/+server.ts'
  },
  {
    title: 'Create webhook',
    description: 'Create a webhook',
    path: '/examples/frameworks/sveltekit/src/routes/api/webhooks/+server.ts'
  },
  {
    title: 'Webhooks events',
    description: 'Handle webhook events',
    path: '/examples/frameworks/sveltekit/src/routes/api/webhooks/mailchannels/+server.ts'
  }
]" />
