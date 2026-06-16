# Terminal Failure Log

Use this log to avoid rediscovering the same terminal failures. Add entries when a command or workflow fails, especially if a workaround is likely to recur.

## Entry Template

```md
## TERM-###: Short Failure Name
- Date observed: YYYY-MM-DD
- Failed pattern:
- Symptom:
- Likely cause:
- Preferred workaround:
- Notes:
```

## Entries

## TERM-001: PowerShell blocks local temp scripts
- Date observed: 2026-06-16
- Failed pattern:
  - Running a generated `.ps1` script directly from the repository path, for example `./codex-temp-admin-sidebar-verify.ps1`.
- Symptom:
  - PowerShell reports the file "is not digitally signed" and refuses to run it.
- Likely cause:
  - The current Windows execution policy blocks unsigned scripts from this UNC/WSL path.
- Preferred workaround:
  - Run temporary verification/commit scripts with a process-scoped bypass:
    - `powershell -NoProfile -ExecutionPolicy Bypass -File ./codex-temp-task.ps1`
  - Keep the script self-reporting and delete it after a successful run.
- Notes:
  - Do not abandon the script-first workflow after this failure; adjust the invocation.

## TERM-002: Git rejects the WSL share as dubious ownership
- Date observed: 2026-06-16
- Failed pattern:
  - Running `git status`, `git diff`, or commit/push commands from `\\wsl.localhost\Ubuntu\home\vibecoding\MinistryTimer\LifeandMinistryTimer` before Git trusts the path.
- Symptom:
  - Git reports "detected dubious ownership in repository" and suggests adding `safe.directory`.
- Likely cause:
  - Git for Windows sees the WSL UNC path as having ownership that does not match the current Windows user.
- Preferred workaround:
  - Add a safe-directory exception for the repository path before continuing:
    - `git config --global --add safe.directory '%(prefix)///wsl.localhost/Ubuntu/home/vibecoding/MinistryTimer/LifeandMinistryTimer'`
  - Then rerun the intended Git command.
- Notes:
  - If the repo path changes, update the safe-directory path accordingly instead of reusing a stale path.

## TERM-003: Git commands fail from the workspace wrapper directory
- Date observed: 2026-06-16
- Failed pattern:
  - Running `git status` or `git diff` from `\\wsl.localhost\Ubuntu\home\vibecoding\MinistryTimer`.
- Symptom:
  - Git reports "not a git repository" or falls into `git diff --no-index` usage output.
- Likely cause:
  - The actual Git repository is nested at `LifeandMinistryTimer/`; the outer workspace wrapper is not a Git worktree.
- Preferred workaround:
  - Run repository Git commands with `workdir` set to:
    - `\\wsl.localhost\Ubuntu\home\vibecoding\MinistryTimer\LifeandMinistryTimer`
  - Treat files outside that folder, such as the outer `AGENTS.md`, as workspace guidance that will not be included in normal repository commits.
- Notes:
  - Check `git status --short` from the nested repo before staging so unrelated files are not bundled.

## TERM-004: Windows Git probes can misread WSL repository layout
- Date observed: 2026-06-16
- Failed pattern:
  - Probing Git repository state from Windows Git against a WSL UNC path, then continuing with one-off PowerShell/WSL snippets after the first probe gives confusing results.
- Symptom:
  - The Windows-side probe does not see the expected WSL repository location or reports misleading repository boundaries.
  - A first PowerShell wrapper can reveal useful facts, such as "the app directory is the actual Git repo, not the parent," but then fail because of PowerShell escaping or WSL command quoting.
- Likely cause:
  - Windows Git, UNC path handling, PowerShell quoting, and WSL shell semantics are all in play at once.
  - Repository discovery can differ depending on whether the command runs from Windows, from WSL, or through a wrapper crossing that boundary.
- Preferred workaround:
  - Stop using fragile one-off shell snippets after the first failure.
  - Create a small self-reporting PowerShell wrapper that calls into WSL deliberately, prints the current Windows path, WSL path, Git version, branch, and repository root, and exits nonzero on mismatch.
  - If the wrapper trips on PowerShell escaping, patch the wrapper and rerun it instead of switching back to ad hoc commands.
  - Prefer running Git from the confirmed repository root once discovered.
- Notes:
  - Capture the useful discovery from the failed wrapper before patching it.
  - This is a sign to simplify the boundary: either stay Windows-native for Windows paths or call into WSL once with carefully quoted arguments.

## TERM-005: Rewriting commit/push wrappers wastes effort
- Date observed: 2026-06-16
- Failed pattern:
  - Creating a fresh temporary PowerShell script for every routine Git publish workflow after the same staging, commit, push, and cleanup shape has already proven useful.
- Symptom:
  - The workflow succeeds, but repeats boilerplate and reintroduces chances for small scripting mistakes.
- Likely cause:
  - The script-first policy encourages self-reporting scripts, but common Git workflows need a durable helper rather than a one-off wrapper each time.
- Preferred workaround:
  - Use the global reusable helpers before writing a new Git wrapper:
    - `C:/Users/joefi/.codex/skills/script-first-execution/scripts/git-check.ps1`
    - `C:/Users/joefi/.codex/skills/script-first-execution/scripts/git-publish.ps1`
  - Run with `powershell -NoProfile -ExecutionPolicy Bypass -File ...` when execution policy blocks direct script execution.
  - Pass explicit `-Paths` to `git-publish.ps1` unless deliberately staging all changes with `-All`.
- Notes:
  - If a project needs special publish behavior, prefer improving the reusable helper or wrapping it with a small project script.

## TERM-006: Rewriting failure log entries wastes effort
- Date observed: 2026-06-15
- Failed pattern:
  - Manually adding TERM entries after the failure log format and numbering convention are established.
- Symptom:
  - Each entry repeats ID lookup, markdown formatting, and verification by hand.
- Likely cause:
  - The failure log convention was durable, but the append workflow was not yet scripted.
- Preferred workaround:
  - Use C:/Users/joefi/.codex/skills/script-first-execution/scripts/failure-log.ps1 with -LogPath for project logs.
- Notes:
  - The helper appends the next TERM id and validates that the entry was written.

