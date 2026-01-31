import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout({ user, onLogout, openCount }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 gap-3">
      {/* Sidebar with rounded corners */}
      <div className="flex-shrink-0 h-full">
        <Sidebar user={user} onLogout={onLogout} openCount={openCount} />
      </div>
      
      {/* Main Content with rounded corners and shadow (Floating Card Effect) */}
      <main className="flex-1 rounded-[2rem] bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl overflow-y-auto overflow-x-hidden h-full relative">
        <div className="w-full h-full p-4 md:p-8">
           <Outlet />
        </div>
      </main>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#2d3748',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px'
          }
        }}
      />
    </div>
  )
}
