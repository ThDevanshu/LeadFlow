import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarPlus, Plus, Building2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useUi } from '../../context/UiContext'
import { cardClass } from '../ui/card'
import { Button } from '../ui/Button'
import { DueLabel } from '../ui/DueLabel'
import { StatusBadge } from '../ui/Badge'
import { formatDate, isTodayDate } from '../../utils/dates'
import { formatBudgetRange, formatInrCompact, formatPercent } from '../../utils/format'
import { FOLLOW_UP_TYPE_LABEL, SOURCE_LABEL } from '../../utils/labels'
import {
  conversionRate,
  countBySource,
  countByStatus,
  leadsCreatedByWeek,
  overdueFollowUps,
  pipelineValue,
} from '../../utils/metrics'
import { agentName } from '../../utils/records'

const COLORS = ['#312e81', '#4338ca', '#6366f1', '#0f766e', '#0369a1', '#b45309', '#64748b', '#94a3b8']

export function DashboardView() {
  const { state } = useApp()
  const { openLeadForm, openPropertyForm, openFollowUpForm } = useUi()
  const { leads, followUps, settings } = state
  const newLeads = leads.filter((lead) => lead.status === 'new').length
  const dueToday = followUps.filter((item) => item.status === 'pending' && isTodayDate(item.dueAt))
  const overdue = overdueFollowUps(followUps)
  const won = leads.filter((lead) => lead.status === 'won').length
  const trend = leadsCreatedByWeek(leads)
  const sources = countBySource(leads).map((item) => ({ name: item.label, value: item.count }))
  const stages = countByStatus(leads)
  const maxStage = Math.max(1, ...stages.map((stage) => stage.count))
  const recent = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)

  const cards = [
    { label: 'Total leads', value: String(leads.length), hint: 'All records in this browser', to: '/leads' },
    { label: 'New leads', value: String(newLeads), hint: 'Status is still New', to: '/leads?status=new' },
    { label: 'Follow-ups due', value: String(dueToday.length), hint: 'Pending and scheduled for today', to: '/follow-ups?view=today' },
    { label: 'Converted leads', value: String(won), hint: 'Marked won', to: '/leads?status=won' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-600">
          Conversion {formatPercent(conversionRate(leads))} · Open pipeline {formatInrCompact(pipelineValue(leads))} ·{' '}
          <Link to="/follow-ups?view=overdue" className={overdue.length > 0 ? 'font-medium text-rose-700' : 'text-slate-600'}>
            {overdue.length} overdue follow-up{overdue.length === 1 ? '' : 's'}
          </Link>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openLeadForm()}>
            <Plus className="h-4 w-4" />
            Add lead
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openPropertyForm()}>
            <Building2 className="h-4 w-4" />
            Add property
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openFollowUpForm()} disabled={leads.length === 0}>
            <CalendarPlus className="h-4 w-4" />
            Schedule follow-up
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className={`${cardClass} block px-4 py-3 hover:border-indigo-200`}>
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-5">
        <article className={`${cardClass} p-4 xl:col-span-3`}>
          <h2 className="text-sm font-semibold text-slate-900">Lead acquisition</h2>
          <p className="mb-3 text-xs text-slate-500">Leads created per week, last 8 weeks</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#4338ca" fill="#e0e7ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className={`${cardClass} p-4 xl:col-span-2`}>
          <h2 className="text-sm font-semibold text-slate-900">Lead sources</h2>
          <p className="mb-3 text-xs text-slate-500">Where current leads came from</p>
          {sources.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No leads to chart yet.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {sources.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
            {sources.map((source, index) => (
              <li key={source.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[index % COLORS.length] }} />
                  {source.name}
                </span>
                <span>{source.value}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className={`${cardClass} p-4`}>
          <h2 className="text-sm font-semibold text-slate-900">Pipeline</h2>
          <p className="mb-3 text-xs text-slate-500">Count and budget midpoint by stage</p>
          <ul className="space-y-2.5">
            {stages.map((stage) => (
              <li key={stage.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{stage.label}</span>
                  <span className="text-slate-500">
                    {stage.count} · {formatInrCompact(stage.value)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${(stage.count / maxStage) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${cardClass} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Today’s follow-ups</h2>
              <p className="text-xs text-slate-500">Pending tasks due today</p>
            </div>
            <Link to="/follow-ups?view=today" className="text-xs font-medium text-indigo-700">
              View all
            </Link>
          </div>
          {dueToday.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Nothing is scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dueToday
                .slice()
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
                .slice(0, 6)
                .map((item) => {
                  const lead = leads.find((entry) => entry.id === item.leadId)
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <Link to={`/leads/${item.leadId}`} className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-700">
                          {lead?.fullName ?? 'Unknown lead'}
                        </Link>
                        <p className="truncate text-xs text-slate-500">
                          {FOLLOW_UP_TYPE_LABEL[item.type]} · {item.title}
                        </p>
                      </div>
                      <DueLabel iso={item.dueAt} dateFormat={settings.dateFormat} />
                    </li>
                  )
                })}
            </ul>
          )}
        </article>
      </section>

      <article className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Recent leads</h2>
          <Link to="/leads" className="text-xs font-medium text-indigo-700">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Lead</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Budget</th>
                <th className="px-4 py-2 font-medium">Agent</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link to={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                      {lead.fullName}
                    </Link>
                    <p className="text-xs text-slate-500">{lead.preferredLocation}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{SOURCE_LABEL[lead.source]}</td>
                  <td className="px-4 py-2.5 text-slate-700">{formatBudgetRange(lead.budgetMin, lead.budgetMax)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{agentName(state.agents, lead.assignedTo)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(lead.createdAt, settings.dateFormat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recent.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">Add a lead to populate the dashboard.</p> : null}
      </article>
      <p className="text-xs text-slate-500">Figures are calculated from sample data in this browser, not live brokerage performance.</p>
    </div>
  )
}
