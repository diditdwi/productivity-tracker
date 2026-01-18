import React from 'react'

export default function InventoryDashboard() {
  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between mb-8">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Kebutuhan Material</h2>
        <button className="btn-primary">
          + Request Material
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
        <div className="mb-4 text-4xl">📦</div>
        <h3 className="text-xl font-bold mb-2">Inventory Module</h3>
        <p className="text-slate-500 mb-6">
          Material tracking and request system is currently under development.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8 opacity-50 pointer-events-none filter blur-sm select-none">
             {/* Mock Content */}
             {[1,2,3].map(i => (
                <div key={i} className="p-4 border rounded-lg text-left">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </div>
             ))}
        </div>
      </div>
    </div>
  )
}
