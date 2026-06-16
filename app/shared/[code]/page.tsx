'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getSharedRoom } from '@/app/actions/shared-rooms'

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
  const roomCode = params.code as string
  const [room, setRoom] = useState<SharedRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-[var(--text-secondary)]">Loading countdown...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-[24px] font-bold text-[var(--text)] mb-2">Room Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-6">{error || 'This countdown is no longer available'}</p>
          <a href="/" className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-[12px] font-medium">
            Create Your Own
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
    <div className="min-h-screen bg-[var(--background)] p-4 pt-12">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="text-[var(--accent)] text-[15px] font-medium mb-4 inline-block">
            ← Back to App
          </a>
        </div>

        {/* Shared Event Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] overflow-hidden shadow-lg">
          {/* Top Section */}
          <div className="p-8 text-center border-b border-[var(--border)]">
            <div className="text-[64px] mb-4">{room.event_emoji}</div>
            <h1 className="text-[28px] font-bold text-[var(--text)] mb-2 text-balance">
              {room.event_title}
            </h1>
            
            {room.category && room.category !== 'personal' && (
              <div className="inline-block px-3 py-1 bg-[var(--accent)]/10 rounded-[8px] text-[12px] font-medium text-[var(--accent)] mt-2">
                {room.category}
              </div>
            )}
          </div>

          {/* Countdown Section */}
          <div className="p-8 text-center bg-gradient-to-b from-transparent to-[var(--accent)]/5">
            <p className="text-[13px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
              {diffDays < 0 ? 'It happened!' : 'Counting down to...'}
            </p>
            
            <div className="mb-6">
              <div className="text-[56px] font-bold text-[var(--accent)] font-mono">
                {Math.abs(diffDays)}
              </div>
              <p className="text-[16px] text-[var(--text-secondary)] mt-2">
                {diffDays < 0 
                  ? `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago` 
                  : `day${Math.abs(diffDays) !== 1 ? 's' : ''} away`
                }
              </p>
            </div>

            <p className="text-[14px] text-[var(--text)] font-medium mb-4">
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <div className="text-[12px] text-[var(--text-tertiary)]">
              ✓ Shared {room.view_count || 1} time{(room.view_count || 1) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-[var(--surface-secondary)] text-center border-t border-[var(--border)]">
            <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
              Want to create your own countdowns?
            </p>
            <a 
              href="/" 
              className="inline-block px-6 py-2.5 bg-[var(--accent)] text-white rounded-[10px] text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Download Waiting For
            </a>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-8 p-4 bg-[var(--surface)] rounded-[16px] border border-[var(--border)] text-center">
          <p className="text-[13px] text-[var(--text-secondary)]">
            💡 Create countdowns, share them with friends, and celebrate anticipation together on Waiting For.
          </p>
        </div>
      </div>
    </div>
  )
}
