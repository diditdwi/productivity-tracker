import { useState, useEffect } from 'react'
import './App.css'

// Initial data for dropdowns
const TICKET_TYPES = ['SQM', 'REGULER', 'LAPSUNG', 'INFRACARE']
const SERVICE_TYPES = {
  'General': ['INTERNET', 'VOICE', 'IPTV'],
  'DATIN': ['ASTINET', 'VPN', 'METRO-E', 'SIP-TRUNK', 'Node B']
}
const STATUSES = ['Open', 'In Progress', 'Pending', 'Closed', 'Resolved']
const TEKNISI_LIST = [
  '18890111 - ZAELANI MUHARAMSYAH',
  '18870033 - SURYANA',
  '18850025 - RUDI SABANA',
  '20961178 - NOVA HERDIANSYAH',
  '20870086 - RUSTANDI',
  '20880093 - ARI KUSTIWA',
  '20920742 - ANDRI PERMADI',
  '18790021 - NADHI FARY',
  '20961176 - HABIB MURTADHO',
  '18780025 - DIDIN MIFTAHUDIN',
  '18910029 - GILANG MUHAMMAD',
  '20910523 - RAHMAT NURCAHYA',
  '20971373 - MITSWARI SULTHAN DELS',
  '18980369 - INDRA JAYA',
  '19910163 - DANI HARDIANSYAH',
  '18950552 - YUSUP',
  '20950972 - ANGGA FEBRIAN SANTOSO',
  '18960685 - RENALDI',
  '18960131 - R. ZAKI HARTAWAN D.P',
  '18790016 - RUSTANDI',
  '22990061 - MOHAMAD FAJAR SHODIQ',
  '18880107 - MULYANA',
  '20970996 - DEDE CANDRA',
  '20971372 - DENDI GUNAWAN',
  '18940684 - ASEP PRIYANTO',
  '20960873 - ILHAM HEDIANSYAH',
  '20940712 - RAMDANI SETIAWAN',
  '20940948 - DADANG SAEPUDIN',
  '20940921 - SYAIFUDIN',
  '20971477 - GIARDI FAHMI',
  '18880109 - DEBBY ARSY WIBOWO',
  '19960260 - BAYU SETIAWAN',
  '18930094 - BARDAN SALAMAN AL ANWARI',
  '18940038 - AHMAD YUNUS SUARMAN',
  '18800020 - SUTISNA',
  '20961175 - DZIKRI AL YUBIE',
  '18910287 - WAHYU NUR ALAMSYAH',
  '19890084 - YANTO WIGUNA',
  '20951147 - ACHMAD ISKANDAR',
  '19730004 - IWAN SUFI MAULANA',
  '19750014 - YAHYA JUANDA',
  '20930955 - FITRA TAUFIK QURRAHMAN',
  '18930472 - MUHAMAD NURKHOLIS',
  '20900397 - AHMAD KURNIA',
  '18910272 - IMAM JUANDA',
  '18950875 - ASEP AEP SAEPULOH',
  '19970061 - FITRA EKA PUTRA',
  '18950878 - ANDI FIRMANSYAH',
  '18810024 - DEDE SUHENDAR',
  '20940923 - RAHMAN TRI SULISTIYO',
  '25850010 - R. ANDREAS EDWIN',
  '20950948 - BACHTIAR RISMAYA',
  '20950983 - DWI AGUS MULYANTO',
  '18930028 - MOHAMMAD ZULFIKAR',
  '20941036 - FAHMI HAMDANI PAMUNGKAS',
  '18950876 - BARKAH SETIAWAN',
  '18930473 - FELIX ARIZKA PRATAMA',
  '22010093 - MUHAMAD ABDURROHMAN HARIZ',
  '18950127 - IKHSAN MUHAMMAD QOYUM',
  '19970369 - FAISAL FAHMI',
  '19910143 - FERI ARDIYANSYAH',
  '18940109 - FAJAR GUSTIAN',
  '20920958 - SAEPUDIN',
  '20920925 - BAYU MAHARDIKA INDRA ROCHMANA',
  '18950877 - GANI ABDUL MANAF',
  '18860040 - DEDI MULYADI',
  '18990417 - HELMI PRIYATNA',
  '20931059 - AAN PERMANA',
  '18950802 - ANDRI ROHAENDI',
  '20870022 - ASEP NEDI',
  '19780024 - WAWAN SETIAWAN',
  '19930206 - DIKY INDRA SUMARNA',
  '18940695 - RAFI MOH AIMANA',
  '18880111 - AGUS BASUNI PERMANA KUSUMAH',
  '25960045 - ARI SAPUTRA',
  '17910223 - BANGKIT RESTU ILLAHI',
  '17860421 - OGI CIKAL DARMAPALA',
  '20930064 - ADAM JUNIARTO',
  '20970202 - REDY AKBAR ADZANI',
  '18950091 - AGUS HIDAYATTULLOH',
  '25920037 - ADE GUNTUR',
  '19850017 - AJI RIDWAN SAFARI',
  '18940728 - KHAIRIL UMAM',
  '20790008 - TOPIK ISKANDAR',
  '20750005 - ALAN SUPARLAN',
  '18970059 - ALDY MUSTIKA SOPIAND',
  '20961372 - ALDI RIPALDI',
  '18930033 - ANDRIAN RAHMAT',
  '21000003 - DIFA NURRAFI YUSUF',
  '17900513 - INDRA MARDIANSYAH',
  '18860065 - ANDI TARYANTO',
  '18900174 - YANDI NOVIANESTU BINTORO',
  '18910274 - AGENG HAVID HAZARUDIN',
  '25790002 - SAEPUDIN',
  '18920429 - ALDY FIRGIAWAN SUTRISNA',
  '19940182 - ESA ANANDA',
  '20930013 - IYANG EKA RIZKIYANA',
  '20971337 - YUSUF SAFARI',
  '18960565 - AGUNG APRIANSYAH',
  '20971335 - NUR SIDIK',
  '20940957 - ERZSA GUMILANG PRAKOSO',
  '22000065 - MUHAMAD REZA SAPUTRA',
  '18960499 - REZA RAMADHAN',
  '20951082 - RIZAL AGUSTIAN HAMDANI',
  '18990056 - DANI ALFIAN',
  '20951078 - MOH. IQBAL',
  '18960352 - FAJAR SENJAYA',
  '19730010 - R.AGUS NUGRAHA',
  '18760024 - SAPTAMARUTA',
  '20980004 - MUZAKKIY ABDUL LATIEF BAFADHAL',
  '20980993 - ADRI GENTA RAHDIAN',
  '20980863 - WIJI SETIAWAN',
  '20940951 - RIVAN RINANDI',
  '20960011 - M.RIZALDY FAUZAN',
  '20750006 - DEDI BASTIAN',
  '18950813 - RENDI ANDRIANA',
  '20980862 - SIDIK MEGANTORO',
  '18720015 - AGUS MIYANTO',
  '20870127 - FERY YUDI ISTANTO',
  '20950717 - DANI RAMDANI',
  '17850327 - DADAN SONJAYA',
  '18920034 - LUKMAN HAKIM'
]
const HD_OFFICERS = [
  '20960854 - SHOLIHIN RYALDI',
  '19960032 - CANDRA APRILIANA NUR ADHADI',
  '20840062 - REIZA DIRGANTARA',
  '18860050 - ROHMAN MUHARAM',
  '995007 - THARIQ MUHAMAD AZIS',
  '20940689 - RIRIN ARIANI',
  '20930813 - YOGI PERMANA',
  '19950311 - ASEP PRAYOGO',
  '19890089 - HERI SUTRISNO',
  '19900131 - AHMAD NURROHMAN'
]

const WORKZONES = {
  'BANDUNG': ['BDK', 'CCD', 'CJA', 'DGO', 'GGK', 'HGM', 'LBG', 'SMD', 'TAS', 'TLE', 'TRG', 'UBR'],
  'BANDUNG BARAT': ['RJW', 'CMI', 'NJG', 'BTJ', 'CKW', 'CLL', 'CPT', 'CSA', 'GNH', 'LEM', 'PDL', 'BJA', 'CWD', 'PNL', 'SOR', 'MJY', 'RCK'],
  'CIANJUR': ['CBE', 'CJG', 'CJR', 'CKK', 'SDL', 'SGA', 'SKM', 'TGE', 'CCL']
}

const API_URL = '/api/tickets'

// User Credentials
const USERS = [
  { username: 'dias', password: 'Xeon2108', role: 'admin' },
  { username: 'didit', password: 'Inibaru9191!', role: 'admin' },
  { username: 'HD', password: 'HD123', role: 'staff' }
]

function App() {
  const [user, setUser] = useState(null) // null = not logged in
  const [view, setView] = useState('entry')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch(API_URL)
      const data = await response.json()
      // Google Sheets returns the array. If it's empty or error, handle safe.
      if (Array.isArray(data)) {
        // Reverse to show newest first initially
        // BUT we need to deduplicate. Since we append to sheets, later rows are updates.
        // We want the LATEST entry for each incident.

        const latestTicketsMap = new Map()

        data.forEach(ticket => {
          if (ticket.incident) {
            // Overwrite existing entry, effectively keeping the last one found (which is the newest in appended sheet)
            latestTicketsMap.set(ticket.incident, ticket)
          } else {
            // Tickets without incident ID (legacy?) - keep them or ignore? 
            // Let's keep them with a unique key just in case, or just map them.
            // Actually, if no incident ID, we can't really update it. 
            // Let's assume all valid tickets have incident IDs.
            latestTicketsMap.set(Date.now() + Math.random(), ticket)
          }
        })

        const deduplicatedTickets = Array.from(latestTicketsMap.values()).reverse() // Show newest updates first
        setTickets(deduplicatedTickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTicket = (ticket) => {
    // If it's an update, remove the old one with same incident first
    if (ticket.isUpdate) {
      setTickets(prev => [ticket, ...prev.filter(t => t.incident !== ticket.incident)])
    } else {
      setTickets([ticket, ...tickets])
    }
    setView('dashboard')
  }

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser)
    setView('entry') // Default view after login
  }

  const handleLogout = () => {
    setUser(null)
    setView('entry')
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1>TicketTracker</h1>
          <nav>
            <button
              className={`nav-btn ${view === 'entry' ? 'active' : ''}`}
              onClick={() => setView('entry')}
            >
              Entry Data
            </button>
            <button
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
            {user.role === 'admin' && (
              <button
                className={`nav-btn ${view === 'productivity' ? 'active' : ''}`}
                onClick={() => setView('productivity')}
              >
                Productivity
              </button>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Hi, <strong>{user.username}</strong>
          </span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </header>

      <main>
        {view === 'dashboard' && <TicketList tickets={tickets} loading={loading} />}
        {view === 'entry' && <TicketForm onSubmit={addTicket} tickets={tickets} />}
        {view === 'productivity' && user.role === 'admin' && <ProductivityDashboard tickets={tickets} />}
      </main>
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const foundUser = USERS.find(u => u.username === username && u.password === password)

    if (foundUser) {
      onLogin({ username: foundUser.username, role: foundUser.role })
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{
          marginBottom: '2rem',
          background: 'linear-gradient(to right, #0ea5e9, #22d3ee)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '2.5rem',
          fontWeight: '800'
        }}>
          TicketTracker
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div className="input-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

function TicketForm({ onSubmit, tickets }) {
  const [formData, setFormData] = useState({
    ticketType: 'REGULER',
    incident: '',
    customerName: '',
    serviceId: '',
    serviceType: 'INTERNET',
    technician: '',
    repair: '',
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    workzone: '',
    hdOfficer: ''
  })
  const [isUpdateMode, setIsUpdateMode] = useState(false)

  // Check for duplicate incident when incident number changes
  useEffect(() => {
    if (!formData.incident) return

    const existingTicket = tickets.find(t => t.incident === formData.incident)
    if (existingTicket) {
      setIsUpdateMode(true)
      // Fill form with existing data BUT keep current date for the update entry? 
      // User said "status update", usually means a new log. 
      // Let's pre-fill everything from existing ticket to ensure consistency, 
      // but maybe update the date to today? 
      // Or just load exactly what was there. Let's load what was there + allow status change.
      setFormData(prev => ({
        ...existingTicket,
        date: new Date().toISOString().split('T')[0], // Updates happen "today"
        status: existingTicket.status // Keep old status initially, user changes it
      }))
    } else {
      setIsUpdateMode(false)
      // Optional: Clear fields if user types a new number after an old one?
      // For now, let's just reset the mode. Clearing might be annoying if they just made a typo.
    }
  }, [formData.incident, tickets])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newTicket = {
      ...formData,
      id: Date.now().toString(),
      isUpdate: isUpdateMode // Flag to help tracking if needed
    }

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket)
      })

      alert(isUpdateMode ? 'Ticket Status Updated!' : 'New Ticket Saved!')

      // Reset form fully after submit
      setFormData({
        ticketType: 'REGULER',
        incident: '',
        customerName: '',
        serviceId: '',
        serviceType: 'INTERNET',
        technician: '',
        repair: '',
        status: 'Open',
        date: new Date().toISOString().split('T')[0],
        workzone: '',
        hdOfficer: ''
      })
      setIsUpdateMode(false)

      onSubmit(newTicket)

    } catch (error) {
      console.error('Error saving to sheets', error)
      alert('Error saving to Google Sheets, but saved locally.')
      onSubmit(newTicket)
    }
  }

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>
        {isUpdateMode ? 'Update Ticket Status' : 'New Ticket Entry'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Ticket Type</label>
            <select name="ticketType" value={formData.ticketType} onChange={handleChange} disabled={isUpdateMode}>
              {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Incident No.</label>
            <input
              type="text"
              name="incident"
              placeholder="INC12345"
              value={formData.incident}
              onChange={handleChange}
              required
            // Incident field always editable to allow searching/clearing
            />
            {isUpdateMode && <small style={{ color: 'var(--primary-color)' }}>Existing ticket found. Update status mode.</small>}
          </div>

          <div className="input-group">
            <label>Customer Name</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required disabled={isUpdateMode} />
          </div>

          <div className="input-group">
            <label>Service ID (SID/Inet/Tlp)</label>
            <input type="text" name="serviceId" value={formData.serviceId} onChange={handleChange} required disabled={isUpdateMode} />
          </div>

          <div className="input-group">
            <label>Service Type</label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange} disabled={isUpdateMode}>
              {Object.entries(SERVICE_TYPES).map(([category, services]) => (
                <optgroup key={category} label={category}>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Technician</label>
            <input type="text" list="techs" name="technician" value={formData.technician} onChange={handleChange} required placeholder="Select or type..." disabled={isUpdateMode} />
            <datalist id="techs">
              {TEKNISI_LIST.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Labcode field removed */}

          <div className="input-group">
            <label>Perbaikan (Action Taken)</label>
            <input type="text" name="repair" value={formData.repair} onChange={handleChange} required disabled={isUpdateMode} />
          </div>

          <div className="input-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Workzone</label>
            <select name="workzone" value={formData.workzone} onChange={handleChange} disabled={isUpdateMode}>
              <option value="">Select Workzone...</option>
              {Object.entries(WORKZONES).map(([region, zones]) => (
                <optgroup key={region} label={region}>
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Petugas HD (HD Officer)</label>
            <input type="text" list="hds" name="hdOfficer" value={formData.hdOfficer} onChange={handleChange} required placeholder="Select or type..." disabled={isUpdateMode} />
            <datalist id="hds">
              {HD_OFFICERS.map(h => <option key={h} value={h} />)}
            </datalist>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isUpdateMode ? 'Update Status' : 'Save Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}

function TicketList({ tickets, loading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const filteredTickets = tickets.filter(ticket => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = (
      (ticket.incident && ticket.incident.toLowerCase().includes(term)) ||
      (ticket.serviceId && ticket.serviceId.toString().toLowerCase().includes(term))
    )

    let matchesDate = true
    if (filterDate) {
      // Robust date comparison
      try {
        const ticketDate = new Date(ticket.date)
        const filter = new Date(filterDate)
        // Compare YYYY-MM-DD parts
        matchesDate = ticketDate.getFullYear() === filter.getFullYear() &&
          ticketDate.getMonth() === filter.getMonth() &&
          ticketDate.getDate() === filter.getDate()
      } catch (e) {
        matchesDate = false
      }
    }

    return matchesSearch && matchesDate
  })

  // GAUL Check Logic
  const checkGaul = (currentTicket) => {
    if (!currentTicket.serviceId || !currentTicket.date) return false

    // Find *other* tickets with same Service ID that are OLDER (to flag the current one as repeat)
    // Actually, usually we flag the NEW one as GAUL if there was a previous one recently.
    // So we look for any ticket with same serviceID that has a date BEFORE currentTicket.date
    // AND the difference is <= 30 days.

    const currentDate = new Date(currentTicket.date)

    // Safety check for invalid dates
    if (isNaN(currentDate.getTime())) return false

    return tickets.some(otherTicket => {
      if (otherTicket.id === currentTicket.id) return false // Skip self
      if (otherTicket.serviceId !== currentTicket.serviceId) return false

      const otherDate = new Date(otherTicket.date)
      if (isNaN(otherDate.getTime())) return false

      // Check if other ticket is older (or same day but we want to flag duplicates generally? 
      // Requirement: "masuk dalam dibawah 30 hari")
      // Let's assume we flag the *current* ticket if it entered and found a history < 30 days.

      const diffTime = currentDate - otherDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // We only care if other ticket is OLDER (diffDays > 0) and within 30 days
      return diffDays > 0 && diffDays <= 30
    })
  }

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Recent Tickets (Synced with Google Sheets)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ padding: '0.4rem', fontSize: '0.9rem', width: 'auto' }}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Search Incident or Service ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem', width: '250px' }}
            />
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>Total: {filteredTickets.length}</span>
        </div>
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
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Loading data from Google Sheets...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No tickets found. Start by entering data.
                </td>
              </tr>
            ) : (
              filteredTickets.map(ticket => {
                const isGaul = checkGaul(ticket)
                return (
                  <tr key={ticket.id}>
                    <td>{ticket.date}</td>
                    <td>{ticket.incident}</td>
                    <td>{ticket.customerName}</td>
                    <td>
                      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {ticket.serviceId}
                        {isGaul && <span className="badge badge-gaul">GAUL</span>}
                      </div>
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
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductivityDashboard({ tickets }) {
  // Calculate stats
  // Calculate stats
  const now = new Date()
  const todayDate = now.getDate()
  const todayMonth = now.getMonth()
  const todayYear = now.getFullYear()

  const dailyTotal = tickets.filter(t => {
    if (!t.date) return false
    const d = new Date(t.date)
    return !isNaN(d.getTime()) &&
      d.getDate() === todayDate &&
      d.getMonth() === todayMonth &&
      d.getFullYear() === todayYear
  }).length

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

  // Monthly Chart Logic
  const currentMonth = todayMonth
  const currentYear = todayYear
  const monthName = now.toLocaleString('default', { month: 'long' })

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const count = tickets.filter(t => {
      if (!t.date) return false
      const d = new Date(t.date)
      if (isNaN(d.getTime())) return false

      return d.getDate() === day &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
    }).length
    return { day, count }
  })

  const maxCount = Math.max(...monthlyData.map(d => d.count), 5) // Min max is 5 to keep scale looking good

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Monthly Performance ({monthName} {currentYear})</h2>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '200px',
          gap: '5px',
          padding: '1rem 0',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {monthlyData.map((data) => {
            const height = (data.count / maxCount) * 100
            return (
              <div key={data.day} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                height: '100%',
                justifyContent: 'flex-end'
              }}>
                <div
                  className="bar"
                  title={`${data.day} ${monthName}: ${data.count} tickets`}
                  style={{
                    width: '100%',
                    height: `${height}%`,
                    background: data.count > 0 ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: data.count > 0 ? '4px' : '0'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {data.day % 2 !== 0 ? data.day : ''}
                </span>
              </div>
            )
          })}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Date (Day of Month)
        </p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <h3>Daily Tickets (Today)</h3>
          <div className="stat-value">{dailyTotal}</div>
          <div className="stat-sub">{now.toLocaleDateString()}</div>
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
