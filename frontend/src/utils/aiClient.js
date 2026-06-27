import { apiUrl } from './api';

export async function aiSearch(query, headers) {
  const res = await fetch(apiUrl('/api/ai/search'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI search failed');
  return data;
}

export async function aiGenerate(prompt, headers) {
  const res = await fetch(apiUrl('/api/ai/generate'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI generation failed');
  return data;
}

export async function fetchAiConfig() {
  const res = await fetch(apiUrl('/api/ai/config'));
  if (!res.ok) return null;
  return res.json();
}
