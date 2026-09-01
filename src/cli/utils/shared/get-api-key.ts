export const getApiKey = (apiKey?: string) => {
  const { MAILCHANNELS_API_KEY } = process.env;
  const key = MAILCHANNELS_API_KEY || apiKey;
  if (!key) {
    console.error("Missing API key. Provide it using the '--api-key' flag or set the 'MAILCHANNELS_API_KEY' environment variable.");
    process.exit(1);
  }
  return key;
};
