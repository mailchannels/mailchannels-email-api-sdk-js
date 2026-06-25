import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError, validateCustomTrackingName, validatePagination } from "../../utils/errors";
import { clean } from "../../utils/clean";
import type { ErrorResponse, SuccessResponse } from "../../types/responses";
import type { DomainsCustomTrackingApiResponse, DomainsCustomTrackingListApiResponse } from "../../types/domains/internal";
import type { DomainsCustomTrackingCreateOptions, DomainsCustomTrackingCreateResponse, DomainsCustomTrackingScope, DomainsCustomTrackingWithDnsSetupRequired } from "../../types/domains/custom-tracking-create";
import type { DomainsCustomTrackingListOptions, DomainsCustomTrackingListResponse } from "../../types/domains/custom-tracking-list";
import type { DomainsCustomTrackingUpdateOptions, DomainsCustomTrackingUpdateResponse } from "../../types/domains/custom-tracking-update";

export class DomainsCustomTracking {
  private static readonly SCOPE_VALUES: Set<DomainsCustomTrackingScope> = new Set(["click", "open", "unsubscribe"]);

  constructor (private mailchannels: MailChannelsClient) {}

  /**
   * Retrieve all custom tracking domains registered under your account.
   * Optional filters include domain name, status, scope, limit and offset.
   * @param options - Optional filter options.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.customTracking.list({
   *   status: 'active'
   * })
   * ```
   */
  async list (options?: DomainsCustomTrackingListOptions): Promise<DomainsCustomTrackingListResponse> {
    let error: ErrorResponse | null = null;

    error = validatePagination({ ...options, max: 1000 });
    if (error) return { data: null, error };

    const response = await this.mailchannels.get<DomainsCustomTrackingListApiResponse>("/tx/v1/custom-tracking-domains", {
      query: options,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch custom tracking domains.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean({
      customTrackingDomains: response.custom_tracking_domains.map(d => ({
        name: d.name,
        hostname: d.hostname,
        scope: d.scope,
        status: d.status,
        createdAt: d.created_at
      })),
      total: response.total
    });

    return { data, error: null };
  }

  /**
   * Register a custom branded domain for click tracking, open tracking, or unsubscribe handling. By default, MailChannels uses shared domains for these links. Using a custom domain improves brand consistency by replacing shared domains with your own (e.g., `click.example.com`). Once registered, select the domain at send time using its `name`.
   *
   * Before registration completes, two DNS records must be in place:
   * 1. A TXT record at `_mailchannels-verify.<hostname>` containing the verification token (returned when DNS setup is required).
   * 2. A CNAME record at `<hostname>` pointing to `links.mailchannels.net`.
   * @param options - The options for creating a custom tracking domain.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.customTracking.create({
   *   name: 'clickdemo',
   *   hostname: 'click.example.com',
   *   scope: 'click'
   * })
   * ```
   */
  async create (options: DomainsCustomTrackingCreateOptions): Promise<DomainsCustomTrackingCreateResponse> {
    let error: ErrorResponse | null = null;

    error = validateCustomTrackingName(options.name);
    if (error) return { data: null, error };

    if (!options.hostname) {
      error = createValidationError("Hostname is required.");
      return { data: null, error };
    }

    if (!options.scope || !DomainsCustomTracking.SCOPE_VALUES.has(options.scope)) {
      error = createValidationError("Scope must be one of 'click', 'open', or 'unsubscribe'.");
      return { data: null, error };
    }

    const payload = {
      name: options.name,
      hostname: options.hostname,
      scope: options.scope
    };

    const response = await this.mailchannels.post<DomainsCustomTrackingApiResponse>("/tx/v1/custom-tracking-domains", {
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Invalid request body.",
          [ErrorCode.Forbidden]: "No permission to register this domain.",
          [ErrorCode.Conflict]: "A domain with the same name already exists, or the hostname and scope combination is already registered.",
          [ErrorCode.UnprocessableEntity]: "DNS verification incomplete. Either the TXT ownership record has not propagated yet or the hostname CNAME does not point to the required target."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to create custom tracking domain.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean<DomainsCustomTrackingWithDnsSetupRequired>("hostname" in response ? {
      dnsSetupRequired: false,
      name: response.name,
      hostname: response.hostname,
      scope: response.scope,
      status: response.status,
      createdAt: response.created_at
    } : {
      dnsSetupRequired: true,
      token: response.token,
      txtRecordName: response.txt_record_name,
      txtRecordValue: response.txt_record_value,
      instructions: response.instructions
    });

    return { data, error: null };
  }

  /**
   * Update an existing custom tracking domain by its hostname and scope. Supports updating the custom tracking domain's name or toggling its active status.
   * @param hostname - The hostname of the custom tracking domain to update.
   * @param scope - The scope of the custom tracking domain to update.
   * @param options - The options for updating the custom tracking domain.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.customTracking.update('click.example.com', 'click', {
   *   name: 'newclickname',
   *   status: 'active'
   * })
   * ```
   */
  async update (hostname: string, scope: DomainsCustomTrackingScope, options: DomainsCustomTrackingUpdateOptions): Promise<DomainsCustomTrackingUpdateResponse> {
    let error: ErrorResponse | null = null;

    if (!hostname) {
      error = createValidationError("Hostname is required.");
      return { data: null, error };
    }

    if (!scope || !DomainsCustomTracking.SCOPE_VALUES.has(scope)) {
      error = createValidationError("Scope must be one of 'click', 'open', or 'unsubscribe'.");
      return { data: null, error };
    }

    if (options.name !== undefined) {
      error = validateCustomTrackingName(options.name);
      if (error) return { data: null, error };
    }

    if (options.name === undefined && options.status === undefined) {
      error = createValidationError("At least one of 'name' or 'status' must be provided.");
      return { data: null, error };
    }

    const payload = {
      name: options.name,
      status: options.status
    };

    const response = await this.mailchannels.patch<DomainsCustomTrackingApiResponse>(`/tx/v1/custom-tracking-domains/${encodeURIComponent(hostname)}/${encodeURIComponent(scope)}`, {
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.Forbidden]: "No permission to update this domain.",
          [ErrorCode.NotFound]: `Custom tracking domain for hostname '${hostname}' and scope '${scope}' not found.`,
          [ErrorCode.Conflict]: "Name already used by another domain.",
          [ErrorCode.UnprocessableEntity]: "DNS verification incomplete. Either the TXT ownership record has not propagated yet or the hostname CNAME does not point to the required target."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to update custom tracking domain.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean<DomainsCustomTrackingWithDnsSetupRequired>("hostname" in response ? {
      dnsSetupRequired: false,
      name: response.name,
      hostname: response.hostname,
      scope: response.scope,
      status: response.status,
      createdAt: response.created_at
    } : {
      dnsSetupRequired: true,
      token: response.token,
      txtRecordName: response.txt_record_name,
      txtRecordValue: response.txt_record_value,
      instructions: response.instructions
    });

    return { data, error: null };
  }

  /**
   * Permanently delete an existing custom tracking domain for the given hostname and scope. The domain can be re-registered if needed.
   *
   * WARNING: Any tracking links or unsubscribe URLs in previously sent emails using this domain will stop working immediately.
   * @param hostname - The hostname of the custom tracking domain to delete.
   * @param scope - The scope of the custom tracking domain to delete.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.domains.customTracking.delete('click.example.com', 'click')
   * ```
   */
  async delete (hostname: string, scope: DomainsCustomTrackingScope): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!hostname) {
      error = createValidationError("Hostname is required.");
      return { success: false, error };
    }

    if (!scope || !DomainsCustomTracking.SCOPE_VALUES.has(scope)) {
      error = createValidationError("Scope must be one of 'click', 'open', or 'unsubscribe'.");
      return { success: false, error };
    }

    await this.mailchannels.delete(`/tx/v1/custom-tracking-domains/${encodeURIComponent(hostname)}/${encodeURIComponent(scope)}`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `Custom tracking domain for hostname '${hostname}' and scope '${scope}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to delete custom tracking domain.");
    });

    return { success: !error, error };
  }
}
