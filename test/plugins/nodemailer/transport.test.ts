import { describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import MailMessage from "nodemailer/lib/mailer/mail-message";
import type { Options } from "nodemailer/lib/mailer";
import { type MailChannelsTransportInfo, mailchannelsTransport } from "~/plugins/nodemailer";
import type { EmailsQueueResponse } from "~/types/emails/queue";
import type { EmailsSendResponse } from "~/types/emails/send";
import { Emails } from "~/modules/emails";
import type { ErrorResponse } from "~/types/responses";

const fake = {
  apiKey: "test-api-key",
  options: {
    from: {
      address: "sender@example.com",
      name: "Sender Name"
    },
    to: {
      address: "recipient@example.com",
      name: "Recipient Name"
    },
    cc: {
      address: "cc@example.com",
      name: "CC Name"
    },
    bcc: {
      address: "bcc@example.com",
      name: "BCC Name"
    },
    headers: {
      "X-Custom-Header": "Custom Value"
    },
    subject: "Test Subject",
    html: "<p>Hello {{ world }}!</p>",
    text: "Hello {{ world }}!",
    dkim: { domainName: "example.com", privateKey: "private-key", keySelector: "mailchannels" },
    icalEvent: {
      filename: "invite.ics",
      content: "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//hacksw/handcal//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:uid@example.com\nDTSTAMP:20240427T120000Z\nSUMMARY:Test Event\nEND:VEVENT\nEND:VCALENDAR"
    },
    mailchannels: {
      campaignId: "test-campaign-id",
      unsubscribe: {
      },
      transactional: false,
      tracking: {
        click: {
          enable: true
        },
        open: {
          enable: true
        }
      }
    }
  } satisfies Options,
  sendResponse: {
    data: {
      requestId: "request_b99e660774cb",
      results: [{
        index: 0,
        messageId: "<4b2dae1b-15b8-4eab-b391-18bb6d3c5300@test.mailchannels.local>",
        status: "sent"
      }]
    },
    error: null
  } satisfies EmailsSendResponse,
  queueResponse: {
    data: {
      queuedAt: "date-time-string",
      requestId: "test-async-request-id"
    },
    error: null
  } satisfies EmailsQueueResponse
};

describe("transport", () => {
  it("should send an email in async mode (queue), parse the correct params and return the expected info", async () => {
    const queueSpy = vi.spyOn(Emails.prototype, "queue").mockResolvedValueOnce(fake.queueResponse);

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey,
        sendMode: "async"
      })
    );

    const info = await transport.sendMail(fake.options);

    expect(queueSpy).toHaveBeenCalledWith(expect.objectContaining({
      from: {
        email: fake.options.from.address,
        name: fake.options.from.name
      },
      to: [{
        email: fake.options.to.address,
        name: fake.options.to.name
      }],
      cc: [{
        email: fake.options.cc.address,
        name: fake.options.cc.name
      }],
      bcc: [{
        email: fake.options.bcc.address,
        name: fake.options.bcc.name
      }],
      ...fake.options.mailchannels,
      headers: fake.options.headers,
      subject: fake.options.subject,
      text: fake.options.text,
      html: fake.options.html
    }));
    expect(info).toStrictEqual({
      messageId: null,
      accepted: [],
      rejected: [],
      envelope: {
        from: fake.options.from.address,
        to: [
          fake.options.to.address,
          fake.options.cc.address,
          fake.options.bcc.address
        ]
      },
      response: fake.queueResponse
    } satisfies MailChannelsTransportInfo<"async">);
  });

  it("should send an email in sync mode (send), parse the correct params and return the expected info", async () => {
    const sendSpy = vi.spyOn(Emails.prototype, "send").mockResolvedValueOnce(fake.sendResponse);

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey,
        sendMode: "sync"
      })
    );

    const info = await transport.sendMail(fake.options);

    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      from: {
        email: fake.options.from.address,
        name: fake.options.from.name
      },
      to: [{
        email: fake.options.to.address,
        name: fake.options.to.name
      }],
      cc: [{
        email: fake.options.cc.address,
        name: fake.options.cc.name
      }],
      bcc: [{
        email: fake.options.bcc.address,
        name: fake.options.bcc.name
      }],
      ...fake.options.mailchannels,
      headers: fake.options.headers,
      subject: fake.options.subject,
      text: fake.options.text,
      html: fake.options.html
    }));
    expect(info).toStrictEqual({
      messageId: fake.sendResponse.data.results[0]!.messageId,
      accepted: [
        fake.options.to.address,
        fake.options.cc.address,
        fake.options.bcc.address
      ],
      rejected: [],
      envelope: {
        from: fake.options.from.address,
        to: [
          fake.options.to.address,
          fake.options.cc.address,
          fake.options.bcc.address
        ]
      },
      response: fake.sendResponse
    } satisfies MailChannelsTransportInfo<"sync">);
  });

  it("should have rejected recipients if the SDK returns a failed result", async () => {
    vi.spyOn(Emails.prototype, "send").mockResolvedValueOnce({
      data: {
        results: [{
          index: 0,
          messageId: fake.sendResponse.data.results[0]!.messageId,
          status: "failed"
        }]
      },
      error: null
    });

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey,
        sendMode: "sync"
      })
    );

    const info = await transport.sendMail(fake.options);

    expect(info.rejected).toContain(fake.options.to.address);
  });

  it("should append ical attachment to existing attachments", async () => {
    const queueSpy = vi.spyOn(Emails.prototype, "queue").mockResolvedValueOnce(fake.queueResponse);

    const optionsWithAttachments = {
      ...fake.options,
      attachments: [
        { filename: "manual.txt", content: "note", contentType: "text/plain" }
      ]
    };

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey,
        sendMode: "async"
      })
    );

    await transport.sendMail(optionsWithAttachments);

    expect(queueSpy).toHaveBeenCalledWith(expect.objectContaining({
      attachments: expect.arrayContaining([
        expect.objectContaining({ filename: "manual.txt" }),
        expect.objectContaining({ filename: "invite.ics" })
      ])
    }));
  });

  it("should handle missing icalEvent (no ical)", async () => {
    const queueSpy = vi.spyOn(Emails.prototype, "queue").mockResolvedValueOnce(fake.queueResponse);

    const optionsNoIcal = { ...fake.options };
    // @ts-expect-error - testing missing icalEvent
    delete optionsNoIcal.icalEvent;

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey,
        sendMode: "async"
      })
    );

    await transport.sendMail(optionsNoIcal);

    expect(queueSpy).toHaveBeenCalledWith(expect.objectContaining({ attachments: undefined }));
  });

  it("should default subject/text/html to empty strings when omitted", async () => {
    const queueSpy = vi.spyOn(Emails.prototype, "queue").mockResolvedValueOnce(fake.queueResponse);

    const optionsNoTextHtml = {
      ...fake.options,
      subject: undefined,
      text: undefined,
      html: undefined
    };

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey
      })
    );

    await transport.sendMail(optionsNoTextHtml);

    expect(queueSpy).toHaveBeenCalledWith(expect.objectContaining({
      subject: "",
      text: "",
      html: ""
    }));
  });

  it("should throw an error if SDK returns an error", async () => {
    vi.spyOn(Emails.prototype, "queue").mockResolvedValueOnce({
      data: null,
      error: {
        statusCode: 500,
        message: "Internal Server Error",
        type: "internal_server_error",
        response: null
      } satisfies ErrorResponse
    });

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey
      })
    );

    await expect(transport.sendMail(fake.options)).rejects.toThrow(
      "Internal Server Error"
    );
  });

  it("should throw an error if normalize fails or data is missing", async () => {
    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey
      })
    );

    // Mock normalize to first call with an error, then call with null data
    const normalizeSpy = vi.spyOn(MailMessage.prototype, "normalize")
    // @ts-expect-error Mocking the second call to normalize with null data
      .mockImplementationOnce(function (cb: (err: Error | null, data: null) => void) {
        cb(new Error("normalize failed"), null);
      })
      // @ts-expect-error Mocking the second call to normalize with null data
      .mockImplementationOnce(function (cb: (err: Error | null, data: null) => void) {
        cb(null, null);
      });

    await expect(transport.sendMail(fake.options)).rejects.toThrow("normalize failed");
    await expect(transport.sendMail(fake.options)).rejects.toThrow(
      "Failed to normalize mail data"
    );

    normalizeSpy.mockRestore();
  });

  it("should throw an error if SDK send throws an error", async () => {
    vi.spyOn(Emails.prototype, "queue").mockRejectedValueOnce(new Error("SDK send failed"));

    const transport = nodemailer.createTransport(
      mailchannelsTransport({
        apiKey: fake.apiKey
      })
    );

    await expect(transport.sendMail(fake.options)).rejects.toThrow(
      "SDK send failed"
    );
  });
});
