import { Download, Upload } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useUi } from '../../context/UiContext'
import { csvTemplate, parseLeadCsv, type CsvIssue, type ParsedLeadRow } from '../../utils/csv'
import { downloadText } from '../../utils/download'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function CsvImportModal() {
  const { importOpen, closeImport } = useUi()
  const { state, importLeads } = useApp()
  const toast = useToast()
  const [reading, setReading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedLeadRow[]>([])
  const [issues, setIssues] = useState<CsvIssue[]>([])
  const [fileError, setFileError] = useState('')

  function reset() {
    setReading(false)
    setFileName('')
    setRows([])
    setIssues([])
    setFileError('')
  }

  function onClose() {
    reset()
    closeImport()
  }

  function onFile(file: File | undefined) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Choose a .csv file.')
      setRows([])
      setIssues([])
      return
    }
    if (file.size > 1_000_000) {
      setFileError('This file is larger than 1 MB. Split it and try again.')
      return
    }
    setReading(true)
    setFileError('')
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const parsed = parseLeadCsv(text, state.agents, state.properties, state.settings)
      setRows(parsed.rows)
      setIssues(parsed.issues)
      setReading(false)
    }
    reader.onerror = () => {
      setReading(false)
      setFileError('The file could not be read.')
    }
    reader.readAsText(file)
  }

  function onImport() {
    const count = importLeads(rows.map((row) => row.input))
    toast.success(`Imported ${count} lead${count === 1 ? '' : 's'}`)
    onClose()
  }

  return (
    <Modal
      open={importOpen}
      title="Import leads"
      description="Import adds new leads. It does not update records that are already in this browser."
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => downloadText(`leadflow-template-${format(new Date(), 'yyyy-MM-dd')}.csv`, csvTemplate(), 'text/csv')}
          >
            <Download className="h-4 w-4" />
            Download template
          </Button>
        </div>
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          <Upload className="mx-auto mb-2 h-5 w-5 text-slate-400" />
          <span className="font-medium text-slate-800">Choose a CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="mt-3 block w-full text-sm"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </label>
        {reading ? <p className="text-sm text-slate-500">Reading {fileName}…</p> : null}
        {fileError ? (
          <p className="text-sm text-rose-700" role="alert">
            {fileError}
          </p>
        ) : null}
        {fileName && !reading ? (
          <p className="text-sm text-slate-700">
            {fileName}: {rows.length} valid row{rows.length === 1 ? '' : 's'}
            {issues.length > 0 ? `, ${issues.length} with errors` : ''}.
          </p>
        ) : null}
        {issues.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-auto rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {issues.map((issue) => (
              <li key={`${issue.row}-${issue.message}`}>
                {issue.row > 0 ? `Row ${issue.row}: ` : ''}
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onImport} disabled={rows.length === 0 || reading}>
            Import {rows.length > 0 ? rows.length : ''} lead{rows.length === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
