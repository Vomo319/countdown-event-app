'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSharedRoom, copySharedEventToUser } from '@/app/actions/shared-rooms'

interface SharedRoom {
  id: string
  room_code: string
  event_title: string
  event_emoji: string
  event_date: Date
  creator_id: string
  category?: string
  color?: string
  view_count?: number
  created_at?: Date
}

export default function SharedRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string
  const [room, setRoom] = useState<SharedRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    const loadRoom = async () => {
      try {
        if (!roomCode) {
          setError('No room code provided')
          return
        }

        const result = await getSharedRoom(roomCode)
        if (result.success && result.room) {
          setRoom(result.room as SharedRoom)
        } else {
          setError(result.error || 'Room not found')
        }
      } catch (err) {
        console.error('[v0] Error loading shared room:', err)
        setError('Failed to load shared room')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()
  }, [roomCode])

  const handleCopyToMyCountdowns = async () => {
    setCopying(true)
    try {
      // Get the user's session ID (or create one)
      let sessionId = localStorage.getItem('countdown_session_id')
      if (!sessionId) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        const part3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        sessionId = `${part1}-${part2}-${part3}`
        localStorage.setItem('countdown_session_id', sessionId)
        localStorage.setItem('waiting_for_recovery_key', sessionId)
      }

      // Copy the event to the user's account
      const result = await copySharedEventToUser(roomCode, sessionId)
      if (result.success) {
        // Show success and redirect to home
        setTimeout(() => {
          router.push('/?success=event-added')
        }, 800)
      } else {
        setError(result.error || 'Failed to add to your countdowns')
      }
    } catch (err) {
      console.error('[v0] Error copying event:', err)
      setError('Failed to add to your countdowns')
    } finally {
      setCopying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-[16px] text-[var(--text-secondary)] font-medium">Loading countdown...</p>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-2">Just a moment</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-[24px] font-bold text-[var(--text)] mb-3">Room Not Found</h1>
          <p className="text-[15px] text-[var(--text-secondary)] mb-2">
            {error || 'This countdown is no longer available.'}
          </p>
          <p className="text-[13px] text-[var(--text-tertiary)] mb-6">
            The share code may have expired or be incorrect.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-[12px] font-medium text-[15px] hover:opacity-90 transition-opacity active:scale-95"
          >
            Create Your Own Countdown
          </a>
        </div>
      </div>
    )
  }

  const eventDate = new Date(room.event_date)
  const now = new Date()
  const diffMs = eventDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <a 
            href="/" 
            className="inline-block text-[var(--accent)] text-[15px] font-medium tracking-tight hover:opacity-70 active:opacity-50"
          >
            ← Back to App
          </a>
        </div>

        {/* Shared Event Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[28px] overflow-hidden shadow-lg animate-[fadeInUp_0.4s_ease]">
          {/* Top Section - Event Info */}
          <div className="p-8 text-center border-b border-[var(--border-subtle)]">
            <div className="text-[72px] mb-4 inline-block">{room.event_emoji}</div>
            <h1 className="text-[28px] font-bold text-[var(--text)] mb-2 text-balance tracking-tight">
              {room.event_title}
            </h1>
            
            {room.category && room.category !== 'personal' && (
              <div className="inline-block mt-3 px-3 py-1 bg-[var(--accent)]/10 rounded-[10px] text-[12px] font-medium text-[var(--accent)] uppercase tracking-wider">
                {room.category}
              </div>
            )}
          </div>

          {/* Countdown Section */}
          <div className="p-8 text-center bg-gradient-to-b from-transparent to-[var(--accent)]/5">
            <p className="text-[12px] uppercase tracking-widest text-[var(--text-tertiary)] mb-4 font-semibold">
              {diffDays < 0 ? '🎉 It Happened!' : '⏳ Counting Down To...'}
            </p>
            
            <div className="mb-6">
              <div className="text-[64px] font-bold font-mono text-[var(--accent)]">
                {Math.abs(diffDays)}
              </div>
              <p className="text-[16px] text-[var(--text-secondary)] mt-3 font-medium tracking-tight">
                {diffDays < 0 
                  ? `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago` 
                  : `day${Math.abs(diffDays) !== 1 ? 's' : ''} away`
                }
              </p>
            </div>

            <p className="text-[15px] text-[var(--text)] font-medium mb-2 tracking-tight">
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <div className="text-[12px] text-[var(--text-tertiary)] tracking-tight">
              👥 Shared {(room.view_count || 1)} time{(room.view_count || 1) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-6 bg-[var(--surface-secondary)] text-center border-t border-[var(--border-subtle)] space-y-3">
            <p className="text-[13px] text-[var(--text-secondary)] tracking-tight">
              Like this countdown? Add it to yours!
            </p>
            <button
              onClick={handleCopyToMyCountdowns}
              disabled={copying}
              className={`w-full px-6 py-3 rounded-[12px] text-[15px] font-semibold tracking-tight transition-all active:scale-95 ${
                copying
                  ? 'bg-[var(--accent)]/50 text-white cursor-wait'
                  : 'bg-[var(--accent)] text-white hover:opacity-90 shadow-md'
              }`}
            >
              {copying ? '✓ Adding to Countdowns...' : '➕ Add to My Countdowns'}
            </button>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              or{' '}
              <a href="/" className="text-[var(--accent)] hover:underline">
                create your own
              </a>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-5 bg-[var(--surface-secondary)] rounded-[20px] border border-[var(--border)] text-center animate-[fadeInUp_0.4s_ease_0.1s_backwards]">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed tracking-tight">
            💡 Waiting For is a simple app for sharing anticipation. Create countdowns, share codes with friends, and celebrate together.
          </p>
        </div>

        {/* Share Hint */}
        <div className="mt-6 text-center text-[12px] text-[var(--text-tertiary)] tracking-tight">
          <p>🔗 Share this link or show them the code to let more people join</p>
        </div>
      </div>
    </div>
  )
}
