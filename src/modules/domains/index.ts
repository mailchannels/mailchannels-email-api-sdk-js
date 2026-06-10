import { DomainsDkim } from "./dkim";
import type { MailChannelsClient } from "../../client";
import { ErrorCode, createValidationError, getResultError, getStatusError } from "../../utils/errors";
import { clean } from "../../utils/clean";
import { stripPemHeaders } from "../../utils/strip-pem-headers";
import type { ErrorResponse } from "../../types/responses";
import type { DomainsCheckApiResponse, DomainsCheckPayload } from "../../types/domains/internal";
import type { DomainsCheckOptions, DomainsCheckResponse } from "../../types/domains/check";

export class Domains {
  readonly dkim: DomainsDkim;

  constructor (protected mailchannels: MailChannelsClient) {
    this.dkim = new DomainsDkim(mailchannels);
  }

  /**
   * Validates a domain's email authentication setup by retrieving its DKIM, SPF, and Domain Lockdown status. This endpoint checks whether the domain is properly configured for secure email delivery.
   * @param domain - Domain used for sending emails. If `dkim` settings are not provided, or `dkim` settings are provided with no `domain`, the stored dkim settings for this domain will be used.
   * @param options - The domain options to check.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.domains.check('example.com', {
   *   dkim: [{
   *     domain: 'example.com',
   *     privateKey: 'your-private-key',
   *     selector: 'mailchannels'
   *   }],
   *   senderId: 'sender-id'
   * })
   * ```
   */
  async check (domain: string, options?: DomainsCheckOptions): Promise<DomainsCheckResponse> {
    let error: ErrorResponse | null = null;

    if (!domain) {
      error = createValidationError("No domain provided.");
      return { data: null, error };
    }

    const dkimOptions = options?.dkim ? Array.isArray(options.dkim) ? options.dkim: [options.dkim]: undefined;

    if (dkimOptions && dkimOptions.length > 10) {
      error = createValidationError("A maximum of 10 DKIM settings can be provided.");
      return { data: null, error };
    }

    const invalidDkimSetting = dkimOptions?.find(({ privateKey, selector }) => privateKey && !selector);
    if (invalidDkimSetting) {
      error = createValidationError("DKIM settings with a privateKey must also include a selector.");
      return { data: null, error };
    }

    const payload: DomainsCheckPayload = {
      dkim_settings: dkimOptions?.map(dkim => ({
        dkim_domain: dkim.domain,
        dkim_private_key: dkim.privateKey ? stripPemHeaders(dkim.privateKey) : undefined,
        dkim_selector: dkim.selector
      })),
      domain,
      sender_id: options?.senderId
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
