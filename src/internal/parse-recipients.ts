import type { EmailsSendRecipient, EmailsSendRecipientInput } from "../types/emails/send";

/**
 * Validates if a string is a valid email address
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Parses name-address pair string to MailChannels format
 */
export const parseRecipientString = (input: string): EmailsSendRecipient | undefined => {
  const trimmed = input.trim();
  const match = trimmed.match(/^([^<]*)<([^>]*)>$/);

  if (match) {
    const [, name, email] = match;
    if (!email?.trim() || !isValidEmail(email.trim())) return undefined;

    return { email: email.trim(), name: name?.trim() };
  }

  if (!isValidEmail(trimmed)) return undefined;

  return { email: trimmed };
};

/**
 * Parses any recipient format to MailChannels format
 */
export const parseRecipient = (recipient?: EmailsSendRecipient | string) => {
  if (recipient === undefined) return undefined;

  if (typeof recipient === "string") {
    return parseRecipientString(recipient) ?? null;
  }

  if (!isValidEmail(recipient?.email)) return null;

  return { email: recipient.email, name: recipient.name };
};

/**
 * Parses any array of recipients format to MailChannels format
 */
export const parseArrayRecipients = (recipients?: EmailsSendRecipientInput) => {
  if (recipients === undefined) return undefined;

  const arr = Array.isArray(recipients) ? recipients : [recipients];

  const parsed: EmailsSendRecipient[] = [];
  for (const recipient of arr) {
    const validRecipient = parseRecipient(recipient);
    if (!validRecipient) return null;
    parsed.push(validRecipient);
  }

  return parsed.length > 0 ? parsed : undefined;
};
