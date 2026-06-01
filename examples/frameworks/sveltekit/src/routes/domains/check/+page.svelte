<script lang="ts">
import type { DomainsCheckResponse } from "mailchannels-sdk";

const form = $state({
  domain: ""
});

let loading = $state(false);
let result = $state<DomainsCheckResponse["data"]>();

async function checkDomain (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/domains/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>Check a domain</h1>

<form class="form" onsubmit={checkDomain}>
  <div class="input">
    <label for="domain">Domain:</label>
    <input
      id="domain"
      name="domain"
      type="text"
      placeholder="example.com"
      bind:value={form.domain}
      required
    >
  </div>
  <button type="submit" disabled={loading}>
    {loading ? "Checking..." : "Check"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
