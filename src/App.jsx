import { useState, useEffect } from 'react'
import './App.css'

// Initial data for dropdowns
const TICKET_TYPES = ['Incident', 'Request', 'Problem', 'Change']
const SERVICE_TYPES = ['Internet', 'IPTV', 'Telepon', 'Bundling']
const STATUSES = ['Open', 'In Progress', 'Pending', 'Closed', 'Resolved']
const TEKNISI_LIST = ['Technician A', 'Technician B', 'Technician C', 'Technician D'] // Example list
const HD_OFFICERS = ['Officer X', 'Officer Y', 'Officer Z'] // Example list

function App() {
  const [view, setView] = useState('dashboard')
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('tickets')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets))
  }, [tickets])

  const addTicket = (ticket) => {
    setTickets([ticket, ...tickets])
    setView('dashboard')
  }

  return (
    <div className="app-container">
      <header>
        <h1>TicketTracker</h1>
        <nav>
          <button
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${view === 'entry' ? 'active' : ''}`}
            onClick={() => setView('entry')}
          >
            Entry Data
          </button>
          <button
            className={`nav-btn ${view === 'productivity' ? 'active' : ''}`}
            onClick={() => setView('productivity')}
          >
            Productivity
          </button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' && <TicketList tickets={tickets} />}
        {view === 'entry' && <TicketForm onSubmit={addTicket} />}
        {view === 'productivity' && <ProductivityDashboard tickets={tickets} />}
      </main>
    </div>
  )
}

function TicketForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    ticketType: 'Incident',
    incident: '',
    customerName: '',
    serviceId: '',
    serviceType: 'Internet',
    technician: '',
    labcode: '',
    repair: '',
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    workone: '',
    hdOfficer: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      id: Date.now().toString()
    })
  }

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>New Ticket Entry</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Ticket Type</label>
            <select name="ticketType" value={formData.ticketType} onChange={handleChange}>
              {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Incident No.</label>
            <input type="text" name="incident" placeholder="INC12345" value={formData.incident} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Customer Name</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Service ID (SID/Inet/Tlp)</label>
            <input type="text" name="serviceId" value={formData.serviceId} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Service Type</label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange}>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Technician</label>
            <input type="text" list="techs" name="technician" value={formData.technician} onChange={handleChange} required placeholder="Select or type..." />
            <datalist id="techs">
              {TEKNISI_LIST.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div className="input-group">
            <label>Labcode</label>
            <input type="text" name="labcode" value={formData.labcode} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Perbaikan (Action Taken)</label>
            <input type="text" name="repair" value={formData.repair} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Workone</label>
            <input type="text" name="workone" value={formData.workone} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Petugas HD (HD Officer)</label>
            <input type="text" list="hds" name="hdOfficer" value={formData.hdOfficer} onChange={handleChange} required placeholder="Select or type..." />
            <datalist id="hds">
              {HD_OFFICERS.map(h => <option key={h} value={h} />)}
            </datalist>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Ticket</button>
        </div>
      </form>
    </div>
  )
}

function TicketList({ tickets }) {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Recent Tickets</h2>
        <span style={{ color: 'var(--text-secondary)' }}>Total: {tickets.length}</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Incident</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Type</th>
              <th>Tech</th>
              <th>Status</th>
              <th>HD Officer</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No tickets found. Start by entering data.
                </td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td>{ticket.date}</td>
                  <td>{ticket.incident}</td>
                  <td>{ticket.customerName}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{ticket.serviceId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ticket.serviceType}</div>
                  </td>
                  <td>{ticket.ticketType}</td>
                  <td>{ticket.technician}</td>
                  <td>
                    <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>{ticket.hdOfficer}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductivityDashboard({ tickets }) {
  // Calculate stats
  const today = new Date().toISOString().split('T')[0]

  const dailyTotal = tickets.filter(t => t.date === today).length

  // Group by Technician
  const techStats = tickets.reduce((acc, curr) => {
    const tech = curr.technician || 'Unknown'
    acc[tech] = (acc[tech] || 0) + 1
    return acc
  }, {})

  // Group by HD Officer
  const hdStats = tickets.reduce((acc, curr) => {
    const hd = curr.hdOfficer || 'Unknown'
    acc[hd] = (acc[hd] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <h3>Daily Tickets (Today)</h3>
          <div className="stat-value">{dailyTotal}</div>
          <div className="stat-sub">{today}</div>
        </div>
        <div className="stat-card">
          <h3>Total Tickets (All Time)</h3>
          <div className="stat-value">{tickets.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel">
          <h2>Technician Productivity</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Total Tickets Processed</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(techStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([tech, count]) => (
                    <tr key={tech}>
                      <td>{tech}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h2>HD Officer Productivity</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Officer</th>
                  <th>Total Tickets Logged</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(hdStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([hd, count]) => (
                    <tr key={hd}>
                      <td>{hd}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
