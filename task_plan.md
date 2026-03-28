# Task Plan

## Goal
Replicate the look, design, features, and tabs from `styleprd.md` into the Campus-map React Native app, without touching the map size or unrelated logic.

## Phases

### 1. Research & Analysis
- [ ] Analyze `styleprd.md` and define exact UI additions.
- [ ] Review current `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `components/CampusMap.tsx`.
- [ ] Investigate how to implement the custom bottom tabs (Map, Notices, Search).

### 2. Update Tab Navigation (BottomNavBar)
- [ ] Replace `index.tsx`, `profile.tsx`, `settings.tsx` with `index.tsx` (Map), `notices.tsx`, `search.tsx`.
- [ ] Implement the styling for the bottom tabs matching the floating backdrop blur design.

### 3. Build UI Overlays on Map (HomeScreen)
- [ ] Top App Bar (Header with title, hamburger, portrait).
- [ ] Floating Filter Chips (Academics, Libraries, Dining).
- [ ] Find My Location FAB (Floating Action Button).
- [ ] Active Info Card Component (Example: Radcliffe Camera placeholder structure).

### 4. Create Notice Board & Search Discover Screens
- [ ] Build `notices.tsx` using `styleprd.md` design.
- [ ] Build `search.tsx` using `styleprd.md` design.

### 5. Drawer / Sidebar
- [ ] Implement a Custom Drawer or Modal for the Sidebar menu.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

