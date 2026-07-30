# Netlify Edge

Send emails using [Netlify Edge Functions](https://docs.netlify.com/build/edge-functions/overview/) and the MailChannels Node.js SDK.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)
- [Create a Netlify account](https://app.netlify.com/signup)

## 1. Install

Add the `mailchannels-sdk` package dependency to your Netlify project.

::: code-group
```sh [npm]
npm install mailchannels-sdk
```

```sh [yarn]
yarn add mailchannels-sdk
```

```sh [pnpm]
pnpm add mailchannels-sdk
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

> [!WARNING]
> Do not commit your `.env` file to version control. Add it to your `.gitignore` file.

## 3. Create a Netlify Edge Function

Register a [Netlify Edge Function](https://docs.netlify.com/build/edge-functions/get-started/) under `netlify/edge-functions/send.ts`. Export a `config` object with the `path` property to specify the function's endpoint.

Each route file you create under `netlify/edge-functions/` is automatically deployed as a Netlify Edge Function.

Use the `html` property to send an email with HTML content.

```ts [netlify/edge-functions/send.ts]
import { MailChannels } from 'mailchannels-sdk'
import type { Config } from '@netlify/edge-functions'

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = Netlify.env.get('MAILCHANNELS_API_KEY')
  const mailchannels = new MailChannels(apiKey!)

  const { data, error } = await mailchannels.emails.send({
    from: 'Name <from@example.com>',
    to: 'to@example.com',
    subject: 'Test email',
    html: '<p>Hello World</p>'
  })

  if (error) {
    return Response.json(error, { status: error.statusCode || 500 })
  }

  return Response.json(data, { status: 200 })
}

export const config: Config = {
  path: '/api/send'
}
```

## 4. Test locally

You can test the function locally using the Netlify CLI.

Run the following command in your terminal:

```sh
netlify dev
```

## 5. Deploy your Netlify Edge Function

Run the following command to deploy your Netlify Edge Function.

```sh
netlify deploy
```

After deployment, add the `MAILCHANNELS_API_KEY` secret to your Netlify project settings and redeploy your site to ensure the function has access to the API key.

## 6. Test your deployed function

Send a POST request to your function's endpoint. For example, if your site is deployed at `https://your-site.netlify.app`, your function will be available at `https://your-site.netlify.app/api/send`.
