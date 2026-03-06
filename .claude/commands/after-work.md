# after-work: Commit, Push, PR, Merge to main

Complete the full git workflow from the current worktree branch to main.
The user works across **different computers**, so ALL project files must be committed — nothing should be left behind except pure build artifacts.

## Steps

1. **Commit**: Stage **ALL** changed and untracked files. The only exclusions are:
   - `.env`, `.env.*` (secrets)
   - `node_modules/`
   - `tsconfig.tsbuildinfo` (auto-generated build cache)
   - Files matching `.gitignore` patterns

   **Include everything else** — config files (`.claude/`, `docs/`, PDCA snapshots, etc.) are required for cross-machine work continuity. Do NOT selectively exclude them.

   Create a single commit with a descriptive message summarizing all changes.

2. **Push**: Push the current branch to origin with `git push origin <current-branch>`

3. **PR**: Check if a PR already exists for this branch targeting main:
   - If yes, skip PR creation
   - If no, create a PR with `gh pr create --base main` with a summary of all commits since diverging from main

4. **Merge**: Merge the PR to main with `gh pr merge --squash`
   - If `--delete-branch` fails due to worktree, omit that flag
   - If merge conflicts exist, report them to the user instead of force-merging

5. **Verify**: Run `git status` to confirm zero uncommitted files remain (except gitignored/build artifacts). If any tracked files remain, repeat from step 1.

6. Report the final result with the PR URL
