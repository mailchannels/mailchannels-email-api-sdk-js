import { describe, expect, it } from "vitest";
import { quoteValues } from "~/internal/quote-values";

describe("quoteValues", () => {
  it("should quote all values in an iterable", () => {
    const inputArray = ["value1", "value2", "value3"];
    expect(quoteValues(inputArray)).toBe("'value1', 'value2', 'value3'");
    const inputSet = new Set(inputArray);
    expect(quoteValues(inputSet)).toBe("'value1', 'value2', 'value3'");
  });
});
