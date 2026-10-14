import { formatDistanceToNow } from 'date-fns'
import type { FollowUp, Lead } from '../types'
import { isBeforeToday, isTodayDate } from './dates'

export type AppNotification = {
  id: string
  title: string
  body: string
  createdAt: string
  href: string
  tone: 'danger' | 'warning' | 'info' | 'success'
}

export function buildNotifications(leads: Lead[], followUps: FollowUp[], now = new Date()): AppNotification[] {
  const items: AppNotification[] = []

  for (const followUp of followUps) {
    if (followUp.status !== 'pending') continue
    const lead = leads.find((item) => item.id === followUp.leadId)
    const leadName = lead?.fullName ?? 'Unknown lead'
    if (isBeforeToday(followUp.dueAt, now)) {
      items.push({
        id: `overdue:${followUp.id}`,
        title: 'Overdue follow-up',
        body: `${followUp.title} · ${leadName}`,
        createdAt: followUp.dueAt,
        href: `/follow-ups?focus=${followUp.id}`,
        tone: 'danger',
      })
    } else if (isTodayDate(followUp.dueAt, now)) {
      items.push({
        id: `today:${followUp.id}`,
        title: 'Follow-up due today',
        body: `${followUp.title} · ${leadName}`,
        createdAt: followUp.dueAt,
        href: `/follow-ups?focus=${followUp.id}`,
        tone: 'warning',
      })
    }
  }

  const recentNew = [...leads]
    .filter((lead) => lead.status === 'new' && now.getTime() - new Date(lead.createdAt).getTime() <= 7 * 86_400_000)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  for (const lead of recentNew) {
    items.push({
      id: `new:${lead.id}`,
      title: 'New lead',
      body: `${lead.fullName} · ${lead.preferredLocation}`,
      createdAt: lead.createdAt,
      href: `/leads/${lead.id}`,
      tone: 'info',
    })
  }

  for (const followUp of followUps) {
    if (followUp.status !== 'completed' || !followUp.completedAt) continue
    if (now.getTime() - new Date(followUp.completedAt).getTime() > 3 * 86_400_000) continue
    const lead = leads.find((item) => item.id === followUp.leadId)
    items.push({
      id: `done:${followUp.id}`,
      title: 'Follow-up completed',
      body: `${followUp.title} · ${lead?.fullName ?? 'Lead'}`,
      createdAt: followUp.completedAt,
      href: `/follow-ups?focus=${followUp.id}`,
      tone: 'success',
    })
  }

  const rank = { danger: 0, warning: 1, info: 2, success: 3 }
  return items.sort((a, b) => rank[a.tone] - rank[b.tone] || b.createdAt.localeCompare(a.createdAt))
}

export function notificationTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}
