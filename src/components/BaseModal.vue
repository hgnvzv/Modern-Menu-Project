<script setup lang="ts">
import { nextTick, onScopeDispose, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    closeLabel?: string;
  }>(),
  { title: "", closeLabel: "إغلاق" },
);

const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

function focusables(): HTMLElement[] {
  if (!panel.value) return [];
  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

function onKeydown(e: KeyboardEvent): void {
  if (!props.open) return;
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
    return;
  }
  if (e.key !== "Tab") return;
  const list = focusables();
  if (list.length === 0) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      document.body.classList.add("no-scroll");
      window.addEventListener("keydown", onKeydown);
      await nextTick();
      focusables()[0]?.focus();
    } else {
      document.body.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKeydown);
      previouslyFocused?.focus?.();
      previouslyFocused = null;
    }
  },
);

onScopeDispose(() => {
  document.body.classList.remove("no-scroll");
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="overlay overlay--center"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="modal-head">
          <h3>{{ title }}</h3>
          <button
            type="button"
            class="icon-btn"
            :aria-label="closeLabel"
            @click="emit('close')"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
