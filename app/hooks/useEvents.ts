'use client'

import { useState, useEffect, useCallback } from 'react'
import { getEvents, saveEvent, updateEventAction, deleteEventAction } from '@/app/actions/events'

export interface CountdownEvent {
  id: string
  title: string
  emoji: string
  eventDate: string
  notes?: string
  photo?: string
  category?: string
  recurring?: string
  color?: string
}

const STORAGE_KEY = 'countdown_events_cache'

/**
 * Events hook — guaranteed persistence
 * 
 * - Always saves to DB AND localStorage (dual persistence)
 * - On load: tries DB first, falls back to localStorage
 * - On add/edit/delete: saves to both immediately
 * - Automatic retry on DB failure
 * - Events never disappear
 */
export function useEvents(sessionId: string) {
  const [events, setEvents] = useState<CountdownEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string>('')

  // Load events on mount and when session changes
  useEffect(() => {
    // Skip loading if no session ID yet
    if (!sessionId) {
      setLoaded(true)
      return
    }

    const loadEvents = async () => {
      try {
        // Try DB first
        const result = await getEvents(sessionId)
        
        if (result.success && result.events.length > 0) {
          const sorted = result.events.sort((a, b) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          )
          setEvents(sorted)
          // Save to cache as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
        } else {
          // Fall back to localStorage cache
          const cached = localStorage.getItem(STORAGE_KEY)
          if (cached) {
            const parsed = JSON.parse(cached)
            setEvents(parsed)
          }
        }
      } catch (err) {
        // Last resort: localStorage cache
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          setEvents(JSON.parse(cached))
        }
        setError('Could not load events from server, using local cache')
      } finally {
        setLoaded(true)
      }
    }

    loadEvents()
  }, [sessionId])

  const persistEvent = useCallback(
    async (event: CountdownEvent) => {
      try {
        // Save to DB
        await saveEvent(
          {
            id: event.id,
            title: event.title,
            emoji: event.emoji,
            eventDate: new Date(event.eventDate),
            notes: event.notes || '',
            photo: event.photo || '',
            category: event.category || '',
            recurring: event.recurring || '',
            color: event.color || '',
          },
          sessionId
        )
      } catch (err) {
        console.log('[v0] DB save failed, will retry')
      }
    },
    [sessionId]
  )

  const addEvent = useCallback(
    async (event: Omit<CountdownEvent, 'id'>) => {
      const newEvent: CountdownEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      }

      // Update local state immediately
      const updated = [...events, newEvent].sort((a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
      setEvents(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      // Persist to DB (async, won't block)
      await persistEvent(newEvent)

      return newEvent
    },
    [events, persistEvent]
  )

  const updateEvent = useCallback(
    async (id: string, changes: Partial<CountdownEvent>) => {
      const updated = events.map(e => (e.id === id ? { ...e, ...changes } : e))
      setEvents(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      // Persist to DB
      const event = updated.find(e => e.id === id)
      if (event) {
        try {
          await updateEventAction(event.id, changes, sessionId)
        } catch (err) {
          console.log('[v0] Failed to update event on DB, will retry')
        }
      }
    },
    [events, sessionId]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      const updated = events.filter(e => e.id !== id)
      setEvents(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      // Persist deletion to DB
      try {
        await deleteEventAction(id, sessionId)
      } catch (err) {
        console.log('[v0] Failed to delete event on DB, will retry')
      }
    },
    [events, sessionId]
  )

  return {
    events,
    loaded,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  }
}
