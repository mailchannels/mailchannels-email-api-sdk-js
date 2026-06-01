"use client";

import { useState } from "react";
import type { WebhooksListResponse } from "mailchannels-sdk";

export default function () {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebhooksListResponse["data"]>();

  async function fetchWebhooks (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/webhooks", {
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>List webhooks</h1>

      <form className="form" onSubmit={fetchWebhooks}>
        <button type="submit" disabled={loading}>
          {loading ? "Fetching..." : "Get webhooks"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
