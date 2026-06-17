'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSession } from '@/app/hooks/useSession'
import { useEvents } from '@/app/hooks/useEvents'
import { useSharing } from '@/app/hooks/useSharing'

// Disable static generation since this is a dynamic page
export const dynamic = 'force-dynamic'

function HomePageContent() {
  const { sessionId, loaded: sessionLoaded, recoveryKey, restore } = useSession()
  const { events, loaded: eventsLoaded, addEvent, updateEvent, deleteEvent } = useEvents(sessionId)
  const { sharing, roomCode, shareLink, shareEvent, resetShare } = useSharing(sessionId)

  const [view, setView] = useState<'home' | 'settings'>('home')
  const [showForm, setShowForm] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    emoji: '🎉',
    eventDate: '',
    notes: '',
    category: 'personal',
    color: '',
  })

  // Wait for session to load
  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)]">Getting your best friend ready...</p>
        </div>
      </div>
    )
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)

  const handleAddEvent = async () => {
    if (!formData.title.trim() || !formData.eventDate) return

    if (selectedEvent) {
      // Edit mode
      await updateEvent(selectedEventId, {
        title: formData.title,
        emoji: formData.emoji,
        eventDate: formData.eventDate,
        notes: formData.notes,
        category: formData.category as any,
        color: formData.color,
      })
    } else {
      // Add mode
      await addEvent({
        title: formData.title,
        emoji: formData.emoji,
        eventDate: formData.eventDate,
        notes: formData.notes,
        category: formData.category as any,
        color: formData.color,
      })
    }

    // Reset form
    setShowForm(false)
    setFormData({
      title: '',
      emoji: '🎉',
      eventDate: '',
      notes: '',
      category: 'personal',
      color: '',
    })
    setSelectedEventId('')
  }

  const openEditForm = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    setSelectedEventId(eventId)
    setFormData({
      title: event.title,
      emoji: event.emoji,
      eventDate: event.eventDate,
      notes: event.notes || '',
      category: event.category || 'personal',
      color: event.color || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setSelectedEventId('')
    setFormData({
      title: '',
      emoji: '🎉',
      eventDate: '',
      notes: '',
      category: 'personal',
      color: '',
    })
  }

  const getDaysRemaining = (dateStr: string): number => {
    const event = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = event.getTime() - today.getTime()
    return Math.round(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--surface-secondary)] border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Waiting For</h1>
          <button
            onClick={() => setView(view === 'home' ? 'settings' : 'home')}
            className="px-4 py-2 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-[14px] font-medium"
          >
            {view === 'home' ? 'Settings' : 'Home'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'home' ? (
          <>
            {/* Events List */}
            {eventsLoaded ? (
              events.length > 0 ? (
                <div className="space-y-3">
                  {events.map(event => {
                    const days = getDaysRemaining(event.eventDate)
                    return (
                      <div
                        key={event.id}
                        className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)] flex items-center justify-between hover:border-[var(--accent)] transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[24px]">{event.emoji}</span>
                            <h3 className="font-semibold text-[var(--text-primary)]">{event.title}</h3>
                          </div>
                          <p className="text-[13px] text-[var(--text-secondary)]">
                            {days < 0 ? `${Math.abs(days)} days ago` : `${days} days to go`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedEventId(event.id)
                              setShowShare(true)
                              shareEvent(event)
                            }}
                            className="px-3 py-2 bg-[var(--accent)] text-white rounded text-[12px] font-medium hover:opacity-90 transition-opacity"
                          >
                            Share
                          </button>
                          <button
                            onClick={() => openEditForm(event.id)}
                            className="px-3 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded text-[12px] font-medium hover:text-[var(--text-primary)] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="px-3 py-2 bg-red-500/10 text-red-500 rounded text-[12px] font-medium hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <p className="text-[18px] font-semibold text-[var(--text-primary)]">
                    Ready to count down together?
                  </p>
                  <p className="text-[14px] text-[var(--text-secondary)]">
                    I&apos;m your best friend for all the moments you&apos;re excited about
                  </p>
                  <p className="text-[13px] text-[var(--text-tertiary)]">
                    Let&apos;s add something amazing to countdown to
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add Your First Countdown
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
              </div>
            )}

            {/* Floating Add Button */}
            {events.length > 0 && (
              <button
                onClick={() => {
                  setSelectedEventId('')
                  closeForm()
                  setShowForm(true)
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--accent)] text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-[24px] font-semibold"
              >
                +
              </button>
            )}
          </>
        ) : (
          // Settings View
          <div className="max-w-md space-y-6">
            <div>
              <h2 className="text-[18px] font-bold text-[var(--text-primary)] mb-4">Your Special Key</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mb-3">
                This is your best friend&apos;s memory. Keep it safe to bring all your countdowns back anytime.
              </p>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 font-mono text-center text-[16px] font-bold text-[var(--accent)] break-all">
                {recoveryKey}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(recoveryKey)
                }}
                className="mt-3 w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                Copy Recovery Key
              </button>
            </div>

            <div>
              <h2 className="text-[18px] font-bold text-[var(--text-primary)] mb-4">Restore Countdowns</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mb-3">
                Have a recovery key from before? Enter it here.
              </p>
              <input
                type="text"
                placeholder="e.g., AB3C-DE4F-GH5J"
                className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] mb-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value
                    if (value) {
                      restore(value)
                    }
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement
                  if (input.value) {
                    restore(input.value)
                  }
                }}
                className="w-full px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded-lg text-[14px] font-medium hover:text-[var(--text-primary)] transition-colors"
              >
                Restore
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-[var(--surface)] rounded-t-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
              {selectedEvent ? 'Edit Countdown' : 'Add Countdown'}
            </h2>

            <div>
              <label className="text-[13px] font-medium text-[var(--text-secondary)] block mb-2">
                What are you waiting for?
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Birthday, Vacation, Wedding..."
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-[var(--text-secondary)] block mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-[var(--text-secondary)] block mb-2">
                Emoji
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value || '🎉' })}
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-center text-[24px]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-[var(--text-secondary)] block mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes..."
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none h-24"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                {selectedEvent ? 'Update' : 'Add'}
              </button>
              <button
                onClick={closeForm}
                className="flex-1 px-4 py-3 bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded-lg font-semibold hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Share Countdown</h2>

            {roomCode && shareLink ? (
              <>
                <div>
                  <p className="text-[13px] text-[var(--text-secondary)] mb-2">Share Code:</p>
                  <div className="bg-[var(--background)] p-4 rounded-lg font-mono text-[18px] font-bold text-[var(--accent)] text-center break-all">
                    {roomCode}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] text-[var(--text-secondary)] mb-2">Or Share Link:</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink)
                    }}
                    className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[12px] text-[var(--text-secondary)] truncate hover:text-[var(--text-primary)] transition-colors"
                  >
                    {shareLink}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[var(--text-secondary)]">Creating share link...</p>
            )}

            <button
              onClick={() => {
                setShowShare(false)
                resetShare()
              }}
              className="w-full px-4 py-3 bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded-lg font-semibold hover:text-[var(--text-primary)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    )
  }

  return <HomePageContent />
}

