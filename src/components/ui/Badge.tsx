import type { FollowUpStatus, LeadStatus, Priority, PropertyStatus } from '../../types'
import { cx } from '../../utils/cx'
import { FOLLOW_UP_STATUS_LABEL, PRIORITY_LABEL, PROPERTY_STATUS_LABEL, STATUS_LABEL } from '../../utils/labels'

const base = 'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset'

const statusClass: Record<LeadStatus, string> = {
  new: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  contacted: 'bg-sky-50 text-sky-800 ring-sky-200',
  qualified: 'bg-violet-50 text-violet-800 ring-violet-200',
  site_visit: 'bg-amber-50 text-amber-900 ring-amber-200',
  negotiation: 'bg-orange-50 text-orange-900 ring-orange-200',
  won: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  lost: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const priorityClass: Record<Priority, string> = {
  low: 'bg-slate-50 text-slate-600 ring-slate-200',
  medium: 'bg-blue-50 text-blue-800 ring-blue-200',
  high: 'bg-amber-50 text-amber-900 ring-amber-200',
  urgent: 'bg-rose-50 text-rose-800 ring-rose-200',
}

const propertyClass: Record<PropertyStatus, string> = {
  available: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  reserved: 'bg-amber-50 text-amber-900 ring-amber-200',
  sold: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={cx(base, statusClass[status])}>{STATUS_LABEL[status]}</span>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cx(base, priorityClass[priority])}>{PRIORITY_LABEL[priority]}</span>
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <span className={cx(base, propertyClass[status])}>{PROPERTY_STATUS_LABEL[status]}</span>
}

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  return (
    <span className={cx(base, status === 'completed' ? propertyClass.available : 'bg-sky-50 text-sky-800 ring-sky-200')}>
      {FOLLOW_UP_STATUS_LABEL[status]}
    </span>
  )
}
