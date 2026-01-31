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
import MotivationalWidget from './MotivationalWidget'

import { TEKNISI_LIST, WORKZONES, TICKET_TYPES } from '../constants'

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

   const normalizeTicketType = (type) => {
      if (!type) return 'UNSPECIFIED'
      const upperType = type.toUpperCase().trim()
      // Normalize common typos
      if (upperType === 'REGULAR') return 'REGULER'
      return upperType
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
         const rawType = curr.ticketType || 'UNSPECIFIED'
         const type = normalizeTicketType(rawType)

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
            backgroundColor: '#0f172a', // Force dark background for pro look
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
         <div className="glass-panel p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <BarChart3 className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-extrabold text-foreground">Productivity Dashboard</h2>
                  <p className="text-sm text-muted-foreground font-medium">Daily performance metrics & ranking</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
               <div className="flex bg-white/20 dark:bg-slate-900/40 rounded-xl p-1 border border-white/10 backdrop-blur-sm">
                  <select
                     className="bg-transparent text-sm font-bold text-foreground py-1.5 px-3 focus:outline-none cursor-pointer [&>option]:text-black [&>option]:dark:text-white"
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
                     className="bg-white/20 dark:bg-slate-900/40 border border-white/10 text-foreground text-sm font-bold py-2 px-3 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm backdrop-blur-sm"
                  />
               </div>

               <button
                  onClick={handleCapture}
                  className="btn-primary flex items-center gap-2 px-4 py-2"
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
            <div className="glass-panel p-6 relative overflow-hidden">
               <div className="flex items-start justify-between">
                  <div>
                     <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Top Performer</p>
                     {topPerformer ? (
                        <>
                           <h3 className="text-lg font-extrabold text-foreground truncate max-w-[200px]" title={topPerformer.name}>
                              {topPerformer.name}
                           </h3>
                           <p className="text-3xl font-extrabold text-primary mt-1">
                              {topPerformer.count} <span className="text-sm text-muted-foreground font-normal">tickets</span>
                           </p>
                        </>
                     ) : (
                        <p className="text-muted-foreground italic">No data yet</p>
                     )}
                  </div>
                  <div className="bg-yellow-500/10 p-3 rounded-full text-yellow-500">
                     <Trophy className="w-6 h-6" />
                  </div>
               </div>
            </div>

            {/* Card 3: Active Techs */}
            <div className="glass-panel p-6">
               <div className="flex items-start justify-between">
                  <div>
                     <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Active Technicians</p>
                     <h3 className="text-4xl font-extrabold text-foreground">{sortedTechs.length}</h3>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-full text-purple-500">
                     <Users className="w-6 h-6" />
                  </div>
               </div>
            </div>
         </div>

         {/* 3. Leaderboard Table */}
         <div className="glass-panel overflow-hidden" ref={reportRef}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 dark:bg-slate-900/50">
               <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" /> Leaderboard
               </h3>
               <div className="text-xs font-bold text-muted-foreground uppercase bg-white/10 px-2 py-1 rounded">
                  {selectedRegion}
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/10 dark:bg-slate-900/30 border-b border-white/10">
                     <tr>
                        <th className="px-2 py-4 w-12 text-center">Rank</th>
                        <th className="px-2 py-4 min-w-[150px]">Technician</th>
                        {TICKET_TYPES.map(type => (
                           <th key={type} className="px-1 py-4 text-center hidden md:table-cell text-[10px] sm:text-xs">{type}</th>
                        ))}
                        <th className="px-2 py-4 text-center font-bold w-20 bg-white/5 dark:bg-slate-800/50">Total</th>
                        <th className="px-2 py-4 w-40 hidden lg:table-cell">Performance</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 dark:divide-slate-700/30">
                     {paginatedTechs.length === 0 ? (
                        <tr>
                           <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
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
                                 className="hover:bg-primary/5 transition-colors"
                              >
                                 <td className="px-2 py-2 text-center">
                                    {rank === 1 && <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xs mx-auto">1</div>}
                                    {rank === 2 && <div className="w-6 h-6 rounded-full bg-gray-200 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto">2</div>}
                                    {rank === 3 && <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs mx-auto">3</div>}
                                    {rank > 3 && <span className="font-mono text-muted-foreground font-bold text-xs">#{rank}</span>}
                                 </td>
                                 <td className="px-2 py-2 font-bold text-foreground text-xs sm:text-sm">
                                    <div className="line-clamp-1" title={tech}>{tech}</div>
                                 </td>
                                 {TICKET_TYPES.map(type => (
                                    <td key={type} className="px-1 py-2 text-center text-muted-foreground hidden md:table-cell text-xs">
                                       {reportData[tech][type] || '-'}
                                    </td>
                                 ))}
                                 <td className="px-2 py-2 text-center">
                                    <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold rounded-full text-xs">
                                       {total}
                                    </span>
                                 </td>
                                 <td className="px-2 py-2 hidden lg:table-cell align-middle">
                                    <div className="w-full bg-white/10 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                       <div
                                          className="bg-primary h-1.5 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                       ></div>
                                    </div>
                                    <div className="text-[10px] text-right text-muted-foreground mt-1">{percentage}%</div>
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
               <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                     Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg border border-white/10 bg-white/10 text-sm disabled:opacity-50 text-foreground hover:bg-white/20 transition-colors"
                     >
                        Prev
                     </button>
                     <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg border border-white/10 bg-white/10 text-sm disabled:opacity-50 text-foreground hover:bg-white/20 transition-colors"
                     >
                        Next
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* 4. HD Officer Leaderboard */}
         <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 dark:bg-slate-900/50">
               <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" /> HD Officer Performance
               </h3>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/10 dark:bg-slate-900/30 border-b border-white/10">
                     <tr>
                        <th className="px-6 py-4 w-16 text-center">Rank</th>
                        <th className="px-6 py-4 min-w-[200px]">HD Officer</th>
                        {TICKET_TYPES.map(type => (
                           <th key={type} className="px-4 py-4 text-center hidden md:table-cell">{type}</th>
                        ))}
                        <th className="px-6 py-4 text-center font-bold w-32 bg-white/5 dark:bg-slate-800/50">Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 dark:divide-slate-700/30">
                     {sortedHDs.length === 0 ? (
                        <tr>
                           <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
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
                                 className="hover:bg-primary/5 transition-colors"
                              >
                                 <td className="px-6 py-4 text-center">
                                    {rank === 1 && <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold mx-auto">1</div>}
                                    {rank === 2 && <div className="w-8 h-8 rounded-full bg-gray-200 text-slate-600 flex items-center justify-center font-bold mx-auto">2</div>}
                                    {rank === 3 && <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold mx-auto">3</div>}
                                    {rank > 3 && <span className="font-mono text-muted-foreground font-bold">#{rank}</span>}
                                 </td>
                                 <td className="px-6 py-4 font-bold text-foreground">
                                    {hd}
                                 </td>
                                 {TICKET_TYPES.map(type => (
                                    <td key={type} className="px-4 py-4 text-center text-muted-foreground hidden md:table-cell">
                                       {hdData[hd][type] || '-'}
                                    </td>
                                 ))}
                                 <td className="px-6 py-4 text-center">
                                    <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-500 font-bold rounded-full">
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
