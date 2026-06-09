import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Search, SlidersHorizontal, X, Grid3X3, Grid2X2, Heart } from 'lucide-react';
import { searchIcons, getAllCollections } from '../utils/iconSearch';

const PAGE_SIZE = 60;

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSet, setSelectedSet] = useState(searchParams.get('set') || 'all');
  const [gridSize, setGridSize] = useState('md');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('px_favorites') || '[]'));
  const [setOptions, setSetOptions] = useState([]);

  // Load the full live list of every collection for the filter dropdown
  useEffect(() => {
    getAllCollections().then((cols) => {
      if (cols.length) {
        setSetOptions(cols.map((c) => ({
          value: c.prefix,
          label: `${c.name} (${c.total.toLocaleString()})`,
        })));
      }
    });
  }, []);

  const doSearch = useCallback(async (q, set, pg) => {
    setLoading(true);
    try {
      const icons = await searchIcons(q || '', set === 'all' ? null : set, pg * PAGE_SIZE, PAGE_SIZE);
      if (pg === 0) setResults(icons);
      else setResults((prev) => [...prev, ...icons]);
      setHasMore(icons.length === PAGE_SIZE);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { setPage(0); doSearch(query, selectedSet, 0); }, [query, selectedSet, doSearch]);
  useEffect(() => { if (page > 0) doSearch(query, selectedSet, page); }, [page, query, selectedSet, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  const toggleFav = (id, e) => {
    e.stopPropagation();
    const updated = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('px_favorites', JSON.stringify(updated));
  };

  const iconSize = gridSize === 'sm' ? 20 : gridSize === 'md' ? 26 : 34;

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse <span className="gradient-text">Icons</span></h1>
        <p>Search, edit, and download icons in any format.</p>
      </div>

      {/* Search row */}
      <div className="search-row">
        <form onSubmit={handleSearch} className="input-wrap flex-1">
          <span className="input-icon"><Search size={17} /></span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons… (e.g. home, arrow, settings)"
            className="input input-with-icon input-with-clear"
          />
          {query && (
            <button type="button" className="input-clear" onClick={() => setQuery('')}>
              <X size={15} />
            </button>
          )}
        </form>
        <button type="submit" form="" onClick={handleSearch} className="btn btn-primary">Search</button>
        <button
          className={`btn btn-secondary${showFilters ? ' btn-icon active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-panel__grid">
            <div>
                <label className="form-label">Icon Set</label>
                <div className="select-wrap">
                  <select
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                    className="input"
                  >
                    <option value="all">All sets</option>
                    {setOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="select-chevron">▾</span>
                </div>
              </div>

            <div>
              <label className="form-label">Icon Size</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['sm', 'md', 'lg'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setGridSize(s)}
                    className={`btn flex-1${gridSize === s ? ' btn-primary' : ' btn-secondary'}`}
                    style={{ padding: '10px 8px', fontSize: 12 }}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Grid Layout</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setGridSize('sm')}
                  className="btn btn-secondary flex-1"
                  style={{ padding: '10px 8px', justifyContent: 'center' }}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setGridSize('md')}
                  className="btn btn-secondary flex-1"
                  style={{ padding: '10px 8px', justifyContent: 'center' }}
                >
                  <Grid2X2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results bar */}
      <div className="results-bar">
        <span>
          {loading && page === 0
            ? 'Searching…'
            : `${results.length} icons${query ? ` for "${query}"` : ''}`}
        </span>
        {selectedSet !== 'all' && (
          <button className="results-bar__clear" onClick={() => setSelectedSet('all')}>
            <X size={13} /> Clear filter
          </button>
        )}
      </div>

      {loading && page === 0 ? (
        <div className={`icon-grid icon-grid--${gridSize}`}>
          {Array(PAGE_SIZE).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90 }} />
          ))}
        </div>
      ) : (
        <>
          <div className={`icon-grid icon-grid--${gridSize}`}>
            {results.map((item) => {
              const iconId = item;
              const [prefix, ...rest] = iconId.split(':');
              const name = rest.join(':');
              const isFav = favorites.includes(iconId);
              return (
                <div
                  key={iconId}
                  className="icon-item"
                  onClick={() => navigate(`/icon/${prefix}/${encodeURIComponent(name)}`)}
                >
                  <button
                    className={`icon-item__fav${isFav ? ' is-fav' : ''}`}
                    onClick={(e) => toggleFav(iconId, e)}
                  >
                    <Heart
                      size={12}
                      color={isFav ? 'var(--primary)' : 'var(--gray-300)'}
                      fill={isFav ? 'var(--primary)' : 'none'}
                    />
                  </button>
                  <Icon icon={iconId} style={{ fontSize: iconSize, color: 'var(--dark)' }} />
                  <span className="icon-item__name">
                    {name.length > 14 ? name.slice(0, 14) + '…' : name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="load-more">
            {hasMore ? (
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                {loading && page > 0
                  ? <><span className="spinner spinner-primary" /> Loading more…</>
                  : 'Load more icons'}
              </button>
            ) : (
              results.length > 0 && <span>All {results.length} results shown</span>
            )}
          </div>
        </>
      )}

      {results.length === 0 && !loading && (
        <div className="empty-state">
          <Icon icon="ph:magnifying-glass-bold" style={{ fontSize: 56, color: 'var(--gray-300)' }} />
          <h3>No icons found</h3>
          <p>Try a different search term or browse all collections</p>
        </div>
      )}
    </div>
  );
}
