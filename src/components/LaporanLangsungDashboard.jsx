import React, { useState, useEffect } from 'react'
import {
  TELEGRAM_GROUPS,
  API_URL_LAPORAN,
  API_URL_WA_GROUPS,
  API_URL_SEND_WA,
  API_URL_SEND_TELEGRAM,
  TEKNISI_LIST,
  WORKZONES,
  HD_OFFICERS,
  API_URL
} from '../constants'

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
    // ... (Existing confirmSend logic kept primarily, but need to be careful with replacement)
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
        res = await fetch(API_URL_SEND_WA, {
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
    // Pre-fill Workzone using r.hsa if available, or try to guess, or default to first region
    let defaultWZ = '';
    if (r.hsa && r.hsa !== '-') {
      // Map HSA name to Workzone code if possible?
      // User's HSA logic returns "HSA RAJAWALI" etc.
      // My WORKZONES const has "BANDUNG": ['BDK', 'RJW'...]
      // So I should try to map "HSA RAJAWALI" -> "RJW" (Example)
      // Or just let user select.
      // For simplicity, I will set it if it matches exactly, otherwise empty.
      // Actually, user provided "HSA RAJAWALI" -> "RJW" is likely.
      // Let's implement a simple mapper if needed or just show the HSA hint.
      // I will use `r.hsa` as a hint or pre-select if strict match.
      // For now, let's just default to empty and let user pick, but show HSA as helper.
      // Wait, user explicitly asked "kolom yang langsung terisi otomatis".
      // I'll try to map common names.
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
      // 1. Post to Main Dashboard (API_URL)
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

      // 2. Set Status Closed in Laporan Langsung
      const resStatus = await fetch(API_URL_LAPORAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: closingReport.ticketId, status: 'Closed' })
      });

      if (!resStatus.ok) {
        throw new Error("Gagal update status di Laporan Langsung.");
      }

      alert("✅ Sukses! Data masuk ke Dashboard & Tiket Closed.");
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
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>LAPORAN LANGSUNG</h2>
        <button className="btn-refresh" onClick={fetchLaporan}>
          Refresh Data
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Nama</th>
              <th>Alamat</th>
              <th>No Internet</th>
              <th>Keluhan</th>
              <th>Layanan</th>
              <th>SN ONT</th>
              <th>PIC</th>
              <th>Status</th>
              <th>No Tiket</th>
              <th style={{ minWidth: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada laporan masuk.</td></tr>
            ) : (
              paginatedReports.map(r => (
                <tr key={r.id}>
                  <td className="truncate-cell" style={{ maxWidth: '140px' }} title={r.timestamp}>{r.timestamp}</td>
                  <td style={{ fontWeight: 'bold', maxWidth: '120px' }} className="truncate-cell">{r.nama}</td>
                  <td className="truncate-cell" style={{ maxWidth: '150px' }} title={r.alamat}>{r.alamat}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="truncate-cell">{r.noInternet}</span>
                      {r.isFFG && (
                        <span className="status-badge" style={{ backgroundColor: '#D97706', color: 'white', fontSize: '0.7em', padding: '2px 6px' }}>
                          FFG {r.umurGaransi ? `(${r.umurGaransi}h)` : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="truncate-cell" style={{ maxWidth: '150px' }} title={r.keluhan}>{r.keluhan}</td>
                  <td>{r.layanan}</td>
                  <td className="truncate-cell" style={{ maxWidth: '100px' }}>{r.snOnt}</td>
                  <td>{r.pic}</td>
                  <td>
                    <span className={`status-badge status-${r.status.toLowerCase().replace(' ', '-')}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {r.ticketId}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-telegram btn-small" onClick={() => handleProcessAndSend(r)} title="Kirim ke Grup & Mention">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                        Kirim
                      </button>
                      {r.status !== 'Closed' && (
                        <button
                          className="btn-success btn-small"
                          style={{ padding: '4px 8px', background: '#10B981' }}
                          onClick={() => initiateClose(r)}
                          title="Closing & Transfer Dashboard"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem' }}>Rows:</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={{ padding: '0.3rem', borderRadius: '4px' }}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={10000}>All</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary btn-small">Previous</button>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary btn-small">Next</button>
          </div>
        </div>
      )}

      {/* SEND MODAL */}
      {
        sendModal.isOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            {/* ... (Keep Existing Send Modal Content) ... */}
            <div className="glass-panel" style={{ width: '400px', padding: '2rem', animation: 'fadeIn 0.2s', background: 'var(--surface)' }}>
              {/* Simplified for replace validity - assume existing content */}
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Kirim Order</h3>
              {/* ... Keep the rest of Send Modal UI same as before ... */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  className={sendModal.platform === 'TELEGRAM' ? 'btn-telegram' : 'btn-secondary'}
                  onClick={() => setSendModal(prev => ({ ...prev, platform: 'TELEGRAM', group: TELEGRAM_GROUPS[0].id }))}
                  style={{ flex: 1 }}
                >
                  <span style={{ marginRight: '0.5rem' }}>✈️</span> Telegram
                </button>
                <button
                  className={sendModal.platform === 'WHATSAPP' ? 'btn-success' : 'btn-secondary'}
                  onClick={() => setSendModal(prev => ({ ...prev, platform: 'WHATSAPP', group: waGroups[0]?.id || '' }))}
                  style={{ flex: 1, background: sendModal.platform === 'WHATSAPP' ? '#25D366' : '' }}
                >
                  <span style={{ marginRight: '0.5rem' }}>💬</span> WhatsApp
                </button>
              </div>

              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Pilih Grup Tujuan ({sendModal.platform})</label>
                <select
                  value={sendModal.group}
                  onChange={e => setSendModal({ ...sendModal, group: e.target.value })}
                  style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                >
                  {sendModal.platform === 'TELEGRAM' ? (
                    TELEGRAM_GROUPS.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))
                  ) : (
                    waGroups.length > 0 ? (
                      waGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))
                    ) : (
                      <option value="">{waGroups.length === 0 ? 'Loading / No Groups...' : 'Select...'}</option>
                    )
                  )}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Username Teknisi (Untuk Mention)</label>
                <input
                  type="text"
                  placeholder="Contoh: ahmad (tanpa @)"
                  value={sendModal.tech}
                  onChange={e => setSendModal({ ...sendModal, tech: e.target.value })}
                  style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                />
              </div>

              <div className="form-actions" style={{ gap: '1rem', marginTop: '0' }}>
                <button className="btn-secondary" onClick={() => setSendModal({ ...sendModal, isOpen: false })}>Batal</button>
                <button
                  className={sendModal.platform === 'WHATSAPP' ? 'btn-success' : 'btn-telegram'}
                  onClick={confirmSend}
                  style={{ background: sendModal.platform === 'WHATSAPP' ? '#25D366' : '' }}
                >
                  Kirim ke {sendModal.platform === 'WHATSAPP' ? 'WhatsApp' : 'Telegram'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* CLOSING MODAL */}
      {closingReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="glass-panel" style={{ width: '500px', padding: '2rem', animation: 'fadeIn 0.2s', background: 'var(--surface)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Closing & Transfer Ticket</h3>

            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'gray' }}>
              <p>Tiket: <b>{closingReport.ticketId}</b></p>
              <p>Layanan: <b>{closingReport.noInternet}</b></p>
              {closingReport.hsa && <p>HSA (Auto): <b>{closingReport.hsa}</b></p>}
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Teknisi</label>
              <select
                value={closeForm.technician}
                onChange={e => setCloseForm({ ...closeForm, technician: e.target.value })}
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', width: '100%', padding: '0.5rem' }}
              >
                <option value="">-- Pilih Teknisi --</option>
                {TEKNISI_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Workzone (Auto-suggest based on HSA)</label>
              <select
                value={closeForm.workzone}
                onChange={e => setCloseForm({ ...closeForm, workzone: e.target.value })}
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', width: '100%', padding: '0.5rem' }}
              >
                <option value="">-- Pilih Workzone --</option>
                {allWorkzones.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>HD Officer</label>
              <select
                value={closeForm.hdOfficer}
                onChange={e => setCloseForm({ ...closeForm, hdOfficer: e.target.value })}
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', width: '100%', padding: '0.5rem' }}
              >
                <option value="">-- Pilih HD --</option>
                {HD_OFFICERS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Action / Perbaikan</label>
              <textarea
                value={closeForm.action}
                onChange={e => setCloseForm({ ...closeForm, action: e.target.value })}
                rows={3}
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div className="form-actions" style={{ gap: '1rem', marginTop: '0' }}>
              <button className="btn-secondary" onClick={() => setClosingReport(null)}>Batal</button>
              <button
                className="btn-success"
                onClick={submitCloseTicket}
                style={{ background: '#10B981', color: 'white' }}
              >
                Simpan ke Dashboard & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
