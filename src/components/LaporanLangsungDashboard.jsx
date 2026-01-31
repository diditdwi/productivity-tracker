import React, { useState, useEffect } from 'react'
import {
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  ArrowRight
} from 'lucide-react'
import {
  TELEGRAM_GROUPS,
  API_URL_LAPORAN,
  API_URL_WA_GROUPS,
  API_URL_SEND_WA,
  API_URL_SEND_TELEGRAM,
  TEKNISI_LIST,
  WORKZONES,
  HD_OFFICERS,
  API_URL,
  WA_SERVICE_URL
} from '../constants'
import { cn } from '../lib/utils'

export default function LaporanLangsungDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [waGroups, setWaGroups] = useState([])
  const [sendModal, setSendModal] = useState({ isOpen: false, report: null, tech: '', group: TELEGRAM_GROUPS[0].id, platform: 'TELEGRAM' })

  // Closing Modal State
  const [closingReport, setClosingReport] = useState(null)
  const [closeForm, setCloseForm] = useState({
    technician: '',
    workzone: '',
    action: '',
    hdOfficer: ''
  })
  const [showTechDropdown, setShowTechDropdown] = useState(false)
  const [showWZDropdown, setShowWZDropdown] = useState(false)
  const [showHDDropdown, setShowHDDropdown] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Pagination Logic
  const totalPages = Math.ceil(reports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReports = itemsPerPage === 10000 ? reports : reports.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    fetchLaporan()
    const interval = setInterval(fetchLaporan, 30000) // Auto refresh
    return () => clearInterval(interval)
  }, [])

  const fetchLaporan = async () => {
    try {
      const res = await fetch(API_URL_LAPORAN)
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (e) {
      console.error('Failed to fetch reports', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchWaGroups = async () => {
    try {
      const res = await fetch(API_URL_WA_GROUPS)
      if (res.ok) {
        const data = await res.json()
        setWaGroups(data)
      }
    } catch (e) {
      console.error('Failed to fetch WA groups', e)
    }
  }

  useEffect(() => {
    fetchWaGroups() // Fetch groups on mount
  }, [])

  const handleProcessAndSend = (r) => {
    setSendModal({ isOpen: true, report: r, tech: '', group: TELEGRAM_GROUPS[0].id, platform: 'TELEGRAM' });
  }

  const confirmSend = async () => {
    const { report, tech, group, platform } = sendModal;
    if (!report) return;

    setLoading(true);

    let mentionText = "";
    if (tech) {
      mentionText = `\n\nCC: @${tech.replace('@', '')}`;
    }

    // FFG Flag Info
    let ffgInfo = "";
    if (report.isFFG) {
      ffgInfo = `\n⚠️ <b>FLAG: FFG</b> (Umur Garansi: ${report.umurGaransi || 'N/A'} hari)`;
    }

    // Common Message Format - Use HTML for Telegram, Markdown for WhatsApp
    const message = platform === 'TELEGRAM'
      ? `<b>ORDER TEKNISI</b>
No Tiket: ${report.ticketId}
Nama: ${report.nama}
Alamat: ${report.alamat}
No Layanan: ${report.noInternet}
Kendala: ${report.keluhan}
SN ONT: ${report.snOnt}
CP: ${report.pic}${ffgInfo}
Mohon segera dicek.${mentionText}`
      : `*ORDER TEKNISI*
No Tiket: ${report.ticketId}
Nama: ${report.nama}
Alamat: ${report.alamat}
No Layanan: ${report.noInternet}
Kendala: ${report.keluhan}
SN ONT: ${report.snOnt}
CP: ${report.pic}${ffgInfo}
Mohon segera dicek.${mentionText}`;

    try {
      let res;
      if (platform === 'WHATSAPP') {
        res = await fetch(`${WA_SERVICE_URL}/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, groupId: group })
        });
      } else {
        res = await fetch(API_URL_SEND_TELEGRAM, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, groupId: group })
        });
      }

      if (res.ok) {
        alert(`✅ Terkirim ke ${platform === 'WHATSAPP' ? 'WhatsApp' : 'Telegram'}!`);
        setSendModal({ ...sendModal, isOpen: false });
      } else {
        const errData = await res.json();
        alert(`❌ Gagal kirim: ${errData.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error sending: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const initiateClose = (r) => {
    let defaultWZ = '';
    if (r.hsa && r.hsa !== '-') {
      if (r.hsa.includes('RAJAWALI')) defaultWZ = 'RJW';
      else if (r.hsa.includes('MAJALAYA')) defaultWZ = 'MJY';
      else if (r.hsa.includes('BANJARAN')) defaultWZ = 'BJA';
      else if (r.hsa.includes('CIMAHI')) defaultWZ = 'CMI';
      else if (r.hsa.includes('PADALARANG')) defaultWZ = 'PDL';
      else if (r.hsa.includes('CIANJUR')) defaultWZ = 'CJR';
    }

    setClosingReport(r);
    setCloseForm({
      technician: '',
      workzone: defaultWZ,
      action: 'Selesai perbaikan. OK.',
      hdOfficer: ''
    });
  }

  const submitCloseTicket = async () => {
    if (!closeForm.technician || !closeForm.workzone || !closeForm.hdOfficer) {
      alert("Mohon lengkapi Teknisi, Workzone, dan HD Officer.");
      return;
    }

    if (!window.confirm("Simpan ke Dashboard Utama & Close Tiket?")) return;

    setLoading(true);
    try {
      // 1. Post to Main Dashboard (Archive)
      const ticketPayload = {
        date: new Date().toISOString().split('T')[0],
        ticketType: 'LAPSUNG',
        incident: closingReport.ticketId,
        customerName: closingReport.nama,
        serviceId: closingReport.noInternet,
        serviceType: closingReport.layanan,
        technician: closeForm.technician,
        labcode: '-',
        repair: closeForm.action,
        status: 'Closed',
        workzone: closeForm.workzone,
        hdOfficer: closeForm.hdOfficer
      };

      const resMain = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });

      if (!resMain.ok) {
        throw new Error("Gagal menyimpan ke Dashboard Utama.");
      }

      // 2. Prepare WhatsApp Notification Payload
      let notificationPayload = null;
      try {
        let phoneNumber = closingReport.pic.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) phoneNumber = '62' + phoneNumber.substring(1);
        else if (!phoneNumber.startsWith('62')) phoneNumber = '62' + phoneNumber;

        const waMessage = `*NOTIFIKASI TIKET SELESAI*\n\nHalo, ${closingReport.nama}\n\nTiket Anda telah selesai ditangani:\n📋 No. Tiket: ${closingReport.ticketId}\n📍 Alamat: ${closingReport.alamat}\n📞 No Layanan: ${closingReport.noInternet}\n✅ Status: CLOSED\n🔧 Teknisi: ${closeForm.technician}\n📝 Perbaikan: ${closeForm.action}\n\nTerima kasih telah melaporkan. Jika masih ada kendala, silakan hubungi kami kembali.`;

        notificationPayload = {
          message: waMessage,
          groupId: phoneNumber + '@c.us'
        };
      } catch (err) {
        console.error("Failed to prepare WA payload", err);
      }

      // 3. Update Status in Sheet & Send Notification (Backend Proxy)
      const resStatus = await fetch(API_URL_LAPORAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: closingReport.ticketId,
          status: 'Closed',
          notification: notificationPayload
        })
      });

      if (!resStatus.ok) {
        throw new Error("Gagal update status di Laporan Langsung.");
      }

      alert("✅ Sukses! Data masuk ke Dashboard & Tiket Closed.\n📱 Notifikasi akan dikirim oleh server.");

      setClosingReport(null);
      fetchLaporan();

    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper to flatten WORKZONES for dropdown
  const allWorkzones = Object.values(WORKZONES).flat().sort();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="glass-panel p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Laporan Langsung</h2>
            <p className="text-sm text-muted-foreground font-medium">Real-time reports from external sources</p>
          </div>
        </div>
        <button
          onClick={fetchLaporan}
          className="btn-primary flex items-center gap-2 group"
          disabled={loading}
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* Table - Fixed Layout to prevent scrolling */}
      <div className="glass-panel w-full">
        <div className="w-full">
          <table className="w-full text-xs text-left table-fixed">
            <thead className="text-xs text-muted-foreground uppercase bg-white/10 dark:bg-slate-900/30 border-b border-white/10">
              <tr>
                <th className="px-2 py-3 w-[80px]">Time</th>
                <th className="px-2 py-3 w-[12%]">Nama</th>
                <th className="px-2 py-3 w-[15%]">Alamat</th>
                <th className="px-2 py-3 w-[12%]">No Internet</th>
                <th className="px-2 py-3 w-[15%]">Keluhan</th>
                <th className="px-2 py-3 w-[60px]">Svc</th>
                <th className="px-2 py-3 w-[80px]">SN ONT</th>
                <th className="px-2 py-3 w-[80px]">PIC</th>
                <th className="px-2 py-3 w-[80px]">Status</th>
                <th className="px-2 py-3 w-[90px]">Tiket</th>
                <th className="px-2 py-3 w-[70px] text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 dark:divide-slate-700/30 text-xs">
              {loading ? (
                <tr><td colSpan="11" className="px-2 py-12 text-center text-muted-foreground animate-pulse">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="11" className="px-2 py-12 text-center text-muted-foreground">Belum ada laporan masuk.</td></tr>
              ) : (
                paginatedReports.map(r => (
                  <tr key={r.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-2 py-2 text-muted-foreground truncate">{r.timestamp.split(',')[1] || r.timestamp}</td>
                    <td className="px-2 py-2 font-bold text-foreground truncate" title={r.nama}>{r.nama}</td>
                    <td className="px-2 py-2 text-muted-foreground truncate" title={r.alamat}>{r.alamat}</td>
                    <td className="px-2 py-2 truncate">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-primary truncate">{r.noInternet}</span>
                        {r.isFFG && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 w-fit">
                            FFG
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground truncate" title={r.keluhan}>{r.keluhan}</td>
                    <td className="px-2 py-2 text-foreground truncate text-[10px]">{r.layanan}</td>
                    <td className="px-2 py-2 font-mono text-[10px] text-muted-foreground truncate" title={r.snOnt}>{r.snOnt}</td>
                    <td className="px-2 py-2 text-muted-foreground truncate">{r.pic}</td>
                    <td className="px-2 py-2 truncate">
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset truncate max-w-full",
                        r.status.toLowerCase().includes('open') ? "bg-red-500/10 text-red-500 ring-red-500/20" :
                          r.status.toLowerCase().includes('closed') ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" :
                            "bg-slate-500/10 text-slate-500 ring-slate-500/20"
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono font-bold text-primary truncate text-[10px]" title={r.ticketId}>{r.ticketId}</td>
                    <td className="px-2 py-2">
                      <div className="flex justify-center gap-1">
                        <button
                          className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-colors"
                          onClick={() => handleProcessAndSend(r)}
                          title="Kirim ke Grup & Mention"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        {r.status !== 'Closed' && (
                          <button
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            onClick={() => initiateClose(r)}
                            title="Closing & Transfer Dashboard"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && reports.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Rows</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-foreground px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={10000}>All</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-white/10 bg-white/10 text-xs font-bold disabled:opacity-50 text-foreground hover:bg-white/20 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-white/10 bg-white/10 text-xs font-bold disabled:opacity-50 text-foreground hover:bg-white/20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEND MODAL */}
      {sendModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 space-y-6 relative">
            <button
              onClick={() => setSendModal({ ...sendModal, isOpen: false })}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Kirim Order
              </h3>
              <p className="text-sm text-muted-foreground">Distribute ticket to tech teams</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-sm",
                  sendModal.platform === 'TELEGRAM'
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-500 shadow-sm"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                )}
                onClick={() => setSendModal(prev => ({ ...prev, platform: 'TELEGRAM', group: TELEGRAM_GROUPS[0].id }))}
              >
                <Send className="w-4 h-4" /> Telegram
              </button>
              <button
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-sm",
                  sendModal.platform === 'WHATSAPP'
                    ? "bg-green-500/10 border-green-500/20 text-green-500 shadow-sm"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                )}
                onClick={() => setSendModal(prev => ({ ...prev, platform: 'WHATSAPP', group: waGroups[0]?.id || '' }))}
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Group</label>
                <div className="relative">
                  <select
                    value={sendModal.group}
                    onChange={e => setSendModal({ ...sendModal, group: e.target.value })}
                    className="w-full h-10 pl-3 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    {sendModal.platform === 'TELEGRAM' ? (
                      TELEGRAM_GROUPS.map(g => <option key={g.id} value={g.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{g.name}</option>)
                    ) : (
                      waGroups.length > 0 ? (
                        waGroups.map(g => <option key={g.id} value={g.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{g.name}</option>)
                      ) : (
                        <option value="" className="text-black dark:text-white bg-white dark:bg-slate-900">Loading Groups...</option>
                      )
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tech Suggestion (Mention)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. ahmad"
                    value={sendModal.tech}
                    onChange={e => setSendModal({ ...sendModal, tech: e.target.value })}
                    className="w-full h-10 pl-9 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  />
                  <span className="absolute left-3 top-3 text-muted-foreground font-mono text-xs">@</span>
                </div>
              </div>
            </div>

            <button
              className={cn(
                "w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2",
                sendModal.platform === 'WHATSAPP' ? "bg-green-600 hover:bg-green-700" : "bg-sky-600 hover:bg-sky-700"
              )}
              onClick={confirmSend}
            >
              Send to {sendModal.platform === 'WHATSAPP' ? 'WhatsApp' : 'Telegram'} <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* CLOSING MODAL */}
      {closingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-6 space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setClosingReport(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Close Ticket
              </h3>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="font-mono text-primary font-bold">{closingReport.ticketId}</span>
                <span>•</span>
                <span>{closingReport.noInternet}</span>
                {closingReport.hsa && (
                  <>
                    <span>•</span>
                    <span className="text-orange-400">HSA: {closingReport.hsa}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Technician</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search technician..."
                    value={closeForm.technician}
                    onChange={e => {
                      setCloseForm({ ...closeForm, technician: e.target.value });
                      setShowTechDropdown(true);
                    }}
                    onFocus={() => setShowTechDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTechDropdown(false), 200)}
                    className="w-full h-10 pl-3 pr-10 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                </div>
                {showTechDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl cursor-custom">
                    {TEKNISI_LIST
                      .filter(t => t.toLowerCase().includes(closeForm.technician.toLowerCase()))
                      .map(t => (
                        <div
                          key={t}
                          onClick={() => {
                            setCloseForm({ ...closeForm, technician: t });
                            setShowTechDropdown(false);
                          }}
                          className="px-3 py-2 text-sm text-slate-200 hover:bg-primary/20 hover:text-white cursor-pointer transition-colors"
                        >
                          {t}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workzone</label>
                <input
                  type="text"
                  placeholder="Select Workzone..."
                  value={closeForm.workzone}
                  onChange={e => {
                    setCloseForm({ ...closeForm, workzone: e.target.value });
                    setShowWZDropdown(true);
                  }}
                  onFocus={() => setShowWZDropdown(true)}
                  onBlur={() => setTimeout(() => setShowWZDropdown(false), 200)}
                  className="w-full h-10 pl-3 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                />
                {showWZDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                    {allWorkzones
                      .filter(w => w.toLowerCase().includes(closeForm.workzone.toLowerCase()))
                      .map(w => (
                        <div
                          key={w}
                          onClick={() => {
                            setCloseForm({ ...closeForm, workzone: w });
                            setShowWZDropdown(false);
                          }}
                          className="px-3 py-2 text-sm text-slate-200 hover:bg-primary/20 hover:text-white cursor-pointer transition-colors"
                        >
                          {w}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">HD Officer</label>
                <input
                  type="text"
                  placeholder="Select HD..."
                  value={closeForm.hdOfficer}
                  onChange={e => {
                    setCloseForm({ ...closeForm, hdOfficer: e.target.value });
                    setShowHDDropdown(true);
                  }}
                  onFocus={() => setShowHDDropdown(true)}
                  onBlur={() => setTimeout(() => setShowHDDropdown(false), 200)}
                  className="w-full h-10 pl-3 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                />
                {showHDDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                    {HD_OFFICERS
                      .filter(h => h.toLowerCase().includes(closeForm.hdOfficer.toLowerCase()))
                      .map(h => (
                        <div
                          key={h}
                          onClick={() => {
                            setCloseForm({ ...closeForm, hdOfficer: h });
                            setShowHDDropdown(false);
                          }}
                          className="px-3 py-2 text-sm text-slate-200 hover:bg-primary/20 hover:text-white cursor-pointer transition-colors"
                        >
                          {h}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Action Taken</label>
                <textarea
                  value={closeForm.action}
                  onChange={e => setCloseForm({ ...closeForm, action: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={submitCloseTicket}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirm & Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
