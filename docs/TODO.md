# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-25 (대규모 세션 #3) — 12 PR (#459-#470): P0 #1/#2 완성 + 검색 정통화 + Open Design install + Plot v2 통째 재설계 결정 (Path A). 다음 P0 #1 = **Phase 0 Design Language 결정 + Plot v2 redesign PRD 작성**.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-25 대규모 세션 #3 후)

### 1. **🔴 Phase 0 — Design Language 결정 + Plot v2 통째 재설계 PRD (사용자 명시 큰 결정)**

**사용자 의도** (영구 인용):
> "지금 플롯 디자인은 사실 내가 맨처음으로 시작한 프로젝트여서 조잡한 부분들이 많아. 리니어나 플레인에 비해서. 기능은 그들 못지 않고 오히려 앞선다고 보지만 디자인적 아쉬움이 커."
> "내가 폴리쉬를 계속해봤는데도 답이 없어서. 오픈 디자인이라는 강수를 도입하려는 거야."
> "통째 재설계 의도 (Path A)."

**범위**:
- Plot lib/* + hooks/* 그대로 keep (functional layer 분리)
- components/* + app/(app)/*/page.tsx + globals.css 통째 재설계
- 영구 룰 #93~#136 재평가 (폐기/유지/변경)

**첫 스텝** (다음 머신에서 바로):
1. Open Design web UI 진입 (http://127.0.0.1:3845, 데몬 재시작 필요 시 `cd ~/Desktop/open-design && pnpm tools-dev start web`)
2. `.omc/plans/plot-v2-redesign-prd.md` 작성:
   - Design language 후보 비교 (Linear-inspired / Notion-clean / Plain-style / Anthropic-style / Custom hybrid)
   - 사용자 결정 + 근거
   - Surface 우선순위 (Chrome → Home/Dashboard → List → Detail → Insights → Settings)
   - 시간 estimate (~17-28시간, 12-20 PR)
3. critic 검토 (큰 결정이라 객관 review 가치)
4. Phase 1: Chrome surface mockup 생성 (Open Design `dashboard` 또는 `web-prototype` skill)
5. 결과 quality 확인 후 본격 진행 결정

**시간 estimate**: ~17-28시간 (1-2주 elapsed, 12-20 PR)

**위험**:
- Design language 잘못 고르면 6-8 surface 다 다시. critic 검토 + 첫 1-2 mockup viewport 검증 후 본격 진행
- 영구 룰 #93~#136 재평가 결정 (#136 Two-Layout Rule keep 권장)
- Plot identity 보존 (Stone/Brick/Block, 'P' avatar, space colors, NOTE_STATUS_HEX/WIKI_STATUS_HEX)

**참고 파일**:
- `~/Desktop/open-design/` — repo clone (51.7k stars, Apache 2.0, 71 brand systems, 19 skills)
- `~/Desktop/open-design/AGENTS.md` — Open Design 사용 가이드
- `docs/MEMORY.md` — Plot Source of Truth (영구 룰 17개)
- `lib/colors.ts` — Plot identity tokens
- `.claude/skills/plot-frontend/mockup-faithful-implementation/` — 4-gate 워크플로우

### 2. **🟢 chunk 2b / 3b / Phase A2 (deferred, Phase 0 결정 후)**

Phase 0 끝나면 또는 병행 가능 (단 design language 결정이 우선):
- **chunk 2b**: Ontology Dashboard weekly activity area chart (entityEvents 시계열)
- **chunk 3b**: Ontology Insights body Mosaic (COVERAGE 차트화 + TOP NOTES bar chart)
- **Phase A2**: Notes Insights 차트화 (StatusDonut 재사용 + MiniBarChart recharts)
- **Phase B**: Wiki Insights 페이지 신설 (정보 architecture 정합 — Ontology=전체, 각 entity=세부)
- **Phase C**: Books Insights 페이지 신설

### 3. **🟢 TABS hardcoded → 동적 entity registry refactor (사용자 비판 잔여)**

PR #461에서 entity TABS 7→11개 확장했으나 hardcoded 그대로. 동적 registry 시스템 refactor 가치. Plot v2와 별도 작업.

### 4. **🟢 사용자 viewport 검증 미완 (이전 세션 누적)**

- Backup Restore round-trip (Full Backup → Import → reload)
- GlobalTopBar Hide-all-panels 후 chrome 접근
- Cmd+K Escape 닫힘 (Path A로 검색 통합 후 영향 검토)
- Inbox Phase 1c 3 SectionCard 작동
- Phase α-2 위키 체크박스 시드 검증
- **신규**: Books list 모드 visibleColumns default 확장 효과 (사용자 viewState persist 확인)

---

## 🔵 P1

### Editor toolbar / slash menu i18n (큰 작업 분할)

- Bubble menu 30+ 블록 description
- Slash menu placeholder + descriptions
- Discover sub-labels (NOTES/TAGS/WIKI 헤딩)

### Quick Filter polish

- chip edit (label/desc 수정)
- chip 정렬 / drag-to-reorder
- wiki list 모드 진입 path 명확화

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → Plot v2 작업과 어떻게 병렬 진행할지 결정 후 진행.

---

## ✅ 최근 완료

- **2026-05-25 (대규모 세션 #3)**: **P0 #1/#2 완성 + 검색 정통화 + Open Design install + Plot v2 통째 재설계 결정** (PR #459-#470, 12 PR). (a) Chrome architecture (#459/#460/#468/#470): 'P' brand mark Activity bar → GlobalTopBar UserAvatar. chunk 3 dropdown 흡수 후 사용자 viewport 결정으로 분리 복원. 최종 layout `[P] │ [≡] [⏰] [<] [>] ─ search ─ │ [☀][⚙][🗑]`. (b) 검색 architecture (#461/#462): entity TABS 7→11개 확장 (Books/Categories/Stickers/References 추가). Path A — GlobalTopBar = 진짜 input + SearchView 자체 input 제거 + globalSearchQuery store + ⌘K input focus. (c) Dashboard 풀 폭 + 차트 (#463/#464/#465): max-width 제거 4 페이지 + 영구 LOCKED #136 Two-Layout Rule. dashboard-charts.tsx 신규 — Status/Wiki status donut + Top Hubs/Categories bar 4 chart Mosaic 2x2. 색상 hardcoded → NOTE_STATUS_HEX/WIKI_STATUS_HEX token. Books KPI + Wiki stubs 메타. (d) Insights 손질 (#466/#467): Ontology Insights sidebar Stats 제거 + Knowledge WAR → Top Notes + composite score 공식 명시. Notes Insights PhActivity → Activity + i18n 광범위 + Health compact. (e) Books list (#469): Title flex max-w-[480px] cap + visibleColumns 6개 default. (f) Open Design install: ~/Desktop/open-design (51.7k stars, Apache 2.0, 71 design systems, 19 skills). pnpm 10.29→10.33.2 upgrade. daemon 3844 + web 3845. (g) Plot v2 통째 재설계 결정 (Path A) — 다음 세션 Phase 0 PRD 작성. 영구 LOCKED #136 + 후보 #137~#142.
- **2026-05-25 (대규모 세션 #2)**: **i18n 마무리 + Custom Quick Filter feature + 디자인 브레인스토밍** (PR #438-#457, 20 PR). (a) i18n 마무리 광범위 (#438-#448, #451, #457): WikiInsightsChart / Trash All view / Trash chrome / Notes-Trash empty + tooltip + split toast / notes-table TrashEntityList + context menu / 3 Floating Action Bars / inbox+books / wiki-view / library-view (refs/tags/files+chrome) / SearchView Linear breadcrumb / Side panel 3 탭 + EVENT_CONFIG 44 verbs / 참고문헌→레퍼런스. ~250+ 신규 dict keys. (b) wikiRegistered 정정 (#449/#450): 라벨 "위키 등록"→"위키에 속해있음" + 동작 제목 매칭→실제 임베드 멤버십 (wikiArticles.noteIds 체크). 영구 룰 #132. (c) Custom Quick Filter feature (#452/#453/#454/#455/#456): 사용자 정의 chip bar entries — Zustand slice v148 + Dialog (promote + rule builder popover) + Wiki/Books default 시드 + "Label"→"Name" Plot entity 충돌 회피. 영구 룰 #131/#133/#134/#135. (d) 디자인 브레인스토밍 (다음 세션 P0 #1/#2): 'P' brand mark + 온톨로지 대시보드.
- **2026-05-24 (심야)**: **Phase α-1 Inbox 'task' 흡수 + 4 surface 한국어 wire + Inbox refiner** (PR #417). (a) Phase α-1 (Memory parked → LOCKED): InboxItemKind 'task' 추가 + use-inbox todoTasks source loop + sectionFor→do + inbox-source-icon Square + inbox-view handleRowClick task→noteId resolve. TodoView parallel 유지. (b) i18n Wave ~50 신규 keys: WikiDashboard 전체 / Calendar (월·주·일정 + 월·화·수·목·금·토·일) / CALENDAR·TEMPLATES filter labelKey (스톤·브릭·블록 음역 #118) / SmartSidePanel 4 tab (상세·연결·활동·북마크) / SidePanel empty / Inbox breadcrumb + SECTION_META + use-inbox action·meta. (c) Inbox refiner 5건 (production-ui-refiner Inbox SectionCard 후보 1 5-phase): A1 space-y-4 / C1 borderless / C3 subtitle /60 / E1 empty 약화 / E2 footer 중복 삭제. 영구 룰 #111 정합 (단일 Hook 모델 통합 → todo도 같은 단일 attention 큐). tsc clean.
- **2026-05-24 (밤)**: **i18n 잔여 surface + Merge/Split + Books labelKey + Timeline wrap fix** (PR #416). 2 chunk — (1) Todos/Calendar sidebar/Ontology/Library/Wiki/Books 6 view 한국어 wire (~70 i18n keys 신규) + (2) Wiki Merge/Split → 병합/분리, 타임라인 button whitespace-nowrap, BOOKS_VIEW_CONFIG 전체 labelKey (orderingOptions/groupingOptions/properties), book-table BOOK_COLUMNS labelKey wire, Library "Top Tags"/"unused tag"/"unlinked reference" 누락 한국어. 영구 LOCKED #122 (module-level static config labelKey 일관 적용 의무).
- **2026-05-24 (저녁 후속)**: **GlobalTopBar 신설 + Phase 1c Inbox 3 카드 + i18n 깊은 확장 (필터/디스플레이/cmdk) + production-ui-refine** (PR #414 + 후속 PR). 5 chunk 누적 — Phase 1c (use-inbox section + 3 SectionCard, plan-due source 신규) / i18n main app (Activity Bar/Sidebar/Home/Quick Capture/StatsRow) / i18n 깊은 확장 (Library→자료실 #117, Stone/Brick/Block 음역 #118, Filter+Display Panel labelKey 패턴, Notes column headers) / GlobalTopBar (PanelsMenu + 시계 + < > + 검색 input + 테마/설정/휴지통 — sidebar 헤더/푸터 제거 + activity-bar 테마 제거 + view-header PanelsMenu 제거 #119/#120) / Command palette hybrid mode badge (#121) + i18n + Escape handler + production-ui-refine 5-phase (A spacing+B icon+C search+D right cluster). 영구 LOCKED #117~#121. tsc/build clean.
- **2026-05-24 (오후)**: **Phase 1b 통합 (1b1+1b2+1b3) + Settings 전수 wire (5/5)** — 단일 거대 PR. (a) Phase 1b1 workflow.ts/wiki-articles.ts hooks slice wire (dual-write) + (b) Phase 1b2 read-site 마이그 12+ 파일 (신규 lib/store/hook-selectors.ts + getReviewQueue/useInbox/wiki-timeline/sidebar/insights/settings 모두 hooks 기반) + (c) Phase 1b3 legacy 제거 (Note.reviewAt / WikiArticle.plannedDate / srsStateByNoteId 영구 삭제 + v146→v147 strip migration + reviewAt filter operator drop + helpers.ts/test fixtures cleanup) + (d) Settings #1 Start view wire (app/(app)/layout.tsx 라우팅, persist hydration 대기) + (e) Settings #2 Sync 솔직한 reframe (backupReminder/lastBackupAt 신규, toast nudge) + (f) Settings #3 Line numbers wire (CSS counter gutter) + (g) Settings #4 Backup Restore (restoreFromBackup + Import UI + 자동 reload) + (h) Settings #5 i18n (lib/i18n.ts 신규, EN/KO 완전 dictionary, useT 훅, 모든 Settings 페이지 적용). 영구 LOCKED #113~#116. tsc/build clean.
- **2026-05-24 (새벽)**: Temporal Hooks PRD v0.2 + Phase 1a foundation 머지 (PR #411). PRD §11 Q3/Q4/Q6 RESOLVED (1-step migration / 보수적 전이 / Inbox Do-Review-Detected). Q1/Q2/Q5 DEFERRED to Phase 2/3. 4 파일 변경 + 1 신규 (lib/store/slices/hooks.ts) + PRD update. Hook model + slice + v145→v146 migration (Note.reviewAt+triageStatus / srsStateByNoteId / WikiArticle.plannedDate → Hook 일괄 흡수, idempotent). legacy 필드 Phase 1a 한정 keep. tsc/build clean. Round-trip 검증.
- **2026-05-24 (심야)**: Ghost Row v0.1 universal — 7 파일 변경. DisplayLane<T> union (LanedItem | LanedCollapsedHeader) + sub-components TS narrowing (timeline-bar/grid/label-column) + 3 entity timeline orchestrators (wiki/notes/books) visibleLanes ghost inject + 모든 caller ghost skip. 시각: 그룹 header 클릭 → ghost row 1줄 (chevron right + label + N hidden + Expand hint), click expand 복구. Linear/Notion 정합. tsc/build clean.
- **2026-05-24 (밤)**: Group collapse universal 완성 — 5 파일 변경 (PR #409): (1) Wiki Board column collapse (notes-board PR-Q5 패턴 복제) + (2) Notes Timeline lane collapse (PR-Q4 wiki 패턴) + (3) Books Timeline lane collapse (동일). 5 entity-mode 조합 모두 `viewState.collapsedGroups` 공유 — list/board/timeline cross-mode 일관 fold state. tsc/build clean.
- **2026-05-24 (저녁)**: 거대 세션 #2 — 단일 PR (11 변경 단위, 36 파일 변경 + 5 신규): (1) Notes timeline ViewHeader (P0 #1, 사용자 신호 해소) + (2-7) File 엔티티 v1 (PR 1a 모델+마이그v144→v145 + 1b Note picker + 1c Wiki picker + 1b' Books 접점 close-out + 2 Usage 인덱스 + 3 Hard delete 경고 dialog) + (8) Library Labels 아이콘 fix (#103 cascading) + (9) Notes/Wiki Grid Display (Books parity) + (10) Display Panel Audit 3-Fix (grid 정합 / timeline group spacing / filterAwareRole 라벨) + (11) Q-series Q1~Q5: Grid 박스 폐기 / Quick filter chip universal / collapsedGroups store 승격 / Wiki timeline lane collapse / Notes Board column collapse. tsc/build clean 모든 11 단위. **미완**: Wiki Board column collapse + Notes/Books timeline lane collapse — 다음 P0.
- **2026-05-24**: 거대 세션 단일 PR (93 파일 / +1891 −2622) — (a) PR-X5/X6 lucide 68 파일 + activity bar/sidebar/action icons 전체 lucide (Stone/Brick/Block만 phosphor 유지, Wiki Stub/Article도 lucide Book/BookMarked로) + (b) audit v2 PR-B foundation (declarative modes + DisplayPanel mode filter + normalizeViewState auto-cleanup) + PR-B2 갭 해소 5건 (B11 References groupBy 단일화 / B6 timeline-label-column visibleColumns / B12 templates grid groups / B5 wiki gallery wikiGroups / B4 timeline lane 헤더+canvas divider) + PR-C polish 4건 (B10 wiki tier sort / B13 Books board groupOrder/showEmpty / B14 isHydrated) + (c) Notes/Books Timeline 신규 (generic refactor + 3 신규 컴포넌트) + (d) Gallery view 전수 폐기 → Grid view 통일 (자동 마이그레이션) + (e) spacing/icon polish (.a-row__icon 박스 제거, Books py-2.5) + (f) wiki timeline D1 gradient 제거 (단일 색). tsc/build clean.
- **2026-05-23 (후속)**: 거대 세션 단일 PR — (a) `.omc/plans/view-state-reliability-audit.md` v2 Linear 마인드셋 통합 + (b) PR-A 데이터 무결성 5건 (VALID_GROUP_BY/VALID_SORT_FIELDS/wordCount/fail-closed 3개/Files searchQuery) + (c) Lucide 마이그레이션 90 파일 (PR-X1 UI primitive 21 / PR-X2 chrome 17 / PR-X3 side-panel 17 / PR-X4 view components 30). 부수 효과: carousel.tsx KeyboardEvent.key 버그 자동 fix. Brand 5종(Stone/Brick/Block + Stub/Article) phosphor 유지. tsc clean.
- **2026-05-23**: 타임라인 비주얼 리디자인 (단일 PR, 8파일 +224/−141) — 막대 이름 제거 / 이벤트 마커 막대 안(중앙선)+흰 테두리 / 막대 day-quantize+drag 정합 / 스타트칩 = 막대 고유 origin 노드 / 얇은 선(`BAR_HEIGHT` 28→5)+drop shadow 제거 / 선 색 = status 아이콘 색(stub 주황·article 에메랄드) / **"All" 모드 신설**(5번째 줌, fit-to-content overview, 기본값). tsc clean.
- **2026-05-22 (후속 #3)**: Display 패널 탭 = Linear segmented control (popover 360px + flex-1 + gap seam) + 타임라인 막대 status 화살촉 제거(ARROW_DEPTH 정리). 막대 이름 제거(A안)·마커 clip 수정은 결정 완료 → 다음 세션 P0 #1.
- **2026-05-22 (후속 #2)**: File 엔티티 PRD v0.2 작성 (`file-entity-prd.md`) + P0 #3 Timeline 탭 아이콘(`Ruler`→`ChartBarHorizontal`) + P1 EVENT_MARKER 4종 매핑(merged/unmerged/split/section_collapsed) + P0 #2 라이브러리 5종 Index 그룹핑(Tags/Labels/Stickers/Files/References — 컴포넌트-사이드 + `.a-tg` 헤더). ⚠️ P0 #2 시각 스모크 테스트 미완.
- **2026-05-22 (후속)**: PR #401 — 레거시 alphabetical-index 토글(`showAlphaIndex`/`showAllArticles`) 완전 제거 (6파일, +9/−173). Index = 순수 Grouping 옵션. + File 독립 엔티티 브레인스토밍 (결정 locked → P0 #1).
- **2026-05-22**: PR #400 — 통합 시간 모델 PRD (`unified-temporal-hooks-prd.md` DRAFT) + Index→Grouping 통일 (content 5종 — Wiki/Templates/Books groupingOptions `firstLetter`, `showAlphaIndex` 가짜 칩 제거) + 빌드 에러 픽스.
- **2026-05-21 (저녁 후속 #6)**: wiki-timeline-view.tsx sub-component 분리 (1380→386줄, PR #399).
- **2026-05-21 (저녁 후속 #5)**: `router.push("/wiki/[id]")` dead code 정리 (PR #398).
- **2026-05-21 (저녁 후속 #2~#4)**: Ontology node 동기화 / Activity events granular wire-up / Books own Views section.
- **2026-05-21**: bars-first timeline 3 라운드 (PR #392) + 옵션 C drag/event marker chips (PR #393).

---

## Parked / Brainstorm

- ~~기존 체크박스-todo → Inbox kind 이전 검토~~ — **2026-05-24 심야 LOCKED 진입** (PR #417 Phase α-1). InboxItemKind 'task' 추가 완료. Phase α-2 (위키/책 확장) + Phase β (TodoView 폐기) 남음 → P0로 promote.

---

## 영구 LOCKED 결정 (누적 #88 + #92, 후보 #89 / #90)

- 최근 (PR #387): #84-#88 — wiki-view-mode 직접 구독 / layout.tsx 정확 매핑 / Save view entity differentiate / Library = hub (view는 sub-entity) / Categories own view.
- **#92 (LOCKED)**: **Index = Grouping, not a column** — Display Properties 칩 = 진짜 컬럼 1:1. "Index"(알파벳 그룹핑)는 Grouping 드롭다운. content 5종(PR #400) + 레거시 토글 제거(PR #401) + 라이브러리 5종(2026-05-22 후속 #2) 완료.
- 후보 (#89): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함.
- 후보 (#90): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline.
- ~~후보 #91 (막대 끝점 = status 도형 / Article 화살촉)~~ — **폐기** (2026-05-22 후속 #3): 화살촉 제거, 타임라인 status = 막대 색만.
- 후보 (#93~, 2026-05-23 타임라인 리디자인): ① 타임라인 막대 = 얇은 선, 이벤트 칩이 주인공 ② 스타트칩 = 막대 고유 origin 요소(이벤트 아님) ③ 선 색 = status 아이콘 색 일치 ④ "All" 모드 = fit-to-content overview (viewport-fit은 옵션이면 OK). 상세 = SESSION-LOG 2026-05-23.
- **#98 LOCKED (2026-05-24)**: Gallery view 폐기 → Grid view 통일 (Notes/Wiki/References/Books 4 entity). 자동 마이그레이션 (gallery → grid).
- **#99 LOCKED (2026-05-24)**: Wiki timeline bar 단일 색 — D1 past/future gradient 폐기. 모든 entity bar가 status color full opacity.
- **#100 LOCKED (2026-05-24)**: Brand 3종만 phosphor (Stone/Brick/Block). Wiki Stub/Article은 lucide (Book/BookMarked). Activity bar + sidebar + action icons 전체 lucide.
- **#101 LOCKED (2026-05-24)**: Timeline = entity-agnostic sub-components (T extends TimelineEntity) + entity adapter (status icon/color/horizon/eventRef).
- **#103 LOCKED (2026-05-24)**: `.a-row__icon` 박스 폐기 — 22×22 tinted square 제거, color tone만 유지 (Linear/Plain 톤).
- **#104 LOCKED (2026-05-24)**: Books list row height = Notes/Wiki parity (h-9 → py-2.5).
- **#105 LOCKED (2026-05-24 저녁)**: Plot's chrome layer = ViewHeader. quickFilters/display/filter/save/detail panel 모두 ViewHeader-level → 모든 mode 일관 UX.
- **#106 LOCKED (2026-05-24 저녁)**: Grid mode = flat card grid (Books parity), no grouping semantics. view-configs grouping options에 explicit `modes: ["list", "board"]` (grid 제외). Grid 카드 자체 fixed display.
- **#107 LOCKED (2026-05-24 저녁)**: collapsedGroups = store-level (viewState.collapsedGroups). list/board/timeline 모두 동일 viewState read. mode 전환 시 의도 fold 유지.
- **#108 LOCKED (2026-05-24 저녁)**: Grouping = organize / Filter = focus. 사용자가 "특정 영역만 보기" 의도는 filter primary path. 큰 corpus에선 group collapse + quick filter chip이 scaling 본질 도구.
- **#109 LOCKED (2026-05-24 저녁)**: Linear board column collapse pattern — 40px narrow vertical bar + chevron up + vertical label (writing-mode: vertical-rl) + status icon + count. expanded 시 header에 chevron-down.
- **#110 LOCKED (2026-05-24 저녁)**: File 엔티티 v1 완료 (PR 1a/1b/1c/1b'/2/3). v2 (content-hash dedup / hard-delete dangling cleanup) Phase 2로 이관. Books 접점 직접 참조 0 (간접만).
- **#113 LOCKED (2026-05-24 오후)**: Hook = single source of truth. legacy 필드 영구 제거. 신규 temporal 기능은 무조건 Hook 위에.
- **#114 LOCKED (2026-05-24 오후)**: planning intent ≠ content activity 확장 — setReminder/clearReminder/batchSetReminder가 notes.updatedAt 갱신하지 않음 (#89 wiki 한정 룰을 note까지). triageSnooze는 triageStatus/snoozeCount/lastTouchedAt만 갱신 (non-temporal workflow state는 별개).
- **#115 LOCKED (2026-05-24 오후)**: Sync 페이지 = honesty over hype. fake auto-sync 제거, "Multi-device sync: Not available" 명시. backup reminder + 마지막 백업 timestamp만 진짜 기능.
- **#116 LOCKED (2026-05-24 오후)**: i18n = 간단한 dictionary lookup. 외부 의존성 없이 `lib/i18n.ts` + `useT()` 훅. 미번역 키는 EN fallback → literal key fallback.
- **#117 LOCKED (2026-05-24 저녁)**: Library → 자료실. 5글자 "라이브러리" 활동 바 잘림 → 3글자 음역 절충 (Plot 정체성 + 한국어 흐름).
- **#118 LOCKED (2026-05-24 저녁)**: Stone/Brick/Block 음역 (스톤/브릭/블록). 영어 정체성 + 한국어 흐름 정합. 의역 시 시그니처 워크플로우 단어 정체성 약화 — 음역이 절충.
- **#119 LOCKED (2026-05-24 저녁)**: GlobalTopBar = workspace chrome single source. 시계/<>/검색/테마/설정/휴지통 모두 top bar. Hide-all-panels 상태에서도 chrome 접근 가능 — 모든 다른 dialog/popup도 같은 원칙.
- **#120 LOCKED (2026-05-24 저녁)**: PanelsMenu = top bar 단일 mount. view-header에서 제거. 다른 컴포넌트에 추가 mount 금지 — 햄버거 중복은 사용자 혼란.
- **#121 LOCKED (2026-05-24 저녁)**: Command palette hybrid mode badge. 기본 commands 모드 뱃지 제거 (Linear 정합 minimal), sub-mode (links/thinking)만 뱃지. Plot multi-mode 정체성 + Linear 정합 절충.
- **#122 LOCKED (2026-05-24 밤)**: module-level static config (view-configs / COLUMN_DEFS / BOOK_COLUMNS) labelKey 옵셔널 필드 패턴 = entity별 일관 적용 의무. NOTES만 labelKey + Books/Wiki/Library 영어 mix는 사용자 혼란 — 새 view config 추가 시 labelKey 동시 추가.

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
