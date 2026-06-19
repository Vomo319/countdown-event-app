'use server'

import { db } from '@/lib/db'
import { shared_rooms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// Generate a random 6-character room code like "WF-X7K2M"
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `WF-${code}`
}

// Create a shareable room for an event (no auth required)
export async function createSharedRoom(
  eventTitle: string,
  eventEmoji: string,
  eventDate: Date,
  category?: string,
  color?: string,
  creatorId?: string
) {
  try {
    const roomCode = generateRoomCode()
    const id = uuidv4()

    await db.insert(shared_rooms).values({
      id,
      room_code: roomCode,
      creator_id: creatorId || 'anonymous',
      event_title: eventTitle,
      event_emoji: eventEmoji,
      event_date: eventDate,
      category: category ?? null,
      color: color ?? null,
      view_count: 0,
    })

    return {
      success: true,
      room: {
        id,
        room_code: roomCode,
        creator_id: creatorId || 'anonymous',
        event_title: eventTitle,
        event_emoji: eventEmoji,
        event_date: eventDate,
        category: category ?? null,
        color: color ?? null,
        view_count: 0,
      }
    }
  } catch (error) {
    console.error('[v0] Failed to create shared room:', error)
    return { success: false, error: String(error) }
  }
}

// Get a shared room by code (public - no auth needed)
export async function getSharedRoom(roomCode: string) {
  try {
    const room = await db
      .select()
      .from(shared_rooms)
      .where(eq(shared_rooms.room_code, roomCode))
      .limit(1)
    
    if (room.length === 0) {
      return { success: false, error: 'Room not found' }
    }
    
    // Increment view count
    await db
      .update(shared_rooms)
      .set({ view_count: (room[0].view_count || 0) + 1 })
      .where(eq(shared_rooms.id, room[0].id))
    
    return { success: true, room: room[0] }
  } catch (error) {
    console.error('[v0] Failed to get shared room:', error)
    return { success: false, error: 'Failed to retrieve room' }
  }
}

// Copy a shared event to the current user's countdowns
export async function copySharedEventToUser(roomCode: string, recipientUserId: string) {
  try {
    // 1. Get the shared room
    const roomResult = await getSharedRoom(roomCode)
    if (!roomResult.success || !roomResult.room) {
      return { success: false, error: 'Room not found' }
    }

    const room = roomResult.room

    // 2. Create a new countdown_event with the recipient's userId
    const newEventId = uuidv4()
    const { countdown_events } = await import('@/lib/db/schema')
    
    await db.insert(countdown_events).values({
      id: newEventId,
      title: room.event_title,
      emoji: room.event_emoji,
      event_date: new Date(room.event_date),
      category: room.category || null,
      color: room.color || null,
      userId: recipientUserId,
      isJoined: true,
      sharedFromUserId: room.creator_id,
      notes: `Shared by ${room.creator_id}`,
      created_at: new Date(),
      updated_at: new Date(),
    })

    console.log('[v0] Event copied to user:', newEventId)
    return { success: true, eventId: newEventId }
  } catch (error) {
    console.error('[v0] Failed to copy event:', error)
    return { success: false, error: String(error) }
  }
}
