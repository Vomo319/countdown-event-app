"use client";

import React, { useState, useEffect, useCallback } from "react";
import { InstallPrompt } from "./components/InstallPrompt";
import { EventCard } from "./components/EventCard";

// Types
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

type View = "home" | "add" | "edit" | "detail" | "settings" | "share" | "support";

// Constants
const STORAGE_KEY = "waiting_for_events_v1";
const THEME_KEY = "waiting_for_theme_v1";

const CATEGORIES: { label: string; icon: string; value: Category }[] = [
  { label: "Milestones", icon: "🎓", value: "milestone" },
  { label: "Travel", icon: "✈️", value: "travel" },
  { label: "Holidays", icon: "🎄", value: "holiday" },
  { label: "Personal", icon: "💜", value: "personal" },
];

const EMOJI_OPTIONS = [
  "🎂", "🎉", "✈️", "🏖️", "🎓", "💍", "🏠", "🎁",
  "🎵", "⚽", "🏔️", "🌍", "🎬", "📚", "💼", "🌸",
];

// Helpers
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

function formatEventDateShort(dateString: string): string {
  const d = new Date(dateString + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

export default function App() {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [view, setView] = useState<View>("home");
  const [isDark, setIsDark] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CountdownEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formEmoji, setFormEmoji] = useState("🎉");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("personal");
  const [formRecurring, setFormRecurring] = useState<Recurrence>("none");

  // Load events from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch (e) {
        console.log("[v0] Error loading events");
      }
    }

    const theme = localStorage.getItem(THEME_KEY) || "system";
    updateTheme(theme as any);
  }, []);

  // Save events to storage
  const saveEvents = (newEvents: CountdownEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
  };

  const updateTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      setIsDark(true);
    } else if (theme === "light") {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        setIsDark(true);
      } else {
        root.classList.remove("dark");
        setIsDark(false);
      }
    }
    localStorage.setItem(THEME_KEY, theme);
  };

  const handleAddEvent = () => {
    if (!formTitle.trim() || !formDate) return;

    const newEvent: CountdownEvent = {
      id: generateId(),
      title: formTitle,
      emoji: formEmoji,
      eventDate: formDate,
      notes: formNotes || undefined,
      category: formCategory,
      recurring: formRecurring,
      createdAt: new Date().toISOString(),
    };

    saveEvents([...events, newEvent]);
    setFormTitle("");
    setFormEmoji("🎉");
    setFormDate("");
    setFormNotes("");
    setFormCategory("personal");
    setFormRecurring("none");
    setView("home");
  };

  const handleEditEvent = () => {
    if (!selectedEvent || !formTitle.trim() || !formDate) return;

    saveEvents(
      events.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, title: formTitle, emoji: formEmoji, eventDate: formDate, notes: formNotes, category: formCategory, recurring: formRecurring }
          : e
      )
    );

    setSelectedEvent(null);
    setFormTitle("");
    setFormEmoji("🎉");
    setFormDate("");
    setFormNotes("");
    setFormCategory("personal");
    setFormRecurring("none");
    setView("home");
  };

  const handleDeleteEvent = (id: string) => {
    saveEvents(events.filter((e) => e.id !== id));
    setSelectedEvent(null);
    setView("home");
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    setFormTitle(selectedEvent.title);
    setFormEmoji(selectedEvent.emoji);
    setFormDate(selectedEvent.eventDate);
    setFormNotes(selectedEvent.notes || "");
    setFormCategory(selectedEvent.category || "personal");
    setFormRecurring(selectedEvent.recurring || "none");
    setView("edit");
  };

  const sortedEvents = [...events].sort(
    (a, b) => getDaysRemaining(a.eventDate, a.recurring) - getDaysRemaining(b.eventDate, b.recurring)
  );

  return (
    <div className="w-full h-screen bg-[var(--background)] text-[var(--text)] overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border)]">
        <h1 className="text-[20px] font-bold tracking-tight">Waiting For</h1>
        <button onClick={() => setView("settings")} className="text-[20px]">
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "home" && (
          <div className="p-4 space-y-3">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[48px] mb-4">🎯</div>
                <h2 className="text-[18px] font-semibold text-[var(--text)] mb-1">Nothing yet</h2>
                <p className="text-[13px] text-[var(--text-tertiary)]">Let's count down to something amazing!</p>
              </div>
            ) : (
              sortedEvents.map((event) => {
                const days = getDaysRemaining(event.eventDate, event.recurring);
                return (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    emoji={event.emoji}
                    eventDate={event.eventDate}
                    daysRemaining={days}
                    isPast={days < 0 && event.recurring !== "yearly"}
                    isToday={days === 0}
                    category={event.category}
                    onEdit={() => {
                      setSelectedEvent(event);
                      handleEditClick();
                    }}
                    onDelete={() => handleDeleteEvent(event.id)}
                    onView={() => {
                      setSelectedEvent(event);
                      setView("detail");
                    }}
                  />
                );
              })
            )}
          </div>
        )}

        {view === "add" && <AddEditScreen isEdit={false} onSave={handleAddEvent} onCancel={() => setView("home")} formState={{ formTitle, setFormTitle, formEmoji, setFormEmoji, formDate, setFormDate, formNotes, setFormNotes, formCategory, setFormCategory, formRecurring, setFormRecurring }} />}

        {view === "edit" && <AddEditScreen isEdit={true} onSave={handleEditEvent} onCancel={() => { setView("home"); setSelectedEvent(null); }} formState={{ formTitle, setFormTitle, formEmoji, setFormEmoji, formDate, setFormDate, formNotes, setFormNotes, formCategory, setFormCategory, formRecurring, setFormRecurring }} />}

        {view === "detail" && selectedEvent && <DetailScreen event={selectedEvent} onEdit={handleEditClick} onDelete={() => handleDeleteEvent(selectedEvent.id)} onClose={() => { setView("home"); setSelectedEvent(null); }} isDark={isDark} />}

        {view === "settings" && <SettingsScreen isDark={isDark} updateTheme={updateTheme} onClose={() => setView("home")} />}
      </div>

      {/* Add Button */}
      {view === "home" && (
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <button
            onClick={() => {
              setFormTitle("");
              setFormEmoji("🎉");
              setFormDate("");
              setFormNotes("");
              setFormCategory("personal");
              setFormRecurring("none");
              setView("add");
            }}
            className="w-full py-3 bg-[var(--accent)] text-white rounded-[14px] font-semibold text-[15px]"
          >
            + Add Countdown
          </button>
        </div>
      )}

      <InstallPrompt />
    </div>
  );
}

// Add/Edit Screen
function AddEditScreen({
  isEdit,
  onSave,
  onCancel,
  formState,
}: {
  isEdit: boolean;
  onSave: () => void;
  onCancel: () => void;
  formState: any;
}) {
  const { formTitle, setFormTitle, formEmoji, setFormEmoji, formDate, setFormDate, formNotes, setFormNotes, formCategory, setFormCategory, formRecurring, setFormRecurring } = formState;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Emoji Picker */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Pick an emoji</label>
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setFormEmoji(emoji)}
              className={`p-2 text-[24px] rounded-[12px] ${formEmoji === emoji ? "bg-[var(--accent)]/20 ring-2 ring-[var(--accent)]" : "bg-[var(--surface-secondary)]"}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Event Name</label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="e.g., Trip to Bali"
          maxLength={50}
          className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[12px] text-[var(--text)]"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Date</label>
        <input
          type="date"
          value={formDate}
          onChange={(e) => setFormDate(e.target.value)}
          className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[12px] text-[var(--text)]"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Category</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFormCategory(cat.value)}
              className={`p-2 rounded-[12px] text-center text-[13px] font-medium ${
                formCategory === cat.value ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text)]"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Notes (optional)</label>
        <textarea
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Add any details..."
          maxLength={200}
          rows={3}
          className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[12px] text-[var(--text)] resize-none"
        />
      </div>

      {/* Recurring */}
      <div>
        <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Repeat</label>
        <div className="flex gap-2">
          <button
            onClick={() => setFormRecurring("none")}
            className={`flex-1 p-2 rounded-[12px] text-[13px] font-medium ${
              formRecurring === "none" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text)]"
            }`}
          >
            Once
          </button>
          <button
            onClick={() => setFormRecurring("yearly")}
            className={`flex-1 p-2 rounded-[12px] text-[13px] font-medium ${
              formRecurring === "yearly" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text)]"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button onClick={onCancel} className="flex-1 p-3 bg-[var(--surface-secondary)] rounded-[12px] text-[15px] font-semibold text-[var(--text)]">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!formTitle.trim() || !formDate}
          className="flex-1 p-3 bg-[var(--accent)] text-white rounded-[12px] text-[15px] font-semibold disabled:opacity-50"
        >
          {isEdit ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}

// Detail Screen
function DetailScreen({ event, onEdit, onDelete, onClose, isDark }: { event: CountdownEvent; onEdit: () => void; onDelete: () => void; onClose: () => void; isDark: boolean }) {
  const [showDelete, setShowDelete] = useState(false);
  const days = getDaysRemaining(event.eventDate, event.recurring);
  const isPast = days < 0 && event.recurring !== "yearly";
  const isToday = days === 0;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)]">
          ← Back
        </button>
        <button onClick={onEdit} className="text-[17px] font-medium text-[var(--accent)]">
          Edit
        </button>
      </div>

      {/* Event Details */}
      <div className="text-center">
        <div className="text-[52px] mb-3">{event.emoji}</div>
        <h1 className="text-[24px] font-bold text-[var(--text)] mb-1">{event.title}</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">{formatEventDateLong(event.eventDate)}</p>
      </div>

      {/* Countdown */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-8 text-center">
        {isPast ? (
          <>
            <p className="text-[13px] font-medium text-[var(--text-tertiary)] mb-2">HAPPENED</p>
            <div className="text-[48px] font-bold text-[var(--accent)]">{Math.abs(days)}</div>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-2">days ago</p>
          </>
        ) : isToday ? (
          <>
            <p className="text-[20px] font-semibold text-[var(--accent)] mb-2">🎉 Today!</p>
            <div className="text-[48px] font-bold text-[var(--accent)]">0</div>
          </>
        ) : (
          <>
            <div className="text-[48px] font-bold text-[var(--accent)] mb-2">{days}</div>
            <p className="text-[13px] text-[var(--text-tertiary)]">{days === 1 ? "day" : "days"} away</p>
          </>
        )}
      </div>

      {event.notes && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-4">
          <p className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-2">NOTES</p>
          <p className="text-[14px] text-[var(--text)]">{event.notes}</p>
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={() => setShowDelete(true)}
        className="w-full p-3 rounded-[12px] text-[15px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30"
      >
        Delete Event
      </button>

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[90%] max-w-sm">
            <h2 className="text-[17px] font-semibold text-[var(--text)] mb-2">Delete event?</h2>
            <p className="text-[13px] text-[var(--text-tertiary)] mb-4">This can't be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 p-3 bg-[var(--surface-secondary)] rounded-[12px] font-semibold text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowDelete(false);
                }}
                className="flex-1 p-3 bg-red-500 rounded-[12px] font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Screen
function SettingsScreen({ isDark, updateTheme, onClose }: { isDark: boolean; updateTheme: (theme: string) => void; onClose: () => void }) {
  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold">Settings</h2>
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)]">
          Done
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4">
          <h3 className="text-[15px] font-semibold text-[var(--text)] mb-2">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateTheme("light")}
              className={`p-3 rounded-[12px] text-center text-[13px] font-medium ${isDark === false && localStorage.getItem("waiting_for_theme_v1") === "light" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text)]"}`}
            >
              Light
            </button>
            <button
              onClick={() => updateTheme("dark")}
              className={`p-3 rounded-[12px] text-center text-[13px] font-medium ${isDark === true && localStorage.getItem("waiting_for_theme_v1") === "dark" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text)]"}`}
            >
              Dark
            </button>
            <button
              onClick={() => updateTheme("system")}
              className={`p-3 rounded-[12px] text-center text-[13px] font-medium ${localStorage.getItem("waiting_for_theme_v1") === "system" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--text)]"}`}
            >
              System
            </button>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 text-center">
          <p className="text-[13px] text-[var(--text-tertiary)]">Made with care for you</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-2">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
