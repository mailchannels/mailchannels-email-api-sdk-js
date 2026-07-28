import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError } from "../../internal/errors";
import { clean } from "../../internal/clean";
import type { ErrorResponse, SuccessResponse } from "../../types/responses";
import type { SubAccountsSmtpPasswordsCreateResponse, SubAccountsSmtpPasswordsListResponse } from "../../types/sub-accounts/smtp-passwords";
import type { SubAccountsSmtpPasswordsCreateApiResponse, SubAccountsSmtpPasswordsListApiResponse } from "../../types/sub-accounts/internal";

export class SubAccountsSmtpPasswords {
  constructor (private mailchannels: MailChannelsClient) {}

  /**
   * Creates a new SMTP password for the specified sub-account.
   * @param handle - Handle of the sub-account to create SMTP password for.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.smtpPasswords.create('validhandle123')
   * ```
   */
  async create (handle: string): Promise<SubAccountsSmtpPasswordsCreateResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { data: null, error };
    }

    const response = await this.mailchannels.post<SubAccountsSmtpPasswordsCreateApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/smtp-password`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.Forbidden]: "You can't create SMTP passwords for this sub-account.",
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`,
          [ErrorCode.UnprocessableEntity]: "You have reached the limit of SMTP passwords you can create for this sub-account."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to create sub-account SMTP password.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean({
      enabled: response.enabled,
      id: response.id,
      smtpPassword: response.smtp_password
    });

    return { data, error: null };
  }

  /**
   * Retrieves details of all SMTP passwords associated with the specified sub-account. For security, the full SMTP password is not returned; only the password ID and a partially redacted version are provided.
   * @param handle - Handle of the sub-account to retrieve the SMTP password for.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.subAccounts.smtpPasswords.list('validhandle123')
   * ```
   */
  async list (handle: string): Promise<SubAccountsSmtpPasswordsListResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { data: null, error };
    }

    const response = await this.mailchannels.get<SubAccountsSmtpPasswordsListApiResponse>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/smtp-password`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.NotFound]: `Sub-account with handle '${handle}' not found.`
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to fetch sub-account SMTP passwords.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    const data = clean(response.map(password => ({
      enabled: password.enabled,
      id: password.id,
      smtpPassword: password.smtp_password
    })));

    return { data, error: null };
  }

  /**
   * Deletes the SMTP password identified by its ID for the specified sub-account.
   * @param handle - Handle of the sub-account for which the SMTP password should be deleted.
   * @param id - The ID of the SMTP password to delete.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { success, error } = await mailchannels.subAccounts.smtpPasswords.delete('validhandle123', 1)
   * ```
   */
  async delete (handle: string, id: number): Promise<SuccessResponse> {
    let error: ErrorResponse | null = null;

    if (!handle) {
      error = createValidationError("No handle provided.");
      return { success: false, error };
    }

    await this.mailchannels.delete<void>(`/tx/v1/sub-account/${encodeURIComponent(handle)}/smtp-password/${encodeURIComponent(id)}`, {
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Missing or invalid SMTP password ID."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, "Failed to delete sub-account SMTP password.");
    });

    return { success: !error, error };
  }
}
