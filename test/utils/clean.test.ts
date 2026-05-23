import { describe, expect, it } from "vitest";
import { clean } from "~/utils/clean";

describe("clean", () => {
  it("should remove undefined values from object", () => {
    const input = { a: "Example", b: null, c: undefined, d: true, e: 0 };
    const output = { a: "Example", b: null, d: true, e: 0 };
    expect(clean(input)).toStrictEqual(output);
  });

  it("should remove undefined values from array", () => {
    const input = ["value1", null, "value2", undefined, "value3"];
    const output = ["value1", null, "value2", "value3"];
    expect(clean(input)).toStrictEqual(output);
  });

  it("should return primitive values unchanged", () => {
    expect(clean("string")).toBe("string");
    expect(clean(123)).toBe(123);
    expect(clean(true)).toBe(true);
    expect(clean(null)).toBe(null);
    expect(clean(undefined)).toBe(undefined);
  });

  it("should handle empty objects and arrays", () => {
    expect(clean({})).toStrictEqual({});
    expect(clean([])).toStrictEqual([]);
  });

  it("should remove undefined values from nested objects", () => {
    const input = { a: { b: undefined, c: "value" } };
    const output = { a: { c: "value" } };
    expect(clean(input)).toStrictEqual(output);
  });

  it("should remove undefined values from arrays containing objects", () => {
    const input = [{ a: "value", b: undefined }];
    const output = [{ a: "value" }];
    expect(clean(input)).toStrictEqual(output);
  });

  it("should remove undefined values from deeply nested structures", () => {
    const input = {
      level1: {
        level2: {
          array: [
            { key: "value", remove: undefined },
            undefined,
            { nested: { data: "test", skip: undefined } }
          ],
          optional: undefined,
          keep: "this"
        }
      }
    };
    const output = {
      level1: {
        level2: {
          array: [{ key: "value" }, { nested: { data: "test" } }],
          keep: "this"
        }
      }
    };
    expect(clean(input)).toStrictEqual(output);
  });
});
