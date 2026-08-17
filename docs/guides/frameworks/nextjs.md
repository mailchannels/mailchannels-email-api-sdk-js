# Next.js

Send emails using [Next.js](https://nextjs.org/) and the MailChannels Node.js SDK.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add the `mailchannels-sdk` package dependency to your Next.js project.

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

Register an [App route handler](https://nextjs.org/docs/app/getting-started/route-handlers) under `app/api/emails/send/route.ts` or a [Pages API route](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) under `pages/api/emails/send.ts`.

Use the `html` property to send an email with HTML content.

::: code-group
```ts [app/api/emails/send/route.ts]
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY)

export async function POST () {
  const { data, error } = await mailchannels.emails.send({
    from: 'Name <from@example.com>',
    to: 'to@example.com',
    subject: 'Test email',
    html: '<p>Hello World</p>'
  })

  if (error) {
    return Response.json(error, {
      status: error.statusCode || 500
    })
  }

  return Response.json(data)
}
```
```ts [pages/api/send.ts]
import type { NextApiRequest, NextApiResponse } from 'next'
import { MailChannels } from 'mailchannels-sdk'

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY)

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { data, error } = await mailchannels.emails.send({
    from: 'Name <from@example.com>',
    to: 'to@example.com',
    subject: 'Test email',
    html: '<p>Hello World</p>'
  })

  if (error) {
    return res.status(error.statusCode || 500).json({ error })
  }

  return res.status(200).json(data)
}
```
:::

## 4. Call the API route

Create a form in your Next.js app to call the `send` API route.

```tsx [app/emails/send/page.tsx]
'use client'

import { useState } from 'react'
import type { EmailsSendResponse } from 'mailchannels-sdk';

export default function SendEmail () {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmailsSendResponse['data']>()

  async function sendEmail (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const response = await fetch('/api/emails/send', {
      method: 'POST'
    })

    const data = await response.json()

    setResult(data)
    setLoading(false)
  }

  return (
    <>
      <h1>Send a predefined email</h1>

      <form className="form" onSubmit={sendEmail}>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  )
}
```

## Examples

<ExampleBoxes :examples="[
  {
    title: 'Send',
    description: 'Send a predefined email',
    path: '/examples/frameworks/nextjs/src/app/api/emails/send/route.ts'
  },
  {
    title: 'Queue email',
    description: 'Queue a predefined email',
    path: '/examples/frameworks/nextjs/src/app/api/emails/queue/route.ts'
  },
  {
    title: 'Send with form',
    description: 'Send an email using a form',
    path: '/examples/frameworks/nextjs/src/app/api/emails/send-form/route.ts'
  },
  {
    title: 'Send with attachment',
    description: 'Send an email with an attachment using a form',
    path: '/examples/frameworks/nextjs/src/app/api/emails/send-attachment/route.ts'
  },
  {
    title: 'Send with template',
    description: 'Send an email using a template engine with a form',
    path: '/examples/frameworks/nextjs/src/app/api/emails/send-template/route.ts'
  },
  {
    title: 'Check domain',
    description: 'Perform a DKIM, SPF & Domain Lockdown Check',
    path: '/examples/frameworks/nextjs/src/app/api/domains/check/route.ts'
  },
  {
    title: 'Create webhook',
    description: 'Create a webhook',
    path: '/examples/frameworks/nextjs/src/app/api/webhooks/route.ts'
  },
  {
    title: 'Webhooks events',
    description: 'Handle webhook events',
    path: '/examples/frameworks/nextjs/src/app/api/webhooks/mailchannels/route.ts'
  }
]" />
