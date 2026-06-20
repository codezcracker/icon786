# Deploy Icon786 on Render (recommended)

One **Web Service** runs React + Express + API on the same server.

## What you get

| Feature | Works? |
|---------|--------|
| Browse, search, editor, collections | Yes |
| SVG / PNG / JPG / WebP download | Yes |
| Font generator ZIP | Yes |
| Future WebSockets | Yes (same Node process) |

## Deploy from GitHub

1. Push this repo to GitHub (do **not** commit `.env`, `backend/.env`, or `_font-backup/`).

2. Go to [render.com](https://render.com) → **New** → **Blueprint** (or **Web Service**).

3. Connect your repo. Render reads `render.yaml` automatically, or set manually:
   - **Root directory:** `.` (repo root)
   - **Build command:** `npm run render:build`
   - **Start command:** `NODE_ENV=production npm start`

4. Click **Deploy**. Your app will be live at `https://icon786.onrender.com` (or similar).

5. Optional env vars (Render dashboard → **Environment**):
   - `FRONTEND_URL` — your Render URL (only needed if you split frontend later)

No `VITE_API_URL` needed — frontend and API share the same origin.

**Icons are fully self-hosted:** the backend reads from `@iconify/json` (~400MB in `node_modules`). Browse, search, download, export, and font generation use your server only — no Iconify API, SVG Repo, or other external icon services at runtime.

## Local production test

```bash
npm run install:all
npm run build
NODE_ENV=production npm start
```

Open http://localhost:3001 — same as Render.

## Local dev (unchanged)

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173 (proxies `/api` → backend)  
Backend: http://localhost:3001

---

## Alternative: Vercel (frontend only)

Static hosting on Vercel still works via `vercel.json`, but **font generator** needs a separate backend.

1. Deploy frontend: `npx vercel --prod`
2. Deploy `backend/` to Render as a second service
3. Set `VITE_API_URL=https://your-api.onrender.com` in Vercel env and redeploy

See `vercel.json` for Vercel settings.

## Troubleshooting

- **404 on refresh** — ensure `NODE_ENV=production` so Express serves `frontend/dist` with SPA fallback.
- **Font generator fails** — check Render logs; free tier may sleep (~30–60s first request). Upgrade to Starter for always-on.
- **Build fails on Sharp** — Render Node runtime supports native modules; ensure Node 18+.
