import { EXPORT_SIZE_PRESETS } from '../constants/exportSizes';

/**
 * File size & padding controls shown before PNG/JPG/WebP/SVG export.
 */
export default function ExportOptions({
  maxSize,
  onMaxSizeChange,
  padding = 0,
  onPaddingChange,
  width = '',
  onWidthChange,
  height = '',
  onHeightChange,
  showCustomSize = true,
  showPadding = true,
}) {
  const useCustom = Boolean(width || height);

  return (
    <div className="export-options">
      <label className="form-label">File size (px)</label>
      <p className="export-options__hint">Longest edge of the exported image.</p>
      <div className="select-wrap" style={{ marginBottom: 12 }}>
        <select
          value={maxSize}
          onChange={(e) => onMaxSizeChange(Number(e.target.value))}
          className="input"
          disabled={useCustom}
        >
          {EXPORT_SIZE_PRESETS.map((s) => (
            <option key={s} value={s}>
              {s} px{s === 512 ? ' (recommended)' : ''}
            </option>
          ))}
        </select>
        <span className="select-chevron">▾</span>
      </div>

      {showCustomSize && onWidthChange && onHeightChange && (
        <>
          <label className="form-label">Custom width × height (optional)</label>
          <p className="export-options__hint">
            Overrides the preset above. Leave empty to use file size only.
          </p>
          <div className="export-options__row">
            <input
              type="number"
              min={1}
              max={4096}
              placeholder="Width"
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              className="input"
            />
            <span className="export-options__times">×</span>
            <input
              type="number"
              min={1}
              max={4096}
              placeholder="Height"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              className="input"
            />
          </div>
        </>
      )}

      {showPadding && onPaddingChange && (
        <>
          <label className="form-label">Padding (px)</label>
          <input
            type="number"
            min={0}
            max={256}
            value={padding}
            onChange={(e) => onPaddingChange(Math.max(0, Number(e.target.value) || 0))}
            className="input"
            style={{ marginBottom: 12 }}
          />
        </>
      )}
    </div>
  );
}
