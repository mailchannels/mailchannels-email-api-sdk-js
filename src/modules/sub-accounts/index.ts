import { SubAccountsApiKeys } from "./api-keys";
import { SubAccountsSmtpPasswords } from "./smtp-passwords";
import { SubAccountsLimits } from "./limits";
import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError, validatePagination } from "../../utils/errors";
import { clean } from "../../utils/clean";
import type { ErrorResponse, SuccessResponse } from "../../types/responses";
import type { SubAccountsCreateApiResponse, SubAccountsListApiResponse, SubAccountsUsageApiResponse } from "../../types/sub-accounts/internal";
import type { SubAccountsCreateResponse } from "../../types/sub-accounts/create";
import type { SubAccountsListOptions, SubAccountsListResponse } from "../../types/sub-accounts/list";
import type { SubAccountsUsageResponse } from "../../types/sub-accounts/usage";

export class SubAccounts {
  private static readonly COMPANY_PATTERN = /^.{3,128}$/;
  private static readonly HANDLE_PATTERN = /^[a-z0-9]{3,128}$/;

  readonly apiKeys: SubAccountsApiKeys;
  readonly smtpPasswords: SubAccountsSmtpPasswords;
  readonly limits: SubAccountsLimits;

  constructor (protected mailchannels: MailChannelsClient) {
    this.apiKeys = new SubAccountsApiKeys(mailchannels);
    this.smtpPasswords = new SubAccountsSmtpPasswords(mailchannels);
    this.limits = new SubAccountsLimits(mailchannels);
  }

  /**
   * Creates a new sub-account under the parent account. Each sub-account must have a unique handle composed solely of lowercase alphanumeric characters. If no handle is provided, a random handle will be generated. Note that Sub-accounts are only available to parent accounts on 100K and higher plans.
   * @param companyName - The name of the company associated with the sub-account. This name is used for display purposes only and does not affect the functionality of the sub-account. The length must be between 3 and 128 characters.
   * @param handle - A unique name for the sub-account to be created. The length must be between 3 and 128 characters, and it may contain only lowercase letters and numbers. If not provided, a random handle will be generated.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.create('My Company', 'validhandle123')
   * ```
   */
  async create (companyName: string, handle?: string): Promise<SubAccountsCreateResponse> {
    let error: ErrorResponse | null = null;

    const isValidCompany = SubAccounts.COMPANY_PATTERN.test(companyName);
    if (!isValidCompany) {
      error = createValidationError("Invalid company name. Company name must be between 3 and 128 characters.");
      return { data: null, error };
    }

    if (handle) {
      const isValidHandle = SubAccounts.HANDLE_PATTERN.test(handle);
      if (!isValidHandle) {
        error = createValidationError("Invalid handle. Sub-account handle must be between 3 and 128 characters and contain only lowercase letters and numbers.");
        return { data: null, error };
      }
    }

    const response = await this.mailchannels.post<SubAccountsCreateApiResponse>("/tx/v1/sub-account", {
      body: {
        company_name: companyName,
        handle
      },
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.Forbidden]: "The parent account does not have permission to create sub-accounts.",
          [ErrorCode.Conflict]: `Sub-account with handle '${handle}' already exists.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to create sub-account.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean({
      companyName: response.company_name,
      enabled: response.enabled,
      handle: response.handle
    });

    return { data, error: null };
  }

  /**
   * Retrieves all sub-accounts associated with the parent account. The response is paginated with a default limit of 1000 sub-accounts per page and an offset of 0.
   * @param options - The options to filter the list of sub-accounts.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.list()
   * ```
   */
  async list (options?: SubAccountsListOptions): Promise<SubAccountsListResponse> {
    let error: ErrorResponse | null = null;

    error = validatePagination({ ...options, max: 1000 });
    if (error) return { data: null, error };

    const response = await this.mailchannels.get<SubAccountsListApiResponse>("/tx/v1/sub-account", {
      query: options,
      onResponseError: async ({ response }) => {
        error = getStatusError(response);
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch sub-accounts.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(response.map(account => ({
      companyName: account.company_name,
      enabled: account.enabled,
      handle: account.handle
    })));

    return { data, error: null };
  }

  /**
   * Deletes the sub-account identified by its handle.
   * @param handle - Handle of sub-account to be deleted.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.delete('validhandle123')
   * ```
   */
  async delete (handle: string): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    await this.mailchannels.delete<void>(`/tx/v1/sub-account/${encodeURIComponent(handle)}`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response);
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to delete sub-account.");
    });

    return { success: !error, error };
  }

  /**
   * Suspends the sub-account identified by its handle. This action disables the account, preventing it from sending any emails until it is reactivated.
   * @param handle - Handle of sub-account to be suspended.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.suspend('validhandle123')
   * ```
   */
  async suspend (handle: string): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    await this.mailchannels.post<void>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/suspend`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `The specified sub-account '${handle}' does not exist.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to suspend sub-account.");
    });

    return { success: !error, error };
  }

  /**
   * Activates a suspended sub-account identified by its handle, restoring its ability to send emails.
   * @param handle - Handle of sub-account to be activated.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.activate('validhandle123')
   * ```
   */
  async activate (handle: string): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    await this.mailchannels.post<void>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/activate`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.Forbidden]: "The parent account does not have permission to activate the sub-account.",
          [ErrorCode.NotFound]: `The specified sub-account '${handle}' does not exist.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to activate sub-account.");
    });

    return { success: !error, error };
  }

  /**
   * Retrieves usage statistics for the specified sub-account during the current billing period.
   * @param handle - Handle of the sub-account to query usage stats for.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.getUsage('validhandle123')
   * ```
   */
  async getUsage (handle: string): Promise<SubAccountsUsageResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { data: null, error };
    }

    const response = await this.mailchannels.get<SubAccountsUsageApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/usage`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch sub-account usage.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean({
      endDate: response.period_end_date,
      startDate: response.period_start_date,
      total: response.total_usage
    });

    return { data, error: null };
  }

  /** @deprecated Use `apiKeys.create` instead. */
  createApiKey (...args: Parameters<SubAccountsApiKeys["create"]>) {
    return this.apiKeys.create(...args);
  }

  /** @deprecated Use `apiKeys.list` instead. */
  listApiKeys (...args: Parameters<SubAccountsApiKeys["list"]>) {
    return this.apiKeys.list(...args);
  }

  /** @deprecated Use `apiKeys.delete` instead. */
  deleteApiKey (...args: Parameters<SubAccountsApiKeys["delete"]>) {
    return this.apiKeys.delete(...args);
  }

  /** @deprecated Use `smtpPasswords.create` instead. */
  createSmtpPassword (...args: Parameters<SubAccountsSmtpPasswords["create"]>) {
    return this.smtpPasswords.create(...args);
  }

  /** @deprecated Use `smtpPasswords.list` instead. */
  listSmtpPasswords (...args: Parameters<SubAccountsSmtpPasswords["list"]>) {
    return this.smtpPasswords.list(...args);
  }

  /** @deprecated Use `smtpPasswords.delete` instead. */
  deleteSmtpPassword (...args: Parameters<SubAccountsSmtpPasswords["delete"]>) {
    return this.smtpPasswords.delete(...args);
  }

  /** @deprecated Use `limits.set` instead. */
  setLimit (...args: Parameters<SubAccountsLimits["set"]>) {
    return this.limits.set(...args);
  }

  /** @deprecated Use `limits.get` instead. */
  getLimit (...args: Parameters<SubAccountsLimits["get"]>) {
    return this.limits.get(...args);
  }

  /** @deprecated Use `limits.delete` instead. */
  deleteLimit (...args: Parameters<SubAccountsLimits["delete"]>) {
    return this.limits.delete(...args);
  }
}
