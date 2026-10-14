<script setup lang="ts">
import { ref } from "vue";
import { useAdminStore } from "../../composables/useAdminStore";
import QrCode from "../QrCode.vue";
import QrPrintSheet from "./QrPrintSheet.vue";
import { qrArtPng, qrArtSvg, tableUrl } from "../../lib/qrArt";
import {
  copyText,
  downloadDataUrl,
  downloadSvg,
  safeName,
} from "../../lib/download";
import type { AdminTable } from "../../types";

const { tables, addTable, removeTable } = useAdminStore();

const newLabel = ref("");
const busy = ref(false);
const notice = ref<string | null>(null);

/* Tables being previewed for printing; null keeps the sheet closed. */
const sheetTables = ref<AdminTable[] | null>(null);
const exporting = ref<string | null>(null);

async function submit(): Promise<void> {
  const label = newLabel.value.trim();
  if (!label || busy.value) return;
  busy.value = true;
  const ok = await addTable(label);
  busy.value = false;
  if (ok) {
    newLabel.value = "";
    flash(`أُضيفت الطاولة "${label}" مع رمز QR جديد.`);
  }
}

async function remove(t: AdminTable): Promise<void> {
  if (!window.confirm(`حذف الطاولة "${t.label}"؟ لن تعمل رموز QR الخاصة بها.`))
    return;
  if (await removeTable(t.id)) flash(`حُذفت الطاولة "${t.label}".`);
}

function flash(message: string): void {
  notice.value = message;
  setTimeout(
    () => (notice.value === message ? (notice.value = null) : null),
    4000,
  );
}

async function copy(t: AdminTable): Promise<void> {
  flash(
    (await copyText(tableUrl(t.qr_token)))
      ? "نُسخ رابط الطاولة."
      : "تعذّر النسخ من المتصفح.",
  );
}

function svgOf(t: AdminTable): string {
  return qrArtSvg({ text: tableUrl(t.qr_token) });
}

function exportSvg(t: AdminTable): void {
  downloadSvg(`pi-table-${safeName(t.label)}-qr.svg`, svgOf(t));
  flash("نُزّل الرمز بصيغة SVG (متجه، للطباعة بجودة عالية).");
}

async function exportPng(t: AdminTable): Promise<void> {
  if (exporting.value) return;
  exporting.value = t.id;
  try {
    const dataUrl = await qrArtPng({ text: tableUrl(t.qr_token) }, 1024);
    downloadDataUrl(`pi-table-${safeName(t.label)}-qr.png`, dataUrl);
    flash("نُزّل الرمز بصيغة PNG (1024px).");
  } catch (e) {
    flash(e instanceof Error ? e.message : "تعذّر إنشاء الصورة.");
  } finally {
    exporting.value = null;
  }
}
</script>

<template>
  <section class="panel">
    <div class="qr-head">
      <div>
        <h2 style="margin: 0">الطاولات ورموز QR</h2>
        <p class="muted" style="margin: 0.2rem 0 0">
          كل طاولة لها رمزها الخاص — معاينة مباشرة، طباعة، أو تنزيل.
        </p>
      </div>
      <button
        type="button"
        class="btn-pi btn-sm"
        :disabled="tables.length === 0"
        @click="sheetTables = tables"
      >
        <i class="bi bi-printer" aria-hidden="true"></i> طباعة الكل
      </button>
    </div>

    <div class="d-flex gap-2 align-items-end" style="flex-wrap: wrap">
      <div class="field" style="margin-bottom: 0">
        <label for="t-label">رقم/اسم الطاولة</label>
        <input
          id="t-label"
          v-model="newLabel"
          maxlength="30"
          placeholder="مثال: 6"
          @keyup.enter="submit"
        />
      </div>
      <button
        type="button"
        class="btn-pi btn-sm"
        :disabled="busy || !newLabel.trim()"
        @click="submit"
      >
        <i class="bi bi-plus-lg" aria-hidden="true"></i> إضافة طاولة
      </button>
    </div>

    <p
      v-if="notice"
      class="notice notice-ok"
      role="status"
      style="margin-top: 1rem"
    >
      <i class="bi bi-check-circle" aria-hidden="true"></i> {{ notice }}
    </p>

    <!-- QR tiles -->
    <div v-if="tables.length" class="qr-grid">
      <article v-for="t in tables" :key="t.id" class="qr-tile">
        <div class="qr-tile-top">
          <span class="qr-tile-label">{{ t.label }}</span>
          <span class="qr-tile-count"
            >{{ tables.indexOf(t) + 1 }}/{{ tables.length }}</span
          >
        </div>

        <div class="qr-tile-plate">
          <QrCode
            :text="tableUrl(t.qr_token)"
            :label="`رمز QR للطاولة ${t.label}`"
          />
        </div>

        <p class="qr-tile-url" :title="tableUrl(t.qr_token)">
          {{ tableUrl(t.qr_token) }}
        </p>

        <div class="qr-tile-actions">
          <button
            type="button"
            class="btn-pi-outline btn-sm"
            @click="sheetTables = [t]"
          >
            <i class="bi bi-printer" aria-hidden="true"></i> طباعة
          </button>
          <button
            type="button"
            class="icon-btn"
            :disabled="exporting === t.id"
            title="تنزيل PNG"
            aria-label="تنزيل PNG"
            @click="exportPng(t)"
          >
            <i
              class="bi"
              :class="
                exporting === t.id ? 'bi-arrow-repeat' : 'bi-filetype-png'
              "
              aria-hidden="true"
            ></i>
          </button>
          <button
            type="button"
            class="icon-btn"
            title="تنزيل SVG"
            aria-label="تنزيل SVG"
            @click="exportSvg(t)"
          >
            <i class="bi bi-filetype-svg" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="icon-btn"
            title="نسخ الرابط"
            aria-label="نسخ الرابط"
            @click="copy(t)"
          >
            <i class="bi bi-clipboard" aria-hidden="true"></i>
          </button>
          <a
            class="icon-btn"
            :href="tableUrl(t.qr_token)"
            target="_blank"
            rel="noopener"
            title="فتح القائمة"
            aria-label="فتح القائمة"
          >
            <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
          </a>
          <button
            type="button"
            class="icon-btn icon-btn-danger"
            title="حذف الطاولة"
            aria-label="حذف الطاولة"
            @click="remove(t)"
          >
            <i class="bi bi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </div>

    <div v-else class="state state--compact">
      <i class="bi bi-qr-code"></i>
      <p>لا توجد طاولات بعد. أضف طاولة ليظهر رمزها هنا جاهزًا للطباعة.</p>
    </div>

    <p class="muted" style="margin-top: 1rem; font-size: 0.82rem">
      الرمز يفتح القائمة وينشئ جلسة لهذه الطاولة لمدة محددة. اطبع البطاقة على
      ورق A4 بحجم 100% مع خيار «الألوان» للحصول على أفضل نتيجة مسح.
    </p>

    <QrPrintSheet
      v-if="sheetTables"
      :tables="sheetTables"
      @close="sheetTables = null"
    />
  </section>
</template>
