# Regression Testing Matrix

Use this file to prevent behavior drift while evolving the app.

## Test Case Template

```md
## REG-###: Short Test Name
- Priority: High | Medium | Low
- Area: Timer | Editing | Persistence | Rendering | Other
- Preconditions:
- Steps:
  1.
  2.
- Expected:
- Related decisions: DEC-###
- Related files:
```

## Test Cases

## REG-001: Timer control state remains in sync with UI
- Priority: High
- Area: Timer
- Preconditions:
  - At least one timed segment is configured.
- Steps:
  1. Start timer.
  2. Pause timer.
  3. Resume timer.
  4. Reset timer.
- Expected:
  - Time display transitions correctly at each step.
  - Button states and labels match actual timer behavior.
- Related decisions: DEC-004
- Related files: `lifeMinistryTimer.js`, `render.js`, `index.html`

## REG-002: Title pencil opens inline editor for the correct card
- Priority: High
- Area: Editing
- Preconditions:
  - App loaded with multiple parts.
- Steps:
  1. Click pencil on a non-active part title.
  2. Verify inline fields match that part.
  3. Cancel.
- Expected:
  - Inline editor opens only for selected card.
  - Cancel closes inline editor without changing values.
- Related decisions: DEC-003, DEC-004
- Related files: `render.js`, `lifeMinistryTimer.js`

## REG-003: Inline save updates card content and persists template
- Priority: High
- Area: Editing
- Preconditions:
  - App loaded.
- Steps:
  1. Open inline editor from pencil.
  2. Change name, speaker, duration, and comments flag.
  3. Save changes.
  4. Refresh page.
- Expected:
  - Updated values appear on card immediately.
  - Updated values remain after refresh.
- Related decisions: DEC-004
- Related files: `render.js`, `lifeMinistryTimer.js`

## REG-004: Active part duration can be edited while timer is running
- Priority: High
- Area: Timer
- Preconditions:
  - Timer is running on active part.
- Steps:
  1. Open active card inline editor.
  2. Increase or decrease duration.
  3. Save.
- Expected:
  - Timer continues running.
  - Countdown/progress recalculates from the new duration.
  - Elapsed time is not reset.
- Related decisions: DEC-002, DEC-004
- Related files: `lifeMinistryTimer.js`, `render.js`

## REG-005: Remove and reorder are disabled while timer is running
- Priority: High
- Area: Editing
- Preconditions:
  - Timer running.
- Steps:
  1. Observe drag-handle reorder affordance and remove button on cards.
  2. Attempt to click disabled controls.
- Expected:
  - Controls appear disabled while timer runs.
  - No card removal or reorder occurs.
- Related decisions: DEC-004
- Related files: `render.js`, `lifeMinistryTimer.js`

## REG-006: Reorder updates part order and keeps timing/comment indexes aligned
- Priority: High
- Area: Rendering
- Preconditions:
  - Timer stopped.
  - Multiple parts with elapsed data and comments across different indexes.
- Steps:
  1. Drag a middle card to a new position.
  2. Verify order changed.
  3. Check elapsed values/comments remain attached to the same logical part.
- Expected:
  - Card order updates correctly.
  - Elapsed data/comments follow moved parts.
- Related decisions: DEC-004, DEC-005
- Related files: `lifeMinistryTimer.js`, `render.js`

## REG-008: Comment timer cannot go negative
- Priority: Medium
- Area: Timer
- Preconditions:
  - A part has comments enabled and is active.
  - A comment is currently running.
- Steps:
  1. Use the –5s control (or keyboard '-') repeatedly until the displayed comment time reaches 0:00.
  2. Continue clicking the –5s control.
  3. Observe the comment display and the underlying `activeComment.startElapsed` value (for debugging).
- Expected:
  - The on-screen comment countdown never shows a negative time.
  - The internal start elapsed value does not exceed the current part time.
  - Comment timer resumes from zero when the part time advances, never counting up from a negative value.
- Related decisions: DEC-004
- Related files: `lifeMinistryTimer.js`, `render.js`
## REG-007: Remove reindexes remaining state safely
- Priority: High
- Area: Persistence
- Preconditions:
  - Timer stopped.
  - Multiple parts exist.
- Steps:
  1. Remove a non-final card.
  2. Verify remaining cards and active selection.
  3. Refresh page.
- Expected:
  - Remaining cards stay in valid order.
  - Active part remains valid.
  - Persisted state reloads without index drift.
- Related decisions: DEC-004
- Related files: `lifeMinistryTimer.js`, `render.js`

## REG-009: Meeting scheduler date/time inputs remain readable in dark mode
- Priority: Medium
- Area: Rendering
- Preconditions:
  - App loaded.
  - Dark mode enabled.
- Steps:
  1. Navigate to the meeting scheduler section.
  2. Inspect `Date`, `Start`, and `End` input fields.
  3. Click into each field and verify text/values are legible.
  4. Toggle back to light mode and confirm inputs still render correctly.
- Expected:
  - In dark mode, scheduler `date`/`time` fields use dark background with light text and visible borders.
  - Existing light-mode appearance remains unchanged.
- Related decisions: DEC-004
- Related files: `styles.css`, `index.html`

## REG-010: Inline card editing remains stable while timer is running
- Priority: High
- Area: Editing
- Preconditions:
  - App loaded with multiple parts.
  - A part timer is actively running.
- Steps:
  1. Click the pencil icon on a meeting card to open inline editing while the timer continues.
  2. Type continuously in part name and speaker fields for at least 5 seconds.
  3. Change duration value and comments checkbox state.
  4. Save the inline edits.
- Expected:
  - Typed values do not reset during timer updates.
  - Input focus remains usable while timer display continues updating.
  - Saved values persist after save and page refresh.
- Related decisions: DEC-004
- Related files: `render.js`, `lifeMinistryTimer.js`

## REG-011: Inline edit draft persists through start/stop actions
- Priority: High
- Area: Editing
- Preconditions:
  - App loaded with multiple parts.
  - Inline editor is open on one part.
- Steps:
  1. Type unsaved changes into inline part name/speaker/duration fields.
  2. Start or stop the timer from another part control that triggers a re-render.
  3. Return focus to the inline editor.
  4. Save the edits.
- Expected:
  - Unsaved inline field values remain populated after start/stop actions.
  - User does not need to re-enter typed content.
  - Saved values persist after page refresh.
- Related decisions: DEC-004
- Related files: `lifeMinistryTimer.js`, `render.js`

## REG-012: Comments are grouped by part and reflected on part cards
- Priority: High
- Area: Rendering
- Preconditions:
  - App loaded with at least two parts that have comments enabled.
- Steps:
  1. Start timers and create at least two comments on part A and one comment on part B.
  2. Stop comments and open the `Total Meeting Comments` section.
  3. Verify comments are grouped into separate part sections instead of a single mixed list.
  4. Verify each comments-enabled part card displays its comment count and average duration.
  5. Delete one comment from the bottom history and verify affected part card stats update immediately.
  6. Refresh page and verify grouped history and per-part stats persist correctly.
- Expected:
  - Bottom comment history is grouped by part with entries listed under the correct heading.
  - Part cards with comments enabled show accurate comment totals and average durations.
  - Card stats remain synchronized after comment deletion and after page reload.
- Related decisions: DEC-007
- Related files: `render.js`, `lifeMinistryTimer.js`, `index.html`

## REG-013: Comment button position stays stable when comment adjust controls toggle
- Priority: Medium
- Area: Rendering
- Preconditions:
  - App loaded with an active part that has comments enabled.
  - Part timer started so comment controls are visible.
- Steps:
  1. Observe horizontal position of the `Comment` button.
  2. Start a comment and confirm `+5s` and `-5s` controls appear.
  3. Stop the comment and confirm `+5s` and `-5s` controls hide again.
  4. Repeat start/stop multiple times.
- Expected:
  - `Comment`/`Stop Comment` button stays in the same horizontal position during toggles.
  - No visible horizontal snap/shift occurs when controls appear/disappear.
- Related decisions: DEC-007
- Related files: `render.js`, `styles.css`

## REG-014: Top-right controls auto-hide/show by scroll direction
- Priority: Medium
- Area: Rendering
- Preconditions:
  - App loaded.
  - Page has enough content to scroll.
- Steps:
  1. Confirm the top-right controls (shortcuts, sound, theme) are visible at page load.
  2. Scroll downward and verify controls hide from view.
  3. Scroll upward and verify controls reappear.
  4. Scroll back to the very top of the page.
- Expected:
  - Controls hide while scrolling downward.
  - Controls reveal while scrolling upward.
  - Controls are visible at the top of the page.
- Related decisions: DEC-008
- Related files: `newFeatures.js`, `styles.css`, `index.html`

## REG-015: Live timer state remains glanceable across part states
- Priority: High
- Area: Rendering
- Preconditions:
  - App loaded with at least two meeting parts.
- Steps:
  1. Select the first part and verify the sticky current-part panel and run dashboard show the current part and next part.
  2. Start the active part and verify status changes to running in the sticky panel, active card, and run dashboard.
  3. Let or adjust the active part near its planned duration and verify closing/overtime cues appear.
  4. Pause the active part and verify paused state appears without losing elapsed/remaining values.
  5. Advance to the next part and verify the next-part preview updates.
- Expected:
  - Current-part status, remaining time, meeting pace, and next-part preview stay synchronized across the sticky panel, active card, and run dashboard.
  - Overtime is visibly distinct from normal running state.
- Related decisions: DEC-009
- Related files: `index.html`, `render.js`, `programCockpit.js`, `styles.css`

## REG-016: Program import shows readiness and opens review
- Priority: High
- Area: Rendering
- Preconditions:
  - App loaded.
  - Program cockpit is visible.
- Steps:
  1. Click `Load Sample Week`.
  2. Verify the `Review` tab is active.
  3. Inspect the import readiness summary.
  4. Verify part count, planned duration, inferred timing count, and comment-enabled part count are shown.
- Expected:
  - Successful import moves the user into review.
  - Readiness summary clearly indicates whether timing needs review before running the meeting.
- Related decisions: DEC-010
- Related files: `index.html`, `programCockpit.js`, `styles.css`, `tests/importer-fixtures.test.cjs`

## REG-017: Program review summarizes timing readiness
- Priority: High
- Area: Rendering
- Preconditions:
  - A weekly program has been imported.
- Steps:
  1. Open the `Review` tab.
  2. Inspect the summary metrics above the review table.
  3. Inspect rows with imported and inferred/suggested durations.
  4. Start/stop a part timer and return to review.
- Expected:
  - Review summary shows planned total, actual total, meeting variance, and suggested-time count.
  - Each row shows imported or suggested timing source.
  - Actual and variance values update after timing activity.
- Related decisions: DEC-011
- Related files: `programCockpit.js`, `styles.css`

## REG-018: Review handoff starts live meeting flow
- Priority: High
- Area: Timer
- Preconditions:
  - A weekly program has been imported.
  - The `Review` tab is active.
- Steps:
  1. Click `Focus Live View`.
  2. Verify the live meeting workspace is brought into view.
  3. Click `Start Current Part` from the review actions.
  4. Verify sticky timer, active card, and run dashboard show running state.
  5. Click the review action again to pause.
- Expected:
  - Review handoff controls use the same timer state as the live controls.
  - Starting/pausing from review does not desynchronize elapsed time, active part, or displayed status.
  - Footer version displays `3.6.9`.
- Related decisions: DEC-012
- Related files: `programCockpit.js`, `styles.css`, `index.html`

## REG-019: Inline card editing handles keyboard and validation safely
- Priority: High
- Area: Editing
- Preconditions:
  - App loaded with multiple parts.
  - Edit mode is enabled.
- Steps:
  1. Start a part timer and open inline editing on a card.
  2. Type a part name and speaker containing quotes or apostrophes.
  3. Press `Esc` and verify edits are canceled without stopping the timer.
  4. Reopen inline editing, enter the same punctuation-heavy values, and press `Ctrl+Enter`.
  5. Reopen inline editing, blank the part name, and attempt to save.
  6. Enter `0` or `181` for duration and attempt to save.
  7. Enter a valid duration and press `Enter` from the duration field.
- Expected:
  - Inline fields render punctuation safely and keep the timer updating.
  - `Esc` cancels, `Ctrl+Enter` saves, and duration-field `Enter` saves valid edits.
  - Invalid names/durations are not committed and focus returns to the field that needs correction.
  - Footer version displays `3.7.0`.
- Related decisions: DEC-013
- Related files: `lifeMinistryTimer.js`, `render.js`, `index.html`

## REG-020: Admin sidebar sits left and collapses persistently
- Priority: Medium
- Area: Rendering
- Preconditions:
  - App loaded at desktop width.
- Steps:
  1. Verify the admin panel appears to the left of the live meeting workspace.
  2. Click the admin toggle button.
  3. Verify the admin content collapses to a compact rail and the live workspace expands.
  4. Refresh the page.
  5. Click the admin toggle again.
- Expected:
  - The admin panel starts on the left at desktop width.
  - Collapsed and expanded states update without content overlap.
  - The collapsed state persists after refresh and `aria-expanded` matches the visible state.
- Related decisions: DEC-014
- Related files: `index.html`, `styles.css`, `newFeatures.js`, `lifeMinistryTimer.js`

## REG-021: Live timer progress is consolidated and meeting segments adjust
- Priority: High
- Area: Timer
- Preconditions:
  - A weekly program has been imported or the sample program is loaded.
  - A meeting schedule is set so the global meeting timer is visible.
- Steps:
  1. Start the current part from the run dashboard.
  2. Verify the sticky timer area shows the global meeting timer without a second sticky current-part timer.
  3. Let or adjust the current part past 75%, 90%, and overtime.
  4. Start a comment on a comment-enabled current part and let it pass 75%, 90%, and 30 seconds.
  5. Advance a part after more than 30 seconds of elapsed time.
  6. Reset and advance a part in under 30 seconds.
  7. Resize from desktop width to mobile width.
- Expected:
  - The run dashboard thin part line is the only current-part progress line in the live run area.
  - Global, part, and comment progress lines change to orange, then red, and pulse in overtime.
  - The comment line counts against a fixed 30-second target.
  - Later global meeting segments shift when a completed part has at least 30 seconds of actual time.
  - Rapid under-30-second advances do not pull later global segments backward.
  - Part numbers appear inside global segments only when there is enough width.
  - Footer version displays `3.7.1`.
- Related decisions: DEC-015
- Related files: `index.html`, `render.js`, `programCockpit.js`, `styles.css`

## REG-022: Inline editing is scoped to one card and readable in dark mode
- Priority: High
- Area: Editing
- Preconditions:
  - App loaded with multiple parts.
  - Global edit mode is disabled.
- Steps:
  1. Click the pencil on one part card.
  2. Verify only that card shows inline fields, `Save`, `Cancel`, `Add Before`, and `Add After`.
  3. Change name, speaker, duration, and comments, then click `Save`.
  4. Reopen the same card and click `Add Before`, then save the new part.
  5. Enable global edit mode and verify drag-and-drop remains available.
  6. Switch to dark mode and inspect the inline editor, part editor modal, part text, and `Reset Timers` button.
- Expected:
  - A single card can be edited without enabling global edit mode.
  - Add-before/add-after are available while that card is being edited.
  - New parts open in inline editing at the requested position without shifting timer/comment data to the wrong existing card.
  - Dark mode keeps editor surfaces, modal fields, part card text, and reset controls readable.
  - Footer version displays `3.7.2`.
- Related decisions: DEC-016
- Related files: `lifeMinistryTimer.js`, `render.js`, `styles.css`, `index.html`

## REG-023: Global segment labels match imported program part numbers
- Priority: High
- Area: Timer
- Preconditions:
  - App loaded with multiple meeting parts.
  - A meeting schedule is set so the global meeting timer is visible.
- Steps:
  1. Inspect Opening Comments and verify it has no part number badge.
  2. Inspect the first numbered program part and note its displayed part number badge.
  3. Inspect global meeting timer segment labels and hover titles.
  4. Advance to another active part.
  5. Reinspect the active card and the corresponding global segment.
- Expected:
  - Opening Comments does not consume global segment number `1`.
  - Each visible global segment label is the same imported program number as the part card badge it represents.
  - Global segment hover titles identify `Part N` using the same number.
  - Footer version displays `3.7.4`.
- Related decisions: DEC-017
- Related files: `render.js`, `index.html`

## Coverage Notes

- Add a new `REG-###` test for every bug fix.
- When fixing a regression, include:
  - failing scenario,
  - expected behavior,
  - linked `DEC-###` decision entry.

## REG-024: High-impact live timing actions require confirmation
- Priority: High
- Area: Timer
- Preconditions:
  - App loaded with at least one meeting part.
  - A part timer has been started.
  - A global meeting timer is visible or running.
- Steps:
  1. Click the active part card's `Reset` button and cancel the confirmation.
  2. Verify the active part timer still has elapsed time.
  3. Click the active part card's `Reset` button again and confirm.
  4. Start or schedule the global meeting timer, click `End Meeting`, and cancel.
  5. Click `End Meeting` again and confirm.
  6. Click the admin `Reset Timers` button and inspect the confirmation.
  7. Press `R` while the active part is running.
  8. Press `E` while the global meeting timer is active.
- Expected:
  - Resetting the running active timer opens the app confirmation modal before stopping or clearing elapsed time.
  - Canceling the active timer reset leaves elapsed time intact.
  - Confirming the active timer reset stops and clears that part timer.
  - Ending the global meeting opens the app confirmation modal before recording the actual end time.
  - Canceling the meeting end leaves the global meeting timer active.
  - Reset Timers uses the app confirmation modal before clearing elapsed times and comment history.
  - The `R` and `E` shortcuts open the same confirmation paths instead of resetting or ending immediately.
  - Footer version displays `3.7.5`.
- Related decisions: DEC-018
- Related files: `lifeMinistryTimer.js`, `newFeatures.js`, `index.html`

## REG-025: Setup readiness card guides import to live workflow
- Priority: High
- Area: Rendering
- Preconditions:
  - App loaded.
  - Program cockpit is visible.
- Steps:
  1. Click `Load Sample Week`.
  2. Inspect the import readiness card.
  3. Import or parse a program with inferred/suggested timing.
  4. Click the readiness card's `Review Timing` action.
  5. Return to prepare with reviewed timing and no schedule set.
  6. Click the readiness card's `Schedule Meeting` action.
  7. Set a meeting schedule and inspect the readiness card again.
  8. Click the readiness card's `Focus Live View` action.
- Expected:
  - The readiness card shows setup steps for imported program, timing review, meeting schedule, and live readiness.
  - Suggested/inferred timing marks the review step as needing attention.
  - `Review Timing` activates the review tab.
  - `Schedule Meeting` brings the weekly schedule controls into view.
  - Once timing is reviewed and a schedule exists, `Focus Live View` brings the run dashboard into view.
  - Footer version displays `3.7.6`.
- Related decisions: DEC-019
- Related files: `programCockpit.js`, `styles.css`, `index.html`

## REG-026: Part selection uses valid controls without nested button semantics
- Priority: High
- Area: Rendering
- Preconditions:
  - App loaded with multiple meeting parts.
  - Timer is stopped.
  - No inline editor is open.
- Steps:
  1. Inspect a non-active part card.
  2. Click the card body outside inner controls.
  3. Select another non-active card using the card's `Select` button.
  4. Navigate to another non-active card's `Select` button by keyboard and activate it.
  5. Start the active timer.
  6. Inspect non-active cards while the timer is running.
- Expected:
  - Part cards are not exposed as button-like containers around nested timer/edit controls.
  - A non-active stopped card body can still be clicked to select that part.
  - The real `Select` button selects its part by pointer and keyboard.
  - Select controls are hidden while the timer is running.
  - Footer version displays `3.7.7`.
- Related decisions: DEC-020
- Related files: `render.js`, `lifeMinistryTimer.js`, `styles.css`, `index.html`

## REG-027: Accidental stopped comment can be resumed
- Priority: High
- Area: Timer Controls
- Preconditions:
  - App loaded with an active part that has comments enabled.
  - The active part timer is running.
- Steps:
  1. Start a comment and let it run for several seconds.
  2. Click `Stop Comment`.
  3. Verify `Undo Stop` appears next to the `Comment` button.
  4. Wait several seconds while the part timer continues.
  5. Click `Undo Stop`.
  6. Observe the active comment timer, then stop the comment again.
- Expected:
  - The stopped comment's saved history entry is removed when undo resumes it.
  - The active comment resumes from the duration it had when stopped; the stopped gap is not counted.
  - Stopping the resumed comment creates a single history entry for the corrected comment.
  - `Undo Stop` is hidden while a comment is active.
  - Footer version displays `3.7.8`.
- Related decisions: DEC-021
- Related files: `lifeMinistryTimer.js`, `render.js`, `index.html`

## REG-028: Command center controls comment timing
- Priority: High
- Area: Run Dashboard
- Preconditions:
  - App loaded with the run dashboard visible.
  - The active part has comments enabled.
- Steps:
  1. Verify the command-center `Comment` button is disabled while the active part timer is stopped.
  2. Click `Start Current Part`.
  3. Click the command-center `Comment` button.
  4. Observe the command-center comment timer and the active card comment timer.
  5. Click command-center `Stop Comment`.
  6. Verify `Undo Stop` appears in the command center.
  7. Click command-center `Undo Stop`, then stop the comment again.
- Expected:
  - `Comment` is enabled only while the active part timer is running.
  - Starting or stopping from the command center updates the active card controls and comment history consistently.
  - The active command-center stop button uses the comment active styling.
  - `Undo Stop` resumes the stopped comment using the same behavior as the active card control.
  - Footer version displays `3.7.9`.
- Related decisions: DEC-022
- Related files: `programCockpit.js`, `styles.css`, `index.html`

## REG-029: WOL discussion imports enable comment tracking
- Priority: High
- Area: Program Import
- Preconditions:
  - App loaded with the program cockpit visible.
  - A WOL copied-text or reader-style program includes a part whose timing/detail line says `Discussion.` or `Discussion based on the article.`
- Steps:
  1. Import the WOL program text.
  2. Open the review tab and inspect the imported discussion parts.
  3. Inspect the corresponding timer cards and run dashboard when each discussion part is active.
  4. Inspect the import readiness summary's comment-enabled count.
- Expected:
  - Discussion parts import as comment-enabled without manual editing.
  - Comment controls appear for those parts when their timer is active.
  - The readiness summary includes discussion parts in the comment-enabled count.
  - Footer version displays `3.8.0`.
- Related decisions: DEC-023
- Related files: `programCockpit.js`, `tests/importer-fixtures.test.cjs`, `index.html`

## REG-030: Global meeting clock syncs to part timers
- Priority: High
- Area: Timer
- Preconditions:
  - App loaded with a scheduled meeting so the global timer is visible.
  - Part timers have accumulated elapsed time that differs from scheduled wall-clock elapsed.
- Steps:
  1. Start or resume the active part timer and accumulate elapsed time.
  2. Observe the global meeting elapsed label and Meeting Pace before syncing.
  3. Click `Sync Meeting`.
  4. Reinspect the global meeting elapsed label, active global segment position, and Meeting Pace.
  5. Refresh the page.
- Expected:
  - `Sync Meeting` is hidden until at least one part timer has elapsed time.
  - After syncing, the global meeting elapsed label matches accumulated part elapsed within one second.
  - The global segment position agrees with the current active part timer and Meeting Pace.
  - The synced meeting remains active after refresh without changing the recurring weekly schedule.
  - Footer version displays `3.8.1`.
- Related decisions: DEC-024
- Related files: `index.html`, `lifeMinistryTimer.js`, `render.js`

## REG-031: Global dividers cascade from completed actual durations
- Priority: High
- Area: Timer
- Preconditions:
  - App loaded with a scheduled meeting and multiple visible global timer segments.
  - At least one part can be completed with elapsed time above the 30-second guard threshold.
- Steps:
  1. Complete a part with elapsed time longer than its planned duration.
  2. Inspect that completed part's global segment and the next part divider.
  3. Complete another part with elapsed time shorter than its planned duration but above 30 seconds.
  4. Advance a part in under 30 seconds.
- Expected:
  - A long completed part expands in the global timer and pushes the next divider later.
  - A short completed part contracts in the global timer and pulls the next divider earlier.
  - Later dividers cascade from the adjusted completed segment boundary.
  - Under-30-second advances still use planned width.
  - Footer version displays `3.8.2`.
- Related decisions: DEC-025
- Related files: `index.html`, `render.js`
