'use client'

import { useState } from 'react'
import { Heart, Smile, AlertCircle, Sparkles, Zap } from 'lucide-react'

const FEELINGS = [
  { id: 'excited', label: 'Excited', icon: Sparkles, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900' },
  { id: 'nervous', label: 'Nervous', icon: AlertCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900' },
  { id: 'hopeful', label: 'Hopeful', icon: Heart, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900' },
  { id: 'grateful', label: 'Grateful', icon: Smile, color: 'bg-green-100 text-green-700 dark:bg-green-900' },
  { id: 'anxious', label: 'Anxious', icon: Zap, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900' },
  { id: 'joyful', label: 'Joyful', icon: Heart, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900' },
]

interface FeelingsProps {
  eventId: string
  selectedFeelings?: string[]
  onFeelingsChange?: (feelings: string[]) => void
}

export function EmotionalFeelingsComponent({
  selectedFeelings = [],
  onFeelingsChange,
}: FeelingsProps) {
  const [feelings, setFeelings] = useState<string[]>(selectedFeelings)

  const toggleFeeling = (feelingId: string) => {
    const updated = feelings.includes(feelingId)
      ? feelings.filter((f) => f !== feelingId)
      : [...feelings, feelingId]
    setFeelings(updated)
    onFeelingsChange?.(updated)
  }

  const getAccentColorFromFeeling = () => {
    if (feelings.includes('excited') || feelings.includes('joyful')) return 'from-amber-400 to-rose-400'
    if (feelings.includes('nervous') || feelings.includes('anxious')) return 'from-blue-400 to-orange-400'
    if (feelings.includes('hopeful')) return 'from-rose-400 to-purple-400'
    if (feelings.includes('grateful')) return 'from-green-400 to-emerald-400'
    return 'from-violet-400 to-cyan-400'
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <div className="mb-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">How are you feeling about this?</h3>
        <p className="text-sm text-[var(--text-secondary)]">Your emotions shape the app's tone and colors</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {FEELINGS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => toggleFeeling(id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
              feelings.includes(id)
                ? `${color} ring-2 ring-offset-2 ring-[var(--accent)]`
                : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium text-center">{label}</span>
          </button>
        ))}
      </div>

      {feelings.length > 0 && (
        <div className={`rounded-lg p-3 bg-gradient-to-r ${getAccentColorFromFeeling()} text-white text-sm font-medium text-center`}>
          We'll match your emotions with calming or celebratory vibes
        </div>
      )}
    </div>
  )
}
