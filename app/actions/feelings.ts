'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Feeling options with contextual themes
const FEELING_OPTIONS = [
  { name: 'excited', theme: 'warmOrange' },
  { name: 'nervous', theme: 'calmPurple' },
  { name: 'hopeful', theme: 'hopefulTeal' },
  { name: 'grateful', theme: 'warmGold' },
  { name: 'anxious', theme: 'calmBlue' },
  { name: 'joyful', theme: 'brightYellow' },
]

export async function setEventFeeling(eventId: string, feeling: string, intensity: number = 5) {
  const userId = await getUserId()
  const feelingId = uuidv4()
  
  if (!FEELING_OPTIONS.some(f => f.name === feeling)) {
    throw new Error('Invalid feeling')
  }
  
  // Upsert feeling
  await db.query(
    `INSERT INTO event_feelings (id, event_id, user_id, feeling, intensity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (event_id, user_id) DO UPDATE SET
       feeling = $4,
       intensity = $5,
       updated_at = NOW()`,
    [feelingId, eventId, userId, feeling, intensity]
  )
  
  return { success: true, feeling, theme: FEELING_OPTIONS.find(f => f.name === feeling)?.theme }
}

export async function getEventFeeling(eventId: string) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT * FROM event_feelings WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId]
  )
  
  if (result.rows.length === 0) return null
  
  const feeling = result.rows[0].feeling
  return {
    feeling,
    intensity: result.rows[0].intensity,
    theme: FEELING_OPTIONS.find(f => f.name === feeling)?.theme
  }
}

export function getFeelingTheme(feeling: string) {
  return FEELING_OPTIONS.find(f => f.name === feeling)?.theme || 'default'
}

export function getAllFeelingOptions() {
  return FEELING_OPTIONS
}
