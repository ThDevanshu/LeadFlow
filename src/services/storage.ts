import { defaultSettings } from '../data/defaults'
import type { Activity, Agent, AppState, FollowUp, Lead, Property, Settings } from '../types'
import { isFollowUpType, isLeadSource, isLeadStatus, isPriority, isPropertyStatus, isPropertyType } from '../utils/labels'

const STORAGE_KEY = 'leadflow.demo.v1'

type Envelope = { version: 1; data: AppState }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function sanitizeLead(value: unknown): Lead | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.fullName !== 'string') return null
  const status = asString(value.status)
  const source = asString(value.source)
  const priority = asString(value.priority)
  const propertyType = asString(value.propertyType)
  if (!isLeadStatus(status) || !isLeadSource(source) || !isPriority(priority) || !isPropertyType(propertyType)) return null
  return {
    id: value.id,
    fullName: value.fullName,
    phone: asString(value.phone),
    email: asString(value.email),
    source,
    status,
    priority,
    assignedTo: asString(value.assignedTo),
    budgetMin: asNumber(value.budgetMin),
    budgetMax: asNumber(value.budgetMax),
    preferredLocation: asString(value.preferredLocation),
    propertyType,
    propertyId: typeof value.propertyId === 'string' ? value.propertyId : null,
    createdAt: asString(value.createdAt, new Date().toISOString()),
    lastContactedAt: typeof value.lastContactedAt === 'string' ? value.lastContactedAt : null,
    nextFollowUpAt: typeof value.nextFollowUpAt === 'string' ? value.nextFollowUpAt : null,
    notes: asString(value.notes),
    tags: asStringArray(value.tags),
  }
}

function sanitizeFollowUp(value: unknown): FollowUp | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.leadId !== 'string') return null
  const type = asString(value.type)
  const priority = asString(value.priority)
  if (!isFollowUpType(type) || !isPriority(priority)) return null
  const status = value.status === 'completed' ? 'completed' : value.status === 'pending' ? 'pending' : null
  if (!status) return null
  return {
    id: value.id,
    leadId: value.leadId,
    title: asString(value.title, 'Follow-up'),
    description: asString(value.description),
    dueAt: asString(value.dueAt, new Date().toISOString()),
    priority,
    type,
    status,
    assignedTo: asString(value.assignedTo),
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
  }
}

function sanitizeProperty(value: unknown): Property | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') return null
  const propertyType = asString(value.propertyType)
  const status = asString(value.status, 'available')
  if (!isPropertyType(propertyType) || !isPropertyStatus(status)) return null
  return {
    id: value.id,
    title: value.title,
    propertyType,
    location: asString(value.location),
    price: asNumber(value.price),
    bedrooms: asNumber(value.bedrooms),
    bathrooms: asNumber(value.bathrooms),
    areaSqFt: asNumber(value.areaSqFt),
    status,
    description: asString(value.description),
    imageUrl: asString(value.imageUrl),
    createdAt: asString(value.createdAt, new Date().toISOString()),
  }
}

function sanitizeAgent(value: unknown): Agent | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null
  return {
    id: value.id,
    name: value.name,
    email: asString(value.email),
    phone: asString(value.phone),
    role: asString(value.role, 'Advisor'),
  }
}

function sanitizeActivity(value: unknown): Activity | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.leadId !== 'string') return null
  const type = asString(value.type)
  const allowed = [
    'created',
    'status_change',
    'note',
    'follow_up_scheduled',
    'follow_up_completed',
    'follow_up_rescheduled',
    'assigned',
    'priority_change',
    'edited',
    'property_linked',
  ] as const
  if (!allowed.includes(type as (typeof allowed)[number])) return null
  const statusRaw = asString(value.statusTo)
  const statusTo = isLeadStatus(statusRaw) ? statusRaw : undefined
  return {
    id: value.id,
    leadId: value.leadId,
    type: type as Activity['type'],
    message: asString(value.message),
    createdAt: asString(value.createdAt, new Date().toISOString()),
    ...(statusTo ? { statusTo } : {}),
  }
}

function sanitizeSettings(value: unknown): Settings {
  const defaults = defaultSettings()
  if (!isRecord(value)) return defaults
  const dateFormat = value.dateFormat
  const defaultStatus = asString(value.defaultLeadStatus)
  return {
    ...defaults,
    agencyName: asString(value.agencyName, defaults.agencyName),
    phone: asString(value.phone, defaults.phone),
    email: asString(value.email, defaults.email),
    address: asString(value.address, defaults.address),
    website: asString(value.website, defaults.website),
    currency: 'INR',
    dateFormat:
      dateFormat === 'dd MMM yyyy' || dateFormat === 'dd/MM/yyyy' || dateFormat === 'MMM d, yyyy'
        ? dateFormat
        : defaults.dateFormat,
    defaultLeadStatus: isLeadStatus(defaultStatus) ? defaultStatus : defaults.defaultLeadStatus,
    defaultFollowUpReminderDays: Math.min(30, Math.max(0, asNumber(value.defaultFollowUpReminderDays, 1))),
    demoAgentId: asString(value.demoAgentId, defaults.demoAgentId),
    notificationReadIds: asStringArray(value.notificationReadIds).slice(-300),
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.data)) return null
    const data = parsed.data
    if (!Array.isArray(data.leads) || !Array.isArray(data.properties) || !Array.isArray(data.followUps) || !Array.isArray(data.agents)) {
      return null
    }
    return {
      leads: data.leads.map(sanitizeLead).filter((item): item is Lead => item !== null),
      properties: data.properties.map(sanitizeProperty).filter((item): item is Property => item !== null),
      followUps: data.followUps.map(sanitizeFollowUp).filter((item): item is FollowUp => item !== null),
      agents: data.agents.map(sanitizeAgent).filter((item): item is Agent => item !== null),
      activities: Array.isArray(data.activities)
        ? data.activities.map(sanitizeActivity).filter((item): item is Activity => item !== null)
        : [],
      settings: sanitizeSettings(data.settings),
    }
  } catch {
    return null
  }
}

export function saveState(state: AppState): boolean {
  try {
    const envelope: Envelope = { version: 1, data: state }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}
