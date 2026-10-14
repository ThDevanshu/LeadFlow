import { isBefore, isSameDay, startOfDay } from 'date-fns'
import type { DateFormat } from '../../types'
import { formatDateTime } from '../../utils/dates'

export function DueLabel({ iso, dateFormat }: { iso: string | null; dateFormat: DateFormat }) {
  if (!iso) return <span className="text-slate-400">Not scheduled</span>
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return <span className="text-slate-400">Invalid date</span>
  const now = new Date()
  const beforeToday = isBefore(date, startOfDay(now))
  const today = isSameDay(date, now)
  const timePassed = today && isBefore(date, now)
  const tone = beforeToday ? 'font-medium text-rose-700' : today ? 'font-medium text-amber-800' : 'text-slate-700'
  const suffix = beforeToday ? ' · Overdue' : timePassed ? ' · Time passed' : today ? ' · Today' : ''
  return (
    <span className={tone}>
      {formatDateTime(iso, dateFormat)}
      {suffix}
    </span>
  )
}
