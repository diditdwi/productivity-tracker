import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import './App.css'
import Header from './components/Header'
import TicketTable from './components/TicketTable'
import TicketForm from './components/TicketForm'

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
  '20790009 - WAWAN HERMAWAN',
  '18900172 - ALDI RIZKY ANDIKAPURA',
  '19960090 - DIWA ADISCAHYA KINANDHANA',
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
  '18950881 - DEDE ROCHMAT JAYANUDIN',
  '18730015 - NANDAR SUHENDAR',
  '20950975 - SANJAYA PERMANA'
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

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ticketTracker_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ticketTracker_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

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
  const [view, setView] = useState(() => {
    return localStorage.getItem('ticketTrackerView') || 'entry'
  })

  // Persist View
  useEffect(() => {
    localStorage.setItem('ticketTrackerView', view)
  }, [view])

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
    // setEntryMode('single') - Removed: function does not exist
  }

  const changePassword = (newPassword) => {
    setUsersDB(prevDB => prevDB.map(u =>
      u.username === user.username ? { ...u, password: newPassword } : u
    ))
    alert('Password changed successfully!')
  }

  const [editingTicket, setEditingTicket] = useState(null)
  const [isNewTicketFromReport, setIsNewTicketFromReport] = useState(false)

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket)
    setIsNewTicketFromReport(false)
    setView('entry')
  }

  const handleGenerateTicketFromReport = (report) => {
    const actionText = `Keluhan: ${report.keluhan} | Alamat: ${report.alamat} | SN: ${report.snOnt}`

    // Map Report to Ticket Data
    const newTicketData = {
      ticketType: 'REGULER', // Default
      incident: '', // User must fill
      customerName: report.nama,
      serviceId: report.noInternet,
      serviceType: report.layanan.toLowerCase().includes('inet') ? 'INTERNET' : 'VOICE',
      technician: report.pic,
      repair: actionText,
      status: 'Open',
      workzone: '', // User fill
      hdOfficer: user.username,
      date: new Date().toISOString().split('T')[0]
    }

    setEditingTicket(newTicketData)
    setIsNewTicketFromReport(true) // Flag as NEW, not update
    setView('entry')
  }

  // Wrapper to clean up editing state on submission
  // Wrapper to clean up editing state on submission
  const handleTicketSubmit = async (payload) => {
    await addTicket(payload)
    setEditingTicket(null)
    setIsNewTicketFromReport(false)
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} usersDB={usersDB} />
  }

  return (
    <div className="app-container">
      <Header 
        user={user} 
        view={view} 
        setView={(newView) => {
          setView(newView);
          // If switching to 'entry', clear editing ticket logic is handled inside component if passed properly, 
          // or we can handle it here. 
          // The original code: onClick={() => { setView('entry'); setEditingTicket(null); }}
          if (newView === 'entry') setEditingTicket(null);
        }}
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLogout={handleLogout} 
      />

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
        {view === 'dashboard' && <TicketTable tickets={tickets} loading={loading} onEditTicket={handleEditTicket} />}
        {view === 'entry' && (
          <TicketForm onSubmit={handleTicketSubmit} tickets={tickets} initialData={editingTicket} isNewFromReport={isNewTicketFromReport} />
        )}
        {view === 'productivity' && user.role === 'admin' && <ProductivityDashboard tickets={tickets} />}
        {view === 'daily-report' && <DailyReportDashboard tickets={tickets} />}
        {view === 'laporan-langsung' && <LaporanLangsungDashboard onGenerate={handleGenerateTicketFromReport} />}
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
              name="username"
              autoComplete="username"
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
              name="password"
              autoComplete="current-password"
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

  // Ensure maxCount is at least 5 for scale
  const maxCount = Math.max(...monthlyData.map(d => d.count), 5)

  const chartRef = useRef(null)

  const handleExportPDF = async () => {
    try {
      // Dynamic imports with robust initialization
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()

      // Explicitly register plugin if needed, although usually autoTable(doc) works
      // or doc.autoTable() works if side-effect import is successful.
      // Based on recent library changes, we can try calling it directly if attached, 
      // or pass doc to the imported function.

      const pageWidth = doc.internal.pageSize.getWidth()

      // Title
      doc.setFontSize(20)
      doc.setTextColor(14, 165, 233) // Primary blue
      doc.text('Productivity Report', pageWidth / 2, 20, { align: 'center' })

      // Date
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139) // Secondary gray
      doc.text(`Period: ${monthName} ${filterYear}`, pageWidth / 2, 28, { align: 'center' })
      doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 34, { align: 'center' })

      // Summary Stats
      doc.setFontSize(12)
      doc.setTextColor(30, 41, 59) // Main text
      let yPos = 45

      const totalTickets = currentMonthTickets.length
      const uniqueTechs = [...new Set(currentMonthTickets.map(t => t.technician))].length
      const avgPerTech = uniqueTechs > 0 ? (totalTickets / uniqueTechs).toFixed(1) : 0

      doc.text(`Total Tickets: ${totalTickets}`, 20, yPos)
      yPos += 8
      doc.text(`Active Technicians: ${uniqueTechs}`, 20, yPos)
      yPos += 8
      doc.text(`Average per Tech: ${avgPerTech}`, 20, yPos)
      yPos += 15

      // Capture Chart as Image
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: '#ffffff'
          })
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = pageWidth - 40
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight)
          yPos += imgHeight + 15
        } catch (err) {
          console.error('Chart capture failed:', err)
        }
      }

      // Performance Table
      const techPerformance = {}
      currentMonthTickets.forEach(t => {
        const tech = t.technician || 'Unknown'
        if (!techPerformance[tech]) {
          techPerformance[tech] = { total: 0 }
          TICKET_TYPES.forEach(type => techPerformance[tech][type] = 0)
        }
        const type = t.ticketType || 'UNSPEC'
        if (TICKET_TYPES.includes(type)) {
          techPerformance[tech][type]++
        }
        techPerformance[tech].total++
      })

      const sortedTechs = Object.keys(techPerformance).sort((a, b) =>
        techPerformance[b].total - techPerformance[a].total
      )

      // Check if we need a new page
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(14, 165, 233)
      doc.text('Technician Performance Details', 20, yPos)
      yPos += 8

      // Table data
      const tableData = sortedTechs.map(tech => {
        const row = [tech]
        TICKET_TYPES.forEach(type => {
          row.push(techPerformance[tech][type] || 0)
        })
        row.push(techPerformance[tech].total)
        return row
      })

      autoTable(doc, {
        startY: yPos,
        head: [['Technician', ...TICKET_TYPES, 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 }
        }
      })

      // Save PDF
      doc.save(`Productivity_Report_${monthName}_${filterYear}.pdf`)

    } catch (error) {
      console.error('PDF Export Error:', error)
      alert(`Failed to generate PDF: ${error.message}. Please try again.`)
    }
  }

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Monthly Performance ({monthName} {filterYear})</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportPDF}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Export as PDF"
            >
              📄 Export PDF
            </button>
            <label>Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
            />
          </div>
        </div>

        <div ref={chartRef} style={{
          position: 'relative',
          height: '240px',
          padding: '20px 10px 30px 40px', /* Increased Left Padding */
          borderBottom: '1px solid var(--border-color)',
          marginTop: '1rem'
        }}>
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <div key={ratio} style={{
              position: 'absolute',
              bottom: `${30 + (ratio * 200)}px`,
              left: '40px', /* Align start of grid line with padding */
              right: 0,
              borderTop: ratio === 0 ? 'none' : '1px dashed var(--border-color)',
              zIndex: 0
            }}>
              <span style={{
                position: 'absolute',
                left: '-35px', /* Position in padding area */
                top: '-8px',
                fontSize: '0.65rem',
                color: 'var(--secondary)',
                width: '30px',
                textAlign: 'right'
              }}>
                {Math.round(maxCount * ratio)}
              </span>
            </div>
          ))}

          {/* Bars Container */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            height: '200px',
            gap: '6px',
            position: 'relative',
            zIndex: 1
          }}>
            {monthlyData.map((data) => {
              const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0
              const isSelected = data.day === filterDay
              return (
                <div key={data.day}
                  className="bar-container"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedDate(`${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`)}
                >
                  {/* Tooltip on Hover (CSS enforced via class in App.css later or inline opacity) */}
                  <div style={{
                    position: 'absolute',
                    bottom: `${height + 5}%`,
                    background: '#1e293b',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    opacity: 0, // Hidden by default, handled by CSS hover
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s',
                    zIndex: 10,
                    marginBottom: '5px'
                  }} className="bar-tooltip">
                    {data.count}
                  </div>

                  <div
                    className="bar"
                    style={{
                      width: '100%',
                      height: `${height}%`,
                      background: isSelected ? 'var(--warning)' : (data.count > 0 ? 'var(--grad-primary)' : 'rgba(148, 163, 184, 0.1)'),
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: data.count > 0 ? '4px' : '0',
                      boxShadow: isSelected ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none',
                      opacity: data.count > 0 ? 1 : 0.5
                    }}
                  />
                  <span style={{
                    fontSize: '0.65rem',
                    color: isSelected ? '#f59e0b' : 'var(--secondary)',
                    fontWeight: isSelected ? 'bold' : '500',
                    marginTop: '8px'
                  }}>
                    {data.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
          Date (Click bar to view details)
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
  const [selectedRegion, setSelectedRegion] = useState('ALL') // Default ALL, but user can change
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const reportRef = useRef(null)

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [selectedDate, selectedRegion])

  // Helper to determine Region from Workzone Code
  const getRegion = (wzCode) => {
    if (!wzCode) return 'UNKNOWN'

    // Check defined workzones
    for (const [region, zones] of Object.entries(WORKZONES)) {
      if (zones.includes(wzCode)) return region
    }

    // Explicit manual mappings if needed (based on previous context)
    if (wzCode.includes('CIMAHI') || wzCode.includes('PADALARAN')) return 'CIMAHI'
    if (wzCode.includes('SOREANG') || wzCode.includes('CIWIDEY') || wzCode.includes('BANJARAN')) return 'SOREANG'
    if (wzCode.includes('BANDUNG BARAT') || wzCode.includes('LEMBANG')) return 'BANDUNG BARAT'
    if (wzCode.includes('SUMEDANG') || wzCode.includes('TANJUNG SARI')) return 'SUMEDANG'
    if (wzCode.includes('SUBANG') || wzCode.includes('PAMANUKAN')) return 'SUBANG'
    if (wzCode.includes('PURWAKARTA') || wzCode.includes('CIKAMPEK')) return 'PURWAKARTA'
    if (wzCode.includes('GARUT') || wzCode.includes('LIMBANGAN')) return 'GARUT'
    if (wzCode.includes('TASIK')) return 'TASIKMALAYA'
    if (wzCode.includes('CIAMIS')) return 'CIAMIS'
    if (wzCode.includes('BANJAR')) return 'BANJAR'
    if (wzCode.includes('PANGANDARAN')) return 'PANGANDARAN'
    if (wzCode.includes('CIANJUR')) return 'CIANJUR'
    if (wzCode.includes('SUKABUMI')) return 'SUKABUMI'

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
        // Should match if not in any known list
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

  const sortedTechs = Object.keys(reportData).sort((a, b) => reportData[b].total - reportData[a].total)
  const REGIONS = ['ALL', ...Object.keys(WORKZONES), 'OTHERS']

  // Pagination Logic
  const totalPages = Math.ceil(sortedTechs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTechs = itemsPerPage === 10000 ? sortedTechs : sortedTechs.slice(startIndex, startIndex + itemsPerPage)

  const handleCapture = async () => {
    if (!reportRef.current) return

    // Temporarily show ALL items
    const originalItemsPerPage = itemsPerPage
    setItemsPerPage(10000)

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-body'),
        useCORS: true,
        ignoreElements: (el) => el.classList.contains('no-print')
      })

      const image = canvas.toDataURL("image/png")
      const link = document.createElement('a')
      link.href = image
      link.download = `Report_${selectedRegion}_${selectedDate}.png`
      link.click()
    } catch (err) {
      console.error("Screenshot failed:", err)
      alert("Gagal membuat screenshot.")
    } finally {
      setItemsPerPage(originalItemsPerPage)
    }
  }

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Daily Report</h2>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handleCapture}
            className="btn-primary"
            style={{ height: '38px', whiteSpace: 'nowrap' }}
            title="Download Screenshot"
          >
            📷 Export Image
          </button>

          <div className="input-group" style={{ marginBottom: 0, width: 'auto' }}>
            <label style={{ marginRight: '0.5rem', display: 'inline-block' }}>Rows:</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '8px' }}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={10000}>All</option>
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0, width: 'auto' }}>
            <label style={{ marginRight: '0.5rem', display: 'inline-block' }}>Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ padding: '0.4rem', borderRadius: '8px' }}
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
              style={{ padding: '0.4rem', borderRadius: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="table-container" ref={reportRef}>
        {/* Header for Screenshot */}
        <div style={{ display: itemsPerPage > 1000 ? 'block' : 'none', padding: '1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Production Report: {selectedRegion}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Date: {selectedDate}</span>
        </div>

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
              paginatedTechs.map(tech => (
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
              <tr style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold' }}>
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

      {/* Pagination Controls */}
      {sortedTechs.length > 0 && itemsPerPage < 1000 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary btn-small">Previous</button>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary btn-small">Next</button>
        </div>
      )}
    </div>
  )
}

const TELEGRAM_GROUPS = [
  { name: 'RJW', id: '-1001374270728' },
  { name: 'SOR', id: '-1001230361821' },
  { name: 'CMI', id: '-1001328230875' }
];

function LaporanLangsungDashboard({ onGenerate }) {
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
      const res = await fetch('/api/laporan-langsung')
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
      const res = await fetch('/api/wa-groups')
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
        res = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, groupId: group })
        });
      } else {
        res = await fetch('/api/send-telegram-group', {
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

  const handleShareToTech = (r) => {
    // Legacy function removed/merged
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
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
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
    </div >
  )
}

export default App
