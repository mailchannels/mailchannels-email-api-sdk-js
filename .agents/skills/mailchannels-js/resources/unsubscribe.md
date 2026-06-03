# Unsubscribe

MailChannels offers two complementary unsubscribe mechanisms — an in-body unsubscribe link,
and the standard `List-Unsubscribe` / `List-Unsubscribe-Post` headers. They are not
alternatives. A non-transactional (bulk / marketing / notification) send should use
**both**: the headers let inbox providers surface a one-click "Unsubscribe" button in their
UI, and the in-body link is what recipients see and click inside the message body. Major
inbox providers (Gmail, Yahoo, etc.) effectively require both for bulk senders.

Both mechanisms require the message to have **exactly one recipient per personalization**
and to be **DKIM-signed**.

### In-Body Unsubscribe Link

Use the literal placeholder string `{{mc-unsubscribe-url}}` inside a mustache HTML body.
MailChannels substitutes a hosted one-click unsubscribe URL at render time.

```ts
await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Newsletter',
  html: `
    <p>Hello!</p>
    <p><a href="{{mc-unsubscribe-url}}">Unsubscribe</a></p>
  `,
  template: { type: 'mustache' }
})
```

The `template` field must be present for `{{mc-unsubscribe-url}}` to be substituted.

### `List-Unsubscribe` Headers (Non-Transactional)

Setting `transactional: false` tells MailChannels to add `List-Unsubscribe` and
`List-Unsubscribe-Post` headers automatically. These headers are what inbox providers read
to render their "Unsubscribe" button next to the sender name.

**Always include the in-body link in the same payload** so the message is fully compliant
on both surfaces:

```ts
await mc.emails.queue({
  from: 'sender@example.com',
  to: 'recipient@example.net',
  subject: 'Marketing message',
  html: `
    <p>Today's update…</p>
    <p><a href="{{mc-unsubscribe-url}}">Unsubscribe</a></p>
  `,
  template: { type: 'mustache' },
  transactional: false,
  dkim: {
    domain: 'example.com',
    selector: 'mcdkim'
  }
})
```

If `transactional: false` is set but a personalization has more than one recipient,
the SDK returns a `validation_error` before making any HTTP call.

### When To Use Which

| Message type | In-body link | `transactional: false` headers |
| --- | --- | --- |
| Transactional (receipts, password resets, confirmations) | No | No (keep the default `true`). |
| Bulk / marketing / newsletter / notification | **Yes** | **Yes** — combine both in the same payload. |

There is essentially no situation where you'd want headers but not the in-body link; if
you're sending non-transactional mail, you need both.

Both modes require DKIM signing. See [dkim](dkim.md) for how to create the underlying key.
