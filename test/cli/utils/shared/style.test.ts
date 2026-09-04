import { styleText } from "node:util";
import { describe, expect, it } from "vitest";
import { styleValue, toWordsKeys } from "~/cli/utils/shared/style";

describe("styleValue", () => {
  it("should style various types of values correctly", () => {
    const cases = [
      [42, styleText("yellow", "42")],
      [true, styleText("yellow", "true")],
      ["text", styleText("green", "'text'")],
      [null, "null"],
      [undefined, "undefined"],
      [{ key: "value" }, "{\"key\":\"value\"}"]
    ];

    for (const [value, expected] of cases) {
      expect(styleValue(value)).toBe(expected);
    }
  });
});

describe("toWordsKeys", () => {
  it("converts keys in an object and nested values", () => {
    expect(toWordsKeys({ requestId: "request-123", response: { statusCode: 204 } })).toStrictEqual({
      "Request Id": "request-123",
      "Response": { "Status Code": 204 }
    });
  });

  it("preserves primitive array items while converting object items", () => {
    expect(toWordsKeys(["text", { requestId: "request-123" }])).toStrictEqual([
      "text",
      { "Request Id": "request-123" }
    ]);
  });
});
