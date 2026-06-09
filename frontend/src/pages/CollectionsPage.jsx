import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Search, ArrowRight } from 'lucide-react';
import { getAllCollections } from '../utils/iconSearch';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCollections().then((cols) => {
      setCollections(cols);
      setLoading(false);
    });
  }, []);

  const totalIcons = useMemo(
    () => collections.reduce((s, c) => s + c.total, 0),
    [collections]
  );

  // Build category list dynamically from live data
  const categories = useMemo(() => {
    const set = new Map();
    collections.forEach((c) => set.set(c.category, (set.get(c.category) || 0) + 1));
    return [{ id: 'all', label: 'All' }, ...[...set.keys()].sort().map((c) => ({ id: c, label: c }))];
  }, [collections]);

  const filtered = useMemo(() => {
    return collections.filter((c) => {
      const q = query.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.prefix.toLowerCase().includes(q);
      const matchC = cat === 'all' || c.category === cat;
      return matchQ && matchC;
    });
  }, [collections, query, cat]);

  return (
    <div className="collections-page">
      <div className="collections-header">
        <h1>Icon <span className="gradient-text">Collections</span></h1>
        <p>
          {loading
            ? 'Loading collections…'
            : `${collections.length} collections · ${totalIcons.toLocaleString()} icons`}
        </p>
      </div>

      {/* Stats */}
      <div className="collections-stats">
        {[
          { label: 'Collections', value: loading ? '…' : collections.length },
          { label: 'Total Icons', value: loading ? '…' : totalIcons.toLocaleString() },
          { label: 'Free Forever', value: '∞' },
        ].map((s) => (
          <div key={s.label} className="collections-stat">
            <div className="collections-stat__value gradient-text">{s.value}</div>
            <div className="collections-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="input-wrap" style={{ maxWidth: 480, marginBottom: 16 }}>
        <span className="input-icon"><Search size={17} /></span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections…"
          className="input input-with-icon"
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {categories.map((c) => (
          <button key={c.id} className={`pill${cat === c.id ? ' active' : ''}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="collections-grid">
          {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : (
        <div className="collections-grid">
          {filtered.map((col) => {
            const samples = (col.samples.length ? col.samples : ['home']).slice(0, 5);
            const mainIcon = `${col.prefix}:${samples[0]}`;
            return (
              <div
                key={col.prefix}
                className="collection-card"
                onClick={() => navigate(`/browse?set=${col.prefix}`)}
              >
                <div className="collection-card__top">
                  <div className="collection-card__icon" style={{ background: col.color + '22' }}>
                    <Icon icon={mainIcon} style={{ fontSize: 28, color: col.palette ? undefined : col.color }} />
                  </div>
                  <div className="collection-card__meta">
                    <span className="collection-card__count">{col.total.toLocaleString()}</span>
                    <div className="collection-card__license">{col.license}</div>
                  </div>
                </div>

                <h3>{col.name}</h3>
                <div className="collection-card__prefix">{col.prefix}{col.palette ? ' · multicolor' : ''}</div>

                <div className="collection-previews">
                  {samples.slice(1).map((s, i) => (
                    <div key={i} className="collection-preview-icon">
                      <Icon icon={`${col.prefix}:${s}`} style={{ fontSize: 16, color: col.palette ? undefined : col.color }} />
                    </div>
                  ))}
                </div>

                <div className="collection-card__footer">
                  <span>Browse Icons</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <Icon icon="ph:magnifying-glass-bold" style={{ fontSize: 56, color: 'var(--gray-300)' }} />
          <h3>No collections found</h3>
        </div>
      )}
    </div>
  );
}
