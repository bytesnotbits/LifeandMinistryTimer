# Knowledge Base

Capture what the Ministry Timer app does and what it is expected to do.

## 1. Project Overview

- App name: Ministry Timer
- Purpose: Manage and run timed segments for Life and Ministry style meetings.
- Primary UI files: `index.html`, `styles.css`
- Primary logic files: `lifeMinistryTimer.js`, `render.js`, `newFeatures.js`

## 2. Core Functional Expectations

Document behavior in terms of user outcomes.

### 2.1 Timer Control
- Start, pause, and reset timer behavior is deterministic.
- Display updates at expected intervals.
- Timer state should not desync from UI controls.

### 2.2 Program/Segment Management
- Users can create/edit schedule segments.
- Segment durations drive timer targets.
- Each card provides a title-level pencil action that opens inline card editing.
- Card reordering uses drag-and-drop when timer is stopped and no inline editor is open.
- Card removal is available when timer is stopped.

### 2.3 State Persistence
- Relevant user state persists across refresh when expected.
- Reset/clear flows remove persisted state that should not survive reset.

### 2.4 Rendering and UI Sync
- UI reflects the current application state after initialization.
- Inline editing state tracks a single active card editor (`editingPartIndex`).
- Duration edits for the active part can be saved while timer is running and should update countdown/progress immediately.

## 3. State Model (High-Level)

Use this section to track the source of truth for each major state key.

- In-memory state: managed in JavaScript modules.
- Persisted state: browser `localStorage` (keys to be documented as discovered).
- Derived UI state: classes/styles rendered from state.

## 4. Known Constraints and Assumptions

- Single-page app with direct DOM manipulation.
- No backend persistence currently documented.
- Browser compatibility assumptions should be validated and listed here.

## 5. Local Development and Live Preview

- Start local server from project root:
  - `cd /home/vibecoding/MinistryTimer/LifeandMinistryTimer`
  - `python3 -m http.server 8000`
- Open in browser:
  - `http://localhost:8000/index.html`
- During development:
  - Save code changes and refresh browser.
  - Use hard refresh (`Ctrl+Shift+R`) if stale assets are cached.

## 6. Open Questions

- Which exact `localStorage` keys are currently in use?
- Which features are fully implemented vs partially implemented in `newFeatures.js`?
- Are there expected audible alerts, visual alerts, or both when timers expire?

## 7. Change Log for Behavior (Knowledge-Level)

- 2026-03-01: Edit mode toggle visual feedback and persistence confirmed in README notes.
- 2026-03-01: Added local development instructions for live browser preview via `python3 -m http.server 8000`.
- 2026-03-01: Edit mode can now be toggled while timer is active so part duration can be edited live.
- 2026-03-01: Replaced global edit toggle UI with per-card pencil edit action.
- 2026-03-01: Replaced modal-based card edits with inline card editing and restored remove/reorder controls (disabled during active timing).
- 2026-03-01: Replaced arrow-based reordering with drag-and-drop reordering.
