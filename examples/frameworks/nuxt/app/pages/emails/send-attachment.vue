<script setup lang="ts">
import type { EmailsSendResponse } from "mailchannels-sdk";

const form = ref({
  to: "",
  subject: "",
  message: "",
  url: "",
  filename: "",
  file: null as File | null
});

const loading = ref(false);
const result = ref<EmailsSendResponse["data"]>();

const sendEmail = async () => {
  const { file, ...data } = form.value;

  if (!(file instanceof File)) {
    alert("Attachment file is required.");
    return;
  }

  const formData = new FormData();
  formData.append("payload", JSON.stringify(data));
  formData.append("file", file);

  loading.value = true;
  $fetch("/api/emails/send-attachment", {
    method: "POST",
    body: formData
  }).then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error sending email:", error);
  }).finally(() => {
    loading.value = false;
  });
};

const addFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    form.value.file = target.files[0] ?? null;
  }
};
</script>

<template>
  <h1>Send an email with an attachment</h1>

  <form class="form" @submit.prevent="sendEmail">
    <div class="input">
      <label for="to">To:</label>
      <input id="to" v-model="form.to" type="email" placeholder="to@example.com" required>
    </div>
    <div class="input">
      <label for="subject">Subject:</label>
      <input id="subject" v-model="form.subject" type="text" placeholder="Your email subject" required>
    </div>
    <div class="input">
      <label for="message">Message:</label>
      <textarea id="message" v-model="form.message" placeholder="Write a message" required></textarea>
    </div>
    <div class="input">
      <label for="file">Attachment File:</label>
      <input id="file" type="file" @change="addFile" required>
    </div>
    <div class="input">
      <label for="filename">Attachment Filename:</label>
      <input id="filename" v-model="form.filename" type="text" placeholder="image.jpg" required>
    </div>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send Email' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
