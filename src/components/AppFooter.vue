<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container-x">
      <div class="brand" style="color: #fff">
        <span class="brand-mark" aria-hidden="true">π</span>
        <span class="brand-name"
          >Pi Game Center<small style="color: #90a4ae">مقهى ومطعم</small></span
        >
      </div>
      <div class="d-flex flex-wrap gap-3">
        <a href="tel:+964000000000"
          ><i class="bi bi-telephone" aria-hidden="true"></i> اتصل بنا</a
        >
        <a href="https://maps.google.com" target="_blank" rel="noopener">
          <i class="bi bi-geo-alt" aria-hidden="true"></i> الموقع
        </a>
      </div>
      <span class="muted"
        >© {{ year }} Pi Game Center — جميع الحقوق محفوظة</span
      >
    </div>
  </footer>
</template>
