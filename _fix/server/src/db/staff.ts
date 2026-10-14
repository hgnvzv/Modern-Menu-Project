import crypto from "node:crypto";
import { getDb } from "./connection.js";

/* Staff accounts (managers and waiters).
   Kept in its own module so the panel's data access (repo.ts) stays focused on
   menu/table data. Only bcrypt hashes ever leave this module — plaintext
   passwords are never stored, returned or logged. */

export type StaffRole = "manager" | "waiter";

export interface StaffRow {
  id: string;
  username: string;
  password_hash: string;
  role: StaffRole;
  display_name: string | null;
  created_at: number;
}

/** Everything the rest of the app may see about an account (no hash). */
export interface StaffPublic {
  id: string;
  username: string;
  role: StaffRole;
  displayName: string | null;
}

function toPublic(row: StaffRow): StaffPublic {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
  };
}

export function findStaffByUsername(username: string): StaffRow | undefined {
  return getDb()
    .prepare("SELECT * FROM staff_users WHERE username = ?")
    .get(username) as StaffRow | undefined;
}

export function countStaff(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM staff_users")
    .get() as { n: number };
  return row?.n ?? 0;
}

export function listStaff(): StaffPublic[] {
  return (
    getDb()
      .prepare("SELECT * FROM staff_users ORDER BY role ASC, username ASC")
      .all() as StaffRow[]
  ).map(toPublic);
}

export interface StaffInput {
  username: string;
  passwordHash: string;
  role: StaffRole;
  displayName: string | null;
}

/** Inserts a new account, or replaces the password/role of an existing
    username. Returns the stored account either way. */
export function upsertStaff(input: StaffInput): StaffPublic {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM staff_users WHERE username = ?")
    .get(input.username) as StaffRow | undefined;

  if (existing) {
    db.prepare(
      "UPDATE staff_users SET password_hash = ?, role = ?, display_name = ? WHERE id = ?",
    ).run(input.passwordHash, input.role, input.displayName, existing.id);
    return toPublic({ ...existing, ...input, display_name: input.displayName });
  }

  const row: StaffRow = {
    id: crypto.randomUUID(),
    username: input.username,
    password_hash: input.passwordHash,
    role: input.role,
    display_name: input.displayName,
    created_at: Date.now(),
  };
  db.prepare(
    "INSERT INTO staff_users (id, username, password_hash, role, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    row.id,
    row.username,
    row.password_hash,
    row.role,
    row.display_name,
    row.created_at,
  );
  return toPublic(row);
}
