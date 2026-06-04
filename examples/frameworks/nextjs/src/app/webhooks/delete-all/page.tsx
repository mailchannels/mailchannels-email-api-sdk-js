"use client";

import { useState } from "react";

export default function () {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean }>();

  async function deleteAllWebhooks (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/webhooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>Delete all webhooks</h1>

      <form className="form" onSubmit={deleteAllWebhooks}>
        <button type="submit" disabled={loading}>
          {loading ? "Deleting..." : "Delete All"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
