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

## Coverage Notes

- Add a new `REG-###` test for every bug fix.
- When fixing a regression, include:
  - failing scenario,
  - expected behavior,
  - linked `DEC-###` decision entry.
