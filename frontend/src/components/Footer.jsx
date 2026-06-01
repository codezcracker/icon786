import { Link } from 'react-router-dom';
import { Zap, GitFork, Share2, Heart } from 'lucide-react';
import { CATALOG } from '../utils/catalogStats';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div>
            <div className="footer__brand-name">
              <div className="footer__brand-logo">
                <Zap size={17} color="white" fill="white" />
              </div>
              Pix<span>ora</span>
            </div>
            <p className="footer__desc">
              {`Free icon library — ${CATALOG.shortTagline} (${CATALOG.licenseNote}). See LICENSES.md for credits.`}
            </p>
            <div className="footer__social">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer__social-btn">
                <GitFork size={15} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__social-btn">
                <Share2 size={15} />
              </a>
            </div>
          </div>

          <div>
            <p className="footer__section-title">Features</p>
            <ul className="footer__list">
              <li><Link to="/browse">Browse Icons</Link></li>
              <li><Link to="/editor">Icon Editor</Link></li>
              <li><Link to="/collections">Collections</Link></li>
              <li><Link to="/font-generator">Font Generator</Link></li>
            </ul>
          </div>

          <div>
            <p className="footer__section-title">Icon Sets</p>
            <ul className="footer__list">
              {['Material Design', 'Phosphor Icons', 'Tabler Icons', 'Lucide', 'Font Awesome', 'Simple Icons', 'Heroicons', '150+ more…'].map((s) => (
                <li key={s}><span>{s}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© 2026 Pixora. All icons free forever.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Made with <Heart size={12} color="#f07e96" fill="#f07e96" /> for designers & developers
          </p>
        </div>
      </div>
    </footer>
  );
}
