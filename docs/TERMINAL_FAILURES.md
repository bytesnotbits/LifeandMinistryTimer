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
