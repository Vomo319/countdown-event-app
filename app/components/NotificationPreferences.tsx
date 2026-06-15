'use client'

import { useState, useEffect } from 'react'

interface NotificationPreferencesProps {
  eventId: string
  eventTitle: string
  isDark: boolean
}

const REMINDER_OPTIONS = [
  { id: 'daily', label: 'Daily reminder', icon: '📅' },
  { id: 'week', label: '7 days before', icon: '📆' },
  { id: 'three_days', label: '3 days before', icon: '📋' },
  { id: 'one_day', label: '1 day before', icon: '⏰' },
  { id: 'day_of', label: 'Day of event', icon: '🔔' },
]

export function NotificationPreferencesComponent({
  eventId,
  eventTitle,
  isDark,
}: NotificationPreferencesProps) {
  const [enabledReminders, setEnabledReminders] = useState<Set<string>>(new Set())
  const [reminderTime, setReminderTime] = useState('09:00')

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(`event-reminders-${eventId}`)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setEnabledReminders(new Set(data.reminders))
        setReminderTime(data.time || '09:00')
      } catch (e) {
        console.log('[v0] Error loading reminders')
      }
    }
  }, [eventId])

  const toggleReminder = (reminderId: string) => {
    const updated = new Set(enabledReminders)
    if (updated.has(reminderId)) {
      updated.delete(reminderId)
    } else {
      updated.add(reminderId)
    }
    setEnabledReminders(updated)
    
    // Save to localStorage
    localStorage.setItem(`event-reminders-${eventId}`, JSON.stringify({
      reminders: Array.from(updated),
      time: reminderTime,
    }))
  }

  const handleTimeChange = (time: string) => {
    setReminderTime(time)
    localStorage.setItem(`event-reminders-${eventId}`, JSON.stringify({
      reminders: Array.from(enabledReminders),
      time,
    }))
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)]">
        <h3 className="text-[17px] font-semibold text-[var(--text)] mb-2">Notification Reminders</h3>
        <p className="text-[13px] text-[var(--text-tertiary)] mb-4">Get motivational reminders about "{eventTitle}"</p>
        
        {/* Time Selector */}
        <div className="mb-4">
          <label className="text-[13px] font-medium text-[var(--text)] block mb-2">Reminder Time</label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[15px]"
          />
        </div>

        {/* Reminders Grid */}
        <div className="space-y-2">
          {REMINDER_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleReminder(option.id)}
              className={`w-full p-3 rounded-[12px] border-2 transition-all text-left flex items-start gap-3 ${
                enabledReminders.has(option.id)
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/30'
              }`}
            >
              <input
                type="checkbox"
                checked={enabledReminders.has(option.id)}
                onChange={() => {}}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-[14px] font-medium text-[var(--text)]">{option.icon} {option.label}</div>
              </div>
            </button>
          ))}
        </div>

        {enabledReminders.size > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-[12px]">
            <p className="text-[13px] text-green-700 dark:text-green-300 text-center font-medium">
              {enabledReminders.size} reminder{enabledReminders.size !== 1 ? 's' : ''} set ✓
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
