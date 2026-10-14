/// <reference types="vitest/config" />
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

// The client talks to the backend via same-origin `/api` and `/uploads`.
// In dev, Vite proxies those to the Fastify server (default :3000) so the
// HTTP-only session cookie works without any CORS gymnastics. In production
// the Fastify server serves the built client itself, so it is already same-
// origin and the proxy is irrelevant.
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/uploads": { target: API_TARGET, changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
