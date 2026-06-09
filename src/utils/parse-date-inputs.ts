import { createValidationError } from "./errors";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;
const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const formatDateInput = (value?: Date | string) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }

  if (typeof value === "string") {
    if ((!ISO_DATE_REGEX.test(value) && !ISO_DATE_ONLY_REGEX.test(value))
      || Number.isNaN(Date.parse(value))
    ) {
      return null;
    }

    if (ISO_DATE_REGEX.test(value)) {
      const date = new Date(value);
      return date.toISOString();
    }
  }

  return value;
};

export const parseDateInputs = <T extends Record<string, string | Date | undefined>>(options: T) => {
  const dates: Record<string, string | undefined> = {};
  const keys = Object.keys(options);

  for (const key of keys) {
    const formatted = formatDateInput(options?.[key]);
    if (formatted === null) {
      return { dates: null, error: createValidationError(`The '${key}' value is not a valid date.`) };
    }
    dates[key] = formatted;
  }

  return { dates, error: null };
};
