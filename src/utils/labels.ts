import type {
  FollowUpStatus,
  FollowUpType,
  LeadSource,
  LeadStatus,
  Priority,
  PropertyStatus,
  PropertyType,
} from '../types'

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_visit: 'Site Visit',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  property_portal: 'Property Portal',
  referral: 'Referral',
  facebook: 'Facebook',
  instagram: 'Instagram',
  walk_in: 'Walk-in',
  other: 'Other',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  plot: 'Plot',
  commercial: 'Commercial',
  penthouse: 'Penthouse',
  independent_house: 'Independent House',
}

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}

export const FOLLOW_UP_TYPE_LABEL: Record<FollowUpType, string> = {
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  site_visit: 'Site Visit',
  meeting: 'Meeting',
  other: 'Other',
}

export const FOLLOW_UP_STATUS_LABEL: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
}

export const OPEN_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
]

export function isLeadStatus(value: string): value is LeadStatus {
  return value in STATUS_LABEL
}

export function isLeadSource(value: string): value is LeadSource {
  return value in SOURCE_LABEL
}

export function isPriority(value: string): value is Priority {
  return value in PRIORITY_LABEL
}

export function isPropertyType(value: string): value is PropertyType {
  return value in PROPERTY_TYPE_LABEL
}

export function isPropertyStatus(value: string): value is PropertyStatus {
  return value in PROPERTY_STATUS_LABEL
}

export function isFollowUpType(value: string): value is FollowUpType {
  return value in FOLLOW_UP_TYPE_LABEL
}
