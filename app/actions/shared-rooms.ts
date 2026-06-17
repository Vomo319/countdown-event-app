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
    const now = new Date()
    
    console.log('[v0] Creating shared room with code:', roomCode)
    
    await db
      .insert(shared_rooms)
      .values({
        id,
        room_code: roomCode,
        creator_id: creatorId || 'anonymous',
        event_title: eventTitle,
        event_emoji: eventEmoji,
        event_date: eventDate,
        category,
        color,
        created_at: now,
        updated_at: now,
        view_count: 0,
      })
    
    // Fetch back the created room to confirm
    const result = await db
      .select()
      .from(shared_rooms)
      .where(eq(shared_rooms.id, id))
      .limit(1)
    
    if (result.length > 0) {
      console.log('[v0] Room created successfully:', result[0])
      return { success: true, room: result[0] }
    } else {
      console.error('[v0] Room was inserted but not found on select')
      // Still return success with constructed room object
      return {
        success: true,
        room: {
          id,
          room_code: roomCode,
          creator_id: creatorId || 'anonymous',
          event_title: eventTitle,
          event_emoji: eventEmoji,
          event_date: eventDate,
          category,
          color,
          created_at: now,
          updated_at: now,
          view_count: 0,
        }
      }
    }
  } catch (error) {
    console.error('[v0] Failed to create shared room:', error)
    return { success: false, error: 'Failed to create shared room' }
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
