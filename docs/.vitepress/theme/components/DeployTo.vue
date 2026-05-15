<script setup lang="ts">
import { VPLink } from "vitepress/theme";
import { SITE } from "../../site";

const props = defineProps<{
  platform: "vercel" | "cloudflare" | "deno";
  path: string;
}>();

const deployData = {
  vercel: {
    href: `https://vercel.com/new/clone?repository-url=${SITE.repo + "/tree/main" + props.path}&env=MAILCHANNELS_API_KEY&envDefaults=%7B%22MAILCHANNELS_API_KEY%22%3A%22your-api-key%22%7D&project-name=mailchannels-vercel-functions-example&repository-name=mailchannels-vercel-functions-example`,
    image: "https://vercel.com/button",
    alt: "Deploy on Vercel"
  },
  cloudflare: {
    href: `https://deploy.workers.cloudflare.com/?url=${SITE.repo + "/tree/main" + props.path}`,
    image: "https://deploy.workers.cloudflare.com/button",
    alt: "Deploy to Cloudflare"
  },
  deno: {
    href: `https://app.deno.com/new?clone=${SITE.repo}&path=${props.path}`,
    image: "https://deno.com/button",
    alt: "Deploy on Deno"
  }
};
</script>

<template>
  <VPLink :href="deployData[platform].href" no-icon>
    <img :src="deployData[platform].image" :alt="deployData[platform].alt" />
  </VPLink>
</template>
