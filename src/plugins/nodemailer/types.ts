import type MimeNode from "nodemailer/lib/mime-node";
import type { EmailsQueueResponse, EmailsSendOptions, EmailsSendResponse, MailChannelsClientOptions } from "../../mailchannels";

export type MailChannelsTransportSendOptions = Pick<EmailsSendOptions, "campaignId" | "tracking" | "transactional" | "unsubscribe">;

export type MailChannelsTransportSendMode = "sync" | "async";

export interface MailChannelsTransportOptions<T extends MailChannelsTransportSendMode = "async"> extends MailChannelsClientOptions {
  /**
   * The MailChannels Email API key.
   */
  apiKey: string;
  /**
   * The mode in which emails are sent.
   * @default "async"
   */
  sendMode?: T;
}

export interface MailChannelsTransportInfo<T extends MailChannelsTransportSendMode> {
  messageId: string | null;
  accepted: string[];
  rejected: string[];
  envelope: MimeNode.Envelope;
  response: (T extends "sync" ? EmailsSendResponse : EmailsQueueResponse) | null;
}

declare module "nodemailer" {
  function createTransport<T> (
    transport: Transport<T> | TransportOptions,
    defaults?: TransportOptions
  ): Transporter<T, TransportOptions>;
}

declare module "nodemailer/lib/mailer" {
  interface Options {
    mailchannels?: MailChannelsTransportSendOptions;
  }
}
