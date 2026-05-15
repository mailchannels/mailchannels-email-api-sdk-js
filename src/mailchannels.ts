import { MailChannelsClient } from "./client";
import type { MailChannelsClientOptions } from "./types/client";
import { Domains, Emails, Metrics, SubAccounts, Suppressions, Webhooks } from "./modules";

export { MailChannelsClient };
export * from "./modules";
export type * from "./types";

export class MailChannels extends MailChannelsClient {
  // Modules: Email API
  readonly emails = new Emails(this);
  readonly domains = new Domains(this);
  readonly webhooks = new Webhooks(this);
  readonly subAccounts = new SubAccounts(this);
  readonly metrics = new Metrics(this);
  readonly suppressions = new Suppressions(this);

  constructor (key: string, options?: MailChannelsClientOptions) {
    super(key, options);
  }
}
