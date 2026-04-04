# after-work: Commit, Push, PR, Merge to main

Complete the full git workflow from the current worktree branch to main.
The user works across **different computers**, so ALL project files must be committed — nothing should be left behind except pure build artifacts.

## Steps

1. **Update project context**: Read `docs/CONTEXT.md` and update it to reflect the current state. This is critical for cross-machine continuity.
   - **Completed features**: Move items from "Implementation Order" to "Completed Features" section if they were implemented this session.
   - **New decisions**: Add any new architecture/design decisions made this session.
   - **Changed plans**: Update or remove plans that are no longer valid.
   - **Current phase**: Update what the next task is so the other machine knows where to pick up.
   - The goal: CONTEXT.md should always reflect the **current truth**, not accumulate stale history.
   - **Consistency check**: Remaining work in CONTEXT.md TODO must match what goes into the worklog (Step 1.5). No contradictions allowed.

1.5. **Update worklog** (MANDATORY): Update `.omc/worklog/latest.md` to reflect the current session.
   This file is read by `before-work` at the start of the next session. If it's stale, the next session starts with wrong context.

   Format:
   ```yaml
   ---
   session_date: "YYYY-MM-DD HH:MM"
   project: "[project name]"
   working_directory: "[current worktree path]"
   duration_estimate: "[rough estimate]"
   ---
   ```

   Required sections:
   - **Completed Work**: What was done this session (bullet list)
   - **Remaining Tasks**: What's left to do (must match CONTEXT.md TODO section — no contradictions)
   - **Key Decisions**: Any new decisions made this session (must match CONTEXT.md Key Design Decisions)
   - **Notes for Next Session**: Anything the next session needs to know

   **CRITICAL**: Remaining Tasks MUST be consistent with `docs/CONTEXT.md`. If a direction was discarded in CONTEXT.md, it must NOT appear as a remaining task in the worklog.

2. **Commit**: Stage **ALL** changed and untracked files. The only exclusions are:
   - `.env`, `.env.*` (secrets)
   - `node_modules/`
   - `tsconfig.tsbuildinfo` (auto-generated build cache)
   - Files matching `.gitignore` patterns

   **Include everything else** — config files (`.claude/`, `docs/`, PDCA snapshots, etc.) are required for cross-machine work continuity. Do NOT selectively exclude them.

   Create a single commit with a descriptive message summarizing all changes.

3. **Push**: Push the current branch to origin with `git push origin <current-branch>`

4. **PR**: Check if a PR already exists for this branch targeting main:
   - If yes, skip PR creation
   - If no, create a PR with `gh pr create --base main` with a summary of all commits since diverging from main

5. **Merge**: Merge the PR to main with `gh pr merge --squash`
   - If `--delete-branch` fails due to worktree, omit that flag
   - If merge conflicts exist, report them to the user instead of force-merging

6. **Verify**: Run `git status` to confirm zero uncommitted files remain (except gitignored/build artifacts). If any tracked files remain, repeat from step 1.

7. Report the final result with the PR URL
