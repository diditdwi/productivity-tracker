import toast from 'react-hot-toast'
import React, { useState, useMemo } from 'react'
import {
  Download,
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { TEKNISI_LIST, HD_OFFICERS } from '../constants'

const TICKET_TYPES = ['SQM', 'REGULER', 'LAPSUNG', 'INFRACARE', 'CNQ', 'UNSPEC']

export default function TicketTable({ tickets, loading, onEditTicket }) {
  const [searchTerm, setSearchTerm] = useState('')
  // Date Range Filter States
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [filterType, setFilterType] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' })

  // Reset page when filtering
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateRange, filterType])

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = (
        (ticket.incident && ticket.incident.toLowerCase().includes(term)) ||
        (ticket.serviceId && ticket.serviceId.toString().toLowerCase().includes(term)) ||
        (ticket.hdOfficer && ticket.hdOfficer.toLowerCase().includes(term)) ||
        (ticket.technician && ticket.technician.toLowerCase().includes(term))
      )

      let matchesDate = true
      if (dateRange.start || dateRange.end) {
        if (!ticket.date) {
          matchesDate = false
        } else {
          const ticketDate = new Date(ticket.date)
          const start = dateRange.start ? new Date(dateRange.start) : new Date('1970-01-01')
          const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-01-01')

          // Normalize comparison to ignore time if needed, but simple comparison works for YYYY-MM-DD
          matchesDate = ticketDate >= start && ticketDate <= end
        }
      }

      const matchesType = filterType === 'ALL' || ticket.ticketType === filterType

      return matchesSearch && matchesDate && matchesType
    })
  }, [tickets, searchTerm, dateRange, filterType])

  // Sorting Logic
  const sortedTickets = useMemo(() => {
    let sortableItems = [...filteredTickets]
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || ''
        let bValue = b[sortConfig.key] || ''

        // Special handling for Service ID
        if (sortConfig.key === 'serviceId') {
          const aNum = parseFloat(aValue)
          const bNum = parseFloat(bValue)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum
            bValue = bNum
          }
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [filteredTickets, sortConfig])

  const requestSort = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  // CSV Download Logic
  const handleDownload = () => {
    if (filteredTickets.length === 0) {
      toast.error("No data to download")
      return
    }

    // Define CSV headers
    const headers = [
      'Date', 'Incident', 'Customer Name', 'Service ID',
      'Service Type', 'Ticket Type', 'Technician', 'Workzone',
      'Status', 'HD Officer'
    ]

    // Convert data to CSV rows
    const csvContent = [
      headers.join(','),
      ...filteredTickets.map(t => [
        `"${t.date || ''}"`,
        `"${t.incident || ''}"`,
        `"${t.customerName || ''}"`,
        `"${t.serviceId || ''}"`,
        `"${t.serviceType || ''}"`,
        `"${t.ticketType || ''}"`,
        `"${t.technician || ''}"`,
        `"${t.workzone || ''}"`,
        `"${t.status || ''}"`,
        `"${t.hdOfficer || ''}"`
      ].join(','))
    ].join('\n')

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Downloaded successfully")
  }

  // Pagination Logic
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + itemsPerPage)

  // GAUL Check Logic
  const checkGaul = (currentTicket) => {
    if (currentTicket.ticketType === 'INFRACARE') return false
    if (!currentTicket.serviceId || !currentTicket.date) return false

    const currentDate = new Date(currentTicket.date)
    if (isNaN(currentDate.getTime())) return false

    return tickets.some(otherTicket => {
      if (otherTicket.id === currentTicket.id) return false
      if (otherTicket.serviceId !== currentTicket.serviceId) return false

      const otherDate = new Date(otherTicket.date)
      if (isNaN(otherDate.getTime())) return false

      const diffTime = currentDate - otherDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays > 0 && diffDays <= 30
    })
  }

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="h-3 w-3 text-muted-foreground ml-1" />
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="h-3 w-3 text-primary ml-1" />
      : <ArrowDown className="h-3 w-3 text-primary ml-1" />
  }

  // Helper to resolve NIK -> Name for display
  const resolveDisplay = (value, list) => {
    if (!value) return '-'
    // If it's already a full string (contains " - "), return it
    if (value.includes(' - ')) return value

    // If it is just digits, try to find it in the list
    if (/^\d+$/.test(value)) {
      const found = list.find(item => item.startsWith(value))
      if (found) return found
    }
    return value
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Controls (Using Glass Panel) */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground bg-clip-text">Recent Tickets</h2>

        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Incident, Service ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-full rounded-xl border border-white/20 bg-white/50 backdrop-blur-sm px-3 py-1 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white"
            />
          </div>

          {/* Filter Type */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 h-10 rounded-xl border border-white/20 bg-white/50 backdrop-blur-sm px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none pr-8 cursor-pointer hover:bg-white/80 transition-all dark:bg-slate-800/50"
            >
              <option value="ALL">All Types</option>
              {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-3 top-3.5 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Filter Date Range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2 top-2 text-[10px] uppercase font-bold text-muted-foreground pointer-events-none">From</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="pl-10 h-10 rounded-xl border border-white/20 bg-white/50 backdrop-blur-sm pr-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:bg-white/80 transition-all dark:bg-slate-800/50"
              />
            </div>
            <span className="text-muted-foreground text-xs">to</span>
            <div className="relative">
              <span className="absolute left-2 top-2 text-[10px] uppercase font-bold text-muted-foreground pointer-events-none">To</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="pl-7 h-10 rounded-xl border border-white/20 bg-white/50 backdrop-blur-sm pr-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:bg-white/80 transition-all dark:bg-slate-800/50"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="table-container bg-white/60 dark:bg-slate-900/60 backdrop-blur-md w-full">
        <div className="w-full">
          <table className="data-table w-full table-fixed text-xs">
            <thead>
              <tr>
                {[
                  { key: 'date', label: 'Date', width: 'w-[90px]' },
                  { key: 'incident', label: 'Incident', width: 'w-[120px]' },
                  { key: 'customerName', label: 'Customer', width: 'w-[18%]' },
                  { key: 'serviceId', label: 'Service', width: 'w-[110px]' },
                  { key: 'ticketType', label: 'Type', width: 'w-[80px]' },
                  { key: 'technician', label: 'Technician', width: 'w-[14%]' },
                  { key: 'workzone', label: 'Workzone', width: 'w-[80px]' },
                  { key: 'status', label: 'Status', width: 'w-[100px]' },
                  { key: 'hdOfficer', label: 'HD Officer', width: 'w-[12%]' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    className={cn(
                      "cursor-pointer hover:text-primary transition-colors select-none whitespace-nowrap px-2 py-3 font-bold text-muted-foreground uppercase tracking-wider",
                      col.width
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon columnKey={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-2 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <span className="text-sm font-medium animate-pulse">Syncing tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-2 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50">
                        <Search className="h-8 w-8 opacity-40" />
                      </div>
                      <p className="font-medium">No tickets found matching your search.</p>
                      <button onClick={() => {setSearchTerm(''); setFilterType('ALL')}} className="text-sm text-primary hover:underline">
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket, idx) => {
                  const isGaul = checkGaul(ticket)
                  return (
                    <motion.tr
                      key={ticket.id || idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors group bg-white/40 dark:bg-slate-900/40"
                    >
                      <td className="font-medium text-foreground whitespace-nowrap px-2 py-2 truncate">{ticket.date}</td>
                      <td className="px-2 py-2 truncate">
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="flex items-center gap-1.5 font-bold text-primary hover:text-primary-dark hover:underline transition-all truncate w-full"
                          title={ticket.incident}
                        >
                          <span className="truncate">{ticket.incident || "NO INC"}</span>
                          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-foreground text-wrap line-clamp-2" title={ticket.customerName}>
                          {ticket.customerName}
                        </div>
                      </td>
                      <td className="px-2 py-2 truncate">
                        <div className="flex flex-col truncate">
                          <span className="font-mono text-xs text-muted-foreground truncate" title={ticket.serviceId}>{ticket.serviceId}</span>
                          <span className="text-[10px] text-muted-foreground opacity-70 truncate" title={ticket.serviceType}>{ticket.serviceType}</span>
                          {isGaul && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse mt-0.5 truncate">
                              <AlertCircle className="h-3 w-3 shrink-0" /> GAUL
                            </span>
                          )}
                          {ticket.isFFG && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md truncate">
                              FFG
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 truncate">
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-sm truncate">
                          {ticket.ticketType}
                        </span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400 px-2 py-2">
                        <div className="text-wrap line-clamp-2" title={ticket.technician}>
                          {resolveDisplay(ticket.technician, TEKNISI_LIST)}
                        </div>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400 font-medium px-2 py-2 truncate">
                        {ticket.workzone}
                      </td>
                      <td className="px-2 py-2 truncate">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="text-muted-foreground text-right px-2 py-2">
                        <div className="text-wrap line-clamp-2 inline-block text-right" title={ticket.hdOfficer}>
                          {resolveDisplay(ticket.hdOfficer, HD_OFFICERS)}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredTickets.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTickets.length)} of {filteredTickets.length}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-7 rounded-lg border border-white/30 bg-white/50 dark:bg-slate-800 px-2 text-xs focus-visible:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/50 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/50 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'Open': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800', 
    'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'Pending': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    'Resolved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', // Green for Resolved
    'Closed': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  }

  const defaultStyle = 'bg-gray-100 text-gray-700 border-gray-200'
  const activeStyle = styles[status] || defaultStyle

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all shadow-sm", activeStyle)}>
      {status}
    </span>
  )
}

function ChevronDownIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
