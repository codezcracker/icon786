/**
 * Export SVG icons: tight crop (minimal margin) without clipping strokes.
 */

export function parseViewBox(svgString) {
  const m = svgString.match(/viewBox=["']([^"']+)["']/i);
  if (!m) {
    const w = parseFloat(svgString.match(/\bwidth=["']([^"']+)["']/i)?.[1]) || 24;
    const h = parseFloat(svgString.match(/\bheight=["']([^"']+)["']/i)?.[1]) || 24;
    return { minX: 0, minY: 0, width: w, height: h };
  }
  const p = m[1].trim().split(/[\s,]+/).map(Number);
  return {
    minX: p[0] || 0,
    minY: p[1] || 0,
    width: p[2] || 24,
    height: p[3] || 24,
  };
}

const DRAWABLE = 'path,circle,rect,line,polyline,polygon,ellipse,text,use';

/** Union bounding boxes of drawable elements (more reliable than root getBBox). */
function measureContentBBox(svgEl) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  const addBox = (b) => {
    if (!b?.width || !b?.height) return;
    found = true;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  };

  svgEl.querySelectorAll(DRAWABLE).forEach((el) => {
    try {
      addBox(el.getBBox());
    } catch {
      /* skip */
    }
  });

  if (!found) {
    svgEl.querySelectorAll(':scope > g').forEach((g) => {
      try {
        addBox(g.getBBox());
      } catch {
        /* skip */
      }
    });
  }

  if (!found) {
    try {
      const b = svgEl.getBBox();
      if (b.width && b.height) {
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      }
    } catch {
      return null;
    }
    return null;
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Small bleed so strokes are not clipped (not large empty margins). */
function bboxWithStrokeBleed(bbox) {
  const maxDim = Math.max(bbox.width, bbox.height);
  const pad = Math.max(0.35, maxDim * 0.04);
  return {
    x: bbox.x - pad,
    y: bbox.y - pad,
    width: bbox.width + pad * 2,
    height: bbox.height + pad * 2,
  };
}

function emptyMarginRatio(originalVb, content) {
  const right = originalVb.minX + originalVb.width - (content.x + content.width);
  const bottom = originalVb.minY + originalVb.height - (content.y + content.height);
  const left = content.x - originalVb.minX;
  const top = content.y - originalVb.minY;
  const maxSide = Math.max(left, top, right, bottom, 0);
  return maxSide / Math.max(originalVb.width, originalVb.height);
}

/**
 * Tight crop: remove unused viewBox margin, keep a tiny stroke bleed.
 */
export function trimSvgToContent(svgString) {
  if (!svgString || typeof document === 'undefined') return svgString;

  const originalVb = parseViewBox(svgString);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.tagName !== 'svg' || doc.querySelector('parsererror')) return svgString;

  const NS = 'http://www.w3.org/2000/svg';
  const measure = document.createElementNS(NS, 'svg');
  measure.setAttribute('xmlns', NS);
  measure.setAttribute('width', '512');
  measure.setAttribute('height', '512');
  measure.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;overflow:visible';
  const clone = svg.cloneNode(true);
  clone.setAttribute('overflow', 'visible');
  measure.appendChild(clone);
  document.body.appendChild(measure);

  try {
    const content = measureContentBBox(clone);
    if (!content) return svgString;

    // Already tight (≤3% empty margin on any side) — leave as-is.
    if (emptyMarginRatio(originalVb, content) <= 0.03) return svgString;

    const tight = bboxWithStrokeBleed(content);
    clone.setAttribute(
      'viewBox',
      `${tight.x} ${tight.y} ${tight.width} ${tight.height}`
    );
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    clone.setAttribute('overflow', 'visible');
    return new XMLSerializer().serializeToString(clone);
  } catch {
    return svgString;
  } finally {
    measure.remove();
  }
}

function expandViewBox(svgString, padUnits) {
  if (!padUnits) return svgString;
  const vb = parseViewBox(svgString);
  return svgString.replace(
    /viewBox=["'][^"']*["']/i,
    `viewBox="${vb.minX - padUnits} ${vb.minY - padUnits} ${vb.width + padUnits * 2} ${vb.height + padUnits * 2}"`
  );
}

function injectBackgroundRect(svgString, fill) {
  if (!fill || fill === 'transparent') return svgString;
  const vb = parseViewBox(svgString);
  const rect = `<rect x="${vb.minX}" y="${vb.minY}" width="${vb.width}" height="${vb.height}" fill="${fill}"/>`;
  return svgString.replace(/(<svg[^>]*>)/i, `$1${rect}`);
}

function setSvgDimensions(svgString, outW, outH) {
  const vb = parseViewBox(svgString);
  return svgString.replace(/<svg([^>]*)>/i, (match, attrs) => {
    const a = attrs
      .replace(/\s(width|height)=["'][^"']*["']/gi, '')
      .replace(/\sviewBox=["'][^"']*["']/gi, '');
    return `<svg${a} width="${outW}" height="${outH}" viewBox="${vb.minX} ${vb.minY} ${vb.width} ${vb.height}" overflow="visible">`;
  });
}

/** Compute pixel size of icon content (longest edge = maxSize). */
export function resolveContentSize(vb, { maxSize = 512, width, height }) {
  if (width && height) {
    return { contentW: Number(width), contentH: Number(height) };
  }
  if (width) {
    const contentW = Number(width);
    return { contentW, contentH: Math.max(1, Math.round(contentW * (vb.height / vb.width))) };
  }
  if (height) {
    const contentH = Number(height);
    return { contentW: Math.max(1, Math.round(contentH * (vb.width / vb.height))), contentH };
  }
  const max = Number(maxSize) || 512;
  if (vb.width >= vb.height) {
    return { contentW: max, contentH: Math.max(1, Math.round(max * (vb.height / vb.width))) };
  }
  return {
    contentW: Math.max(1, Math.round(max * (vb.width / vb.height))),
    contentH: max,
  };
}

/**
 * @returns {{ svg, contentW, contentH, outW, outH, pad }}
 */
export function prepareSvgForExport(svgString, options = {}) {
  const {
    padding = 0,
    background = null,
    maxSize = 512,
    width,
    height,
    trim = true,
  } = options;

  const pad = Math.max(0, Number(padding) || 0);
  let svg = trim ? trimSvgToContent(svgString) : svgString;
  let vb = parseViewBox(svg);

  if (!vb.width || !vb.height || !Number.isFinite(vb.width) || !Number.isFinite(vb.height)) {
    svg = svgString;
    vb = parseViewBox(svg);
  }

  const { contentW, contentH } = resolveContentSize(vb, { maxSize, width, height });
  const outW = contentW + pad * 2;
  const outH = contentH + pad * 2;

  if (pad > 0 && contentW > 0) {
    const padUnits = (pad / contentW) * vb.width;
    svg = expandViewBox(svg, padUnits);
    vb = parseViewBox(svg);
  }

  svg = injectBackgroundRect(svg, background);
  svg = setSvgDimensions(svg, outW, outH);

  return { svg, contentW, contentH, outW, outH, pad };
}

function ensureSvgRoot(svgString) {
  if (!/xmlns=/i.test(svgString)) {
    return svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return svgString;
}

function rasterize(svgString, outW, outH, format, jpgBg) {
  const w = Math.max(1, Math.round(outW));
  const h = Math.max(1, Math.round(outH));

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas is not available'));
      return;
    }

    if (format === 'jpg') {
      ctx.fillStyle = jpgBg || '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    const img = new Image();
    const safeSvg = ensureSvgRoot(svgString);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(safeSvg)}`;

    const finish = () => {
      try {
        if (format !== 'jpg') ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const mime =
          format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Could not encode image (try SVG format)'));
          },
          mime,
          format === 'jpg' ? 0.95 : undefined
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onload = () => {
      if (img.decode) {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = () => reject(new Error('Failed to render SVG for export'));
    img.src = dataUrl;
  });
}

async function exportRaster(svgString, format, options = {}) {
  const bg = options.background;
  const rasterBg =
    format === 'jpg'
      ? bg && bg !== 'transparent'
        ? bg
        : '#ffffff'
      : bg && bg !== 'transparent'
        ? bg
        : null;

  const prepared = prepareSvgForExport(svgString, {
    ...options,
    background: rasterBg,
  });

  try {
    return await rasterize(
      prepared.svg,
      prepared.outW,
      prepared.outH,
      format,
      format === 'jpg' ? rasterBg : undefined
    );
  } catch (err) {
    if (options.trim !== false) {
      return exportRaster(svgString, format, { ...options, trim: false });
    }
    throw err;
  }
}

export async function exportSvgToPng(svgString, options = {}) {
  return exportRaster(svgString, 'png', {
    ...options,
    background: options.background && options.background !== 'transparent' ? options.background : null,
  });
}

export async function exportSvgToWebP(svgString, options = {}) {
  return exportRaster(svgString, 'webp', {
    ...options,
    background: options.background && options.background !== 'transparent' ? options.background : null,
  });
}

export async function exportSvgToJpg(svgString, options = {}) {
  const bg =
    options.background && options.background !== 'transparent'
      ? options.background
      : '#ffffff';
  return exportRaster(svgString, 'jpg', { ...options, background: bg });
}

export function exportSvgBlob(svgString, options = {}) {
  const bg =
    options.background && options.background !== 'transparent'
      ? options.background
      : null;
  const { svg } = prepareSvgForExport(svgString, { ...options, background: bg });
  return new Blob([svg], { type: 'image/svg+xml' });
}
