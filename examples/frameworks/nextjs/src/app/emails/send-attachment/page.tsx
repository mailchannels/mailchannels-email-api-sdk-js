"use client";

import { useState } from "react";
import type { EmailsSendResponse } from "mailchannels-sdk";

export default function () {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailsSendResponse["data"]>();

  async function sendEmail (e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/emails/send-attachment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, message, url })
    });

    const data = await response.json();

    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <h1>Send an email with an attachment</h1>

      <form className="form" onSubmit={sendEmail}>
        <div className="input">
          <label htmlFor="to">To:</label>
          <input
            id="to"
            name="to"
            type="email"
            placeholder="to@example.com"
            value={to}
            onChange={e => setTo(e.target.value)}
            required
          />
        </div>
        <div className="input">
          <label htmlFor="subject">Subject:</label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="Your email subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
        </div>
        <div className="input">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            placeholder="Write a message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
        </div>
        <div className="input">
          <label htmlFor="url">Attachment URL:</label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
        </div>
        <div className="input">
          <label htmlFor="filename">Attachment Filename:</label>
          <input
            id="filename"
            name="filename"
            type="text"
            placeholder="image.jpg"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Email"}
        </button>
      </form>

      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </>
  );
}
