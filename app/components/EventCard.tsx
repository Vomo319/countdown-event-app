'use client'

import { useState, useRef } from 'react'
import { EventContextMenu } from './EventContextMenu'

interface EventCardProps {
  id: string
  title: string
  emoji: string
  eventDate: string
  daysRemaining: number
  isPast: boolean
  isToday: boolean
  color?: string
  category?: string
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

export function EventCard({
  id,
  title,
  emoji,
  eventDate,
  daysRemaining,
  isPast,
  isToday,
  color,
  category,
  onEdit,
  onDelete,
  onView,
}: EventCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout>()
  const [feeling, setFeeling] = useState(() => localStorage.getItem(`event-feeling-${id}`) || '')
  const [reminder, setReminder] = useState(() => localStorage.getItem(`event-reminder-${id}`) || '')

  const handleLongPress = () => {
    setMenuOpen(true)
  }

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(handleLongPress, 500)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(handleLongPress, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const feelingEmoji = {
    excited: '🤗',
    nervous: '😰',
    grateful: '🙏',
    hopeful: '😌',
    anxious: '😟',
    joyful: '😊',
  }[feeling] || ''

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={onView}
        className={`p-4 rounded-[16px] border transition-all active:scale-95 cursor-pointer ${
          isToday
            ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50 ring-2 ring-[var(--accent)]/20'
            : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/50'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[32px]">{emoji}</span>
            {feeling && <span className="text-[18px]">{feelingEmoji}</span>}
          </div>
          <div className="flex gap-1">
            {reminder && <span className="text-[12px] bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-1 rounded-[6px]">🔔</span>}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(true)
              }}
              className="text-[18px] p-1 hover:bg-[var(--surface-secondary)] rounded-[6px] transition-colors"
            >
              ⋯
            </button>
          </div>
        </div>

        <h3 className="text-[15px] font-semibold text-[var(--text)] mb-1 line-clamp-1">{title}</h3>

        <div className="flex items-end justify-between">
          <div className="flex-1">
            <div className="text-[28px] font-bold text-[var(--accent)] mb-1">
              {isPast ? -daysRemaining : daysRemaining}
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)]">
              {isToday ? '🎉 Today!' : isPast ? 'days ago' : 'days left'}
            </p>
          </div>
          {category && (
            <div className="text-[11px] bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-2 py-1 rounded-[6px]">
              {category}
            </div>
          )}
        </div>
      </div>

      <EventContextMenu
        eventId={id}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddFeeling={(f) => setFeeling(f)}
        onAddNote={() => {}}
        onSetReminder={(r) => setReminder(r)}
      />
    </>
  )
}
