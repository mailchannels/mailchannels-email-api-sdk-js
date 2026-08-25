# MJML

Use MJML markup as a server-side template to render HTML for emails.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add the SDK, MJML, and the tools needed to run the TypeScript entry point:

::: code-group
```sh [npm]
npm i mailchannels-sdk mjml
npm i -D @types/mjml tsx typescript
```

```sh [pnpm]
pnpm add mailchannels-sdk mjml
pnpm add -D @types/mjml tsx typescript
```
:::

## 2. Configure your API key

Add your MailChannels API key to your `.env` file.

```sh [.env]
MAILCHANNELS_API_KEY=your-api-key
```

## 3. Create an MJML template

Create an MJML file that describes the structure and styling of your email. MJML compiles this markup into email-compatible HTML.

```xml [src/email-template.mjml]
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-divider border-color="#F45E43"></mj-divider>
        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hello World</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

## 4. Render and send the email

Read the MJML file, convert it to HTML with `mjml2html`, and pass the rendered HTML to `mailchannels.emails.send`.

```ts [src/index.ts]
import { readFile } from 'node:fs/promises'
import { MailChannels } from 'mailchannels-sdk'
import mjml2html from 'mjml'

process.loadEnvFile()

const mailchannels = new MailChannels(process.env.MAILCHANNELS_API_KEY!)

const emailTemplate = await readFile('./src/email-template.mjml', 'utf-8')
const mjml = await mjml2html(emailTemplate)

const { data, error } = await mailchannels.emails.send({
  from: 'Name <from@example.com>',
  to: 'to@example.com',
  subject: 'Test email',
  html: mjml.html
})

if (error) {
  console.error(error)
  process.exit(1)
}

console.info(data)
```

## 5. Run the example

Add a script that runs the TypeScript entry point with `tsx`:

```json [package.json]
{
  "scripts": {
    "send": "tsx src/index.ts"
  }
}
```

Run the script from your project directory:

::: code-group
```sh [npm]
npm run send
```

```sh [pnpm]
pnpm send
```
:::
