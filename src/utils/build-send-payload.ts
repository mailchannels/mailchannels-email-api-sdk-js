import { parseArrayRecipients, parseRecipient } from "./parse-recipients";
import { stripPemHeaders } from "./strip-pem-headers";
import type { EmailsSendDkim, EmailsSendOptions, EmailsSendPersonalization, EmailsSendTemplate } from "../types/emails/send";
import type { EmailsSendPayload, EmailsSendPayloadPersonalization } from "../types/emails/internal";

const RESERVED_HEADER_NAMES = new Set([
  "authentication-results",
  "bcc",
  "cc",
  "content-transfer-encoding",
  "content-type",
  "dkim-signature",
  "from",
  "message-id",
  "received",
  "reply-to",
  "subject",
  "to"
]);

const MAX_ATTACHMENTS = 1000;
const MAX_PERSONALIZATIONS = 1000;
const MAX_RECIPIENTS = 1000;
const MAX_CAMPAIGN_ID_LENGTH = 48;

const getRecipientCount = (recipients?: EmailsSendPayload["personalizations"][number]["to"]) => recipients?.length || 0;

const isValidTemplateValue = (value: unknown): boolean => {
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") return true;
  if (Array.isArray(value)) return value.every(isValidTemplateValue);
  if (value !== null && typeof value === "object") return Object.values(value).every(isValidTemplateValue);
  return false;
};

const validateTemplateData = (data: EmailsSendTemplate["data"] | undefined, label: string) => {
  if (data === undefined) return null;
  if (data === null || Array.isArray(data) || typeof data !== "object") {
    return `${label} template data must be a key/value object.`;
  }

  for (const [key, value] of Object.entries(data)) {
    if (!isValidTemplateValue(value)) {
      return `${label} template data key '${key}' has an invalid value. Values must be strings, booleans, numbers, lists, or maps.`;
    }
  }
  return null;
};

const validateHeaderMap = (headers: Record<string, string> | undefined, label: string) => {
  if (!headers) return null;

  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (typeof headerValue !== "string") {
      return `${label} header '${headerName}' must have a string value.`;
    }

    if (RESERVED_HEADER_NAMES.has(headerName.toLowerCase())) {
      return `${label} headers cannot include the reserved header '${headerName}'.`;
    }
  }

  return null;
};

const validateSendDkim = (dkim: EmailsSendDkim | undefined, label: string) => {
  if (!dkim) return null;

  if (dkim.domain && !dkim.selector) {
    return `${label} DKIM domain requires a selector.`;
  }

  if (dkim.privateKey && (!dkim.domain || !dkim.selector)) {
    return `${label} DKIM privateKey requires both a domain and selector.`;
  }

  return null;
};

const mapDkim = (dkim?: EmailsSendDkim) => ({
  dkim_domain: dkim?.domain,
  dkim_private_key: dkim?.privateKey ? stripPemHeaders(dkim.privateKey) : undefined,
  dkim_selector: dkim?.selector
});

const mapPersonalization = (personalization: EmailsSendPersonalization, index: number, rootTemplateData?: EmailsSendTemplate["data"]) => {
  const to = parseArrayRecipients(personalization.to);
  if (!to || !to.length) {
    return `Personalization at index ${index} must include at least one recipient in the 'to' field.`;
  }

  if (to.length > MAX_RECIPIENTS) {
    return `Personalization at index ${index} cannot include more than ${MAX_RECIPIENTS} 'to' recipients.`;
  }

  const cc = parseArrayRecipients(personalization.cc);
  if (cc && cc.length > MAX_RECIPIENTS) {
    return `Personalization at index ${index} cannot include more than ${MAX_RECIPIENTS} 'cc' recipients.`;
  }

  const bcc = parseArrayRecipients(personalization.bcc);
  if (bcc && bcc.length > MAX_RECIPIENTS) {
    return `Personalization at index ${index} cannot include more than ${MAX_RECIPIENTS} 'bcc' recipients.`;
  }

  const headerError = validateHeaderMap(personalization.headers, `Personalization at index ${index}`);
  if (headerError) {
    return headerError;
  }

  const dkimError = validateSendDkim(personalization.dkim, `Personalization at index ${index}`);
  if (dkimError) {
    return dkimError;
  }

  const templateDataError = validateTemplateData(personalization.template?.data, `Personalization at index ${index}`);
  if (templateDataError) {
    return templateDataError;
  }

  const dynamic_template_data = (rootTemplateData || personalization.template?.data) ? { ...rootTemplateData, ...personalization.template?.data } : undefined;

  return {
    bcc,
    cc,
    ...mapDkim(personalization.dkim),
    dynamic_template_data,
    envelope_from: parseRecipient(personalization.envelopeFrom),
    from: parseRecipient(personalization.from),
    headers: personalization.headers,
    reply_to: parseRecipient(personalization.replyTo),
    subject: personalization.subject,
    to
  } satisfies EmailsSendPayloadPersonalization;
};

export const buildSendPayload = (options: EmailsSendOptions): EmailsSendPayload | string => {
  const { from, html, text } = options;
  const contentTypes = options.content ? new Set(options.content.map(item => item.type.toLowerCase())) : undefined;

  const parsedFrom = parseRecipient(from);
  if (!parsedFrom || !parsedFrom.email) {
    return "No sender provided. Use the `from` option to specify a sender";
  }

  if (!text && !html && (!options.content || !options.content.length)) {
    return "No email content provided";
  }

  if (html && contentTypes?.has("text/html")) {
    return "Cannot provide both 'html' and a 'content' entry with type 'text/html'.";
  }

  if (text && contentTypes?.has("text/plain")) {
    return "Cannot provide both 'text' and a 'content' entry with type 'text/plain'.";
  }

  if (options.attachments && options.attachments.length > MAX_ATTACHMENTS) {
    return `The maximum number of attachments is ${MAX_ATTACHMENTS}.`;
  }

  if (options.campaignId && (options.campaignId.length > MAX_CAMPAIGN_ID_LENGTH || /\s/.test(options.campaignId))) {
    return `campaignId must be ${MAX_CAMPAIGN_ID_LENGTH} characters or fewer and must not contain spaces.`;
  }

  const rootHeaderError = validateHeaderMap(options.headers, "Root");
  if (rootHeaderError) {
    return rootHeaderError;
  }

  const rootDkimError = validateSendDkim(options.dkim, "Root");
  if (rootDkimError) {
    return rootDkimError;
  }

  const rootTemplateDataError = validateTemplateData(options.template?.data, "Root");
  if (rootTemplateDataError) {
    return rootTemplateDataError;
  }

  const hasPersonalizationTemplateData = options.personalizations?.some(p => p.template?.data !== undefined);
  if (hasPersonalizationTemplateData && !options.template?.type) {
    return "A root template type is required when using per-personalization template data.";
  }

  let personalizations: EmailsSendPayload["personalizations"];
  if (options.personalizations) {
    if (!options.personalizations.length) {
      return "At least one personalization must be provided.";
    }

    if (options.personalizations.length > MAX_PERSONALIZATIONS) {
      return `The maximum number of personalizations is ${MAX_PERSONALIZATIONS}.`;
    }

    personalizations = [];
    for (let index = 0; index < options.personalizations.length; index++) {
      const mappedPersonalization = mapPersonalization(options.personalizations[index]!, index, options.template?.data);
      if (typeof mappedPersonalization === "string") {
        return mappedPersonalization;
      }

      personalizations.push(mappedPersonalization);
    }
  }
  else {
    const parsedTo = parseArrayRecipients(options.to);
    if (!parsedTo || !parsedTo.length) {
      return "No recipients provided. Use the 'to' option to specify at least one recipient";
    }

    if (parsedTo.length > MAX_RECIPIENTS) {
      return `The maximum number of 'to' recipients is ${MAX_RECIPIENTS}.`;
    }

    const parsedCc = parseArrayRecipients(options.cc);
    if (parsedCc && parsedCc.length > MAX_RECIPIENTS) {
      return `The maximum number of 'cc' recipients is ${MAX_RECIPIENTS}.`;
    }

    const parsedBcc = parseArrayRecipients(options.bcc);
    if (parsedBcc && parsedBcc.length > MAX_RECIPIENTS) {
      return `The maximum number of 'bcc' recipients is ${MAX_RECIPIENTS}.`;
    }

    personalizations = [{
      bcc: parsedBcc,
      cc: parsedCc,
      dynamic_template_data: options.template?.data,
      to: parsedTo
    }];
  }

  if (options.transactional === false) {
    const isDkimSigned = personalizations.every((personalization) => {
      const personalizationDkim = personalization.dkim_selector;
      const rootDkim = options.dkim?.selector;
      return Boolean(personalizationDkim || rootDkim);
    });

    if (!isDkimSigned) {
      return "Non-transactional messages must be DKIM signed.";
    }

    const hasInvalidRecipientCount = personalizations.some((personalization) => {
      const recipientCount = getRecipientCount(personalization.to) + getRecipientCount(personalization.cc) + getRecipientCount(personalization.bcc);
      return recipientCount !== 1;
    });

    if (hasInvalidRecipientCount) {
      return "Non-transactional messages must have exactly one recipient per personalization.";
    }
  }

  const content: EmailsSendPayload["content"] = [];
  const template_type = options.template?.type;

  if (text) content.push({ type: "text/plain", value: text, template_type });
  if (html) content.push({ type: "text/html", value: html, template_type });
  if (options.content) {
    for (const item of options.content) {
      content.push({ type: item.type, value: item.value, template_type });
    }
  }

  return {
    attachments: options.attachments,
    campaign_id: options.campaignId,
    ...mapDkim(options.dkim),
    envelope_from: parseRecipient(options.envelopeFrom),
    personalizations,
    headers: options.headers,
    reply_to: parseRecipient(options.replyTo),
    from: parsedFrom,
    subject: options.subject,
    content,
    tracking_settings: options.tracking ? {
      click_tracking: options.tracking.click ? {
        enable: options.tracking.click.enable
      } : undefined,
      open_tracking: options.tracking.open ? {
        enable: options.tracking.open.enable
      } : undefined
    } : undefined,
    transactional: options.transactional
  };
};
