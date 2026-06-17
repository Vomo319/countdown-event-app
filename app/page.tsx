"use client";

import React, { useState, useEffect, useRef } from "react";
import { saveEvent, deleteEvent as deleteEventDb, getEvents } from "./actions/events";

// ---------- Types ----------
type Category = "personal" | "milestone" | "travel" | "holiday";
type Recurrence = "none" | "yearly";

interface CountdownEvent {
  id: string;
  title: string;
  emoji: string;
  eventDate: string;
  notes?: string;
  createdAt: string;
  category?: Category;
  recurring?: Recurrence;
  photo?: string;
  color?: string;
}

type View = "home" | "add" | "edit" | "detail" | "settings";

// ---------- Constants ----------
const STORAGE_KEY = "waiting_for_events_v1";
const SESSION_KEY = "countdown_session_id";

const CATEGORIES: { label: string; icon: string; value: Category }[] = [
  { label: "Milestones", icon: "🎓", value: "milestone" },
  { label: "Travel", icon: "✈️", value: "travel" },
  { label: "Holidays", icon: "🎄", value: "holiday" },
  { label: "Personal", icon: "💜", value: "personal" },
];

const COLOR_SWATCHES: { name: string; light: string; dark: string }[] = [
  { name: "Violet", light: "#5B5BD6", dark: "#7B7BF5" },
  { name: "Rose", light: "#D946A6", dark: "#EC4899" },
  { name: "Amber", light: "#D97706", dark: "#F59E0B" },
  { name: "Teal", light: "#0891B2", dark: "#06B6D4" },
  { name: "Slate", light: "#64748B", dark: "#94A3B8" },
];

const EMOJI_OPTIONS = [
  "🎂", "🎉", "✈️", "🏖️", "🎓", "💍", "🏠", "🎁",
  "🎵", "⚽", "🏔️", "🌍", "🎬", "📚", "💼", "🌸",
  "🦋", "⭐", "🌙", "☀️", "🍾", "🎯", "🏆", "💫",
];

// ---------- Helpers ----------
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getDaysRemaining(dateString: string, recurring?: Recurrence): number {
  if (recurring === "yearly") {
    const [year, month, day] = dateString.split("-");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let eventDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (eventDate < today) {
      eventDate.setFullYear(today.getFullYear() + 1);
    }
    
    const diff = eventDate.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }
  
  const event = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = event.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatEventDateShort(dateString: string, recurring?: Recurrence): string {
  const days = getDaysRemaining(dateString, recurring);
  const d = new Date(dateString + "T00:00:00");
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow · " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function getAccentColor(customColor?: string): string {
  if (!customColor) return "#7B7BF5";
  const swatch = COLOR_SWATCHES.find(s => s.light === customColor || s.dark === customColor);
  return swatch ? swatch.dark : customColor;
}

// ---------- Hooks ----------
function useSession() {
  const [sessionId, setSessionId] = useState<string>("");
  
  useEffect(() => {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem(SESSION_KEY, sid);
    }
    setSessionId(sid);
  }, []);

  return { sessionId };
}

function useEvents(sessionId: string) {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    
    const loadEvents = async () => {
      try {
        const result = await getEvents(sessionId);
        if (result.success && result.events) {
          const sorted = result.events.sort((a, b) => 
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          );
          setEvents(sorted);
        } else {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed: CountdownEvent[] = JSON.parse(stored);
            setEvents(parsed.sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
          }
        }
      } catch (error) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: CountdownEvent[] = JSON.parse(stored);
          setEvents(parsed.sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
        }
      } finally {
        setLoaded(true);
      }
    };
    
    loadEvents();
  }, [sessionId]);

  const persist = async (next: CountdownEvent[]) => {
    const sorted = [...next].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    setEvents(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  const addEvent = async (data: Omit<CountdownEvent, "id" | "createdAt">) => {
    const newEvent: CountdownEvent = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await saveEvent({
      id: newEvent.id,
      title: newEvent.title,
      emoji: newEvent.emoji,
      eventDate: new Date(newEvent.eventDate),
      notes: newEvent.notes,
      photo: newEvent.photo,
      category: newEvent.category,
      recurring: newEvent.recurring,
      color: newEvent.color,
    }, sessionId).catch(err => {
      console.log('[v0] Database save failed');
    });
    await persist([...events, newEvent]);
  };

  const updateEvent = async (id: string, updates: Partial<CountdownEvent>) => {
    const updated = events.map((e) => (e.id === id ? { ...e, ...updates } : e));
    const updatedEvent = updated.find(e => e.id === id);
    if (updatedEvent) {
      await saveEvent({
        id: updatedEvent.id,
        title: updatedEvent.title,
        emoji: updatedEvent.emoji,
        eventDate: new Date(updatedEvent.eventDate),
        notes: updatedEvent.notes,
        photo: updatedEvent.photo,
        category: updatedEvent.category,
        recurring: updatedEvent.recurring,
        color: updatedEvent.color,
      }, sessionId).catch(err => {
        console.log('[v0] Database update failed');
      });
    }
    await persist(updated);
  };

  const deleteEvent = async (id: string) => {
    await deleteEventDb(id, sessionId).catch(err => {
      console.log('[v0] Database delete failed');
    });
    await persist(events.filter((e) => e.id !== id));
  };

  return { events, loaded, addEvent, updateEvent, deleteEvent };
}

// ---------- Components ----------
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
  const days = getDaysRemaining(event.eventDate, event.recurring);
  const isPast = days < 0 && event.recurring !== "yearly";
  const isToday = days === 0;
  const isTomorrow = days === 1;

  const [mounted, setMounted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

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

  const accentColor = getAccentColor(event.color);
  const hasPhoto = event.photo && event.photo.length > 0;

  return (
    <div className="relative mb-2.5 mx-4">
      <div
        className="absolute inset-0 rounded-[20px] bg-red-500 flex items-center justify-end pr-8 transition-opacity"
        style={{ opacity: Math.min(Math.abs(dragX) / 80, 1) }}
      >
        <span className="text-white font-semibold text-[15px]">Delete</span>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={dragging ? handlePointerUp : undefined}
        onClick={() => dragX === 0 && onOpen()}
        className={`relative flex items-center justify-between bg-[var(--surface)] border rounded-[20px] px-4 py-[18px] cursor-pointer select-none transition-all duration-300 active:scale-[0.98] overflow-hidden ${
          isToday ? "border-[var(--accent)]/30 shadow-md" : "border-[var(--border)]"
        } ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.3s ease, opacity 0.3s, translate 0.3s",
          touchAction: "pan-y",
          backgroundImage: hasPhoto ? `url(${event.photo})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {hasPhoto && <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />}

        <div className={`relative flex items-center flex-1 min-w-0 mr-4 ${hasPhoto ? "z-10" : ""}`}>
          <span className="text-[28px] mr-3 shrink-0">{event.emoji}</span>
          <div className="min-w-0">
            <p className={`text-[16px] font-semibold tracking-tight truncate ${
              hasPhoto ? "text-white" : isPast ? "text-[var(--text-secondary)]" : "text-[var(--text)]"
            }`}>
              {event.title}
            </p>
            <p className={`text-[13px] tracking-tight mt-0.5 ${
              hasPhoto ? "text-white/70" : "text-[var(--text-tertiary)]"
            }`}>
              {formatEventDateShort(event.eventDate, event.recurring)}
              {event.recurring === "yearly" && <span> 🔁</span>}
            </p>
          </div>
        </div>

        <div className={`relative flex flex-col items-end shrink-0 min-w-[64px] ${hasPhoto ? "z-10" : ""}`}>
          <span className={`text-[38px] font-extrabold tracking-tighter tabular-nums leading-[1.1] ${
            hasPhoto ? "text-white" : ""
          }`}
          style={{ color: isToday && !hasPhoto ? accentColor : undefined }}
          >
            {isToday ? "0" : Math.abs(days)}
          </span>
          <span className={`text-[11px] font-medium uppercase tracking-wider mt-0.5 ${
            hasPhoto ? "text-white/70" : "text-[var(--text-tertiary)]"
          }`}>
            {isPast && event.recurring !== "yearly" ? "days ago" : isToday ? "today" : days === 1 ? "day" : "days"}
          </span>
        </div>
      </div>
    </div>
  );
}

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

  const colClass = "flex-1 h-[200px] overflow-y-auto scrollbar-hide";
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

// ---------- Main App ----------
export default function Home() {
  const { sessionId } = useSession();
  const { events, loaded, addEvent, updateEvent, deleteEvent } = useEvents(sessionId);
  const [view, setView] = useState<View>("home");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [date, setDate] = useState(addDaysISO(30));
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<Category>("personal");
  const [recurring, setRecurring] = useState<Recurrence>("none");
  const [color, setColor] = useState<string>();

  const editing = editingId ? events.find(e => e.id === editingId) : null;
  const detail = detailId ? events.find(e => e.id === detailId) : null;

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setEmoji(editing.emoji);
      setDate(editing.eventDate);
      setNotes(editing.notes || "");
      setCategory(editing.category || "personal");
      setRecurring(editing.recurring || "none");
      setColor(editing.color);
    }
  }, [editing]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => {
    const days = getDaysRemaining(e.eventDate, e.recurring);
    return days >= 0 || e.recurring === "yearly";
  });

  const pastEvents = events.filter(e => {
    const days = getDaysRemaining(e.eventDate, e.recurring);
    return days < 0 && e.recurring !== "yearly";
  });

  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col"
      style={{
        "--background": "#0f172a",
        "--surface": "#1e293b",
        "--surface-secondary": "#334155",
        "--border": "#475569",
        "--text": "#f1f5f9",
        "--text-secondary": "#cbd5e1",
        "--text-tertiary": "#94a3b8",
        "--accent": "#7B7BF5",
        "--accent-light": "#7B7BF510",
      } as React.CSSProperties}
    >
      {view === "home" && (
        <>
          <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
            <h1 className="text-[32px] font-bold tracking-tight text-[var(--text)]">Waiting For</h1>
            <button
              onClick={() => setView("add")}
              className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[24px] active:scale-90 transition-transform"
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-4">
            {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center pb-20 px-8">
                <span className="text-[48px] mb-6 opacity-60">⏳</span>
                <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text)] mb-2">Nothing yet</h2>
                <p className="text-[15px] text-[var(--text-tertiary)] text-center">Add an event to start counting down</p>
              </div>
            ) : (
              <>
                {upcomingEvents.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    onOpen={() => setDetailId(event.id)}
                    onDelete={() => deleteEvent(event.id)}
                  />
                ))}
                {pastEvents.length > 0 && (
                  <>
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] px-4 mt-8 mb-2">Past Events</p>
                    {pastEvents.map((event, i) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={upcomingEvents.length + i}
                        onOpen={() => setDetailId(event.id)}
                        onDelete={() => deleteEvent(event.id)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {view === "add" && (
        <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[slideUp_0.3s_ease]">
          <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border)]">
            <button onClick={() => { setView("home"); setEditingId(null); }} className="w-16 text-[17px] text-[var(--text-secondary)] text-left font-medium">
              Cancel
            </button>
            <h1 className="text-[17px] font-semibold tracking-tight text-[var(--text)]">
              {editingId ? "Edit Event" : "New Event"}
            </h1>
            <div className="w-16" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
            <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden shadow-sm mb-6">
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="w-14 h-14 flex items-center justify-center bg-[var(--surface-secondary)] hover:bg-[var(--accent)]/10 rounded-[14px] m-4 mr-0 text-[30px] shrink-0 transition-colors active:scale-90"
                type="button"
              >
                {emoji}
              </button>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event name"
                maxLength={60}
                className="flex-1 bg-transparent px-4 py-4 text-[18px] font-medium tracking-tight text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none min-h-[56px]"
              />
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">Category</p>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-2 rounded-[12px] text-[13px] font-medium tracking-tight transition-colors flex items-center gap-1 ${
                      category === cat.value
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">Date</p>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-2 shadow-sm">
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-sm">
                <div>
                  <p className="text-[14px] font-medium text-[var(--text)]">Repeats yearly</p>
                  <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">For birthdays & anniversaries</p>
                </div>
                <button
                  onClick={() => setRecurring(recurring === "yearly" ? "none" : "yearly")}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center active:scale-90 ${
                    recurring === "yearly" ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                  type="button"
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    recurring === "yearly" ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">Accent Color</p>
              <div className="flex gap-3 flex-wrap">
                {COLOR_SWATCHES.map((swatch) => {
                  const col = swatch.dark;
                  const isSelected = color === col;
                  return (
                    <button
                      key={swatch.name}
                      onClick={() => setColor(isSelected ? undefined : col)}
                      className="transition-transform"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: col,
                        border: isSelected ? `3px solid ${col}` : "none",
                        boxShadow: isSelected ? `0 0 0 2px var(--surface), 0 0 0 4px ${col}` : "0 1px 3px rgba(0,0,0,0.1)",
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                      }}
                      title={swatch.name}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-6 mb-8">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">Notes</p>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] shadow-sm">
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

          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-[var(--border)] bg-[var(--background)]">
            <button
              onClick={async () => {
                if (!title.trim()) return;
                if (editingId && editing) {
                  await updateEvent(editingId, { title, emoji, eventDate: date, notes, category, recurring, color });
                  setEditingId(null);
                } else {
                  await addEvent({ title, emoji, eventDate: date, notes, category, recurring, color });
                }
                setTitle("");
                setEmoji("🎉");
                setDate(addDaysISO(30));
                setNotes("");
                setCategory("personal");
                setRecurring("none");
                setColor(undefined);
                setView("home");
              }}
              disabled={!title.trim()}
              className={`w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight transition-colors cursor-pointer active:scale-[0.98] ${
                title.trim()
                  ? "bg-[var(--accent)] text-white shadow-md active:opacity-90"
                  : "bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
              }`}
            >
              {editingId ? "Save Changes" : "Add Event"}
            </button>
          </div>

          <EmojiPickerSheet
            visible={showEmojiPicker}
            current={emoji}
            onSelect={setEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {view === "detail" && detail && (
        <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[fadeIn_0.25s_ease]">
          <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border)]">
            <button onClick={() => { setView("home"); setDetailId(null); }} className="text-[17px] font-medium text-[var(--accent)] tracking-tight active:opacity-70 min-w-[44px] h-[44px] flex items-center">
              ‹ Back
            </button>
            <button onClick={() => { setEditingId(detail.id); setView("add"); }} className="text-[17px] font-medium text-[var(--accent)] tracking-tight active:opacity-70 px-3 min-h-[44px] flex items-center">
              Edit
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 mb-6 text-center">
              <span className="text-[64px] mb-4 block">{detail.emoji}</span>
              <h2 className="text-[24px] font-bold text-[var(--text)] mb-4">{detail.title}</h2>
              <div className="text-[56px] font-extrabold text-[var(--accent)] tracking-tighter leading-none mb-2">
                {Math.abs(getDaysRemaining(detail.eventDate, detail.recurring))}
              </div>
              <p className="text-[14px] font-medium text-[var(--text-secondary)]">days away</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Date</p>
                <p className="text-[15px] font-medium text-[var(--text)]">{new Date(detail.eventDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              </div>

              {detail.notes && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Notes</p>
                  <p className="text-[15px] text-[var(--text)] leading-relaxed">{detail.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                deleteEvent(detail.id);
                setView("home");
                setDetailId(null);
              }}
              className="w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight bg-red-500/20 text-red-500 active:opacity-70 transition-colors mt-auto"
            >
              Delete Event
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
