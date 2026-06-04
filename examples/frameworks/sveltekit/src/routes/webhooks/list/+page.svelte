<script lang="ts">
import type { WebhooksListResponse } from "mailchannels-sdk";

let loading = $state(false);
let result = $state<WebhooksListResponse["data"]>();

async function fetchWebhooks (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/webhooks", {
    headers: { "Content-Type": "application/json" }
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>List webhooks</h1>

<form class="form" onsubmit={fetchWebhooks}>
  <button type="submit" disabled={loading}>
    {loading ? "Fetching..." : "Get webhooks"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
