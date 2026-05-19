import type { WebhookEventType } from "./events";

export interface WebhooksValidateApiResponse {
  all_passed: boolean;
  results: {
    result: "passed" | "failed";
    webhook: string;
    response: {
      body?: string;
      status: number;
    } | null;
  }[];
}

export interface WebhooksBatchesApiResponse {
  webhook_batches: {
    batch_id: number;
    created_at: string;
    customer_handle: string;
    duration?: {
      unit: "milliseconds";
      value: number;
    };
    event_count: number;
    status: "no_response" | "1xx_response" | "2xx_response" | "3xx_response" | "4xx_response" | "5xx_response";
    status_code: number | null;
    webhook: string;
  }[];
}

export interface WebhooksResendBatchApiResponse {
  batch_id: number;
  customer_handle: string;
  webhook: string;
  created_at: string;
  event_count: number;
  duration_in_ms: number | null;
  status_code: number | null;
}

interface WebhookEventReceivedBase<T extends WebhookEventType> {
  email?: string;
  customer_handle: string;
  timestamp: number;
  smtp_id?: string;
  event: T;
  request_id?: string;
  campaign_id?: string;
  recipients?: string[];
}

interface WebhookEventReceivedProcessed extends WebhookEventReceivedBase<"processed"> {}

interface WebhookEventReceivedDelivered extends WebhookEventReceivedBase<"delivered"> {}

interface WebhookEventWithTracking {
  user_agent?: string;
  ip?: string;
}

interface WebhookEventReceivedOpen extends WebhookEventReceivedBase<"open">, WebhookEventWithTracking {}

interface WebhookEventReceivedClick extends WebhookEventReceivedBase<"click">, WebhookEventWithTracking {
  url?: string;
}

interface WebhookEventReceivedWithStatus {
  status?: string;
  reason?: string;
}

interface WebhookEventReceivedHardBounced extends WebhookEventReceivedBase<"hard-bounced">, WebhookEventReceivedWithStatus {}

interface WebhookEventReceivedSoftBounced extends WebhookEventReceivedBase<"soft-bounced">, WebhookEventReceivedWithStatus {}

interface WebhookEventReceivedDropped extends WebhookEventReceivedBase<"dropped">, WebhookEventReceivedWithStatus {}

interface WebhookEventReceivedComplained extends WebhookEventReceivedBase<"complained"> {}

interface WebhookEventReceivedUnsubscribed extends WebhookEventReceivedBase<"unsubscribed"> {}

interface WebhookEventReceivedTest extends Omit<WebhookEventReceivedBase<"test">, "recipients" | "campaign_id"> {}

export type WebhookEventReceived =
  | WebhookEventReceivedProcessed
  | WebhookEventReceivedDelivered
  | WebhookEventReceivedOpen
  | WebhookEventReceivedClick
  | WebhookEventReceivedHardBounced
  | WebhookEventReceivedSoftBounced
  | WebhookEventReceivedDropped
  | WebhookEventReceivedComplained
  | WebhookEventReceivedUnsubscribed
  | WebhookEventReceivedTest;
