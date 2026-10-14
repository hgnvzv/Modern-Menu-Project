<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import QrCode from "../QrCode.vue";
import { tableUrl } from "../../lib/qrArt";
import type { AdminTable } from "../../types";

/* Printable A4 sheet of table cards.
   On screen it is a preview overlay; in print everything else on the page is
   hidden (see the @media print rules) and only this sheet is laid out, three
   60×86mm cards per row, so staff can cut and fold them on the tables. */

defineProps<{ tables: AdminTable[] }>();
const emit = defineEmits<{ close: [] }>();

function print(): void {
  document.body.classList.add("qr-printing");
  const done = (): void => document.body.classList.remove("qr-printing");
  window.addEventListener("afterprint", done, { once: true });
  // Safari sometimes skips afterprint; clear the class anyway.
  setTimeout(done, 4000);
  window.print();
}

onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div class="qr-sheet-scrim">
      <div class="qr-sheet-bar">
        <div class="qr-sheet-bar-text">
          <strong>بطاقات QR</strong>
          <span class="muted">
            {{ tables.length }} طاولة · ورق A4 · حجم 100% · مع ألوان
          </span>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn-ghost btn-sm" @click="emit('close')">
            <i class="bi bi-x-lg" aria-hidden="true"></i> إغلاق
          </button>
          <button type="button" class="btn-pi btn-sm" @click="print">
            <i class="bi bi-printer" aria-hidden="true"></i> طباعة
          </button>
        </div>
      </div>

      <div class="qr-sheet">
        <article v-for="t in tables" :key="t.id" class="qr-card">
          <header class="qr-card-head">
            <span class="qr-card-mark">π</span>
            <span class="qr-card-venue">
              Pi Game Center
              <small>مقهى ومطعم</small>
            </span>
          </header>

          <div class="qr-card-plate">
            <QrCode
              :text="tableUrl(t.qr_token)"
              :label="`رمز QR للطاولة ${t.label}`"
              flat
            />
          </div>

          <p class="qr-card-cta">امسح الرمز لفتح القائمة</p>

          <div class="qr-card-table">
            <span>طاولة</span>
            <strong>{{ t.label }}</strong>
          </div>

          <p class="qr-card-url">{{ tableUrl(t.qr_token) }}</p>
        </article>
      </div>
    </div>
  </Teleport>
</template>
