'use client'

import { Heart, Send, X } from 'lucide-react'
import { useState } from 'react'

interface SharedNote {
  id: string
  userName: string
  text: string
  createdAt: Date
}

interface DuoModeProps {
  eventId: string
  notes?: SharedNote[]
  onAddNote?: (text: string, userName: string) => void
}

export function DuoModeComponent({ notes = [], onAddNote }: DuoModeProps) {
  const [noteText, setNoteText] = useState('')
  const [userName, setUserName] = useState('')
  const [showNameInput, setShowNameInput] = useState(!userName)

  const handleAddNote = () => {
    if (noteText.trim() && userName.trim()) {
      onAddNote?.(noteText.trim(), userName.trim())
      setNoteText('')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-4">
        <Heart size={20} className="text-rose-500" />
        <h3 className="font-semibold text-[var(--text-primary)]">Share This Moment</h3>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--background-secondary)] px-2 py-1 rounded">
          Couple Mode
        </span>
      </div>

      {/* Shared notes display */}
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-[var(--text-secondary)]">
            <p className="text-sm">No notes yet. Add your first thought!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-[var(--background-secondary)] rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-semibold text-[var(--accent)]">{note.userName}</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)]">{note.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input section */}
      <div className="space-y-2">
        {showNameInput && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm"
            />
            <button
              onClick={() => setShowNameInput(false)}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Done
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            placeholder="What's on your mind?"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            className="flex-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim() || !userName.trim()}
            className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
