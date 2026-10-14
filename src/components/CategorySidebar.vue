<script setup lang="ts">
import { computed } from "vue";
import { useMenu } from "../composables/useMenu";

const { categories, items, activeCategoryId, selectCategory } = useMenu();

const counts = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  for (const it of items.value)
    map[it.categoryId] = (map[it.categoryId] ?? 0) + 1;
  return map;
});

function icon(cat: string | null): string {
  return cat && cat.startsWith("bi-") ? cat : "bi-collection";
}
</script>

<template>
  <nav class="sidebar" aria-label="تصنيفات القائمة">
    <div class="sidebar-title">التصنيفات</div>
    <div class="cat-list" role="listbox" aria-label="التصنيفات">
      <!-- <button
        type="button"
        class="cat-item"
        :class="{ active: activeCategoryId === null }"
        role="option"
        :aria-selected="activeCategoryId === null"
        @click="selectCategory(null)"
      >
        <i class="bi bi-grid" aria-hidden="true"></i>
        الكل
        <span class="count">{{ items.length }}</span>
      </button> -->

      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="cat-item"
        :class="{ active: activeCategoryId === cat.id }"
        role="option"
        :aria-selected="activeCategoryId === cat.id"
        @click="selectCategory(cat.id)"
      >
        <i class="bi" :class="icon(cat.icon)" aria-hidden="true"></i>
        {{ cat.name }}
        <span class="count">{{ counts[cat.id] ?? 0 }}</span>
      </button>
    </div>
  </nav>
</template>
