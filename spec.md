Goal

Build a mobile app that helps users navigate a university campus outdoors.

Core value
Users can find buildings quickly
Users can see their current location
Users can get a walking route to a destination
2. Scope (strict — don’t expand this)
Included
Outdoor map
Building markers (dorms, library, clinic, etc.)
User location (GPS)
Search for locations
Route from user → destination
Excluded (intentionally)
Indoor navigation
Room-level directions
Real-time crowd data
Complex authentication
3. Users
Primary user
Student on campus trying to find a place
Use cases
“Where is the library?”
“How do I get to the clinic?”
“What’s near me?”
4. Core Features (MVP)
Feature 1 — Map View
Shows campus map
Centers on campus by default
Feature 2 — User Location
Shows current position (blue dot)
Feature 3 — Locations (Pins)
Predefined buildings shown as markers
Feature 4 — Search
User types → sees matching locations
Feature 5 — Navigation
Select location → show route on map
5. User Flow
Main flow
Open app
Map loads centered on campus
User sees their location
User searches “Library”
Selects it
Clicks “Navigate”
Route appears
6. Tech Decisions (locked)
Frontend
Expo React Native (you already have it)
Maps
Mapbox
Data storage (initially)
Local JSON file (don’t overbuild backend yet)

👉 Important:
You do NOT need a backend for MVP.

7. Data Model (simple)

Start with a static file:

locations.json

Example structure:

[
  {
    "id": "1",
    "name": "Library",
    "latitude": 40.123,
    "longitude": -74.123,
    "category": "academic"
  },
  {
    "id": "2",
    "name": "Dorm A",
    "latitude": 40.124,
    "longitude": -74.125,
    "category": "housing"
  }
]
8. Phases (execution plan)
Phase 1 — Map Foundation (Day 1–2)
Goal

Map renders correctly

Tasks
Install Mapbox
Add access token
Display map
Center on campus coordinates
Done when:
App opens → map visible
Phase 2 — User Location (Day 2–3)
Goal

Show where the user is

Tasks
Request location permission
Display user location on map
Done when:
You see your position on the map
Phase 3 — Locations (Day 3–4)
Goal

Show campus buildings

Tasks
Create locations.json
Add 5–10 buildings
Render markers on map
Done when:
Pins appear for buildings
Phase 4 — Search (Day 4–5)
Goal

User can find locations

Tasks
Add search input
Filter locations list
Show results
Done when:
Typing “Library” shows correct result
Phase 5 — Navigation (Day 5–7)
Goal

Show route to destination

Tasks
Get user location
Get selected destination
Call Mapbox Directions API
Draw route line on map
Done when:
Route appears visually
Phase 6 — Basic UX (Day 7–8)
Goal

Make it usable

Tasks
Add “Navigate” button
Auto-zoom to route
Show distance/time (optional)
9. Setup Process (clear steps)
Step 1 — Install Mapbox

In your project:

npm install @rnmapbox/maps
Step 2 — Add your token
Paste your Mapbox token into config
Step 3 — Permissions
Enable location permissions in Expo
Step 4 — Test on real device

👉 Emulator location is unreliable
Use your phone

10. Risks (real ones)
1. You overcomplicate early

Fix:

Stick to phases
Don’t jump ahead
2. Bad location data

Fix:

Manually verify coordinates
3. Routing confusion

Fix:

Start simple: just draw line from API
11. What you’re currently underestimating
1. Data collection

You need to:

Find coordinates for each building
This is manual work
2. Mapbox setup friction

It’s not plug-and-play
Expect small issues

3. State management

Handling:

Selected location
Current location
Route

Keep it simple.

12. Clean architecture (simple)

Keep everything in frontend:

components/MapView
data/locations.json
utils/api.js (for routing)
13. Definition of “Done”

Your app is done when:

Map loads
User location shows
User can search
User selects a place
Route is displayed

Anything beyond that = extra.

14. Next step (do this now)

Start Phase 1 only:

Install Mapbox
Render map

Then stop.