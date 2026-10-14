import { addHours } from 'date-fns'
import { defaultSettings } from './defaults'
import type {
  Activity,
  Agent,
  AppState,
  FollowUp,
  Lead,
  LeadStatus,
  Property,
} from '../types'
import { atDayHour, daysAgo } from '../utils/dates'
import { SOURCE_LABEL, STATUS_LABEL } from '../utils/labels'
import { propertyImageDataUri } from '../utils/propertyVisual'

type LeadDraft = {
  id: string
  fullName: string
  phone: string
  email: string
  source: Lead['source']
  status: LeadStatus
  priority: Lead['priority']
  assignedTo: string
  budgetMin: number
  budgetMax: number
  preferredLocation: string
  propertyType: Lead['propertyType']
  propertyId: string | null
  createdDaysAgo: number
  createdHour: number
  lastContactDaysAgo: number | null
  lastContactHour: number
  responseHours: number
  notes: string
  tags: string[]
  timelineNotes?: { daysAgo: number; hour: number; message: string }[]
}

type FollowDraft = {
  id: string
  leadId: string
  title: string
  description: string
  daysFromToday: number
  hour: number
  minute?: number
  priority: FollowUp['priority']
  type: FollowUp['type']
  status: FollowUp['status']
  assignedTo: string
  completedDaysAgo?: number
  completedHour?: number
}

const STATUS_FLOW: LeadStatus[] = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won']

function statusPath(status: LeadStatus): LeadStatus[] {
  if (status === 'lost') return ['new', 'contacted', 'lost']
  const index = STATUS_FLOW.indexOf(status)
  return STATUS_FLOW.slice(0, index + 1)
}

function contactTime(createdAt: string, responseHours: number, now: Date): string {
  const created = new Date(createdAt).getTime()
  const latest = now.getTime() - 60_000
  let time = addHours(new Date(createdAt), responseHours).getTime()
  if (time > latest) time = latest
  if (time < created + 15 * 60_000) time = Math.min(latest, created + 15 * 60_000)
  return new Date(time).toISOString()
}

export function createSeedState(now = new Date()): AppState {
  const agents: Agent[] = [
    { id: 'agent_rohan', name: 'Rohan Mehta', email: 'rohan.mehta@skylinerealty.example', phone: '+91 98200 11001', role: 'Sales Manager' },
    { id: 'agent_ananya', name: 'Ananya Shah', email: 'ananya.shah@skylinerealty.example', phone: '+91 98200 11002', role: 'Senior Advisor' },
    { id: 'agent_priya', name: 'Priya Nair', email: 'priya.nair@skylinerealty.example', phone: '+91 98200 11003', role: 'Relationship Manager' },
    { id: 'agent_kabir', name: 'Kabir Desai', email: 'kabir.desai@skylinerealty.example', phone: '+91 98200 11004', role: 'Site Specialist' },
    { id: 'agent_meera', name: 'Meera Iyer', email: 'meera.iyer@skylinerealty.example', phone: '+91 98200 11005', role: 'Advisor' },
  ]

  const propertyDrafts: Array<Omit<Property, 'imageUrl'>> = [
    { id: 'prop_seaface', title: 'Seaface Residences', propertyType: 'apartment', location: 'Bandra West, Mumbai', price: 4_85_00_000, bedrooms: 3, bathrooms: 3, areaSqFt: 1680, status: 'available', description: 'High-floor 3BHK with a partial sea view, two covered parking bays, and a residents’ deck.', createdAt: daysAgo(70, 11, 0, now) },
    { id: 'prop_palm', title: 'Palm Court', propertyType: 'apartment', location: 'Juhu, Mumbai', price: 2_40_00_000, bedrooms: 2, bathrooms: 2, areaSqFt: 1120, status: 'available', description: 'Quiet 2BHK facing the internal garden, a short walk from Juhu beach.', createdAt: daysAgo(64, 11, 0, now) },
    { id: 'prop_harbour', title: 'Harbour View', propertyType: 'apartment', location: 'Worli, Mumbai', price: 8_90_00_000, bedrooms: 4, bathrooms: 4, areaSqFt: 2460, status: 'available', description: 'Large 4BHK with a harbour-facing living room and a separate staff room.', createdAt: daysAgo(58, 11, 0, now) },
    { id: 'prop_greenfield', title: 'Greenfield Villa', propertyType: 'villa', location: 'Alibaug, Maharashtra', price: 6_20_00_000, bedrooms: 4, bathrooms: 5, areaSqFt: 4200, status: 'available', description: 'Weekend villa on a 6,000 sq ft plot with a private pool and four parking spaces.', createdAt: daysAgo(52, 11, 0, now) },
    { id: 'prop_orchid', title: 'Orchid Heights', propertyType: 'apartment', location: 'Powai, Mumbai', price: 3_10_00_000, bedrooms: 3, bathrooms: 3, areaSqFt: 1540, status: 'reserved', description: 'Lake-facing 3BHK reserved after a token payment. Possession is expected next quarter.', createdAt: daysAgo(48, 11, 0, now) },
    { id: 'prop_metro', title: 'Metro Square Office', propertyType: 'commercial', location: 'BKC, Mumbai', price: 5_50_00_000, bedrooms: 0, bathrooms: 2, areaSqFt: 980, status: 'available', description: 'Bare-shell office on the 9th floor with a reception bay and two washrooms.', createdAt: daysAgo(40, 11, 0, now) },
    { id: 'prop_lakeside', title: 'Lakeside Plot', propertyType: 'plot', location: 'Lonavala, Maharashtra', price: 1_80_00_000, bedrooms: 0, bathrooms: 0, areaSqFt: 4500, status: 'available', description: 'Clear-title NA plot in a gated layout, suitable for a weekend home.', createdAt: daysAgo(36, 11, 0, now) },
    { id: 'prop_skyline', title: 'Skyline Penthouse', propertyType: 'penthouse', location: 'Lower Parel, Mumbai', price: 12_50_00_000, bedrooms: 4, bathrooms: 5, areaSqFt: 3900, status: 'available', description: 'Duplex penthouse with a private terrace and two car parks in the podium.', createdAt: daysAgo(30, 11, 0, now) },
    { id: 'prop_cedar', title: 'Cedar House', propertyType: 'independent_house', location: 'Khar West, Mumbai', price: 7_40_00_000, bedrooms: 5, bathrooms: 5, areaSqFt: 3200, status: 'available', description: 'Independent house on a 30 ft road with a small garden and servant quarters.', createdAt: daysAgo(28, 11, 0, now) },
    { id: 'prop_riverside', title: 'Riverside Apartments', propertyType: 'apartment', location: 'Thane West, Mumbai', price: 1_35_00_000, bedrooms: 2, bathrooms: 2, areaSqFt: 890, status: 'sold', description: 'Sold 2BHK overlooking the creek. Included so won deals stay linked to a listing.', createdAt: daysAgo(80, 11, 0, now) },
    { id: 'prop_atrium', title: 'Atrium Lofts', propertyType: 'apartment', location: 'Andheri East, Mumbai', price: 95_00_000, bedrooms: 1, bathrooms: 1, areaSqFt: 640, status: 'available', description: 'Compact 1BHK loft near the metro, aimed at first-home buyers.', createdAt: daysAgo(22, 11, 0, now) },
    { id: 'prop_oakwood', title: 'Oakwood Reserve', propertyType: 'villa', location: 'Baner, Pune', price: 3_80_00_000, bedrooms: 4, bathrooms: 4, areaSqFt: 2800, status: 'sold', description: 'Sold villa in a low-density layout. The booking was closed by the Skyline team.', createdAt: daysAgo(90, 11, 0, now) },
  ]

  const properties: Property[] = propertyDrafts.map((property) => ({
    ...property,
    imageUrl: propertyImageDataUri(property.id, property.propertyType, property.title),
  }))

  const drafts: LeadDraft[] = [
    { id: 'lead_vikram', fullName: 'Vikram Malhotra', phone: '+91 98200 21001', email: 'vikram.malhotra@example.com', source: 'website', status: 'new', priority: 'high', assignedTo: 'agent_ananya', budgetMin: 2_50_00_000, budgetMax: 3_50_00_000, preferredLocation: 'Bandra West', propertyType: 'apartment', propertyId: 'prop_seaface', createdDaysAgo: 1, createdHour: 9, lastContactDaysAgo: null, lastContactHour: 10, responseHours: 0, notes: 'Submitted a website form asking for sea-facing 3BHK options in Bandra.', tags: ['end-user', 'hot'], timelineNotes: [] },
    { id: 'lead_neha', fullName: 'Neha Kulkarni', phone: '+91 98200 21002', email: 'neha.kulkarni@example.com', source: 'whatsapp', status: 'new', priority: 'medium', assignedTo: 'agent_priya', budgetMin: 90_00_000, budgetMax: 1_20_00_000, preferredLocation: 'Thane West', propertyType: 'apartment', propertyId: 'prop_riverside', createdDaysAgo: 0, createdHour: 8, lastContactDaysAgo: null, lastContactHour: 10, responseHours: 0, notes: 'WhatsApp enquiry this morning about a 2BHK under ₹1.2 Cr.', tags: ['end-user'] },
    { id: 'lead_aditya', fullName: 'Aditya Rao', phone: '+91 98200 21003', email: 'aditya.rao@example.com', source: 'property_portal', status: 'new', priority: 'urgent', assignedTo: 'agent_rohan', budgetMin: 8_00_00_000, budgetMax: 11_00_00_000, preferredLocation: 'Worli', propertyType: 'apartment', propertyId: 'prop_harbour', createdDaysAgo: 2, createdHour: 16, lastContactDaysAgo: null, lastContactHour: 10, responseHours: 0, notes: 'Portal lead. Asked to speak today about Harbour View. No one has reached him yet.', tags: ['investor', 'hot'] },
    { id: 'lead_sana', fullName: 'Sana Qureshi', phone: '+91 98200 21004', email: 'sana.qureshi@example.com', source: 'instagram', status: 'new', priority: 'low', assignedTo: 'agent_meera', budgetMin: 70_00_000, budgetMax: 95_00_000, preferredLocation: 'Andheri East', propertyType: 'apartment', propertyId: null, createdDaysAgo: 4, createdHour: 19, lastContactDaysAgo: null, lastContactHour: 10, responseHours: 0, notes: 'Commented on an Instagram reel. Budget is tight and location is flexible.', tags: ['end-user'] },
    { id: 'lead_rahul', fullName: 'Rahul Banerjee', phone: '+91 98200 21005', email: 'rahul.banerjee@example.com', source: 'referral', status: 'contacted', priority: 'high', assignedTo: 'agent_kabir', budgetMin: 5_00_00_000, budgetMax: 7_00_00_000, preferredLocation: 'Alibaug', propertyType: 'villa', propertyId: 'prop_greenfield', createdDaysAgo: 8, createdHour: 11, lastContactDaysAgo: 3, lastContactHour: 15, responseHours: 3, notes: 'Referred by an existing owner. Wants a weekend villa with a pool.', tags: ['family', 'nri'], timelineNotes: [{ daysAgo: 3, hour: 15, message: 'Confirmed he can travel to Alibaug this week with his spouse.' }] },
    { id: 'lead_ishita', fullName: 'Ishita Menon', phone: '+91 98200 21006', email: 'ishita.menon@example.com', source: 'facebook', status: 'contacted', priority: 'medium', assignedTo: 'agent_ananya', budgetMin: 2_80_00_000, budgetMax: 3_40_00_000, preferredLocation: 'Powai', propertyType: 'apartment', propertyId: 'prop_orchid', createdDaysAgo: 12, createdHour: 13, lastContactDaysAgo: 2, lastContactHour: 11, responseHours: 26, notes: 'Comparing two Powai projects. Needs a school within 15 minutes.', tags: ['family'] },
    { id: 'lead_farhan', fullName: 'Farhan Siddiqui', phone: '+91 98200 21007', email: 'farhan.siddiqui@example.com', source: 'walk_in', status: 'contacted', priority: 'high', assignedTo: 'agent_rohan', budgetMin: 10_00_00_000, budgetMax: 14_00_00_000, preferredLocation: 'Lower Parel', propertyType: 'penthouse', propertyId: 'prop_skyline', createdDaysAgo: 6, createdHour: 17, lastContactDaysAgo: 1, lastContactHour: 18, responseHours: 5, notes: 'Walked into the Nariman Point office. Looking at penthouses for his parents.', tags: ['family', 'hot'] },
    { id: 'lead_diya', fullName: 'Diya Chawla', phone: '+91 98200 21008', email: 'diya.chawla@example.com', source: 'website', status: 'contacted', priority: 'low', assignedTo: 'agent_priya', budgetMin: 1_10_00_000, budgetMax: 1_50_00_000, preferredLocation: 'Thane West', propertyType: 'apartment', propertyId: null, createdDaysAgo: 15, createdHour: 10, lastContactDaysAgo: 6, lastContactHour: 12, responseHours: 18, notes: 'Early-stage buyer. Asked for a comparison sheet before visiting.', tags: ['end-user'] },
    { id: 'lead_arjun', fullName: 'Arjun Bhatt', phone: '+91 98200 21009', email: 'arjun.bhatt@example.com', source: 'whatsapp', status: 'contacted', priority: 'medium', assignedTo: 'agent_meera', budgetMin: 3_00_00_000, budgetMax: 4_20_00_000, preferredLocation: 'Khar West', propertyType: 'independent_house', propertyId: 'prop_cedar', createdDaysAgo: 9, createdHour: 20, lastContactDaysAgo: 2, lastContactHour: 19, responseHours: 8, notes: 'Wants an independent house, not a high-rise. Missed the last callback.', tags: ['end-user'] },
    { id: 'lead_kavya', fullName: 'Kavya Reddy', phone: '+91 98200 21010', email: 'kavya.reddy@example.com', source: 'property_portal', status: 'qualified', priority: 'urgent', assignedTo: 'agent_ananya', budgetMin: 4_20_00_000, budgetMax: 5_50_00_000, preferredLocation: 'Bandra West', propertyType: 'apartment', propertyId: 'prop_seaface', createdDaysAgo: 18, createdHour: 9, lastContactDaysAgo: 1, lastContactHour: 13, responseHours: 2, notes: 'Budget can stretch for a clear sea view. Decision maker is Kavya herself.', tags: ['hot', 'end-user'], timelineNotes: [{ daysAgo: 1, hour: 13, message: 'Asked for the 18th and 21st floor stacks only.' }] },
    { id: 'lead_nikhil', fullName: 'Nikhil Joshi', phone: '+91 98200 21011', email: 'nikhil.joshi@example.com', source: 'referral', status: 'qualified', priority: 'high', assignedTo: 'agent_kabir', budgetMin: 5_50_00_000, budgetMax: 6_80_00_000, preferredLocation: 'Alibaug', propertyType: 'villa', propertyId: 'prop_greenfield', createdDaysAgo: 21, createdHour: 12, lastContactDaysAgo: 2, lastContactHour: 16, responseHours: 6, notes: 'Qualified on budget and timeline. Wants to walk the villa with his architect.', tags: ['family'] },
    { id: 'lead_pooja', fullName: 'Pooja Deshmukh', phone: '+91 98200 21012', email: 'pooja.deshmukh@example.com', source: 'website', status: 'qualified', priority: 'medium', assignedTo: 'agent_priya', budgetMin: 2_20_00_000, budgetMax: 3_00_00_000, preferredLocation: 'Powai', propertyType: 'apartment', propertyId: 'prop_orchid', createdDaysAgo: 14, createdHour: 15, lastContactDaysAgo: 4, lastContactHour: 11, responseHours: 30, notes: 'Loan pre-approval is in progress with her bank.', tags: ['end-user'] },
    { id: 'lead_sameer', fullName: 'Sameer Gill', phone: '+91 98200 21013', email: 'sameer.gill@example.com', source: 'walk_in', status: 'qualified', priority: 'high', assignedTo: 'agent_rohan', budgetMin: 6_00_00_000, budgetMax: 8_00_00_000, preferredLocation: 'BKC', propertyType: 'commercial', propertyId: 'prop_metro', createdDaysAgo: 11, createdHour: 14, lastContactDaysAgo: 1, lastContactHour: 17, responseHours: 4, notes: 'Needs a small office for a 12-person team. Fit-out budget is separate.', tags: ['investor'] },
    { id: 'lead_tara', fullName: 'Tara Krishnan', phone: '+91 98200 21014', email: 'tara.krishnan@example.com', source: 'instagram', status: 'site_visit', priority: 'high', assignedTo: 'agent_kabir', budgetMin: 4_50_00_000, budgetMax: 5_20_00_000, preferredLocation: 'Bandra West', propertyType: 'apartment', propertyId: 'prop_seaface', createdDaysAgo: 20, createdHour: 18, lastContactDaysAgo: 1, lastContactHour: 16, responseHours: 12, notes: 'Visited once. Wants a second look at a higher floor before involving her father.', tags: ['family', 'hot'] },
    { id: 'lead_harsh', fullName: 'Harsh Vardhan', phone: '+91 98200 21015', email: 'harsh.vardhan@example.com', source: 'property_portal', status: 'site_visit', priority: 'medium', assignedTo: 'agent_ananya', budgetMin: 2_60_00_000, budgetMax: 3_20_00_000, preferredLocation: 'Juhu', propertyType: 'apartment', propertyId: 'prop_palm', createdDaysAgo: 16, createdHour: 10, lastContactDaysAgo: 1, lastContactHour: 12, responseHours: 7, notes: 'Site visit done. Comparing Palm Court with one other Juhu listing.', tags: ['end-user'] },
    { id: 'lead_leela', fullName: 'Leela Nambiar', phone: '+91 98200 21016', email: 'leela.nambiar@example.com', source: 'referral', status: 'site_visit', priority: 'urgent', assignedTo: 'agent_meera', budgetMin: 6_80_00_000, budgetMax: 7_80_00_000, preferredLocation: 'Khar West', propertyType: 'independent_house', propertyId: 'prop_cedar', createdDaysAgo: 25, createdHour: 11, lastContactDaysAgo: 2, lastContactHour: 18, responseHours: 20, notes: 'Family visited Cedar House. They want a decision meeting with both brothers.', tags: ['family'] },
    { id: 'lead_manish', fullName: 'Manish Agarwal', phone: '+91 98200 21017', email: 'manish.agarwal@example.com', source: 'website', status: 'negotiation', priority: 'urgent', assignedTo: 'agent_rohan', budgetMin: 8_50_00_000, budgetMax: 9_50_00_000, preferredLocation: 'Worli', propertyType: 'apartment', propertyId: 'prop_harbour', createdDaysAgo: 30, createdHour: 9, lastContactDaysAgo: 0, lastContactHour: 9, responseHours: 3, notes: 'Offer is on the table. Discussing the payment schedule and parking.', tags: ['hot', 'investor'], timelineNotes: [{ daysAgo: 0, hour: 9, message: 'He will confirm the token amount after speaking with his CA today.' }] },
    { id: 'lead_rhea', fullName: 'Rhea Kapoor', phone: '+91 98200 21018', email: 'rhea.kapoor@example.com', source: 'whatsapp', status: 'negotiation', priority: 'high', assignedTo: 'agent_ananya', budgetMin: 11_00_00_000, budgetMax: 13_50_00_000, preferredLocation: 'Lower Parel', propertyType: 'penthouse', propertyId: 'prop_skyline', createdDaysAgo: 28, createdHour: 16, lastContactDaysAgo: 1, lastContactHour: 19, responseHours: 9, notes: 'Asked for a revised price on the penthouse terrace unit.', tags: ['nri', 'hot'] },
    { id: 'lead_dev', fullName: 'Dev Patel', phone: '+91 98200 21019', email: 'dev.patel@example.com', source: 'facebook', status: 'negotiation', priority: 'medium', assignedTo: 'agent_kabir', budgetMin: 1_60_00_000, budgetMax: 2_10_00_000, preferredLocation: 'Lonavala', propertyType: 'plot', propertyId: 'prop_lakeside', createdDaysAgo: 19, createdHour: 12, lastContactDaysAgo: 3, lastContactHour: 11, responseHours: 15, notes: 'Negotiating the plot rate. Documentation questions are still open.', tags: ['investor'] },
    { id: 'lead_aisha', fullName: 'Aisha Fernandes', phone: '+91 98200 21020', email: 'aisha.fernandes@example.com', source: 'referral', status: 'won', priority: 'high', assignedTo: 'agent_rohan', budgetMin: 3_60_00_000, budgetMax: 4_00_00_000, preferredLocation: 'Baner, Pune', propertyType: 'villa', propertyId: 'prop_oakwood', createdDaysAgo: 40, createdHour: 10, lastContactDaysAgo: 5, lastContactHour: 16, responseHours: 4, notes: 'Booked Oakwood Reserve. Token received and agreement is with the legal desk.', tags: ['won', 'family'] },
    { id: 'lead_kunal', fullName: 'Kunal Sethi', phone: '+91 98200 21021', email: 'kunal.sethi@example.com', source: 'website', status: 'won', priority: 'medium', assignedTo: 'agent_priya', budgetMin: 1_20_00_000, budgetMax: 1_40_00_000, preferredLocation: 'Thane West', propertyType: 'apartment', propertyId: 'prop_riverside', createdDaysAgo: 36, createdHour: 14, lastContactDaysAgo: 20, lastContactHour: 12, responseHours: 11, notes: 'Closed Riverside Apartments. Registration is scheduled with the developer.', tags: ['won'] },
    { id: 'lead_sneha', fullName: 'Sneha Iyer', phone: '+91 98200 21022', email: 'sneha.iyer@example.com', source: 'walk_in', status: 'won', priority: 'high', assignedTo: 'agent_meera', budgetMin: 2_90_00_000, budgetMax: 3_30_00_000, preferredLocation: 'Powai', propertyType: 'apartment', propertyId: 'prop_orchid', createdDaysAgo: 55, createdHour: 11, lastContactDaysAgo: 48, lastContactHour: 15, responseHours: 6, notes: 'Token paid for Orchid Heights. The unit is marked reserved until registration.', tags: ['won', 'family'] },
    { id: 'lead_omar', fullName: 'Omar Sheikh', phone: '+91 98200 21023', email: 'omar.sheikh@example.com', source: 'property_portal', status: 'lost', priority: 'low', assignedTo: 'agent_ananya', budgetMin: 90_00_000, budgetMax: 1_10_00_000, preferredLocation: 'Andheri East', propertyType: 'apartment', propertyId: 'prop_atrium', createdDaysAgo: 48, createdHour: 17, lastContactDaysAgo: 30, lastContactHour: 13, responseHours: 48, notes: 'Budget did not match the available inventory. He paused the search.', tags: ['lost'] },
    { id: 'lead_nandini', fullName: 'Nandini Bose', phone: '+91 98200 21024', email: 'nandini.bose@example.com', source: 'instagram', status: 'lost', priority: 'medium', assignedTo: 'agent_priya', budgetMin: 4_00_00_000, budgetMax: 5_00_00_000, preferredLocation: 'Juhu', propertyType: 'apartment', propertyId: 'prop_palm', createdDaysAgo: 33, createdHour: 19, lastContactDaysAgo: 18, lastContactHour: 17, responseHours: 24, notes: 'Chose another broker after the first visit. Kept for source reporting.', tags: ['lost'] },
  ]

  const followDrafts: FollowDraft[] = [
    { id: 'fu_vikram', leadId: 'lead_vikram', title: 'Intro call', description: 'First call to confirm budget and sea-view preference.', daysFromToday: 0, hour: 11, priority: 'high', type: 'call', status: 'pending', assignedTo: 'agent_ananya' },
    { id: 'fu_neha', leadId: 'lead_neha', title: 'Share Riverside brochure', description: 'Send the Thane 2BHK brochure and ask for a visit window.', daysFromToday: 1, hour: 11, priority: 'medium', type: 'whatsapp', status: 'pending', assignedTo: 'agent_priya' },
    { id: 'fu_aditya', leadId: 'lead_aditya', title: 'First call', description: 'Portal lead has not been contacted. Call about Harbour View.', daysFromToday: -1, hour: 10, priority: 'urgent', type: 'call', status: 'pending', assignedTo: 'agent_rohan' },
    { id: 'fu_sana', leadId: 'lead_sana', title: 'Reply to Instagram enquiry', description: 'Share two Andheri options inside her budget.', daysFromToday: 3, hour: 12, priority: 'low', type: 'whatsapp', status: 'pending', assignedTo: 'agent_meera' },
    { id: 'fu_rahul_done', leadId: 'lead_rahul', title: 'Qualification call', description: 'Confirmed budget and that both spouses will visit.', daysFromToday: -4, hour: 15, priority: 'high', type: 'call', status: 'completed', assignedTo: 'agent_kabir', completedDaysAgo: 4, completedHour: 15 },
    { id: 'fu_rahul', leadId: 'lead_rahul', title: 'Alibaug site visit', description: 'Walk Greenfield Villa with Rahul and his spouse.', daysFromToday: 0, hour: 15, priority: 'high', type: 'site_visit', status: 'pending', assignedTo: 'agent_kabir' },
    { id: 'fu_ishita', leadId: 'lead_ishita', title: 'Send Powai comparison', description: 'Email two Powai options with school distances.', daysFromToday: 2, hour: 10, priority: 'medium', type: 'email', status: 'pending', assignedTo: 'agent_ananya' },
    { id: 'fu_farhan', leadId: 'lead_farhan', title: 'Penthouse budget review', description: 'Meet at the office to review Skyline Penthouse pricing.', daysFromToday: 0, hour: 17, minute: 30, priority: 'high', type: 'meeting', status: 'pending', assignedTo: 'agent_rohan' },
    { id: 'fu_diya', leadId: 'lead_diya', title: 'Thane options email', description: 'Send three Thane listings before asking for a visit.', daysFromToday: 5, hour: 11, priority: 'low', type: 'email', status: 'pending', assignedTo: 'agent_priya' },
    { id: 'fu_arjun', leadId: 'lead_arjun', title: 'Check Khar visit interest', description: 'WhatsApp Arjun about a Cedar House visit. Previous callback was missed.', daysFromToday: -1, hour: 18, priority: 'medium', type: 'whatsapp', status: 'pending', assignedTo: 'agent_meera' },
    { id: 'fu_kavya_done', leadId: 'lead_kavya', title: 'Budget confirmation', description: 'She confirmed the stretch budget for a clear view.', daysFromToday: -1, hour: 13, priority: 'urgent', type: 'call', status: 'completed', assignedTo: 'agent_ananya', completedDaysAgo: 1, completedHour: 13 },
    { id: 'fu_kavya', leadId: 'lead_kavya', title: 'Confirm Bandra shortlist', description: 'Call to lock the two Seaface stacks she wants to revisit.', daysFromToday: 0, hour: 12, minute: 30, priority: 'urgent', type: 'call', status: 'pending', assignedTo: 'agent_ananya' },
    { id: 'fu_nikhil_done', leadId: 'lead_nikhil', title: 'Referral intro', description: 'Spoke with Nikhil after the owner referral.', daysFromToday: -3, hour: 16, priority: 'high', type: 'call', status: 'completed', assignedTo: 'agent_kabir', completedDaysAgo: 3, completedHour: 16 },
    { id: 'fu_nikhil', leadId: 'lead_nikhil', title: 'Villa walkthrough', description: 'Site visit with his architect.', daysFromToday: 1, hour: 11, priority: 'high', type: 'site_visit', status: 'pending', assignedTo: 'agent_kabir' },
    { id: 'fu_pooja', leadId: 'lead_pooja', title: 'Discuss Powai tower', description: 'Call once the bank pre-approval note arrives.', daysFromToday: 3, hour: 16, priority: 'medium', type: 'call', status: 'pending', assignedTo: 'agent_priya' },
    { id: 'fu_sameer', leadId: 'lead_sameer', title: 'BKC office requirements', description: 'Meeting to confirm carpet area and fit-out timeline. This was missed.', daysFromToday: -2, hour: 17, priority: 'high', type: 'meeting', status: 'pending', assignedTo: 'agent_rohan' },
    { id: 'fu_tara_done', leadId: 'lead_tara', title: 'First Seaface visit', description: 'Walked the 14th floor with Tara.', daysFromToday: -1, hour: 16, priority: 'high', type: 'site_visit', status: 'completed', assignedTo: 'agent_kabir', completedDaysAgo: 1, completedHour: 16 },
    { id: 'fu_tara', leadId: 'lead_tara', title: 'Second visit, higher floor', description: 'Arrange access to the 21st floor stack.', daysFromToday: 1, hour: 15, priority: 'high', type: 'site_visit', status: 'pending', assignedTo: 'agent_kabir' },
    { id: 'fu_harsh', leadId: 'lead_harsh', title: 'Share Juhu visit notes', description: 'Send the visit summary and maintenance figure.', daysFromToday: 0, hour: 16, priority: 'medium', type: 'whatsapp', status: 'pending', assignedTo: 'agent_ananya' },
    { id: 'fu_leela', leadId: 'lead_leela', title: 'Family decision meeting', description: 'Meet both brothers at the Khar house.', daysFromToday: 2, hour: 17, priority: 'urgent', type: 'meeting', status: 'pending', assignedTo: 'agent_meera' },
    { id: 'fu_manish_done', leadId: 'lead_manish', title: 'Offer discussion', description: 'Reviewed the Harbour View offer and parking.', daysFromToday: -1, hour: 18, priority: 'urgent', type: 'meeting', status: 'completed', assignedTo: 'agent_rohan', completedDaysAgo: 1, completedHour: 18 },
    { id: 'fu_manish', leadId: 'lead_manish', title: 'Payment schedule call', description: 'Agree the token amount and milestone dates.', daysFromToday: 0, hour: 18, priority: 'urgent', type: 'call', status: 'pending', assignedTo: 'agent_rohan' },
    { id: 'fu_rhea', leadId: 'lead_rhea', title: 'Penthouse price revision', description: 'Call Rhea with the revised terrace-unit figure.', daysFromToday: 1, hour: 19, priority: 'high', type: 'call', status: 'pending', assignedTo: 'agent_ananya' },
    { id: 'fu_dev', leadId: 'lead_dev', title: 'Plot documentation', description: 'Call about title papers for the Lonavala plot. Overdue.', daysFromToday: -3, hour: 11, priority: 'medium', type: 'call', status: 'pending', assignedTo: 'agent_kabir' },
    { id: 'fu_aisha', leadId: 'lead_aisha', title: 'Final walkthrough', description: 'Completed the Oakwood walkthrough before booking.', daysFromToday: -6, hour: 16, priority: 'high', type: 'site_visit', status: 'completed', assignedTo: 'agent_rohan', completedDaysAgo: 5, completedHour: 16 },
    { id: 'fu_kunal', leadId: 'lead_kunal', title: 'Booking confirmation', description: 'Confirmed the Riverside booking and registration slot.', daysFromToday: -20, hour: 12, priority: 'medium', type: 'call', status: 'completed', assignedTo: 'agent_priya', completedDaysAgo: 20, completedHour: 12 },
    { id: 'fu_sneha', leadId: 'lead_sneha', title: 'Token discussion', description: 'Collected the token for Orchid Heights.', daysFromToday: -48, hour: 15, priority: 'high', type: 'meeting', status: 'completed', assignedTo: 'agent_meera', completedDaysAgo: 48, completedHour: 15 },
    { id: 'fu_omar', leadId: 'lead_omar', title: 'Budget follow-up', description: 'He confirmed the search is on hold.', daysFromToday: -30, hour: 13, priority: 'low', type: 'call', status: 'completed', assignedTo: 'agent_ananya', completedDaysAgo: 30, completedHour: 13 },
    { id: 'fu_nandini', leadId: 'lead_nandini', title: 'Close the enquiry', description: 'She confirmed she is buying through another agency.', daysFromToday: -18, hour: 17, priority: 'medium', type: 'whatsapp', status: 'completed', assignedTo: 'agent_priya', completedDaysAgo: 18, completedHour: 17 },
  ]

  const leads: Lead[] = drafts.map((draft) => ({
    id: draft.id,
    fullName: draft.fullName,
    phone: draft.phone,
    email: draft.email,
    source: draft.source,
    status: draft.status,
    priority: draft.priority,
    assignedTo: draft.assignedTo,
    budgetMin: draft.budgetMin,
    budgetMax: draft.budgetMax,
    preferredLocation: draft.preferredLocation,
    propertyType: draft.propertyType,
    propertyId: draft.propertyId,
    createdAt: daysAgo(draft.createdDaysAgo, draft.createdHour, 0, now),
    lastContactedAt:
      draft.lastContactDaysAgo === null ? null : daysAgo(draft.lastContactDaysAgo, draft.lastContactHour, 0, now),
    nextFollowUpAt: null,
    notes: draft.notes,
    tags: draft.tags,
  }))

  const followUps: FollowUp[] = followDrafts.map((draft) => ({
    id: draft.id,
    leadId: draft.leadId,
    title: draft.title,
    description: draft.description,
    dueAt: atDayHour(draft.daysFromToday, draft.hour, draft.minute ?? 0, now),
    priority: draft.priority,
    type: draft.type,
    status: draft.status,
    assignedTo: draft.assignedTo,
    completedAt:
      draft.status === 'completed' && draft.completedDaysAgo !== undefined
        ? daysAgo(draft.completedDaysAgo, draft.completedHour ?? draft.hour, draft.minute ?? 0, now)
        : null,
  }))

  for (const lead of leads) {
    if (new Date(lead.createdAt) > now) lead.createdAt = new Date(now.getTime() - 5 * 60_000).toISOString()
    if (lead.lastContactedAt && new Date(lead.lastContactedAt) > now) {
      lead.lastContactedAt = new Date(now.getTime() - 60_000).toISOString()
    }
    const pending = followUps
      .filter((item) => item.leadId === lead.id && item.status === 'pending')
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    lead.nextFollowUpAt = pending[0]?.dueAt ?? null
    if (lead.status !== 'new' && !lead.lastContactedAt) {
      lead.lastContactedAt = contactTime(lead.createdAt, 4, now)
    }
  }

  let activityCount = 0
  const nextActivityId = () => {
    activityCount += 1
    return `act_${String(activityCount).padStart(3, '0')}`
  }
  const activities: Activity[] = []

  for (const draft of drafts) {
    const lead = leads.find((item) => item.id === draft.id)
    if (!lead) continue
    activities.push({
      id: nextActivityId(),
      leadId: lead.id,
      type: 'created',
      message: `Enquiry received via ${SOURCE_LABEL[lead.source]}.`,
      createdAt: lead.createdAt,
    })

    if (lead.status !== 'new') {
      const path = statusPath(lead.status)
      const steps = path.slice(1)
      const first = contactTime(lead.createdAt, draft.responseHours, now)
      const end = lead.lastContactedAt && new Date(lead.lastContactedAt) > new Date(first) ? lead.lastContactedAt : first
      steps.forEach((status, index) => {
        const from = path[index] ?? 'new'
        const span = new Date(end).getTime() - new Date(first).getTime()
        const at =
          index === 0 || steps.length === 1
            ? first
            : new Date(new Date(first).getTime() + (span * index) / (steps.length - 1)).toISOString()
        activities.push({
          id: nextActivityId(),
          leadId: lead.id,
          type: 'status_change',
          message: `Status changed from ${STATUS_LABEL[from]} to ${STATUS_LABEL[status]}.`,
          createdAt: at,
          statusTo: status,
        })
      })
    }

    for (const note of draft.timelineNotes ?? []) {
      const at = daysAgo(note.daysAgo, note.hour, 20, now)
      if (new Date(at) >= new Date(lead.createdAt)) {
        activities.push({
          id: nextActivityId(),
          leadId: lead.id,
          type: 'note',
          message: note.message,
          createdAt: at,
        })
      }
    }
  }

  for (const followUp of followUps) {
    const lead = leads.find((item) => item.id === followUp.leadId)
    if (!lead) continue
    const created = new Date(lead.createdAt).getTime()
    const due = new Date(followUp.dueAt).getTime()
    let scheduled = due - 4 * 60 * 60 * 1000
    const latest = now.getTime() - 60_000
    if (scheduled < created) scheduled = created + 5 * 60_000
    if (scheduled > latest) scheduled = Math.max(created, latest)
    activities.push({
      id: nextActivityId(),
      leadId: followUp.leadId,
      type: 'follow_up_scheduled',
      message: `Scheduled ${followUp.title.toLowerCase()}.`,
      createdAt: new Date(scheduled).toISOString(),
    })
    if (followUp.status === 'completed' && followUp.completedAt) {
      activities.push({
        id: nextActivityId(),
        leadId: followUp.leadId,
        type: 'follow_up_completed',
        message: `Completed “${followUp.title}”.`,
        createdAt: followUp.completedAt,
      })
    }
  }

  return {
    leads,
    properties,
    followUps,
    agents,
    activities,
    settings: defaultSettings(),
  }
}
