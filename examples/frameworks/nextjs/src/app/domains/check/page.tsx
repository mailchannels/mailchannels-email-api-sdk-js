"use client";

import { useState } from "react";
import type { DomainsCheckResponse } from "mailchannels-sdk";

export default function () {
  const [domain, setDomain] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DomainsCheckResponse["data"]>();

  async function checkDomain (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/domains/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain })
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>Check a domain</h1>

      <form className="form" onSubmit={checkDomain}>
        <div className="input">
          <label htmlFor="domain">Domain:</label>
          <input
            id="domain"
            name="domain"
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
