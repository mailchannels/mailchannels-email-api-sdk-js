# Examples: MJML + MailChannels

This example demonstrates using MJML as a templating engine for email generation and sending an email using the MailChannels SDK in a Node.js app. It shows how to read an MJML template, use `mjml2html` to produce HTML for emails, and send the rendered output through the SDK.

Notes:

- This example focuses only on templating (converting MJML to email-compatible HTML) — it is not a full web application.
- The template is loaded from `src/email-template.mjml`; edit that file to customize the email.
- Set `MAILCHANNELS_API_KEY` in `.env` before running the example.
- Run `npm run send` to render the template and send the email.

Use this example as a minimal reference for integrating MJML-based templates into a Node process that renders and sends email HTML.
