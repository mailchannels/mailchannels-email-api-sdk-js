import type { DefaultTheme } from "vitepress";

export default [
  {
    text: "Getting Started",
    link: "/getting-started"
  },
  {
    text: "SDK-API Mapping",
    link: "/sdk-api-mapping"
  },
  {
    text: "Local Simulator",
    link: "/simulator"
  },
  {
    text: "Modules",
    collapsed: false,
    link: "/modules",
    items: [
      {
        text: "Email API",
        collapsed: false,
        items: [
          {
            text: "📧 Emails",
            collapsed: true,
            link: "/modules/emails",
            items: [
              { text: "Send Email", link: "/modules/emails/send" },
              { text: "Queue Email", link: "/modules/emails/queue" }
            ]
          },
          {
            text: "🌐 Domains",
            collapsed: true,
            link: "/modules/domains",
            items: [
              { text: "Check Domain", link: "/modules/domains/check" },
              { text: "Create DKIM Key", link: "/modules/domains/dkim-create" },
              { text: "List DKIM Keys", link: "/modules/domains/dkim-list" },
              { text: "Update DKIM Key Status", link: "/modules/domains/dkim-update-status" },
              { text: "Rotate DKIM Key", link: "/modules/domains/dkim-rotate" }
            ]
          },
          {
            text: "📢 Webhooks",
            collapsed: true,
            link: "/modules/webhooks",
            items: [
              { text: "Create Webhook", link: "/modules/webhooks/create" },
              { text: "List Webhooks", link: "/modules/webhooks/list" },
              { text: "Delete All Webhooks", link: "/modules/webhooks/delete-all" },
              { text: "Get Signing Key", link: "/modules/webhooks/get-signing-key" },
              { text: "Validate Webhooks", link: "/modules/webhooks/validate" },
              { text: "Verify a message", link: "/modules/webhooks/verify" },
              { text: "Retrieve Webhook Batches", link: "/modules/webhooks/batches" },
              { text: "Resend Batch", link: "/modules/webhooks/resend-batch" }
            ]
          },
          {
            text: "🪪 Sub-accounts",
            collapsed: true,
            link: "/modules/sub-accounts",
            items: [
              { text: "Create Sub-account", link: "/modules/sub-accounts/create" },
              { text: "List Sub-accounts", link: "/modules/sub-accounts/list" },
              { text: "Delete Sub-account", link: "/modules/sub-accounts/delete" },
              { text: "Suspend Sub-account", link: "/modules/sub-accounts/suspend" },
              { text: "Activate Sub-account", link: "/modules/sub-accounts/activate" },
              { text: "Create API Key", link: "/modules/sub-accounts/api-keys-create" },
              { text: "Delete API Key", link: "/modules/sub-accounts/api-keys-delete" },
              { text: "List API Keys", link: "/modules/sub-accounts/api-keys-list" },
              { text: "Create SMTP Password", link: "/modules/sub-accounts/smtp-passwords-create" },
              { text: "List SMTP Passwords", link: "/modules/sub-accounts/smtp-passwords-list" },
              { text: "Delete SMTP Password", link: "/modules/sub-accounts/smtp-passwords-delete" },
              { text: "Get Limit", link: "/modules/sub-accounts/limits-get" },
              { text: "Set Limit", link: "/modules/sub-accounts/limits-set" },
              { text: "Delete Limit", link: "/modules/sub-accounts/limits-delete" },
              { text: "Get Usage", link: "/modules/sub-accounts/get-usage" }
            ]
          },
          {
            text: "📊 Metrics",
            collapsed: true,
            link: "/modules/metrics",
            items: [
              { text: "Engagement", link: "/modules/metrics/engagement" },
              { text: "Performance", link: "/modules/metrics/performance" },
              { text: "Recipient Behaviour", link: "/modules/metrics/recipient-behaviour" },
              { text: "Volume", link: "/modules/metrics/volume" },
              { text: "Usage", link: "/modules/metrics/usage" },
              { text: "Senders", link: "/modules/metrics/senders" }
            ]
          },
          {
            text: "🚫 Suppressions",
            collapsed: true,
            link: "/modules/suppressions",
            items: [
              { text: "Create Suppression", link: "/modules/suppressions/create" },
              { text: "Delete Suppression", link: "/modules/suppressions/delete" },
              { text: "List Suppressions", link: "/modules/suppressions/list" }
            ]
          }
        ]
      }
    ]
  },
  {
    text: "Guides",
    link: "/guides",
    items: [
      {
        text: "Frameworks",
        collapsed: true,
        items: [
          { text: "Next.js", link: "/guides/frameworks/nextjs" },
          { text: "Nuxt", link: "/guides/frameworks/nuxt" },
          { text: "Express", link: "/guides/frameworks/express" },
          { text: "Astro", link: "/guides/frameworks/astro" },
          { text: "SvelteKit", link: "/guides/frameworks/sveltekit" },
          { text: "Bun", link: "/guides/frameworks/bun" }
        ]
      },
      {
        text: "Serverless",
        collapsed: true,
        items: [
          { text: "Vercel Functions", link: "/guides/serverless/vercel-functions" },
          { text: "Cloudflare Workers", link: "/guides/serverless/cloudflare-workers" },
          { text: "Deno Deploy", link: "/guides/serverless/deno-deploy" }
        ]
      },
      {
        text: "Examples",
        link: "/guides/examples"
      }
    ]
  }
] satisfies DefaultTheme.SidebarItem[];
