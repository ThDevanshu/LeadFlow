import type { Agent, LeadInput, Property, Settings } from '../types'
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITIES,
  PROPERTY_TYPES,
} from '../types'
import { PRIORITY_LABEL, PROPERTY_TYPE_LABEL, SOURCE_LABEL, STATUS_LABEL } from './labels'
import { isValidMobile } from './phone'

export type CsvIssue = { row: number; message: string }

export type ParsedLeadRow = { row: number; input: LeadInput }

const HEADER_ALIASES: Record<string, string> = {
  fullname: 'fullName',
  name: 'fullName',
  phone: 'phone',
  mobile: 'phone',
  email: 'email',
  source: 'source',
  status: 'status',
  priority: 'priority',
  assignedto: 'assignedTo',
  agent: 'assignedTo',
  agentname: 'assignedTo',
  budgetmin: 'budgetMin',
  budgetmax: 'budgetMax',
  preferredlocation: 'preferredLocation',
  location: 'preferredLocation',
  propertytype: 'propertyType',
  propertyid: 'propertyId',
  notes: 'notes',
  tags: 'tags',
  nextfollowupat: 'nextFollowUpAt',
  nextfollowup: 'nextFollowUpAt',
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char ?? ''
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      cell = ''
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
    } else {
      cell += char ?? ''
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    if (row.some((value) => value.trim() !== '')) rows.push(row)
  }
  return rows
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function leadsToCsv(leads: LeadInput[], agents: Agent[], properties: Property[]): string {
  const headers = [
    'fullName',
    'phone',
    'email',
    'source',
    'status',
    'priority',
    'agentName',
    'budgetMin',
    'budgetMax',
    'preferredLocation',
    'propertyType',
    'propertyId',
    'notes',
    'tags',
    'nextFollowUpAt',
  ]
  const lines = leads.map((lead) => {
    const agent = agents.find((item) => item.id === lead.assignedTo)
    const property = properties.find((item) => item.id === lead.propertyId)
    const values = [
      lead.fullName,
      lead.phone,
      lead.email,
      lead.source,
      lead.status,
      lead.priority,
      agent?.name ?? '',
      String(lead.budgetMin),
      String(lead.budgetMax),
      lead.preferredLocation,
      lead.propertyType,
      property?.id ?? '',
      lead.notes,
      lead.tags.join(', '),
      lead.nextFollowUpAt ?? '',
    ]
    return values.map(escapeCell).join(',')
  })
  return [headers.join(','), ...lines].join('\n')
}

export function csvTemplate(): string {
  return [
    'fullName,phone,email,source,status,priority,agentName,budgetMin,budgetMax,preferredLocation,propertyType,propertyId,notes,tags,nextFollowUpAt',
    'Aarav Example,+91 98765 43210,aarav.example@example.com,website,new,medium,Rohan Mehta,2500000,3500000,Bandra West,apartment,,Looking for a sea-facing 3BHK,"end-user, family",',
  ].join('\n')
}

function matchLabel<T extends string>(value: string, labels: Record<T, string>, keys: readonly T[]): T | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  for (const key of keys) {
    if (key === normalized || labels[key].toLowerCase() === normalized || key.replaceAll('_', ' ') === normalized) {
      return key
    }
  }
  return null
}

function resolveAgent(value: string, agents: Agent[]): Agent | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  return (
    agents.find((agent) => agent.id.toLowerCase() === normalized || agent.name.toLowerCase() === normalized) ?? null
  )
}

export function parseLeadCsv(
  text: string,
  agents: Agent[],
  properties: Property[],
  settings: Settings,
): { rows: ParsedLeadRow[]; issues: CsvIssue[] } {
  const table = parseCsv(text)
  if (table.length === 0) return { rows: [], issues: [{ row: 0, message: 'The file is empty.' }] }
  const header = table[0]
  if (!header) return { rows: [], issues: [{ row: 0, message: 'The file is empty.' }] }

  const columns = header.map((cell) => HEADER_ALIASES[cell.trim().toLowerCase().replaceAll(/[\s_-]/g, '')] ?? '')
  for (const required of ['fullName', 'phone', 'email']) {
    if (!columns.includes(required)) {
      return {
        rows: [],
        issues: [{ row: 1, message: `Missing required column “${required}”. Download the template and try again.` }],
      }
    }
  }

  const rows: ParsedLeadRow[] = []
  const issues: CsvIssue[] = []

  table.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const record: Record<string, string> = {}
    columns.forEach((key, cellIndex) => {
      if (key) record[key] = (cells[cellIndex] ?? '').trim()
    })

    const rowIssues: string[] = []
    if (record.fullName.trim().length < 2) rowIssues.push('full name is required')
    if (!isValidMobile(record.phone ?? '')) rowIssues.push('phone must be a valid Indian mobile number')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email ?? '')) rowIssues.push('email is invalid')

    const resolvedSource = matchLabel(record.source || 'website', SOURCE_LABEL, LEAD_SOURCES)
    const status = matchLabel(record.status || settings.defaultLeadStatus, STATUS_LABEL, LEAD_STATUSES)
    const priority = matchLabel(record.priority || 'medium', PRIORITY_LABEL, PRIORITIES)
    const propertyType = matchLabel(record.propertyType || 'apartment', PROPERTY_TYPE_LABEL, PROPERTY_TYPES)
    if (!resolvedSource) rowIssues.push(`source must be one of: ${LEAD_SOURCES.join(', ')}`)
    if (!status) rowIssues.push(`status must be one of: ${LEAD_STATUSES.join(', ')}`)
    if (!priority) rowIssues.push(`priority must be one of: ${PRIORITIES.join(', ')}`)
    if (!propertyType) rowIssues.push(`property type must be one of: ${PROPERTY_TYPES.join(', ')}`)

    const agent = resolveAgent(record.assignedTo || '', agents) ?? agents.find((item) => item.id === settings.demoAgentId) ?? agents[0]
    if (!record.assignedTo && !agent) rowIssues.push('add an agent before importing leads')
    if (record.assignedTo && !resolveAgent(record.assignedTo, agents)) {
      rowIssues.push(`unknown agent “${record.assignedTo}”`)
    }

    const budgetMin = Number(record.budgetMin || '0')
    const budgetMax = Number(record.budgetMax || '0')
    if (!Number.isFinite(budgetMin) || budgetMin <= 0) rowIssues.push('budgetMin must be a number greater than zero')
    if (!Number.isFinite(budgetMax) || budgetMax <= 0) rowIssues.push('budgetMax must be a number greater than zero')
    if (Number.isFinite(budgetMin) && Number.isFinite(budgetMax) && budgetMax < budgetMin) {
      rowIssues.push('budgetMax must be at least budgetMin')
    }

    let propertyId: string | null = null
    if (record.propertyId) {
      const property = properties.find((item) => item.id === record.propertyId || item.title.toLowerCase() === record.propertyId.toLowerCase())
      if (!property) rowIssues.push(`unknown property “${record.propertyId}”`)
      else propertyId = property.id
    }

    let nextFollowUpAt: string | null = null
    if (record.nextFollowUpAt) {
      const parsed = new Date(record.nextFollowUpAt)
      if (Number.isNaN(parsed.getTime())) rowIssues.push('nextFollowUpAt is not a valid date')
      else nextFollowUpAt = parsed.toISOString()
    }

    if (rowIssues.length > 0 || !resolvedSource || !status || !priority || !propertyType || !agent) {
      issues.push({ row: rowNumber, message: rowIssues.join('; ') || 'This row could not be imported.' })
      return
    }

    rows.push({
      row: rowNumber,
      input: {
        fullName: record.fullName.trim(),
        phone: record.phone.trim(),
        email: record.email.trim(),
        source: resolvedSource,
        status,
        priority,
        assignedTo: resolveAgent(record.assignedTo || '', agents)?.id ?? agent.id,
        budgetMin,
        budgetMax,
        preferredLocation: record.preferredLocation || 'Not specified',
        propertyType,
        propertyId,
        nextFollowUpAt,
        notes: record.notes || '',
        tags: (record.tags || '')
          .split(/[;,]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    })
  })

  return { rows, issues }
}
