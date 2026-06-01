<script setup lang="ts">
import type { EmailsSendResponse } from "mailchannels-sdk";

const form = ref({
  to: "",
  subject: "",
  name: ""
});

const loading = ref(false);
const result = ref<EmailsSendResponse["data"]>();

const sendEmail = async () => {
  loading.value = true;
  $fetch("/api/emails/send-template", {
    method: "POST",
    body: form.value
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
  <h1>Send an email using a template engine</h1>

  <form class="form" @submit.prevent="sendEmail">
    <div class="input">
      <label for="name">Name:</label>
      <input id="name" v-model="form.name" placeholder="John Doe" required>
    </div>
    <div class="input">
      <label for="to">To:</label>
      <input id="to" v-model="form.to" type="email" placeholder="to@example.com" required>
    </div>
    <div class="input">
      <label for="subject">Subject:</label>
      <input id="subject" v-model="form.subject" type="text" placeholder="Your email subject" required>
    </div>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send Email' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
