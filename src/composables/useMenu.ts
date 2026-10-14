import { computed, ref } from "vue";
import type { PublicCategory, PublicItem } from "../types";
import { fetchMenu } from "../services/api";
import { matchesQuery } from "../utils/text";

/* Module-level singletons so every component shares one menu store without a
   global state library. Loads the real menu from the backend. */

const categories = ref<PublicCategory[]>([]);
const items = ref<PublicItem[]>([]);
const status = ref<"idle" | "loading" | "ready" | "error">("idle");
const error = ref<string | null>(null);

// First category id acts as the "all" sentinel is avoided; we use null = all.
const activeCategoryId = ref<string | null>(null);
const query = ref("");

let loadPromise: Promise<void> | null = null;

export function useMenu() {
  async function load(force = false): Promise<void> {
    if (status.value === "ready" && !force) return;
    if (loadPromise && !force) return loadPromise;
    status.value = "loading";
    error.value = null;
    loadPromise = (async () => {
      const res = await fetchMenu();
      if (res.ok) {
        categories.value = res.data.categories;
        items.value = res.data.items;
        status.value = "ready";
      } else {
        error.value = res.message;
        status.value = "error";
      }
      loadPromise = null;
    })();
    return loadPromise;
  }

  function retry(): void {
    void load(true);
  }

  function selectCategory(id: string | null): void {
    activeCategoryId.value = id;
  }

  // Only show items from the selected category (all when none selected), and
  // matching the (normalized) search query on name + description.
  const visibleItems = computed<PublicItem[]>(() => {
    return items.value.filter((it) => {
      if (activeCategoryId.value && it.categoryId !== activeCategoryId.value)
        return false;
      const q = query.value.trim();
      if (!q) return true;
      return matchesQuery(it.name, q) || matchesQuery(it.description ?? "", q);
    });
  });

  const filtersActive = computed(() => query.value.trim().length > 0);

  const itemCount = computed(() => items.value.length);

  /** Name of the selected category, or null when showing the whole menu. */
  const activeCategoryName = computed<string | null>(
    () =>
      categories.value.find((c) => c.id === activeCategoryId.value)?.name ??
      null,
  );

  return {
    categories,
    items,
    status,
    error,
    activeCategoryId,
    query,
    visibleItems,
    filtersActive,
    itemCount,
    activeCategoryName,
    load,
    retry,
    selectCategory,
  };
}
