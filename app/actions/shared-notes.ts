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

export async function addSharedNote(eventId: string, noteText: string, userName?: string) {
  const userId = await getUserId()
  const noteId = uuidv4()
  
  const session = await auth.api.getSession({ headers: await headers() })
  const displayName = userName || session?.user?.name || 'Anonymous'
  
  await db.query(
    `INSERT INTO shared_event_notes (id, event_id, user_id, note_text, user_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [noteId, eventId, userId, noteText, displayName]
  )
  
  return { noteId, success: true }
}

export async function getSharedNotes(eventId: string) {
  const result = await db.query(
    `SELECT id, note_text, user_name, created_at 
     FROM shared_event_notes 
     WHERE event_id = $1
     ORDER BY created_at DESC`,
    [eventId]
  )
  
  return result.rows
}

export async function deleteSharedNote(noteId: string) {
  const userId = await getUserId()
  
  const result = await db.query(
    `DELETE FROM shared_event_notes 
     WHERE id = $1 AND user_id = $2`,
    [noteId, userId]
  )
  
  return { success: result.rowCount > 0 }
}
