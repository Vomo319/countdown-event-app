"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ---------- Types ----------
interface CountdownEvent {
  id: string;
  title: string;
  emoji: string;
  eventDate: string; // ISO date string (yyyy-mm-dd)
  notes?: string;
  createdAt: string;
}

type ThemeMode = "light" | "dark" | "system";
type View = "home" | "add" | "edit" | "detail" | "settings";

// ---------- Constants ----------
const STORAGE_KEY = "waiting_for_events_v1";
const THEME_KEY = "waiting_for_theme_v1";

const EMOJI_OPTIONS = [
  "🎂", "🎉", "✈️", "🏖️", "🎓", "💍", "🏠", "🎁",
  "🎵", "⚽", "🏔️", "🌍", "🎬", "📚", "💼", "🌸",
  "🦋", "⭐", "🌙", "☀️", "🍾", "🎯", "🏆", "💫",
];

// ---------- Helpers ----------
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getDaysRemaining(dateString: string): number {
  const event = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = event.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatEventDateLong(dateString: string): string {
  const d = new Date(dateString + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventDateShort(dateString: string): string {
  const days = getDaysRemaining(dateString);
  const d = new Date(dateString + "T00:00:00");
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow · " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

// ---------- Theme hook ----------
function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (stored) setMode(stored);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (mode === "system") setIsDark(mq.matches);
      else setIsDark(mode === "dark");
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mode]);

  const setThemeMode = (m: ThemeMode) => {
    setMode(m);
    localStorage.setItem(THEME_KEY, m);
  };

  return { isDark, mode, setThemeMode };
}

// ---------- Events hook ----------
function useEvents() {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CountdownEvent[] = JSON.parse(stored);
        parsed.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
        setEvents(parsed);
      }
    } catch {}
    setLoaded(true);
  }, []);

  const persist = (next: CountdownEvent[]) => {
    const sorted = [...next].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    setEvents(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  const addEvent = (data: Omit<CountdownEvent, "id" | "createdAt">) => {
    const newEvent: CountdownEvent = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    persist([...events, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<CountdownEvent>) => {
    persist(events.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteEvent = (id: string) => {
    persist(events.filter((e) => e.id !== id));
  };

  return { events, loaded, addEvent, updateEvent, deleteEvent };
}

// ---------- Animated countdown number ----------
function CountdownNumber({ days, size = "large" }: { days: number; size?: "large" | "hero" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const isPast = days < 0;
  const isToday = days === 0;
  const display = Math.abs(days).toString();

  const sizeClasses = size === "hero" ? "text-[clamp(72px,22vw,104px)]" : "text-[44px]";

  return (
    <span
      className={`font-extrabold tabular-nums tracking-tighter transition-all duration-500 ${sizeClasses} ${
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
      } ${isToday ? "text-[var(--accent)]" : isPast ? "text-[var(--text-tertiary)]" : "text-[var(--text)]"}`}
      style={{ lineHeight: 1 }}
    >
      {isToday ? "0" : display}
    </span>
  );
}

// ---------- Event Card ----------
function EventCard({
  event,
  index,
  onOpen,
  onDelete,
}: {
  event: CountdownEvent;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const days = getDaysRemaining(event.eventDate);
  const isPast = days < 0;
  const isToday = days === 0;
  const isTomorrow = days === 1;

  const [mounted, setMounted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 50);
    return () => clearTimeout(t);
  }, [index]);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    if (delta < 0) setDragX(Math.max(delta, -160));
  };

  const handlePointerUp = () => {
    setDragging(false);
    if (dragX < -80) {
      setDragX(-window.innerWidth);
      setTimeout(onDelete, 200);
    } else {
      setDragX(0);
    }
  };

  const accentClass = isToday
    ? "text-[var(--accent)]"
    : isTomorrow
    ? "text-[var(--accent-muted)]"
    : isPast
    ? "text-[var(--text-tertiary)]"
    : "text-[var(--text)]";

  return (
    <div className="relative mb-2.5 mx-4">
      <div
        className="absolute inset-0 rounded-[20px] bg-[var(--destructive)] flex items-center justify-end pr-8 transition-opacity"
        style={{ opacity: Math.min(Math.abs(dragX) / 80, 1) }}
      >
        <span className="text-white font-semibold text-[15px]">Delete</span>
      </div>

      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={dragging ? handlePointerUp : undefined}
        onClick={() => dragX === 0 && onOpen()}
        className={`relative flex items-center justify-between bg-[var(--surface)] border rounded-[20px] px-4 py-[18px] cursor-pointer select-none transition-all duration-300 active:scale-[0.985] ${
          isToday ? "border-[var(--accent)]/30" : "border-[var(--border)]"
        } ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.3s ease, opacity 0.3s, translate 0.3s",
          boxShadow: "0 2px 12px var(--shadow-md)",
          touchAction: "pan-y",
        }}
      >
        <div className="flex items-center flex-1 min-w-0 mr-4">
          <span className="text-[28px] mr-3 shrink-0">{event.emoji}</span>
          <div className="min-w-0">
            <p className={`text-[16px] font-semibold tracking-tight truncate ${isPast ? "text-[var(--text-secondary)]" : "text-[var(--text)]"}`}>
              {event.title}
            </p>
            <p className="text-[13px] text-[var(--text-tertiary)] tracking-tight mt-0.5">
              {formatEventDateShort(event.eventDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 min-w-[64px]">
          <span className={`text-[38px] font-extrabold tracking-tighter tabular-nums leading-[1.1] ${accentClass}`}>
            {isToday ? "0" : Math.abs(days)}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mt-0.5">
            {isPast ? "days ago" : isToday ? "today" : days === 1 ? "day" : "days"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Empty State ----------
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-20 px-8 animate-[fadeInUp_0.5s_ease_0.2s_forwards] opacity-0">
      <span className="text-[48px] mb-6 opacity-60">⏳</span>
      <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text)] mb-2">Nothing yet</h2>
      <p className="text-[15px] text-[var(--text-tertiary)] text-center leading-relaxed max-w-[220px]">
        Add an event to start counting down
      </p>
    </div>
  );
}

// ---------- Date Picker ----------
function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = new Date(value + "T00:00:00");
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());
  const [day, setDay] = useState(date.getDate());

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  const update = (y: number, m: number, d: number) => {
    const clampedDay = Math.min(d, new Date(y, m + 1, 0).getDate());
    setYear(y);
    setMonth(m);
    setDay(clampedDay);
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(clampedDay).padStart(2, "0");
    onChange(`${y}-${mm}-${dd}`);
  };

  const colClass = "flex-1 h-[200px] overflow-y-auto scrollbar-none";
  const itemClass = (active: boolean) =>
    `px-2 py-2.5 mx-0.5 my-0.5 rounded-lg text-center text-[14px] tracking-tight transition-colors cursor-pointer ${
      active
        ? "bg-[var(--accent-light)] text-[var(--accent)] font-semibold"
        : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
    }`;

  return (
    <div className="flex border border-[var(--border)] rounded-[14px] overflow-hidden">
      <div className={`${colClass} flex-[2]`}>
        {MONTHS.map((m, i) => (
          <div key={m} className={itemClass(i === month)} onClick={() => update(year, i, day)}>
            {m}
          </div>
        ))}
      </div>
      <div className={colClass}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <div key={d} className={itemClass(d === day)} onClick={() => update(year, month, d)}>
            {d}
          </div>
        ))}
      </div>
      <div className={colClass}>
        {years.map((y) => (
          <div key={y} className={itemClass(y === year)} onClick={() => update(y, month, day)}>
            {y}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Emoji Picker Sheet ----------
function EmojiPickerSheet({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (e: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease]" />
      <div
        className="relative w-full bg-[var(--surface)] rounded-t-[28px] p-6 pb-10 animate-[slideUp_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />
        <h3 className="text-[17px] font-semibold tracking-tight text-[var(--text)] mb-4">Choose Emoji</h3>
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => {
                onSelect(e);
                onClose();
              }}
              className={`w-[52px] h-[52px] flex items-center justify-center rounded-[14px] text-[28px] transition-colors ${
                e === current ? "bg-[var(--accent-light)]" : "hover:bg-[var(--surface-secondary)]"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Add/Edit Event Screen ----------
function AddEditScreen({
  editing,
  onSave,
  onClose,
}: {
  editing: CountdownEvent | null;
  onSave: (data: Omit<CountdownEvent, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [emoji, setEmoji] = useState(editing?.emoji ?? "🎉");
  const [date, setDate] = useState(editing?.eventDate ?? addDaysISO(30));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      emoji,
      eventDate: date,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[slideUp_0.3s_ease]">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border-subtle)]">
        <button onClick={onClose} className="w-16 text-[17px] text-[var(--text-secondary)] text-left">
          Cancel
        </button>
        <h1 className="text-[17px] font-semibold tracking-tight text-[var(--text)]">
          {editing ? "Edit Event" : "New Event"}
        </h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden">
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="w-14 h-14 flex items-center justify-center bg-[var(--surface-secondary)] rounded-[14px] m-4 mr-0 text-[30px] shrink-0"
          >
            {emoji}
          </button>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event name"
            maxLength={60}
            className="flex-1 bg-transparent px-4 py-4 text-[18px] font-medium tracking-tight text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none min-h-[56px]"
          />
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">
            Date
          </p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-2">
            <DatePicker value={date} onChange={setDate} />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">
            Notes
          </p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px]">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note…"
              maxLength={300}
              rows={3}
              className="w-full bg-transparent px-4 py-4 text-[16px] tracking-tight text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-[var(--border-subtle)] bg-[var(--background)]">
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className={`w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight transition-colors ${
            title.trim()
              ? "bg-[var(--accent)] text-white active:opacity-90"
              : "bg-[var(--border)] text-[var(--text-tertiary)]"
          }`}
        >
          {editing ? "Save Changes" : "Add Event"}
        </button>
      </div>

      <EmojiPickerSheet
        visible={showEmojiPicker}
        current={emoji}
        onSelect={setEmoji}
        onClose={() => setShowEmojiPicker(false)}
      />
    </div>
  );
}

// ---------- Event Detail Screen ----------
function DetailScreen({
  event,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CountdownEvent;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const days = getDaysRemaining(event.eventDate);
  const isPast = days < 0;
  const isToday = days === 0;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[fadeIn_0.25s_ease]">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border-subtle)]">
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
          ‹ Back
        </button>
        <button onClick={onEdit} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
          Edit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-28">
        <div className="flex flex-col items-center mb-8 animate-[fadeInUp_0.4s_ease]">
          <span className="text-[52px] mb-4">{event.emoji}</span>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--text)] text-center mb-2">
            {event.title}
          </h1>
          <p className="text-[15px] text-[var(--text-tertiary)] tracking-tight text-center">
            {formatEventDateLong(event.eventDate)}
          </p>
        </div>

        <div
          className={`flex flex-col items-center rounded-[28px] border p-12 mb-4 animate-[fadeInUp_0.4s_ease_0.05s_backwards] ${
            isToday ? "bg-[var(--accent-light)] border-[var(--accent)]/30" : "bg-[var(--surface)] border-[var(--border)]"
          }`}
          style={{ boxShadow: "0 4px 20px var(--shadow)" }}
        >
          {isPast ? (
            <>
              <span className="text-[13px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                happened
              </span>
              <CountdownNumber days={days} size="hero" />
              <span className="text-[15px] font-medium tracking-tight text-[var(--text-tertiary)] mt-3">
                days ago
              </span>
            </>
          ) : isToday ? (
            <>
              <span className="text-[20px] font-semibold tracking-tight text-[var(--accent)] mb-2">
                🎉 Today!
              </span>
              <CountdownNumber days={0} size="hero" />
              <span className="text-[15px] font-medium tracking-tight text-[var(--accent)] mt-3">
                days away
              </span>
            </>
          ) : (
            <>
              <CountdownNumber days={days} size="hero" />
              <span className="text-[15px] font-medium tracking-tight text-[var(--text-secondary)] mt-3">
                {days === 1 ? "day away" : "days away"}
              </span>
            </>
          )}
        </div>

        {event.notes && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-4 animate-[fadeInUp_0.4s_ease_0.1s_backwards]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
              Notes
            </p>
            <p className="text-[15px] text-[var(--text)] leading-relaxed tracking-tight">{event.notes}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-[var(--border-subtle)] bg-[var(--background)]">
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight bg-[var(--surface-secondary)] text-[var(--text)]"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight bg-[var(--destructive)] text-white"
            >
              Confirm Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight bg-[var(--destructive-light)] text-[var(--destructive)]"
          >
            Delete Event
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Settings Screen ----------
function SettingsScreen({
  mode,
  setThemeMode,
  eventCount,
  onClose,
}: {
  mode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  eventCount: number;
  onClose: () => void;
}) {
  const options: { label: string; value: ThemeMode }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[slideUp_0.3s_ease]">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border-subtle)]">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text)]">Settings</h1>
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">
          Appearance
        </p>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-4 mb-6">
          <p className="text-[12px] font-semibold tracking-tight text-[var(--text-tertiary)] mb-3">Theme</p>
          <div className="flex gap-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setThemeMode(opt.value)}
                className={`flex-1 py-2.5 rounded-[10px] text-[14px] tracking-tight transition-colors ${
                  mode === opt.value
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">
          About
        </p>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] divide-y divide-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[16px] tracking-tight text-[var(--text)]">Events tracked</span>
            <span className="text-[15px] text-[var(--text-tertiary)]">{eventCount}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[16px] tracking-tight text-[var(--text)]">Version</span>
            <span className="text-[15px] text-[var(--text-tertiary)]">1.0.0</span>
          </div>
        </div>

        <p className="text-center text-[13px] text-[var(--text-tertiary)] tracking-tight mt-12">
          Waiting For — track what matters
        </p>
      </div>
    </div>
  );
}

// ---------- Main App ----------
export default function WaitingForApp() {
  const { isDark, mode, setThemeMode } = useTheme();
  const { events, loaded, addEvent, updateEvent, deleteEvent } = useEvents();
  const [view, setView] = useState<View>("home");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const upcoming = events.filter((e) => getDaysRemaining(e.eventDate) >= 0);
  const past = events.filter((e) => getDaysRemaining(e.eventDate) < 0);
  const activeEvent = events.find((e) => e.id === activeEventId) ?? null;

  const handleAdd = (data: Omit<CountdownEvent, "id" | "createdAt">) => {
    if (view === "edit" && activeEventId) {
      updateEvent(activeEventId, data);
    } else {
      addEvent(data);
    }
    setView("home");
    setActiveEventId(null);
  };

  const handleDelete = () => {
    if (activeEventId) deleteEvent(activeEventId);
    setView("home");
    setActiveEventId(null);
  };

  return (
    <div
      className={isDark ? "dark" : ""}
      style={
        {
          "--background": isDark ? "#111110" : "#F7F7F5",
          "--surface": isDark ? "#1C1C1A" : "#FFFFFF",
          "--surface-secondary": isDark ? "#222220" : "#F2F2F0",
          "--border": isDark ? "#2E2E2C" : "#E8E8E6",
          "--border-subtle": isDark ? "#242422" : "#F0F0EE",
          "--text": isDark ? "#EEEEEC" : "#1A1A1A",
          "--text-secondary": isDark ? "#A0A09E" : "#6B6B6B",
          "--text-tertiary": isDark ? "#666664" : "#ABABAB",
          "--accent": isDark ? "#7B7BF5" : "#5B5BD6",
          "--accent-light": isDark ? "#1E1E40" : "#EDEDFF",
          "--accent-muted": isDark ? "#6060C0" : "#8B8BDE",
          "--destructive": isDark ? "#F2555A" : "#E5484D",
          "--destructive-light": isDark ? "#2C1515" : "#FFEFEF",
          "--shadow": isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)",
          "--shadow-md": isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.10)",
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen bg-[var(--background)] font-sans antialiased max-w-md mx-auto relative overflow-x-hidden">
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .scrollbar-none::-webkit-scrollbar { display: none; }
          .scrollbar-none { scrollbar-width: none; }
          body { background: var(--background); }
        `}</style>

        <div className="flex flex-col min-h-screen">
          <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-4 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--background)] z-10">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--text)]">Waiting For</h1>
              {events.length > 0 && (
                <p className="text-[13px] text-[var(--text-tertiary)] tracking-tight mt-0.5">
                  {upcoming.length} {upcoming.length === 1 ? "upcoming event" : "upcoming events"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("settings")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[18px]"
                aria-label="Settings"
              >
                ⚙️
              </button>
              <button
                onClick={() => {
                  setActiveEventId(null);
                  setView("add");
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-[22px] font-light active:opacity-90"
                aria-label="Add event"
                style={{ lineHeight: 1 }}
              >
                +
              </button>
            </div>
          </div>

          {!loaded ? null : events.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex-1 pt-4 pb-12">
              {upcoming.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  onOpen={() => {
                    setActiveEventId(event.id);
                    setView("detail");
                  }}
                  onDelete={() => deleteEvent(event.id)}
                />
              ))}

              {past.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] px-6 pt-4 pb-2">
                    Past
                  </p>
                  {past.map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={upcoming.length + i}
                      onOpen={() => {
                        setActiveEventId(event.id);
                        setView("detail");
                      }}
                      onDelete={() => deleteEvent(event.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {(view === "add" || view === "edit") && (
          <AddEditScreen
            editing={view === "edit" ? activeEvent : null}
            onSave={handleAdd}
            onClose={() => {
              setView("home");
              setActiveEventId(null);
            }}
          />
        )}

        {view === "detail" && activeEvent && (
          <DetailScreen
            event={activeEvent}
            onEdit={() => setView("edit")}
            onDelete={handleDelete}
            onClose={() => {
              setView("home");
              setActiveEventId(null);
            }}
          />
        )}

        {view === "settings" && (
          <SettingsScreen
            mode={mode}
            setThemeMode={setThemeMode}
            eventCount={events.length}
            onClose={() => setView("home")}
          />
        )}
      </div>
    </div>
  );
}
