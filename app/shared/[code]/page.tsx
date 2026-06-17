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
    <div className="min-h-screen bg-white dark:bg-slate-900 p-4 pt-12 animate-fadeIn safe-area-horizontal">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-slideDown">
          <a href="/" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline inline-block mb-4">
            ← Back to App
          </a>
        </div>

        {/* Shared Event Card */}
        <div className="card !p-0 overflow-hidden shadow-2xl animate-scaleIn">
          {/* Top Section */}
          <div className="p-8 text-center border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
            <div className="text-[72px] mb-4 inline-block animate-pulse">{room.event_emoji}</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 text-balance">
              {room.event_title}
            </h1>
            
            {room.category && room.category !== 'personal' && (
              <div className="inline-block px-4 py-1.5 bg-indigo-100 dark:bg-indigo-950 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 capitalize">
                {room.category}
              </div>
            )}
          </div>

          {/* Countdown Section */}
          <div className="p-8 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4 font-bold">
              {diffDays < 0 ? '🎉 It Happened!' : '⏳ Counting Down To...'}
            </p>
            
            <div className="mb-8">
              <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-mono tracking-tighter animate-scaleIn">
                {Math.abs(diffDays)}
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-3 font-medium">
                {diffDays < 0 
                  ? `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago` 
                  : `day${Math.abs(diffDays) !== 1 ? 's' : ''} away`
                }
              </p>
            </div>

            <p className="text-base text-gray-900 dark:text-white font-semibold mb-4">
              {eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-950 rounded-full text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Shared {room.view_count || 1} time{(room.view_count || 1) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-slate-800 text-center border-t border-gray-200 dark:border-gray-700 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Want to create your own countdowns?
            </p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
            >
              Download Waiting For
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="surface animate-slideUp">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <span className="text-xl mr-2">💡</span>
            Create countdowns, share them with friends, and celebrate anticipation together on <strong>Waiting For</strong>.
          </p>
        </div>

        {/* Share Instructions */}
        <div className="text-center text-xs text-gray-600 dark:text-gray-500 pb-8">
          <p>Shared via: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{roomCode}</span></p>
        </div>
      </div>
    </div>
  )
}
