import type { Activity, AppState, FollowUp, Lead, LeadStatus } from '../types'
import { createSeedState } from '../data/seed'

export type Action =
  | { type: 'ADD_LEAD'; lead: Lead; followUp: FollowUp | null; activities: Activity[] }
  | { type: 'UPDATE_LEAD'; lead: Lead; followUp: FollowUp | null; activities: Activity[] }
  | { type: 'DELETE_LEAD'; id: string }
  | { type: 'BULK_UPDATE_LEADS'; ids: string[]; patch: Partial<Pick<Lead, 'status' | 'assignedTo' | 'priority'>>; activities: Activity[] }
  | { type: 'IMPORT_LEADS'; leads: Lead[]; followUps: FollowUp[]; activities: Activity[] }
  | { type: 'SET_LEAD_STATUS'; id: string; status: LeadStatus; activity: Activity; touchedAt: string }
  | { type: 'ADD_NOTE'; leadId: string; activity: Activity }
  | { type: 'ADD_FOLLOW_UP'; followUp: FollowUp; updateLeadNext: boolean; activity: Activity }
  | { type: 'UPDATE_FOLLOW_UP'; followUp: FollowUp; updateLeadNext: boolean; activity: Activity }
  | { type: 'COMPLETE_FOLLOW_UP'; id: string; completedAt: string; activity: Activity }
  | { type: 'DELETE_FOLLOW_UP'; id: string; activity: Activity }
  | { type: 'ADD_PROPERTY'; property: AppState['properties'][number] }
  | { type: 'UPDATE_PROPERTY'; property: AppState['properties'][number] }
  | { type: 'DELETE_PROPERTY'; id: string; activities: Activity[] }
  | { type: 'LINK_PROPERTY'; leadId: string; propertyId: string | null; activity: Activity }
  | { type: 'ADD_AGENT'; agent: AppState['agents'][number] }
  | { type: 'UPDATE_AGENT'; agent: AppState['agents'][number] }
  | { type: 'DELETE_AGENT'; id: string }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<AppState['settings']> }
  | { type: 'MARK_NOTIFICATIONS_READ'; ids: string[] }
  | { type: 'RESET_DEMO' }

function earliestPending(followUps: FollowUp[], leadId: string): string | null {
  const pending = followUps
    .filter((item) => item.leadId === leadId && item.status === 'pending')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  return pending[0]?.dueAt ?? null
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_LEAD':
      return {
        ...state,
        leads: [action.lead, ...state.leads],
        followUps: action.followUp ? [action.followUp, ...state.followUps] : state.followUps,
        activities: [...action.activities, ...state.activities],
      }
    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) => (lead.id === action.lead.id ? action.lead : lead)),
        followUps: action.followUp ? [action.followUp, ...state.followUps] : state.followUps,
        activities: [...action.activities, ...state.activities],
      }
    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter((lead) => lead.id !== action.id),
        followUps: state.followUps.filter((item) => item.leadId !== action.id),
        activities: state.activities.filter((item) => item.leadId !== action.id),
      }
    case 'BULK_UPDATE_LEADS': {
      const ids = new Set(action.ids)
      return {
        ...state,
        leads: state.leads.map((lead) => (ids.has(lead.id) ? { ...lead, ...action.patch } : lead)),
        activities: [...action.activities, ...state.activities],
      }
    }
    case 'IMPORT_LEADS':
      return {
        ...state,
        leads: [...action.leads, ...state.leads],
        followUps: [...action.followUps, ...state.followUps],
        activities: [...action.activities, ...state.activities],
      }
    case 'SET_LEAD_STATUS':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.id
            ? {
                ...lead,
                status: action.status,
                lastContactedAt: lead.lastContactedAt ?? action.touchedAt,
              }
            : lead,
        ),
        activities: [action.activity, ...state.activities],
      }
    case 'ADD_NOTE':
      return { ...state, activities: [action.activity, ...state.activities] }
    case 'ADD_FOLLOW_UP':
      return {
        ...state,
        followUps: [action.followUp, ...state.followUps],
        leads: state.leads.map((lead) =>
          lead.id === action.followUp.leadId && action.updateLeadNext
            ? { ...lead, nextFollowUpAt: action.followUp.dueAt }
            : lead,
        ),
        activities: [action.activity, ...state.activities],
      }
    case 'UPDATE_FOLLOW_UP':
      return {
        ...state,
        followUps: state.followUps.map((item) => (item.id === action.followUp.id ? action.followUp : item)),
        leads: state.leads.map((lead) =>
          lead.id === action.followUp.leadId && action.updateLeadNext
            ? { ...lead, nextFollowUpAt: action.followUp.dueAt }
            : lead,
        ),
        activities: [action.activity, ...state.activities],
      }
    case 'COMPLETE_FOLLOW_UP': {
      const current = state.followUps.find((item) => item.id === action.id)
      if (!current || current.status === 'completed') return state
      const followUps = state.followUps.map((item) =>
        item.id === action.id ? { ...item, status: 'completed' as const, completedAt: action.completedAt } : item,
      )
      return {
        ...state,
        followUps,
        leads: state.leads.map((lead) =>
          lead.id === current.leadId
            ? {
                ...lead,
                lastContactedAt: action.completedAt,
                nextFollowUpAt: earliestPending(followUps, lead.id),
              }
            : lead,
        ),
        activities: [action.activity, ...state.activities],
      }
    }
    case 'DELETE_FOLLOW_UP': {
      const current = state.followUps.find((item) => item.id === action.id)
      if (!current) return state
      const followUps = state.followUps.filter((item) => item.id !== action.id)
      return {
        ...state,
        followUps,
        leads: state.leads.map((lead) =>
          lead.id === current.leadId && lead.nextFollowUpAt === current.dueAt
            ? { ...lead, nextFollowUpAt: earliestPending(followUps, lead.id) }
            : lead,
        ),
        activities: [action.activity, ...state.activities],
      }
    }
    case 'ADD_PROPERTY':
      return { ...state, properties: [action.property, ...state.properties] }
    case 'UPDATE_PROPERTY':
      return {
        ...state,
        properties: state.properties.map((property) => (property.id === action.property.id ? action.property : property)),
      }
    case 'DELETE_PROPERTY':
      return {
        ...state,
        properties: state.properties.filter((property) => property.id !== action.id),
        leads: state.leads.map((lead) => (lead.propertyId === action.id ? { ...lead, propertyId: null } : lead)),
        activities: [...action.activities, ...state.activities],
      }
    case 'LINK_PROPERTY':
      return {
        ...state,
        leads: state.leads.map((lead) => (lead.id === action.leadId ? { ...lead, propertyId: action.propertyId } : lead)),
        activities: [action.activity, ...state.activities],
      }
    case 'ADD_AGENT':
      return { ...state, agents: [...state.agents, action.agent] }
    case 'UPDATE_AGENT':
      return { ...state, agents: state.agents.map((agent) => (agent.id === action.agent.id ? action.agent : agent)) }
    case 'DELETE_AGENT': {
      const remaining = state.agents.filter((agent) => agent.id !== action.id)
      const demoAgentId = state.settings.demoAgentId === action.id ? (remaining[0]?.id ?? '') : state.settings.demoAgentId
      return {
        ...state,
        agents: remaining,
        leads: state.leads.map((lead) => (lead.assignedTo === action.id ? { ...lead, assignedTo: '' } : lead)),
        followUps: state.followUps.map((item) => (item.assignedTo === action.id ? { ...item, assignedTo: '' } : item)),
        settings: { ...state.settings, demoAgentId },
      }
    }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch, currency: 'INR' } }
    case 'MARK_NOTIFICATIONS_READ': {
      const ids = [...new Set([...state.settings.notificationReadIds, ...action.ids])].slice(-300)
      return { ...state, settings: { ...state.settings, notificationReadIds: ids } }
    }
    case 'RESET_DEMO':
      return createSeedState()
    default:
      return state
  }
}
