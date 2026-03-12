# before-work: Pull latest from main

Sync the current environment with the latest changes from main.
The user works across **different computers**, so this may be a fresh clone or a stale local copy.

## Steps

1. **Check environment**: Run `git status` and `git branch --show-current` to understand the current state (worktree vs main checkout, clean vs dirty).

2. **Stash if needed**: If there are uncommitted changes, `git stash` them first and notify the user.

3. **Pull latest**: Run `git pull origin main` to fetch and merge the latest main changes.

4. **Resolve conflicts** if any — resolve them all automatically:
   - For import conflicts, keep the version with more imports (the superset)
   - For version numbers (e.g., persist version), keep the higher number
   - For code logic conflicts, prefer origin/main's changes unless HEAD has clearly newer feature code
   - After resolving, stage all resolved files and commit with message: `merge: sync with origin/main`

5. **Install dependencies**: Run `npm install` to ensure any new packages from the latest pull are installed (different computer may not have them).

6. **Quick health check**: Run `npx tsc --noEmit` to verify the project builds cleanly after sync. Report any errors.

7. **Pop stash** if step 2 stashed changes: `git stash pop` and report any conflicts.

8. **Read project context**: Read `docs/CONTEXT.md` to load the latest project decisions, architecture, and current implementation phase. Summarize what phase we're in and what's next.

9. **Sync local memory**: Update the local `MEMORY.md` (in `~/.claude/projects/.../memory/`) with any new info from `docs/CONTEXT.md` if it has diverged.

10. Report the result to the user — include what changed (new commits pulled, packages installed, build status, current phase).
