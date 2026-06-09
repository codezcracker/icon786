import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Search, Download, Palette, Type, ArrowRight, Sparkles, Globe, Zap } from 'lucide-react';

// Only use well-known valid Iconify icon IDs
const FEATURED_ICONS = [
  'mdi:home', 'mdi:heart', 'mdi:star', 'mdi:rocket',
  'mdi:camera', 'mdi:music', 'mdi:coffee', 'mdi:flash',
  'mdi:phone', 'mdi:email', 'mdi:map-marker', 'mdi:account',
  'ph:house-bold', 'ph:heart-bold', 'ph:star-bold', 'ph:rocket-bold',
  'ph:camera-bold', 'ph:music-notes-bold', 'ph:lightning-bold', 'ph:user-bold',
  'tabler:home', 'tabler:heart', 'tabler:star', 'tabler:rocket',
  'lucide:home', 'lucide:heart', 'lucide:star', 'lucide:zap',
  'ri:home-2-line', 'ri:heart-line', 'ri:star-line', 'ri:rocket-line',
];

const STATS = [
  { value: '200k+', label: 'Icons', icon: 'ph:squares-four-bold' },
  { value: '100+', label: 'Collections', icon: 'ph:stack-bold' },
  { value: '10+', label: 'Export Formats', icon: 'ph:export-bold' },
  { value: '100%', label: 'Free', icon: 'ph:heart-bold' },
];

const FEATURES = [
  {
    icon: <Search size={22} />,
    title: 'Instant Search',
    desc: 'Find any icon in milliseconds with smart full-text search.',
    bg: '#EFF6FF', color: '#2563EB',
  },
  {
    icon: <Palette size={22} />,
    title: 'Online Editor',
    desc: 'Customize colors, size, stroke width, and background directly in your browser.',
    bg: '#F5F3FF', color: '#7C3AED',
  },
  {
    icon: <Download size={22} />,
    title: 'Any Format',
    desc: 'Download as SVG, PNG, JPG, WebP, ICO at any resolution. Completely free.',
    bg: '#F0FDF4', color: '#16A34A',
  },
  {
    icon: <Type size={22} />,
    title: 'Font Generator',
    desc: 'Pick icons and generate a custom icon font file with CSS — TTF, WOFF, WOFF2.',
    bg: '#FFF7ED', color: '#EA580C',
  },
  {
    icon: <Globe size={22} />,
    title: 'Huge Library',
    desc: 'Browse a massive icon library with unified search across every collection.',
    bg: 'var(--primary-light)', color: 'var(--primary)',
  },
];

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [displayIcons, setDisplayIcons] = useState(FEATURED_ICONS.slice(0, 24));
  const navigate = useNavigate();

  useEffect(() => {
    const shuffled = [...FEATURED_ICONS].sort(() => Math.random() - 0.5);
    setDisplayIcons(shuffled.slice(0, 24));
    const interval = setInterval(() => {
      setDisplayIcons([...FEATURED_ICONS].sort(() => Math.random() - 0.5).slice(0, 24));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse');
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__bg-dots" />
        <div className="hero__bg-glow" />

        <div className="hero__inner">
          {/* Left */}
          <div className="anim-slide">
            <div className="hero__label">
              <Sparkles size={13} />
              Free Icon Library
            </div>

              <h1 className="hero__title">
                Icons.<br />
                <span className="gradient-text">All Free.</span><br />
                Always.
              </h1>

              <p className="hero__subtitle">
                Search, edit, and download icons in any format. SVG, PNG, fonts — any size, no sign-up required.
              </p>

            <form onSubmit={handleSearch} className="hero__search-row">
              <div className="input-wrap flex-1">
                <span className="input-icon">
                  <Search size={17} />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search icons…"
                  className="input input-with-icon"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="hero__tags">
              <span className="hero__tag-label">Popular:</span>
              {['arrow', 'user', 'home', 'settings', 'star', 'heart', 'social'].map((t) => (
                <span key={t} className="hero__tag" onClick={() => navigate(`/browse?q=${t}`)}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — animated icon grid */}
          <div className="hero__icon-grid" style={{ position: 'relative' }}>
            {displayIcons.map((id, i) => (
              <div
                key={`${id}-${i}`}
                className="hero__icon-item"
                onClick={() => navigate('/browse')}
              >
                <Icon icon={id} style={{ fontSize: 24, color: i % 6 === 0 ? 'var(--primary)' : 'var(--dark)' }} />
              </div>
            ))}
            <div className="hero__grid-fade-x" />
            <div className="hero__grid-fade-y" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-bar">
        <div className="stats-bar__inner">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <Icon icon={s.icon} style={{ fontSize: 28, color: '#f07e96' }} />
              <div className="stat-item__value">{s.value}</div>
              <div className="stat-item__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section features-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="hero__label" style={{ marginBottom: 16 }}>
              <Zap size={13} />
              Everything you need
            </div>
            <h2 className="section-title" style={{ marginBottom: 12 }}>
              Why Designers Love <span className="gradient-text">Icon786</span>
            </h2>
            <p className="text-muted" style={{ fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              From search to download, every feature designed to make your workflow faster.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 12 }}>
              Browse <span className="gradient-text">Collections</span>
            </h2>
            <p className="text-muted" style={{ fontSize: 16 }}>
              Explore icons organized by style and category — all in one place.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/collections')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              View All Collections <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title">
              Simple as <span className="gradient-text">1-2-3</span>
            </h2>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', icon: 'ph:magnifying-glass-bold', title: 'Search & Find', desc: 'Search icons across all collections with powerful filters.' },
              { n: '02', icon: 'ph:paint-brush-bold', title: 'Edit & Customize', desc: 'Change colors, size, stroke width, and background in real-time.' },
              { n: '03', icon: 'ph:download-simple-bold', title: 'Download Free', desc: 'Export in SVG, PNG, JPG, WebP, or as an icon font. Always free.' },
            ].map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-number">{s.n}</div>
                <div className="step-icon">
                  <Icon icon={s.icon} style={{ fontSize: 30, color: 'var(--primary)' }} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <h2>
          Start using <span className="highlight">free icons</span> today
        </h2>
        <p>No sign-up required. Just search, edit, and download.</p>
        <div className="cta-buttons">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/browse')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Browse Icons <ArrowRight size={18} />
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/font-generator')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Create Icon Font <Type size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
