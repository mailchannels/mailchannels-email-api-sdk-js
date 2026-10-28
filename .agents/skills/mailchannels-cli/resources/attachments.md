# Attachments

`--attachments` (`-a`) makes the CLI read a **JSON array of attachments from standard input**. There
is no flag that takes a file path, so you build the JSON — Base64-encoding each file yourself — and
pipe it in.

## Attachment Shape

```json
[
  {
    "filename": "report.pdf",
    "content": "JVBERi0xLjQK…",
    "type": "application/pdf",
    "content_id": "report"
  },
  {
    "filename": "notes.txt",
    "content": "dGVzdDI="
  }
]
```

| Field        | Required | Notes                                                                                                                                               |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filename`   | Yes      | Name shown to the recipient.                                                                                                                        |
| `content`    | Yes      | **Base64-encoded** file bytes.                                                                                                                      |
| `type`       | No       | MIME type. Inferred from `filename` when omitted.                                                                                                   |
| `content_id` | No       | Makes the attachment inline; reference it from HTML as `<img src="cid:report">`. Note the snake_case name — the SDK's `contentId` is not read here. |

The top level **must be an array**, even for a single attachment. A bare object crashes the command
with `TypeError: inputAttachments.map is not a function`.

## Sending Attachments

Pipe the JSON in and add `--attachments`:

```sh
cat attachments.json | mailchannels emails queue \
  --from "billing@example.com" \
  --to "recipient@example.net" \
  --subject "Your invoice" \
  --text "See attached." \
  --attachments
```

Input redirection works the same way in bash, zsh, and cmd.exe:

```sh
mailchannels emails queue \
  --from "billing@example.com" \
  --to "recipient@example.net" \
  --subject "Your invoice" \
  --text "See attached." \
  --attachments < attachments.json
```

PowerShell has no `<` redirection; pipe the file instead:

```powershell
Get-Content attachments.json -Raw | mailchannels emails queue `
  --from "billing@example.com" `
  --to "recipient@example.net" `
  --subject "Your invoice" `
  --text "See attached." `
  --attachments
```

The attachments flag consumes all of stdin, so nothing else can be piped to the same command.

## Building The JSON From Real Files

Encode a file as Base64 (no line wrapping):

| Platform              | Command                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| Linux (GNU coreutils) | `base64 -w0 report.pdf`                                                      |
| macOS                 | `base64 -i report.pdf`                                                       |
| PowerShell            | `[Convert]::ToBase64String([IO.File]::ReadAllBytes("report.pdf"))`           |
| Any OS with Node.js   | `node -p "require('node:fs').readFileSync('report.pdf').toString('base64')"` |

One file in bash (assumes a filename without quotes or backslashes):

```sh
printf '[{"filename":"report.pdf","type":"application/pdf","content":"%s"}]' "$(base64 -w0 report.pdf)" \
  | mailchannels emails queue \
      --from "billing@example.com" \
      --to "recipient@example.net" \
      --subject "Your invoice" \
      --text "See attached." \
      --attachments
```

Several files in PowerShell:

```powershell
$files = 'report.pdf', 'logo.png'
$attachments = foreach ($file in $files) {
  @{
    filename = Split-Path $file -Leaf
    content  = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $file).Path))
  }
}

# -InputObject keeps a single attachment an array; piping would unwrap it to an object.
ConvertTo-Json -InputObject @($attachments) -Compress | mailchannels emails queue `
  --from "billing@example.com" `
  --to "recipient@example.net" `
  --subject "Your files" `
  --text "See attached." `
  --attachments
```

For other cases — odd filenames, many files, generated content — write a short script (Node.js is
already installed) that prints the JSON array to stdout, and pipe it in.

## Inline Images (CID References)

Give the attachment a `content_id` and reference it from the HTML body:

```json
[{ "filename": "logo.png", "content": "iVBORw0KGgo…", "content_id": "company-logo" }]
```

```sh
mailchannels emails queue \
  --from "sender@example.com" \
  --to "recipient@example.net" \
  --subject "Inline image" \
  --html "<img src='cid:company-logo' alt='Company logo'>" \
  --attachments < logo.json
```

## Errors

| Message                                                                     | Cause                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------- |
| `'--attachments' requires JSON input piped to stdin.`                       | Nothing was piped in (stdin is an interactive terminal). |
| `JSON input for '--attachments' is not valid.`                              | The input isn't parseable JSON.                          |
| `Attachment at index N is missing required fields 'content' or 'filename'.` | The entry at that position lacks one of them.            |
| `TypeError: inputAttachments.map is not a function`                         | The JSON is a single object, not an array.               |

## Limits

- Up to **1000 attachments** per message.
- The whole message — headers, body, and attachments — must stay under **30 MB**. Base64 inflates
  files by about a third, so roughly 22 MB of raw files is the practical ceiling. Larger payloads
  are rejected by the API (see [sending](sending.md#limits)).
