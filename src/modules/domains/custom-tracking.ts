import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError, validateCustomTrackingName, validatePagination } from "../../internal/errors";
import { clean } from "../../internal/clean";
import type { ErrorResponse, SuccessResponse } from "../../types/responses";
import type { DomainsCustomTrackingApiResponse, DomainsCustomTrackingListApiResponse } from "../../types/domains/internal";
import type { DomainsCustomTrackingCreateResponse, DomainsCustomTrackingScope, DomainsCustomTrackingWithDnsSetupRequired } from "../../types/domains/custom-tracking-create";
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
        error = getStatusError(response);
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
   * @param name - A unique label used to select this domain at message send time. Maximum length is `64` characters. Must match the pattern `^[a-z0-9-]+$`.
   * @param hostname - The hostname to register as a custom tracking domain (e.g., `click.example.com`).
   * @param scope - The event type this domain handles.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.customTracking.create(
   *   'clickdemo',
   *   'click.example.com',
   *   'click'
   * )
   * ```
   */
  async create (name: string, hostname: string, scope: DomainsCustomTrackingScope): Promise<DomainsCustomTrackingCreateResponse> {
    let error: ErrorResponse | null = null;

    error = validateCustomTrackingName(name);
    if (error) return { data: null, error };

    if (!hostname) {
      error = createValidationError("Hostname is required.");
      return { data: null, error };
    }

    if (!scope || !DomainsCustomTracking.SCOPE_VALUES.has(scope)) {
      error = createValidationError("Scope must be one of 'click', 'open', or 'unsubscribe'.");
      return { data: null, error };
    }

    const payload = {
      name: name,
      hostname: hostname,
      scope: scope
    };

    let statusCode: number | null = null;

    const response = await this.mailchannels.post<DomainsCustomTrackingApiResponse>("/tx/v1/custom-tracking-domains", {
      body: payload,
      onResponse: async ({ response }) => {
        statusCode = response.status;
      },
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
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

    if (statusCode === 202) {
      const dnsSetupRequiredResponse = response as DomainsCustomTrackingApiResponse<202>;
      const data = clean<DomainsCustomTrackingWithDnsSetupRequired<202>>({
        dnsSetupRequired: true,
        token: dnsSetupRequiredResponse.token,
        txtRecordName: dnsSetupRequiredResponse.txt_record_name,
        txtRecordValue: dnsSetupRequiredResponse.txt_record_value,
        instructions: dnsSetupRequiredResponse.instructions
      });

      return { data, error: null };
    }

    const createResponse = response as DomainsCustomTrackingApiResponse<201>;
    const data = clean<DomainsCustomTrackingWithDnsSetupRequired<201>>({
      dnsSetupRequired: false,
      name: createResponse.name,
      hostname: createResponse.hostname,
      scope: createResponse.scope,
      status: createResponse.status,
      createdAt: createResponse.created_at
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

    let statusCode: number | null = null;

    const response = await this.mailchannels.patch<DomainsCustomTrackingApiResponse>(`/tx/v1/custom-tracking-domains/${encodeURIComponent(hostname)}/${encodeURIComponent(scope)}`, {
      body: payload,
      onResponse: async ({ response }) => {
        statusCode = response.status;
      },
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
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

    if (statusCode === 202) {
      const dnsSetupRequiredResponse = response as DomainsCustomTrackingApiResponse<202>;
      const data = clean<DomainsCustomTrackingWithDnsSetupRequired<202>>({
        dnsSetupRequired: true,
        token: dnsSetupRequiredResponse.token,
        txtRecordName: dnsSetupRequiredResponse.txt_record_name,
        txtRecordValue: dnsSetupRequiredResponse.txt_record_value,
        instructions: dnsSetupRequiredResponse.instructions
      });

      return { data, error: null };
    }

    const updateResponse = response as DomainsCustomTrackingApiResponse<200>;
    const data = clean<DomainsCustomTrackingWithDnsSetupRequired<200>>({
      dnsSetupRequired: false,
      name: updateResponse.name,
      hostname: updateResponse.hostname,
      scope: updateResponse.scope,
      status: updateResponse.status,
      createdAt: updateResponse.created_at
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
          [ErrorCode.BadRequest]: "Invalid hostname or scope value"
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to delete custom tracking domain.");
    });

    return { success: !error, error };
  }
}
