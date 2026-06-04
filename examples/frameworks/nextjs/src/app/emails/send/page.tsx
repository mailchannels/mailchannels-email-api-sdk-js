"use client";

import { useState } from "react";
import type { EmailsSendResponse } from "mailchannels-sdk";

export default function () {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailsSendResponse["data"]>();

  async function sendEmail (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/emails/send", {
      method: "POST"
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>Send a predefined email</h1>

      <form className="form" onSubmit={sendEmail}>
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Email"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
