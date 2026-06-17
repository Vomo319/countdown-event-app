'use server'

import { db } from '@/lib/db'
import { countdown_events } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

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
}

// Load all events for a given session_id — simple, no migration magic
export async function getEvents(sessionId: string) {
  if (!sessionId) return { success: false, error: 'No session ID', events: [] }
  try {
    const rows = await db
      .select()
      .from(countdown_events)
      .where(eq(countdown_events.session_id, sessionId))

    const events = rows.map((row) => ({
      id: row.id,
      title: row.title,
      emoji: row.emoji,
      eventDate: new Date(row.event_date).toISOString(),
      notes: row.notes ?? undefined,
      photo: row.photo ?? undefined,
      category: row.category ?? undefined,
      recurring: row.recurring ?? undefined,
      color: row.color ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
    }))

    return { success: true, events }
  } catch (error) {
    console.error('[v0] getEvents error:', error)
    return { success: false, error: 'Failed to load events', events: [] }
  }
}

// Upsert a single event — insert or update based on whether it exists
export async function saveEvent(data: CountdownEventData, sessionId: string) {
  if (!sessionId || !data.id || !data.title) {
    return { success: false, error: 'Invalid data' }
  }
  try {
    const existing = await db
      .select({ id: countdown_events.id })
      .from(countdown_events)
      .where(eq(countdown_events.id, data.id))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(countdown_events)
        .set({
          title: data.title,
          emoji: data.emoji,
          event_date: data.eventDate,
          notes: data.notes ?? null,
          photo: data.photo ?? null,
          category: data.category ?? null,
          recurring: data.recurring ?? null,
          color: data.color ?? null,
          updated_at: new Date(),
        })
        .where(and(eq(countdown_events.id, data.id), eq(countdown_events.session_id, sessionId)))
    } else {
      await db.insert(countdown_events).values({
        id: data.id,
        title: data.title,
        emoji: data.emoji,
        event_date: data.eventDate,
        notes: data.notes ?? null,
        photo: data.photo ?? null,
        category: data.category ?? null,
        recurring: data.recurring ?? null,
        color: data.color ?? null,
        session_id: sessionId,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] saveEvent error:', error)
    return { success: false, error: 'Failed to save event' }
  }
}

// Delete a single event scoped to the session
export async function deleteEvent(id: string, sessionId: string) {
  if (!id || !sessionId) return { success: false, error: 'Invalid parameters' }
  try {
    await db
      .delete(countdown_events)
      .where(and(eq(countdown_events.id, id), eq(countdown_events.session_id, sessionId)))
    return { success: true }
  } catch (error) {
    console.error('[v0] deleteEvent error:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}
