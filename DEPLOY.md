# Deploy Pixora on Vercel

## What works on Vercel (frontend only)

| Feature | Works? |
|---------|--------|
| Browse & search 201k+ icons | Yes (Iconify API) |
| Icon detail, PNG/JPG/WebP/SVG download | Yes (browser export) |
| Editor | Yes |
| Collections | Yes |
| Font generator ZIP | Needs backend (see below) |

## Quick deploy (GitHub)

1. Push this repo to GitHub (do **not** commit `.env` or `_font-backup/`).

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.

3. Vercel should detect settings from `vercel.json`:
   - **Build command:** `cd frontend && npm run build`
   - **Output directory:** `frontend/dist`

4. Click **Deploy**. Your site will be live at `https://your-project.vercel.app`.

## Deploy from terminal

```bash
cd /path/to/Pixora
npx vercel
```

Follow prompts (login, link project). Production:

```bash
npx vercel --prod
```

## Optional: Font generator backend

The font ZIP API uses Node (Sharp, Potrace) and does **not** run on Vercel’s static hosting.

1. Deploy `backend/` to [Render](https://render.com) or [Railway](https://railway.app) (free tier).
2. In Vercel → **Settings → Environment Variables**, add:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
3. Redeploy the frontend.

## Local dev (unchanged)

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  

For local backend in the frontend, create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:3001
```

## Troubleshooting

- **404 on refresh** — `vercel.json` rewrites should fix this; ensure it’s committed.
- **Blank page** — Check Vercel build logs; run `cd frontend && npm run build` locally.
- **Downloads fail** — Use a hard refresh; exports run in the browser, no backend required.
