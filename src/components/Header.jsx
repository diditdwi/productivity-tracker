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
  LogOut, 
  KeyRound, 
  User,
  Package 
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Header({ user, theme, toggleTheme, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'entry', label: 'Entry Data', icon: FilePlus, path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ...(user.role === 'admin' ? [{ id: 'productivity', label: 'Productivity', icon: BarChart3, path: '/productivity' }] : []),
    { id: 'daily-report', label: 'Daily Report', icon: FileText, path: '/report' },
    { id: 'laporan-langsung', label: 'Laporan Langsung', icon: Zap, path: '/laporan-langsung' },
    { id: 'inventory', label: 'Kebutuhan Material', icon: Package, path: '/inventory' },
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm"
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        
        {/* Logo Area */}
        <div className="flex items-center gap-2 mr-8">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="hidden font-extrabold sm:inline-block text-lg text-black dark:text-white tracking-tight">
            TicketTracker
          </span>
        </div>

        {/* Navigation Pills */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-gradient">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-full whitespace-nowrap",
                  isActive 
                    ? "bg-blue-600 text-white shadow-md outline outline-2 outline-blue-600 dark:outline-blue-500 dark:bg-blue-500" 
                    : "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-600 dark:text-slate-400")} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent text-foreground transition-colors"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </button>

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border/50 ml-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold">{user.username}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/50 px-1.5 rounded-sm">
                {user.role}
              </span>
            </div>
            
            <button
              onClick={() => navigate('/change-password')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-colors"
              title="Change Password"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            
            <button
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
