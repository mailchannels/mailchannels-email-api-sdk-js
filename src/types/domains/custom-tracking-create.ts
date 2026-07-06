import type { DataResponse } from "../responses";

export type DomainsCustomTrackingScope = "click" | "open" | "unsubscribe";

export interface DomainsCustomTrackingDomain {
  /**
   * The label for this custom tracking domain.
   */
  name: string;
  /**
   * The registered domain hostname.
   */
  hostname: string;
  /**
   * The event type this domain handles.
   */
  scope: DomainsCustomTrackingScope;
  /**
   * Current status of the custom tracking domain.
   */
  status: "active" | "disabled";
  /**
   * ISO 8601 timestamp when the domain was registered.
   */
  createdAt: string;
}

export interface DomainsCustomTrackingDnsSetupRequired {
  /**
   * UUID v4 nonce; also the TXT record value to set. Present only when TXT ownership verification is pending.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  token?: string;
  /**
   * Fully-qualified DNS TXT record name to add. Present only when TXT ownership verification is pending.
   * @example "_mailchannels-verify.click.example.com"
   */
  txtRecordName?: string;
  /**
   * Value for the DNS TXT record (same as token). Present only when TXT ownership verification is pending.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  txtRecordValue?: string;
  /**
   * Human-readable guidance for the DNS records that must be in place before retrying.
   */
  instructions?: string;
}

export type DomainsCustomTrackingWithDnsSetupRequired<T extends 202 | 201 | 200 | undefined = undefined> =
  T extends undefined
    ? | DomainsCustomTrackingDomain & { dnsSetupRequired: false }
      | DomainsCustomTrackingDnsSetupRequired & { dnsSetupRequired: true }
    : T extends 202
      ? DomainsCustomTrackingDnsSetupRequired & { dnsSetupRequired: true }
      : DomainsCustomTrackingDomain & { dnsSetupRequired: false };

export type DomainsCustomTrackingCreateResponse = DataResponse<DomainsCustomTrackingWithDnsSetupRequired>;
