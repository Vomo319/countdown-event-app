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
  isJoined?: boolean
  sharedFromUserId?: string
}

/**
 * Load all events for the given user.
 * Simple query: no migration logic, no session juggling.
 */
export async function getEvents(userId: string) {
  if (!userId) {
    console.error('[v0] getEvents called with empty userId')
    return { success: false, error: 'No user ID', events: [] }
  }
  try {
    const rows = await db
      .select()
      .from(countdown_events)
      .where(eq(countdown_events.userId, userId))

    console.log(`[v0] Loaded ${rows.length} events for user ${userId.substring(0, 8)}`)

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

/**
 * Upsert a single event — insert or update based on whether it exists.
 * Always scoped to the user's ID to prevent data leakage.
 */
export async function saveEvent(data: CountdownEventData, userId: string) {
  if (!userId || !data.id || !data.title) {
    console.error('[v0] saveEvent: missing required data')
    return { success: false, error: 'Invalid data' }
  }
  try {
    const existing = await db
      .select({ id: countdown_events.id })
      .from(countdown_events)
      .where(and(eq(countdown_events.id, data.id), eq(countdown_events.userId, userId)))
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
        .where(and(eq(countdown_events.id, data.id), eq(countdown_events.userId, userId)))
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
        userId: userId,
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

/**
 * Delete a single event scoped to the user.
 */
export async function deleteEventDb(id: string, userId: string) {
  if (!id || !userId) {
    console.error('[v0] deleteEventDb: missing required params')
    return { success: false, error: 'Invalid parameters' }
  }
  try {
    await db
      .delete(countdown_events)
      .where(and(eq(countdown_events.id, id), eq(countdown_events.userId, userId)))
    return { success: true }
  } catch (error) {
    console.error('[v0] deleteEventDb error:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}

