import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type {
  Activity,
  AgentInput,
  AppState,
  FollowUp,
  FollowUpInput,
  Lead,
  LeadInput,
  LeadStatus,
  Priority,
  Property,
  PropertyInput,
} from '../types'
import { createSeedState } from '../data/seed'
import { loadState, saveState } from '../services/storage'
import { createId } from '../utils/ids'
import { FOLLOW_UP_TYPE_LABEL, PRIORITY_LABEL, STATUS_LABEL } from '../utils/labels'
import { reducer } from './reducer'

type AppContextValue = {
  state: AppState
  storageWarning: string | null
  addLead: (input: LeadInput) => void
  updateLead: (id: string, input: LeadInput) => void
  deleteLead: (id: string) => void
  bulkUpdateLeads: (ids: string[], patch: { status?: LeadStatus; assignedTo?: string }) => void
  importLeads: (inputs: LeadInput[]) => number
  setLeadStatus: (id: string, status: LeadStatus) => void
  setLeadPriority: (id: string, priority: Priority) => void
  addNote: (leadId: string, note: string) => void
  addFollowUp: (input: FollowUpInput, updateLeadNext: boolean) => void
  updateFollowUp: (id: string, input: FollowUpInput, updateLeadNext: boolean) => void
  completeFollowUp: (id: string) => void
  deleteFollowUp: (id: string) => void
  addProperty: (input: PropertyInput) => void
  updateProperty: (id: string, input: PropertyInput) => void
  deleteProperty: (id: string) => void
  linkLeadToProperty: (leadId: string, propertyId: string | null) => void
  addAgent: (input: AgentInput) => void
  updateAgent: (id: string, input: AgentInput) => void
  deleteAgent: (id: string) => void
  updateSettings: (patch: Partial<AppState['settings']>) => void
  markNotificationsRead: (ids: string[]) => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function initState(): AppState {
  return loadState() ?? createSeedState()
}

function actorName(state: AppState): string {
  return state.agents.find((agent) => agent.id === state.settings.demoAgentId)?.name ?? 'You'
}

function makeActivity(leadId: string, type: Activity['type'], message: string, statusTo?: LeadStatus): Activity {
  return {
    id: createId('act'),
    leadId,
    type,
    message,
    createdAt: new Date().toISOString(),
    ...(statusTo ? { statusTo } : {}),
  }
}

function makeFollowUp(input: FollowUpInput): FollowUp {
  return {
    id: createId('fu'),
    leadId: input.leadId,
    title: input.title.trim(),
    description: input.description.trim(),
    dueAt: input.dueAt,
    priority: input.priority,
    type: input.type,
    status: 'pending',
    assignedTo: input.assignedTo,
    completedAt: null,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)

  useEffect(() => {
    const saved = saveState(state)
    setStorageWarning(
      saved ? null : 'Changes could not be saved in this browser. They will last only until you refresh.',
    )
  }, [state])

  const api = useMemo<AppContextValue>(() => {
    const name = () => actorName(state)

    return {
      state,
      storageWarning,
      addLead: (input) => {
        const now = new Date().toISOString()
        const lead: Lead = {
          ...input,
          id: createId('lead'),
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          notes: input.notes.trim(),
          tags: input.tags,
          createdAt: now,
          lastContactedAt: input.status === 'new' ? null : now,
        }
        const activities = [
          makeActivity(lead.id, 'created', `${name()} added ${lead.fullName} from ${input.source.replaceAll('_', ' ')}.`),
        ]
        if (input.status !== 'new') {
          activities.push(
            makeActivity(
              lead.id,
              'status_change',
              `${name()} set the status to ${STATUS_LABEL[input.status]}.`,
              input.status,
            ),
          )
        }
        const followUp = input.nextFollowUpAt
          ? makeFollowUp({
              leadId: lead.id,
              title: `Follow up with ${lead.fullName}`,
              description: 'Scheduled from the lead form.',
              dueAt: input.nextFollowUpAt,
              priority: input.priority,
              type: 'call',
              assignedTo: input.assignedTo,
            })
          : null
        if (followUp) {
          activities.push(makeActivity(lead.id, 'follow_up_scheduled', `${name()} scheduled “${followUp.title}”.`))
        }
        dispatch({ type: 'ADD_LEAD', lead, followUp, activities })
      },
      updateLead: (id, input) => {
        const current = state.leads.find((lead) => lead.id === id)
        if (!current) return
        const existingPending = state.followUps
          .filter((item) => item.leadId === id && item.status === 'pending')
          .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
        const lead: Lead = {
          ...current,
          ...input,
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          notes: input.notes.trim(),
          nextFollowUpAt: input.nextFollowUpAt ?? existingPending[0]?.dueAt ?? null,
          lastContactedAt:
            current.status === 'new' && input.status !== 'new' && !current.lastContactedAt
              ? new Date().toISOString()
              : current.lastContactedAt,
        }
        const activities: Activity[] = []
        if (current.status !== input.status) {
          activities.push(
            makeActivity(
              id,
              'status_change',
              `${name()} changed status from ${STATUS_LABEL[current.status]} to ${STATUS_LABEL[input.status]}.`,
              input.status,
            ),
          )
        }
        if (current.assignedTo !== input.assignedTo) {
          const agent = state.agents.find((item) => item.id === input.assignedTo)
          activities.push(makeActivity(id, 'assigned', `${name()} assigned this lead to ${agent?.name ?? 'an agent'}.`))
        }
        if (current.priority !== input.priority) {
          activities.push(
            makeActivity(id, 'priority_change', `${name()} set priority to ${PRIORITY_LABEL[input.priority]}.`),
          )
        }
        if (current.propertyId !== input.propertyId) {
          const property = state.properties.find((item) => item.id === input.propertyId)
          activities.push(
            makeActivity(
              id,
              'property_linked',
              input.propertyId
                ? `${name()} linked ${property?.title ?? 'a property'}.`
                : `${name()} removed the linked property.`,
            ),
          )
        }
        if (activities.length === 0) {
          activities.push(makeActivity(id, 'edited', `${name()} updated the lead details.`))
        }
        const needsFollowUp =
          Boolean(input.nextFollowUpAt) &&
          !state.followUps.some(
            (item) =>
              item.leadId === id &&
              item.status === 'pending' &&
              Math.abs(new Date(item.dueAt).getTime() - new Date(input.nextFollowUpAt ?? '').getTime()) < 60_000,
          )
        const followUp = needsFollowUp
          ? makeFollowUp({
              leadId: id,
              title: `Follow up with ${lead.fullName}`,
              description: 'Scheduled from the lead form.',
              dueAt: input.nextFollowUpAt ?? new Date().toISOString(),
              priority: input.priority,
              type: 'call',
              assignedTo: input.assignedTo,
            })
          : null
        if (followUp) activities.push(makeActivity(id, 'follow_up_scheduled', `${name()} scheduled “${followUp.title}”.`))
        dispatch({ type: 'UPDATE_LEAD', lead, followUp, activities })
      },
      deleteLead: (id) => dispatch({ type: 'DELETE_LEAD', id }),
      bulkUpdateLeads: (ids, patch) => {
        const activities: Activity[] = []
        for (const id of ids) {
          const lead = state.leads.find((item) => item.id === id)
          if (!lead) continue
          if (patch.status && patch.status !== lead.status) {
            activities.push(
              makeActivity(
                id,
                'status_change',
                `${name()} changed status from ${STATUS_LABEL[lead.status]} to ${STATUS_LABEL[patch.status]}.`,
                patch.status,
              ),
            )
          }
          if (patch.assignedTo && patch.assignedTo !== lead.assignedTo) {
            const agent = state.agents.find((item) => item.id === patch.assignedTo)
            activities.push(makeActivity(id, 'assigned', `${name()} assigned this lead to ${agent?.name ?? 'an agent'}.`))
          }
        }
        dispatch({ type: 'BULK_UPDATE_LEADS', ids, patch, activities })
      },
      importLeads: (inputs) => {
        const now = new Date().toISOString()
        const leads: Lead[] = []
        const followUps: FollowUp[] = []
        const activities: Activity[] = []
        for (const input of inputs) {
          const lead: Lead = {
            ...input,
            id: createId('lead'),
            createdAt: now,
            lastContactedAt: input.status === 'new' ? null : now,
          }
          leads.push(lead)
          activities.push(makeActivity(lead.id, 'created', `${name()} imported ${lead.fullName}.`))
          if (input.status !== 'new') {
            activities.push(
              makeActivity(lead.id, 'status_change', `Imported with status ${STATUS_LABEL[input.status]}.`, input.status),
            )
          }
          if (input.nextFollowUpAt) {
            const followUp = makeFollowUp({
              leadId: lead.id,
              title: `Follow up with ${lead.fullName}`,
              description: 'Created from the CSV import.',
              dueAt: input.nextFollowUpAt,
              priority: input.priority,
              type: 'call',
              assignedTo: input.assignedTo,
            })
            followUps.push(followUp)
            activities.push(makeActivity(lead.id, 'follow_up_scheduled', `Scheduled “${followUp.title}” from import.`))
          }
        }
        dispatch({ type: 'IMPORT_LEADS', leads, followUps, activities })
        return leads.length
      },
      setLeadStatus: (id, status) => {
        const lead = state.leads.find((item) => item.id === id)
        if (!lead || lead.status === status) return
        dispatch({
          type: 'SET_LEAD_STATUS',
          id,
          status,
          touchedAt: new Date().toISOString(),
          activity: makeActivity(
            id,
            'status_change',
            `${name()} changed status from ${STATUS_LABEL[lead.status]} to ${STATUS_LABEL[status]}.`,
            status,
          ),
        })
      },
      setLeadPriority: (id, priority) => {
        const lead = state.leads.find((item) => item.id === id)
        if (!lead || lead.priority === priority) return
        dispatch({
          type: 'BULK_UPDATE_LEADS',
          ids: [id],
          patch: { priority },
          activities: [makeActivity(id, 'priority_change', `${name()} set priority to ${PRIORITY_LABEL[priority]}.`)],
        })
      },
      addNote: (leadId, note) => {
        const text = note.trim()
        if (!text) return
        dispatch({
          type: 'ADD_NOTE',
          leadId,
          activity: makeActivity(leadId, 'note', text),
        })
      },
      addFollowUp: (input, updateLeadNext) => {
        const followUp = makeFollowUp(input)
        dispatch({
          type: 'ADD_FOLLOW_UP',
          followUp,
          updateLeadNext,
          activity: makeActivity(
            input.leadId,
            'follow_up_scheduled',
            `${name()} scheduled a ${FOLLOW_UP_TYPE_LABEL[input.type].toLowerCase()}: ${followUp.title}.`,
          ),
        })
      },
      updateFollowUp: (id, input, updateLeadNext) => {
        const current = state.followUps.find((item) => item.id === id)
        if (!current) return
        const followUp: FollowUp = {
          ...current,
          ...input,
          title: input.title.trim(),
          description: input.description.trim(),
        }
        const rescheduled = current.dueAt !== input.dueAt
        dispatch({
          type: 'UPDATE_FOLLOW_UP',
          followUp,
          updateLeadNext,
          activity: makeActivity(
            input.leadId,
            rescheduled ? 'follow_up_rescheduled' : 'edited',
            rescheduled ? `${name()} rescheduled “${followUp.title}”.` : `${name()} updated “${followUp.title}”.`,
          ),
        })
      },
      completeFollowUp: (id) => {
        const current = state.followUps.find((item) => item.id === id)
        if (!current || current.status === 'completed') return
        dispatch({
          type: 'COMPLETE_FOLLOW_UP',
          id,
          completedAt: new Date().toISOString(),
          activity: makeActivity(current.leadId, 'follow_up_completed', `${name()} completed “${current.title}”.`),
        })
      },
      deleteFollowUp: (id) => {
        const current = state.followUps.find((item) => item.id === id)
        if (!current) return
        dispatch({
          type: 'DELETE_FOLLOW_UP',
          id,
          activity: makeActivity(current.leadId, 'edited', `${name()} deleted the follow-up “${current.title}”.`),
        })
      },
      addProperty: (input) => {
        const id = createId('prop')
        const property: Property = {
          ...input,
          id,
          title: input.title.trim(),
          location: input.location.trim(),
          description: input.description.trim(),
          imageUrl: input.imageUrl.trim(),
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: 'ADD_PROPERTY', property })
      },
      updateProperty: (id, input) => {
        const current = state.properties.find((property) => property.id === id)
        if (!current) return
        dispatch({
          type: 'UPDATE_PROPERTY',
          property: {
            ...current,
            ...input,
            title: input.title.trim(),
            location: input.location.trim(),
            description: input.description.trim(),
            imageUrl: input.imageUrl.trim(),
          },
        })
      },
      deleteProperty: (id) => {
        const property = state.properties.find((item) => item.id === id)
        const activities = state.leads
          .filter((lead) => lead.propertyId === id)
          .map((lead) =>
            makeActivity(lead.id, 'property_linked', `${property?.title ?? 'A listing'} was removed, so this lead is no longer linked.`),
          )
        dispatch({ type: 'DELETE_PROPERTY', id, activities })
      },
      linkLeadToProperty: (leadId, propertyId) => {
        const lead = state.leads.find((item) => item.id === leadId)
        if (!lead || lead.propertyId === propertyId) return
        const property = state.properties.find((item) => item.id === propertyId)
        dispatch({
          type: 'LINK_PROPERTY',
          leadId,
          propertyId,
          activity: makeActivity(
            leadId,
            'property_linked',
            propertyId ? `${name()} linked ${property?.title ?? 'a property'}.` : `${name()} removed the linked property.`,
          ),
        })
      },
      addAgent: (input) => {
        dispatch({
          type: 'ADD_AGENT',
          agent: {
            id: createId('agent'),
            name: input.name.trim(),
            email: input.email.trim(),
            phone: input.phone.trim(),
            role: input.role.trim(),
          },
        })
      },
      updateAgent: (id, input) => {
        const current = state.agents.find((agent) => agent.id === id)
        if (!current) return
        dispatch({
          type: 'UPDATE_AGENT',
          agent: { ...current, name: input.name.trim(), email: input.email.trim(), phone: input.phone.trim(), role: input.role.trim() },
        })
      },
      deleteAgent: (id) => dispatch({ type: 'DELETE_AGENT', id }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      markNotificationsRead: (ids) => dispatch({ type: 'MARK_NOTIFICATIONS_READ', ids }),
      resetDemo: () => dispatch({ type: 'RESET_DEMO' }),
    }
  }, [state, storageWarning])

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
