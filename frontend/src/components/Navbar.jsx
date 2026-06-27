import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, Sparkles } from 'lucide-react';
import { useAi } from '../context/AiContext';

const NAV_LINKS = [
  { label: 'Browse', path: '/browse' },
  { label: 'Collections', path: '/collections' },
  { label: 'Font Generator', path: '/font-generator' },
  { label: 'Editor', path: '/editor' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { openAi } = useAi();

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <div className="navbar__logo">
            <Zap size={17} color="white" fill="white" />
          </div>
          <span className="navbar__name">Icon<span>786</span></span>
        </Link>

        <nav className="navbar__links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`navbar__link${pathname === l.path ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="navbar__actions">
          <button type="button" className="navbar__ai-btn" onClick={() => openAi('search')} title="AI Search (⌘K)">
            <Sparkles size={15} /> AI
          </button>
          <div className="navbar__badge">
            <span className="badge-dot" />
            Free icons
          </div>
        </div>

        <button className="navbar__toggle" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className={`navbar__mobile${open ? ' open' : ''}`}>
        <button
          type="button"
          className="navbar__link"
          style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => { openAi('search'); setOpen(false); }}
        >
          AI Search
        </button>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.path}
            to={l.path}
            className={`navbar__link${pathname === l.path ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
