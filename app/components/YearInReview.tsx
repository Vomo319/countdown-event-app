'use client'

import { useMemo } from 'react'
import { Calendar, TrendingUp, Heart, Sparkles } from 'lucide-react'

interface YearReviewEvent {
  id: string
  title: string
  emoji: string
  date: Date
  category: string
  feeling?: string
}

interface YearInReviewProps {
  year: number
  events: YearReviewEvent[]
}

export function YearInReviewComponent({ year, events }: YearInReviewProps) {
  const stats = useMemo(() => {
    const eventsByMonth = new Array(12).fill(0)
    const eventsByCategory: Record<string, number> = {}
    const feelingCounts: Record<string, number> = {}
    let topFeeling = 'hopeful'
    let topFeelingCount = 0

    events.forEach((event) => {
      const month = new Date(event.date).getMonth()
      eventsByMonth[month]++

      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1

      if (event.feeling) {
        feelingCounts[event.feeling] = (feelingCounts[event.feeling] || 0) + 1
        if (feelingCounts[event.feeling] > topFeelingCount) {
          topFeeling = event.feeling
          topFeelingCount = feelingCounts[event.feeling]
        }
      }
    })

    const topCategory = Object.entries(eventsByCategory).sort(([, a], [, b]) => b - a)[0]

    return {
      eventsByMonth,
      topCategory: topCategory ? topCategory[0] : 'Life',
      categoryCount: topCategory ? topCategory[1] : 0,
      topFeeling,
      totalEvents: events.length,
    }
  }, [events])

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const maxEvents = Math.max(...stats.eventsByMonth, 1)

  const FEELING_COLORS: Record<string, string> = {
    excited: 'text-amber-600',
    nervous: 'text-blue-600',
    hopeful: 'text-rose-600',
    grateful: 'text-green-600',
    anxious: 'text-orange-600',
    joyful: 'text-purple-600',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-alt)] rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={24} />
          <h2 className="text-2xl font-bold">Year in Review</h2>
        </div>
        <p className="text-sm opacity-90">Here's what you looked forward to in {year}</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)] text-center">
          <div className="text-3xl font-bold text-[var(--accent)]">{stats.totalEvents}</div>
          <div className="text-sm text-[var(--text-secondary)] mt-1">Countdowns</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)] text-center">
          <div className="text-3xl font-bold text-[var(--accent)]">{stats.topCategory}</div>
          <div className="text-sm text-[var(--text-secondary)] mt-1">Most Popular</div>
        </div>
        <div className={`bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)] text-center`}>
          <div className={`text-3xl font-bold ${FEELING_COLORS[stats.topFeeling] || 'text-[var(--accent)]'}`}>
            {stats.topFeeling.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-1">Main Feeling</div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Distribution Throughout {year}
        </h3>
        <div className="space-y-2">
          {months.map((month, idx) => {
            const count = stats.eventsByMonth[idx]
            const percentage = (count / maxEvents) * 100

            return (
              <div key={month} className="flex items-center gap-3">
                <div className="w-12 text-sm font-medium text-[var(--text-secondary)]">{month}</div>
                <div className="flex-1 bg-[var(--background-secondary)] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-alt)] transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-8 text-right text-sm font-semibold text-[var(--text-primary)]">
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Sparkles size={18} />
          Categories
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.eventsByMonth)
            .filter(([, count]) => count > 0)
            .reduce((acc: Record<string, number>, [, count]) => acc, {})
            ? 'Distribution shown above'
            : 'Mix of events throughout the year'}
        </div>
      </div>

      {/* Reflection message */}
      <div className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent-alt)]/10 rounded-lg p-4 border border-[var(--accent)]/20">
        <div className="flex gap-3">
          <Heart className="flex-shrink-0 text-[var(--accent)]" size={20} />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Reflection</p>
            <p className="text-sm text-[var(--text-secondary)]">
              In {year}, you looked forward to {stats.totalEvents} amazing moments. You spent{' '}
              {stats.totalEvents * 30} days in anticipation, learning to appreciate the journey as much as the destination.
              That's beautiful.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming year preview */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Here's to {year + 1}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          What are you looking forward to next year? Every countdown is a reminder that good things are coming.
        </p>
        <button className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 font-medium text-sm">
          Create First Countdown of {year + 1}
        </button>
      </div>
    </div>
  )
}
