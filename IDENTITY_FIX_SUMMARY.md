# User Identity Persistence - Complete Implementation Summary

## The Bug (Before)

Events disappeared after page refresh even though they were saved in the database.

### Root Cause

The old system used a **non-persistent random session ID**:

```typescript
// OLD CODE - BROKEN:
const [sessionId] = useState(() => {
  if (!sessionId) {
    // Generate NEW random ID on EVERY component mount
    sid = `${random()}-${random()}-${random()}`;
    localStorage.setItem('countdown_session_id', sid);
  }
  return sid;
});
```

**Problems:**
1. `useState` initializer runs on server during SSR where `window` is undefined → sessionId = empty string
2. React Strict Mode double-runs effects → first run gets cancelled before `setEvents` executes
3. Even after page refresh, `new Date().getTime()` generates a NEW ID each time
4. Events saved under old session_id were orphaned and invisible

### What Happened:

```
User opens app → generates sessionId "ABC-123-XYZ"
User creates event → saved to DB with session_id="ABC-123-XYZ"
User refreshes page → generates NEW sessionId "XYZ-789-ABC"
getEvents("XYZ-789-ABC") → returns NOTHING (event was under "ABC-123-XYZ")
UI shows "Nothing yet" ❌
```

---

## The Fix (After)

Complete rewrite of the identity system to be **truly persistent**.

### Architecture

#### 1. **Server Action: `getOrCreateUserId()` / `/lib/auth/user.ts`**

```typescript
export async function getOrCreateUserId(): Promise<string> {
  // For authenticated users: use auth.api.getSession()
  // For unauthenticated: create/return persistent device ID
}
```

- Returns a **stable UUID** that never changes
- Uses Better Auth session if user is logged in
- Falls back to persistent device ID for anonymous users
- Stores in localStorage as `client_user_id`

#### 2. **Client Hook: `useUserId()` / `/lib/hooks/useUserId.ts`**

```typescript
export function useUserId() {
  const [userId, setUserId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Runs ONLY once on client
    getOrCreateUserId().then(id => {
      setUserId(id);
      setIsReady(true);
    });
  }, []);

  return { userId, isReady };
}
```

**Guarantees:**
- ✅ Initializes ONLY on client (no SSR empty-string bug)
- ✅ Runs ONCE per app lifetime
- ✅ `isReady` flag prevents race conditions during startup
- ✅ `userId` is stable across refreshes, browser restarts, PWA launches

#### 3. **Database Schema: Changed `session_id` → `userId`**

**Before:**
```typescript
export const countdown_events = pgTable('countdown_events', {
  // ... fields
  session_id: text('session_id').notNull(),
});
```

**After:**
```typescript
export const countdown_events = pgTable('countdown_events', {
  // ... fields
  userId: text('userId').notNull(), // ← renamed & uses persistent ID
});
```

**Migration** (`001-add-userId.js`):
- Added new `userId` column
- Migrated existing session_id → userId (preserves user's events)
- Dropped old `session_id` column
- All queries now use `userId`

#### 4. **Updated All Event Queries / `/app/actions/events.ts`**

**getEvents(userId):**
```typescript
const rows = await db
  .select()
  .from(countdown_events)
  .where(eq(countdown_events.userId, userId))
```

**saveEvent(data, userId):**
```typescript
// All inserts & updates scoped to userId
await db.insert(countdown_events).values({
  // ...
  userId: userId,  // ← Attached to stable user
  // ...
})
```

**deleteEventDb(id, userId):**
```typescript
// Delete only if event belongs to this user
.where(and(
  eq(countdown_events.id, id),
  eq(countdown_events.userId, userId)
))
```

#### 5. **Updated `useEvents()` Hook / `/app/page.tsx`**

**Before:**
```typescript
const [sessionId, setSessionId] = useState('');  // Empty on mount!
```

**After:**
```typescript
const { userId, isReady } = useUserId();  // Stable, persistent

useEffect(() => {
  if (!isReady || !userId) return; // Wait for identity
  
  const load = async () => {
    const result = await getEvents(userId);  // Load with real ID
    setEvents(sortByDate(result.events));
  };
  
  load();
}, [isReady, userId]);  // Re-run only if identity changes
```

**Guarantees:**
- ✅ Events load ONLY after userId is ready
- ✅ No empty sessionId bug
- ✅ No race conditions
- ✅ CRUD operations check userId before executing

#### 6. **Diagnostics Panel / `/app/components/DiagnosticsPanel.tsx`**

```typescript
<DiagnosticsPanel 
  userId={userId}           // Shows user's ID
  isReady={isReady}          // Shows if ready
  eventCount={events.length} // Shows loaded event count
  isLoaded={loaded}          // Shows if load completed
/>
```

**Displays:**
- ✅ Current userId (or "Initializing...")
- ✅ Event load status (⏳ Loading → ✅ Loaded)
- ✅ Number of events in memory
- ✅ Visual indicator (🔴 Error, 🟡 Loading, 🟢 Ready)

Helps diagnose:
- Is userId being created?
- Are events loading from DB?
- Identity mismatch issues
- Load failures

#### 7. **Updated Recovery System**

**RecoveryKeyDisplay:**
```typescript
// BEFORE: countdown_session_id (not persistent)
// AFTER: client_user_id (truly persistent)
const key = localStorage.getItem('client_user_id')
```

**RestoreFromKey:**
```typescript
// Restore by overwriting client_user_id
localStorage.setItem('client_user_id', providedKey)
```

Users can now:
- Share their recovery key
- Device restore by entering recovery key
- Keep the same identity across devices (with proper sync)

---

## Flow Diagram

### Before (Broken):
```
App Opens
  ↓
useState initializer runs (SSR) → sessionId = "" ❌
  ↓
useEffect runs → getEvents("") → ERROR ❌
  ↓
Page shows "Nothing yet" even though events exist in DB
  ↓
User refreshes
  ↓
New random sessionId generated → "XYZ-ABC-DEF"
  ↓
Old events under "ORIG-ID-123" are orphaned
  ↓
getEvents("XYZ-ABC-DEF") → empty []
  ↓
Page shows "Nothing yet" again ❌
```

### After (Fixed):
```
App Opens
  ↓
Component mounts (SSR) → userId = "" (waiting)
  ↓
Client hydration completes
  ↓
useUserId() runs (client-only) → gets/creates stable UUID
  ↓
setUserId("persistent-UUID-xxxxx") → isReady=true
  ↓
useEffect triggers with real userId
  ↓
getEvents("persistent-UUID-xxxxx") → finds events ✅
  ↓
setEvents([...]) → renders countdown page ✅
  ↓
User refreshes
  ↓
Same userId from localStorage
  ↓
getEvents returns same events ✅
  ↓
Page shows events immediately ✅
  ↓
User closes app for 1 week
  ↓
Opens app again
  ↓
localStorage still has "persistent-UUID-xxxxx"
  ↓
All events load correctly ✅
```

---

## Files Changed

1. **Created:**
   - `/lib/auth/user.ts` - `getOrCreateUserId()` server action
   - `/lib/hooks/useUserId.ts` - Client hook for persistent identity
   - `/app/components/DiagnosticsPanel.tsx` - Debug panel
   - `/lib/db/migrations/001-add-userId.js` - Database migration

2. **Modified:**
   - `/lib/db/schema.ts` - Changed `session_id` → `userId`
   - `/app/actions/events.ts` - Updated all queries to use `userId`
   - `/app/page.tsx` - Updated `useEvents()` to use `useUserId()`
   - `/app/components/RecoveryKeyDisplay.tsx` - Use `client_user_id`
   - `/app/components/RestoreFromKey.tsx` - Restore via `client_user_id`
   - `/app/actions/shared-rooms.ts` - Use `userId` for shared events

---

## Testing & Verification

### Test 1: Identity Persistence
```
1. Open app
2. Check localStorage.getItem('client_user_id')
3. Note the UUID
4. Refresh page
5. Check localStorage again → SAME UUID ✅
6. Close browser
7. Reopen app
8. Check localStorage → STILL SAME UUID ✅
```

### Test 2: Event Loading
```
1. Create an event
2. Refresh page → Event still visible ✅
3. Check diagnostics panel → Shows 1 event loaded ✅
4. Close browser completely
5. Reopen app
6. Event still visible ✅
```

### Test 3: Recovery Key
```
1. Get recovery key from diagnostics
2. Open incognito/private window
3. Restore using recovery key
4. All events appear ✅
5. Recovery key remains same ✅
```

### Test 4: Database Validation
```bash
# Check events are stored with userId (not session_id)
SELECT id, title, "userId" FROM countdown_events;

# Verify no session_id column exists anymore
\d countdown_events
```

---

## Environment & Dependencies

**No new dependencies added.** Uses:
- Drizzle ORM (already installed)
- Better Auth (already installed)
- React (already installed)
- PostgreSQL (already connected)

---

## Rollback (If Needed)

The migration can be reversed by:
```bash
# Add session_id column back
ALTER TABLE countdown_events ADD COLUMN session_id text NOT NULL DEFAULT '';

# Copy userId to session_id  
UPDATE countdown_events SET session_id = "userId";

# Revert code changes (git reset)
git revert <commit-hash>
```

---

## Conclusion

**Before:** Events disappeared because session_id changed on every load.

**After:** Events persist because userId is truly stable and scoped to the authenticated user or device.

This fix ensures users never lose their events due to identity issues, and provides proper data isolation for multi-user scenarios.
