# Examples: vue-email + MailChannels

This example demonstrates using Vue as a templating engine for email generation and sending an email using the MailChannels SDK in a Node.js app. It shows how to use vue-emails's render function to produce HTML for emails and bundle the code with the `tsdown` bundler.

Notes:

- This example focuses only on templating (rendering Vue components to HTML) — it is not a full Vue application or SPA.
- If you use a different bundler than `tsdown`, you may need a Vue plugin/loader to import `.vue` single-file components (look for Rollup/Rolldown/Vite plugins that enable `.vue` imports).

Use this example as a minimal reference for integrating Vue-based templates into a Node process that renders email HTML.
