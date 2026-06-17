'use client'

import { useEffect, useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { createSharedRoom } from '@/app/actions/shared-rooms'

interface ShareableRoomProps {
  eventId: string
  eventTitle: string
  eventEmoji: string
  eventDate: Date
  category?: string
  color?: string
}

export function ShareableRoomComponent({
  eventTitle,
  eventEmoji,
  eventDate,
  category,
  color,
}: ShareableRoomProps) {
  const [roomCode, setRoomCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateRoomCode()
  }, [eventTitle, eventEmoji, eventDate])

  const generateRoomCode = async () => {
    setLoading(true)
    try {
      const result = await createSharedRoom(eventTitle, eventEmoji, eventDate, category, color)
      if (result.success && result.room) {
        setRoomCode(result.room.room_code)
        console.log('[v0] Room code generated:', result.room.room_code)
      } else {
        console.error('[v0] Failed to create room:', result.error)
      }
    } catch (error) {
      console.error('[v0] Failed to generate room code:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (roomCode) {
      const shareText = `Join me counting down to "${eventTitle}" ${eventEmoji}\nCode: ${roomCode}\nwaitingfor.app`
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareVia = async () => {
    if (roomCode && navigator.share) {
      try {
        await navigator.share({
          title: 'Waiting For - Shared Countdown',
          text: `Let's count down to ${eventTitle} ${eventEmoji}! Code: ${roomCode}`,
          url: `${window.location.origin}?room=${roomCode}`,
        })
      } catch (error) {
        console.log('[v0] Share cancelled:', error)
      }
    }
  }

  if (!roomCode) {
    return (
      <button
        onClick={generateRoomCode}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
      >
        <Share2 size={18} />
        {loading ? 'Generating...' : 'Share Countdown'}
      </button>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <Share2 size={18} className="text-[var(--accent)]" />
        <h3 className="font-semibold text-[var(--text-primary)]">Share Without Account</h3>
      </div>

      <div className="bg-[var(--background-secondary)] rounded-lg p-3 mb-3 font-mono text-center">
        <div className="text-sm text-[var(--text-secondary)] mb-1">Room Code</div>
        <div className="text-xl font-bold text-[var(--accent)]">{roomCode}</div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-3">
        Anyone with this code can view and sync this countdown on their device — no account needed.
      </p>

      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-hover)] transition-colors"
        >
          {copied ? (
            <>
              <Check size={16} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy
            </>
          )}
        </button>
        {navigator.share && (
          <button
            onClick={shareVia}
            className="flex-1 px-3 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            Share
          </button>
        )}
      </div>
    </div>
  )
}
