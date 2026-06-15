import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError, validatePagination } from "../../utils/errors";
import { clean } from "../../utils/clean";
import type { ErrorResponse, SuccessResponse } from "../../types/responses";
import type { SubAccountsApiKeysCreateResponse, SubAccountsApiKeysListOptions, SubAccountsApiKeysListResponse } from "../../types/sub-accounts/api-keys";
import type { SubAccountsApiKeysCreateApiResponse, SubAccountsApiKeysListApiResponse } from "../../types/sub-accounts/internal";

export class SubAccountsApiKeys {
  constructor (private mailchannels: MailChannelsClient) {}

  /**
   * Creates a new API key for the specified sub-account.
   * @param handle - Handle of the sub-account to create API key for.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.apiKeys.create('validhandle123')
   * ```
   */
  async create (handle: string): Promise<SubAccountsApiKeysCreateResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { data: null, error };
    }

    const response = await this.mailchannels.post<SubAccountsApiKeysCreateApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/api-key`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.Forbidden]: "You can't create API keys for this sub-account.",
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`,
          [ErrorCode.UnprocessableEntity]: "You have reached the limit of API keys you can create for this sub-account."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to create sub-account API key.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(response);

    return { data, error: null };
  }

  /**
   * Retrieves details of all API keys associated with the specified sub-account. For security reasons, the full API key is not returned; only the key ID and a partially redacted version are provided.
   * @param handle - Handle of the sub-account to retrieve the API key for.
   * @param options - The options to filter the list of API keys.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.apiKeys.list('validhandle123')
   * ```
   */
  async list (handle: string, options?: SubAccountsApiKeysListOptions): Promise<SubAccountsApiKeysListResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { data: null, error };
    }

    error = validatePagination({ ...options, max: 1000 });
    if (error) return { data: null, error };

    const response = await this.mailchannels.get<SubAccountsApiKeysListApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/api-key`, {
      query: options,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch sub-account API keys.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(response.map(key => ({
      id: key.id,
      key: key.key
    })));

    return { data, error: null };
  }

  /**
   * Deletes the API key identified by its ID for the specified sub-account.
   * @param handle - Handle of the sub-account for which the API key should be deleted.
   * @param id - The ID of the API key to delete.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.apiKeys.delete('validhandle123', 1)
   * ```
   */
  async delete (handle: string, id: number): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    await this.mailchannels.delete<void>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/api-key/${encodeURIComponent(id)}`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Missing or invalid API key ID."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to delete sub-account API key.");
    });

    return { success: !error, error };
  }
}
