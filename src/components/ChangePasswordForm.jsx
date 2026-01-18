import React, { useState } from 'react'

export default function ChangePasswordForm({ user, onChangePassword, onCancel }) {
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      setError('New passwords do not match')
      return
    }
    if (newPass.length < 4) {
      setError('Password must be at least 4 chars')
      return
    }
    onChangePassword(newPass)
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>New Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}
        <div className="form-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Update Password</button>
        </div>
      </form>
    </div>
  )
}
