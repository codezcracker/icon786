/** Search helpers — scoring, synonyms, fuzzy match, suggestions */

const SYNONYMS = {
  user: ['person', 'account', 'profile', 'people', 'member', 'avatar'],
  home: ['house', 'homepage', 'main', 'dashboard'],
  settings: ['cog', 'gear', 'preferences', 'config', 'options'],
  search: ['find', 'magnify', 'lookup', 'zoom'],
  delete: ['trash', 'remove', 'bin', 'garbage', 'clear'],
  edit: ['pencil', 'pen', 'modify', 'write'],
  save: ['disk', 'floppy', 'store'],
  email: ['mail', 'envelope', 'message', 'inbox'],
  phone: ['call', 'telephone', 'mobile', 'cell'],
  image: ['photo', 'picture', 'gallery', 'camera'],
  video: ['movie', 'film', 'play', 'media'],
  music: ['audio', 'sound', 'note', 'song'],
  lock: ['secure', 'password', 'privacy', 'key'],
  unlock: ['open', 'unsecure'],
  arrow: ['chevron', 'direction', 'pointer', 'caret'],
  close: ['x', 'cancel', 'dismiss', 'cross'],
  check: ['tick', 'done', 'confirm', 'success', 'ok'],
  add: ['plus', 'new', 'create'],
  menu: ['hamburger', 'bars', 'navigation', 'nav'],
  star: ['favorite', 'favourite', 'rating', 'bookmark'],
  heart: ['love', 'like', 'favorite', 'favourite'],
  calendar: ['date', 'schedule', 'event', 'day'],
  clock: ['time', 'watch', 'timer', 'alarm'],
  notification: ['bell', 'alert', 'alarm'],
  share: ['export', 'send', 'social'],
  download: ['import', 'save', 'get'],
  upload: ['export', 'send', 'cloud'],
  folder: ['directory', 'file', 'archive'],
  document: ['file', 'page', 'doc', 'paper'],
  cart: ['basket', 'shop', 'buy', 'checkout'],
  payment: ['card', 'money', 'pay', 'wallet'],
  social: ['share', 'network', 'media'],
  wifi: ['wireless', 'internet', 'network', 'signal'],
  error: ['warning', 'alert', 'danger', 'issue'],
  info: ['information', 'help', 'about'],
  login: ['signin', 'sign-in', 'enter', 'auth'],
  logout: ['signout', 'sign-out', 'exit', 'auth'],
};

const POPULAR_TERMS = [
  'home', 'user', 'search', 'settings', 'heart', 'star', 'arrow', 'menu',
  'close', 'check', 'mail', 'phone', 'camera', 'edit', 'delete', 'download',
  'upload', 'file', 'folder', 'lock', 'plus', 'minus', 'eye', 'calendar',
  'clock', 'bell', 'share', 'link', 'image', 'video', 'music', 'cart',
];

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

function fuzzyScore(name, term) {
  if (!term || term.length < 2) return 0;
  const n = name.toLowerCase();
  const t = term.toLowerCase();
  if (n.includes(t)) return 0;
  const parts = n.split(/[-_./]+/);
  let best = Infinity;
  for (const part of parts) {
    if (part.length < 2) continue;
    const d = levenshtein(part, t);
    const maxLen = Math.max(part.length, t.length);
    if (d <= 2 && maxLen <= 12) best = Math.min(best, d);
  }
  const fullDist = levenshtein(n.slice(0, Math.min(n.length, t.length + 3)), t);
  best = Math.min(best, fullDist);
  if (best > 2) return 0;
  return 1 - best / Math.max(n.length, t.length);
}

function expandQuery(query) {
  const raw = (query || '').trim().toLowerCase();
  if (!raw) return [];
  const terms = new Set();
  for (const word of raw.split(/\s+/).filter(Boolean)) {
    terms.add(word);
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (word === key || syns.includes(word)) {
        terms.add(key);
        syns.forEach((s) => terms.add(s));
      }
    }
  }
  return [...terms];
}

function scoreIconName(name, terms) {
  if (!terms.length) return 1;
  const n = name.toLowerCase();
  const parts = n.split(/[-_./]+/);
  let best = 0;

  for (const term of terms) {
    if (!term) continue;
    if (n === term) best = Math.max(best, 100);
    else if (n.startsWith(term)) best = Math.max(best, 85);
    else if (parts.some((p) => p === term)) best = Math.max(best, 75);
    else if (parts.some((p) => p.startsWith(term))) best = Math.max(best, 65);
    else if (n.includes(term)) best = Math.max(best, 55);
    else {
      for (const part of parts) {
        if (part.includes(term)) best = Math.max(best, 45);
        const fz = fuzzyScore(part, term);
        if (fz > 0) best = Math.max(best, Math.round(35 * fz));
      }
      const fzFull = fuzzyScore(n, term);
      if (fzFull > 0) best = Math.max(best, Math.round(30 * fzFull));
    }
  }
  return best;
}

function getSuggestions(query, limit = 6) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const scored = POPULAR_TERMS.map((term) => ({
    term,
    score: scoreIconName(term, [q]) || fuzzyScore(term, q) * 40,
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const out = [];
  for (const { term } of scored) {
    if (!out.includes(term)) out.push(term);
    if (out.length >= limit) break;
  }

  if (out.length < limit) {
    for (const [key] of Object.entries(SYNONYMS)) {
      if (fuzzyScore(key, q) > 0.3 || key.startsWith(q.slice(0, 2))) {
        if (!out.includes(key)) out.push(key);
      }
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit);
}

module.exports = {
  expandQuery,
  scoreIconName,
  getSuggestions,
  fuzzyScore,
  POPULAR_TERMS,
};
