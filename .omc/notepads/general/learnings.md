# Technical Learnings

## 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 리디자인

### NOTE_STATUS_COLORS stale CSS var
- `lib/colors.ts`의 `NOTE_STATUS_COLORS.css`가 `var(--chart-2/3/5)` 가리킴 — globals.css에 정확한 `--status-stone/brick/keystone`가 따로 정의돼 있는데 코드가 stale reference.
- 다크 모드에서 stone이 cyan(#22d3ee)으로 보이던 진짜 원인.
- learnings.md의 v3 phase 1 의도("Mirrors --status-{stone,brick,keystone}")와 실제 코드 불일치.
- 1줄 fix로 Plot 전체 stone 색 일관성 회복 (사이드바, 그래프, 노트 테이블 등).

### `e.target` window일 때 `closest` undefined (synthetic event)
- `window.dispatchEvent(new KeyboardEvent(...))` 시 `event.target` = window.
- window는 HTMLElement 아니므로 `target.closest` = undefined.
- `target.closest('...')` 호출 → TypeError silent throw → 후속 코드 (preventDefault, goNext) 실행 안 됨.
- Real user keyboard input은 target = focused element라 문제 없음.
- **방어 패턴**: `target.closest?.()` optional chaining으로 graceful fallback.

### WorkspaceEditorArea는 NotesTableView 전용
- NotesTableView 안에서만 마운트되어 split panel을 자체 처리.
- 다른 view (BooksView, WikiView, LibraryView 등)는 layout.tsx가 split을 그려야.
- 기존 `hasViewSplit = !isEditing && hasSplit`은 `isEditing = !!selectedNoteId`라 book reading 시 ($selectedNoteId set) split panel 안 렌더.
- **fix**: `isEditingInTableView = isTableView && !!selectedNoteId`로 TABLE_VIEW_ROUTES 한정.
- 비-table route에서 selectedNoteId set이면 layout이 직접 split 렌더 (BookDetailPage가 reading mode 처리).

### SecondaryPanelContent priority
- 기본: `if (secondaryNoteId) return Editor`. secondaryNoteId 우선.
- 책 라우트 (`/books/{id}`) + secondaryNoteId 둘 다 set이면 BookDetailPage가 unmount → cleanup이 bookContext 클리어 → 책 컨텍스트 잃음.
- **fix**: `if (isBooksRoute) return SecondaryViewRouter` 우선. BookDetailPage가 reading mode를 자체 처리 (readingEntityId로 분기).

### notes-table GroupHeaderIcon label vs groupKey
- `label` = display alias ("Block" for keystone, "Article" for ...). 사용자 친화 이름.
- `groupKey` = raw status value ("keystone", "stone", "brick"). DB 정확 값.
- `<StatusShapeIcon status={label.toLowerCase() as NoteStatus}>` 패턴은 잠재 버그:
  - "Block" → label.toLowerCase()="block" → cast `NoteStatus`이지만 실제 value 아님
  - `NOTE_STATUS_COLORS["block"]` undefined → fallback `currentColor` → 부모 텍스트 색 (white in dark mode)
- **fix**: `groupKey as NoteStatus` 사용.

### CSS-aware color via color-mix + custom property
- 인라인 `style={{ background: ... }}`는 dark variant 불가 (정적).
- **해결**: CSS class + `--cover-color` 변수 set:
  ```css
  .gallery-cover {
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--cover-color) 75%, transparent) 0%,
      var(--cover-color) 100%);
  }
  .dark .gallery-cover {
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--cover-color) 50%, transparent) 0%,
      color-mix(in srgb, var(--cover-color) 85%, transparent) 100%);
  }
  ```
- JSX는 `style={{ "--cover-color": hex } as CSSProperties}` 변수만 set.
- Plot 토큰 패턴과 정합.

### Book secondary pane infrastructure
- Plot의 `_interceptForSecondary` 모듈 변수 + PaneProvider onClickCapture가 secondary pane 클릭 시 라우트 인터셉트.
- `secondaryRoute` (string) + `secondaryNoteId` (string) + `bookContext.secondary` (object) 3개 state로 secondary 책 reading 충분.
- BookDetailPage `pane === "primary"` 하드코딩만 제거하면 secondary mount 가능.
- 5 케이스 모두 단일 인프라로 커버.

### Stale wiki article trashed=true (test data)
- 이전 테스트에서 wiki article들이 `trashed: true`로 남아 있어 wiki list가 0으로 보임.
- Wiki list filter는 `!trashed`로 trash 항목 제외 — 정상 동작이지만 디버깅 시 헷갈림.
- 테스트 cleanup 시 wiki article의 trashed 필드도 확인 필요.

---

## 2026-05-09 (마라톤) — Book + Dual mode + Filter Path A 완성

### fractional-indexing 패턴 (Book Phase 1)
- sparse integer halving `(prev + next) / 2` → 50회 후 underflow (Number.MIN_VALUE)
- 해법: `fractional-indexing` npm package (~1KB, Linear/Figma/Tldraw 사용)
- `generateKeyBetween(prev, next)` → lexicographic key string
- Storage cost: ~5-10 bytes vs ~8 bytes (number) — acceptable
- Critic이 Book PRD에서 정확히 발견 (HIGH-2)

### VALID_VIEW_MODES 함정 (Dual mode)
- `lib/view-engine/types.ts`에 `ViewMode` union (TS) + `VALID_VIEW_MODES` array (runtime) 둘 다 존재
- TS union만 update하면 IDB hydration 시 `normalizeViewState`에서 silent fallback (default mode로 복귀)
- 두 곳 같이 update 필수
- Critic이 Dual PRD에서 정확히 발견 (HIGH-2)

### autoSaveId pattern (react-resizable-panels)
- `defaultSize={controlledValue}` 안 작동 (uncontrolled)
- `onResize → setState` 한 방향만 작동 (rehydrate 후 패널 위치 안 변경)
- 해법: `autoSaveId="dual-list-editor"` — 라이브러리 자체 persistence
- 별도 store 불필요

### SSR-safe hook 패턴
- `useEffect`로 mount 감지: `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])`
- pre-mount: persisted state 그대로 (hydration mismatch 회피)
- post-mount: viewport-aware logic
- 추가: transition-only debounced toast로 resize spam 방지 (200ms debounce + wasNarrow ref)

### Pane-scoped state 패턴 (bookContext)
- Plot의 SmartSidePanel dual pane 인프라 정합
- `bookContext: { primary: ... | null; secondary: ... | null }`
- `usePane()` hook으로 현재 pane 인지
- Same note in book A (primary) AND book B (secondary) 동시 가능

### Critic agent 가치
- 두 PRD (Book + Dual) 모두 6 issues 정확히 잡음
- "이름 충돌" / "runtime validator" / "shape mismatch" 같은 hidden assumptions 검출
- PRD 신선할 때 review = mid-implementation pivot 위험 회피

### NoteSplitOverlay vs Dual mode 이름 충돌
- 기존 `lib/note-split-mode.ts` + `NoteSplitOverlay` (`app/(app)/layout.tsx`) — 전혀 다른 개념인데 "split" 같은 단어 사용
- 해결: 새 기능 = "Dual mode" (rename)
- 우선순위: NoteSplitOverlay (z-40 overlay) 활성 시 Dual mode 시각 suppressed but state 보존

---

## 2026-05-07 (오후) — Phase B Inbox Layer 학습

### Memo backfill 함정 (영구 정책 인지 필요)
- `lib/store/slices/notes.ts:16-28` — `createNote`가 `partial.labelId` 없으면 항상 Memo label 자동 부여
- `lib/store/index.ts:326-338` — `onRehydrate`가 `labelId === null` 노트에 Memo backfill
- 결과: 모든 노트는 항상 labelId 가짐 → entity-based "no label" 필터 무효화
- inbox 시리즈 v1 plan ("stone + 미분류")이 실측 0 항목인 이유

### VIEW_ROUTES 등록 필수
- 새 always-mounted route는 `lib/table-route.ts:19` `VIEW_ROUTES`에 추가 필수
- 빠뜨리면 mount 분기 (`mountedViews.has() || activeRoute ===`) 작동 X
- designer 위임 시 누락 사례 발생 → prompt에 명시 권장

### InboxItemKind ≠ EntityKind 분리 의미
- EntityKind = entity 분류 ("note" / "wiki" / "tag" 등 7종)
- InboxItemKind = action source ("왜 inbox에 있는가" — reminder/srs/snooze-expired/wiki-redlink/auto-enroll)
- semantic 분리 명확화. 같은 type으로 통합하지 말 것.

### Fast Refresh hook 순서 변경 = full reload (정상)
- React가 hook 순서 변경 감지 → full reload 강제 (HMR 한계)
- "Fast Refresh had to perform a full reload due to a runtime error" 메시지는 정보성
- hook 추가 작업 시 정상 동작 — 두려워 말 것

### isOverdue action 문자열 결합 fragility
- 초기: `item.action?.startsWith("Overdue")` (reminder만 있을 때 OK)
- srs 추가 시 "Review overdue Nd"도 fragile (startsWith X)
- 해결: `item.action?.toLowerCase().includes("overdue") ?? false` 또는 kind 체크
- 일반 원칙: action 문자열 매칭은 source 추가에 fragile — 별도 필드 또는 kind 체크 우선

### 큰 방향 전환 패턴 (사용자 통찰 활용)
- v1 plan을 디자이너 위임 후 시각 검증 단계에서 사용자가 "이건 아니야" 통찰 제공
- 즉시 plan 재검토 + brainstorm + v2 채택
- 작업 원칙 #8 ("사용자 직관 = 디자인 시그널") 정합
- 패턴: 큰 방향 전환은 **현 PR 작업 polluting하지 않게** 별도 commit + description 명시

### `useInbox` selector 6개 (5 sources 모두 호출)
- notes, dismissedInboxItems, snoozedInboxItems, srsStateByNoteId, wikiArticles, clusterSuggestions
- useMemo 안에서 5 source loop. ts asc 정렬.
- sidebar에서도 호출 — useMemo 방어로 cheap

### snooze-expired self-referential
- 사용자가 reminder를 snooze → 만료 시 snooze-expired source로 재노출
- 다시 snooze하면 (kind="snooze-expired", sourceId) 새 항목 추가
- 의도된 동작 (재귀이지만 logic correct)

---

## 2026-05-07 — Plot v3 visual refresh (Phase 0+1)

### Inventory vs critic estimate 16배 차이
- Critic이 PRD에서 phosphor 사용 121-128 files 추정. 실제 인벤토리 = **2 files / 4 icons**.
- estimate 신뢰성보다 실측 우선. PRD scope 정정 (Phase 2 1-2주 → 0.5일).

### Imperial `weight: never` 패턴
- `interface IconProps { weight?: never; ... }` — phosphor 잔존을 컴파일 타임에 surface시키는 의도적 typing.
- backlink-card.tsx의 `weight="regular"`가 즉시 TS error로 발견됨.
- 이행 작업의 자동 감지 메커니즘 (회귀 방지).

### Source Serif 4 self-reference 회피
- `next/font` 변수명이 `--font-serif`이면 `@theme inline { --font-serif: var(--font-serif), ... }` 무한 루프.
- 해결: next/font 변수명을 `--font-source-serif`로 분리 → `@theme inline`에서 `--font-serif`로 alias.

### Token alias 3-Layer
- Layer 1: v3 names (`--bg`, `--fg`, `--soft-fg`)
- Layer 2: Plot names (`--background`, `--foreground`, `--muted-foreground`)
- Layer 3: Tailwind (`@theme inline { --color-* }`)
- 각 layer 동일 hex. shadcn/ui cascade 보존.

### --accent cascading
- `--accent` 변경 시 자동 cascade: `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--toolbar-active` (alpha rgba).
- shadcn cascade 영향 0 (Plot 기존 토큰 보존).

### Store v112 idempotent migration
- `viewMode === "table"` → `"list"` 변환. `Array.isArray(state.savedViews)` 가드 + 두 번 실행해도 안전.
- ViewMode union의 single source of truth = view-engine `ViewMode` (`SavedView`는 alias).

### Next.js 16 vs strict tsc 차이
- `npm run build` exit 0이라도 `tsc --noEmit` 1 error 가능.
- Next.js prerender는 type 에러 일부 lenient. 둘 다 검증 필수.

### `_legacy/` 4 정책 (점진 교체)
1. Codemod 변환 대상 제외 (glob: `!components/_legacy/**`)
2. 새 작업 시 `_legacy/` 파일 import 금지
3. Deprecation 주석 의무 (`// @deprecated — moved to _legacy on YYYY-MM-DD`)
4. 사용처 0 확인 후 다음 quarter 시작 시 archive/삭제

### Sub-agent 위임 거절 후 disk 상태
- 사용자가 위임 거절해도 sub-agent가 이미 시작한 작업은 disk에 남음.
- after-work에서 명확히 보고 + 사용자 결정 받기 권장 (revert vs commit vs partial).

---

## 2026-05-03

### SVG pointer-events 함정
- Default `pointer-events="visiblePainted"`는 fillOpacity가 매우 낮으면 (≤ 0.10) "not painted"로 판단 → 클릭 통과
- Hull (HULL.fillOpacity = { dark: 0.04, light: 0.10 })가 정확히 이 case
- 해결: `style.pointerEvents = "all"` 명시 → fillOpacity 무관 항상 hit-test
- 위치: components/ontology/ontology-graph-canvas.tsx hull `<path>`

### React useMemo + ref 추적 함정
- ref 값 변경은 React가 추적 X → useMemo deps에 ref 직접 못 씀
- `forceRender()` 호출만으론 useMemo 재계산 X (deps 불변이면)
- 해결: `useReducer((c) => c+1, 0)`의 카운터를 deps에 추가 → forceRender 호출마다 카운터 증가 → memo invalidate
- 패턴: `const [renderTick, forceRender] = useReducer(...)` (이전엔 `const [, forceRender]`로 카운터 버림)
- 위치: components/ontology/ontology-graph-canvas.tsx clusterHulls useMemo

### 자료구조 본질 차이로 entity 정당화
- Set vs Sequence는 다른 자료구조 → 다른 entity로 분리 정당
- Sticker = set (collection, 무순서)
- Book = sequence (ordered list)
- 단순 "Sticker의 ordered version"이 아니라 본질 차원 다름

### 사용자 통찰 = 디자인 시그널
- "Sticker = 글로벌 폴더 같은 것" → 의미 분리 약하다는 신호 (Folder 폐기 후 Sticker 단일화 검토 계기)
- "Detail 패널 = 본문 변화 추적/반영" → 본문 source of truth 원칙
- 사용자 직관 무시하지 말 것

### 종이책 메타포 함정
- "한 책 = 한 종류 콘텐츠" 종이책 패턴에 갇히면 안 됨
- 디지털 책 = cross-type 자유 (Notion 페이지가 다양한 블록 mix 패턴)
- Plot의 Sticker도 cross-everything → Book도 같은 패턴 정합

### 대규모 데이터 모델 변경 시 사이드 패널 영향
- 사이드 패널 = entity 단위 메타 dashboard
- 모든 큰 PR이 사이드 패널 자기 부분 변경 collateral
- 별도 "사이드 패널 PR" 없음 — 각 큰 PR에 분배

---

## 2026-04-30 (Sprint 1.3)

- **replace_all은 들여쓰기까지 매칭** — 동일 코드라도 들여쓰기 다르면 누락. 한 곳씩 수동 변경 필요할 수 있음. (예: wiki-view.tsx line 944 `<IconWiki size={20} />` 8 spaces, 나머지 두 곳은 10 spaces — replace_all에서 944만 누락)
- **JSX text node에 em dash 직접 입력 금지** — Edit 도구가 `—` literal string으로 저장해 표시 버그(`—` 그대로 출력). 항상 `{"—"}` expression 형태로
- **`article.layout` object 잔존 데이터** — Book Pivot 흔적 (PR #214에서 롤백 후 일부 데이터 남음). React child로 직접 렌더 시 "Objects are not valid" 에러. typeof guard로 빠른 fix, 마이그레이션은 별도 PR 권장
- **`useBacklinksIndex` hook** — 노트별 in-degree(들어오는 링크 수) 정확한 lookup. `Note.backlinks?.length` 같은 필드는 type에 없으므로 hook으로 가져와야
- **Linear sub-tabs 패턴 핵심** — 비-active 글자도 `text-muted-foreground` (full opacity) 유지. `/50`, `/60` 식 opacity 줄이면 흐림. active와 contrast는 글자 색이 아니라 배경(`bg-foreground/10`)으로
- **dev server preview port 변동** — Claude Preview MCP `preview_start`가 처음 13497, 이후 reused로 3002. 같은 코드 베이스라 사용자 화면 = 우리 변경 반영 (HMR 작동)
- **Notes 컬럼 헤더 색상** — `text-muted-foreground` (line 150 notes-table.tsx) — Wiki도 동일하게 통일하는 게 일관성 좋음

## 2026-03-16
- Store는 실제 16 슬라이스 (relations 슬라이스가 문서에서 누락되어 있었음)
- TemplatesView가 layout.tsx에 2번 마운트되는 복붙 버그 — mount-once 패턴에서 블록 복사 시 주의
- Implementation Order 2번(Thread)과 3번(읽기/편집 토글)이 이미 구현되어 있었음
  - Thread: thinking slice + ThreadPanel (components/editor/thread-panel.tsx)
  - 읽기/편집 토글: isReadMode state + Ctrl+Shift+E in note-editor.tsx
- search-dialog.tsx에 삭제된 기능으로 연결하는 dead 커맨드 팔레트 항목이 남아있었음
- dead code 검증 방법: Grep으로 import/참조 검색 → 자기 파일에서만 참조되면 dead

## 2026-03-19
- LayoutMode의 진짜 문제: workspace tree를 프리셋으로 덮어씀 (유저 커스텀 레이아웃 파괴). 해결: LayoutMode 삭제, tree가 유일한 진실
- Red link는 가상 상태(useMemo 계산 결과), stub는 실체(Note 객체). 자동 등재 시 red link가 소멸 (자기 조절)
- useMemo([notes]) 의존성: Zustand notes 배열 참조가 아무 노트 수정 시 바뀜 → useMemo 재계산. Web Worker 분리 또는 granular selector 필요
- Linear의 Search: 상단 유틸리티 바에 아이콘, 클릭하면 풀페이지 SearchView (모달 아님)
- wiki-view.tsx red link 계산: wikiTitleSet에 isWiki:true만 포함. 일반 노트가 존재해도 wiki 아니면 red link로 잡힘
- 자동 등재 시 기존 노트가 있으면 convertToWiki 사용해야 함 (createWikiStub로 새 Note 만들면 같은 제목 충돌)
- 초성 인덱스: `(charCode - 0xAC00) / 588 + 0x3131`로 한글 초성 추출. 성능 비용 거의 없음

## 2026-03-27 (Unified Pipeline)
- viewStateByContext에 새 ViewContextKey 추가 시, 기존 persist된 store에는 해당 키가 없음 → `?? buildViewStateForContext("key")` 방어 필수
- ToggleSwitch off 상태: `bg-border`는 다크모드에서 배경과 구분 안됨 → `bg-muted-foreground/40` 사용
- ToggleSwitch on knob: `bg-background`는 다크모드에서 검정 → `bg-white` 고정이 올바름
- Graph OntologyFilters → FilterRule[] 어댑터 패턴: 캔버스 내부는 OntologyFilters 유지하되 UI는 통합 FilterPanel 사용. 양방향 변환으로 브릿지
- Design Spine을 구조 통합에 녹이는 전략이 효과적: 파일 1번만 터치하면 시각적+구조적 일관성 동시 달성

## 2026-04-13 (Expand/Collapse All + TextBlock 개선)
- CSS 스펙: `overflow-y: auto` 설정 시 `overflow-x`가 `visible`이면 자동으로 `auto`로 변경됨 → 패딩 레이어와 스크롤 레이어를 분리해야 left:-28px 핸들이 잘리지 않음
- BlockDragOverlay는 `blocks.length > 1`일 때만 핸들 렌더링 — 블록 1개면 정상적으로 숨김
- Details extension `persist: true`면 `open` attr이 문서 JSON에 저장됨 → `tr.setNodeMarkup(pos, undefined, { open: value })`로 일괄 토글 가능
- InsertMenu/SlashCommand가 schema 체크 없이 메뉴 항목 표시 → TipTap extension이 특정 tier에 미등록이면 silent fail. TocBlockNode이 wiki tier에 없어서 Insert→TOC가 무반응이던 버그
- `useBlockResize` 훅은 TipTap NodeView 전용 (`updateAttributes` 필요) → 일반 React 컴포넌트(WikiTextEditor)에서는 인라인 mouseMove/mouseUp 패턴으로 직접 구현

## 2026-04-05 (호버 프리뷰 + Note/Wiki 링크)
- ProseMirror read-only 모드에서 React synthetic event(onClick/onMouseDown)가 에디터 DOM에서 parent로 bubble 안 됨 → native addEventListener 필요
- ProseMirror handleClick prop은 atom 노드(@mention)에 대해 잘 안 됨 → handleDOMEvents.mousedown이 더 확실
- 호버 프리뷰에서 generateHTML은 WikilinkDecoration 등 ProseMirror 플러그인 비포함 → TipTap read-only 에디터가 더 정확한 렌더링
- note.contentJson이 IDB에 null로 저장될 수 있음 (partialize + BodyProvider hydrate 순서). BodyProvider hydrate 후 Zustand에서 읽는 게 IDB 직접 읽기보다 안정적
- data-hover-preview 속성을 가드로 사용해서 프리뷰 안 ProseMirror 이벤트 (hover/click) 재귀 방지 패턴
- mouseup 리스너 등록(el)과 해제(document) 불일치 → 메모리 누수. cleanup에서 동일 대상 사용 필수

## 2026-04-14 — 기술 발견

**UniqueID extension 이미 준비됨**
- `shared-editor-config.ts:361` — top-level 23종 노드(heading/paragraph/table/image/list/etc.)에 영속 data-id 자동 부여
- 노트 split 구현의 인프라 완비 (WikiBlock[]과 동등한 ID 추적 가능)
- 노트 split 액션 = 약 50줄, UX는 WikiSplitPage 복사 + TipTap 조작으로 교체

**Next.js webpack dev vs Turbopack build 타입 검증 차이**
- dev server (webpack) pass → production build (turbopack) fail 가능
- 증거: `registry.ts:63` RemixiconComponentType 에러 — dev는 실행되는데 build는 실패
- 정기적으로 `npm run build` 돌려야 함

**WikiInfobox vs InfoboxBlockNode 2중 구현체**
- `components/editor/wiki-infobox.tsx` (WikiArticle.infobox용, float-right 사이드바)
- `components/editor/nodes/infobox-node.tsx` (TipTap 노드, 노트+위키 본문)
- 같은 UX지만 데이터 쉐입 다름. 중장기 통합 TODO (base 티어 단일화)
- 양쪽 동일 기능 추가할 때 코드 2번 복제 필요 (현재 현실)

**Skill 시스템 본질**
- `/after-work` 슬래시 커맨드 = expand된 프롬프트 전달
- Skill tool 재호출해도 같은 프롬프트 반복
- 실행 주체는 Claude. Skill = 프롬프트 템플릿 + command mapping 인프라


## 2026-04-25 — 코멘트 + 사이드패널 작업 학습

### Flex 자식 contents-driven 확장 (자주 발생)
**증상**: `flex-1` 자식이 contents 따라 부모 폭을 1400px+로 확장
**원인**: flex item 기본 `min-width: auto` — contents 사이즈 이하로 못 줄임
**해결**: 자식에 `min-w-0` 추가 → contents 무시하고 flex 분배만 따름
**주의**: popover/dropdown 안에서 toolbar overflow 잘림 = 거의 항상 이 원인

### Radix PopoverContent 기본 overflow
- 기본값: `overflow: visible` → 자식 내용이 popover 경계 밖으로 빠져나갈 수 있음
- 컴팩트 popover에서 자식 toolbar 등이 클립 안 됨
- **해결**: `className="overflow-hidden"` 명시

### 글로벌 scrollbar-color (전역 영향)
- `globals.css`에서 `*` 셀렉터로 `scrollbar-color: rgba(0,0,0,0)` 적용 중
- 어떤 곳에서든 스크롤바가 시각적으로 안 보임 (hover 시에만 흐릿하게)
- **명시적 색깔 필요한 경우**: 별도 CSS 클래스 + WebKit + Firefox 둘 다

### FixedToolbar 임베드 패턴
- `FixedToolbar`는 sticky bottom-0 + overflow-x-auto 자체 보유
- 좁은 컨테이너에 그대로 넣으면 자체 overflow가 외곽 스크롤을 무력화
- **해결**: `embedded` prop 추가 — 자체 sticky/overflow 비활성화 + `w-max` (contents 너비)
- 외곽 wrapper가 진짜 스크롤 컨테이너 역할

### Wiki Navbox 표준 (리서치)
- Wikipedia/나무위키 둘 다 100% **수동 큐레이션**
- 카테고리 자동 필터는 비표준 (Plot 기존 구현)
- 둘 다 지원하는 하이브리드가 정답

### TipTap "comment" tier vs "note" tier
- Comment는 짧은 메모 → "comment" tier (heading/codeBlock/horizontalRule 제외)
- Note/Wiki는 상세 작성 → "note" tier (모든 기능)
- 같은 컴포넌트가 다른 tier로 다른 UX 제공

### 섹션 번호 매기기 알고리즘
```ts
const counters: number[] = []
let lastDepth = -1
function next(depth: number): string {
  if (depth > lastDepth) while (counters.length <= depth) counters.push(0)
  else if (depth < lastDepth) counters.length = depth + 1
  counters[depth] = (counters[depth] || 0) + 1
  lastDepth = depth
  return counters.slice(0, depth + 1).join(".")
}
```
- 더 깊으면 새 카운터 시작
- 위로 올라오면 깊은 카운터 trim
- depth 0: "1"/"2", depth 1: "1.1"/"1.2", depth 2: "1.1.1"

### Comment popover 사이즈 시행착오
- 720 → 너무 큼
- 480 → 너무 작음
- **560** → 적정 (균형)
- 폭 결정만큼 중요한 것: contents가 넘치지 않게 `min-w-0` + `overflow-hidden` 처리

### 사용자 피드백 패턴 (이번 세션)
- "엉망진창" → 시각/구조 문제. 즉시 디버깅 모드
- "별로" → 디자인 quality 문제. 옵션 제시하고 결정 받기
- "롤백" → 직진하지 말고 한 단계 뒤로
- "F도 마음에 들고 G로 진화" → 점진적 향상이 best

## 2026-04-26
- **Zustand persist version migration**: stored < currentVersion일 때만 호출. 재실행 보장 idempotent + version bump. `partialize`가 contentJson strip → IDB 비동기 로드 필수.
- **Radix Popover hydration**: SSR/CSR 자동 ID 다름 → console warning. `<ClientOnly>` 또는 mount guard. 기능 영향 X.
- **TipTap NodeView Popover 정렬**: `align="start"` + `sideOffset` + `collisionPadding` 필수. default `align="center"`는 좁은 chip에서 화면 좌측으로 밀림.
- **자동 등재 무한 누적 버그**: `createWikiStub` dedupe 가드 없으면 매 사이클 동일 title 누적. 시드 노트의 [[wiki:Title]] 다수 → 12시간마다 중복 폭발.
- **WikiArticle vs noteType "wiki" Note**: 별도 entity (wikiArticles slice + notes slice). wiki space는 wikiArticles만 표시. createWikiStub은 notes에 추가. dedupe 양쪽 필요.
- **MixedQuicklinks sortKey**: `${type-priority}-${pinnedOrder/createdAt}` 복합 키. 종류별 그룹 + 안정 정렬.

## 2026-05-01 라이트모드 가시성 + Linear 필터 패턴

### muted-foreground alpha의 함정
- `--muted-foreground: #52525b` (라이트) 자체는 진하지만 alpha `/30~/50`은 흰 배경에서 거의 안 보임
- 시스템적 sed 일괄 변경 가능 (순서 신경): `/50→/70`, `/40→/70`, `/30→/60`, `/25→/50`, `/20→/50`
- 다크모드는 `--muted-foreground: #a1a1aa`라 alpha 영향 적음

### Tailwind v4 quirks
- `border-[1.5px]` arbitrary value 미적용 → `style={{ borderWidth: "1.5px" }}` 직접
- color-mix 활용: `color-mix(in srgb, var(--accent) 18%, transparent)` 라벨 패턴

### Filter chip 4-part 분해
- `formatFilterChip(rule)` → `{icon, fieldLabel, operatorLabel, valueLabel}` 헬퍼
- 모든 case 분기 (status/folder/label/tags/source/dates/links/pinned/content/wikiRegistered/title/wikiTier/category)
- operator: eq → "is", neq → "is not", lt/gt + date → "older than"/"within"

### Ontology 그래프 entity 통합
- `buildOntologyGraphData`에 entity 추가 시 prefix 사용 (`wiki:{id}`, `tag:{id}`)
- noteId 충돌 방지 + nodeType 분기 가능
- WikiArticle을 별도 노드로 추가하면 parent-child + note-ref edges 자연 생성

## 2026-05-03 (Session: 11 PRs merged)

### Icon alias trick — 1줄 수정 = 13 site 자동 적용
- `export { BookOpen as IconWiki } from "@phosphor-icons/react/dist/ssr/BookOpen"`
- 13 site 변경 X. legacy alias로 점진적 마이그레이션.
- 적용처: plot-icons.tsx에서 IconWiki SVG 정의 → BookOpen alias

### TemplateEditorAdapter 패턴 — thin fork over generic
- NoteEditorAdapter (460 LOC, Y.Doc/IDB body/hashtag-sync 포함)을 fork하지 말고 genericize도 하지 말고
- thin fork (140 LOC, 핵심만): TipTap mount, debounced save, title-from-first-block, FootnotesFooter, key remount
- 생략 가능: Y.Doc multi-pane, IDB body store, hashtag bidirectional sync, LinkSuggestion (use case마다 결정)

### v102 마이그레이션 — additive vs subtractive
- Sticker.members[] (v101): additive (notes/wiki에서 stickerIds → Sticker.members로 이전)
- Template icon/color drop (v102): subtractive (`delete t.icon; delete t.color`)
- 둘 다 idempotent, 사용자 데이터 손실 0 (테스트 환경)

### `KNOWLEDGE_INDEX_COLORS` 패턴 — 단일 source 통합
- text class (light+dark) + bg class + hex 3종 한곳에 정의
- Home StatsRow + Library Overview + 사이드패널 등 모든 site가 import
- 카드 색 collision (Tags green/amber, Refs amber/accent, Files rose/teal) 해소

### Wiki status 색 분리
- WIKI_STATUS_HEX.article (#7c3aed) === SPACE_COLORS.wiki (#8b5cf6) collision 발견
- 분리: stub=orange, article=emerald, entity=violet
- 그래프 wiki 노드는 entity 색 (violet) 유지 — `GRAPH_NODE_HEX.wiki = SPACE_COLORS.wiki` (architect 회귀 방지)

### Architect Opus stall (17분)
- 큰 PR (615+/317- 6 files) 검증 시 stall 가능성
- 다음에는 architect-medium (Sonnet) 또는 self-review 고려
- self-review 충분 조건: tsc/build clean + 코드 패턴 명확 + data-loss surface 인지

### planner agent 활용
- 복잡한 작업 (예: Template PR b — UI unification) 전에 planner 호출
- 결과: `.omc/plans/template-b-edit-ui-unification.md` (Q1-Q5 default + 3 phase 분할)
- 사용자 합의 후 즉시 구현 → 효율적

## 2026-05-10 마라톤 — 9 작업 + 12 polish iteration

### Layout 발견
- **flex item `w-full flex-1` 필수**: 누락 시 contents 폭만 차지 (intrinsic width). BookWikiReader 81% 원인
- **Layout fallback double-mount**: `isFallback` 정의에서 sub-route 누락 시 children + view 동시 visible → flex-1 50%씩 폭 stealing. fix: `isViewRoute`에 `activeRoute.startsWith("/books/")` 추가
- **Empty infobox = panel 22% 차지**: read 모드 + 비어있으면 hide 권장 (`!preview && (hasInfoboxContent || editable)`)

### Smart Book Resolver
- **lastManualOrder seeding**: manual items 모두 처리 후 max order 추출 → auto 시퀀스 시작 → manual top/auto bottom 자연 보장
- **Multi-source dedup**: `seenAutoRefIds` Set으로 첫 source 우선 (LOCKED #11)
- **Pure function**: store/book mutate X, deterministic, useMemo로 호출 (eager re-resolve)

### 데이터 모델 silent assumption (PRD critic agent로 catch)
- `Folder.noteIds` 없음 (Note.folderIds reverse N:M)
- `WikiArticle.categoryIds: string[]` (DAG 다중 부모)
- `Folder.kind = "note" | "wiki"` (둘 다 X, Phase A는 note only)
- Folder + WikiArticle 모두 hard-delete only (trashed 필드 없음)

### React/HMR 한계
- 큰 파일 변경 시 HMR 못 잡고 stale view → dev 재시작 또는 Ctrl+Shift+R
- preview MCP 시뮬레이션 + window.history.pushState로 React 인식 안 될 수 있음 → 실제 사이드바 클릭 필요

## 2026-05-11 (Wiki UX follow-up) — Radix ContextMenu vs Popover, asChild 한계

### Radix `<ContextMenu>` vs `<Popover>` (cursor anchoring)
- `<ContextMenu>`는 `clientX/clientY`에 자동 anchor (cursor 추적). Right-click 시 마우스 위치에 정확히 출현.
- `<Popover>`는 PopoverTrigger element 위치에 고정. setOpen으로 열어도 trigger DOM에 anchor.
- Wiki list row의 우클릭이 row 오른쪽 끝에 메뉴를 띄우던 버그 = `onContextMenu`에서 `setMenuOpen(true)`로 DotsThree Popover를 연 결과.
- **Cursor-aware UX는 무조건 `<ContextMenu>` wrapper 사용.** DotsThree click affordance는 Popover로 별도 유지 가능.

### Radix `asChild` + function component 한계
- `asChild`는 Slot/cloneElement로 immediate child에 props(ref/onClick/onContextMenu 등)를 inject.
- 자식이 **function component**면 그 내부에서 `forwardRef` + props spread (`{...rest}`)로 underlying DOM에 명시적 forward 안 하면 prop이 사라짐.
- 이번 세션: `<ContextMenuTrigger asChild>{<GalleryCard ...>}` → article element에 onContextMenu prop 도달 X (React fiber로 확인). `GalleryCard`를 `React.forwardRef<HTMLElement, ...>` + `{...rest}` spread로 변경하니 해결.
- **패턴**: Slot 안에 넣을 모든 function component는 forwardRef로 작성하고 rest props/className은 합쳐서 underlying DOM에 spread.

### `display: contents` div wrapper
- Grid item 안 wrapper div가 box 생성 안 해도 자식이 직접 grid item으로 렌더됨. event는 정상 bubble.
- `<Grid> { items.map(it => <div className="contents">{renderContextMenu(it, card)}</div>) }` 패턴에서 layout 영향 없이 wrapper 추가 가능.

### React fiber inspection 디버깅 패턴
- `Object.keys(element).find(k => k.startsWith('__reactProps'))` 키로 React 컴포넌트의 actual props 즉시 dump.
- dev tool 없이 dev server eval로 컴포넌트 prop 검증 가능 — 이번 세션에서 GalleryCard onContextMenu가 undefined임을 확인하는 데 핵심.
- 또한 `__reactFiber$xxx` 키로 fiber.memoizedProps 추적 → ancestor 컴포넌트별 props 디버깅.

### WikiArticle.id 시드 ID 규칙
- 기존 seeds: `wiki-zettelkasten` 같은 sluggified ID. dump 시 `wiki-1/wiki-2` 같은 일반 ID도 혼재.
- Store toggleWikiArticlePin(id) 호출 시 정확한 ID 확인 필수 — store dump 결과의 ID 형식 신뢰.
- IDB persisted state와 component prop 불일치 가능성: 디버깅 시 React fiber로 실제 prop 값 확인.
