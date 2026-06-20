const express = require('express');
const router = express.Router();
const localIcons = require('../services/localIcons');
const { assertPermissivePrefix, PERMISSIVE_STATS } = require('../utils/permissiveLicenses');

router.get('/catalog-stats', (_req, res) => {
  res.json(PERMISSIVE_STATS);
});

// ── Local icon library (from @iconify/json — no external API) ──

router.get('/search', async (req, res) => {
  try {
    const { q = 'home', prefix, limit = 999 } = req.query;
    if (prefix && !assertPermissivePrefix(prefix, res)) return;
    const icons = await localIcons.search(q, prefix || null, limit);
    res.json({ icons });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/collections', (_req, res) => {
  try {
    res.json(localIcons.getCollections());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/collection', (req, res) => {
  try {
    const { prefix } = req.query;
    if (!prefix || !assertPermissivePrefix(prefix, res)) return;
    const data = localIcons.getCollection(prefix);
    if (!data) return res.status(404).json({ error: 'Collection not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/collection/:prefix', (req, res) => {
  try {
    const { prefix } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const data = localIcons.getCollection(prefix);
    if (!data) return res.status(404).json({ error: 'Collection not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Iconify-compatible paths for @iconify/react
router.get('/iconify/:prefix.json', (req, res) => {
  try {
    const { prefix } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const names = (req.query.icons || '').split(',').filter(Boolean);
    const data = localIcons.getIconsJSON(prefix, names);
    if (!data) return res.status(404).json({ error: 'Collection not found' });
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/iconify/:prefix/:name.svg', (req, res) => {
  try {
    const { prefix, name } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const svg = localIcons.getIconSVG(prefix, name, req.query);
    if (!svg) return res.status(404).json({ error: 'Icon not found' });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.get('/svg/:prefix/:name', (req, res) => {
  try {
    const { prefix, name } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const svg = localIcons.getIconSVG(prefix, name, req.query);
    if (!svg) return res.status(404).json({ error: 'Icon not found' });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.get('/data/:prefix/:name', (req, res) => {
  try {
    const { prefix, name } = req.params;
    if (!assertPermissivePrefix(prefix, res)) return;
    const data = localIcons.getIconsJSON(prefix, [name]);
    if (!data) return res.status(404).json({ error: 'Collection not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
