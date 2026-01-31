import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  BarChart3,
  FileText,
  Zap,
  Sun,
  Moon,
  Key,
  LogOut,
  User,
  Menu
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Header({ user, theme, toggleTheme, onLogout, openCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = user.role === 'viewer'
    ? [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'productivity', label: 'Productivity', icon: BarChart3, path: '/productivity' }
    ]
    : [
      { id: 'entry', label: 'Entry Data', icon: FilePlus, path: '/' },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      ...(user.role === 'admin' ? [
        { id: 'productivity', label: 'Productivity', icon: BarChart3, path: '/productivity' },
        { id: 'staff', label: 'Staff', icon: User, path: '/users' }
      ] : []),
      { id: 'daily-report', label: 'Daily Report', icon: FileText, path: '/report' },
      { id: 'laporan-langsung', label: 'Laporan Langsung', icon: Zap, path: '/laporan-langsung' },
    ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 shadow-glass-sm transition-all duration-300"
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">

        {/* Logo Area */}
        <div className="flex items-center gap-2 mr-8">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="hidden font-extrabold sm:inline-block text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
            TicketTracker
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-secondary/50 rounded-2xl border border-white/20 dark:border-white/5 backdrop-blur-sm">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-xl",
                  isActive
                    ? "bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground dark:hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary dark:text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
                {item.id === 'laporan-langsung' && openCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-900 animate-pulse">
                    {openCount > 99 ? '99+' : openCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/30 hover:bg-secondary/60 text-foreground transition-all"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {theme === 'light' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-400" />}
            </motion.div>
          </button>

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border/50 ml-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-foreground">{user.username}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md font-semibold">
                {user.role}
              </span>
            </div>

            <button
              onClick={() => navigate('/change-password')}
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-secondary/30 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
              title="Change Password"
            >
              <Key className="h-5 w-5 transition-transform group-hover:rotate-12" />
            </button>

            <button
              onClick={onLogout}
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-all shadow-sm"
              title="Logout"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg bg-secondary/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown (Simple implementation) */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-4 flex flex-col gap-2"
        >
           {navItems.map((item) => (
             <button
                key={item.id}
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 font-medium"
             >
               <item.icon className="h-5 w-5 text-primary" />
               {item.label}
             </button>
           ))}
           <div className="h-px bg-border my-2" />
           <button onClick={onLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive font-bold">
             <LogOut className="h-5 w-5" /> Logout
           </button>
        </motion.div>
      )}
    </motion.header>
  );
}
