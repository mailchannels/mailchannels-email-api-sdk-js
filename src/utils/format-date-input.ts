const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
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

  }

  return value;
};
