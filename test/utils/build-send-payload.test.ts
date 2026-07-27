import { describe, expect, it } from "vitest";
import type { EmailsSendPayload } from "~/types/emails/internal";
import type { EmailsSendOptions, EmailsSendPersonalization } from "~/types/emails/send";
import { buildSendPayload } from "~/utils/build-send-payload";

const fake = {
  options: {
    to: "recipient@example.com",
    from: "sender@example.com",
    subject: "Test Subject",
    html: "<p>Test content</p>",
    text: "Test content",
    tracking: {
      click: {
        customDomainName: "clickdemo",
        enable: true
      },
      open: {
        customDomainName: "opendemo",
        enable: true
      }
    },
    unsubscribe: {
      customDomainName: "unsubscribedemo"
    }
  } satisfies EmailsSendOptions,
  personalizations: [{
    bcc: "bcc@example.com",
    cc: "cc@example.com",
    dkim: { domain: "example.com", privateKey: "private-key", selector: "mailchannels" },
    template: { data: { name: "Personalization" } },
    envelopeFrom: "envelopeFrom@example.com",
    from: "from@example.com",
    headers: { "x-header": "value" },
    replyTo: "replyTo@example.com",
    subject: "Personalization Subject",
    to: "to@example.com"
  }] satisfies EmailsSendPersonalization[]
};

const getPayload = async (options: EmailsSendOptions) => {
  const payload = await buildSendPayload(options);
  expect(typeof payload).not.toBe("string");
  if (typeof payload === "string") throw new Error(payload);
  return payload;
};

describe("buildSendPayload", async () => {
  it("should build a payload for a valid email", async () => {
    const payload = await getPayload(fake.options);

    expect(payload.content).toStrictEqual([
      { type: "text/plain", value: fake.options.text, template_type: undefined },
      { type: "text/html", value: fake.options.html, template_type: undefined }
    ]);
    expect(payload.tracking_settings).toStrictEqual({
      click_tracking: {
        custom_domain_name: "clickdemo",
        enable: true
      },
      open_tracking: {
        custom_domain_name: "opendemo",
        enable: true
      }
    });
    expect(payload.unsubscribe_settings).toStrictEqual({
      custom_domain_name: "unsubscribedemo"
    });
  });

  it("should build payload with only text content", async () => {
    const options = { ...fake.options };
    // @ts-expect-error testing without html content
    delete options.html;

    const payload = await getPayload(options);

    expect(payload.content).toStrictEqual([{ type: "text/plain", value: fake.options.text, template_type: undefined }]);
  });

  it("should contain error when from field is missing", async () => {
    const options = { ...fake.options };
    // @ts-expect-error Testing missing from error
    delete options.from;

    const payload = await buildSendPayload(options);

    expect(typeof payload).toBe("string");
    expect(payload).toBe("No sender provided. Use the 'from' option to specify a sender.");
  });

  it("should contain error when to field is missing", async () => {
    const options = { ...fake.options };
    // @ts-expect-error Testing missing to error
    delete options.to;

    const payload = await buildSendPayload(options);

    expect(typeof payload).toBe("string");
    expect(payload).toBe("No recipients provided. Use the 'to' option to specify at least one recipient");
  });

  it("should contain error when no content provided", async () => {
    const options = { ...fake.options, html: "", text: "" };
    const payload = await buildSendPayload(options);

    expect(typeof payload).toBe("string");
    expect(payload).toBe("No email content provided");
  });

  it("should build payload with only custom content", async () => {
    const payload = await getPayload({
      to: "recipient@example.com",
      from: "sender@example.com",
      subject: "Test Subject",
      content: [{ type: "text/html", value: "<p>Hello</p>" }]
    });

    expect(payload.content).toStrictEqual([{ type: "text/html", value: "<p>Hello</p>", template_type: undefined }]);
  });

  it("should build payload with html, text and extra content parts", async () => {
    const payload = await getPayload({
      ...fake.options,
      content: [{ type: "text/css", value: "body { font-family: Arial; }" }]
    });

    expect(payload.content).toStrictEqual([
      { type: "text/plain", value: fake.options.text, template_type: undefined },
      { type: "text/html", value: fake.options.html, template_type: undefined },
      { type: "text/css", value: "body { font-family: Arial; }", template_type: undefined }
    ]);
  });

  it("should contain error when html and content both have text/html", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      content: [{ type: "text/html", value: "<p>Duplicate</p>" }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Cannot provide both 'html' and a 'content' entry with type 'text/html'.");
  });

  it("should contain error when text and content both have text/plain", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      content: [{ type: "text/plain", value: "Duplicate" }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Cannot provide both 'text' and a 'content' entry with type 'text/plain'.");
  });

  it("should build payload with trackings disabled", async () => {
    const payload = await getPayload({
      ...fake.options,
      tracking: {
        click: { enable: false },
        open: { enable: false }
      }
    });

    expect(payload.tracking_settings).toStrictEqual({
      click_tracking: {
        custom_domain_name: undefined,
        enable: false
      },
      open_tracking: {
        custom_domain_name: undefined,
        enable: false
      }
    });
  });

  it("should build payload with no tracking", async () => {
    const payload = await getPayload({ ...fake.options, tracking: undefined });
    expect(payload.tracking_settings).toBeUndefined();
  });

  it("should build payload with a mustache template", async () => {
    const payload = await getPayload({
      ...fake.options,
      template: { type: "mustache", data: { name: "World" } }
    });

    expect(payload.content).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "text/plain", value: fake.options.text, template_type: "mustache" }),
      expect.objectContaining({ type: "text/html", value: fake.options.html, template_type: "mustache" })
    ]));
    expect(payload.personalizations).toEqual(expect.arrayContaining([
      expect.objectContaining({ dynamic_template_data: expect.objectContaining({ name: "World" }) })
    ]));
  });

  it("should build payload with dkim private key", async () => {
    const payload = await getPayload({
      ...fake.options,
      dkim: { domain: "example.com", privateKey: "private-key", selector: "mailchannels" }
    });

    expect(payload.dkim_domain).toBe("example.com");
    expect(payload.dkim_selector).toBe("mailchannels");
    expect(payload.dkim_private_key).toBe("private-key");
  });

  it("should correctly map attachment fields", async () => {
    const payload = await getPayload({
      ...fake.options,
      attachments: [{
        content: "data",
        filename: "inline.png",
        type: "image/png",
        contentId: "logo-cid"
      }]
    });

    expect(payload.attachments).toStrictEqual([{
      content: "data",
      filename: "inline.png",
      type: "image/png",
      content_id: "logo-cid"
    }]);
  });

  it("should contain error when attachments exceed 1000", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      attachments: Array.from({ length: 1001 }, () => ({ content: "data", filename: "file.txt", type: "text/plain" }))
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("The maximum number of attachments is 1000.");
  });

  it("should contain error when campaignId exceeds 48 characters", async () => {
    const payload = await buildSendPayload({ ...fake.options, campaignId: "a".repeat(49) });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("campaignId must be 48 characters or fewer and must not contain spaces.");
  });

  it("should contain error when campaignId contains spaces", async () => {
    const payload = await buildSendPayload({ ...fake.options, campaignId: "has space" });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("campaignId must be 48 characters or fewer and must not contain spaces.");
  });

  it("should contain error when headers includes a reserved header name", async () => {
    const payload = await buildSendPayload({ ...fake.options, headers: { from: "test@example.com" } });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Root headers cannot include the reserved header 'from'.");
  });

  it("should contain error when headers has non-string value", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      // @ts-expect-error Testing non-string header value
      headers: { "x-custom": 123 }
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Root header 'x-custom' must have a string value.");
  });

  it("should contain error when dkim has domain without selector", async () => {
    const payload = await buildSendPayload({ ...fake.options, dkim: { domain: "example.com" } });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Root DKIM domain requires a selector.");
  });

  it("should contain error when dkim has privateKey without domain", async () => {
    const payload = await buildSendPayload({ ...fake.options, dkim: { privateKey: "private-key" } });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Root DKIM privateKey requires both a domain and selector.");
  });

  it("should contain error when to recipients exceed 1000", async () => {
    const payload = await buildSendPayload({ ...fake.options, to: Array.from({ length: 1001 }, (_, i) => `to${i}@example.com`) });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("The maximum number of 'to' recipients is 1000.");
  });

  it("should contain error when cc recipients exceed 1000", async () => {
    const payload = await buildSendPayload({ ...fake.options, cc: Array.from({ length: 1001 }, (_, i) => `cc${i}@example.com`) });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("The maximum number of 'cc' recipients is 1000.");
  });

  it("should contain error when bcc recipients exceed 1000", async () => {
    const payload = await buildSendPayload({ ...fake.options, bcc: Array.from({ length: 1001 }, (_, i) => `bcc${i}@example.com`) });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("The maximum number of 'bcc' recipients is 1000.");
  });

  it("should contain error when transactional is false without DKIM", async () => {
    const payload = await buildSendPayload({ ...fake.options, transactional: false });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Non-transactional messages must be DKIM signed.");
  });

  it("should contain error when transactional is false with multiple recipients", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      to: ["recipient1@example.com", "recipient2@example.com"],
      dkim: { domain: "example.com", selector: "mailchannels" },
      transactional: false
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Non-transactional messages must have exactly one recipient per personalization.");
  });

  it("should build payload for a valid non-transactional email", async () => {
    const payload = await getPayload({
      ...fake.options,
      dkim: { domain: "example.com", selector: "mailchannels" },
      transactional: false
    });

    expect(payload.transactional).toBe(false);
  });

  it("should build payload with valid custom headers", async () => {
    const payload = await getPayload({ ...fake.options, headers: { "x-custom-header": "value" } });
    expect(payload.headers).toStrictEqual({ "x-custom-header": "value" });
  });

  it("should build payload with tracking object but no click or open defined", async () => {
    const payload = await getPayload({ ...fake.options, tracking: {} });
    expect(payload.tracking_settings).toStrictEqual({ click_tracking: undefined, open_tracking: undefined });
  });

  it("should contain error when personalizations is empty", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({ from, subject, html, text, tracking, personalizations: [] });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("At least one personalization must be provided.");
  });

  it("should contain error when personalizations exceed 1000", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: Array.from({ length: 1001 }, () => ({ to: "recipient@example.com" }))
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("The maximum number of personalizations is 1000.");
  });

  it("should contain error when personalization has no to recipients", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: [{ to: "" }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Personalization at index 0 must include at least one recipient in the 'to' field.");
  });

  it("should contain error when personalization to recipients exceed 1000", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: [{ to: Array.from({ length: 1001 }, (_, i) => `to${i}@example.com`) }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Personalization at index 0 cannot include more than 1000 'to' recipients.");
  });

  it("should contain error when personalization cc recipients exceed 1000", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: [{ to: "recipient@example.com", cc: Array.from({ length: 1001 }, (_, i) => `cc${i}@example.com`) }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Personalization at index 0 cannot include more than 1000 'cc' recipients.");
  });

  it("should contain error when personalization bcc recipients exceed 1000", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: [{ to: "recipient@example.com", bcc: Array.from({ length: 1001 }, (_, i) => `bcc${i}@example.com`) }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Personalization at index 0 cannot include more than 1000 'bcc' recipients.");
  });

  it("should contain error when personalization headers include a reserved header", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: [{ to: "recipient@example.com", headers: { from: "test@example.com" } }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Personalization at index 0 headers cannot include the reserved header 'from'.");
  });

  it("should contain error when personalization dkim has domain without selector", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      text,
      tracking,
      personalizations: [{ to: "recipient@example.com", dkim: { domain: "example.com" } }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Personalization at index 0 DKIM domain requires a selector.");
  });

  it("should build payload with personalizations and a mustache template", async () => {
    const { from, subject, html, text, tracking } = fake.options;
    const payload = await getPayload({
      from,
      subject,
      html,
      text,
      tracking,
      template: { type: "mustache" },
      personalizations: [{
        to: "recipient@example.com",
        template: { data: { name: "World" } }
      }]
    });

    expect(payload.personalizations).toEqual(expect.arrayContaining([
      expect.objectContaining({ dynamic_template_data: { name: "World" } })
    ]));
  });

  it("should contain error when personalization template data is provided without a root template type", async () => {
    const { from, subject, html } = fake.options;
    // @ts-expect-error Testing missing root template type error
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      personalizations: [{
        to: "recipient@example.com",
        template: { data: { name: "World" } }
      }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("A root template type is required when using per-personalization template data.");
  });

  it("should reject invalid root template data values", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      template: { type: "mustache", data: { key: null as unknown as string } }
    });

    expect(typeof payload).toBe("string");
    expect(payload).toContain("Root template data key 'key' has an invalid value.");
  });

  it("should reject invalid root template data values", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      // @ts-expect-error Testing invalid root template data value
      template: { type: "mustache", data: null }
    });

    expect(typeof payload).toBe("string");
    expect(payload).toContain("Root template data must be a key/value object.");
  });

  it("should reject invalid personalization template data values", async () => {
    const { from, subject, html } = fake.options;
    const payload = await buildSendPayload({
      from,
      subject,
      html,
      template: { type: "mustache" },
      personalizations: [{
        to: "recipient@example.com",
        template: { data: { key: undefined as unknown as string } }
      }]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toContain("Personalization at index 0 template data key 'key' has an invalid value");
  });

  it("should merge root and per-personalization template data", async () => {
    const { from, subject, html } = fake.options;
    const payload = await getPayload({
      from,
      subject,
      html,
      template: { type: "mustache", data: { greeting: "Hello", name: "Default" } },
      personalizations: [{
        to: "alice@example.com",
        template: { data: { name: "Alice" } }
      }]
    });

    expect(payload.personalizations).toEqual(expect.arrayContaining([
      expect.objectContaining({ dynamic_template_data: { greeting: "Hello", name: "Alice" } })
    ]));
  });

  it("should use only root template data when no per-personalization data is set", async () => {
    const { from, subject, html } = fake.options;
    const payload = await getPayload({
      from,
      subject,
      html,
      template: { type: "mustache", data: { name: "World" } },
      personalizations: [{ to: "someone@example.com" }]
    });

    expect(payload.personalizations).toEqual(expect.arrayContaining([
      expect.objectContaining({ dynamic_template_data: { name: "World" } })
    ]));
  });

  it("should accept array values in template data", async () => {
    const payload = await getPayload({
      ...fake.options,
      template: { type: "mustache", data: { items: ["a", "b", "c"] } }
    });

    expect(payload.personalizations[0]?.dynamic_template_data).toStrictEqual({ items: ["a", "b", "c"] });
  });

  it("should accept map values in template data", async () => {
    const payload = await getPayload({
      ...fake.options,
      template: { type: "mustache", data: { nested: { key: "value" } } }
    });

    expect(payload.personalizations[0]?.dynamic_template_data).toStrictEqual({ nested: { key: "value" } });
  });

  it("should set dynamic_template_data to undefined when no template data is provided", async () => {
    const { from, subject, html } = fake.options;
    const payload = await getPayload({
      from,
      subject,
      html,
      template: { type: "mustache" },
      personalizations: [{ to: "someone@example.com" }]
    });

    expect(payload.personalizations).toEqual(expect.arrayContaining([
      expect.not.objectContaining({ dynamic_template_data: expect.anything() })
    ]));
  });

  it("should set template_type on content items when template is specified", async () => {
    const payload = await getPayload({
      ...fake.options,
      template: { type: "mustache", data: { name: "World" } }
    });

    expect(payload.content).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "text/plain", template_type: "mustache" }),
      expect.objectContaining({ type: "text/html", template_type: "mustache" })
    ]));
  });

  it("should correctly map personalization fields", async () => {
    const payload = await getPayload({
      template: { type: "mustache" },
      from: fake.options.from,
      subject: fake.options.subject,
      html: fake.options.html,
      text: fake.options.text,
      personalizations: fake.personalizations
    });

    expect(payload).toEqual({
      content: [
        { type: "text/plain", value: fake.options.text, template_type: "mustache" },
        { type: "text/html", value: fake.options.html, template_type: "mustache" }
      ],
      from: { email: fake.options.from },
      personalizations: [{
        bcc: [{ email: "bcc@example.com" }],
        cc: [{ email: "cc@example.com" }],
        dkim_domain: "example.com",
        dkim_private_key: "private-key",
        dkim_selector: "mailchannels",
        dynamic_template_data: { name: "Personalization" },
        envelope_from: { email: "envelopeFrom@example.com" },
        from: { email: "from@example.com" },
        headers: { "x-header": "value" },
        reply_to: { email: "replyTo@example.com" },
        subject: "Personalization Subject",
        to: [{ email: "to@example.com" }]
      }],
      subject: fake.options.subject
    } satisfies EmailsSendPayload);
  });

  it("should contain error when contains invalid awaitable attachment", async () => {
    const payload = await buildSendPayload({
      ...fake.options,
      attachments: [
        Promise.reject(new Error("Attachment error"))
      ]
    });

    expect(typeof payload).toBe("string");
    expect(payload).toBe("Attachment error");
  });

  it("should contain error when subject is missing", async () => {
    const options = { ...fake.options };
    // @ts-expect-error Testing missing subject error
    delete options.subject;
    const payload = await buildSendPayload(options);

    expect(typeof payload).toBe("string");
    expect(payload).toBe("No subject provided. Use the 'subject' option to specify a subject.");
  });

  it("should contain error when invalid custom tracking domain names are provided", async () => {
    const payloadClick = await buildSendPayload({
      ...fake.options,
      tracking: {
        click: {
          customDomainName: "invalid name",
          enable: true
        }
      }
    });

    expect(typeof payloadClick).toBe("string");
    expect(payloadClick).toBe("Invalid click tracking: The custom tracking domain name must match ^[a-z0-9-]+$");

    const payloadOpen = await buildSendPayload({
      ...fake.options,
      tracking: {
        open: {
          customDomainName: "invalid name",
          enable: true
        }
      }
    });

    expect(typeof payloadOpen).toBe("string");
    expect(payloadOpen).toBe("Invalid open tracking: The custom tracking domain name must match ^[a-z0-9-]+$");

    const payloadUnsubscribe = await buildSendPayload({
      ...fake.options,
      unsubscribe: {
        customDomainName: "invalid name"
      }
    });

    expect(typeof payloadUnsubscribe).toBe("string");
    expect(payloadUnsubscribe).toBe("Invalid unsubscribe settings: The custom tracking domain name must match ^[a-z0-9-]+$");
  });
});
