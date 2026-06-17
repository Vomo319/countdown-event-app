'use client'

import { useState, useEffect } from 'react'

interface RecoveryKeyDisplayProps {
  onClose: () => void
}

export function RecoveryKeyDisplay({ onClose }: RecoveryKeyDisplayProps) {
  const [recoveryKey, setRecoveryKey] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      // The recovery key IS the session_id — the permanent DB identity
      const key = localStorage.getItem('countdown_session_id') || localStorage.getItem('waiting_for_recovery_key') || ''
      setRecoveryKey(key)
    }
  }, [])

  if (!mounted) return null

  const handleCopy = async () => {
    if (recoveryKey) {
      await navigator.clipboard.writeText(recoveryKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div className="w-full bg-[var(--background)] rounded-t-[24px] p-6 animate-[slideUp_0.3s_ease]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-bold text-[var(--text)]">Your Recovery Key</h1>
            <button onClick={onClose} className="text-[24px] text-[var(--text-secondary)]">✕</button>
          </div>

          <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-[16px] p-4 mb-6">
            <p className="text-[13px] text-[var(--text)] leading-relaxed">
              Save this code to recover your countdowns if you reinstall the app or switch devices.
            </p>
          </div>

          <div className="bg-[var(--surface)] border-2 border-[var(--accent)] rounded-[20px] p-8 mb-4 text-center">
            <p className="text-[12px] uppercase tracking-widest text-[var(--text-tertiary)] mb-3 font-semibold">Recovery Key</p>
            <div className="text-[36px] font-mono font-bold text-[var(--accent)] tracking-wide break-words mb-4">
              {recoveryKey}
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)]">Keep this safe</p>
          </div>

          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-[14px] text-[15px] font-semibold mb-3 transition-all active:scale-95 ${
              copied
                ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                : 'bg-[var(--accent)] text-white'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-[14px] text-[15px] font-semibold bg-[var(--surface-secondary)] text-[var(--text)] border border-[var(--border)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
