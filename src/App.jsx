import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import './App.css'

import Header from './components/Header'
import TicketTable from './components/TicketTable'
import TicketForm from './components/TicketForm'
import ProductivityDashboard from './components/ProductivityDashboard'
import DailyReportDashboard from './components/DailyReportDashboard'
import LaporanLangsungDashboard from './components/LaporanLangsungDashboard'
import ChangePasswordForm from './components/ChangePasswordForm'
import LoginForm from './components/LoginForm'
import UserManagement from './components/UserManagement'

import { API_URL, TEKNISI_LIST, HD_OFFICERS, API_URL_LAPORAN } from './constants'

const DEFAULT_USERS = [
  { username: 'dias', password: 'Xeon2108', role: 'admin' },
  { username: 'didit', password: 'Inibaru9191!', role: 'admin' },
  { username: 'HD', password: 'HD123', role: 'staff' },
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
  { username: 'HSA_RJW', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_CMI', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_PDL', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_MJY', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_BJA', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_LBG', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_GGK', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_CJA', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_SMD', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_BDK', password: 'Inibaru11!', role: 'viewer' },
  { username: 'HSA_CJR', password: 'Inibaru11!', role: 'viewer' },
  { username: 'KORLAP_B2B1', password: 'Inibaru2!', role: 'viewer' },
  { username: 'KORLAP_B2B2', password: 'Inibaru2!', role: 'viewer' },
]

function App() {
  const navigate = useNavigate()

  // --- STATE ---
  const [usersDB, setUsersDB] = useState(() => {
    try {
      const saved = localStorage.getItem('ticketTracker_users_db')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge DEFAULT_USERS into parsed (adding only missing users)
        const combined = [...parsed]
        DEFAULT_USERS.forEach(defUser => {
          if (!combined.find(u => u.username === defUser.username)) {
            combined.push(defUser)
          }
        })
        return combined
      }
    } catch (e) { console.error(e) }
    return DEFAULT_USERS
  })

  useEffect(() => {
    localStorage.setItem('ticketTracker_users_db', JSON.stringify(usersDB))
  }, [usersDB])

  const [theme, setTheme] = useState(() => localStorage.getItem('ticketTracker_theme') || 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ticketTracker_theme', theme)
  }, [theme])

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ticketTrackerUser')
      if (saved && saved !== 'undefined') return JSON.parse(saved)
    } catch (e) { }
    return null
  })

  // Ticket Data
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit State
  const [editingTicket, setEditingTicket] = useState(null)
  const [isNewTicketFromReport, setIsNewTicketFromReport] = useState(false)

  // Laporan Langsung Count State
  const [laporanCount, setLaporanCount] = useState(0)

  // --- FETCH TICKETS ---
  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch(API_URL)
      const data = await response.json()
      if (Array.isArray(data)) {
        setTickets(data.reverse())
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }

  // --- FETCH LAPORAN COUNT ---
  useEffect(() => {
    const fetchLaporanCount = async () => {
      try {
        const res = await fetch(API_URL_LAPORAN)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const count = data.filter(item => {
              const status = item.status || 'Open';
              return status.toLowerCase() !== 'closed';
            }).length
            setLaporanCount(count)
          }
        }
      } catch (e) {
        // Silent error for background fetch
      }
    }

    fetchLaporanCount()
    const interval = setInterval(fetchLaporanCount, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  // --- FETCH USERS (STAFF) ---
  const [technicians, setTechnicians] = useState(TEKNISI_LIST)
  const [hdOfficers, setHdOfficers] = useState(HD_OFFICERS)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        if (data.technicians && data.technicians.length > 0) setTechnicians(data.technicians)
        if (data.hdOfficers && data.hdOfficers.length > 0) setHdOfficers(data.hdOfficers)
      }
    } catch (e) {
      console.error("Failed to fetch users:", e)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // --- HANDLERS ---
  const handleLogin = (username, password) => {
    const foundUser = usersDB.find(u => u.username === username && u.password === password)
    if (foundUser) {
      const userData = { username: foundUser.username, role: foundUser.role }
      setUser(userData)
      localStorage.setItem('ticketTrackerUser', JSON.stringify(userData))
      navigate('/')
      toast.success(`Welcome back, ${userData.username}!`)
    } else {
      toast.error('Invalid credentials')
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('ticketTrackerUser')
    navigate('/login')
    toast('Logged out')
  }

  const changePassword = (newPass) => {
    if (!user) return
    setUsersDB(prev => prev.map(u => u.username === user.username ? { ...u, password: newPass } : u))
    toast.success('Password updated successfully')
    navigate('/')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Ticket Submission
  const addTicket = async (ticketOrTickets) => {
    const newItems = Array.isArray(ticketOrTickets) ? ticketOrTickets : [ticketOrTickets]

    const toastId = toast.loading('Saving to Google Sheet...')
    let successCount = 0
    let failCount = 0

    // Persist API
    for (const ticket of newItems) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticket)
        })
        if (!res.ok) {
          console.error('Failed to save:', ticket.incident, await res.text())
          failCount++
        } else {
          successCount++
        }
      } catch (e) {
        console.error('Network Error:', e)
        failCount++
      }
    }

    if (failCount === 0) {
      toast.success(`Saved ${successCount} ticket(s)!`, { id: toastId })
    } else if (successCount > 0) {
      toast.success(`Saved ${successCount}, failed ${failCount}.`, { id: toastId })
    } else {
      toast.error('Failed to save tickets.', { id: toastId })
    }

    // Update Local State
    setTickets(prev => {
      let current = [...prev]
      newItems.forEach(ticket => {
        if (ticket.isUpdate) {
          current = current.filter(t => t.incident !== ticket.incident)
        }
        current = [ticket, ...current]
      })
      return current
    })

    // Navigate to Dashboard
    navigate('/dashboard')
  }

  const handleTicketSubmit = async (payload) => {
    await addTicket(payload)
    setEditingTicket(null)
    setIsNewTicketFromReport(false)
  }

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket)
    navigate('/')
  }

  // --- RENDER ---

  if (!user) {
    return (
      <div className="app-container" data-theme={theme}>
        <Routes>
          <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="app-container" data-theme={theme}>
      <Header
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        openCount={laporanCount}
      />
      <main>
        <Routes>
          <Route path="/" element={
            user.role === 'viewer' ? <Navigate to="/dashboard" replace /> : (
              <TicketForm
                onSubmit={handleTicketSubmit}
                initialData={editingTicket}
                isNewFromReport={isNewTicketFromReport}
                user={user}
                technicians={technicians}
                hdOfficers={hdOfficers}
                tickets={tickets}
              />
            )
          } />
          <Route path="/dashboard" element={
            <TicketTable
              tickets={tickets}
              loading={loading}
              onEditTicket={handleEditTicket}
            />
          } />
          <Route path="/productivity" element={<ProductivityDashboard tickets={tickets} />} />
          <Route path="/report" element={<DailyReportDashboard tickets={tickets} />} />
          <Route path="/laporan-langsung" element={<LaporanLangsungDashboard />} />
          <Route path="/users" element={
            user.role === 'admin' ? (
              <UserManagement
                technicians={technicians}
                hdOfficers={hdOfficers}
                onRefresh={fetchUsers}
              />
            ) : <Navigate to="/" />
          } />
          <Route path="/change-password" element={
            <ChangePasswordForm
              user={user}
              onChangePassword={changePassword}
              onCancel={() => navigate('/')}
            />
          } />
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
