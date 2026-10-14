import "dotenv/config";
import { z } from "zod";

/* Centralized, validated environment configuration.
   All secrets come from env vars — nothing sensitive is hard-coded. */

const bool = (defaultValue: boolean) =>
  z
    .enum(["true", "false", "1", "0"])
    .default(defaultValue ? "true" : "false")
    .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_PATH: z.string().default("./data/app.db"),
  UPLOAD_DIR: z.string().default("./uploads"),

  // Largest image the panel may upload. Phone photos are commonly 6–12 MB, so
  // the old hard-coded 5 MB cap truncated real photos. This value feeds both
  // the multipart limit and the upload route's own size check — they must
  // agree, or a file gets cut off silently.
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),

  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("12h"),

  SESSION_TTL_MS: z.coerce.number().int().positive().default(300000),

  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().optional(),

  SERVE_CLIENT: bool(true),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  // Fail fast and loudly — a misconfigured server must not boot silently.
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  isProd: env.NODE_ENV === "production",
  port: env.PORT,
  host: env.HOST,
  databasePath: env.DATABASE_PATH,
  uploadDir: env.UPLOAD_DIR,
  maxUploadMb: env.MAX_UPLOAD_MB,
  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  sessionTtlMs: env.SESSION_TTL_MS,
  adminUsername: env.ADMIN_USERNAME,
  adminPassword: env.ADMIN_PASSWORD,
  serveClient: env.SERVE_CLIENT,
} as const;
