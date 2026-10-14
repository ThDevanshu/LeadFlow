export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
  'won',
  'lost',
] as const

export const LEAD_SOURCES = [
  'website',
  'whatsapp',
  'property_portal',
  'referral',
  'facebook',
  'instagram',
  'walk_in',
  'other',
] as const

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'plot',
  'commercial',
  'penthouse',
  'independent_house',
] as const

export const PROPERTY_STATUSES = ['available', 'reserved', 'sold'] as const

export const FOLLOW_UP_TYPES = [
  'call',
  'whatsapp',
  'email',
  'site_visit',
  'meeting',
  'other',
] as const

export const FOLLOW_UP_STATUSES = ['pending', 'completed'] as const

export const DATE_FORMATS = ['dd MMM yyyy', 'dd/MM/yyyy', 'MMM d, yyyy'] as const

export const ACTIVITY_TYPES = [
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

export type LeadStatus = (typeof LEAD_STATUSES)[number]
export type LeadSource = (typeof LEAD_SOURCES)[number]
export type Priority = (typeof PRIORITIES)[number]
export type PropertyType = (typeof PROPERTY_TYPES)[number]
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number]
export type DateFormat = (typeof DATE_FORMATS)[number]
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export type Lead = {
  id: string
  fullName: string
  phone: string
  email: string
  source: LeadSource
  status: LeadStatus
  priority: Priority
  assignedTo: string
  budgetMin: number
  budgetMax: number
  preferredLocation: string
  propertyType: PropertyType
  propertyId: string | null
  createdAt: string
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  notes: string
  tags: string[]
}

export type FollowUp = {
  id: string
  leadId: string
  title: string
  description: string
  dueAt: string
  priority: Priority
  type: FollowUpType
  status: FollowUpStatus
  assignedTo: string
  completedAt: string | null
}

export type Property = {
  id: string
  title: string
  propertyType: PropertyType
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  status: PropertyStatus
  description: string
  imageUrl: string
  createdAt: string
}

export type Agent = {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export type Activity = {
  id: string
  leadId: string
  type: ActivityType
  message: string
  createdAt: string
  statusTo?: LeadStatus
}

export type Settings = {
  agencyName: string
  phone: string
  email: string
  address: string
  website: string
  currency: 'INR'
  dateFormat: DateFormat
  defaultLeadStatus: LeadStatus
  defaultFollowUpReminderDays: number
  demoAgentId: string
  notificationReadIds: string[]
}

export type AppState = {
  leads: Lead[]
  properties: Property[]
  followUps: FollowUp[]
  agents: Agent[]
  activities: Activity[]
  settings: Settings
}

export type LeadInput = {
  fullName: string
  phone: string
  email: string
  source: LeadSource
  status: LeadStatus
  priority: Priority
  assignedTo: string
  budgetMin: number
  budgetMax: number
  preferredLocation: string
  propertyType: PropertyType
  propertyId: string | null
  nextFollowUpAt: string | null
  notes: string
  tags: string[]
}

export type FollowUpInput = {
  leadId: string
  title: string
  description: string
  dueAt: string
  priority: Priority
  type: FollowUpType
  assignedTo: string
}

export type PropertyInput = {
  title: string
  propertyType: PropertyType
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  areaSqFt: number
  status: PropertyStatus
  description: string
  imageUrl: string
}

export type AgentInput = {
  name: string
  email: string
  phone: string
  role: string
}

export type LeadSortKey = 'name' | 'createdAt' | 'budget' | 'nextFollowUp'
export type SortDirection = 'asc' | 'desc'

export type FollowUpView = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all'

export type DateRange = {
  from: Date
  to: Date
}
