<script setup lang="ts">
import { computed, ref } from "vue";
import { useAdminStore } from "../../composables/useAdminStore";
import type { AdminItem } from "../../types";
import type { AdminItemInput } from "../../services/admin";
import ItemFormModal from "./ItemFormModal.vue";
import { formatPrice } from "../../utils/format";

const { categories, items, createItem, updateItem, removeItem } =
  useAdminStore();

const filterCat = ref<string>("");
const modalOpen = ref(false);
const editing = ref<AdminItem | null>(null);

const categoryName = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const c of categories.value) map[c.id] = c.name;
  return map;
});

const shown = computed<AdminItem[]>(() => {
  const list = filterCat.value
    ? items.value.filter((i) => i.category_id === filterCat.value)
    : items.value;
  return [...list].sort(
    (a, b) => a.sort - b.sort || a.name.localeCompare(b.name),
  );
});

function openAdd(): void {
  editing.value = null;
  modalOpen.value = true;
}
function openEdit(item: AdminItem): void {
  editing.value = item;
  modalOpen.value = true;
}

async function onSave(input: AdminItemInput): Promise<void> {
  const ok = editing.value
    ? await updateItem(editing.value.id, input)
    : await createItem(input);
  if (ok) modalOpen.value = false;
}

async function remove(item: AdminItem): Promise<void> {
  if (!window.confirm(`حذف العنصر "${item.name}"؟`)) return;
  await removeItem(item.id);
}
</script>

<template>
  <section class="panel">
    <div
      class="d-flex align-items-center justify-content-between gap-2"
      style="flex-wrap: wrap"
    >
      <h2 style="margin: 0">العناصر</h2>
      <div class="d-flex gap-2 align-items-center">
        <select
          v-model="filterCat"
          aria-label="تصفية حسب التصنيف"
          class="form-select"
          style="width: auto"
        >
          <option value="">كل التصنيفات</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
        <button type="button" class="btn-pi btn-sm" @click="openAdd">
          <i class="bi bi-plus-lg" aria-hidden="true"></i> إضافة عنصر
        </button>
      </div>
    </div>

    <table class="table-admin" style="margin-top: 1rem">
      <thead>
        <tr>
          <th></th>
          <th>الاسم</th>
          <th>التصنيف</th>
          <th>السعر</th>
          <th>الحالة</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in shown" :key="item.id">
          <td>
            <img v-if="item.image" :src="item.image" alt="" class="thumb" />
            <span v-else class="muted">—</span>
          </td>
          <td>{{ item.name }}</td>
          <td>{{ categoryName[item.category_id] ?? "—" }}</td>
          <td>{{ formatPrice(item.price) }}</td>
          <td>
            <span v-if="item.available === 1" class="muted">متوفّر</span>
            <span v-else class="tag-off">غير متوفّر</span>
          </td>
          <td style="text-align: end">
            <span class="row-actions">
              <button
                type="button"
                class="icon-btn"
                aria-label="تعديل"
                @click="openEdit(item)"
              >
                <i class="bi bi-pencil"></i>
              </button>
              <button
                type="button"
                class="icon-btn"
                aria-label="حذف"
                @click="remove(item)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </span>
          </td>
        </tr>
        <tr v-if="shown.length === 0">
          <td colspan="6" class="muted">لا توجد عناصر.</td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="categories.length === 0"
      class="notice notice-err"
      style="margin-top: 1rem"
    >
      أضف تصنيفاً أولاً قبل إضافة العناصر.
    </p>

    <ItemFormModal
      :open="modalOpen"
      :initial="editing"
      :categories="categories"
      @close="modalOpen = false"
      @save="onSave"
    />
  </section>
</template>
