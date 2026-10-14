import { CalendarClock, MessageCircle, Pencil, Phone, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import { useUi } from '../context/UiContext'
import type { FollowUpView, Priority } from '../types'
import { PRIORITIES } from '../types'
import { FollowUpStatusBadge, PriorityBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { cardClass } from '../components/ui/card'
import { controlClass } from '../components/ui/Field'
import { DueLabel } from '../components/ui/DueLabel'
import { EmptyState } from '../components/ui/EmptyState'
import { filterFollowUps, viewForFollowUp } from '../utils/followUpQuery'
import { FOLLOW_UP_TYPE_LABEL, PRIORITY_LABEL } from '../utils/labels'
import { telUrl, whatsAppMessage, whatsAppUrl } from '../utils/phone'
import { agentName } from '../utils/records'
import { cx } from '../utils/cx'

const VIEWS: { id: FollowUpView; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

function isView(value: string | null): value is FollowUpView {
  return VIEWS.some((view) => view.id === value)
}

export function FollowUpsPage() {
  const { state, completeFollowUp, deleteFollowUp } = useApp()
  const { openFollowUpForm } = useUi()
  const confirm = useConfirm()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const focus = params.get('focus')
  const [view, setView] = useState<FollowUpView>(isView(params.get('view')) ? (params.get('view') as FollowUpView) : 'today')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [status, setStatus] = useState<'all' | 'pending' | 'completed'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const viewParam = params.get('view')

  useEffect(() => {
    if (focus) {
      const item = state.followUps.find((followUp) => followUp.id === focus)
      if (item) setView(viewForFollowUp(item))
      window.requestAnimationFrame(() => {
        document.getElementById(`follow-up-${focus}`)?.scrollIntoView({ block: 'center' })
      })
      return
    }
    if (isView(viewParam)) setView(viewParam)
  }, [focus, viewParam])

  const rows = useMemo(
    () => filterFollowUps(state.followUps, { view, priority, status, from, to, sortDir }),
    [state.followUps, view, priority, status, from, to, sortDir],
  )

  function changeView(next: FollowUpView) {
    setView(next)
    const nextParams = new URLSearchParams(params)
    nextParams.set('view', next)
    nextParams.delete('focus')
    setParams(nextParams, { replace: true })
  }

  async function onDelete(id: string, title: string) {
    const ok = await confirm({
      title: `Delete “${title}”?`,
      message: 'The follow-up is removed from this browser demo. The lead stays.',
      confirmLabel: 'Delete follow-up',
      tone: 'danger',
    })
    if (!ok) return
    deleteFollowUp(id)
    toast.success('Follow-up deleted')
  }

  const profile = state.agents.find((agent) => agent.id === state.settings.demoAgentId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeView(item.id)}
              className={cx(
                'rounded-md px-3 py-1.5 text-sm',
                view === item.id ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => openFollowUpForm()} disabled={state.leads.length === 0}>
          Schedule follow-up
        </Button>
      </div>

      <div className={`${cardClass} grid gap-2 p-3 md:grid-cols-5`}>
        <label className="text-xs text-slate-500">
          From
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={`${controlClass} mt-1`} />
        </label>
        <label className="text-xs text-slate-500">
          To
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={`${controlClass} mt-1`} />
        </label>
        <label className="text-xs text-slate-500">
          Priority
          <select className={`${controlClass} mt-1`} value={priority} onChange={(event) => setPriority(event.target.value as Priority | 'all')}>
            <option value="all">Any</option>
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {PRIORITY_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Status
          <select className={`${controlClass} mt-1`} value={status} onChange={(event) => setStatus(event.target.value as 'all' | 'pending' | 'completed')}>
            <option value="all">Any</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Sort by due date
          <select className={`${controlClass} mt-1`} value={sortDir} onChange={(event) => setSortDir(event.target.value as 'asc' | 'desc')}>
            <option value="asc">Soonest first</option>
            <option value="desc">Latest first</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className={cardClass}>
          <EmptyState
            icon={CalendarClock}
            title="No follow-ups in this view"
            description="Change the tab or filters, or schedule a follow-up for an existing lead."
            action={
              <Button onClick={() => openFollowUpForm()} disabled={state.leads.length === 0} title={state.leads.length === 0 ? 'Add a lead first' : undefined}>
                Schedule follow-up
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((item) => {
            const lead = state.leads.find((entry) => entry.id === item.leadId)
            const message = whatsAppMessage(lead?.fullName ?? 'there', state.settings.agencyName, profile?.name ?? 'Skyline Realty')
            return (
              <li
                key={item.id}
                id={`follow-up-${item.id}`}
                className={cx(cardClass, 'p-4', focus === item.id && 'ring-2 ring-indigo-300', item.status === 'pending' && view === 'overdue' && 'border-rose-200')}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <PriorityBadge priority={item.priority} />
                      <FollowUpStatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {FOLLOW_UP_TYPE_LABEL[item.type]} · {agentName(state.agents, item.assignedTo)}
                      {lead ? (
                        <>
                          {' '}
                          · <Link className="text-indigo-700" to={`/leads/${lead.id}`}>{lead.fullName}</Link>
                        </>
                      ) : (
                        ' · Lead removed'
                      )}
                    </p>
                    {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                    <div className="mt-1 text-sm">
                      <DueLabel iso={item.dueAt} dateFormat={state.settings.dateFormat} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead ? (
                      <>
                        <a className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-medium" href={telUrl(lead.phone)}>
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                        <a
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-medium"
                          href={whatsAppUrl(lead.phone, message)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </>
                    ) : null}
                    {item.status === 'pending' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          completeFollowUp(item.id)
                          toast.success('Follow-up completed')
                        }}
                      >
                        Complete
                      </Button>
                    ) : null}
                    <Button size="sm" variant="secondary" onClick={() => openFollowUpForm({ followUpId: item.id })}>
                      <Pencil className="h-3.5 w-3.5" />
                      {item.status === 'pending' ? 'Reschedule' : 'Edit'}
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${item.title}`} onClick={() => void onDelete(item.id, item.title)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
