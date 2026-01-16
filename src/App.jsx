import React, { useState, useEffect } from 'react'
import './App.css'

// Initial data for dropdowns
const TICKET_TYPES = ['SQM', 'REGULER', 'LAPSUNG', 'INFRACARE', 'CNQ', 'UNSPEC']
const SERVICE_TYPES = {
  'General': ['INTERNET', 'VOICE', 'IPTV'],
  'DATIN': ['ASTINET', 'VPN', 'METRO-E', 'SIP-TRUNK', 'Node B', 'OLO', 'WIFI'],
  'INFRACARE': ['Kabel Terjuntai', 'ODP Terbuka']
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
  '18920034 - LUKMAN HAKIM',
  '20961145 - TABLIG MUHAMAD DERMAWAN',
  '20961179 - TEGAR PAMUNGKAS PUTRA MULYADI',
  '19960048 - WAHYU PERMANA',
  '18890156 - TAOPIK ALIF PURNOMO',
  '20920955 - DANI IBRAHIM',
  '18790020 - YUSUP SUPRIADI',
  '20950977 - ARIE ARDIANA HIDAYATULLOH',
  '19950188 - ALDHI RESTU PUTRA',
  '25770001 - RIKI HARDIANSYAH',
  '18980365 - FERI DWI SATRIO',
  '18920421 - BAGUS PERMANA',
  '22950008 - IMAM RADHYMAS',
  '19980254 - MUHAMMAD HAFIDZ SAMUDRA HADIST',
  '20760013 - DENI RAMDANI',
  '20840036 - TAUFIQ NURDIANSYAH',
  '20940733 - ARIP MULYANA',
  '19970298 - NIJAR MUHAMAD A.',
  '18930471 - FERI FIRDAWAN',
  '18890159 - SUSENO ASH SHIDDIQ',
  '20970203 - ASEP SUPRIATNA',
  '19980184 - AGRA NUGRAHA',
  '18980058 - WILDAN AULIYA MUTTAQIN',
  '19980263 - FAJAR SYIDIQ HUSAENI ARROFI',
  '18950822 - YOGA NUGRAHAKUSTINAR',
  '19750013 - HASNUDIN SINAGA',
  '18830047 - ADE ROHMAN',
  '20960792 - HENOCK JUNIOR',
  '18960356 - GUNAWAN SETYO ATMOJO',
  '25810005 - ANDRI DIANA',
  '18910047 - TOPAN RAHADIAN',
  '18980517 - PRAYOGA HARIS F',
  '19820006 - AHMAD EDI YULIZAR',
  '18950853 - MOCH.RIZAL PRANATA',
  '19980255 - AZIZ FAUZIAN MAULANA',
  '18910276 - MOCH. TAUFIK AKBAR',
  '18800022 - AHMAD ABDUSSOMAD',
  '20960791 - MUHAMMAD ABDULLAH',
  '20880008 - TIA SUTIANA',
  '20970912 - JERRY FIRDAUS RAMADAN',
  '20960149 - DENA MULYANA',
  '22990060 - MUHAMAD FAUZAN ADIPUTRA',
  '20961184 - HARYANTO',
  '18740002 - ADE SUTRISNO',
  '18750020 - IRWAN JULIAWAN',
  '20880153 - URIP SUKARYA',
  '20971165 - EVAN RAMDANI FEBRIAWAN',
  '19870040 - IRMAN PURNAMAN',
  '18950881 - DEDE ROCHMAT JAYANUDIN'
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

// User Credentials (Initial Seed)
const DEFAULT_USERS = [
  { username: 'dias', password: 'Xeon2108', role: 'admin' },
  { username: 'didit', password: 'Inibaru9191!', role: 'admin' },
  { username: 'HD', password: 'HD123', role: 'staff' },
  // New HD Users
  { username: '20960854', password: 'TA20960854', role: 'staff' },
  { username: '19960032', password: 'TA19960032', role: 'staff' },
  { username: '20840062', password: 'TA20840062', role: 'staff' },
  { username: '18860050', password: 'TA18860050', role: 'staff' },
  { username: '995007', password: 'TA995007', role: 'staff' },
  { username: '20940689', password: 'TA20940689', role: 'staff' },
  { username: '20930813', password: 'TA20930813', role: 'staff' },
  { username: '19950311', password: 'TA19950311', role: 'staff' },
  { username: '19900131', password: 'TA19900131', role: 'staff' },
  { username: '19890089', password: 'TA19890089', role: 'staff' },
]

function App() {
  // Initialize Users DB from localStorage or default
  const [usersDB, setUsersDB] = useState(() => {
    try {
      const saved = localStorage.getItem('ticketTracker_users_db')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse users DB', e)
    }
    return DEFAULT_USERS
  })

  // Sync usersDB to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ticketTracker_users_db', JSON.stringify(usersDB))
  }, [usersDB])

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ticketTrackerUser')
      // Ensure it's not "undefined" string
      if (saved && saved !== 'undefined') return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse user session', e)
    }
    return null
  })
  const [view, setView] = useState('entry')

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  console.log('App Rendering. User:', user)

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

  const addTicket = (ticketOrTickets) => {
    const newItems = Array.isArray(ticketOrTickets) ? ticketOrTickets : [ticketOrTickets]

    setTickets(prev => {
      let current = [...prev]
      // Process updates/inserts
      // We process sequentially. For updates, remove old first.
      newItems.forEach(ticket => {
        if (ticket.isUpdate) {
          current = current.filter(t => t.incident !== ticket.incident)
        }
        // Add to top
        current = [ticket, ...current]
      })
      return current
    })

    setView('dashboard')
  }

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser)
    localStorage.setItem('ticketTrackerUser', JSON.stringify(authenticatedUser))
    setView('entry') // Default view after login
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('ticketTrackerUser')
    setView('entry')
    setEntryMode('single')
  }

  const changePassword = (newPassword) => {
    setUsersDB(prevDB => prevDB.map(u =>
      u.username === user.username ? { ...u, password: newPassword } : u
    ))
    alert('Password changed successfully!')
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} usersDB={usersDB} />
  }

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1>TicketTracker v2.0</h1>
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
            <button
              className={`nav-btn ${view === 'daily-report' ? 'active' : ''}`}
              onClick={() => setView('daily-report')}
            >
              Report Harian
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Hi, <strong>{user.username}</strong>
          </span>

          <button
            className="btn-secondary"
            onClick={() => setView(view === 'change-password' ? 'entry' : 'change-password')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            🔑 Pass
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            Logout
          </button>
        </div>
      </header>

      <main>
        {view === 'change-password' && (
          <ChangePasswordForm
            user={user}
            onChangePassword={(newPass) => {
              changePassword(newPass)
              setView('entry')
            }}
            onCancel={() => setView('entry')}
          />
        )}
        {view === 'dashboard' && <TicketList tickets={tickets} loading={loading} />}
        {view === 'entry' && (
          <TicketForm onSubmit={addTicket} tickets={tickets} />
        )}
        {view === 'productivity' && user.role === 'admin' && <ProductivityDashboard tickets={tickets} />}
        {view === 'daily-report' && <DailyReportDashboard tickets={tickets} />}
      </main>
    </div>
  )
}

function LoginForm({ onLogin, usersDB }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Use the DB passed from parent
    const foundUser = usersDB.find(u => u.username === username && u.password === password)

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

function ChangePasswordForm({ user, onChangePassword, onCancel }) {
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      setError('New passwords do not match')
      return
    }
    if (newPass.length < 4) {
      setError('Password must be at least 4 chars')
      return
    }
    onChangePassword(newPass)
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>New Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
        <div className="form-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Update Password</button>
        </div>
      </form>
    </div>
  )
}

const BULK_ROW_COUNT = 5

function TicketForm({ onSubmit, tickets }) {
  const [mode, setMode] = useState('SINGLE') // SINGLE | BULK | NOTEPAD

  // SINGLE MODE STATE
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
  const [isScraping, setIsScraping] = useState(false)

  // BULK MODE STATE
  const [bulkCommon, setBulkCommon] = useState({
    date: new Date().toISOString().split('T')[0],
    technician: '',
    status: 'Open',
    workzone: '',
    hdOfficer: ''
  })
  const [bulkRows, setBulkRows] = useState(
    Array.from({ length: BULK_ROW_COUNT }).map(() => ({
      ticketType: 'REGULER',
      incident: '',
      customerName: '',
      serviceId: '',
      serviceType: 'INTERNET',
      repair: ''
    }))
  )

  // NOTEPAD MODE STATE
  const [notepadContent, setNotepadContent] = useState('')
  const [notepadDate, setNotepadDate] = useState(new Date().toISOString().split('T')[0])

  // --- SINGLE MODE LOGIC ---
  useEffect(() => {
    if (mode !== 'SINGLE') return
    if (!formData.incident) {
      setIsUpdateMode(false)
      return
    }

    const searchInc = formData.incident.trim().toLowerCase()
    const existingTicket = tickets.find(t => t.incident && t.incident.trim().toLowerCase() === searchInc)

    if (existingTicket) {
      setIsUpdateMode(true)
      setFormData(prev => ({
        ...prev,
        ...existingTicket,
        date: new Date().toISOString().split('T')[0],
        status: existingTicket.status
      }))
    } else {
      setIsUpdateMode(false)
    }
  }, [formData.incident, tickets, mode])

  useEffect(() => {
    if (mode !== 'SINGLE') return
    if (formData.ticketType === 'INFRACARE') {
      setFormData(prev => ({
        ...prev,
        customerName: '-',
        serviceId: '-'
      }))
    }
  }, [formData.ticketType, mode])

  const handleSingleChange = (e) => {
    const { name, value } = e.target
    if (name === 'ticketType' && value === 'INFRACARE') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        customerName: '-',
        serviceId: '-',
        serviceType: 'Kabel Terjuntai'
      }))
    } else if (name === 'ticketType' && value !== 'INFRACARE') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        customerName: prev.customerName === '-' ? '' : prev.customerName,
        serviceId: prev.serviceId === '-' ? '' : prev.serviceId,
        serviceType: 'INTERNET'
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleScrape = async () => {
    if (!formData.incident) {
      alert('Please enter an Incident Number first')
      return
    }

    setIsScraping(true)
    try {
      const res = await fetch(`/api/scrape?inc=${formData.incident}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setFormData(prev => ({
        ...prev,
        customerName: data.customerName || prev.customerName,
        serviceId: data.serviceId || prev.serviceId,
        workzone: data.workzone || prev.workzone,
        serviceType: data.serviceType === 'INTERNET' ? 'INTERNET' : (data.serviceType === 'IPTV' ? 'IPTV' : prev.serviceType)
      }))

      alert(`Found: ${data.customerName} (${data.serviceType})`)

    } catch (e) {
      console.error(e)
      alert('Scraping failed: ' + (e.message || 'Unknown error'))
    } finally {
      setIsScraping(false)
    }
  }

  const handleSingleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.technician || !formData.workzone || !formData.hdOfficer) {
      alert('Mohon lengkapi: Technician, Workzone, dan HD Officer harus diisi!')
      return
    }

    const payload = await submitTicket(formData, isUpdateMode)
    if (payload) {
      alert(isUpdateMode ? 'Ticket Status Updated!' : 'New Ticket Saved!')
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
      onSubmit(payload)
    }
  }

  // --- BULK MODE LOGIC ---
  const handleBulkCommonChange = (e) => {
    const { name, value } = e.target
    setBulkCommon(prev => ({ ...prev, [name]: value }))
  }

  const handleBulkRowChange = (index, e) => {
    const { name, value } = e.target
    setBulkRows(prev => {
      const newRows = [...prev]
      const row = { ...newRows[index] }

      if (name === 'ticketType') {
        row[name] = value
        if (value === 'INFRACARE') {
          row.customerName = '-'
          row.serviceId = '-'
          row.serviceType = 'Kabel Terjuntai'
        } else {
          // Reset if switching away
          if (row.ticketType === 'INFRACARE') {
            row.customerName = ''
            row.serviceId = ''
            row.serviceType = 'INTERNET'
          }
        }
      } else {
        row[name] = value
      }

      newRows[index] = row
      return newRows
    })
  }

  const addBulkRow = () => {
    setBulkRows(prev => [...prev, { ticketType: 'REGULER', incident: '', customerName: '', serviceId: '', serviceType: 'INTERNET', repair: '' }])
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    const validRows = bulkRows.filter(r => r.incident.trim() !== '')
    if (validRows.length === 0) {
      alert("Please fill at least one row with an Incident Number.")
      return
    }

    if (!bulkCommon.technician || !bulkCommon.workzone || !bulkCommon.hdOfficer) {
      alert("Please fill all Global Settings (Technician, Workzone, HD Officer).")
      return
    }

    const successfulPayloads = []

    for (const row of validRows) {
      const ticketPayload = { ...bulkCommon, ...row }
      const payload = await submitTicket(ticketPayload, false)
      if (payload) successfulPayloads.push(payload)
    }

    if (successfulPayloads.length > 0) {
      alert(`Bulk processing complete. Processed ${successfulPayloads.length} tickets.`)
      setBulkRows(Array.from({ length: BULK_ROW_COUNT }).map(() => ({
        ticketType: 'REGULER',
        incident: '',
        customerName: '',
        serviceId: '',
        serviceType: 'INTERNET',
        repair: ''
      })))
      onSubmit(successfulPayloads)
    } else {
      alert("Failed to submit any tickets. Check connectivity.")
    }
  }

  // --- NOTEPAD MODE LOGIC ---
  const handleNotepadSubmit = async (e) => {
    e.preventDefault()
    if (!notepadContent.trim()) {
      alert("Please paste data first.")
      return
    }

    if (!notepadContent.includes('|')) {
      alert("Format salah! Harap gunakan tanda pemisah '|' (pipa) untuk setiap data.")
      return
    }

    const lines = notepadContent.trim().split('\n')
    const parsedPayloads = []

    // Expected Order: 
    // HD Officer | Type | Workzone | Technician | Status | Incident | Customer Name | Service ID | Service Type | Repair

    for (const line of lines) {
      if (!line.trim()) continue

      const cols = line.split('|').map(s => s.trim())

      if (cols.length < 5) continue // Minimal robust check

      // Mapping
      let [hd, type, wz, tech, status, inc, cust, sid, stype, repair] = cols

      const ticketData = {
        date: notepadDate,
        hdOfficer: hd || 'Unknown',
        ticketType: type || 'REGULER',
        workzone: wz || 'Unknown',
        technician: tech || 'Unknown',
        status: status || 'Open',
        incident: inc || `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerName: cust || '-',
        serviceId: sid || '-',
        serviceType: stype || 'INTERNET',
        repair: repair || '-'
      }

      parsedPayloads.push(ticketData)
    }

    if (parsedPayloads.length === 0) {
      alert("No valid rows parsed. Check format: Pipe '|' separated, at least 5 cols.")
      return
    }

    if (confirm(`Parsed ${parsedPayloads.length} tickets. Submit now?`)) {
      const successfulPayloads = []
      for (const payload of parsedPayloads) {
        const res = await submitTicket(payload, false)
        if (res) successfulPayloads.push(res)
      }
      if (successfulPayloads.length > 0) {
        alert(`Submitted ${successfulPayloads.length} tickets successfully.`)
        setNotepadContent('')
        onSubmit(successfulPayloads)
      }
    }
  }

  const submitTicket = async (ticketData, isUpdate) => {
    const payload = {
      ...ticketData,
      id: Date.now().toString() + Math.random(),
      isUpdate: isUpdate
    }

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      return payload
    } catch (error) {
      console.error('Error saving ticket', error)
      return null
    }
  }

  const getServiceTypeOptions = (currentType) => {
    const type = currentType || formData.ticketType
    if (type === 'INFRACARE') {
      return (
        <optgroup label="INFRACARE">
          {SERVICE_TYPES['INFRACARE'].map(s => <option key={s} value={s}>{s}</option>)}
        </optgroup>
      )
    }
    return Object.entries(SERVICE_TYPES).map(([category, services]) => {
      if (category === 'INFRACARE') return null
      return (
        <optgroup key={category} label={category}>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
        </optgroup>
      )
    })
  }

  return (
    <div className="glass-panel" style={{ maxWidth: mode === 'SINGLE' ? '600px' : '1200px', margin: '0 auto', transition: 'max-width 0.3s' }}>
      {/* Updated TicketForm with Notepad Mode */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
          {mode === 'SINGLE' ? (isUpdateMode ? 'Update Ticket Status' : 'New Ticket Entry') : mode === 'BULK' ? 'Bulk Ticket Entry' : 'Notepad Input'}
        </h2>
        <div className="toggle-container" style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
          <button
            className={`toggle-btn ${mode === 'SINGLE' ? 'active' : ''}`}
            onClick={() => setMode('SINGLE')}
            style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none',
              background: mode === 'SINGLE' ? 'var(--primary-color)' : 'transparent',
              color: mode === 'SINGLE' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: mode === 'SINGLE' ? 'bold' : 'normal'
            }}
          >
            Single
          </button>
          <button
            className={`toggle-btn ${mode === 'BULK' ? 'active' : ''}`}
            onClick={() => setMode('BULK')}
            style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none',
              background: mode === 'BULK' ? 'var(--primary-color)' : 'transparent',
              color: mode === 'BULK' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: mode === 'BULK' ? 'bold' : 'normal'
            }}
          >
            Bulk
          </button>
          <button
            className={`toggle-btn ${mode === 'NOTEPAD' ? 'active' : ''}`}
            onClick={() => setMode('NOTEPAD')}
            style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none',
              background: mode === 'NOTEPAD' ? 'var(--primary-color)' : 'transparent',
              color: mode === 'NOTEPAD' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: mode === 'NOTEPAD' ? 'bold' : 'normal'
            }}
          >
            Notepad
          </button>
        </div>
      </div>

      {mode === 'SINGLE' && (
        <form onSubmit={handleSingleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleSingleChange} required />
            </div>

            <div className="input-group">
              <label>Ticket Type</label>
              <select name="ticketType" value={formData.ticketType} onChange={handleSingleChange} disabled={isUpdateMode}>
                {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Incident No.</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  name="incident"
                  placeholder="INC12345"
                  value={formData.incident}
                  onChange={handleSingleChange}
                  required
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleScrape} disabled={isScraping} className="btn-secondary" style={{ padding: '0 10px' }}>
                  {isScraping ? '...' : '🔍'}
                </button>
              </div>
              {isUpdateMode && <small style={{ color: 'var(--primary-color)' }}>Existing ticket found. Update status mode.</small>}
            </div>

            <div className="input-group">
              <label>Customer Name</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleSingleChange} required />
            </div>

            <div className="input-group">
              <label>Service ID (SID/Inet/Tlp)</label>
              <input type="text" name="serviceId" value={formData.serviceId} onChange={handleSingleChange} required disabled={isUpdateMode || formData.ticketType === 'INFRACARE'} />
            </div>

            <div className="input-group">
              <label>Service Type</label>
              <select name="serviceType" value={formData.serviceType} onChange={handleSingleChange} disabled={isUpdateMode}>
                {getServiceTypeOptions(formData.ticketType)}
              </select>
            </div>

            <div className="input-group">
              <label>Technician <span style={{ color: 'red' }}>*</span></label>
              <input type="text" list="techs" name="technician" value={formData.technician} onChange={handleSingleChange} required placeholder="Select or type..." />
              <datalist id="techs">
                {TEKNISI_LIST.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div className="input-group">
              <label>Perbaikan (Action Taken) <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="repair" value={formData.repair} onChange={handleSingleChange} required />
            </div>

            <div className="input-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleSingleChange}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Workzone <span style={{ color: 'red' }}>*</span></label>
              <select name="workzone" value={formData.workzone} onChange={handleSingleChange} required disabled={isUpdateMode}>
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
              <label>Petugas HD (HD Officer) <span style={{ color: 'red' }}>*</span></label>
              <input type="text" list="hds" name="hdOfficer" value={formData.hdOfficer} onChange={handleSingleChange} required placeholder="Select or type..." />
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
      )}

      {mode === 'BULK' && (
        <form onSubmit={handleBulkSubmit}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--primary-color)' }}>Global Settings (Applied to all rows)</h3>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Date</label>
                <input type="date" name="date" value={bulkCommon.date} onChange={handleBulkCommonChange} required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Technician <span style={{ color: 'red' }}>*</span></label>
                <input type="text" list="techs" name="technician" value={bulkCommon.technician} onChange={handleBulkCommonChange} required placeholder="Select or type..." />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Workzone <span style={{ color: 'red' }}>*</span></label>
                <select name="workzone" value={bulkCommon.workzone} onChange={handleBulkCommonChange} required>
                  <option value="">Select...</option>
                  {Object.entries(WORKZONES).map(([region, zones]) => (
                    <optgroup key={region} label={region}>
                      {zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Status</label>
                <select name="status" value={bulkCommon.status} onChange={handleBulkCommonChange}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>HD Officer <span style={{ color: 'red' }}>*</span></label>
                <input type="text" list="hds" name="hdOfficer" value={bulkCommon.hdOfficer} onChange={handleBulkCommonChange} required placeholder="Select or type..." />
              </div>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '100px' }}>Type</th>
                  <th style={{ width: '140px' }}>Incident</th>
                  <th style={{ width: '160px' }}>Customer Name</th>
                  <th style={{ width: '140px' }}>Service ID</th>
                  <th style={{ width: '130px' }}>Service Type</th>
                  <th style={{ minWidth: '200px' }}>Perbaikan (Action)</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ padding: '4px' }}>
                      <select name="ticketType" value={row.ticketType} onChange={(e) => handleBulkRowChange(idx, e)} style={{ width: '100%', padding: '4px' }}>
                        {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input type="text" name="incident" value={row.incident} onChange={(e) => handleBulkRowChange(idx, e)} placeholder="INC..." style={{ width: '100%', padding: '4px' }} />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input type="text" name="customerName" value={row.customerName} onChange={(e) => handleBulkRowChange(idx, e)} disabled={row.ticketType === 'INFRACARE'} style={{ width: '100%', padding: '4px' }} />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input type="text" name="serviceId" value={row.serviceId} onChange={(e) => handleBulkRowChange(idx, e)} disabled={row.ticketType === 'INFRACARE'} style={{ width: '100%', padding: '4px' }} />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <select name="serviceType" value={row.serviceType} onChange={(e) => handleBulkRowChange(idx, e)} disabled={row.ticketType === 'INFRACARE'} style={{ width: '100%', padding: '4px' }}>
                        {getServiceTypeOptions(row.ticketType)}
                      </select>
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input type="text" name="repair" value={row.repair} onChange={(e) => handleBulkRowChange(idx, e)} placeholder="Action taken..." style={{ width: '95%', padding: '4px' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={addBulkRow} className="btn-secondary" style={{ fontSize: '0.9rem' }}>
              + Add Row
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Submit All Valid Rows
            </button>
          </div>
        </form>
      )}

      {mode === 'NOTEPAD' && (
        <div className="glass-panel" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
            <p style={{ marginTop: 0 }}><strong>Format Copy-Paste (Order - Pipe Separated '|'):</strong></p>
            <code style={{ display: 'block', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', whiteSpace: 'nowrap', overflowX: 'auto' }}>
              HD Officer | Type | Workzone | Technician | Status | Incident | Customer Name | Service ID | Service Type | Perbaikan
            </code>
          </div>
          <div className="input-group">
            <label>Date for tickets:</label>
            <input type="date" value={notepadDate} onChange={e => setNotepadDate(e.target.value)} />
          </div>
          <textarea
            value={notepadContent}
            onChange={e => setNotepadContent(e.target.value)}
            placeholder={`Paste rows with '|' separator here...\nExample:\nUSER_HD | REGULER | BDK | TEKNISI | Open | INC123 | CustName | 12234 | INTERNET | Reboot`}
            style={{
              width: '100%',
              height: '300px',
              padding: '1rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              resize: 'both'
            }}
          />
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button onClick={handleNotepadSubmit} className="btn-primary">
              Parse & Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TicketList({ tickets, loading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterType, setFilterType] = useState('ALL')

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

    const matchesType = filterType === 'ALL' || ticket.ticketType === filterType

    return matchesSearch && matchesDate && matchesType
  })

  // GAUL Check Logic
  const checkGaul = (currentTicket) => {
    // Skip GAUL for INFRACARE as they use generic Service IDs (Kabel Terjuntai etc)
    // Debugging: Log if we see Infracare but it didn't match
    if (currentTicket.ticketType && currentTicket.ticketType.includes('INFRA')) console.log('Checking ticket:', currentTicket.ticketType, currentTicket.incident)

    if (currentTicket.ticketType === 'INFRACARE') return false

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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '0.4rem', fontSize: '0.9rem', width: 'auto' }}
            >
              <option value="ALL">All Types</option>
              {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
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
  // Filter State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Derived Constants from Selected Date
  const filterDate = new Date(selectedDate)
  const filterDay = filterDate.getDate()
  const filterMonth = filterDate.getMonth()
  const filterYear = filterDate.getFullYear()
  const monthName = filterDate.toLocaleString('default', { month: 'long' })

  // Helper to normalize technician name (match "Name Only" to "NIK - Name" from list if possible)
  const normalizeTechName = (inputName) => {
    if (!inputName) return 'Unknown'
    const match = TEKNISI_LIST.find(t => t.includes(inputName.toUpperCase()))
    return match || inputName
  }

  // 1. Filter for Selected Month Only
  const currentMonthTickets = tickets.filter(t => {
    if (!t.date) return false
    const d = new Date(t.date)
    return !isNaN(d.getTime()) &&
      d.getMonth() === filterMonth &&
      d.getFullYear() === filterYear
  })

  // 2. Daily Total (Selected Day)
  const dailyTotal = currentMonthTickets.filter(t => {
    const d = new Date(t.date)
    return d.getDate() === filterDay
  }).length

  // 3. Group by Technician
  const techStats = currentMonthTickets.reduce((acc, curr) => {
    const rawTech = curr.technician || 'Unknown'
    const tech = normalizeTechName(rawTech)

    if (!acc[tech]) acc[tech] = { month: 0, day: 0 }

    acc[tech].month += 1

    const d = new Date(curr.date)
    if (d.getDate() === filterDay) {
      acc[tech].day += 1
    }

    return acc
  }, {})

  // 4. Group by HD Officer
  const hdStats = currentMonthTickets.reduce((acc, curr) => {
    const hd = curr.hdOfficer || 'Unknown'
    if (!acc[hd]) acc[hd] = { month: 0, day: 0 }

    acc[hd].month += 1

    const d = new Date(curr.date)
    if (d.getDate() === filterDay) {
      acc[hd].day += 1
    }
    return acc
  }, {})

  // Monthly Chart Logic
  const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate()
  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const count = currentMonthTickets.filter(t => {
      const d = new Date(t.date)
      return d.getDate() === day
    }).length
    return { day, count }
  })

  const maxCount = Math.max(...monthlyData.map(d => d.count), 5)

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Monthly Performance ({monthName} {filterYear})</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label>Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

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
                    background: data.day === filterDay ? '#fbbf24' : (data.count > 0 ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)'),
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: data.count > 0 ? '4px' : '0'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: data.day === filterDay ? '#fbbf24' : 'var(--text-secondary)', fontWeight: data.day === filterDay ? 'bold' : 'normal' }}>
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
          <h3>Daily Tickets ({filterDay}/{filterMonth + 1})</h3>
          <div className="stat-value">{dailyTotal}</div>
          <div className="stat-sub">{filterDate.toLocaleDateString()}</div>
        </div>
        <div className="stat-card">
          <h3>Total Tickets ({monthName})</h3>
          <div className="stat-value">{currentMonthTickets.length}</div>
          <div className="stat-sub">Avg: {(currentMonthTickets.length / filterDay).toFixed(1)} / day</div>
        </div>
        <div className="stat-card">
          <h3>Total Tickets (All Time)</h3>
          <div className="stat-value">{tickets.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel">
          <h2>Technician Productivity</h2>
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <th>Technician</th>
                  <th>Daily ({filterDay}/{filterMonth + 1})</th>
                  <th>Month</th>
                  <th>Avg / Day</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(techStats)
                  .sort(([, a], [, b]) => b.month - a.month)
                  .map(([tech, stats]) => (
                    <tr key={tech}>
                      <td>{tech}</td>
                      <td style={{ fontWeight: 'bold', color: stats.day > 0 ? '#4ade80' : 'inherit' }}>
                        {stats.day > 0 ? `+${stats.day}` : '-'}
                      </td>
                      <td>{stats.month}</td>
                      <td>{(stats.month / filterDay).toFixed(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h2>HD Officer Productivity</h2>
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <th>Officer</th>
                  <th>Daily ({filterDay}/{filterMonth + 1})</th>
                  <th>Month</th>
                  <th>Avg / Day</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(hdStats)
                  .sort(([, a], [, b]) => b.month - a.month)
                  .map(([hd, stats]) => (
                    <tr key={hd}>
                      <td>{hd}</td>
                      <td style={{ fontWeight: 'bold', color: stats.day > 0 ? '#4ade80' : 'inherit' }}>
                        {stats.day > 0 ? `+${stats.day}` : '-'}
                      </td>
                      <td>{stats.month}</td>
                      <td>{(stats.month / filterDay).toFixed(1)}</td>
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


function DailyReportDashboard({ tickets }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedRegion, setSelectedRegion] = useState('ALL')

  // Helper to determine Region from Workzone Code
  const getRegion = (wzCode) => {
    if (!wzCode) return 'UNKNOWN'
    for (const [region, zones] of Object.entries(WORKZONES)) {
      if (zones.includes(wzCode)) return region
    }
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
        // Should match if not in any known list, but usually 'OTHERS' means specifically outside defined ones
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
    const type = curr.ticketType || 'UNSPECIFIED'

    if (!acc[tech]) {
      acc[tech] = { total: 0 }
    }

    acc[tech][type] = (acc[tech][type] || 0) + 1
    acc[tech].total += 1
    return acc
  }, {})

  const sortedTechs = Object.keys(reportData).sort()

  const REGIONS = ['ALL', ...Object.keys(WORKZONES), 'OTHERS']

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Daily Report</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ marginBottom: 0, width: 'auto' }}>
            <label style={{ marginRight: '0.5rem', display: 'inline-block' }}>Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ padding: '0.4rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)' }}
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
              style={{ padding: '0.4rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)' }}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Technician</th>
              {TICKET_TYPES.map(type => (
                <th key={type} style={{ textAlign: 'center' }}>{type}</th>
              ))}
              <th style={{ textAlign: 'center', fontWeight: 'bold' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedTechs.length === 0 ? (
              <tr>
                <td colSpan={TICKET_TYPES.length + 2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No tickets found for {selectedDate}.
                </td>
              </tr>
            ) : (
              sortedTechs.map(tech => (
                <tr key={tech}>
                  <td style={{ fontWeight: '500' }}>{tech}</td>
                  {TICKET_TYPES.map(type => (
                    <td key={type} style={{ textAlign: 'center' }}>
                      {reportData[tech][type] || '-'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', background: 'rgba(var(--primary-rgb), 0.1)' }}>
                    {reportData[tech].total}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {sortedTechs.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 'bold' }}>
                <td>Grand Total</td>
                {TICKET_TYPES.map(type => (
                  <td key={type} style={{ textAlign: 'center' }}>
                    {filteredTickets.filter(t => t.ticketType === type).length}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>{filteredTickets.length}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export default App
