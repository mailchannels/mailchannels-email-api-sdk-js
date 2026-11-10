# NestJS

Send emails using [NestJS](https://nestjs.com/), the MailChannels Node.js SDK, and the
[`nestjs-mailchannels`](https://github.com/mailchannels/nestjs-mailchannels) integration.

## Prerequisites

- [Create a MailChannels account](https://www.mailchannels.com/pricing/#for_devs)
- [Create an API key](https://dash.mailchannels.com/account/api-keys)

## 1. Install

Add `nestjs-mailchannels` to your NestJS project.

::: code-group

```sh [npm]
npm i nestjs-mailchannels
```

```sh [yarn]
yarn add nestjs-mailchannels
```

```sh [pnpm]
pnpm add nestjs-mailchannels
```

:::

## 2. Configure your API key

Pass your API key directly to `MailChannelsModule.forRoot` or use `MailChannelsModule.forRootAsync`
to load it from environment variables or another secure source. Keep the key server-side and out of
source control.

```ts [src/app.module.ts]
import { Module } from '@nestjs/common'
import { MailChannelsModule } from 'nestjs-mailchannels'

@Module({
  imports: [
    MailChannelsModule.forRoot({
      apiKey: 'YOUR-API-KEY'
    })
  ]
})
export class AppModule {}
```

## 3. Send email

Create a new controller for handling email routes. Inject `MailChannelsService` into the constructor
and add route handlers for sending emails.

```ts [src/emails.controller.ts]
import { Controller, HttpException, Post } from '@nestjs/common'
import { MailChannelsService } from 'nestjs-mailchannels'

@Controller()
export class EmailsController {
  constructor(private readonly mailchannelsService: MailChannelsService) {}

  @Post('emails/send')
  async send() {
    const { data, error } = await this.mailchannelsService.emails.send({
      from: 'Name <from@example.com>',
      to: 'to@example.net',
      subject: 'Test email',
      text: 'Hello from NestJS',
      html: '<p>Hello from NestJS</p>'
    })

    if (error) {
      throw new HttpException(error.message, error.statusCode || 500)
    }

    return data
  }
}
```

Use `this.mailchannelsService.emails.queue(...)` to queue a message instead. The example exposes
both operations as `POST /emails/send` and `POST /emails/queue`.

## 4. Run the server

Run the Server

```sh
npm run start
```

The application will be available at `http://localhost:3000`.
