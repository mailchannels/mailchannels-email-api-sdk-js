import type { DomainsDkimKey } from "../types/domains/dkim-create";
import type { DomainsDkimCreateApiResponse } from "../types/domains/internal";

export const mapDkimKey = (key: DomainsDkimCreateApiResponse): DomainsDkimKey => ({
  algorithm: key.algorithm,
  createdAt: key.created_at,
  dnsRecords: key.dkim_dns_records,
  domain: key.domain,
  gracePeriodExpiresAt: key.gracePeriodExpiresAt,
  length: key.key_length,
  publicKey: key.public_key,
  retiresAt: key.retiresAt,
  selector: key.selector,
  status: key.status,
  statusModifiedAt: key.status_modified_at
});
