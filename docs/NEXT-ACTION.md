# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-12 (밤) — Priority 영구 폐기 + UI 선명화 + Books polish + Wiki 그룹 헤더
**머신**: (다른 컴퓨터로 이어감)
**현재 main HEAD**: 6c4a42d (PR #302 머지 후)
**현재 PR**: #304 OPEN (2 commit 누적, 머지 대기)
**Store version**: v129 → **v130** (priority strip migration)

---

## 🎯 다음 즉시 액션

### 🔴 0. PR #304 visual 검증 (FIRST)

PR #304 — 통합 cleanup 2 commit OPEN 상태. 머지 전 visual 회귀 확인.

**검증 항목**:
1. **Priority 흔적 완전 사라짐**:
   - Notes/Wiki/Books DisplayProperties popover에 "Priority" 토글 X
   - Sort options에 "Priority" X
   - Group options에 "Priority" X
   - Filter에 "Priority" X
   - 노트 detail/edit UI에 priority 필드 X
2. **그룹 헤더 통일 (Linear list-grouped 스타일)**:
   - Notes list × groupBy=family → "ZETTELKASTEN 1" 큰 폰트 + foreground + Tree icon 좌측
   - Notes list × groupBy=status → 동일 패턴 + StatusShapeIcon
   - Notes list × groupBy=label → color dot
   - Wiki list × groupBy=family/label → 동일 통일 패턴
   - Wiki board → BoardColumn 헤더 + 16px 아이콘
3. **컬럼 헤더 선명화**:
   - Name / Index / Status / Folder / Parent / Backlinks / Reads / Words / Updated / Created → 모두 foreground + font-medium
4. **Toolbar 우측 아이콘 선명**:
   - Save view, Filter, Display, Side panel, Split, + 버튼 — 흐릿 X
5. **Books**:
   - Pin이 title 우측 inline (kind chip 옆 X)
   - index 컬럼 표시됨 (1, 2, 3, ...)
   - DisplayProperties에 "Pin" 토글 X (제거됨)
6. **SourceIcon 완전 사라짐**:
   - 모든 row title 옆 ✏️ (PencilSimple) 안 보임
   - source 정보는 detail panel에만

**검증 방법**:
- dev server (port 3002, `npm run dev`) reload 필수 (v130 migration trigger)
- 각 entity (Notes/Wiki/Books) list/board/gallery view 순회
- DisplayProperties popover 열어서 모든 항목 검사

**OK 결과 시**: `gh pr merge 304 --squash --delete-branch=false` (또는 GitHub UI에서 squash merge)
**회귀 발견 시**: 즉시 fix → commit → push to same branch → 재verify

### 🟡 1. Imperial Design System plugin 동작 테스트 (별개 프로젝트)

새 Claude Code 세션을 **빈 폴더**에서 시작:
```
/plugin install github.com/peterkwon248/imperial-design-system
/plugin list  # imperial-design-system 등록 확인
/help  # new-mockup/new-landing/new-graphic/handoff/design-review 5개 슬래시 커맨드 확인
```

또는 Local install 이미 됨 (`~/.claude/plugins/imperial-design-system/`) → Claude Code 재시작만으로 인식.

### 🟢 2. docs 정리 (낮은 우선순위, 시간 있을 때)

이번 세션에서 priority 폐기됐는데 다음 docs는 아직 priority 언급 남음 (stale, historical document일 수도):
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` — Note 타입 정의에 priority 필드 + SortField/GroupBy/CSS 토큰
- `docs/UI-CONSISTENCY-AUDIT.md` — priority 비교 row (이제 무의미)
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` — `--v3-priority-*` namespace 격리 결정 (priority 폐기로 무의미)

PRD는 historical 기록이므로 retain할 수도. 또는 "2026-05-12: Priority 영구 폐기됨" 노트 추가.

---

## 🧠 잊지 말 것 (영구 결정, 2026-05-12 밤 세션)

### Priority 영구 폐기 (LOCKED)
- NotePriority type, Note.priority 필드, PriorityBadge/Chip/Dropdown, autopilot set_priority, view-engine priority sort/filter/group 모두 제거
- Store v130 migration idempotent (priority 필드 strip)
- 247 tests pass
- **재도입 금지** — Plot 정체성 = Zettelkasten, 이슈 트래킹 X

### Pin = identity, not meta toggle (LOCKED)
- Linear 패턴. DisplayProperties 토글 X
- Notes/Wiki/Books 모두 Name 옆 inline (title 우측)
- PR #303 (어제 Pin status chip 옆 이동) 폐기 → close

### SourceIcon 완전 폐기 (LOCKED)
- 모든 row 항상 표시 = visual noise
- source 정보는 detail panel에만

### 그룹 헤더 = Linear list-grouped 스타일 (LOCKED)
- 큰 foreground 폰트 + dim icon + 자연 case
- Board column UPPERCASE 패턴과 구분

### 컬럼 헤더 + Toolbar 아이콘 (LOCKED)
- text-foreground + font-medium (uppercase/tracking 제거)
- Toolbar inactive: full opacity muted-foreground

---

## 환경 정보

- **Plot Branch**: `claude/vigilant-williams-c2db1c` (PR #304 OPEN)
- **Worktree**: `.claude/worktrees/vigilant-williams-c2db1c/`
- **다른 컴퓨터 시작**: `git fetch origin && git checkout claude/vigilant-williams-c2db1c && git pull`
- **Dev server**: `npm run dev` (port 3002), reload 필수 (v130 migration)
- **Imperial repo**: github.com/peterkwon248/imperial-design-system (PUBLIC, v0.3.0)
