import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useApp } from '../context/AppContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import type { Agent } from '../types'
import { DATE_FORMATS, LEAD_STATUSES } from '../types'
import { Button } from '../components/ui/Button'
import { cardClass } from '../components/ui/card'
import { controlClass, Field } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { downloadText } from '../utils/download'
import { STATUS_LABEL } from '../utils/labels'
import { agencyFormSchema, agentFormSchema, preferencesFormSchema, type AgencyFormValues, type AgentFormValues, type PreferencesFormValues } from '../utils/schemas'

export function SettingsPage() {
  const { state, updateSettings, addAgent, updateAgent, deleteAgent, resetDemo } = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const [agentEditing, setAgentEditing] = useState<Agent | null | undefined>(undefined)
  const [restoring, setRestoring] = useState(false)

  const agency = useForm<AgencyFormValues>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      agencyName: state.settings.agencyName,
      phone: state.settings.phone,
      email: state.settings.email,
      address: state.settings.address,
      website: state.settings.website,
    },
  })

  const preferences = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      dateFormat: state.settings.dateFormat,
      defaultLeadStatus: state.settings.defaultLeadStatus,
      defaultFollowUpReminderDays: String(state.settings.defaultFollowUpReminderDays),
      demoAgentId: state.settings.demoAgentId,
    },
  })

  const agencyKey = [
    state.settings.agencyName,
    state.settings.phone,
    state.settings.email,
    state.settings.address,
    state.settings.website,
  ].join('|')
  const preferenceKey = [
    state.settings.dateFormat,
    state.settings.defaultLeadStatus,
    state.settings.defaultFollowUpReminderDays,
    state.settings.demoAgentId,
  ].join('|')

  useEffect(() => {
    agency.reset({
      agencyName: state.settings.agencyName,
      phone: state.settings.phone,
      email: state.settings.email,
      address: state.settings.address,
      website: state.settings.website,
    })
  }, [agencyKey])

  useEffect(() => {
    preferences.reset({
      dateFormat: state.settings.dateFormat,
      defaultLeadStatus: state.settings.defaultLeadStatus,
      defaultFollowUpReminderDays: String(state.settings.defaultFollowUpReminderDays),
      demoAgentId: state.settings.demoAgentId,
    })
  }, [preferenceKey])

  async function onRestore() {
    const ok = await confirm({
      title: 'Restore sample data?',
      message: 'This replaces leads, properties, follow-ups, agents, and settings in this browser with the original sample set. Dates are recalculated from today.',
      confirmLabel: 'Restore sample data',
      tone: 'danger',
    })
    if (!ok) return
    setRestoring(true)
    await new Promise((resolve) => window.setTimeout(resolve, 400))
    resetDemo()
    setRestoring(false)
    toast.success('Sample data restored')
  }

  function onExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'LeadFlow frontend demo export. This file is not a backup from a production database.',
      data: state,
    }
    downloadText(`leadflow-demo-${format(new Date(), 'yyyy-MM-dd')}.json`, JSON.stringify(payload, null, 2), 'application/json')
    toast.success('Demo data exported')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <form
        className={`${cardClass} space-y-4 p-4`}
        onSubmit={agency.handleSubmit((values) => {
          updateSettings(values)
          toast.success('Agency profile saved')
        })}
        noValidate
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Agency profile</h2>
          <p className="text-xs text-slate-500">Shown in the sidebar and in WhatsApp drafts.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agency name" htmlFor="agency-name" required error={agency.formState.errors.agencyName?.message}>
            <input id="agency-name" className={controlClass} {...agency.register('agencyName')} />
          </Field>
          <Field label="Phone" htmlFor="agency-phone" required error={agency.formState.errors.phone?.message}>
            <input id="agency-phone" className={controlClass} {...agency.register('phone')} />
          </Field>
          <Field label="Email" htmlFor="agency-email" required error={agency.formState.errors.email?.message}>
            <input id="agency-email" className={controlClass} {...agency.register('email')} />
          </Field>
          <Field label="Website" htmlFor="agency-site" error={agency.formState.errors.website?.message}>
            <input id="agency-site" className={controlClass} {...agency.register('website')} />
          </Field>
          <Field label="Address" htmlFor="agency-address" required error={agency.formState.errors.address?.message} className="sm:col-span-2">
            <input id="agency-address" className={controlClass} {...agency.register('address')} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save profile</Button>
        </div>
      </form>

      <section className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Team</h2>
            <p className="text-xs text-slate-500">Agents can be assigned to leads and follow-ups. This is not user login.</p>
          </div>
          <Button size="sm" onClick={() => setAgentEditing(null)}>
            <Plus className="h-4 w-4" />
            Add agent
          </Button>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {state.agents.length === 0 ? <li className="py-4 text-sm text-slate-500">No agents yet.</li> : null}
          {state.agents.map((agent) => (
            <li key={agent.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                <p className="text-xs text-slate-500">
                  {agent.role} · {agent.email} · {agent.phone}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" aria-label={`Edit ${agent.name}`} onClick={() => setAgentEditing(agent)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${agent.name}`}
                  onClick={() => {
                    void (async () => {
                      const assigned = state.leads.filter((lead) => lead.assignedTo === agent.id).length
                      const ok = await confirm({
                        title: `Remove ${agent.name}?`,
                        message:
                          assigned > 0
                            ? `${assigned} lead${assigned === 1 ? '' : 's'} will become unassigned.`
                            : 'The agent is removed from this browser demo.',
                        confirmLabel: 'Remove agent',
                        tone: 'danger',
                      })
                      if (!ok) return
                      deleteAgent(agent.id)
                      toast.success('Agent removed')
                    })()
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form
        className={`${cardClass} space-y-4 p-4`}
        onSubmit={preferences.handleSubmit((values) => {
          updateSettings({
            dateFormat: values.dateFormat,
            defaultLeadStatus: values.defaultLeadStatus,
            defaultFollowUpReminderDays: Number(values.defaultFollowUpReminderDays),
            demoAgentId: values.demoAgentId,
            currency: 'INR',
          })
          toast.success('Preferences saved')
        })}
        noValidate
      >
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Preferences</h2>
          <p className="text-xs text-slate-500">Reminders appear in the in-app alerts menu. Nothing is emailed.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency" htmlFor="pref-currency" hint="INR is fixed for this demo.">
            <input id="pref-currency" className={controlClass} value="INR" disabled />
          </Field>
          <Field label="Date format" htmlFor="pref-date">
            <select id="pref-date" className={controlClass} {...preferences.register('dateFormat')}>
              {DATE_FORMATS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default lead status" htmlFor="pref-status">
            <select id="pref-status" className={controlClass} {...preferences.register('defaultLeadStatus')}>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default follow-up offset (days)" htmlFor="pref-days" error={preferences.formState.errors.defaultFollowUpReminderDays?.message} hint="Used when scheduling a new follow-up.">
            <input id="pref-days" inputMode="numeric" className={controlClass} {...preferences.register('defaultFollowUpReminderDays')} />
          </Field>
          <Field label="Header profile" htmlFor="pref-agent" className="sm:col-span-2" hint="Chooses which demo agent appears in the header. There is no sign-in.">
            <select id="pref-agent" className={controlClass} {...preferences.register('demoAgentId')}>
              <option value="">No profile selected</option>
              {state.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.role}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save preferences</Button>
        </div>
      </form>

      <section className={`${cardClass} space-y-3 p-4`}>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Demo data</h2>
          <p className="text-xs leading-5 text-slate-500">
            LeadFlow stores this workspace in localStorage on this browser. It is not a secure database, and it is not shared with other people.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onExport}>
            Export JSON
          </Button>
          <Button variant="danger" onClick={() => void onRestore()} disabled={restoring}>
            {restoring ? 'Restoring…' : 'Restore sample data'}
          </Button>
        </div>
      </section>

      <AgentModal
        agent={agentEditing}
        onClose={() => setAgentEditing(undefined)}
        onSave={(values) => {
          if (agentEditing) {
            updateAgent(agentEditing.id, values)
            toast.success('Agent updated')
          } else if (agentEditing === null) {
            addAgent(values)
            toast.success('Agent added')
          }
          setAgentEditing(undefined)
        }}
      />
    </div>
  )
}

function AgentModal({
  agent,
  onClose,
  onSave,
}: {
  agent: Agent | null | undefined
  onClose: () => void
  onSave: (values: AgentFormValues) => void
}) {
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'Advisor' },
  })

  useEffect(() => {
    if (agent === undefined) return
    form.reset(
      agent
        ? { name: agent.name, email: agent.email, phone: agent.phone, role: agent.role }
        : { name: '', email: '', phone: '', role: 'Advisor' },
    )
  }, [agent])

  return (
    <Modal open={agent !== undefined} title={agent ? 'Edit agent' : 'Add agent'} onClose={onClose} size="md">
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSave)} noValidate>
        <Field label="Name" htmlFor="agent-name" required error={form.formState.errors.name?.message}>
          <input id="agent-name" data-autofocus className={controlClass} {...form.register('name')} />
        </Field>
        <Field label="Email" htmlFor="agent-email" required error={form.formState.errors.email?.message}>
          <input id="agent-email" className={controlClass} {...form.register('email')} />
        </Field>
        <Field label="Phone" htmlFor="agent-phone" required error={form.formState.errors.phone?.message}>
          <input id="agent-phone" className={controlClass} {...form.register('phone')} />
        </Field>
        <Field label="Role" htmlFor="agent-role" required error={form.formState.errors.role?.message}>
          <input id="agent-role" className={controlClass} {...form.register('role')} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{agent ? 'Save agent' : 'Add agent'}</Button>
        </div>
      </form>
    </Modal>
  )
}
