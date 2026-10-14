import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { LeadStatus } from '../types'

type LeadFormState = { leadId: string | null; status?: LeadStatus } | null
type FollowUpFormState = { followUpId: string | null; leadId?: string | null } | null
type PropertyFormState = { propertyId: string | null } | null

type UiContextValue = {
  leadForm: LeadFormState
  followUpForm: FollowUpFormState
  propertyForm: PropertyFormState
  importOpen: boolean
  openLeadForm: (options?: { leadId?: string | null; status?: LeadStatus }) => void
  openFollowUpForm: (options?: { followUpId?: string | null; leadId?: string | null }) => void
  openPropertyForm: (options?: { propertyId?: string | null }) => void
  openImport: () => void
  closeLeadForm: () => void
  closeFollowUpForm: () => void
  closePropertyForm: () => void
  closeImport: () => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [leadForm, setLeadForm] = useState<LeadFormState>(null)
  const [followUpForm, setFollowUpForm] = useState<FollowUpFormState>(null)
  const [propertyForm, setPropertyForm] = useState<PropertyFormState>(null)
  const [importOpen, setImportOpen] = useState(false)

  const api = useMemo<UiContextValue>(
    () => ({
      leadForm,
      followUpForm,
      propertyForm,
      importOpen,
      openLeadForm: (options) => setLeadForm({ leadId: options?.leadId ?? null, status: options?.status }),
      openFollowUpForm: (options) => setFollowUpForm({ followUpId: options?.followUpId ?? null, leadId: options?.leadId }),
      openPropertyForm: (options) => setPropertyForm({ propertyId: options?.propertyId ?? null }),
      openImport: () => setImportOpen(true),
      closeLeadForm: () => setLeadForm(null),
      closeFollowUpForm: () => setFollowUpForm(null),
      closePropertyForm: () => setPropertyForm(null),
      closeImport: () => setImportOpen(false),
    }),
    [leadForm, followUpForm, propertyForm, importOpen],
  )

  return <UiContext.Provider value={api}>{children}</UiContext.Provider>
}

export function useUi(): UiContextValue {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi must be used within UiProvider')
  return context
}
