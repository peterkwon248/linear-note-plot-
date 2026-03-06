# after-work: Commit, Push, PR, Merge to main

Complete the full git workflow from the current worktree branch to main.

## Steps

1. **Commit**: Stage all changed files (exclude `.env`, credentials, `node_modules`, `tsconfig.tsbuildinfo`) and create a commit with a descriptive message summarizing the changes
2. **Push**: Push the current branch to origin with `git push origin <current-branch>`
3. **PR**: Check if a PR already exists for this branch targeting main:
   - If yes, skip PR creation
   - If no, create a PR with `gh pr create --base main` with a summary of all commits since diverging from main
4. **Merge**: Merge the PR to main with `gh pr merge --squash`
   - If `--delete-branch` fails due to worktree, omit that flag
   - If merge conflicts exist, report them to the user instead of force-merging
5. Report the final result with the PR URL
