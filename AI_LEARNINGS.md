# AI_LEARNINGS

Date: 2026-03-27
Issue: AI_LEARNINGS.md was missing at the start of the project.
Root Cause: First time running the /architect workflow on a fresh project without the manual memory file creation step completed.
Fix: Created the file automatically to establish the continuous learning external brain.
New Rule: Always verify and create AI_LEARNINGS.md if it does not exist at the start of a project.

Date: 2026-03-28
Issue: TypeError: Network request failed when fetching buildings in Android app.
Root Cause: Default API URL was set to localhost:3000, which points to the Android device itself rather than the host computer.
Fix: Created .env file in Campus-map/ directory specifying EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 for Android emulator.
New Rule: Always configure EXPO_PUBLIC_API_URL in .env using 10.0.2.2 for Android emulators and host machine IP for physical devices.
Date: 2026-03-28
Issue: Feature Implementation - Map Boundaries and Markers matching web-admin view.
Root Cause: User requested parity between web-admin map editor (which shows drawn zone footprints and emoji markers) and the React Native map (which previously only showed pin markers using Ionicons).
Fix: Added Polygon rendering to `CampusMap.tsx` by converting backend `rectX, rectY, rectWidth, rectHeight` metrics to corresponding GPS coordinate polygons in the `api.ts` transformation step. Replaced Ionicons markers with simple text emojis inside styled white circles using `loc.icon` to mirror the web's design.
New Rule: When mirroring web overlays in React Native Maps, convert generic coordinate spaces (e.g. percentages) to GPS coordinates and utilize MapView Polygon/Polyline overlays to ensure precise parity on the mobile map surface.

Date: 2026-03-28
Issue: Blank grey space appearing around the React Native map layout and Web Admin map.
Root Cause: In react-native-maps, mapType="none" prevents the base tiles from rendering, leaving the default MapView background color (grey/blank) outside of image overlays. In the Web Admin, the flex container had a grey background (`bg-slate-200`) which caused empty space around the aspect-ratio map div.
Fix: Changed `mapType="none"` to `"standard"` in `CampusMap.tsx` and modified Web Admin map container background to `bg-white`.
New Rule: Always ensure MapView `mapType` is "standard" or styled instead of "none" when using partial Image Overlays to prevent the grey empty void from replacing the base map.

Date: 2026-03-28
Issue: SafeAreaView 'edges' prop not recognized.
Root Cause: Imported SafeAreaView from 'react-native' instead of 'react-native-safe-area-context'.
Fix: Changed the import source to 'react-native-safe-area-context'.
New Rule: Always import SafeAreaView from 'react-native-safe-area-context' when using advanced layout props like 'edges'.

Date: 2026-03-28
Issue: Expo Router literal path type mismatch for queries.
Root Cause: Using literal strings with query params (e.g., '/?id=1') can fail TypeScript validation if not defined in the typed routes.
Fix: Used the object syntax for router.push: router.push({ pathname: '/', params: { id: 1 } }).
New Rule: Prefer the object syntax for router.push when passing parameters to ensure stronger typing and avoid route resolution errors.

Date: 2026-03-28
Issue: Modal content truncated or non-functional.
Root Cause: ScrollView was missing from imports, causing content to be cut off or crashing the view when used in a Modal.
Fix: Added ScrollView to the 'react-native' imports.
New Rule: Always ensure ScrollView is imported and used inside Modals that contain dynamic or long content to prevent it from being non-interactable.

Date: 2026-03-28
Issue: useState not defined in screen component.
Root Cause: Adding state hooks to a file without adding 'useState' to the React imports.
Fix: Added useState to the 'react' imports.
New Rule: When adding state to an existing component, remember to update the React import to include 'useState'.
