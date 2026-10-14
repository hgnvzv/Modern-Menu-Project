<script setup lang="ts">
import { computed } from "vue";
import { useGuestSession } from "../composables/useGuestSession";
import { formatDuration } from "../utils/format";
import { sessionView } from "../utils/labels";

const { sessionStatus, remainingMs, tableLabel, init } = useGuestSession();

const view = computed(() =>
  sessionView(
    sessionStatus.value,
    formatDuration(remainingMs.value),
    tableLabel.value,
  ),
);

const canRetry = computed(() =>
  ["error", "expired", "invalid"].includes(sessionStatus.value),
);
</script>

<template>
  <div class="session-status" :class="`tone-${view.tone}`">
    <span class="dot" aria-hidden="true"
      ><i class="bi" :class="view.icon"></i
    ></span>
    <div class="text">
      <strong>{{ view.label }}</strong>
      <!-- <span v-if="view.hint">{{ view.hint }}</span> -->
    </div>
    <button
      v-if="canRetry"
      type="button"
      class="btn-ghost btn-sm"
      style="margin-inline-start: auto"
      @click="init"
    >
      <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
      إعادة المحاولة
    </button>
  </div>
</template>
