<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useAdminStore } from "../composables/useAdminStore";
import CategoriesPanel from "../components/admin/CategoriesPanel.vue";
import ItemsPanel from "../components/admin/ItemsPanel.vue";
import TablesPanel from "../components/admin/TablesPanel.vue";
import SettingsPanel from "../components/admin/SettingsPanel.vue";
import RequestsPanel from "../components/admin/RequestsPanel.vue";

const { username, logout } = useAuth();
const { loading, error, loadAll, reloadRequests } = useAdminStore();
const router = useRouter();

/* Clear the token and leave the admin shell immediately — otherwise the
   rendered dashboard stays on screen (with stale data) until a manual reload. */
function signOut(): void {
  logout();
  void router.replace({ name: "admin-login" });
}

type Tab = "categories" | "items" | "tables" | "requests" | "settings";
const tab = ref<Tab>("items");

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "items", label: "العناصر", icon: "bi-list-ul" },
  { id: "categories", label: "التصنيفات", icon: "bi-tags" },
  { id: "tables", label: "الطاولات / QR", icon: "bi-qr-code" },
  { id: "requests", label: "الطلبات", icon: "bi-bell" },
  { id: "settings", label: "الإعدادات", icon: "bi-sliders" },
];

let poll: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  void loadAll();
  poll = setInterval(() => void reloadRequests(), 20000);
});
onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">π</span>
        <span class="brand-name">Pi Admin<small>Pi Game Center</small></span>
      </div>

      <nav class="admin-nav" aria-label="أقسام الإدارة">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          <i class="bi" :class="t.icon" aria-hidden="true"></i>
          {{ t.label }}
        </button>
      </nav>

      <div class="admin-side-foot">
        <RouterLink to="/" class="admin-link">
          <button type="button" aria-label="عرض القائمة">
            <i class="bi bi-shop" aria-hidden="true"></i
            ><span class="btn-label"> عرض القائمة</span>
          </button>
        </RouterLink>
        <span class="admin-user">
          <i class="bi bi-person-circle" aria-hidden="true"></i>
          {{ username ?? "مدير" }}
        </span>
        <button
          type="button"
          class="admin-logout"
          aria-label="تسجيل الخروج"
          @click="signOut"
        >
          <i class="bi bi-box-arrow-right" aria-hidden="true"></i
          ><span class="btn-label"> تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <div
        v-if="error"
        class="notice notice-err"
        role="alert"
        style="margin-bottom: 1rem"
      >
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        {{ error }}
        <button
          type="button"
          class="btn-ghost btn-sm"
          style="margin-inline-start: auto"
          @click="loadAll"
        >
          <i class="bi bi-arrow-clockwise"></i> إعادة التحميل
        </button>
      </div>

      <div v-if="loading" class="state">
        <i class="bi bi-arrow-repeat" style="display: inline-block"></i>
        <p>جارٍ التحميل…</p>
      </div>

      <template v-else>
        <ItemsPanel v-if="tab === 'items'" />
        <CategoriesPanel v-else-if="tab === 'categories'" />
        <TablesPanel v-else-if="tab === 'tables'" />
        <RequestsPanel v-else-if="tab === 'requests'" />
        <SettingsPanel v-else-if="tab === 'settings'" />
      </template>
    </main>
  </div>
</template>
