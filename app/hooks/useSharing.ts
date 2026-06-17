'use client'

import { useState, useCallback } from 'react'
import { createSharedRoom, getSharedRoom, copySharedEventToUser } from '@/app/actions/shared-rooms'
import type { CountdownEvent } from './useEvents'

/**
 * Sharing hook — handle room creation and joining
 * 
 * When user shares:
 * - Creates a shared_rooms entry with the event and creator ID
 * - Returns a room code (WF-XXXXX format)
 * - Generates a share link
 * 
 * When friend joins:
 * - Views the shared event (read-only)
 * - Can add to their own countdowns (copies event with their session ID)
 */
export function useSharing(sessionId: string) {
  const [sharing, setSharing] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [error, setError] = useState('')

  const shareEvent = useCallback(
    async (event: CountdownEvent) => {
      setSharing(true)
      setError('')
      try {
        const result = await createSharedRoom(
          event.title,
          event.emoji,
          new Date(event.eventDate),
          event.category,
          event.color,
          sessionId
        )

        if (result.success && result.room) {
          setRoomCode(result.room.room_code)
          const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${result.room.room_code}`
          setShareLink(link)
          return { success: true, code: result.room.room_code, link }
        } else {
          setError(result.error || 'Failed to create share')
          return { success: false }
        }
      } catch (err) {
        setError('Failed to share event')
        return { success: false }
      } finally {
        setSharing(false)
      }
    },
    [sessionId]
  )

  const copyToMyCountdowns = useCallback(async (roomCode: string) => {
    try {
      const result = await copySharedEventToUser(roomCode, sessionId)
      return result.success
    } catch (err) {
      console.error('[v0] Failed to copy event:', err)
      return false
    }
  }, [sessionId])

  const resetShare = useCallback(() => {
    setRoomCode('')
    setShareLink('')
    setError('')
  }, [])

  return {
    sharing,
    roomCode,
    shareLink,
    error,
    shareEvent,
    copyToMyCountdowns,
    resetShare,
  }
}
