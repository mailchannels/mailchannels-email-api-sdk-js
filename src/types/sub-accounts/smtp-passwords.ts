import type { DataResponse } from "../responses";

export interface SubAccountsSmtpPassword {
  /**
   * Whether the SMTP password is enabled.
   */
  enabled: boolean;
  /**
   * The SMTP password ID for the sub-account.
   */
  id: number;
  /**
   * SMTP password for the sub-account.
   */
  smtpPassword: string;
}

export type SubAccountsSmtpPasswordsCreateResponse = DataResponse<SubAccountsSmtpPassword>;

export type SubAccountsSmtpPasswordsListResponse = DataResponse<SubAccountsSmtpPassword[]>;

/** @deprecated Use `SubAccountsSmtpPasswordsCreateResponse` instead. */
export type SubAccountsCreateSmtpPasswordResponse = SubAccountsSmtpPasswordsCreateResponse;

/** @deprecated Use `SubAccountsSmtpPasswordsListResponse` instead. */
export type SubAccountsListSmtpPasswordResponse = SubAccountsSmtpPasswordsListResponse;
