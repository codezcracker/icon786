const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const opentype = require('opentype.js');
const sharp = require('sharp');
const potrace = require('potrace');
const localIcons = require('../services/localIcons');
const { isPermissivePrefix } = require('../utils/permissiveLicenses');

// ────────────────────────────────────────────────────────────────
//  RENDER + TRACE PIPELINE
//  SVG (any type) → high-res bitmap → traced filled vector path
//  This handles fill icons, stroke icons, animated icons, complex
//  multi-path icons — all uniformly, because we trace the final
//  rendered shape rather than parsing fragile SVG path semantics.
// ────────────────────────────────────────────────────────────────

const RENDER_SIZE = 1000;   // bitmap resolution for tracing
const ICON_SIZE = 820;      // icon drawn at this size, centered (gives padding)
const PAD = (RENDER_SIZE - ICON_SIZE) / 2;

function tracePng(pngBuffer) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      pngBuffer,
      { threshold: 128, turdSize: 2, optTolerance: 0.4, color: 'black', background: 'white', turnPolicy: 'minority' },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

async function svgToTracedPathD(svgStr) {
  // Render the SVG silhouette via its ALPHA channel — this makes ANY icon
  // (monochrome, multicolor, light-colored, stroke or fill) become a solid
  // black shape on white, so potrace always traces the true icon outline.
  const png = await sharp(Buffer.from(svgStr))
    .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .extractChannel(3)   // alpha → grayscale: icon = white, background = black
    .negate()            // invert: icon = black, background = white
    .png()
    .toBuffer();

  const tracedSvg = await tracePng(png);
  // potrace emits a single <path d="..."/> containing all subpaths
  const m = tracedSvg.match(/ d="([^"]+)"/);
  return m ? m[1] : null;
}

// ────────────────────────────────────────────────────────────────
//  PATH PARSER  (potrace output → opentype Path, with Y flip)
//  potrace produces absolute M / L / C / Z commands only.
//  Vertical metrics: glyph spans -DESCENT .. (RENDER_SIZE - DESCENT)
// ────────────────────────────────────────────────────────────────

const UPM = 1000;
const DESCENT = 150;        // how far below baseline the glyph extends
const ASCENT = UPM - DESCENT;

function tracedPathToGlyph(d) {
  const path = new opentype.Path();
  if (!d) return path;

  const scale = UPM / RENDER_SIZE;
  const tx = (x) => x * scale;
  const ty = (y) => (RENDER_SIZE - y) * scale - DESCENT; // flip Y + shift down

  const tokens = d.match(/[MLCZmlcz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
  let i = 0;
  let cx = 0, cy = 0, sx = 0, sy = 0;
  const num = () => parseFloat(tokens[i++] || 0);
  const isNum = () => i < tokens.length && /^[+-]?[\d.]/.test(tokens[i] || '');

  while (i < tokens.length) {
    const cmd = tokens[i];
    if (!/^[MLCZmlcz]$/.test(cmd)) { i++; continue; }
    i++;
    switch (cmd) {
      case 'M':
        cx = num(); cy = num(); path.moveTo(tx(cx), ty(cy)); sx = cx; sy = cy;
        while (isNum()) { cx = num(); cy = num(); path.lineTo(tx(cx), ty(cy)); }
        break;
      case 'm':
        cx += num(); cy += num(); path.moveTo(tx(cx), ty(cy)); sx = cx; sy = cy;
        while (isNum()) { cx += num(); cy += num(); path.lineTo(tx(cx), ty(cy)); }
        break;
      case 'L':
        do { cx = num(); cy = num(); path.lineTo(tx(cx), ty(cy)); } while (isNum());
        break;
      case 'l':
        do { cx += num(); cy += num(); path.lineTo(tx(cx), ty(cy)); } while (isNum());
        break;
      case 'C':
        do {
          const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
          path.curveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y));
          cx = x; cy = y;
        } while (isNum());
        break;
      case 'c':
        do {
          const x1 = cx + num(), y1 = cy + num(), x2 = cx + num(), y2 = cy + num(), x = cx + num(), y = cy + num();
          path.curveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(x), ty(y));
          cx = x; cy = y;
        } while (isNum());
        break;
      case 'Z':
      case 'z':
        path.close(); cx = sx; cy = sy;
        break;
    }
  }
  return path;
}

// ────────────────────────────────────────────────────────────────
//  TTF → WOFF wrapper (uncompressed container)
// ────────────────────────────────────────────────────────────────

function ttfToWoff(ttfBuf) {
  const ttf = Buffer.isBuffer(ttfBuf) ? ttfBuf : Buffer.from(ttfBuf);
  const numTables = ttf.readUInt16BE(4);
  const WOFF_HDR = 44, WOFF_TBL = 20, SFNT_HDR = 12, SFNT_TBL = 16;

  const hdrBuf = Buffer.alloc(WOFF_HDR + numTables * WOFF_TBL);
  let off = 0;
  hdrBuf.writeUInt32BE(0x774F4646, off); off += 4;
  ttf.copy(hdrBuf, off, 0, 4); off += 4;
  const lenOff = off; hdrBuf.writeUInt32BE(0, off); off += 4;
  hdrBuf.writeUInt16BE(numTables, off); off += 2;
  hdrBuf.writeUInt16BE(0, off); off += 2;
  hdrBuf.writeUInt32BE(ttf.length, off); off += 4;
  hdrBuf.writeUInt16BE(1, off); off += 2;
  hdrBuf.writeUInt16BE(0, off); off += 2;
  for (let z = 0; z < 5; z++) { hdrBuf.writeUInt32BE(0, off); off += 4; }

  const fontDataOff = SFNT_HDR + numTables * SFNT_TBL;
  const woffDataOff = WOFF_HDR + numTables * WOFF_TBL;
  for (let t = 0; t < numTables; t++) {
    const sOff = SFNT_HDR + t * SFNT_TBL;
    const wOff = WOFF_HDR + t * WOFF_TBL;
    ttf.copy(hdrBuf, wOff, sOff, sOff + 4);
    const origOff = ttf.readUInt32BE(sOff + 8);
    hdrBuf.writeUInt32BE(origOff - fontDataOff + woffDataOff, wOff + 4);
    const origLen = ttf.readUInt32BE(sOff + 12);
    hdrBuf.writeUInt32BE(origLen, wOff + 8);
    hdrBuf.writeUInt32BE(origLen, wOff + 12);
    hdrBuf.writeUInt32BE(ttf.readUInt32BE(sOff + 4), wOff + 16);
  }
  const result = Buffer.concat([hdrBuf, ttf.slice(fontDataOff)]);
  result.writeUInt32BE(result.length, lenOff);
  return result;
}

// ────────────────────────────────────────────────────────────────
//  MAIN ENDPOINT
// ────────────────────────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  try {
    const { icons, fontName = 'Icon786Font', startUnicode = 0xe000 } = req.body;
    if (!icons || !Array.isArray(icons) || icons.length === 0) {
      return res.status(400).json({ error: 'No icons provided' });
    }

    const allowed = icons.filter((iconId) => {
      const colon = String(iconId).indexOf(':');
      if (colon < 1) return false;
      return isPermissivePrefix(String(iconId).slice(0, colon));
    });
    if (!allowed.length) {
      return res.status(403).json({ error: 'No icons from the commercial-safe catalog were provided.' });
    }

    console.log(`\nGenerating "${fontName}" with ${allowed.length} icons (render+trace)…`);

    // 1. Fetch SVGs (force black color so strokes & fills both render solid)
    const iconData = await Promise.all(
      allowed.slice(0, 100).map(async (iconId, idx) => {
        const colon = iconId.indexOf(':');
        const prefix = iconId.slice(0, colon);
        const name = iconId.slice(colon + 1);
        const unicode = startUnicode + idx;
        const cssClass = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const unicodeStr = unicode.toString(16).toUpperCase();
        try {
          const svgStr = localIcons.getIconSVG(prefix, name, {
            color: '#000000',
            width: RENDER_SIZE,
            height: RENDER_SIZE,
          });
          if (!svgStr) throw new Error('Icon not found');
          return { iconId, prefix, name, unicode, cssClass, unicodeStr, svgStr, ok: true };
        } catch (e) {
          console.warn(`  ✗ load ${iconId}: ${e.message}`);
          return { iconId, ok: false };
        }
      })
    );

    const fetched = iconData.filter((d) => d.ok && d.svgStr);
    console.log(`  ${fetched.length}/${icons.length} SVGs fetched`);
    if (!fetched.length) return res.status(400).json({ error: 'No icons could be fetched' });

    // 2. Render + trace each → build glyphs
    const glyphs = [
      new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: UPM, path: new opentype.Path() }),
    ];

    const valid = [];
    for (const item of fetched) {
      try {
        const d = await svgToTracedPathD(item.svgStr);
        const glyphPath = tracedPathToGlyph(d);
        if (glyphPath.commands.length === 0) {
          console.warn(`  ⚠ empty glyph: ${item.name}`);
        }
        glyphs.push(new opentype.Glyph({
          name: item.cssClass,
          unicode: item.unicode,
          advanceWidth: UPM,
          path: glyphPath,
        }));
        valid.push(item);
      } catch (e) {
        console.warn(`  ✗ trace ${item.name}: ${e.message}`);
      }
    }
    console.log(`  ${valid.length} glyphs traced & built`);
    if (!valid.length) return res.status(400).json({ error: 'No glyphs could be generated' });

    // 3. Build font
    const font = new opentype.Font({
      familyName: fontName, styleName: 'Regular',
      unitsPerEm: UPM, ascender: ASCENT, descender: -DESCENT, glyphs,
    });
    const ttfBuffer = Buffer.from(font.toArrayBuffer());
    let woffBuffer = null;
    try { woffBuffer = ttfToWoff(ttfBuffer); } catch (e) { console.warn('WOFF skip:', e.message); }
    console.log(`  TTF ${ttfBuffer.length}B · WOFF ${woffBuffer?.length || 0}B`);

    const ttfB64 = ttfBuffer.toString('base64');
    const woffB64 = woffBuffer ? woffBuffer.toString('base64') : ttfB64;
    const lc = fontName.toLowerCase();

    // 4. CSS (references hosted font files)
    const css = `/* ${fontName} — Generated by Icon786 — World's Largest Free Icon Library */

@font-face {
  font-family: '${fontName}';
  src: url('${fontName}.woff') format('woff'),
       url('${fontName}.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

[class^="${lc}-"], [class*=" ${lc}-"] {
  font-family: '${fontName}' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  display: inline-block;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${valid.map((d) => `.${lc}-${d.cssClass}:before { content: "\\${d.unicodeStr}"; }`).join('\n')}
`;

    // 5. Self-contained HTML demo (fonts embedded base64 — opens offline)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${fontName} — Icon786 Icon Font</title>
<style>
@font-face {
  font-family: '${fontName}';
  src: url('data:font/woff;base64,${woffB64}') format('woff'),
       url('data:font/truetype;base64,${ttfB64}') format('truetype');
  font-weight: normal; font-style: normal; font-display: block;
}
[class^="${lc}-"],[class*=" ${lc}-"]{font-family:'${fontName}' !important;speak:never;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;display:inline-block;-webkit-font-smoothing:antialiased}
${valid.map((d) => `.${lc}-${d.cssClass}:before{content:"\\${d.unicodeStr}"}`).join('\n')}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#F5F4F2;color:#1C1C1E;padding:40px 32px;min-height:100vh}
header{margin-bottom:36px}
h1{font-size:32px;font-weight:800;margin-bottom:6px}h1 em{color:#E8395A;font-style:normal}
.meta{color:#6B7280;font-size:14px;line-height:1.7}
.badge{display:inline-flex;align-items:center;gap:6px;background:#fff0f3;color:#E8395A;border:1px solid #ffc6d3;border-radius:99px;padding:4px 14px;font-size:12px;font-weight:600;margin-top:12px}
.search-box{margin:26px 0 18px;max-width:400px}
.search-box input{width:100%;padding:12px 16px;border:1.5px solid #e5e7eb;border-radius:14px;font-size:14px;outline:none;font-family:inherit;background:#fff}
.search-box input:focus{border-color:#E8395A;box-shadow:0 0 0 3px rgba(232,57,90,.1)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:14px}
.item{background:#fff;border-radius:16px;padding:22px 14px 14px;text-align:center;border:1px solid #f3f4f6;transition:all .2s}
.item:hover{border-color:#ffc6d3;transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,57,90,.1)}
.item.hide{display:none}
.glyph{font-size:40px;color:#E8395A;display:block;margin-bottom:10px;line-height:1;min-height:48px}
.iname{font-size:10px;color:#6B7280;word-break:break-all;line-height:1.5}
.uni{font-size:9px;color:#9CA3AF;font-family:monospace;margin-top:3px}
.copy-btn{display:inline-block;margin-top:8px;padding:3px 8px;background:#f3f4f6;border-radius:5px;font-size:10px;cursor:pointer;color:#6B7280;border:1px solid #e5e7eb;font-family:monospace;transition:all .15s}
.copy-btn:hover{background:#fff0f3;border-color:#ffc6d3;color:#E8395A}
.empty{display:none;text-align:center;padding:60px;color:#9CA3AF}
.empty.show{display:block}
.usage{background:#fff;border-radius:18px;padding:24px;margin:32px 0;border:1px solid #f3f4f6}
.usage h2{font-size:16px;font-weight:700;margin-bottom:14px}
.steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.step{background:#f9fafb;border-radius:10px;padding:14px}
.step-label{font-size:10px;font-weight:700;color:#E8395A;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.step p{font-size:12px;color:#4B5563;line-height:1.5}
code{background:#F5F4F2;padding:1px 5px;border-radius:3px;font-size:11px;color:#E8395A}
footer{margin-top:52px;text-align:center;color:#9CA3AF;font-size:12px}
footer a{color:#E8395A;text-decoration:none}
</style>
</head>
<body>
<header>
  <h1>${fontName} <em>Icon Font</em></h1>
  <div class="meta">
    <div>Generated by <strong>Icon786</strong> — World's Largest Free Icon Library</div>
    <div>${valid.length} icons · Unicode U+${valid[0]?.unicodeStr}–U+${valid[valid.length - 1]?.unicodeStr}</div>
  </div>
  <div class="badge">✓ Fonts embedded · Works offline</div>
</header>

<div class="usage">
  <h2>How to use in your project</h2>
  <div class="steps">
    <div class="step"><div class="step-label">1 — Add CSS</div><p>Link <code>${fontName}.css</code> in your HTML <code>&lt;head&gt;</code></p></div>
    <div class="step"><div class="step-label">2 — Copy font files</div><p>Put <code>${fontName}.ttf</code> & <code>${fontName}.woff</code> beside your CSS</p></div>
    <div class="step"><div class="step-label">3 — Use classes</div><p>Add an icon: <code>&lt;i class="${lc}-NAME"&gt;&lt;/i&gt;</code></p></div>
    <div class="step"><div class="step-label">Tip</div><p>In CSS: <code>content:"\\E000"</code> (see code under each icon)</p></div>
  </div>
</div>

<div class="search-box"><input type="text" placeholder="Filter icons by name…" oninput="filter(this.value)"></div>

<div class="grid" id="grid">
${valid.map((d) => `<div class="item" data-n="${d.name} ${d.cssClass}">
  <span class="glyph ${lc}-${d.cssClass}"></span>
  <div class="iname">${d.name}</div>
  <div class="uni">U+${d.unicodeStr}</div>
  <button class="copy-btn" onclick="cp('.${lc}-${d.cssClass}',this)">copy class</button>
</div>`).join('\n')}
</div>
<div class="empty" id="empty">No icons match your search</div>

<footer><p>Made with ♥ by <a href="https://icon786.vercel.app">Icon786</a> · Fonts embedded — no internet needed</p></footer>

<script>
function filter(q){let n=0;document.querySelectorAll('.item').forEach(el=>{const s=el.dataset.n.toLowerCase().includes(q.toLowerCase());el.classList.toggle('hide',!s);if(s)n++;});document.getElementById('empty').classList.toggle('show',n===0&&q.length>0);}
function cp(t,b){navigator.clipboard.writeText(t).then(()=>{const o=b.textContent;b.textContent='✓ copied';b.style.cssText='background:#f0fdf4;border-color:#bbf7d0;color:#166534';setTimeout(()=>{b.textContent=o;b.style.cssText=''},1500);});}
</script>
</body>
</html>`;

    // 6. Manifest + README
    const manifest = {
      name: fontName, generatedAt: new Date().toISOString(),
      generator: 'Icon786 — World\'s Largest Free Icon Library',
      method: 'render+trace (potrace)',
      totalIcons: valid.length, unitsPerEm: UPM, ascender: ASCENT, descender: -DESCENT,
      icons: valid.map((d) => ({
        id: d.iconId, name: d.name, cssClass: `${lc}-${d.cssClass}`,
        unicode: `U+${d.unicodeStr}`, htmlEntity: `&#x${d.unicodeStr};`, cssContent: `\\${d.unicodeStr}`,
      })),
    };

    const readme = `# ${fontName} — Icon Font by Icon786

## Files
| File | Description |
|------|-------------|
| \`${fontName}.ttf\` | TrueType font |
| \`${fontName}.woff\` | WOFF web font |
| \`${fontName}.css\` | @font-face + icon classes |
| \`${fontName}-demo.html\` | Self-contained demo (fonts embedded, opens offline) |
| \`${fontName}-manifest.json\` | Icon metadata |

## Usage
\`\`\`html
<link rel="stylesheet" href="${fontName}.css">
<i class="${lc}-NAME"></i>
\`\`\`

## Icons (${valid.length})
${valid.map((d) => `- .${lc}-${d.cssClass} → U+${d.unicodeStr}`).join('\n')}
`;

    // 7. Stream ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fontName}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (e) => { throw e; });
    archive.pipe(res);
    archive.append(ttfBuffer, { name: `${fontName}.ttf` });
    if (woffBuffer) archive.append(woffBuffer, { name: `${fontName}.woff` });
    archive.append(css, { name: `${fontName}.css` });
    archive.append(html, { name: `${fontName}-demo.html` });
    archive.append(JSON.stringify(manifest, null, 2), { name: `${fontName}-manifest.json` });
    archive.append(readme, { name: 'README.md' });
    await archive.finalize();

    console.log(`✓ "${fontName}" done — ${valid.length} icons`);
  } catch (e) {
    console.error('Font error:', e);
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

module.exports = router;
