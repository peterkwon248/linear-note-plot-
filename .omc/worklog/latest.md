---
session_date: "2026-05-01 04:30"
project: "Plot"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/crazy-jones-cdb47c"
duration_estimate: "~10 hours"
prs_merged: "#229, #230, #231, #232"
---

## Completed Work
- **PR #229** Notes/Wiki Parent·Children 컬럼 + Hierarchy 4분류 + StatusBadge border
- **PR #230** Linear-style 필터/디자인 종합 개편 (22 files, +425/-178):
  - 필터 칩 4-part Linear 패턴 (icon + field | op | value | ×)
  - Order by chip 3-part (key | value+direction | ×)
  - 필터 mismatch 2건 수정 (Pinned yes/no → true/false, Content hasImage/hasCode/hasTable 정규식 구현)
  - 라벨 테두리 1.5px borderWidth + color-mix 55%
  - Notes Index 토글 (Wiki 패턴 이식, groupByInitial)
  - Children hover tooltip (Radix Tooltip)
  - wikiCategories dedup v95 → v96 (17 → 10개)
  - Wiki 아이콘 BookOpen 통일, 체크박스 text-accent-foreground 통일
- **PR #231** 라이트모드 가시성 일괄 강화 (78 files):
  - sed 시스템적 변경: text-muted-foreground/20~50 → /50~70
  - Library Needs Attention banner 강화
  - Wiki article Updated/Aliases muted-foreground full
- **PR #232** Ontology 그래프 + Wiki Article 노드 통합 + Labels/Library/Calendar (6 files):
  - 노드 라벨 var(--foreground), 엣지 var(--muted-foreground)
  - WikiArticle을 그래프 노드로 통합 (wiki:{id} prefix, parent-child + note-ref edges)
  - Library Needs Attention border-2 amber-600/60
  - Labels 페이지 컬럼 + 체크박스 통일 (Notes 테이블 수준)
  - Calendar 요일 헤더 text-foreground

## In Progress
- 없음 (이번 세션 작업 모두 머지 완료)

## Remaining Tasks
- [ ] Library References/Tags/Files 페이지 가시성 + 디자인 통일 (All Notes 수준)
- [ ] Library Filter/Display 디자인 (All Notes 수준 통일)
- [ ] Quicklinks — globalBookmarks anchorType 확장 (folder/savedView/category) + Home prominent + 영역별 사이드바 하단 collapsed (8px slide animation)
- [ ] Quickfilters 통합 — view-configs.quickFilters를 SavedView로 자동 시드 (builtin: boolean), 필터 드롭다운 Quick Filters 제거, 사이드바 "Views" 섹션에 시스템(🔒) + 사용자(⭐) 통합
- [ ] 사이드바 Inline Edit Mode — DotsSix 핸들 + 8px slide-right + 드래그 순서 + 👁 hide/show + sidebarCustomization persist (영역별)
- [ ] Notes Index 개선/refinement (필요시)

## Key Decisions
- **필터 칩 4-part 채택** (옵션 A) — 모든 케이스 일관
- **Quicklinks**: Home prominent + 영역별 collapsed (영역별 persist) + 키보드 shortcut
- **Quickfilters/Views 통합**: 한 섹션, 시스템(🔒)/사용자(⭐) 마크
- **사이드바 customize**: Inline Edit Mode (Linear/Notion 패턴), 영역별 sidebarCustomization
- **WikiArticle 그래프 통합** — legacy isWiki 모델 deprecated
- **체크박스 단일 패턴** — bg-card border-zinc-400 + bg-accent + PhCheck text-accent-foreground

## Technical Learnings
- 라이트모드 muted-foreground (#52525b) 자체는 진하지만 alpha /30~/50은 흰 배경에서 거의 안 보임
- Tailwind /숫자 alpha는 sed 일괄 변경 가능 (순서 신경 — /50 먼저, 그 다음 /40, /30)
- buildOntologyGraphData에 WikiArticle 추가 시 `wiki:{id}` prefix로 noteId 충돌 방지
- ProseMirror placeholder는 EditorStyles.css `.is-editor-empty:first-child::before`로 통일 관리
- Tailwind `border-[1.5px]`은 v4에서 미적용 → `style={{ borderWidth: "1.5px" }}` 직접 inline
- formatFilterLabel 외에 formatFilterChip 헬퍼로 4-part 분해 가능

## Blockers / Issues
- 없음

## Environment & Config
- Store version: v96 (wikiCategories dedup 마이그레이션 적용됨)
- Worktree: crazy-jones-cdb47c (PR 4건 머지 완료)
- Build: type check pass, dev server reuse 가능

## Notes for Next Session
- 새 worktree에서 시작 권장 (이번 worktree는 작업 완료)
- `git pull origin main` → `npm install`
- 다음 작업은 Quicklinks / Quickfilters 통합 / 사이드바 Inline Edit Mode 셋 중 선택
- 라이트모드 새 코드 작성 시 `text-muted-foreground/30~50` 사용 자제 (`/60+` 또는 `var(--muted-foreground)`)
- 새 체크박스/필터 칩은 PR #230, #232에서 정의된 단일 패턴 따를 것

## Files Modified
- PR #229: notes-table.tsx, view-configs.tsx, filter.ts (Parent/Children 컬럼)
- PR #230 (22 files): note-fields, notes-table, calendar-view, filter-bar, filter-panel, side-panel/*, views/wiki-*, views/library-view, views/home-view, view-configs, store/index, store/migrate
- PR #231 (78 files): sed 일괄 (components 전반) + comments-by-entity, wiki-article-view, library-view, etc.
- PR #232 (6 files): ontology-graph-canvas, ontology-view, lib/graph.ts, labels-view, library-view, calendar-view
