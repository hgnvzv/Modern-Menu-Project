import bcrypt from "bcryptjs";
import { getDb } from "../db/connection.js";
import { countStaff, upsertStaff, type StaffRole } from "../db/staff.js";
import { ask, askHidden, closePrompt } from "./prompt.js";

/* Create (or reset) a staff account: `npm run create-staff`.
   Two roles exist:
     manager — the whole panel;
     waiter  — sees incoming requests only, and the API refuses them anything
               else (requireManager), so the restriction is not just a UI detail.

   Usage:
     npm run create-staff                                      # interactive
     npm run create-staff -- --role waiter --username waiter1 --password '…'
     npm run create-staff -- --role manager --username pi --password '…' --name 'مدير الصالة'

   The password is hashed with bcrypt before being stored — plaintext is never
   written to the DB, printed to the terminal or logged. An existing username
   is only overwritten with --force. */

const MIN_PASSWORD = 8;
const ROLES: StaffRole[] = ["manager", "waiter"];

const LABEL: Record<StaffRole, string> = {
  manager: "Manager (full panel)",
  waiter: "Waiter (incoming requests only)",
};

function flags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (key === "force") out.force = "true";
      else {
        out[key] = argv[i + 1] ?? "";
        i += 1;
      }
    }
  }
  return out;
}

async function pickRole(given: string | undefined): Promise<StaffRole | null> {
  if (given) {
    const role = given.trim().toLowerCase() as StaffRole;
    if (!ROLES.includes(role)) {
      console.error(`[staff] --role must be one of: ${ROLES.join(", ")}.`);
      return null;
    }
    return role;
  }
  console.log("Choose a role:");
  ROLES.forEach((role, i) =>
    console.log(`  ${i + 1}. ${role} — ${LABEL[role]}`),
  );
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const answer = (await ask("Role number [1]: ")).trim() || "1";
    const picked = ROLES[Number(answer) - 1];
    if (picked) return picked;
    process.stdout.write(`Please answer 1 or 2.\n`);
  }
  return null;
}

async function main(): Promise<void> {
  const f = flags(process.argv.slice(2));

  getDb(); // applies pending migrations before touching staff_users

  const role = await pickRole(f.role);
  if (!role) {
    console.error("[staff] Aborting — nothing was changed.");
    process.exitCode = 1;
    return;
  }

  // A deployment must have at least one manager; otherwise nobody could ever
  // edit the menu again.
  if (countStaff() === 0 && role !== "manager") {
    console.error(
      "[staff] No manager account exists yet. Run `npm run create-admin` first, then add waiters.",
    );
    process.exitCode = 1;
    return;
  }

  let username = f.username ?? (await ask("Username: "));
  while (username.trim().length < 3) {
    process.stdout.write("Username must be at least 3 characters.\n");
    username = await ask("Username: ");
  }
  username = username.trim();

  let password = f.password ?? "";
  if (!password) {
    password = await askHidden(
      `Password for "${username}" (min ${MIN_PASSWORD} chars, hidden): `,
    );
    let attempt = 0;
    while (password.length < MIN_PASSWORD && attempt < 3) {
      attempt += 1;
      process.stdout.write(
        `Password must be at least ${MIN_PASSWORD} characters.\n`,
      );
      password = await askHidden(
        `Password for "${username}" (min ${MIN_PASSWORD} chars, hidden): `,
      );
    }
    if (password.length < MIN_PASSWORD) {
      console.error(
        "\n[staff] Too many failed attempts. Aborting — nothing was changed.",
      );
      process.exitCode = 1;
      return;
    }
    const confirm = await askHidden("Repeat password: ");
    if (confirm !== password) {
      console.error(
        "\n[staff] Passwords did not match. Aborting — nothing was changed.",
      );
      process.exitCode = 1;
      return;
    }
  } else if (password.length < MIN_PASSWORD) {
    console.error("[staff] --password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const existing = countStaff() > 0 && usernameTaken(username);
  if (existing && !f.force) {
    console.error(
      `[staff] Username "${username}" already exists. Re-run with --force to reset its password/role.`,
    );
    process.exitCode = 1;
    return;
  }

  // Only the bcrypt hash is persisted.
  const staff = upsertStaff({
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    displayName: (f.name ?? "").trim() || null,
  });

  console.log(
    `[staff] ${staff.role} account ready — username "${staff.username}". ` +
      "Password stored as a bcrypt hash, not printed.",
  );
  console.log(
    "[staff] Sign in at /admin. Waiters see the incoming-requests page only.",
  );
}

/** True when `username` already has an account (case-sensitive: that is how the
    UNIQUE index and the login query treat it). */
function usernameTaken(username: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM staff_users WHERE username = ?")
    .get(username) as { n: number };
  return row.n > 0;
}

main()
  .catch((err: unknown) => {
    console.error("[staff] Failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closePrompt());
