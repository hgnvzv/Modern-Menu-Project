<script setup lang="ts">
// معطّل مؤقتاً مع الزر المعلّق في القالب بالأسفل:
// function scrollToMenu(): void {
//   const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//   document
//     .getElementById("menu")
//     ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
// }
</script>

<template>
  <!-- Slim greeting band: no decorative image, no filler — the menu is one
       scroll away and the QR already told the guest where they are. -->
  <section class="hero">
    <div class="container-x hero-inner">
      <h1 class="hero-title">أهلاً بك في Pi Game Center</h1>
      <p class="hero-sub">تصفّح القائمة، واطلب النادل أو الحساب من طاولتك.</p>
      <!-- <button type="button" class="btn-pi btn-sm" @click="scrollToMenu">
        <i class="bi bi-arrow-down-circle" aria-hidden="true"></i>
        تصفّح القائمة
      </button> -->
    </div>
  </section>
</template>
