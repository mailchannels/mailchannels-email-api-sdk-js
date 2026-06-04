"use client";

import { useState } from "react";
import type { EmailsQueueResponse } from "mailchannels-sdk";

export default function () {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailsQueueResponse["data"]>();

  async function queueEmail (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/emails/queue", {
      method: "POST"
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>Queue a predefined email</h1>

      <form className="form" onSubmit={queueEmail}>
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Queue Email"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
