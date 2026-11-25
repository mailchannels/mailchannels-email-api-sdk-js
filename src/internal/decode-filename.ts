export const decodeFilename = (filename: string) => {
  try {
    return decodeURIComponent(filename);
  }
  catch {
    return filename;
  }
};
