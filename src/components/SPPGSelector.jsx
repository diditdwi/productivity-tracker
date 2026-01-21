
import React, { useState, useEffect, useRef } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import { SPPG_LIST } from '../constants'

export default function SPPGSelector({ onSelect, selectedValue, className }) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const wrapperRef = useRef(null)

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Filter Logic
    const filtered = SPPG_LIST.filter(item => {
        const search = query.toLowerCase()
        return (
            item.id.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search) ||
            (item.areaConfirmed && item.areaConfirmed.toLowerCase().includes(search))
        )
    })

    const getPriorityColor = (p) => {
        if (p === 'P1') return 'text-red-600 bg-red-100'
        if (p === 'P2') return 'text-orange-600 bg-orange-100'
        if (p === 'P3') return 'text-blue-600 bg-blue-100'
        return 'text-slate-600 bg-slate-100'
    }

    const handleSelect = (item) => {
        onSelect(item)
        setQuery(item.id + ' - ' + item.name)
        setIsOpen(false)
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setQuery('')
        onSelect(null)
        setIsOpen(true) // Keep open to let user type new search
    }

    // Sync internal query with selectedValue if provided (for edit mode)
    useEffect(() => {
        if (selectedValue) {
            // Find item
            const found = SPPG_LIST.find(s => s.id === selectedValue || (s.id + ' - ' + s.name) === selectedValue)
            if (found) {
                setQuery(found.id + ' - ' + found.name)
            } else {
                setQuery(selectedValue)
            }
        } else if (selectedValue === '') {
            setQuery('')
        }
    }, [selectedValue])

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 ml-1 mb-1 block">
                SPPG Location
            </label>

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Cari atau Pilih SPPG (Ketik ID/Nama...)"
                    className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 pl-10 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:border-slate-400"
                />
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />

                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 border-b border-blue-100 dark:border-blue-800">
                        -- {filtered.length} Lokasi ditemukan --
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">tidak ditemukan</div>
                    ) : (
                        filtered.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="cursor-pointer px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                            {item.id} <span className="font-normal text-slate-500 mx-1">-</span> {item.name}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {item.area} {item.areaConfirmed ? `(Zone: ${item.areaConfirmed})` : ''}
                                            </span>
                                        </div>
                                    </div>
                                    {item.priority && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}>
                                            {item.priority}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
