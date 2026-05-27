import type { MailChannelsClient } from "../client";
import { ErrorCode, createError, getResultError, getStatusError, validatePagination } from "../utils/errors";
import { clean } from "../utils/clean";
import { stripPemHeaders } from "../utils/strip-pem-headers";
import { mapDkimKey } from "../utils/map-dkim-key";
import type { ErrorResponse, SuccessResponse } from "../types/responses";
import type { DomainsCheckApiResponse, DomainsCheckPayload, DomainsDkimCreateApiResponse, DomainsDkimCreatePayload, DomainsDkimListPayload, DomainsDkimRotateApiResponse } from "../types/domains/internal";
import type { DomainsCheckOptions, DomainsCheckResponse } from "../types/domains/check";
import type { DomainsDkimCreateOptions, DomainsDkimCreateResponse } from "../types/domains/dkim-create";
import type { DomainsDkimListOptions, DomainsDkimListResponse } from "../types/domains/dkim-list";
import type { DomainsDkimUpdateStatusOptions } from "../types/domains/dkim-update-status";
import type { DomainsDkimRotateOptions, DomainsDkimRotateResponse } from "../types/domains/dkim-rotate";

export class Domains {
  readonly dkim: DomainsDkim;

  constructor (protected mailchannels: MailChannelsClient) {
    this.dkim = new DomainsDkim(mailchannels);
  }

  /**
   * Validates a domain's email authentication setup by retrieving its DKIM, SPF, and Domain Lockdown status. This endpoint checks whether the domain is properly configured for secure email delivery.
   * @param options - The domain options to check.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.check({
   *   dkim: [{
   *     domain: 'example.com',
   *     privateKey: 'your-private-key',
   *     selector: 'mailchannels'
   *   }],
   *   domain: 'example.com',
   *   senderId: 'sender-id'
   * })
   * ```
   */
  async check (options: DomainsCheckOptions): Promise<DomainsCheckResponse> {
    let error: ErrorResponse | null = null;

    const { dkim, domain, senderId } = options;

    if (!domain) {
      error = createError("No domain provided.");
      return { data: null, error };
    }

    const dkimOptions = dkim ? Array.isArray(dkim) ? dkim: [dkim]: undefined;

    if (dkimOptions && dkimOptions.length > 10) {
      error = createError("A maximum of 10 DKIM settings can be provided.");
      return { data: null, error };
    }

    const invalidDkimSetting = dkimOptions?.find(({ privateKey, selector }) => privateKey && !selector);
    if (invalidDkimSetting) {
      error = createError("DKIM settings with a privateKey must also include a selector.");
      return { data: null, error };
    }

    const payload: DomainsCheckPayload = {
      dkim_settings: dkimOptions?.map(({ domain, privateKey, selector }) => ({
        dkim_domain: domain,
        dkim_private_key: privateKey ? stripPemHeaders(privateKey) : undefined,
        dkim_selector: selector
      })),
      domain,
      sender_id: senderId
    };

    const response = await this.mailchannels.post<DomainsCheckApiResponse>("/tx/v1/check-domain", {
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.Forbidden]: "User does not have access to this feature."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to check domain.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean({
      dkim: response.check_results.dkim.map(dkimResults => ({
        domain: dkimResults.dkim_domain,
        keyStatus: dkimResults.dkim_key_status,
        selector: dkimResults.dkim_selector,
        reason: dkimResults.reason,
        verdict: dkimResults.verdict
      })),
      domainLockdown: response.check_results.domain_lockdown,
      senderDomain: response.check_results.sender_domain,
      spf: response.check_results.spf,
      references: response.references
    });

    return { data, error: null };
  }
}

class DomainsDkim {
  constructor (private mailchannels: MailChannelsClient) {}

  /**
   * Create a DKIM key pair for a specified domain and selector using the specified algorithm and key length, for the current customer.
   * @param domain - The domain to create the DKIM key for.
   * @param options - DKIM key creation options.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.dkim.create('example.com', {
   *   selector: 'mailchannels'
   * })
   * ```
   */
  async create (domain: string, options: DomainsDkimCreateOptions): Promise<DomainsDkimCreateResponse> {
    let error: ErrorResponse | null = null;

    if (!domain) {
      error = createError("No domain provided.");
      return { data: null, error };
    }

    if (!options.selector || options.selector.length > 63) {
      error = createError("Selector must be between 1 and 63 characters.");
      return { data: null, error };
    }

    const payload: DomainsDkimCreatePayload = {
      algorithm: options.algorithm,
      key_length: options.length,
      selector: options.selector
    };

    const response = await this.mailchannels.post<DomainsDkimCreateApiResponse>(`/tx/v1/domains/${domain}/dkim-keys`, {
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.Conflict]: "Key pair already created for domain, and selector."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to create DKIM key.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(mapDkimKey(response));

    return { data, error: null };
  }

  /**
   * Search for DKIM keys by domain, with optional filters. If selector is provided, at most one key will be returned.
   * @param domain - The domain to search DKIM keys for.
   * @param options - The options to filter DKIM keys by.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.dkim.list('example.com', {
   *   includeDnsRecord: true
   * })
   * ```
   */
  async list (domain: string, options?: DomainsDkimListOptions): Promise<DomainsDkimListResponse> {
    let error: ErrorResponse | null = null;

    if (!domain) {
      error = createError("No domain provided.");
      return { data: null, error };
    }

    if (options?.selector && options.selector.length > 63) {
      error = createError("Selector must be between 1 and 63 characters.");
      return { data: null, error };
    }

    error = validatePagination({ ...options, max: 100 });
    if (error) return { data: null, error };

    const payload: DomainsDkimListPayload = {
      selector: options?.selector,
      status: options?.status,
      offset: options?.offset,
      limit: options?.limit,
      include_dns_record: options?.includeDnsRecord
    };

    const response = await this.mailchannels.get<{ keys: DomainsDkimCreateApiResponse[] }>(`/tx/v1/domains/${domain}/dkim-keys`, {
      query: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch DKIM keys.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(response.keys.map(mapDkimKey));

    return { data, error: null };
  }

  /**
   * Update fields of an existing DKIM key pair for the specified domain and selector, for the current customer. Currently, only the `status` field can be updated.
   * @param domain - The domain the DKIM key belongs to.
   * @param options - The options to update the DKIM key.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.domains.dkim.updateStatus('example.com', {
   *   selector: 'mailchannels',
   *   status: 'retired'
   * })
   */
  async updateStatus (domain: string, options: DomainsDkimUpdateStatusOptions): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!domain) {
      error = createError("No domain provided.");
      return { success: false, error };
    }

    if (!options.selector || options.selector.length > 63) {
      error = createError("Selector must be between 1 and 63 characters.");
      return { success: false, error };
    }

    const payload = {
      status: options.status
    };

    await this.mailchannels.patch(`/tx/v1/domains/${domain}/dkim-keys/${options.selector}`, {
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.NotFound]: "Specified key pair not found, or no active key for rotation. This may also occur if the DKIM domain or selector path parameter is missing."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to update status of DKIM key.");
    });

    return { success: !error, error };
  }

  /**
   * Rotate an active DKIM key pair. Mark the original key as `rotated`, and create a new key pair with the required new key selector, reusing the same algorithm and key length. The rotated key remains valid for signing for a 3-day grace period, and is automatically changed to `retired` 2 weeks after rotation. Publish the new key to its DNS TXT record before rotated key expires for signing as emails sent with an unpublished key will fail DKIM validation by receiving providers. After the grace period, only the new key is valid for signing if published.
   * @param domain - The domain the DKIM key belongs to.
   * @param selector - The selector of the DKIM key to rotate.
   * @param options - The options to rotate the DKIM key.
   * @param options.newKey.selector - The selector for the new key pair. Must be a maximum of 63 characters.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.dkim.rotate('example.com', 'mailchannels', {
   *   newKey: {
   *     selector: 'new-selector'
   *   }
   * })
   * ```
   */
  async rotate (domain: string, selector: string, options: DomainsDkimRotateOptions): Promise<DomainsDkimRotateResponse> {
    let error: ErrorResponse | null = null;

    if (!domain) {
      error = createError("No domain provided.");
      return { data: null, error };
    }

    if (!selector || selector.length > 63) {
      error = createError("Selector must be between 1 and 63 characters.");
      return { data: null, error };
    }

    if (!options.newKey.selector || options.newKey.selector.length > 63) {
      error = createError("New key selector must be between 1 and 63 characters.");
      return { data: null, error };
    }

    const payload = {
      new_key: {
        selector: options.newKey.selector
      }
    };

    const response = await this.mailchannels.post<DomainsDkimRotateApiResponse>(`/tx/v1/domains/${domain}/dkim-keys/${selector}/rotate`, {
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.NotFound]: "Specified key pair not found.",
          [ErrorCode.Conflict]: "Key pair already created for domain, and provided new key selector."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to rotate DKIM key.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean({
      new: mapDkimKey(response.new_key),
      rotated: mapDkimKey(response.rotated_key)
    });

    return { data, error: null };
  }
}
