# Icon licenses (Icon786 catalog)

Icon786 exposes **201,259 icons** from **134 icon sets** on Iconify whose licenses are **MIT, Apache 2.0, ISC, or CC0** — suitable for commercial use without per-download attribution.

Icons are loaded from **`@icon786/icons`** (vendored under `packages/icon786-icons/`). No Iconify npm packages or public APIs at runtime.

## Your app code

Icon786 application source is licensed under **MIT** (see repository `LICENSE` / `README` when added).

## Icon sets

- **Included:** sets marked MIT, Apache 2.0, ISC, or CC0 in Iconify metadata, excluding brand-logo collections (Simple Icons, Logos, Devicon, etc.).
- **Excluded:** CC BY (attribution required), CC BY-SA (share-alike), GPL, and trademark-heavy brand sets.

The exact allowlist is in:

- `frontend/src/data/permissive-prefixes.json`
- `backend/src/data/permissive-prefixes.json`

Regenerate allowlist after updating collections:

```bash
node scripts/generate-permissive-prefixes.js
```

Refresh vendored icon JSON (one-time source: `backend/node_modules/@iconify/json` if migrating):

```bash
node scripts/vendor-icons.js
```

## What you should do when shipping

1. Keep this file (or a generated **NOTICE**) in your repo and site footer.
2. Do not re-enable excluded sets without updating licenses and UI.
3. For MIT/Apache sets, retaining a credits page is standard practice.

## Fonts

UI typography uses **Quicksand** and **Bricolage Grotesque** via self-hosted `@fontsource` packages (bundled at build time).
