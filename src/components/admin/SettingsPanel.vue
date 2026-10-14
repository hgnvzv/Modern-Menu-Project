<script setup lang="ts">
import { ref } from "vue";
import { useAdminStore } from "../../composables/useAdminStore";

const { serviceEnabled, setServiceEnabled } = useAdminStore();
const busy = ref(false);
const saved = ref(false);

async function toggle(e: Event): Promise<void> {
  const value = (e.target as HTMLInputElement).checked;
  busy.value = true;
  saved.value = false;
  const ok = await setServiceEnabled(value);
  busy.value = false;
  saved.value = ok;
  if (ok) setTimeout(() => (saved.value = false), 2500);
}
</script>

<template>
  <section class="panel">
    <h2 style="margin-top: 0">إعدادات الخدمة</h2>

    <div class="d-flex align-items-center gap-3">
      <label class="switch">
        <input
          type="checkbox"
          :checked="serviceEnabled"
          :disabled="busy"
          @change="toggle"
        />
        <span class="track"></span>
        <span>
          <strong>{{
            serviceEnabled ? "الخدمة مُفعّلة" : "الخدمة متوقفة"
          }}</strong>
        </span>
      </label>
      <span
        v-if="saved"
        class="notice notice-ok"
        style="padding: 0.25rem 0.6rem"
        >تم الحفظ</span
      >
    </div>

    <p class="muted" style="margin-top: 1rem; max-width: 60ch">
      عند التوقف، لن يستطيع العملاء إرسال طلبات النادل أو الحساب. يتم فرض هذا
      الإعداد
      <strong>على الخادم</strong> (وليس الواجهة فقط)، لذا تُرفض الطلبات برمز 403
      حتى لو حاول العميل إرسالها مباشرة.
    </p>
  </section>
</template>
