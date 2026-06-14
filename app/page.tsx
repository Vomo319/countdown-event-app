"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { InstallPrompt } from "./components/InstallPrompt";

// ---------- Types ----------
type Category = "personal" | "milestone" | "travel" | "holiday";
type Recurrence = "none" | "yearly";

interface CountdownEvent {
  id: string;
  title: string;
  emoji: string;
  eventDate: string; // ISO date string (yyyy-mm-dd)
  notes?: string;
  createdAt: string;
  category?: Category;
  recurring?: Recurrence;
  photo?: string; // base64 data URL
  color?: string; // hex color override
}

type ThemeMode = "light" | "dark" | "system";
type View = "home" | "add" | "edit" | "detail" | "settings" | "share" | "support";

// ---------- Constants ----------
const STORAGE_KEY = "waiting_for_events_v1";
const THEME_KEY = "waiting_for_theme_v1";

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
    
    // If this year's date has passed, use next year's date
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

function formatEventDateLong(dateString: string): string {
  const d = new Date(dateString + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventDateShort(dateString: string, recurring?: Recurrence): string {
  const days = getDaysRemaining(dateString, recurring);
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

function getAccentColor(isDark: boolean, customColor?: string): string {
  if (!customColor) {
    return isDark ? "#7B7BF5" : "#5B5BD6";
  }
  const swatch = COLOR_SWATCHES.find(s => s.light === customColor || s.dark === customColor);
  return swatch ? (isDark ? swatch.dark : swatch.light) : customColor;
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

// ---------- Photo Picker Button ----------
function PhotoPickerButton({
  photo,
  onPhotoSelect,
  onPhotoRemove,
}: {
  photo?: string;
  onPhotoSelect: (dataUrl: string) => void;
  onPhotoRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Photo must be smaller than 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onPhotoSelect(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  if (photo) {
    return (
      <div className="relative">
        <img src={photo} alt="Event cover" className="w-full h-[144px] rounded-[14px] object-cover" />
        <button
          onClick={() => onPhotoRemove()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white text-[16px]"
        >
          ×
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-2 right-2 px-3 py-1.5 rounded-[8px] bg-black/50 text-white text-[12px] font-medium"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-8 border-2 border-dashed border-[var(--border)] rounded-[14px] flex flex-col items-center justify-center gap-2 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
      >
        <span className="text-[24px]">📷</span>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Add Cover Photo</p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}

// ---------- Category Pills ----------
function CategoryPills({
  selected,
  onSelect,
  hideAll,
}: {
  selected: Category;
  onSelect: (c: Category) => void;
  hideAll?: boolean;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={`px-3 py-2 rounded-[12px] text-[13px] font-medium tracking-tight transition-colors flex items-center gap-1 ${
            selected === cat.value
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
          }`}
        >
          <span>{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Color Swatches ----------
function ColorSwatches({
  selected,
  isDark,
  onSelect,
}: {
  selected?: string;
  isDark: boolean;
  onSelect: (color?: string) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap">
      {COLOR_SWATCHES.map((swatch) => {
        const color = isDark ? swatch.dark : swatch.light;
        const isSelected = selected === color;
        return (
          <button
            key={swatch.name}
            onClick={() => onSelect(isSelected ? undefined : color)}
            className="transition-transform"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: color,
              border: isSelected ? `3px solid ${color}` : "none",
              boxShadow: isSelected ? `0 0 0 2px var(--surface), 0 0 0 4px ${color}` : "0 1px 3px rgba(0,0,0,0.1)",
              transform: isSelected ? "scale(1.1)" : "scale(1)",
            }}
            title={swatch.name}
          />
        );
      })}
    </div>
  );
}

// ---------- Share Screen ----------
function ShareScreen({
  event,
  isDark,
  onClose,
}: {
  event: CountdownEvent;
  isDark: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const days = getDaysRemaining(event.eventDate, event.recurring);
  const accentColor = getAccentColor(isDark, event.color);

  const shareText = `${days <= 0 && event.recurring !== "yearly" ? Math.abs(days) : Math.abs(days)} ${
    days === 0 ? "" : days <= 0 && event.recurring !== "yearly" ? "days ago" : "days"
  } until ${event.title} ${event.emoji}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Waiting For",
          text: shareText,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hasPhoto = event.photo && event.photo.length > 0;

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[slideUp_0.3s_ease]">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border-subtle)]">
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
          ‹ Back
        </button>
        <h1 className="text-[17px] font-semibold tracking-tight text-[var(--text)]">Share</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div
          className="rounded-[24px] overflow-hidden mb-6 animate-[fadeInUp_0.4s_ease]"
          style={{
            width: "320px",
            aspectRatio: "4/5",
            background: hasPhoto
              ? `url(${event.photo}) center / cover`
              : `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`,
          }}
        >
          {hasPhoto && <div className="absolute inset-0 bg-black/45" />}
          <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
            <span className="text-[64px] mb-4">{event.emoji}</span>
            <h2 className={`text-[24px] font-bold text-center tracking-tight mb-6 px-4 ${
              hasPhoto ? "text-white" : "text-[var(--text)]"
            }`}>
              {event.title}
            </h2>
            <div className={`text-[56px] font-extrabold tracking-tighter leading-none mb-2 ${
              hasPhoto ? "text-white" : ""
            }`}
            style={{ color: !hasPhoto ? accentColor : undefined }}
            >
              {Math.abs(days)}
            </div>
            <p className={`text-[14px] font-medium tracking-tight ${
              hasPhoto ? "text-white/80" : "text-[var(--text-secondary)]"
            }`}>
              days to go
            </p>
            <div className={`absolute bottom-4 left-4 text-[12px] font-semibold tracking-wide ${
              hasPhoto ? "text-white/60" : "text-[var(--text-tertiary)]"
            }`}>
              Waiting For
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          {navigator.share && (
            <button
              onClick={handleShare}
              className="w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight bg-[var(--accent)] text-white active:opacity-90 transition-colors"
            >
              Share
            </button>
          )}
          <button
            onClick={handleCopyText}
            className={`w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight transition-colors ${
              copied
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-secondary)] text-[var(--text)] active:opacity-90"
            }`}
          >
            {copied ? "Copied ✓" : "Copy as text"}
          </button>
        </div>
      </div>
    </div>
  );
}
function CountdownNumber({ days, size = "large", customColor }: { days: number; size?: "large" | "hero"; customColor?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const isPast = days < 0;
  const isToday = days === 0;
  const display = Math.abs(days).toString();

  const sizeClasses = size === "hero" ? "text-[clamp(72px,22vw,104px)]" : "text-[44px]";
  const colorStyle = customColor ? { color: customColor } : undefined;

  return (
    <span
      className={`font-extrabold tabular-nums tracking-tighter transition-all duration-500 ${sizeClasses} ${
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
      } ${isToday ? customColor ? "" : "text-[var(--accent)]" : isPast ? "text-[var(--text-tertiary)]" : "text-[var(--text)]"}`}
      style={{ lineHeight: 1, ...colorStyle }}
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
  isDark,
}: {
  event: CountdownEvent;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const days = getDaysRemaining(event.eventDate, event.recurring);
  const isPast = days < 0 && event.recurring !== "yearly";
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

  const accentColor = getAccentColor(isDark, event.color);
  const accentClass = isToday
    ? `text-[${accentColor}]`
    : isTomorrow
    ? "text-[var(--accent-muted)]"
    : isPast
    ? "text-[var(--text-tertiary)]"
    : "text-[var(--text)]";

  const hasPhoto = event.photo && event.photo.length > 0;

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
        className={`relative flex items-center justify-between bg-[var(--surface)] border rounded-[20px] px-4 py-[18px] cursor-pointer select-none transition-all duration-300 active:scale-[0.985] overflow-hidden ${
          isToday ? "border-[var(--accent)]/30" : "border-[var(--border)]"
        } ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.3s ease, opacity 0.3s, translate 0.3s",
          boxShadow: "0 2px 12px var(--shadow-md)",
          touchAction: "pan-y",
          backgroundImage: hasPhoto ? `url(${event.photo})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {hasPhoto && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />
          </>
        )}

        <div className={`relative flex items-center flex-1 min-w-0 mr-4 ${hasPhoto ? "z-10" : ""}`}>
          <span className="text-[28px] mr-3 shrink-0">{event.emoji}</span>
          <div className="min-w-0">
            <p className={`text-[16px] font-semibold tracking-tight truncate ${
              hasPhoto ? "text-white" : isPast ? "text-[var(--text-secondary)]" : "text-[var(--text)]"
            }`}>
              {event.title}
            </p>
            <p className={`text-[13px] tracking-tight mt-0.5 flex items-center gap-1 ${
              hasPhoto ? "text-white/70" : "text-[var(--text-tertiary)]"
            }`}>
              {formatEventDateShort(event.eventDate, event.recurring)}
              {event.recurring === "yearly" && <span>🔁</span>}
            </p>
          </div>
        </div>

        <div className={`relative flex flex-col items-end shrink-0 min-w-[64px] ${hasPhoto ? "z-10" : ""}`}>
          <span className={`text-[38px] font-extrabold tracking-tighter tabular-nums leading-[1.1] ${
            hasPhoto
              ? "text-white"
              : isToday
              ? `text-[${accentColor}]`
              : isTomorrow
              ? "text-[var(--accent-muted)]"
              : isPast
              ? "text-[var(--text-tertiary)]"
              : "text-[var(--text)]"
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
  isDark,
}: {
  editing: CountdownEvent | null;
  onSave: (data: Omit<CountdownEvent, "id" | "createdAt">) => void;
  onClose: () => void;
  isDark: boolean;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [emoji, setEmoji] = useState(editing?.emoji ?? "🎉");
  const [date, setDate] = useState(editing?.eventDate ?? addDaysISO(30));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [photo, setPhoto] = useState(editing?.photo);
  const [category, setCategory] = useState<Category>(editing?.category ?? "personal");
  const [recurring, setRecurring] = useState<Recurrence>(editing?.recurring ?? "none");
  const [color, setColor] = useState(editing?.color);
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
      photo,
      category,
      recurring,
      color,
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
        <div className="mb-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">
            Cover Photo
          </p>
          <PhotoPickerButton
            photo={photo}
            onPhotoSelect={setPhoto}
            onPhotoRemove={() => setPhoto(undefined)}
          />
        </div>

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
            Category
          </p>
          <CategoryPills selected={category} onSelect={setCategory} />
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
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-[20px]">
            <div>
              <p className="text-[14px] font-medium text-[var(--text)]">Repeats yearly</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">For birthdays & anniversaries</p>
            </div>
            <button
              onClick={() => setRecurring(recurring === "yearly" ? "none" : "yearly")}
              className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                recurring === "yearly" ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                recurring === "yearly" ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 ml-1">
            Accent Color
          </p>
          <ColorSwatches selected={color} isDark={isDark} onSelect={setColor} />
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
          className={`w-full py-[14px] rounded-[16px] text-[17px] font-semibold tracking-tight transition-colors cursor-pointer ${
            title.trim()
              ? "bg-[var(--accent)] text-white active:opacity-90"
              : "bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
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
  onShare,
  isDark,
}: {
  event: CountdownEvent;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onShare: () => void;
  isDark: boolean;
}) {
  const days = getDaysRemaining(event.eventDate, event.recurring);
  const isPast = days < 0 && event.recurring !== "yearly";
  const isToday = days === 0;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const accentColor = getAccentColor(isDark, event.color);
  const hasPhoto = event.photo && event.photo.length > 0;

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[fadeIn_0.25s_ease]">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border-subtle)]">
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
          ‹ Back
        </button>
        <div className="flex gap-3">
          <button onClick={onShare} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
            Share
          </button>
          <button onClick={onEdit} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
            Edit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-28">
        {hasPhoto && (
          <div className="mb-6 -mx-4">
            <img src={event.photo} alt={event.title} className="w-full h-[192px] object-cover" style={{
              mask: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)"
            }} />
          </div>
        )}

        <div className="flex flex-col items-center mb-8 animate-[fadeInUp_0.4s_ease]">
          <span className="text-[52px] mb-4">{event.emoji}</span>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--text)] text-center mb-2">
            {event.title}
          </h1>
          <p className="text-[15px] text-[var(--text-tertiary)] tracking-tight text-center">
            {formatEventDateLong(event.eventDate)}
            {event.recurring === "yearly" && <span> · repeats yearly 🔁</span>}
          </p>
          {event.category && event.category !== "personal" && (
            <div className="mt-3 px-3 py-1.5 bg-[var(--surface-secondary)] rounded-[10px] text-[12px] font-medium text-[var(--text-secondary)]">
              {CATEGORIES.find(c => c.value === event.category)?.label}
            </div>
          )}
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
              <CountdownNumber days={days} size="hero" customColor={isToday ? accentColor : undefined} />
              <span className="text-[15px] font-medium tracking-tight text-[var(--text-tertiary)] mt-3">
                days ago
              </span>
            </>
          ) : isToday ? (
            <>
              <span className="text-[20px] font-semibold tracking-tight mb-2" style={{ color: accentColor }}>
                🎉 Today!
              </span>
              <CountdownNumber days={0} size="hero" customColor={accentColor} />
              <span className="text-[15px] font-medium tracking-tight mt-3" style={{ color: accentColor }}>
                days away
              </span>
            </>
          ) : (
            <>
              <CountdownNumber days={days} size="hero" customColor={isToday ? accentColor : undefined} />
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

// ---------- Support Screen ----------
function SupportScreen({ onClose }: { onClose: () => void }) {
  const tiers = [
    { label: "Buy us a coffee", emoji: "☕", amount: "$3" },
    { label: "Send some love", emoji: "💜", amount: "$5" },
    { label: "Become a supporter", emoji: "🌟", amount: "$10" },
  ];

  const features = [
    "More themes & accent colors",
    "Home screen widgets",
    "Shared countdowns with friends",
    "Continued development with no ads ever",
  ];

  return (
    <div className="fixed inset-0 z-40 bg-[var(--background)] flex flex-col animate-[slideUp_0.3s_ease]">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-[var(--border-subtle)]">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text)]">Support</h1>
        <button onClick={onClose} className="text-[17px] font-medium text-[var(--accent)] tracking-tight">
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-8 animate-[fadeInUp_0.4s_ease]">
          <div className="text-[40px] mb-4 text-center">💛</div>
          <h2 className="text-[22px] font-bold tracking-tight text-[var(--text)] text-center mb-3">
            Waiting For is independent
          </h2>
          <p className="text-[15px] text-[var(--text-secondary)] text-center leading-relaxed">
            No ads, no data selling — just a calm app built with care. If it&apos;s helped you look forward to something, consider supporting future updates.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {tiers.map((tier) => (
            <button
              key={tier.amount}
              className="w-full flex items-center justify-between px-4 py-4 rounded-[20px] bg-[var(--surface)] border border-[var(--border)] active:bg-[var(--surface-secondary)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[28px]">{tier.emoji}</span>
                <span className="text-[15px] font-medium text-[var(--text)]">{tier.label}</span>
              </div>
              <span className="text-[14px] font-semibold text-[var(--text-secondary)]">{tier.amount}</span>
            </button>
          ))}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 mb-8">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
            What support enables
          </h3>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="text-[16px] mt-0.5">✓</span>
                <span className="text-[14px] text-[var(--text)]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[14px] text-[var(--text-tertiary)] tracking-tight">
          Thank you for being here. 🌿
        </p>
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
  onSupport,
}: {
  mode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  eventCount: number;
  onClose: () => void;
  onSupport: () => void;
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
          Community
        </p>
        <button
          onClick={onSupport}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] mb-6 active:bg-[var(--surface-secondary)] transition-colors"
        >
          <span className="text-[16px] font-medium text-[var(--text)] flex items-center gap-2">
            <span>💛</span>
            Support Waiting For
          </span>
          <span className="text-[20px]">›</span>
        </button>

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
            <span className="text-[15px] text-[var(--text-tertiary)]">1.1.0</span>
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
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  const filterByCategory = (events: CountdownEvent[]) => {
    if (selectedCategory === "all") return events;
    return events.filter((e) => (e.category || "personal") === selectedCategory);
  };

  const upcoming = filterByCategory(
    events.filter((e) => getDaysRemaining(e.eventDate, e.recurring) >= 0 || e.recurring === "yearly")
  );
  const past = filterByCategory(
    events.filter((e) => getDaysRemaining(e.eventDate, e.recurring) < 0 && e.recurring !== "yearly")
  );
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

          {events.length > 0 && (
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] overflow-x-auto scrollbar-none">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-[10px] text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors ${
                    selectedCategory === "all"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-[10px] text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedCategory === cat.value
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
          )}

          {!loaded ? null : events.length === 0 ? (
            <EmptyState />
          ) : upcoming.length === 0 && past.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center pb-20 px-8 animate-[fadeInUp_0.5s_ease_0.2s_forwards] opacity-0">
              <span className="text-[48px] mb-6 opacity-60">📭</span>
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text)] mb-2">No events here</h2>
              <p className="text-[15px] text-[var(--text-tertiary)] text-center leading-relaxed max-w-[220px]">
                Nothing in this category yet
              </p>
            </div>
          ) : (
            <div className="flex-1 pt-4 pb-12">
              {upcoming.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  isDark={isDark}
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
                      isDark={isDark}
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
            isDark={isDark}
          />
        )}

        {view === "detail" && activeEvent && (
          <DetailScreen
            event={activeEvent}
            isDark={isDark}
            onEdit={() => setView("edit")}
            onDelete={handleDelete}
            onShare={() => setView("share")}
            onClose={() => {
              setView("home");
              setActiveEventId(null);
            }}
          />
        )}

        {view === "share" && activeEvent && (
          <ShareScreen
            event={activeEvent}
            isDark={isDark}
            onClose={() => setView("detail")}
          />
        )}

        {view === "settings" && (
          <SettingsScreen
            mode={mode}
            setThemeMode={setThemeMode}
            eventCount={events.length}
            onSupport={() => setView("support")}
            onClose={() => setView("home")}
          />
        )}

        {view === "support" && (
          <SupportScreen
            onClose={() => setView("settings")}
          />
        )}

        <InstallPrompt />
      </div>
    </div>
  );
}
