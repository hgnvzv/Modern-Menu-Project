import { ref } from "vue";
import type {
  AdminCategory,
  AdminItem,
  AdminRequest,
  AdminTable,
} from "../types";
import * as admin from "../services/admin";
import type { AdminCategoryInput, AdminItemInput } from "../services/admin";
import { useAuth } from "./useAuth";

/* Module-level singleton for the admin panel. Loads all resources up front and
   refreshes the affected list after each mutation, keeping the UI in sync with
   the server (the server is authoritative). */

const categories = ref<AdminCategory[]>([]);
const items = ref<AdminItem[]>([]);
const tables = ref<AdminTable[]>([]);
const requests = ref<AdminRequest[]>([]);
const serviceEnabled = ref(false);

const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

function fail(message: string): boolean {
  error.value = message;
  return false;
}

export function useAdminStore() {
  const { requireToken } = useAuth();

  async function loadAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    const token = requireToken();
    const [c, i, t, r, s] = await Promise.all([
      admin.categories.list(token),
      admin.items.list(token),
      admin.tables.list(token),
      admin.serviceRequests.list(token),
      admin.settings.get(token),
    ]);
    // A 401 anywhere means the JWT expired -> surface it centrally.
    const results = [c, i, t, r, s];
    if (results.some((res) => !res.ok && res.status === 401)) {
      error.value = "انتهت صلاحية الجلسة، سجّل الدخول من جديد.";
      useAuth().logout();
      loading.value = false;
      return;
    }
    if (c.ok) categories.value = c.data;
    if (i.ok) items.value = i.data;
    if (t.ok) tables.value = t.data;
    if (r.ok) requests.value = r.data;
    if (s.ok) serviceEnabled.value = s.data.serviceEnabled;
    loading.value = false;
  }

  async function reloadItems(): Promise<void> {
    const res = await admin.items.list(requireToken());
    if (res.ok) items.value = res.data;
  }

  /* Categories */
  async function createCategory(input: AdminCategoryInput): Promise<boolean> {
    saving.value = true;
    const res = await admin.categories.create(requireToken(), input);
    saving.value = false;
    if (!res.ok) return fail(res.message);
    categories.value = [...categories.value, res.data].sort(
      (a, b) => a.sort - b.sort,
    );
    error.value = null;
    return true;
  }

  async function updateCategory(
    id: string,
    input: AdminCategoryInput,
  ): Promise<boolean> {
    saving.value = true;
    const res = await admin.categories.update(requireToken(), id, input);
    saving.value = false;
    if (!res.ok) return fail(res.message);
    categories.value = categories.value
      .map((c) => (c.id === id ? res.data : c))
      .sort((a, b) => a.sort - b.sort);
    error.value = null;
    return true;
  }

  async function removeCategory(id: string): Promise<boolean> {
    saving.value = true;
    const res = await admin.categories.remove(requireToken(), id);
    saving.value = false;
    if (!res.ok) return fail(res.message);
    // Server cascades deletion to that category's items.
    categories.value = categories.value.filter((c) => c.id !== id);
    await reloadItems();
    error.value = null;
    return true;
  }

  /* Items */
  async function createItem(input: AdminItemInput): Promise<boolean> {
    saving.value = true;
    const res = await admin.items.create(requireToken(), input);
    saving.value = false;
    if (!res.ok) return fail(res.message);
    items.value = [...items.value, res.data];
    error.value = null;
    return true;
  }

  async function updateItem(
    id: string,
    input: AdminItemInput,
  ): Promise<boolean> {
    saving.value = true;
    const res = await admin.items.update(requireToken(), id, input);
    saving.value = false;
    if (!res.ok) return fail(res.message);
    items.value = items.value.map((it) => (it.id === id ? res.data : it));
    error.value = null;
    return true;
  }

  async function removeItem(id: string): Promise<boolean> {
    saving.value = true;
    const res = await admin.items.remove(requireToken(), id);
    saving.value = false;
    if (!res.ok) return fail(res.message);
    items.value = items.value.filter((it) => it.id !== id);
    error.value = null;
    return true;
  }

  /* Settings */
  async function setServiceEnabled(value: boolean): Promise<boolean> {
    const prev = serviceEnabled.value;
    serviceEnabled.value = value; // optimistic
    const res = await admin.settings.set(requireToken(), value);
    if (!res.ok) {
      serviceEnabled.value = prev;
      return fail(res.message);
    }
    error.value = null;
    return true;
  }

  /* Tables */
  async function addTable(label: string): Promise<boolean> {
    const res = await admin.tables.create(requireToken(), label);
    if (!res.ok) return fail(res.message);
    tables.value = [...tables.value, res.data].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    error.value = null;
    return true;
  }

  async function removeTable(id: string): Promise<boolean> {
    const res = await admin.tables.remove(requireToken(), id);
    if (!res.ok) return fail(res.message);
    tables.value = tables.value.filter((t) => t.id !== id);
    error.value = null;
    return true;
  }

  /* Requests */
  async function handleRequest(id: string): Promise<boolean> {
    const res = await admin.serviceRequests.handle(requireToken(), id);
    if (!res.ok) return fail(res.message);
    requests.value = requests.value.map((r) =>
      r.id === id ? { ...r, status: "handled" as const } : r,
    );
    error.value = null;
    return true;
  }

  async function reloadRequests(): Promise<void> {
    const res = await admin.serviceRequests.list(requireToken());
    if (res.ok) requests.value = res.data;
  }

  return {
    categories,
    items,
    tables,
    requests,
    serviceEnabled,
    loading,
    saving,
    error,
    loadAll,
    createCategory,
    updateCategory,
    removeCategory,
    createItem,
    updateItem,
    removeItem,
    setServiceEnabled,
    addTable,
    removeTable,
    handleRequest,
    reloadRequests,
  };
}
