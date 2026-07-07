import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export default function LicensesPage() {
  return (
    <div className="licenses-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> Back to Home
      </Link>

      <h1 className="licenses-page__title">Licenses & Credits</h1>
      <p className="licenses-page__lead">
        Icon786 application code and icon catalog licensing information.
      </p>

      <section className="licenses-card">
        <div className="licenses-card__head">
          <FileText size={20} />
          <h2>Application Code</h2>
        </div>
        <p>
          The Icon786 website and API source code is licensed under the{' '}
          <strong>MIT License</strong>.
        </p>
        <p>
          <a
            href="https://github.com/codezcracker/icon786/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            View MIT LICENSE on GitHub
          </a>
        </p>
      </section>

      <section className="licenses-card">
        <div className="licenses-card__head">
          <Shield size={20} />
          <h2>Icon Catalog</h2>
        </div>
        <p>
          Icon786 exposes <strong>201,259 icons</strong> from <strong>134 icon sets</strong>{' '}
          whose licenses are <strong>MIT, Apache 2.0, ISC, or CC0</strong> — suitable for
          commercial use without per-download attribution.
        </p>
        <ul className="licenses-list">
          <li>Icons are self-hosted from <code>@icon786/icons</code> (no Iconify API at runtime).</li>
          <li>Excluded: CC BY, CC BY-SA, GPL, and trademark-heavy brand sets.</li>
          <li>Included: Material, Phosphor, Tabler, Lucide, Fluent, Remix, Bootstrap, and more.</li>
        </ul>
        <p>
          <a
            href="https://github.com/codezcracker/icon786/blob/main/LICENSES.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full icon license details (LICENSES.md)
          </a>
        </p>
      </section>

      <section className="licenses-card">
        <h2>UI Fonts</h2>
        <p>
          Typography uses <strong>Quicksand</strong> and <strong>Bricolage Grotesque</strong>{' '}
          via self-hosted <code>@fontsource</code> packages (bundled at build time).
        </p>
      </section>
    </div>
  );
}
