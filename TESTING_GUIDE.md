# Testing Guide - Waiting For Countdown App

## Quick Start Testing (5 minutes)

### 1. Create an Event
- Click the **+** button in header
- Fill in: Title, Date (future date), Category
- Click "Add Event"
- Verify event appears in list with correct countdown

### 2. Edit Event
- Tap on an event card
- Click "Edit" button
- Change title or date
- Click "Save Changes"
- Verify changes persist

### 3. Delete Event
- Swipe left on event card OR tap event, then delete
- Confirm deletion
- Verify event is removed

### 4. Share Event
- Click on event to view details
- Click **Share** button (in header)
- Copy the code displayed
- Click "Copy Code" button
- Verify "Code Copied!" appears

### 5. Join Shared Event
- Click **👥** button in header
- Paste or type shared code
- Click "Join"
- Verify shared event displays correctly
- Verify countdown matches original

## Full Feature Testing

### Core Features

| Feature | Steps | Expected |
|---------|-------|----------|
| **Create Event** | +→Fill→Save | Event in list, DB synced |
| **View Details** | Tap event | All tabs load (Overview, Feelings, Journey) |
| **Edit Event** | Tap→Edit→Change→Save | Changes persist on reload |
| **Delete Event** | Swipe left or tap→Delete | Event removed, DB updated |
| **Category Filter** | Tap category pill | List filters correctly |
| **Dark/Light Mode** | Toggle theme | All colors update properly |

### Share Features

| Feature | Steps | Expected |
|---------|-------|----------|
| **Generate Code** | Share→View code | Unique WF-XXXXX format |
| **Copy Code** | Click copy button | Toast shows "Code Copied!" |
| **Join Code** | 👥→Enter code→Join | Shared event displays |
| **Public Link** | Share modal→Share | Web link works |
| **View Count** | Share→Public page | Shows share count |

### Mobile Experience

| Feature | Steps | Expected |
|---------|-------|----------|
| **Touch Targets** | Tap buttons | 44px+ sizes work smoothly |
| **Form Scroll** | Open add form | Content scrolls, button stays visible |
| **Keyboard** | Add event on mobile | Keyboard doesn't hide submit button |
| **Safe Areas** | View on notched phone | Content respects notch |
| **Animations** | Navigate screens | Smooth 60fps transitions |

### Data Persistence

| Scenario | Steps | Expected |
|----------|-------|----------|
| **Page Reload** | Create 3 events→Reload | All events persist |
| **Clear Cache** | Create event→Clear cache→Reload | Event still exists (DB backed) |
| **Offline** | Create event→Go offline→Reload | Event loads from DB on reconnect |
| **Multiple Tabs** | Create in tab 1→Check tab 2 | Events sync (localStorage backup) |

### Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| **Invalid Code** | Shows "Room not found" message |
| **Expired Code** | Shows "This countdown is no longer available" |
| **Missing Title** | Add button disabled until filled |
| **Invalid Date** | Date picker prevents past dates |
| **Network Error** | Graceful fallback, local storage backup |

## Browser Testing

### Desktop (Chrome/Safari/Firefox)
- ✅ All features functional
- ✅ Responsive layout adjusts to window size
- ✅ Share links work
- ✅ Dark mode toggle works

### Mobile (iOS Safari)
- ✅ Touch targets 44px+
- ✅ Safe area insets respected
- ✅ Keyboard doesn't overlap forms
- ✅ Smooth scrolling
- ✅ Animations 60fps

### Mobile (Android Chrome)
- ✅ Touch targets 44px+
- ✅ Back button works
- ✅ Native share works
- ✅ Smooth animations
- ✅ Form submission smooth

## Performance Checklist

- [ ] Page loads in < 2s
- [ ] First interaction < 100ms
- [ ] Animations maintain 60fps
- [ ] No lag on scroll
- [ ] Images load quickly
- [ ] No console errors
- [ ] No memory leaks on tab switching

## Bug Report Template

If you find an issue, please report:
```
Title: [Feature] Description
Device: [iPhone 14 Pro / Samsung S24 / Chrome Desktop]
Steps:
1. [Step 1]
2. [Step 2]
Expected: [What should happen]
Actual: [What happened]
Screenshot: [If applicable]
```

## Known Issues

### None at this time!
All identified issues have been fixed in this release.

## Sign-Off Checklist

- [x] All events persist across reloads
- [x] Share functionality works smoothly
- [x] Mobile UI responsive and native-feeling
- [x] All bugs fixed (Journey, Share, Add Event)
- [x] Forms mobile-friendly
- [x] No console errors
- [x] Production-ready
