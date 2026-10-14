<script setup lang="ts">
import { computed } from "vue";
import { useGuestSession } from "../composables/useGuestSession";

const { sessionStatus, tableLabel } = useGuestSession();

const verified = computed(
  () => sessionStatus.value === "active" && Boolean(tableLabel.value),
);
</script>

<template>
  <header class="topbar">
    <div class="container-x topbar-inner">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">π</span>
        <span class="brand-name">
          Pi Game Center
          <small>مقهى ومطعم</small>
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <span
          class="table-pill"
          :class="{ 'is-muted': !verified }"
          role="status"
          aria-live="polite"
        >
          <i
            class="bi"
            :class="verified ? 'bi-person-check' : 'bi-question-circle'"
            aria-hidden="true"
          ></i>
          <template v-if="verified">طاولة {{ tableLabel }}</template>
          <template v-else>غير مُتحقَّق من الطاولة</template>
        </span>

        <RouterLink
          to="/admin"
          class="icon-btn"
          aria-label="لوحة الإدارة"
          title="لوحة الإدارة"
        >
          <i class="bi bi-gear" aria-hidden="true"></i>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
