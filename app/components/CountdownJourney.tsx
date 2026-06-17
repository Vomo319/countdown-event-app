'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface CountdownJourneyProps {
  eventId: string
  eventDate: string | Date
  isDark: boolean
}

export function CountdownJourneyComponent({
  eventId,
  eventDate,
  isDark,
}: CountdownJourneyProps) {
  const now = new Date()
  const eventDateObj = typeof eventDate === 'string' 
    ? new Date(eventDate + 'T00:00:00Z')
    : eventDate
  
  const daysRemaining = Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.max(1, Math.abs(daysRemaining))
  
  const milestones = [
    { percent: 0, label: 'Journey Begins', days: totalDays },
    { percent: 25, label: 'Getting Closer', days: Math.floor(totalDays * 0.75) },
    { percent: 50, label: 'Halfway There!', days: Math.floor(totalDays * 0.5) },
    { percent: 75, label: 'Almost Here', days: Math.floor(totalDays * 0.25) },
    { percent: 100, label: 'The Day!', days: 0 },
  ]
  
  const currentPercent = daysRemaining < 0 
    ? 100 
    : Math.max(0, Math.min(100, totalDays > 0 ? (100 - ((daysRemaining / totalDays) * 100)) : 0))

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={22} className="text-indigo-600" />
          Your Countdown Journey
        </h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(currentPercent)}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 transition-all ${
                currentPercent >= milestone.percent 
                  ? 'bg-indigo-600 shadow-lg shadow-indigo-600/50' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{milestone.label}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{milestone.days} days away</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
