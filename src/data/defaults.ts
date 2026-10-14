import type { Settings } from '../types'

export const DEMO_AGENT_ID = 'agent_rohan'

export function defaultSettings(): Settings {
  return {
    agencyName: 'Skyline Realty',
    phone: '+91 22 4000 1800',
    email: 'hello@skylinerealty.example',
    address: '14th Floor, Nariman Point, Mumbai 400021',
    website: 'https://skylinerealty.example',
    currency: 'INR',
    dateFormat: 'dd MMM yyyy',
    defaultLeadStatus: 'new',
    defaultFollowUpReminderDays: 1,
    demoAgentId: DEMO_AGENT_ID,
    notificationReadIds: [],
  }
}
