# Session Notepad (Updated: 2026-05-11 09:30 마라톤)

## Critical Context

### 이번 세션 마라톤 — 27 파일 (+735 / -847), 2 파일 삭제
- **9 카테고리 작업**: 이슈 2 (책 목차) / 이슈 3 (BookContextNav 좌측) / 이슈 4 (위키 breadcrumb) / Read mode ←/→ / 이슈 1 (책 split view 풀 지원) / Dual mode 완전 폐기 / 갤러리 entity-agnostic / 그룹 헤더 아이콘 통일 / Status 색 강화
- **Store v122 migration**: viewMode "dual" → "list" (idempotent)
- **TSC clean + Build pass** (exit 0)

### 큰 영구 결정 (이번 세션)
- **Dual mode 폐기 LOCKED** — Split view + list로 충분
- **갤러리 = entity-agnostic generic** — GalleryItem interface (Notes/Wiki/Refs adapter)
- **단일 클릭 = 풀 에디터** (preview pane → openNote)
- **Books split view 풀 지원** — 5 케이스 모두 secondary pane 인프라 활용
- **Stone 색 = toasted sand** — warm earthy (zinc neutral 폐기)
- **그룹 헤더 아이콘 view 간 통일** — list/board/gallery 같은 패턴
- **키보드 단축키 ⌘[/⌘] + ←/→ 공존** — modifier (Safari) + plain (Reader)

### 기술 학습
- NOTE_STATUS_COLORS stale CSS var (chart vars → status vars, 1줄 fix로 전체 일관성)
- `e.target` window일 때 `closest` undefined (synthetic event 방어, optional chain)
- WorkspaceEditorArea NotesTableView 전용 (layout.tsx가 비-table route split 처리)
- SecondaryPanelContent priority (books route > secondaryNoteId)
- notes-table GroupHeaderIcon label vs groupKey (NoteStatus cast 시 groupKey 필수)
- `.gallery-cover` + `--cover-color` 변수 (CSS class light/dark 분기 패턴)

## Active Tasks (다음 세션 결정 대기)

- [ ] **Books view-engine 풀 통합** — 사용자 brainstorm 중 (옵션 A 풀 vs 단계적). ~5-6h. filter(컨텐츠 타입/Smart vs Manual/Pinned) + sort + group + view modes(grid/list/gallery/board). 핵심 가치: 컨텐츠 타입 필터 (note-only / wiki-only / mixed)
- [ ] **Wiki 그룹 헤더 아이콘** — WikiList/WikiBoard 미적용 (~30분, Notes 패턴 그대로)

## Blockers
없음.

## 다음 세션 시작 시

1. `/before-work` 첫 명령
2. Books view-engine 통합 결정 (사용자 의논 대기 — A 풀 vs 단계적)
3. 결정 후 작업 시작 (옵션 A면 ~5-6h, 단계적이면 sort/list부터)
