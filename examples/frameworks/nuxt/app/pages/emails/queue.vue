<script setup lang="ts">
import type { EmailsQueueResponse } from "mailchannels-sdk";

const loading = ref(false);
const result = ref<EmailsQueueResponse["data"]>();

const queueEmail = async () => {
  loading.value = true;
  $fetch("/api/emails/queue", {
    method: "POST"
  }).then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error queueing email:", error);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <h1>Queue a predefined email</h1>

  <form class="form" @submit.prevent="queueEmail">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Queue Email' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
