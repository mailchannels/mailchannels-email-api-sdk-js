<script setup lang="ts">
import type { WebhooksListResponse } from "mailchannels-sdk";

const loading = ref(false);
const result = ref<WebhooksListResponse["data"]>();

const fetchWebhooks = async () => {
  loading.value = true;
  $fetch("/api/webhooks").then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error fetching webhooks:", error);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <h1>List webhooks</h1>

  <form class="form" @submit.prevent="fetchWebhooks">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Fetching...' : 'Get webhooks' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
