import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError } from "../../utils/errors";
import { clean } from "../../utils/clean";
import type { ErrorResponse, SuccessResponse } from "../../types/responses";
import type { SubAccountsLimitsGetResponse, SubAccountsLimitsSetOptions } from "../../types/sub-accounts/limits";
import type { SubAccountsLimitsGetApiResponse, SubAccountsLimitsSetApiResponse } from "../../types/sub-accounts/internal";

export class SubAccountsLimits {
  constructor (private mailchannels: MailChannelsClient) {}
  /**
   * Retrieves the limit of a specified sub-account. A value of `-1` indicates that the sub-account inherits the parent account's limit, allowing the sub-account to utilize any remaining capacity within the parent account's allocation.
   * @param handle - Handle of the sub-account to retrieve the limit for.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.limits.get('validhandle123')
   * ```
   */
  async get (handle: string): Promise<SubAccountsLimitsGetResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { data: null, error };
    }

    const response = await this.mailchannels.get<SubAccountsLimitsGetApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/limit`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch sub-account limit.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(response);

    return { data, error: null };
  }

  /**
   * Sets the limit for the specified sub-account.
   * @param handle - Handle of the sub-account to set limit for.
   * @param options - The limits to set for the sub-account. The minimum allowed sends is `0`
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.limits.set('validhandle123', { sends: 1000 })
   * ```
   */
  async set (handle: string, options: SubAccountsLimitsSetOptions): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    if (options.sends < 0) {
      error = createValidationError("The sends value must be at least 0.");
      return { success: false, error };
    }

    await this.mailchannels.put<SubAccountsLimitsSetApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/limit`, {
      body: options,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to set sub-account limit.");
    });

    return { success: !error, error };
  }

  /**
   * Deletes the limit for the specified sub-account. After a successful deletion, the specified sub-account will be limited to the parent account's limit.
   * @param handle - Handle of the sub-account to delete limit for.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.limits.delete('validhandle123')
   * ```
   */
  async delete (handle: string): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    await this.mailchannels.delete<void>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/limit`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to delete sub-account limit.");
    });

    return { success: !error, error };
  }
}
