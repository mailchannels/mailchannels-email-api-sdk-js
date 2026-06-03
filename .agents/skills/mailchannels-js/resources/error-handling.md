# Error Handling

The JS SDK uses a **result-based** error style. Every method returns either a
`DataResponse<T>` or a `SuccessResponse` — the SDK never throws for API errors.

```ts
type DataResponse<T> =
  | { data: T;    error: null }
  | { data: null; error: ErrorResponse }

type SuccessResponse = {
  success: boolean
  error: ErrorResponse | null
}
```

Always destructure and check `error` before using the result:

```ts
const { data, error } = await mc.emails.queue({ ... })

if (error) {
  // error.message    — human-readable description
  // error.type       — stable string identifier (see table below)
  // error.statusCode — HTTP status code, or null for non-HTTP errors
  console.error(error.message, error.type, error.statusCode)
  return
}
// data is non-null here
console.log(data.requestId)
```

### Error Types

| `error.type` | HTTP status | Meaning |
| --- | --- | --- |
| `'invalid_request_error'` | 400 | Bad payload, validation errors. |
| `'authentication_error'` | 401 | Invalid or missing API key. |
| `'permission_error'` | 403 | Feature not enabled or account limits. |
| `'not_found'` | 404 | Resource not found. |
| `'conflict_error'` | 409 | Duplicate webhook, duplicate suppression, etc. |
| `'payload_too_large_error'` | 413 | Over the 30 MB limit. |
| `'unprocessable_entity_error'` | 422 | Semantically invalid request. |
| `'rate_limit_error'` | 429 | Too many requests — slow down. |
| `'internal_server_error'` | 500 | Generic server-side failure. |
| `'validation_error'` | `null` | Client-side validation failed before any HTTP call. |
| `'application_error'` | `null` | Unexpected JS/network error (e.g. fetch failed). |
| `'api_error'` | varies | Fallback for unmapped status codes. |

### Handling Patterns

The `message` field is a human-readable description of the error, useful for logging and debugging,
but it should not be parsed or used for control flow as it may change without warning. Instead, use the `type` field for error handling logic.

```ts
const { data, error } = await mc.emails.queue(message)

if (error) {
  switch (error.type) {
    case 'payload_too_large_error':
      // Split recipient list or shrink attachments, then retry.
      break
    case 'rate_limit_error':
      // Back off and retry — check error.statusCode === 429.
      break
    case 'invalid_request_error':
    case 'validation_error':
      // Application bug — fix the payload, don't retry blindly.
      console.error('Invalid payload:', error.message)
      break
    case 'authentication_error':
      // Wrong API key. Don't retry.
      console.error('Invalid authentication:', error.message)
      break
    case 'permission_error':
      // Feature gated or sub-account suspended. Don't retry.
      console.error('Permission denied:', error.message)
      break
    case 'internal_server_error':
    case 'application_error':
      // Transient — retry with exponential backoff.
      break
    default:
      console.error('Unexpected error:', error.message)
  }
}
```

### Client-Side Validation Errors (`validation_error`)

These produce `error.type === 'validation_error'` and `error.statusCode === null` before
any HTTP call:

- Missing `from`, `to` / `personalizations`, `subject`, body content.
- Empty collections.
- Reserved headers in `headers`.
- Non-string header values.
- `campaignId` too long or containing spaces.
- `personalizations` with `transactional: false` and multiple recipients.
- Invalid DKIM field combinations.

Failing early gives a precise error rather than a vague 400.

### Retrying and Idempotency

| Error type | Safe to retry? |
| --- | --- |
| `invalid_request_error`, `authentication_error`, `permission_error`, `conflict_error`, `payload_too_large_error`, `validation_error` | **No** — caller problem; fix the input or credentials. |
| `rate_limit_error` | Yes, after backing off. |
| `internal_server_error`, `application_error` | Yes, with exponential backoff. |

The API has no idempotency keys, so retrying `emails.send()` or `emails.queue()` after a
transient failure can produce a duplicate send. Build idempotency into the caller (e.g. a
unique `campaignId` + recipient-set check) when at-most-once delivery matters.

### SDK Exceptions

`new MailChannels('')` (empty or missing key) throws synchronously:

```ts
try {
  const mc = new MailChannels(process.env.MAILCHANNELS_API_KEY)
  // ...
}
catch (err) {
  // err.message === 'Missing MailChannels API key.'
}
```

`Attachment.fromBlob` (invalid object type) throws when called synchronously:

```ts
try {
  const attachment = await Attachment.fromBlob(blob1, { filename: "file.pdf" })
  // ...
}
catch (err) {
  // err.message === 'Unable to create attachment: expected a Blob.'
}
```

Almost all other failure modes surface through the `error` field in the returned result object.
