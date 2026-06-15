'use client'

import { Lightbulb, CheckCircle2 } from 'lucide-react'
import { useState, useMemo } from 'react'

interface ContextualSuggestionsProps {
  category: string
  daysRemaining: number
}

const SUGGESTIONS_BY_CATEGORY: Record<string, Record<number, string[]>> = {
  Travel: {
    30: ['Check passport expiration date', 'Book flights and accommodation', 'Look up visa requirements'],
    14: ['Start packing essentials', 'Check weather forecast', 'Notify your bank of travel dates'],
    7: ['Arrange airport transport', 'Download offline maps', 'Set up travel notifications'],
    3: ['Pack final items', 'Confirm flight times', 'Take out travel insurance'],
    1: ['Do final packing', 'Charge all devices', 'Leave travel details with someone'],
  },
  Birthday: {
    30: ['Pick a gift', 'Plan a celebration', 'Make reservations if needed'],
    14: ['Order cake or food', 'Send invitations', 'Plan the menu'],
    7: ['Confirm RSVPs', 'Pick up supplies', 'Prepare decorations'],
    3: ['Final food prep', 'Set up decorations', 'Wrap gifts'],
    1: ['Get ready to celebrate!', 'Set up the venue', 'Cook or warm up food'],
  },
  Wedding: {
    90: ['Book venue and caterer', 'Set wedding date', 'Create budget'],
    60: ['Order invitations', 'Book photographer', 'Start dress shopping'],
    30: ['Finalize guest list', 'Order flowers', 'Book honeymoon'],
    14: ['Final dress fittings', 'Confirm all vendors', 'Create seating chart'],
    7: ['Final guest confirmations', 'Rehearsal dinner', 'Break in your shoes'],
    1: ['Get manicure/pedicure', 'Prepare vows', 'Confirm morning timeline'],
  },
  Graduation: {
    30: ['Order cap and gown', 'Plan celebration party', 'Arrange travel if needed'],
    14: ['Confirm graduation time', 'Order announcements', 'Plan outfit'],
    7: ['Prepare thank you notes', 'Arrange photos', 'Confirm with family'],
    3: ['Set up graduation space', 'Prepare remarks', 'Gather supplies'],
    1: ['Get ready to celebrate!', 'Prepare camera', 'Enjoy your achievement'],
  },
  Holidays: {
    30: ['Start gift shopping', 'Plan holiday menu', 'Book reservations'],
    14: ['Finish gift shopping', 'Decorate', 'Prep food ingredients'],
    7: ['Ship gifts', 'Wrap presents', 'Final menu prep'],
    3: ['Last-minute shopping', 'Clean house', 'Final preparations'],
    1: ['Enjoy the holidays!', 'Set the mood', 'Relax and celebrate'],
  },
  Milestones: {
    30: ['Plan how to celebrate', 'Share the news', 'Make reservations'],
    14: ['Prepare for the day', 'Invite close ones', 'Plan activities'],
    7: ['Final preparations', 'Confirm attendees', 'Set up space'],
    3: ['Get ready to celebrate', 'Prepare decorations', 'Cook or order food'],
    1: ['This is your day!', 'Embrace the moment', 'Make memories'],
  },
}

export function ContextualSuggestionsComponent({
  category,
  daysRemaining,
}: ContextualSuggestionsProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const suggestions = useMemo(() => {
    const categoryMap = SUGGESTIONS_BY_CATEGORY[category] || SUGGESTIONS_BY_CATEGORY.Milestones

    // Find the closest day threshold
    const thresholds = Object.keys(categoryMap).map(Number).sort((a, b) => b - a)
    const threshold = thresholds.find((t) => daysRemaining <= t) || thresholds[thresholds.length - 1]

    return categoryMap[threshold] || []
  }, [category, daysRemaining])

  const toggleCompleted = (suggestion: string) => {
    const newCompleted = new Set(completed)
    if (newCompleted.has(suggestion)) {
      newCompleted.delete(suggestion)
    } else {
      newCompleted.add(suggestion)
    }
    setCompleted(newCompleted)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={20} className="text-[var(--accent)]" />
        <h3 className="font-semibold text-[var(--text-primary)]">What to do now</h3>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--background-secondary)] px-2 py-1 rounded">
          {daysRemaining} days remaining
        </span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => toggleCompleted(suggestion)}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-all ${
              completed.has(suggestion)
                ? 'bg-[var(--accent)]/10 opacity-60'
                : 'bg-[var(--background-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            <div
              className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                completed.has(suggestion)
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              {completed.has(suggestion) && <CheckCircle2 size={16} className="text-white" />}
            </div>
            <span
              className={`text-sm font-medium ${
                completed.has(suggestion)
                  ? 'line-through text-[var(--text-secondary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {suggestion}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
