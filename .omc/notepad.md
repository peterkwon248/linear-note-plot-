# Session Notepad (Updated: 2026-05-01 04:30)

## Critical Context

- **이번 세션 PR 4건 머지 완료**: #229 (Parent/Children) / #230 (Linear filter + Notes Index, 22 files) / #231 (라이트모드 가시성 78 files sed) / #232 (Ontology 그래프 + WikiArticle 노드)
- **Store v96 적용** — wikiCategories dedup 마이그레이션 (legacy 17개 → 10개)
- **다음 세션은 새 worktree에서** — 이번 worktree는 작업 완료
- **합의된 다음 작업**: Quicklinks / Quickfilters 통합 / 사이드바 Inline Edit Mode

## Active Tasks (다음 세션 즉시 시작 가능)

- [ ] **Library References/Tags/Files 페이지** 가시성 + 디자인 통일 (All Notes 수준)
- [ ] **Library Filter/Display 디자인** (All Notes 수준)
- [ ] **Quicklinks** — globalBookmarks anchorType 확장 (folder/savedView/category) + Home prominent + 영역별 사이드바 하단 collapsed (8px slide)
- [ ] **Quickfilters 통합** — view-configs.quickFilters → SavedView 자동 시드 (builtin: boolean) + 사이드바 "Views" 섹션에 통합 (🔒 시스템 + ⭐ 사용자)
- [ ] **사이드바 Inline Edit Mode** — DotsSix 핸들 + 드래그 + 👁 hide/show + sidebarCustomization (영역별 persist)

## Polished Decisions (이번 세션)

- **필터 칩 4-part Linear 패턴 채택** — `icon + field | op | value | ×`
- **Quicklinks 위치**: Home prominent + 영역별 collapsed
- **Quickfilters/Views 한 섹션 통합** — 시스템(🔒) / 사용자(⭐) 마크
- **사이드바 customize**: Inline Edit Mode (8px slide-right + DotsSix), 영역별 persist
- **WikiArticle 그래프 노드 통합** — legacy isWiki 모델 deprecated
- **체크박스 단일 패턴** — `bg-card border-zinc-400` + `bg-accent` + `PhCheck text-accent-foreground`

## Blockers

- 없음

## Known Gotchas (다음 세션 주의)

- **Tailwind `border-[1.5px]`은 v4에서 미적용** → `style={{ borderWidth: "1.5px" }}` 직접
- **라이트모드 alpha 사용 자제** — `/30~/50`은 흰 배경에서 거의 안 보임. `/60+` 또는 `var(--muted-foreground)` 직접
- **체크박스/필터 칩은 단일 패턴 따를 것** — PR #230, #232에서 정의됨
- **buildOntologyGraphData에 entity 추가 시 prefix 사용** — `wiki:{id}` 등 (noteId 충돌 방지)
- **formatFilterChip 헬퍼**가 모든 필터 case 분해 — 새 필터 추가 시 거기에 case 추가

## Resume Commands

```bash
# 새 worktree에서 시작
cd C:/Users/user/Desktop/linear-note-plot-
git pull origin main
# 새 worktree 만들기 (claude code가 자동)
npm install  # in new worktree
```
