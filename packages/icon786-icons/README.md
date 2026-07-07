# @icon786/icons

Self-hosted icon data for [Icon786](https://icon786.com) — **201,259** icons across **134** permissive sets.

## Use in Node / Express

```js
const icons = require('@icon786/icons');
const mdi = icons.loadSet('mdi');
const collections = icons.getCollections();
```

## Use in your app (future npm publish)

```bash
npm install @icon786/icons
```

Icon JSON files live in `json/` using the standard IconifyJSON shape (portable SVG path data).

## Regenerate from source

Icon data is vendored into this package. To refresh after updating the allowlist:

```bash
node scripts/vendor-icons.js
```
