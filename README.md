# client — Pi Game Center frontend

Vue 3 + TypeScript + Vite single-page app for the customer menu and the `/admin`
panel. It talks to the Fastify backend over same-origin `/api` and `/uploads`
(proxied in dev, served by the API in production).

- Full project docs, configuration and security model: see the repo-root
  **[README.md](../README.md)**.
- Deployment (Render / Railway / Fly.io): see **[DEPLOYMENT.md](../DEPLOYMENT.md)**.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api + /uploads to :3000)
npm run build      # type-check + production build -> dist/
npm test           # vitest unit tests
```

Start the backend first (`cd ../server && npm run dev`) so the API is available.

بيانات دخول لوحة الإدارة
المستخدم: admin
كلمة المرور
: PiAdmin@2026
# Modern-Menu-Project
