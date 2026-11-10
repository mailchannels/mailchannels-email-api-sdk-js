# Examples: Nodemailer + MailChannels

In this folder, you can find an example of sending email with Nodemailer and the MailChannels Email
API.

## Getting Started

Follow these steps to set up the Nodemailer + MailChannels example:

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
pnpm install
```

### 3. Run the Example

Replace the placeholder sender and recipient addresses in `src/app.ts` with addresses you can use
with your MailChannels account, then run:

```sh
# npm
npm run send

# yarn
yarn send

# pnpm
pnpm send
```
