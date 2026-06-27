const { expandQuery, getSuggestions } = require('../utils/searchUtils');
const localIcons = require('./localIcons');

const PROVIDERS = {
  server: {
    label: 'Icon786 Free',
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  groq: {
    label: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'openai/gpt-4o-mini',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    defaultModel: 'gpt-4o-mini',
    baseUrl: '',
  },
};

function getServerKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
}

function resolveCredentials(provider, userKey, userBaseUrl, model) {
  const cfg = PROVIDERS[provider] || PROVIDERS.server;

  if (provider === 'server') {
    const key = userKey || getServerKey();
    if (!key) return null;
    return {
      baseUrl: (userBaseUrl || cfg.baseUrl).replace(/\/$/, ''),
      apiKey: key,
      model: model || cfg.defaultModel,
    };
  }

  if (!userKey) return null;
  const baseUrl = provider === 'custom'
    ? userBaseUrl
    : (userBaseUrl || cfg.baseUrl);
  if (!baseUrl) return null;
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey: userKey,
    model: model || cfg.defaultModel,
  };
}

async function chatCompletion({ messages, provider, apiKey, baseUrl, model }) {
  const creds = resolveCredentials(provider, apiKey, baseUrl, model);
  if (!creds) return null;

  const res = await fetch(`${creds.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creds.apiKey}`,
    },
    body: JSON.stringify({
      model: model || creds.model,
      messages,
      temperature: 0.2,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.slice(0, 200) || `AI request failed (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function parseJsonFromText(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function localSearchAssist(query) {
  const q = (query || '').trim().toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const keywords = new Set();
  for (const w of words) {
    expandQuery(w).forEach((t) => keywords.add(t));
    keywords.add(w);
  }
  getSuggestions(q).forEach((s) => keywords.add(s));
  if (!keywords.size && q) keywords.add(q);
  return {
    keywords: [...keywords].slice(0, 8),
    explanation: 'Basic AI matched keywords from your description (add an API key in settings for smarter results).',
    source: 'local',
  };
}

async function aiSearch(query, opts = {}) {
  const q = (query || '').trim();
  if (!q) return { keywords: [], explanation: '', icons: [], source: 'local' };

  const system = `You help users find icons. Given a natural language request, return JSON only:
{"keywords":["word1","word2"],"explanation":"one short sentence"}
Use 3-8 simple English icon name keywords (nouns). No markdown.`;

  let parsed = null;
  let source = 'local';

  try {
    const content = await chatCompletion({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: q },
      ],
      ...opts,
    });
    if (content) {
      parsed = parseJsonFromText(content);
      if (parsed?.keywords?.length) source = 'ai';
    }
  } catch (e) {
    console.warn('AI search fallback:', e.message);
  }

  const fallback = localSearchAssist(q);
  const keywords = (parsed?.keywords?.length ? parsed.keywords : fallback.keywords)
    .map((k) => String(k).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  const icons = [];
  const seen = new Set();
  for (const kw of keywords) {
    const result = await localIcons.search(kw, null, 20);
    for (const id of result.icons || []) {
      if (!seen.has(id)) {
        seen.add(id);
        icons.push(id);
      }
      if (icons.length >= 40) break;
    }
    if (icons.length >= 40) break;
  }

  return {
    keywords,
    explanation: parsed?.explanation || fallback.explanation,
    icons,
    source,
  };
}

function sanitizeSvg(svg) {
  if (!svg || typeof svg !== 'string') return null;
  const trimmed = svg.trim();
  if (!trimmed.startsWith('<svg') || trimmed.includes('<script')) return null;
  if (!/viewBox=/i.test(trimmed)) {
    return trimmed.replace('<svg', '<svg viewBox="0 0 24 24"');
  }
  return trimmed;
}

async function aiGenerate(prompt, opts = {}) {
  const p = (prompt || '').trim();
  if (!p) throw new Error('Describe the icon you want to generate');

  const system = `You generate minimal monochrome SVG icons. Return JSON only:
{"name":"short-name","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">...</svg>"}
Rules: 24x24 viewBox, single color via currentColor, simple paths only, no scripts, no external refs.`;

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: p },
    ],
    ...opts,
  });

  if (!content) {
    throw new Error('AI is not configured. Open AI settings and add your API key, or ask the site admin to enable Icon786 Free AI.');
  }

  const parsed = parseJsonFromText(content);
  const svg = sanitizeSvg(parsed?.svg);
  if (!svg) throw new Error('AI could not generate a valid icon. Try a simpler description.');

  return {
    name: (parsed?.name || 'ai-icon').replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
    svg,
    source: 'ai',
  };
}

function getPublicConfig() {
  return {
    providers: Object.entries(PROVIDERS).map(([id, p]) => ({
      id,
      label: p.label,
      defaultModel: p.defaultModel,
      needsKey: id !== 'server' || !getServerKey(),
    })),
    serverAiEnabled: Boolean(getServerKey()),
    models: {
      server: ['gpt-4o-mini', 'gpt-4o'],
      openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      openrouter: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct:free'],
      custom: ['gpt-4o-mini'],
    },
  };
}

module.exports = {
  aiSearch,
  aiGenerate,
  getPublicConfig,
  localSearchAssist,
};
