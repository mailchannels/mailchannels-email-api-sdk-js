import type { DomainsCheckVerdict } from "./check";
import type { DomainsDkimKey } from "./dkim-create";

export interface DomainsCheckPayload {
  dkim_settings?: {
    dkim_domain?: string;
    dkim_private_key?: string;
    dkim_selector?: string;
  }[];
  domain: string;
  sender_id?: string;
}

export interface DomainsCheckApiResponse {
  check_results: {
    dkim: {
      dkim_domain: string;
      dkim_key_status?: DomainsDkimKey["status"] | "provided";
      dkim_selector: string;
      reason?: string;
      verdict: Extract<DomainsCheckVerdict, "passed" | "failed">;
    }[];
    domain_lockdown: {
      reason?: string;
      verdict: Extract<DomainsCheckVerdict, "passed" | "failed">;
    };
    sender_domain: {
      a: {
        reason?: string;
        verdict: Extract<DomainsCheckVerdict, "passed" | "failed">;
      };
      mx: {
        reason?: string;
        verdict: Extract<DomainsCheckVerdict, "passed" | "failed">;
      };
      verdict: Extract<DomainsCheckVerdict, "passed" | "failed">;
    };
    spf: {
      reason?: string;
      spfRecord?: string;
      spfRecordError?: string;
      verdict: DomainsCheckVerdict;
    };
  };
  references?: string[];
}

export interface DomainsDkimCreatePayload {
  algorithm?: "rsa";
  key_length?: 1024 | 2048 | 4096 | 3072 | 4096;
  selector: string;
}

export interface DomainsDkimCreateApiResponse {
  algorithm: string;
  created_at?: string;
  dkim_dns_records: {
    name: string;
    type: string;
    value: string;
  }[];
  domain: string;
  gracePeriodExpiresAt?: string;
  key_length: 1024 | 2048 | 4096 | 3072 | 4096;
  public_key: string;
  retiresAt?: string;
  selector: string;
  status: DomainsDkimKey["status"];
  status_modified_at?: string;
}

export interface DomainsDkimListPayload {
  selector?: string;
  status?: DomainsDkimKey["status"];
  offset?: number;
  limit?: number;
  include_dns_record?: boolean;
}

export interface DomainsDkimRotateApiResponse {
  new_key: DomainsDkimCreateApiResponse;
  rotated_key: DomainsDkimCreateApiResponse;
}

export interface DomainsCustomTrackingCreateApiResponse {
  name: string;
  hostname: string;
  scope: "click" | "open" | "unsubscribe";
  status: "active" | "disabled";
  created_at: string;
}

export interface DomainsCustomTrackingListApiResponse {
  custom_tracking_domains: DomainsCustomTrackingCreateApiResponse[];
  total: number;
}

export interface DomainsCustomTrackingPendingApiResponse {
  token?: string;
  txt_record_name?: string;
  txt_record_value?: string;
  instructions?: string;
}

export type DomainsCustomTrackingApiResponse = DomainsCustomTrackingPendingApiResponse | DomainsCustomTrackingCreateApiResponse;
