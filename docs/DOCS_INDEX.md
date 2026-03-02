# Ministry Timer Documentation Index

Use this index as the single source of truth for project documentation.

## Documentation Files

- `docs/DECISIONS.md`
  - Tracks decision history for architecture, UX behavior, and implementation tradeoffs.
  - Update when behavior changes, data model changes, or a bug fix changes expected output.

- `docs/KNOWLEDGE_BASE.md`
  - Tracks what the app does, how it is supposed to work, and major feature expectations.
  - Update when adding/removing features, changing user flows, or clarifying behavior.

- `docs/REGRESSION_TESTING.md`
  - Maps features to manual regression checks and expected results.
  - Update whenever a feature is added/changed or a bug is fixed.

## Update Workflow (Recommended)

1. Make code change.
2. Add a decision note in `DECISIONS.md` if behavior/implementation choices changed.
3. Update the relevant feature section in `KNOWLEDGE_BASE.md`.
4. Add or update a regression test case in `REGRESSION_TESTING.md`.
5. Run through impacted regression checks before release.

## Naming and Date Conventions

- Use ISO dates: `YYYY-MM-DD`.
- Use stable IDs:
  - Decisions: `DEC-###`
  - Regression tests: `REG-###`
- Keep entries append-only when possible. If behavior changes, add a new entry instead of rewriting history.
