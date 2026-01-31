import React, { useState } from 'react'
import { Lock, Key, X, Check } from 'lucide-react'
import { cn } from '../lib/utils'

export default function ChangePasswordForm({ user, onChangePassword, onCancel }) {
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (newPass !== confirmPass) {
      setError('Passwords do not match')
      return
    }
    if (newPass.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    
    onChangePassword(newPass)
  }

  return (
    <div className="flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <Lock className="w-32 h-32" />
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary ring-4 ring-primary/5">
            <Key className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Change Password</h2>
          <p className="text-muted-foreground mt-2 text-sm">Use a strong password to secure your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">New Password</label>
            <input 
              type="password" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)} 
              required 
              className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-black/20 border border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPass} 
              onChange={e => setConfirmPass(e.target.value)} 
              required 
              className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-black/20 border border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <div className="w-1 h-1 bg-red-500 rounded-full" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-bold text-muted-foreground hover:text-foreground text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
