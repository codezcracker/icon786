# @icon786/icons

201,000+ commercial-safe icons (MIT, Apache, ISC, CC0) bundled for Node and browser apps.

## Install

```bash
npm install @icon786/icons
```

## Usage

```js
const icons = require('@icon786/icons');

// List collections
console.log(icons.collections.length);

// Get icon JSON (Iconify format)
const data = icons.getIconData('mdi', 'home');
```

### React

```js
import { Icon } from '@icon786/icons/react';
```

## Publish (maintainers)

From the repo root:

```bash
npm run publish:icons
```

You need an npm account with access to the `@icon786` scope:

```bash
npm login
npm whoami
```

Bump version in `package.json` before each publish.

## License

MIT — see [LICENSE](../../LICENSE) and [LICENSES.md](../../LICENSES.md) for third-party icon set licenses.
