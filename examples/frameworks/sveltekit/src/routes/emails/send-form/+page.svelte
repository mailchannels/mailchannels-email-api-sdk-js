<script lang="ts">
import type { EmailsSendResponse } from "mailchannels-sdk";

const form = $state({
  to: "",
  subject: "",
  message: ""
});

let loading = $state(false);
let result = $state<EmailsSendResponse["data"]>();

async function sendEmail (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/emails/send-form", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>Send an email using a form</h1>

<form class="form" onsubmit={sendEmail}>
  <div class="input">
    <label for="to">To:</label>
    <input
      id="to"
      name="to"
      type="email"
      placeholder="to@example.com"
      bind:value={form.to}
      required
    >
  </div>
  <div class="input">
    <label for="subject">Subject:</label>
    <input
      id="subject"
      name="subject"
      type="text"
      placeholder="Your email subject"
      bind:value={form.subject}
      required
    >
  </div>
  <div class="input">
    <label for="message">Message:</label>
    <textarea
      id="message"
      name="message"
      placeholder="Write a message"
      bind:value={form.message}
      required
    >
    </textarea>
  </div>
  <button type="submit" disabled={loading}>
    {loading ? "Sending..." : "Send Email"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
