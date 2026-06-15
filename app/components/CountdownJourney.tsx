'use client'

import { useState } from 'react'

interface CountdownJourneyProps {
  eventId: string
  eventDate: Date
  isDark: boolean
}

export function CountdownJourneyComponent({
  eventId,
  eventDate,
  isDark,
}: CountdownJourneyProps) {
  const now = new Date()
  const daysRemaining = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.abs(daysRemaining)
  
  const milestones = [
    { percent: 0, label: 'Journey Begins', days: totalDays },
    { percent: 25, label: 'Getting Closer', days: Math.floor(totalDays * 0.75) },
    { percent: 50, label: 'Halfway There!', days: Math.floor(totalDays * 0.5) },
    { percent: 75, label: 'Almost Here', days: Math.floor(totalDays * 0.25) },
    { percent: 100, label: 'The Day!', days: 0 },
  ]
  
  const currentPercent = Math.max(0, Math.min(100, 100 - ((daysRemaining / totalDays) * 100)))

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)]">
        <h3 className="text-[17px] font-semibold text-[var(--text)] mb-4">Your Countdown Journey</h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-[var(--text-secondary)]">Progress</span>
            <span className="text-[13px] font-semibold text-[var(--text)]">{Math.round(currentPercent)}%</span>
          </div>
          <div className="h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                currentPercent >= milestone.percent 
                  ? 'bg-[var(--accent)]' 
                  : 'bg-[var(--border)]'
              }`} />
              <div className="flex-1">
                <div className="text-[14px] font-medium text-[var(--text)]">{milestone.label}</div>
                <div className="text-[12px] text-[var(--text-tertiary)]">{milestone.days} days away</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
