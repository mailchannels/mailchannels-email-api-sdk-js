# Hono

Send emails using [Hono](https://hono.dev/) and the MailChannels Node.js SDK.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add the `mailchannels-sdk` package dependency to your Hono project.

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
:::

## 2. Configure your API key

Add your MailChannels API key to your `.env` file.

```sh [.env]
MAILCHANNELS_API_KEY=your-api-key
```

## 3. Email sending route

Create a file at `src/index.ts` and register a `/api/send` [Route handler](https://hono.dev/docs/api/routing) for your Hono app.

Use the `html` property to send an email with HTML content.

```ts [src/index.ts]
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { MailChannels } from 'mailchannels-sdk'

const app = new Hono()

process.loadEnvFile()

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!)

app.post('/api/send', async (c) => {
  const body = await c.req.json()

  if (!body.to || !body.subject || !body.message) {
    return c.json({
      message: 'Missing required fields: \'to\', \'subject\', \'message\''
    }, 400)
  }

  const { data, error } = await mailchannels.emails.send({
    from: 'Name <from@example.com>',
    to: body.to,
    subject: body.subject,
    html: `<p>${body.message}</p>`
  })

  if (error) {
    return c.json(error, 500)
  }

  return c.json(data)
})

serve(app)
console.info('Listening on http://localhost:3000')
```

### Receiving webhook events

To receive webhook events from MailChannels, add a `POST` route (for example, `/webhooks/mailchannels`) to your Hono app. Then, register the corresponding full HTTPS URL (for example, `https://example.com/webhooks/mailchannels`) in the [MailChannels dashboard](https://dash.mailchannels.com/webhooks).

```ts
app.post('/webhooks/mailchannels', async (c) => {
  const { data, error } = await mailchannels.webhooks.verify({
    payload: await c.req.text(),
    headers: c.req.header()
  })

  if (error) {
    return c.json(error, 400)
  }

  for (const webhook of data) {
    console.info(webhook.event, webhook.email, webhook.requestId)
  }

  return c.json({
    received: true,
    types: data.map(webhook => webhook.event)
  })
})
```

## 4. Run the server

Run the Hono server using the following command:

```sh
# With tsx
npx tsx src/index.ts

# With Node >= 22.18.0
node src/index.ts
```

You can now send an email by making a `POST` request to `http://localhost:3000/api/send` with the following JSON payload:

```json
{
  "to": "recipient@example.net",
  "subject": "Test Email",
  "message": "Hello World"
}
```
