import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useUi } from '../../context/UiContext'
import { FOLLOW_UP_TYPES, PRIORITIES } from '../../types'
import { defaultFollowUpDue, fromDateTimeLocal, toDateTimeLocal } from '../../utils/dates'
import { FOLLOW_UP_TYPE_LABEL, PRIORITY_LABEL } from '../../utils/labels'
import { followUpFormSchema, type FollowUpFormValues } from '../../utils/schemas'
import { Button } from '../ui/Button'
import { controlClass, Field } from '../ui/Field'
import { Modal } from '../ui/Modal'

export function FollowUpFormModal() {
  const { followUpForm, closeFollowUpForm } = useUi()
  const { state, addFollowUp, updateFollowUp } = useApp()
  const toast = useToast()
  const open = followUpForm !== null
  const editing = state.followUps.find((item) => item.id === followUpForm?.followUpId)
  const presetLead = followUpForm?.leadId ?? editing?.leadId ?? state.leads[0]?.id ?? ''

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      leadId: '',
      title: '',
      description: '',
      dueAt: '',
      priority: 'medium',
      type: 'call',
      assignedTo: '',
      updateLeadNext: true,
    },
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        leadId: editing.leadId,
        title: editing.title,
        description: editing.description,
        dueAt: toDateTimeLocal(editing.dueAt),
        priority: editing.priority,
        type: editing.type,
        assignedTo: editing.assignedTo,
        updateLeadNext: true,
      })
      return
    }
    const lead = state.leads.find((item) => item.id === presetLead)
    form.reset({
      leadId: presetLead,
      title: lead ? `Follow up with ${lead.fullName}` : '',
      description: '',
      dueAt: toDateTimeLocal(defaultFollowUpDue(state.settings.defaultFollowUpReminderDays)),
      priority: lead?.priority ?? 'medium',
      type: 'call',
      assignedTo: lead?.assignedTo || state.settings.demoAgentId || state.agents[0]?.id || '',
      updateLeadNext: true,
    })
  }, [open, followUpForm?.followUpId, followUpForm?.leadId])

  function onSubmit(values: FollowUpFormValues) {
    const dueAt = fromDateTimeLocal(values.dueAt)
    if (!dueAt) {
      form.setError('dueAt', { message: 'Choose a valid date and time' })
      return
    }
    const input = {
      leadId: values.leadId,
      title: values.title,
      description: values.description,
      dueAt,
      priority: values.priority,
      type: values.type,
      assignedTo: values.assignedTo,
    }
    if (editing) {
      updateFollowUp(editing.id, input, values.updateLeadNext)
      toast.success(editing.dueAt === dueAt ? 'Follow-up updated' : 'Follow-up rescheduled')
    } else {
      addFollowUp(input, values.updateLeadNext)
      toast.success('Follow-up scheduled')
    }
    closeFollowUpForm()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit follow-up' : 'Schedule follow-up'}
      description="This stays in the browser demo. Nothing is sent automatically."
      onClose={closeFollowUpForm}
      size="md"
    >
      {state.leads.length === 0 ? (
        <p className="text-sm text-slate-600">Add a lead before scheduling a follow-up.</p>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Field label="Lead" htmlFor="fu-lead" required error={form.formState.errors.leadId?.message} className="sm:col-span-2">
            <select id="fu-lead" data-autofocus className={controlClass} {...form.register('leadId')}>
              <option value="">Select a lead</option>
              {state.leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.fullName} · {lead.phone}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title" htmlFor="fu-title" required error={form.formState.errors.title?.message} className="sm:col-span-2">
            <input id="fu-title" className={controlClass} {...form.register('title')} />
          </Field>
          <Field label="Type" htmlFor="fu-type" required>
            <select id="fu-type" className={controlClass} {...form.register('type')}>
              {FOLLOW_UP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {FOLLOW_UP_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority" htmlFor="fu-priority" required>
            <select id="fu-priority" className={controlClass} {...form.register('priority')}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due" htmlFor="fu-due" required error={form.formState.errors.dueAt?.message} className="sm:col-span-2">
            <input id="fu-due" type="datetime-local" className={controlClass} {...form.register('dueAt')} />
          </Field>
          <Field label="Assigned agent" htmlFor="fu-agent" required error={form.formState.errors.assignedTo?.message} className="sm:col-span-2">
            <select id="fu-agent" className={controlClass} {...form.register('assignedTo')}>
              <option value="">Select an agent</option>
              {state.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" htmlFor="fu-description" className="sm:col-span-2">
            <textarea id="fu-description" rows={3} className={controlClass} {...form.register('description')} />
          </Field>
          <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" className="mt-0.5" {...form.register('updateLeadNext')} />
            Update the lead’s next follow-up date to this time
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={closeFollowUpForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={state.agents.length === 0}>
              {editing ? 'Save follow-up' : 'Schedule'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
