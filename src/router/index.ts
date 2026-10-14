import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import MenuView from "../views/MenuView.vue";
import AdminView from "../views/AdminView.vue";
import AdminLogin from "../views/AdminLogin.vue";
import { useAuth } from "../composables/useAuth";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "menu", component: MenuView, meta: { title: "القائمة" } },
  {
    path: "/admin/login",
    name: "admin-login",
    component: AdminLogin,
    meta: { publicAdmin: true, title: "دخول الإدارة" },
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: { requiresAdmin: true, title: "لوحة التحكم" },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});

/* Client-side guard is UX only; the backend independently re-verifies the JWT
   on every admin endpoint, so this is never the actual security boundary. */
router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();
  if (to.meta.requiresAdmin && !isAuthenticated.value) {
    return { name: "admin-login", query: { next: to.fullPath } };
  }
  if (to.name === "admin-login" && isAuthenticated.value) {
    return { name: "admin" };
  }
  return true;
});

/* Keep the browser tab label in sync with the visible section. */
router.afterEach((to) => {
  const section = typeof to.meta.title === "string" ? to.meta.title : null;
  document.title = section
    ? `${section} · Pi Game Center`
    : "Pi Game Center · القائمة";
});
