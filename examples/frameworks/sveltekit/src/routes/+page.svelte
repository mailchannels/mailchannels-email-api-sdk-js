<script lang="ts">
const examples = [
  {
    name: "Emails",
    description: "Examples of sending emails.",
    paths: [
      {
        name: "Send a predefined email",
        description: "Uses a button to trigger an API route that sends a predefined email.",
        path: "/emails/send"
      },
      {
        name: "Send an email using a form",
        description: "Includes a form to input email details.",
        path: "/emails/send-form"
      },
      {
        name: "Send an email with an attachment",
        description: "Includes a form to input email details and an attachment URL.",
        path: "/emails/send-attachment"
      },
      {
        name: "Send an email using a template engine",
        description: "Includes a form to input email details and uses a template engine to render dynamic content.",
        path: "/emails/send-template"
      },
      {
        name: "Queue a predefined email",
        description: "Uses a button to trigger an API route that queues a predefined email.",
        path: "/emails/queue"
      }
    ]
  },
  {
    name: "Domains",
    description: "Examples of domains.",
    paths: [
      {
        name: "Check a domain",
        description: "Uses a button to perform a DKIM, SPF & Domain Lockdown Check.",
        path: "/domains/check"
      }
    ]
  },
  {
    name: "Webhooks",
    description: "Examples of webhooks.",
    paths: [
      {
        name: "Create a webhook",
        description: "Includes a form to input an endpoint URL and creates a webhook to receive notifications.",
        path: "/webhooks/create"
      },
      {
        name: "List webhooks",
        description: "Displays a list of existing webhooks.",
        path: "/webhooks/list"
      },
      {
        name: "Delete all webhooks",
        description: "Uses a button to trigger an API route that deletes all webhooks.",
        path: "/webhooks/delete-all"
      }
    ]
  }
];
</script>

<h1>SvelteKit + MailChannels Examples</h1>

{#each examples as section}
  <section>
    <h2>{section.name}</h2>
    <p>{section.description}</p>
    <ul>
      {#each section.paths as example}
        <li>
          <a href={example.path}>
            <strong>{example.name}</strong>
          </a>
          <span>: {example.description}</span>
        </li>
      {/each}
    </ul>
  </section>
{/each}
