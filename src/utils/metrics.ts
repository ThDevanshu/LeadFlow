import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
  isWithinInterval,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import type { Activity, Agent, DateRange, FollowUp, Lead, LeadSource, LeadStatus } from '../types'
import { LEAD_SOURCES, LEAD_STATUSES } from '../types'
import { budgetMidpoint } from './format'
import { isBeforeToday } from './dates'
import { SOURCE_LABEL, STATUS_LABEL } from './labels'

export function inRange(iso: string, range: DateRange): boolean {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false
  return isWithinInterval(date, { start: range.from, end: range.to })
}

export function conversionRate(leads: Lead[]): number | null {
  if (leads.length === 0) return null
  return leads.filter((lead) => lead.status === 'won').length / leads.length
}

export function decidedCloseRate(leads: Lead[]): number | null {
  const decided = leads.filter((lead) => lead.status === 'won' || lead.status === 'lost')
  if (decided.length === 0) return null
  return decided.filter((lead) => lead.status === 'won').length / decided.length
}

export function pipelineValue(leads: Lead[]): number {
  return leads
    .filter((lead) => lead.status !== 'won' && lead.status !== 'lost')
    .reduce((sum, lead) => sum + budgetMidpoint(lead), 0)
}

export function wonBudgetValue(leads: Lead[]): number {
  return leads.filter((lead) => lead.status === 'won').reduce((sum, lead) => sum + budgetMidpoint(lead), 0)
}

export function countByStatus(leads: Lead[]): { status: LeadStatus; label: string; count: number; value: number }[] {
  return LEAD_STATUSES.map((status) => {
    const matching = leads.filter((lead) => lead.status === status)
    return {
      status,
      label: STATUS_LABEL[status],
      count: matching.length,
      value: matching.reduce((sum, lead) => sum + budgetMidpoint(lead), 0),
    }
  })
}

export function countBySource(leads: Lead[]): { source: LeadSource; label: string; count: number }[] {
  return LEAD_SOURCES.map((source) => ({
    source,
    label: SOURCE_LABEL[source],
    count: leads.filter((lead) => lead.source === source).length,
  })).filter((item) => item.count > 0)
}

export function conversionBySource(leads: Lead[]): { source: string; rate: number; won: number; total: number }[] {
  return LEAD_SOURCES.map((source) => {
    const matching = leads.filter((lead) => lead.source === source)
    const won = matching.filter((lead) => lead.status === 'won').length
    return {
      source: SOURCE_LABEL[source],
      rate: matching.length === 0 ? 0 : Math.round((won / matching.length) * 1000) / 10,
      won,
      total: matching.length,
    }
  }).filter((item) => item.total > 0)
}

export function leadsCreatedByWeek(leads: Lead[], weeks = 8, now = new Date()): { label: string; leads: number }[] {
  const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 })
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const weekStart = addWeeks(start, index)
    return { label: format(weekStart, 'd MMM'), count: 0, index }
  })
  for (const lead of leads) {
    const index = differenceInCalendarWeeks(new Date(lead.createdAt), start, { weekStartsOn: 1 })
    const bucket = buckets[index]
    if (bucket) bucket.count += 1
  }
  return buckets.map((bucket) => ({ label: bucket.label, leads: bucket.count }))
}

export function leadsCreatedOverTime(leads: Lead[], range: DateRange): { label: string; leads: number }[] {
  const days = Math.max(1, differenceInCalendarDays(range.to, range.from) + 1)
  if (days <= 21) {
    return Array.from({ length: days }, (_, index) => {
      const day = addDays(startOfDay(range.from), index)
      const next = addDays(day, 1)
      const count = leads.filter((lead) => {
        const created = new Date(lead.createdAt)
        return created >= day && created < next
      }).length
      return { label: format(day, 'd MMM'), leads: count }
    })
  }

  const weekStart = startOfWeek(range.from, { weekStartsOn: 1 })
  const buckets: { label: string; start: Date; leads: number }[] = []
  for (let cursor = weekStart; cursor <= range.to; cursor = addWeeks(cursor, 1)) {
    buckets.push({ label: format(cursor, 'd MMM'), start: cursor, leads: 0 })
  }
  for (const lead of leads) {
    const created = new Date(lead.createdAt)
    if (!isWithinInterval(created, { start: range.from, end: range.to })) continue
    const index = differenceInCalendarWeeks(created, weekStart, { weekStartsOn: 1 })
    const bucket = buckets[index]
    if (bucket) bucket.leads += 1
  }
  return buckets.map(({ label, leads: count }) => ({ label, leads: count }))
}

export function averageResponseHours(leads: Lead[], activities: Activity[]): number | null {
  const samples: number[] = []
  for (const lead of leads) {
    const created = new Date(lead.createdAt).getTime()
    const firstContact = activities
      .filter(
        (activity) =>
          activity.leadId === lead.id &&
          (activity.type === 'status_change' || activity.type === 'note' || activity.type === 'follow_up_completed'),
      )
      .map((activity) => new Date(activity.createdAt).getTime())
      .filter((time) => time >= created)
      .sort((a, b) => a - b)[0]
    if (firstContact === undefined) continue
    samples.push((firstContact - created) / 3_600_000)
  }
  if (samples.length === 0) return null
  return samples.reduce((sum, value) => sum + value, 0) / samples.length
}

export function followUpCompletionRate(followUps: FollowUp[]): number | null {
  if (followUps.length === 0) return null
  return followUps.filter((item) => item.status === 'completed').length / followUps.length
}

export function overdueFollowUps(followUps: FollowUp[], now = new Date()): FollowUp[] {
  return followUps.filter((item) => item.status === 'pending' && isBeforeToday(item.dueAt, now))
}

export type AgentStat = {
  agentId: string
  name: string
  leads: number
  open: number
  won: number
  lost: number
  followUpsCompleted: number
  followUpsDue: number
}

export function agentPerformance(
  agents: Agent[],
  leads: Lead[],
  followUps: FollowUp[],
): AgentStat[] {
  const rows: AgentStat[] = agents.map((agent) => {
    const assigned = leads.filter((lead) => lead.assignedTo === agent.id)
    const due = followUps.filter((item) => item.assignedTo === agent.id)
    return {
      agentId: agent.id,
      name: agent.name,
      leads: assigned.length,
      open: assigned.filter((lead) => lead.status !== 'won' && lead.status !== 'lost').length,
      won: assigned.filter((lead) => lead.status === 'won').length,
      lost: assigned.filter((lead) => lead.status === 'lost').length,
      followUpsCompleted: due.filter((item) => item.status === 'completed').length,
      followUpsDue: due.length,
    }
  })

  const unassignedLeads = leads.filter((lead) => !agents.some((agent) => agent.id === lead.assignedTo))
  if (unassignedLeads.length > 0) {
    const due = followUps.filter((item) => !agents.some((agent) => agent.id === item.assignedTo))
    rows.push({
      agentId: '',
      name: 'Unassigned',
      leads: unassignedLeads.length,
      open: unassignedLeads.filter((lead) => lead.status !== 'won' && lead.status !== 'lost').length,
      won: unassignedLeads.filter((lead) => lead.status === 'won').length,
      lost: unassignedLeads.filter((lead) => lead.status === 'lost').length,
      followUpsCompleted: due.filter((item) => item.status === 'completed').length,
      followUpsDue: due.length,
    })
  }

  return rows
}

export function wonInPeriod(leads: Lead[], activities: Activity[], range: DateRange): number {
  const ids = new Set<string>()
  for (const activity of activities) {
    if (activity.type === 'status_change' && activity.statusTo === 'won' && inRange(activity.createdAt, range)) {
      ids.add(activity.leadId)
    }
  }
  for (const lead of leads) {
    if (lead.status === 'won' && inRange(lead.createdAt, range) && !activities.some((activity) => activity.leadId === lead.id && activity.statusTo === 'won')) {
      ids.add(lead.id)
    }
  }
  return ids.size
}
