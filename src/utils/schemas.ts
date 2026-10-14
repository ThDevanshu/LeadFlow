import { z } from 'zod'
import {
  FOLLOW_UP_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITIES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '../types'
import { isValidContactNumber, isValidMobile } from './phone'

const amountField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .refine((value) => {
      const amount = Number(value)
      return Number.isFinite(amount) && amount > 0
    }, `${label} must be greater than zero`)

const wholeNumberField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .refine((value) => /^\d+$/.test(value), `${label} must be a whole number`)

export const leadFormSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter the lead’s full name'),
    phone: z.string().trim().refine(isValidMobile, 'Enter a valid 10-digit Indian mobile number'),
    email: z.email('Enter a valid email address'),
    source: z.enum(LEAD_SOURCES),
    status: z.enum(LEAD_STATUSES),
    priority: z.enum(PRIORITIES),
    assignedTo: z.string().min(1, 'Assign an agent'),
    budgetMin: amountField('a minimum budget'),
    budgetMax: amountField('a maximum budget'),
    preferredLocation: z.string().trim().min(2, 'Enter a preferred location'),
    propertyType: z.enum(PROPERTY_TYPES),
    propertyId: z.string(),
    nextFollowUpAt: z.string(),
    notes: z.string(),
    tags: z.string(),
  })
  .superRefine((value, ctx) => {
    if (Number(value.budgetMax) < Number(value.budgetMin)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Maximum budget must be at least the minimum',
        path: ['budgetMax'],
      })
    }
    if (value.nextFollowUpAt) {
      const date = new Date(value.nextFollowUpAt)
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid follow-up date',
          path: ['nextFollowUpAt'],
        })
      }
    }
  })

export const followUpFormSchema = z.object({
  leadId: z.string().min(1, 'Select a lead'),
  title: z.string().trim().min(3, 'Add a short title'),
  description: z.string(),
  dueAt: z.string().min(1, 'Choose a due date and time'),
  priority: z.enum(PRIORITIES),
  type: z.enum(FOLLOW_UP_TYPES),
  assignedTo: z.string().min(1, 'Assign an agent'),
  updateLeadNext: z.boolean(),
})

export const propertyFormSchema = z.object({
  title: z.string().trim().min(3, 'Enter a property title'),
  propertyType: z.enum(PROPERTY_TYPES),
  location: z.string().trim().min(2, 'Enter a location'),
  price: amountField('a price'),
  bedrooms: wholeNumberField('bedrooms'),
  bathrooms: wholeNumberField('bathrooms'),
  areaSqFt: amountField('the area'),
  status: z.enum(PROPERTY_STATUSES),
  description: z.string().trim().min(10, 'Add a short description'),
  imageUrl: z.string(),
})

export const agentFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter the agent’s name'),
  email: z.email('Enter a valid email address'),
  phone: z.string().trim().refine(isValidContactNumber, 'Enter a valid phone number'),
  role: z.string().trim().min(2, 'Enter a role'),
})

export const agencyFormSchema = z.object({
  agencyName: z.string().trim().min(2, 'Enter the agency name'),
  phone: z.string().trim().refine(isValidContactNumber, 'Enter a valid phone number'),
  email: z.email('Enter a valid email address'),
  address: z.string().trim().min(5, 'Enter an address'),
  website: z
    .string()
    .trim()
    .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), 'Start the website with http:// or https://'),
})

export const preferencesFormSchema = z.object({
  dateFormat: z.enum(['dd MMM yyyy', 'dd/MM/yyyy', 'MMM d, yyyy']),
  defaultLeadStatus: z.enum(LEAD_STATUSES),
  defaultFollowUpReminderDays: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) <= 30, 'Enter a whole number from 0 to 30'),
  demoAgentId: z.string(),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>
export type FollowUpFormValues = z.infer<typeof followUpFormSchema>
export type PropertyFormValues = z.infer<typeof propertyFormSchema>
export type AgentFormValues = z.infer<typeof agentFormSchema>
export type AgencyFormValues = z.infer<typeof agencyFormSchema>
export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>
