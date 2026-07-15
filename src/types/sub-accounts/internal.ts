export interface SubAccountsCreateApiResponse {
  company_name: string;
  enabled: boolean;
  handle: string;
}

export type SubAccountsListApiResponse = SubAccountsCreateApiResponse[];

export interface SubAccountsUsageApiResponse {
  period_end_date?: string;
  period_start_date?: string;
  total_usage: number;
  monthly_limit: number;
}

export interface SubAccountsApiKeysCreateApiResponse {
  id: number;
  key: string;
}

export type SubAccountsApiKeysListApiResponse = SubAccountsApiKeysCreateApiResponse[];

export interface SubAccountsSmtpPasswordsCreateApiResponse {
  enabled: boolean;
  id: number;
  smtp_password: string;
}

export type SubAccountsSmtpPasswordsListApiResponse = SubAccountsSmtpPasswordsCreateApiResponse[];

export interface SubAccountsLimitsGetApiResponse {
  sends: number;
}

export interface SubAccountsLimitsSetApiResponse {
  limit: SubAccountsLimitsGetApiResponse;
}
