<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    /** Icon shown when the image fails to load. */
    fallbackIcon?: string;
    eager?: boolean;
  }>(),
  { fallbackIcon: "bi-cup-hot", eager: false },
);

const state = ref<"loading" | "loaded" | "error">("loading");

// Reset when the source changes.
watch(
  () => props.src,
  () => {
    state.value = "loading";
  },
);

function onLoad(): void {
  state.value = "loaded";
}
function onError(): void {
  state.value = "error";
}
</script>

<template>
  <div class="safe-image">
    <div
      v-if="state === 'loading'"
      class="media-skeleton"
      aria-hidden="true"
    ></div>

    <img
      v-if="state !== 'error'"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :decoding="eager ? 'sync' : 'async'"
      :style="{ opacity: state === 'loaded' ? 1 : 0 }"
      @load="onLoad"
      @error="onError"
    />

    <div
      v-if="state === 'error'"
      class="media-fallback"
      role="img"
      :aria-label="alt"
    >
      <i class="bi" :class="fallbackIcon" aria-hidden="true"></i>
    </div>
  </div>
</template>

<style scoped>
.safe-image {
  position: absolute;
  inset: 0;
}

.safe-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.3s ease;
}
</style>
