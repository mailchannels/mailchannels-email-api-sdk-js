# react-email

Use React components as server-side templates to render HTML for emails.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add the SDK and other dependencies to your project:

::: code-group
```sh [npm]
npm i mailchannels-sdk react react-dom react-email
npm i -D tsdown typescript @types/react
```

```sh [pnpm]
pnpm add mailchannels-sdk react react-dom react-email
pnpm add -D tsdown typescript @types/react
```
:::

If your bundler is not `tsdown`, ensure it supports importing `.jsx`/`.tsx` and the JSX transform (add the appropriate plugin/loader if necessary).

## 2. Configure your API key

Add your MailChannels API key to your `.env` or `.env.local` file.

```sh [.env.local]
MAILCHANNELS_API_KEY=your-api-key
```

## 3. Send an email with a React template

### Create a React component

This component will serve as the email template.

```tsx [src/email.tsx]
import { Button, Html, Text } from 'react-email'

interface EmailProps {
  lang: string
  url: string
}

export const Email: React.FC<Readonly<EmailProps>> = (props) => {
  return (
    <Html lang={props.lang}>
      <Text>Hello from React Email</Text>
      <Button href={props.url}>Click me</Button>
    </Html>
  )
}
```

### Entry point file

Create an entry point file that uses the `react-email` package to render a React component to HTML and send it using the MailChannels SDK.

```tsx [src/index.tsx]
import { MailChannels } from 'mailchannels-sdk'
import { render } from 'react-email'
import { Email } from './email'

process.loadEnvFile()

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!)

const emailHtml = await render(
  <Email lang="en" url="https://example.com" />
)

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

In our example, we use `tsdown` to bundle the code into a single file. You can use any bundler that supports JSX/TSX and the JSX transform.

### Configure `tsdown` and build the project

```ts [tsdown.config.ts]
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.tsx'],
  format: 'esm',
  platform: 'neutral',
  target: 'node20'
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
