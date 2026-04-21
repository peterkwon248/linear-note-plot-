---
session_date: "2026-04-21 20:00"
project: "linear-note-plot-"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\awesome-lamport-50c704"
duration_estimate: "~5-6시간 (Phase 2B-3c + 2C Step 1-4 + 2B-3 확산 + 3A-1 + 기존 Wiki PR 컴포넌트 전면 재사용 리팩토링)"
---

## Completed Work

- **Phase 2B-3c — Section heading 인라인 편집** (`components/book/shells/wiki-shell.tsx`)
  - EditableSectionHeading: 클릭 → input swap / Enter save / Escape cancel / onBlur save
  - 섹션 번호 prefix 유지

- **Phase 2C Step 1-4 (UX 정렬)**
  - Step 1: `book-editor.tsx` 상단 bar 대청소 — 5 shell 버튼 / Grid Editor / Flipbook / Show Tweaks 전부 삭제, Grid Editor mode 브랜치 삭제, `mode` → `renderMode` controlled prop
  - Step 2: `BookWorkspace`에 `ViewHeader`(Notes 패턴) 도입 + Edit/Done 토글 재배치 + `usePane` 대응
  - Step 3: `components/book/book-display-panel.tsx` 신규 — 300px 팝오버 10 섹션 (Shell/Render mode/Typography/Margins/Columns/Chapter breaks/Background/Card border/Ink colors/Decoration) + Chip/ColorRow/CheckRow 헬퍼
  - Step 4: `secondary-panel-content.tsx`의 `/wiki` → `BookWorkspace` 교체 + `SmartSidePanel` sidePanelContext 동기화 + SplitViewButton 활용

- **P0 렌더 버그 수정** — EditableParagraph가 `useWikiBlockContentJson`의 `content` 필드 활용 (partialize가 block.text 스트립하는 문제). `initialText={content || block.text}` 1줄

- **WikiTextEditor 재사용 (허접 에디터 해결)**
  - `wiki-block-renderer.tsx:788` `function WikiTextEditor` → `export function`
  - BookInlineEditor 폐기/삭제
  - EditableParagraph가 WikiTextEditor 사용 → FixedToolbar 31버튼 + 슬래시/위키링크/멘션/각주 전부 활성

- **Phase 2B-3 확산 (4 shell)**
  - `components/book/shared-editable.tsx` 신규 — EditableParagraph / EditableSectionHeading / EmptyBookCTA + `useBlockEditHelpers` hook (handleAddBlock 타입 dispatch 내재화)
  - Magazine / Newspaper / Book / Blank shell 전부 editing prop + BookBlockSlot 래핑 + 각 레이아웃 맞춤 edit UI
  - book-editor.tsx에서 editing prop 전파

- **Phase 3A-1 (Wiki shell 블록 드래그 reorder)**
  - `components/book/book-dnd-provider.tsx` 신규 — DndContext + SortableContext + PointerSensor `activationConstraint.distance=5` (클릭과 드래그 공존) + onDragEnd → `moveWikiBlock`
  - BookBlockSlot에 `useSortable({id: blockId, disabled: !blockId})` + transform/transition/listeners, `⠿` 버튼 drag handle + `touchAction: none`
  - Wiki shell body를 BookDndProvider 래핑

- **WikiBlockRenderer fallback (Wiki shell)**
  - wiki-shell.tsx `realBody` 매핑에서 heading/paragraph 외엔 원본 Book Block type 보존
  - 렌더 루프 끝에 `<WikiBlockRenderer block={wb} articleId={book.id} editable={editing} />` fallback → Infobox/TOC/Pull Quote/Image/URL/Table 실제 chrome 렌더

- **AddBlockButton 재사용 (위키 스타일 picker)**
  - BookBlockSlot의 자체 hairline+picker 8-option 삭제 → `AddBlockButton` (wiki-block-renderer) 호출
  - 13 옵션: Structure(Section/Text/Note/Image/URL/Table/Infobox/TOC/Pull Quote) + Content(Callout/Blockquote/Toggle/Spacer)
  - `useBlockEditHelpers.buildInsertBelow` 시그니처를 `(type: string, level?: number) => void`로 확장

- **docs 업데이트**: CONTEXT.md / MEMORY.md / NEXT-ACTION.md 세션 내용 반영

## In Progress

없음 — 모든 시작한 작업 완료.

## Remaining Tasks

- [ ] **Magazine/Newspaper/Book/Blank shell에도 WikiBlockRenderer fallback 확산** — wiki-shell만 Infobox/TOC 등 실제 렌더. 나머지 4 shell은 "p"로 fallthrough. 수정: 각 shell `realBody`에서 원본 type 보존 + wiki-shell.tsx 렌더 루프 끝의 fallback 패턴 복사
- [ ] **Phase 3A-2: 4 shell 드래그 reorder** — Magazine(CSS `columnCount`) + Book(dropcap float)의 dnd transform 충돌 검증. Blank shell부터 시작 권장
- [ ] **AddBlockButton `nearestSectionLevel` 전달** — Subsection(H3/H4) 옵션 활성화. `wiki-article-renderer.tsx`의 `nearestSectionLevelByBlockId` 계산 로직 포팅
- [ ] **상단 auto CONTENTS와 TOC block 중복 정리** — wiki-shell hardcoded `realToc` + 실제 TOC block 동시 표시. TOC block 있을 때 auto 숨기기
- [ ] **Seed contentJson 파싱** — `[[wiki:Plot]]` `@mention` `#tag` 마크업이 Book + Notes 전역 plain text로 렌더됨. seed plaintext → TipTap nodes 변환 helper 필요
- [ ] **Phase 3A 본 목표: 12-col grid snap** (Magazine/Newspaper multi-col)

## Key Decisions

- **사용자 규칙 강조됨 (2회)**: "과거 PR의 기존 컴포넌트 재사용 우선" — 새로 구현 시 "허접" 평가. Plot wiki PR 산출물(WikiTextEditor/WikiBlockRenderer/AddBlockButton/handleAddBlock/getInitialContentJson) export 또는 재호출해서 Book에서 재사용하는 게 정답. **앞으로 비슷한 구현 요구 시 먼저 기존 코드 `Grep export function` 검색**
- **BookDndProvider 범위 제한**: Wiki shell 먼저 적용. Magazine(CSS columns) + Book(dropcap float)는 Phase 3A-2로 분리
- **Display 팝오버는 Book 전용 섹션 구조** — Notes DisplayPanel 구조 억지로 맞추지 않음
- **WikiTextEditor의 per-block FixedToolbar 유지** (글로벌 통합 고려 안 함, wiki/notes와 동일)

## Technical Learnings

- **persist `partialize`가 `article.blocks[i].content` 스트립** — hydrate 후 memory `block.text = ""`. 실 content는 `plot-wiki-block-bodies` IDB + `plot-wiki-block-meta` IDB에서 lazy load. EditableParagraph가 `useWikiBlockContentJson` 훅의 `content` 필드 반드시 destructure해야 함
- **`WikiBlockRenderer` export 이미 존재** (wiki-block-renderer.tsx:89) — 모든 wiki block type 지원
- **`AddBlockButton` export 이미 존재** (wiki-block-renderer.tsx:1854) — 13 옵션, portal popup + hairline hover, `nearestSectionLevel` prop
- **`handleAddBlock` 타입 dispatch** (hooks/use-wiki-block-actions.ts:24) — `text:callout` / `table` / `url` / 일반 type 분기
- **dnd-kit `activationConstraint.distance=5`** — 클릭 메뉴와 드래그 reorder 공존
- **`usePane` 훅 기본값 `'primary'`** — BookWorkspace가 secondary에 들어가도 context 안전
- **Next.js 16 webpack build + tsc 둘 다 clean** (exit 0)

## Blockers / Issues

- **상단 auto CONTENTS와 TOC block 중복 표시** — 기능 영향 없지만 시각적 중복. wiki-shell.tsx `realToc` 조건부 처리 필요
- **Hydration mismatch** (AppLayout, pre-existing) — 기능 영향 없음
- **Yjs 중복 import warning** (pre-existing)
- **`registry.ts:63` RemixiconComponentType** — Turbopack 에러, webpack 통과 (pre-existing)

## Environment & Config

- **Worktree**: `.claude/worktrees/awesome-lamport-50c704` / branch `claude/awesome-lamport-50c704`
- **Dev**: Next.js 16 webpack, port 3002 (preview_start 사용 중)
- **Stack**: React 19 / TypeScript / Zustand 5 / TipTap 3 / dnd-kit / Tailwind v4
- **Store v80**, wikiArticles 배열, block bodies IDB + block meta IDB
- **Commands**: `npm run build` (exit 0), `npm run test -- --run`, `npx tsc --noEmit` (exit 0)
- **`window.__plotStore`** dev-only binding 사용 가능

## Notes for Next Session

- `before-work` 실행 → `docs/NEXT-ACTION.md` Step 1 (WikiBlockRenderer fallback 4 shell 확산)부터
- 사용자 규칙 "과거 PR 재사용" 매 기능마다 적용 — 먼저 `Grep export function` 검색
- Magazine shell dnd는 CSS `columnCount` 안의 transform 동작 테스트 필요
- `docs/NEXT-ACTION.md`의 Last Updated 항상 갱신
- 커밋 타이밍은 사용자 제어 — `/after-work` 할 때만

## Files Modified

### 신규 (3)
- `components/book/book-display-panel.tsx`
- `components/book/book-dnd-provider.tsx`
- `components/book/shared-editable.tsx`

### 수정 (11)
- `components/book/book-block-slot.tsx`
- `components/book/book-editor.tsx`
- `components/book/book-workspace.tsx`
- `components/book/shells/wiki-shell.tsx`
- `components/book/shells/magazine-shell.tsx`
- `components/book/shells/newspaper-shell.tsx`
- `components/book/shells/book-shell.tsx`
- `components/book/shells/blank-shell.tsx`
- `components/wiki-editor/wiki-block-renderer.tsx` (1문자: export 추가)
- `components/workspace/secondary-panel-content.tsx`
- `.claude/settings.local.json`

### 삭제 (2)
- `components/book/book-inline-editor.tsx`
- `components/book/tweak-panel.tsx`

### docs (3)
- `docs/NEXT-ACTION.md`
- `docs/CONTEXT.md`
- `docs/MEMORY.md`

**통계**: +803 / -1229 lines across 16 files. Build: PASS.
