# Local Simulator

`mailchannels simulate` starts a local HTTP server that emulates the SDK-supported Email API
endpoints. It holds state in memory, so you can develop and test an application locally
without touching the real MailChannels service.

> **The simulator is for SDK clients, not for other CLI commands.** The CLI has no flag or
> environment variable for a base URL, so every other `mailchannels` command always calls the
> real API at `https://api.mailchannels.net`. You cannot "try out" `emails queue` or
> `suppressions create` against the simulator through the CLI.

## Start It

```sh
mailchannels simulate
```

```text
[MailChannels-CLI] [Simulator] listening on http://127.0.0.1:8787
```

The simulator runs in the **foreground** until you stop it with Ctrl+C (`SIGINT`) or `SIGTERM`,
which prints `[Simulator] Shutting down simulator...`. In an agent session, start it as a
background process and stop that process when you are done.

| Flag | Environment variable | Description | Default |
| --- | --- | --- | --- |
| `--port <number>`, `-p` | `MAILCHANNELS_SIMULATOR_PORT` | Port to listen on (0–65535). | `8787` |
| `--host <host>` | `MAILCHANNELS_SIMULATOR_HOST` | Address to bind to. | `127.0.0.1` |
| `--silent`, `-s` | — | Suppress the startup line and request logs. | `false` |

- A flag wins over its environment variable.
- **Use `--host`, not `-h`.** `-h` always prints help and exits `0` without starting a server,
  so `mailchannels simulate -h 0.0.0.0` does not do what it looks like.
- With `--silent` nothing is printed until shutdown, so you cannot see the URL — use a fixed
  `--port`.
- Failures to start exit `1`: an invalid port prints
  `[Simulator] Invalid port '…': must be an integer between 0 and 65535.`; a port already in
  use prints `[Simulator] <system error>`.

```sh
mailchannels simulate --host 127.0.0.1 --port 8787 --silent
```

## Check That It Is Up

Every path outside `/tx/` returns a `404` JSON body, so probe an API path. Any non-empty
`X-API-Key` header is accepted:

```sh
curl -s -o /dev/null -w "%{http_code}\n" -H "X-API-Key: test" http://127.0.0.1:8787/tx/v1/usage
```

`200` means the simulator is ready. (In Windows PowerShell, `curl` is an alias for
`Invoke-WebRequest`; call `curl.exe` instead.)

## Point An SDK Client At It

Set the SDK's `baseUrl` client option to the simulator's URL, for example
`http://127.0.0.1:8787`. Starting the simulator in code with `createSimulator`, running it
alongside a test runner, and example tests are covered by the `mailchannels-js` skill's
`testing.md`.

## What It Supports

- Email sends and queued sends.
- Domain checks.
- DKIM key create, list, rotate, and update.
- Custom tracking domain create, list, update, and delete.
- Webhook enrollment, listing, validation, signing-key lookup, and batch inspection.
- Sub-account lifecycle, API keys, SMTP passwords, limits, and usage.
- Engagement, performance, recipient-behaviour, sender, volume, and usage metrics.
- Suppression create, list, and delete.

## Limitations

- It approximates the MailChannels service for local development and testing. It is not a
  production implementation and may differ from the live service.
- State is in memory only and is reset when the process stops.
- Any non-empty `X-API-Key` is accepted, with separate in-memory state per API key.
- Webhook responses are simulated locally, but no real webhook callbacks are sent to your
  application.
- Custom tracking domain verification is simulated; DNS records are not checked.
