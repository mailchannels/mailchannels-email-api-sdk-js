# Examples: Hono + MailChannels

In this folder, you can find full-stack examples of how to use MailChannels with Hono.

## Getting Started

Follow these steps to set up the Hono + MailChannels examples:

### 1. Create .env File

Copy the `.env.example` file to `.env` and fill in your MailChannels API key:

```sh
cp .env.example .env
```

### 2. Install Dependencies

Install the required dependencies using your package manager:

```sh
# npm
npm install

# yarn
yarn install

# pnpm
pnpm i
```

### 3. Run the Server

```sh
npm run start
```

The application will be available at `http://localhost:3000`.

## Routes

- `POST /api/send` - Send an email with `to`, `subject`, and `message` in the request body.
- `POST /webhooks/mailchannels` - Receive webhook events from MailChannels.
