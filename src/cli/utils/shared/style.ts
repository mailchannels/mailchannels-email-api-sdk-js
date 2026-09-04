import { styleText } from "node:util";

export const styleValue = (value: unknown): string => {
  const text = value !== null && typeof value === "object" ? JSON.stringify(value) : String(value);

  switch (typeof value) {
    case "number":
    case "boolean":
      return styleText("yellow", text);
    case "string":
      return styleText("green", `'${text}'`);
    default:
      return text;
  }
};

const camelCaseToWords = (text: string): string => {
  return text.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};

export const toWordsKeys = <T extends object | object[]>(record: T): T => {
  if (Array.isArray(record)) {
    return record.map(item => typeof item === "object" && item !== null ? toWordsKeys(item) : item) as T;
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      camelCaseToWords(key), typeof value === "object" && value !== null ? toWordsKeys(value) : value
    ])
  ) as T;
};
