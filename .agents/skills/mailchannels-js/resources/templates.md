# Mustache Templates

MailChannels templates are **send-payload fields**, not a template CRUD resource. There is
no "create template" endpoint. To use a template:

1. Set `template: { type: 'mustache', data: { ... } }` on the root options.
2. Provide per-recipient variable overrides in each personalization's `template.data`.

The only supported template type is `'mustache'`.

### Single Recipient

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  to: 'jane@example.net',
  subject: 'Hello {{name}}',
  text: 'Hello {{name}}',
  html: '<p>Hello {{name}}</p>',
  template: {
    type: 'mustache',
    data: { name: 'Jane' }
  }
})
```

### Multiple Recipients With Per-Recipient Variables

Each personalization renders independently with its own variables. Root-level
`template.data` is the base; per-personalization `template.data` is merged on top
(personalization wins on conflict):

```ts
const { data, error } = await mc.emails.queue({
  from: 'sender@example.com',
  subject: 'Hi {{name}}',
  text: 'Hi {{name}}, you are on the {{plan}} plan.',
  template: {
    type: 'mustache',
    data: { plan: 'Free' }   // root default
  },
  personalizations: [
    {
      to: 'jane@example.net',
      template: { data: { name: 'Jane', plan: 'Pro' } }  // overrides plan
    },
    {
      to: 'alex@example.net',
      template: { data: { name: 'Alex' } }               // inherits plan: 'Free'
    }
  ]
})
```

### Allowed Template Variable Value Types

Keys are strings. Values may be:

- `string`
- `boolean`
- `number`
- array of any of the above
- plain object (nested maps with string keys and any of the above as values)

`null`, `undefined`, and class instances are rejected with a `validation_error` before
the request leaves the client.

### Subject Templates

The root `subject` field is **also** mustache-rendered when a `template` is set. There is
no separate subject template configuration.

### Preview Without Sending

Use `dryRun: true` on `emails.send()` to render and validate without delivering:

```ts
const { data, error } = await mc.emails.send(
  {
    from: 'sender@example.com',
    to: 'recipient@example.net',
    subject: 'Hello {{name}}',
    text: 'Hello {{name}}',
    template: { type: 'mustache', data: { name: 'World' } }
  },
  true  // dryRun
)

// data.rendered is a string[] — one rendered message per personalization
```

Dry-run is the right way to confirm that a template renders correctly before shipping.
`emails.queue()` does not support dry-run.
