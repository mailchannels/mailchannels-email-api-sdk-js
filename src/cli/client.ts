import { version } from "../../package.json";
import { MailChannelsClient } from "../client";
import type { MailChannelsFetchOptions } from "../types/fetch";

export class MailChannelsCliClient extends MailChannelsClient {
  protected override _fetch<T> (path: string, options: MailChannelsFetchOptions): Promise<T> {
    return super._fetch<T>(path, {
      ...options,
      headers: {
        "User-Agent": `mailchannels-cli/${version}`,
        ...options.headers
      }
    });
  }
}
