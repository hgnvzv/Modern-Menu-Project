import type {
  AdminCategory,
  AdminItem,
  AdminRequest,
  AdminTable,
  ApiResult,
} from "../types";
import { request } from "./http";

/* Admin API. Every function takes the JWT `token` (except login) and sends it
   as a Bearer header. The backend re-verifies it on each request. */

export interface AdminItemInput {
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  badge: string | null;
  available: boolean;
  sort: number;
}

export interface AdminCategoryInput {
  name: string;
  icon: string | null;
  sort: number;
}

export async function login(
  username: string,
  password: string,
): Promise<ApiResult<{ token: string; username: string }>> {
  return request("/admin/login", {
    method: "POST",
    body: { username, password },
  });
}

export const categories = {
  list: (token: string) =>
    request<AdminCategory[]>("/admin/categories", { token }),
  create: (token: string, input: AdminCategoryInput) =>
    request<AdminCategory>("/admin/categories", {
      method: "POST",
      body: input,
      token,
    }),
  update: (token: string, id: string, input: AdminCategoryInput) =>
    request<AdminCategory>(`/admin/categories/${id}`, {
      method: "PUT",
      body: input,
      token,
    }),
  remove: (token: string, id: string) =>
    request<void>(`/admin/categories/${id}`, { method: "DELETE", token }),
};

export const items = {
  list: (token: string) => request<AdminItem[]>("/admin/items", { token }),
  create: (token: string, input: AdminItemInput) =>
    request<AdminItem>("/admin/items", { method: "POST", body: input, token }),
  update: (token: string, id: string, input: AdminItemInput) =>
    request<AdminItem>(`/admin/items/${id}`, {
      method: "PUT",
      body: input,
      token,
    }),
  remove: (token: string, id: string) =>
    request<void>(`/admin/items/${id}`, { method: "DELETE", token }),
};

export const settings = {
  get: (token: string) =>
    request<{ serviceEnabled: boolean }>("/admin/settings", { token }),
  set: (token: string, serviceEnabled: boolean) =>
    request<{ serviceEnabled: boolean }>("/admin/settings", {
      method: "PUT",
      body: { serviceEnabled },
      token,
    }),
};

export const tables = {
  list: (token: string) => request<AdminTable[]>("/admin/tables", { token }),
  create: (token: string, label: string) =>
    request<AdminTable>("/admin/tables", {
      method: "POST",
      body: { label },
      token,
    }),
  remove: (token: string, id: string) =>
    request<void>(`/admin/tables/${id}`, { method: "DELETE", token }),
};

export const serviceRequests = {
  list: (token: string) =>
    request<AdminRequest[]>("/admin/requests", { token }),
  handle: (token: string, id: string) =>
    request<{ ok: boolean }>(`/admin/requests/${id}/handle`, {
      method: "POST",
      token,
    }),
};

export function uploadImage(
  token: string,
  file: File,
): Promise<ApiResult<{ url: string }>> {
  const fd = new FormData();
  fd.append("file", file);
  return request<{ url: string }>("/admin/upload", {
    method: "POST",
    formData: fd,
    token,
  });
}
