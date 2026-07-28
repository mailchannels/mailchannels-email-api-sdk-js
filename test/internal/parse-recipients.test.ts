import { describe, expect, it } from "vitest";
import { parseArrayRecipients, parseRecipient } from "~/internal/parse-recipients";

const fake = {
  pair: "Example <name@example.com>",
  object: { name: "Example", email: "name@example.com" }
};

describe("parseRecipient", () => {
  it("should parse recipient name-address pairs", () => {
    const recipient = parseRecipient(fake.pair);
    expect(recipient).toStrictEqual(fake.object);
  });

  it("should parse recipient name-address pairs with spaces in name", () => {
    const recipient = parseRecipient("Example Name <name@example.com>");
    expect(recipient).toStrictEqual({ name: "Example Name", email: "name@example.com" });
  });

  it("should return exact recipient object", () => {
    const recipient = parseRecipient(fake.object);
    expect(recipient).toStrictEqual(fake.object);
  });

  it("should parse email without name", () => {
    const recipient = parseRecipient(fake.object.email);
    expect(recipient).toStrictEqual({ email: fake.object.email });
  });

  it("should return undefined on no email string", () => {
    const recipient = parseRecipient(fake.object.name);
    expect(recipient).toBeUndefined();
  });

  it("should return undefined on empty email in name-address pair", () => {
    const recipient = parseRecipient("Name <>");
    expect(recipient).toBeUndefined();
  });

  it("should return undefined on malformed name-address pair", () => {
    const recipient = parseRecipient("Name <name@test.com> extra");
    expect(recipient).toBeUndefined();
  });

  it("should return undefined on incomplete name-address pair", () => {
    const recipient = parseRecipient("Name <name@test.com");
    expect(recipient).toBeUndefined();
  });

  it("should return undefined if email is not provided", () => {
    const recipient = parseRecipient({ email: "", name: fake.object.name });
    expect(recipient).toBeUndefined();
  });
});

describe("parseArrayRecipients", () => {
  it("should parse single recipient object to array", () => {
    const recipient = parseArrayRecipients(fake.object);
    expect(recipient).toStrictEqual([fake.object]);
  });

  it("should parse array of recipients", () => {
    const recipient = parseArrayRecipients([fake.pair, fake.pair]);
    expect(recipient).toStrictEqual([fake.object, fake.object]);
  });

  it("should parse array of recipients with mixed formats", () => {
    const recipient = parseArrayRecipients([fake.pair, fake.object, fake.object.email]);
    expect(recipient).toStrictEqual([fake.object, fake.object, { email: fake.object.email }]);
  });

  it("should return undefined if array is empty", () => {
    const recipient = parseArrayRecipients([]);
    expect(recipient).toBeUndefined();
  });
});
