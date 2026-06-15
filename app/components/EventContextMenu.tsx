'use client'

import { useState } from 'react'

interface EventContextMenuProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onAddFeeling: (feeling: string) => void
  onAddNote: (note: string, author: string) => void
  onSetReminder: (type: string, time: string) => void
}

const FEELINGS = [
  { emoji: '🤗', label: 'Excited', value: 'excited' },
  { emoji: '😰', label: 'Nervous', value: 'nervous' },
  { emoji: '🙏', label: 'Grateful', value: 'grateful' },
  { emoji: '😌', label: 'Hopeful', value: 'hopeful' },
  { emoji: '😟', label: 'Anxious', value: 'anxious' },
  { emoji: '😊', label: 'Joyful', value: 'joyful' },
]

const REMINDER_OPTIONS = [
  { label: '1 Day Before', value: '1day' },
  { label: '3 Days Before', value: '3days' },
  { label: '1 Week Before', value: '1week' },
  { label: 'Day Of', value: 'dayof' },
]

export function EventContextMenu({
  eventId,
  isOpen,
  onClose,
  onAddFeeling,
  onAddNote,
  onSetReminder,
}: EventContextMenuProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'feeling' | 'note' | 'reminder'>('quick')
  const [noteName, setNoteName] = useState('')
  const [noteText, setNoteText] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full bg-[var(--surface)] rounded-t-[24px] border-t border-[var(--border)] max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-2">
          <div className="w-12 h-1 bg-[var(--border)] rounded-full" />
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 px-4 pb-4 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('feeling')}
            className={`flex-1 py-2 px-3 rounded-[12px] text-[13px] font-medium transition-colors ${
              activeTab === 'feeling'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-secondary)] text-[var(--text)]'
            }`}
          >
            💭 Feeling
          </button>
          <button
            onClick={() => setActiveTab('reminder')}
            className={`flex-1 py-2 px-3 rounded-[12px] text-[13px] font-medium transition-colors ${
              activeTab === 'reminder'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-secondary)] text-[var(--text)]'
            }`}
          >
            🔔 Reminder
          </button>
          <button
            onClick={() => setActiveTab('note')}
            className={`flex-1 py-2 px-3 rounded-[12px] text-[13px] font-medium transition-colors ${
              activeTab === 'note'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-secondary)] text-[var(--text)]'
            }`}
          >
            📝 Note
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pb-8">
          {activeTab === 'feeling' && (
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-[var(--text)]">How are you feeling?</h3>
              <div className="grid grid-cols-3 gap-2">
                {FEELINGS.map((feeling) => (
                  <button
                    key={feeling.value}
                    onClick={() => {
                      onAddFeeling(feeling.value)
                      localStorage.setItem(`event-feeling-${eventId}`, feeling.value)
                      onClose()
                    }}
                    className="p-3 rounded-[14px] bg-[var(--surface-secondary)] hover:bg-[var(--accent)]/20 transition-colors text-center"
                  >
                    <div className="text-[28px] mb-1">{feeling.emoji}</div>
                    <div className="text-[11px] font-medium text-[var(--text)]">{feeling.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reminder' && (
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-[var(--text)]">Set a reminder</h3>
              <div className="space-y-2">
                {REMINDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSetReminder(option.value, '')
                      localStorage.setItem(`event-reminder-${eventId}`, option.value)
                      onClose()
                    }}
                    className="w-full p-3 rounded-[12px] bg-[var(--surface-secondary)] hover:bg-[var(--accent)]/20 transition-colors text-left text-[14px] font-medium text-[var(--text)]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'note' && (
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-[var(--text)]">Add a note</h3>
              <input
                type="text"
                placeholder="Your name"
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[14px]"
              />
              <textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[14px] resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--text-tertiary)]">{noteText.length}/200</span>
                <button
                  onClick={() => {
                    if (noteText.trim()) {
                      onAddNote(noteText, noteName || 'Friend')
                      const notes = JSON.parse(localStorage.getItem(`event-duo-notes-${eventId}`) || '[]')
                      notes.push({ text: noteText, author: noteName || 'Friend', timestamp: new Date().toISOString() })
                      localStorage.setItem(`event-duo-notes-${eventId}`, JSON.stringify(notes))
                      setNoteText('')
                      setNoteName('')
                      onClose()
                    }
                  }}
                  disabled={!noteText.trim()}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-[8px] text-[13px] font-medium disabled:opacity-50"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
