import { useState, useEffect } from 'react';
import { apiUrl } from '../utils/api';
import { getCachedSvg, fetchIconBatch } from '../utils/iconSearch';

const svgCache = new Map();

async function loadSvg(icon, retries = 2) {
  if (!icon || typeof icon !== 'string' || !icon.includes(':')) return null;
  if (svgCache.has(icon)) return svgCache.get(icon);

  const cached = getCachedSvg(icon);
  if (cached) {
    svgCache.set(icon, cached);
    return cached;
  }

  const colon = icon.indexOf(':');
  const prefix = icon.slice(0, colon);
  const name = icon.slice(colon + 1);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        apiUrl(`/api/icons/svg/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}`)
      );
      if (res.ok) {
        const text = await res.text();
        svgCache.set(icon, text);
        return text;
      }
    } catch {
      /* retry */
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  return null;
}

/**
 * Icon786 icon component — loads SVG from your server (/api/icons/svg/...).
 * Usage: <Icon icon="mdi:home" style={{ fontSize: 24 }} />
 */
export default function Icon({ icon, svgContent, style, className = '', ...rest }) {
  const [svg, setSvg] = useState(() => svgContent || (icon ? svgCache.get(icon) : null));

  useEffect(() => {
    if (svgContent) {
      setSvg(svgContent);
      return;
    }
    if (!icon || typeof icon !== 'string' || !icon.includes(':')) {
      setSvg(null);
      return;
    }
    if (svgCache.has(icon)) {
      setSvg(svgCache.get(icon));
      return;
    }
    const cached = getCachedSvg(icon);
    if (cached) {
      svgCache.set(icon, cached);
      setSvg(cached);
      return;
    }

    let cancelled = false;
    loadSvg(icon).then((text) => {
      if (!cancelled && text) setSvg(text);
    });

    return () => { cancelled = true; };
  }, [icon, svgContent]);

  const mergedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    verticalAlign: '-0.125em',
    ...style,
  };

  if (!svg) {
    return (
      <span
        className={`icon786 ${className}`.trim()}
        style={mergedStyle}
        aria-hidden
        {...rest}
      />
    );
  }

  return (
    <span
      className={`icon786 ${className}`.trim()}
      style={mergedStyle}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden
      {...rest}
    />
  );
}

export { fetchIconBatch, loadSvg };
