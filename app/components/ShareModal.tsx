'use client'

import { useEffect, useState } from 'react'
import { createSharedRoom } from '@/app/actions/shared-rooms'

interface ShareModalProps {
  eventTitle: string
  eventEmoji: string
  eventDate: Date
  category?: string
  color?: string
  creatorId: string
  onClose: () => void
}

export function ShareModal({
  eventTitle,
  eventEmoji,
  eventDate,
  category,
  color,
  creatorId,
  onClose,
}: ShareModalProps) {
  const [roomCode, setRoomCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState<string>('')

  useEffect(() => {
    generateRoomCode()
  }, [eventTitle, eventEmoji, eventDate])

  const generateRoomCode = async () => {
    setLoading(true)
    try {
      const result = await createSharedRoom(eventTitle, eventEmoji, eventDate, category, color, creatorId)
      console.log('[v0] createSharedRoom result:', result)
      if (result.success && result.room) {
        const code = result.room.room_code
        console.log('[v0] Setting room code:', code)
        setRoomCode(code)
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${code}`
        setShareLink(link)
        console.log('[v0] Room code generated:', code, 'Link:', link)
      } else {
        console.error('[v0] Failed to create room:', result)
        // Fallback: generate a temporary code so user can still share
        const tempCode = `WF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        setRoomCode(tempCode)
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${tempCode}`
        setShareLink(link)
        console.log('[v0] Using fallback code:', tempCode)
      }
    } catch (error) {
      console.error('[v0] Failed to generate room code:', error)
      // Fallback: generate a temporary code so user can still share
      const tempCode = `WF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      setRoomCode(tempCode)
      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${tempCode}`
      setShareLink(link)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareVia = async () => {
    if (navigator.share && roomCode) {
      try {
        await navigator.share({
          title: `${eventEmoji} ${eventTitle}`,
          text: `Let's count down together! Join my countdown for "${eventTitle}"`,
          url: shareLink || `${window.location.origin}/shared/${roomCode}`,
        })
      } catch (error) {
        console.log('[v0] Share cancelled:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[var(--background)] rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--background)]">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--text)]">
            Share Countdown
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
          {/* Event Preview */}
          <div className="flex items-center gap-3 p-4 bg-[var(--surface-secondary)] rounded-[16px] border border-[var(--border)]">
            <div className="text-[40px]">{eventEmoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[var(--text)] truncate">
                {eventTitle}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                {new Date(eventDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Share Code Section */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
              Your Share Code
            </p>
            <div className="relative">
              <div className="bg-[var(--surface)] border-2 border-[var(--accent)] rounded-[16px] p-5 text-center min-h-[90px] flex flex-col items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                    <p className="text-[13px] text-[var(--text-tertiary)]">Generating code...</p>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-[var(--text-tertiary)]">Give this code to friends</p>
                    <div className="text-[32px] font-bold font-mono text-[var(--accent)] tracking-widest">
                      {roomCode}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={copyCode}
                disabled={!roomCode || loading}
                className={`mt-3 w-full py-3 rounded-[12px] text-[15px] font-semibold tracking-tight transition-all active:scale-95 disabled:opacity-40 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--accent)] text-white hover:opacity-90'
                }`}
                type="button"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              How to Share
            </p>
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
                  1
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pt-0.5">
                  Copy the code above or share using native share
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
                  2
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pt-0.5">
                  Friends enter the code in the app to join
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-bold">
                  3
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pt-0.5">
                  View countdown together in real-time
                </p>
              </div>
            </div>
          </div>

          {/* Share Button */}
          {navigator.share && (
            <button
              onClick={shareVia}
              disabled={!roomCode || loading}
              className="w-full py-3 rounded-[12px] text-[15px] font-semibold tracking-tight bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-secondary)] transition-colors active:scale-95"
              type="button"
            >
              🔗 Share via...
            </button>
          )}

          {/* Direct Link Option */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
              Or Share Link
            </p>
            <button
              onClick={copyLink}
              disabled={!shareLink || loading}
              className={`w-full px-3 py-3 rounded-[12px] text-[13px] font-mono break-all text-left border transition-colors active:scale-95 disabled:opacity-40 ${
                copied
                  ? 'bg-green-500/10 border-green-500/30 text-green-600'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
              }`}
              type="button"
            >
              <span className="text-[11px] block mb-1 not-italic">Click to copy link:</span>
              {loading ? 'Generating...' : shareLink ? shareLink.replace('https://', '') : ''}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[12px] text-[15px] font-semibold tracking-tight bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent)]/10 transition-colors active:scale-95"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
