'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'WF-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createSharedRoom(eventData: {
  eventTitle: string
  eventEmoji: string
  eventDate: string
  category?: string
  color?: string
}) {
  const userId = await getUserId()
  
  let roomCode: string
  let isUnique = false
  
  // Generate unique room code
  while (!isUnique) {
    roomCode = generateRoomCode()
    // Check if code exists
    const existing = await db.query(
      'SELECT id FROM shared_rooms WHERE room_code = $1',
      [roomCode]
    )
    isUnique = existing.rows.length === 0
  }
  
  const roomId = uuidv4()
  const createdAt = new Date().toISOString()
  
  // Insert into database
  await db.query(
    `INSERT INTO shared_rooms 
     (id, room_code, creator_id, event_title, event_emoji, event_date, category, color, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      roomId,
      roomCode,
      userId,
      eventData.eventTitle,
      eventData.eventEmoji,
      eventData.eventDate,
      eventData.category || null,
      eventData.color || null,
      createdAt
    ]
  )
  
  return { roomId, roomCode }
}

export async function getSharedRoom(roomCode: string) {
  const result = await db.query(
    'SELECT * FROM shared_rooms WHERE room_code = $1',
    [roomCode]
  )
  
  if (result.rows.length === 0) {
    throw new Error('Room not found')
  }
  
  // Increment view count
  await db.query(
    'UPDATE shared_rooms SET view_count = view_count + 1 WHERE room_code = $1',
    [roomCode]
  )
  
  return result.rows[0]
}

export async function getUserSharedRooms() {
  const userId = await getUserId()
  
  const result = await db.query(
    'SELECT * FROM shared_rooms WHERE creator_id = $1 ORDER BY created_at DESC',
    [userId]
  )
  
  return result.rows
}
