# Plot — Session Log

> 시간순 chronological 세션 기록 (append-only). 직전 세션 멘탈 상태 복원용.
> 가장 최근이 위에. 오래된 세션은 아래로 밀려남.
> Session entry 형식: 날짜 + 머신 + 완료 + 결정 + 다음

---

## 2026-04-15 밤 (집, Phase 2-2-B-2 블록 컬럼 간 드래그 PR)

### 완료 (코드)
- **moveBlockToColumn 액션 + syncLayoutFromAssignments 헬퍼** ✅
  - `lib/store/slices/wiki-articles.ts`: 블록을 target ColumnPath로 이동
  - columnAssignments[blockId] = targetPath + 모든 leaf blockIds 재계산
  - blocks[] 순서 유지 (stable ordering)
  - orphan block (어떤 leaf에도 안 속함) → 첫 leaf (main)로 fallback
  - `lib/store/types.ts`: moveBlockToColumn 시그니처 추가
- **ColumnCell 편집 모드 droppable** ✅
  - `components/wiki-editor/column-renderer.tsx`: LeafDroppableCell 내부 컴포넌트
  - useDroppable id = `column-<pathKey>` (예: `column-0`, `column-1`)
  - 빈 컬럼 placeholder: "Empty column — drop a block here" (dashed border)
  - isOver 시각: accent bg/ring + "Drop block here" 텍스트
- **WikiArticleRenderer handleDragEnd** ✅
  - `overId.startsWith("column-")` → parsePath → moveBlockToColumn 호출
  - 기존 split-dropzone / drop-article-* / reorder와 공존

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- 콘솔 검증: 2col 상태에서 moveBlockToColumn(articleId, blockId, [1]) → col0 7→6, col1 0→1, columnAssignments[blockId]=[1] 모두 정확

### 결정
- **columnAssignments가 canonical** — leaf blockIds는 derived view. 모든 변경은 assignments 업데이트 + syncLayoutFromAssignments 호출
- **orphan fallback to first leaf** — 컬럼 구조 변경 시 assignment가 유효하지 않은 블록들 (deep nested 참조 등)은 main에 보관되어 유실 방지
- **drop id = `column-<pathKey>`** — 기존 split-dropzone, drop-article-* prefix 패턴과 일관
- **빈 컬럼 placeholder "Empty column — drop a block here"** — 2col/3col의 sidebar가 비어있을 때 "이게 컬럼이구나" 즉시 인식 (이전 피드백 응답)

### 사용자 가치
- 편집 모드에서 블록을 **다른 컬럼으로 드래그** 가능 (SortableBlockItem ↔ LeafDroppableCell)
- 2col/3col 차이 **완전히 의미 생김**: 사용자가 직접 인포박스/TOC 아닌 콘텐츠 블록도 사이드 컬럼에 배치 가능
- 빈 컬럼 placeholder로 "여기 드래그할 수 있다"는 시각 단서

### 다음 세션 (Phase 2-2-B-3)
- 컬럼 추가/삭제 버튼 (addColumn / removeColumn 액션)
- 중첩 컬럼 생성 UI (Split column 메뉴, 3 depth 제한)
- 중첩 컬럼의 비율 드래그 (현재 최상위 PanelGroup만)

### Watch Out
- 드래그는 편집 모드에서만 droppable 활성 (읽기 모드는 기존 CSS Grid cell)
- 기존 split-dropzone과 drop-article-*는 FloatingDragDropBar (바깥)에 있어서 column droppable과 z-index/위치 충돌 없음
- 수동 테스트 권장: 블록을 클릭 드래그 → 다른 컬럼 cell로 drop → 이동 시각 확인

### 머신
집

---

## 2026-04-15 저녁 (집, Phase 2-2-B-1 비율 드래그 + 메타 위치 UI PR)

### 완료 (코드)
- **3 신규 store 액션** ✅
  - `updateColumnRatios(articleId, path, newRatios)` — ColumnPath 위치의 컬럼 비율 일괄 갱신 (재귀 헬퍼 `updateRatiosAtPath`)
  - `setTocStyle(articleId, tocStyle)` — TOC show/position/collapsed 설정
  - `setInfoboxColumnPath(articleId, path)` — 인포박스 컬럼 위치 설정
- **ColumnRenderer 편집 모드 드래그 핸들** ✅
  - `editable` + `onRatiosChange` props 추가
  - 최상위 horizontal 2+ 컬럼 → react-resizable-panels (PanelGroup + Panel + PanelResizeHandle)
  - 중첩 / 읽기 모드 / vertical → CSS Grid 유지
  - `onLayout` (percentage 반환) → updateColumnRatios로 전달
  - 드래그 핸들 UX: w-1 hover accent, 가운데 작은 바 (h-8 w-0.5) 강조
- **ColumnMetaPositionMenu 컴포넌트 신규** ✅
  - List 아이콘 헤더 버튼 → 팝오버
  - TOC 섹션: Show/Hide 토글, 컬럼 칩 (1·2·····N), Collapsed 기본값 체크박스
  - Infobox 섹션: 컬럼 칩 (1·2·····N)
  - Current layout 힌트
- **헤더 배치** ✅
  - wiki-view.tsx: full size ColumnPresetToggle + ColumnMetaPositionMenu
  - secondary-panel-content.tsx: compact 모드 둘 다

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- 콘솔 검증: applyColumnPreset(2) → updateColumnRatios([], [6,2]) → setInfoboxColumnPath([0]) → setTocStyle({show,position,collapsed}) — 모두 store 정확 반영

### 결정
- **Nested column drag 생략 (Phase 2-2-B-3에서 해결)** — PanelGroup 중첩이 UX 복잡도 높임. 최상위만 드래그 + 중첩은 CSS Grid. 사용자가 중첩 거의 안 쓸 것으로 예상 (위키 패턴 기본 flat)
- **onLayout percentage를 그대로 ratios로 사용** — sum-normalized (100) → 상대 비율 의미 유지, 변환 불필요
- **minSize heuristic** — col.minWidth 기반 minSize 추정 (typical 1200px base). 완벽하진 않지만 라이브러리가 constraint 시행
- **메타 위치 UI는 편집 모드 무관** — 팝오버 항상 접근 가능. store 액션 자체가 변경 경계 (view-only 모드에서는 호출 안 됨)
- **tocStyle.show=false일 때 "Hidden" 배지 + 다시 visible로 돌리면 last col로 이동** — direct 토글 UX

### 사용자 가치
- 컬럼 경계 드래그로 사용자가 원하는 비율 직접 설정
- TOC/Infobox 위치 자유 설정 (Hide도 가능)
- **2col/3col 구분 해결 start**: 사용자가 메타 위치 명시적으로 변경하면 컬럼 간 차이 명확히 드러남 (예: 2col → infobox 오른쪽 / 3col → TOC 중간 + infobox 오른쪽)

### 다음 세션 (Phase 2-2-B-2)
- 블록 컬럼 간 드래그 이동 (DnD 확장 + `moveBlockToColumn` 액션)
- 컬럼 추가/삭제 버튼 (편집 모드, + 사이/끝 버튼, ⋯ 헤더 메뉴)
- 상세: `NEXT-ACTION.md`

### Watch Out
- PanelGroup minSize가 percentage라 container width에 따라 체감 다를 수 있음
- 중첩 컬럼은 드래그 안 됨 (Phase 2-2-B-3 대기)
- 사용자 수동 테스트 권장: 비율 드래그로 ratio 변경 → 다른 뷰/pane에 정상 반영 확인, 메타 팝오버 TOC/Infobox 컬럼 변경 테스트

### 머신
집

---

## 2026-04-15 저녁 (집, Phase 2-2-A 컬럼 프리셋 토글 PR)

### 완료 (코드)
- **applyColumnPreset 액션 + buildColumnPreset 헬퍼** ✅
  - `lib/store/slices/wiki-articles.ts`: presetCount(1~6) 받아 ColumnStructure 빌드
  - 1col Blank / 2col (main 3fr + sidebar 1fr min 240px) / 3col (main 2fr + 2× side 1fr min 200px) / 4+col equal split
  - 모든 블록 main 컬럼 [0]으로, sidebar 빈 상태 (Phase 2-2-B에서 드래그로 이동 가능)
  - 같은 프리셋 클릭 = no-op (드래그 조정 비율 보존, Phase 2-2-B 대비)
  - safeCount = clamp(1, 6) — 6 이상 막기
- **ColumnPresetToggle 컴포넌트 신규** ✅
  - `components/wiki-editor/column-preset-toggle.tsx` (~75줄)
  - 1col / 2col / 3col 칩 메뉴 (group toggle)
  - compact prop으로 secondary panel용 작은 변형
  - aria-pressed로 접근성
- **wiki-view + secondary-panel-content 헤더에 토글 배치** ✅
  - wiki-view: full size
  - secondary-panel-content: compact

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- 콘솔 검증: applyColumnPreset(articleId, 2) → 1col→2col 정확 (main 7 blocks / sidebar 0). 1↔2↔3 전환 모두 정상
- dev server compiles clean

### 결정
- **buildColumnPreset 1·2·3 비율** — 위키백과(2col) 디자인 영감. main이 본문이라 큰 ratio (3 또는 2), sidebar는 minWidth로 좁지만 일관된 폭
- **같은 프리셋 클릭 no-op** — 사용자가 비율 드래그 조정한 후 같은 버튼 또 누르면 비율 reset 안 됨. UX 보호
- **safeCount clamp** — UI는 1·2·3만 노출이지만 액션 자체는 1~6 받음 (Phase 2-2-B에서 4+ 컬럼 추가 시 활용)
- **Phase 2-2 분할** — A (토글), B (비율 드래그 + 추가/삭제 + 중첩 + 블록 드래그 + TocStyle UI). A만 먼저 머지하고 사용자 검증 후 B 진행

### 사용자 가치
- 위키 article 헤더에서 1col/2col/3col 칩 클릭 → 즉시 컬럼 구조 변경
- 컬럼 시스템의 가치를 사용자가 처음으로 시각적으로 체감
- 인포박스/TOC가 자동으로 사이드 컬럼에 위치 (메타 필드 fallback 로직)

### 다음 세션 (Phase 2-2-B)
- ColumnRenderer에 비율 드래그 핸들 (편집 모드)
- 컬럼 추가/삭제 + 중첩 (3 depth)
- 블록을 컬럼 간 드래그 이동 (DnD 확장)
- TocStyle / InfoboxColumnPath UI (메타 위치 변경)
- 상세: `NEXT-ACTION.md`

### Watch Out
- 같은 프리셋 클릭 no-op 동작 → 사용자가 reset 원하면 다른 프리셋 갔다 와야 함 (의도적)
- sidebar가 빈 상태 시작 → 사용자가 인포박스/TOC가 어디 있는지 처음엔 헷갈릴 수 있음 (메타 필드는 article.tocStyle.position / infoboxColumnPath로 자동 last col에 배치되므로 시각적 OK, 단 텍스트 블록은 main에만)

### 머신
집

---

## 2026-04-15 저녁 (집, Phase 2-1B-3 cleanup PR)

### 완료 (코드)
- **InlineCategoryTags 별도 파일 분리** ✅
  - `components/wiki-editor/inline-category-tags.tsx` 신규 (~280줄, wiki-article-view에서 분리)
  - `wiki-article-renderer` import path 갱신 (`./inline-category-tags`)
- **기존 렌더러 + WikiLayoutToggle 삭제** ✅
  - `components/wiki-editor/wiki-article-view.tsx` 삭제 (1220줄)
  - `components/wiki-editor/wiki-article-encyclopedia.tsx` 삭제 (406줄)
  - `components/wiki-editor/wiki-layout-toggle.tsx` 삭제 (36줄)
  - 합계 1662줄 dead code 제거
- **`.layout` (string) 사용처 정리** ✅
  - `wiki-view.tsx`: `selectedWikiArticle.layout === "encyclopedia"` → `selectedWikiArticle.layout?.columns.length >= 2`
  - `secondary-panel-content.tsx`: 동일 패턴
  - `wiki-article-detail-panel.tsx`: layout 칩 → "{N} columns" 표시, Layout: capitalize → Columns: count
- **타입 정리** ✅
  - `WikiLayout` 타입 (`"default" | "encyclopedia"`) 삭제
  - `WikiArticle.layout: WikiLayout` 필드 삭제 (legacy string)
  - `WikiArticle.columnLayout: ColumnStructure` → `WikiArticle.layout: ColumnStructure` rename
  - 이제 `article.layout`은 컬럼 구조 (이전 columnLayout 의미)
- **모든 코드 사용처 columnLayout → layout rename** ✅
  - `lib/store/migrate.ts`, `lib/store/seeds.ts`, `lib/store/slices/wiki-articles.ts`
  - `components/wiki-editor/wiki-article-renderer.tsx`
  - `components/views/wiki-view.tsx`, `secondary-panel-content.tsx`, `wiki-article-detail-panel.tsx`
- **Migration v77** ✅
  - Step 1: legacy `layout` string 제거 (typeof === "string")
  - Step 2: `columnLayout` → `layout` rename
  - Step 3: `tocStyle` 기본값 backfill (multi-col → last col + 펼침 / single → [0] + 접기)
  - Step 4: `infoboxColumnPath` 기본값 backfill (multi → last col / single → [0])
  - Store version 76 → 77
- **SEED_WIKI_ARTICLES factory 단순화** ✅
  - 이제 항상 1컬럼 Blank로 derive (raw에 layout 필드 없음)
  - rename 적용 (`columnLayout` → `layout`)

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- dev server compiles clean

### 결정
- **WikiArticle.layout 필드 의미 전환** — 이제 ColumnStructure. 기존 string 의미는 영구 폐기
- **Migration v77은 v76 위에서 동작** — v76이 columnLayout 채우고 v77이 그걸 layout으로 rename. 그래서 v75→v77 새 사용자도 안전 (v75 legacy → v76 columnLayout → v77 layout)
- **InlineCategoryTags 분리** — wiki-article-view 삭제 가능하게 만든 핵심 의존성 끊기 작업
- **TagBadges, ArticleCategories 같은 wiki-article-view 내부 컴포넌트** — 외부 사용처 없어서 삭제와 함께 사라짐 (검증됨)

### 사용자 피드백 (저녁)
- "위키 템플릿이 기대보다 허접" — 정상. 8 built-in 템플릿은 sections + infobox key-value 슬롯뿐이고 themeColor도 단순. **Phase 2-2 진입 전 `lib/wiki-templates/built-in.ts` 풍성화 옵션 검토** (heroImage, 헤더 배너, 섹션 icon, 더 다양한 themeColor 등)

### 다음 세션 (Phase 2-2 또는 템플릿 풍성화)
- Phase 2-2: 컬럼 비율 드래그 + 추가/삭제 + 1·2·N 컬럼 프리셋 토글 + TocStyle/InfoboxColumnPath UI
- 또는 built-in 템플릿 풍성화 (사용자 피드백 기반)
- 노션식 자유 분기는 Phase 3
- 상세: `NEXT-ACTION.md`

### Watch Out
- v77 migration이 v76 결과 위에서 동작 — v75 legacy 사용자가 한 번에 v77로 점프해도 v76 코드가 먼저 실행되니 안전
- 수동 테스트 권장: 새 위키 생성 → 편집 모드 → splitMode / DnD / Infobox 편집 / Title 편집

### 머신
집

---

## 2026-04-15 오후 (집, Phase 2-1B-2 편집 모드 흡수 + 4 호출 지점 전체 마이그레이션)

### 완료 (코드)
- **WikiArticleRenderer 편집 모드 전면 흡수** ✅
  - editable prop 추가 + 편집 관련 state/handlers 통합 (~720줄)
  - SortableContext + DnD sensors + handleDragStart/DragOver/DragEnd
  - AddBlockButton (top + bottom, editable only)
  - SortableBlockItem 연결 (nearestSectionLevel + onSplitSection + onMoveToArticle + onAddBlock)
  - splitMode UI (체크박스 + 하단 바 + Extract 버튼 + Cancel)
  - FloatingDragDropBar (cross-article drag, "New Article" + 기존 article drop zones)
  - DragOverlay (드래그 프리뷰, section은 childCount 표시)
  - DragSplitPrompt 모달 (드래그로 split 시 제목 입력)
  - UrlInputDialog (URL 블록 삽입 다이얼로그)
  - 편집 가능한 Title/Aliases (WikiTitle의 editable+onTitleChange/onAliasesChange 활용)
  - 편집 가능한 Categories (InlineCategoryTags editable=true)
  - 편집 가능한 Infobox (WikiInfobox editable+onHeaderColorChange)
  - SectionBlock collapse persist (editable이면 block.collapsed 업데이트)
  - onDelete prop (헤더 옵션 바와 연결)
  - Split toggle 버튼 (editable && !splitMode)

- **4 호출 지점 전체 마이그레이션** ✅
  - `components/views/wiki-view.tsx`: WikiArticleView/Encyclopedia → WikiArticleRenderer (variant 분기). WikiLayoutToggle import/사용 제거
  - `components/workspace/secondary-panel-content.tsx`: lazy WikiArticleView/Encyclopedia → lazy WikiArticleRenderer (variant 분기). WikiLayoutToggle import/사용 제거
  - `components/editor/note-hover-preview.tsx`: editing 분기 제거 → 단일 WikiArticleRenderer 사용 (editable 프로퍼티로 일원화)
  - `components/editor/nodes/wiki-embed-node.tsx`: Phase 2-1B-1에서 이미 마이그레이션됨

- **WikiLayoutToggle hide** — 두 사용처 주석 처리 + import 제거. Phase 2-2에서 1컬럼/2컬럼 프리셋 토글로 교체 예정

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- dev server compiles clean (HMR 정상, hydration mismatch는 기존 Radix UI 이슈)
- Wiki dashboard UI 정상 렌더 (통계 카드, Featured Article, Categories, Recent Changes, Articles 목록)

### 결정
- **Virtuoso 가상화 제거** — ColumnRenderer와 호환 어려움. >50 blocks read mode 성능 저하 가능성 있음. 필요 시 Phase 2-2+에서 ColumnRenderer 레벨에서 재도입
- **기존 두 렌더러 삭제 안 함** — Phase 2-1B-2는 마이그레이션만, Phase 2-1B-3에서 실제 파일 삭제 + cleanup. InlineCategoryTags도 별도 파일 분리는 Phase 2-1B-3에서
- **WikiLayoutToggle은 즉시 hide** — dead code가 아니라 의도적 임시 숨김 (Phase 2-2에서 새 토글로 교체). 파일은 Phase 2-1B-3에서 삭제

### 다음 세션 (Phase 2-1B-3 cleanup)
- 기존 wiki-article-view.tsx (1220줄) + wiki-article-encyclopedia.tsx (406줄) 삭제
- InlineCategoryTags를 components/wiki-editor/inline-category-tags.tsx로 분리
- WikiLayoutToggle 파일 삭제
- `layout` string 필드 제거 + `WikiLayout` 타입 삭제
- `columnLayout` → `layout`으로 rename
- Migration v77 + tocStyle/infoboxColumnPath 기본값 backfill
- 기타 `.layout` 참조 정리 (ontology-view, wiki-article-detail-panel 등)
- 상세: `NEXT-ACTION.md`

### Watch Out
- 수동 테스트 권장: article 열기 → 편집 모드 → splitMode / DnD / AddBlock / Infobox 편집 / Title 편집 등
- Virtuoso 제거로 매우 큰 article (>50 blocks)에서 성능 이슈 가능성
- Hydration mismatch 경고는 기존 Radix UI 이슈 (내 변경 무관)

### 머신
집

---

## 2026-04-15 오후 (집, Phase 2-1B-1 read-only 통합 렌더러 PR)

### 완료 (코드)
- **Phase 2-1B-1 — WikiArticleRenderer 신규 (read-only) + 2 호출 지점 마이그레이션** ✅
  - `components/wiki-editor/wiki-article-renderer.tsx` 신규 (~280줄)
    · WikiThemeProvider + WikiTitle + ColumnRenderer 조합
    · ColumnRenderer의 metaSlots로 TOC + Infobox 위치 자동 배치 (article.tocStyle.position / article.infoboxColumnPath 기반, 기본값은 fallback으로 multi-column→last column / single→[0])
    · WikiBlockRenderer로 블록 렌더 위임 (block-agnostic)
    · CollapsibleTOC 인라인 컴포넌트 (위키백과/나무위키 스타일)
    · footnote offset tracking (각 text block이 자기 footnoteRef 개수 보고 → cumulative offset)
    · collapsed sections local state + collapseAllCmd 호환
    · variant prop ("default" | "encyclopedia") — 블록 헤딩 스타일만 차이
    · hideTitle / hideCategories / hideFootnotes prop으로 호버/임베드 최적화
    · padding prop (default per-variant)
  - `components/editor/nodes/wiki-embed-node.tsx` 마이그레이션
    · WikiArticleEncyclopedia → WikiArticleRenderer (always read-only, variant="encyclopedia")
  - `components/editor/note-hover-preview.tsx` 마이그레이션 (editing 분기)
    · 편집 모드 시 기존 WikiArticleEncyclopedia 유지 (Phase 2-1B-2에서 흡수 예정)
    · 읽기 모드 시 WikiArticleRenderer 사용

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- dev server compiles clean (HMR 정상)
- 호버 프리뷰 / wiki embed 두 호출 지점 모두 신규 렌더러 사용 중

### 결정
- **편집 모드는 Phase 2-1B-1 스코프 외** — split mode UI / DnD-cross-article / Virtuoso / FloatingDragDropBar / SortableContext 등 흡수가 큰 작업 (~600-800줄). Phase 2-1B-2로 분리
- **note-hover-preview는 editing 분기로 임시 처리** — editing이면 기존 Encyclopedia, 아니면 새 Renderer. Phase 2-1B-2에서 분기 제거
- **InlineCategoryTags는 wiki-article-view에서 import** — Phase 2-1B-3에서 별도 파일로 분리 (기존 렌더러 삭제 시점)
- **layout 필드는 그대로** — Phase 2-1B-3까지 유지

### 다음 세션 (Phase 2-1B-2)
- WikiArticleRenderer 편집 모드 흡수 (split mode / DnD / AddBlock / SortableContext / Virtuoso 등 모두)
- wiki-view + secondary-panel-content 마이그레이션
- note-hover-preview의 editing 분기 제거
- 상세: `NEXT-ACTION.md`

### Watch Out
- SSR hydration mismatch warning — 기존 코드의 알려진 이슈 (내 변경 무관)
- dev server가 메모리 임계 도달 시 자동 재시작됨 (정상 동작)

### 머신
집

---

## 2026-04-15 오후 (집, Phase 2-1A 인프라 PR)

### 완료 (코드)
- **Phase 2-1A — 컬럼 시스템 인프라 컴포넌트 준비 완료** ✅
  - `lib/types.ts`: `WikiTocStyle` 인터페이스 추가, `WikiArticle.tocStyle?` + `WikiArticle.infoboxColumnPath?` optional 필드 (additive — migration 안 필요)
  - `components/wiki-editor/column-renderer.tsx` 신규 — 재귀 ColumnStructure 렌더러. CSS Grid 기반 (ratio→fr, minWidth→minmax). renderBlock 콜백으로 블록 위임. metaSlots Record로 TOC/인포박스 columnPath 위치 주입. `pathKey`/`parsePathKey` 헬퍼 export
  - `components/wiki-editor/wiki-title.tsx` 신규 — article.title + titleStyle (alignment / size / showAliases / themeColorBg). 편집 모드 시 input 토글 (onTitleChange / onAliasesChange 콜백)
  - `components/wiki-editor/wiki-theme-provider.tsx` 신규 — WikiThemeProvider 래퍼. inline style로 `--wiki-theme-light` + `--wiki-theme-dark` 노출 + `.wiki-theme-scope` 클래스 적용. 자식이 `var(--wiki-theme-active)` 직접 사용 가능
  - `app/globals.css` — `.wiki-theme-scope` cascade rule 2줄 추가 (`.wiki-theme-scope`/`.dark .wiki-theme-scope`)

### 검증
- `next build --webpack` ✅ (32 routes, TypeScript 에러 0)
- `vitest run` ✅ 5 파일 / 159 테스트 통과
- 신규 컴포넌트는 아직 import되는 곳 없음 (Phase 2-1B에서 통합 예정) — 컴파일 정확성만 보장

### 결정
- **Phase 2-1을 2-1A (인프라) + 2-1B (통합)로 분할** — wiki-article-view.tsx (1220줄) + wiki-article-encyclopedia.tsx (406줄) 통합은 한 PR에 박기에 risk 큼. 인프라 먼저 + 통합 분리로 검증 단위 작게
- **WikiTocStyle = `{ show, position: ColumnPath, collapsed? }`** — 자동 생성/갱신 메타. 별도 필드 + ColumnPath 위치 패턴 (인포박스/Hatnote와 동일)
- **CSS variable cascade pattern** — globals.css에 `.wiki-theme-scope`+`.dark .wiki-theme-scope` 정의, WikiThemeProvider에서 light/dark 두 var 노출, 자식은 `var(--wiki-theme-active)` 사용. 다크모드 자동 전환. 섹션 themeColor는 nested provider로 override
- **ColumnRenderer는 block-agnostic** — `renderBlock(blockId)` 콜백 위임으로 어떤 블록 종류든 렌더 가능. metaSlots도 Record<pathKey, ReactNode>로 자유롭게 주입

### 다음 세션 (Phase 2-1B)
- `wiki-article-renderer.tsx` 통합 컴포넌트 신규 (WikiThemeProvider + WikiTitle + ColumnRenderer 조합)
- 4 호출 지점 마이그레이션 (wiki-view, secondary-panel-content, wiki-embed-node, note-hover-preview)
- 기존 wiki-article-view + wiki-article-encyclopedia 삭제 (1626줄 정리)
- Migration v77: layout string 제거, columnLayout → layout rename, tocStyle/infoboxColumnPath 기본값 backfill
- WikiLayoutToggle 임시 hide (Phase 2-2에서 새 토글로 교체)
- 상세: `NEXT-ACTION.md`

### 머신
집

---

## 2026-04-15 오전 (집, Phase 1 단일 PR)

### 완료 (코드)
- **Phase 1 — WikiTemplate 데이터 모델 + 템플릿 시스템 전체** ✅
  - `lib/types.ts`: `ColumnStructure` / `ColumnDefinition` / `ColumnBlocksLeaf` / `ColumnPath` / `WikiTitleStyle` / `WikiThemeColor` / `WikiTemplateSection` / `WikiTemplateInfobox` / `WikiTemplateHatnote` / `WikiTemplateNavbox` / `WikiTemplate` 추가
  - `WikiArticle` optional 확장: `columnLayout?` / `columnAssignments?` / `titleStyle?` / `themeColor?` / `templateId?` (legacy `layout` string 유지 — Phase 2에서 제거)
  - `lib/wiki-templates/built-in.ts` 신규 — 8 built-in 템플릿 (Blank/Encyclopedia/Person/Place/Concept/Work/Organization/Event) + 안정 ID + theme color 헬퍼 (`hexToRgba` light 0.12 / dark 0.22)
  - `lib/store/slices/wiki-templates.ts` 신규 — `createWikiTemplate`/`updateWikiTemplate`/`deleteWikiTemplate`/`duplicateWikiTemplate` (built-in 가드) + cross-slice 헬퍼 `resolveWikiTemplate` / `getAllWikiTemplates`
  - `lib/store/types.ts` — `wikiTemplates: Record<string, WikiTemplate>` + 4 액션 시그니처 추가, `createWikiArticle`에 `templateId?` 옵션 추가
  - `lib/store/index.ts` — slice 연결 + 초기 상태 + version 75→76
  - `lib/store/migrate.ts` — v76 마이그레이션 (legacy `layout: "encyclopedia"` → 2컬럼 main+infobox, 그 외 → 1컬럼 Blank, columnAssignments 채움)
  - `lib/store/seeds.ts` — `SEED_WIKI_ARTICLES` factory에 columnLayout/columnAssignments 동일 derive (re-seed가 마이그레이션 우회하는 케이스 대응)
  - `lib/store/slices/wiki-articles.ts` `createWikiArticle({ templateId? })` — `instantiateTemplate` + `populateColumnLayoutBlockIds` 헬퍼로 templateId → blocks/columnLayout/columnAssignments/infobox/themeColor/titleStyle 자동 채움
  - `components/wiki-template-picker-dialog.tsx` 신규 — 2칼럼 카드 그리드, themeColor accent bar, "BUILT-IN" + "My templates" 섹션 분리
  - `components/views/wiki-view.tsx` `handleCreateWiki` 분리: 클릭 → picker open → 선택 시 `createWikiArticle({ title, templateId })` + select + edit
- **setWikiInfobox 버그 수정** (BRAINSTORM 선행 0.1)
  - `WikiInfobox` 컴포넌트에 `entityType?: "note" | "wiki"` prop 추가, default "note"
  - `wiki-article-view.tsx` (3곳) + `wiki-article-encyclopedia.tsx` (3곳) 모두 `entityType="wiki"` 명시 → `setWikiArticleInfobox` 경로 사용

### 검증
- `npm run build --webpack` ✅ (42s, 32 routes 생성, TypeScript 에러 0)
- `npm test` (vitest) ✅ 5 파일 / 159 테스트 통과
- 브라우저: `+ New Wiki` 클릭 → picker open (8 카드) → Person 선택 → store 검증 (templateId="builtin-person", 3 section blocks, 4 infobox 필드, 2-column layout, themeColor amber/orange, columnAssignments 3개)
- IDB 클리어 + 리로드 후 seed 3개 article 모두 columnLayout 1-column Blank로 정상 채워짐
- 스크린샷: picker 다이얼로그 8 카드 + 컬럼 정보(2 col / 3 sections / N infobox) + accent color bar 모두 정상

### 결정
- **layout 전환 = Option A (Safe)** — 기존 `layout: "default"|"encyclopedia"` string 유지 + 신규 `columnLayout: ColumnStructure` 병존. Phase 2 렌더러 교체 시 string 제거 + rename
- **ColumnPath = `number[]` (Array)** — string `"0.1.2"` 대신 타입 안전성
- **Migration heuristic = 결정적 매핑** — 추측 없음 (encyclopedia → 2컬럼, 그 외 → 1컬럼). infobox/aliases 같은 신호 사용 안 함
- **Built-in 템플릿 = 코드 (storage X)** — `wikiTemplates` slice는 user-defined만 보관. `getBuiltInTemplate(id)` / `resolveWikiTemplate(state, id)` 헬퍼로 통합 lookup
- **반응형 collapse는 Phase 1 데이터만** — `minWidth/priority` 필드만 추가, 실제 collapse 로직은 Phase 2~3
- **WikiInfobox 버그 수정 = 최소 diff** — `entityType` prop 추가가 callback rename보다 변경 영향 작음 (4 호출 지점 + default가 기존 "note" 동작 유지)

### 다음 세션 (Phase 2)
- 컬럼 렌더러 신규 + Title 영역 (article.title + titleStyle) + themeColor cascade
- 기존 wiki-article-view.tsx + wiki-article-encyclopedia.tsx → 컬럼 렌더러 호출로 교체 (통합 검토)
- `layout: WikiLayout` 필드 제거, `columnLayout` → `layout` rename + migration v77
- 상세: `NEXT-ACTION.md`

### 환경 이슈 (해결)
- 워크트리 `node_modules` 누락 → cmd `mklink /J node_modules ..\..\..\node_modules` Junction
- 부모 레포 `node_modules`에서 `@phosphor-icons/react` + `@remixicon/react` 누락 → `npm install` (parent repo)
- Turbopack production build = symlink 거부 → `next build --webpack` 사용 (dev도 webpack 모드)

### 머신
집

---

## 2026-04-14 전일 (집, 대규모 세션)

### 완료 (코드)
- **Tier 1 인포박스 전체 완료** 🎉 (PR #194)
  - Tier 1-2 헤더 색상 테마 (노트+위키 양쪽, 8 프리셋 + 커스텀)
  - Default 레이아웃 인포박스 통합 (`wiki-article-view.tsx`에 WikiInfobox 렌더)
  - 사이드바 Infobox 섹션 제거 (중복 해소)
  - Tier 1-4 섹션 구분 행 (`WikiInfoboxEntry.type?: "field" | "section"`)
  - Tier 1-5 필드 값 리치텍스트 (`InfoboxValueRenderer` 4 패턴)
  - 위키 사이드바 Merge/Split/Categories 클릭 버그 수정 (`isDedicatedModePage`)
  - registry.ts 빌드 에러 20건 해결 (build-fixer 에이전트)

### 결정 (브레인스토밍 마라톤)
**오전**:
- Note/Wiki 2-entity 철학 영구 확정 (엔티티 통합 논의 Alpha/Beta/Gamma 전부 폐기)
- 렌더러는 위키 전용
- 노트 split = must-todo (UniqueID로 이미 가능)
- 위키 템플릿 3층 모델 (Layer 1/2/3 분리) — **이후 저녁에 폐기됨**

**저녁 (대규모 재설계)**:
- **3층 모델 폐기, 통합 모델로 재설계**: `WikiTemplate = { layout: ColumnStructure + titleStyle + themeColor + sections + infobox + hatnotes + navbox }`
- 컬럼 레이아웃 시스템: 1/2/3/N 컬럼, 중첩 최대 3 depth, 경계 드래그 비율 조절
- Layout 프리셋 독립 선택지 (`default/encyclopedia/wiki-color` 문자열) 폐기 → `ColumnStructure` 데이터 구조로 교체
- Title 블록화 안 함. `article.title + titleStyle`로 최상단 고정 (나무위키 관습)
- Column Heading 블록 안 만듦. Section(H2)로 충분
- 기본 템플릿 8종 built-in (Blank / Encyclopedia / Person / Place / Concept / Work / Organization / Event)
- 사용자 커스텀 템플릿 지원 (파라미터 조합 방식, JSX 코드 주입 X)
- 기존 3-layer 문서들 DEPRECATED 배너 + 새 진실의 원천 문서 (`BRAINSTORM-2026-04-14-column-template-system.md`) 작성

### 다음 세션 (Phase 1)
- WikiTemplate 데이터 모델 구축
- wikiTemplates slice + built-in 8종
- Store migration (기존 default/encyclopedia → 템플릿 자동 변환)
- 새 위키 생성 시 템플릿 선택 다이얼로그
- 상세: `NEXT-ACTION.md`

---

## 2026-04-13 오후~저녁 (집)

### 완료
- **노트 References 시스템 전체 구현**
  - `Note.referenceIds: string[]` + Store migration v74
  - `addNoteReference` / `removeNoteReference` 액션
  - `NoteReferencesFooter` 전면 확장 — store 연동, 피커 모달 (검색/생성/편집 3모드), +/× 버튼, 중복 제거
  - `/reference` 슬래시 커맨드 + Insert 메뉴 "Reference" 항목
  - `plot:open-reference-picker` 이벤트 기반 API
  - 빈 상태 숨기기 (referenceIds 있을 때만 ▶ REFERENCES 표시)
  - 아이콘 = Book (RiBookLine) — BookmarkSimple→Article→FileText→Book 순서로 결정
- **위키 fontSize cascade (em 기반 전환)**
  - 섹션 타이틀 rem→em 전환: text-2xl→text-[1.5em], text-xl→text-[1.25em], text-lg→text-[1.125em]
  - 메인 타이틀: text-[26px]→text-[1.75em] (Default), text-3xl→text-[1.875em] (Encyclopedia)
  - 각주/참고 헤더: text-base→text-[1em], text-[14px]→text-[0.875em]
  - fontScale을 개별 heading에서 제거 → 섹션 wrapper div.group/section에 적용 (cascade 정상화)
- **위키 텍스트 블록 display 컴팩트**
  - ProseMirror min-height:300px → unset (읽기모드)
  - p margin:0 (읽기모드, prose 오버라이드)
  - `.wiki-text-display` 클래스 추가
- **문서 정합성 복구** — SESSION-LOG, NEXT-ACTION, TODO, MEMORY 전부 stale → 코드 기반 정확히 재작성

### 브레인스토밍 & 큰 결정
- **Footnotes+References 분리 유지** — 이전 세션 논의(합치기)를 번복. 라이브러리 References와 이름 겹쳐도 OK (같은 엔티티, 다른 스코프)
- **불릿 Reference = 문서 레벨 메타데이터** — 인라인 마커 없음, `[[`/`@`에서 안 넣음 (인라인 도구에서 비인라인 결과는 UX 어색)
- **em 기반 fontSize cascade** — 글로벌 Aa 스케일 + 섹션별 개별 fontScale 동시 지원 (CSS em cascade 활용)
- **노트 전체 접기/펼치기 버튼** → P3으로 보류 (섹션 2개뿐이라 지금은 overkill)
- **Reference 아이콘 = Book** — Summary(Article), Bookmark(BookmarkSimple), Embed Wiki(BookOpen) 전부 겹쳐서 최종 RiBookLine 선택

### 다음
- **P1: 위키 레이아웃 프리셋 통합** — Default+Encyclopedia 2개 → 1개 설정 기반 렌더러

### Watch Out
- 위키 아티클 30개+ 생성됨 — 시드/migration 문제 아님, IDB 데이터 문제. 이번 코드 변경과 무관
- fontSize XL < M 버그 있었음 — fontScale inline이 em 클래스를 override하던 문제, wrapper로 이동해서 해결

### 머신
집

---

## 2026-04-12~13 (위키 각주/Reference 대형 세션)

### 완료
- **PR #182**: 위키 각주 시스템 (위키백과 스타일 문서 레벨 각주)
  - WikiFootnotesSection — offset 기반 전체 연번, 양방향 스크롤
  - Default/Encyclopedia 공유 유틸 추출 (~300줄 중복 제거)
  - 위키 텍스트 블록에 [[위키링크 + @멘션 + #해시태그 활성화
  - 드롭다운 아이콘 통일 (IconWiki + stub/article 색상)
- **PR #183**: 위키 텍스트 블록 [[/@ 삽입 버그 수정
  - tippy click-outside 가드 (드롭다운 클릭 시 에디터 닫힘 방지)
  - NoteHoverPreview를 layout.tsx 글로벌로 이동
- **PR #185**: 각주 모달 + References 하단 섹션 + footnote 티어
  - FootnoteEditModal (Title+Content+URL 통합 모달, 이벤트 기반 API)
  - WikiReferencesSection (위키백과 참고문헌 불릿 목록)
  - WikiArticle.referenceIds (문서↔Reference 직접 연결)
  - footnote 에디터 티어 (StarterKit 최소)
  - click-outside 가드 확장 (Radix Portal + role=menu/dialog)
- **PR #187**: 각주/Reference UX 개선
  - 각주 read-only 가드 (editor.isEditable 체크)
  - 위키 footnote 삽입 버그 수정 (FootnoteEditModal role="dialog")
  - Footnotes/References 컴팩트 디자인 (TipTap→텍스트, 토글, 사이즈 통일)
  - 노트 NoteReferencesFooter (기본 collapsed)

### 결정
- **Footnote = "에디터 접점", Reference = "저장소"** 원칙 유지
- **FootnoteEditModal = 글로벌 모달** — layout.tsx 마운트, 이벤트 기반 API
- **위키 각주/참고문헌 = 컴팩트 디자인** — TipTap EditorContent 폐기 → 단순 텍스트
- **Footnotes+References 통합** 다음 세션에서 검토 예정

### 다음
- **P0: 위키 레이아웃 프리셋 통합** — Default+Encyclopedia 2개 → 1개 설정 기반 렌더러

### Watch Out
- after-work 문서 업데이트 불완전했음 — SESSION-LOG, NEXT-ACTION, TODO 전부 stale 상태로 남음

---

## 2026-04-11 (Library + Reference.history)

### 완료
- **PR #181**: Library Overview Bento Grid 리디자인 + Reference.history + Split View edge case 수정
  - Reference.history 수정 이력 자동 기록 (created/edited/linked/unlinked, 50개/Reference 제한)
  - Store v73 migration (Reference.history backfill)

---

## 2026-04-10 (Split-First 완성 대형 세션)

### 완료
- **PR #177**: Split-First Phase 2~5 완료 + Calendar 리뉴얼 + 9개 view 통합 픽스
  - Store cleanup (v72 → v73), Peek 파일/참조 제거
  - SecondaryOpenPicker 다이얼로그 (Cmd+Shift+\)
  - Focus tracking + border-t-accent 시각 피드백
  - Calendar: view-swap 버그, Wiki article 통합, 사이드바 재설계 (미니 캘린더 + Heatmap)
  - 9개 view에 isEditing → WorkspaceEditorArea swap 패턴 + usePaneOpenNote 적용

### 결정
- **🎯 PIVOT: Split-First 복귀** — Peek-First 폐기. Split view + 단일 SmartSidePanel 모델 확정

### 다음
- 위키 레이아웃 프리셋 통합 (P1-4)

---

## 2026-04-09 오후~저녁 (회사)

### 완료
- **크로스노트 북마크 5 Phase** 전부 구현
  - GlobalBookmark store slice + migration v72
  - extractAnchorsFromContentJson 공용 유틸
  - Bookmarks 탭 2섹션 (Pinned + This Note) + Ctrl+Shift+B
  - WikilinkNode anchorId attr + 2단계 앵커 피커
  - 플로팅 TOC 핀 + 앵커 우클릭 Pin to Bookmarks
- **FootnotesFooter 접기/펼치기** — 기본 접힌 상태, [N] 클릭 시 자동 펼침
- **Wiki Sources 클릭 fix** — openNote + setActiveRoute로 네비게이션 정상화
- **Outline 개선** — TipTap JSON 기반, TOC 블록 우선, 헤딩 fallback, 클릭 스크롤
- **ReferencedInBadges dedupe** — 위키 article ID 기준 중복 제거 + secondary 컴팩트 모드
- **Peek-First 아키텍처 Phase 0+1** — 사이드바 단일 책임 (layout.tsx)
  - WorkspaceEditorArea에서 사이드바 코드 전부 제거
  - layout.tsx가 모든 케이스 처리 (단독/스플릿/뷰스플릿/에디터스플릿)
  - hasSplit/hasViewSplit/showSidePanel 명확한 분기

### 브레인스토밍 & 큰 결정
- **Outline = 단순 구조 시각화** — 앵커는 별개 Bookmarks 탭으로 분리
- **사이드바 아키텍처 = A안 (layout.tsx 단일 책임)** — 여러 위치 렌더링 충돌 해결
- 🎯 **Split View 폐기 + Peek 확장 (Peek-First 마이그레이션)** — 가장 큰 방향 결정
  - Phase 0~5로 단계적 진행
  - Peek 지원: Note + Wiki만 (Calendar/Ontology 제외)
  - 사이즈 시스템: Min/Mid/Max + Drag
  - 호버 프리뷰는 유지 (Peek와 별개)
- **워크플로우 개선 결정** — NEXT-ACTION.md + SESSION-LOG.md 도입

### 다음
- **Phase 2: Peek가 Wiki 표시 가능하게** (NEXT-ACTION.md 참조)

### Watch Out
- Reference.history 작업 중간에 멈춤 — Peek 마이그레이션 후 복귀
- 단독 에디터 사이드바 버그 디버깅에 시간 많이 씀 — root cause는 여러 곳에서 사이드바 렌더링 시도 + react-resizable-panels의 id+order 누락

### 머신
회사

---

## 2026-04-08 (이전 세션)

PR #169~171 작업 — Library 고도화, Reference 하이브리드 통합, Trash 뷰 확장 등.
상세는 docs/MEMORY.md PR 목록 참조.
