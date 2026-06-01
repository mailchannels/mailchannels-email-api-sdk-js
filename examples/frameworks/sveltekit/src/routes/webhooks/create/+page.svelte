<script lang="ts">
const form = $state({
  endpoint: ""
});

let loading = $state(false);
let result = $state<{ success: boolean }>();

async function createWebhook (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>Create a webhook</h1>

<form class="form" onsubmit={createWebhook}>
  <div class="input">
    <label for="endpoint">Endpoint:</label>
    <input
      id="endpoint"
      name="endpoint"
      type="url"
      placeholder="https://example.com/webhooks"
      bind:value={form.endpoint}
      required
    >
  </div>
  <button type="submit" disabled={loading}>
    {loading ? "Creating..." : "Create"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
