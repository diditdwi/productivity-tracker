import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FilePlus, 
  BarChart3, 
  FileText, 
  Zap, 
  Users, 
  LogOut, 
  Settings,
  Shield // For admin visual
} from 'lucide-react'
import { cn } from '../lib/utils'

export default function Sidebar({ user, onLogout, openCount }) {
  const location = useLocation()
  
  // Debugging
  console.log('Sidebar user:', user)

  const allNavItems = [
    { label: 'Entry Data', icon: FilePlus, path: '/', roles: ['staff', 'admin'] },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['viewer', 'staff', 'admin'] },
    { label: 'Productivity', icon: BarChart3, path: '/productivity', roles: ['viewer', 'staff', 'admin'] },
    { label: 'Daily Report', icon: FileText, path: '/report', roles: ['staff', 'admin'] },
    { label: 'Laporan Langsung', icon: Zap, path: '/laporan-langsung', roles: ['staff', 'admin'] },
    { label: 'Staff Management', icon: Users, path: '/users', roles: ['admin'] }
  ]

  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true // Default visible
    return item.roles.includes(user.role)
  })
  
  console.log('Filtered navItems:', navItems.length)

  // Hide Entry Data for Viewers if needed, logic is in App.jsx routing too
  // But strictly sidebar:
  
  return (
    <aside className="w-64 min-w-[16rem] bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 flex flex-col h-full overflow-hidden transition-all duration-300 shadow-2xl relative z-30 rounded-[2rem]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#e2e8f0] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-sm">
           <Zap className="w-5 h-5 text-white fill-current" />
        </div>
        <h1 className="font-extrabold text-[#2d3748] text-lg tracking-tight truncate">TicketTracker</h1>
      </div>

      {/* Navigation */}
      {/* Navigation - Grid Layout */}
      <div role="navigation" className="flex-1 grid grid-cols-2 gap-2 content-start p-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all duration-200 group relative aspect-square text-center border-2",
                isActive 
                  ? "bg-white text-indigo-600 shadow-sm border-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:text-slate-700 hover:border-slate-100 border-transparent hover:shadow-sm"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors mb-1",
                isActive ? "bg-indigo-50" : "bg-slate-50 group-hover:bg-slate-100"
              )}>
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
              </div>
              
              <span className="leading-tight w-full line-clamp-2 px-1">{item.label}</span>
              
              {item.path === '/laporan-langsung' && openCount > 0 && (
                <span className="absolute top-2 right-2 flex h-5 w-auto min-w-[20px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white z-10">
                  {openCount > 99 ? '99+' : openCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[#e2e8f0] bg-white shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-bold text-[#2d3748] truncate">{user.username}</p>
            <p className="text-xs text-[#718096] capitalize flex items-center gap-1 truncate">
              {user.role === 'admin' && <Shield className="w-3 h-3 text-indigo-500 shrink-0" />}
              {user.role}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
           <Link 
             to="/change-password"
             className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#4a5568] bg-[#f7fafc] hover:bg-[#edf2f7] border border-[#e2e8f0] transition-colors truncate"
           >
             <Settings className="w-3.5 h-3.5 shrink-0" /> Pass
           </Link>
           <button 
             onClick={onLogout}
             className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors truncate"
           >
             <LogOut className="w-3.5 h-3.5 shrink-0" /> Logout
           </button>
        </div>
      </div>
    </aside>
  )
}
