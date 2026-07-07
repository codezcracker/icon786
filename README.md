# Icon786 — Free Icon Library

> 201,000+ commercial-safe icons from 134 icon sets (MIT, Apache, ISC, CC0).

**Live:** [icon786.com](https://icon786.com) · [icon786.onrender.com](https://icon786.onrender.com)

## Features

- **201,259 Icons** — Permissive sets only (Material, Phosphor, Tabler, Lucide, Fluent, Remix, Bootstrap, etc.)
- **Online Search** — Full-text search across all icon sets
- **Online Editor** — Edit icon color, background, gradient, size, rotation
- **Multi-format Download** — SVG, PNG, JPG, WebP (any resolution)
- **Icon Font Generator** — TTF, WOFF, and CSS in one ZIP
- **Collections Browser** — Browse icons by set/category
- **AI Search & Generate** — Natural language icon search and SVG generation
- **Commercial-safe catalog** — MIT / Apache / ISC / CC0 only (see [LICENSES.md](./LICENSES.md))

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express
- **Icons**: Self-hosted `@icon786/icons` (~266MB, vendored in repo)
- **Fonts**: Quicksand + Bricolage Grotesque (self-hosted via `@fontsource`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Install & Run

```bash
git clone https://github.com/codezcracker/icon786.git
cd icon786
npm install
npm run install:all
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

### Optional — AI on local dev

Copy `backend/.env.example` to `backend/.env` and set one of:

```bash
HUGGINGFACE_API_KEY=hf_your-token
# or
OPENAI_API_KEY=sk_your-key
```

Restart the backend after changing env vars.

## Project Structure

```
icon786/
├── frontend/              # React + Vite app
│   └── src/
│       ├── pages/         # Landing, Browse, Editor, Collections, Font Generator
│       ├── components/    # Navbar, Footer, AI modals
│       └── utils/         # Search, export, AI client
├── backend/               # Node.js + Express API
│   └── src/
│       ├── routes/        # icons, export, font, ai
│       └── services/      # localIcons, aiService
├── packages/icon786-icons/  # Vendored icon library (201k+ icons)
└── scripts/               # Allowlist + vendor utilities
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/icons/search?q=home` | Search icons |
| GET | `/api/icons/svg/:prefix/:name` | Get icon SVG |
| GET | `/api/icons/collections` | List all collections |
| GET | `/api/icons/collection/:prefix` | Get single collection |
| POST | `/api/export/png` | Export as PNG |
| POST | `/api/export/jpg` | Export as JPG |
| POST | `/api/export/webp` | Export as WebP |
| POST | `/api/export/bulk` | Bulk ZIP download |
| POST | `/api/font/generate` | Generate icon font ZIP |
| POST | `/api/ai/search` | AI icon search |
| POST | `/api/ai/generate` | AI icon generation |
| GET | `/api/health` | Health check |

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Render (recommended) and Vercel instructions.

## License

- **Application code:** [MIT](./LICENSE)
- **Icons:** 134 permissive sets (~201k icons). See [LICENSES.md](./LICENSES.md).

Regenerate the allowlist:

```bash
node scripts/generate-permissive-prefixes.js
```
