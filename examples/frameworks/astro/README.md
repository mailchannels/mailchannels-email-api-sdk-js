# Examples: Astro + MailChannels

In this folder, you can find full-stack examples of how to use MailChannels with Astro.

## Getting Started

Follow these steps to set up the Astro + MailChannels examples:

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

The application will be available at `http://localhost:4321`.

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

## Actions

- `emails.send` - Send a predefined email
- `emails.sendForm` - Send an email based on form input
- `emails.sendAttachment` - Send an email with an attachment based on form input
- `emails.sendTemplate` - Send an email using a template engine based on form input
- `emails.queue` - Queue a predefined email
- `domains.check` - Perform a DKIM, SPF & Domain Lockdown Check
- `webhooks.create` - Create a webhook based on form input
- `webhooks.list` - List existing webhooks
- `webhooks.deleteAll` - Delete all webhooks

## API Routes

- `POST /api/webhooks/mailchannels` - Handle webhook events
