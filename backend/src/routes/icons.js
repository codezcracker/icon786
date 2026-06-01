const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const ICONIFY_API = 'https://api.iconify.design';
const SVGAPI_KEY = process.env.SVGAPI_KEY || '';
const {
  filterIconIds,
  assertPermissivePrefix,
  PERMISSIVE_STATS,
} = require('../utils/permissiveLicenses');

// ── SVG Repo (svgapi.com) — Public Domain & CC0 icons (no attribution) ──
// Requires a free domain key from https://svgapi.com (Development mode on
// for backend calls). Gracefully degrades when no key is configured.
router.get('/svgrepo', async (req, res) => {
  try {
    if (!SVGAPI_KEY) {
      return res.json({ configured: false, icons: [], next: null });
    }
    const { q = '', limit = 20, start = 0 } = req.query;
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 20); // svgapi caps at 20
    const params = new URLSearchParams({ search: q || 'icon', limit: String(lim), start: String(start) });
    const url = `https://api.svgapi.com/v1/${SVGAPI_KEY}/list/?${params}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`svgapi ${r.status}`);
    const data = await r.json();
    const icons = (data.icons || []).map((it) => ({
      id: it.id || it.slug,
      title: it.title || it.slug || it.id,
      url: it.url,            // direct SVG file URL (CC0/PD)
      source: 'svgrepo',
    }));
    res.json({ configured: true, icons, next: data.next || null, total: data.total || null });
  } catch (e) {
    console.error('svgrepo error:', e.message);
    res.status(500).json({ configured: true, error: e.message, icons: [] });
  }
});

router.get('/catalog-stats', (_req, res) => {
  res.json(PERMISSIVE_STATS);
});

// Search icons (permissive sets only)
router.get('/search', async (req, res) => {
  try {
    const { q = 'home', prefix, limit = 60, start = 0 } = req.query;
    if (prefix && !assertPermissivePrefix(prefix, res)) return;

    const params = new URLSearchParams({ query: q, limit, start });
    if (prefix) params.set('prefix', prefix);

    const response = await fetch(`${ICONIFY_API}/search?${params}`);
    if (!response.ok) throw new Error('Iconify search failed');
    const data = await response.json();
    data.icons = filterIconIds(data.icons);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get all collections (permissive sets only)
router.get('/collections', async (req, res) => {
  try {
    const response = await fetch(`${ICONIFY_API}/collections`);
    const data = await response.json();
    const { isPermissivePrefix } = require('../utils/permissiveLicenses');
    const filtered = {};
    for (const [prefix, info] of Object.entries(data)) {
      if (isPermissivePrefix(prefix)) filtered[prefix] = info;
    }
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single collection
router.get('/collection/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const response = await fetch(`${ICONIFY_API}/collection?prefix=${prefix}&pretty=1`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get icon SVG
router.get('/svg/:prefix/:name', async (req, res) => {
  try {
    const { prefix, name } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const { color = 'currentColor', width = 24, height = 24 } = req.query;

    const response = await fetch(
      `${ICONIFY_API}/${prefix}/${name}.svg?color=${encodeURIComponent(color)}&width=${width}&height=${height}`
    );
    if (!response.ok) throw new Error('Icon not found');

    const svg = await response.text();
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Get icon data (paths etc.)
router.get('/data/:prefix/:name', async (req, res) => {
  try {
    const { prefix, name } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const response = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
