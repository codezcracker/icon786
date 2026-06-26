import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Download, Heart, ArrowLeft, Pencil } from 'lucide-react';
import { getIconSVG } from '../utils/iconSearch';
import { exportSvgBlob } from '../utils/svgExport';
import { downloadBlob } from '../utils/downloadFile';
import { isPermissivePrefix } from '../utils/permissiveLicenses';

export default function IconDetailPage() {
  const { prefix, name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name);
  const iconId = `${prefix}:${decodedName}`;

  useEffect(() => {
    if (!isPermissivePrefix(prefix)) {
      navigate('/browse', { replace: true });
    }
  }, [prefix, navigate]);

  const [downloading, setDownloading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('px_favorites') || '[]');
    setIsFav(favs.includes(iconId));
  }, [iconId]);

  const handleSave = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const svg = await getIconSVG(prefix, decodedName, '#1C1C1E');
      if (!svg) {
        setDownloadError('Could not load icon. Try again.');
        return;
      }
      downloadBlob(exportSvgBlob(svg), `${decodedName}.svg`);
    } catch (e) {
      console.error(e);
      setDownloadError('Save failed. Try again.');
    }
    setDownloading(false);
  };

  const toggleFav = () => {
    const favs = JSON.parse(localStorage.getItem('px_favorites') || '[]');
    const updated = isFav ? favs.filter((f) => f !== iconId) : [...favs, iconId];
    localStorage.setItem('px_favorites', JSON.stringify(updated));
    setIsFav(!isFav);
  };

  const checkerBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Crect width='7' height='7' fill='%23e8e8e8'/%3E%3Crect x='7' y='7' width='7' height='7' fill='%23e8e8e8'/%3E%3C/svg%3E")`;

  return (
    <div className="icon-detail">
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Back to Browse
      </button>

      <div className="icon-detail__simple">
        <div className="icon-preview-box">
          <div
            className="icon-preview-canvas"
            style={{ background: checkerBg }}
          >
            <Icon icon={iconId} style={{ fontSize: 96, color: '#1C1C1E' }} />
          </div>
          <div className="icon-preview-name">{decodedName}</div>
          <div className="icon-preview-prefix">{prefix}</div>

          <div className="icon-detail__actions">
            <button
              className="btn-icon"
              onClick={toggleFav}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                size={18}
                color={isFav ? 'var(--primary)' : 'var(--gray-400)'}
                fill={isFav ? 'var(--primary)' : 'none'}
              />
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={downloading}
            >
              {downloading
                ? <><span className="spinner" /> Saving…</>
                : <><Download size={16} /> Save SVG</>}
            </button>
            <Link
              to={`/editor?icon=${encodeURIComponent(iconId)}`}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Pencil size={15} /> Edit
            </Link>
          </div>
          {downloadError && (
            <p className="download-note" style={{ color: 'var(--primary)', marginTop: 8 }}>
              {downloadError}
            </p>
          )}
        </div>

        <div className="icon-info-box">
          <h3>Icon Info</h3>
          {[
            ['Name', decodedName],
            ['Set', prefix],
            ['Icon ID', iconId],
            ['License', 'Open Source / Free'],
          ].map(([k, v]) => (
            <div key={k} className="icon-info-row">
              <span>{k}</span>
              <span title={v}>{v}</span>
            </div>
          ))}
          <p className="icon-detail__edit-hint">
            Want to change color, background, or export as PNG/JPG?
            {' '}
            <Link to={`/editor?icon=${encodeURIComponent(iconId)}`}>Open in Editor</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
