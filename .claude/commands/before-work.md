# before-work: Pull latest from main

Run `git pull origin main` to sync the current branch with the latest changes from main.

## Steps

1. Run `git pull origin main` to fetch and merge latest main changes
2. If there are merge conflicts, resolve them all automatically:
   - For import conflicts, keep the version with more imports (the superset)
   - For version numbers (e.g., persist version), keep the higher number
   - For code logic conflicts, prefer origin/main's changes unless HEAD has clearly newer feature code
3. After resolving conflicts, stage all resolved files and commit with message: `merge: sync with origin/main`
4. Report the result to the user
