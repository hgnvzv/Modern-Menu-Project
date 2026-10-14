import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { config } from "../config.js";
import { requireAdmin, requireManager, staffRole } from "../auth.js";
import {
  createCategory,
  createItem,
  createTable,
  deleteCategory,
  deleteItem,
  deleteTable,
  getAdminPasswordHash,
  getSetting,
  getCategory,
  getItem,
  listCategories,
  listItems,
  listRequests,
  listTables,
  markRequestHandled,
  isServiceEnabled,
  setServiceEnabled,
  updateCategory,
  updateItem,
} from "../db/repo.js";
import { countStaff, findStaffByUsername } from "../db/staff.js";
import {
  categorySchema,
  itemSchema,
  loginSchema,
  parse,
  settingsSchema,
  tableSchema,
} from "../validation.js";

const ADMIN_USERNAME_KEY = "admin_username";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Maps an admin item payload to the validated DB input shape. */
function toRepoItem(i: {
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  badge: string | null;
  available: boolean;
  sort: number;
}) {
  return {
    category_id: i.categoryId,
    name: i.name,
    description: i.description,
    price: i.price,
    image: i.image,
    badge: i.badge,
    available: i.available,
    sort: i.sort,
  };
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  /* ---- Login (public): verifies the staff bcrypt hash, issues a JWT ---- */
  app.post("/login", async (req, reply) => {
    const { username, password } = parse(loginSchema, req.body);

    // Staff accounts live in staff_users. A deployment that never ran the
    // migration (or created its first account with the old script) still has
    // the legacy single admin in `settings`, so fall back to it once and
    // upgrade that account to a manager.
    let staff = findStaffByUsername(username);
    if (!staff && countStaff() === 0) {
      const legacyHash = getAdminPasswordHash();
      const legacyUser = getSetting(ADMIN_USERNAME_KEY) ?? config.adminUsername;
      if (legacyHash && username === legacyUser) {
        staff = {
          id: "legacy-admin",
          username: legacyUser,
          password_hash: legacyHash,
          role: "manager",
          display_name: "المدير",
          created_at: Date.now(),
        };
      }
    }

    if (!staff) {
      return reply.code(503).send({
        error: {
          code: "no_admin",
          message:
            "No staff account is configured yet. Run: npm run create-admin (or npm run create-staff)",
        },
      });
    }

    const passOk = await bcrypt.compare(password, staff.password_hash);
    if (!passOk) {
      return reply
        .code(401)
        .send({
          error: {
            code: "bad_credentials",
            message: "Invalid username or password.",
          },
        });
    }

    const token = app.jwt.sign({
      sub: staff.username,
      username: staff.username,
      role: staff.role,
    });
    return { token, username: staff.username, role: staff.role };
  });

  /* ---- Any signed-in staff member ----
     The waiter's whole job lives here: see incoming requests, mark them done. */
  await app.register(async function staffScope(scope) {
    scope.addHook("preHandler", requireAdmin);

    scope.get("/me", async (req) => ({
      username:
        (req as { user?: { username?: string } }).user?.username ?? null,
      role: staffRole(req),
    }));

    // Incoming service requests
    scope.get("/requests", async () => listRequests());
    scope.post("/requests/:id/handle", async (req, reply) => {
      const { id } = req.params as { id: string };
      return markRequestHandled(id)
        ? { ok: true }
        : reply.code(404).send({ error: { code: "not_found" } });
    });
  });

  /* ---- Managers only: the menu, tables, settings and uploads ---- */
  await app.register(async function managerScope(scope) {
    scope.addHook("preHandler", requireManager);

    // Categories
    scope.get("/categories", async () => listCategories());
    scope.post("/categories", async (req, reply) => {
      const input = parse(categorySchema, req.body);
      const created = createCategory({
        name: input.name,
        icon: input.icon,
        sort: input.sort,
      });
      return reply.code(201).send(created);
    });
    scope.put("/categories/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const input = parse(categorySchema, req.body);
      const updated = updateCategory(id, {
        name: input.name,
        icon: input.icon,
        sort: input.sort,
      });
      if (!updated)
        return reply.code(404).send({ error: { code: "not_found" } });
      return updated;
    });
    scope.delete("/categories/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      return deleteCategory(id)
        ? reply.code(204).send()
        : reply.code(404).send({ error: { code: "not_found" } });
    });

    // Items
    scope.get("/items", async () => listItems());
    scope.get("/items/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const item = getItem(id);
      return item ?? reply.code(404).send({ error: { code: "not_found" } });
    });
    scope.post("/items", async (req, reply) => {
      const input = parse(itemSchema, req.body);
      if (!getCategory(input.categoryId)) {
        return reply
          .code(400)
          .send({
            error: { code: "invalid_category", message: "Unknown category" },
          });
      }
      const created = createItem(toRepoItem(input));
      return reply.code(201).send(created);
    });
    scope.put("/items/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const input = parse(itemSchema, req.body);
      if (!getCategory(input.categoryId)) {
        return reply
          .code(400)
          .send({
            error: { code: "invalid_category", message: "Unknown category" },
          });
      }
      const updated = updateItem(id, toRepoItem(input));
      if (!updated)
        return reply.code(404).send({ error: { code: "not_found" } });
      return updated;
    });
    scope.delete("/items/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      return deleteItem(id)
        ? reply.code(204).send()
        : reply.code(404).send({ error: { code: "not_found" } });
    });

    // Settings — the service on/off switch (also enforced on the public API).
    scope.get("/settings", async () => ({
      serviceEnabled: isServiceEnabled(),
    }));
    scope.put("/settings", async (req) => {
      const { serviceEnabled } = parse(settingsSchema, req.body);
      setServiceEnabled(serviceEnabled);
      return { serviceEnabled };
    });

    // Tables & QR tokens
    scope.get("/tables", async () => listTables());
    scope.post("/tables", async (req, reply) => {
      const { label } = parse(tableSchema, req.body);
      return reply.code(201).send(createTable(label));
    });
    scope.delete("/tables/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      return deleteTable(id)
        ? reply.code(204).send()
        : reply.code(404).send({ error: { code: "not_found" } });
    });

    // Image upload (multipart). Validates type and size, stores under UPLOAD_DIR,
    // returns a public URL. Filename is server-generated (never the user's).
    scope.post("/upload", async (req, reply) => {
      if (!req.isMultipart()) {
        return reply.code(400).send({ error: { code: "multipart_required" } });
      }
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: { code: "no_file" } });
      const ext = EXT_BY_MIME[data.mimetype];
      if (!ext) {
        return reply
          .code(415)
          .send({
            error: {
              code: "unsupported_type",
              message: "Only JPEG/PNG/WebP/GIF images.",
            },
          });
      }

      const filename = `${crypto.randomUUID()}${ext}`;
      const absDir = path.resolve(config.uploadDir);
      fs.mkdirSync(absDir, { recursive: true });
      const absFile = path.join(absDir, filename);

      // @fastify/multipart stops the stream at the configured size limit. If we
      // ignored that, a half-written (unusable) file would be stored and its
      // URL returned as a success — which is exactly how "the image doesn't
      // work" shows up in the panel. Detect it, delete the partial file, 413.
      let truncated = false;
      data.file.on("limit", () => {
        truncated = true;
      });

      await new Promise<void>((resolve, reject) => {
        const sink = fs.createWriteStream(absFile);
        data.file.pipe(sink);
        data.file.on("error", reject);
        sink.on("error", reject);
        sink.on("close", () => resolve());
      });

      if (truncated || data.file.truncated) {
        fs.rm(absFile, { force: true }, () => {});
        return reply.code(413).send({
          error: {
            code: "file_too_large",
            message: `الصورة أكبر من ${Math.round(config.maxUploadMb)} ميغابايت. اختر صورة أصغر.`,
          },
        });
      }

      return { url: `/uploads/${filename}` };
    });
  });
}
