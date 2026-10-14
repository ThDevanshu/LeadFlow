import { Mail, MessageCircle, Pencil, Phone, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import { useUi } from '../context/UiContext'
import { LEAD_STATUSES, PRIORITIES } from '../types'
import type { LeadStatus, Priority } from '../types'
import { FollowUpStatusBadge, PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { cardClass } from '../components/ui/card'
import { DueLabel } from '../components/ui/DueLabel'
import { EmptyState } from '../components/ui/EmptyState'
import { controlClass } from '../components/ui/Field'
import { formatDateTime } from '../utils/dates'
import { formatBudgetRange, formatInrCompact } from '../utils/format'
import { FOLLOW_UP_TYPE_LABEL, PRIORITY_LABEL, PROPERTY_TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL } from '../utils/labels'
import { telUrl, whatsAppMessage, whatsAppUrl } from '../utils/phone'
import { agentName } from '../utils/records'

export function LeadDetailPage() {
  const { leadId = '' } = useParams()
  const navigate = useNavigate()
  const { state, setLeadStatus, setLeadPriority, addNote, deleteLead, completeFollowUp, linkLeadToProperty } = useApp()
  const { openLeadForm, openFollowUpForm } = useUi()
  const confirm = useConfirm()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  const lead = state.leads.find((item) => item.id === leadId)
  const profile = state.agents.find((agent) => agent.id === state.settings.demoAgentId)

  if (!lead) {
    return (
      <div className={cardClass}>
        <EmptyState
          icon={Users}
          title="Lead not found"
          description="This lead is not in the demo data stored in this browser."
          action={<Button onClick={() => navigate('/leads')}>Back to leads</Button>}
        />
      </div>
    )
  }

  const property = state.properties.find((item) => item.id === lead.propertyId) ?? null
  const followUps = state.followUps.filter((item) => item.leadId === lead.id)
  const pending = followUps.filter((item) => item.status === 'pending').sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const completed = followUps
    .filter((item) => item.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const timeline = state.activities
    .filter((item) => item.leadId === lead.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const message = whatsAppMessage(lead.fullName, state.settings.agencyName, profile?.name ?? 'Skyline Realty')

  async function onDelete() {
    const ok = await confirm({
      title: `Delete ${lead?.fullName}?`,
      message: 'This removes the lead, their follow-ups, and activity history from this browser demo.',
      confirmLabel: 'Delete lead',
      tone: 'danger',
    })
    if (!ok || !lead) return
    deleteLead(lead.id)
    toast.success('Lead deleted')
    navigate('/leads')
  }

  async function mark(status: 'won' | 'lost') {
    if (!lead || lead.status === status) return
    const ok = await confirm({
      title: status === 'won' ? 'Mark this lead as won?' : 'Mark this lead as lost?',
      message:
        status === 'won'
          ? 'The lead moves to Won. This does not record a payment.'
          : 'The lead moves to Lost and stays in the demo history.',
      confirmLabel: status === 'won' ? 'Mark won' : 'Mark lost',
      tone: status === 'won' ? 'primary' : 'danger',
    })
    if (!ok) return
    setLeadStatus(lead.id, status)
    toast.success(status === 'won' ? 'Lead marked as won' : 'Lead marked as lost')
  }

  function saveNote() {
    if (!lead) return
    if (!note.trim()) {
      setNoteError('Write a note before saving.')
      return
    }
    addNote(lead.id, note)
    setNote('')
    setNoteError('')
    toast.success('Note added')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <article className={`${cardClass} p-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{lead.email}</p>
              <p className="text-sm text-slate-600">{lead.phone}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50" href={telUrl(lead.phone)}>
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
              <a
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                href={whatsAppUrl(lead.phone, message)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <Button size="sm" variant="secondary" onClick={() => openLeadForm({ leadId: lead.id })}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void onDelete()}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Budget" value={formatBudgetRange(lead.budgetMin, lead.budgetMax)} />
            <Info label="Preferred location" value={lead.preferredLocation} />
            <Info label="Property preference" value={PROPERTY_TYPE_LABEL[lead.propertyType]} />
            <Info label="Source" value={SOURCE_LABEL[lead.source]} />
            <Info label="Assigned agent" value={agentName(state.agents, lead.assignedTo)} />
            <Info label="Created" value={formatDateTime(lead.createdAt, state.settings.dateFormat)} />
            <Info label="Last contact" value={formatDateTime(lead.lastContactedAt, state.settings.dateFormat)} />
            <div>
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Next follow-up</dt>
              <dd className="mt-1 text-sm">
                <DueLabel iso={pending[0]?.dueAt ?? lead.nextFollowUpAt} dateFormat={state.settings.dateFormat} />
              </dd>
            </div>
          </dl>
          {lead.tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => (
                <li key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          {lead.notes ? <p className="mt-3 text-sm leading-6 text-slate-700">{lead.notes}</p> : null}
        </article>

        <article className={`${cardClass} p-4`}>
          <h2 className="text-sm font-semibold text-slate-900">Associated property</h2>
          {property ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link to={`/properties/${property.id}`} className="text-sm font-medium text-indigo-700">
                  {property.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {property.location} · {formatInrCompact(property.price)}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => linkLeadToProperty(lead.id, null)}>
                Unlink
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No listing is linked.</p>
          )}
          <label className="mt-3 block text-xs font-medium text-slate-600" htmlFor="link-property">
            Link a property
          </label>
          <select
            id="link-property"
            className={`${controlClass} mt-1`}
            value={lead.propertyId ?? ''}
            onChange={(event) => {
              linkLeadToProperty(lead.id, event.target.value || null)
              toast.success(event.target.value ? 'Property linked' : 'Property removed')
            }}
          >
            <option value="">No property linked</option>
            {state.properties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </article>

        <article className={`${cardClass} p-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming follow-ups</h2>
            <Button size="sm" variant="secondary" onClick={() => openFollowUpForm({ leadId: lead.id })}>
              Schedule
            </Button>
          </div>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No pending follow-ups.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {pending.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {FOLLOW_UP_TYPE_LABEL[item.type]} · {agentName(state.agents, item.assignedTo)}
                    </p>
                    <DueLabel iso={item.dueAt} dateFormat={state.settings.dateFormat} />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      completeFollowUp(item.id)
                      toast.success('Follow-up completed')
                    }}
                  >
                    Complete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={`${cardClass} p-4`}>
          <h2 className="text-sm font-semibold text-slate-900">Contact history</h2>
          {completed.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No completed follow-ups yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {completed.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <FollowUpStatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {FOLLOW_UP_TYPE_LABEL[item.type]} · {formatDateTime(item.completedAt, state.settings.dateFormat)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <aside className="space-y-4">
        <article className={`${cardClass} space-y-3 p-4`}>
          <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          <label className="block text-xs font-medium text-slate-600" htmlFor="detail-status">
            Status
          </label>
          <select
            id="detail-status"
            className={controlClass}
            value={lead.status}
            onChange={(event) => {
              setLeadStatus(lead.id, event.target.value as LeadStatus)
              toast.success('Status updated')
            }}
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <label className="block text-xs font-medium text-slate-600" htmlFor="detail-priority">
            Priority
          </label>
          <select
            id="detail-priority"
            className={controlClass}
            value={lead.priority}
            onChange={(event) => {
              setLeadPriority(lead.id, event.target.value as Priority)
              toast.success('Priority updated')
            }}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void mark('won')} disabled={lead.status === 'won'} title={lead.status === 'won' ? 'This lead is already won' : undefined}>
              Mark won
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void mark('lost')} disabled={lead.status === 'lost'} title={lead.status === 'lost' ? 'This lead is already lost' : undefined}>
              Mark lost
            </Button>
          </div>
          <a className="inline-flex items-center gap-1 text-sm text-slate-600" href={`mailto:${lead.email}`}>
            <Mail className="h-4 w-4" />
            Email {lead.fullName}
          </a>
        </article>

        <article className={`${cardClass} p-4`}>
          <h2 className="text-sm font-semibold text-slate-900">Add note</h2>
          <textarea
            value={note}
            onChange={(event) => {
              setNote(event.target.value)
              setNoteError('')
            }}
            rows={3}
            className={`${controlClass} mt-2`}
            aria-label="Note"
            placeholder="What happened on the last conversation?"
          />
          {noteError ? (
            <p className="mt-1 text-xs text-rose-700" role="alert">
              {noteError}
            </p>
          ) : null}
          <Button size="sm" className="mt-2" onClick={saveNote}>
            Save note
          </Button>
        </article>

        <article className={`${cardClass} p-4`}>
          <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {timeline.map((item) => (
                <li key={item.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm text-slate-800">{item.message}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(item.createdAt, state.settings.dateFormat)}</p>
                </li>
              ))}
            </ol>
          )}
        </article>
      </aside>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  )
}
