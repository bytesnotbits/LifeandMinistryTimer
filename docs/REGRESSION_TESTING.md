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
  1. Observe move up/down and remove buttons on cards.
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

## Coverage Notes

- Add a new `REG-###` test for every bug fix.
- When fixing a regression, include:
  - failing scenario,
  - expected behavior,
  - linked `DEC-###` decision entry.
