import { Building2, LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import { useUi } from '../context/UiContext'
import type { PropertyStatus, PropertyType } from '../types'
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../types'
import { PropertyStatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { cardClass } from '../components/ui/card'
import { controlClass } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { PropertyImage } from '../components/ui/PropertyImage'
import { formatArea, formatInr, formatInrCompact } from '../utils/format'
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from '../utils/labels'
import { cx } from '../utils/cx'

export function PropertiesPage() {
  const { state, deleteProperty } = useApp()
  const { openPropertyForm } = useUi()
  const confirm = useConfirm()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<PropertyType | 'all'>('all')
  const [status, setStatus] = useState<PropertyStatus | 'all'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.properties.filter((property) => {
      if (type !== 'all' && property.propertyType !== type) return false
      if (status !== 'all' && property.status !== status) return false
      if (!q) return true
      return property.title.toLowerCase().includes(q) || property.location.toLowerCase().includes(q)
    })
  }, [state.properties, query, type, status])

  async function onDelete(id: string, title: string) {
    const count = state.leads.filter((lead) => lead.propertyId === id).length
    const ok = await confirm({
      title: `Delete ${title}?`,
      message:
        count > 0
          ? `${count} linked lead${count === 1 ? '' : 's'} will be unlinked. The leads stay in the pipeline.`
          : 'The listing is removed from this browser demo.',
      confirmLabel: 'Delete property',
      tone: 'danger',
    })
    if (!ok) return
    deleteProperty(id)
    toast.success('Property deleted')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{rows.length} listing{rows.length === 1 ? '' : 's'}</p>
        <div className="flex gap-2">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button type="button" aria-label="Grid view" className={cx('rounded-md p-1.5', view === 'grid' && 'bg-white shadow-sm')} onClick={() => setView('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" aria-label="List view" className={cx('rounded-md p-1.5', view === 'list' && 'bg-white shadow-sm')} onClick={() => setView('list')}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => openPropertyForm()}>
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        </div>
      </div>
      <div className={`${cardClass} grid gap-2 p-3 md:grid-cols-3`}>
        <input aria-label="Search properties" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or location" className={controlClass} />
        <select aria-label="Filter by type" className={controlClass} value={type} onChange={(event) => setType(event.target.value as PropertyType | 'all')}>
          <option value="all">All types</option>
          {PROPERTY_TYPES.map((item) => (
            <option key={item} value={item}>
              {PROPERTY_TYPE_LABEL[item]}
            </option>
          ))}
        </select>
        <select aria-label="Filter by status" className={controlClass} value={status} onChange={(event) => setStatus(event.target.value as PropertyStatus | 'all')}>
          <option value="all">All statuses</option>
          {PROPERTY_STATUSES.map((item) => (
            <option key={item} value={item}>
              {PROPERTY_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
      </div>
      {rows.length === 0 ? (
        <div className={cardClass}>
          <EmptyState icon={Building2} title="No properties" description="Add a listing so leads can be linked to it." action={<Button onClick={() => openPropertyForm()}>Add property</Button>} />
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((property) => {
            const count = state.leads.filter((lead) => lead.propertyId === property.id).length
            return (
              <article key={property.id} className={`${cardClass} overflow-hidden`}>
                <PropertyImage property={property} className="h-36 w-full" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/properties/${property.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                        {property.title}
                      </Link>
                      <p className="text-xs text-slate-500">{property.location}</p>
                    </div>
                    <PropertyStatusBadge status={property.status} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatInr(property.price)}</p>
                  <p className="text-xs text-slate-500">
                    {property.bedrooms} bd · {property.bathrooms} ba · {formatArea(property.areaSqFt)}
                  </p>
                  <p className="text-xs text-slate-500">{count} linked lead{count === 1 ? '' : 's'}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => openPropertyForm({ propertyId: property.id })}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void onDelete(property.id, property.title)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className={`${cardClass} overflow-x-auto`}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Property</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Leads</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((property) => (
                <tr key={property.id}>
                  <td className="px-4 py-2">
                    <Link to={`/properties/${property.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                      {property.title}
                    </Link>
                    <p className="text-xs text-slate-500">{property.location}</p>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{PROPERTY_TYPE_LABEL[property.propertyType]}</td>
                  <td className="px-4 py-2">{formatInrCompact(property.price)}</td>
                  <td className="px-4 py-2">
                    <PropertyStatusBadge status={property.status} />
                  </td>
                  <td className="px-4 py-2">{state.leads.filter((lead) => lead.propertyId === property.id).length}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" aria-label={`Edit ${property.title}`} onClick={() => openPropertyForm({ propertyId: property.id })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" aria-label={`Delete ${property.title}`} onClick={() => void onDelete(property.id, property.title)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function PropertyDetailPage() {
  const { propertyId = '' } = useParams()
  const navigate = useNavigate()
  const { state, deleteProperty, linkLeadToProperty } = useApp()
  const { openPropertyForm } = useUi()
  const confirm = useConfirm()
  const toast = useToast()
  const [leadId, setLeadId] = useState('')
  const property = state.properties.find((item) => item.id === propertyId)

  if (!property) {
    return (
      <div className={cardClass}>
        <EmptyState icon={Building2} title="Property not found" description="This listing is not in the demo data." action={<Button onClick={() => navigate('/properties')}>Back to properties</Button>} />
      </div>
    )
  }

  const linked = state.leads.filter((lead) => lead.propertyId === property.id)
  const others = state.leads.filter((lead) => lead.propertyId !== property.id)

  async function onDelete() {
    if (!property) return
    const ok = await confirm({
      title: `Delete ${property.title}?`,
      message: 'Linked leads stay in the pipeline and lose this association.',
      confirmLabel: 'Delete property',
      tone: 'danger',
    })
    if (!ok) return
    deleteProperty(property.id)
    toast.success('Property deleted')
    navigate('/properties')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <article className={`${cardClass} overflow-hidden lg:col-span-2`}>
        <PropertyImage property={property} className="h-56 w-full" />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PropertyStatusBadge status={property.status} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openPropertyForm({ propertyId: property.id })}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void onDelete()}>
                Delete
              </Button>
            </div>
          </div>
          <p className="text-xl font-semibold text-slate-900">{formatInr(property.price)}</p>
          <p className="text-sm text-slate-600">{property.location}</p>
          <p className="text-sm text-slate-600">
            {PROPERTY_TYPE_LABEL[property.propertyType]} · {property.bedrooms} bd · {property.bathrooms} ba · {formatArea(property.areaSqFt)}
          </p>
          <p className="text-sm leading-6 text-slate-700">{property.description}</p>
        </div>
      </article>
      <article className={`${cardClass} p-4`}>
        <h2 className="text-sm font-semibold text-slate-900">Linked leads ({linked.length})</h2>
        <ul className="mt-3 space-y-2">
          {linked.length === 0 ? <li className="text-sm text-slate-500">No leads are linked yet.</li> : null}
          {linked.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between gap-2">
              <Link to={`/leads/${lead.id}`} className="text-sm text-indigo-700">
                {lead.fullName}
              </Link>
              <button type="button" className="text-xs text-slate-500" onClick={() => linkLeadToProperty(lead.id, null)}>
                Unlink
              </button>
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="link-lead">
          Link a lead
        </label>
        <div className="mt-1 flex gap-2">
          <select id="link-lead" className={controlClass} value={leadId} onChange={(event) => setLeadId(event.target.value)}>
            <option value="">Select a lead</option>
            {others.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.fullName}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!leadId}
            onClick={() => {
              linkLeadToProperty(leadId, property.id)
              setLeadId('')
              toast.success('Lead linked')
            }}
          >
            Link
          </Button>
        </div>
      </article>
    </div>
  )
}
