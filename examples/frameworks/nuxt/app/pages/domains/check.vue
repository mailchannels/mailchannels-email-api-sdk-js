<script setup lang="ts">
import type { DomainsCheckResponse } from "mailchannels-sdk";

const form = ref({
  domain: ""
});

const loading = ref(false);
const result = ref<DomainsCheckResponse["data"]>();

const checkDomain = async () => {
  loading.value = true;
  $fetch("/api/domains/check", {
    method: "POST",
    body: form.value
  }).then((response) => {
    result.value = response;
  }).catch((error) => {
    console.error("Error checking domain:", error);
  }).finally(() => {
    loading.value = false;
  });
};
</script>

<template>
  <h1>Check a domain</h1>

  <form class="form" @submit.prevent="checkDomain">
    <div class="input">
      <label for="domain">Domain:</label>
      <input id="domain" v-model="form.domain" type="text" placeholder="example.com" required>
    </div>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Checking...' : 'Check' }}
    </button>
  </form>

  <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
</template>
