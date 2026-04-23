# AI_LEARNINGS.md

Date: 2026-03-28
Issue: TypeScript error when passing nullable website URL to window.open in Web Admin.
Root Cause: window.open expects string | URL, but building.website was optional/nullable.
Fix: Applied non-null assertion or fallback empty string.
New Rule: Always provide a fallback string or check availability before passing optional URL properties to window.open.

Date: 2026-03-28
Issue: Campus Map showed a grey void instead of Google Maps base layers.
Root Cause: mapType property was accidentally set to "none" during a previous refactor.
Fix: Restored mapType="standard" in MapView component.
New Rule: Verify mapType settings when troubleshooting map rendering issues in React Native Maps.

Date: 2026-03-28
Issue: New building footprints were not saving via the Web Admin dashboard.
Root Cause: The POST API route was missing field destructuring for rectX, rectY, rectWidth, and rectHeight.
Fix: Updated the API route to include and persist zone-drawing coordinates.
New Rule: Ensure all frontend drawing metadata is explicitly handled in the backend ORM create/update calls.
