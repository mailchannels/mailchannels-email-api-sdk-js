import type { DataResponse } from "../responses";

export type DomainsCustomTrackingScope = "click" | "open" | "unsubscribe";

export interface DomainsCustomTrackingCreateOptions {
  /**
   * A unique label used to select this domain at message send time. Maximum length is `64` characters. Must match the pattern `^[a-z0-9-]+$`.
   */
  name: string;
  /**
   * The hostname to register as a custom tracking domain.
   * The hostname must have a CNAME record pointing to `links.mailchannels.net`.
   * @example "click.example.com"
   */
  hostname: string;
  /**
   * The event type this domain handles.
   */
  scope: DomainsCustomTrackingScope;
}

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

export type DomainsCustomTrackingWithDnsSetupRequired =
  | DomainsCustomTrackingDomain & { dnsSetupRequired: false }
  | DomainsCustomTrackingDnsSetupRequired & { dnsSetupRequired: true };

export type DomainsCustomTrackingCreateResponse = DataResponse<DomainsCustomTrackingWithDnsSetupRequired>;
