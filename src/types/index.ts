/* Domain types shared across the client. These mirror the backend API
   responses (server/src/types.ts + route handlers), which are the source of
   truth for the wire format. */

/* ------------------------------ Public ------------------------------ */

export interface PublicCategory {
  id: string;
  name: string;
  icon: string | null;
}

export interface PublicItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  badge: string | null;
  available: boolean;
}

export interface MenuPayload {
  categories: PublicCategory[];
  items: PublicItem[];
}

/* ---------------------------- Session ----------------------------- */

export type ServiceType = "waiter" | "bill";

/** Result of establishing/reading a table session from the server. */
export interface SessionSnapshot {
  active: boolean;
  tableLabel: string | null;
  /** Server-issued absolute expiry (epoch ms); present only when active. */
  expiresAt: number | null;
}

export interface SessionPublicState {
  serviceEnabled: boolean;
}

/* ------------------------------ Admin ----------------------------- */

export interface AdminCategory {
  id: string;
  name: string;
  icon: string | null;
  sort: number;
  created_at: number;
  updated_at: number;
}

export interface AdminItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  badge: string | null;
  available: number;
  sort: number;
  created_at: number;
  updated_at: number;
}

export interface AdminTable {
  id: string;
  label: string;
  qr_token: string;
  active: number;
  created_at: number;
}

export type RequestStatus = "pending" | "handled";

export interface AdminRequest {
  id: string;
  table_id: string;
  type: ServiceType;
  status: RequestStatus;
  created_at: number;
  tableLabel: string;
}

/* ------------------------- API error shape ------------------------ */

export interface ApiIssue {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    issues?: ApiIssue[];
  };
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      issues?: ApiIssue[];
    };
