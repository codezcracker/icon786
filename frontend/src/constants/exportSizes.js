/** Preset export dimensions (longest edge in pixels). */
export const EXPORT_SIZE_PRESETS = [16, 24, 32, 48, 64, 128, 256, 512, 1024, 2048];

export const DEFAULT_EXPORT_SIZE = 512;

export function buildExportOpts({ maxSize, padding = 0, width = '', height = '', background = null }) {
  return {
    maxSize,
    padding,
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
    background,
  };
}
