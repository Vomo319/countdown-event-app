'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/app/hooks/useSession'
import { useEvents } from '@/app/hooks/useEvents'
import { useSharing } from '@/app/hooks/useSharing'

export const dynamic = 'force-dynamic'

function getDaysRemaining(dateString: string): number {
  const event = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = event.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateString: string): string {
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Event Card Component - Native mobile app style
function EventCard({ event, onEdit, onDelete }: any) {
  const days = getDaysRemaining(event.eventDate)
  const isToday = days === 0
  const isSoon = days > 0 && days <= 7
  
  return (
    <div className="group card overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-4xl">{event.emoji || '🎉'}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-100 line-clamp-2">{event.title}</h3>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-3xl font-black ${
              isToday ? 'text-pink-400' : isSoon ? 'text-cyan-400' : 'text-slate-300'
            }`}>
              {days < 0 ? '✓' : days}
            </span>
            <span className="text-sm text-slate-400">
              {days < 0 ? 'Happened' : days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `days left`}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <span className="inline-block">📅</span>
            <span>{formatDate(event.eventDate)}</span>
          </div>
          
          {event.notes && (
            <p className="text-sm text-slate-300 mb-3 line-clamp-2">{event.notes}</p>
          )}
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(event)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-600/30 text-slate-300 hover:text-red-400 text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Content Component
function HomePageContent() {
  const { sessionId, loaded: sessionLoaded, recoveryKey, restore } = useSession()
  const { events, loaded: eventsLoaded, addEvent, updateEvent, deleteEvent } = useEvents(sessionId)
  const { sharing, roomCode, shareLink, shareEvent, resetShare } = useSharing(sessionId)

  const [view, setView] = useState<'home' | 'add' | 'settings'>('home')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [showShare, setShowShare] = useState(false)
  const [recoveryInput, setRecoveryInput] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    emoji: '🎉',
    eventDate: '',
    notes: '',
  })

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-300">Getting your best friend ready...</p>
        </div>
      </div>
    )
  }

  const handleAddEvent = async () => {
    if (!formData.title || !formData.eventDate) return
    
    if (editingEvent) {
      await updateEvent(editingEvent.id, formData)
      setEditingEvent(null)
    } else {
      await addEvent({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      })
    }
    
    setFormData({ title: '', emoji: '🎉', eventDate: '', notes: '' })
    setShowForm(false)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      emoji: event.emoji,
      eventDate: event.eventDate,
      notes: event.notes,
    })
    setShowForm(true)
    setView('add')
  }

  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id)
  }

  const sortedEvents = [...events].sort((a, b) => getDaysRemaining(a.eventDate) - getDaysRemaining(b.eventDate))
  const upcomingEvents = sortedEvents.filter(e => getDaysRemaining(e.eventDate) > 0)
  const pastEvents = sortedEvents.filter(e => getDaysRemaining(e.eventDate) <= 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
              Waiting For
            </h1>
            <p className="text-xs text-slate-400">Your countdown companion</p>
          </div>
          
          <div className="flex gap-2">
            {view !== 'settings' && (
              <button
                onClick={() => setView('settings')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                ⚙️
              </button>
            )}
            {view === 'settings' && (
              <button
                onClick={() => setView('home')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                ←
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Home View */}
        {view === 'home' && (
          <div className="space-y-6">
            {/* Add Button */}
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true)
                  setView('add')
                  setEditingEvent(null)
                  setFormData({ title: '', emoji: '🎉', eventDate: '', notes: '' })
                }}
                className="w-full btn-primary py-4 text-lg font-semibold"
              >
                + Add Countdown
              </button>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
                  ⏳ Upcoming ({upcomingEvents.length})
                </h2>
                <div className="space-y-2">
                  {upcomingEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>
              </div>
            ) : !showForm && (
              <div className="card py-12 text-center">
                <p className="text-4xl mb-3">🎊</p>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Ready to count down together?
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  I'm your best friend for all the moments you're excited about
                </p>
                <button
                  onClick={() => {
                    setShowForm(true)
                    setView('add')
                  }}
                  className="btn-primary"
                >
                  Add your first countdown
                </button>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
                  ✓ Happened ({pastEvents.length})
                </h2>
                <div className="space-y-2">
                  {pastEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit View */}
        {view === 'add' && showForm && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100">
              {editingEvent ? 'Edit Countdown' : 'New Countdown'}
            </h2>

            {/* Emoji Picker */}
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">Pick an emoji</label>
              <div className="grid grid-cols-8 gap-2">
                {['🎉', '🎂', '✈️', '🏖️', '🎓', '💍', '🏠', '🎁', '🎵', '⚽', '🏔️', '🌍', '🎬', '📚', '💼', '🌸'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      formData.emoji === emoji
                        ? 'bg-cyan-500/30 ring-2 ring-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">What are you waiting for?</label>
              <input
                type="text"
                placeholder="e.g. Summer vacation, Wedding day, New job..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Date Input */}
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">When is it?</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Notes Input */}
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">Any notes?</label>
              <textarea
                placeholder="Add details, thoughts, or reminders..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingEvent(null)
                  setFormData({ title: '', emoji: '🎉', eventDate: '', notes: '' })
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!formData.title || !formData.eventDate}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingEvent ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-100">Settings</h2>

            {/* Recovery Key */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-slate-100">Your Special Key</h3>
              <p className="text-sm text-slate-400">
                This is your best friend's memory. Keep it safe to bring all your countdowns back anytime.
              </p>
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 font-mono text-sm text-cyan-400 break-all">
                {recoveryKey}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(recoveryKey)
                  alert('Recovery key copied!')
                }}
                className="w-full btn-secondary text-sm"
              >
                Copy Key
              </button>
            </div>

            {/* Restore */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-slate-100">Restore Countdowns</h3>
              <p className="text-sm text-slate-400">
                Paste your recovery key to restore your countdowns on another device.
              </p>
              <input
                type="text"
                placeholder="Paste your recovery key..."
                value={recoveryInput}
                onChange={e => setRecoveryInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
              />
              <button
                onClick={() => {
                  if (recoveryInput.trim()) {
                    restore(recoveryInput)
                  }
                }}
                className="w-full btn-primary disabled:opacity-50"
                disabled={!recoveryInput.trim()}
              >
                Restore
              </button>
            </div>

            {/* Share */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-slate-100">Share Your Countdowns</h3>
              <p className="text-sm text-slate-400">
                Let friends know what you're waiting for and they can add it to theirs.
              </p>
              <button
                onClick={() => setShowShare(!showShare)}
                className="w-full btn-secondary"
              >
                {showShare ? 'Hide Share' : 'Share Countdowns'}
              </button>
              
              {showShare && (
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  {roomCode && (
                    <>
                      <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Share code:</p>
                        <p className="font-mono text-sm text-cyan-400">{roomCode}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Check out my countdowns: ${shareLink}`)
                          alert('Share link copied!')
                        }}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 rounded-lg text-sm transition-colors"
                      >
                        Copy Share Link
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="card text-center text-sm text-slate-400 space-y-2">
              <p>Made with ❤️ for those who love to anticipate</p>
              <p className="text-xs text-slate-500">Version 1.0 • Waiting For PWA</p>
            </div>
          </div>
        )}
      </div>
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return <HomePageContent />
}
