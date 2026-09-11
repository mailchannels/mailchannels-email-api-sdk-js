import { styleValue, toWordsKeys } from "./style";

const separatorChar = "─";
const separatorLength = 64;
const markerStart = 2;
const separator = separatorChar.repeat(separatorLength);
const separatorWithIndex = (index: number): string => {
  const marker = ` [${index}] `;
  return separator.slice(0, markerStart) + marker + separator.slice(markerStart + marker.length);
};

const tabulate = (record: object) => {
  const entries = Object.entries(toWordsKeys(record));

  const labelWidth = Math.max(...entries.map(([label]) => label.length));

  return entries
    .map(([label, value]) => `  ${label.padEnd(labelWidth + 2)}${styleValue(value)}`)
    .join("\n");
};

export const tabulatedSections = (records: object | object[]) => {
  const isArray = Array.isArray(records);
  const arr = isArray ? records : [records];
  return arr.map((record, i) => {
    const content = tabulate(record);
    return `\n${isArray ? separatorWithIndex(i) : separator}\n${content}${ i < arr.length - 1 ? "" : "\n" + separator }`;
  }).join("");
};
