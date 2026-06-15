<script setup lang="ts">
import { VPLink } from "vitepress/theme";
import { SITE } from "../../site";

defineProps<{
  examples: {
    title: string;
    description?: string;
    path: string;
  }[];
}>();
</script>

<template>
  <div class="examples-grid">
    <VPLink
      v-for="(example, i) in examples"
      :key="i"
      :href="`${SITE.repo}/src/main` + example.path"
      class="example-box link"
      no-icon
    >
      <article class="box">
        <span class="vp-external-link-icon" />
        <div class="icon">
          <span class="vpi-social-bitbucket" style="--icon: url('https://api.iconify.design/simple-icons/bitbucket.svg');" />
        </div>
        <h4 class="title">{{ example.title }}</h4>
        <p class="details" v-if="example.description">{{ example.description }}</p>
      </article>
    </VPLink>
  </div>
</template>

<style scoped>
.examples-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 480px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }
}

.example-box {
  display: block;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  height: 100%;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  color: inherit;
  text-decoration: none;
}

.example-box.link:hover {
  border-color: var(--vp-c-brand-1);
  color: inherit;
  text-decoration: none;
}

.box {
  display: flex;
  flex-direction: column;
  padding: 24px;
  height: 100%;
  position: relative;
}

.vp-external-link-icon::after {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 18px!important;
  height: 18px!important;
  transition: color 0.25s;
}

.example-box.link:hover .vp-external-link-icon::after {
  color: var(--vp-c-brand-1);
}

.title {
  margin-top: 16px;
}

.details {
  margin-top: 16px;
  margin-bottom: 0;
  flex-grow: 1;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  background-color: var(--vp-c-default-soft);
  width: 48px;
  height: 48px;
  font-size: 24px;
  transition: background-color 0.25s;
}
</style>
