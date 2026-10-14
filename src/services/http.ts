import type { ApiErrorBody, ApiResult } from "../types";

/* Thin typed fetch wrapper. Same-origin by default (client is served by the
   API server, and Vite proxies /api in dev), so `credentials: "include"` is
   what carries the HTTP-only session cookie. Includes a timeout via
   AbortController. Never sends secrets; the QR token is posted, not logged. */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");
const TIMEOUT_MS = 12000;

export interface HttpOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Send an admin JWT bearer token. */
  token?: string;
  /** Use FormData (file upload) instead of JSON. */
  formData?: FormData;
  signal?: AbortSignal;
}

export function apiUrl(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function request<T>(
  path: string,
  opts: HttpOptions = {},
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // Combine caller signal (if any) with our timeout.
  const external = opts.signal;
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", () => controller.abort());
  }

  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData; // let the browser set the multipart boundary
  } else if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  try {
    const res = await fetch(apiUrl(path), {
      method: opts.method ?? "GET",
      headers,
      body,
      credentials: "include",
      signal: controller.signal,
    });

    if (res.status === 204) return { ok: true, data: undefined as T };

    const text = await res.text();
    const json = (text ? JSON.parse(text) : {}) as ApiErrorBody;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: json.error?.code ?? "error",
        message: json.error?.message ?? res.statusText,
        issues: json.error?.issues,
      };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      status: 0,
      code: aborted ? "aborted" : "network",
      message: aborted ? "Request timed out" : "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}
