import { describe, expect, it } from "vitest";
import { MailChannels } from "~/mailchannels";
import emailParityFixture from "./fixtures/email-api-endpoints.json";

type EmailApiModuleName = keyof Pick<MailChannels, "emails" | "domains" | "webhooks" | "subAccounts" | "metrics" | "suppressions">;

type ParityFixture = {
  version: string;
  endpoints: Array<{
    module: string;
    method: string;
    httpMethod: string;
    path: string;
  }>;
  unmapped?: Array<{
    httpMethod: string;
    path: string;
  }>;
};

const mailchannels = new MailChannels("test-api-key");

const INTERNAL_PROPERTIES = new Set(["mailchannels"]);

const getPublicApiMethods = (value: object, excludedMethods: string[] = [], prefix = "", depth = 0): string[] => {
  const excluded = new Set(["constructor", ...excludedMethods]);
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(value))
    .filter(name => !excluded.has(name) && !name.startsWith("_"))
    .map(name => prefix ? `${prefix}.${name}` : name);

  // Recurse into object-valued own properties (e.g. dkim nested module), but only one level deep
  const nested: string[] = [];
  if (depth < 1) {
    for (const key of Object.getOwnPropertyNames(value)) {
      if (INTERNAL_PROPERTIES.has(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      const val = descriptor?.value;
      if (val && typeof val === "object" && !Array.isArray(val) && Object.getPrototypeOf(val) !== Object.prototype) {
        nested.push(...getPublicApiMethods(val as object, excludedMethods, prefix ? `${prefix}.${key}` : key, depth + 1));
      }
    }
  }

  return [...methods, ...nested].sort();
};

const assertParityFixture = (
  fixtureName: string,
  fixture: ParityFixture,
  actualByModule: Record<string, string[]>
) => {
  describe(`${fixtureName} parity fixture`, () => {
    it("should expose all documented API methods from the parity fixture", () => {
      for (const entry of fixture.endpoints) {
        const methods = actualByModule[entry.module];
        expect(methods, `Missing module ${entry.module}`).toBeDefined();
        expect(methods?.includes(entry.method), `Missing method ${entry.module}.${entry.method} for ${entry.httpMethod} ${entry.path}`).toBe(true);
      }
    });

    it("should keep the fixture in sync with the public module surfaces", () => {
      const fixtureByModule = fixture.endpoints.reduce<Record<string, string[]>>((acc, entry) => {
        acc[entry.module] ??= [];
        acc[entry.module]?.push(entry.method);
        return acc;
      }, {});

      for (const [module, methods] of Object.entries(actualByModule)) {
        // Exclude sendAsync which is not in the fixture
        const comparableMethods = module === "emails" ? methods.filter(method => method !== "sendAsync"): methods;
        expect(fixtureByModule[module]?.sort(), `Fixture mismatch for module ${module}`).toEqual(comparableMethods);
      }
    });

    it("should preserve the documented unmapped endpoint list", () => {
      expect(fixture.unmapped ?? []).toMatchSnapshot();
    });
  });
};

assertParityFixture("Email API", emailParityFixture, {
  emails: getPublicApiMethods(mailchannels.emails),
  domains: getPublicApiMethods(mailchannels.domains),
  webhooks: getPublicApiMethods(mailchannels.webhooks, ["verify"]),
  subAccounts: getPublicApiMethods(mailchannels.subAccounts),
  metrics: getPublicApiMethods(mailchannels.metrics),
  suppressions: getPublicApiMethods(mailchannels.suppressions)
} satisfies Record<EmailApiModuleName, string[]>);
