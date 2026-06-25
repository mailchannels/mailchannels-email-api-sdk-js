import type { EmailsSendRecipient } from "./send";

export interface EmailsSendPayloadAttachment {
  content: string;
  filename: string;
  type?: string;
  content_id?: string;
  disposition?: "attachment" | "inline";
}

export interface EmailsSendPayloadPersonalization {
  bcc?: EmailsSendRecipient[];
  cc?: EmailsSendRecipient[];
  dkim_domain?: string;
  dkim_private_key?: string;
  dkim_selector?: string;
  dynamic_template_data?: Record<string, unknown>;
  envelope_from?: EmailsSendRecipient;
  from?: EmailsSendRecipient;
  headers?: Record<string, string>;
  reply_to?: EmailsSendRecipient;
  subject?: string;
  to: EmailsSendRecipient[];
}

export interface EmailsSendPayload {
  attachments?: EmailsSendPayloadAttachment[];
  campaign_id?: string;
  content: {
    template_type?: string;
    type: string;
    value: string;
  }[];
  dkim_domain?: string;
  dkim_private_key?: string;
  dkim_selector?: string;
  envelope_from?: EmailsSendRecipient;
  from: EmailsSendRecipient;
  headers?: Record<string, string>;
  personalizations: EmailsSendPayloadPersonalization[];
  reply_to?: EmailsSendRecipient;
  subject: string;
  tracking_settings?: {
    click_tracking?: {
      custom_domain_name?: string;
      enable?: boolean;
    };
    open_tracking?: {
      custom_domain_name?: string;
      enable?: boolean;
    };
  };
  transactional?: boolean;
  unsubscribe_settings?: {
    custom_domain_name?: string;
  };
}

export interface EmailsSendApiResponse {
  data?: string[];
  request_id?: string;
  results?: {
    index?: number;
    message_id: string;
    reason?: string;
    status: "sent" | "failed";
  }[];
}

export interface EmailsQueueApiResponse {
  queued_at: string;
  request_id: string;
}
