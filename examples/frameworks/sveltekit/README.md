# Examples: SvelteKit + MailChannels

In this folder, you can find full-stack examples of how to use MailChannels with SvelteKit.

## Getting Started

Follow these steps to set up the SvelteKit + MailChannels examples:

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

### 3. Run the Development Server

```sh
npm run dev
```

The application will be available at `http://localhost:5173`.

## Pages

- `/` - Home page listing all examples
- `/emails/send` - Send a predefined email
- `/emails/send-form` - Send an email using a form
- `/emails/send-attachment` - Send an email with an attachment
- `/emails/send-template` - Send an email with a template engine
- `/emails/queue` - Queue a predefined email
- `/domains/check` - Check a domain
- `/webhooks/create` - Create a webhook
- `/webhooks/list` - List existing webhooks
- `/webhooks/delete-all` - Delete all webhooks

## API Routes

- `POST /api/emails/send` - Send a predefined email
- `POST /api/emails/send-form` - Send an email based on form input
- `POST /api/emails/send-attachment` - Send an email with an attachment based on form input
- `POST /api/emails/send-template` - Send an email using a template engine based on form input
- `POST /api/emails/queue` - Queue a predefined email
- `POST /api/domains/check` - Perform a DKIM, SPF & Domain Lockdown Check
- `POST /api/webhooks/mailchannels` - Handle webhook events
- `POST /api/webhooks` - Create a webhook based on form input
- `GET /api/webhooks` - List existing webhooks
- `DELETE /api/webhooks` - Delete all webhooks
