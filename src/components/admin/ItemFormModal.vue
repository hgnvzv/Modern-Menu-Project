<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import BaseModal from "../BaseModal.vue";
import type { AdminCategory, AdminItem } from "../../types";
import type { AdminItemInput } from "../../services/admin";
import { uploadImage } from "../../services/admin";
import { useAuth } from "../../composables/useAuth";

const props = defineProps<{
  open: boolean;
  initial: AdminItem | null;
  categories: AdminCategory[];
}>();
const emit = defineEmits<{ close: []; save: [AdminItemInput] }>();

const { requireToken } = useAuth();

interface FormState {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  badge: string;
  available: boolean;
  sort: number;
}

const form = reactive<FormState>({
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  image: null,
  badge: "",
  available: true,
  sort: 0,
});

const uploading = ref(false);
const uploadError = ref<string | null>(null);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const it = props.initial;
    form.categoryId = it?.category_id ?? props.categories[0]?.id ?? "";
    form.name = it?.name ?? "";
    form.description = it?.description ?? "";
    form.price = it?.price ?? 0;
    form.image = it?.image ?? null;
    form.badge = it?.badge ?? "";
    form.available = it ? it.available === 1 : true;
    form.sort = it?.sort ?? 0;
    uploadError.value = null;
  },
);

async function onFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploading.value = true;
  uploadError.value = null;
  const res = await uploadImage(requireToken(), file);
  uploading.value = false;
  if (res.ok) form.image = res.data.url;
  else uploadError.value = res.message || "تعذّر رفع الصورة.";
  input.value = "";
}

function onSave(): void {
  emit("save", {
    categoryId: form.categoryId,
    name: form.name.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    price: Math.max(0, Math.round(Number(form.price) || 0)),
    image: form.image,
    badge: form.badge.trim() ? form.badge.trim() : null,
    available: form.available,
    sort: Number(form.sort) || 0,
  });
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="initial ? 'تعديل عنصر' : 'إضافة عنصر'"
    @close="emit('close')"
  >
    <form @submit.prevent="onSave">
      <div class="field">
        <label for="i-name">الاسم</label>
        <input id="i-name" v-model="form.name" maxlength="80" required />
      </div>

      <div class="field">
        <label for="i-cat">التصنيف</label>
        <select id="i-cat" v-model="form.categoryId" required>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="i-desc">الوصف</label>
        <textarea
          id="i-desc"
          v-model="form.description"
          rows="3"
          maxlength="500"
        ></textarea>
      </div>

      <div class="form-grid">
        <div class="field" style="margin-bottom: 0">
          <label for="i-price">السعر (د.ع)</label>
          <input
            id="i-price"
            v-model.number="form.price"
            type="number"
            min="0"
            step="250"
          />
        </div>
        <div class="field" style="margin-bottom: 0">
          <label for="i-badge">شارة (اختياري)</label>
          <input
            id="i-badge"
            v-model="form.badge"
            maxlength="24"
            placeholder="الأكثر طلباً"
          />
        </div>
        <div class="field" style="margin-bottom: 0">
          <label for="i-sort">الترتيب</label>
          <input id="i-sort" v-model.number="form.sort" type="number" min="0" />
        </div>
      </div>

      <label class="switch" style="margin: 1rem 0">
        <input v-model="form.available" type="checkbox" />
        <span class="track"></span>
        <span>متوفّر للعرض</span>
      </label>

      <div class="field">
        <label for="i-img">الصورة</label>
        <input
          id="i-img"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          @change="onFile"
        />
        <small v-if="uploading">جارٍ الرفع…</small>
        <small v-if="uploadError" style="color: var(--pi-danger)">{{
          uploadError
        }}</small>
        <div
          v-if="form.image"
          class="d-flex align-items-center gap-2"
          style="margin-top: 0.5rem"
        >
          <img :src="form.image" alt="معاينة" class="thumb" />
          <button
            type="button"
            class="btn-ghost btn-sm"
            @click="form.image = null"
          >
            إزالة
          </button>
        </div>
      </div>

      <div
        class="d-flex gap-2"
        style="margin-top: 1.25rem; justify-content: flex-end"
      >
        <button type="button" class="btn-ghost" @click="emit('close')">
          إلغاء
        </button>
        <button
          type="submit"
          class="btn-pi"
          :disabled="!form.categoryId || !form.name.trim()"
        >
          <i class="bi bi-check-lg" aria-hidden="true"></i> حفظ
        </button>
      </div>
    </form>
  </BaseModal>
</template>
