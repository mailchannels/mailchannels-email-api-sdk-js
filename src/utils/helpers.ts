import type { DomainsDkimKey } from "../types/domains/dkim-create";
import type { DomainsDkimCreateApiResponse } from "../types/domains/internal";

export const stripPemHeaders = (pem: string) => pem.replace(/-----[^-]+-----|\s|#.*$/gm, "");

/**
 * Recursively removes undefined values from objects and arrays.
 * @param data - The data to clean
 * @returns The cleaned data with `undefined` properties removed
 */
export const clean = <T>(data: T): T => {
  if (Array.isArray(data)) {
    const result: unknown[] = [];
    for (let i = 0; i < data.length; i++) {
      const cleaned = clean(data[i]);
      if (cleaned !== undefined) {
        result.push(cleaned);
      }
    }
    return result as T;
  }

  if (data && typeof data === "object" && data.constructor === Object) {
    const result: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const cleaned = clean(obj[key]);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result as T;
  }

  return data;
};

export const mapBuckets = (arr: { count: number, period_start: string }[]) => {
  return arr.map(({ count, period_start }) => ({ count, periodStart: period_start }));
};

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
