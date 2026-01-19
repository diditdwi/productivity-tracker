import React, { useState, useMemo } from 'react'
import {
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
        (ticket.hdOfficer && ticket.hdOfficer.toLowerCase().includes(term))
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
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 ml-1" />
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="h-3 w-3 text-blue-600 dark:text-blue-400 ml-1" />
      : <ArrowDown className="h-3 w-3 text-blue-600 dark:text-blue-400 ml-1" />
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
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Recent Tickets</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Syncing real-time from Google Sheets</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Incident, Service ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {/* Filter Type */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 appearance-none pr-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <option value="ALL">All Types</option>
              {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Date Range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2 top-2 text-[10px] uppercase font-bold text-slate-400 pointer-events-none">From</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="pl-10 h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pr-2 py-1 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              />
            </div>
            <span className="text-slate-400 text-xs">to</span>
            <div className="relative">
              <span className="absolute left-2 top-2 text-[10px] uppercase font-bold text-slate-400 pointer-events-none">To</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="pl-7 h-9 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pr-2 py-1 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {[
                  { key: 'date', label: 'Date', width: 'w-24' },
                  { key: 'incident', label: 'Incident', width: 'w-32' },
                  { key: 'customerName', label: 'Customer', width: 'w-48' },
                  { key: 'serviceId', label: 'Service', width: 'w-36' },
                  { key: 'ticketType', label: 'Type', width: 'w-24' },
                  { key: 'technician', label: 'Technician', width: 'w-40' },
                  { key: 'workzone', label: 'Workzone', width: 'w-24' },
                  { key: 'status', label: 'Status', width: 'w-28' },
                  { key: 'hdOfficer', label: 'HD Officer', width: 'w-32' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors select-none whitespace-nowrap",
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                      Loading data...
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Search className="h-6 w-6 opacity-30" />
                      </div>
                      <p>No tickets found matching your search.</p>
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{ticket.date}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-all"
                        >
                          {ticket.incident || "NO INC"}
                          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="line-clamp-1 max-w-[200px] text-slate-800 dark:text-slate-200 font-medium" title={ticket.customerName}>
                          {ticket.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{ticket.serviceId}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{ticket.serviceType}</span>
                          {isGaul && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse mt-0.5">
                              <AlertCircle className="h-3 w-3" /> GAUL CHECK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {ticket.ticketType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                        {resolveDisplay(ticket.technician, TEKNISI_LIST)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        {ticket.workzone}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs text-right">
                        {resolveDisplay(ticket.hdOfficer, HD_OFFICERS)}
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
          <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 border-b-2 rounded-b-xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTickets.length)} of {filteredTickets.length}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="h-7 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-xs focus-visible:outline-none cursor-pointer"
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
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    'Open': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800', // Green for Open (Positive action needed)
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'Pending': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    'Resolved': 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400 border-slate-200 dark:border-slate-600',
    'Closed': 'bg-slate-800 text-white dark:bg-slate-900 dark:text-slate-500 border-slate-700 dark:border-slate-800',
  }

  const defaultStyle = 'bg-gray-100 text-gray-700 border-gray-200'
  const activeStyle = styles[status] || defaultStyle

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors shadow-sm", activeStyle)}>
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
