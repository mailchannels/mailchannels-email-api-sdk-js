import type { DataResponse } from "../responses";

export interface EmailsSendRecipient {
  /**
   * The email address of the recipient.
   */
  email: string;
  /**
   * The name of the recipient. Display name in raw text, e.g. John Doe, 张三.
   */
  name?: string;
}

export interface EmailsSendAttachment {
  /**
   * The attachment data, encoded in base64.
   */
  content: string;
  /**
   * The name of the attachment file.
   */
  filename: string;
  /**
   * The MIME type of the attachment.
   */
  type?: string;
  /**
   * The `Content-ID` header value for inline attachments, referenced from HTML with `cid:`.
   */
  contentId?: string;
  /**
   * The `Content-Disposition` header value for the attachment.
   */
  disposition?: "attachment" | "inline";
}

export interface EmailsSendTracking {
  /**
   * Track when a recipient clicks a link in your email.
   */
  click?: {
    /**
     * The name of a configured active click tracking domain.
     * When specified, click tracking links will use this domain instead of the default MailChannels domain.
     * The domain must be registered in your account and have an active status.
     */
    customDomainName?: string;
    /**
     * @default false
     */
    enable?: boolean;
  };
  /**
   * Track when a recipient opens your email. Please note that some email clients may not support open tracking.
   */
  open?: {
    /**
     * The name of a configured active open tracking domain.
     * When specified, the open tracking pixel will use this domain instead of the default MailChannels domain.
     * The domain must be registered in your account and have an active status.
     */
    customDomainName?: string;
    /**
     * @default false
     */
    enable?: boolean;
  };
}

export type EmailsSendTemplateType = "mustache";

export type EmailsSendTemplateValue = string | boolean | number | EmailsSendTemplateValue[] | { [key: string]: EmailsSendTemplateValue };

export interface EmailsSendTemplate {
  /**
   * The template type of the content
   */
  type: EmailsSendTemplateType;
  /**
   * Template variables, overridable per-personalization.
   * An object containing key-value pairs of variables to set for template rendering.
   *
   * Keys must be strings, and values can be one of the following types:
   * - string
   * - number
   * - boolean
   * - list, whose values are all of permitted types
   * - map, whose keys must be strings, and whose values are all of permitted types
   */
  data?: Record<string, EmailsSendTemplateValue>;
}

export interface EmailsSendContent {
  /**
   * The MIME type of the content you are including in your email.
   */
  type: string;
  /**
   * The actual content of the specified MIME type that you are including in the message.
   */
  value: string;
}

export type EmailsSendRecipientInput = EmailsSendRecipient[] | EmailsSendRecipient | string[] | string;

export interface EmailsSendDkim {
  /**
   * Domain used for DKIM signing.
   */
  domain?: string;
  /**
   * DKIM private key encoded in Base64.
   */
  privateKey?: string;
  /**
   * DKIM selector in the domain DNS records.
   */
  selector?: string;
}

export interface EmailsSendPersonalization {
  /**
   * The BCC recipients for this personalization.
   */
  bcc?: EmailsSendRecipientInput;
  /**
   * The CC recipients for this personalization.
   */
  cc?: EmailsSendRecipientInput;
  /**
   * DKIM settings for this personalization.
   */
  dkim?: EmailsSendDkim;
  /**
   * Optional envelope sender for this personalization.
   */
  envelopeFrom?: EmailsSendRecipient | string;
  /**
   * Optional sender override for this personalization.
   */
  from?: EmailsSendRecipient | string;
  /**
   * Custom headers for this personalization.
   */
  headers?: Record<string, string>;
  /**
   * Reply-to override for this personalization.
   */
  replyTo?: EmailsSendRecipient | string;
  /**
   * Subject override for this personalization.
   */
  subject?: string;
  /**
   * The recipients for this personalization.
   */
  to: EmailsSendRecipientInput;
  /**
   * Per-personalization template data. Merged with (and overrides) root-level `template.data`.
   */
  template?: Required<Omit<EmailsSendTemplate, "type">>;
}

interface EmailsSendOptionsBase {
  /**
   * An array of attachments to be sent with the email.
   */
  attachments?: (EmailsSendAttachment | Promise<EmailsSendAttachment>)[];
  /**
   * The campaign identifier. If specified, this ID will be included in all relevant webhooks. It can be up to 48 UTF-8 characters long and must not contain spaces.
   */
  campaignId?: string;
  /**
   * The BCC recipients of the email. Can be an array of email addresses or an array of objects with email and name properties or a single email address string or an object with email and name properties.
   * @example
   * [
   *   { email: 'email1@example.com', name: 'Example1' },
   *   { email: 'email2@example.com', name: 'Example2' }
   * ]
   * @example
   * { email: 'email@example.com', name: 'Example' }
   * @example
   * ['email1@example.com', 'email2@example.com']
   * @example
   * 'email@example.com'
   * @example
   * 'Name <email@example.com>'
   */
  bcc?: EmailsSendRecipientInput;
  /**
   * The CC recipients of the email. Can be an array of email addresses or an array of objects with email and name properties or a single email address string or an object with email and name properties.
   * @example
   * [
   *   { email: 'email1@example.com', name: 'Example1' },
   *   { email: 'email2@example.com', name: 'Example2' }
   * ]
   * @example
   * { email: 'email@example.com', name: 'Example' }
   * @example
   * ['email1@example.com', 'email2@example.com']
   * @example
   * 'email@example.com'
   * @example
   * 'Name <email@example.com>'
   */
  cc?: EmailsSendRecipientInput;
  /**
   * The DKIM settings for the email.
   */
  dkim?: EmailsSendDkim;
  /**
   * Optional envelope sender address. If not set, the envelope sender defaults to the `from.email` field. Can be overridden per-personalization. Only the email portion is used; the name field is ignored.
   * @example
   * { email: 'email@example.com', name: 'Example' }
   * @example
   * 'email@example.com'
   * @example
   * 'Name <email@example.com>'
   */
  envelopeFrom?: EmailsSendRecipient | string;
  /**
   * The sender of the email. Can be a string or an object with email and name properties.
   * @example
   * { email: 'email@example.com', name: 'Example' }
   * @example
   * 'email@example.com'
   * @example
   * 'Name <email@example.com>'
   */
  from: EmailsSendRecipient | string;
  /**
   * An object containing key-value pairs, where both keys (header names) and values must be strings. These pairs represent custom headers to be substituted.
   *
   * Please note the following restrictions and behavior:
   * - **Reserved headers**: The following headers cannot be modified: `Authentication-Results`, `BCC`, `CC`, `Content-Transfer-Encoding`, `Content-Type`, `DKIM-Signature`, `From`, `Message-ID`, `Received`, `Reply-To`, `Subject`, `To`.
   * - **Header precedence**: If a header is defined in both the personalizations object and the root headers, the value from personalizations will be used.
   * - **Case sensitivity**: Headers are treated as case-insensitive. If multiple headers differ only by case, only one will be used, with no guarantee of which one.
   */
  headers?: Record<string, string>;
  /**
   * Explicit personalization objects. Use this for advanced MailChannels payloads with multiple recipient groups or per-personalization overrides.
   */
  personalizations?: EmailsSendPersonalization[];
  /**
   * The recipient of the email. Can be an array of email addresses or an array of objects with `email` and `name` properties or a single email address string or an object with `email` and `name` properties.
   * @example
   * [
   *   { email: 'email1@example.com', name: 'Example1' },
   *   { email: 'email2@example.com', name: 'Example2' },
   * ]
   * @example
   * { email: 'email@example.com', name: 'Example' }
   * @example
   * ['email1@example.com', 'email2@example.com']
   * @example
   * 'email@example.com'
   * @example
   * 'Name <email@example.com>'
   */
  to?: EmailsSendRecipientInput;
  /**
   * Adjust open and click tracking for the message. Please note that enabling tracking for your messages requires a subscription that supports open and click tracking.
   *
   * Only links (`<a>` tags) meeting all of the following conditions are processed for click tracking:
   * - The URL is non-empty.
   * - The URL starts with `http` or `https`.
   * - The link does not have a `clicktracking` attribute set to `off`.
   */
  tracking?: EmailsSendTracking;
  /**
   * A single `replyTo` recipient object, or a single email address.
   * @example
   * { email: 'email@example.com', name: 'Example' }
   * @example
   * 'email@example.com'
   * @example
   * 'Name <email@example.com>'
   */
  replyTo?: EmailsSendRecipient | string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * Template configuration for rendering email content with a template engine.
   */
  template?: EmailsSendTemplate;
  /**
   * Mark these messages as transactional or non-transactional. In order for a message to be marked as non-transactional, it must have exactly one recipient per personalization, and it must be DKIM signed. 400 Bad Request will be returned if there are more than one recipient in any personalization for non-transactional messages. If a message is marked as non-transactional, it changes the sending process as follows:
   *
   * List-Unsubscribe and List-Unsubscribe-Post headers will be added, unless you supply your own List-Unsubscribe header, in which case yours is used and neither is added.
   * @default true
   */
  transactional?: boolean;
  /**
   * Settings to customize the unsubscribe experience for the message.
   */
  unsubscribe?: {
    /**
     * The name of a configured active unsubscribe tracking domain.
     * When specified, unsubscribe links will use this domain instead of the default MailChannels domain.
     * The domain must be registered in your account and have an active status.
     */
    customDomainName?: string;
  };
}

type EmailsSendTargetOptions =
  | {
    personalizations: (Omit<EmailsSendPersonalization, "template"> & { template?: never })[];
    to?: never;
    cc?: never;
    bcc?: never;
  }
  | {
    template: EmailsSendTemplate;
    personalizations: EmailsSendPersonalization[];
    to?: never;
    cc?: never;
    bcc?: never;
  }
  | {
    personalizations?: never;
    to: EmailsSendRecipientInput;
    cc?: EmailsSendRecipientInput;
    bcc?: EmailsSendRecipientInput;
  };

export type EmailsSendOptions = EmailsSendOptionsBase & EmailsSendTargetOptions & (
  | {
    /**
     * The HTML content of the email.
     * @example
     * '<p>Hello World</p>'
     */
    html: string;
    /**
     * The plain text content of the email (optional when `html` is provided).
     * @example
     * 'Hello World'
     */
    text?: string;
    /**
     * Additional content parts. Cannot contain a `text/html` entry when `html` is set, or a `text/plain` entry when `text` is set.
     */
    content?: EmailsSendContent[];
  }
  | {
    /**
     * The HTML content of the email (optional when `text` is provided).
     * @example
     * '<p>Hello World</p>'
     */
    html?: string;
    /**
     * The plain text content of the email.
     * @example
     * 'Hello World'
     */
    text: string;
    /**
     * Additional content parts. Cannot contain a `text/html` entry when `html` is set, or a `text/plain` entry when `text` is set.
     */
    content?: EmailsSendContent[];
  }
  | {
    /**
     * The HTML content of the email (optional when `content` is provided).
     * @example
     * '<p>Hello World</p>'
     */
    html?: string;
    /**
     * The plain text content of the email (optional when `content` is provided).
     * @example
     * 'Hello World'
     */
    text?: string;
    /**
     * Send the body of your message in multiple different formats. The recipient's email client will render the message using the content type that best fits their environment. Cannot contain a `text/html` entry when `html` is set, or a `text/plain` entry when `text` is set.
     */
    content: EmailsSendContent[];
  }
);

export type EmailsSendResponse = DataResponse<{
  /**
   * Fully rendered message if `dryRun` was set to `true`. A string representation of a rendered message, one per personalization in the request.
   */
  rendered?: string[];
  /**
   * The Request ID is a unique identifier generated by the service to track the HTTP request. It will also be included in all webhooks for reference.
   */
  requestId?: string;
  results?: {
    /**
     * The index of the personalization in the request. Starts at 0.
     */
    index?: number;
    /**
     * The Message ID is a unique identifier generated by the service. Each personalization has a distinct Message ID, which is also used in the `Message-Id` header and included in webhooks.
     */
    messageId: string;
    /**
     * A human-readable explanation of the status.
     */
    reason?: string;
    /**
     * The status of the message. Note that 'sent' is a temporary status; the final status will be provided through webhooks, if configured.
     */
    status: "sent" | "failed";
  }[];
}>;
