'use client'

import { useState } from 'react'
import { Bell, Clock } from 'lucide-react'

const REMINDER_OPTIONS = [
  { id: 'daily', label: 'Daily reminder', description: 'Get a friendly nudge every morning' },
  { id: 'week', label: '7 days before', description: 'Reminder one week out' },
  { id: 'three_days', label: '3 days before', description: 'Reminder three days before' },
  { id: 'one_day', label: '1 day before', description: 'Reminder the day before' },
  { id: 'day_of', label: 'Day of event', description: 'Reminder on the big day' },
]

interface NotificationPreferencesProps {
  eventId: string
  selectedReminders?: string[]
  onRemindersChange?: (reminders: string[]) => void
}

export function NotificationPreferencesComponent({
  selectedReminders = [],
  onRemindersChange,
}: NotificationPreferencesProps) {
  const [reminders, setReminders] = useState<string[]>(selectedReminders)
  const [reminderTime, setReminderTime] = useState('09:00')

  const toggleReminder = (reminderId: string) => {
    const updated = reminders.includes(reminderId)
      ? reminders.filter((r) => r !== reminderId)
      : [...reminders, reminderId]
    setReminders(updated)
    onRemindersChange?.(updated)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-[var(--accent)]" />
        <h3 className="font-semibold text-[var(--text-primary)]">Reminders & Notifications</h3>
      </div>

      <div className="space-y-2 mb-4">
        {REMINDER_OPTIONS.map(({ id, label, description }) => (
          <label
            key={id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              reminders.includes(id)
                ? 'bg-[var(--accent)]/10 border border-[var(--accent)]'
                : 'bg-[var(--background-secondary)] border border-transparent hover:bg-[var(--border)]'
            }`}
          >
            <input
              type="checkbox"
              checked={reminders.includes(id)}
              onChange={() => toggleReminder(id)}
              className="w-4 h-4 rounded accent-[var(--accent)]"
            />
            <div>
              <div className="font-medium text-[var(--text-primary)] text-sm">{label}</div>
              <div className="text-xs text-[var(--text-secondary)]">{description}</div>
            </div>
          </label>
        ))}
      </div>

      {reminders.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-[var(--background-secondary)] rounded-lg">
          <Clock size={16} className="text-[var(--text-secondary)]" />
          <div className="flex-1">
            <label className="text-sm text-[var(--text-secondary)] block mb-1">Reminder time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="text-sm px-2 py-1 rounded bg-white dark:bg-slate-800 border border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--text-tertiary)] mt-4">
        Add to home screen to enable web push notifications on iOS. On Android, notifications work in the browser.
      </p>
    </div>
  )
}
