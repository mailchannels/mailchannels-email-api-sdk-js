# Astro

Send emails using [Astro](https://astro.build/) and the MailChannels Node.js SDK.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://console.mailchannels.net/settings/accountSettings#APIKeys)

## 1. Install

Add the `mailchannels-sdk` package dependency to your Astro project.

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

## 2. Install SSR adapter

Enable server-side rendering (SSR) in your Astro project by [installing an SSR adapter](https://docs.astro.build/en/guides/on-demand-rendering/).

## 3. Configure your API key

Add your MailChannels API key to your `.env` file.

```sh [.env]
MAILCHANNELS_API_KEY=your-api-key
```

## 4. Send email using HTML

Export the server [Actions](https://docs.astro.build/en/guides/actions/) in `src/actions/index.ts`.

```ts [src/actions/index.ts]
import emailsSend from "./emails/send"

export const server = {
  emails: {
    send: emailsSend
  }
}
```

Define the `send` action in `src/actions/emails/send.ts`.

Use the `html` property to send an email with HTML content.

```ts [src/actions/emails/send.ts]
import { ActionError, defineAction } from 'astro:actions'
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels(import.meta.env.MAILCHANNELS_API_KEY)

export default defineAction({
  accept: 'json',
  handler: async () => {
    const { data, error } = await mailchannels.emails.send({
      from: 'Name <from@example.com>',
      to: 'to@example.com',
      subject: 'Test email',
      html: '<p>Hello World</p>'
    })

    if (error) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })
    }

    return data
  }
})
```

## 5. Call the action

Call the `send` action from an Astro page. Use a native HTML form with `Astro.getActionResult()` for server-side handling, or intercept the form submission in a `<script>` tag for client-side updates without a page reload.

::: code-group
```astro [src/pages/emails/send.astro]
---
---

<Layout>
  <h1>Send a predefined email</h1>

  <form id="send-form" class="form">
    <button type="submit" id="submit-btn">Send Email</button>
  </form>

  <pre id="result" hidden></pre>
</Layout>

<script>
import { actions } from 'astro:actions'

const form = document.getElementById('send-form') as HTMLFormElement
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement
const result = document.getElementById('result') as HTMLPreElement

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  submitBtn.disabled = true
  submitBtn.textContent = 'Sending...'
  result.hidden = true
  result.textContent = ''

  const { data, error } = await actions.emails.send()

  submitBtn.disabled = false
  submitBtn.textContent = 'Send Email'
  result.hidden = false
  result.textContent = JSON.stringify(error || data, null, 2)
})
</script>
```

```astro [src/pages/emails/send-basic.astro]
---
import { actions } from 'astro:actions'

const result = Astro.getActionResult(actions.emails.send)
---

<form method='POST' action={actions.emails.send}>
  <button type='submit'>Send Email</button>
</form>

{result?.error && <p>Error: {result.error.message}</p>}
{result && !result.error && <p>Email sent successfully!</p>}
```
:::

## Examples

<ExampleBoxes :examples="[
  {
    title: 'Send',
    description: 'Send a predefined email',
    path: '/examples/frameworks/astro/src/actions/emails/send.ts'
  },
  {
    title: 'Queue email',
    description: 'Queue a predefined email',
    path: '/examples/frameworks/astro/src/actions/emails/queue.ts'
  },
  {
    title: 'Send with form',
    description: 'Send an email using a form',
    path: '/examples/frameworks/astro/src/actions/emails/send-form.ts'
  },
  {
    title: 'Send with attachment',
    description: 'Send an email with an attachment using a form',
    path: '/examples/frameworks/astro/src/actions/emails/send-attachment.ts'
  },
  {
    title: 'Send with template',
    description: 'Send an email using a template engine with a form',
    path: '/examples/frameworks/astro/src/actions/emails/send-template.ts'
  },
  {
    title: 'Check domain',
    description: 'Perform a DKIM, SPF & Domain Lockdown Check',
    path: '/examples/frameworks/astro/src/actions/domains/check.ts'
  },
  {
    title: 'Create webhook',
    description: 'Create a webhook',
    path: '/examples/frameworks/astro/src/actions/webhooks/create.ts'
  },
  {
    title: 'Webhooks events',
    description: 'Handle webhook events',
    path: '/examples/frameworks/astro/src/pages/api/webhooks/mailchannels.ts'
  }
]" />
