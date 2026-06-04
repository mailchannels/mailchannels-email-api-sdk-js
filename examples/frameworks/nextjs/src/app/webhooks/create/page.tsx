"use client";

import { useState } from "react";

export default function () {
  const [endpoint, setEndpoint] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean }>();

  async function createWebhook (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint })
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>Create a webhook</h1>

      <form className="form" onSubmit={createWebhook}>
        <div className="input">
          <label htmlFor="endpoint">Endpoint:</label>
          <input
            id="endpoint"
            name="endpoint"
            type="url"
            placeholder="https://example.com/webhooks"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
