---
session_date: "2026-05-11 21:00"
project: "Plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\elastic-darwin-382a48"
duration_estimate: "~2.5h (2 commit, PR #303)"
---

## Completed Work — 6 files, +412 -104 net

### PR #303 (2 commit, same branch claude/elastic-darwin-382a48)

**Commit 1d8b30f — Pin indicator 위치 이동 (3 entity 통일)**
- PR #301 follow-up. 사용자 시그널: title 옆 → status chip 옆
- "Pin 통일 = 모든 entity 표준" LOCKED 원칙 적용
- `notes-table.tsx`: a-row__lead title 뒤 → status cell StatusBadge 뒤 (gap-1.5)
- `wiki-list.tsx`: title span 직후 → status column Stub/Article 배지 뒤 (gap-1.5, mx-1 제거)
- `book-table.tsx`: title case inline → kind case BookKindChip 뒤 (inline-flex gap-1.5 wrapper)
- 사용자 통찰: "1 하면 자동으로 2가 되는 거 아니냐" → Books도 같이 (통일 원칙)

**Commit 42c6e59 — Wiki UX 3 이슈 일괄 fix**
1. **우클릭 메뉴 위치 fix**: `setMenuOpen(true)` + DotsThree Popover anchor 고정 문제 → Radix `<ContextMenu>` wrapper로 cursor 추적. 기존 DotsThree click Popover는 hover affordance로 보존
2. **플로팅 바 확장**: Merge/Split/Delete만 있던 wiki-floating-action-bar에 Pin/Unpin (batch mixed→pin) / Move to folder (FolderPicker kind="wiki") / Add to category (새 CategoryAddPopover, multi-pick union) 3개 추가
3. **갤러리 카드 우클릭 fix**: GalleryCard에 onContextMenu 없어서 브라우저 메뉴 출현 → (a) GalleryViewProps.renderContextMenu render-prop 추가, (b) GalleryCard forwardRef + spread rest props (Radix Slot asChild 프롭 전파), (c) wiki-view에서 동일 WikiArticleMenuItems helper mount

**DRY refactor**: 메뉴 콘텐츠 `WikiArticleMenuItems` helper로 export (wiki-list.tsx:82-176). 3 surface 공유 — row 우클릭 / DotsThree 클릭 Popover / gallery 카드 우클릭.

## In Progress
없음. 두 commit 모두 tsc 0 errors + build pass.

## Remaining Tasks

- [ ] **PR #303 사용자 manual verify → squash merge to main** — 두 commit 모두 검토 후 머지. 사용자가 직접 visual UX 확인 필요 (cursor 위치 / 플로팅 바 액션 / 갤러리 우클릭). PR URL: https://github.com/peterkwon248/linear-note-plot-/pull/303
- [ ] **Wiki 그룹 헤더 아이콘** — WikiList/WikiBoard 미적용 (~30분). Notes 패턴 그대로 적용하면 됨. 2026-05-12 마라톤에서 Notes만 했음
- [ ] **Books view-engine 10 PR 시리즈 회귀 점검 (P2)** — manual verify, 발견 즉시 fix

## Key Decisions (영구)

- **Pin 위치 = status chip 옆 (3 entity 통일)**: 사용자 시그널 명확. Books는 inline + dedicated pinned column 둘 다 옵션이지만, 기본 위치는 kind chip 옆으로 통일.
- **WikiArticleMenuItems helper DRY**: 메뉴 콘텐츠를 단일 source로 export. row 우클릭 / DotsThree Popover / gallery 카드 우클릭 3 surface 공유.
- **GalleryCard forwardRef + spread rest**: Radix asChild 한계 우회. function component에서 props/ref를 underlying DOM element에 직접 forward. `{...rest}` spread는 className 등 다른 prop도 caller가 합칠 수 있게 함.
- **DotsThree click Popover 보존**: ContextMenu refactor 후에도 hover affordance 보존 (사용자가 우클릭 모를 수도 있어 click 진입로 유지).

## Technical Learnings

- **Radix `<ContextMenu>` vs `<Popover>`**: ContextMenu는 clientX/clientY에 자동 anchor (cursor 추적), Popover는 PopoverTrigger element 위치에 고정. cursor-aware UX는 무조건 ContextMenu.
- **Radix `asChild` + function component 한계**: cloneElement는 immediate child에만 props 전달. function component가 자식이면 그 내부에서 명시적으로 ref/props를 underlying DOM에 forward해야 작동. forwardRef + `{...rest}` 패턴이 표준.
- **`display: contents` wrapper**: grid item 안에서 wrapper div가 box 생성 안 해도 자식이 직접 grid 참여. event bubble은 정상. renderContextMenu 패턴에서 유용.
- **React fiber inspection**: `__reactProps$xxx` 키로 컴포넌트의 실제 props 즉시 확인 가능 (dev tool 없이 dev server eval로 디버깅). 이번 세션에서 GalleryCard onContextMenu prop이 undefined임을 확인하는 데 핵심.
- **WikiArticle.id 시드 ID 규칙**: 기존 seeds는 `wiki-zettelkasten` 같은 sluggified ID 사용. dump time에 wiki-1/wiki-2 같은 ID도 있어 IDB persisted state와 store 상태 불일치 가능성. 디버깅 시 React fiber로 실제 prop 값 확인 필수.

## Blockers / Issues
없음.

## Environment & Config

- **Branch**: claude/elastic-darwin-382a48 (worktree `.claude/worktrees/elastic-darwin-382a48`)
- **Build**: `npm run build` exit 0, `Compiled successfully`, 37/37 static pages prerendered
- **Tests**: 변경 없음 (테스트 추가 안 함, 255/255 유지 가정)
- **Store version**: v129 (이전 세션 그대로, 이번 세션 migration 없음)
- **PR**: #303 — 2 commit 누적, 사용자 verify 대기

## Notes for Next Session

1. `/before-work` 첫 명령
2. PR #303 머지 여부 확인 (사용자 manual verify 끝났는지)
3. 머지됐다면 → next P1: Wiki 그룹 헤더 아이콘 (Notes 패턴 그대로)
4. 머지 안 됐다면 → 추가 회귀/요청 fix
5. Pin / 플로팅바 / 갤러리 외에 다른 Wiki UX 회귀 발견 시 즉시 follow-up

## Files Modified
- `components/notes-table.tsx` — Pin block 1771-1777 제거, status cell 1797-1809에 gap-1.5 + PushPin sibling 추가
- `components/views/wiki-list.tsx` — Pin 338-344 제거, status column 339-370에 gap-1.5 + PushPin sibling 추가. WikiArticleMenuItems helper export (line 82-176). ArticleTableRow를 `<ContextMenu>` wrapper로 감쌈, onContextMenu 핸들러 제거, hasMenu 분기. DotsThree Popover는 보존하되 콘텐츠 helper로 교체
- `components/books/book-table.tsx` — title case에서 inline pin 제거, kind case를 `<span inline-flex gap-1.5>` wrapper로 감싸 BookKindChip + PushPin sibling
- `components/views/gallery-view.tsx` — GalleryViewProps.renderContextMenu render-prop 추가, Grid component prop passthrough, GalleryCard를 React.forwardRef<HTMLElement> + spread rest props로 변경. import React 추가
- `components/views/wiki-view.tsx` — WikiArticleMenuItems import, ContextMenu primitives import, `<GalleryView renderContextMenu>` 연결 (line 1321-1361). 동일 핸들러 (onMerge/Split/Delete/ShowConnected)로 wiki-list와 정합
- `components/wiki-floating-action-bar.tsx` — Pin/Unpin 버튼 (allPinned/mixed UX), Move Popover (FolderPicker kind="wiki"), Add to category (새 CategoryAddPopover sub-component, multi-pick + Apply). updateWikiArticle / setWikiFolders / wikiCategories store hook 추가
