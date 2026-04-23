# Plot Project Memory

## 🟢 2026-04-22 Hard Reset to PR #194 (최우선 읽기)

**현재 branch HEAD**: `3f2e54c` (PR #194). PR #195 ~ #213 전부 폐기.

**대결정**: 2주간(04-14 ~ 04-21) "대결정" 3회 반복 패턴 종결:
- 04-14 컬럼 템플릿 시스템
- 04-17 Page Identity Tier
- 04-21 Book Pivot

**자각**: 사용자 언어 — "매거진/뉴스페이퍼/북 등등은 개발자 자기만족". Plot 코어(지식 관계망, 팔란티어×제텔카스텐)와 직교. "위키는 그냥 냅두자" → "PR #194가 위키 정점" → hard reset.

**폐기된 PR들**:
- #211-213 Book Pivot (5 shell: magazine/newspaper/book/blank)
- #209 Page Identity Tier (Article tint, Card palette)
- #208 메타→블록 통합 (infobox/toc 블록화)
- #207 docs catchup
- #206 메타→블록 대결정 docs
- #205 컬럼 추가/삭제 버튼
- #204 컬럼 간 블록 드래그
- #203 컬럼 비율 드래그
- #202 ColumnPresetToggle
- #201 Phase 2-1B-3 cleanup (기존 렌더러 삭제)
- #200 Phase 2-1B-2
- #199 Phase 2-1B-1
- #198 Phase 2-1A (ColumnRenderer 등)
- #197 WikiTemplate + 8 built-in
- #196, #195 session docs

**유지된 PR들** (PR #194까지):
- #194 Tier 1 인포박스 전체 완료 + 위키 디자인 버그 수정
- #193, #192 Y.Doc PoC + Block Registry 단일화 + 인포박스 Tier 1-1/1-3
- #191 나무위키 리서치 + TODO 최신화
- #190 Reference Usage + Note History + Wiki Activity 정리
- #189 Expand/Collapse All + TextBlock 드래그/리사이즈
- #188 노트 References + fontSize cascade
- #187 각주/Reference UX 개선
- (전체: 하단 Completed PRs 섹션)

**⚠️ Git 주의**: 이 branch가 hard reset 상태. main은 PR #213까지 있음. `git merge origin/main -X theirs` 실행 시 롤백 자동 취소. 곧 commit + PR 해서 main에 반영 필요.

**다음 방향**: UI 일관성 감사 + 개선. 사용자 pain point "ui가 너무 이상함, 일관성 없고" 해결. 기능 추가는 당분간 보류.

**Claude memory**: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

---

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 22-slice Zustand store with versioned migration (currently v74)
- **Workflow**: Inbox -> Capture -> Permanent (3 statuses only)

## User Preferences
- Korean communication preferred (casual tone)
- Pragmatic over theoretical — values working code over perfect design
- Prefers simple solutions (YAGNI principle)
- Commit workflow: commit -> push -> PR -> squash merge to main
- Worktree-based development (branch per session)
- Design quality is top priority — Linear-level polish
- 범용 노트앱 + 제텔카스텐

## Key Patterns
- **Separate map pattern**: `srsStateByNoteId`, `viewStateByContext`, `backlinksIndex` — avoid polluting Note type
- **Store migration**: Bump version, add migration block in `migrate()` function
- **Event system**: `noteEvents` with `NoteEventType` union, bounded to MAX_EVENTS_PER_NOTE=1000
- **Attachment IDB**: Binary blob data in separate IDB (`plot-attachments`), metadata in Zustand persist
- **Alias resolution**: BacklinksIndex + graph.ts register note aliases in `titleToId` Map (no-clobber)
- **Search**: Worker-based FlexSearch with IDB persistence
- **Body separation**: Note content in separate IDB (`plot-note-bodies`), meta in Zustand persist
- **Wiki block body separation**: Text block content in `plot-wiki-block-bodies` IDB, block metadata in `plot-wiki-block-meta` IDB
- **Workspace**: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- **Side Panel**: Unified `SmartSidePanel` — 4-tab: Detail(메타데이터) + Connections(Connected/Discover) + Activity(Thread/Reflection) + Bookmarks(앵커/북마크). Peek 탭 제거 (PR #176). 단일 인스턴스 + global state, useSidePanelEntity focus-following
- **Wiki sectionIndex**: `WikiSectionIndex[]` in Zustand for lightweight TOC, full blocks in IDB for scalability (v53)
- **Responsive NotesTable**: ONE grid for all sizes — ResizeObserver + minWidth thresholds
- **TipTap Editor**: Shared config factory (`components/editor/core/shared-editor-config.ts`) with 4-tier system (base/note/wiki/template). **Title 노드 폐기 (v65)** — 첫 번째 블록(H2)이 자동으로 타이틀 역할 (UpNote 스타일). title-node.ts 삭제됨. 25+ extensions.
- **Block Drag (dnd-kit)**: `components/editor/dnd/` — useBlockPositions + useBlockReorder 훅 + BlockDragOverlay 컴포넌트. ProseMirror DOM 위 투명 오버레이 레이어. 드래그 핸들(⠿) hover 시 블록 왼쪽에 표시. DOM 클론 프리뷰. GlobalDragHandle 제거됨.
- **Dropcursor Slot**: Dropcursor를 슬롯 인디케이터 스타일로 변경 (반투명 배경 + dashed 테두리)
- **EditorStyles.css CSS 변수**: globals.css가 hex 값 사용 → `hsl(var(--xxx))` 패턴 전부 `var(--xxx)` 또는 `color-mix()`로 변환 완료
- **Table BubbleMenu**: `components/editor/TableBubbleMenu.tsx` — 테이블 셀 focus 시 floating 툴바. Row/Col 추가삭제, Merge/Split, Align, Bold, 셀 배경색(7색), Header 토글, 스마트 삭제(CellSelection→행삭제, 아니면→테이블삭제)
- **Table Delete Key**: prosemirror-tables의 `CellSelection` + `deleteRow`/`deleteColumn` 직접 import. `addProseMirrorPlugins`로 tableEditing보다 먼저 실행되는 플러그인 등록. 빈 셀 선택 + Delete → 행/열 삭제.
- **Table Cell Background**: TableCell/TableHeader를 extend해서 `backgroundColor` 속성 추가. `setCellAttribute("backgroundColor", rgba)` 사용.
- **Table Tab Navigation**: 테이블 안에서 Tab → `goToNextCell()`, Shift+Tab → `goToPreviousCell()`
- **2-Level Routing**: `activeSpace` (inbox/notes/wiki/ontology/calendar) + `activeRoute`, `inferSpace()` 하위호환
- **Phosphor Icons**: Lucide→Phosphor 전체 마이그레이션 완료 (PR #104, 83파일). `components/plot-icons.tsx`는 레거시
- **Wiki Collection**: `wikiCollections: Record<string, WikiCollectionItem[]>` — per-wiki-note staging area for related material
- **Undo Manager**: `lib/undo-manager.ts` — LinkedList 기반 글로벌 Undo/Redo (capacity 50), Zustand state diff 기반
- **Sub-grouping**: `group.ts` 재귀 호출로 2단계 그룹핑. NoteGroup.subGroups에 저장. VirtualItem "subheader" 타입으로 렌더
- **Thread Nested Replies**: ThreadStep.parentId 기반 트리 구조. Thread 패널에서 들여쓰기 렌더 + Reply 버튼
- **Wiki Categories**: wiki-categories slice, DAG 트리 (parentIds[]), 2-panel 트리 에디터 (드래그 계층 편집)
- **Wiki Layout Preset**: `WikiLayout = "default" | "encyclopedia"` — article별 레이아웃 전환
- **Wiki URL Block**: `WikiBlockType` 'url' 추가, 유튜브 iframe embed + 일반 링크 카드
- **Unified Pipeline**: Filter/Display/SidePanel 통합 — 5개 space가 공유 컴포넌트 사용
- **ToggleSwitch**: `components/ui/toggle-switch.tsx` — 라이트/다크 모드 공통, off=회색 on=accent+white knob
- **ChipDropdown**: `components/ui/chip-dropdown.tsx` — 제네릭 드롭다운, DisplayPanel에서 추출
- **Graph Filter Adapter**: `lib/view-engine/graph-filter-adapter.ts` — OntologyFilters ↔ FilterRule[] 변환
- **Discover Engine**: `lib/search/discover-engine.ts` — keyword+tag+backlink+folder 4신호 로컬 추천
- **SidePanel 4탭**: Detail + Connections + Activity + Bookmarks. Context swapping 패턴 (`_savedPrimaryContext`). `useSidePanelEntity`는 `sidePanelContext`만 읽음
- **Toolbar Config**: `lib/editor/toolbar-config.ts` — 42 item IDs, normalizeLayout(), Arrange Mode (dnd-kit drag-and-drop). Settings store에 persist
- **Toolbar Primitives**: `components/editor/toolbar/toolbar-primitives.tsx` — ToolbarButton(40×40), ToolbarDivider, ToolbarGroup, ToolbarSpacer. Phosphor weight="light"
- **Editor Colors**: `lib/editor-colors.ts` — 16 TEXT_COLORS + 16 HIGHLIGHT_COLORS, 8-column grid
- **Floating TOC**: `components/editor/floating-toc.tsx` — Notion 스타일 에디터 우측 자동 사이드바. 대시 인디케이터(H2=16px, H3=10px), hover 확장(220px), scrollspy. 첫 heading(타이틀) 자동 제외. heading 2개+ 일 때만 표시
- **@Mention**: `components/editor/MentionSuggestion.tsx` — @tiptap/extension-mention 기반. 노트/위키(WikiArticle)/태그/날짜 4종 통합 검색. WikilinkSuggestion.tsx 패턴 복제. 날짜 파싱: `lib/mention-date-parser.ts`
- **Anchor/Bookmark**: `components/editor/nodes/anchor-node.tsx` (인라인) + `components/editor/nodes/anchor-divider-node.tsx` (블록 구분선). 플로팅 TOC + 사이드패널 Bookmarks 탭에 통합
- **Side-drop Columns**: 블록 드래그 시 좌/우 15% 영역 감지 → 자동 columnsBlock 생성. columnsBlock 위 드래그 시 기존 셀에 삽입 (3컬럼 방지). `block-drag-overlay.tsx`의 handleDragMove
- **Note Hover Preview**: `components/editor/note-hover-preview.tsx` — 싱글턴 컨트롤러, 300ms delay show / 200ms delay hide, portal 기반 팝오버
- **Note Reference Actions**: `lib/note-reference-actions.ts` — 통합 클릭 핸들러 (Peek/Navigate), title→id 해석, wikilink/mention 공용
- **Synced Block**: NoteEmbed `synced` 속성 토글, base 티어 인라인 TipTap (재귀 방지), 300ms 디바운스 원본 노트 저장
- **Block Resize**: `useBlockResize` 훅 + `BlockResizeHandles` 컴포넌트 (코너 4 + 엣지 2), width/height 속성, 리셋 버튼 헤더 통합
- **Move out of Column**: `editor-context-menu.tsx` — columnCell 내 블록을 columnsBlock 아래로 이동, cellNode.forEach + cellStart 계산
- **Column Resize (pixel)**: colWidth를 pixel 값으로 저장, CSS grid `fr` 단위로 변환, 양쪽 셀 동시 업데이트
- **Wiki Editor Tier**: shared-editor-config.ts wiki tier = base + SlashCommand + WikiQuote + Callout/Summary/Columns/Infobox/Anchor/ContentBlock + 키보드 단축키 + 테이블 키보드. 노트 에디터 FixedToolbar 재사용 (tier="wiki")
- **Wiki Click-Outside Close**: TextBlock 편집 시 blur 대신 document mousedown click-outside 패턴. blockRef.contains()로 드래그 핸들/툴바 내부 클릭 허용
- **Encyclopedia Edit = Default Edit**: DndContext + SortableBlockItem + WikiBlockRenderer(variant="encyclopedia"). 드래그/Split/Move/Delete/AddBlock/카테고리 전부 Default와 동일
- **WikiBlock.fontSize**: 섹션 블록 커스텀 폰트 크기 (0.8=S, 1=M, 1.2=L, 1.5=XL). style={{ fontSize: `${fontScale}em` }}
- **Contents TOC fontScale**: 대각선 리사이즈 핸들(우하단 코너). width/BASE_WIDTH 비율로 0.75~1.5 스케일. 제목+항목 fontSize 연동
- **Partial Quote**: WikiQuote 8필드 (sourceNoteId/sourceTitle/quotedText/quotedAt + originalText/sourceHash/context/comment). Peek/호버에서 텍스트 선택 → `plot:insert-wiki-quote` 커스텀 이벤트 → note-editor.tsx 리스너
- **Hover Preview Command Center**: `note-hover-preview.tsx` — 리치 HTML (generateHTML + createRenderExtensions), 메타데이터 바 (folder/time/backlinks), 액션바 (Open/Peek/Quote/⋯), 텍스트 선택 Quote
- **Wikilink Context Menu**: `wikilink-context-menu.tsx` — WikilinkDecoration contextmenu 이벤트 → `plot:wikilink-context-menu` CustomEvent → floating 메뉴
- **pendingFilters**: `table-route.ts` 외부 스토어. Home 카드 클릭 시 필터 주입 → notes-table.tsx에서 소비 후 클리어
- **Orphan Actions**: `lib/orphan-actions.ts` — discover engine 재활용, 4종 제안 (link/move/tag/delete)
- **Stub 부활**: `lib/wiki-utils.ts` isWikiStub() — 블록 ≤4개 + 모든 text block 비어있음 = stub. 상태 필드 없이 heuristic
- **WikilinkDecoration 3-way**: exists(보라색) / stub(주황색 점선) / dangling(빨간색). wikiArticles titleMap 추가, isWikiStub() 연동
- **[[드롭다운 섹션 분리**: Notes / Wiki 2섹션, Create Note + Create Wiki 2옵션. IconWiki 통일
- **Wikilink 4-way 시각 시스템**: `wikilink-exists`(보라밑줄) / `wikilink-wiki`(teal칩) / `wikilink-stub`(amber점선) / `wikilink-dangling`(gray점선). `[[wiki:Title]]` prefix로 타입 구분, `wiki:`는 bracket처럼 숨겨짐
- **호버 프리뷰 TipTap 통합**: Preview/Edit 동일 렌더링 — 항상 NoteEditorAdapter(editable 토글). generateHTML 폐기. 640px 카드
- **호버 프리뷰 Pin 시스템**: 모듈 레벨 `_pinned` + `_pinListeners`. 위키링크/멘션 클릭으로 `togglePreviewPin()`. Pin 시 accent 테두리 + PushPin 아이콘. `data-hover-preview` 가드로 프리뷰 안 재귀 방지
- **Footnote/Reference 시스템**: FootnoteRef 인라인 atom 노드 (`components/editor/nodes/footnote-node.tsx`). attrs: id/referenceId/content/comment. 문서 순서 기반 자동 번호 계산. 호버 팝오버(300ms delay, 200ms hide). 하단 FootnotesFooter 자동 렌더링 (`components/editor/footnotes-footer.tsx`). `[N]` 양방향 네비게이션 (본문↔하단). 하단 싱글클릭 인라인 편집. `[[`/`@` 드롭다운 References 섹션 통합.
- **Reference store**: `references: Record<string, Reference>` — title/content/fields(인포박스식 키-값)/tags. CRUD 3액션. `/footnote` 또는 `[[`/`@`에서 생성. Library에서 관리 예정.
- **WikiQuote 폐기**: WikiEmbed가 상위 대체. WikiQuoteExtension.ts, WikiQuoteNode.tsx, lib/quote-hash.ts 삭제. 호버 프리뷰/사이드패널 peek/note-editor 에서 Quote 관련 코드 전부 제거.
- **Smart Link / LinkCard**: `components/editor/nodes/link-card-node.tsx` — atom block, favicon+title+description+domain. URL paste → 자동 LinkCard. YouTube/Audio는 기존 확장이 처리
- **URL 감지 유틸**: `lib/editor/url-detect.ts` — detectUrlType(youtube/audio/generic), isValidUrl, extractDomain
- **UrlInputDialog**: `components/editor/url-input-dialog.tsx` — Portal 기반 공용 다이얼로그 (link/embed 2모드). window.prompt 전면 대체
- **Embed 통합**: YouTube+Audio+LinkCard를 1개 Embed 버튼으로 통합. URL 패턴 자동 감지
- **Editor Icon Barrel**: `lib/editor/editor-icons.ts` — 101개 아이콘 중앙 매핑 (Phosphor→Remix). 에디터 전용, 나머지 앱은 Phosphor 유지. 32개 에디터 파일이 이 barrel에서 import
- **Indent Extension**: `components/editor/core/indent-extension.ts` — paragraph/heading에 indent 속성 (0-8단계, 24px/단계). addGlobalAttributes로 등록. Enter 시 indent 자동 상속
- **Library Space**: 6번째 Activity Bar 공간. 사이드바 NavLink(Overview/References/Tags/Files). 서브라우트: `/library`, `/library/references`, `/library/tags`, `/library/files`. Always-mounted 패턴
- **ReferenceDetailPanel**: `components/side-panel/reference-detail-panel.tsx` — SmartSidePanel Detail 탭에서 Reference 편집. SidePanelContext `{ type: "reference", id }` 확장
- **각주→Reference 자동 연결**: footnote-node.tsx + footnotes-footer.tsx의 save()에서 referenceId 없으면 자동 createReference + 연결. content 수정 시 동기화
- **More Actions Overflow**: Pin 고정, 우클릭 Favorites (settings-store persist), 서브패널 (컬러피커/테이블 호버선택/이미지). `overflowFavorites: string[]` in settings store
- **Split View (듀얼 패널)**: 하이브리드 모델 — 좌측=메인(selectedNoteId), 우측=독립 참조(secondaryNoteId). `secondaryHistory[]` 독립 네비게이션. `secondaryRoute/secondarySpace` 독립 라우팅 (table-route.ts). `PaneContext` + `usePaneOpenNote` + `usePaneActiveRoute` 훅. `SecondaryPanelContent`가 note/wiki/뷰 렌더링. breadcrumb 드롭다운으로 6 space 전환. `setRouteInterceptForSecondary`로 우측 클릭 시 글로벌 라우트 인터셉트. 사이드바는 좌측 전용
- **SmartSidePanel Context Swapping**: `_savedPrimaryContext` 패턴. `setActivePane`/`openInSecondary`/`openNote(secondary)` 호출 시 `sidePanelContext`를 primary↔secondary 간 swap. `useSidePanelEntity`는 `sidePanelContext`만 읽음. Zustand `activePane` 구독 이슈 우회
- **Wiki Detail SmartSidePanel 통합**: 위키 내장 aside 제거, `WikiArticleDetailPanel`에 Sources/Delete 추가. 위키도 노트와 동일하게 SmartSidePanel 사용
- **Breadcrumb Note Picker**: `editor-breadcrumb.tsx` NotePickerChevron — ">" 클릭 시 검색+노트 리스트 드롭다운. StatusShapeIcon + 라벨 칩. 20개 제한
- **Reference.history**: 수정 이력 자동 기록 (created/edited/linked/unlinked). 50개/Reference 제한. Store v73 migration
- **Library Create Menu**: ViewHeader `createMenuContent` prop — + 버튼 팝오버. Reference/Tag/File 생성
- **Tags pickColor 통일**: 에디터/Tags뷰 모두 `pickColor(name)` 사용 (이름 해시 기반 자동 색상)
- **Wiki 공유 유틸**: `lib/wiki-block-utils.ts` (computeSectionNumbers/getInitialContentJson/buildVisibleBlocks) + `hooks/use-wiki-block-actions.ts` (useWikiBlockActions) + `components/wiki-editor/wiki-layout-toggle.tsx` (WikiLayoutToggle). 두 렌더러 ~300줄 중복 제거
- **Wiki 문서 레벨 각주**: `wiki-footnotes-section.tsx` — 위키백과 스타일. FootnoteRefExtension에 `addStorage({ footnoteStartOffset: 0 })`. 블록별 offset으로 문서 전체 연번. IDB에서 contentJson 로드 → footnoteRef 수집 → 통합 목록. 양방향 스크롤 (`data-wiki-footnote-id` / `data-footnote-id`). `onFootnoteCount` 콜백으로 블록별 각주 개수 리포트
- **Wiki 텍스트 블록 [[/@/# 활성화**: wiki 티어에 HashtagSuggestion, WikilinkSuggestion, WikilinkNode, WikilinkInteractionExtension, Mention, MentionInteractionExtension, Emoji 추가. 노트와 동일한 인라인 제안 기능
- **드롭다운 아이콘 통일**: MentionSuggestion 위키=IconWiki(보라/주황), WikilinkSuggestion 노트=StatusShapeIcon 색상. Stub=#f59e0b(주황), Article=#8b5cf6(보라)
- **Default 레이아웃 TOC 반응형**: aside `hidden xl:block` + `shrink` + 콘텐츠 `pb-40` (Add block 드롭다운 잘림 방지)
- **FootnoteEditModal**: `components/editor/footnote-edit-modal.tsx` — 글로벌 모달 (layout.tsx 마운트). Title+Content+URL 3필드. 이벤트 기반 API (`openFootnoteModal`/`cancelFootnoteModal`). Cancel 시 빈 각주 노드 삭제. Reference 자동 생성/동기화
- **WikiReferencesSection**: `wiki-footnotes-section.tsx` 내. WikiArticle.referenceIds 기반 불릿 목록. 모달 3모드 (search/create/edit). Library Reference와 동일 엔티티
- **footnote 에디터 티어**: `shared-editor-config.ts` `"footnote"` case. StarterKit(heading/codeBlock/horizontalRule/blockquote/list 전부 false) + Link + Underline + Placeholder
- **click-outside 가드 패턴**: `wiki-block-renderer.tsx` TextBlock — `.tippy-content, .tippy-box, [data-tippy-root], [data-radix-popper-content-wrapper], [role="menu"], [role="dialog"]` 전부 "내부"로 인식
- **각주 read-only 가드**: `footnote-node.tsx` handleClick + `footnotes-footer.tsx` openModal — `editor.isEditable` 체크. "Click to add content" 버튼도 read-only 시 숨김
- **FootnoteEditModal role="dialog"**: click-outside 가드가 모달을 인식하도록. 위키 TextBlock에서 각주 편집 시 에디터 언마운트 방지
- **위키 Footnotes/References 컴팩트 디자인**: TipTap EditorContent 폐기 → 단순 텍스트. `▶` chevron 토글 + `text-base` 헤더 + `text-[14px]` 내용. `[N]` 번호 크기 `text-[14px]` 통일
- **노트 NoteReferencesFooter (확장, PR #188)**: `footnotes-footer.tsx` 내. `note.referenceIds` store 직접 읽기 + 각주 referenceIds 중복 제거. 피커 모달 (검색/생성/편집 3모드, WikiReferencesSection 패턴 복제). `+` 버튼 + hover `×` 삭제. `plot:open-reference-picker` 이벤트로 외부 트리거 (슬래시 커맨드, Insert 메뉴). 빈 상태 숨기기 (referenceIds 있을 때만 표시). Reference 아이콘 = Book (RiBookLine)
- **em 기반 fontSize cascade (PR #188)**: 위키 타이틀/섹션/각주의 Tailwind rem/px 클래스를 em으로 전환. fontScale inline을 개별 heading에서 제거 → 섹션 wrapper `div.group/section`에 적용. 글로벌 Aa 스케일(WikiArticle.fontSize) + 개별 섹션 fontScale(WikiBlock.fontSize) CSS em cascade로 동시 동작
- **위키 텍스트 display 컴팩트 (PR #188)**: `.wiki-text-display` 클래스. `ProseMirror min-height:unset !important` + `p margin:0 !important`. 편집→읽기 전환 시 간격 점프 해소. 편집 중은 TipTap 기본 간격 유지

- **Expand/Collapse All (나무위키 패턴)**: `plot:set-all-collapsed` CustomEvent. 노트: `note-editor.tsx` chevron 버튼(PushPin 왼쪽), Details `open` attr 일괄 토글 + 이벤트 dispatch. 위키: `wiki-view.tsx` 기존 버튼에 이벤트 dispatch 추가. 리스너: `summary-node.tsx`, `footnotes-footer.tsx`(FootnotesFooter+NoteReferencesFooter), `wiki-footnotes-section.tsx`(WikiFootnotesSection+WikiReferencesSection)
- **위키 TextBlock BlockDragOverlay**: `wiki-block-renderer.tsx` WikiTextEditor에 BlockDragOverlay 래핑. `pl-8` 좌측 패딩 = 드래그 핸들 거터. 노트 에디터 TipTapEditor.tsx와 동일 패턴
- **위키 TextBlock 4코너 리사이즈**: `WikiBlock.editorWidth/editorHeight` persist (Store v75). 편집 모드에서만 적용 (읽기=full width). `block-resize-corner--tl/tr/bl/br` CSS 재활용. `⋯` 메뉴 "Reset editor size" (ArrowsIn). `useBlockResize` 훅 로직 인라인 (NodeView가 아니라 일반 React 컴포넌트라서)

## Store Slices (22 total, v75)
notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories, references, global-bookmarks

- **Reference Usage 섹션**: `reference-detail-panel.tsx` — notes.filter + wikiArticles.filter로 사용처 목록. openNote/navigateToWikiArticle 클릭 네비게이션
- **Note History = ActivityTimeline 연결**: `side-panel-activity.tsx` — noteEvents 기반 타임라인 (기존 `activity-timeline.tsx` 재활용)
- **Wiki Activity 중복 정리**: Article Stats 삭제 (Detail Properties와 중복), Thread 메시지 삭제
- **Expand/Collapse All 항상 표시**: 접을 게 없으면 disabled + 흐릿. Details 토글 = DOM 클릭 (setNodeMarkup 대신). hasCollapsibles: details/summary/footnoteRef/referenceIds

## 나무위키 리서치 결과 (2026-04-14) — 도입 대상
- **Tier 1 인포박스 완료** 🎉: ✅ 대표 이미지+캡션 (PR #192), ✅ 헤더 색상 테마 (2026-04-14 밤), ✅ 접기/펼치기 (PR #192), ✅ 섹션 구분 행 (2026-04-14 밤), ✅ 필드 값 리치텍스트 (2026-04-14 밤)
- **Tier 2 새 블록**: 배너 블록 (배경색+제목+부제), 둘러보기 틀 (Navigation Box)
- **Tier 3 매크로**: 나이 계산 [age], D-Day [dday], Include (틀 삽입)
- **Tier 4 고급**: 상위/하위 문서 관계, 각주 이미지, 루비 텍스트
- **아키텍처 결정**: 모든 새 기능 = base 티어 (노트+위키 공용). ✅ Insert 레지스트리 단일화 완료 (PR #192, 3곳 중복 제거)

## 2026-04-14 세션 의사결정 (브레인스토밍)
- **Note/Wiki 2-entity 철학 확정** — 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. 2026-04-01 결정 재확인. 차별점의 원천 = 데이터 구조 (TipTap JSON vs WikiBlock[]). 렌더러는 위키 전용. 자세히: `docs/BRAINSTORM-2026-04-14-entity-philosophy.md`
- **템플릿 3층 모델** — Layer 1 Layout Preset (렌더러, 위키 전용) + Layer 2 Content Template (섹션 뼈대, Person/Place 등) + Layer 3 Typed Infobox. 노트 템플릿은 NoteTemplate slice 유지 (UpNote식 단순 복사).
- **노트 split = must-todo** — UniqueID extension으로 이미 가능 (top-level 노드 23종 영속 ID). 위키 splitMode UI 재활용. Medium × 2-3일 × PR 하나. 우선순위는 위키 디자인 강화 이후.
- **표류 종결** — 2026-03-30 PIVOT #1 (IKEA 전략) → 2026-04-01 ROLLBACK #2 (노션식 폐기) → 2026-04-14 FINAL (분리 유지 + 위키 디자인 강화). 향후 엔티티 통합 제안 금지.

## Completed PRs (recent)
- **PR #215 (2026-04-23)**: Wiki visual polish + Ontology rename + IDB fix
  - Graph → Ontology rename (editor-breadcrumb, linear-sidebar, view-header, secondary-panel-content, ontology-view)
  - Encyclopedia TOC: dark-only `white/XX` → design tokens (border-border-subtle / bg-secondary/20 / text-foreground/80)
  - Both modes: "최근 수정: N시간 전" updatedAt below title (`shortRelative()`)
  - Default TOC header: "Contents" uppercase → quiet "목차" (text-[11px] text-muted-foreground/50), max-w-[240px]
  - `plot-note-bodies` IDB DB_VERSION 1→2 (corrupted object store 복구)

- **PR #214 (merged 2026-04-22)**: Hard reset to PR #194 — Book Pivot 전면 롤백. PR #195-#213 폐기.

- **WIP (2026-04-14 밤, next PR)**: 인포박스 Tier 1 전체 (Tier 1-2 헤더 색상 + Default 인포박스 통합 + Tier 1-4 섹션 구분 행 + Tier 1-5 필드 리치텍스트)
  - **경로 A: TipTap `InfoboxBlockNode`** (노트 에디터 + 위키 TextBlock 내부 슬래시 `/infobox`)
    - `headerColor` attr 추가 (`string | null`, null=default `bg-secondary/30` class)
    - 헤더 div: `headerColor ? style={{ backgroundColor }} : bg-secondary/30 class`
  - **경로 B: `WikiInfobox` 컴포넌트** (위키 encyclopedia 레이아웃 상단 플로팅 인포박스)
    - `WikiArticle.infoboxHeaderColor?: string | null` 필드 추가 (optional, Migration 불필요)
    - `WikiInfobox` props에 `headerColor` + `onHeaderColorChange` 추가 — `onHeaderColorChange` 없으면 피커 자동 숨김 (read-only consumer 자동 대응)
    - `wiki-article-encyclopedia.tsx` editable 경로에서 `article.infoboxHeaderColor` + `usePlotStore.getState().updateWikiArticle({ infoboxHeaderColor })` 연결. 2개 호출 사이트 (center + left layout mode)
    - `wiki-article-reader.tsx` + `note-editor.tsx`는 변경 없음 — Note.wikiInfobox엔 color 필드 없고 onHeaderColorChange 미전달로 자동 숨김
  - **공통 (두 경로 동일)**: `HEADER_COLOR_PRESETS` 8종 (Default/Blue/Red/Green/Yellow/Orange/Purple/Pink, rgba 0.35 alpha), `hexToRgba(hex, 0.35)` 유틸, PaintBucket 버튼 (showColorPicker || headerColor → 상시, 아니면 hover-gated), 팝오버 `absolute right-2 top-[calc(100%+4px)]` 스와치 8개 + 구분선 + 커스텀 color input
  - **검증**: preview에서 (A) 노트 infobox Purple/Blue/Default, (B) 위키 Zettelkasten article encyclopedia layout에서 Edit → PaintBucket 노출 → Green 선택 → store.infoboxHeaderColor persist. `data-header-color` HTML serialize 확인
  - **경로 C: 위키 Default 레이아웃에도 인포박스 인라인 렌더** — `wiki-article-view.tsx` Aliases 뒤 + Category 앞 위치. encyclopedia와 동일 center/float-right 분기 (중앙 정렬일 때만 center, 아니면 float-right w-[280px]). editable일 때만 `onHeaderColorChange` 전달
  - **사이드바 Infobox 섹션 제거** — `wiki-article-detail-panel.tsx`의 `article.layout !== "encyclopedia"` 조건 섹션 삭제. 이전에는 Default layout 전용 사이드바 백업이었으나, 이제 Default도 본문에 인포박스 있으니 중복 제거. 검증: Default layout에서 visible infobox=1 (float-right 본문만), 사이드바 Infobox heading=false
  - **Tier 1-4 섹션 구분 행 (2026-04-14 밤)**: 나무위키식 그룹 헤더. `WikiInfoboxEntry.type?: "field" | "section"` optional + TipTap `InfoboxRow` 동일. 렌더: `type === "section"` → full-width `bg-secondary/40` + bold uppercase + value 숨김. Edit UI: 섹션 row용 넓은 input (placeholder "Section name", uppercase styling). "Add section" 버튼을 "Add field" 옆에 배치 (`flex items-center gap-4`). `handleAddSection`/`addSectionRow` 새 액션. backward compat — 기존 데이터 `type` 없으면 field 취급
  - **Tier 1-5 필드 값 리치텍스트 (2026-04-14 밤)**: 공용 `InfoboxValueRenderer` (`components/editor/infobox-value-renderer.tsx`). Tokenize 알고리즘: left-to-right 스캔, 각 위치에서 4개 matcher 중 가장 빠른 match 선택 (우선순위 image > wikilink > md-link > auto-url). 패턴: `![alt](url)` → `<img inline-block h-[1.25em]>`, `[[title]]` → wikilink (wikiArticles title/aliases → note title → dangling dashed), `[text](url)` → `<a target="_blank">`, `https?://...` → auto-link. 보안: `isSafeUrl` (http/https/data:image/ 경로만). 편집 모드는 raw text input 유지 (syntax 그대로), **읽기 모드에서만 리치 렌더** (WikiInfobox는 `!isEditing`, InfoboxBlockNode는 `!editable`). 검증: BIOGRAPHY section + Permanent Note wikilink + de.svg 국기 이미지 + Wikipedia md-link + luhmann.surge.sh auto-URL + NonExistent Article dangling 모두 정상 렌더. **Tier 1 인포박스 전체 완료** 🎉
  - **중장기 TODO (새 세션)**: `WikiInfobox` 컴포넌트 → `InfoboxBlockNode` 통합. 지금은 두 구현이 공존 (같은 프리셋/유틸 복제). 통합 시 `article.infobox` 스키마를 TipTap JSON 또는 infoboxNode 인스턴스로 전환 필요 (wiki-to-tiptap.ts, seeds, migrations 영향)

- **PR #192 (merged 2026-04-14)**: Y.Doc split-view sync PoC + Block Registry 단일화 + 인포박스 Tier 1-1/1-3
  - Y.Doc Split-View Sync PoC (`lib/y-doc-manager.ts` 싱글톤 registry + isFresh 플래그). `@tiptap/extension-collaboration` 바인딩. `?yjs=1` / `window.plotYjs(true)` / localStorage 3-way 플래그
  - Data-loss regression 2건: (1) stale Y.Doc binding — useState+useEffect → useRef + 렌더 중 동기 전환. (2) empty-content guard JSON threshold 실패 → plainText only 로 단순화
  - Block Registry 단일화 `components/editor/block-registry/` — 25+ entry 단일 source. SlashCommand.tsx (COMMANDS 배열), insert-menu.tsx (JSX 하드코드), FixedToolbar.tsx (인라인 체인 13개) 모두 registry 읽기로 마이그레이션. 새 블록 추가 = registry.ts 한 파일
  - 인포박스 Tier 1-1: 대표 이미지 + 캡션 (heroImage / heroCaption attrs, URL prompt, hover Add/Remove)
  - 인포박스 Tier 1-3: 접기/펼치기 (chevron 토글 + plot:set-all-collapsed 전역 이벤트 리슨). Atom node DOM attach 타이밍 → requestAnimationFrame 재시도 패턴
- **PR #191 (merged 2026-04-14)**: docs: 나무위키 리서치 결과 + TODO 최신화 + 아키텍처 결정
- **PR #190 (merged 2026-04-14)**: Reference Usage + Note History + Wiki Activity 정리 + chevron 비활성
  - Reference Usage 섹션 구현 (사용처 노트/위키 목록)
  - Note History ActivityTimeline 연결
  - Wiki Activity Stats 중복 제거
  - Expand/Collapse All 항상 표시 + 비활성 상태
- **PR #189 (merged 2026-04-13)**: Expand/Collapse All + 위키 TOC 버그 + TextBlock 드래그 핸들 + 4코너 리사이즈
  - 나무위키식 Expand/Collapse All (노트 chevron 버튼 + 위키 기존 버튼 확장)
  - plot:set-all-collapsed CustomEvent (Details/Summary/Footnotes/References 전부 대상)
  - TocBlockNode + TableOfContents wiki 티어 등록 (기존 버그 수정)
  - WikiTextEditor BlockDragOverlay 래핑 (에디터 내 블록 드래그 핸들)
  - WikiBlock.editorWidth/editorHeight persist + 4코너 리사이즈 핸들
  - Store v75 migration
  - Reset editor size 메뉴 (ArrowsIn)
- **PR #188 (merged 2026-04-13)**: 노트 References 시스템 + fontSize cascade + 위키 텍스트 컴팩트
  - Note.referenceIds: string[] + Store migration v74
  - NoteReferencesFooter 전면 확장 (store 연동, 피커 모달 3모드, +/× 버튼, 중복 제거)
  - /reference 슬래시 커맨드 + Insert 메뉴 Reference 항목
  - plot:open-reference-picker 이벤트 기반 API
  - 빈 상태 숨기기 (referenceIds 있을 때만 표시)
  - Reference 아이콘 = Book (RiBookLine)
  - 위키 fontSize em 전환 (rem→em, fontScale wrapper 이동)
  - 위키 텍스트 display 컴팩트 (ProseMirror min-height:unset, p margin:0)
- **PR #187 (merged 2026-04-13)**: 각주/Reference UX 개선
  - 각주 read-only 가드 (editor.isEditable 체크)
  - 위키 footnote 삽입 버그 수정 (FootnoteEditModal role="dialog")
  - 위키 Footnotes/References 컴팩트 디자인 (TipTap→텍스트, 토글, 사이즈 통일)
  - 노트 References 하단 섹션 (NoteReferencesFooter, 기본 collapsed)
  - Footnotes+References 통합 논의 (→ 다음 세션 P0)
- **PR #185 (merged 2026-04-12)**: 각주 모달 + References 하단 섹션 + footnote 티어 + 사이드패널 버그 수정
  - FootnoteEditModal (Title+Content+URL 통합 모달, 각주/레퍼런스 동일 UX)
  - WikiReferencesSection (위키백과 참고문헌 불릿 목록, 검색+생성+편집 모달)
  - WikiArticle.referenceIds (문서↔Reference 직접 연결)
  - footnote 티어 (StarterKit 최소 + Link + Underline)
  - Reference.contentJson 추가
  - click-outside 가드 확장 (Radix Portal + role=menu/dialog)
  - Reference 사이드패널 고착 버그 수정 (모달로 대체)
- **PR #183 (merged 2026-04-12)**: 위키 텍스트 블록 [[/@ 삽입 버그 수정 + 호버 프리뷰 글로벌 이동
  - tippy click-outside 가드 (드롭다운 클릭 시 에디터 닫힘 방지)
  - async deleteRange stale range 수정
  - NoteHoverPreview를 layout.tsx 글로벌로 이동
- **PR #182 (merged 2026-04-12)**: 위키 각주 시스템 + 공유 유틸 추출 + 드롭다운 아이콘 통일
  - 위키 문서 레벨 각주 (위키백과 스타일, offset 기반 전체 연번)
  - 두 렌더러(Default/Encyclopedia) 공유 유틸 추출 (~300줄 중복 제거)
  - EncyclopediaFooter 중복 제거 (사이드바에서 이미 표시)
  - 위키 텍스트 블록에 [[위키링크 + @멘션 + #해시태그 활성화
  - MentionSuggestion/WikilinkSuggestion 아이콘 통일 (IconWiki + stub/article 색상)
  - Default 레이아웃 TOC 반응형 + 스크롤 수정
- **PR #186 (merged 2026-04-13)**: docs: CONTEXT.md + MEMORY.md 최신화 (PR #185, 각주 모달/References/Usage TODO)
- **PR #185 (merged 2026-04-12)**: 각주 모달 + References 하단 섹션 + footnote 티어
  - FootnoteEditModal (Title+Content+URL 통합 모달, 이벤트 기반 API, layout.tsx 글로벌 마운트)
  - WikiReferencesSection (위키백과 참고문헌 불릿 목록, 검색+생성+편집 모달)
  - WikiArticle.referenceIds (문서↔Reference 직접 연결)
  - footnote 에디터 티어 (StarterKit 최소 + Link + Underline)
  - Reference.contentJson 추가
  - click-outside 가드 확장 (Radix Portal + role=menu/dialog)
- **PR #184 (merged 2026-04-12)**: docs: CONTEXT.md + MEMORY.md 최신화 (PR #182-183, 위키 각주/유틸/아이콘/호버)
- **PR #183 (merged 2026-04-12)**: 위키 텍스트 블록 [[/@ 삽입 버그 수정 + 호버 프리뷰 글로벌 이동
  - tippy click-outside 가드 (드롭다운 클릭 시 에디터 닫힘 방지)
  - async deleteRange stale range 수정
  - NoteHoverPreview를 layout.tsx 글로벌로 이동
- **PR #182 (merged 2026-04-12)**: 위키 각주 시스템 + 공유 유틸 추출 + 드롭다운 아이콘 통일
  - 위키 문서 레벨 각주 (위키백과 스타일, offset 기반 전체 연번)
  - 두 렌더러(Default/Encyclopedia) 공유 유틸 추출 (~300줄 중복 제거)
  - 위키 텍스트 블록에 [[위키링크 + @멘션 + #해시태그 활성화
  - MentionSuggestion/WikilinkSuggestion 아이콘 통일
- **PR #181 (merged 2026-04-11)**: Library 리디자인 + Reference.history + Split View edge case 수정
  - Library Overview Bento Grid 리디자인 (Premium stat cards)
  - Reference.history 수정 이력 자동 기록 (created/edited/linked/unlinked, 50개 제한)
  - Store v73 migration (Reference.history backfill)
- **PR #176 (merged 2026-04-09)**: Peek-First 실험 완성 + Split-First 복귀 Phase 1
  - Peek-First 완성 (Phase 2~3.5) — wiki 지원, Empty State, 사이즈 시스템, back/forward, pin
  - 노트/위키 시각 구분 (StatusShapeIcon + wiki violet), MentionSuggestion 일관성
  - **피벗**: Peek UI가 chrome 레이어 안이라 동등한 에디터 느낌 불가능 → Split-First 복귀
  - **Phase 1**: SmartSidePanel 단일 인스턴스 + global state, Peek 탭 제거 (4탭), useSidePanelEntity
- **PR #175 (merged 2026-04-09)**: Cross-Note Bookmarks + Outline 개선 + Peek-First 아키텍처 + 워크플로우 개선
  - GlobalBookmark 시스템 (5 Phase): store slice + migration v72, extractAnchorsFromContentJson, Bookmarks 탭 2섹션(Pinned+ThisNote), WikilinkNode anchorId attr + 앵커 피커, 플로팅 TOC 핀
  - Outline 개선: TipTap JSON 기반 (markdown 파서 폐기), TOC 블록 우선 + 헤딩 fallback
  - Footnote 접기/펼치기: 기본 접힌 상태 "▶ FOOTNOTES (N)"
  - Peek-First 아키텍처 Phase 0+1: 사이드바 단일 책임 = layout.tsx, ResizablePanel id+order
  - 워크플로우: NEXT-ACTION.md + SESSION-LOG.md 도입
- **PR #174 (merged 2026-04-08)**: docs: CONTEXT.md + MEMORY.md 최신화 (v71, 21 slices, Split View)
- **PR #173 (merged 2026-04-08)**: Split View 사이드패널 분리 — primary/secondary 독립 SmartSidePanel
- **PR #172 (merged 2026-04-08)**: Split View 독립 패널 시스템 — 하이브리드 듀얼 에디터, PaneContext, secondaryHistory
- **PR #80**: Wiki system + Side Peek + soft-delete trash
- **PR #81**: 위키링크 UX 통합 — `[[` 하나로 통합
- **PR #84**: Architecture Redesign v2 Phase 1~5 완료
- **PR #85**: Phase 6 Wiki Evolution + 후속 작업 — auto-enroll, korean-utils, Graph 노드 형태, Wiki Overview 재구조, Calendar 승격, 위키 강등, Display 정리
- **PR #86**: Phase 7 Wiki Collection + Graph Insights + docs 정리
- **PR #91**: Custom Views + Calendar 리디자인 + 분포 패널 + 디자인 라이브러리
- **PR #88**: Filter & Display 시스템 v2 — Linear 철학 적용
  - FilterPanel 2단계 nested (hover 기반 side-by-side)
  - DisplayPanel 2모드 (List/Board, Table 제거)
  - List 모드 Linear식 렌더링 (status shape icon + 제목 + 칩 + 시간)
  - Status 형태 차별화 (○ Inbox / ◐ Capture / ● Permanent)
  - Priority 제거 (Pin + Labels로 대체)
  - Grouping/Sub-grouping 드롭다운 추가
  - view-configs 5뷰별 설정 분리
  - ViewState 확장 (subGroupBy, showThread, orderPermanentByRecency)
  - Links/Reads/Updated/Created 아이콘 구분자
- **PR #89**: 후속 개선 — EditorToolbar hooks 수정, Board toast, Grouping 동적 연동
- **PR #90** (WIP): 레이아웃 리팩토링 + List 디자인 품질 개선
  - List/Table 컬럼 디자인 Linear 수준으로 (선 제거, 연한 헤더, 44px 행)
  - "Order by X" 정렬 칩 (ViewHeader에 표시)
  - ViewDistributionPanel 신규 (Linear식 우측 데이터 분포 패널)
  - deprecated LayoutMode(6값) 완전 삭제
  - Research 모드 + 6개 서브프리셋 삭제
  - Zen 모드 삭제 → sidebarCollapsed + detailsOpen 독립 토글
  - WorkspaceMode 타입 삭제, store migration v44
  - Filter sub-panel hover 위치 동적 계산 (Linear식)
  - Quick Filter 클릭 연동

- **PR #101**: Board SubGroup Rows + Distribution Panel + 필터 토글
  - Board 컬럼 내 SubGroup(Rows) 렌더링 — 서브그룹 헤더 + 접기/펼치기 + COLUMN_CARD_LIMIT 유지
  - Display Panel Board 모드에 Rows + Group order 드롭다운 복원
  - Board에 ViewDistributionPanel 연결 (List와 동일한 Status/Folder/Tags/Labels 4탭)
  - Distribution 사이드바 항목 클릭 = 필터 토글 (List/Board 양쪽)
- **PR #100**: Linear Design Polish + Sub-group Order
  - 8-Phase 디자인 토큰 준수율 100% 달성 (~251건 위반 → 5건 의도적 유지)
  - globals.css에 11개 신규 시맨틱 토큰 추가 (sidebar-active, surface-overlay, hover-bg, active-bg, toolbar-active 등)
  - DESIGN-TOKENS.md에 Linear Polish Design Principles 6대 원칙 + Borderless Design 원칙 + Surface/인터랙션 토큰 문서화
  - DESIGN-TOKENS.md 다크테마 값 globals.css 실제값으로 동기화
  - linear-sidebar.tsx: 27건 rgba/hex → 시맨틱 토큰
  - view-header + filter-panel + display-panel: P0 라이트모드 깨짐 수정 (bg-[#1d1d20] → bg-surface-overlay)
  - notes-table.tsx: 24건 arbitrary value → 토큰 (text-[Npx], bg-white/, hex)
  - FixedToolbar + EditorToolbar + ColorPicker + TableMenu: 인라인 style → Tailwind (rgba(94,106,210,0.2) → bg-toolbar-active)
  - 나머지 ~20 파일: text-[Npx], bg-white/ 일괄 토큰화
  - Sub-group Order: ViewState.subGroupSortBy (default/manual/name/count) + 드롭다운 UI
  - Sub-group 드래그 순서 변경 (manual 모드)
  - Grouping/Sub-grouping 상호 배제 + 자동 리셋
  - Board 뷰에서 미지원 Rows/Group order 행 제거
  - Store migration v54→v58
- **PR #102**: 타이포그래피 밸런스 + 위키 카테고리 UX 대폭 개선
  - 위키/캘린더/스플릿 에디터 폰트 크기 조정
  - 카테고리 검색 필터, RECENT 최근 1개, 우클릭 컨텍스트 메뉴(Add subcategory/Rename/Delete)
  - 빈 공간 우클릭 "New category"
  - List 뷰 (Tree/List 전환), 전용 필터(Tier/Status), 디스플레이(Grouping/Ordering/토글/Display Properties)
  - 칼럼: Name/Parent/Tier/Articles/Stubs/Sub/Updated
  - 그룹핑: Tier별/Parent별/Family별 (Family=루트 조상 기준 계보+들여쓰기)
  - WikiCategory에 updatedAt 필드 추가 (store migration v61)
  - 카테고리 미선택 시 All Categories overview 표시
- **PR #103**: 카테고리 Board 뷰 + Notes Board 더블클릭 + 사이드바
  - Tree 모드 제거, List+Board 2모드 체제 전환
  - Board: Tier별 3칼럼(1st/2nd/3rd+), dnd-kit 드래그로 계층 이동
  - Board/List 공용 Columns/Rows/Sub-grouping 드롭다운 (Notes DisplayPanel 벤치마킹)
  - 전 칼럼 정렬 버튼 (7개: name/parent/tier/articles/stubs/sub/updated)
  - Display Properties 토글 → 실제 칼럼 표시/숨김 연동
  - Board Columns 드롭다운 → Tier/Parent/Family 보드 그룹핑 실제 반영
  - 우측 사이드바: All Overview / Category Detail / Batch Actions 3상태
  - Notes Board 더블클릭 → 에디터 열기 (싱글클릭=프리뷰)
  - Tier depth 무한 허용 (제한 해제), Board에서 3rd+ 합침
- **PR #120**: Unified Pipeline Phase 1~4 — Filter/Display/SidePanel 통합 + Design Spine + Discover 추천 엔진
- **PR #121**: Board UX — Trash→Tools, 드래그 선택, 그룹핑 컬럼 숨김, Tags 폐기, 필터 Status shape 아이콘, Mixed status 표시
- **PR #122**: Phase 7 즉시 개선 + 에디터 통합 프로젝트 플랜 수립
- **PR #123**: 에디터 Phase 1A+1B — Shared TipTap config 추출 (4-tier factory: base/note/wiki/template) + Title 노드 통합 (제목/본문 하나의 TipTap 에디터, title-node.ts 커스텀 노드, NoteEditorAdapter 변환 로직, note-editor.tsx title input 제거)
- **PR #125**: Phase 1C+ — Editor Toolbar Redesign + Side Panel 3→4탭 + Arrange Mode
  - Side Panel: Discover→Connections+Activity 분리. 4-tab (Detail/Connections/Activity/Peek). v64 migration
  - Connected/Discover 2-section model, Relations UI 삭제, Peek wiki fallback
  - Toolbar: h-14 bar, w-10 buttons, 42 items, Arrange Mode (dnd-kit), Color palette 16색
  - Editor context menu (우클릭), custom commands, InsertMenu 개선
- **PR #126**: Phase 1 커스텀 노드 + 에디터 UX 개선
  - TOC Block, Callout Block, Align 드롭다운 통합, BacklinksFooter 삭제
- **PR #128**: Title 노드 폐기 (UpNote 스타일) + 블록 드래그 인프라
  - title-node.ts 삭제, TitleDocument 제거, Store v65
  - 첫 번째 블록(H2)이 자동 타이틀 역할
  - GlobalDragHandle + AutoJoiner 설치, 커스텀 노드 not-draggable
- **PR #129**: dnd-kit 블록 리오더 + 에디터 UX 개선
  - dnd-kit Phase 1~4, GlobalDragHandle 제거, Backspace heading→paragraph
  - H 드롭다운 위치 수정, EditorStyles.css hsl(var()) 전면 수정, H2 타이틀 28px
- **PR #131 (WIP)**: 에디터 Phase 1 확장 — Columns 완성, 플로팅 TOC, @멘션, 앵커/북마크, Side-drop 개선
- **PR #130 (WIP)**: 테이블 UX 대폭 개선
  - TableBubbleMenu (Row/Col/Merge/Split/Align/Bold/Color/Header/Delete)
  - Delete 키 빈 셀 선택 → 행/열 삭제 (prosemirror-tables 직접 import)
  - Tab/Shift+Tab 셀 이동, TableCell backgroundColor extend
  - Backspace after table → table 삭제
  - 드래그 핸들 최상단 위치

- **PR #138**: 에디터 블록 UX 일괄 개선 + TOC 리디자인
  - Columns: 다크모드 테두리 opacity→rgba(255,255,255,0.2), Tab→다음 컬럼 이동
  - Toggle: persist:true, 노션식 리디자인(배경/테두리 제거, flex 레이아웃), 접기/펴기 CSS 수정
  - TOC: 자동 헤딩 수집 제거 → 수동 편집 + BlockPicker(+버튼=문서 내 블록 검색, 1클릭 추가+링크), 더블클릭 편집, 드래그 순서변경, Tab 들여쓰기, id 기반 scrollToId
  - Merge Blocks: 우클릭 메뉴, 멀티선택→hardBreak 병합. Make Block→Wrap in 리네이밍
  - Add to TOC: 우클릭 메뉴, 텍스트 선택→TOC 항목 자동 추가
  - Delete Block: 우클릭 메뉴 맨 아래, 모든 블록 적용, compound 블록(details/columns) skipTypes
  - 인포박스: 읽기모드 readOnly+버튼 숨김, Add row hover-only (group/infobox)
  - Side-drop 컬럼 자동생성 제거 (Insert 메뉴로만)
  - All Notes 사이드바 Inbox 위 추가
  - Memo 라벨 자동 부여 (createNote + rehydrate backfill)

- **PR #139**: 노트참조 통합 인터랙션 + Synced Block + 블록 리사이즈 + 컬럼 UX
  - 노트참조 통합: 호버 프리뷰 (note-hover-preview.tsx, 300ms delay, IDB body), 클릭→Peek, Ctrl+클릭→이동
  - 공통 유틸: `lib/note-reference-actions.ts` (handleWikilinkClick, handleMentionClick, resolveNoteByTitle/ById)
  - WikilinkDecoration: 드롭다운/아이콘 제거 → mouseover/click 통합 인터랙션
  - MentionInteractionExtension: ProseMirror Plugin DOM 이벤트 위임 (@mention 클릭/호버)
  - NoteEmbed → Synced Block: `synced` 속성 토글, base 티어 인라인 TipTap, 300ms 디바운스 저장
  - 블록 리사이즈: `useBlockResize` 훅 + `BlockResizeHandles` 컴포넌트 (8종 블록 적용: TOC/Columns/NoteEmbed/Infobox/Callout/Query/Summary/ContentBlock)
  - width + height 속성 추가, 코너 드래그=가로+세로, 엣지 드래그=가로만, 리셋 버튼 (헤더 통합)
  - Side-drop 컬럼 복원: 15% 엣지 감지 → 컬럼 생성, columnsBlock 위 드래그 → 기존 셀에 삽입
  - Move out of Column: 우클릭 메뉴, columnCell 내 블록 → columnsBlock 아래로 이동
  - Turn Into: atom 노드에서 숨김
  - Gapcursor 추가 (빈 컬럼 셀 클릭 가능)
  - 컬럼 구분선 드래그: pixel 기반 colWidth, 양쪽 셀 동시 업데이트, fr 단위 그리드 (잔상 이슈 잔존)
  - 에디터 max-width 제거 (text-align left/right 정확하게 동작)
  - onOpenChange로 컨텍스트 메뉴 selection 캡처 수정

- **PR #143**: 위키 TextBlock TipTap 전환 + Encyclopedia 편집 버그 수정
  - TextBlock: textarea → lazy-mount TipTap 에디터 (wiki tier = base extensions)
  - WikiBlock.contentJson 필드 추가 (TipTap JSON, content는 plaintext fallback)
  - WikiBlockBody.contentJson IDB 저장 지원
  - `useWikiBlockContentJson` 훅 신규 (IDB에서 content + contentJson 로드)
  - debounce 300ms 저장 (IDB + store 동시)
  - Encyclopedia 레이아웃 editable 버그 수정: EncyclopediaContentBlock에 isEditing prop 전달

- **PR #144 (WIP)**: Encyclopedia 폴리싱 + 위키 에디터 툴바 초안
  - Contents 박스: CSS resize → pointer drag 리사이즈 (우측 핸들, 180~600px)
  - Encyclopedia 폰트 크기 업: 섹션 H2 text-lg→xl, H3 text-note→base, H4 text-2xs→sm, Contents 항목 text-note→sm
  - WikiTextEditor 하단 고정 미니 툴바: B/I/S/Code + H2/H3 + BulletList/OrderedList/Blockquote
  - **TODO**: 나무위키/위키피디아 에디터 툴바 리서치 후 풀 에디터 수준으로 업그레이드 필요

- **PR #146**: 위키 Phase 2B 대규모 업데이트
  - TextBlock 리치 읽기 모드: `@tiptap/html` generateHTML + createRenderExtensions (렌더링 전용 확장 세트)
  - Encyclopedia 하단 참조 섹션: Sources + See Also + Article Info (위키피디아 스타일)
  - SidePanel Context 시스템: `SidePanelContext` 타입 (note | wiki), `useSidePanelEntity` 공용 훅, 4탭 위키 대응
  - WikiArticleDetailPanel 신규: 위키 문서 Detail 패널 (타입, aliases, categories, infobox, sections, dates)
  - 카테고리 UI 전면 개편: InlineCategoryTags 트리 드롭다운 피커, 검색=생성 패턴, 노드 옆 [+] 서브카테고리, 플랫 표시 (위키피디아식) + hover tooltip breadcrumb
  - 글로벌 fontSize (Aa 버튼): WikiArticle.fontSize 필드, em 기반 wrapper 적용, S/M/L/XL 통일 (0.85/1/1.15/1.3)
  - contentAlign (Left/Center): WikiArticle.contentAlign 필드, Center=max-w-4xl mx-auto
  - 섹션 전체 접기/펼치기: chevron 토글 버튼
  - 타이틀/Aliases 인라인 편집: 양쪽 레이아웃 (default + encyclopedia)
  - Add block Content 그룹: Table/Infobox/Callout/Blockquote/Toggle/Spacer (Text 블록 + 초기 contentJson)
  - Copy to new article: 비파괴적 섹션 복사 (splitWikiArticle의 copy 버전)
  - 시드 카테고리 7개 추가 (v68 마이그레이션): CS, Philosophy, Productivity 등
  - 섹션 헤딩 사이즈 업: H2 text-2xl, H3 text-xl, H4+ text-lg
  - 섹션 번호 밝기 업: text-accent/50 → text-accent/80
  - FROM NOTE 리치 렌더링: IDB body 로드 + generateHTML + note.updatedAt 실시간 반영
  - Bookmarks 탭 layout.tsx 누락 수정
  - before-work 스킬 개선: docs/plot-discussion/*.md 전체 읽기 필수화
  - Store v67 → v69

- **PR #150 (WIP)**: Home 필터 연동 + Phase 4 Partial Quote + 호버 프리뷰 리디자인 + 위키링크 컨텍스트 메뉴 + 고아 노트 제안
- **PR #151**: Stub 부활 + Create Wiki + WikilinkSuggestion 버그 수정 + Quote UX + 호버 프리뷰 Edit 모드 + [[드롭다운 WikiArticle
- **PR #152 (WIP)**: Unresolved Links 전환 + 호버 프리뷰 TipTap 통합 + Pin UX + Note/Wiki 링크 시각 구분
  - "Red Links" → "Unresolved Links" 리브랜딩 (11파일)
  - 호버 프리뷰: generateHTML 폐기 → 항상 NoteEditorAdapter (editable 토글). 640px 카드
  - Pin: 모듈 레벨 상태, 위키링크/멘션 클릭으로 토글, accent 테두리 + PushPin 아이콘
  - data-hover-preview 가드 (프리뷰 안 재귀 방지)
  - 4-way wikilink: Note=보라밑줄, Wiki=teal칩, Stub=amber점선, Dangling=gray점선
  - `[[wiki:Title]]` prefix 방식 — Wiki 선택 시 자동 삽입, `wiki:` 숨김
  - Plain text copy (⋯ 메뉴 "Copy text")
  - 호버 프리뷰 버그 수정 4건 (mouseup 누수, quote deps, pin bubbling, note assertion)

- **PR #160 (WIP)**: WikiEmbed + 변환 함수 + Wikilink atom 노드 + 브레인스토밍
  - **WikiEmbed**: 노트 안에 위키 문서 라이브 임베드 (wiki-embed-node.tsx). 전체 Embed + 부분 Embed (sectionIds 속성). WikiArticleEncyclopedia 렌더
  - **WikiPickerDialog**: 위키 아티클 선택 다이얼로그 (wiki-picker-dialog.tsx). SlashCommand "Embed Wiki" 항목
  - **위키→TipTap 변환 함수**: wikiArticleToTipTap() + wikiArticleToPlainText() (lib/wiki-to-tiptap.ts). 호버 프리뷰 ⋯ 메뉴 "Copy to note"
  - **Wiki Quote 활성화**: noteType !== "wiki" 가드 제거. 위키에서는 select-all 스킵, 드래그 선택 필수
  - **위키 호버 프리뷰 개선**: WikiArticleView → WikiArticleEncyclopedia로 교체 (인포박스+Contents 인라인 표시). 위키용 Embed 버튼 + 섹션 피커 (체크박스 TOC, 전체/부분 선택)
  - **Articles/Stubs 카운트 버그 수정**: wiki-list.tsx counts.articles에서 stubCount 차감, dashFilter==="articles" 필터 추가
  - **Wikilink atom 노드 전환**: WikilinkDecoration(텍스트 기반) → WikilinkNode(atom inline 노드). 커서 진입 불가, 찢어짐 방지. WikilinkInteractionExtension 신규 (클릭/호버/우클릭)
  - **시드 데이터 자동 복원**: onRehydrateStorage에서 notes.length === 0이면 시드 강제 주입
  - **before-work/after-work 개선**: MEMORY.md를 Source of Truth로, worktree merge 로직 추가, CONTEXT.md↔MEMORY.md 정합성 검사
  - **브레인스토밍**: docs/BRAINSTORM-2026-04-06.md — 각주, 인포박스 고도화, 나무위키 틀, Library 6번째 공간, Side Panel 풀페이지 확장, 요약 엔진 등 8개 Phase 계획
  - 호버 프리뷰 버그 수정 4건 (mouseup 누수, quote deps, pin bubbling, note assertion)

- **PR #161 (WIP)**: Footnote/Reference 시스템 + WikiQuote 폐기
  - **WikiQuote 폐기**: WikiQuoteExtension.ts, WikiQuoteNode.tsx, lib/quote-hash.ts 삭제. shared-editor-config (3곳), note-editor.tsx, note-hover-preview.tsx, side-panel-peek.tsx, wiki-article-reader.tsx, wiki-collection-sidebar.tsx에서 관련 코드 제거 (~350줄)
  - **Reference store slice**: `lib/store/slices/references.ts` 신규. `Reference` 타입 (title/content/fields[]/tags). CRUD 3액션. Store v70 migration
  - **FootnoteRef 인라인 노드**: `components/editor/nodes/footnote-node.tsx` 신규. atom inline, 자동 번호(doc 순서), 호버 팝오버(300ms delay/200ms hide, z-100), 더블클릭 편집(textarea), 빈 content 자동 편집 모드
  - **FootnotesFooter**: `components/editor/footnotes-footer.tsx` 신규. editor.on("update") 실시간 동기화, 중복 제거, `[N]` 클릭→본문 스크롤(양방향), 싱글클릭 인라인 편집(setNodeMarkup으로 attrs 직접 수정)
  - **SlashCommand Footnote 항목**: Asterisk 아이콘, nanoid(8) id, 빈 content로 삽입
  - **`[[`/`@` References 섹션**: WikilinkSuggestion + MentionSuggestion에 References 섹션 추가. 기존 Reference 검색/선택 → footnoteRef 삽입. Create Reference 항상 표시 (q.length > 0). 새 Reference 자동 생성 + referenceId 연결
  - **명칭 결정**: 에디터/유저 접점 = "Footnote", 저장소/Library = "References"

- **PR #162 (WIP)**: Smart Link + 툴바 정리 + 커스텀 다이얼로그
  - **툴바 미사용 기능 제거**: Twitch, SpellCheck, InvisibleChars, CurrentLineHighlight 전부 삭제. CurrentLineHighlight.ts 파일 삭제, settings-store에서 관련 필드 제거
  - **Smart Link — LinkCard TipTap 노드**: `components/editor/nodes/link-card-node.tsx` 신규. atom block, favicon(Google API), 더블클릭 제목/설명 편집, 새 탭 열기
  - **URL 감지 유틸**: `lib/editor/url-detect.ts` 신규 (detectUrlType: youtube/audio/generic, isValidUrl, extractDomain)
  - **URL Paste Handler**: 일반 URL 붙여넣기 → 자동 LinkCard 삽입 (YouTube/Audio는 기존 확장이 처리, 텍스트 선택 중이면 하이퍼링크)
  - **YouTube+Audio→Embed 통합**: 2버튼 → 1버튼. toolbar-config, FixedToolbar, insert-menu, insertable-blocks, SlashCommand(`/embed`) 전부 통합
  - **커스텀 URL 다이얼로그**: `components/editor/url-input-dialog.tsx` 신규. Portal 기반, link/embed 2모드, URL 타입 감지 힌트. `window.prompt` 전면 교체 (FixedToolbar, EditorToolbar, editor-context-menu, insert-menu, wiki-article-view, wiki-article-encyclopedia)
  - **Link+Embed 나란히 배치**: toolbar-config에서 embed를 link 바로 뒤로 이동
  - **전체 툴바 버튼 설명 추가**: 30개 버튼 title 속성에 "Name — description (shortcut)" 형식 영어 설명

- **PR #163**: Editor Toolbar Redesign — Remix Icon + Overflow UX + Indent + Embeds
  - **Remix Icon 전환**: Phosphor light → Remix Icon. 32개 에디터 파일 교체. `lib/editor/editor-icons.ts` 중앙 barrel 파일 (101개 매핑). 앱 나머지는 Phosphor 유지
  - **H/B 텍스트→아이콘**: `<span>H</span>` → RiHeading, `<span>B</span>` → RiBold
  - **More Actions ⋯ 오버플로우 UX**: Pin 고정 모드 (외부 클릭에도 안 닫힘), 아이콘+라벨 그리드, 우클릭 Favorites (settings store persist), 서브패널 (컬러피커/테이블 호버선택/이미지), 메뉴 340×520px
  - **Move Up/Down 버그 수정**: `isInList` 상태 추가, 리스트 바깥에서 disabled
  - **Math 기본 hidden**: inlineMath/blockMath 툴바 기본 비표시 (SlashCommand로 접근)
  - **Indent 수정**: blockquote 감쌈 → margin-left 레벨 (Notion 방식). `indent-extension.ts` 신규 (0-8단계, 24px/단계). Enter 시 indent 상속
  - **Insert 메뉴**: Embed Wiki + Footnote 항목 추가
  - **WikiPickerDialog 업그레이드**: 960px 다이얼로그, Category 필터 칩, 2줄 레이아웃 (제목+aliases), 카운터, 중복 제거
  - **Embed Note 기본 Synced**: `synced: true` 기본값. 삽입 시 전체 내용 인라인 표시
  - **WikiEmbed 높이 제한 해제**: `max-h-[500px]` 제거 → 전체 문서 펼침
  - **각주 팝오버 잘림 수정**: `left:50%+translateX(-50%)` → `left:0` 좌측 정렬
  - **Math 직접 노드 삽입**: `$...$` 텍스트 → `insertContent({ type: "inlineMath/blockMath" })` 직접 노드

- **PR #165**: Library 6th space + References UI + footnote auto-link
  - Library 6번째 Activity Bar 공간 (Overview/References/Tags/Files 사이드바 NavLink)
  - References 풀페이지 리스트 (검색/Quick Filter/정렬/멀티선택)
  - ReferenceDetailPanel — SmartSidePanel SidePanelContext "reference" 타입 확장
  - 각주→Reference 자동 연결 (save 시 createReference + referenceId 동기화)

- **PR #167**: Library Overview 리디자인 + Tags/Files 뷰
  - Library Overview — wiki-dashboard.tsx 패턴, MiniStat 3-col + 2-col ContentCard Bento Grid
  - Tags 뷰 실제 구현 (색상 dot + 노트 카운트 + 검색)
  - Files 뷰 실제 구현 (All/Images/Documents 필터)
  - Sidebar Tags/Files 활성화 (NavLink + 카운트 뱃지)
  - SmartLinkPaste 버그 수정 (view.hasFocus() 가드)

- **PR #168**: Tags Library 통합 + soft delete + 네이밍 통일
  - Notes "More"에서 Tags 제거 → `/library/tags` 리다이렉트
  - References/Files soft delete (trashed/trashedAt 필드, restoreReference, permanentlyDeleteReference)
  - "TOP TAGS" → "RECENT TAGS" + 최근 사용 노트 기준 정렬
  - Store v71 migration

- **PR #169**: Reference 하이브리드 + 호버 프리뷰 강화 + Trash/Library UX
  - referenceLink TipTap 인라인 atom 노드 (에메랄드 칩, URL 클릭, Ctrl+클릭→사이드패널)
  - `[[`/`@` 자동 분기 — 기본=footnoteRef, Shift+클릭/Enter=referenceLink
  - 호버 프리뷰 강화 — 리사이즈(우하단 드래그) + 드래그 이동(Pin 시 헤더) + Pin 버튼 + 본문 flex-1
  - Trash 뷰 References/Files 탭 추가
  - Library Files 직접 업로드 UI (ViewHeader + file input → addAttachment)
  - References hover 체크박스, Bookmark 툴바/Insert 메뉴 추가

- **PR #172**: Split View 독립 패널 시스템 — 하이브리드 듀얼 에디터
  - `PaneContext` 신규 (primary/secondary 컨텍스트 구분)
  - `secondaryHistory[]` 독립 네비게이션, `secondaryRoute/secondarySpace` 독립 라우팅 (table-route.ts 이중화)
  - `setRouteInterceptForSecondary` — 우측 클릭 시 글로벌 라우트 인터셉트
  - `SecondaryPanelContent` — note/wiki/뷰 렌더링, breadcrumb 드롭다운으로 6 space 전환
  - `usePaneOpenNote` + `usePaneActiveRoute` 훅

- **PR #173**: Split View 사이드패널 분리 — primary/secondary 독립 사이드패널
  - primary/secondary pane 각각 독립 SmartSidePanel 인스턴스
  - 사이드바는 primary(좌측) 전용 유지
  - SidePanelContext per-pane 분리

## Architecture Redesign v2 — ALL PHASES COMPLETE

**사상**: 팔란티어 × 제텔카스텐. Layer 1(Raw Data) → Layer 2(Ontology) → Layer 3(Wiki) → Layer 4(Insights). LLM/API 사용 안 함.

### 구현 Phase (7단계, 전부 완료)
1. **Foundation** — v41 (wikiStatus), v42 (workspaceMode), 2-level routing ✅
2. **Layout Automation** — WorkspaceMode 3개, auto-collapse ✅
3. **Activity Bar + Top Utility Bar** — 5-space navigation ✅
4. **Sidebar Refactor** — 컨텍스트 반응형, PlotIcons ✅
5. **Breadcrumb** — space > folder > title ✅
6. **Wiki Evolution** — auto-enroll, wikiStatus lifecycle, 초성 인덱스, Graph 노드 형태 ✅
7. **Wiki Collection** — Collection slice (v43), WikiQuote TipTap node, Extract as Note, Collection sidebar ✅

### Key Design Decisions
- **Activity Bar 6-space**: Inbox / Notes / Wiki / Calendar / Graph / Library
- **Wiki 사이드바 = Overview 단일 진입**: stat 카드 클릭으로 드릴다운
- **WikiStatus 2단계**: stub(미완성) → article(완성). Red Link = computed. draft/complete 제거 (v60)
- **위키 강등 = article→stub 1단계**: stub은 바닥(강등 없음, 삭제만)
- **Display = List/Board 2모드**: Table 제거 — List의 Display Properties가 Table 역할 (Linear 철학). List에서 컬럼 켜면 테이블처럼 보임.
- **Graph Health → /graph-insights 페이지로 분리**: 사이드바는 필터/컨트롤 패널
- **Ontology → Graph 네이밍 분리**: Ontology = 엔진, Graph = 시각화
- **Show thread = Show sub-issues 매핑**: 노트앱에서 Linear의 sub-issue → Thread로 대체
- **Order permanent by recency**: 최근 Permanent 승격 노트 우선 정렬
- **Sub-grouping 필수**: 1만개+ 노트 스케일 기준 설계, collapse/expand
- **뷰별 Display 분리**: Notes=풀스펙(2모드 List/Board), Wiki=2모드, Inbox=List only, Graph/Insights=모드 없음
- **Priority 삭제**: 노트앱에서 불필요 — Pin + Labels로 충분. 모든 뷰에서 무의미
- **Grouping collapse/expand**: 그룹 헤더 클릭으로 접기/펴기, chevron 회전 인디케이터
- **Filter 2단계 nested**: Linear식 side-by-side 패널(hover 기반)

## Current Direction (as of 2026-04-14)

### 최신 방향 (2026-04-14 확정)
- **Note/Wiki 2-entity 철학 확정** — 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. 차별점의 원천 = 데이터 구조 (TipTap JSON vs WikiBlock[]). 렌더러는 위키 전용. 자세히: `docs/BRAINSTORM-2026-04-14-entity-philosophy.md`
- **위키 디자인 강화 우선** — 엔티티 통합보단 디자인 약점 해결 (`wiki-color` 프리셋 + themeColor + Hatnote/Ambox/Navbox)
- **위키 템플릿 3층 모델** — Layer 1 Layout Preset + Layer 2 Content Template + Layer 3 Typed Infobox. 노트 템플릿은 NoteTemplate slice 유지 (UpNote식)
- **노트 split = must-todo** — UniqueID extension으로 이미 가능. Medium × 2-3일. 위키 디자인 강화 이후 Phase.
- **Tier 1 인포박스 완료** 🎉 — 대표 이미지+캡션 (PR #192), 헤더 색상 테마, 접기/펼치기 (PR #192), 섹션 구분 행, 필드 값 리치텍스트
- **긴급 버그 수정 (2026-04-14)** — `wiki-view.tsx` article view 우선순위 로직. wikiViewMode가 merge/split/category면 article view 숨김 (기존 버그였음)

### 과거 방향 결정 (히스토리)
- **독립 공간 구조 유지, 노션식 통합 템플릿 폐기** (2026-04-01)
- **위키 인프라 강화 우선** — WikiEmbed, 변환 함수, 각주, 인포박스 고도화 (2026-04-06)
- **Library 6번째 공간 추가 결정** — 이미지/파일/URL 독립 엔티티 (2026-04-06)
- **에디터 아이콘 Remix Icon 전환** — Phosphor light → Remix. 에디터 전용, 나머지 Phosphor 유지 (2026-04-07)
- **P0+P1 병행 전략** — Library 뼈대 → References UI → 각주 자동 연결 → 고도화 순서 (2026-04-07)
- **Library 사이드바 NavLink 전환** — 상단 탭 제거 → 사이드바 NavLink (Overview/References/Tags/Files). Wiki 패턴 동일 (2026-04-07)
- **Reference 디테일 = SmartSidePanel** — 별도 풀페이지 에디터 없음. 사이드 패널에서 편집 충분 (2026-04-07)
- **Tags Library 통합** — 13개 앱 리서치. 태그를 2개 사이드바 섹션에 동시에 보여주는 앱 0개. Capacities 패턴 채택. Notes "More"에서 Tags 제거, `/tags` → `/library/tags` 리다이렉트 (2026-04-08)
- **References/Files soft delete** — Tags처럼 trashed 필드. 복원 가능해야 함. hard delete → 확인 다이얼로그만으론 불충분 (2026-04-08)
- **Reference = 통합 참고자료 (하이브리드)** — url 필드 있으면 Link형, 없으면 Citation형. 기본=footnoteRef, Shift=referenceLink. 위키백과 패턴 (2026-04-08)
- **호버 프리뷰 강화** — 리사이즈(400~960px) + 드래그 이동(Pin 시) + Pin 버튼 액션바 + 본문 flex-1 (2026-04-08)
- **듀얼 에디터 = 독립 뷰 (구현 완료)** — VS Code/Obsidian 패턴. 좌/우 패널이 각각 독립 네비게이션. table-route 이중화 완료
- **🎯 Split-First 복귀 (2026-04-09~10)** — Peek-First 실험 후 피벗. Peek UI가 chrome 레이어 안이라 동등한 에디터 느낌 불가 → Split view + 단일 SmartSidePanel focus-following 모델로 전환. Phase 1 완료 (PR #176). Phase 2~7 진행 중: store cleanup → peek 파일 제거 → 리네이밍 → focus tracking → 검증 → docs
- **사이드바 단일 책임 = layout.tsx (2026-04-09)** — WorkspaceEditorArea에서 사이드바 코드 전부 제거. 4가지 케이스 명확한 분기 (단독뷰/단독에디터/뷰스플릿/에디터스플릿). ResizablePanel id+order 추가로 동적 렌더링 fix
- **워크플로우 개선 (2026-04-09)** — NEXT-ACTION.md (다음 즉시 액션 1~3개) + SESSION-LOG.md (시간순 세션 기록) 도입. before-work/after-work 스킬 확장으로 크로스 머신 작업 매끄럽게

### 이번 세션 완료 (2026-04-08 오후, PR #169)
- **Trash 뷰 References/Files 탭**: TRASH_TABS 8개 확장, TrashEntityList references/files 처리
- **Library Files 직접 업로드 UI**: ViewHeader + button → file input → addAttachment + persistAttachmentBlob
- **References hover 체크박스**: Notes 패턴 (별도 칼럼, invisible group-hover:visible)
- **Bookmark 툴바/Insert 메뉴 추가**: anchorMark 삽입, 슬래시 커맨드와 통합
- **referenceLink TipTap 노드**: 인라인 atom, 에메랄드 칩, 클릭→URL, 호버 팝오버, Ctrl+클릭→사이드패널
- **Reference URL 전용 입력란**: 사이드패널 Title↔Content 사이 Globe 아이콘, Fields에서 url 키 자동 분리
- **Quick Filter "Links"**: References 뷰 4번째 필터 (url 필드 있는 Reference)
- **`[[`/`@` 자동분기**: 기본=footnoteRef, Shift+클릭/Enter=referenceLink. WikilinkItem/MentionItem에 referenceUrl + _shiftKey 추가
- **footnoteRef URL 표시**: 팝오버에 🔗 도메인 링크 + FootnotesFooter에 줄바꿈 URL (flex-wrap)
- **호버 프리뷰 버그 수정**: wikilink-node.ts의 data-hover-preview 제거 (self-matching guard 문제)
- **호버 프리뷰 강화**: 리사이즈(우하단 드래그) + 드래그 이동(Pin 시 헤더) + Pin 버튼 + 본문 flex-1
- **사이드바 Bookmarks 클릭→스크롤**: data-anchor-id 속성 + scrollIntoView 추가
- **Peek 툴바 하단 이동**: position="bottom"
- **Hydration 에러 수정**: PanelGroup 고정 id (main-layout, workspace-editor)
- **Store version**: v71 유지 (migration 변경 없음)

### 이번 세션 완료 (2026-04-07, PR #163 + #164 + #165)
- **에디터 툴바 Remix Icon 전환**: 32파일 101아이콘, 중앙 barrel, H/B 아이콘화
- **More Actions 오버플로우 UX**: Pin 고정 + Favorites(우클릭 persist) + 서브패널(컬러/테이블/이미지)
- **Indent margin-left**: blockquote 감쌈 → 24px 8단계 (indent-extension.ts)
- **Library 6번째 Activity Bar 공간**: 사이드바 NavLink(Overview/References/Tags/Files), 서브라우트 4개
- **Library Overview 대시보드**: References/Tags/Files stat 카드 + Recent 리스트
- **References 풀페이지 리스트**: 검색, Quick Filter(All/Linked/Unlinked + Field keys), 정렬(Name/Updated), 전체선택, 멀티선택 + 플로팅 액션바(Delete/Export/Add Field)
- **ReferenceDetailPanel**: SmartSidePanel 확장, SidePanelContext `"reference"` 타입, Title/Content/Fields 인라인 편집
- **각주→Reference 자동 연결**: save 시 자동 createReference + referenceId 연결, content 동기화
- **Insert 메뉴 추가**: Embed Wiki + Footnote 항목
- **WikiPickerDialog 업그레이드**: 960px, Category 필터, 2줄 레이아웃, 중복 제거
- **Embed Note 기본 Synced**, WikiEmbed 높이 제한 해제
- **각주 팝오버 좌측 잘림 수정**, Math 기본 hidden, Move Up/Down disabled
- **Wiki 전체선택 버튼 추가**

### 이번 세션 완료 (2026-04-08, PR #167 + 후속 커밋)
- **Tags Library 통합**: Notes "More"에서 Tags 제거 → `/library/tags`로 리다이렉트. TagsView 풀 CRUD Library에서 렌더
- **섹션 네이밍 통일**: "TOP TAGS" → "RECENT TAGS" + 최근 사용 노트 기준 정렬
- **References/Files soft delete**: trashed/trashedAt 필드 추가. deleteReference → soft delete, restoreReference, permanentlyDeleteReference. Attachments 동일. Store v71 migration
- **docs/TODO.md 생성**: 크로스 머신 백로그 공유용

### 이번 세션 완료 (2026-04-07 오후, PR #167)
- **SmartLinkPaste 버그 수정**: view.hasFocus() 가드 → hidden editor에 LinkCard 삽입 방지
- **window.prompt 전면 폐기**: embed-url-request.ts (CustomEvent+callback 브릿지) 신규. insertable-blocks.ts + SlashCommand.tsx → requestEmbedUrl() 콜백. note-editor.tsx에 onEmbedUrlRequest 리스너 + UrlInputDialog. library-view.tsx Add Field 인라인 다이얼로그 (Portal 기반)
- **Library Overview 리디자인**: wiki-dashboard.tsx 패턴 참고. MiniStat 3-col (References/Tags/Files) + 2-col ContentCard (Recent Refs, Top Tags, Recent Files, Unlinked Refs). max-w-5xl 센터 정렬
- **Tags 뷰 구현**: Coming soon → 실제 태그 목록 (색상 dot + 노트 카운트 정렬 + 검색)
- **Files 뷰 구현**: Coming soon → 첨부파일 목록 (All/Images/Documents 필터)
- **Sidebar Tags/Files 활성화**: disabled span → NavLink + 카운트 뱃지

### 다음 우선순위 (2026-04-11 기준)
- **P1 진행 중**:
  - ✅ Library Overview 리디자인 (위키 대시보드 스타일)
  - ✅ References DisplayPanel (정렬 + 그룹핑)
  - ✅ Reference.history (수정 이력 타임라인, store v73)
  - 🔴 위키 레이아웃 프리셋 시스템 (2개 렌더러 → 1개 통합)
- **P2**: 인사이트 허브, 각주 리치텍스트, 인포박스 고도화

### 리서치: Library 고도화 벤치마크 (2026-04-07)
- **Zotero** (github.com/zotero/zotero): 3-pane 레이아웃, Collections vs Tags 구분, item type별 필드 스키마, refs count 컬럼, VirtualizedTable
- **Paperpile**: 컴팩트 테이블 ↔ 리스트 토글, 인라인 클릭→필터, 벌크 메타데이터 편집
- **Capacities**: Object type별 사이드바 네비게이션 (Plot 패턴과 동일), per-type 프로퍼티 스키마
- **Obsidian citation plugin** (github.com/hans/obsidian-citation-plugin): 모달 검색 + 문헌 노트 자동 생성
- **tiptap-footnotes** (github.com/buttondown/tiptap-footnotes): TipTap 각주 아키텍처 비교
- **Raindrop.io**: 북마크 관리 UX, 썸네일 그리드, 스마트 태깅
- **적용 방향**: Reference type 자동 감지 (URL→Website, DOI→Paper), refs count 컬럼, 인라인 클릭→필터, Files 썸네일 그리드

### 리서치: Wiki + Library Overview 디자인 폴리싱 (2026-04-07)
- **Bento Grid 레이아웃**: 카드 크기로 중요도 인코딩 (2×2 히어로, 1×1 스탯, 2×1 리스트)
- **Premium Stat Card**: 큰 숫자(32-48px) + 트렌드 배지(+3 this week ↑) + 상세 라벨(11px uppercase)
- **"Needs Attention" 프레이밍**: Stubs → "12 Needs Attention ⚠" (Tettra/Guru 패턴)
- **Category Coverage**: 카운트→퍼센트 (89% 카테고리화 ✓) + progress bar
- **Featured Article 히어로**: 2×2 블록, 발췌 + 카테고리 칩 + 메타
- **"Did You Know?" 섹션**: 랜덤 stub에서 흥미로운 사실 발굴 (Wikipedia 포탈 패턴)
- **Activity Feed**: 플레인 리스트→아바타+액션타입+타임스탬프 구조화
- **Popular Articles**: 링크 수 기반 인기 문서 (Outline 패턴)
- **Category Color Coding**: 카테고리별 고유 색상 (BookStack 패턴)
- **벤치마크**: Wikipedia 포탈, Notion Wiki, Confluence, GitBook, Outline(github.com/outline/outline), BookStack, PatternFly, shadcn/ui Dashboard

> 상세: `docs/BRAINSTORM-2026-04-06.md`

### 이번 세션 완료 — Phase 2A 위키 에디터 풀 툴바 + Encyclopedia 편집 통일 (2026-04-02)
- **위키 에디터 리서치**: Wikipedia VisualEditor, 나무위키, Fandom, GitBook, Outline, Confluence 에디터 구조 조사
- **Phase 2A: 위키 TextBlock FixedToolbar 연결**: wiki tier에 SlashCommand/Callout/Columns 등 확장 추가, FixedToolbar를 wiki tier에서 재사용 (42아이템 풀 툴바), WikiTextToolbar(55줄) 삭제
- **TextBlock blur 버그 수정**: onBlur → document mousedown click-outside 패턴 전환. 드래그 핸들/툴바 클릭 시 에디터 안 닫힘
- **Encyclopedia 편집 기능 완전 통일**: DndContext + SortableBlockItem으로 전면 리팩토링. 드래그 리오더, 섹션 ⋯ 메뉴(Split/Move/Delete), Add Block, 카테고리 편집 — Default와 동일
- **인포박스 편집**: Encyclopedia 읽기 전용 테이블 → WikiInfobox 컴포넌트 교체 (편집 모드에서 행 추가/삭제)
- **섹션 폰트 크기 조절**: WikiBlock.fontSize 속성 + ⋯ 메뉴 S/M/L/XL 4단계 선택
- **Contents TOC 대각선 리사이즈**: 코너 핸들 + fontScale 연동 (width 비례로 글자 크기 변동)
- **WikiBlockRenderer variant prop**: "default" | "encyclopedia" — SectionBlock이 variant에 따라 스타일 분기

### 이번 세션 완료 — 버그 수정 + Design Spine 8-Phase (2026-04-01)
- **버그/미완성 수정 8건**: Wiki Dashboard placeholder, Embed Note picker, 우클릭 메뉴 4항목(Embed/Link to Note/Extract as Note/Image), Home Red Links 카운트, orphanCount 일치, internalLinkCount 연산, Discover 섹션 4카드, Wiki 3탭(All/Articles/Red Links)
- **Design Spine Phase 1~8 전부 완료**:
  - Phase 1: hover/active 토큰 통일 (hover:bg-secondary/muted → hover:bg-hover-bg)
  - Phase 2: Typography 표준화 (text-sm → text-note, 20건)
  - Phase 3: Editor CSS 토큰화 (15곳 → CSS 변수, 5개 신규 변수: --editor-code-font-size, --editor-inline-code-color, --editor-ui-sm, --editor-ui-xs, --editor-table-cell)
  - Phase 4: Editor max-width 720px + padding 48px (note-editor.tsx)
  - Phase 5: Border Radius 3단계 규칙 (rounded-sm/md/lg, 15곳)
  - Phase 6: 4px Grid + Magic Number 제거 (12곳)
  - Phase 7: Hardcoded hex 4건 → 시맨틱 토큰, 아이콘 사이즈 9건 표준화
  - Phase 8: 트랜지션 CSS 변수 (--transition-fast/default/slow) + duration 통일
- **Wiki Overview 필터 제거**: dashboard 모드에서 showFilter=false
- **Wiki noteType 필터 제거**: WIKI_VIEW_CONFIG에서 noteType 카테고리 삭제
- **커스텀 이벤트 패턴**: `plot:embed-note-pick`, `plot:link-note-pick`, `plot:extract-as-note` — SlashCommand/ContextMenu → NoteEditor 통신

### 이전 세션 완료 — 에디터 Phase 1 확장 (2026-03-30)
- **Columns Block 완성**: CSS Grid 기반, renderHTML columnCell, resize handle(드래그 너비 조절), 테이블 스타일 border
- **플로팅 TOC**: Notion 스타일 에디터 우측 자동 사이드바, scrollspy, 타이틀 제외
- **인라인 TOC 수정**: 첫 heading(타이틀) 제외 로직 추가
- **@멘션 시스템**: 노트/WikiArticle/태그/날짜 4종 통합, 카테고리별 그룹핑, 인라인 칩
- **앵커/북마크**: anchorMark(인라인) + anchorDivider(블록 구분선), TOC 통합, Bookmarks 사이드패널 탭
- **Side-drop 개선**: 포인터 좌표 기반 블록 감지, sideDropState 우선 처리
- **컬럼 구분선 개선**: muted-foreground 0.25 → 테이블 스타일 border
- **SidePanelMode 확장**: 'bookmarks' 추가 (5탭 체제)
- **Make Block 폐기 결정**: Turn Into가 대체. 래퍼 감싸기 UX 직관적이지 않음
- **디자인 방향 = Notion 블록 디자인 참고**: Linear 레이아웃 + Notion 에디터 블록 폴리싱
- **다음 (우선순위순)**:
  1. Design Spine 수립 (CSS 변수 기반, Notion 참고) → 전체 블록 폴리싱
  2. Turn Into 메뉴 (블록 타입 변환)
  3. 노트참조 통합 인터랙션 (호버+Peek+인라인펼치기)
  4. isWiki 리팩토링
  5. 웹 클리퍼 + 가져오기/내보내기

### 이번 세션 완료 — Phase 1 커스텀 노드 + 에디터 UX (2026-03-28)
- **TOC Block**: `components/editor/nodes/toc-node.tsx` — heading 자동인식 atom node
- **Callout Block**: `components/editor/nodes/callout-node.tsx` — 5 types wrapper node
- **Align 드롭다운 통합**: 3버튼 → 1개 드롭다운 + Justified
- **BacklinksFooter 삭제**: Side Panel Connections로 대체
- **다음**: URL Embed 합치기, TOC 수동앵커, Make Block(범용 래퍼), Stub 삭제, 타이틀 정렬, Summary/Columns/NoteEmbed/Infobox

### 이전 세션 완료 — Side Panel Connections + Peek 개선 (2026-03-28)
- Connections Connected/Discover 2섹션, Relations UI 삭제, Peek wiki fallback
- Breadcrumb/badge 밝기 증가, Editor context menu (우클릭)

### 이번 세션 완료 — Phase 7 즉시 개선 + 에디터 통합 플랜 (2026-03-27)
- **StatusDropdown 추가**: 플로팅바에 일괄 status 변경 드롭다운. 선택된 전체 노트 status 한 번에 변경
- **Status badges per-status**: 플로팅바에서 선택된 노트의 status별 뱃지 표시 + 클릭 시 해당 노트 목록
- **Trash 버튼 독립 배치**: renderWorkflowButtons() 밖으로 이동, 항상 표시
- **Priority 필터 완전 제거**: filter-bar.tsx에서 Priority 관련 코드 전체 삭제
- **GitMerge 버튼 색상 수정**: 투명→bg-accent, 다크 테마에서 보임
- **빈 노트 자동 삭제**: openNote() 시 이전 노트가 제목+내용 비어있으면 자동 삭제
- **리스트 우측 컬럼 폰트/아이콘 크기 + 색상 밝기 개선**
- **우측 상단 필터/디스플레이/사이드바/+ 버튼 색상 밝기 개선**
- **Board previewNoteId 수정**: SidePanel 열려있을 때 Detail/Discover 정보 표시
- **< > 글로벌 화면 네비게이션**: routeHistory에 space 전환도 기록
- **에디터 통합 프로젝트 7-Phase 플랜 수립**: `.claude/plans/editor-unification.md`
  - Phase 1: 노트 에디터 리디자인 (shared config, title 통합, toolbar, 커스텀 노드)
  - Phase 2: 위키 TextBlock TipTap 전환 (lazy mount)
  - Phase 3: 템플릿 블록 레이아웃 에디터
  - Phase 4: Partial Quote (부분 인용 + 메타데이터 8필드)
  - Phase 5: Merge/Split 풀페이지 (섹션/문단 드래그 재배치)
  - Phase 6: Merge/Split 히스토리 (필터 + Insights)
  - Phase 7: 즉시 버그/개선 (완료)

### Key Design Decisions (추가)
- **WorkspaceMode 삭제**: zen/research 모드 불필요. sidebarCollapsed + detailsOpen 독립 토글만으로 충분
- **우측 사이드바 = Details 패널**: ViewDistributionPanel 삭제 → SmartSidePanel(Details)로 통합. 사이드바 버튼으로만 열림 (Linear 패턴)
- **Calendar = Cross-Space 시간 대시보드**: 독립 공간, Notes 뷰 모드 아님. 모든 엔티티 시간 축 표시
- **Custom Views = 사이드바 Views 섹션**: Linear식 savedView. 각 공간(Notes/Wiki/Graph/Calendar)별 독립
- **Back/Forward = note history + browser history fallback**: note history 없으면 router.back() 호출
- **디자인 라이브러리 13개 도입**: Phosphor/Motion/Sonner/Resizable/Radix Colors/dnd-kit/cmdk/Vaul/Iconoir/Tabler/Remix/React Spring + DESIGN-TOKENS.md에 사용 규칙 문서화
- **Side Panel 5탭**: Detail(메타데이터) + Connections(Connected/Discover 2섹션) + Activity(Thread/Reflection) + Peek(미리보기) + Bookmarks(앵커/북마크). Relations UI 삭제. Entity-aware — space에 따라 다른 detail 컴포넌트 렌더
- **Unified Pipeline 완료**: Filter/Display/SidePanel이 ViewConfig 기반으로 space별 주입. OntologyFilterBar 삭제, Wiki category 로컬 state → viewStateByContext 이관
- **Design Spine 통합**: 토큰 위반 일괄 수정 (typography/border/hover/icon/하드코딩). 별도 Phase 없이 구조 통합에 녹임
- **Discover = AI 없는 로컬 추천**: keyword overlap + tag co-occurrence + backlink proximity + folder proximity 4신호
- **그룹핑 컬럼 자동 숨김**: groupBy 필드와 동일한 컬럼은 테이블에서 자동 제외 (중복 제거)
- **Tags 컬럼 폐기**: COLUMN_DEFS, VALID_COLUMNS에서 삭제. 쓸모없다는 판단
- **Trash = Tools 섹션**: Board workbench에서 Workflow→Tools로 이동. Workflow = 순수 상태 전환만
- **Board 드래그 선택**: 빈 공간에서 마우스 드래그로 카드 범위 선택 (data-note-id + wasDragSelectingRef)
- **필터 Status shape 아이콘**: CircleDashed(Inbox), CircleHalf(Capture), CheckCircle(Permanent)
- **Workspace 단순화**: Binary tree → 듀얼 패인. react-resizable-panels. 9개 레거시 파일 삭제
- **위키 = 유저의 확장된 세계관**: 블록 무한 확장 대응 (IDB 분리 + virtuoso + lazy load + sectionIndex)
- **Make Block 폐기**: Turn Into가 대체. 래퍼 감싸기 UX는 직관적이지 않음 (2026-03-30)
- **디자인 폴리싱 방향 = Notion**: Linear 레이아웃 유지 + 에디터 블록 디자인은 Notion 수준 참고 (2026-03-30)
- **Design Spine = CSS 변수 기반**: 블록 공통 padding/radius/border/font-size를 변수화, 하나 바꾸면 전체 반영 (2026-03-30)

### 이번 세션 완료 — 카테고리 P0 + 에디터 (2026-03-26)
- **P0 Board Select All 시각 피드백**: 카드에 hover 체크박스 + accent 하이라이트 (Notes Board 패턴 동일)
- **P0 카테고리 Delete Undo**: pushUndo + toast Undo 버튼, 부모참조/아티클참조 전체 복원
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 CategorySidePanel 280px 제거, SidePanelContext에서 카테고리 모드 감지하여 글로벌 Details 패널에 표시. Notes와 동일 패턴
- **빈 공간 클릭 선택 해제**: activeCategoryId null + expandedCatId 리셋
- **카테고리 폼 에디터**: 더블클릭 → split view (280px 리스트 + 에디터). 이름/설명 인라인 편집 (hover/focus bg 피드백), Parent 드롭다운 변경, Info 카드 (Tier/Parent/Created/Updated)
- **서브카테고리 관리**: "+ New" 인라인 생성, "Move here" 기존 카테고리 이동 (순환참조 방지), Parent Categories 조상 체인 네비게이션
- **디자인 브레인스토밍**: Linear/Plane 수준 폴리시를 위한 "Design Spine" 논의 시작. spacing/sizing/typography 표준화 방향 설정 예정

### 이번 세션 완료 — 레이아웃 리디자인 (2026-03-26)
- **TopUtilityBar 제거 + 사이드바 헤더 리디자인**: Back/Forward/Search를 사이드바 상단으로 이동 (Linear 스타일)
- **사이드바 폭 260→220px**: 컴팩트화
- **사이드바 닫기/열기 Plane식**: ActivityBar 상단 열기 버튼, 다른 space 클릭 시 사이드바 안 열림
- **ViewDistributionPanel → SmartSidePanel(Details)**: 우측 사이드바 = 노트 디테일. NoteDetailPanel 오버레이도 제거. previewNoteId store 필드 추가
- **사이드바 버튼으로만 패널 열기**: 행 클릭 시 자동 패널 열기 제거
- **Priority UI 완전 삭제**: side-panel-context + note-detail-panel에서 제거
- **ViewHeader h-14→h-[52px]**: 컴팩트 헤더, text-sm font-medium
- **컬럼 헤더/버튼 밝기 개선**: text-muted-foreground/50→풀 opacity, compact 오버라이드 제거
- **Tags/Labels/Templates 카운트**: 사이드바 More 섹션에 갯수 표시

### 이번 세션 완료 (2026-03-25)
- **Wiki Merge UX 4가지 수정**: Overview 사이드바 네비게이션 복귀 버그 수정, 하단 드롭다운 위로 열림, New Article 타이틀 직접 입력, 카테고리 사이드바 CRUD
- **카테고리 계층구조 설계 결정**: 태그/라벨은 flat, 위키 카테고리만 트리 (parentId). 카테고리 페이지 = 사이드바 최상위 항목
- **캘린더 플로팅 액션바 삭제 결정**: 불필요
- **silly-mclaren 워크트리 복구**: 세션 크래시 후 커밋+푸시+PR+머지 완료 (PR #112)

### 이번 세션 브레인스토밍 결과 (2026-03-24)
- **글로벌 탭 도입 안 함** — 멀티패널과 역할 충돌. 사이드바가 탭 역할 수행
- **View = 사이드바 프리셋** — Linear View(탭)를 사이드바 Views 섹션으로 구현. FilterRule[] + groupBy + ordering + subGroupBy + visibleColumns + viewMode 저장
- **+ 버튼 통일** — top-utility-bar "New Note" 텍스트 제거 → ViewHeader 우측 `+` 아이콘만
- **커맨드 팔레트 확장 필요** — 현재 6개 → 20+개 컨텍스트 반응형 커맨드 (Note Actions, View, Navigation, Creation)
- **풀페이지 검색 분리** — ⌘K = 검색, ⌘/ = 커맨드 팔레트
- **멀티패널 뷰 타입 확장** — Wiki/Calendar/Graph + 에디터 조합 ("참조하면서 쓰기")
- **Wiki 대시보드 반응형** — Articles/Stubs/Red Links 카드가 탭/필터 역할
- **Linear 디자인 레퍼런스** — linear-design-mirror.tar.gz + SKILL.md 참고자료 저장 완료

### 이번 세션 완료 (2026-03-24)
- **Notes List 리니어식 그리드 통합**: list+table 2개 렌더러 → grid 하나 (~220줄 삭제), 컬럼 헤더 활성화
- **Phosphor 상태 아이콘**: CircleDashed(Inbox)/CircleHalf(Capture)/CheckCircle(Permanent)
- **Tray → Inbox 전체 교체**: 5+ 파일 라벨 통일
- **Capture/Permanent → NotesTable 통합**: 독립 페이지 삭제 (~520줄), TABLE_VIEW_ROUTES 추가
- **Tags/Labels 정상화**: sort 컬럼 헤더, 검색 제거, + 버튼, 아이콘 통일
- **Board 카드 개별 선택**: hover 체크박스 추가
- **isWiki 레거시 완전 폐기**: v59 마이그레이션 (isWiki→false, 빈 스텁 trash, wikiStatus→null)
- **템플릿 UX 개선**: Grid 프리뷰 강화, 생성 후 focus 모드, placeholder 힌트
- **위키 서브섹션 UI**: AddBlockButton에 Subsection 옵션 (level 3/4)
- **폰트/opacity 표준화**: text-xs 통일, opacity /30~/60, uppercase 제거
- Store v58→v59

### 이번 세션 완료 (2026-03-22)
- **Wiki 리디자인**: 파일 분리 (1500줄→6파일), Dashboard 새 설계, List→Linear-style 테이블, ArticleReader 폴리시, 사이드바 스타일링
- **첨부파일 시스템 개선**: data URL → IDB blob 저장 (attachment:// URL 스킴)
- **시드 데이터**: Zettelkasten 튜토리얼 (9 notes, 3 wiki articles), auto-migration v46
- **카테고리 클릭 필터**: 사이드바/Dashboard 카테고리 클릭 → List 모드 + 태그 필터
- **TOC 개선**: + Section/Subsection 인라인 추가, 빈 위키에도 TOC 표시
- **Wiki stub 자동 템플릿**: Overview/Details/See Also 기본 구조
- **+ Add file**: WikiCollectionSidebar에 파일 첨부 버튼 추가
- **Infobox editable**: read mode에서도 편집 가능, 비어있을 때 "Add infobox" 표시
- **Wiki Block Editor 1~3단계 완료**:
  - WikiArticle + WikiBlock 데이터 모델 (별도 엔티티, store v48)
  - createWikiArticlesSlice (10개 액션: CRUD + 블록 조작)
  - WikiBlockRenderer (Section/Text/NoteRef/Image 4종 + AddBlockButton)
  - WikiArticleView (TOC + 블록 목록 + Infobox 사이드바)
  - 블록 인라인 편집 (Section 제목, Text textarea, NoteRef 검색/삽입, Image 업로드)
  - Section 자동 번호 매기기 (TOC ↔ 본문 동기화)
  - 시드 WikiArticle 3개 (Zettelkasten/Permanent Note/Fleeting Note)
  - Note 기반 위키 클릭 시 같은 제목 WikiArticle로 자동 라우팅
  - Section 접기/펼치기 (collapsed → 하위 블록 숨김, store persist)
  - Sources 사이드바 (note-ref/image 블록 자동 추출, 클릭 시 SidePeek 열기)
  - Context Panel: NoteRef "Open" 버튼 → SidePeekPanel로 원본 노트 열기 (편집 + FixedToolbar)

### 이번 세션 완료 (2026-03-23)
- **Smart Side Panel**: NoteInspector + SidePeekPanel → 통합 SmartSidePanel (Context/Peek 두 모드)
  - react-resizable-panels로 리사이즈 가능
  - Details에서 백링크/관련 노트 클릭 → Peek 전환
  - ReferencedInBadges MAX 3개 + "+N more" Popover
- **Workspace 단순화**: Binary tree(14 액션, 9 컴포넌트) → 듀얼 패인(5 액션, 2 컴포넌트)
  - `secondaryNoteId` + `editorTabs` + `activePane` 모델
  - "나란히 열기" 버튼 (Peek → 듀얼 에디터 승격)
  - Store v50→v52 마이그레이션
- **위키 블록 무한 확장 대응**:
  - text block content → IDB 분리 (`plot-wiki-block-bodies`)
  - block metadata → IDB 분리 (`plot-wiki-block-meta`)
  - `WikiSectionIndex` — Zustand에 경량 섹션 인덱스만 보관 (v53)
  - react-virtuoso 가상 스크롤 (>50 블록)
  - 섹션 lazy load (접힌 섹션 렌더 스킵)
- **블록 DnD**: @dnd-kit 기반 드래그 앤 드롭 순서 변경 (edit 모드)
- **Wiki stats 버그 수정**: `notes.isWiki` → `wikiArticles` 기반으로 전환
- **Wiki article 클릭 버그 수정**: Dashboard에서 `onOpenArticle` → `onOpenWikiArticle`

### 이번 세션 완료 (2026-03-24)
- **Linear UI 폴리시 3차**:
  - ViewHeader "+ New note" 중복 제거 → top-utility-bar "+" 아이콘만 남김 (컨텍스트별 라벨: Notes→New Note, Wiki→New Article)
  - top-utility-bar에서 "+ New Note" 텍스트 버튼 제거, ViewHeader `onCreateNew` → "+" 아이콘 버튼으로 통일
  - Calendar onCreateNew 복원
  - Inbox 독립 viewState (Notes와 필터/디스플레이 분리, Status 필터 카테고리 자동 숨김)
  - Wiki Show stubs 토글 실제 동작 연결 (`filteredWikiNotes`에서 `toggles.showStubs` 필터링)
  - Wiki Red Links MiniStat 클릭 → 리스트 모드 전환 + 전용 Red Links 리스트 (제목+참조수+Create 버튼)
  - Wiki 리스트 탭 바에 "Red Links" 탭 추가 (빨간색 강조)
  - Wiki STATUS↔TITLE 간격 수정 (w-[80px] → w-[100px])
  - linear-design-mirror 스킬 생성 + SKILL.md 참고 자료 저장

### 이번 세션 완료 (2026-03-23, 세션 2)
- **글로벌 색상 체계 (`lib/colors.ts`)**: 15개 파일 하드코딩 → 단일 소스. CSS 변수 추가 (`--wiki-complete`, `--priority-medium`)
- **wiki-complete 색상 분리**: permanent 초록 → violet `#8b5cf6`로 분리
- **위키 상태 아이콘 3종**: IconWikiStub(점선 책), IconWikiDraft(연필 책), IconWikiComplete(북마크 책) — Linear 스타일 아이콘+텍스트
- **그래프 nodeType 버그 수정**: WikiArticle이 원(Note)으로 나오던 버그 → 헥사곤으로 정상 표시
- **그래프 색상 수정**: inbox/capture 색상이 뒤바뀐 거 수정 + 위키 상태별 색상(violet/indigo/orange)
- **그래프 범례 재구성**: Node Types → 상태별(Inbox/Capture/Permanent) + Wiki별(Complete/Draft/Stub)
- **태그 기본 OFF + pill 형태**: 그래프에서 태그 노드 기본 숨김, 다이아몬드 → pill 캡슐 형태
- **배경색 차콜 전환**: `#09090b` → `#141417`. 카드/팝오버/보더도 elevation 계층 조정
- **그래프 노드 제한**: MAX 200개(connectionCount 순), LOD 최적화(zoom < 0.3 라벨 숨김, < 0.15 노드 숨김)
- **글로벌 라우트 히스토리**: `table-route.ts`에 히스토리 스택. Back/Forward 버튼이 페이지 간 이동 지원
- **Backspace = 뒤로가기**: 에디터 밖에서 Backspace키로 이전 페이지/노트 이동
- **"Ontology" → "Graph"**: 헤더 타이틀 변경
- **위키 클릭 버그 수정**: openArticle이 WikiArticle.id 직접 인식하도록 수정
- **Node Types 범례 한글 → 영어**: "일반 노트/위키 문서/미완성 위키" 제거

### 이번 세션 완료 (2026-03-23, 세션 3)
- **필터 드롭다운 검색창**: 모든 필터 서브드롭다운에 검색 입력 추가 (Linear식, 임계값 제거)
- **Wiki Merge 스토어**: mergeWikiArticles (A+A), mergeNotesIntoWikiArticle (B: Note[]→WikiArticle)
- **Wiki Assembly Dialog**: Note[] → WikiArticle 조립 UI (FloatingActionBar + Dialog)
- **클러스터 감지 → 자동 제안**: detectClusters() + useClusterSuggestions hook + nudge toast
- **archive 제거**: 노트에서 isArchived 필드 + Show archived 토글 + 관련 로직 전부 삭제
- **위키 리스트 토글 버그 수정**: Show stubs/Show red links 토글 동작 수정
- **위키 클릭 버그 수정**: Dashboard/Overview에서 위키 아티클 클릭 시 열기 동작 수정
- **위키 카테고리 필터 버그 수정**: 드롭다운 열리지 않던 이슈 수정

### 이번 세션 완료 (2026-03-24)
- **List/Board 토글 활성화**: Show trashed / Compact mode / Show card preview 3개 토글 실제 동작 연결
- **Nested Replies (Thread 트리 구조)**: ThreadStep에 parentId 추가 + 트리 렌더링 + Reply 버튼 + store migration v54
- **Compact + Preview 공존**: isCompact 조건 제거하여 두 토글 독립 동작
- **Board 컬럼 헤더 라벨 색상 dot**: Label/Folder 그룹핑 시 컬럼 헤더에 색상 dot 표시
- **그룹 드래그 순서 변경 (List + Board)**: dnd-kit 기반 그룹 헤더/컬럼 드래그로 순서 커스텀. viewState.groupOrder에 persist
- **Collapse All / Expand All 버튼**: ViewHeader 필터 왼쪽에 토글 버튼 추가 (그룹핑 활성일 때만)
- **Breadcrumb/Sidebar 클릭 시 에디터 닫기**: 같은 라우트 router.push 시 IDB persist 덮어쓰기 문제 해결
- **글로벌 Undo/Redo**: Ctrl+Z / Ctrl+Y + UndoManager (linked list + capacity 50) + 에디터 focused 시 비활성
- **Sub-grouping 실제 동작 구현**: group.ts 재귀 그룹핑 + subheader VirtualItem + 들여쓰기된 서브그룹 헤더 렌더링
- **Show card preview 즉시 전환**: 토글 ON/OFF 시 리스트 즉시 반영

### 이번 세션 완료 (2026-03-24, 세션 2)
- **Design Polish Phase 1~5**: Lucide→Phosphor 아이콘 통일(83파일), hardcoded hex→lib/colors.ts 중앙화, 인라인 style→Tailwind 클래스, 비표준 값 정규화
- **NoteRow CSS Grid 컬럼 기반 재설계**: flex→CSS Grid 전환, word count 타이틀 옆 배치, ViewHeader 로컬 검색 제거→글로벌 검색 통합
- **전 뷰 행 구분선 제거**: notes-table, wiki-list, wiki-view, note-list, labels-view, tags-view — "Structure felt, not seen" 철학 전면 적용

### 이번 세션 완료 (2026-03-25)
- **WikiStatus 단순화**: stub/draft/complete → stub/article 2단계. v60 마이그레이션 (draft→stub, complete→article)
- **Import Note 2단계 리디자인**: Step 1(노트 선택) → Step 2(Article/Stub/Red Link/Create new 타겟 선택). WikiArticle 조립 모델 사용
- **Red Links 리스트 통합**: 별도 페이지 제거, All 탭에 Article/Stub/Red Link 동급 표시
- **위키 삭제**: 리스트 ··· 메뉴 + 에디터 사이드바 + 우클릭 컨텍스트 메뉴
- **위키 플로팅 액션바**: 체크박스 선택 + 하단 액션바 (Delete/Promote)
- **createWikiStub → createWikiArticle 전환**: WikilinkDecoration, search-view, wiki-collection-sidebar, wiki-view 4곳
- **아이콘 통일**: Wiki 섹션 헤더 IconWiki, Graph 액티비티바 Phosphor Graph
- **머지 개선**: 높은 status 유지 (article > stub), DRAFT/COMPLETE 라벨 → STUB/ARTICLE
- **Legacy fallback**: IDB의 draft/complete 값을 Stub/Article로 표시 (StatusBadge, WikiStatusDot, wiki-dashboard 등)
- **docs 최신화**: CLAUDE.md, CONTEXT.md, MEMORY.md store v60, WikiStatus 반영
- **Wiki Merge Preview**: 2단계 다이얼로그 (타겟 선택 → 방향 스왑/제목/상태 선택 + 블록 미리보기 + Undo toast). mergeWikiArticles 개선 (infobox 머지, title/status 옵션 파라미터)
- **Wiki Split**: 에디트 모드에서 블록 체크박스 선택 → "Extract" 버튼으로 새 아티클 분리. splitWikiArticle 스토어 액션 신규
- **Wiki Unmerge**: mergedFrom 스냅샷 (WikiMergeSnapshot) + "From: X" 구분선에 Unmerge 버튼 + unmergeWikiArticle 액션
- **섹션 컨텍스트 메뉴**: hover "..." → "Move to new article" / "Delete section"
- **드래그 Split**: TOC 사이드바 하단 드롭존. 에디트 모드에서 섹션 드래그 → 드롭존에 놓으면 새 아티클로 분리
- **위키 리스트 우클릭**: Split wiki + Merge into + Delete (컨텍스트 메뉴 3개)
- **Drag Split UX 폴리시 5개**: 드롭존 시각 피드백 강화, 제목 프롬프트, 모든 블록 타입 드래그 가능, DragOverlay 미리보기, 기존 아티클 드롭 타겟
- **플로팅 드롭존**: TOC 사이드바 드롭존 → 화면 하단 플로팅 바로 이동 (드래그 시에만 출현)
- **플로팅 액션바에 Split 추가**: 단일 선택 시 Promote + Merge + Split + Delete
- **사이드바 Merge/Split 풀페이지**: 좌측 사이드바에 Merge/Split 내비 추가 + 각각 전용 풀페이지 UI (WikiMergePage, WikiSplitPage)
- Store v59→v60

### 이번 세션 완료 (2026-03-25, 세션 2)
- **Wiki 카테고리 시스템 완성**:
  - WikiLayout 프리셋 (`"default" | "encyclopedia"`) — article별 레이아웃 전환 UI
  - 카테고리 전용 페이지 (WikiViewMode `"category"` 추가, WikiCategoryPage 컴포넌트)
  - 사이드바 카테고리: flat 트리 → nav 최상위 항목 ("Categories" = Overview/Merge/Split과 동급)
  - 2-panel 카테고리 트리 에디터: 왼쪽 드래그 가능 트리 + 오른쪽 상세 패널 (breadcrumb, 설명 편집, 하위 카테고리, 소속 아티클)
  - 아티클/스텁 카테고리 할당 UI: 인라인 태그 행 + Add 드롭다운 + 새 카테고리 생성
- **Encyclopedia 레이아웃** (나무위키식):
  - 상단 분류 태그 행, float-right 인포박스, 인라인 collapsible 목차(Contents), 번호 매긴 접기/펼치기 섹션
  - 텍스트 사이즈 밸런스 개선 (h1 3xl, 인포박스 xs/sm, 목차 sm)
- **URL 블록 타입**: WikiBlockType에 'url' 추가. 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에 URL 옵션
- **Merge 카테고리 반영**: handleMerge → mergeMultipleWikiArticles 교체 (categoryIds, blockOrder 전달)
- **Split status 반영**: splitWikiArticle에 status 파라미터 추가 (기존 항상 stub → 선택 가능)
- **Chevron 방향 수정**: Title/Survives 드롭다운 ChevronDown → ChevronUp (위로 열리는 드롭다운)
- Store v60→v61 (WikiArticle.layout 기본값)

### 이번 세션 완료 (2026-04-10) — Peek-First 실험 → Split-First 복귀 결정
**Peek-First 작업 (Phase 2~3.5):**
- **Phase 2**: Peek에서 Wiki 지원 — `PeekContext = {type:"note"|"wiki", id}`, 8개 호출부 업데이트
- **Phase 2.5**: Peek 자립 — 상시 탭 + Empty State(Suggested+Recent+Pinned) + Open picker + `Cmd+Shift+P` 단축키
- **Phase 3**: 사이즈 시스템 — `peekSize` 32-50%, drag, main-content 동적 계산
- **Phase 3.5**: Back/Forward history + Pin + 서브헤더 대비 개선
- Peek picker 시각 개선: 노트 워크플로우 상태 원 아이콘(`StatusShapeIcon` 공유 추출) + 위키 violet 북
- MentionSuggestion 일관성: note/wiki 색상 시스템 통일 (NOTE_STATUS_HEX + WIKI_STATUS_HEX)
- Empty State Suggested 섹션 (contextual related + fallback to 최근 수정 노트)
- 검색 결과 Notes/Wiki 그룹핑 (멘션 피커 패턴)
- Tooltip overflow fix (native title → Radix `side="bottom"`)
- FixedToolbar `variant="peek"` (violet tint)
- Wiki 편집 in Peek + 풀 infobox/TOC 렌더링
- 공유 파일: `components/status-icon.tsx` (StatusShapeIcon), `lib/peek/peek-search.ts`, `lib/peek/peek-suggestions.ts`

**피벗 결정 — Peek-First 포기, Split-First 복귀:**
- 근거: Peek UI가 사이드패널 안에 있는 한 main editor와 "같은 단층" 느낌 불가능
- 대안: Split view 복원 + **단일 SmartSidePanel이 `activePane`을 따라감** (focus-following)
- 원래 Split view의 문제(per-pane dual SmartSidePanel)는 단일 인스턴스 + `useSidePanelEntity` + `PaneProvider` 체인으로 해결
- **Phase 1 완료**: SmartSidePanel pane prop 제거 + global state, side-panel-connections `useSidePanelEntity` 적용, layout.tsx SmartSidePanel 호출부 단순화, Peek 탭 제거 (4탭 복원), tsc clean
- **Phase 2~7 대기**: Store cleanup(peek/secondarySidePanel 상태 제거) → Peek 파일 삭제 → secondary picker 재설계(peek-empty-state → secondary-open-picker) → focus tracking 강화 → 시각 피드백 → Split view 통합 검증 → 문서 업데이트
- **자산 재활용**: StatusShapeIcon, MentionSuggestion 개선, peek-search, peek-suggestions, Tooltip fix, FixedToolbar variant 시스템 전부 Split view picker로 이관 가능

### 다음 작업 후보 (우선순위 순, 2026-04-10 sync)
1. **Footnote createdAt** — 각주 생성 타임스탬프 + 하단 날짜 표시
2. **모든 각주 자동 Reference 연결** — /footnote로 만들어도 자동 Reference 생성, 독립 각주 제거
3. **Reference.history** — 수정 이력 저장 + 스티커 UI (원본/수정 비교)
4. **각주 리치 텍스트** — plain text → 인라인 서식 + 위키링크 (미니 TipTap)
5. **Library Activity Bar** — References + Tags(글로벌) + Files 3탭
6. **Tags 글로벌 승격** — WikiArticle에 tags 추가
7. **인포박스 고도화** — 대표 이미지, 섹션 구분, 접기/펼치기

### 완료 확인 (이전 TODO에서 제거)
- ~~Phosphor Icons 전체 마이그레이션~~ → PR #104 완료 (83파일)
- ~~Wiki Block 후속 (드래그/접기/펼치기)~~ → PR #94-95 완료
- ~~위키 카테고리 계층구조~~ → PR #112-113 완료
- ~~캘린더 플로팅 액션바~~ → 불필요 판단으로 삭제 (2026-03-25)

### docs 현황
- `docs/CONTEXT.md` — 현재 상태 + 설계 결정
- `docs/MEMORY.md` — PR 히스토리 + 아키텍처
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- 완료된 설계 문서 9개 삭제 (architecture-redesign-v2.md, wiki-collection-design.md 등)
