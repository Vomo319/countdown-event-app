'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface TimeOfDayCountdownProps {
  eventTitle: string
  eventDate: Date
  eventTime?: string // HH:MM format
}

export function TimeOfDayCountdown({
  eventTitle,
  eventDate,
  eventTime = '12:00',
}: TimeOfDayCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isToday: false,
    isPast: false,
  })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const [eventHour, eventMinute] = eventTime.split(':').map(Number)
      
      // Create event datetime
      const eventDateTime = new Date(eventDate)
      eventDateTime.setHours(eventHour, eventMinute, 0, 0)

      // If event time has passed today, calculate to tomorrow
      if (eventDateTime <= now) {
        eventDateTime.setDate(eventDateTime.getDate() + 1)
      }

      const diff = eventDateTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isToday: false,
          isPast: true,
        })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const isToday =
        eventDateTime.toDateString() === now.toDateString()

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isToday,
        isPast: false,
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [eventDate, eventTime])

  const formatTime = (num: number) => String(num).padStart(2, '0')

  if (timeRemaining.isPast) {
    return (
      <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-alt)] rounded-lg p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={20} />
          <h3 className="font-semibold">{eventTitle}</h3>
        </div>
        <p className="text-sm opacity-90">The moment has passed, but the memory remains! 💫</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={20} className="text-[var(--accent)]" />
        <h3 className="font-semibold text-[var(--text-primary)]">{eventTitle}</h3>
      </div>

      {timeRemaining.isToday ? (
        <div className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900 dark:to-pink-900 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-200 uppercase tracking-wide">
            TODAY!
          </p>
          <p className="text-sm text-rose-600 dark:text-rose-300 mt-1">
            Get ready — it's happening today at {eventTime}
          </p>
        </div>
      ) : null}

      {/* Live countdown display */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Days', value: timeRemaining.days },
          { label: 'Hours', value: timeRemaining.hours },
          { label: 'Minutes', value: timeRemaining.minutes },
          { label: 'Seconds', value: timeRemaining.seconds },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-[var(--background-secondary)] rounded-lg p-2 text-center"
          >
            <div className="font-mono text-2xl font-bold text-[var(--accent)]">
              {formatTime(value)}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Scheduled time display */}
      <div className="flex items-center justify-between p-2 bg-[var(--background-secondary)] rounded-lg">
        <span className="text-sm text-[var(--text-secondary)]">Scheduled for</span>
        <span className="font-mono font-semibold text-[var(--text-primary)]">{eventTime}</span>
      </div>

      {/* Animation pulse for live countdown */}
      <div className="mt-3 flex justify-center">
        <div className="animate-pulse text-xs text-[var(--text-tertiary)]">
          ⏱️ Live countdown updating every second
        </div>
      </div>
    </div>
  )
}
