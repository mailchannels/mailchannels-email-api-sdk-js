import { describe, expect, it, vi } from "vitest";
import { $fetch } from "ofetch";
import { MailChannelsClient } from "~/client";
import { version } from "../package.json";

const fake = {
  apiKey: "test-api-key",
  path: "/test",
  options: {
    baseUrl: "http://127.0.0.1:8787",
    retry: 3
  },
  defaults: {
    baseURL: "https://api.mailchannels.net",
    retry: false,
    headers: {
      "X-API-Key": "test-api-key",
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": `mailchannels-node/${version}`
    }
  }
};

vi.mock("ofetch", () => ({
  $fetch: vi.fn()
}));

describe("MailChannelsClient", () => {
  it("should throw an error if no API key is provided", () => {
    // @ts-expect-error Testing missing API key
    const client = () => new MailChannelsClient();
    expect(client).toThrow("Missing MailChannels API key.");
  });

  it("should handle GET method correctly", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey);
    await client.get(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "GET"
    });
  });

  it("should handle POST method correctly", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey);
    await client.post(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "POST"
    });
  });

  it("should handle DELETE method correctly", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey);
    await client.delete(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "DELETE"
    });
  });

  it("should handle PUT method correctly", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey);
    await client.put(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "PUT"
    });
  });

  it("should handle PATCH method correctly", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey);
    await client.patch(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "PATCH"
    });
  });

  it("should allow overriding the base url", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey, {
      baseUrl: fake.options.baseUrl
    });
    await client.get(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "GET",
      baseURL: fake.options.baseUrl
    });
  });

  it("should allow overriding the retry count", async () => {
    vi.mocked($fetch).mockResolvedValueOnce({});

    const client = new MailChannelsClient(fake.apiKey, { retry: fake.options.retry });
    await client.get(fake.path);

    expect($fetch).toHaveBeenCalledWith(fake.path, {
      ...fake.defaults,
      method: "GET",
      retry: fake.options.retry
    });
  });
});
