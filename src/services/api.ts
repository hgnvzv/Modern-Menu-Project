import type {
  MenuPayload,
  ServiceType,
  SessionPublicState,
  SessionSnapshot,
} from "../types";
import { request } from "./http";

/* Customer-facing API. All calls hit the real backend; there is no mock mode.
   A guest exchanges the opaque QR token (read from ?qr=) for an HTTP-only
   session cookie; the server resolves it to a verified table. */

export function fetchMenu() {
  return request<MenuPayload>("/menu");
}

export function fetchServiceState() {
  return request<SessionPublicState>("/settings");
}

export function establishSession(token: string) {
  return request<SessionSnapshot>("/session", {
    method: "POST",
    body: { token },
  });
}

export function readSession() {
  return request<SessionSnapshot>("/session");
}

export function submitRequest(type: ServiceType) {
  return request<{
    id: string;
    type: ServiceType;
    status: string;
    createdAt: number;
  }>("/requests", { method: "POST", body: { type } });
}

/** Reads the QR token from the current URL (query param `qr`). Opaque; never
    interpreted client-side. */
export function readQrTokenFromUrl(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("qr");
  } catch {
    return null;
  }
}
