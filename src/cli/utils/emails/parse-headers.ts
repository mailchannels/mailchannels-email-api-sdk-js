export const parseHeaders = (rawHeaders?: string) => {
  if (!rawHeaders) return;
  try {
    const headers = JSON.parse(rawHeaders);
    return headers;
  }
  catch {
    console.error("[Emails] Invalid JSON for '--headers'");
    process.exit(1);
  }
};
