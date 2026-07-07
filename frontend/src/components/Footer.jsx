import { Link } from 'react-router-dom';
import { Zap, Github, Heart } from 'lucide-react';

const REPO_URL = 'https://github.com/codezcracker/icon786';

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
              Icon<span>786</span>
            </div>
            <p className="footer__desc">
              Search, edit, and download icons in any format — free forever.
            </p>
            <div className="footer__social">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-btn"
                title="GitHub repository"
              >
                <Github size={15} />
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
            <p className="footer__section-title">Legal</p>
            <ul className="footer__list">
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
                  MIT License (App)
                </a>
              </li>
              <li><Link to="/licenses">Licenses & Credits</Link></li>
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSES.md`} target="_blank" rel="noopener noreferrer">
                  Icon Catalog Licenses
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© 2026 Icon786. MIT licensed app · permissive icon catalog.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Made with <Heart size={12} color="#f07e96" fill="#f07e96" /> for designers & developers
          </p>
        </div>
      </div>
    </footer>
  );
}
