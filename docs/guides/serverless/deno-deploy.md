# Deno Deploy

Send emails using [Deno Deploy](https://deno.com/deploy) and the MailChannels Node.js SDK.

<DeployTo
  platform="deno"
  path="/examples/serverless/deno-deploy"
/>

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://console.mailchannels.net/settings/accountSettings#APIKeys)

## 1. Create a Deno Deploy project

Go to [deno.com/deploy](https://deno.com/deploy) and create a new Deno Deploy project.

## 2. Edit the code

Edit the `main.ts` file and add the following code:

```ts [main.ts]
import { MailChannels } from 'npm:mailchannels-sdk'

const mailchannels = new MailChannels('your-api-key')

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)

  if (url.pathname === '/api/send' && req.method === 'POST') {
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

  return new Response('Not Found', { status: 404 })
})
```

## 3. Test locally

If you created a new Deno Deploy project locally, you can test the code using the Deno CLI.

Run the following command in your terminal:

```sh
deno run --watch --allow-read --allow-net main.ts
```

## 4. Deploy

Click on the "Deploy" button to deploy your project.

Or, if you created a new Deno Deploy project locally, you can share it publicly using the Deno CLI:

```sh
deno deploy
```
