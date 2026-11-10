# Examples: NestJS + MailChannels

This example uses `nestjs-mailchannels` to send and queue emails from a NestJS app.

## Getting Started

### 1. Configure your API key

Replace `YOUR-API-KEY` in `src/app.module.ts` with your MailChannels API key. Update the example
sender and recipient in `src/emails.controller.ts` before sending. Do not commit a real API key.

### 2. Install dependencies

Install the required dependencies using your package manager:

```sh
# npm
npm install

# yarn
yarn install

# pnpm
pnpm i
```

### 3. Run the development server

From the repository root, run:

```sh
npm run start:dev
```

The application will be available at `http://localhost:3000`.

## Routes

- `POST /emails/send` - Send a predefined email.
- `POST /emails/queue` - Queue a predefined email.
