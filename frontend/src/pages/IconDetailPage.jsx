import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { HexColorPicker } from 'react-colorful';
import { Download, Copy, Heart, ArrowLeft, Check, Share2, ChevronDown } from 'lucide-react';
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

const PRESET_COLORS = [
  '#E8395A', '#1C1C1E', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#ffffff', '#000000', '#6B7280', '#EF4444', '#22C55E',
];

const BG_OPTIONS = [
  { label: 'Transparent', value: 'transparent' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Light Gray', value: '#F5F4F2' },
  { label: 'Primary', value: '#E8395A' },
  { label: 'Dark Blue', value: '#1e3a5f' },
];

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

  const [color, setColor] = useState('#1C1C1E');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [previewSize, setPreviewSize] = useState(80);
  const [downloadSize, setDownloadSize] = useState(DEFAULT_EXPORT_SIZE);
  const [exportPadding, setExportPadding] = useState(0);
  const [exportWidth, setExportWidth] = useState('');
  const [exportHeight, setExportHeight] = useState('');
  const [bgColor, setBgColor] = useState('transparent');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [activeFormat, setActiveFormat] = useState('svg');
  const [svgContent, setSvgContent] = useState('');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [customBg, setCustomBg] = useState('#ffffff');

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('px_favorites') || '[]');
    setIsFav(favs.includes(iconId));
  }, [iconId]);

  useEffect(() => {
    getIconSVG(prefix, decodedName, color).then((svg) => { if (svg) setSvgContent(svg); });
  }, [iconId, color]);

  const actualBg = bgColor === 'custom' ? customBg : bgColor;

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (fmt) => {
    setDownloading(true);
    setDownloadError('');
    try {
      const svg = await getIconSVG(prefix, decodedName, color);
      if (!svg) {
        setDownloadError('Could not load icon. Check your connection and try again.');
        return;
      }

      const exportOpts = buildExportOpts({
        maxSize: downloadSize,
        padding: exportPadding,
        width: exportWidth,
        height: exportHeight,
        background: actualBg === 'transparent' ? null : actualBg,
      });

      let blob;
      const filename = `${decodedName}.${fmt}`;
      if (fmt === 'svg') blob = exportSvgBlob(svg, exportOpts);
      else if (fmt === 'png') blob = await exportSvgToPng(svg, exportOpts);
      else if (fmt === 'jpg') {
        blob = await exportSvgToJpg(svg, {
          ...exportOpts,
          background: actualBg === 'transparent' ? '#ffffff' : actualBg,
        });
      } else if (fmt === 'webp') blob = await exportSvgToWebP(svg, exportOpts);

      if (!blob) {
        setDownloadError('Export failed. Try SVG format or a smaller size.');
        return;
      }
      downloadBlob(blob, filename);
    } catch (e) {
      console.error(e);
      setDownloadError(e.message || 'Download failed. Try again or use SVG.');
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

      <div className="icon-detail__grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Preview */}
          <div className="icon-preview-box">
            <div
              className="icon-preview-canvas"
              style={{
                background: actualBg === 'transparent' ? checkerBg : actualBg,
              }}
            >
              <Icon icon={iconId} style={{ fontSize: previewSize, color }} />
            </div>
            <div className="icon-preview-name">{decodedName}</div>
            <div className="icon-preview-prefix">{prefix}</div>

            <div className="icon-preview-actions">
              <button
                className="btn-icon"
                style={{ flexShrink: 0 }}
                onClick={toggleFav}
              >
                <Heart
                  size={17}
                  color={isFav ? 'var(--primary)' : 'var(--gray-400)'}
                  fill={isFav ? 'var(--primary)' : 'none'}
                />
              </button>
              <button className="btn btn-secondary flex-1" onClick={() => copyToClipboard(svgContent)}>
                {copied ? <><Check size={14} color="green" /> Copied!</> : <><Copy size={14} /> Copy SVG</>}
              </button>
              <button className="btn-icon" style={{ flexShrink: 0 }} onClick={() => copyToClipboard(iconId)}>
                <Share2 size={17} color="var(--gray-400)" />
              </button>
            </div>
          </div>

          {/* Info */}
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
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Color */}
          <div className="editor-panel">
            <h3>Icon Color</h3>
            <div className="color-swatches" style={{ marginBottom: 14 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch${color === c ? ' active' : ''}${c === '#ffffff' ? ' color-swatch-white' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <button
                className="color-swatch color-swatch-add"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >+</button>
            </div>
            {showColorPicker && (
              <div className="anim-fade">
                <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', marginBottom: 10 }} />
                <input value={color} onChange={(e) => setColor(e.target.value)} className="input input-mono" style={{ fontSize: 13 }} />
              </div>
            )}
          </div>

          {/* Preview size */}
          <div className="editor-panel">
            <h3>Preview Size</h3>
            <div className="size-pills">
              {[32, 48, 80, 96, 128].map((s) => (
                <button
                  key={s}
                  className={`size-pill${previewSize === s ? ' active' : ''}`}
                  onClick={() => setPreviewSize(s)}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="editor-panel">
            <h3>Background</h3>
            <div className="bg-options">
              {BG_OPTIONS.map((bg) => (
                <button
                  key={bg.value}
                  className={`bg-option${bgColor === bg.value ? ' active' : ''}`}
                  onClick={() => setBgColor(bg.value)}
                >
                  {bg.label !== 'Transparent' && (
                    <span className="bg-swatch" style={{ background: bg.value }} />
                  )}
                  {bg.label}
                </button>
              ))}
              <button
                className={`bg-option${bgColor === 'custom' ? ' active' : ''}`}
                onClick={() => { setBgColor('custom'); setShowBgPicker(true); }}
              >
                <span className="bg-swatch" style={{ background: customBg }} />
                Custom
              </button>
            </div>
            {bgColor === 'custom' && showBgPicker && (
              <div className="anim-fade">
                <HexColorPicker color={customBg} onChange={setCustomBg} style={{ width: '100%', marginBottom: 10 }} />
                <input value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="input input-mono" style={{ fontSize: 13 }} />
              </div>
            )}
          </div>

          {/* Download */}
          <div className="editor-panel">
            <h3>Download</h3>
            <div className="format-grid" style={{ marginBottom: 16 }}>
              {FORMATS.map((f) => (
                <button
                  key={f.id}
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
              onClick={() => handleDownload(activeFormat)}
              disabled={downloading}
            >
              {downloading
                ? <><span className="spinner" /> Preparing…</>
                : (
                  <>
                    <Download size={16} /> Download {activeFormat.toUpperCase()}
                    {' '}
                    ({exportWidth && exportHeight ? `${exportWidth}×${exportHeight}` : `${downloadSize}px`})
                  </>
                )}
            </button>
            {downloadError && (
              <p className="download-note" style={{ color: 'var(--primary)', marginTop: 8 }}>
                {downloadError}
              </p>
            )}
            <p className="download-note">No sign-up · No attribution · Free forever</p>
          </div>

          {/* Use in code */}
          <div className="editor-panel">
            <h3>Use in Code</h3>
            <div className="code-block">
              <span className="code-comment">{'// With @iconify/react'}</span><br />
              <span className="code-keyword">import</span>
              {' { Icon } '}
              <span className="code-keyword">from</span>
              {' '}
              <span className="code-string">'@iconify/react'</span>
              <br /><br />
              <span style={{ color: '#d4d4d4' }}>{'<'}</span>
              <span className="code-tag">Icon</span>
              {' '}
              <span className="code-attr">icon</span>
              {'="'}
              <span className="code-string">{iconId}</span>
              {'" />'}
            </div>
            <button
              className="btn btn-secondary btn-full"
              style={{ marginTop: 12, fontSize: 13 }}
              onClick={() => copyToClipboard(`<Icon icon="${iconId}" />`)}
            >
              <Copy size={13} /> Copy Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
