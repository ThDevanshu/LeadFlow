import type { FollowUp, Lead } from '../types'

export function agentName(agents: { id: string; name: string }[], id: string): string {
  if (!id) return 'Unassigned'
  return agents.find((agent) => agent.id === id)?.name ?? 'Unassigned'
}

export function nextDueAt(lead: Pick<Lead, 'id' | 'nextFollowUpAt'>, followUps: FollowUp[]): string | null {
  const pending = followUps
    .filter((item) => item.leadId === lead.id && item.status === 'pending')
    .map((item) => item.dueAt)
    .sort()
  return pending[0] ?? lead.nextFollowUpAt
}

export function propertyTitle(properties: { id: string; title: string }[], id: string | null): string {
  if (!id) return 'No property linked'
  return properties.find((property) => property.id === id)?.title ?? 'Listing unavailable'
}
