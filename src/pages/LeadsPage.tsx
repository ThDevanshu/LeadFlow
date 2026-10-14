import { Download, Pencil, Plus, Trash2, Upload, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useApp } from '../context/AppContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import { useUi } from '../context/UiContext'
import type { LeadSortKey, LeadSource, LeadStatus, Priority, PropertyType, SortDirection } from '../types'
import { LEAD_SOURCES, LEAD_STATUSES, PRIORITIES, PROPERTY_TYPES } from '../types'
import { leadsToCsv } from '../utils/csv'
import { downloadText } from '../utils/download'
import { formatDate } from '../utils/dates'
import { formatBudgetRange } from '../utils/format'
import { filterLeads } from '../utils/leadQuery'
import { isLeadStatus, PRIORITY_LABEL, PROPERTY_TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL } from '../utils/labels'
import { agentName, nextDueAt } from '../utils/records'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { cardClass } from '../components/ui/card'
import { controlClass } from '../components/ui/Field'
import { DueLabel } from '../components/ui/DueLabel'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'

export function LeadsPage() {
  const { state, deleteLead, bulkUpdateLeads } = useApp()
  const { openLeadForm, openImport } = useUi()
  const confirm = useConfirm()
  const toast = useToast()
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatus | 'all'>(isLeadStatus(params.get('status') ?? '') ? (params.get('status') as LeadStatus) : 'all')
  const [source, setSource] = useState<LeadSource | 'all'>('all')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [agentId, setAgentId] = useState('all')
  const [propertyType, setPropertyType] = useState<PropertyType | 'all'>('all')
  const [sortKey, setSortKey] = useState<LeadSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | ''>('')
  const [bulkAgent, setBulkAgent] = useState('')

  useEffect(() => {
    const next = params.get('status')
    if (isLeadStatus(next ?? '')) setStatus(next as LeadStatus)
  }, [params])

  const filtered = useMemo(
    () => filterLeads(state.leads, state.followUps, { query, status, source, priority, agentId, propertyType, sortKey, sortDir }),
    [state.leads, state.followUps, query, status, source, priority, agentId, propertyType, sortKey, sortDir],
  )

  const filterKey = `${query}|${status}|${source}|${priority}|${agentId}|${propertyType}`
  useEffect(() => {
    setPage(1)
    setSelected([])
  }, [filterKey])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const pageIds = pageRows.map((lead) => lead.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const filtersActive = query !== '' || status !== 'all' || source !== 'all' || priority !== 'all' || agentId !== 'all' || propertyType !== 'all'

  function toggleSort(key: LeadSortKey) {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  function togglePage(checked: boolean) {
    setSelected((current) => (checked ? [...new Set([...current, ...pageIds])] : current.filter((id) => !pageIds.includes(id))))
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)))
  }

  async function onDelete(id: string, name: string) {
    const ok = await confirm({
      title: `Delete ${name}?`,
      message: 'This removes the lead, their follow-ups, and activity history from this browser demo.',
      confirmLabel: 'Delete lead',
      tone: 'danger',
    })
    if (!ok) return
    deleteLead(id)
    setSelected((current) => current.filter((item) => item !== id))
    toast.success('Lead deleted')
  }

  function applyBulk() {
    if (!bulkStatus && !bulkAgent) return
    bulkUpdateLeads(selected, {
      ...(bulkStatus ? { status: bulkStatus } : {}),
      ...(bulkAgent ? { assignedTo: bulkAgent } : {}),
    })
    toast.success(`Updated ${selected.length} lead${selected.length === 1 ? '' : 's'}`)
    setSelected([])
    setBulkStatus('')
    setBulkAgent('')
  }

  function exportCsv() {
    const csv = leadsToCsv(
      filtered.map((lead) => ({ ...lead, nextFollowUpAt: nextDueAt(lead, state.followUps) })),
      state.agents,
      state.properties,
    )
    downloadText(`leadflow-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`, csv, 'text/csv;charset=utf-8')
    toast.success(`Exported ${filtered.length} lead${filtered.length === 1 ? '' : 's'}`)
  }

  function resetFilters() {
    setQuery('')
    setStatus('all')
    setSource('all')
    setPriority('all')
    setAgentId('all')
    setPropertyType('all')
  }

  const sortLabel = (key: LeadSortKey, label: string) => (
    <button type="button" className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort(key)}>
      {label}
      {sortKey === key ? <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span> : null}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{filtered.length} lead{filtered.length === 1 ? '' : 's'} match</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={openImport}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => openLeadForm()}>
            <Plus className="h-4 w-4" />
            Add lead
          </Button>
        </div>
      </div>

      <div className={`${cardClass} space-y-3 p-3`}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, email"
            aria-label="Search leads"
            className={`${controlClass} xl:col-span-2`}
          />
          <select aria-label="Filter by status" className={controlClass} value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | 'all')}>
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
          <select aria-label="Filter by source" className={controlClass} value={source} onChange={(event) => setSource(event.target.value as LeadSource | 'all')}>
            <option value="all">All sources</option>
            {LEAD_SOURCES.map((item) => (
              <option key={item} value={item}>
                {SOURCE_LABEL[item]}
              </option>
            ))}
          </select>
          <select aria-label="Filter by priority" className={controlClass} value={priority} onChange={(event) => setPriority(event.target.value as Priority | 'all')}>
            <option value="all">All priorities</option>
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {PRIORITY_LABEL[item]}
              </option>
            ))}
          </select>
          <select aria-label="Filter by agent" className={controlClass} value={agentId} onChange={(event) => setAgentId(event.target.value)}>
            <option value="all">All agents</option>
            {state.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <select aria-label="Filter by property type" className={controlClass} value={propertyType} onChange={(event) => setPropertyType(event.target.value as PropertyType | 'all')}>
            <option value="all">All property types</option>
            {PROPERTY_TYPES.map((item) => (
              <option key={item} value={item}>
                {PROPERTY_TYPE_LABEL[item]}
              </option>
            ))}
          </select>
        </div>
        {filtersActive ? (
          <button type="button" className="text-sm font-medium text-indigo-700" onClick={resetFilters}>
            Reset filters
          </button>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
          <p className="text-sm font-medium text-indigo-900">{selected.length} selected</p>
          {selected.length < filtered.length ? (
            <button type="button" className="text-sm text-indigo-700" onClick={() => setSelected(filtered.map((lead) => lead.id))}>
              Select all {filtered.length}
            </button>
          ) : null}
          <select aria-label="Bulk status" className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as LeadStatus | '')}>
            <option value="">Set status</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABEL[item]}
              </option>
            ))}
          </select>
          <select aria-label="Bulk assign agent" className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm" value={bulkAgent} onChange={(event) => setBulkAgent(event.target.value)}>
            <option value="">Assign agent</option>
            {state.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={applyBulk} disabled={!bulkStatus && !bulkAgent}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className={`${cardClass} overflow-hidden`}>
        {state.leads.length === 0 ? (
          <EmptyState icon={Users} title="No leads yet" description="Add a lead or import a CSV to start the pipeline." action={<Button onClick={() => openLeadForm()}>Add lead</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No leads match" description="Try a different search or reset the filters." action={<Button variant="secondary" onClick={resetFilters}>Reset filters</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <input type="checkbox" checked={allPageSelected} onChange={(event) => togglePage(event.target.checked)} aria-label="Select all leads on this page" />
                    </th>
                    <th className="px-3 py-2" aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      {sortLabel('name', 'Lead')}
                    </th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2" aria-sort={sortKey === 'budget' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      {sortLabel('budget', 'Budget')}
                    </th>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2" aria-sort={sortKey === 'nextFollowUp' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      {sortLabel('nextFollowUp', 'Next follow-up')}
                    </th>
                    <th className="px-3 py-2" aria-sort={sortKey === 'createdAt' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      {sortLabel('createdAt', 'Created')}
                    </th>
                    <th className="px-3 py-2">Last contact</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(lead.id)}
                          onChange={(event) => toggleRow(lead.id, event.target.checked)}
                          aria-label={`Select ${lead.fullName}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Link to={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                          {lead.fullName}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {lead.phone} · {lead.email}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{SOURCE_LABEL[lead.source]}</td>
                      <td className="px-3 py-2.5 text-slate-700">{formatBudgetRange(lead.budgetMin, lead.budgetMax)}</td>
                      <td className="px-3 py-2.5 text-slate-600">{agentName(state.agents, lead.assignedTo)}</td>
                      <td className="px-3 py-2.5">
                        <DueLabel iso={nextDueAt(lead, state.followUps)} dateFormat={state.settings.dateFormat} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{formatDate(lead.createdAt, state.settings.dateFormat)}</td>
                      <td className="px-3 py-2.5 text-slate-600">{formatDate(lead.lastContactedAt, state.settings.dateFormat)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" aria-label={`Edit ${lead.fullName}`} onClick={() => openLeadForm({ leadId: lead.id })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label={`Delete ${lead.fullName}`} onClick={() => void onDelete(lead.id, lead.fullName)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
