import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  RotateCcw,
  Search,
  FileSpreadsheet,
  Edit as EditIcon,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { cn } from '../lib/utils'

// --- CONSTANTS ---
const TICKET_TYPES = ['SQM', 'REGULER', 'LAPSUNG', 'INFRACARE', 'CNQ', 'UNSPEC']
const SERVICE_TYPES = {
  'General': ['INTERNET', 'VOICE', 'IPTV'],
  'DATIN': ['ASTINET', 'VPN', 'METRO-E', 'SIP-TRUNK', 'Node B', 'OLO', 'WIFI'],
  'INFRACARE': ['Kabel Terjuntai', 'ODP Terbuka']
}
const STATUSES = ['Open', 'In Progress', 'Pending', 'Closed', 'Resolved']
const WORKZONES = {
  'BANDUNG': ['BDK', 'CCD', 'CJA', 'DGO', 'GGK', 'HGM', 'LBG', 'SMD', 'TAS', 'TLE', 'TRG', 'UBR'],
  'BANDUNG BARAT': ['RJW', 'CMI', 'NJG', 'BTJ', 'CKW', 'CLL', 'CPT', 'CSA', 'GNH', 'LEM', 'PDL', 'BJA', 'CWD', 'PNL', 'SOR', 'MJY', 'RCK'],
  'CIANJUR': ['CBE', 'CJG', 'CJR', 'CKK', 'SDL', 'SGA', 'SKM', 'TGE', 'CCL']
}
// Helper to flatten workzones for easy validation
const ALL_ZONES = Object.values(WORKZONES).flat()

// --- MAIN COMPONENT ---
export default function TicketForm({ onSubmit, tickets, initialData, isNewFromReport, user, technicians = [], hdOfficers = [] }) {
  const [mode, setMode] = useState('SINGLE') // SINGLE | BULK | NOTEPAD

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors sticky top-4 z-40">
        <h2 className="text-xl font-extrabold px-4 flex items-center gap-2 text-slate-800 dark:text-white">
          {mode === 'SINGLE' && <EditIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          {mode === 'BULK' && <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />}
          {mode === 'NOTEPAD' && <ClipboardList className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
          <span>
            {mode === 'SINGLE' ? (initialData && !isNewFromReport ? 'Edit Ticket' : 'New Entry') : mode} Mode
          </span>
        </h2>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          {['SINGLE', 'BULK', 'NOTEPAD'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-md transition-all",
                mode === m
                  ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md transform scale-105"
                  : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {mode === 'SINGLE' && (
            <SingleForm onSubmit={onSubmit} initialData={initialData} isNewFromReport={isNewFromReport} user={user} tickets={tickets} />
          )}
          {mode === 'BULK' && (
            <BulkForm onSubmit={onSubmit} user={user} />
          )}
          {mode === 'NOTEPAD' && (
            <NotepadForm onSubmit={onSubmit} user={user} technicians={technicians} hdOfficers={hdOfficers} />
          )}
        </motion.div>
      </AnimatePresence>

      <datalist id="techs-list">
        {technicians.map((tech, idx) => <option key={idx} value={tech} />)}
      </datalist>
      <datalist id="hd-list">
        {hdOfficers.map(off => <option key={off} value={off} />)}
      </datalist>
    </div>
  )
}

// --- SINGLE FORM MODE ---
function SingleForm({ onSubmit, initialData, isNewFromReport, tickets = [] }) {
  const [formData, setFormData] = useState({
    ticketType: 'REGULER',
    incident: '',
    customerName: '',
    serviceId: '',
    serviceType: 'INTERNET',
    technician: '',
    repair: '',
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    workzone: '',
    hdOfficer: ''
  })

  const isUpdateMode = useMemo(() => (initialData && !isNewFromReport) || formData.isUpdate, [initialData, isNewFromReport, formData.isUpdate])

  useEffect(() => {
    if (initialData) setFormData(prev => ({ ...prev, ...initialData }))
  }, [initialData])

  // Auto-switch Service Type options
  useEffect(() => {
    // Logic: Infracare gets specific list. Everyone else gets grouped list (General + DATIN).
    const isInfracare = formData.ticketType === 'INFRACARE'
    const validOptions = isInfracare
      ? SERVICE_TYPES['INFRACARE']
      : [...SERVICE_TYPES['General'], ...SERVICE_TYPES['DATIN']]

    if (!validOptions.includes(formData.serviceType)) {
      setFormData(prev => ({ ...prev, serviceType: validOptions[0] }))
    }
  }, [formData.ticketType])

  const [errors, setErrors] = useState({})

  const validateIncident = (value) => {
    if (!value) return true // Required check handled by browser or elsewhere
    const regex = /^(INC[A-Za-z0-9]+|LAPSUNG_[A-Za-z0-9]+)$/
    return regex.test(value)
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (name === 'incident') {
      const upperVal = value.trim().toUpperCase()
      if (upperVal && !validateIncident(upperVal)) {
        setErrors(prev => ({ ...prev, incident: 'Format Invalid! Must start with "INC" or "LAPSUNG_"' }))
      }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Auto-search for existing Ticket by Incident ID
    if (name === 'incident') {
      // Force Uppercase
      const upperVal = value.toUpperCase()

      // Clear error when typing
      if (errors.incident) setErrors(prev => ({ ...prev, incident: null }))

      if (tickets.length > 0) {
        // Search exact match case-insensitive
        const found = tickets.find(t => t.incident && t.incident.trim().toUpperCase() === upperVal.trim())

        if (found) {
          setFormData({ ...found, isUpdate: true })
          return
        } else {
          if (formData.isUpdate) {
            setFormData(prev => ({ ...prev, [name]: upperVal, isUpdate: false, id: undefined }))
            return
          }
        }
      }

      setFormData(prev => ({ ...prev, [name]: upperVal }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    const incident = formData.incident.trim().toUpperCase()
    if (!validateIncident(incident)) {
      setErrors(prev => ({ ...prev, incident: 'Format must start with "INC" + alphanumeric OR "LAPSUNG_" + alphanumeric' }))
      // toast.error('Invalid Incident Format') // Optional
      return
    }

    // Ensure we submit the sanitized/uppercased incident if needed, or just standard state
    // But since state drives the input, let's keep state as is but validate content.
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xl rounded-xl overflow-hidden transition-colors duration-200">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date & Type */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="ticketType" value={formData.ticketType} onChange={handleChange} options={TICKET_TYPES} />
            </div>
          </div>

          {/* Service Type Selection Logic */}
          {/* Auto-update Service Type when Ticket Type changes is handled via Effect below */}

          <div className="space-y-2">
            <Label>Incident No.</Label>
            <div className="relative">
              <Input
                name="incident"
                value={formData.incident}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="INC... or LAPSUNG_..."
                className={cn(
                  "font-mono font-bold tracking-wide",
                  errors.incident ? "border-red-500 focus-visible:ring-red-500" : ""
                )}
                required
              />
              <div className="absolute right-3 top-2.5">
                <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
            </div>
            {errors.incident && (
              <p className="text-xs text-red-500 font-bold animate-pulse">
                {errors.incident}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{formData.ticketType === 'INFRACARE' ? 'ODP Name' : 'Customer Name'}</Label>
            <Input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="" />
          </div>
        </div>

        {/* Techno & Service */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service ID</Label>
              <Input name="serviceId" value={formData.serviceId} onChange={handleChange} className="font-mono py-2" />
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                options={
                  formData.ticketType === 'INFRACARE'
                    ? SERVICE_TYPES['INFRACARE']
                    : { 'General': SERVICE_TYPES['General'], 'DATIN': SERVICE_TYPES['DATIN'] }
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Workzone</Label>
            <Select name="workzone" value={formData.workzone} onChange={handleChange} options={['Select...', ...ALL_ZONES.sort()]} />
          </div>

          <div className="space-y-2">
            <Label>Technician</Label>
            <Input name="technician" value={formData.technician} onChange={handleChange} placeholder="Search Tech..." list="techs-list" />
          </div>
        </div>

        {/* Full Width Bottom */}
        <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <Label>Perbaikan (Action)</Label>
            <textarea
              name="repair"
              value={formData.repair}
              onChange={handleChange}
              className="w-full min-h-[80px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium transition-colors"
              placeholder="Describe the fix..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" value={formData.status} onChange={handleChange} options={STATUSES} />
            </div>
            <div className="space-y-2">
              <Label>HD Officer</Label>
              <Input name="hdOfficer" value={formData.hdOfficer} onChange={handleChange} list="hd-list" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Save className="w-5 h-5" />
          {isUpdateMode ? 'Update Ticket' : 'Save Ticket'}
        </button>
      </div>
    </form>
  )
}

// --- BULK FORM MODE ---
function BulkForm({ onSubmit }) {
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0])
  const [globalHd, setGlobalHd] = useState('')
  const [rows, setRows] = useState([createEmptyRow(), createEmptyRow(), createEmptyRow()])

  function createEmptyRow() {
    return {
      id: Math.random().toString(36),
      incident: '',
      customerName: '',
      serviceId: '',
      serviceType: 'INTERNET',
      technician: '',
      workzone: '',
      status: 'Open',
      repair: '',
      ticketType: 'REGULER'
    }
  }

  const updateRow = (idx, field, value) => {
    setRows(prev => {
      const newRows = [...prev]
      newRows[idx] = { ...newRows[idx], [field]: value }

      // Auto-update Service Type when Ticket Type changes
      if (field === 'ticketType') {
        const isInfracare = value === 'INFRACARE'
        const validOptions = isInfracare
          ? SERVICE_TYPES['INFRACARE']
          : [...SERVICE_TYPES['General'], ...SERVICE_TYPES['DATIN']]

        if (!validOptions.includes(newRows[idx].serviceType)) {
          newRows[idx].serviceType = validOptions[0]
        }
      }

      return newRows
    })
  }

  const addRow = () => setRows(prev => [...prev, createEmptyRow()])

  const removeRow = (idx) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter((_, i) => i !== idx))
    }
  }

  // Magic Feature: Copy value from first row to all rows
  const copyDown = (field) => {
    const sourceValue = rows[0][field]
    if (!sourceValue) return
    setRows(prev => prev.map(r => ({ ...r, [field]: sourceValue })))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validation
    const validRows = rows.filter(r => r.incident.trim() !== '')
    if (validRows.length === 0) return alert("Fill at least one Incident Number")

    // Prepare payload
    const payload = validRows.map(r => ({
      ...r,
      date: globalDate,
      hdOfficer: globalHd,
      // Fallbacks
      customerName: r.customerName || '-',
      serviceId: r.serviceId || '-'
    }))

    onSubmit(payload)
    // Reset
    setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Settings */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="space-y-2 w-full md:w-48">
          <Label>Global Date</Label>
          <Input type="date" value={globalDate} onChange={e => setGlobalDate(e.target.value)} />
        </div>
        <div className="space-y-2 w-full md:w-64">
          <Label>Global HD Officer</Label>
          <Input value={globalHd} onChange={e => setGlobalHd(e.target.value)} list="hd-list" placeholder="Select Officer..." />
        </div>
        <div className="pb-2 text-sm text-slate-500 dark:text-slate-400 italic">
          * Applied to all submitted tickets
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 w-32">Type</th>
                <th className="px-4 py-3 w-40">Incident</th>
                <th className="px-4 py-3 min-w-[150px]">Customer</th>
                <th className="px-4 py-3 w-32">SVC Type</th>
                <th className="px-4 py-3 w-40 group cursor-pointer" title="Click icon to copy down" onClick={() => copyDown('technician')}>
                  <div className="flex items-center gap-1 hover:text-blue-500">Tech <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th className="px-4 py-3 w-32 group cursor-pointer" title="Click icon to copy down" onClick={() => copyDown('workzone')}>
                  <div className="flex items-center gap-1 hover:text-blue-500">Zone <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th className="px-4 py-3 min-w-[200px]">Action (Fix)</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2 font-mono text-slate-400">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <Select className="h-9 min-w-[100px]" value={row.ticketType} onChange={e => updateRow(idx, 'ticketType', e.target.value)} options={TICKET_TYPES} />
                  </td>
                  <td className="px-2 py-2">
                    <Input className={cn("h-9 font-mono", !row.incident && "border-red-200 dark:border-red-900/30")} placeholder="INC..." value={row.incident} onChange={e => updateRow(idx, 'incident', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <Input className="h-9" placeholder="Name/ID..." value={row.customerName} onChange={e => updateRow(idx, 'customerName', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      className="h-9"
                      value={row.serviceType}
                      onChange={e => updateRow(idx, 'serviceType', e.target.value)}
                      options={
                        row.ticketType === 'INFRACARE'
                          ? SERVICE_TYPES['INFRACARE']
                          : { 'General': SERVICE_TYPES['General'], 'DATIN': SERVICE_TYPES['DATIN'] }
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input className="h-9" list="techs-list" placeholder="Tech..." value={row.technician} onChange={e => updateRow(idx, 'technician', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <Select className="h-9" value={row.workzone} onChange={e => updateRow(idx, 'workzone', e.target.value)} options={{ 'Select...': ['Select...'], 'BANDUNG': WORKZONES.BANDUNG, 'BANDUNG BARAT': WORKZONES['BANDUNG BARAT'], 'CIANJUR': WORKZONES.CIANJUR }} />
                  </td>
                  <td className="px-2 py-2">
                    <Input className="h-9" placeholder="Fix..." value={row.repair} onChange={e => updateRow(idx, 'repair', e.target.value)} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button type="button" onClick={() => removeRow(idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Submit Bulk Tickets
          </button>
        </div>
      </div>
    </form>
  )
}

// --- NOTEPAD FORM MODE (With Live Preview) ---
function NotepadForm({ onSubmit, technicians = [], hdOfficers = [] }) {
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Real-time Parsing Logic
  const parsedPreview = useMemo(() => {
    if (!content.trim()) return []

    // Helper: Resolve NIK <-> Name
    const resolveEntity = (input, list) => {
      if (!input || !list || list.length === 0) return input
      const cleanInput = input.trim()

      // Try finding exact match first to avoid unnecessary change
      if (list.includes(cleanInput)) return cleanInput

      // 1. If NIK (digits) -> Find item starting with this NIK
      if (/^\d+$/.test(cleanInput)) {
        const found = list.find(item => item.startsWith(cleanInput))
        return found || input
      }

      // 2. If Name (text) -> Find item containing this name (case-insensitive)
      // Check against the NAME part (after " - ")
      const found = list.find(item => {
        const parts = item.split(' - ')
        if (parts.length < 2) return false
        const namePart = parts[1].toLowerCase()
        return namePart.includes(cleanInput.toLowerCase())
      })

      return found || input
    }

    return content.trim().split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, idx) => {
        const parts = line.split('|').map(s => s.trim())
        // Minimal validation: check if parts exist
        const isValid = parts.length >= 5
        let [hd, type, wz, tech, status, inc, cust, sid, stype, repair] = parts

        // Auto-resolve Technician & HD
        tech = resolveEntity(tech, technicians)
        hd = resolveEntity(hd, hdOfficers)

        return {
          id: idx,
          original: line,
          isValid,
          data: { hd, type, wz, tech, status, inc, cust, sid, stype, repair }
        }
      })
  }, [content, technicians, hdOfficers])

  const validCount = parsedPreview.filter(p => p.isValid).length

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validCount === 0) return alert("No valid rows to submit.")

    // Convert to payload
    const payload = parsedPreview
      .filter(p => p.isValid)
      .map(p => ({
        date,
        hdOfficer: p.data.hd,
        ticketType: p.data.type || 'REGULER',
        workzone: p.data.wz,
        technician: p.data.tech,
        status: p.data.status || 'Open',
        incident: p.data.inc,
        customerName: p.data.cust || '-',
        serviceId: p.data.sid || '-',
        serviceType: p.data.stype || 'INTERNET',
        repair: p.data.repair || '-'
      }))

    onSubmit(payload)
    setContent('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Input Side */}
      <div className="flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="flex-1">
            <Label>Set Ticket Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 p-2 rounded">
            Format: HD | Type | Zone | Tech | Status | Inc | Name | ID | Svc | Fix
          </div>
        </div>

        <textarea
          className="flex-1 w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
          placeholder={`Paste here...\n\nExample:\nSHOLIHIN | REGULER | BDK | SURYANA | Open | INC123456 | Ahmad | 1223344 | INTERNET | Restart ONT`}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      {/* Preview Side */}
      <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Live Preview ({validCount})
          </h3>
          {validCount > 0 && (
            <button onClick={handleSubmit} className="btn-primary text-xs py-1 px-3 h-8">
              Submit {validCount} Tickets
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {parsedPreview.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ArrowRight className="w-8 h-8 mb-2 opacity-50" />
              <p>Paste data to preview tickets</p>
            </div>
          )}

          {parsedPreview.map((item) => (
            <div key={item.id} className={cn(
              "p-4 rounded-xl border text-sm transition-all group",
              item.isValid
                ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            )}>
              {!item.isValid ? (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                  <AlertCircle className="w-5 h-5" />
                  <span>Invalid Format: Must have 10 parts separated by |</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header: Inc, Type, Status */}
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-2">
                    <div>
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                        {item.data.inc}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {item.data.type} • <span className="text-slate-700 dark:text-slate-300">{item.data.stype}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                      item.data.status.toLowerCase() === 'open' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        item.data.status.toLowerCase().includes('progress') ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    )}>
                      {item.data.status}
                    </div>
                  </div>

                  {/* Technical & Customer Info Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">

                    {/* Left Col: Customer */}
                    <div className="space-y-1">
                      <div className="text-slate-400 font-semibold uppercase text-[10px]">Customer Data</div>
                      <div className="font-medium text-slate-700 dark:text-slate-200 truncate">{item.data.cust}</div>
                      <div className="font-mono text-slate-500">{item.data.sid}</div>
                    </div>

                    {/* Right Col: Tech & Zone */}
                    <div className="space-y-1">
                      <div className="text-slate-400 font-semibold uppercase text-[10px]">Technician</div>
                      <div className="font-medium text-slate-700 dark:text-slate-200 truncate">{item.data.tech}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Zone: {item.data.wz}</span>
                        <span className="text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">HD: {item.data.hd}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Fix */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Note / Action</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-2">
                      "{item.data.repair}"
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// --- SHARED UI COMPONENTS ---
const Label = ({ children }) => (
  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 ml-1 mb-1 block">
    {children}
  </label>
)
const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-400 dark:hover:border-slate-500",
      className
    )}
    {...props}
  />
)
const Select = ({ options, className, ...props }) => {
  const isGrouped = !Array.isArray(options) && typeof options === 'object'

  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer",
          className
        )}
        {...props}
      >
        {isGrouped ? (
          Object.entries(options).map(([group, items]) => (
            <optgroup key={group} label={group} className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800">
              {items.map(opt => (
                <option key={opt} value={opt} className="font-normal bg-white dark:bg-slate-900">{opt}</option>
              ))}
            </optgroup>
          ))
        ) : (
          options.map(opt => (
            <option key={opt} value={opt} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{opt}</option>
          ))
        )}
      </select>
    </div>
  )
}

