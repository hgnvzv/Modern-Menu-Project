<script setup lang="ts">
import { computed } from "vue";
import { serviceIcons, serviceLabels } from "../../utils/labels";
import { useAdminStore } from "../../composables/useAdminStore";

const { requests, handleRequest, reloadRequests } = useAdminStore();

/* الطلبات الأقدم من يوم كامل تُخفى تلقائياً من اللوحة. */
const DAY_MS = 24 * 60 * 60 * 1000;
const visibleRequests = computed(() => {
  const cutoff = Date.now() - DAY_MS;
  return requests.value.filter((r) => r.created_at >= cutoff);
});

function time(ts: number): string {
  return new Date(ts).toLocaleString("ar", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}
</script>

<template>
  <section class="panel">
    <div
      class="d-flex align-items-center justify-content-between"
      style="margin-bottom: 0.75rem"
    >
      <h2 style="margin: 0">الطلبات الواردة</h2>
      <button type="button" class="btn-ghost btn-sm" @click="reloadRequests">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> تحديث
      </button>
    </div>

    <table class="table-admin">
      <thead>
        <tr>
          <th>الطاولة</th>
          <th>النوع</th>
          <th>الوقت</th>
          <th>الحالة</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in visibleRequests" :key="r.id">
          <td>
            <strong>{{ r.tableLabel }}</strong>
          </td>
          <td>
            <i class="bi" :class="serviceIcons[r.type]" aria-hidden="true"></i>
            {{ serviceLabels[r.type] }}
          </td>
          <td class="muted">{{ time(r.created_at) }}</td>
          <td>
            <span
              v-if="r.status === 'pending'"
              class="badge-chip"
              style="position: static"
              >جديد</span
            >
            <span v-else class="muted">تمت المعالجة</span>
          </td>
          <td style="text-align: end">
            <button
              v-if="r.status === 'pending'"
              type="button"
              class="btn-pi-outline btn-sm"
              @click="handleRequest(r.id)"
            >
              تمت
            </button>
          </td>
        </tr>
        <tr v-if="visibleRequests.length === 0">
          <td colspan="5" class="muted">لا توجد طلبات.</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
