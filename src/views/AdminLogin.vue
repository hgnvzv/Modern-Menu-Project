<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const { login } = useAuth();
const router = useRouter();

const username = ref("");
const password = ref("");
const busy = ref(false);
const error = ref<string | null>(null);
/* Set when the backend has no admin account yet — renders the Arabic setup
   hint instead of the raw English server message. */
const needsAdminSetup = ref(false);

async function onSubmit(): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  error.value = null;
  needsAdminSetup.value = false;
  const res = await login(username.value.trim(), password.value);
  busy.value = false;
  if (res.ok) {
    router.replace("/admin");
    return;
  }
  if (res.code === "no_admin") {
    needsAdminSetup.value = true;
    return;
  }
  error.value = res.message ?? "اسم المستخدم أو كلمة المرور غير صحيحة.";
}
</script>

<template>
  <div class="login-wrap">
    <form class="login-card" @submit.prevent="onSubmit">
      <div
        class="brand"
        style="justify-content: center; margin-bottom: 0.75rem"
      >
        <span class="brand-mark" aria-hidden="true">π</span>
        <span class="brand-name"
          >لوحة تحكم Pi<small>Pi Game Center</small></span
        >
      </div>
      <p
        style="
          text-align: center;
          color: var(--pi-gray-600);
          margin: 0 0 1.25rem;
        "
      >
        تسجيل دخول المدير
      </p>

      <div class="field">
        <label for="u">اسم المستخدم</label>
        <input id="u" v-model="username" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="p">كلمة المرور</label>
        <input
          id="p"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>

      <div
        v-if="error"
        class="notice notice-err"
        role="alert"
        style="margin-bottom: 0.75rem"
      >
        <i class="bi bi-exclamation-circle" aria-hidden="true"></i> {{ error }}
      </div>

      <div
        v-if="needsAdminSetup"
        class="notice notice-err"
        role="alert"
        style="margin-bottom: 0.75rem; display: block"
      >
        <i class="bi bi-person-lock" aria-hidden="true"></i>
        لم يتم إنشاء حساب مدير بعد. أنشئ الأول من الطرفية داخل مجلد
        <code>server</code> بالأمر:
        <pre class="cmd-hint">npm run create-admin</pre>
      </div>

      <button type="submit" class="btn-pi" style="width: 100%" :disabled="busy">
        <i v-if="busy" class="bi bi-arrow-repeat" aria-hidden="true"></i>
        {{ busy ? "جارٍ الدخول…" : "دخول" }}
      </button>

      <RouterLink
        to="/"
        style="
          display: block;
          text-align: center;
          margin-top: 1rem;
          font-size: 0.85rem;
        "
      >
        ← العودة إلى القائمة
      </RouterLink>
    </form>
  </div>
</template>
