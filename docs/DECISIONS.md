# Decisions Log

Track important decisions that explain *why* the code changed.

## Entry Template

```md
## DEC-###: Short Decision Title
- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Superseded
- Related files: path/file1, path/file2
- Context:
- Decision:
- Consequences:
- Validation:
  - Manual checks:
  - Risks:
- Supersedes: DEC-### (optional)
```

## Entries

## DEC-001: Persist edit mode toggle state
- Date: 2026-03-01
- Status: Accepted
- Related files: `lifeMinistryTimer.js`, `render.js`, `styles.css`, `ReadMe.md`
- Context:
  - Edit mode toggle needed clear visual state and continuity after refresh.
- Decision:
  - Persist edit mode state in `localStorage` and initialize UI from stored value.
  - Ensure clear/reset action clears edit mode persistence to avoid stale state.
- Consequences:
  - Better UX consistency.
  - Added dependency on persisted browser state.
- Validation:
  - Manual checks:
    - Toggle edit mode on/off and verify visual class updates immediately.
    - Refresh page and verify toggle state remains accurate.
    - Clear all data and verify edit mode resets.
  - Risks:
    - Future state migrations may need versioning if key names change.

## DEC-002: Allow edit mode while timer is active
- Date: 2026-03-01
- Status: Superseded
- Related files: `lifeMinistryTimer.js`, `render.js`
- Context:
  - Editing part durations during active timing was blocked by the edit mode guard.
- Decision:
  - Remove the `isRunning` gate from `toggleEditMode()` so users could open edit mode while a timer is running.
  - Keep timer loop running; duration comparisons continue using the current `meetingParts[activePart].duration`.
- Consequences:
  - Users could adjust active-part duration without stopping timing.
- Validation:
  - Manual checks:
    - Start timer, enable edit mode, open active part, change duration, save.
    - Confirm countdown/progress updates immediately and timer keeps running.
  - Risks:
    - Entering edit mode while running could cause repeated end-sound triggers if duration is reduced below elapsed time.

## DEC-003: Replace global edit toggle with per-card edit action
- Date: 2026-03-01
- Status: Accepted
- Related files: `index.html`, `render.js`, `lifeMinistryTimer.js`
- Context:
  - Editing should be quick and card-specific without switching app-wide modes.
- Decision:
  - Remove the header-level edit mode toggle from UI.
  - Add a small pencil action on each card title to open edit for that card only.
  - Allow `edit-part` action and `editPart()` regardless of `isEditMode`.
  - Reset legacy persisted `isEditMode` state to prevent stale mode behavior.
- Consequences:
  - Faster workflow for on-the-fly title/speaker/duration edits.
- Validation:
  - Manual checks:
    - Click title pencil on any card and verify card editing opens for that card.
    - While timer runs, edit duration and verify countdown/progress update without stopping timer.
    - Refresh after prior edit-mode usage and verify app is not stuck in edit-mode rendering.
  - Risks:
    - Requires card-level controls for remove/reorder to fully replace old edit mode UX.

## DEC-004: Use inline card editing with card-level remove/reorder controls
- Date: 2026-03-01
- Status: Accepted
- Related files: `render.js`, `lifeMinistryTimer.js`
- Context:
  - Modal editing slowed quick updates and remove/reorder actions were no longer accessible.
- Decision:
  - Make pencil action open inline edit fields directly inside the selected card.
  - Add per-card controls for move up/down and remove.
  - Allow inline detail edits while timer is running.
  - Disable remove/reorder while timer is running to avoid mutating part structure during active timing.
  - Reindex elapsed/comment data when removing or reordering parts so timing history stays aligned.
- Consequences:
  - Faster in-context edits with less context switching.
  - Structure changes require timer stop, but content edits can happen live.
- Validation:
  - Manual checks:
    - Edit title/speaker/duration inline and save.
    - Reorder parts up/down while timer is stopped and verify timing/comment data follows the moved part.
    - Remove a part while timer is stopped and verify indexes and active part remain valid.
    - Confirm remove/reorder controls are disabled while timer runs.
  - Risks:
    - Inline inputs increase card complexity and need mobile-layout verification.
- Supersedes: DEC-002

## DEC-006: Add sticky global meeting timer bar with scheduled start
- Date: 2026-03-01
- Status: Accepted
- Related files: `index.html`, `styles.css`, `render.js`, `lifeMinistryTimer.js`
- Context:
  - Users should be able to schedule a meeting start and end time and have a persistent visual
    indicator of overall meeting progress without manually starting the timer.
  - There is no separate "start" control for the bar; it must auto-activate when the scheduled
    start time arrives and stop only when the user clicks an explicit "End Meeting" button.
- Decision:
  - Introduce a scheduler section in the UI with datetime inputs and a schedule button.
  - Persist scheduled start/end (and actual end) in `localStorage` so reloads retain the state.
  - Display a sticky global timer bar at the top of the app that becomes visible when a schedule
    exists and updates continuously from scheduled start to end. The bar's progress and elapsed
    time are computed automatically; the user only interacts to schedule or end the meeting.
  - Implement state methods (`scheduleMeeting`, `startMeeting`, `endMeeting`) and an interval that
    checks for automatic start and updates the bar every 100 ms.
- Consequences:
  - Facilitates meetings where timing should begin at a predetermined clock time.
  - The global bar coexists with per-part timers and does not interfere with existing functionality.
- Validation:
  - Manual checks:
      - Enter start/end times in the past/future and verify the bar appears and begins progressing
        at the correct moment.
      - Reload the page before and after the scheduled start and ensure the bar resumes correctly.
      - Click "End Meeting" and confirm the bar stops, the button hides, and the state persists.
      - Clear data and verify schedule and bar reset.
  - Risks:
      - Timezone/format issues with `datetime-local` inputs; inputs are parsed as local time.
      - Sticky bar layout may interact with mobile scrolling and needs testing.

## DEC-005: Replace arrow-based reorder with drag-and-drop
- Date: 2026-03-01
- Status: Accepted
- Related files: `render.js`, `lifeMinistryTimer.js`, `styles.css`
- Context:
  - Up/down arrow reordering was less clear for users than direct manipulation.
- Decision:
  - Remove up/down reorder actions.
  - Enable drag-and-drop reordering when timer is stopped and no inline editor is open.
  - Keep reordering disabled during active timing to protect live timer/comment index integrity.
- Consequences:
  - Cleaner and more intuitive card reordering.
  - Reordering is intentionally unavailable while timing is active.
- Validation:
  - Manual checks:
    - Drag a card to a new position and verify the order updates.
    - Confirm drop zones appear only when timer is stopped and no inline editor is open.
    - Confirm reordering is disabled while timer runs.
  - Risks:
    - Drag-and-drop affordance may need additional mobile testing for touch behavior.
