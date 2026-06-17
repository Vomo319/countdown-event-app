'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Settings, Share2 } from 'lucide-react'
import { AddEventModal } from './components/AddEventModal'
import { ShareModal } from './components/ShareModal'
import { saveEvent, deleteEvent as deleteEventDb, getEvents } from './actions/events'

type Category = 'personal' | 'milestone' | 'travel' | 'holiday'

interface CountdownEvent {
  id: string
  title: string
  emoji: string
  eventDate: string
  category?: Category
  color?: string
  notes?: string
  createdAt: string
}

function getDaysRemaining(dateString: string): number {
  const event = new Date(dateString + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = event.getTime() - today.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function Home() {
  const [events, setEvents] = useState<CountdownEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CountdownEvent | null>(null)
  const [isDark, setIsDark] = useState(false)

  // Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await getEvents('default_session')
        if (result.success && result.events) {
          const sorted = result.events.sort((a, b) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          )
          setEvents(sorted)
        }
      } catch (error) {
        console.error('[v0] Failed to load events:', error)
      } finally {
        setLoaded(true)
      }
    }

    // Check dark mode preference
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(darkMode)

    loadEvents()
  }, [])

  const handleAddEvent = async (data: {
    title: string
    emoji: string
    eventDate: string
    category: string
  }) => {
    try {
      const newEvent: CountdownEvent = {
        id: generateId(),
        title: data.title,
        emoji: data.emoji,
        eventDate: data.eventDate,
        category: data.category as Category,
        createdAt: new Date().toISOString(),
      }

      // Save to database
      const dbResult = await saveEvent(
        {
          id: newEvent.id,
          title: newEvent.title,
          emoji: newEvent.emoji,
          eventDate: new Date(newEvent.eventDate),
          category: newEvent.category,
          createdAt: new Date(),
        },
        'default_session'
      )

      if (!dbResult.success) {
        throw new Error('Failed to save to database')
      }

      const sorted = [...events, newEvent].sort((a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
      setEvents(sorted)
    } catch (error) {
      console.error('[v0] Error adding event:', error)
      alert('Failed to create event')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this countdown?')) return

    try {
      const result = await deleteEventDb(id, 'default_session')
      if (result.success) {
        setEvents(events.filter(e => e.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  const handleShare = (event: CountdownEvent) => {
    setSelectedEvent(event)
    setShowShareModal(true)
  }

  const futureEvents = events.filter(e => getDaysRemaining(e.eventDate) >= 0)
  const pastEvents = events.filter(e => getDaysRemaining(e.eventDate) < 0)

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-slate-900 transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between safe-area-horizontal">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Waiting For</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Count down to what matters</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-8 safe-area-horizontal safe-area-bottom">
          {futureEvents.length === 0 && pastEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Countdowns Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first countdown to something amazing!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary px-6 py-3"
              >
                Create First Countdown
              </button>
            </div>
          ) : (
            <>
              {/* Upcoming Events */}
              {futureEvents.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar size={22} className="text-indigo-600" />
                    Upcoming
                  </h2>
                  <div className="space-y-3">
                    {futureEvents.map(event => {
                      const days = getDaysRemaining(event.eventDate)
                      return (
                        <div
                          key={event.id}
                          className="card group cursor-pointer hover:shadow-lg hover:scale-102 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="text-4xl">{event.emoji}</div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {days}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {days === 1 ? 'day' : 'days'}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleShare(event)}
                              className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-2"
                            >
                              <Share2 size={16} />
                              Share
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-gray-500">
                    Memories
                  </h2>
                  <div className="space-y-3 opacity-60">
                    {pastEvents.map(event => (
                      <div
                        key={event.id}
                        className="card group cursor-pointer hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-4xl">{event.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                {event.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-through">
                                {new Date(event.eventDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEvent}
        isDark={isDark}
      />

      {selectedEvent && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          event={selectedEvent}
          isDark={isDark}
        />
      )}
    </div>
  )
}
