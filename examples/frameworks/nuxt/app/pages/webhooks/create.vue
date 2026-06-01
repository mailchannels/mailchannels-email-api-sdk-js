<script setup lang="ts">
const form = ref({
  endpoint: ""
});

const loading = ref(false);
const result = ref<{ success: boolean }>();

const createWebhook = async () => {
  loading.value = true;
  $fetch("/api/webhooks", {
    method: "POST",
    body: form.value
  }).then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error creating webhook:", error);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <h1>Create a webhook</h1>

  <form class="form" @submit.prevent="createWebhook">
    <div class="input">
      <label for="endpoint">Endpoint:</label>
      <input id="endpoint" v-model="form.endpoint" type="url" placeholder="https://example.com/webhooks" required>
    </div>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Creating...' : 'Create' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
