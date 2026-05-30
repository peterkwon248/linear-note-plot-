# Plot IA 헌법 — 리니어 관점 정보구조 재설계 (LOCKED)

> **상태**: A2.5 LOCKED (2026-05-30 심층 브레인스토밍, 사용자 합의)
> **목적**: "리니어 팀이 Plot을 만들었다면?" 관점으로 개념·기능·배치를 재설계하는 단일 기준 문서.
> 셸 리니어-충실 재현 + 필터/디스플레이 미러(`linear-filter-display-mirror.spec.md`)의 상위 헌법.
> **모든 IA/배치/네이밍 결정은 이 문서를 따른다.** 코드 증거 기반(추측 금지).

---

## 0. 출발점 — Plot의 DNA

**Zettelkasten + 이슈트래킹(중립적 PM 느낌)의 결합** = 독특한 생산성 앱 포지셔닝 (창립 비전).

두 조상의 긴장이 곧 차별점:
| | Zettelkasten | 이슈트래킹/PM |
|---|---|---|
| 단위 | 영구 노트(atom) | work item |
| 운명 | 절대 안 끝남 (재링크) | 끝나야 함 (close/ship) |
| 구조 | bottom-up 창발 | top-down 목표 |

**Plot의 wedge** = 지식이 살아있으면서(Zettel 링크) 동시에 결과물로 수렴(PM 라이프사이클). 캡처 → 링크 → 결과물 조립, status가 done까지 진척 추적.

**기본 틀 = 노트앱 + 유저 자유도 최대** (논문/소설/연구 등 무엇이든). 그래서 Notes·Wiki·Books 섹터를 만들었고, 온톨로지(+Stickers)로 시각화 자유를 줌.

---

## 1. 트리코토미 — 배치의 법 (제1원칙)

**모든 개념은 셋 중 하나다.** 리니어가 모든 것을 담는 통은 3개뿐.

| 통 | 정의 | 리니어 예 | 노출 |
|---|---|---|---|
| **Destination** | 가는 곳 | Team, Project, Inbox, Views | 사이드바/레일 entry |
| **Display mode** | *지금 보는 컬렉션*을 다르게 봄 | List · Board · Timeline · Calendar | 뷰 스위처 |
| **Facet** | 항상 안 보임, 필터에서 꺼냄 | Status · Assignee · **Label** · Priority | 필터 차원 |

**핵심**: 리니어는 Label을 *destination*으로 안 만들고 *facet*으로 둔다 = 사용자가 말한 **"눈에 안 보이게"**의 정체. **안 없앤다, 통만 바꾼다.**

---

## 2. 렌즈 모델 — 7 space의 정체

**7 space = 같은 atom(Note)을 보는 6개 렌즈 + 진입점.** 섹터는 자의적 분류가 아니라 *렌즈*다.

| Space | 렌즈 | 정합성의 종류 | 리니어 대응 |
|---|---|---|---|
| **Home** | 진입/요약 | — | MIRROR (Inbox/landing) |
| **Notes / Wiki** | 타입 | "같은 종류라 깔끔" | MIRROR (이슈 리스트) |
| **Books** | 목적/프로젝트 | "한 목표라 깔끔" | Projects 미러 + cross-type 발명 |
| **Calendar** | 시간 | "날짜로 깔끔" | EXTRAPOLATE |
| **Ontology**(+Stickers) | 공간/관계 | "연결로 깔끔" | 순수 EXTRAPOLATE |
| **Library** | 메타/조직 도구 | "도구로 깔끔" | 부분 (labels/settings) |

→ **"자유도 최대"의 메커니즘**: 섹터가 고정 타입이 아니라 *원하는 만큼 쓰는 렌즈*. 논문러는 타입+목적 렌즈, 소설러는 목적+공간 렌즈.

---

## 3. MIRROR / ADAPT / SKIP — 리니어 흡수 분류

| 분류 | 처리 | 예시 |
|---|---|---|
| **MIRROR** (리니어가 *모든 앱에* 주는 것) | 그대로 도입, 큰 작업이어도 | 탭, 커맨드팔레트, 필터/디스플레이, Inbox, 키보드-퍼스트, 셸 절제 |
| **ADAPT** (우리 도메인) | 리니어 문법 → Plot 엔티티 | status workflow, 7-space 레일, priority 3-막대 |
| **SKIP** (리니어가 *이슈트래커라서* 주는 것) | 안 함 | Cycles, Triage, **Linear Diffs**(코드리뷰), Initiatives, SLA, 2층 커스텀 status |

**판별 기준**: "리니어가 모든 생산성 앱에 주는 것" = MIRROR. "이슈트래커라서 주는 것" = SKIP.

**정합성 정의**: 같은 **크롬(structure)** + **옵션은 컨텍스트별**. 똑같은 옵션 강제가 아님 (리니어 Issues/Projects/Inbox 필터 다 다름).

---

## 4. atom-home 모델 — multi-lens by reference (코드 검증 LOCKED)

**Plot = "단일 정본 atom, 여러 렌즈가 ID로 참조"** (single-home 아님, copy 아님). 두 Explore 에이전트 독립 교차검증.

| 렌즈 | 멤버십 저장 | 방향 | 코드 |
|---|---|---|---|
| **Book** | `Book.items[].refId` (북에) | forward — 노트는 자기가 북에 속한 줄 모름 | `types.ts:287` |
| **Folder** | `note.folderIds[]` (노트에) | reverse N:M | `types.ts:630` |
| **Tag** | `note.tags[]` | reverse N:M cross-entity | — |
| **Category** | `note.categoryIds[]` / `wiki.categoryIds[]` | reverse N:M (DAG) | — |
| **Sticker** | `Sticker.members: EntityRef[]` | forward, 모든 타입 | `types.ts:843` |
| **Label** | `note.labelId` | **N:1 (단일!)** | `labels.ts:66` |
| **Ontology** | node.id = 엔티티 ID | 참조 (복제 X) | `graph.ts:183` |
| **Calendar** | `useNotesView()` | 참조 | `calendar-view.tsx` |

노트는 store에 **한 번 존재**, 모든 렌즈가 ID로 가리킴. 수정 시 전 렌즈 즉시 반영. **back-pointer 없음** (`note.bookIds` 같은 거 없음).

### 비대칭 처리 = C노선 (LOCKED)
코드상 비대칭 3개 발견:
1. **WikiArticle이 Calendar에 못 옴** (Calendar=`useNotesView` notes만) — *실수성 누락* → **메움**
2. **Folder = 타입 감옥** (노트폴더엔 노트만) — **설계 의도, 유지** (사용자 확인)
3. **Sticker만 만능 cross-type** — 의도

→ **C노선**: Calendar 위키 누락(진짜 구멍)만 메우고, Folder 타입제약은 의도로 유지.

### 멤버십 3종 (혼동 금지 — [[plot-organizing-concepts]])
1. **External membership**: folder(트리,타입감옥) / category(DAG,cross) / tag(flat) / label(단일) / sticker(만능)
2. **Intrinsic hierarchy = family**: `parentNoteId`/`parentArticleId` 자기 트리. ROOT/parent/child/solo. *membership 축 아님.*
3. **Lens**: saved view (sort/group/filter 묶음).

---

## 5. Note vs Wiki (코드 검증 LOCKED)

**`noteType==="wiki"` = 레거시 데드 데이터** (사용자가 적발). v66 `isWiki`→noteType 마이그 잔재.
- 증거: 코드 주석 "legacy"/"was dead"(`linear-sidebar.tsx:1122,1331`), 결정로그 "convertToWiki 삭제 예정", `createWikiNote` 0 호출, `lib/store/slices/wiki.ts` 미존재.
- **진짜 위키 = `WikiArticle`** (`wiki-articles.ts` 883줄, blocks/infobox/hatnote/parentArticleId/mergeHistory). Note와 status/tags/labels/refs/wikilink 네임스페이스 공유(이미 통합), 구조는 진짜 다름.
- 비대칭 스모킹건: Note→Wiki 무손실, Wiki→Note 손실(블록 뭉갬) = 진짜 별도 엔티티.

→ **Notes·Wiki = 2 destination 유지** (합병 무의미, facet 아닌 별도 엔티티). `noteType` 데드코드 = 별도 hygiene (spawn_task 띄움. 보존: migrate/seeds/types 필드. 확인: wiki-auto-enroll 실동작).

---

## 6. 개념별 트리코토미 분류 (코드 검증 LOCKED)

### Destination (사이드바/레일 entry 유지)
- **Notes · Wiki · Books · Inbox · Home**
- **Library: References · Files · Categories** (진짜 브라우즈 컬렉션 — "내 참조 다 보기")
- **Ontology** (Graph + Dashboard + Insights = 분석 서브시스템. 강등 X — metrics/relation engine/co-occurrence/cluster 죽음)

### Display mode (뷰 스위처)
- **Calendar** — notes 위 날짜 레이아웃 (`useNotesView` 씀, 별도 데이터 없음 = 강등 안전)
- **Graph (scoped)** — "이 컬렉션만 그래프로". 같은 엔진 `buildOntologyGraphData`, 입력 노드 범위만 다름. **분석은 Ontology destination에만** (scoped graph는 외톨이 많음 + 중복 인상 회피)
- 전체 모드 = **List · Board · Grid · Timeline · Calendar · Graph** (6), `supportedModes`로 컨텍스트별 게이트 (한 화면에 다 안 나옴 = 리니어식 비례)
- ⚠️ `insights`/`dashboard`가 ViewMode union에 섞인 건 hack → 분석 destination으로 분리

### Facet (필터 차원 + 관리 페이지, 사이드바 상시 entry 제거)
- **Tags · Labels** — 메타/필터 차원
- **Stickers** — 그래프 그룹핑 도구 + cross-type 필터 ("가벼운 그래프 마커", Book과 레벨 분리)

### 생성 플로우 (브라우즈 페이지 불필요)
- **Templates** — ⌘K / New에서 (per-type: note/wiki 개별 + Books=스마트북)

### ViewMode 시스템 (코드)
`lib/view-engine/types.ts:40` 이미 6모드 보유 → calendar/graph 강등 = 노출위치 변경, **저위험**.

---

## 7. Book vs Sticker (코드 검증 — 중복 아님, 역할 분리)

| | **Book** | **Sticker** |
|---|---|---|
| 본질 | **순서 있는** 읽기/집필 컬렉션 | **순서 없는** 그룹 마커 |
| 멤버 | note+wiki만 (`BookItem`) | 모든 타입 (`EntityRef`) |
| 스마트 | smartSources 자동채움 | 수동만 |
| 읽기위치 | `lastReadItemId` 추적 | 없음 |
| 리니어 대응 | **Project** | **Label**(그래프용) |
| 트리코토미 | **Destination** | **Facet/tool** |

**한 줄**: Book = 순서 있는 정렬 컬렉션(영구), Sticker = 그래프 시각 그룹 마커(가벼움). fleeting→permanent 위계.
- 스마트북이 sticker를 소스로 먹는 것 = 유지 (태그/라벨 소스와 동급 "묶음 소스"). 단 개념 설명에서 위계 명확화.
- **Sticker = Facet 강등** (Library 정식 entry에서 빼서 Book과 레벨 분리 = "둘이 뭐가 달라" 혼란 해소).

---

## 8. 공통자산 커스텀 정책 (코드+리니어 캡처 검증 LOCKED)

**리니어 원칙**: 진척 계산되는 축은 고정, 분류 축은 자유.

| 개념 | 커스텀(이름+색) | 카디널리티 | 고정/자유 | 리니어 근거 |
|---|---|---|---|---|
| **Status** | ❌ **고정 4단계** | N:1 | 고정 (진척축) | 리니어=고정 type층+커스텀 값층 2단. 우리는 type층만(4단계)=노트앱엔 충분, 2층 커스텀=SKIP |
| **Priority** | ❌ **고정 5단계** | N:1 | 고정 (진척축) | 리니어 Priority=고정(Urgent/High/Med/Low/None), 아이콘 3-막대. **Notes·Wiki·Books 셋 다 보유**(긴급순위는 전 엔티티 의미. 2026-05-30 Wiki priority 추가 락 — 옛 "no meaning on wiki yet" 폐기) |
| **Label** | ✅ 이름+색 | **N:1 (종류)** | 자유 | 리니어 Label=풀커스텀(이름+색). **단 우리 Label=N:1 종류 의미**(memo/research/idea), 이름 "Label" 유지 |
| **Tag** | ✅ 이름+색 | N:M | 자유 | 리니어 Label≈우리 Tag |
| **Category** | ✅ 이름+색+계층 | N:M (DAG) | 자유 | Notion식 (리니어엔 없음) |
| **Family** | 자동(구조) | 트리 | — | role=root/parent/child/solo |
| **Template** | ✅ | per-type | 자유 | 리니어 Template=커스텀 |

**리니어 Status 2층 구조** (캡처 `필터-스테이터스 타입.png`): 상위 `Status type`=고정 6개(Triage/Backlog/Unstarted/Started/Completed/Canceled), 하위 `Status`=커스텀. 우리 4단계 = 리니어 type층에 해당. 2층 커스텀은 이슈트래커 전용 = **SKIP**.

**Label 정명 결정**: 이름 "Label" 유지하되 의미는 N:1 종류(type). 코드 `setNoteLabel`=단일이 이미 이 의미. tag(N:M 자유) ≠ label(N:1 종류) ≠ status(N:1 완성도) 의미 구분.

---

## 9. Overview 처리

리니어 = **작업은 콘텐츠(리스트)로 바로 착지**, "일 앞 요약 게이트" 거부. 단 overview 자체는 부정 안 함(Project overview 탭, 워크스페이스 Insights).
- **Home = 오버뷰 destination** OK ("홈"이니 요약 정당)
- **Wiki / Library = 콘텐츠로 바로 착지** + 오버뷰는 secondary 탭/Insights로 강등 = carry된 "Wiki ←Overview 부채"와 연결
- = 오버뷰는 destination으론 OK, **섹터 강제 게이트론 X**

---

## 10. 셸 (레일 유지 + 리니어 톤) — [[shell-linear-mirror-direction]]

- **(d) 7-space 레일 = 유지 + 2026 리니어 절제 톤다운** (더 어둡게/muted/아이콘 축소). Plot 고유 EXTRAPOLATE.
- 레일 = 아이콘만 + 툴팁, **active 스페이스만 라벨** (절제 + 7개 발견성).
- 레일 항상 열림(주 네비라 버튼으로 안 숨김) + focus 모드(⌘.)로 통째 숨김 가능.
- Inbox=사이드바 최상단 고정(✅완료) / Trash=사이드바 하단 footer(강등) / Help `?`=사이드바 하단 / 설정=워크스페이스 메뉴.
- 패널 토글 = 상단 클러스터 제거 → 검색만 상단, 디테일토글=콘텐츠 우상단, 사이드바접기=엣지핸들+⌘\, focus=⌘.
- 상단 = 브라우저식 탭 (MIRROR 확정, **탭=실기능 도입**하되 셸 스타일 패스 다음 마일스톤).
- 아이콘 = Lucide 문법(strokeWidth 1.5, 16px) + 도메인 글리프(status/priority/entity)만 정밀 인라인 SVG. 픽셀 복제 X.
- 목업 락 후보: `docs/v3-mockup/shell-linear-mirror.html`.

---

## 11. Book 워크플로 축 (LOCKED 2026-05-30 — 캡처+코드 검증)

**결정**: Books도 노트·위키와 정합되는 **workflow 축(status + priority)**을 갖는다. 사용자가 "북도 4-status 도입"을 제기 → 캡처/코드 전수조사로 확정.

### 캡처 증거 (리니어 = Book에 status 줌)
- **리니어 Project status** (`Filter-Project properties-Project status.png`): **Backlog / Planned / In Progress / Completed / Canceled** — 우리 노트 4단계와 거의 동일(Planned↔Todo, Completed↔Done).
- **리니어 Project priority** (`Filter-Project priority.png`): No priority / Urgent / High / Medium / Low (Issue priority와 동일).
- → 리니어 = Project(=우리 Book)에 **status + priority 둘 다** 부여. **"리니어팀이면 Book에 워크플로 준다" 확정.**

### 코드 현황 (Book엔 workflow 축이 없었음)
- `Book` 타입(`types.ts:202-259`): **status 없음, priority 없음.** 대신 `kind`(smart/manual/hybrid) = **derived**(`getBookKind()`, smartSources/items로 계산, 저장 X)가 workflow 슬롯 차지.
- 현재: Notes=status / Wiki=status / **Books=kind** (완전 다른 축) = 비일관의 데이터층 뿌리.

### 결정 (LOCKED)
| 축 | 결정 | 슬롯 |
|---|---|---|
| **status** | 노트 4단계 **재사용**(Backlog/Todo/In Progress/Done, `NoteStatus` enum). **manual·hybrid만**, smart=N/A | **workflow** |
| **priority** | 노트와 **동일 5단계**(None/Urgent/High/Medium/Low). manual·hybrid만 | **workflow** |
| **kind** | smart/manual/hybrid → **workflow에서 classification으로 이동** (status가 workflow 차지) | **classification** |

- **status 의미**: 노트 status=글 성숙도(fleeting→permanent) ↔ Book status=결과물/프로젝트 진척(기획→집필→완성). 의미는 다르나 **같은 4단계 라벨 재사용**(사용자 vocab 일관 + 리니어도 Issue/Project status 거의 통일 + `NoteStatus` 코드 재사용).
- **3-entity 워크플로 완전 통일 (LOCKED)**: Notes·Wiki·Books 모두 **status(4단계) + priority(5단계)**. Wiki priority도 추가(2026-05-30, 긴급순위는 위키 article에도 의미 — "이 문서 빨리 정리"). 코드 주석 "priority has no meaning on wiki yet" = 미구현이었을 뿐, 폐기. → 3 엔티티 workflow 슬롯 = {status, priority} 동일.
- **smart book 처리 = 방식 A** (LOCKED): smart book = 라이브 쿼리라 "완성" 개념 없음 → status/priority는 **manual·hybrid 전용**(smart엔 필드 X). 필터에서 "status: 없음"으로 smart 거름 가능. (방식 B "N/A 표시"·C "멤버 자동계산"은 기각 — 라이브 철학과 충돌.)

### 크롬 일관성 = 이미 달성됨 (스키마 엔진 A3.2)
**핵심**: `FilterPanel`/`DisplayPanel`은 모든 엔티티 공유, 각 엔티티는 `PropertyDef[]`만 다름 → 어댑터가 filter/display/group/sort 자동 생성. **"크롬 통일 + 옵션 컨텍스트별"이 코드로 이미 강제됨.** 따라서 "필터/디스플레이 일관성"의 진짜 의미 = **Book에 workflow PropertyDef 추가** 하나로 환원.

### 구현 비용 (~25줄, 크롬 무변경)
1. `books.schema.tsx`: status + priority PropertyDef 추가(workflow), kind는 category "classification"으로 변경 (~12줄)
2. `types.ts`: `Book.status?: NoteStatus` + `Book.priority?: NotePriority` (~2줄)
3. `books.ts` store: 기존 `updateBook(id, patch)` 그대로 처리 가능 (setter 불필요)
4. `use-books-view.ts` `bookMatchesRule`: status/priority case 추가 (~6줄). `getBookKind`는 유지(derived).
5. smart 가드: status/priority는 manual·hybrid에만 부여(create/마이그레이션).
6. ⚠️ 마이그레이션: 기존 manual/hybrid book에 status 기본값(backlog?) — store version bump 필요.

### Book 정체성 함의
status=진척 도입 → Book이 **"결과물(원고)" 쪽으로 기움** (smart=컬렉션 / manual·hybrid=집필 결과물). 이는 §0 wedge(지식→결과물 수렴)와 정합. → 미결 "Book=컬렉션 vs 원고"는 **"둘 다, kind로 갈림"**으로 사실상 해소.

---

## 12. Smart Book ≠ Template (명칭 통일 판정, LOCKED 2026-05-30)

사용자가 "스마트북을 북 템플릿으로 통일?" 제기 → **기각**. 본질이 정반대:
| | Template (노트/위키) | Smart Book |
|---|---|---|
| 하는 일 | 새 엔티티 생성 시 **틀 찍어냄** | 기존 엔티티를 **라이브 쿼리로 모음** |
| 시점 | 생성 시 1회(연결 끊김) | 상시 자동 갱신 |
| 리니어 대응 | **Template** | **Saved View / Filtered View** |

- **명칭 통일은 같은 본질끼리만**: Template은 노트/위키끼리 이미 통일됨 ✅. 스마트북은 템플릿 아님 → 억지 통일 X (사용자 혼란: "템플릿 만들었는데 왜 기존 노트가 들어와?").
- **스마트북의 진짜 친척 = SavedView** (둘 다 저장된 라이브 쿼리). 단 스마트북=ordered book(읽기 시퀀스+진척), SavedView=필터된 리스트 → 미묘하게 다름. **SavedView 통합 패스 때 재검토**(지금 보류).

---

## 13. 미결 (다음 논의)

- **네이밍 재검토**: Ontology·Book 이름 유지? / Smart Book ↔ SavedView 통합 가능성(§12).
- **Book status/priority 구현 순서**: status 먼저 안정화 후 priority?
- **Calendar에 WikiArticle 포함** (C노선 비대칭 메우기) — 구현 시점 미정.
- 셸 디테일: 워크스페이스 스위처 위치(상단 vs 사이드바 최상단), 디테일 패널 목업.

---

## 적용 순서 (제안)

1. **이 헌법 LOCK** (이 문서)
2. 셸 목업 최종 락 → 실앱 포팅 (Inbox✅ / Trash강등 / Help / 패널분산 / 레일톤다운)
3. Facet 강등 (Tags/Labels/Stickers 사이드바 정리)
4. Calendar/Graph → display mode 노출 (저위험)
5. noteType 데드코드 정리 (별도 hygiene)
6. 탭 기능 빌드 (별도 마일스톤)

---

> **참조**: `linear-filter-display-mirror.spec.md`(필터/디스플레이 미러), `docs/v3-mockup/shell-linear-mirror.html`(셸 목업), 리니어 캡처 `%TEMP%\linear-ref\`(109장), 메모리 [[ia-constitution]] · [[shell-linear-mirror-direction]] · [[plot-organizing-concepts]].
