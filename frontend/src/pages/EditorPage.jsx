import { useState, useRef, useEffect } from 'react';
import Icon from '../components/Icon';
import { HexColorPicker } from 'react-colorful';
import { Search, Download, RotateCcw } from 'lucide-react';
import { getIconSVG } from '../utils/iconSearch';
import {
  exportSvgBlob,
  exportSvgToPng,
  exportSvgToJpg,
  exportSvgToWebP,
  parseViewBox,
} from '../utils/svgExport';
import { downloadBlob } from '../utils/downloadFile';
import ExportOptions from '../components/ExportOptions';
import { DEFAULT_EXPORT_SIZE, buildExportOpts } from '../constants/exportSizes';

const PRESET_COLORS = [
  '#E8395A', '#1C1C1E', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#ffffff', '#000000', '#6B7280',
];

const GRADIENT_PRESETS = [
  ['#E8395A', '#F59E0B'],
  ['#8B5CF6', '#EC4899'],
  ['#3B82F6', '#14B8A6'],
  ['#10B981', '#84CC16'],
  ['#F97316', '#EF4444'],
  ['#6366F1', '#8B5CF6'],
  ['#06B6D4', '#3B82F6'],
  ['#1C1C1E', '#6B7280'],
];

const DEFAULT_ICONS = [
  'mdi:home', 'mdi:heart', 'mdi:star', 'mdi:rocket',
  'ph:house-bold', 'ph:heart-bold', 'ph:star-bold', 'ph:lightning-bold',
  'tabler:diamond', 'tabler:crown', 'tabler:shield', 'tabler:bolt',
  'lucide:code-2', 'lucide:camera', 'lucide:music', 'lucide:coffee',
];

const SHAPES = [
  { id: 'none', label: 'None', style: { width: 18, height: 18, border: '2px dashed #9CA3AF', borderRadius: 4 } },
  { id: 'square', label: 'Square', style: { width: 18, height: 18, background: '#6B7280', borderRadius: 0 } },
  { id: 'rounded', label: 'Rounded', style: { width: 18, height: 18, background: '#6B7280', borderRadius: 6 } },
  { id: 'circle', label: 'Circle', style: { width: 18, height: 18, background: '#6B7280', borderRadius: '50%' } },
];

const BG_PRESETS = ['#ffffff', '#F5F4F2', '#1C1C1E', '#E8395A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

// SVG-embeddable keyframes; applied to a group with class "px-anim".
const ANIMATIONS = [
  { id: 'none', label: 'None' },
  { id: 'spin', label: 'Spin' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'beat', label: 'Beat' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'shake', label: 'Shake' },
  { id: 'flip', label: 'Flip' },
  { id: 'fade', label: 'Fade' },
];

const KEYFRAMES = {
  spin: '@keyframes px-spin{to{transform:rotate(360deg)}}',
  pulse: '@keyframes px-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}',
  beat: '@keyframes px-beat{0%,100%{transform:scale(1)}25%{transform:scale(1.28)}40%{transform:scale(.92)}60%{transform:scale(1.18)}}',
  bounce: '@keyframes px-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12%)}}',
  shake: '@keyframes px-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-9%)}75%{transform:translateX(9%)}}',
  flip: '@keyframes px-flip{0%,100%{transform:rotateY(0)}50%{transform:rotateY(180deg)}}',
  fade: '@keyframes px-fade{0%,100%{opacity:1}50%{opacity:.2}}',
};

// Map an angle (deg) to linearGradient endpoints in objectBoundingBox space.
function gradCoords(angle) {
  const a = ((angle % 360) + 360) % 360 * Math.PI / 180;
  const x = Math.cos(a), y = Math.sin(a);
  return {
    x1: (50 - x * 50).toFixed(1),
    y1: (50 - y * 50).toFixed(1),
    x2: (50 + x * 50).toFixed(1),
    y2: (50 + y * 50).toFixed(1),
  };
}

export default function EditorPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState('mdi:home');
  const [rawIcon, setRawIcon] = useState(null); // { inner, viewBox }

  const [fillType, setFillType] = useState('solid'); // 'solid' | 'gradient'
  const [iconColor, setIconColor] = useState('#E8395A');
  const [gradFrom, setGradFrom] = useState('#E8395A');
  const [gradTo, setGradTo] = useState('#F59E0B');
  const [gradAngle, setGradAngle] = useState(45);

  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgShape, setBgShape] = useState('none');
  const [iconScale, setIconScale] = useState(100);
  const [exportSize, setExportSize] = useState(DEFAULT_EXPORT_SIZE);
  const [exportPadding, setExportPadding] = useState(0);
  const [exportWidth, setExportWidth] = useState('');
  const [exportHeight, setExportHeight] = useState('');
  const [canvasSize, setCanvasSize] = useState(100);
  const [rotation, setRotation] = useState(0);

  const [animation, setAnimation] = useState('none');
  const [animSpeed, setAnimSpeed] = useState(1.5);

  const [showIconColor, setShowIconColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const { searchIcons } = await import('../utils/iconSearch');
      const { icons } = await searchIcons(q, null, 0, 32);
      setResults(icons);
    }, 300);
  };

  // Fetch the raw icon (keeping currentColor) once per selection.
  useEffect(() => {
    let cancelled = false;
    setRawIcon(null);
    (async () => {
      const [pfx, ...rest] = selectedIcon.split(':');
      const nm = rest.join(':');
      const svg = await getIconSVG(pfx, nm, 'currentColor');
      if (cancelled || !svg) return;
      const vb = svg.match(/viewBox="([^"]+)"/);
      const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      setRawIcon({ inner, viewBox: vb ? vb[1] : '0 0 24 24' });
    })();
    return () => { cancelled = true; };
  }, [selectedIcon]);

  const shapeRadius = (s) => ({ none: 0, square: 0, rounded: '22%', circle: '50%' }[s]);

  // Compose SVG in native viewBox (no square artboard / empty margin).
  const buildComposed = () => {
    if (!rawIcon) return '';
    const { inner, viewBox } = rawIcon;
    const vb = parseViewBox(`<svg viewBox="${viewBox}"></svg>`);
    const cx = vb.minX + vb.width / 2;
    const cy = vb.minY + vb.height / 2;
    const scale = iconScale / 100;

    const paint = fillType === 'gradient' ? 'url(#pxIconGrad)' : iconColor;
    const painted = inner.replace(/currentColor/g, paint);

    let bgEl = '';
    if (bgShape !== 'none') {
      const r =
        bgShape === 'circle'
          ? Math.min(vb.width, vb.height) / 2
          : bgShape === 'rounded'
            ? Math.min(vb.width, vb.height) * 0.22
            : 0;
      bgEl = `<rect x="${vb.minX}" y="${vb.minY}" width="${vb.width}" height="${vb.height}" rx="${r}" ry="${r}" fill="${bgColor}"/>`;
    }

    let defs = '';
    if (fillType === 'gradient') {
      const c = gradCoords(gradAngle);
      defs = `<defs><linearGradient id="pxIconGrad" x1="${c.x1}%" y1="${c.y1}%" x2="${c.x2}%" y2="${c.y2}%"><stop offset="0%" stop-color="${gradFrom}"/><stop offset="100%" stop-color="${gradTo}"/></linearGradient></defs>`;
    }

    let styleEl = '';
    let animClass = '';
    if (animation !== 'none') {
      animClass = ' class="px-anim"';
      const timing = animation === 'spin' ? 'linear' : 'ease-in-out';
      styleEl = `<style>${KEYFRAMES[animation]} .px-anim{transform-box:fill-box;transform-origin:center;animation:px-${animation} ${animSpeed}s ${timing} infinite;}</style>`;
    }

    const transforms = [];
    if (rotation) transforms.push(`rotate(${rotation} ${cx} ${cy})`);
    if (scale !== 1) transforms.push(`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`);
    const groupTransform = transforms.length ? ` transform="${transforms.join(' ')}"` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" overflow="visible">${defs}${styleEl}<g${groupTransform}><g${animClass}>${bgEl}${painted}</g></g></svg>`;
  };

  const dl = async (fmt) => {
    if (!rawIcon) return;
    setDownloading(true);
    try {
      const svg = buildComposed();
      if (!svg) return;
      const nm = selectedIcon.split(':').slice(1).join(':');
      const exportOpts = buildExportOpts({
        maxSize: exportSize,
        padding: exportPadding,
        width: exportWidth,
        height: exportHeight,
        background: bgShape === 'none' ? null : bgColor,
      });
      const trigger = (blob, ext) => downloadBlob(blob, `${nm}-edited.${ext}`);
      if (fmt === 'svg') trigger(exportSvgBlob(svg, exportOpts), 'svg');
      else if (fmt === 'png') trigger(await exportSvgToPng(svg, exportOpts), 'png');
      else if (fmt === 'jpg') trigger(await exportSvgToJpg(svg, exportOpts), 'jpg');
      else if (fmt === 'webp') trigger(await exportSvgToWebP(svg, exportOpts), 'webp');
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  const reset = () => {
    setFillType('solid'); setIconColor('#E8395A');
    setGradFrom('#E8395A'); setGradTo('#F59E0B'); setGradAngle(45);
    setBgColor('#ffffff'); setBgShape('none');
    setIconScale(100); setExportSize(DEFAULT_EXPORT_SIZE); setExportPadding(0);
    setExportWidth(''); setExportHeight(''); setCanvasSize(100); setRotation(0);
    setAnimation('none'); setAnimSpeed(1.5);
  };

  const displayIcons = results.length > 0 ? results : DEFAULT_ICONS;
  const previewSz = canvasSize * 2.8;
  const previewSvg = buildComposed();

  return (
    <div className="editor-page">
      <div className="editor-page__header">
        <h1>Icon <span className="gradient-text">Editor</span></h1>
        <p>Customize any icon with colors, gradients, animations, shapes, and style</p>
      </div>

      <div className="editor-layout">
        {/* Icon Picker */}
        <div className="editor-icon-picker">
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Select Icon</h3>
            <div className="input-wrap" style={{ marginBottom: 12 }}>
              <span className="input-icon"><Search size={14} /></span>
              <input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search icons…"
                className="input input-with-icon"
                style={{ padding: '10px 16px 10px 38px', fontSize: 13 }}
              />
            </div>
            <div className="editor-icon-results">
              {displayIcons.map((id) => (
                <button
                  key={id}
                  className={`editor-icon-btn${selectedIcon === id ? ' active' : ''}`}
                  onClick={() => setSelectedIcon(id)}
                >
                  <Icon icon={id} style={{ fontSize: 22, color: selectedIcon === id ? 'var(--primary)' : 'var(--gray-600)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="editor-canvas-area">
          <div className="editor-canvas-box">
            <div
              className="editor-preview transparency-bg"
              style={{ minWidth: 120, minHeight: 120, maxWidth: previewSz, maxHeight: previewSz, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, padding: 12 }}
            >
              {previewSvg
                ? <div className="editor-live-svg" style={{ maxWidth: '100%', maxHeight: previewSz - 24 }} dangerouslySetInnerHTML={{ __html: previewSvg }} />
                : <span className="spinner spinner-primary" />}
            </div>

            <p className="editor-icon-name">{selectedIcon}</p>

            <ExportOptions
              maxSize={exportSize}
              onMaxSizeChange={setExportSize}
              padding={exportPadding}
              onPaddingChange={setExportPadding}
              width={exportWidth}
              onWidthChange={setExportWidth}
              height={exportHeight}
              onHeightChange={setExportHeight}
            />
            <div className="editor-download-grid">
              {['svg', 'png', 'jpg', 'webp'].map((fmt) => (
                <button
                  key={fmt}
                  className="editor-dl-btn"
                  onClick={() => dl(fmt)}
                  disabled={downloading}
                >
                  <Download size={13} />
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            {animation !== 'none' && (
              <p className="editor-hint">Animations are preserved in <strong>SVG</strong> exports. PNG/JPG/WebP save a static frame.</p>
            )}
          </div>

          <button className="btn btn-primary btn-full" onClick={() => dl('png')} disabled={downloading}>
            {downloading
              ? <><span className="spinner" /> Exporting…</>
              : <><Download size={16} /> Download PNG ({exportWidth && exportHeight ? `${exportWidth}×${exportHeight}` : `${exportSize}px`})</>}
          </button>
        </div>

        {/* Controls */}
        <div className="editor-controls">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="reset-btn" onClick={reset}>
              <RotateCcw size={13} /> Reset defaults
            </button>
          </div>

          {/* Icon Fill (solid / gradient) */}
          <div className="editor-panel">
            <div className="editor-panel__header">
              <span className="editor-panel__title">Icon Fill</span>
              <div
                className="editor-panel__swatch"
                style={{ background: fillType === 'gradient' ? `linear-gradient(${gradAngle}deg, ${gradFrom}, ${gradTo})` : iconColor }}
              />
            </div>

            <div className="seg-toggle" style={{ marginBottom: 12 }}>
              <button className={`seg-toggle__btn${fillType === 'solid' ? ' is-active' : ''}`} onClick={() => setFillType('solid')}>Solid</button>
              <button className={`seg-toggle__btn${fillType === 'gradient' ? ' is-active' : ''}`} onClick={() => setFillType('gradient')}>Gradient</button>
            </div>

            {fillType === 'solid' ? (
              <>
                <div className="color-swatches" style={{ marginBottom: 10 }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`color-swatch${iconColor === c ? ' active' : ''}${c === '#ffffff' ? ' color-swatch-white' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setIconColor(c)}
                    />
                  ))}
                  <button className="color-swatch color-swatch-edit" onClick={() => { setShowIconColor(!showIconColor); setShowBgColor(false); }}>+</button>
                </div>
                {showIconColor && (
                  <div className="anim-fade">
                    <HexColorPicker color={iconColor} onChange={setIconColor} style={{ width: '100%', marginBottom: 8 }} />
                    <input value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="input input-mono" style={{ fontSize: 12, padding: '8px 12px' }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="gradient-presets">
                  {GRADIENT_PRESETS.map(([from, to]) => (
                    <button
                      key={from + to}
                      className={`gradient-preset${gradFrom === from && gradTo === to ? ' active' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                      onClick={() => { setGradFrom(from); setGradTo(to); }}
                    />
                  ))}
                </div>
                <div className="gradient-stops">
                  <label className="gradient-stop">
                    <span>From</span>
                    <input type="color" value={gradFrom} onChange={(e) => setGradFrom(e.target.value)} />
                  </label>
                  <label className="gradient-stop">
                    <span>To</span>
                    <input type="color" value={gradTo} onChange={(e) => setGradTo(e.target.value)} />
                  </label>
                </div>
                <div className="slider-row" style={{ marginTop: 10 }}>
                  <div className="slider-label"><span>Angle</span><span>{gradAngle}°</span></div>
                  <input type="range" min="0" max="360" value={gradAngle} onChange={(e) => setGradAngle(+e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* Animation */}
          <div className="editor-panel">
            <div className="editor-panel__header">
              <span className="editor-panel__title">Animation</span>
            </div>
            <div className="anim-grid">
              {ANIMATIONS.map((a) => (
                <button
                  key={a.id}
                  className={`anim-pill${animation === a.id ? ' active' : ''}`}
                  onClick={() => setAnimation(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {animation !== 'none' && (
              <div className="slider-row" style={{ marginTop: 12 }}>
                <div className="slider-label"><span>Speed</span><span>{animSpeed}s</span></div>
                <input type="range" min="0.3" max="4" step="0.1" value={animSpeed} onChange={(e) => setAnimSpeed(+e.target.value)} />
              </div>
            )}
          </div>

          {/* Background */}
          <div className="editor-panel">
            <div className="editor-panel__header">
              <span className="editor-panel__title">Background</span>
              <div
                className="editor-panel__swatch"
                style={{ background: bgColor }}
                onClick={() => { setShowBgColor(!showBgColor); setShowIconColor(false); }}
              />
            </div>

            <div className="shape-pills" style={{ marginBottom: 12 }}>
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  className={`shape-pill${bgShape === s.id ? ' active' : ''}`}
                  onClick={() => setBgShape(s.id)}
                >
                  <div style={s.style} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="color-swatches" style={{ marginBottom: 10 }}>
              {BG_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch${bgColor === c ? ' active' : ''}${c === '#ffffff' ? ' color-swatch-white' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setBgColor(c)}
                />
              ))}
            </div>
            {showBgColor && (
              <div className="anim-fade">
                <HexColorPicker color={bgColor} onChange={setBgColor} style={{ width: '100%', marginBottom: 8 }} />
                <input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="input input-mono" style={{ fontSize: 12, padding: '8px 12px' }} />
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="editor-panel">
            <div className="slider-row">
              <div className="slider-label">
                <span>Icon Size</span><span>{iconScale}%</span>
              </div>
              <input type="range" min="20" max="95" value={iconScale} onChange={(e) => setIconScale(+e.target.value)} />
            </div>
            <div className="slider-row">
              <div className="slider-label">
                <span>Rotation</span><span>{rotation}°</span>
              </div>
              <input type="range" min="0" max="360" value={rotation} onChange={(e) => setRotation(+e.target.value)} />
            </div>
            <div className="slider-row">
              <div className="slider-label">
                <span>Canvas Size</span><span>{canvasSize}px</span>
              </div>
              <input type="range" min="60" max="130" value={canvasSize} onChange={(e) => setCanvasSize(+e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
