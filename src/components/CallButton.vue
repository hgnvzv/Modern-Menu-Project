<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import type { ServiceType } from "../types";
import { useGuestSession } from "../composables/useGuestSession";
import { serviceIcons, serviceLabels } from "../utils/labels";

const props = defineProps<{ type: ServiceType }>();
const {
  submitStates,
  submitMessages,
  submit,
  resetSubmit,
  serviceEnabled,
  sessionStatus,
} = useGuestSession();

const state = computed(() => submitStates.value[props.type]);
const message = computed(() => submitMessages.value[props.type]);

let hideTimer: ReturnType<typeof setTimeout> | null = null;
watch(message, (msg) => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (msg) {
    hideTimer = setTimeout(() => {
      hideTimer = null;
      resetSubmit(props.type);
    }, 3000);
  }
});
onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
});
const blocked = computed(
  () =>
    !serviceEnabled.value ||
    sessionStatus.value !== "active" ||
    state.value === "sent" ||
    state.value === "sending",
);
const disabledReason = computed(() => {
  if (!serviceEnabled.value) return "الخدمة متوقفة حالياً من الإدارة.";
  if (sessionStatus.value !== "active")
    return "امسح رمز QR في طاولتك لتفعيل الطلبات.";
  return null;
});
</script>

<template>
  <div>
    <button
      type="button"
      class="btn-pi"
      style="width: 100%"
      :disabled="blocked"
      :title="disabledReason ?? undefined"
      @click="submit(type)"
    >
      <i
        v-if="state === 'sending'"
        class="bi bi-arrow-repeat"
        aria-hidden="true"
      ></i>
      <i v-else class="bi" :class="serviceIcons[type]" aria-hidden="true"></i>
      <template v-if="state === 'sending'">جارٍ الإرسال…</template>
      <template v-else>{{ serviceLabels[type] }}</template>
    </button>

    <p
      class="hint"
      v-if="disabledReason"
      style="margin: 0.4rem 0 0; font-size: 0.8rem; color: var(--pi-gray-500)"
    >
      {{ disabledReason }}
    </p>

    <div
      v-if="message"
      class="notice"
      :class="state === 'sent' ? 'notice-ok' : 'notice-err'"
      role="status"
      aria-live="polite"
      style="margin-top: 0.6rem"
    >
      <i
        class="bi"
        :class="state === 'sent' ? 'bi-check-circle' : 'bi-exclamation-circle'"
        aria-hidden="true"
      ></i>
      {{ message }}
      <button
        v-if="state !== 'sending'"
        type="button"
        class="notice-close"
        aria-label="إخفاء"
        @click="resetSubmit(type)"
      >
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.notice-close {
  margin-inline-start: auto;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font-size: 0.7rem;
  cursor: pointer;
  opacity: 0.65;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease,
    transform 0.15s ease;
}

.notice-close:hover,
.notice-close:focus-visible {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
}

.notice-close:active {
  transform: scale(0.9);
}
</style>
