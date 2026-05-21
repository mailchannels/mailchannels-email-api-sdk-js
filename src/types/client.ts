export interface MailChannelsClientOptions {
  /**
   * Override the MailChannels API base URL.
   * Useful for local testing against a simulator.
   * @default "https://api.mailchannels.net"
   */
  baseUrl?: string;
  /**
   * Number of times to retry a request in case of network errors and retryable HTTP responses.
   * Retries are attempted for the following scenarios:
   * -  `408` - Request Timeout
   * -  `409` - Conflict
   * -  `425` - Too Early (Experimental)
   * -  `429` - Too Many Requests
   * -  `500` - Internal Server Error
   * -  `502` - Bad Gateway
   * -  `503` - Service Unavailable
   * -  `504` - Gateway Timeout
   * @default false
   */
  retry?: number | false;
  /**
   * Request timeout in milliseconds.
   * Set to `false` or `0` to disable timeout handling.
   * @default 30000
   */
  timeout?: number | false;
  /**
   * Abort signal applied to requests made by the client.
   */
  signal?: AbortSignal;
}
