<script lang="ts">
import type { EmailsSendResponse } from "mailchannels-sdk";

let loading = $state(false);
let result = $state<EmailsSendResponse["data"]>();

async function sendEmail (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/emails/send", {
    method: "POST"
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>Send a predefined email</h1>

<form class="form" onsubmit={sendEmail}>
  <button type="submit" disabled={loading}>
    {loading ? "Sending..." : "Send Email"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
