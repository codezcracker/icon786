import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Download, Heart, ArrowLeft, Pencil } from 'lucide-react';
import { getIconSVG } from '../utils/iconSearch';
import {
  exportSvgBlob,
  exportSvgToPng,
  exportSvgToJpg,
  exportSvgToWebP,
} from '../utils/svgExport';
import { downloadBlob } from '../utils/downloadFile';
import ExportOptions from '../components/ExportOptions';
import { DEFAULT_EXPORT_SIZE, buildExportOpts } from '../constants/exportSizes';
import { isPermissivePrefix } from '../utils/permissiveLicenses';

const FORMATS = [
  { id: 'svg', label: 'SVG', desc: 'Vector, scalable' },
  { id: 'png', label: 'PNG', desc: 'Transparent bg' },
  { id: 'jpg', label: 'JPG', desc: 'Photo quality' },
  { id: 'webp', label: 'WebP', desc: 'Modern web' },
];

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

  const [activeFormat, setActiveFormat] = useState('png');
  const [downloadSize, setDownloadSize] = useState(DEFAULT_EXPORT_SIZE);
  const [exportPadding, setExportPadding] = useState(0);
  const [exportWidth, setExportWidth] = useState('');
  const [exportHeight, setExportHeight] = useState('');
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

      const fmt = activeFormat;
      const exportOpts = buildExportOpts({
        maxSize: downloadSize,
        padding: exportPadding,
        width: exportWidth,
        height: exportHeight,
        background: null,
      });

      let blob;
      const filename = `${decodedName}.${fmt}`;
      if (fmt === 'svg') blob = exportSvgBlob(svg, exportOpts);
      else if (fmt === 'png') blob = await exportSvgToPng(svg, exportOpts);
      else if (fmt === 'jpg') blob = await exportSvgToJpg(svg, { ...exportOpts, background: '#ffffff' });
      else if (fmt === 'webp') blob = await exportSvgToWebP(svg, exportOpts);

      if (!blob) {
        setDownloadError('Export failed. Try SVG or a smaller size.');
        return;
      }
      downloadBlob(blob, filename);
    } catch (e) {
      console.error(e);
      setDownloadError(e.message || 'Save failed. Try again.');
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
  const sizeLabel = exportWidth && exportHeight ? `${exportWidth}×${exportHeight}` : `${downloadSize}px`;

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

          <div className="icon-detail__actions icon-detail__actions--top">
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
            <Link
              to={`/editor?icon=${encodeURIComponent(iconId)}`}
              className="btn btn-secondary flex-1"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Pencil size={15} /> Customize in Editor
            </Link>
          </div>
        </div>

        <div className="icon-detail__save-panel">
          <h3>Save Icon</h3>
          <p className="icon-detail__save-desc">Choose a format and size, then download.</p>

          <div className="format-grid" style={{ marginBottom: 16 }}>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`format-btn${activeFormat === f.id ? ' active' : ''}`}
                onClick={() => setActiveFormat(f.id)}
              >
                <div className="format-btn__name">{f.label}</div>
                <div className="format-btn__desc">{f.desc}</div>
              </button>
            ))}
          </div>

          <ExportOptions
            maxSize={downloadSize}
            onMaxSizeChange={setDownloadSize}
            padding={exportPadding}
            onPaddingChange={setExportPadding}
            width={exportWidth}
            onWidthChange={setExportWidth}
            height={exportHeight}
            onHeightChange={setExportHeight}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={downloading}
            style={{ marginTop: 4 }}
          >
            {downloading
              ? <><span className="spinner" /> Saving…</>
              : <><Download size={16} /> Save {activeFormat.toUpperCase()} ({sizeLabel})</>}
          </button>
          {downloadError && (
            <p className="download-note" style={{ color: 'var(--primary)', marginTop: 8 }}>
              {downloadError}
            </p>
          )}
          <p className="download-note">No sign-up · Free forever</p>

          <div className="icon-info-box" style={{ marginTop: 20 }}>
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
              Need custom colors, backgrounds, or animations?
              {' '}
              <Link to={`/editor?icon=${encodeURIComponent(iconId)}`}>Open in Editor</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
