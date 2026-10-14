import { computed, ref } from "vue";
import * as adminApi from "../services/admin";

/* Module-level singleton for the admin JWT. The token is kept in
   sessionStorage so it survives a page refresh within the tab but is not
   persisted long-term. All admin API calls pass this token as a Bearer header
   and the server re-verifies it — the client flag is only for UX/routing. */

const STORAGE_KEY = "pi.admin.token";
const USERNAME_KEY = "pi.admin.username";

const token = ref<string | null>(sessionStorage.getItem(STORAGE_KEY));
// The login name is not a secret (it is shown in the UI), so it can be kept
// next to the token; otherwise a page refresh would leave the admin shell
// authenticated but anonymous.
const username = ref<string | null>(sessionStorage.getItem(USERNAME_KEY));

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(token.value));

  async function login(
    user: string,
    pass: string,
  ): Promise<{ ok: boolean; message?: string; code?: string }> {
    const res = await adminApi.login(user, pass);
    if (res.ok) {
      token.value = res.data.token;
      username.value = res.data.username;
      sessionStorage.setItem(STORAGE_KEY, res.data.token);
      sessionStorage.setItem(USERNAME_KEY, res.data.username);
      return { ok: true };
    }
    // `code` lets the view pick an Arabic message for known operational states
    // (e.g. no admin bootstrapped yet) instead of showing raw English.
    return { ok: false, message: res.message, code: res.code };
  }

  function logout(): void {
    token.value = null;
    username.value = null;
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
  }

  function requireToken(): string {
    if (!token.value) throw new Error("Not authenticated");
    return token.value;
  }

  return { token, username, isAuthenticated, login, logout, requireToken };
}
