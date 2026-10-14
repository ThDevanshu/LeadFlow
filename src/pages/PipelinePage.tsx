import { closestCorners, DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useUi } from '../context/UiContext'
import type { Lead, LeadSource, LeadStatus } from '../types'
import { LEAD_SOURCES, LEAD_STATUSES } from '../types'
import { PriorityBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { cardClass } from '../components/ui/card'
import { controlClass } from '../components/ui/Field'
import { formatBudgetRange, formatInrCompact } from '../utils/format'
import { isLeadStatus, PROPERTY_TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL } from '../utils/labels'
import { budgetMidpoint } from '../utils/format'
import { nextDueAt } from '../utils/records'
import { cx } from '../utils/cx'
import { isBeforeToday } from '../utils/dates'

export function PipelinePage() {
  const { state, setLeadStatus } = useApp()
  const { openLeadForm } = useUi()
  const toast = useToast()
  const navigate = useNavigate()
  const [agentId, setAgentId] = useState('all')
  const [source, setSource] = useState<LeadSource | 'all'>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragged = useRef(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const leads = state.leads.filter((lead) => {
    if (agentId !== 'all' && lead.assignedTo !== agentId) return false
    if (source !== 'all' && lead.source !== source) return false
    return true
  })
  const active = leads.find((lead) => lead.id === activeId) ?? null

  function onDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : ''
    window.setTimeout(() => {
      dragged.current = false
    }, 0)
    setActiveId(null)
    if (!overId) return
    const nextStatus: LeadStatus | undefined = isLeadStatus(overId)
      ? overId
      : state.leads.find((lead) => lead.id === overId)?.status
    const lead = state.leads.find((item) => item.id === leadId)
    if (!lead || !nextStatus || lead.status === nextStatus) return
    setLeadStatus(leadId, nextStatus)
    toast.success(`${lead.fullName} moved to ${STATUS_LABEL[nextStatus]}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter pipeline by agent" className={controlClass} value={agentId} onChange={(event) => setAgentId(event.target.value)}>
            <option value="all">All agents</option>
            {state.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <select aria-label="Filter pipeline by source" className={controlClass} value={source} onChange={(event) => setSource(event.target.value as LeadSource | 'all')}>
            <option value="all">All sources</option>
            {LEAD_SOURCES.map((item) => (
              <option key={item} value={item}>
                {SOURCE_LABEL[item]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-600">
          {leads.length} leads · {formatInrCompact(leads.filter((lead) => lead.status !== 'won' && lead.status !== 'lost').reduce((sum, lead) => sum + budgetMidpoint(lead), 0))} open pipeline
        </p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event) => {
          dragged.current = true
          setActiveId(String(event.active.id))
        }}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          dragged.current = false
          setActiveId(null)
        }}
      >
        <div className="flex gap-3 overflow-x-auto pb-3">
          {LEAD_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              leads={leads.filter((lead) => lead.status === status)}
              followUps={state.followUps}
              onOpen={(id) => {
                if (dragged.current) return
                navigate(`/leads/${id}`)
              }}
              onAdd={() => openLeadForm({ status })}
            />
          ))}
        </div>
        <DragOverlay>{active ? <LeadCard lead={active} followUps={state.followUps} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}

function Column({
  status,
  leads,
  followUps,
  onOpen,
  onAdd,
}: {
  status: LeadStatus
  leads: Lead[]
  followUps: Parameters<typeof nextDueAt>[1]
  onOpen: (id: string) => void
  onAdd: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const value = leads.reduce((sum, lead) => sum + budgetMidpoint(lead), 0)
  return (
    <section className={cx('flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50', isOver && 'border-indigo-300 bg-indigo-50/40')}>
      <header className="flex items-start justify-between gap-2 px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{STATUS_LABEL[status]}</h2>
          <p className="text-xs text-slate-500">
            {leads.length} · {formatInrCompact(value)}
          </p>
        </div>
        <Button size="sm" variant="ghost" aria-label={`Add lead to ${STATUS_LABEL[status]}`} onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </header>
      <div ref={setNodeRef} className="flex min-h-40 flex-1 flex-col gap-2 px-2 pb-3">
        {leads.length === 0 ? <p className="px-2 py-6 text-center text-xs text-slate-400">No leads</p> : null}
        {leads.map((lead) => (
          <DraggableLead key={lead.id} lead={lead} followUps={followUps} onOpen={() => onOpen(lead.id)} />
        ))}
      </div>
    </section>
  )
}

function DraggableLead({
  lead,
  followUps,
  onOpen,
}: {
  lead: Lead
  followUps: Parameters<typeof nextDueAt>[1]
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div ref={setNodeRef} className={cx(isDragging && 'opacity-40')}>
      <LeadCard lead={lead} followUps={followUps} onOpen={onOpen} listeners={listeners} attributes={attributes} />
    </div>
  )
}

function LeadCard({
  lead,
  followUps,
  onOpen,
  listeners,
  attributes,
}: {
  lead: Lead
  followUps: Parameters<typeof nextDueAt>[1]
  onOpen?: () => void
  listeners?: ReturnType<typeof useDraggable>['listeners']
  attributes?: ReturnType<typeof useDraggable>['attributes']
}) {
  const due = nextDueAt(lead, followUps)
  return (
    <article className={cx(cardClass, 'p-3')}>
      <button type="button" className="w-full cursor-grab text-left active:cursor-grabbing" onClick={onOpen} {...listeners} {...attributes}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900">{lead.fullName}</p>
          <PriorityBadge priority={lead.priority} />
        </div>
        <p className="mt-1 text-xs text-slate-600">{formatBudgetRange(lead.budgetMin, lead.budgetMax)}</p>
        <p className="text-xs text-slate-500">
          {PROPERTY_TYPE_LABEL[lead.propertyType]} · {SOURCE_LABEL[lead.source]}
        </p>
        <p className={cx('mt-1 text-xs', due && isBeforeToday(due) ? 'font-medium text-rose-700' : 'text-slate-500')}>
          {due ? `Next: ${new Date(due).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'No follow-up'}
        </p>
      </button>
    </article>
  )
}
