# Plot — Project Context (Git-Synced)

> This file is synced via git so all machines share the same context.
> before-work reads this file. Update it whenever major decisions change.

## 🚀 2026-05-02 (늦은 밤) — Index 버튼 위치 통일 + viewState.toggles에 보존

**문제**: Notes의 Index 토글은 ViewHeader 우측 toolbar (Filter/Display 옆), Wiki list는 ViewHeader 아래 별도 toolbar에 있어서 두 view 패턴이 어색하게 달랐음.

**해결**: 두 view 모두 **컬럼 헤더의 Title 옆 inline 토글**로 통일. ViewHeader는 글로벌 view-level 액션(Filter/Display/Save view)만 보유.

**옵션 B 선택** (Display 패널 + 컬럼 헤더 inline 두 진입점, viewState.toggles에 보존):
- `viewState.toggles.showAlphaIndex` 키로 통일 (기존 `useState` 로컬 상태 폐기)
- saved view에 함께 보존됨 — "알파벳 인덱스 켠 상태"의 view 만들 수 있음
- 컬럼 헤더 inline 토글 + Display 패널 토글 = 같은 state (synced), Linear 패턴

**dirty 검증 확장**: `viewStateEquals`에 `toggles` map 비교 추가. Index 켜면 ViewHeader Save 버튼 자동 등장.

**적용 파일**:
- `components/notes-table.tsx` — useState 제거, viewState.toggles 사용, ViewHeader extraToolbarButtons에서 제거, 컬럼 헤더 Title 셀에 toggle inline
- `components/views/wiki-list.tsx` — `ColumnHeaders`에 `showAlphaIndex` + `onToggleAlphaIndex` props 추가, 별도 toolbar의 Index 버튼 제거
- `components/views/wiki-view.tsx` — `showAllArticles` useState 제거, wikiViewState.toggles로 전환
- `lib/view-engine/saved-view-context.ts` — viewStateEquals에 toggles 비교 추가
- `lib/view-engine/view-configs.tsx` — NOTES + WIKI configs의 displayConfig.toggles에 `showAlphaIndex` 추가

---

## 🚀 2026-05-02 (밤) — Saved Views 스냅샷 UX (Linear 패턴 옵션 C)

**Saved Views snapshot 흐름 완성**: 이전엔 + 버튼이 빈 default state 뷰만 만들었음. 이제:

1. **사이드바 + 버튼**: 이름 입력 → 즉시 **현재 viewState 캡처**해서 저장 (`createSavedView(name, currentViewState, space)`)
2. **ViewHeader Save 버튼** (Linear 패턴):
   - 활성 view 없음 → "Save view" (popover로 이름 입력)
   - 활성 view + dirty (현재 state ≠ saved state) → 강조된 "Save" 버튼 (덮어쓰기)
   - 활성 view + clean → 버튼 숨김
3. **사이드바 saved view 우클릭 메뉴**:
   - **Update view** — 현재 viewState로 saved view 덮어쓰기
   - **Reset to saved** — 현재 viewState를 saved view 상태로 되돌림
   - Rename / Delete

**적용 범위**: notes-table, notes-board, wiki-view (list mode), ontology-view, calendar-view 5곳

**핵심 헬퍼**:
- `lib/view-engine/saved-view-context.ts` — `getCurrentViewContextKey(space, route)`, `getSavedViewSpaceForActivity(space)`, `viewStateEquals(a, b)`
- `lib/view-engine/use-save-view-props.ts` — `useSaveViewProps(contextKey, space)` 훅. 자동으로 saveViewMode 계산 + onSaveView 콜백 제공

**Dirty 검증**: viewMode/sortField/sortDirection/groupBy/showEmptyGroups + filters[] + visibleColumns[] 비교

---

## 🚀 2026-05-02 (오후) — docs 정리 + Saved Views 완성 + 카테고리 색 UI + Sticker 사이드바 (사이드바 polish + Sticker 1급 UI 통합 PR)

**5개 작업 묶음 PR**:

1. **🗂️ docs archive 정리**: stale 문서 5개를 `docs/.archive/`로 이동
   - `TODO.md`, `NEXT-ACTION.md`, `SESSION-LOG.md` — 4-30 시점, PR #228~#236 9개 누락. CONTEXT.md/MEMORY.md/worklog와 정보 중복
   - `PHASE-PLAN-wiki-enrichment.md` — v75→v83 가정인데 현재 v100, 데이터 모델 가정 깨짐. 헤더에 "ARCHIVED + 분할 PRD로 대체" 노트
   - `plot-discussion/` 11개 — 2026-03-30 historical brainstorm. entity 통합→분리 등 일부 결정 뒤집힘
   - `docs/.archive/README.md` 신규 (보관 이유 + authoritative 문서 가이드)
   - 의도: single source 원칙 (CONTEXT.md/MEMORY.md만 갱신, after-work 갱신 누락 패턴 차단)

2. **🔧 SavedView.viewMode 타입 보강**: `lib/types.ts:314`에 `"graph" | "dashboard"` 추가
   - 기존: `"list" | "table" | "board" | "insights" | "calendar"` — ontology의 graph/dashboard 누락
   - Ontology saved view 만들 때 viewMode 보존되도록 fix (잠재 버그 사전 차단)

3. **🆕 Saved Views 복원 패턴 Wiki/Ontology/Calendar에 적용**: 기존 Notes만 동작하던 viewState 복원 로직을 3개 view로 확장
   - `components/views/wiki-view.tsx` + `ontology-view.tsx` + `calendar-view.tsx`에 `useActiveViewId` import + useEffect 패턴 추가
   - SavedView.space 가드 (wiki/ontology/calendar 각각 자기 saved view만 적용)
   - notes-table-view.tsx의 useEffect 패턴 거의 그대로 복제 (~10줄 × 3 파일)

4. **🎨 카테고리 색 dot + Change color UI**: WikiCategory.color 활용 UI 완성
   - List view 카테고리 row: 색 dot (h-2 w-2 rounded-full) + ContextMenu(Rename/Change color/Delete + undo)
   - CategoryEditor: Name input 아래 Color Popover (ColorPickerGrid)
   - `components/views/wiki-category-page.tsx` 단일 파일 121줄 추가
   - 데이터 모델은 v99에서 이미 추가됨. UI만 늦게 추가됨.

5. **🆕 Sticker 사이드바 + /stickers 페이지**: Sticker 1급 entity UI 완성
   - `components/views/stickers-view.tsx` 신규 (754줄, LabelsView 복제 패턴)
   - `app/(app)/stickers/page.tsx` shell (return null)
   - `app/(app)/layout.tsx`에 StickersView always-mounted 등록
   - `components/linear-sidebar.tsx` More 섹션에 Stickers NavLink 추가 (Sticker Phosphor 아이콘 + count)
   - `lib/table-route.ts`의 VIEW_ROUTES에 `/stickers` 등록
   - 의도: 그래프 우클릭 메뉴에서만 가능했던 sticker 생성/관리를 라벨처럼 사이드바 진입점에서도 가능하게

**Saved Views 스냅샷 UX 결정사항 (다음 PR 후보)**:
- 현재 사이드바 + 버튼은 이름만 받고 빈 default state 뷰 생성 → "현재 viewState 캡처" UX 부재
- 사용자 합의 옵션 C (ViewHeader Save + 사이드바 + 버튼 의미 변경 둘 다):
  - ViewHeader에 명시적 "Save view" 버튼 (변경 있을 때만 활성화 — Linear 패턴)
  - 사이드바 + 버튼: 빈 뷰 대신 현재 viewState 캡처 (이름 입력 → 즉시 스냅샷)
  - 우클릭 메뉴: "Update view" (덮어쓰기), "Reset to saved" 등

**작업 안 한 것 (deferred)**:
- linear-sidebar wiki space에 카테고리 트리 표시 (현재는 wiki-category-page에서만 색 dot 보임)
- NoteStatus 리네이밍 (PRD 사전 조사 완료, 다음 큰 PR로)
- Filter chip 3-part 드롭다운 Step B (별도 PR)
- Saved Views 스냅샷 UX 개선 (옵션 C)

**Out of scope (다음 PR)**:
- Saved Views 스냅샷 UX (ViewHeader Save 버튼 + 사이드바 + 버튼 의미 변경)
- NoteStatus → stone/brick/keystone 리네이밍 (Phase 1)
- Filter chip 인라인 편집 Step B (모든 part 드롭다운)
- 인포박스 Tier 1~3 (분할 PRD)

---

## 🚀 2026-05-01 ~ 2026-05-02 — Light Mode + Ontology Graph 재설계 + Group by Hull + Sticker entity + Dashboard 3분할 (단일 PR)

**12개 큰 작업을 한 PR에 누적:**

1. **라벨 편집 UX 재설계 (Option A)**: name click=rename, color popover always-on, FAB rename/recolor, 우클릭 메뉴, hover pencil 제거
2. **한글 → 영어 전환 + v97/v98 마이그레이션**: 인포박스 프리셋/필드명, navbox 버튼, wikiArticles dedup
3. **글로벌 컬러 시스템**: SPACE_COLORS + ENTITY_COLORS + STATUS_COLORS 단일 진입점, 라이트 모드 가시성 헬퍼
4. **폰트 스케일 시스템**: 위키 article 6 그룹 (title/heading/body/infobox/meta/misc) per-group 배율. Reader Settings popover (S/M/L/XL + Refine ± + Layout + Reset)
5. **Ontology Graph Redesign Phase 1~4**: `lib/graph/ontology-graph-config.ts` 신규 — 50+ 매직넘버 단일 진입점. Force tier, sqrt(linkCount) 사이징, smooth LOD fade, 부채 정리
6. **Phase 7 — Ontology UX 통일**: Display popover에 View Mode (Graph/Insights) + 노드 타입 토글 통합. 사이드바 Node Types 제거, OntologyTabBar 제거. Notes/Wiki와 동일 멘탈 모델
7. **🆕 Phase 7 버그 fix**: `showViewMode` prop 누락 → ontology-view에서 Graph/Insights 토글 안 보이는 문제 해결
8. **🆕 Group by Hull 시스템 (PRD: REDESIGN_GRAPH_GROUPING.md)**: Ontology hull = 사용자 group by 결과. 라벨/태그/카테고리/폴더/스티커/상태 어느 거든 부여 = 그래프 hull 멤버십. Hull light/dark 분기로 라이트모드 가시성 ~3× 개선
9. **🆕 Sticker entity 신규**: 라벨(노트만)/카테고리(위키만)/태그(맥락) 외에 **임의 묶음** 슬롯. 노트+위키 모두 다중 멤버십. 사용자 멘탈모델: "라벨/카테고리/태그 의미 따질 필요 없이 그냥 한 묶음으로 표시하고 싶어"
10. **🆕 우클릭 메뉴 + 인라인 스티커 생성**: 그래프 노드/hull 우클릭 → Add sticker… → 인라인 검색 + "+ New" → 즉시 모든 선택 노드에 부여 + Group by 자동 전환. Linear quick-add 패턴
11. **🆕 Hull 인터랙티브**: hull = 블록. 클릭(그룹 선택) / 드래그(그룹 이동) / 우클릭(메뉴) 모두 지원. 안의 모든 노드 함께 이동 (group-drag 로직 재활용)
12. **🆕 3분할 Dashboard 진입**: Ontology = Graph (시각화) + Insights (행동 유발) + Dashboard (raw stats, "사브메트릭스"). 사이드바 More에 Dashboard 진입점. Stats 재설계 (Health → Stats, Density 삭제, Top hub → 노트 제목)
13. **🆕 Hull/스티커 색 사용자 변경 UI**: 우클릭 메뉴의 스티커 서브메뉴에 두 곳 색 picker — (1) 새 스티커 생성 시 입력창 옆 dot → PRESET_COLORS swatch grid, (2) 기존 스티커 row의 dot 클릭 → 인라인 picker. **Hull 색 = entity 색**이라 스티커 색만 바꾸면 hull도 즉시 동기화
14. **🆕 Hull 드래그 부드럽게**: Hull = 블록 드래그 시 path data 매 tick 재계산하면 "꿈틀거림" 발생 → drag 중에는 path 모양 freeze + SVG `transform=translate(dx, dy)`로 통째 이동. 노드들은 group-drag 로직으로 동일 delta 적용. drag 끝나면 transform 해제 + 새 위치 기반 hull 자연스럽게 그대로 그려짐 (점프 없음)
15. **🆕 다중 선택 강화**: Ctrl/Cmd+click(toggle) + **Shift+click(add)** + Shift+drag(marquee) 모두 지원 (Mac Finder/Linear 패턴). 좌상단 hint 재설계: 선택 0개일 때 단축키 안내 (Kbd badge), 선택 시 카운트 + 해제 버튼
16. **🆕 범례 라이트모드 가시성 통일**: 텍스트 색을 통일된 slate-800로 (이전 status별 색상은 흐림), color는 swatch에만 — Linear 패턴. 배경 `0.92 → 0.98` 거의 불투명, 노드 fill alpha `0x55 → 0x88`
17. **🆕 Stats 재구조 + 호버 tooltip**: Notes/Wiki **큰 숫자 카드** (grid-2col) + 각 행에 `cursor-help` + 풍부한 tooltip (status breakdown, 노트 제목 미리보기 8개), 푸터에 `N edges → Dashboard` 포인터
18. **🆕 사이드바 Ontology 진입점 재설계**: Wiki/Library 패턴 따라 **Graph / Insights / Dashboard 모두 상단 navigation으로** (More 섹션에서 끌어올림). 각 클릭 시 `plot:set-ontology-tab` 이벤트 → 같은 /ontology 페이지에서 viewMode 전환 (그래프 layout/positions 보존)
19. **🆕 연결 끊기 (시각만, 데이터 보존)**: ViewState에 `hiddenEdgeIds` / `hiddenEdgeKinds` / `isolatedNodeIds` 추가 → visibleEdges 필터링. 우클릭 메뉴에 **Hide connections** (선택 노드의 모든 엣지 숨김) + **Isolate** (선택만 보이게, 나머지 dim) + **Show all** (복원). 좌상단에 amber 인디케이터 ("N hidden · M isolated · Show all"). 엣지 직접 우클릭은 path hit-area 코드 비용 커서 다음 PR로 위임
20a. **🆕 다크모드 엣지 색 강화 + Dashboard 아이콘 분리**:
- EDGE_STYLE.alphaRelation/Wikilink/Tag의 dark 값이 light보다 *낮게* 설정돼 다크에서 거의 안 보였던 버그 수정 (relation: 0.12→0.38, wikilink 0.08→0.30, tag 0.06→0.22). 다크 모드에서도 엣지 잘 보임
- 사이드바 Insights/Dashboard 동일 아이콘 → Dashboard만 `ChartBar`로 변경

20c. **🆕 Filter chip 인라인 편집 (Step A)**: connectedTo chip의 direction 부분을 클릭하면 Popover로 Both/In/Out 즉시 토글. 매번 우클릭 → submenu 갈 필요 없음. FilterChipBar에 `onUpdateFilter` prop 추가, notes-table·notes-board에서 wire. 다른 chip(Status/Folder/Label 등)의 인라인 편집은 Step B로 다음 PR

20d. **🆕 폴더 인라인 생성 (Move to folder 안에서)**: 노트 우클릭 → Move to folder → "+ New folder…" 선택 시 prompt로 이름 입력 → 즉시 생성 + 자동 부여. 위키 row 메뉴, multi-select 플로팅바에도 동일 패턴. createFolder가 생성된 ID 반환하도록 변경 (이전 void)

20b. **🆕 Connection 필터 (in-place backlink/links 필터)**: 노트/위키 뷰 안에서 "이 노트와 연결된 entity만 보기". Ontology 가지 않고 현장에서 즉시 적용.
- 새 FilterField `connectedTo` (value: `<id>:<direction>`, direction ∈ both/in/out)
- Notes pipeline (filter.ts): linksOut + backlinksMap 기반 양방향 처리
- Wiki pipeline (wiki-list-pipeline.ts): linksOut(titles) + alias 기반 매칭, allArticles 추가 extras
- 우클릭 → "Show connected" 서브메뉴 (Both / Backlinks only / Links out only)
- 노트와 위키 양쪽 동일 패턴, FolderPickerSubmenu와 같은 인라인 expand-to-list UI
- Filter chip 자동 표시 ("Connected · [노트 제목] (↔ both)")
- 세 방향 토글로 분리되어 backlinks/links out 별도 필터 가능

21. **🆕 폴더 = 글로벌 컨테이너 (노트+위키 공유)**: v99에서 데이터 모델은 이미 통합됐으나 UI가 노트만 다뤘던 것을 정리.
    - 노트 row 우클릭 메뉴 → **Move to folder** 서브메뉴 (폴더 목록 + No folder + 색 dot)
    - 노트 multi-select 플로팅바 → **Folder** popover 버튼 (bulk 적용 + 토스트)
    - 위키 row 메뉴 → **Move to folder** 인라인 expand-to-list submenu (FolderPickerSubmenu 컴포넌트)
    - 폴더 detail 페이지 (`/folder/[id]`) 완전 재구성 — 기존 `/notes` redirect 폐기. 두 섹션 (Wiki / Notes) + "+ Add" 드롭다운 (New note / New wiki article). 빈 섹션엔 "Create one" 액션. "Open in Notes view" 링크로 풀 기능 노트 뷰 진입 가능
    - 사이드바 폴더 카운트 = 노트 + 위키 합산 (이전엔 노트만)
    - layout.tsx 라우팅 수정 — pathname이 동적 라우트(`/folder/`, `/label/`, `/tag/`)면 isFallback 강제 → children(폴더 페이지)이 NotesTableView 위에 정확히 표시
    - createWikiArticle에 `folderId?` partial 필드 추가 (폴더 페이지에서 새 위키 생성 시 자동 멤버십)
    - **이름 결정**: "Folder" 그대로 유지 (Notion에는 폴더 없음 / Apple Notes·Obsidian·Logseq·Evernote 모두 폴더 메타포로 검증됨 / 친숙도 ★★★★★ + Plot의 노트+위키 컨테이너 의미 정확)
    - 위키 detail panel folder 셀렉터는 다음 PR (UI 영역 큼)

**데이터 모델 변경 (v98 → v100)**:
- WikiCategory에 `color: string` 추가 (graph hull 색)
- WikiArticle에 `folderId?: string | null` 추가 (노트+위키 통합 폴더 멤버십)
- **Sticker interface 신규** + Note/WikiArticle.stickerIds (multi)
- 신규 slice: `lib/store/slices/stickers.ts` (CRUD + bulkAddSticker)
- v99 마이그레이션: 기존 카테고리에 자동 색 할당, 위키 folderId default null
- v100 마이그레이션: stickers: [] 보장

**Group by 옵션 (Display popover)**:
- None / **Sticker** (default 추천, 노트+위키 통합) / Tag / Label / Wiki Category / Folder / Status / Connections (legacy BFS)

**Marquee 단축키**: Shift+drag = 영역 선택 / Ctrl+click = 노드 toggle. 그래프 좌상단에 hint 표시 (선택 후 사라짐)

**위키 노드 가시성**: hex `#8b5cf6` → `#7c3aed` (더 진한 violet) + light fillOpacity 0.33 → 0.55, strokeWidth 2.0 → 2.4

**Store**: v96 → v97 → v98 → v99 → **v100** (sticker entity)

**Out of scope (다음 PR)**:
- **사이드바 Stickers 섹션 + /stickers 페이지** (라벨처럼 관리, 우클릭 메뉴)
- **카테고리 사이드바 색 dot + Change color UI**
- **위키 폴더 입력 UI** (folderId 데이터는 있음)
- **위키 detail panel folder 셀렉터** (G20d deferred)
- **Dashboard 추가 섹션**: time series, connectivity distribution, cluster analysis, wiki article stats
- **모바일 인터랙션**: long press → selection mode + 하단 액션바
- **Phase 8** — 계층 시각화 (parent/child/root/orphan 차별화)
- **Phase 5** — Layout Switcher (Force/Hierarchical/Radial)
- **Filter chip 인라인 편집 Step B/C** — value 전체 + Field swap (Step A 완료)
- **Side Panel Connections 탭 강화** (sortable + clickable + filter chip 통합)
- **엣지 직접 우클릭** (path hit-area overlay)
- **Display popover edge type 세분화** (wikilink/relation/tag 토글 분리)
- **Insights Hub 본격 구축** (Wiki candidates / Stale notes / Broken wikilinks)
- **🆕 Saved Views 완성** — 데이터 슬라이스 + 사이드바 UI는 4 space (Notes/Wiki/Ontology/Calendar) 모두 구현됨. **하지만 viewState 복원은 Notes만 동작** (notes-table-view에서 activeViewId 감시). **Wiki/Ontology/Calendar는 dead end** (사이드바에 view 표시되고 클릭 라우팅도 되지만 viewState 적용 X). 다음 PR로 3개 view에 동일 패턴 적용 (notes-table-view의 useEffect 패턴 복제). 비용 ~3h
- **🆕 NoteStatus 리네이밍 (`inbox/capture/permanent` → `stone/brick/keystone`) + Inbox 알림함 시스템 도입** — 큰 작업, 사용자 직접 작성 PRD `docs/REDESIGN_NOTE_STATUS_INBOX.md`. **Phase 1 NoteStatus 전면 리네이밍 + IDB v101 마이그레이션**, **Phase 2 Home Inbox 의미 재정의 (placeholder + InboxSignal stub)**. 작업 시작 전 사전 조사 + 사용자 합의 절차 강제

자세한 PRD: [`docs/REDESIGN_ONTOLOGY_GRAPH.md`](./REDESIGN_ONTOLOGY_GRAPH.md), [`docs/REDESIGN_GRAPH_GROUPING.md`](./REDESIGN_GRAPH_GROUPING.md), [`docs/REDESIGN_NOTE_STATUS_INBOX.md`](./REDESIGN_NOTE_STATUS_INBOX.md)

---

## 🚀 2026-04-30 오후 — Sprint 1.4 완료 (4 PR 통합 단일 commit). 다음은 Sprint 1.5 + Wiki Hierarchy filter fix

**Sprint 1.4 완료 (단일 commit, ~40 파일)**:
- **PR 1 (D)** Parent 위계 활성화 — note-hierarchy + setNoteParent + Connections > Hierarchy + breadcrumb + Family/Parent/Role grouping + Filter-aware toggle + multi-select picker + hover delay 500ms
- **PR 2 (B)** Wiki 컬럼 정비 — Status badge / Reads (v95 마이그레이션) / Created
- **PR 3 (C)** Wiki 차트 개선 — Article/Stub 분리 + Sub-tabs (count) + Knowledge Connectivity (신규)
- **PR 4 (A)** Wiki 보드 뷰 신규 — Multi-membership Category drag + categoryNames lookup

**Store**: v94 → **v95** (Reads 백필). v96은 sortField/sortDirection deprecated 제거 단독 예정 (별도 cleanup PR).

**다음 세션**: Wiki Hierarchy filter 4 카테고리 fix (S, 10분) → Sprint 1.5 (Outlinks + 위계 컬럼) → Sprint 2.

자세한 plan: [`docs/NEXT-ACTION.md`](./NEXT-ACTION.md)

---

## 🚀 2026-04-30 오전 — Sprint 1.3 머지 완료

**Sprint 1.3 (PR #228)**: 디자인 polish + 사이드 패널 동기화 + Display Properties 동적 컬럼 + 출시 빌드 fix.

---

## 🚀 2026-04-29 (오후 후반) — **출시 준비 우선 결정. Sync는 v2.0**

**같은 세션 내 재고**: Sync 6개 결정 + PRD 작성 후 사용자 재고 → "꼭 페이즈 1부터 해야 되나? 우선은 앱부터 다듬고 출시 계획을 제대로 진행하고 싶은데?"

**결정 #3 변경**: (a) Sync 포함 출시 → **(c) Free 출시 후 v2.0에 Sync** (6개월~1년 후)

**이유**: Sync = 3~4개월 작업, 그 동안 사용자 facing 개선 멈춤. 앱 폴리시 빚 + 출시 후 사용자 피드백 반영해서 sync 설계 보강 가능.

**현재 작업 우선순위**:
- **Sprint 1 (~2주)**: P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) + 필터/디스플레이 드롭다운 정리
- **Sprint 2 (~3주)**: 노트 템플릿 시드 10~20개 + 온톨로지 메트릭 툴팁 + 캘린더 점검 + Views/Insights 업그레이드
- **Sprint 3 (~2주)**: 도메인 + 마케팅 사이트 + Privacy Policy + 데스크톱 웹 배포
- **🎯 데스크톱 Free 출시**
- **Sprint 4 (회원 수 충분해진 후)**: 모바일 반응형 + PWA + TWA + Google Play
- **Sync v2.0 (출시 후 6개월~1년)**: SYNC-PRD.md 활성화

**출시 결정**:
- **타임라인**: 자유 (끝날 때까지) — 품질 우선
- **플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일
- **모바일 전략**: PWA + TWA (Bubblewrap → Google Play)

**자세한 작업 가이드**: [`docs/NEXT-ACTION.md`](./NEXT-ACTION.md)
**Sync v2.0 PRD (보존)**: [`docs/SYNC-PRD.md`](./SYNC-PRD.md)

### Sync 6개 결정 (LOCKED, v2.0 진입 시점에 적용)

1. Sync 옵션: B. Supabase + E2E 암호화
2. 가격: Free / Sync $5 / Pro $10 (Obsidian 동일)
3. **출시 시점: (c) v2.0 — Free 출시 후 6개월~1년**
4. CRDT/Y.Doc: 노트+메타 모두 Yjs
5. 결제: 보류 (v2.0 진입 시점)
6. 인증 (v2.0): Magic link + Google + Kakao

**영구 규칙 추가** (v2.0 시점에 적용):
- 단일 사용자 도구 유지 (협업 X, 다중 기기만)
- E2E 암호화 절대 양보 X
- 오프라인 우선
- 마스터 비번 분실 = 데이터 복구 불가 → Recovery Phrase 강제

**Y.Doc 폐기 결정 (2026-04-27) 뒤집음** — sync 컨텍스트에서 노트 본문 + 메타 모두 Yjs 사용. v2.0 시점 적용.

---

## 🟢 2026-04-29 (오전) — v0 협업 + UI polish + dead code 정리 + P0 필터 + Row density 시도/revert (5 PR)

**완료 PR**:
- **#220 (23fe1be)**: v0 작업 흡수 — 라이트모드 contrast 개선 + Home View 리디자인 (12 파일). v0 환경 wrapper(`next.config.mjs`) 제외
- **#221 (4f5165a)**: UI polish + dead code 14개
  - 체크박스 6 위치 통일 (`bg-card` + `border-zinc-400` + `shadow-sm` + `rounded-[4px]`)
  - 라이트모드 chart 색 WCAG AA: chart-2 → #0e7490 (cyan-700) / chart-3 → #c2410c (orange-700) / chart-5 → #15803d (green-700)
  - StatusShapeIcon hex → CSS var (라이트/다크 자동)
  - Dead code 14개 정리 (Notes / Wiki / Wiki Cat / Calendar toggles)
- **#222 (f613532)**: P0 필터 강화 (5 앱 리서치 기반)
  - True orphan filter (linksOut=0 AND backlinks=0)
  - "Has backlinks" 활성화 (기존 dead config)
  - Wiki-registered filter (title+aliases 매칭)
  - `applyFilters` extras 인프라 확장 (backlinksMap + wikiTitles)
- **#223 (7423c08)**: Row density dropdown 통합 (Notion 패턴 시도)
- **#224 (7472321)**: Row density 제거 — Linear 스타일 (revert + 영구 규칙 재확인)

**큰 결정**:
- **Linear 방식 재확인** — "시각적 다양성 ≠ Plot 코어" 영구 규칙. Notion 패턴 시도 후 사용자 피드백으로 회귀. 토글 옵션 적게 (진짜 필요한 것만)
- **5 앱 리서치 결과 P0 4개 / P1 3-5개 / P2 3개 도출** — Linear / Notion / Obsidian / Capacities / Bear 분석. anti-pattern 명시
- **Sub-group 인프라 발견** — `ViewState.subGroupBy` + `applyGrouping` 재귀 + `NoteGroup.subGroups` 모두 구현됨. Notes만 의미 있음 (Wiki/Library는 비추)
- **Saved View 이미 구현** — `lib/store/slices/saved-views.ts` + linear-sidebar `createSavedView`. 검증만 필요. P1에서 제외

**Store version**: v91 → v92 → v93

**다음 세션 (다른 컴퓨터)**: P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) 한 PR로 묶음 + Wiki 1차 groupBy 별도 PR

---

## 🟢 2026-04-27 — Doc sync + group-header + attachment drag-drop + 시계열 메트릭

**완료**:
- Doc sync (SESSION-LOG / NEXT-ACTION / TODO를 PR #218 시점으로 정합성 회복)
- TipTap InfoboxBlockNode `"group-header"` row 타입 지원 (collapse + 8 컬러 프리셋 + custom hex). 위키 인포박스와 일관성 회복
- FileHandler onDrop/onPaste 구현 — 이미지 드래그/스크린샷 paste 자동 attachment
- 시계열 메트릭 — `lib/insights/timeseries.ts` `computeWikiTimeSeries` (day/week/month 버킷) + `wiki-growth-chart.tsx` (recharts AreaChart + BarChart, ResizeObserver 패턴) → Wiki Dashboard 통합

**큰 결정 (영구)**:
- **Wiki Y.Doc 폐기** — WikiBlock 배열 구조라 Note 패턴 직접 적용 불가. 블록 단위라 race 표면적 작음. 안 해도 안전
- **AI provider 폐기** — "LLM 없이 규칙/통계/그래프" 코어 정체성 위반

**출시 방향 논의 진행** (다음 세션 결정):
- Google Play Store + 마케팅 웹사이트 출시 의향
- 모바일 전략: PWA → TWA 추천
- 출시 전 부족 영역: 온톨로지 / 캘린더 / 노트·위키 템플릿

---

## 🟢 2026-04-26 — Plot 디자인 + 인사이트 대규모 (9시간 세션, 9 PR + 핫픽스)

**핵심 결정**:
- **Home = 데이터 대시보드 + 빠른 진입** (시간 기반 X). Quick Capture / Stats (컬러) / Recent (4 카드) / Quicklinks (Mixed pinned 통합) / CTA. max-w-5xl.
- **Ontology = Single Source of Insights**. 모든 정비 행동(Orphan/Promote/Unlinked/메트릭) Ontology Insights 탭으로 이전. 새 메트릭: Knowledge WAR / Concept Reach / Hubs / Density / Coverage / Tag Coverage / Cluster Cohesion.
- **Pinned 통합 시스템**: Note + Wiki + Folder + SavedView + Bookmark (글로벌) 모두 Mixed Quicklinks에 통합. WikiArticle.pinned 신설 (Store v87).
- **나무위키 Tier 2-4 완료**: 배너 블록 (4 다채로움) + age/dday 매크로 + Include 양방향 + 각주 이미지 + 위키 parent-child. 루비 텍스트는 사용자 결정으로 제거 (한국어 fit X).
- **인포박스 Type 11 프리셋 + 그룹 토글** + Navbox 풀 디자인 (Editorial-Imperial, 다단/그룹/색상/그리드/펼치기) — 둘 다 사용자 비전 그대로 구현.
- **Connections 풀 강화**: 블록 단위 인라인 스니펫 + 호버 풀 프리뷰 + mention 처리 + 위키 source contentJson scan + mention IDB 인덱스 캐시 (O(1) 룩업).
- **Y.Doc PoC → 본 구현 (P0-1 부분)**: y-indexeddb 영속화 + 4 race guard 유지 + side issue (plot-note-bodies / duplicate extensions) 정리.

**Store version**: v82 → v91 (9 마이그레이션, 모두 안전). 핵심: v86~v91은 핫픽스 (infobox undefined / 위키 article pinned / dedup).

**다음 작업 후보**:
- PR 9: 시계열 메트릭 + Wiki Dashboard 통합
- TipTap InfoboxBlockNode group-header 지원 (작은 폴리시)
- P0-2: Wiki Y.Doc 적용 (위험)

---

## 🟢 2026-04-25 — 코멘트 시스템 대규모 + 사이드패널 통합 + 미니맵

**한 세션 18 커밋 — Plot 코멘트 인프라 구축 + 노트/위키 사이드패널 대칭 통합 + 디자인 폴리시.**

### 새로 추가된 시스템

**Comment 시스템 (신규)**:
- Linear 스타일 status: Backlog/Todo/Done/Blocker
- 1단계 답글 (parentId)
- CommentAnchor 4종: note, note-block, wiki, wiki-block
- 인라인 진입점: 위키 모든 블록 8종 + 노트 모든 블록 (BlockDragOverlay 패턴)
- 사이드패널 Activity → CommentsByEntity (블록 + 엔티티 통합)
- Convert to Note 액션 (코멘트 → inbox 노트로 promote)

**통합 작업**:
- Activity 통합: ThreadPanel/ReflectionPanel 폐기 → CommentsByEntity 단일
- Bookmarks 통합: targetKind ("note"|"wiki") + Filter chips + Search
- Connections 통합: 위키 incoming wikilink 추가
- Pin → Bookmark 네이밍 통일 (BookmarkSimple 아이콘)
- Wiki SECTIONS 섹션 제거 (Detail Outline과 중복)

**Navbox 하이브리드** (Wiki 표준 호환):
- Auto: 카테고리 자동 필터 (편의)
- Manual: WikiPickerDialog로 직접 선택 (Wikipedia/나무위키 정통)
- 둘 다 지원, 모드 토글

**미니맵 (Document-level 드롭다운)**:
- Phosphor 아이콘 통일 (이모지 전부 제거)
- 블록 타입별 컬러 stripe (note-ref=blue, image=emerald 등)
- 섹션 = accent 번호 badge (1, 1.1, 2.3.1 — H 아이콘 제거)
- Plot 디자인 시스템과 일관

### 데이터 모델 변경
- Store v76 → **v80** (4 마이그레이션 — v77/v78/v79/v80)
- v77: Comment.status + parentId
- v78: Reflections/Threads → Comments 마이그레이션
- v79: status "note" → "backlog"
- v80: GlobalBookmark.targetKind 백필

### 정책 결정
- **Comment 본질**: 가벼운 메모. 풀 에디터 툴바 X. 라이트 tier (마크다운 + 위키링크 + 해시태그)
- **노트/위키 대칭**: 모든 블록에서 인라인 코멘트 가능 (B 옵션 선택)
- **Pin = Bookmark**: 시각/네이밍 통일

### 다음 방향
- Connections 상세 (어느 블록/코멘트에서 링크되는지 — 별도 7시간 작업으로 미룸)
- TipTap 미니 에디터 추가 발전 (필요시)
- ~~미니맵 G 진화~~ — **폐기 (2026-04-25)**: 현 Document-level 드롭다운으로 충분, 좌/우 항상 보이는 미니맵은 불필요

---

## 🟢 2026-04-23 — Wiki visual polish + PR #215

**PR #215 (2026-04-23, 머지 대기)**:
- Graph → Ontology rename (5파일)
- Encyclopedia TOC: dark-only hardcoded → 디자인 토큰 (라이트/다크 호환)
- 두 모드 공통 updatedAt "최근 수정: N시간 전"
- Default TOC 헤더: "Contents" → "목차" 조용하게
- IDB fix: `plot-note-bodies` DB_VERSION 2 (bodies store 복구)

---

## 🟢 2026-04-22 상태 — Hard reset to PR #194

**현재 branch HEAD**: `3f2e54c` (PR #194: "Tier 1 인포박스 전체 완료 + 위키 디자인 버그 수정")

**대결정**: PR #195 ~ #213 (2026-04-14 저녁 ~ 2026-04-21) 전부 폐기. 2주간 "대결정" 3회 반복 (Column Template → Page Identity → Book Pivot) 패턴 종결.

**폐기 대상**:
- WikiTemplate + 8 built-in (#197)
- 컬럼 시스템 (ColumnRenderer, WikiColumnMenu 등, #198-#205)
- 메타→블록 통합 (infobox/toc 블록화, #208)
- Page Identity Tier 시스템 (#209)
- Book Pivot 5 shell (#211-213)

**유지**:
- Tier 1 인포박스 전체 (heroImage + 헤더 색상 + 섹션 구분 + 리치텍스트 + themeColor)
- Y.Doc PoC + Block Registry (#192)
- 각주 / References / Split View / Library / Expand-Collapse 등
- Default + Encyclopedia 2-layout toggle

**자각**: "매거진/뉴스페이퍼/북 등등은 개발자 자기만족". Plot 코어(지식 관계망, 팔란티어×제텔카스텐)와 직교.

**다음 방향**: **UI 일관성 감사 + 개선**. 사용자 pain point "ui가 너무 이상함, 일관성 없고" 해결. 기능 추가는 당분간 보류.

**⚠️ Git 주의**: 이 branch가 hard reset 상태. `git merge origin/main -X theirs` 실행 시 롤백 자동 취소됨. 곧 commit + PR 해서 main에 반영 필요.

**Claude memory 참조**: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

---

## Identity

Plot = 노트 + 개인 위키 + 지식 관계망
- 겉은 Apple Notes, 속은 Zettelkasten
- 유저는 노트만 쓰고 앱이 알아서 제텔카스텐
- 사상: 팔란티어 × 제텔카스텐 — 개인 지식을 디지털 모델로 만들고 분석/사고/글쓰기를 돕는다

## Architecture Redesign v2 — ALL PHASES COMPLETE ✅

### 4-Layer Architecture

```
Layer 1 — Raw Data:    노트, 태그, 라벨, 폴더, 템플릿
Layer 2 — Ontology:    관계, 분류, co-occurrence (엔진)
Layer 3 — Wiki:        표현 계층 (정리된 참고자료)
Layer 4 — Insights:    패턴 발견 (건강검진)
```

### 구현 Phase (전부 완료)

1. Foundation (v41 wikiStatus, v42 workspaceMode, activeSpace) ✅
2. Layout Automation (WorkspaceMode, auto-collapse) ✅
3. Activity Bar + Top Utility Bar ✅
4. Sidebar Refactor (컨텍스트 반응형) ✅
5. Breadcrumb ✅
6. Wiki Evolution (자동 등재, 초성 인덱스, 목업 매칭) ✅
7. Wiki Collection (Collection slice v43, WikiQuote→WikiEmbed 대체, Extract as Note, Collection sidebar, Red Links) ✅
8. Split View + Library + Reference/Footnote system (v71) ✅

## Current Architecture (현재 코드 기준)

### Store
- Zustand + persist (IDB storage via `lib/idb-storage.ts`)
- Slices (22): notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories, references, global-bookmarks
- Store version: 95
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- Responsive NotesTable: ONE grid for all sizes (ResizeObserver + minWidth thresholds)
- 6 Activity Spaces: Inbox / Notes / Wiki / Calendar / Graph / Library
  - Library: 서브라우트 4개 (`/library`, `/library/references`, `/library/tags`, `/library/files`), 사이드바 NavLink (Overview/References/Tags/Files)

### Editor
- TipTap 3 editor — Shared config factory (`components/editor/core/shared-editor-config.ts`)
- 4-tier extension system: `base` | `note` | `wiki` | `template`
- Title 노드 통합: 제목과 본문이 하나의 TipTap 문서 (`components/editor/core/title-node.ts`)
- 25+ extensions (StarterKit, TaskList, Highlight, Link, Table, CodeBlockLowlight, Mathematics, SlashCommand, HashtagSuggestion, WikilinkSuggestion, WikilinkDecoration, FootnoteRefExtension, @mention (노트/위키/태그/날짜 통합), Floating TOC, Anchor/Bookmark, etc.)
- Toolbar: h-14 (56px) bar, w-10 (40px) buttons, Remix Icon (에디터 전용, `lib/editor/editor-icons.ts` barrel). 34 configurable items via Arrange Mode (dnd-kit). Persisted in settings store. More Actions: Pin+Favorites+서브패널
  - Indent Extension: `indent-extension.ts` — paragraph/heading indent 0-8단계 (24px/level, Notion 방식)
- Workspace: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- WorkspaceMode 삭제됨 — sidebarCollapsed + detailsOpen 독립 토글
- Split View 시스템 (PR #172-173): PaneContext + route intercept 패턴. Primary/Secondary 독립 패널. SmartSidePanel primary/secondary 분리. 4-column flat layout (layout.tsx + WorkspaceEditorArea). secondarySpace URL state, secondary history navigation
- Wiki-links: `[[title]]` extracted to `Note.linksOut`
- Wiki tier = note tier와 동일한 인라인 제안: `[[` 위키링크, `@` 멘션(노트/위키/태그/날짜/레퍼런스), `#` 해시태그 (PR #182)
- Wiki 문서 레벨 각주: `WikiFootnotesSection` — 위키백과 스타일 하단 통합 목록. FootnoteRefExtension `addStorage({ footnoteStartOffset })` + 블록별 offset 전달로 문서 전체 연번 (PR #182)
- NoteHoverPreview: `layout.tsx` 글로벌 마운트 (노트+위키 모두 호버 프리뷰 동작) (PR #183)
- 공유 유틸: `lib/wiki-block-utils.ts` + `hooks/use-wiki-block-actions.ts` + `wiki-layout-toggle.tsx` (PR #182)

### Knowledge System
- Backlinks: `lib/backlinks.ts` (incremental index, keyword/tag scoring, alias support)
- Search: FlexSearch worker-based (`lib/search/`) with IDB persistence
- Ontology Engine: co-occurrence engine, relation suggestions, wiki infobox, graph view
- Graph: `ontology-graph-canvas.tsx` — SVG 기반, Web Worker 레이아웃, viewport culling, LOD zoom, 노드 형태 분화, 3-tier 엣지

### Wiki Collection System (Phase 7)
- `WikiCollectionItem` type: note | url | image | text
- `wikiCollections: Record<string, WikiCollectionItem[]>` keyed by wikiNoteId
- Edit mode sidebar: Related (auto) + Collected (manual) + Red Links
- WikiQuote: TipTap custom node (atom, blockquote style with source attribution)
- Extract as Note: bubble menu button, creates note + replaces with [[link]]
- Link insertion: click Related/Collected → insert [[title]] at cursor
- Quote insertion: Shift+click → insert WikiQuote block

### Note Lifecycle (병렬 트랙)

```
노트 워크플로우:  inbox → capture → permanent   (처리 상태)
                    ↕        ↕        ↕         (어느 시점에서든 진입 가능)
위키 품질 트랙:   red link → stub → article     (완성도, WikiArticle 별도 엔티티)
```

### Labels vs Tags
- Labels → 노트 타입 (무엇인가): 메모, 리서치, 아이디어
- Tags → 노트 주제 (무엇에 관한 것인가): #투자 #사주 #독서

## Completed Features (최근 5개, 전체는 docs/MEMORY.md 참조)

1. **인포박스 Tier 1-2/1-4 + Default 통합 + 섹션 구분 행 (2026-04-14 밤)**: 나무위키식 인포박스 전면 고도화. **3개 경로 모두 지원** — (A) TipTap `InfoboxBlockNode` (노트 에디터 + 위키 TextBlock 내부 `/infobox`), (B) `WikiInfobox` 컴포넌트 (위키 encyclopedia), (C) **위키 Default 레이아웃에도 동일 인포박스 렌더** (`wiki-article-view.tsx` Aliases 뒤 + Category 앞, encyclopedia와 동일 center/float-right 분기). **사이드바 Infobox 섹션 제거** (`wiki-article-detail-panel.tsx`) — 중복 해소. **Tier 1-2 헤더 색상**: 프리셋 8종 (Default/Blue/Red/Green/Yellow/Orange/Purple/Pink, rgba 0.35) + 커스텀 `<input type="color">` (hex→rgba). `WikiArticle.infoboxHeaderColor?: string | null` + `headerColor`/`onHeaderColorChange` props. PaintBucket 버튼 `showColorPicker || headerColor` 상시, 아니면 hover. 팝오버 `absolute right-2 top-[calc(100%+4px)]`. `onHeaderColorChange` 없으면 피커 자동 숨김 (read-only 자동 대응). **Tier 1-4 섹션 구분 행**: `WikiInfoboxEntry.type?: "field" | "section"` optional 필드 + TipTap `InfoboxRow` 동일. Section row = full-width bold uppercase + tinted bg (`bg-secondary/40`) + value 숨김. Edit UI에 "Add section" 버튼 (Add field와 나란히). **Migration 없음** — 전부 optional 필드. verify: 3경로 모두 렌더 + layout 전환 시 색/섹션 유지 확인. **중장기 TODO**: `WikiInfobox` → `InfoboxBlockNode` 통합 (base 티어 단일화).
2. **Insert Block Registry 단일화 (2026-04-14 밤)**: `components/editor/block-registry/` 신설. 25+ insertable block operations 단일 source. 기존 3곳 중복 제거: SlashCommand.tsx (COMMANDS 배열 → `getBlocksForSurface("slash")`), insert-menu.tsx (JSX 하드코드 → `BLOCK_REGISTRY.filter` + group 정렬), FixedToolbar.tsx (인라인 체인 13개 → `getBlock(id).execute({ editor })`). Shape: `{id, label, description, aliases, icon, surfaces, group, tier, execute({editor, range?, noteId?})}`. range 유무로 slash path(blank attrs) vs click path(example attrs) 분기. 첨부(Image/File)는 ref 의존성으로 registry 제외. 검증: InsertMenu 20 항목 렌더 + Callout(HTML 344→2590) + Divider(hr 0→1) + Toggle(details 0→1) + Slash popup 25+ 항목. 이제 새 블록(배너, 둘러보기 틀)은 registry.ts 한 파일에 entry 추가만으로 3곳 자동 노출.
3. **Y.Doc Split-View Sync PoC (2026-04-14)**: 같은 note를 두 pane에서 열면 Y.Doc 싱글톤이 공유되어 실시간 bidirectional CRDT sync 작동. `lib/y-doc-manager.ts` (refcount registry + isFresh flag), `@tiptap/extension-collaboration` 바인딩, `?yjs=1` / `window.plotYjs(true)` / localStorage 3-way feature flag. Dev-only `window.__plotStore` 노출. 핵심 버그 4개 해결: (1) StarterKit 3.x는 `undoRedo` (`history` 아님) — Collaboration과 충돌 해소, (2) `fragment.length === 0` seed guard 제거 (Collab pre-populate 때문에 영원히 truthy) — `isFresh` 플래그로 권위 있는 signal 사용, (3) **Stale Y.Doc binding** — `useState + useEffect` 패턴이 note 전환 시 한 렌더 사이클 동안 이전 Y.Doc 노출 → 새 editor가 이전 Y.Doc에 seed → 다른 pane으로 CRDT 전파 → 데이터 영구 손실. `useRef` + 렌더 중 동기 전환으로 교체, (4) **Empty-content guard의 임계값 실패** — `JSON.stringify(json).length < 80` 조건이 Collab pre-populate의 UUID-stamped 빈 paragraph (~125자)에 무효화됨. `looksEmpty = !plainText.trim()` 로 단순화 + `ui.ts` auto-delete 연쇄로 노트 소멸까지 이어짐.
4. **PR #190**: Reference Usage + Note History + Wiki Activity 정리 + chevron 비활성 — 사이드패널 Usage 섹션, ActivityTimeline 연결, Wiki Stats 중복 제거, 접을 게 없을 때 비활성
5. **PR #189**: Expand/Collapse All + 위키 TOC 버그 + TextBlock 드래그 핸들 + 리사이즈 — 나무위키식 전체 접기/펼치기, TocBlockNode wiki 티어 등록, BlockDragOverlay 위키 통합, 4코너 리사이즈 + Store v75

## Two Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
```

> Relations(공간축)은 UI에서 삭제 — 백링크+위키링크+Discover 추천으로 충분. store slice는 유지.

## Key Design Decisions

- **LLM/API 사용 안 함** — 전부 규칙 기반 + 통계 기반 + 그래프 알고리즘. 오프라인, 프라이버시, 비용 0
- **독립 공간 구조 유지, 노션식 통합 템플릿 폐기** — 5개 공간이 각각 최적화된 UX 제공. "유저는 노트만 쓰고 앱이 알아서" = IKEA 전략. 노션식 "빈 캔버스 + 블록 조합" 방향 포기 (2026-04-01)
- **Activity Bar 6-space**: Inbox / Notes / Wiki / Calendar / Graph / Library — Library 6번째 공간 추가 (PR #165, 2026-04-08)
- **Wiki 사이드바 4-항목**: Overview / Merge / Split / Categories (+ Views 섹션). Categories = 2-panel 트리 에디터
- **Wiki Layout 프리셋**: `"default" | "encyclopedia"` — article별 전환. Encyclopedia = 나무위키식 (인라인 인포박스, 목차, 분류 태그)
- **Wiki URL 블록**: 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에서 추가
- **WikiStatus 삭제**: stub/article 구분 폐지 (v67). 위키 문서는 존재하거나 Red Link(computed)만 (2026-03-31)
- **isWiki→noteType**: `Note.isWiki: boolean` 삭제 → `noteType: "note" | "wiki"` 디스크리미네이터 (v66, 2026-03-31)
- **Home = Knowledge Intelligence Panel**: Inbox 독립 공간 폐지 → Home 대시보드. 사이드바에 Unlinked Mentions/Suggestions/Orphans/Knowledge Health 실시간 지식 인텔리전스. 사이드바 클릭 → 메인 영역 드릴다운 (Linear 패턴) (2026-03-31)
- **Ontology 네이밍**: Activity Bar "Graph" → "Ontology". 사이드바 Graph 아이콘 → ChartBar (2026-03-31)
- **Wiki Coverage→Uncategorized**: 대시보드 3번째 지표. Coverage(모호) 제거 → Uncategorized(카테고리 없는 문서 수) (2026-03-31)
- **Display = List/Board만**: Insights/Calendar는 사이드바/Activity Bar 전용
- **Graph Health → /graph-insights 페이지**: 사이드바는 필터/컨트롤 패널
- **필터/디스플레이 먼저, 사이드바 정리 나중에**: 기능이 동작해야 사이드바 의미 있음
- **Phase 4-D Context Panel 보류**: 각 공간별로 이미 컨텍스트 패널 존재
- **글로벌 탭 도입 안 함**: 멀티패널과 역할 충돌. 사이드바가 탭 역할 수행. Linear는 멀티패널이 없어서 탭 필요하지만 Plot은 사이드바+멀티패널로 커버
- **View = 사이드바 섹션**: Linear의 View(상단 탭 프리셋)를 사이드바 Views 섹션으로 구현. 한눈에 전체 구조 파악 가능, 액티비티별 독립
- **+ 버튼 = ViewHeader 우측**: top-utility-bar에서 제거, ViewHeader의 필터 아이콘 옆 `+` 아이콘으로 통일
- **위키 카테고리 = 계층적 트리**: 태그/라벨은 flat(동등), 카테고리만 parentId 기반 트리. 위키백과식 지식 분류 체계
- **카테고리 페이지 = 사이드바 최상위**: Overview/Merge/Split과 동급. List + Board 2모드
- **카테고리 List/Board 2모드**: Tree 모드 제거 완료. Board = Tier별 3칼럼(1st/2nd/3rd+), dnd-kit 드래그로 계층 이동
- **카테고리 Tier 네이밍**: depth 0=1st, depth 1=2nd, depth 2+=3rd+ (무한 depth 허용, Board에서 3rd+ 합침)
- **카테고리 우측 사이드바 3상태**: 미선택=All Overview, 단일선택=Category Detail, 멀티선택=Batch Actions
- **Family 그룹핑**: 같은 루트 조상 아래 전체를 묶고 들여쓰기로 depth 표현 (리스트+트리 하이브리드)
- **캘린더 플로팅 액션바 삭제**: 불필요하다고 판단 (2026-03-25)
- **TopUtilityBar 제거**: Back/Forward/Search를 사이드바 헤더로 이동. 44px 공간 확보 (2026-03-26)
- **사이드바 닫기/열기 = Plane식**: 닫으면 완전 숨김. ActivityBar 상단 열기 버튼. space 클릭으로 열리지 않음 (2026-03-26)
- **우측 사이드바 = Details 패널**: ViewDistributionPanel 삭제. 사이드바 버튼으로만 열림. previewNoteId로 리스트 행 클릭 시 내용 업데이트 (2026-03-26)
- **Priority UI 완전 삭제**: 디테일 패널에서도 제거. Pin + Labels로 충분 (2026-03-26)
- **sidePanelOpen persist 안 함**: 앱 시작 시 항상 닫힌 상태 (2026-03-26)
- **Relations UI 삭제**: 백링크+위키링크+Discover 추천으로 공간축 충분. store slice 유지, UI만 제거 (2026-03-28)
- **Connections = Connected+Discover 2섹션**: Connected(← inbound notes/wiki, → outbound notes/wiki, unlinked mentions) + Discover(추천 notes/wiki/tags). 방향 화살표로 직관적 구분 (2026-03-28)
- **Peek wiki fallback**: wiki article ID → title match → note lookup. 위키 블록 직접 편집은 Phase 2A 스코프 (2026-03-28)
- **Side Panel = Unified SmartSidePanel**: 4-tab: Detail + Connections(Connected/Discover) + Activity(Thread/Reflection) + Bookmarks. Peek as fallback. Relations UI 삭제. primary/secondary 독립 패널 (PR #173)
- **Split View = PaneContext + route intercept**: 4-column flat layout (layout.tsx + WorkspaceEditorArea). secondarySpace URL state. secondary history navigation. SmartSidePanel primary/secondary 분리 (PR #172-173)
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 280px 사이드바 제거, 글로벌 Details 패널에서 표시. Notes와 동일 패턴 (2026-03-26)
- **카테고리 더블클릭 에디터**: 싱글클릭=선택(하이라이트만), 더블클릭=폼 에디터 split view. 이름/설명 인라인 편집, Parent 드롭다운, 서브카테고리 +New/Move here (2026-03-26)
- **노트 ≠ 위키**: Note와 WikiArticle은 완전 별도 엔티티. isWiki→noteType 리팩토링 완료 (2026-03-31)
- **Stub 부활 (heuristic 방식)**: 상태 필드 없이 블록 수 + 내용 비어있음으로 판정. 기본 템플릿(Overview/Details/See Also) 에서 변경 없으면 stub. 블록/내용 추가 → article 자동 승격 (2026-04-05)
- **Note/Wiki 2-entity 철학 확정 (2026-04-14)**: 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. Note / WikiArticle 별도 엔티티 유지. **차별점의 원천 = 데이터 구조** (TipTap JSON vs WikiBlock[]). 렌더러(Layout Preset)는 위키 전용 — 노트엔 만들지 말 것. 자세한 배경은 `BRAINSTORM-2026-04-14-entity-philosophy.md`
- **위키 템플릿 3층 모델 (2026-04-14)**: Layer 1 Layout Preset (렌더러, default/encyclopedia/wiki-color) + Layer 2 Content Template (섹션+인포박스 뼈대, Person/Place/Concept 등 타입별) + Layer 3 Typed Infobox (C-3). 노트 템플릿은 별개 시스템 (NoteTemplate slice, UpNote식 단순 복사 시드)
- **[[드롭다운 Create Note + Create Wiki**: 노트는 inbox에 생성, 위키는 빈 WikiArticle(stub) 생성. 위키 아이콘 = IconWiki (액티비티바 통일) (2026-04-05)
- **Auto Create 방향 결정 (미구현)**: Red Link → "Unresolved Links"로 개념 전환. 빨간색→회색 점선, 클릭 시 노트/위키 선택 팝업. Wiki에서 Red Links 제거 → Home "Unresolved Links"로 통합 (2026-04-05)
- **인사이트 중앙 허브 방향 결정 (미구현)**: 온톨로지 = 모든 인사이트의 원천 (Single Source of Insights). Notes/Wiki 각 공간 인사이트는 온톨로지에서 파생. 세이브매트릭스급 지표 (Knowledge WAR, Link Density, Stub Conversion Rate 등) (2026-04-05)
- **@멘션 = 노트/위키/태그/날짜 통합**: `@` 트리거, WikiArticle 별도 검색, 카테고리별 그룹핑 (2026-03-30)
- **플로팅 TOC = Notion 스타일**: 에디터 우측 자동 사이드바, 대시 인디케이터, hover 확장, scrollspy. 첫 heading(타이틀) 제외 (2026-03-30)
- **앵커/북마크 2종**: 인라인 마커(anchorMark) + 블록 구분선(anchorDivider). TOC + 사이드패널 Bookmarks 탭 통합 (2026-03-30)
- **Columns = CSS Grid + 테이블 스타일 border**: renderHTML 기반 columnCell, resize handle, 외곽선+셀간 border-right (2026-03-30)
- **Make Block 폐기**: Turn Into가 대체. 래퍼로 감싸는 UX가 직관적이지 않음 (2026-03-30)
- **디자인 폴리싱 방향 = Notion**: Linear 레이아웃 + Notion 에디터 블록 디자인 참고 (2026-03-30)
- **TOC = 수동 + 블록피커**: 자동 헤딩 수집 제거. + 버튼 = 문서 내 모든 블록 검색 피커, 1클릭으로 항목+링크 생성. 더블클릭 편집, 드래그 순서변경, Tab 들여쓰기 (2026-04-01)
- **Merge Blocks**: 멀티 선택 → hardBreak로 하나의 paragraph 병합 (Make Block 대체). Wrap in(Callout/Summary/Block) 별도 유지 (2026-04-01)
- **Toggle = 노션식 (배경 없음)**: border/background 제거. ▶+텍스트 flex 한 줄. 접힌 내용은 left-border 들여쓰기 (2026-04-01)
- **Side-drop 컬럼 자동생성 제거**: 드래그로 columns 안 만들어짐. Insert 메뉴로만 생성 (2026-04-01)
- **인포박스 읽기모드**: readOnly + 삭제/추가 버튼 숨김. Add row = hover-only (2026-04-01)
- **Memo 라벨 자동 부여**: 노트 생성 시 labelId 없으면 "Memo" 라벨 자동 할당. 없으면 자동 생성. 기존 노트도 rehydrate 시 backfill (2026-04-01)
- **Delete Block 우클릭 메뉴**: 모든 블록에 적용. details/columns 같은 compound 블록은 skipTypes로 올바른 depth 탐색 (2026-04-01)
- **드래그 핸들 블록 메뉴**: ⠿ 짧게 클릭=메뉴(Turn Into/Insert Below/Duplicate/Move/Delete), 누르고 5px 이동=드래그. pointerUp + pointerEvents 전환 (2026-04-01)
- **Embed Note = 노트 피커**: Insert→Embed Note 클릭 시 NotePickerDialog 열림. 선택한 noteId로 미리보기 카드 삽입. Synced Block(본문 편집)은 Phase 2+ (2026-04-01)
- **WikiQuote 폐기**: WikiEmbed가 상위 대체. 호버 프리뷰 Quote 버튼 + insert-wiki-quote 이벤트 + WikiQuoteExtension/Node 전부 삭제 (2026-04-06)
- **Footnote = "에디터 접점", Reference = "저장소"**: `/footnote` 슬래시 커맨드, `[[`/`@` 드롭다운 모두에서 각주 생성/참조 가능. 유저는 Footnote만 알면 됨, Reference는 뒤에서 자동 생성 (2026-04-06)
- **에디터 아이콘 = Remix Icon**: Phosphor light → Remix. 에디터 전용, 나머지 앱 UI는 Phosphor 유지. `lib/editor/editor-icons.ts` 중앙 barrel 101매핑 (2026-04-07)
- **Indent = margin-left 레벨**: blockquote 감쌈 폐기 → 24px 단위 8단계 (Notion 방식). `indent-extension.ts` (2026-04-07)
- **More Actions = 풀 기능 허브**: Pin 고정, 우클릭 Favorites (persist), 서브패널 (컬러피커/테이블/이미지). 에디터 모든 기능 접근 가능 (2026-04-07)
- **Embed Note 기본 Synced**: 삽입 시 전체 내용 인라인 표시. Preview 카드는 토글로 전환 (2026-04-07)
- **WikiEmbed 높이 무제한**: max-h 제거, 위키 문서 전체 펼침. 리사이즈 시 스크롤 (2026-04-07)
- **Math 툴바 기본 hidden**: SlashCommand로 접근. Arrange Mode에서 복원 가능 (2026-04-07)
- **Reference = 인포박스식 자유 키-값**: `fields: Array<{key,value}>`. Type 없음 — 앱이 content에서 URL/연도 자동 감지. Quick Note(fields 비면)→Full Reference(fields 있음) heuristic (2026-04-06)
- **Library = References + Tags(글로벌) + Files**: 6번째 Activity Bar 공간. Labels는 노트 전용 유지, Tags만 글로벌 승격 (2026-04-06)
- **Library 사이드바 NavLink**: 상단 탭 제거 → 사이드바 NavLink (Overview/References/Tags/Files). Wiki 패턴 동일 (2026-04-07)
- **Reference 디테일 = SmartSidePanel**: 별도 풀페이지 에디터 없음. Title/Content/Fields 사이드패널 편집 (2026-04-07)
- **Reference에 Tags 없음**: fields(key-value)가 메타데이터 역할. Tags는 노트/위키 전용 (2026-04-07)
- **각주→Reference 자동 연결**: footnote save 시 referenceId 없으면 자동 createReference. content 양방향 동기화 (2026-04-07)
- **각주 타임라인**: createdAt 자동 기록 + Reference.history로 수정 이력 (2026-04-06)
- **Tags Library 통합**: Notes "More"에서 Tags 제거, `/library/tags`로 통합. Capacities 패턴 (2026-04-08)
- **References/Files soft delete**: trashed/trashedAt 필드, 복원 가능. Store v71 (2026-04-08)
- **Reference = 통합 참고자료 (옵션3 하이브리드)**: url 필드 있으면 Link형, 없으면 Citation형으로 자동 분기. 새 엔티티 없이 Reference 하나로 통합. 위키백과 철학 차용 — `[[]]`=내부링크, 각주=하단URL, referenceLink=외부링크(🔗 시각 구분). `[[`/`@` 드롭다운에서 url 있으면 referenceLink 노드, 없으면 footnoteRef 노드 자동 삽입. Shift+클릭=반대 모드. Quick Filter에 Links 추가 (2026-04-08)
- **위키 레이아웃 프리셋 = 공유 유틸 추출**: 1파일 통합 대신 순수 함수/훅/컴포넌트 추출 방식. 두 렌더러(Default/Encyclopedia)의 구조적 차이가 커서 통합 시 분기 20개+ 발생 (2026-04-12)
- **위키 문서 레벨 각주 = offset 방식**: 블록별 `footnoteStartOffset`으로 문서 전체 연번. `onFootnoteCount` 콜백으로 블록별 각주 개수 수집 → 누적 offset 계산 (2026-04-12)
- **EncyclopediaFooter 삭제**: 사이드바에서 이미 Sources/Properties 표시. 본문 중복 제거 (2026-04-12)
- **드롭다운 아이콘 색상 체계**: Wiki stub=#f59e0b(주황), article=#8b5cf6(보라). CircleDashed/CircleHalf/CheckCircle는 Phosphor 직접 import (Remix 매핑 부정확) (2026-04-12)
- **NoteHoverPreview 글로벌**: TipTapEditor에서 layout.tsx로 이동. 위키 텍스트 블록에서도 호버 프리뷰 동작 (2026-04-12)
- **위키 텍스트 블록 click-outside 가드**: `.tippy-content` + Radix Portal + `role=menu/dialog` 클릭은 "내부"로 인식 (2026-04-12)
- **FootnoteEditModal = Reference 모달 통합**: Title+Content+URL 3필드. 각주/레퍼런스 동일 UX. 인라인 미니 에디터 폐기 (atom node 포커스 충돌) (2026-04-12)
- **위키 하단 References 섹션**: Footnotes(번호) + References(불릿) 위키백과 2단 구조. WikiArticle.referenceIds로 문서↔Reference 직접 연결 (2026-04-12)
- **Reference 사이드패널 = Library 전용**: 위키에서는 모달로 편집 (사이드패널 context 고착 방지) (2026-04-12)
- **footnote 에디터 티어**: StarterKit 최소 + Link + Underline. 테이블/이미지/슬래시/멘션 제외 (2026-04-12)
- **각주 read-only 가드**: footnote-node.tsx + footnotes-footer.tsx — `editor.isEditable` 체크. 리드 모드에서 모달 안 열림 (2026-04-13)
- **위키 footnote 삽입 버그 수정**: footnote-edit-modal.tsx에 `role="dialog"` 추가. 위키 TextBlock click-outside 가드가 모달을 "외부"로 인식해 에디터 언마운트 → debounce 저장 실패하던 문제 해결 (2026-04-13)
- **위키 Footnotes/References 컴팩트 디자인**: TipTap EditorContent 제거 → 단순 텍스트. `▶ FOOTNOTES N` / `▶ REFERENCES N` 토글. text-base 헤더 + text-[14px] 내용 (2026-04-13)
- **노트 References 하단 섹션**: `footnotes-footer.tsx` NoteReferencesFooter 컴포넌트. 각주 referenceId 수집 → `▶ REFERENCES N` 불릿 목록. 기본 collapsed (2026-04-13)
- **Footnotes+References 분리 유지 (확정, 2026-04-13)**: 합치기 논의 후 번복. FOOTNOTES(번호 각주)와 REFERENCES(불릿 참고자료) 2개 섹션 분리. 라이브러리 References와 이름 같아도 OK (같은 엔티티, 다른 스코프)
- **노트 References 시스템 (2026-04-13)**: `Note.referenceIds: string[]` + Store v74. NoteReferencesFooter 모달(검색/생성/편집 3모드). Insert/`/reference`/하단 `+` 진입점. `[[`/`@`는 항상 FootnoteRef [N]만 (불릿은 인라인 삽입 도구에서 넣지 않음)
- **Reference 아이콘 = Book (RiBookLine)**: Bookmark(BookmarkSimple)/BookOpen/Article과 구분 (2026-04-13)
- **em 기반 fontSize cascade (2026-04-13)**: 위키 타이틀/섹션/각주의 rem/px Tailwind 클래스를 em으로 전환. 글로벌 Aa 스케일 + 섹션별 개별 fontScale 동시 동작. fontScale은 섹션 wrapper에 적용 (개별 heading X)
- **위키 텍스트 display 컴팩트 (2026-04-13)**: `.wiki-text-display` 클래스. ProseMirror min-height:unset + p margin:0. 편집→읽기 전환 시 간격 차이 해소
- **Expand/Collapse All = 나무위키 패턴 (2026-04-13)**: 노트 chevron 버튼(PushPin 왼쪽) + 위키 기존 버튼 확장. `plot:set-all-collapsed` CustomEvent 브로드캐스트. Details/Toggle + Summary + Footnotes + References 전부 대상. 노트: hasCollapsibles 조건부 표시, Details `open` attr 일괄 토글. 위키: 기존 섹션 접기 + 내부 collapsible + footer까지
- **위키 TOC 버그 수정 (2026-04-13)**: TocBlockNode + TableOfContents가 note 티어에만 등록되어있던 버그. wiki 티어에 추가 (`shared-editor-config.ts`)
- **위키 TextBlock 드래그 핸들 (2026-04-13)**: `WikiTextEditor`에 `BlockDragOverlay` 래핑. `pl-8` 좌측 패딩으로 핸들 거터 확보. 기존 note 에디터 패턴과 동일
- **위키 TextBlock 4코너 리사이즈 (2026-04-13)**: `WikiBlock.editorWidth/editorHeight` persist (Store v75). 편집 모드에서만 적용, 읽기 모드는 full width 유지. `block-resize-corner` CSS 재활용. 4코너(tl/tr/bl/br) 핸들. `⋯` 메뉴에 "Reset editor size" 버튼 (ArrowsIn)
- **Reference Usage 섹션 구현 (2026-04-14)**: `reference-detail-panel.tsx` Usage "Coming soon" → 실제 노트/위키 사용처 목록. `notes.filter(referenceIds.includes)` + `wikiArticles.filter`. 클릭 → openNote / navigateToWikiArticle
- **Note History 연결 (2026-04-14)**: `side-panel-activity.tsx` History placeholder → `ActivityTimeline` 컴포넌트 연결. noteEvents 기반 이벤트 타임라인 (25 이벤트 타입, 색상 도트 + verb + 상대시간)
- **Wiki Activity 정리 (2026-04-14)**: Article Stats 제거 (Detail Properties와 중복). "Thread & Reflections not available" 제거. "Wiki article history is not yet available" 간결 안내로 교체
- **Expand/Collapse All 항상 표시 (2026-04-14)**: `hasCollapsibles` 조건 제거 → 버튼 항상 렌더. 접을 게 없으면 disabled + 흐릿 (`text-muted-foreground/20`). Details 토글 = DOM 클릭 방식 (setNodeMarkup 대신). hasCollapsibles 체크: details/summary/footnoteRef/referenceIds

## TODO: Future Work (우선순위 순, 2026-04-14 sync)

### ✅ P0 — Split-First 마이그레이션 — ALL COMPLETE
### ✅ P0 — 노트 References + fontSize cascade — ALL COMPLETE
### ✅ P2 — Reference Usage — COMPLETE
### ✅ P0 — Y.Doc Split-View Sync PoC — COMPLETE (2026-04-14)

### P0 — Y.Doc 본 구현 (PoC → 프로덕션)
- **PHASE-PLAN 리뷰 + PoC 결과 반영** — 현재 in-memory Y.Doc, 리로드 시 CRDT history 유실
- **y-indexeddb 영속화** — 오프라인 undo history + 장래 collab 대비
- **Wiki 동일 패턴 적용** — `WikiEditorAdapter`에 `acquireYDoc("wiki", id)` 바인딩. NoteEditorAdapter가 해결한 4개 버그 동일 적용 필수 (특히 sync-during-render 패턴 + plainText-only empty guard)
- **방어 가드 유지** — `NoteEditorAdapter.handleChange` 의 empty-refuse 가드 + `note.title` 포함된 `storeHasContent` 판정은 본 구현에도 유지 (다른 race 방어)
- **플래그 제거 or 기본 ON** — 안정화 후 `?yjs=1` 없이도 동작하게
- **사이드 이슈**: `plot-note-bodies` IDB object store 누락 (NotFoundError 반복), TipTap duplicate extension names 경고 (link/underline/gapCursor)

### P2 — 인포박스 고도화 + 나무위키 리서치 기능 (나무위키 수준, base 티어 = 노트+위키 공용)
**Tier 1 — 인포박스:**
- ✅ **대표 이미지 + 캡션 (PR #192, 2026-04-14)** — heroImage/heroCaption attrs, URL prompt, hover Add/Remove
- ✅ **헤더 색상 테마 (2026-04-14 밤)** — 노트(TipTap `InfoboxBlockNode`) + 위키(`WikiInfobox` 컴포넌트) 양쪽 지원. 프리셋 7색 + 커스텀 color input, rgba 0.35, PaintBucket 팝오버. `WikiArticle.infoboxHeaderColor` 필드 (optional, migration 없음). 중장기 TODO: `WikiInfobox` → `InfoboxBlockNode` 통합 (base 티어 단일화)
- ✅ **인포박스 접기/펼치기 (PR #192, 2026-04-14)** — chevron 토글 + `plot:set-all-collapsed` 이벤트 리슨
- ✅ **섹션 구분 행 (2026-04-14 밤)** — 나무위키 스타일 그룹 헤더 (bold + uppercase + tinted bg, value 숨김). `WikiInfoboxEntry.type?: "field" \| "section"` optional 필드 (backward compat). TipTap `InfoboxRow` 도 동일. Edit UI에 "Add section" 버튼 (field와 나란히). 세 경로 모두 지원 (Default/Encyclopedia/TipTap 노드)
- ✅ **필드 값 리치텍스트 (2026-04-14 밤)** — 공용 `InfoboxValueRenderer` (`components/editor/infobox-value-renderer.tsx`). 지원: `[[title]]` 위키링크 (article/note resolve + dangling dashed), `[text](url)` 외부링크, `![alt](url)` 인라인 이미지 (h-[1.25em]), bare `https?://` auto-link. 보안: `isSafeUrl` (http/https/data:image/ 경로만). 편집 모드는 raw text input 유지, **읽기 모드에서만 리치 렌더**. WikiInfobox + InfoboxBlockNode 모두 적용. **Tier 1 완료** 🎉
**Tier 2 — 새 블록 타입 (base 티어):**
- **배너 블록** — 배경색 + 제목 + 부제 (노트 Insert + 위키 TextBlock 공용)
- **둘러보기 틀 (Navigation Box)** — 관련 문서 그룹 박스 (접기 가능)
**Tier 3 — 유틸리티 매크로 (인라인):**
- **나이 계산** `[age(YYYY-MM-DD)]` — 만 나이 자동
- **D-Day** `[dday(날짜)]` — 남은 날 자동
- **Include** — 다른 문서 내용 현재 위치에 삽입
**Tier 4 — 고급:**
- **상위/하위 문서 관계** — 부모-자식 문서 계층
- **각주 이미지** — FootnoteEditModal 이미지 첨부
- **루비 텍스트** — 한자/일본어 읽기 표시
**아키텍처:**
- 모든 새 기능 = base 티어 (노트+위키 공용, shared-editor-config.ts)
- ✅ **Insert 레지스트리 단일화 완료 (2026-04-14 밤)** — `components/editor/block-registry/` 25+ entry 단일 source. 새 블록 추가 시 registry.ts 한 파일만 수정하면 slash + insertMenu 자동 노출. FixedToolbar 퀵액세스는 `getBlock(id).execute({editor})` 호출

### P2 — 인사이트 허브
- **인사이트 허브** — 온톨로지 Single Source of Insights

### P2 — 노트 Split (must-todo, 2026-04-14 확정)
- **노트 split 기능** — 위키처럼 안정적 split UX. Medium 난이도, PR 하나 분량
- **UX = WikiSplitPage 패턴 그대로** (`components/views/wiki-split-page.tsx`). 사용자 명시: "노트 스플리트도 이런 식으로 되면 이상적"
  - 2-column UI: Original Note (체크박스 + 블록 타입 배지) / New Note (이동된 블록 preview)
  - Shift+Click 범위 선택, Back/Cancel, 하단 Title 입력 + "Split N Blocks"
- 기술 가능성 확인됨: UniqueID extension으로 top-level 노드 23종이 영속 ID 보유 (`shared-editor-config.ts:361`). 위키 splitMode UI 재사용
- 새 파일: `components/views/note-split-page.tsx` (wiki 템플릿 복사 + TipTap 조작으로 교체) + `lib/store/slices/notes.ts`에 `splitNote` 액션
- 우선순위: 위키 디자인 강화 (wiki-color, themeColor, Hatnote 등) 이후
- 배경: `BRAINSTORM-2026-04-14-entity-philosophy.md`, `project_note_split_todo.md`

### P3 — 사이드패널 + 뷰 확장
- **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식)
- **동음이의어 해소 페이지** — 멀티 링크 매칭 시 선택 화면
- **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드

### P4 — 지능 + 검색
- 요약 엔진, 풀페이지 검색 분리
- 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화

## Calendar 리디자인 설계 (확정)

### 정체성

Calendar = **Cross-Space 시간 대시보드**. Notes/Wiki/Graph 어디에도 속하지 않는 독립 공간.
"시간 축에서 내 지식 활동이 어떻게 분포되는가"를 보여주는 곳.

### 핵심 원칙

1. **모든 엔티티를 시간 축에 표시** — 노트뿐 아니라 위키, 태그, 라벨, 폴더, 관계, 템플릿 전부
2. **레이어 시스템으로 밀도 제어** — 자주 발생하는 이벤트는 기본 ON, 드문 이벤트는 기본 OFF
3. **기존 필터 인프라 재사용** — FilterPanel, DisplayPanel 그대로 적용
4. **Calendar는 Notes의 뷰 모드가 아님** — 독립 공간으로서 cross-space 통합 뷰

### Date Source

| 필드 | 의미 | "Calendar by" 선택 가능 |
|------|------|------------------------|
| createdAt | 생성일 | ✅ (기본) |
| updatedAt | 수정일 | ✅ |
| reviewAt | 리뷰 예정일 | ✅ |

### 레이어 (Display 토글)

| 레이어 | 기본값 | 이벤트 |
|--------|--------|--------|
| Notes | ☑ ON | 노트 생성/수정 |
| Wiki | ☑ ON | 위키 문서 생성/수정/상태변경 |
| Reminders | ☑ ON | snoozed 노트 reviewAt |
| Relations | ☐ OFF | 관계 생성 |
| Tags/Labels/Folders | ☐ OFF | 태그·라벨·폴더 생성 |
| Templates | ☐ OFF | 템플릿 생성 |

### Display Modes (캘린더 내)

| 모드 | 용도 |
|------|------|
| Month | 전체 흐름 파악 (기본) |
| Week | 주간 디테일 |
| Agenda | 날짜별 그룹된 리스트 (텍스트 밀도 최고) |

**Timeline(Gantt) 뷰는 제외** — 노트는 "시점" 데이터이지 "기간" 데이터가 아님.

### Filter

기존 FilterPanel 재사용:
- Status (inbox/capture/permanent)
- Tags, Labels, Folders
- Space (Notes만 / Wiki만 / 전체)
- Date range

### 인터랙션

| 액션 | 동작 |
|------|------|
| 빈 날짜 + 클릭 | 해당 날짜로 노트 생성 |
| 아이템 클릭 | Side peek / 에디터 열기 |
| 날짜 숫자 클릭 | Week/Day 뷰로 드릴다운 |
| ← → 키 | 월/주 이동 |

### Calendar 사이드바

- 미니 캘린더 (월간, 날짜 점프)
- 오늘의 요약 (생성 N, 수정 N, 리뷰 N)
- Views 섹션 (Calendar 커스텀 뷰)
- Upcoming (다가오는 리마인더)

## 참조 문서

- `docs/SYNC-PRD.md` — **★ 다중 기기 sync PRD (Phase 분할 + 기술 architecture)**
- `docs/SYNC-DESIGN-DECISIONS.md` — Sync 6개 결정 + 옵션 비교 + 위험
- `docs/NEXT-ACTION.md` — 다음 세션 즉시 시작 가이드
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처 상세
- `docs/TODO.md` — Phase 진행 추적
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- `docs/DESIGN-AUDIT.md` — 전수 디자인 감사 결과 + 5-Phase Design Spine 실행 계획
