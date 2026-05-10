---
session_date: "2026-05-11 09:30"
project: "Plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\lucid-agnesi-b963f3"
duration_estimate: "~12h+ (마라톤 세션, 9 큰 카테고리)"
---

## Completed Work — 27 files (+735 / -847), 2 신규 파일

### 9 카테고리 작업

**1. 이슈 2 — 책 목차 드롭다운 (kind + status icons + 색 버그 fix)**
- BookContextNav 드롭다운에 [숫자][kind icon][status icon][title] layout
- Kind icon: Note=cyan, BookOpen=violet (KNOWLEDGE_INDEX_COLORS)
- Status icon: StatusShapeIcon(note) / IconWikiStub/Article(wiki)
- **부수 fix**: NOTE_STATUS_COLORS stale `var(--chart-*)` → `var(--status-*)` (lib/colors.ts)
- Plot 전체 stone 색 다크모드 cyan 버그 자동 해소

**2. 이슈 3 — NoteEditor BookContextNav 좌측 통일**
- 우측 controls → 좌측 EditorBreadcrumb 그룹 옆으로 이동
- 노트/위키 동일 layout

**3. 이슈 4 — BookWikiReader article breadcrumb**
- "Books > Article Title" breadcrumb 추가 (좌측 그룹)

**4. Read mode 키보드 ←/→**
- NoteEditor + BookWikiReader + SecondaryWikiArticle 모두
- ⌘[ ⌘] (modifier) + plain ←/→ (read mode 전용)
- `target.closest?.()` optional chain 방어

**5. 이슈 1 — 책 Split View 풀 지원 (~4h)**
- SecondaryViewRouter에 /books + /books/{id} case
- BookDetailPage pane-aware (readingEntityId, cleanup pane-scoped)
- BooksView pane-aware (useActiveRoute ↔ useSecondaryRoute)
- layout.tsx hasViewSplit fix (book route는 layout이 split 그림)
- SecondaryPanelContent priority (books route > secondaryNoteId)
- 5 케이스 모두 동작

**6. Dual mode 완전 폐기 (10 파일)**
- ViewMode + VALID_VIEW_MODES + supportedModes 정리
- DisplayPanel Dual 버튼 제거 + use-effective-view-mode.ts/dual-list-editor.tsx 삭제
- ⌘⇧E Dual toggle 제거 (read/edit toggle만 유지)
- Store v122 migration (viewMode dual → list)

**7. 갤러리 모드 entity-agnostic 리디자인**
- v3 mockup u-* 클래스 폐기 → Plot 토큰
- GalleryItem/GalleryGroup interface
- Notes/Wiki/References adapters
- 클릭 = 풀 에디터 (preview → openNote)
- .gallery-cover CSS class (light/dark alpha 분기)

**8. View-engine 그룹핑 + 그룹 헤더 아이콘 통일**
- Gallery 시간 그룹 폐기 → view-engine groupBy
- 그룹 헤더 아이콘: status=Shape / label=dot / folder/tag/family=icon
- notes-table-view + wiki-view + library-view gallery mount
- 버그 fix: notes-table GroupHeaderIcon label → groupKey
- NotesBoard column header 아이콘 통일

**9. Status 색 강화 (다크 모드)**
- Stone: gray → slate(A) → warm sand(B) → toasted sand 최종
- light `#c9a87c` / dark `#e8d5a3`
- Brick `#f59e0b`, Keystone `#2dd4bf` (다크)

## In Progress
없음. TSC clean + Build pass.

## Remaining Tasks

- [ ] **Books view-engine 풀 통합 (옵션 A)** — 사용자 brainstorm 중. ~5-6h. filter (컨텐츠 타입 / Smart vs Manual / Pinned), sort, group, view modes (grid/list/gallery/board). 결정 대기
- [ ] **Wiki 그룹 헤더 아이콘** — WikiList/WikiBoard 미적용 (~30분)

## Key Decisions

- **Dual mode 폐기 LOCKED** — Split view로 충분, 중복 메커니즘 제거
- **갤러리 entity-agnostic** — GalleryItem interface로 통합
- **단일 클릭 = 풀 에디터** — Plot 표준
- **Books split view 풀 지원** — secondary pane 인프라 활용
- **Stone 색 = toasted sand** — warm earthy
- **그룹 헤더 아이콘 view 간 통일**
- **⌘[/⌘] + ←/→ 공존** — 두 패턴 모두

## Technical Learnings

- NOTE_STATUS_COLORS stale CSS var bug (chart vars → status vars)
- e.target window일 때 closest undefined (synthetic test)
- WorkspaceEditorArea NotesTableView 전용 (layout.tsx가 외 처리)
- SecondaryPanelContent priority (books route 우선)
- notes-table GroupHeaderIcon label vs groupKey
- .gallery-cover + --cover-color custom property pattern (light/dark CSS 분기)

## Blockers / Issues
없음.

## Environment & Config

- Branch: `claude/lucid-agnesi-b963f3`
- Store v122 (Dual mode polished off)
- 27 files modified, 2 deleted
- Build: ✅ / TSC: ✅
- dev port 3002 / preview 12532

## Notes for Next Session

- 첫 명령: `/before-work`
- 추천 작업 1: Books view-engine 풀 통합 결정 + 작업 (~5-6h)
- 추천 작업 2: Wiki 그룹 헤더 아이콘 (~30분)
- 사용자 brainstorm 상태:
  - 컨텐츠 타입 필터 (note-only / wiki-only / mixed) 핵심 가치
  - View modes 우선순위: list > gallery > board
  - A 풀 통합 vs 단계적 결정 대기
