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
    if (!sessionId || !data.id || !data.title || !data.emoji || !data.eventDate) {
      console.error('[v0] Invalid event data provided')
      return { success: false, error: 'Invalid event data' }
    }

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
    
    console.log('[v0] Event saved successfully:', data.id)
    return { success: true, data }
  } catch (error) {
    console.error('[v0] Failed to save event:', error)
    return { success: false, error: 'Failed to save event to database' }
  }
}

export async function getEvents(sessionId: string) {
  try {
    if (!sessionId) {
      console.error('[v0] No session ID provided')
      return { success: false, error: 'Session not found', events: [] }
    }

    const result = await db.execute(
      sql`SELECT id, title, emoji, event_date, notes, photo, category, recurring, color, created_at
          FROM countdown_events
          WHERE session_id = ${sessionId}
          ORDER BY event_date ASC`
    )
    
    const events = (result as any[]).map((row: any) => ({
      id: row.id,
      title: row.title,
      emoji: row.emoji,
      eventDate: new Date(row.event_date).toISOString(),
      notes: row.notes,
      photo: row.photo,
      category: row.category,
      recurring: row.recurring,
      color: row.color,
      createdAt: new Date(row.created_at).toISOString()
    }))
    
    console.log(`[v0] Loaded ${events.length} events for session:`, sessionId.substring(0, 10))
    return { success: true, events }
  } catch (error) {
    console.error('[v0] Failed to fetch events:', error)
    return { success: false, error: 'Failed to load events', events: [] }
  }
}

export async function deleteEvent(id: string, sessionId: string) {
  try {
    if (!id || !sessionId) {
      return { success: false, error: 'Invalid parameters' }
    }

    await db.execute(
      sql`DELETE FROM countdown_events WHERE id = ${id} AND session_id = ${sessionId}`
    )
    
    console.log('[v0] Event deleted:', id)
    return { success: true }
  } catch (error) {
    console.error('[v0] Failed to delete event:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}
