import type { DataResponse } from "../responses";
import type { DomainsDkimKey } from "./dkim-create";

export interface DomainsDkimListOptions {
  /**
   * Selector to filter keys by. Must be a maximum of 63 characters.
   */
  selector?: string;
  /**
   * Status to filter keys by.
   */
  status?: DomainsDkimKey["status"];
  /**
   * Number of keys to skip before returning results.
   * @default 0
   */
  offset?: number;
  /**
   * Maximum number of keys to return. Maximum is `100` and minimum is `1`.
   * @default 10
   */
  limit?: number;
  /**
   * If `true`, includes the suggested DKIM DNS record for each returned key.
   * @default false
   */
  includeDnsRecord?: boolean;
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DomainsDkimListResponse = DataResponse<Optional<DomainsDkimKey, "dnsRecords">[]>;
