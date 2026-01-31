import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import {
  Download,
  CalendarDays,
  MapPin,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { cn } from '../lib/utils'
import { TEKNISI_LIST, WORKZONES, TICKET_TYPES } from '../constants'

export default function DailyReportDashboard({ tickets }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedRegion, setSelectedRegion] = useState('ALL') // Default ALL, but user can change
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const reportRef = useRef(null)

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [selectedDate, selectedRegion])

  // Helper to determine Region from Workzone Code
  const getRegion = (wzCode) => {
    if (!wzCode) return 'UNKNOWN'

    // Check defined workzones
    for (const [region, zones] of Object.entries(WORKZONES)) {
      if (zones.includes(wzCode)) return region
    }

    // Explicit manual mappings if needed
    if (wzCode.includes('CIMAHI') || wzCode.includes('PADALARAN')) return 'CIMAHI'
    if (wzCode.includes('SOREANG') || wzCode.includes('CIWIDEY') || wzCode.includes('BANJARAN')) return 'SOREANG'
    if (wzCode.includes('BANDUNG BARAT') || wzCode.includes('LEMBANG')) return 'BANDUNG BARAT'
    if (wzCode.includes('SUMEDANG') || wzCode.includes('TANJUNG SARI')) return 'SUMEDANG'
    if (wzCode.includes('SUBANG') || wzCode.includes('PAMANUKAN')) return 'SUBANG'
    if (wzCode.includes('PURWAKARTA') || wzCode.includes('CIKAMPEK')) return 'PURWAKARTA'
    if (wzCode.includes('GARUT') || wzCode.includes('LIMBANGAN')) return 'GARUT'
    if (wzCode.includes('TASIK')) return 'TASIKMALAYA'
    if (wzCode.includes('CIAMIS')) return 'CIAMIS'
    if (wzCode.includes('BANJAR')) return 'BANJAR'
    if (wzCode.includes('PANGANDARAN')) return 'PANGANDARAN'
    if (wzCode.includes('CIANJUR')) return 'CIANJUR'
    if (wzCode.includes('SUKABUMI')) return 'SUKABUMI'

    return 'OTHERS'
  }

  // Filter tickets by selected date and region
  const filteredTickets = tickets.filter(t => {
    if (!t.date) return false

    // Date Check
    const isSameDate = t.date === selectedDate

    // Region Check
    let isRegionMatch = true
    if (selectedRegion !== 'ALL') {
      const ticketRegion = getRegion(t.workzone)
      if (selectedRegion === 'OTHERS') {
        // Should match if not in any known list
        isRegionMatch = ticketRegion === 'OTHERS' || ticketRegion === 'UNKNOWN'
      } else {
        isRegionMatch = ticketRegion === selectedRegion
      }
    }

    return isSameDate && isRegionMatch
  })

  // Helper to normalize technician name
  const normalizeTechName = (inputName) => {
    if (!inputName) return 'Unknown'
    const match = TEKNISI_LIST.find(t => t.includes(inputName.toUpperCase()))
    return match || inputName
  }

  const normalizeTicketType = (type) => {
    if (!type) return 'UNSPEC'
    const upperType = type.toUpperCase().trim()
    // Normalize common typos
    if (upperType === 'REGULAR') return 'REGULER'
    return upperType
  }

  // Group by Technician and then Count by Type
  const reportData = filteredTickets.reduce((acc, curr) => {
    const rawTech = curr.technician || 'Unknown'
    const tech = normalizeTechName(rawTech)

    let type = normalizeTicketType(curr.ticketType)

    if (!TICKET_TYPES.includes(type)) {
      type = 'OTHERS'
    }

    if (!acc[tech]) {
      acc[tech] = { total: 0 }
    }

    acc[tech][type] = (acc[tech][type] || 0) + 1
    acc[tech].total += 1
    return acc
  }, {})

  const sortedTechs = Object.keys(reportData).sort((a, b) => reportData[b].total - reportData[a].total)
  const REGIONS = ['ALL', ...Object.keys(WORKZONES), 'OTHERS']

  // Pagination Logic
  const totalPages = Math.ceil(sortedTechs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTechs = itemsPerPage === 10000 ? sortedTechs : sortedTechs.slice(startIndex, startIndex + itemsPerPage)

  const handleCapture = async () => {
    if (!reportRef.current) return

    // Temporarily show ALL items
    const originalItemsPerPage = itemsPerPage
    setItemsPerPage(10000)

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a', // Force dark background
        useCORS: true,
        ignoreElements: (el) => el.classList.contains('no-print')
      })

      const image = canvas.toDataURL("image/png")
      const link = document.createElement('a')
      link.href = image
      link.download = `Report_${selectedRegion}_${selectedDate}.png`
      link.click()
    } catch (err) {
      console.error("Screenshot failed:", err)
      alert("Gagal membuat screenshot.")
    } finally {
      setItemsPerPage(originalItemsPerPage)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Controls */}
      <div className="glass-panel p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Daily Report</h2>
            <p className="text-sm text-muted-foreground font-medium">Detailed technician performance by region</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Rows Select */}
          <div className="flex items-center gap-2 bg-white/20 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-xs font-bold text-muted-foreground uppercase">Rows</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer [&>option]:text-black [&>option]:dark:text-white"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={10000}>All</option>
            </select>
          </div>

          {/* Region Select */}
          <div className="flex items-center gap-2 bg-white/20 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm flex-1 lg:flex-none min-w-[150px]">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-sm font-bold text-foreground w-full focus:outline-none cursor-pointer [&>option]:text-black [&>option]:dark:text-white"
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/20 dark:bg-slate-900/40 border border-white/10 text-foreground text-sm font-bold py-1.5 px-3 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm backdrop-blur-sm"
            />
          </div>

          <button
            onClick={handleCapture}
            className="btn-primary flex items-center gap-2 px-4 py-2 ml-auto lg:ml-0 whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export Image
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="glass-panel overflow-hidden" ref={reportRef}>
        {/* Header for Screenshot (Only visible when exporting all or if explicitly shown) */}
        <div className={cn("p-6 border-b border-white/10 bg-white/5 dark:bg-slate-900/50 flex justify-between items-center", itemsPerPage > 1000 ? 'flex' : 'hidden')}>
          <div>
            <h3 className="text-lg font-bold text-foreground">Production Report: {selectedRegion}</h3>
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1 mt-1">
              <CalendarDays className="w-3.5 h-3.5" /> {selectedDate}
            </span>
          </div>
          <div className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded uppercase tracking-wider">
            Generated Report
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/10 dark:bg-slate-900/30 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 min-w-[200px]">Technician</th>
                {TICKET_TYPES.map(type => (
                  <th key={type} className="px-4 py-4 text-center">{type}</th>
                ))}
                <th className="px-6 py-4 text-center font-bold bg-white/5 dark:bg-slate-800/50 text-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 dark:divide-slate-700/30">
              {sortedTechs.length === 0 ? (
                <tr>
                  <td colSpan={TICKET_TYPES.length + 2} className="px-6 py-12 text-center text-muted-foreground">
                    No tickets found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                paginatedTechs.map((tech, idx) => (
                  <tr key={tech} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-3 font-semibold text-foreground border-r border-white/5 dark:border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-xs text-muted-foreground font-mono">{(currentPage - 1) * itemsPerPage + idx + 1}.</span>
                        {tech}
                      </div>
                    </td>
                    {TICKET_TYPES.map(type => (
                      <td key={type} className="px-4 py-3 text-center text-muted-foreground">
                        {reportData[tech][type] || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-center font-bold text-primary bg-primary/5 dark:bg-primary/10">
                      {reportData[tech].total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedTechs.length > 0 && (
              <tfoot className="bg-primary/10 font-bold border-t-2 border-primary/20">
                <tr>
                  <td className="px-6 py-4 text-primary">Grand Total</td>
                  {TICKET_TYPES.map(type => (
                    <td key={type} className="px-4 py-4 text-center text-primary">
                      {filteredTickets.filter(t => normalizeTicketType(t.ticketType) === type).length}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center text-white bg-primary">
                    {filteredTickets.length}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedTechs.length > 0 && itemsPerPage < 1000 && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center no-print">
            <div className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-white/10 bg-white/10 disabled:opacity-50 text-foreground hover:bg-white/20 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-white/10 bg-white/10 disabled:opacity-50 text-foreground hover:bg-white/20 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
