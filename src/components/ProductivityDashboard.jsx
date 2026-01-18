import React, { useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { 
  Download, 
  Target, 
  TrendingUp, 
  Users, 
  Award, 
  CalendarDays,
  BarChart3,
  Trophy,
  Medal
} from 'lucide-react'
import { cn } from '../lib/utils'

// Constants mapped from App.jsx context
const WORKZONES = {
  'BANDUNG': ['BDK', 'CCD', 'CJA', 'DGO', 'GGK', 'HGM', 'LBG', 'SMD', 'TAS', 'TLE', 'TRG', 'UBR'],
  'BANDUNG BARAT': ['RJW', 'CMI', 'NJG', 'BTJ', 'CKW', 'CLL', 'CPT', 'CSA', 'GNH', 'LEM', 'PDL', 'BJA', 'CWD', 'PNL', 'SOR', 'MJY', 'RCK'],
  'CIANJUR': ['CBE', 'CJG', 'CJR', 'CKK', 'SDL', 'SGA', 'SKM', 'TGE', 'CCL']
}
const TICKET_TYPES = ['SQM', 'REGULER', 'LAPSUNG', 'INFRACARE', 'CNQ', 'UNSPEC']
const TEKNISI_LIST = [
  "20920958 - SAEPUDIN",
  "20931059 - AAN PERMANA",
  "18960565 - AGUNG APRIANSYAH",
  "17900513 - INDRA MARDIANSYAH",
  "20950983 - DWI AGUS MULYANTO",
  "20880008 - TIA SUTIANA",
  "19940024 - DEDE SUHENDAR",
  "18940003 - DADANG KURNIAWAN",
  "15910008 - RAHMAT HIDAYAT",
  "19960032 - CANDRA APRILIANA NUR ADHADI",
  "16950155 - RUDI IRAWAN",
  "22960143 - RIZAL MAULANA",
  "19920117 - ANGGA ANGGARA",
  "18880018 - RIKI SUBAGJA",
  "18900600 - ACENG",
  "22222222 - SURYANA",
  "19900131 - AHMAD NURROHMAN"
] // Simplified list, in real app this might come from props

export default function ProductivityDashboard({ tickets }) {
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [selectedRegion, setSelectedRegion] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentPage, setCurrentPage] = useState(1)
  const reportRef = useRef(null)

  // --- LOGIC ---
  const getRegion = (wzCode) => {
    if (!wzCode) return 'UNKNOWN'
    if (WORKZONES['BANDUNG'].includes(wzCode)) return 'BANDUNG'
    if (WORKZONES['BANDUNG BARAT'].includes(wzCode)) return 'BANDUNG BARAT'
    if (WORKZONES['CIANJUR'].includes(wzCode)) return 'CIANJUR'
    // Fallbacks
    if (wzCode.includes('CIMAHI') || wzCode.includes('PADALARAN')) return 'CIMAHI'
    if (wzCode.includes('SOREANG') || wzCode.includes('CIWIDEY')) return 'SOREANG'
    return 'OTHERS'
  }

  const normalizeTechName = (inputName) => {
    if (!inputName) return 'Unknown'
    const match = TEKNISI_LIST.find(t => t.includes(inputName.toUpperCase()))
    return match || inputName
  }

  const { reportData, hdData, sortedTechs, sortedHDs, totalTicketsToday, topPerformer } = useMemo(() => {
    const filtered = tickets.filter(t => {
      if (!t.date) return false
      const isSameDate = t.date === selectedDate
      
      let isRegionMatch = true
      if (selectedRegion !== 'ALL') {
         const ticketRegion = getRegion(t.workzone)
         isRegionMatch = ticketRegion === selectedRegion
      }
      return isSameDate && isRegionMatch
    })

    const stats = filtered.reduce((acc, curr) => {
      const type = curr.ticketType || 'UNSPECIFIED'

      // Technician Logic
      const rawTech = curr.technician || 'Unknown'
      const tech = normalizeTechName(rawTech)
      if (!acc.tech[tech]) acc.tech[tech] = { total: 0 }
      acc.tech[tech][type] = (acc.tech[tech][type] || 0) + 1
      acc.tech[tech].total += 1

      // HD Officer Logic
      const hd = curr.hdOfficer || 'Unknown'
      if (!acc.hd[hd]) acc.hd[hd] = { total: 0 }
      acc.hd[hd][type] = (acc.hd[hd][type] || 0) + 1
      acc.hd[hd].total += 1

      return acc
    }, { tech: {}, hd: {} })

    const sortedTechs = Object.keys(stats.tech).sort((a, b) => stats.tech[b].total - stats.tech[a].total)
    const sortedHDs = Object.keys(stats.hd).sort((a, b) => stats.hd[b].total - stats.hd[a].total)
    
    const top = sortedTechs.length > 0 ? { name: sortedTechs[0], count: stats.tech[sortedTechs[0]].total } : null

    return { 
      reportData: stats.tech, 
      hdData: stats.hd,
      sortedTechs, 
      sortedHDs,
      totalTicketsToday: filtered.length,
      topPerformer: top
    }
  }, [tickets, selectedDate, selectedRegion])

  // Pagination
  const totalPages = Math.ceil(sortedTechs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTechs = itemsPerPage >= 10000 ? sortedTechs : sortedTechs.slice(startIndex, startIndex + itemsPerPage)

  const handleCapture = async () => {
    if (!reportRef.current) return
    const originalItemsPerPage = itemsPerPage
    setItemsPerPage(10000)
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#1e293b', // Force dark background for pro look
        useCORS: true
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL("image/png")
      link.download = `Productivity_${selectedRegion}_${selectedDate}.png`
      link.click()
    } catch (err) {
      alert("Screenshot failed.")
    } finally {
      setItemsPerPage(originalItemsPerPage)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Productivity Dashboard</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily performance metrics & ranking</p>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 py-1.5 px-3 focus:outline-none cursor-pointer"
                 value={selectedRegion}
                 onChange={e => setSelectedRegion(e.target.value)}
               >
                 <option value="ALL">All Regions</option>
                 {Object.keys(WORKZONES).map(r => <option key={r} value={r}>{r}</option>)}
                 <option value="OTHERS">Others</option>
               </select>
             </div>

             <div className="relative">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold py-2 px-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
             </div>

             <button 
                onClick={handleCapture}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
             >
                <Download className="w-4 h-4" /> Export
             </button>
         </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Card 1: Total Tickets */}
         <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Target className="w-24 h-24" />
            </div>
            <div className="relative z-10">
               <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Total Tickets</p>
               <h3 className="text-4xl font-extrabold">{totalTicketsToday}</h3>
               <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-2 py-1 rounded">
                 <CalendarDays className="w-3 h-3" /> {selectedDate}
               </div>
            </div>
         </div>

         {/* Card 2: Top Performer */}
         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Top Performer</p>
                   {topPerformer ? (
                     <>
                       <h3 className="text-lg font-extrabold text-slate-800 dark:text-white truncate max-w-[200px]" title={topPerformer.name}>
                          {topPerformer.name}
                       </h3>
                       <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                          {topPerformer.count} <span className="text-sm text-slate-400 font-normal">tickets</span>
                       </p>
                     </>
                   ) : (
                     <p className="text-slate-400 italic">No data yet</p>
                   )}
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full text-yellow-600 dark:text-yellow-400">
                    <Trophy className="w-6 h-6" />
                </div>
             </div>
         </div>

         {/* Card 3: Active Techs */}
         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Active Technicians</p>
                   <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white">{sortedTechs.length}</h3>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full text-purple-600 dark:text-purple-400">
                    <Users className="w-6 h-6" />
                </div>
             </div>
         </div>
      </div>

      {/* 3. Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden" ref={reportRef}>
         <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" /> Leaderboard
            </h3>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
               {selectedRegion}
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                 <tr>
                    <th className="px-6 py-4 w-16 text-center">Rank</th>
                    <th className="px-6 py-4 min-w-[200px]">Technician</th>
                    {TICKET_TYPES.map(type => (
                       <th key={type} className="px-4 py-4 text-center hidden md:table-cell">{type}</th>
                    ))}
                    <th className="px-6 py-4 text-center font-bold w-32 bg-slate-50 dark:bg-slate-800/50">Total</th>
                    <th className="px-6 py-4 w-48 hidden lg:table-cell">Performance</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {paginatedTechs.length === 0 ? (
                    <tr>
                       <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                          No performance data found for this date/region.
                       </td>
                    </tr>
                 ) : (
                    paginatedTechs.map((tech, idx) => {
                       const rank = startIndex + idx + 1
                       const total = reportData[tech].total
                       const maxTotal = topPerformer ? topPerformer.count : 1
                       const percentage = Math.round((total / maxTotal) * 100)

                       return (
                          <motion.tr 
                            key={tech} 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                             <td className="px-6 py-4 text-center">
                                {rank === 1 && <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold mx-auto">1</div>}
                                {rank === 2 && <div className="w-8 h-8 rounded-full bg-gray-200 text-slate-600 flex items-center justify-center font-bold mx-auto">2</div>}
                                {rank === 3 && <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold mx-auto">3</div>}
                                {rank > 3 && <span className="font-mono text-slate-400 font-bold">#{rank}</span>}
                             </td>
                             <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                {tech}
                             </td>
                             {TICKET_TYPES.map(type => (
                                <td key={type} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400 hidden md:table-cell">
                                   {reportData[tech][type] || '-'}
                                </td>
                             ))}
                             <td className="px-6 py-4 text-center">
                                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold rounded-full">
                                   {total}
                                </span>
                             </td>
                             <td className="px-6 py-4 hidden lg:table-cell align-middle">
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                   <div 
                                      className="bg-blue-600 h-2.5 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                   ></div>
                                </div>
                                <div className="text-[10px] text-right text-slate-400 mt-1">{percentage}% of top</div>
                             </td>
                          </motion.tr>
                       )
                    })
                 )}
               </tbody>
            </table>
         </div>

         {/* Pagination Footer */}
         {sortedTechs.length > itemsPerPage && itemsPerPage < 10000 && (
             <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                   Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                   <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm disabled:opacity-50"
                   >
                      Prev
                   </button>
                   <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm disabled:opacity-50"
                   >
                      Next
                   </button>
                </div>
             </div>
         )}
      </div>

      {/* 4. HD Officer Leaderboard */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" /> HD Officer Performance
            </h3>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                 <tr>
                    <th className="px-6 py-4 w-16 text-center">Rank</th>
                    <th className="px-6 py-4 min-w-[200px]">HD Officer</th>
                    {TICKET_TYPES.map(type => (
                       <th key={type} className="px-4 py-4 text-center hidden md:table-cell">{type}</th>
                    ))}
                    <th className="px-6 py-4 text-center font-bold w-32 bg-slate-50 dark:bg-slate-800/50">Total</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {sortedHDs.length === 0 ? (
                    <tr>
                       <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                          No HD performance data.
                       </td>
                    </tr>
                 ) : (
                    sortedHDs.map((hd, idx) => {
                       const rank = idx + 1
                       const total = hdData[hd].total
                       return (
                          <tr 
                            key={hd} 
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                             <td className="px-6 py-4 text-center">
                                {rank === 1 && <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold mx-auto">1</div>}
                                {rank === 2 && <div className="w-8 h-8 rounded-full bg-gray-200 text-slate-600 flex items-center justify-center font-bold mx-auto">2</div>}
                                {rank === 3 && <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold mx-auto">3</div>}
                                {rank > 3 && <span className="font-mono text-slate-400 font-bold">#{rank}</span>}
                             </td>
                             <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                {hd}
                             </td>
                             {TICKET_TYPES.map(type => (
                                <td key={type} className="px-4 py-4 text-center text-slate-500 dark:text-slate-400 hidden md:table-cell">
                                   {hdData[hd][type] || '-'}
                                </td>
                             ))}
                             <td className="px-6 py-4 text-center">
                                <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold rounded-full">
                                   {total}
                                </span>
                             </td>
                          </tr>
                       )
                    })
                 )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}
