import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Search, X, Download, Trash2, Plus, Type, Check } from 'lucide-react';
import { searchIcons, getIconSVG } from '../utils/iconSearch';
import { apiUrl, hasBackend } from '../utils/api';

const FONT_FORMATS = [
  { label: 'TTF', desc: 'TrueType font' },
  { label: 'WOFF', desc: 'Web font' },
  { label: 'CSS', desc: '@font-face + classes' },
  { label: 'HTML Demo', desc: 'Self-contained preview' },
];

export default function FontGeneratorPage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]);
  const [fontName, setFontName] = useState('MyIconFont');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [cssPreview, setCssPreview] = useState('');
  const debounceRef = useRef(null);

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const icons = await searchIcons(q, null, 0, 40);
      setSearchResults(icons);
      setSearching(false);
    }, 300);
  };

  const addIcon = (iconId) => {
    if (selected.find((i) => i.id === iconId)) return;
    const [prefix, ...rest] = iconId.split(':');
    const name = rest.join(':');
    const unicode = 0xe000 + selected.length;
    setSelected([...selected, {
      id: iconId, prefix, name,
      unicode, unicodeStr: unicode.toString(16).toUpperCase(),
      cssClass: name.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
    }]);
  };

  const removeIcon = (iconId) => setSelected(selected.filter((i) => i.id !== iconId));

  const generateFont = async () => {
    if (!selected.length) return;
    setGenerating(true);
    setGenerated(false);

    try {
      // Backend generates proper TTF + WOFF + CSS + self-contained HTML demo in a ZIP
      const endpoint = apiUrl('/api/font/generate');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icons: selected.map((i) => i.id), fontName }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fontName}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        setGenerated(true);
        setGenerating(false);
        return;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
    } catch (e) {
      console.warn('Backend font gen failed, using client fallback:', e.message);
    }

    // Client-side fallback
    const svgFontParts = await Promise.all(
      selected.map(async (icon) => {
        const svg = await getIconSVG(icon.prefix, icon.name, '#000000', 512);
        return { icon, svg };
      })
    );

    let svgFont = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg">
<defs>
<font id="${fontName}" horiz-adv-x="512">
<font-face font-family="${fontName}" units-per-em="512" ascent="480" descent="-32"/>
<missing-glyph horiz-adv-x="512"/>
`;
    for (const { icon, svg } of svgFontParts) {
      if (!svg) continue;
      const pathMatches = svg.match(/d="([^"]+)"/g) || [];
      if (pathMatches.length) {
        const paths = pathMatches.map((p) => p.slice(3, -1)).join(' ');
        svgFont += `<glyph glyph-name="${icon.cssClass}" unicode="&#x${icon.unicodeStr};" horiz-adv-x="512" d="${paths}"/>\n`;
      }
    }
    svgFont += `</font></defs></svg>`;

    const css = `/* Icon786 Font Generator — ${fontName} */
@font-face {
  font-family: '${fontName}';
  src: url('${fontName}.woff2') format('woff2'),
       url('${fontName}.woff') format('woff'),
       url('${fontName}.ttf') format('truetype'),
       url('${fontName}.svg#${fontName}') format('svg');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
[class^="${fontName.toLowerCase()}-"], [class*=" ${fontName.toLowerCase()}-"] {
  font-family: '${fontName}' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
}
${selected.map((i) => `.${fontName.toLowerCase()}-${i.cssClass}:before { content: "\\${i.unicodeStr}"; }`).join('\n')}
`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${fontName} — Icon Font by Icon786</title>
<link rel="stylesheet" href="${fontName}.css">
<style>
*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#F5F4F2;color:#1C1C1E;margin:0;padding:40px}
h1{font-size:32px;font-weight:800;margin-bottom:8px}h1 span{color:#E8395A}
p{color:#6B7280;margin-bottom:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:16px;margin-top:32px}
.item{background:#fff;border-radius:16px;padding:20px;text-align:center;border:1px solid #f3f4f6}
.item:hover{border-color:#ffc6d3;transform:translateY(-2px);transition:all .2s}
.icon{font-size:36px;color:#E8395A;margin-bottom:10px;display:block}
.name{font-size:10px;color:#6B7280;word-break:break-all}
.code{font-size:9px;color:#9CA3AF;font-family:monospace;margin-top:4px}
footer{margin-top:60px;text-align:center;color:#9CA3AF;font-size:13px}
footer a{color:#E8395A}
</style>
</head>
<body>
<h1>${fontName} <span>Icon Font</span></h1>
<p>Generated by <strong>Icon786</strong> — Free Icon Library</p>
<p>${selected.length} icons included</p>
<div class="grid">
${selected.map((i) => `<div class="item">
  <span class="icon ${fontName.toLowerCase()}-${i.cssClass}"></span>
  <div class="name">${i.name}</div>
  <div class="code">U+${i.unicodeStr}</div>
</div>`).join('\n')}
</div>
<footer><p>Made with ❤️ by <a href="/">Icon786</a></p></footer>
</body>
</html>`;

    setCssPreview(css);

    // Download files
    const dl = (content, name, type) => {
      const b = new Blob([content], { type });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = name; a.click();
      URL.revokeObjectURL(u);
    };
    dl(svgFont, `${fontName}.svg`, 'image/svg+xml');
    dl(css, `${fontName}.css`, 'text/css');
    dl(html, `${fontName}-demo.html`, 'text/html');
    setGenerated(true);
    setGenerating(false);
  };

  return (
    <div className="font-gen-page">
      <div className="font-gen-header">
        <h1>Icon <span className="gradient-text">Font Generator</span></h1>
        <p>Select icons and generate a custom icon font with CSS.</p>
      </div>

      <div className="font-gen-layout">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Search & Add Icons</h3>
            <div className="input-wrap" style={{ marginBottom: 14 }}>
              <span className="input-icon"><Search size={16} /></span>
              <input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search icons to add…"
                className="input input-with-icon input-with-clear"
              />
              {query && (
                <button className="input-clear" onClick={() => { setQuery(''); setSearchResults([]); }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {searching && (
              <div className="font-search-results">
                {Array(16).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="font-search-results">
                {searchResults.map((iconId) => {
                  const isAdded = !!selected.find((i) => i.id === iconId);
                  const [, ...rest] = iconId.split(':');
                  const name = rest.join(':');
                  return (
                    <button
                      key={iconId}
                      className={`font-icon-btn${isAdded ? ' selected' : ''}`}
                      onClick={() => isAdded ? removeIcon(iconId) : addIcon(iconId)}
                    >
                      {isAdded && (
                        <div className="font-icon-btn__check">
                          <Check size={9} color="white" />
                        </div>
                      )}
                      <Icon icon={iconId} style={{ fontSize: 24, color: isAdded ? 'var(--primary)' : 'var(--dark)' }} />
                      <span className="font-icon-btn__name">{name.slice(0, 10)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!query && (
              <div className="font-gen-empty">
                <Type size={32} color="var(--gray-300)" style={{ margin: '0 auto 10px' }} />
                <p>Search for icons to add them to your font</p>
              </div>
            )}
          </div>

          {/* Selected */}
          {selected.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Selected ({selected.length})</h3>
                <button
                  onClick={() => setSelected([])}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Trash2 size={12} /> Clear all
                </button>
              </div>
              <div className="font-selected-grid">
                {selected.map((icon) => (
                  <div key={icon.id} className="font-selected-item">
                    <button className="font-selected-item__remove" onClick={() => removeIcon(icon.id)}>
                      <X size={9} />
                    </button>
                    <Icon icon={icon.id} style={{ fontSize: 28, color: 'var(--primary)' }} />
                    <span className="font-selected-item__name">{icon.name.slice(0, 14)}</span>
                    <span className="font-selected-item__unicode">U+{icon.unicodeStr}</span>
                  </div>
                ))}
                <div className="font-add-more" onClick={() => document.querySelector('.input')?.focus()}>
                  <Plus size={18} />
                  <span style={{ fontSize: 11 }}>Add more</span>
                </div>
              </div>
            </div>
          )}

          {/* CSS Preview */}
          {cssPreview && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Generated CSS</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(cssPreview)}
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>
              <pre className="code-block" style={{ maxHeight: 240, overflowY: 'auto', fontSize: 11 }}>
                {cssPreview}
              </pre>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Settings */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Font Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Font Name</label>
                <input
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value.replace(/\s+/g, ''))}
                  placeholder="MyIconFont"
                  className="input"
                />
              </div>
              <div>
                <label className="form-label">Output Files</label>
                <div className="font-formats-grid">
                  {FONT_FORMATS.map((f) => (
                    <div key={f.label} className="font-format-item">
                      <Check size={13} color="var(--primary)" />
                      <div>
                        <div className="font-format-item__label">{f.label}</div>
                        <div className="font-format-item__desc">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generate */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, background: 'var(--primary-light)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Type size={26} color="var(--primary)" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Ready to Generate</h3>
              <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                {selected.length} icon{selected.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={generateFont}
              disabled={!selected.length || generating}
            >
              {generating
                ? <><span className="spinner" /> Generating…</>
                : <><Download size={16} /> Generate & Download</>}
            </button>

            {generated && (
              <div className="font-success" style={{ marginTop: 12 }}>
                <p><Check size={13} /> ZIP downloaded successfully!</p>
                <span>TTF · WOFF · CSS · Self-contained HTML demo · Manifest</span>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--gray-400)', marginTop: 12 }}>
              SVG font · CSS stylesheet · HTML demo
            </p>
          </div>

          {/* How to use */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>How to Use</h3>
            <div className="font-steps">
              {[
                'Search and select icons to include',
                'Set your preferred font name',
                'Click Generate & Download',
                'Add the CSS file to your project',
                'Use classes: <i class="myfont-home"></i>',
              ].map((s, i) => (
                <div key={i} className="font-step">
                  <span className="font-step__num">{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
