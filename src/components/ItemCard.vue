<script setup lang="ts">
import type { PublicItem } from "../types";
import { formatPrice } from "../utils/format";
import SafeImage from "./SafeImage.vue";

defineProps<{ item: PublicItem }>();
</script>

<template>
  <article class="card" :class="{ 'is-unavailable': !item.available }">
    <div class="card-media">
      <SafeImage
        v-if="item.image"
        :src="item.image"
        :alt="item.name"
        fallback-icon="bi-image"
      />
      <div v-else class="media-fallback" aria-hidden="true">
        <i class="bi bi-cup-hot"></i>
      </div>
      <span v-if="item.badge" class="badge-chip">{{ item.badge }}</span>
    </div>

    <!-- On a phone the card is a row: only name and price are kept, the
         description would just eat vertical space. -->
    <div class="card-body">
      <h3 class="card-title">{{ item.name }}</h3>
      <div class="card-foot">
        <span class="price">{{ formatPrice(item.price) }}</span>
        <span v-if="!item.available" class="tag-off">غير متوفّر</span>
      </div>
    </div>
  </article>
</template>
