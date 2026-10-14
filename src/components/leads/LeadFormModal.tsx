import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useUi } from '../../context/UiContext'
import type { LeadInput } from '../../types'
import { LEAD_SOURCES, LEAD_STATUSES, PRIORITIES, PROPERTY_TYPES } from '../../types'
import { fromDateTimeLocal, toDateTimeLocal } from '../../utils/dates'
import { formatBudgetRange } from '../../utils/format'
import { PRIORITY_LABEL, PROPERTY_TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL } from '../../utils/labels'
import { nextDueAt } from '../../utils/records'
import { leadFormSchema, type LeadFormValues } from '../../utils/schemas'
import { Button } from '../ui/Button'
import { controlClass, Field } from '../ui/Field'
import { Modal } from '../ui/Modal'

const emptyValues = (status: LeadFormValues['status'], agentId: string): LeadFormValues => ({
  fullName: '',
  phone: '',
  email: '',
  source: 'website',
  status,
  priority: 'medium',
  assignedTo: agentId,
  budgetMin: '',
  budgetMax: '',
  preferredLocation: '',
  propertyType: 'apartment',
  propertyId: '',
  nextFollowUpAt: '',
  notes: '',
  tags: '',
})

export function LeadFormModal() {
  const { leadForm, closeLeadForm } = useUi()
  const { state, addLead, updateLead } = useApp()
  const toast = useToast()
  const open = leadForm !== null
  const editing = state.leads.find((lead) => lead.id === leadForm?.leadId)

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: emptyValues(state.settings.defaultLeadStatus, state.settings.demoAgentId || state.agents[0]?.id || ''),
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        fullName: editing.fullName,
        phone: editing.phone,
        email: editing.email,
        source: editing.source,
        status: editing.status,
        priority: editing.priority,
        assignedTo: editing.assignedTo,
        budgetMin: String(editing.budgetMin),
        budgetMax: String(editing.budgetMax),
        preferredLocation: editing.preferredLocation,
        propertyType: editing.propertyType,
        propertyId: editing.propertyId ?? '',
        nextFollowUpAt: toDateTimeLocal(nextDueAt(editing, state.followUps)),
        notes: editing.notes,
        tags: editing.tags.join(', '),
      })
      return
    }
    form.reset(emptyValues(leadForm?.status ?? state.settings.defaultLeadStatus, state.settings.demoAgentId || state.agents[0]?.id || ''))
    // Reset only when the dialog target changes. `form` is stable enough to call here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadForm?.leadId, leadForm?.status])

  const budgetMin = Number(form.watch('budgetMin'))
  const budgetMax = Number(form.watch('budgetMax'))
  const preview =
    Number.isFinite(budgetMin) && Number.isFinite(budgetMax) && budgetMin > 0 && budgetMax >= budgetMin
      ? formatBudgetRange(budgetMin, budgetMax)
      : null

  function onSubmit(values: LeadFormValues) {
    const input: LeadInput = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      source: values.source,
      status: values.status,
      priority: values.priority,
      assignedTo: values.assignedTo,
      budgetMin: Number(values.budgetMin),
      budgetMax: Number(values.budgetMax),
      preferredLocation: values.preferredLocation,
      propertyType: values.propertyType,
      propertyId: values.propertyId || null,
      nextFollowUpAt: fromDateTimeLocal(values.nextFollowUpAt),
      notes: values.notes,
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }
    if (editing) {
      updateLead(editing.id, input)
      toast.success('Lead updated')
    } else {
      addLead(input)
      toast.success('Lead added')
    }
    closeLeadForm()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit lead' : 'Add lead'}
      description="Required fields are marked. A follow-up is created when you set a next contact time."
      onClose={closeLeadForm}
      size="lg"
    >
      {state.agents.length === 0 ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Add an agent in Settings before saving a lead.
        </p>
      ) : null}
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field label="Full name" htmlFor="lead-name" required error={form.formState.errors.fullName?.message}>
          <input id="lead-name" data-autofocus className={controlClass} aria-invalid={Boolean(form.formState.errors.fullName)} {...form.register('fullName')} />
        </Field>
        <Field label="Phone" htmlFor="lead-phone" required error={form.formState.errors.phone?.message} hint="Indian mobile, with or without +91">
          <input id="lead-phone" className={controlClass} aria-invalid={Boolean(form.formState.errors.phone)} {...form.register('phone')} />
        </Field>
        <Field label="Email" htmlFor="lead-email" required error={form.formState.errors.email?.message}>
          <input id="lead-email" type="email" className={controlClass} aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
        </Field>
        <Field label="Source" htmlFor="lead-source" required error={form.formState.errors.source?.message}>
          <select id="lead-source" className={controlClass} {...form.register('source')}>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABEL[source]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="lead-status" required>
          <select id="lead-status" className={controlClass} {...form.register('status')}>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority" htmlFor="lead-priority" required>
          <select id="lead-priority" className={controlClass} {...form.register('priority')}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assigned agent" htmlFor="lead-agent" required error={form.formState.errors.assignedTo?.message}>
          <select id="lead-agent" className={controlClass} {...form.register('assignedTo')}>
            <option value="">Select an agent</option>
            {state.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} · {agent.role}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Property type" htmlFor="lead-type" required>
          <select id="lead-type" className={controlClass} {...form.register('propertyType')}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROPERTY_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Minimum budget (INR)" htmlFor="lead-min" required error={form.formState.errors.budgetMin?.message}>
          <input id="lead-min" inputMode="numeric" className={controlClass} {...form.register('budgetMin')} />
        </Field>
        <Field label="Maximum budget (INR)" htmlFor="lead-max" required error={form.formState.errors.budgetMax?.message} hint={preview ?? undefined}>
          <input id="lead-max" inputMode="numeric" className={controlClass} {...form.register('budgetMax')} />
        </Field>
        <Field label="Preferred location" htmlFor="lead-location" required error={form.formState.errors.preferredLocation?.message}>
          <input id="lead-location" className={controlClass} {...form.register('preferredLocation')} />
        </Field>
        <Field label="Linked property" htmlFor="lead-property" hint="Optional. Choose a listing from Properties.">
          <select id="lead-property" className={controlClass} {...form.register('propertyId')}>
            <option value="">No property linked</option>
            {state.properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title} · {property.location}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Next follow-up" htmlFor="lead-next" className="sm:col-span-2" error={form.formState.errors.nextFollowUpAt?.message} hint="Leave blank if you are not scheduling one now.">
          <input id="lead-next" type="datetime-local" className={controlClass} {...form.register('nextFollowUpAt')} />
        </Field>
        <Field label="Tags" htmlFor="lead-tags" className="sm:col-span-2" hint="Comma-separated, for example: family, investor">
          <input id="lead-tags" className={controlClass} {...form.register('tags')} />
        </Field>
        <Field label="Notes" htmlFor="lead-notes" className="sm:col-span-2">
          <textarea id="lead-notes" rows={3} className={controlClass} {...form.register('notes')} />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={closeLeadForm}>
            Cancel
          </Button>
          <Button type="submit" disabled={state.agents.length === 0 || form.formState.isSubmitting}>
            {editing ? 'Save changes' : 'Create lead'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
