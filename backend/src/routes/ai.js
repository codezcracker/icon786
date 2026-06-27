const express = require('express');
const router = express.Router();
const { aiSearch, aiGenerate, getPublicConfig } = require('../services/aiService');

function readAiHeaders(req) {
  return {
    provider: req.headers['x-ai-provider'] || 'server',
    apiKey: req.headers['x-ai-api-key'] || '',
    baseUrl: req.headers['x-ai-base-url'] || '',
    model: req.headers['x-ai-model'] || '',
  };
}

router.get('/config', (_req, res) => {
  res.json(getPublicConfig());
});

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await aiSearch(String(query).trim(), readAiHeaders(req));
    res.json(result);
  } catch (e) {
    console.error('AI search error:', e);
    res.status(500).json({ error: e.message || 'AI search failed' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const result = await aiGenerate(String(prompt || '').trim(), readAiHeaders(req));
    res.json(result);
  } catch (e) {
    console.error('AI generate error:', e);
    res.status(400).json({ error: e.message || 'AI generation failed' });
  }
});

module.exports = router;
