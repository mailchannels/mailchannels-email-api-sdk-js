<script setup lang="ts">
import { Button, Html, Text } from "@vue-email/components";

defineProps<{
  lang: string;
  url: string;
}>();
</script>

<template>
  <Html :lang="lang">
    <Text>Hello from Vue Email</Text>
    <Button :href="url">Click me</Button>
  </Html>
</template>
