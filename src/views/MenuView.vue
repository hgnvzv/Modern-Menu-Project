<script setup lang="ts">
import { onMounted } from "vue";
// معطّل مؤقتاً مع القالب المعلّق بالأسفل:
// import AppHeader from "../components/AppHeader.vue";
import HeroSection from "../components/HeroSection.vue";
import CategorySidebar from "../components/CategorySidebar.vue";
import SearchBar from "../components/SearchBar.vue";
import ItemGrid from "../components/ItemGrid.vue";
import ServiceSection from "../components/ServiceSection.vue";
// import AppFooter from "../components/AppFooter.vue";
import WelcomeSplash from "../components/WelcomeSplash.vue";
import { useMenu } from "../composables/useMenu";
import { useGuestSession } from "../composables/useGuestSession";

const menu = useMenu();
const session = useGuestSession();

onMounted(() => {
  void menu.load();
  void session.init();
});
</script>

<template>
  <div class="app-shell">
    <!-- دخان أزرق/بنفسجي خفيف ومتحرك خلف المنيو -->
    <div class="aurora" aria-hidden="true">
      <span class="aurora-blob aurora-blue"></span>
      <span class="aurora-blob aurora-purple"></span>
    </div>

    <!-- <AppHeader /> -->
    <main style="flex: 1">
      <HeroSection />

      <section id="menu" class="container-x menu-anchor" aria-label="القائمة">
        <div class="menu-layout">
          <CategorySidebar />

          <div>
            <SearchBar />
            <div class="results-head">
              <h2>
                {{ menu.activeCategoryName.value ?? "كل القائمة" }}
              </h2>
              <span class="muted"
                >{{ menu.visibleItems.value.length }} عنصر</span
              >
            </div>
            <ItemGrid />
          </div>
        </div>
      </section>

      <ServiceSection />
    </main>
    <!-- <AppFooter /> -->
    <WelcomeSplash />
  </div>
</template>

<style scoped>
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.aurora-blob {
  position: absolute;
  width: 60vmax;
  height: 60vmax;
  border-radius: 50%;
  filter: blur(90px);
  mix-blend-mode: screen;
  will-change: transform;
}

.aurora-blue {
  inset-inline-start: -18%;
  top: -28%;
  background: radial-gradient(
    circle,
    rgba(43, 198, 246, 0.16),
    transparent 65%
  );
  animation: aurora-a 16s ease-in-out infinite alternate;
}

.aurora-purple {
  inset-inline-end: -20%;
  bottom: -30%;
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.16),
    transparent 65%
  );
  animation: aurora-b 20s ease-in-out infinite alternate;
}

@keyframes aurora-a {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(10%, 8%) scale(1.12);
  }
}

@keyframes aurora-b {
  from {
    transform: translate(0, 0) scale(1.08);
  }
  to {
    transform: translate(-8%, -10%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .aurora-blob {
    animation: none;
  }
}
</style>
