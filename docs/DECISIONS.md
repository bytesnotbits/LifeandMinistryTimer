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

## DEC-007: Surface comment context on each part and group history by part
- Date: 2026-03-07
- Status: Accepted
- Related files: `render.js`, `index.html`
- Context:
  - Comment details were only visible in a single mixed list at the bottom of the app.
  - Users needed to scroll away from part cards to understand comment activity per part.
- Decision:
  - Add per-part comment stats directly on cards for parts with comments enabled:
    - total comment count,
    - average comment duration.
  - Change bottom comment history rendering from a flat list to grouped sections by part.
  - Keep existing global totals/average in the comment section.
- Consequences:
  - Users can view comment performance at the card level without leaving the current part context.
  - Comment history remains available but is easier to scan by part.
- Validation:
  - Manual checks:
    - Add comments to at least two parts and verify separate grouped sections in history.
    - Verify each comments-enabled part card shows updated count and average after add/delete actions.
    - Refresh page and verify grouped history and part stats match persisted comments.
  - Risks:
    - Group headings rely on part indexes; unknown/deleted part data should still render safely via fallback labels.

## DEC-008: Auto-hide top-right fixed controls based on scroll direction
- Date: 2026-03-07
- Status: Accepted
- Related files: `styles.css`, `newFeatures.js`, `index.html`
- Context:
  - The fixed top-right controls (theme, sound, shortcuts) remained visible at all times.
  - When the page is scrolled, these controls can overlap the sticky global meeting timer area.
- Decision:
  - Add scroll-direction behavior for the three fixed top-right controls:
    - hide controls when user scrolls downward,
    - reveal controls when user scrolls upward.
  - Keep controls visible at the top of the page (`scrollY <= 0`).
  - Use a small movement threshold to avoid flicker from tiny scroll jitter.
  - Apply a short hide delay so brief downward flicks do not immediately dismiss controls.
- Consequences:
  - Reduces overlap with sticky timer content during upward scrolling.
  - Controls remain discoverable by scrolling down.
- Validation:
  - Manual checks:
    - Scroll down and verify controls slide out of view.
    - Scroll up and verify controls reappear.
    - Return to page top and verify controls are visible again.
  - Risks:
    - On very short pages with little scroll movement, hide/reveal may be less noticeable.

## DEC-009: Make the live timer state glanceable
- Date: 2026-06-15
- Status: Accepted
- Related files: `index.html`, `render.js`, `programCockpit.js`, `styles.css`
- Context:
  - The app already had a sticky active timer area and run dashboard, but users needed clearer feedback about current part status, remaining time, overtime, and what comes next.
- Decision:
  - Add active-part status states (`Ready`, `Running`, `Closing`, `Paused`, `Over by ...`) to the sticky panel, part cards, and run dashboard.
  - Show the next part in the sticky current-part panel and enrich the run dashboard with remaining time, meeting pace, and completed-part count.
  - Preserve the existing focused meeting workspace instead of adding a new screen.
- Consequences:
  - The live meeting view is easier to scan during active use.
  - Rendering now shares timing-state helpers between card rendering and the program cockpit.
- Validation:
  - Manual checks:
    - Start, pause, and resume an active part and verify status labels update.
    - Let a part reach closing/overtime and verify color/state cues update in the sticky panel, card, and run dashboard.
    - Advance to the next part and verify next-part preview changes.
  - Risks:
    - Additional live labels must remain readable on narrow screens and in dark mode.

## DEC-010: Add cockpit import readiness and review handoff
- Date: 2026-06-15
- Status: Accepted
- Related files: `index.html`, `programCockpit.js`, `styles.css`, `tests/importer-fixtures.test.cjs`
- Context:
  - Importing a weekly program left users without a concise signal about whether inferred timings needed review.
  - The WOL reader fallback URL was malformed, reducing the chance that URL import could recover through Jina Reader.
- Decision:
  - Add an import readiness summary with part count, planned duration, inferred timing count, and comment-enabled part count.
  - Switch to the review tab after successful import so users immediately inspect parsed timing.
  - Build Jina Reader fallback URLs by prefixing `https://r.jina.ai/` exactly once.
- Consequences:
  - Program setup has a clearer “import -> review -> run” flow.
  - Users can quickly spot inferred timings before starting a live meeting.
- Validation:
  - Manual checks:
    - Import sample text and verify the review tab opens with a readiness summary.
    - Confirm inferred timing count is visible when parsed parts use defaults.
    - Try URL import fallback path when direct fetch is blocked.
  - Risks:
    - Automatic review handoff may surprise users who expected to remain on the prepare tab after import.

## DEC-011: Turn program review into a timing pre-flight check
- Date: 2026-06-15
- Status: Accepted
- Related files: `programCockpit.js`, `styles.css`
- Context:
  - The review tab showed per-part timing, but it did not summarize meeting readiness or call out imported vs suggested timing clearly.
- Decision:
  - Add planned total, actual total, meeting variance, and suggested-time count above the review table.
  - Add imported/suggested time badges and compact section/note context to each review row.
- Consequences:
  - Users can quickly identify whether timing needs attention before running the meeting.
  - The review tab becomes useful both before the meeting and after timing data exists.
- Validation:
  - Manual checks:
    - Import sample program and verify review summary appears above the table.
    - Import or parse a program with inferred durations and verify suggested-time badges/counts appear.
    - Run part timers and verify actual/variance values remain readable.
  - Risks:
    - More review table content may require horizontal care on narrow screens.

## DEC-012: Add review-to-live handoff actions
- Date: 2026-06-15
- Status: Accepted
- Related files: `programCockpit.js`, `styles.css`, `index.html`, `lifeMinistryTimer.js`, `render.js`, `newFeatures.js`
- Context:
  - After import and review, users needed a clear next action to return to the live meeting workspace or start the current part.
- Decision:
  - Add `Focus Live View` and current-part start/pause actions to the review dashboard.
  - Reuse existing timer state actions so review controls stay synchronized with the main live timer UI.
  - Bump the app version to 3.6.9.
- Consequences:
  - The cockpit flow now supports import -> review -> run without hunting for controls.
  - Review can start or pause the current part, so it must preserve existing timer safeguards.
- Validation:
  - Manual checks:
    - Import a program and use `Focus Live View` to scroll to the run workspace.
    - Use the review start/pause action and verify sticky timer, active card, and dashboard states stay synchronized.
    - Verify version displays as 3.6.9.
  - Risks:
    - Duplicate start/pause controls could be confusing if labels drift from run dashboard labels.

## DEC-013: Make inline card editing live-safe
- Date: 2026-06-16
- Status: Accepted
- Related files: `lifeMinistryTimer.js`, `render.js`, `index.html`, `styles.css`, `newFeatures.js`
- Context:
  - Inline editing already preserved drafts during live timer refreshes, but typing punctuation into names/speakers could break rendered input attributes.
  - Saving invalid durations was too forgiving, and keyboard users needed a faster commit/cancel path during live meetings.
- Decision:
  - Escape inline editor display and input values before rendering them into HTML.
  - Focus and select the part name when opening an inline editor.
  - Support `Esc` to cancel, `Ctrl+Enter` to save, and `Enter` from the duration field to save.
  - Validate required part names and 1-180 minute durations before committing edits, returning focus to the field needing attention.
  - Bump the app version to 3.7.0.
- Consequences:
  - Live edits are less likely to lose typed content or commit surprising values.
  - Keyboard-first editing is quicker without changing the existing button workflow.
- Validation:
  - Manual checks:
    - Open inline editing during a running timer and type part names/speakers containing quotes and apostrophes.
    - Use `Esc`, `Ctrl+Enter`, and duration-field `Enter` and verify the expected cancel/save behavior.
    - Attempt blank names and out-of-range durations and verify focus returns to the problem field.
    - Verify footer version displays 3.7.0.
  - Risks:
    - Attribute escaping now protects inline rendering, but other legacy render paths may still deserve a broader escaping audit.

## DEC-014: Move admin controls into a collapsible left sidebar
- Date: 2026-06-16
- Status: Accepted
- Related files: `index.html`, `styles.css`, `newFeatures.js`, `lifeMinistryTimer.js`
- Context:
  - Administrative setup controls were taking space on the right side of the live meeting workspace.
  - Users need the live timer area to remain primary while still having quick access to setup/review tools.
- Decision:
  - Place the admin sidebar as the left desktop column and keep the live meeting workspace on the right.
  - Add an admin sidebar toggle that collapses the panel to a compact rail and persists its state in `localStorage`.
  - Preserve mobile access by letting the same toggle hide or show the admin content on narrow screens.
- Consequences:
  - Live meeting content receives more visual priority when admin controls are collapsed.
  - The layout now depends on a persisted UI preference that must keep `aria-expanded` synchronized.
- Validation:
  - Manual checks:
    - Load the page at desktop width and verify admin controls appear on the left.
    - Collapse and expand the admin panel and verify the live workspace resizes without overlapping content.
    - Refresh after collapsing and verify the collapsed state persists.
  - Risks:
    - Very narrow desktop widths may need follow-up tuning if the compact rail competes with timer content.

## DEC-015: Consolidate live timer progress and pace display
- Date: 2026-06-16
- Status: Accepted
- Related files: `index.html`, `render.js`, `programCockpit.js`, `styles.css`, `lifeMinistryTimer.js`
- Context:
  - The sticky current-part timer duplicated the run dashboard part timer and made the global meeting timer cramped.
  - Meeting pace needed to react to early finishes across the whole meeting instead of only presenting each part in isolation.
- Decision:
  - Remove the sticky current-part timer panel and keep the run dashboard's thinner current-part progress line as the primary part timer.
  - Apply orange, red, and overtime pulse states to the global meeting line and the thin run-dashboard part/comment lines.
  - Add a 30-second comment glance timer below the current-part progress line.
  - Show part numbers in global meeting segments only on wider screens and only when individual segments have enough space.
  - Shift future global meeting segments from completed actual part timing, but ignore completed parts under 30 seconds to avoid accidental rapid advances moving the whole meeting.
  - Bump the app version to 3.7.1.
- Consequences:
  - The meeting timer receives the full sticky timer width and is easier to read.
  - Early or late completed parts adjust the remaining segment layout while very short accidental starts are treated as planned.
- Validation:
  - Manual checks:
    - Start the sample program and verify only one current-part progress line appears in the live run area.
    - Let the meeting/current/comment progress pass 75%, 90%, and overtime and verify orange, red, and pulse states.
    - Advance a part early after more than 30 seconds and verify later global segments shift earlier; repeat under 30 seconds and verify they do not shift.
    - Resize the page and verify part numbers disappear before segment labels crowd each other.
    - Verify footer version displays 3.7.1.
  - Risks:
    - Segment shifting is based on stored elapsed seconds rather than explicit wall-clock part end timestamps.

## DEC-016: Make inline editing card-scoped
- Date: 2026-06-16
- Status: Accepted
- Related files: `lifeMinistryTimer.js`, `render.js`, `styles.css`, `index.html`
- Context:
  - The global edit button made all cards feel like they entered edit mode at once, which slowed down normal single-card edits.
  - The add-before/add-after controls were useful, but they only appeared with global edit mode.
  - Some editing surfaces and reset controls had poor dark-mode contrast.
- Decision:
  - Show each card's pencil edit action without requiring global edit mode.
  - Keep add-before/add-after controls inside the active inline editor and save with the inline `Save` button.
  - Keep drag-and-drop reordering behind global edit mode.
  - Restyle inline editors, the legacy part editor modal, and reset timer controls with theme variables.
  - Bump the app version to 3.7.2.
- Consequences:
  - Users can edit one card directly while the rest of the meeting remains in normal mode.
  - Inserted parts reindex elapsed times, comments, and active part state so timer data stays attached to the right card.
- Validation:
  - Manual checks:
    - Open a single card editor from the pencil with global edit mode off, save changes, and verify other cards stay in normal display mode.
    - Verify add-before/add-after appear only while a card editor is open and the new part opens for editing.
    - Verify drag-and-drop still requires global edit mode.
    - Switch to dark mode and verify part cards, inline editor fields, the part editor modal, and reset timer controls remain readable.
  - Risks:
    - Existing global edit users may still expect all card management controls to appear together; this keeps reorder there while moving insert controls to the active editor.

## DEC-017: Align global segment labels with part card numbers
- Date: 2026-06-16
- Status: Accepted
- Related files: `render.js`, `index.html`
- Context:
  - Global meeting timer segment numbers needed to identify the same part numbers shown in the part cards.
  - Repeating raw index math in different render paths made the relationship easy to miss.
- Decision:
  - Parse imported program part numbers from part titles such as `1. They Treated...`.
  - Show that program number as a badge beside each numbered part title and strip the duplicate leading number from the visible title.
  - Leave unnumbered items such as Opening Comments without a badge or global segment label.
  - Add the program part number to each numbered global segment's DOM metadata and title.
  - Bump the app version to 3.7.4.
- Consequences:
  - Segment labels now represent program part numbers rather than card ordinal positions.
  - Debugging and visual inspection can compare card badges, cleaned card text, segment labels, segment titles, and `data-part-number`.
- Validation:
  - Manual checks:
    - Load a scheduled meeting so the global timer segments render.
    - Verify Opening Comments has no global segment label.
    - Compare visible global segment labels with the corresponding numbered part card badges.
    - Verify footer version displays 3.7.4.
  - Risks:
    - Very narrow or short numbered segments may still hide their label to prevent crowding; hidden labels should not be treated as renumbering.

## DEC-018: Confirm high-impact live timing actions
- Date: 2026-06-17
- Status: Accepted
- Related files: `lifeMinistryTimer.js`, `newFeatures.js`, `index.html`
- Context:
  - Live meeting actions such as ending the global meeting, resetting the active part timer, and resetting all timing data were one-click operations.
  - During a meeting, accidental clicks should be absorbed before they stop or erase important live timing context.
- Decision:
  - Route the End Meeting action through the app confirmation modal before recording the meeting end.
  - Require confirmation before resetting the currently running active part.
  - Route the `R` reset shortcut and `E` end-meeting shortcut through the same confirmation paths as their buttons.
  - Route the Reset Timers admin action through the same app confirmation modal, with a native confirm fallback.
  - Bump the app version to 3.7.5.
- Consequences:
  - High-impact actions now require a deliberate second step during live operation.
  - Routine reset actions for stopped or empty part timers remain quick.
- Validation:
  - Manual checks:
    - Start a part timer, click its Reset button, cancel the confirmation, and verify elapsed time continues.
    - Repeat and confirm, then verify the active part timer stops and resets.
    - Start or schedule a global meeting, click End Meeting, cancel, and verify the global timer remains active.
    - Repeat and confirm, then verify the meeting end is recorded.
    - Click Reset Timers and verify the app modal appears before timing data clears.
    - Press `R` while the active part is running and `E` while the global meeting is active, then verify both shortcuts open confirmations instead of acting immediately.
    - Verify footer version displays 3.7.5.
  - Risks:
    - Extra confirmation adds one click for intentional meeting-end and reset workflows.

## DEC-019: Add setup readiness checklist and next action
- Date: 2026-06-17
- Status: Accepted
- Related files: `programCockpit.js`, `styles.css`, `index.html`, `lifeMinistryTimer.js`
- Context:
  - The import readiness card showed useful metrics, but it did not make the remaining setup steps obvious.
  - Users need a calm path from imported program to reviewed timing, scheduled meeting, and live view.
- Decision:
  - Add a compact readiness checklist to the import status card.
  - Surface a single recommended next action: review timing when suggested durations exist, schedule the meeting when timing is reviewed but no schedule exists, or focus the live view when setup is complete.
  - Version local CSS/JS asset URLs with the app version so static-browser refreshes pick up the current setup workflow.
  - Keep the checklist inside the existing prepare surface instead of adding another screen.
  - Bump the app version to 3.7.6.
- Consequences:
  - Setup now communicates progress and the next useful action at a glance.
  - The prepare card becomes slightly denser, so narrow-screen wrapping needs regression coverage.
- Validation:
  - Manual checks:
    - Load the sample week and verify the readiness card shows setup steps.
    - Import or parse a program with inferred timing and verify the next action is `Review Timing`.
    - With reviewed timing and no schedule, verify the next action is `Schedule Meeting`.
    - After scheduling, verify the next action is `Focus Live View`.
    - Verify footer version displays 3.7.6.
  - Risks:
    - Readiness depends on scheduled start/end state; stale persisted schedules could make the setup look more complete than intended.

## DEC-020: Use real controls for part selection
- Date: 2026-06-17
- Status: Accepted
- Related files: `render.js`, `lifeMinistryTimer.js`, `styles.css`, `index.html`
- Context:
  - Part cards were rendered as button-like containers while also containing timer, comment, reset, edit, and remove buttons.
  - Nested interactive semantics can make browser automation, keyboard use, and assistive technology less reliable.
- Decision:
  - Keep part cards as semantic containers instead of assigning `role="button"` to the whole card.
  - Preserve pointer convenience by allowing stopped, non-editing cards to select on card click.
  - Add a small real `Select` button to selectable non-active cards for keyboard and assistive technology users.
  - Route the new `select-part` action through the existing delegated part action handler.
  - Bump the app version to 3.7.7.
- Consequences:
  - Timer card controls are no longer exposed as buttons nested inside another button-like card.
  - Non-active cards gain one quiet explicit selection control.
- Validation:
  - Manual checks:
    - Verify non-active stopped cards show a small `Select` button.
    - Click a non-active card body and verify it still becomes active.
    - Activate the `Select` button by keyboard and verify the part becomes active.
    - Start a timer and verify select controls no longer appear while running.
    - Verify footer version displays 3.7.7.
  - Risks:
    - The extra Select control adds a small amount of visual density to stopped meeting cards.
