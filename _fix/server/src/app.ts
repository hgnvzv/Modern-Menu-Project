import fs from "node:fs";
import path from "node:path";
import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { publicRoutes } from "./routes/public.js";
import { adminRoutes } from "./routes/admin.js";

interface ValidationErrorShape extends FastifyError {
  statusCode?: number;
  issues?: unknown;
}

/** Resolves the built client directory for single-service deployments. */
function resolveClientDist(): string | null {
  const candidate = path.resolve(process.cwd(), "../client/dist");
  return fs.existsSync(path.join(candidate, "index.html")) ? candidate : null;
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.isProd ? true : { transport: undefined, level: "info" },
  });

  await app.register(cors, {
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(jwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  });
  // One image per request, capped by MAX_UPLOAD_MB. The upload route watches the
  // stream's `limit` event so an oversized file is rejected with a clear error
  // instead of being saved half-written.
  await app.register(multipart, {
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  });

  // Serve uploaded images (never from a user-controlled path).
  const uploadRoot = path.resolve(config.uploadDir);
  fs.mkdirSync(uploadRoot, { recursive: true });
  await app.register(fastifyStatic, {
    root: uploadRoot,
    prefix: "/uploads/",
    index: false,
  });

  app.get("/api/health", async () => ({ ok: true }));

  await app.register(publicRoutes, { prefix: "/api" });
  await app.register(adminRoutes, { prefix: "/api/admin" });

  // Uniform JSON error shape; zod validation errors carry `issues`.
  app.setErrorHandler((error: ValidationErrorShape, _req, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) app.log.error(error);
    reply.code(status).send({
      error: {
        code: status === 400 ? "validation_failed" : "server_error",
        message: status >= 500 ? "Internal error" : error.message,
        ...(error.issues ? { issues: error.issues } : {}),
      },
    });
  });

  // Optional: serve the built SPA so API + client run as one service.
  // `decorateReply: false` because @fastify/static was already registered for
  // /uploads above; registering the `sendFile`/`send` reply decorators twice
  // would throw FST_ERR_DEC_ALREADY_PRESENT and crash the boot.
  const clientDist = config.serveClient ? resolveClientDist() : null;
  if (clientDist) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: "/",
      index: ["index.html"],
      decorateReply: false,
    });
    const indexFile = path.join(clientDist, "index.html");
    app.setNotFoundHandler((req, reply) => {
      const url = req.raw.url ?? "";
      if (url.startsWith("/api") || url.startsWith("/uploads")) {
        return reply.code(404).send({ error: { code: "not_found" } });
      }
      // SPA fallback: let the client router handle the path.
      return reply.type("text/html").send(fs.readFileSync(indexFile));
    });
    app.log.info(`Serving client from ${clientDist}`);
  }

  return app;
}
