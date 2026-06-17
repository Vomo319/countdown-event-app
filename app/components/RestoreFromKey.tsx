'use client'

import { useState } from 'react'

interface RestoreFromKeyProps {
  onClose: () => void
  onSuccess: () => void
}

export function RestoreFromKey({ onClose, onSuccess }: RestoreFromKeyProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRestore = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter your recovery key')
      return
    }

    setLoading(true)
    setError('')

    try {
      // The recovery key is the client user ID.
      // Overwriting client_user_id makes the app load that user's events on reload.
      localStorage.setItem('client_user_id', trimmed)
      // Clear local cache so fresh DB data loads
      localStorage.removeItem('waiting_for_events_v1')
      setTimeout(() => {
        onSuccess()
      }, 300)
    } catch {
      setError('Failed to restore. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div className="w-full bg-[var(--background)] rounded-t-[24px] p-6 animate-[slideUp_0.3s_ease]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-bold text-[var(--text)]">Restore Countdowns</h1>
            <button onClick={onClose} className="text-[24px] text-[var(--text-secondary)]">✕</button>
          </div>

          <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-[16px] p-4 mb-6">
            <p className="text-[13px] text-[var(--text)] leading-relaxed">
              Enter your recovery key to restore your countdowns on this device.
            </p>
          </div>

          <div className="mb-6">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Recovery Key</p>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="e.g., AB3C-DE4F-GH5J"
              maxLength={14}
              className="w-full px-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-[14px] text-[16px] font-mono text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors text-center"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-3 mb-4">
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleRestore}
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded-[14px] text-[15px] font-semibold bg-[var(--accent)] text-white mb-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Restoring...' : 'Restore'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-[14px] text-[15px] font-semibold bg-[var(--surface-secondary)] text-[var(--text)] border border-[var(--border)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
