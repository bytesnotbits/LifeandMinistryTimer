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


## TERM-007: PowerShell provider-qualified UNC path breaks native tools
- Date observed: 2026-06-15
- Failed pattern:
  - Using Get-Location directly in Join-Path, then passing result to git -C and rg
- Symptom:
  - git and rg received Microsoft.PowerShell.Core\\FileSystem::\\\\wsl.localhost... and failed with invalid path
- Likely cause:
  - PowerShell provider-qualified path string is not a native filesystem path for external executables
- Preferred workaround:
  - Use (Get-Location).ProviderPath before building paths passed to native tools
- Notes:
  - Observed during timer UI inspection on 2026-06-16


## TERM-008: PowerShell markdown backtick regex parse failure
- Date observed: 2026-06-15
- Failed pattern:
  - Double quoted rg pattern with literal markdown code ticks
- Symptom:
  - PowerShell reported missing string terminator before verification script could run
- Likely cause:
  - Backtick is an escape character in double quoted PowerShell strings
- Preferred workaround:
  - Use single quoted regex strings or avoid literal markdown code ticks in PowerShell patterns
- Notes:
  - Observed during timer redesign verification on 2026-06-16


## TERM-009: git-publish paths need PowerShell array syntax
- Date observed: 2026-06-15
- Failed pattern:
  - Calling git-publish.ps1 -Paths path1 path2 path3 from a single command string
- Symptom:
  - PowerShell reported that a positional parameter could not accept the second path
- Likely cause:
  - The helper expects the Paths parameter as one string array argument, not loose positional tokens
- Preferred workaround:
  - Pass -Paths with a PowerShell array expression or splat the path list from a wrapper script
- Notes:
  - Observed while publishing timer redesign on 2026-06-16


## TERM-010: git-publish helper collapses path array into one pathspec
- Date observed: 2026-06-15
- Failed pattern:
  - Invoking git-publish.ps1 with a string array for -Paths from a wrapper script
- Symptom:
  - Helper printed each path but git add received one space-joined pathspec and failed
- Likely cause:
  - The helper Invoke-Git function receives the Paths array as a nested array or single argument when forwarded
- Preferred workaround:
  - Use explicit git add -- path calls in the wrapper or patch the helper to splat Paths into git add
- Notes:
  - Observed while publishing timer redesign on 2026-06-16

## TERM-011: PowerShell provider path passed to Node
- Date observed: 2026-06-16
- Failed pattern:
  - PowerShell script used `Get-Location` directly, then passed `Join-Path` results to `node --check` from a UNC workspace.
- Symptom:
  - Node tried to resolve paths containing `Microsoft.PowerShell.Core\FileSystem::` and reported `MODULE_NOT_FOUND` even though files existed.
- Likely cause:
  - `Get-Location` returns a `PathInfo` object whose string form can include the provider prefix for UNC provider paths.
- Preferred workaround:
  - Use `(Get-Location).ProviderPath` or `Convert-Path` before passing filesystem paths to external executables.
- Notes:
  - Observed during inline editing verification on 2026-06-16.

## TERM-012: Git push succeeds but geometric repack fails on WSL share
- Date observed: 2026-06-16
- Failed pattern:
  - Running `git push` from Windows Git against the WSL UNC repository after committing changes.
- Symptom:
  - Push completes, but Git reports `fatal: could not write multi-pack-index: Permission denied`, followed by `failed to perform geometric repack`.
- Likely cause:
  - Windows Git can update the remote while still failing a local maintenance/repack step on the WSL share because of filesystem permission or lock behavior.
- Preferred workaround:
  - Verify whether the push completed by checking the remote update line and rerunning `git status --short`.
  - If local maintenance is needed, run Git maintenance from WSL or disable automatic maintenance for the repository before retrying publish workflows.
- Notes:
  - Observed after pushing commit `ad47820` on 2026-06-16.

## TERM-013: Over-escaped verification regex in PowerShell scripts
- Date observed: 2026-06-16
- Failed pattern:
  - Using a heavily escaped `-match` regex in a temporary PowerShell verification script to check JavaScript source text.
- Symptom:
  - The verification script failed with a false negative even though the target function existed.
- Likely cause:
  - Escaping for JavaScript regex text inside PowerShell string literals made the verification pattern harder to reason about than the source check required.
- Preferred workaround:
  - Use simple `.Contains(...)` checks for exact source snippets when regex semantics are not needed.
- Notes:
  - Observed while verifying imported program part numbering.


## TERM-014: PowerShell git-publish path list parsing
- Date observed: 2026-06-16
- Failed pattern:
  - git-publish.ps1 -Paths docs/DECISIONS.md docs/KNOWLEDGE_BASE.md ...
- Symptom:
  - PowerShell reported: A positional parameter cannot be found that accepts argument after the first path.
- Likely cause:
  - The helper's -Paths parameter expects an array value; bare space-separated paths were parsed as separate positional arguments from this call shape.
- Preferred workaround:
  - Pass -Paths as a PowerShell array expression or run through a small script that assigns the paths array before invoking git-publish.ps1.
- Notes:
  -


## TERM-015: git-publish helper flattens Paths during git add
- Date observed: 2026-06-16
- Failed pattern:
  - git-publish.ps1 called with a string array for -Paths from PowerShell wrapper
- Symptom:
  - Helper listed individual paths, then git add received one flattened pathspec containing all paths separated by spaces.
- Likely cause:
  - The helper's remaining-arguments wrapper or Windows PowerShell array forwarding flattened the explicit path array when invoking git add on a UNC workspace.
- Preferred workaround:
  - Use a self-reporting repo-local publish script that stages each explicit path with a separate native git add -- <path> call, then commits and pushes.
- Notes:
  -


## TERM-016: Git geometric repack permission warning after push
- Date observed: 2026-06-16
- Failed pattern:
  - git push origin main after commit on UNC WSL workspace
- Symptom:
  - Push completed, then Git reported fatal: renaming pack to .git/objects/pack/*.idx failed: Permission denied; failed to perform geometric repack.
- Likely cause:
  - Windows Git background maintenance/geometric repack can hit transient permission issues against the WSL UNC .git object store after network push.
- Preferred workaround:
  - Treat the push result as authoritative when remote ref updates; run git status/fetch to verify. If cleanup is needed, run maintenance from inside WSL or retry when no process has .git/objects open.
- Notes:
  -


## TERM-017: git-publish Paths argument shape
- Date observed: 2026-06-25
- Failed pattern:
  - git-publish.ps1 -Paths file1 file2 file3
- Symptom:
  - PowerShell reported: A positional parameter cannot be found that accepts argument after the first path.
- Likely cause:
  - The helper script string array parameter expects a comma-delimited PowerShell array value when invoked through -File.
- Preferred workaround:
  - Pass paths as -Paths file1,file2,file3 or call the helper from a wrapper script with an explicit string array.
- Notes:
  - Observed while publishing undo stop comment work on 2026-06-25.


## TERM-018: git-publish comma Paths from command line
- Date observed: 2026-06-25
- Failed pattern:
  - git-publish.ps1 -Paths file1,file2,file3 from powershell -File
- Symptom:
  - The helper received the comma-delimited list as one literal pathspec and git add failed.
- Likely cause:
  - Passing array literals through nested PowerShell -File invocation can collapse into a single string depending on quoting and host parsing.
- Preferred workaround:
  - Use a small PowerShell wrapper script that assigns $paths = @(file1, file2) and passes -Paths $paths to git-publish.ps1.
- Notes:
  - Observed while publishing undo stop comment work on 2026-06-25.


## TERM-019: git-publish array pathspec collapse
- Date observed: 2026-06-25
- Failed pattern:
  - git-publish.ps1 called with a typed string array for -Paths
- Symptom:
  - The helper printed individual paths but git add received one combined pathspec containing spaces.
- Likely cause:
  - The helper forwards the array through a ValueFromRemainingArguments wrapper as one argument instead of splatting individual paths to git.
- Preferred workaround:
  - Use a self-reporting publish script that stages each explicit path with git add -- <path>, or patch the reusable helper to splat path arrays safely.
- Notes:
  - Observed while publishing undo stop comment work on 2026-06-25.


## TERM-020: Git geometric repack permission warning after push
- Date observed: 2026-06-25
- Failed pattern:
  - git push from Windows PowerShell against WSL UNC repo path
- Symptom:
  - Push completed, then Git reported permission denied while renaming a pack idx during geometric repack.
- Likely cause:
  - Windows Git maintenance can hit file locking or permission issues when operating on a WSL UNC working tree.
- Preferred workaround:
  - Verify the push completed, then run future maintenance from inside WSL or disable/avoid Windows-side auto maintenance for this UNC repo path.
- Notes:
  - Observed after commit 8ed6c56 pushed on 2026-06-25.


## TERM-021: Git helper from non-repo workspace root
- Date observed: 2026-06-25
- Failed pattern:
  - git-check.ps1 -RepoRoot \\wsl.localhost\Ubuntu\home\vibecoding\MinistryTimer
- Symptom:
  - Git reported fatal: not a git repository before the actual app subdirectory was selected.
- Likely cause:
  - The shared workspace root contains the LifeandMinistryTimer repository as a child directory, not at the root.
- Preferred workaround:
  - Run git helpers with -RepoRoot pointing to \\wsl.localhost\Ubuntu\home\vibecoding\MinistryTimer\LifeandMinistryTimer.
- Notes:
  - Observed while orienting WOL discussion import work.


## TERM-022: PowerShell native command failure not caught by ErrorActionPreference
- Date observed: 2026-06-25
- Failed pattern:
  - Self-reporting PowerShell validation script runs node test without checking $LASTEXITCODE
- Symptom:
  - The script printed later verification steps and exited 0 even though node reported a failed assertion afterward.
- Likely cause:
  - PowerShell 5.1 does not treat native command nonzero exit codes as terminating errors under ErrorActionPreference alone.
- Preferred workaround:
  - After native commands such as node, npm, git, or rg, explicitly check $LASTEXITCODE and throw when it is nonzero.
- Notes:
  - Observed while validating WOL discussion import fixture.


## TERM-023: PowerShell rg Unix globs on UNC path
- Date observed: 2026-06-26
- Failed pattern:
  - rg pattern *.js *.html from Windows PowerShell in WSL UNC repo
- Symptom:
  - rg received literal wildcard path arguments and reported invalid filename syntax.
- Likely cause:
  - PowerShell did not expand the Unix-style globs as intended for rg on the UNC workspace.
- Preferred workaround:
  - Pass explicit file names to rg, use rg --glob patterns, or run the search from a script with checked arguments.
- Notes:
  - Observed while locating run dashboard pace code.


## TERM-024: git-publish path array flattened on UNC workspace
- Date observed: 2026-06-25
- Failed pattern:
  - git-publish.ps1 -Paths with multiple explicit paths from Windows PowerShell on WSL UNC repo
- Symptom:
  - Helper either received later paths as positional arguments or flattened all paths into one git add pathspec.
- Likely cause:
  - PowerShell process boundaries and the helper's native command forwarding flatten the explicit path array on this UNC workspace.
- Preferred workaround:
  - Use a self-reporting project script that runs git add once per explicit path, then commits and pushes.
- Notes:
  - Observed while publishing meeting clock sync action.


## TERM-025: Git diff pathspec from parent workspace
- Date observed: 2026-06-26
- Failed pattern:
  - git diff -- LifeandMinistryTimer/<paths> from parent folder without repository metadata
- Symptom:
  - Git reported no-index usage and pathspec comparison limitations instead of showing the repo diff.
- Likely cause:
  - The Git repository root is LifeandMinistryTimer, while the command was run from the parent MinistryTimer folder.
- Preferred workaround:
  - Run git diff/status from \\wsl.localhost\Ubuntu\home\vibecoding\MinistryTimer\LifeandMinistryTimer or use the git-check helper to confirm the repo root first.
- Notes:
  - Observed during command-center comment click fix verification on 2026-06-26.


## TERM-026: Git publish comma-separated Paths argument
- Date observed: 2026-06-26
- Failed pattern:
  - git-publish.ps1 -Paths 'file1','file2' from a single PowerShell command string
- Symptom:
  - Helper passed one comma-joined pathspec to git add, which failed to match files.
- Likely cause:
  - Comma-separated values were parsed as one argument in this invocation context instead of separate path arguments.
- Preferred workaround:
  - Pass explicit paths as separate arguments after -Paths, e.g. -Paths file1 file2 docs/file.md.
- Notes:
  - Observed while publishing command-center comment click fix on 2026-06-26.


## TERM-027: Git publish Paths as unbound positional arguments
- Date observed: 2026-06-26
- Failed pattern:
  - git-publish.ps1 -Paths file1 file2 file3 from inline command string
- Symptom:
  - PowerShell reported that no positional parameter accepts the second path argument.
- Likely cause:
  - The inline command did not bind the remaining file names into the string-array Paths parameter.
- Preferred workaround:
  - Call git-publish.ps1 from a small PowerShell script with $paths = @(...) and pass -Paths $paths.
- Notes:
  - Observed while publishing command-center comment click fix on 2026-06-26.


## TERM-028: Git publish Paths array flattened through nested PowerShell
- Date observed: 2026-06-26
- Failed pattern:
  - Temporary script calling powershell -File git-publish.ps1 -Paths $paths
- Symptom:
  - Nested PowerShell process flattened the Paths array and helper rejected the second path as positional.
- Likely cause:
  - Passing an array through a process boundary did not preserve PowerShell parameter binding.
- Preferred workaround:
  - Invoke the helper in-process from the temporary PowerShell script with & $helper -Paths $paths.
- Notes:
  - Observed while publishing command-center comment click fix on 2026-06-26.


## TERM-029: Git publish helper does not splat Paths into git add
- Date observed: 2026-06-26
- Failed pattern:
  - git-publish.ps1 with a valid string[] Paths value
- Symptom:
  - Helper printed individual paths but git add received one space-joined pathspec and failed.
- Likely cause:
  - The helper invokes git add $Paths instead of splatting the path array into separate git arguments.
- Preferred workaround:
  - Use a temporary self-reporting publish script that runs git add -- <each explicit path>, then git commit and git push.
- Notes:
  - Observed while publishing command-center comment click fix on 2026-06-26.

