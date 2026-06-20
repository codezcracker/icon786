import { useState, useEffect } from 'react';
import { apiUrl } from '../utils/api';

const svgCache = new Map();

/**
 * Icon786 icon component — loads SVG from your server (/api/icons/svg/...).
 * Usage: <Icon icon="mdi:home" style={{ fontSize: 24 }} />
 */
export default function Icon({ icon, style, className = '', ...rest }) {
  const [svg, setSvg] = useState(() => (icon ? svgCache.get(icon) : null));

  useEffect(() => {
    if (!icon || typeof icon !== 'string' || !icon.includes(':')) {
      setSvg(null);
      return;
    }
    if (svgCache.has(icon)) {
      setSvg(svgCache.get(icon));
      return;
    }
    const colon = icon.indexOf(':');
    const prefix = icon.slice(0, colon);
    const name = icon.slice(colon + 1);
    let cancelled = false;

    fetch(apiUrl(`/api/icons/svg/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}`))
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (cancelled || !text) return;
        svgCache.set(icon, text);
        setSvg(text);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [icon]);

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
