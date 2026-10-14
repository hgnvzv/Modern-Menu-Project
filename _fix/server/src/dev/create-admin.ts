import bcrypt from "bcryptjs";
import { getDb } from "../db/connection.js";
import {
  getAdminPasswordHash,
  getSetting,
  setAdminPasswordHash,
  setSetting,
} from "../db/repo.js";
import { countStaff, upsertStaff } from "../db/staff.js";
import { ask, askHidden, closePrompt } from "./prompt.js";

/* Create (or reset) the owner account: `npm run create-admin`.
   The password is hashed with bcrypt before being stored — plaintext is never
   written to the DB, and never printed to the terminal or logs.

   The account is written to BOTH places the server reads credentials from: the
   legacy `settings` row (kept for backwards compatibility) and `staff_users`
   with the manager role, which is what login actually checks once staff accounts
   exist. Writing only to `settings` would reset the password in a table nobody
   reads, and the next login would silently use the old hash.

   Usage:
     npm run create-admin                                  # interactive
     npm run create-admin -- --username pi --password '…'   # non-interactive
     npm run create-admin -- --force                        # overwrite existing

   An existing account is never overwritten without --force. */

const MIN_PASSWORD = 8;

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

async function main(): Promise<void> {
  const f = flags(process.argv.slice(2));
  let username = f.username ?? (await ask("Admin username: "));
  while (username.length < 3) {
    process.stdout.write("Username must be at least 3 characters.\n");
    username = await ask("Admin username: ");
  }

  let password = f.password ?? "";
  if (!password) {
    password = await askHidden("Admin password (min 8 chars, hidden): ");
    let attempt = 0;
    while (password.length < MIN_PASSWORD && attempt < 3) {
      attempt += 1;
      process.stdout.write(
        `Password must be at least ${MIN_PASSWORD} characters.\n`,
      );
      password = await askHidden("Admin password (min 8 chars, hidden): ");
    }
    if (password.length < MIN_PASSWORD) {
      console.error(
        "\n[admin] Too many failed attempts. Aborting — nothing was changed.",
      );
      process.exitCode = 1;
      return;
    }
    const confirm = await askHidden("Repeat password: ");
    if (confirm !== password) {
      console.error(
        "\n[admin] Passwords did not match. Aborting — nothing was changed.",
      );
      process.exitCode = 1;
      return;
    }
  } else if (password.length < MIN_PASSWORD) {
    console.error("[admin] --password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  getDb(); // applies pending migrations before touching settings

  const existing = getAdminPasswordHash() || countStaff() > 0;
  if (existing && !f.force) {
    console.error(
      `[admin] An admin account already exists (username: ${getSetting("admin_username") ?? "from env"}). ` +
        "Re-run with --force to reset the password, or use `npm run create-staff` for more accounts.",
    );
    process.exitCode = 1;
    return;
  }

  // Password is hashed here and only the hash is persisted.
  const hash = bcrypt.hashSync(password, 10);
  setAdminPasswordHash(hash);
  setSetting("admin_username", username);
  upsertStaff({
    username,
    passwordHash: hash,
    role: "manager",
    displayName: "المدير",
  });

  console.log(
    `[admin] Admin account ready — username "${username}". Password stored as a bcrypt hash. Not printed.`,
  );
  console.log(
    "[admin] Sign in at /admin (or the URL printed by the dev server).",
  );
}

main()
  .catch((err: unknown) => {
    console.error("[admin] Failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closePrompt());
