'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface JoinRoomProps {
  isOpen: boolean
  onClose: () => void
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Please enter a code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formattedCode = code.toUpperCase().trim()
      router.push(`/shared/${formattedCode}`)
      onClose()
    } catch (err) {
      setError('Failed to join. Please try again.')
      console.error('[v0] Error joining room:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.trim()) {
      handleJoin()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[var(--background)] rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--text)]">
            Join Countdown
          </h2>
          <button
            onClick={onClose}
            className="text-[24px] text-[var(--text-secondary)] active:opacity-70"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              How to Join
            </p>
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
                  1
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pt-0.5">
                  Ask a friend for their share code
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
                  2
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pt-0.5">
                  Enter it below (e.g., WF-XXXXX)
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
                  3
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pt-0.5">
                  View the countdown together
                </p>
              </div>
            </div>
          </div>

          {/* Code Input */}
          <div>
            <label htmlFor="code" className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-3">
              Enter Share Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                if (error) setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="WF-XXXXX"
              maxLength={20}
              className="w-full px-4 py-3 text-center text-[20px] font-mono font-bold tracking-wider bg-[var(--surface)] border-2 border-[var(--border)] rounded-[16px] text-[var(--accent)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)]/50 transition-colors"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[12px]">
              <p className="text-[13px] text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={!code.trim() || loading}
            className={`w-full py-3 rounded-[12px] text-[15px] font-semibold tracking-tight transition-colors active:scale-95 ${
              code.trim() && !loading
                ? 'bg-[var(--accent)] text-white hover:opacity-90'
                : 'bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
            }`}
            type="button"
          >
            {loading ? 'Joining...' : '📱 Join Countdown'}
          </button>

          {/* Example */}
          <div className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[12px] text-center">
            <p className="text-[12px] text-[var(--text-tertiary)]">
              💡 Example code: <span className="font-mono text-[var(--text)]">WF-ABC123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[12px] text-[15px] font-semibold tracking-tight bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)]/10 transition-colors active:scale-95"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
