<script lang="ts">
let loading = $state(false);
let result = $state<{ success: boolean }>();

async function deleteAllWebhooks (e: SubmitEvent) {
  e.preventDefault();
  loading = true;

  const response = await fetch("/api/webhooks", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });

  result = await response.json();
  loading = false;
}
</script>

<h1>Delete all webhooks</h1>

<form class="form" onsubmit={deleteAllWebhooks}>
  <button type="submit" disabled={loading}>
    {loading ? "Deleting..." : "Delete All"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
