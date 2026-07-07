const FAV_KEY = 'icon786_favorites';
const LEGACY_KEY = 'px_favorites';

export function getFavorites() {
  try {
    const current = localStorage.getItem(FAV_KEY);
    if (current) return JSON.parse(current);

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.setItem(FAV_KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
      return JSON.parse(legacy);
    }
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function setFavorites(favorites) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

export function toggleFavorite(iconId, favorites) {
  const exists = favorites.includes(iconId);
  const updated = exists
    ? favorites.filter((id) => id !== iconId)
    : [...favorites, iconId];
  setFavorites(updated);
  return { updated, isFavorite: !exists };
}
