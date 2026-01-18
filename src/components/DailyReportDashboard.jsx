import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
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

  // Group by Technician and then Count by Type
  const reportData = filteredTickets.reduce((acc, curr) => {
    const rawTech = curr.technician || 'Unknown'
    const tech = normalizeTechName(rawTech)
    
    let type = (curr.ticketType || 'UNSPEC').toUpperCase()
    // Normalize Type
    if (type === 'REGULER') type = 'REGULAR'

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
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-body'),
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
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Daily Report</h2>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleCapture}
            className="btn-primary"
            style={{ height: '38px', whiteSpace: 'nowrap' }}
            title="Download Screenshot"
          >
            📷 Export Image
          </button>

          <div className="input-group" style={{ marginBottom: 0, width: 'auto' }}>
            <label style={{ marginRight: '0.5rem', display: 'inline-block' }}>Rows:</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '8px' }}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={10000}>All</option>
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0, width: 'auto' }}>
            <label style={{ marginRight: '0.5rem', display: 'inline-block' }}>Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ padding: '0.4rem', borderRadius: '8px' }}
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0, width: 'auto' }}>
            <label style={{ marginRight: '0.5rem', display: 'inline-block' }}>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '0.4rem', borderRadius: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="table-container" ref={reportRef}>
        {/* Header for Screenshot */}
        <div style={{ display: itemsPerPage > 1000 ? 'block' : 'none', padding: '1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Production Report: {selectedRegion}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Date: {selectedDate}</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Technician</th>
              {TICKET_TYPES.map(type => (
                <th key={type} style={{ textAlign: 'center' }}>{type}</th>
              ))}
              <th style={{ textAlign: 'center', background: '#f8fafc' }}>OTHERS</th>
              <th style={{ textAlign: 'center', fontWeight: 'bold' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedTechs.length === 0 ? (
              <tr>
                <td colSpan={TICKET_TYPES.length + 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No tickets found for {selectedDate}.
                </td>
              </tr>
            ) : (
              paginatedTechs.map(tech => (
                <tr key={tech}>
                  <td style={{ fontWeight: '500' }}>{tech}</td>
                  {TICKET_TYPES.map(type => (
                    <td key={type} style={{ textAlign: 'center' }}>
                      {reportData[tech][type] || '-'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', background: '#f8fafc' }}>
                    {reportData[tech]['OTHERS'] || '-'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'rgba(var(--primary-rgb), 0.1)' }}>
                    {reportData[tech].total}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {sortedTechs.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold' }}>
                <td>Grand Total</td>
                {TICKET_TYPES.map(type => (
                  <td key={type} style={{ textAlign: 'center' }}>
                    {filteredTickets.filter(t => (t.ticketType || 'UNSPEC').toUpperCase() === type).length}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                   {filteredTickets.filter(t => {
                      const type = (t.ticketType || 'UNSPEC').toUpperCase()
                      return !TICKET_TYPES.includes(type)
                   }).length}
                </td>
                <td style={{ textAlign: 'center' }}>{filteredTickets.length}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedTechs.length > 0 && itemsPerPage < 1000 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary btn-small">Previous</button>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary btn-small">Next</button>
        </div>
      )}
    </div>
  )
}
