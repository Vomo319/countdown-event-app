'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface CountdownEventData {
  id: string
  title: string
  emoji: string
  eventDate: Date
  notes?: string
  photo?: string
  category?: string
  recurring?: string
  color?: string
  createdAt: Date
}

export async function saveEvent(data: Omit<CountdownEventData, 'createdAt'>, sessionId: string) {
  try {
    const result = await db.execute(
      sql`INSERT INTO countdown_events (id, title, emoji, event_date, notes, photo, category, recurring, color, session_id, created_at, updated_at)
          VALUES (${data.id}, ${data.title}, ${data.emoji}, ${data.eventDate}, ${data.notes || null}, ${data.photo || null}, ${data.category || null}, ${data.recurring || null}, ${data.color || null}, ${sessionId}, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            emoji = EXCLUDED.emoji,
            event_date = EXCLUDED.event_date,
            notes = EXCLUDED.notes,
            photo = EXCLUDED.photo,
            category = EXCLUDED.category,
            recurring = EXCLUDED.recurring,
            color = EXCLUDED.color,
            updated_at = NOW()`
    )
    return { success: true, data }
  } catch (error) {
    console.error('[v0] Failed to save event:', error)
    return { success: false, error: 'Failed to save event' }
  }
}

export async function getEvents(sessionId: string) {
  try {
    const result = await db.execute(
      sql`SELECT id, title, emoji, event_date, notes, photo, category, recurring, color, created_at
          FROM countdown_events
          WHERE session_id = ${sessionId}
          ORDER BY created_at DESC`
    )
    
    return { 
      success: true, 
      events: (result as any[]).map((row: any) => ({
        id: row.id,
        title: row.title,
        emoji: row.emoji,
        eventDate: new Date(row.event_date),
        notes: row.notes,
        photo: row.photo,
        category: row.category,
        recurring: row.recurring,
        color: row.color,
        createdAt: new Date(row.created_at)
      }))
    }
  } catch (error) {
    console.error('[v0] Failed to fetch events:', error)
    return { success: false, error: 'Failed to fetch events', events: [] }
  }
}

export async function deleteEvent(id: string, sessionId: string) {
  try {
    await db.execute(
      sql`DELETE FROM countdown_events WHERE id = ${id} AND session_id = ${sessionId}`
    )
    return { success: true }
  } catch (error) {
    console.error('[v0] Failed to delete event:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}
