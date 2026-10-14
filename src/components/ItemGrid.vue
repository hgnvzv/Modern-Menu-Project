<script setup lang="ts">
import { useMenu } from "../composables/useMenu";
import ItemCard from "./ItemCard.vue";

const { status, error, visibleItems, retry, filtersActive } = useMenu();
</script>

<template>
  <div>
    <!-- Loading skeletons -->
    <div
      v-if="status === 'loading' || status === 'idle'"
      class="grid"
      aria-busy="true"
    >
      <div v-for="n in 6" :key="n" class="card">
        <div class="card-media"><div class="media-skeleton"></div></div>
        <div class="card-body">
          <div
            class="media-skeleton"
            style="position: static; height: 1rem; border-radius: 6px"
          ></div>
          <div
            class="media-skeleton"
            style="
              position: static;
              height: 0.8rem;
              margin-top: 0.5rem;
              border-radius: 6px;
            "
          ></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="status === 'error'" class="state">
      <i class="bi bi-exclamation-triangle"></i>
      <p>{{ error ?? "تعذّر تحميل القائمة." }}</p>
      <button type="button" class="btn-pi btn-sm" @click="retry">
        <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
        إعادة المحاولة
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="visibleItems.length === 0" class="state">
      <i class="bi bi-inbox"></i>
      <p>
        {{
          filtersActive
            ? "لا توجد نتائج مطابقة لبحثك."
            : "لا توجد عناصر في هذا التصنيف."
        }}
      </p>
    </div>

    <!-- Items -->
    <div v-else class="grid">
      <ItemCard v-for="item in visibleItems" :key="item.id" :item="item" />
    </div>
  </div>
</template>
