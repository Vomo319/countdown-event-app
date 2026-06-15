'use client'

import { useState, useEffect } from 'react'

interface EmotionalFeelingsProps {
  eventId: string
  isDark: boolean
}

const FEELINGS = [
  { emoji: '🤗', label: 'Excited', value: 'excited' },
  { emoji: '😰', label: 'Nervous', value: 'nervous' },
  { emoji: '🙏', label: 'Grateful', value: 'grateful' },
  { emoji: '😌', label: 'Hopeful', value: 'hopeful' },
  { emoji: '😟', label: 'Anxious', value: 'anxious' },
  { emoji: '😊', label: 'Joyful', value: 'joyful' },
]

export function EmotionalFeelingsComponent({
  eventId,
  isDark,
}: EmotionalFeelingsProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<string>('')

  useEffect(() => {
    // Load feeling from localStorage
    const stored = localStorage.getItem(`event-feeling-${eventId}`)
    if (stored) {
      setSelectedFeeling(stored)
    }
  }, [eventId])

  const handleSelectFeeling = (value: string) => {
    setSelectedFeeling(value)
    localStorage.setItem(`event-feeling-${eventId}`, value)
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)]">
        <h3 className="text-[17px] font-semibold text-[var(--text)] mb-2">How are you feeling?</h3>
        <p className="text-[13px] text-[var(--text-tertiary)] mb-4">Your emotions shape how we celebrate this moment</p>
        
        <div className="grid grid-cols-3 gap-2">
          {FEELINGS.map((feeling) => (
            <button
              key={feeling.value}
              onClick={() => handleSelectFeeling(feeling.value)}
              className={`p-3 rounded-[14px] border-2 transition-all ${
                selectedFeeling === feeling.value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50'
              }`}
            >
              <div className="text-[28px] mb-1">{feeling.emoji}</div>
              <div className="text-[11px] font-medium text-[var(--text)] text-center">{feeling.label}</div>
            </button>
          ))}
        </div>

        {selectedFeeling && (
          <div className="mt-4 p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-[12px]">
            <p className="text-[13px] text-[var(--text)] text-center">
              Feeling {FEELINGS.find(f => f.value === selectedFeeling)?.label.toLowerCase()} about this! Saved ✓
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
