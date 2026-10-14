import type { FollowUp, Lead, LeadSortKey, LeadSource, LeadStatus, Priority, PropertyType, SortDirection } from '../types'
import { nextDueAt } from './records'

export type LeadFilters = {
  query: string
  status: LeadStatus | 'all'
  source: LeadSource | 'all'
  priority: Priority | 'all'
  agentId: string
  propertyType: PropertyType | 'all'
  sortKey: LeadSortKey
  sortDir: SortDirection
}

export function filterLeads(leads: Lead[], followUps: FollowUp[], filters: LeadFilters): Lead[] {
  const query = filters.query.trim().toLowerCase()
  const digits = query.replace(/\D/g, '')
  const filtered = leads.filter((lead) => {
    if (filters.status !== 'all' && lead.status !== filters.status) return false
    if (filters.source !== 'all' && lead.source !== filters.source) return false
    if (filters.priority !== 'all' && lead.priority !== filters.priority) return false
    if (filters.agentId !== 'all' && lead.assignedTo !== filters.agentId) return false
    if (filters.propertyType !== 'all' && lead.propertyType !== filters.propertyType) return false
    if (!query) return true
    const phoneDigits = lead.phone.replace(/\D/g, '')
    return (
      lead.fullName.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone.toLowerCase().includes(query) ||
      (digits.length >= 3 && phoneDigits.includes(digits))
    )
  })

  const factor = filters.sortDir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (filters.sortKey === 'nextFollowUp') {
      const aDue = nextDueAt(a, followUps)
      const bDue = nextDueAt(b, followUps)
      if (!aDue && !bDue) return 0
      if (!aDue) return 1
      if (!bDue) return -1
      return aDue.localeCompare(bDue) * factor
    }
    if (filters.sortKey === 'name') return a.fullName.localeCompare(b.fullName) * factor
    if (filters.sortKey === 'budget') return (a.budgetMax - b.budgetMax) * factor
    return a.createdAt.localeCompare(b.createdAt) * factor
  })
}
