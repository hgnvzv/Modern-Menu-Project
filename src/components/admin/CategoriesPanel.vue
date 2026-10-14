<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import type { AdminCategory } from "../../types";
import { useAdminStore } from "../../composables/useAdminStore";

const { categories, createCategory, updateCategory, removeCategory, saving } =
  useAdminStore();

/* أيقونات Bootstrap المتاحة للاختيار منها في حقل الأيقونة. */
const ICON_OPTIONS = [
  "bi-cup-hot",
  "bi-coffee",
  "bi-tea",
  "bi-mug-hot",
  "bi-cup-straw",
  "bi-water",
  "bi-cake",
  "bi-cake2",
  "bi-cookie",
  "bi-candy",
  "bi-popcorn",
  "bi-pizza-slice",
  "bi-egg-fried",
  "bi-egg",
  "bi-martini-glass-citrus",
  "bi-basket",
  "bi-shop",
  "bi-controller",
  "bi-stars",
  "bi-star",
  "bi-heart",
  "bi-gift",
  "bi-trophy",
  "bi-lightning-charge",
  "bi-music-note-beamed",
];

const iconOpen = ref(false);
const iconPicker = ref<HTMLElement | null>(null);

function toggleIconPicker(): void {
  iconOpen.value = !iconOpen.value;
}

function pickIcon(name: string): void {
  form.icon = name;
  iconOpen.value = false;
}

function onDocClick(e: MouseEvent): void {
  if (iconPicker.value && !iconPicker.value.contains(e.target as Node)) {
    iconOpen.value = false;
  }
}

function onDocKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") iconOpen.value = false;
}

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onDocKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick, true);
  document.removeEventListener("keydown", onDocKeydown);
});

const editing = ref<string | null>(null);
const form = reactive({ name: "", icon: "", sort: 0 });

function resetForm(): void {
  editing.value = null;
  form.name = "";
  form.icon = "";
  form.sort = categories.value.length;
}

function startEdit(cat: AdminCategory): void {
  editing.value = cat.id;
  form.name = cat.name;
  form.icon = cat.icon ?? "";
  form.sort = cat.sort;
}

async function submit(): Promise<void> {
  const payload = {
    name: form.name.trim(),
    icon: form.icon.trim() ? form.icon.trim() : null,
    sort: Number(form.sort) || 0,
  };
  if (!payload.name) return;
  const ok = editing.value
    ? await updateCategory(editing.value, payload)
    : await createCategory(payload);
  if (ok) resetForm();
}

async function remove(cat: AdminCategory): Promise<void> {
  if (!window.confirm(`حذف التصنيف "${cat.name}"؟ سيتم حذف جميع عناصره.`))
    return;
  await removeCategory(cat.id);
  if (editing.value === cat.id) resetForm();
}

resetForm();
</script>

<template>
  <section class="panel">
    <h2 style="margin-top: 0">التصنيفات</h2>

    <div class="form-grid" style="align-items: end">
      <div class="field" style="margin-bottom: 0">
        <label for="c-name">الاسم</label>
        <input
          id="c-name"
          v-model="form.name"
          maxlength="60"
          placeholder="مثال: مشروبات ساخنة"
        />
      </div>
      <div class="field" style="margin-bottom: 0">
        <label for="c-icon">الأيقونة (Bootstrap Icons)</label>
        <div ref="iconPicker" class="icon-picker">
          <button
            id="c-icon"
            type="button"
            class="icon-picker-trigger"
            :aria-expanded="iconOpen"
            aria-haspopup="listbox"
            @click="toggleIconPicker"
          >
            <span class="icon-picker-value">
              <i
                v-if="form.icon"
                class="bi"
                :class="form.icon"
                aria-hidden="true"
              ></i>
              <span>{{ form.icon || "بدون أيقونة" }}</span>
            </span>
            <i
              class="bi bi-chevron-down icon-picker-chevron"
              :class="{ rotated: iconOpen }"
              aria-hidden="true"
            ></i>
          </button>

          <div
            v-if="iconOpen"
            class="icon-picker-menu"
            role="listbox"
            aria-label="اختيار أيقونة"
          >
            <button
              type="button"
              class="icon-picker-option"
              role="option"
              :aria-selected="form.icon === ''"
              @click="pickIcon('')"
            >
              <i class="bi bi-slash-circle" aria-hidden="true"></i>
              <small>بدون</small>
            </button>
            <button
              v-for="name in ICON_OPTIONS"
              :key="name"
              type="button"
              class="icon-picker-option"
              :class="{ active: form.icon === name }"
              role="option"
              :aria-selected="form.icon === name"
              :title="name"
              @click="pickIcon(name)"
            >
              <i class="bi" :class="name" aria-hidden="true"></i>
              <small>{{ name.replace(/^bi-/, "") }}</small>
            </button>
          </div>
        </div>
      </div>
      <div class="field" style="margin-bottom: 0">
        <label for="c-sort">الترتيب</label>
        <input id="c-sort" v-model.number="form.sort" type="number" min="0" />
      </div>
    </div>

    <div class="d-flex gap-2" style="margin-top: 0.9rem">
      <button
        type="button"
        class="btn-pi btn-sm"
        :disabled="saving"
        @click="submit"
      >
        <i class="bi bi-plus-lg" aria-hidden="true"></i>
        {{ editing ? "حفظ التعديل" : "إضافة تصنيف" }}
      </button>
      <button
        v-if="editing"
        type="button"
        class="btn-ghost btn-sm"
        @click="resetForm"
      >
        إلغاء
      </button>
    </div>

    <table class="table-admin" style="margin-top: 1.25rem">
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الأيقونة</th>
          <th>الترتيب</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cat in categories" :key="cat.id">
          <td>{{ cat.name }}</td>
          <td>
            <i v-if="cat.icon" class="bi" :class="cat.icon"></i>
            <span class="muted">{{ cat.icon }}</span>
          </td>
          <td>{{ cat.sort }}</td>
          <td style="text-align: end">
            <span class="row-actions">
              <button
                type="button"
                class="icon-btn"
                aria-label="تعديل"
                @click="startEdit(cat)"
              >
                <i class="bi bi-pencil"></i>
              </button>
              <button
                type="button"
                class="icon-btn"
                aria-label="حذف"
                @click="remove(cat)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </span>
          </td>
        </tr>
        <tr v-if="categories.length === 0">
          <td colspan="4" class="muted">لا توجد تصنيفات بعد.</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
/* سيلكت الأيقونات: يحاكي شكل حقول .field لكنه يعرض الأيقونات نفسها. */
.icon-picker {
  position: relative;
}

.icon-picker-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font: inherit;
  font-size: 16px;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--pi-line);
  border-radius: var(--pi-radius-sm);
  background: var(--pi-elevated);
  color: var(--pi-ink);
  cursor: pointer;
}

.icon-picker-trigger:focus-visible {
  outline: none;
  border-color: var(--pi-blue-100);
  box-shadow: 0 0 0 3px var(--pi-blue-050);
}

.icon-picker-value {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.icon-picker-value .bi {
  font-size: 1.05rem;
  color: var(--pi-blue-700);
  flex-shrink: 0;
}

.icon-picker-value span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-picker-chevron {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--pi-gray-500);
  transition: transform 0.2s ease;
}

.icon-picker-chevron.rotated {
  transform: rotate(180deg);
}

.icon-picker-menu {
  position: absolute;
  z-index: 30;
  inset-inline: 0;
  top: calc(100% + 0.35rem);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  max-height: 15.5rem;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--pi-surface-2);
  border: 1px solid var(--pi-line-strong);
  border-radius: var(--pi-radius-sm);
  box-shadow: var(--pi-shadow, 0 12px 30px rgba(0, 0, 0, 0.45));
}

.icon-picker-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.45rem 0.25rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--pi-gray-600);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.icon-picker-option .bi {
  font-size: 1.2rem;
}

.icon-picker-option small {
  font-size: 0.62rem;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon-picker-option:hover,
.icon-picker-option:focus-visible {
  background: var(--pi-blue-050);
  color: var(--pi-blue-700);
  outline: none;
}

.icon-picker-option.active {
  border-color: var(--pi-blue);
  background: var(--pi-blue-050);
  color: var(--pi-blue-700);
}
</style>
