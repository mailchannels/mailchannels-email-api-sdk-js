<script setup lang="ts">
const loading = ref(false);
const result = ref<{ success: boolean }>();

const deleteAllWebhooks = async () => {
  loading.value = true;
  $fetch("/api/webhooks", {
    method: "DELETE"
  }).then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error deleting webhooks:", error);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <h1>Delete all webhooks</h1>

  <form class="form" @submit.prevent="deleteAllWebhooks">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Deleting...' : 'Delete All' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
