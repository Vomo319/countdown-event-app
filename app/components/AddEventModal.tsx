'use client'

import React, { useState } from 'react'
import { X, Plus, Calendar, Tag, Palette } from 'lucide-react'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isDark: boolean
}

const EMOJI_OPTIONS = [
  '🎂', '🎉', '✈️', '🏖️', '🎓', '💍', '🏠', '🎁',
  '🎵', '⚽', '🏔️', '🌍', '🎬', '📚', '💼', '🌸',
  '🦋', '⭐', '🌙', '☀️', '🍾', '🎯', '🏆', '💫',
]

const CATEGORIES = [
  { label: 'Milestone', value: 'milestone', icon: '🎓' },
  { label: 'Travel', value: 'travel', icon: '✈️' },
  { label: 'Holiday', value: 'holiday', icon: '🎄' },
  { label: 'Personal', value: 'personal', icon: '💜' },
]

export function AddEventModal({ isOpen, onClose, onSubmit, isDark }: AddEventModalProps) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [eventDate, setEventDate] = useState('')
  const [category, setCategory] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !eventDate) return
    
    setLoading(true)
    try {
      await onSubmit({ title, emoji, eventDate, category })
      setTitle('')
      setEmoji('🎉')
      setEventDate('')
      setCategory('personal')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-slideUp sm:animate-scaleIn">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Countdown</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Pick an emoji
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-slate-800 text-4xl font-bold hover:border-indigo-500 transition-colors text-center"
              >
                {emoji}
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-2xl p-4 shadow-lg z-10 grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setEmoji(e)
                        setShowEmojiPicker(false)
                      }}
                      className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Summer Vacation"
              className="input-field"
              required
            />
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar size={18} />
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Tag size={18} />
              Category
            </label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-2xl text-center font-semibold transition-all ${
                    category === cat.value
                      ? 'bg-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Countdown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
