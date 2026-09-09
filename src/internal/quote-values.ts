export const quoteValues = <T>(values: Iterable<T>) => {
  return Array.from(values)
    .map(value => `'${value}'`)
    .join(", ");
};
