'use client'

import { useMemo } from 'react'
import { Clock, Target, Zap } from 'lucide-react'

interface CountdownJourneyProps {
  eventTitle: string
  eventDate: Date
  createdDate?: Date
}

export function CountdownJourneyComponent({
  eventTitle,
  eventDate,
  createdDate = new Date(),
}: CountdownJourneyProps) {
  const journey = useMemo(() => {
    const now = new Date()
    const totalDays = Math.ceil((eventDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = totalDays - daysRemaining
    const percentComplete = Math.round((daysPassed / totalDays) * 100)

    return {
      totalDays,
      daysRemaining,
      daysPassed,
      percentComplete,
      milestones: [
        { percent: 0, label: 'Just created', icon: Target },
        { percent: 25, label: '75% to go', icon: Zap },
        { percent: 50, label: 'Halfway there', icon: Clock },
        { percent: 75, label: 'Almost here!', icon: Zap },
        { percent: 100, label: 'The moment!', icon: Target },
      ],
    }
  }, [eventDate, createdDate])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <h3 className="font-semibold text-[var(--text-primary)] mb-2">Your Countdown Journey</h3>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
          <span>{journey.daysPassed} days in</span>
          <span className="font-semibold text-[var(--accent)]">{journey.percentComplete}%</span>
          <span>{journey.daysRemaining} days left</span>
        </div>
        <div className="relative h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-alt)] rounded-full transition-all duration-500"
            style={{ width: `${journey.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {journey.milestones.map((milestone, idx) => {
          const Icon = milestone.icon
          const isReached = journey.percentComplete >= milestone.percent
          const isCurrent = Math.abs(journey.percentComplete - milestone.percent) < 12

          return (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isReached
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {isCurrent && (
                  <div className="absolute inset-0 animate-pulse rounded-full border-2 border-[var(--accent)]" />
                )}
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)]">{milestone.label}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {milestone.percent}% progress
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-[var(--background-secondary)] rounded-lg">
        <p className="text-sm text-[var(--text-secondary)]">
          You've been anticipating {eventTitle} for{' '}
          <span className="font-semibold text-[var(--text-primary)]">{journey.daysPassed} days</span>. 
          That's a journey worth celebrating.
        </p>
      </div>
    </div>
  )
}
