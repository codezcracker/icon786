# Icon786 — Free Icon Library

> 201,000+ commercial-safe icons from 134 icon sets (MIT, Apache, ISC, CC0).

## Features

- **201,259 Icons** — Permissive Iconify sets only (Material, Phosphor, Tabler, Lucide, Fluent, Remix, Bootstrap, etc.)
- **Online Search** — Instant full-text search across all icon sets
- **Online Editor** — Edit icon color, background, shape, size, rotation
- **Multi-format Download** — SVG, PNG, JPG, WebP (any resolution)
- **Icon Font Generator** — Select icons and generate TTF/WOFF/WOFF2 font + CSS
- **Collections Browser** — Browse icons by set/category
- **Commercial-safe catalog** — MIT / Apache / ISC / CC0 only (see [LICENSES.md](./LICENSES.md))

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express
- **Icons**: Iconify API (~201k permissive icons, filtered in app)
- **Font**: Bricolage Grotesque
- **Colors**: Primary `#E8395A`, Surface `#F5F4F2`

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+

### Install & Run

```bash
# Install all dependencies
cd Pixora
npm install
cd frontend && npm install
cd ../backend && npm install

# Start both servers
cd ..
npm run dev
```

Or start individually:

```bash
# Frontend (http://localhost:5173)
cd frontend && npm run dev

# Backend (http://localhost:3001)
cd backend && npm run dev
```

## Project Structure

```
Pixora/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx       # Hero + features
│       │   ├── BrowsePage.jsx        # Icon search + grid
│       │   ├── IconDetailPage.jsx    # Icon editor + download
│       │   ├── CollectionsPage.jsx   # Browse by icon set
│       │   ├── FontGeneratorPage.jsx # Generate icon fonts
│       │   └── EditorPage.jsx        # Visual icon editor
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── Footer.jsx
│       └── utils/
│           └── iconSearch.js         # Iconify API utils
│
├── backend/           # Node.js + Express API
│   └── src/
│       ├── routes/
│       │   ├── icons.js    # Icon search + SVG proxy
│       │   ├── export.js   # PNG/JPG/WebP export via Sharp
│       │   └── font.js     # Font file generation + ZIP
│       └── index.js
│
└── package.json       # Root scripts
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
| GET | `/api/health` | Health check |

## License

MIT — Application code.

Icons: only **134 permissive sets** (~201k icons) are exposed. See [LICENSES.md](./LICENSES.md).

Regenerate the allowlist: `node scripts/generate-permissive-prefixes.js`
