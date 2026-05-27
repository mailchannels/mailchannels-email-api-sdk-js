<!-- #region options -->
- `options` `EmailsSendOptions` <Badge type="danger">required</Badge>: Send options `EmailsSendOptions`.
  - `attachments` `(EmailsSendAttachment | Promise<EmailsSendAttachment>)[]` <Badge type="info">optional</Badge>: An array of attachments to be sent with the email.
    - `content` `string` <Badge type="danger">required</Badge>: The attachment data, encoded in Base64.
    - `filename` `string` <Badge type="danger">required</Badge>: The name of the attachment file.
    - `type` `string` <Badge type="info">optional</Badge>: The MIME type of the attachment.
    - `contentId` `string` <Badge type="info">optional</Badge>: The `Content-ID` header value for inline attachments, referenced from HTML with `cid:`.
    - `disposition` `"attachment" | "inline"` <Badge type="info">optional</Badge>: The `Content-Disposition` header value for the attachment. Defaults to `attachment`.
    > [!IMPORTANT]
    > Usage notes:
    > - Multiple attachments can be included in a single email.
    > - Maximum of `1000` attachments per email.
    > - Combined size limit (attachments + email content) is `30MB`.
    > - Base64 encoding is required for all attachment content.
  - `campaignId` `string` <Badge type="info">optional</Badge>: The campaign identifier. If specified, this ID will be included in all relevant webhooks. It can be up to 48 UTF-8 characters long and must not contain spaces.
  - `bcc` `EmailsSendRecipient[] | EmailsSendRecipient | string[] | string` <Badge type="info">optional</Badge>: The BCC recipients of the email.
  - `cc` `EmailsSendRecipient[] | EmailsSendRecipient | string[] | string` <Badge type="info">optional</Badge>: The CC recipients of the email.
  - `dkim` `object` <Badge type="info">optional</Badge>: The DKIM settings for the email.
    - `domain` `string` <Badge type="danger">required</Badge>: The domain to sign the email with.
    - `privateKey` `string` <Badge type="info">optional</Badge>: The private key to sign the email with. Can be undefined if the domain has an active DKIM key.
    - `selector` `string` <Badge type="danger">required</Badge>: The DKIM selector to use.
  - `envelopeFrom` `EmailsSendRecipient | string` <Badge type="info">optional</Badge>: Optional envelope sender address. If not set, the envelope sender defaults to the `from.email` field. Can be overridden per-personalization. Only the email portion is used; the name field is ignored.
  - `from` `EmailsSendRecipient | string` <Badge type="danger">required</Badge>: The sender of the email.
  - `headers` `Record<string, string>` <Badge type="info">optional</Badge>: An object containing key-value pairs, where both keys (header names) and values must be strings. These pairs represent custom headers to be substituted.
    > [!IMPORTANT]
    > Please note the following restrictions and behavior:
    > - **Reserved headers**: The following headers cannot be modified: `Authentication-Results`, `BCC`, `CC`, `Content-Transfer-Encoding`, `Content-Type`, `DKIM-Signature`, `From`, `Message-ID`, `Received`, `Reply-To`, `Subject`, `To`.
    > - **Header precedence**: If a header is defined in both the personalizations object and the root headers, the value from personalizations will be used.
    > - **Case sensitivity**: Headers are treated as case-insensitive. If multiple headers differ only by case, only one will be used, with no guarantee of which one.
  - `to` `EmailsSendRecipient[] | EmailsSendRecipient | string[] | string` <Badge type="danger">required</Badge>: The recipients of the email.
  - `tracking` `EmailsSendTracking` <Badge type="info">optional</Badge>: Adjust open and click tracking for the message.
    - `click` `object` <Badge type="info">optional</Badge>: Click tracking settings.
      - `enable` `boolean` <Badge type="info">optional</Badge>: Enable click tracking.
    - `open` `object` <Badge type="info">optional</Badge>: Open tracking settings.
      - `enable` `boolean` <Badge type="info">optional</Badge>: Enable open tracking.
    > [!INFO]
    > Tracking for your messages requires a [subscription](https://www.mailchannels.com/pricing/#for_devs) that supports open and click tracking.
    >
    > Only links (`<a>` tags) meeting all of the following conditions are processed for click tracking:
    > - The URL is non-empty.
    > - The URL starts with `http` or `https`.
    > - The link does not have a `clicktracking` attribute set to `off`.
  - `replyTo` `EmailsSendRecipient | string` <Badge type="info">optional</Badge>: The reply-to address of the email.
  - `subject` `string` <Badge type="danger">required</Badge>: The subject of the email.
  - `html` `string` <Badge type="info">optional</Badge>: The HTML content of the email.
  - `text` `string` <Badge type="info">optional</Badge>: The plain text content of the email.
    > [!TIP]
    > Including a plain text version of your email ensures that all recipients can read your message, including those with email clients that lack HTML support.
    >
    > You can use the [`html-to-text`](https://www.npmjs.com/package/html-to-text) package to convert your HTML content to plain text.
  - `content` `EmailsSendContent[]` <Badge type="info">optional</Badge>: Send the body of your message in multiple different formats. The recipient's email client will render the message using the content type that best fits their environment.
    - `type` `string` <Badge type="danger">required</Badge>: The MIME type of the content you are including in your email.
    - `value` `string` <Badge type="danger">required</Badge>: The actual content of the specified MIME type that you are including in the message.
      > [!WARNING]
      > Cannot contain a `text/html` entry when `html` is set, or a `text/plain` entry when `text` is set.
    > [!NOTE]
    > For more information about sending emails with multiple content parts, see the [MailChannels documentation](https://docs.mailchannels.net/email-api/sending-email/content-types).
    <!---->
    > [!IMPORTANT]
    > Either `html`, `text`, or `content` must be provided.
  - `template` `EmailsSendTemplate` <Badge type="info">optional</Badge>: Template configuration for rendering email content with a template engine.
    - `type` `EmailsSendTemplateType` <Badge type="danger">required</Badge>: The template type of the content
    - `data` `Record<string, EmailsSendTemplateValue>` <Badge type="info">optional</Badge>: Template variables, overridable per-personalization. An object containing key-value pairs of variables to set for template rendering.
    > [!IMPORTANT]
    > Keys must be strings, and values can be one of the following types:
    > - string
    > - number
    > - boolean
    > - list, whose values are all of permitted types
    > - map, whose keys must be strings, and whose values are all of permitted types
  - `personalizations` `EmailsSendPersonalization[]` <Badge type="info">optional</Badge>: Explicit personalization objects for advanced payloads with multiple recipient groups or per-personalization overrides.
  - `transactional` `boolean` <Badge type="info">optional</Badge>: Mark these messages as transactional or non-transactional. In order for a message to be marked as non-transactional, it must have exactly one recipient per personalization, and it must be DKIM signed. 400 Bad Request will be returned if there are more than one recipient in any personalization for non-transactional messages. If a message is marked as non-transactional, it changes the sending process as follows:
    List-Unsubscribe headers will be added.
    <!-- #endregion options -->
- `dryRun` `boolean` <Badge type="info">optional</Badge>: When set to `true`, the email will not be sent. Instead, the fully rendered message will be returned in the `data.rendered` property of the response.
  > [!TIP]
  > Use `dryRun` to test your email message before sending it.
