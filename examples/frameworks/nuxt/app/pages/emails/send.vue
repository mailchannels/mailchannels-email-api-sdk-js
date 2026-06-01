<script setup lang="ts">
import type { EmailsSendResponse } from "mailchannels-sdk";

const loading = ref(false);
const result = ref<EmailsSendResponse["data"]>();

const sendEmail = async () => {
  loading.value = true;
  $fetch("/api/emails/send", {
    method: "POST"
  }).then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error sending email:", error);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <h1>Send a predefined email</h1>

  <form class="form" @submit.prevent="sendEmail">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send Email' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
