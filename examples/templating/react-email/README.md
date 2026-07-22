# Examples: react-email + MailChannels

This example demonstrates using React as a templating engine for email generation and sending an email using the MailChannels SDK in a Node.js app. It shows how to use react-emails's render function to produce HTML for emails and bundle the code with the `tsdown` bundler.

Notes:

- This example focuses only on templating (rendering React components to HTML) — it is not a full React app or client-side project.
- If you use a different bundler than `tsdown`, ensure your bundler supports importing `.jsx`/`.tsx` and the JSX transform, or add the appropriate loader/plugin.

Use this example as a minimal reference for integrating React-based templates into a Node process that renders email HTML.
