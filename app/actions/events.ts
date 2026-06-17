'use server'

import { db } from '@/lib/db'
import { countdown_events } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

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

    // Check if event exists
    const existing = await db.select().from(countdown_events).where(eq(countdown_events.id, data.id))
    
    if (existing.length > 0) {
      // Update existing
      await db.update(countdown_events).set({
        title: data.title,
        emoji: data.emoji,
        event_date: data.eventDate,
        notes: data.notes,
        photo: data.photo,
        category: data.category,
        recurring: data.recurring,
        color: data.color,
        updated_at: new Date(),
      }).where(eq(countdown_events.id, data.id))
    } else {
      // Insert new
      await db.insert(countdown_events).values({
        id: data.id,
        title: data.title,
        emoji: data.emoji,
        event_date: data.eventDate,
        notes: data.notes,
        photo: data.photo,
        category: data.category,
        recurring: data.recurring,
        color: data.color,
        session_id: sessionId,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }
    
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

    const rows = await db.select().from(countdown_events).where(eq(countdown_events.session_id, sessionId))
    
    const events = rows.map((row: any) => ({
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
    
    console.log(`[v0] Loaded ${events.length} events for session: default_session`)
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

    await db.delete(countdown_events).where(
      and(
        eq(countdown_events.id, id),
        eq(countdown_events.session_id, sessionId)
      )
    )
    
    console.log('[v0] Event deleted:', id)
    return { success: true }
  } catch (error) {
    console.error('[v0] Failed to delete event:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}
