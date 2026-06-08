import { describe, expect, it } from "vitest";
import { formatDateInput, parseDateInputs } from "~/utils/parse-date-inputs";

const fake = {
  date: new Date("2026-01-01T12:00:00Z"),
  dateString: "2026-01-01T12:00:00Z",
  dateOnlyString: "2026-01-01",
  invalidDateString: "January 01, 2026"
};

describe("formatDateInput", () => {
  it("should return ISO string for Date input", () => {
    const result = formatDateInput(fake.date);
    expect(result).toBe(fake.date.toISOString());
  });

  it("should return the same string if it's a valid date-time string", () => {
    const result = formatDateInput(fake.dateString);
    expect(result).toBe(fake.dateString);
  });

  it("should return the same string if it's a valid date-only string", () => {
    const result = formatDateInput(fake.dateOnlyString);
    expect(result).toBe(fake.dateOnlyString);
  });

  it("should return null for invalid date string", () => {
    const result = formatDateInput("invalid-date");
    expect(result).toBeNull();
  });

  it("should return null for invalid Date object", () => {
    const result = formatDateInput(new Date("invalid-date"));
    expect(result).toBeNull();
  });

  it("should return null for non-date string", () => {
    const result = formatDateInput("not-a-date");
    expect(result).toBeNull();
  });

  it("should return undefined if input is undefined", () => {
    const result = formatDateInput(undefined);
    expect(result).toBeUndefined();
  });

  it("should return null for empty string", () => {
    const result = formatDateInput("");
    expect(result).toBeNull();
  });

  it("should return null for date-time string with invalid date", () => {
    const result = formatDateInput("2026-13-01T12:00:00Z");
    expect(result).toBeNull();
  });

  it("should return null for date-only string with invalid date", () => {
    const result = formatDateInput("2026-01-32");
    expect(result).toBeNull();
  });

  it("should return null for non-standard date string", () => {
    const result = formatDateInput(fake.invalidDateString);
    expect(result).toBeNull();
  });
});

describe("parseDateInputs", () => {
  it("should return formatted dates for valid inputs", () => {
    const options = {
      createdBefore: fake.date
    };

    const { dates, error } = parseDateInputs(options);
    expect(dates?.createdBefore).toBe(fake.date.toISOString());
    expect(error).toBeNull();
  });

  it("should return error for invalid date input", () => {
    const options = {
      createdBefore: "invalid-date"
    };
    const { dates, error } = parseDateInputs(options);
    expect(dates).toBeNull();
    expect(error?.message).toStrictEqual("The 'createdBefore' value is not a valid date.");
  });
});
