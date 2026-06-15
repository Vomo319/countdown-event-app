'use client'

import { useState, useEffect } from 'react'

interface DuoModeProps {
  eventId: string
  isDark: boolean
}

interface Note {
  id: string
  text: string
  author: string
  timestamp: Date
}

export function DuoModeComponent({
  eventId,
  isDark,
}: DuoModeProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [authorName, setAuthorName] = useState('Friend')

  useEffect(() => {
    // Load notes from localStorage
    const stored = localStorage.getItem(`event-duo-notes-${eventId}`)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setNotes(data)
      } catch (e) {
        console.log('[v0] Error loading duo notes')
      }
    }
  }, [eventId])

  const addNote = () => {
    if (!newNote.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      author: authorName || 'Friend',
      timestamp: new Date(),
    }

    const updated = [...notes, note]
    setNotes(updated)
    localStorage.setItem(`event-duo-notes-${eventId}`, JSON.stringify(updated))
    setNewNote('')
  }

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem(`event-duo-notes-${eventId}`, JSON.stringify(updated))
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)]">
        <h3 className="text-[17px] font-semibold text-[var(--text)] mb-2">Duo Mode</h3>
        <p className="text-[13px] text-[var(--text-tertiary)] mb-4">Share this countdown and leave notes for each other</p>

        {/* Author Name */}
        <div className="mb-4">
          <label className="text-[13px] font-medium text-[var(--text)] block mb-2">Your Name</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[14px]"
          />
        </div>

        {/* Note Input */}
        <div className="mb-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[14px] resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[12px] text-[var(--text-tertiary)]">{newNote.length}/200</span>
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="px-4 py-1.5 bg-[var(--accent)] text-white rounded-[8px] text-[13px] font-medium disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Notes List */}
        {notes.length > 0 && (
          <div className="space-y-2">
            <div className="text-[13px] font-medium text-[var(--text-tertiary)]">{notes.length} note{notes.length !== 1 ? 's' : ''}</div>
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[12px]">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-medium text-[var(--accent)]">{note.author}</span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-[12px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[13px] text-[var(--text)] leading-relaxed">{note.text}</p>
                <span className="text-[11px] text-[var(--text-tertiary)] mt-1 block">
                  {note.timestamp && new Date(note.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {notes.length === 0 && (
          <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[12px] text-center">
            <p className="text-[13px] text-[var(--text-tertiary)]">No notes yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  )
}
