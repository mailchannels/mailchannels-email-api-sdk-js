---
name: mailchannels-cli
description: Command-line interface bundled with the MailChannels Email API JavaScript SDK (npm `@mailchannels/sdk`; run `npx @mailchannels/sdk <command>` or the `mailchannels` binary). Use when running or scripting terminal commands to send or queue email, pipe attachments, manage DKIM keys, check a sender domain, manage custom tracking domains, sub-accounts, suppressions, or webhooks, read metrics or usage, or start the local simulator; also API key setup (`MAILCHANNELS_API_KEY`), reading CLI output, and exit codes and errors. Skip when (a) writing JavaScript/TypeScript application code that imports the SDK — use the mailchannels-js skill; (b) developing the SDK or CLI itself — defer to the repo's root AGENTS.md; (c) the user needs another MailChannels interface such as SMTP or a non-JavaScript SDK.
---

# MailChannels CLI

This skill helps you run the **MailChannels command-line interface** that ships inside the
`@mailchannels/sdk` npm package. It is invoked as `mailchannels <command>` (after installing the
package) or `npx @mailchannels/sdk <command>` (no install), and it calls the MailChannels Email
API from a terminal, shell script, or CI job. It is specific to the CLI bundled with the
official JavaScript SDK.

> **Scope.** This skill is for *using* the CLI. Writing application code that imports
> `@mailchannels/sdk` is a different job — use the `mailchannels-js` skill. Working **on** the
> CLI (adding commands, changing output, releasing the package) is another — follow the repo's
> root `AGENTS.md`.

## How To Use This Skill

The body of each topic lives in [`resources/`](resources/). Read this file for context, the
ground rules, and the decision tree, then load only the resource files that match the task.
Don't preload everything.

### Decision Tree

Start at the top; descend until you hit a leaf, then read the linked resource. If multiple
branches apply (e.g. "send + attachments + DKIM"), read each leaf.

```
You're about to run a MailChannels CLI command. What does it need to do?

├── Get oriented — which commands exist, how flags and shells behave
│   → resources/overview.md
│
├── Authenticate (API key flag / env var, parent vs sub-account key, CI)
│   → resources/authentication.md
│
├── Send or queue an email
│   → resources/sending.md
│   └── …with file attachments or inline images?
│       → resources/attachments.md
│
├── Create / list / rotate / revoke hosted DKIM keys
│   → resources/dkim.md
│
├── Validate a sender domain's auth posture (DKIM/SPF/Lockdown/DNS)
│   → resources/domain-checks.md
│
├── Register or manage branded click / open / unsubscribe domains
│   → resources/custom-tracking-domains.md
│
├── Multi-tenant work — sub-accounts, their credentials, limits, usage
│   → resources/sub-accounts.md
│
├── Read analytics (volume, engagement, performance, senders) or
│   current-period usage
│   → resources/metrics-and-usage.md
│
├── Manage the suppression list (list, create, delete)
│   → resources/suppressions.md
│
├── Manage delivery-event webhooks (enroll, validate, inspect and
│   resend batches)
│   → resources/webhooks.md
│
├── Run the local API simulator
│   → resources/simulator.md
│
├── Read or script around CLI output (streams, ANSI codes, tables)
│   → resources/output-format.md
│
├── Diagnose a failing command (exit code 1, an error message)
│   → resources/error-handling.md
│
└── Need something the CLI doesn't offer (templates, personalizations,
    webhook signature verification, JSON output)
    → use the SDK: the mailchannels-js skill
```

## Ground Rules

These apply to every command. Read them before running anything.

- **Commands hit the live API.** Apart from `simulate` and `docs`, every command calls
  `https://api.mailchannels.net` with the key in use, and no flag or environment variable
  redirects it — the simulator is unreachable from CLI commands. Sends, deletions, and key
  rotations are real.
- **Only change what the user asked you to change.** Sending email, deleting webhooks,
  suppressions, sub-accounts, credentials, or tracking domains, and changing DKIM key status or
  send limits all have consequences. Confirm before running them; the list is in
  [overview](resources/overview.md#commands-that-change-or-delete-things).
- **Use placeholder data.** Never invent real recipient addresses; use `example.com` /
  `example.net`.
- **Keep API keys out of command lines, logs, and chat.** Prefer the `MAILCHANNELS_API_KEY`
  environment variable over `--api-key`. See [authentication](resources/authentication.md).
- **Exit code `0` means the call succeeded, not that the outcome was good.**
  `dkim check-domain` and `webhooks validate` exit `0` even when checks fail, and
  `emails send` / `emails queue` exit `0` as soon as the API accepts the message — long before
  delivery. Read the output.
- **Unknown flags are ignored silently.** A typo, or a flag the command doesn't have, does not
  error — for example `--dry-run` on `emails queue` is ignored and queues a *real* message. Check
  `<command> --help` when unsure.
- **Output is for humans.** There is no JSON mode, and ANSI color codes are always emitted. When
  you need structured results, use the SDK instead.

## Style Conventions In The Resources

- Commands are written `mailchannels …`; `npx @mailchannels/sdk …` is identical.
- Examples use bash/zsh syntax (`\` line continuations, single-quoted JSON).
  [overview](resources/overview.md#shell-differences) shows how to translate them for
  PowerShell and cmd.exe.
- All recipient and sender addresses use the IANA-reserved `example.com` / `example.net`
  domains. Replace before running. `YOUR-API-KEY` marks where a key goes.
- Output samples are trimmed and shown without ANSI color codes.
- Exit codes are `0` (the command ran to completion) or `1` (anything failed). Error text goes
  to stderr and is the SDK's message, prefixed `[MailChannels-CLI] [<Area>]`.

## Beyond This Skill

When a resource leaves something ambiguous, `mailchannels <command> --help` is the final
authority on flags and aliases for the installed version. The CLI is a thin layer over the SDK
modules — it prints their validation and API error messages verbatim — so the `mailchannels-js`
skill's resources explain the underlying rules (formats, limits, error types) in more depth.
