# Before Work - Session Start Briefing

You are now executing the **before-work** session briefing. Your job is to help the user quickly resume where they left off, ensuring NO context is lost.

## Step 0: Sync Latest Code from Master (MANDATORY - run FIRST)

**이 단계는 무조건 가장 먼저 실행. 다른 모든 것보다 우선.**

```bash
git fetch origin master
git merge origin/master -X theirs  # master의 최신 코드를 현재 브랜치에 반영
```

- 충돌 발생 시: `-X theirs` (master 우선)로 자동 해결. master가 가장 최신이므로.
- 이미 master인 경우: `git pull origin master`
- **결과:** 집/회사 어디서든 세션 시작 시 항상 최신 코드로 시작

## Step 0.3: Install Dependencies (after sync)

다른 컴퓨터에서 작업할 수 있으므로 패키지 동기화:

```bash
npm install 2>/dev/null
```

- 새 패키지가 추가됐을 수 있음 (다른 머신에서 작업 후)
- 에러 나면 무시하고 진행

## Step 0.5: Read Project Memory (MANDATORY - after sync)

**코드 pull 후 즉시 프로젝트 메모리를 읽어 컨텍스트 확보.**

```bash
cat docs/MEMORY.md 2>/dev/null || echo "No docs/MEMORY.md found"
```

- `docs/MEMORY.md`는 프로젝트 전체 컨텍스트 (아키텍처, PR 히스토리, 패턴, 진행 상황)
- 이 파일의 내용을 기반으로 세션 시작 컨텍스트를 잡음
- 없으면 스킵하고 다른 소스로 보충

## Step 1: Gather ALL Context Sources (run ALL in parallel)

### 1-1. Worklog (Primary Memory)
- Primary: `~/.claude/.omc-worklog/latest.md`
- Fallback: `.omc/worklog/latest.md` (project-level)
- If both exist, merge (project-level has priority for project context)

### 1-1b. Cross-Check: Worklog vs CONTEXT.md (MANDATORY)
After reading both worklog and CONTEXT.md, compare worklog "Remaining Tasks" against CONTEXT.md "Key Design Decisions".
- If a remaining task references a direction that CONTEXT.md explicitly discards → mark as STALE/DISCARDED
- CONTEXT.md is ALWAYS the source of truth (it's git-synced across machines)
- Worklog is a session memo that may be outdated
- When in doubt, trust CONTEXT.md over worklog

### 1-2. Git Recent Activity
```bash
git log --oneline -10 --since="7 days ago" 2>/dev/null
```

### 1-3. Uncommitted Changes
```bash
git status --short 2>/dev/null
```

### 1-4. Notepad (Session Notes)
- Read `.omc/notepad.md` if exists

### 1-5. Plan-Scoped Wisdom (CRITICAL - often missed!)
Scan and read ALL files in these directories:
- `.omc/notepads/*/learnings.md` - Technical discoveries
- `.omc/notepads/*/decisions.md` - Architectural decisions
- `.omc/notepads/*/issues.md` - Known issues
- `.omc/notepads/*/problems.md` - Blockers and challenges
- Use `Glob(".omc/notepads/**/*.md")` to find all

### 1-6. Project Documentation
- Read `CLAUDE.md` in project root if exists (project-specific instructions)
- Read `.claude/CLAUDE.md` if exists (local project config)
- Read `AGENTS.md` if exists (codebase architecture map)

### 1-7. Additional Memo Files
Scan for any memo/note files the user may have created:
```
Glob("**/*.memo.md")
Glob("**/MEMO.md")
Glob("**/TODO.md")
Glob("**/NOTES.md")
Glob(".omc/**/*.md")
```

### 1-8. Worklog Archive (for context depth)
- List files in `~/.claude/.omc-worklog/` to show recent sessions
- Read the 2nd most recent worklog (if different from latest) for continuity

### 1-9. Build Health Check
```bash
npx tsc --noEmit 2>&1 | tail -5
```
- 빌드 에러가 있으면 브리핑에 포함 (세션 시작 전 인지)
- 클린하면 "Build: OK" 한 줄로 표시

## Step 2: Present Briefing

Format the briefing as follows:

```
## Session Briefing

### Previous Session Summary
**Date:** [from worklog session_date]
**Project:** [from worklog project field]
**Working Directory:** [from worklog]

[Summarize completed work from worklog]

### Remaining Tasks (from last session)
⚠️ MANDATORY: Cross-check worklog remaining tasks against `docs/CONTEXT.md` Key Design Decisions section.
If any worklog task contradicts a CONTEXT.md decision (e.g., a feature direction was discarded),
DROP that task and note it as "[DISCARDED per CONTEXT.md: reason]".
CONTEXT.md = source of truth (git-synced). Worklog = session memo (can be stale).

1. [ ] [task] - [context with enough detail to resume cold]
2. [ ] [task] - [context]

### Active Memos & Notes
[Content from notepad.md, plan wisdom, MEMO.md, etc.]
[HIGHLIGHT any decisions, blockers, or known issues]

### Recent Git Activity
[Last commits in short format]

### Uncommitted Changes
[Any staged/unstaged changes still pending]

### Key Decisions & Context
[Decisions from plan wisdom + worklog]
[Technical notes that affect current work]

### Suggested Starting Point
> [Recommend which task to start with and why]
```

## Step 3: Inject Remember Tags

After presenting the briefing, inject critical context as `<remember>` tags so they survive conversation compaction:

```
<remember priority>
SESSION CONTEXT (loaded from before-work):
- Project: [project name]
- Key remaining tasks: [list]
- Critical decisions: [list]
- Known blockers: [list]
- Important notes: [from notepad/memos]
- REMINDER: Run /after-work before ending this session
</remember>
```

This ensures that even if the conversation gets compacted mid-session, the critical context persists.

## Step 4: Ask How to Proceed

Use `AskUserQuestion` with these options:

- **Start with suggested task** - Begin the recommended task
- **Show full previous worklog** - Display complete after-work log
- **Show all memos & notes** - Display every memo file found
- **I have a different task** - User will direct
- **Just the summary** - End briefing here

## Edge Cases

**No worklog found:**
```
No previous session worklog found. Fresh start!
[Show git status + project overview instead]
[Check for AGENTS.md, CLAUDE.md for project orientation]
```

**Stale worklog (>7 days):**
Add a note: "Last session was N days ago - context may be outdated. Consider reviewing more recent git history."

**No git repo:**
Skip git sections, focus on worklog, notepad, and memo content.

**Multiple projects in worklog:**
If latest.md refers to a different project than current directory, note this clearly and offer to show project-specific worklog from `.omc/worklog/latest.md` instead.

## Rules

- Keep briefing under 50 lines total - concise and actionable
- File paths should be project-relative where possible
- Don't start any actual work until user confirms direction
- ALWAYS inject remember tags - this is the key anti-amnesia mechanism
- If plan wisdom directories exist, ALWAYS read them - these contain critical decisions
- Use `explore` agent for any codebase scanning if needed
- Highlight any BLOCKERS or ISSUES prominently - these need attention first
