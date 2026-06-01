# Icon licenses (Pixora catalog)

Pixora exposes **201,259 icons** from **134 icon sets** on Iconify whose licenses are **MIT, Apache 2.0, ISC, or CC0** — suitable for commercial use without per-download attribution.

Icons are loaded from the [Iconify API](https://iconify.design/) at runtime. Each set keeps its **original license**; this file summarizes the policy, not legal advice.

## Your app code

Pixora application source is licensed under **MIT** (see repository `LICENSE` / `README` when added).

## Icon sets

- **Included:** sets marked MIT, Apache 2.0, ISC, or CC0 in Iconify metadata, excluding brand-logo collections (Simple Icons, Logos, Devicon, etc.).
- **Excluded:** CC BY (attribution required), CC BY-SA (share-alike), GPL, and trademark-heavy brand sets.

The exact allowlist is in:

- `frontend/src/data/permissive-prefixes.json`
- `backend/src/data/permissive-prefixes.json`

Regenerate after upgrading `@iconify/json`:

```bash
node scripts/generate-permissive-prefixes.js
```

## What you should do when shipping

1. Keep this file (or a generated **NOTICE**) in your repo and site footer.
2. Do not re-enable excluded sets without updating licenses and UI.
3. For MIT/Apache sets, retaining a credits page is standard practice.

## Fonts

UI typography uses **Quicksand** (SIL Open Font License) via Google Fonts.
