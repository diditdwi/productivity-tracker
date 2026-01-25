
import React, { useState } from 'react'
import { Plus, UserPlus, Users, ShieldAlert, RefreshCw } from 'lucide-react'
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in py-8 px-4">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage list of Technicians and HD Officers available in Ticket Form.
                    </p>
                </div>
                <button 
                    onClick={onRefresh} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh Data
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('TECHNICIAN')}
                        className={cn(
                            "flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
                            activeTab === 'TECHNICIAN' 
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600" 
                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        Technicians ({technicians.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('HD')}
                        className={cn(
                            "flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
                            activeTab === 'HD' 
                                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600" 
                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        HD Officers ({hdOfficers.length})
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: FORM */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-green-600" />
                                Add New {activeTab}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">
                                        ID / NIK / Telegram ID
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g 18890111"
                                        value={formData.id}
                                        onChange={e => setFormData({...formData, id: e.target.value})}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g ZAELANI M"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                
                                <button 
                                    disabled={loading}
                                    type="submit" 
                                    className="w-full btn-primary py-2 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Saving...' : (
                                        <>
                                            <Plus className="w-4 h-4" /> Add User
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-slate-400 text-center">
                                    Will act immediately & save to Google Sheet "Staff" tab.
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: LIST */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                                Current List
                            </h3>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                Total: {currentList.length}
                            </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[500px] overflow-y-auto relative">
                             {currentList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Users className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No users found</p>
                                </div>
                             ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 w-12">#</th>
                                            <th className="px-4 py-3">Full String (ID - Name)</th>
                                            {/* <th className="px-4 py-3 w-20">Action</th> */}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {currentList.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                                <td className="px-4 py-2 font-mono text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">
                                                    {item}
                                                </td>
                                                {/* <td className="px-4 py-2 text-center">
                                                    <button className="text-red-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td> */}
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
