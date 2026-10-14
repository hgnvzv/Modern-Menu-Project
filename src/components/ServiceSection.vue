<script setup lang="ts">
import { useGuestSession } from "../composables/useGuestSession";
import SessionStatus from "./SessionStatus.vue";
import CallButton from "./CallButton.vue";

const { serviceEnabled, availabilityReady } = useGuestSession();
</script>

<template>
  <!-- عند إيقاف الخدمة يختفي الكارد بالكامل بدل عرض رسالة إيقاف. -->
  <section
    v-if="!availabilityReady || serviceEnabled"
    class="service container-x"
    aria-labelledby="service-title"
  >
    <div class="service-card">
      <h2 id="service-title" style="margin: 0; font-size: 1.15rem">
        <i class="bi bi-bell" aria-hidden="true"></i>
        خدمة الطاولة
      </h2>

      <SessionStatus />

      <div class="service-actions">
        <CallButton type="waiter" />
        <CallButton type="bill" />
      </div>
    </div>
  </section>
</template>
