import React, { useState, useEffect } from 'react'
import { 
  TELEGRAM_GROUPS, 
  API_URL_LAPORAN, 
  API_URL_WA_GROUPS, 
  API_URL_SEND_WA, 
  API_URL_SEND_TELEGRAM 
} from '../constants'

export default function LaporanLangsungDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [waGroups, setWaGroups] = useState([])
  const [sendModal, setSendModal] = useState({ isOpen: false, report: null, tech: '', group: TELEGRAM_GROUPS[0].id, platform: 'TELEGRAM' })
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

    // Common Message Format
    const message = `*ORDER TEKNISI*
No Tiket: ${report.ticketId}
Nama: ${report.nama}
Alamat: ${report.alamat}
No Layanan: ${report.noInternet}
Kendala: ${report.keluhan}
SN ONT: ${report.snOnt}
CP: ${report.pic}
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

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>LAPORAN LANGSUNG</h2>
        <button className="btn-refresh" onClick={fetchLaporan}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
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
                  <td className="truncate-cell" style={{ maxWidth: '100px' }} title={r.timestamp}>{r.timestamp.split('T')[0]}</td>
                  <td style={{ fontWeight: 'bold', maxWidth: '120px' }} className="truncate-cell">{r.nama}</td>
                  <td className="truncate-cell" style={{ maxWidth: '150px' }} title={r.alamat}>{r.alamat}</td>
                  <td className="truncate-cell">{r.noInternet}</td>
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
                    <button className="btn-telegram btn-small" onClick={() => handleProcessAndSend(r)} title="Kirim ke Grup & Mention">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      Kirim
                    </button>
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
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: 'black'
          }}>
            <div className="glass-panel" style={{ width: '400px', padding: '2rem', animation: 'fadeIn 0.2s', background: 'var(--surface)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Kirim Order</h3>

              {/* Platform Toggle */}
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
    </div>
  )
}
