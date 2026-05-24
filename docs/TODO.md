# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-05-24 (새벽) — Temporal Hooks PRD v0.2 + Phase 1a foundation 머지 (PR #411). 다음 P0 #1 = Phase 1b.

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-24 새벽)

> P0 #1 = Phase 1b (workflow wire + read-site + legacy 제거). #2 = Phase 1c (Inbox 재배선). #3 = Phase 2 의제.

### 1. **🔴 Phase 1b — workflow wire + read-site + legacy 필드 제거**

**범위**: Phase 1a Hook foundation을 실제 코드 path에 연결. 1-step migration 완성 (PRD §11 Q3).

**첫 스텝**:
1. `lib/store/slices/workflow.ts` 액션 wire:
   - `setReminder(id, reviewAt)` → `addHook({ target:{kind:"note",id}, policy:"snooze", trigger:{kind:"scheduled",at:reviewAt}, action:{loudness:"active"} })`. 기존 `n.reviewAt` set 제거.
   - `clearReminder(id)` → `removeHooksByPolicy({kind:"note",id}, "snooze")`
   - `triageSnooze(id, reviewAt)` → addHook (loudness: "passive")
   - `batchSetReminder(ids, reviewAt)` → forEach(addHook)
   - `enrollSRS(noteId)` → `addHook({ target:{kind:"note",id:noteId}, policy:"srs", trigger:{kind:"srs",srsState}, action:{loudness:"active"}, state:{srsState} })`. 기존 srsStateByNoteId set 제거.
   - `unenrollSRS(noteId)` → `removeHooksByPolicy({kind:"note",id:noteId}, "srs")`
   - `updateSRSState(noteId, srsState)` → updateHook 또는 remove+add
2. `lib/store/slices/wiki-articles.ts`:
   - `setWikiArticlePlannedDate(id, plannedDate)` → addHook (plan, scheduled) + 기존 plannedDate 제거
3. Read-site 변경:
   - `lib/queries/notes.ts:164` getReviewQueue — srsMap → hooks query
   - Inbox source 5종 — reviewAt → hooks
   - Wiki timeline plannedDate drag (`wiki-timeline-view.tsx`) — plannedDate → hooks
   - SRS review UI — srsStateByNoteId → hooks state
4. `lib/types.ts` legacy 필드 제거:
   - `Note.reviewAt` / `Note.triageStatus` (가능?) / `WikiArticle.plannedDate` / `PlotState.srsStateByNoteId`
5. store v146 → v147 migration (legacy field strip, idempotent)
6. `promoteToPermanent` 자동 SRS Hook 장착 (Q4 결정)

**위험 + 회피**:
- 큰 작업 — 단일 PR vs 1b1 (workflow wire) / 1b2 (read-site) / 1b3 (legacy 제거) 분할 가능
- SRS 엔진(`lib/srs/`) 그대로 (PRD §5) — Hook.state로 wrapping shape 결정 (Hook.state.srsState vs Hook.trigger.srsState 단일화)
- Multi-action transaction — setReminder는 addHook + 기존 reviewAt null을 single setState로 묶기

**참고 파일**:
- `lib/store/slices/workflow.ts` — wire 대상
- `lib/store/slices/hooks.ts` — Phase 1a slice (Phase 1b의 building block)
- `lib/queries/notes.ts:164` — getReviewQueue
- `lib/srs/` — SRS 엔진
- `components/views/wiki-timeline-view.tsx` — plannedDate drag
- `lib/hooks/use-inbox.ts` — Inbox source 5종

### 2. **🟡 Phase 1c — Inbox Do/Review/Detected 재배선**

PRD §6-1: 기존 source 5종 → intent 섹션 (Do / Review / Detected). Q6 결정 적용. "All caught up — Review/Detected are always running" 카피.

### 3. **🟢 Phase 2 의제 (Phase 1 완료 후)**

watch + recurring 신규 정책. open questions Q1 (EventPattern 문법) + Q5 (recurring 범위) 결정 필요. 우클릭 프리셋 + 타임라인 드래그 hook UI.

### 4. **🟢 사용자 viewport 검증 (Ghost Row v0.1 + Phase 1a migration)**

- Ghost Row v0.1 (PR #410) — Wiki/Notes/Books timeline + grouping → group header click → ghost row inject 확인
- Phase 1a migration (PR #411) — 기존 reviewAt / srsState / plannedDate가 정상 Hook 변환되었는지 검사

---

## 🔵 P1

### temporal-hooks PRD 후속

`.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) — §11 open questions 6개 + phasing 결정 필요. 정보 아키텍처 재정렬 = 큰 방향 → 사용자 조율 후 진행.

---

## ✅ 최근 완료

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

- **기존 체크박스-todo → Inbox kind 이전 검토** — `lib/todo-index.ts`(노트 본문 체크박스 인덱스)를 독립 "Todos" 기능으로 키우지 말고 Inbox(attention 큐)에 `InboxItemKind "task"`로 추가. → temporal-hooks PRD의 Layer B(작업 hook)와 직결.

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

전체 영구 룰 #1-#88: docs/MEMORY.md + docs/CONTEXT.md 참조.

---

## Deferred (당장 안 함)

- 다중 기기 sync (Supabase B + E2E + Yjs) — PRD 작성 완료, Phase 1 시작 준비. 사용자 시그널 대기.
- 편집 히스토리 v1 — multi-machine PRD 시점 권장.
- Ambox — Skip 권장 (사용자 시그널 시 재검토).
- SectionTemplate (그룹만 재사용) — MVP 후.
