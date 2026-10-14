<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { useGuestSession } from "../composables/useGuestSession";

/* شاشة ترحيب مؤقتة تظهر عند مسح رمز QR بنجاح: دخان أزرق/بنفسجي متحرك
   واسم المطعم، تختفي تلقائياً بعد ٣ ثوانٍ بتلاشٍ ناعم. */

const { welcomeVisible } = useGuestSession();

const SPLASH_MS = 3000;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

watch(welcomeVisible, (visible) => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (visible) {
    hideTimer = setTimeout(() => {
      hideTimer = null;
      welcomeVisible.value = false;
    }, SPLASH_MS);
  }
});

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="splash">
      <div
        v-if="welcomeVisible"
        class="splash"
        role="status"
        aria-live="polite"
        aria-label="أهلاً بك في Pi Game Center"
      >
        <!-- طبقات الدخان المتحركة -->
        <div class="splash-smoke" aria-hidden="true">
          <span class="smoke smoke-1"></span>
          <span class="smoke smoke-2"></span>
          <span class="smoke smoke-3"></span>
          <span class="smoke smoke-4"></span>
        </div>

        <div class="splash-content">
          <i class="splash-icon bi bi-stars" aria-hidden="true"></i>
          <p class="splash-kicker">أهلاً وسهلاً بك</p>
          <h1 class="splash-title">Pi Game Center</h1>
          <div class="splash-line" aria-hidden="true"></div>
          <p class="splash-sub">تم تفعيل طاولتك — تمتّع بتصفّح القائمة</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 1080;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(
      120% 90% at 50% 110%,
      rgba(139, 92, 246, 0.22),
      transparent 60%
    ),
    linear-gradient(160deg, #060a12 0%, #0a1020 55%, #120a20 100%);
}

/* ------------------------- Smoke layers ------------------------- */

.splash-smoke {
  position: absolute;
  inset: -20%;
  filter: blur(60px);
  opacity: 0.85;
}

.smoke {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: screen;
  will-change: transform, opacity;
}

.smoke-1 {
  width: 55vmax;
  height: 55vmax;
  inset-inline-start: -10%;
  top: -15%;
  background: radial-gradient(circle, rgba(43, 198, 246, 0.4), transparent 65%);
  animation: drift-1 7s ease-in-out infinite alternate;
}

.smoke-2 {
  width: 50vmax;
  height: 50vmax;
  inset-inline-end: -12%;
  bottom: -18%;
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.45),
    transparent 65%
  );
  animation: drift-2 8s ease-in-out infinite alternate;
}

.smoke-3 {
  width: 38vmax;
  height: 38vmax;
  inset-inline-start: 28%;
  top: 30%;
  background: radial-gradient(
    circle,
    rgba(124, 58, 237, 0.35),
    transparent 60%
  );
  animation: drift-3 6s ease-in-out infinite alternate;
}

.smoke-4 {
  width: 30vmax;
  height: 30vmax;
  inset-inline-end: 25%;
  top: 12%;
  background: radial-gradient(circle, rgba(86, 213, 250, 0.3), transparent 60%);
  animation: drift-2 9s ease-in-out infinite alternate-reverse;
}

@keyframes drift-1 {
  from {
    transform: translate(0, 0) scale(1);
    opacity: 0.75;
  }
  to {
    transform: translate(8%, 10%) scale(1.15);
    opacity: 1;
  }
}

@keyframes drift-2 {
  from {
    transform: translate(0, 0) scale(1.1);
    opacity: 0.9;
  }
  to {
    transform: translate(-10%, -8%) scale(1);
    opacity: 0.65;
  }
}

@keyframes drift-3 {
  from {
    transform: translate(0, 0) scale(0.95) rotate(0deg);
    opacity: 0.6;
  }
  to {
    transform: translate(6%, -10%) scale(1.2) rotate(8deg);
    opacity: 1;
  }
}

/* --------------------------- Content ---------------------------- */

.splash-content {
  position: relative;
  text-align: center;
  padding: 2rem 1.5rem;
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.splash-icon {
  font-size: 1.6rem;
  color: var(--pi-blue-600);
  display: block;
  margin-bottom: 0.75rem;
  animation: pulse-glow 2.4s ease-in-out infinite;
}

.splash-kicker {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--pi-gray-500);
}

.splash-title {
  margin: 0.35rem 0 0;
  font-size: clamp(2.1rem, 9vw, 3.6rem);
  font-weight: 900;
  line-height: 1.15;
  background: linear-gradient(
    100deg,
    var(--pi-blue-600) 10%,
    #c4b5fd 50%,
    var(--pi-purple) 90%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 3s linear infinite;
}

.splash-line {
  width: min(220px, 50%);
  height: 2px;
  margin: 1rem auto;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--pi-blue),
    var(--pi-purple),
    transparent
  );
  animation: line-sweep 2.2s ease-in-out infinite alternate;
}

.splash-sub {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--pi-gray-600);
}

@keyframes rise {
  from {
    transform: translateY(18px) scale(0.96);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes shimmer {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 200% 50%;
  }
}

@keyframes line-sweep {
  from {
    transform: scaleX(0.5);
    opacity: 0.5;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

/* --------------------- Fade in / fade out ----------------------- */

.splash-enter-active {
  transition: opacity 0.45s ease;
}

.splash-leave-active {
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}

.splash-leave-to {
  transform: scale(1.03);
}

@media (prefers-reduced-motion: reduce) {
  .smoke,
  .splash-title,
  .splash-line,
  .splash-icon,
  .splash-content {
    animation: none;
  }
}
</style>
