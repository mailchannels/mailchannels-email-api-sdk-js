---
name: mailchannels-js
description: JavaScript/TypeScript SDK for the MailChannels Email API (npm `mailchannels-sdk`; `import { MailChannels } from 'mailchannels-sdk'`). Use when sending or queueing email, working with attachments, mustache templates, unsubscribe, custom headers, DKIM keys, sub-accounts, domain checks, metrics, usage, suppressions, or webhooks (incl. signature verification); also configuring clients, testing with the built-in simulator, and error handling. Skip when (a) developing the SDK itself — defer to the repo's root AGENTS.md; (b) the user is in a non-JavaScript/TypeScript language — MailChannels publishes separate SDKs for other ecosystems and the JS types/patterns here don't apply.
---

# MailChannels JavaScript SDK

This skill helps you write **JavaScript/TypeScript** code that uses the `mailchannels-sdk`
package (npm: `mailchannels-sdk`, importable as `import { MailChannels } from 'mailchannels-sdk'`).
It is specific to the official JavaScript SDK — MailChannels publishes separate SDKs for
other languages and their APIs differ.

> **Scope.** This skill is for *consuming* the JS SDK from application code. Working **on**
> the SDK (adding features, fixing bugs, releasing the package) is a different job.
>  If the user is working in a Python, Go, Ruby, PHP, Rust, or shell context, this skill does not apply.

### Quick Sanity Check Before Using This Skill

If any of these are true, you're in the right place:

- The file you're editing ends in `.ts`, `.tsx`, `.js`, `.mjs`, or `.cjs`.
- The user said "Node", "npm", "pnpm", "yarn", "bun", "TypeScript", "Next.js",
  "Express", "Hono", "Fastify", `package.json`, `tsconfig.json`, or similar.
- The codebase already imports `mailchannels-sdk` or has `mailchannels-sdk` in its dependencies.

## How To Use This Skill

The body of each topic lives in [`resources/`](resources/). Read this file for context and
the decision tree, then load only the resource files that match the task. Don't preload
everything.

### Decision Tree

Start at the top; descend until you hit a leaf, then read the linked resource. If multiple
branches apply (e.g. "send + attachments + templates"), read each leaf.

```
You're about to write JS/TS SDK code. What does it need to do?

├── Get oriented — what is the SDK, what are the entry points?
│   → resources/overview.md
│
├── Set up the client (API keys, base URL, options, lifecycle)
│   → resources/clients-and-transport.md
│
├── Send email
│   → resources/sending.md
│   ├── …with file / bytes / URL / inline-image attachments?
│   │   → resources/attachments.md
│   ├── …with a mustache template + per-recipient data?
│   │   → resources/templates.md
│   ├── …with an unsubscribe link or List-Unsubscribe header?
│   │   → resources/unsubscribe.md
│   └── …with custom X-… headers?
│       → resources/custom-headers.md
│
├── Manage hosted DKIM keys (create / list / rotate / revoke)
│   → resources/dkim.md
│
├── Validate a sender domain's auth posture (DKIM/SPF/Lockdown/DNS)
│   → resources/domain-checks.md
│
├── Multi-tenant work — sub-accounts, their credentials, limits, usage
│   → resources/sub-accounts.md
│
├── Query analytics (volume, engagement, performance, senders) or
│   current-period usage
│   → resources/metrics-and-usage.md
│
├── Manage the suppression list (list, create, delete)
│   → resources/suppressions.md
│
├── Receive or manage delivery-event webhooks (enroll, validate,
│   inspect batches, verify signatures)
│   → resources/webhooks.md
│
├── Catch / log / retry SDK or API errors
│   → resources/error-handling.md
│
└── Write tests without hitting the real API
    → resources/testing.md
```

## Style Conventions In The Resources

- The example code in the resources are largely compatible with both JavaScript and TypeScript.
  Double check before copying that you don't need to strip type annotations or alter imports.
- The JS SDK uses a **result-based** error style: every method returns `{ data, error }`
  (`DataResponse<T>`) or `{ success, error }` (`SuccessResponse`). Check `error` before
  using `data`. The SDK never throws for API errors — only for missing API key at
  construction time.
- All methods are `async` and return Promises. There are no sync variants.
- All recipient and sender addresses use the IANA-reserved `example.com` / `example.net`
  domains. Replace before running.

## Beyond This Skill

When a resource leaves something ambiguous, the SDK source itself is the final authority.
The published `mailchannels-sdk` package on npm also ships with its own README and TypeScript
type definitions — hover-docs in your editor are authoritative for parameter shapes.
