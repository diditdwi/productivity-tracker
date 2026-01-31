import React, { useState } from 'react'
import { Plus, UserPlus, Users, ShieldAlert, RefreshCw, UserCircle2 } from 'lucide-react'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

export default function UserManagement({ technicians, hdOfficers, onRefresh }) {
    const [activeTab, setActiveTab] = useState('TECHNICIAN') // TECHNICIAN | HD
    const [loading, setLoading] = useState(false)
    
    // Form State
    const [formData, setFormData] = useState({
        id: '',
        name: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.id || !formData.name) return toast.error("Please fill all fields")

        setLoading(true)
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: activeTab,
                    id: formData.id,
                    name: formData.name.toUpperCase()
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(`User Added: ${data.fullString}`)
                setFormData({ id: '', name: '' })
                if (onRefresh) onRefresh()
            } else {
                toast.error(data.error || "Failed to add user")
            }
        } catch (error) {
            console.error(error)
            toast.error("Network Error")
        } finally {
            setLoading(false)
        }
    }

    const currentList = activeTab === 'TECHNICIAN' ? technicians : hdOfficers

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-4 px-4">
            
            <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                            User Management
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            Manage Technicians and HD Officers access
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onRefresh} 
                    className="btn-secondary flex items-center gap-2 group"
                >
                    <RefreshCw className={cn("w-4 h-4 transition-transform", loading && "animate-spin")} />
                    <span className="hidden sm:inline">Refresh Data</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="glass-panel overflow-hidden">
                
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-white/5 dark:bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('TECHNICIAN')}
                        className={cn(
                            "flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                            activeTab === 'TECHNICIAN' 
                                ? "text-primary bg-primary/5" 
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                    >
                        {activeTab === 'TECHNICIAN' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
                        )}
                        <UserCircle2 className="w-4 h-4" />
                        Technicians
                        <span className="ml-2 px-2 py-0.5 text-xs bg-white/10 rounded-full">{technicians.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('HD')}
                        className={cn(
                            "flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                            activeTab === 'HD' 
                                ? "text-purple-500 bg-purple-500/5" 
                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                    >
                        {activeTab === 'HD' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 shadow-[0_-2px_10px_rgba(168,85,247,0.5)]" />
                        )}
                        <ShieldAlert className="w-4 h-4" />
                        HD Officers
                        <span className="ml-2 px-2 py-0.5 text-xs bg-white/10 rounded-full">{hdOfficers.length}</span>
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: FORM */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/5 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/10 shadow-inner">
                            <h3 className="font-extrabold text-lg mb-6 flex items-center gap-2 text-foreground">
                                <div className={cn("p-2 rounded-lg", activeTab === 'TECHNICIAN' ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-500")}>
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                Add New {activeTab === 'TECHNICIAN' ? 'Technician' : 'Officer'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        ID / NIK / Telegram ID
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g 18890111"
                                        value={formData.id}
                                        onChange={e => setFormData({...formData, id: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-sm focus:ring-2 focus:ring-primary outline-none font-mono text-foreground placeholder:text-muted-foreground transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g ZAELANI M"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-sm focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground transition-all"
                                    />
                                </div>
                                
                                <button 
                                    disabled={loading}
                                    type="submit" 
                                    className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" /> Add User
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-muted-foreground text-center italic bg-white/5 p-2 rounded-lg">
                                    * Updates immediately sync to "Staff" sheet.
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: LIST */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                Current List
                            </h3>
                        </div>

                        <div className="bg-white/5 dark:bg-slate-900/30 border border-white/10 rounded-2xl overflow-hidden h-[500px] overflow-y-auto relative custom-scrollbar shadow-inner">
                             {currentList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <div className="p-4 bg-white/5 rounded-full">
                                        <Users className="w-12 h-12 opacity-50" />
                                    </div>
                                    <p className="font-medium">No users found in this category</p>
                                </div>
                             ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 dark:bg-slate-900/50 text-xs uppercase text-muted-foreground font-bold sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-6 py-4 w-16 text-center border-b border-white/10">#</th>
                                            <th className="px-6 py-4 border-b border-white/10">User Identifier (ID - Name)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {currentList.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                                <td className="px-6 py-3 font-mono text-muted-foreground text-xs text-center group-hover:text-primary transition-colors">{idx + 1}</td>
                                                <td className="px-6 py-3 font-medium text-foreground group-hover:translate-x-1 transition-transform">
                                                    {item}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
