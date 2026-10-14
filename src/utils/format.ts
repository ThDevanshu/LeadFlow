import type { Lead } from '../types'

export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, '').replace(/(\.\d)0$/, '$1')
}

export function formatInrCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_00_00_000) {
    const crore = abs / 1_00_00_000
    const digits = crore >= 10 ? 1 : 2
    return `${sign}₹${trimTrailingZero(crore.toFixed(digits))} Cr`
  }
  if (abs >= 1_00_000) {
    const lakh = abs / 1_00_000
    const digits = lakh >= 10 ? 1 : 2
    return `${sign}₹${trimTrailingZero(lakh.toFixed(digits))} L`
  }
  return formatInr(value)
}

export function formatBudgetRange(min: number, max: number): string {
  return `${formatInrCompact(min)} – ${formatInrCompact(max)}`
}

export function budgetMidpoint(lead: Pick<Lead, 'budgetMin' | 'budgetMax'>): number {
  return (lead.budgetMin + lead.budgetMax) / 2
}

export function formatArea(sqFt: number): string {
  return `${new Intl.NumberFormat('en-IN').format(sqFt)} sq ft`
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  return `${(Math.round(value * 1000) / 10).toFixed(1)}%`
}

export function formatDurationHours(hours: number | null): string {
  if (hours === null || Number.isNaN(hours)) return '—'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`
  if (hours < 48) return `${(Math.round(hours * 10) / 10).toFixed(1)} hrs`
  return `${(Math.round((hours / 24) * 10) / 10).toFixed(1)} days`
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}
