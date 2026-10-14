import type { PropertyType } from '../types'

const PALETTES: Record<PropertyType, { bg: string; ink: string; accent: string }> = {
  apartment: { bg: '#eef2ff', ink: '#312e81', accent: '#4338ca' },
  villa: { bg: '#f0fdfa', ink: '#134e4a', accent: '#0f766e' },
  plot: { bg: '#f7fee7', ink: '#365314', accent: '#4d7c0f' },
  commercial: { bg: '#f8fafc', ink: '#0f172a', accent: '#334155' },
  penthouse: { bg: '#f5f3ff', ink: '#4c1d95', accent: '#6d28d9' },
  independent_house: { bg: '#fff7ed', ink: '#7c2d12', accent: '#c2410c' },
}

function hash(value: string): number {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function propertyImageDataUri(id: string, type: PropertyType, title: string): string {
  const palette = PALETTES[type]
  const shift = hash(id) % 40
  const windows = Array.from({ length: 6 }, (_, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = 268 + col * 36
    const y = 150 + row * 42
    return `<rect x="${x}" y="${y}" width="18" height="24" fill="${index % 2 === shift % 2 ? palette.accent : 'transparent'}" stroke="${palette.accent}" stroke-width="1.5"/>`
  }).join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <rect width="640" height="400" fill="${palette.bg}"/>
    <rect x="0" y="318" width="640" height="82" fill="${palette.accent}" opacity="0.08"/>
    <g fill="none" stroke="${palette.accent}" stroke-width="2">
      <path d="M210 300 V132 L320 ${92 + (shift % 12)} L430 132 V300 Z"/>
      <rect x="248" y="132" width="144" height="168"/>
    </g>
    ${windows}
    <rect x="300" y="246" width="40" height="54" fill="${palette.bg}" stroke="${palette.accent}" stroke-width="2"/>
    <text x="32" y="48" fill="${palette.ink}" font-family="Segoe UI, sans-serif" font-size="20" font-weight="600">${escapeXml(title)}</text>
    <text x="32" y="74" fill="${palette.accent}" font-family="Segoe UI, sans-serif" font-size="13">${escapeXml(type.replaceAll('_', ' '))}</text>
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
