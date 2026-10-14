import {
  addDays,
  addHours,
  endOfDay,
  format,
  isBefore,
  isSameDay,
  startOfDay,
} from 'date-fns'
import type { DateFormat } from '../types'

export function atDayHour(daysFromToday: number, hour: number, minute = 0, now = new Date()): string {
  const date = addDays(startOfDay(now), daysFromToday)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export function daysAgo(days: number, hour: number, minute = 0, now = new Date()): string {
  return atDayHour(-days, hour, minute, now)
}

export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocal(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function sameMinute(a: string | null, b: string | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 60_000
}

export function formatDate(iso: string | null, pattern: DateFormat): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, pattern)
}

export function formatDateTime(iso: string | null, pattern: DateFormat): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, `${pattern}, h:mm a`)
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, 'h:mm a')
}

export function isBeforeToday(iso: string, now = new Date()): boolean {
  return isBefore(new Date(iso), startOfDay(now))
}

export function isTodayDate(iso: string, now = new Date()): boolean {
  return isSameDay(new Date(iso), now)
}

export function defaultFollowUpDue(daysAhead: number, now = new Date()): string {
  const date = addDays(now, Math.max(0, daysAhead))
  if (daysAhead === 0) return addHours(now, 1).toISOString()
  date.setHours(10, 0, 0, 0)
  return date.toISOString()
}

export function endOfToday(now = new Date()): Date {
  return endOfDay(now)
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date
}
