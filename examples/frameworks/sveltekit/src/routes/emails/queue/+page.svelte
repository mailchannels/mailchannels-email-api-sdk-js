<script lang="ts">
import type { EmailsQueueResponse } from "mailchannels-sdk";

let loading = $state(false);
let result = $state<EmailsQueueResponse["data"]>();

async function queueEmail (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/emails/queue", {
    method: "POST"
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>Queue a predefined email</h1>

<form class="form" onsubmit={queueEmail}>
  <button type="submit" disabled={loading}>
    {loading ? "Sending..." : "Queue Email"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
