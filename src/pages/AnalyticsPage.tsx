import { endOfDay, format, startOfDay, subDays } from 'date-fns'
import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { cardClass } from '../components/ui/card'
import { controlClass } from '../components/ui/Field'
import { formatDurationHours, formatInrCompact, formatPercent } from '../utils/format'
import {
  agentPerformance,
  averageResponseHours,
  conversionBySource,
  conversionRate,
  countBySource,
  countByStatus,
  decidedCloseRate,
  followUpCompletionRate,
  inRange,
  leadsCreatedOverTime,
  pipelineValue,
  wonBudgetValue,
  wonInPeriod,
} from '../utils/metrics'
import type { DateRange } from '../types'

const COLORS = ['#312e81', '#4338ca', '#6366f1', '#0f766e', '#0369a1', '#b45309', '#64748b', '#94a3b8']

type Preset = '7' | '30' | '90' | 'all' | 'custom'

export function AnalyticsPage() {
  const { state } = useApp()
  const [preset, setPreset] = useState<Preset>('30')
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'))

  const range = useMemo(() => buildRange(preset, from, to, state.leads.map((lead) => lead.createdAt)), [preset, from, to, state.leads])
  const invalidCustom = preset === 'custom' && range === null

  const periodLeads = range ? state.leads.filter((lead) => inRange(lead.createdAt, range)) : []
  const periodFollowUps = range
    ? state.followUps.filter((item) => inRange(item.dueAt, range))
    : []
  const response = averageResponseHours(periodLeads, state.activities)
  const sources = countBySource(periodLeads).map((item) => ({ name: item.label, value: item.count }))
  const statuses = countByStatus(periodLeads).map((item) => ({ name: item.label, value: item.count }))
  const trend = range ? leadsCreatedOverTime(periodLeads, range) : []
  const bySource = conversionBySource(periodLeads)
  const agents = agentPerformance(
    state.agents,
    periodLeads,
    periodFollowUps,
  )

  return (
    <div className="space-y-4">
      <div className={`${cardClass} flex flex-col gap-3 p-3 lg:flex-row lg:items-end lg:justify-between`}>
        <div>
          <p className="text-sm font-medium text-slate-900">Sample analytics</p>
          <p className="text-xs text-slate-500">Calculated from the demo records in this browser. These are not live brokerage results.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select aria-label="Date range" className={controlClass} value={preset} onChange={(event) => setPreset(event.target.value as Preset)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All sample data</option>
            <option value="custom">Custom range</option>
          </select>
          {preset === 'custom' ? (
            <>
              <label className="text-xs text-slate-500">
                From
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={`${controlClass} mt-1`} />
              </label>
              <label className="text-xs text-slate-500">
                To
                <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={`${controlClass} mt-1`} />
              </label>
            </>
          ) : null}
        </div>
      </div>
      {invalidCustom ? <p className="text-sm text-rose-700">Start date must be on or before the end date.</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total leads" value={String(state.leads.length)} hint="All records, ignoring the date range" />
        <Kpi label="Created in period" value={invalidCustom ? '—' : String(periodLeads.length)} hint="New enquiries in the selected dates" />
        <Kpi label="Conversion rate" value={formatPercent(conversionRate(periodLeads))} hint="Won ÷ leads created in the period" />
        <Kpi label="Close rate" value={formatPercent(decidedCloseRate(periodLeads))} hint="Won ÷ decided (won + lost) in the period" />
        <Kpi label="Avg. response time" value={formatDurationHours(response)} hint={response === null ? 'No status change, note, or completed follow-up after creation' : 'Creation to first status change, note, or completed follow-up'} />
        <Kpi label="Won deals" value={invalidCustom || !range ? '—' : String(wonInPeriod(periodLeads, state.activities, range))} hint="Marked won during the period" />
        <Kpi label="Open pipeline" value={formatInrCompact(pipelineValue(periodLeads))} hint="Budget midpoints of open leads created in the period" />
        <Kpi label="Won budget value" value={formatInrCompact(wonBudgetValue(periodLeads))} hint="Budget midpoints, not collected revenue" />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Leads created over time" empty={trend.every((item) => item.leads === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" name="Leads" fill="#4338ca" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Leads by source" empty={sources.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sources} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74}>
                {sources.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Leads by current status" empty={statuses.every((item) => item.value === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statuses}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" name="Leads" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Conversion by source" empty={bySource.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySource}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
              <YAxis unit="%" width={36} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value, _name, item) => [`${value}% (${item.payload.won}/${item.payload.total} won)`, 'Conversion']} />
              <Bar dataKey="rate" name="Conversion" fill="#312e81" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <article className={`${cardClass} p-4`}>
        <h2 className="text-sm font-semibold text-slate-900">Follow-up completion</h2>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPercent(followUpCompletionRate(periodFollowUps))}</p>
        <p className="text-xs text-slate-500">
          Completed ÷ follow-ups due in this period ({periodFollowUps.filter((item) => item.status === 'completed').length} of {periodFollowUps.length}).
        </p>
      </article>

      <article className={`${cardClass} overflow-x-auto`}>
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Agent performance</h2>
          <p className="text-xs text-slate-500">Leads created in the period, and follow-ups due in the period.</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-y border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Agent</th>
              <th className="px-4 py-2 font-medium">Leads</th>
              <th className="px-4 py-2 font-medium">Open</th>
              <th className="px-4 py-2 font-medium">Won</th>
              <th className="px-4 py-2 font-medium">Lost</th>
              <th className="px-4 py-2 font-medium">Follow-ups done</th>
              <th className="px-4 py-2 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.map((agent) => (
              <tr key={agent.agentId || 'unassigned'}>
                <td className="px-4 py-2 font-medium text-slate-900">{agent.name}</td>
                <td className="px-4 py-2">{agent.leads}</td>
                <td className="px-4 py-2">{agent.open}</td>
                <td className="px-4 py-2">{agent.won}</td>
                <td className="px-4 py-2">{agent.lost}</td>
                <td className="px-4 py-2">
                  {agent.followUpsCompleted}/{agent.followUpsDue}
                </td>
                <td className="px-4 py-2">{formatPercent(agent.followUpsDue === 0 ? null : agent.followUpsCompleted / agent.followUpsDue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  )
}

function buildRange(preset: Preset, from: string, to: string, created: string[]): DateRange | null {
  const now = new Date()
  if (preset === 'custom') {
    if (!from || !to) return null
    const start = startOfDay(new Date(`${from}T00:00:00`))
    const end = endOfDay(new Date(`${to}T00:00:00`))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null
    return { from: start, to: end }
  }
  if (preset === 'all') {
    const earliest = created.map((iso) => new Date(iso).getTime()).filter((time) => !Number.isNaN(time)).sort((a, b) => a - b)[0]
    return { from: earliest ? startOfDay(new Date(earliest)) : startOfDay(subDays(now, 90)), to: endOfDay(now) }
  }
  const days = preset === '7' ? 6 : preset === '90' ? 89 : 29
  return { from: startOfDay(subDays(now, days)), to: endOfDay(now) }
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className={`${cardClass} px-4 py-3`}>
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  )
}

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <article className={`${cardClass} p-4`}>
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {empty ? <p className="flex h-56 items-center justify-center text-sm text-slate-500">No leads in this period.</p> : <div className="h-56">{children}</div>}
    </article>
  )
}