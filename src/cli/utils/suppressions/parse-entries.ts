import type { SuppressionsCreateEntry, SuppressionsTypes } from "../../../mailchannels";

const isValidEntry = (value: unknown): value is SuppressionsCreateEntry => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const entry = value as Record<string, unknown>;
  return typeof entry.recipient === "string"
    && (entry.types === undefined || Array.isArray(entry.types));
};

export const parseEntries = async (
  rawEntries: boolean,
  recipient?: string,
  types?: string,
  notes?: string
) => {
  if (rawEntries) {
    if (recipient) {
      console.warn("[Suppressions] Warning: both '--entries' and '--recipient' are provided. Using '--entries'.");
    }

    if (types || notes) {
      console.warn("[Suppressions] Warning: '--entries' ignores '--types' and '--notes'.");
    }

    if (process.stdin.isTTY) {
      console.error("[Suppressions] '--entries' requires JSON input piped to stdin.");
      process.exit(1);
    }

    let input = "";
    for await (const chunk of process.stdin) {
      input += chunk;
    }

    let parsed: SuppressionsCreateEntry[];

    try {
      parsed = JSON.parse(input);
    }
    catch {
      console.error("[Suppressions] JSON input for '--entries' is not valid.");
      process.exit(1);
    }

    if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) {
      console.error("[Suppressions] '--entries' must be a JSON array of suppression entries.");
      process.exit(1);
    }

    return parsed;
  }

  if (!recipient) {
    console.error("[Suppressions] Either '--entries' or '--recipient' is required.");
    process.exit(1);
  }

  const entry: SuppressionsCreateEntry = { recipient };
  const parsedTypes = types?.split(",").map(type => type.trim()) as SuppressionsTypes[] | undefined;

  if (parsedTypes?.length) entry.types = parsedTypes;
  if (notes) entry.notes = notes;

  return [entry];
};
