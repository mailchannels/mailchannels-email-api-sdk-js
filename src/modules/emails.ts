import type { MailChannelsClient } from "../client";
import { ErrorCode, createValidationError, getResultError, getStatusError } from "../utils/errors";
import { clean } from "../utils/clean";
import type { ErrorResponse } from "../types/responses";
import type { EmailsQueueApiResponse, EmailsSendApiResponse } from "../types/emails/internal";
import type { EmailsSendOptions, EmailsSendResponse } from "../types/emails/send";
import type { EmailsQueueResponse } from "../types/emails/queue";
import { buildSendPayload } from "../utils/build-send-payload";

export class Emails {
  constructor (protected mailchannels: MailChannelsClient) {}

  private async _sendEmail (options: EmailsSendOptions,
    flags: { async?: boolean, dryRun?: boolean }
  ): Promise<EmailsSendResponse | EmailsQueueResponse> {
    let error: ErrorResponse | null = null;

    const payload = await buildSendPayload(options);

    if (typeof payload === "string") {
      error = createValidationError(payload);
      return { data: null, error };
    }

    const endpoint = flags.async ? "/tx/v1/send-async" : "/tx/v1/send";
    const response = await this.mailchannels.post<EmailsSendApiResponse | EmailsQueueApiResponse>(endpoint, {
      query: { "dry-run": flags.dryRun },
      body: payload,
      onResponseError: async ({ response }) => {
        error = getStatusError(response, {
          [ErrorCode.BadRequest]: "Bad Request.",
          [ErrorCode.Forbidden]: "User does not have access to this feature.",
          [ErrorCode.PayloadTooLarge]: "The total message size should not exceed 30MB. This includes the message itself, headers, and the combined size of any attachments."
        });
      }
    }).catch((e) => {
      error ||= getResultError(e, flags.async ? "Failed to queue email." : "Failed to send email.");
      return null;
    });

    if (!response) return { data: null, error: error! };

    if (flags.async) {
      const asyncResponse = response as EmailsQueueApiResponse;
      const data = clean({
        queuedAt: asyncResponse.queued_at,
        requestId: asyncResponse.request_id
      });

      return { data, error: null };
    }

    const syncResponse = response as EmailsSendApiResponse;
    const data = clean({
      rendered: syncResponse.data,
      requestId: syncResponse.request_id,
      results: syncResponse.results?.map(result => ({
        index: result.index,
        messageId: result.message_id,
        reason: result.reason,
        status: result.status
      }))
    });

    return { data, error: null };
  }

  /**
   * Sends an email message to one or more recipients.
   * @param options - The email options to send.
   * @param dryRun - When set to `true`, the message will not be sent. Instead, the fully rendered message will be returned in the `data` property of the response. The default value is `false`.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.emails.send({
   *   to: 'to@example.com',
   *   from: 'from@example.com',
   *   subject: 'Test',
   *   html: 'Test'
   * })
   * ```
   */
  async send (options: EmailsSendOptions, dryRun = false): Promise<EmailsSendResponse> {
    return this._sendEmail(options, { dryRun }) as Promise<EmailsSendResponse>;
  }

  /**
   * Queues an email message for asynchronous processing and returns immediately with a request ID.
   *
   * The email will be processed in the background, and you'll receive webhook events for all delivery status updates (e.g. `dropped`, `processed`, `delivered`, `hard-bounced`). These webhook events are identical to those sent for the synchronous /send endpoint.
   *
   * Use this endpoint when you need to send emails without waiting for processing to complete. This can improve your application's response time, especially when sending to multiple recipients.
   * @param options - The email options to send.
   * @example
   * ```ts
   * const mailchannels = new MailChannels('your-api-key')
   * const { data, error } = await mailchannels.emails.queue({
   *   to: 'to@example.com',
   *   from: 'from@example.com',
   *   subject: 'Test',
   *   html: 'Test'
   * })
   * ```
   */
  async queue (options: EmailsSendOptions): Promise<EmailsQueueResponse> {
    return this._sendEmail(options, { async: true }) as Promise<EmailsQueueResponse>;
  }

  /**
   * @deprecated Use `queue` instead.
   */
  async sendAsync (options: EmailsSendOptions): Promise<EmailsQueueResponse> {
    return this.queue(options);
  }
}
