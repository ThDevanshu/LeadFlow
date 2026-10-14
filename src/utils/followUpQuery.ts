import { endOfDay, isAfter, startOfDay } from 'date-fns'
import type { FollowUp, FollowUpView, Priority } from '../types'
import { isBeforeToday, isTodayDate } from './dates'

export function matchesFollowUpView(item: FollowUp, view: FollowUpView, now = new Date()): boolean {
  if (view === 'all') return true
  if (view === 'completed') return item.status === 'completed'
  if (item.status !== 'pending') return false
  if (view === 'today') return isTodayDate(item.dueAt, now)
  if (view === 'overdue') return isBeforeToday(item.dueAt, now)
  return isAfter(new Date(item.dueAt), endOfDay(now))
}

export function filterFollowUps(
  followUps: FollowUp[],
  options: {
    view: FollowUpView
    priority: Priority | 'all'
    status: FollowUp['status'] | 'all'
    from: string
    to: string
    sortDir: 'asc' | 'desc'
  },
  now = new Date(),
): FollowUp[] {
  const from = options.from ? startOfDay(new Date(`${options.from}T00:00:00`)) : null
  const to = options.to ? endOfDay(new Date(`${options.to}T00:00:00`)) : null
  const filtered = followUps.filter((item) => {
    if (!matchesFollowUpView(item, options.view, now)) return false
    if (options.priority !== 'all' && item.priority !== options.priority) return false
    if (options.status !== 'all' && item.status !== options.status) return false
    const due = new Date(item.dueAt)
    if (from && !Number.isNaN(from.getTime()) && due < from) return false
    if (to && !Number.isNaN(to.getTime()) && due > to) return false
    return true
  })
  const factor = options.sortDir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => a.dueAt.localeCompare(b.dueAt) * factor)
}

export function viewForFollowUp(item: FollowUp, now = new Date()): FollowUpView {
  if (item.status === 'completed') return 'completed'
  if (isBeforeToday(item.dueAt, now)) return 'overdue'
  if (isTodayDate(item.dueAt, now)) return 'today'
  return 'upcoming'
}
