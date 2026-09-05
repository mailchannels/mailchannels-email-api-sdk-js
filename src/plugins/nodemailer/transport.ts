import type { Transport } from "nodemailer";
import { parseAddress, parseAddresses, parseAttachments, parseDkim, parseHeaders, parseIcalEvent } from "./utils";
import type { MailChannelsTransportInfo, MailChannelsTransportOptions, MailChannelsTransportSendMode } from "./types";
import { Emails, MailChannelsClient } from "../../mailchannels";
import type { EmailsQueueResponse, EmailsSendResponse } from "../../mailchannels";
import pkg from "../../../package.json";

export const mailchannelsTransport = <T extends MailChannelsTransportSendMode = "async">
(options: MailChannelsTransportOptions<T>): Transport<MailChannelsTransportInfo<T>> => {
  const {
    apiKey = "",
    sendMode = "async",
    ...clientOptions
  } = options;

  const client = new MailChannelsClient(apiKey, clientOptions);
  const emails = new Emails(client);
  const sendMail = sendMode === "sync" ? emails.send.bind(emails) : emails.queue.bind(emails);

  const transport: Transport<MailChannelsTransportInfo<T>> = {
    name: "MailChannelsTransport",
    version: pkg.version,
    send (mail, callback) {
      const sentMessageInfo: MailChannelsTransportInfo<T> = {
        messageId: null,
        accepted: [],
        rejected: [],
        envelope: mail.message?.getEnvelope() ?? { from: false, to: [] },
        response: null
      };

      mail.normalize(async (err, data) => {
        if (!data || err) return callback(err || new Error("Failed to normalize mail data"), sentMessageInfo);
        try {
          let attachments = parseAttachments(data.attachments);

          if (data.icalEvent) {
            const icalAttachment = parseIcalEvent(data.icalEvent);
            attachments = attachments ? [...attachments, icalAttachment] : [icalAttachment];
          }

          const sdkResponse = await sendMail({
            ...data.mailchannels,
            from: parseAddress(data.from),
            replyTo: parseAddress(data.replyTo),
            to: parseAddresses(data.to),
            cc: parseAddresses(data.cc),
            bcc: parseAddresses(data.bcc),
            subject: data.subject || "",
            text: data.text?.toString() || "",
            html: data.html?.toString() || "",
            headers: parseHeaders(data.headers),
            attachments,
            dkim: parseDkim(data.dkim)
          });

          sentMessageInfo.response = sdkResponse as T extends "sync" ? EmailsSendResponse : EmailsQueueResponse;

          if (sdkResponse.error) {
            callback(new Error(sdkResponse.error.message), sentMessageInfo);
            return;
          }

          if ("results" in sdkResponse.data && sdkResponse.data.results?.[0]) {
            const result = sdkResponse.data.results[0];
            sentMessageInfo.messageId = result.messageId;
            switch (result.status) {
              case "sent":
                sentMessageInfo.accepted = sentMessageInfo.envelope.to; // `envelope.to` includes all recipients (to, cc, bcc)
                break;
              case "failed":
                sentMessageInfo.rejected = sentMessageInfo.envelope.to;
                break;
            }
          }

          callback(null, sentMessageInfo);
        }
        catch (error) {
          callback(error as Error, sentMessageInfo);
        }
      });
    }
  };

  return transport;
};
