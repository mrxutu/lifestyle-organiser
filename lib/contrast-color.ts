function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)
  return [r, g, b]
}

// YIQ perceived-brightness formula — cheap, no-dependency way to pick
// readable text against an arbitrary background colour. Resolves to the
// theme's foreground/background tokens rather than pure black/white so it
// stays consistent with the rest of the muted palette (see DESIGN.md).
export function getContrastTextColor(backgroundHex: string): string {
  const [r, g, b] = hexToRgb(backgroundHex)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'var(--foreground)' : 'var(--background)'
}
