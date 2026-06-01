# Plot Project Memory

## ⭐ Plot 정체성 (영구 디자인 원칙, 2026-05-03 확정)

> **"Gentle by default, powerful when needed."**
> 기본만으로 충분, 원할 때 강력. 소란스럽지 않게.
> 모든 디자인 결정의 척도.

---

## ✅ 2026-06-01 (집/Windows, 오후) — 리디자인 비파괴 프리뷰 스캐폴딩 (5 surface) + 상용화 우선 결정 ⭐⭐⭐⭐

**범위**: god 컴포넌트 라이브 0 touch로 5개 surface를 순수 presentational+mock+preview 라우트로 격리 추출(Open Design 핸드오프용). + 디자인 보류·상용화 우선 결정.

### 핵심 결정 (영구)
- **상용화 우선, 디자인 보류**(사용자 주도): 디자인 상용급·인프라 0.1단계 → 인프라 급선무. 리디자인 스캐폴딩 파킹(`/preview/redesign`, 폐기 아님).
- **프리뷰-우선 비파괴 추출 = 정통**: 라이브 god 인플레이스 리팩터 X → 격리 presentational+mock → Open Design 핸드오프 → 확정 후 라이브 스왑. preview-first DNA(#138/#154) 정합.
- **리디자인 단위 = surface(~25-30) ≠ 234 atomic 컴포넌트**: Open Design은 화면 단위. 콘텐츠 블록은 surface 일부.

### 완료
- 5 surface(홈/사이드바 2-of-7/노트리스트/에디터/인사이트) presentational+mock+route, 23 신규 파일. `components/redesign/` + `app/preview/redesign/`. tsc 0, 5라우트 렌더 검증, hydration 버그 픽스(`Date.now()`→`PREVIEW_NOW`). **앱/Store 무변경(v154)**.

### 기술 학습 (영구)
- 정적 mock SSR + `Date.now()` = hydration mismatch(라이브는 IDB client-only라 안 드러남). preview cross-origin(`localhost`↔`127.0.0.1`) 탭 꼬임 주의. `nextjs-portal` 존재≠에러.

### 다음 우선순위 (P0)
1. **상용화 P0 — 캐치올 라우팅(ⓑ)** (fresh 세션, `desktop-local-first.spec.md`). `/inbox` anomaly 동시 해결.
2. 리디자인 재개(내부 콘텐츠+나머지 surface) = 상용화 후.

### Store version / HEAD
**무변경(v154)**. main HEAD = 이 PR 머지 후. 머신=집/Windows.

---

## ✅ 2026-06-01 (집/Windows) — 데이터 라이프사이클 감사 완료 (PR1/2/3 머지) + 디자인 방향 재고 합의 ⭐⭐⭐⭐⭐

**범위**: 전수 감사(병렬 4-agent + 직접 검증) → 삭제/시드 정확성 3 PR. 출시 블로커(삭제 데이터 부활) 0. + 디자인 방향 재고 합의(별도 트랙).

### 핵심 결정 (영구)
- **삭제 정확성 = 출시 핵심**: `deleteNote`=정통(가장 완전) 패턴, 나머지 삭제 액션이 불완전 복제였음. 별도 IDB store **5개**(note-body/mention/attachment/wiki-block-meta/**wiki-block-body**) 정리 필수. **정리함수 존재 ≠ 호출**.
- **시드 1회성(`hasSeeded`)**: "비면 재시드"=버그. 신규=웰컴노트1개(prod)/데모(dev). migrate backfill 3곳 제거(version bump마다 지운 시드 부활). 기존 유저 migrate hasSeeded=true 보존.
- **spec 확정버그 #2(위키 blocks orphan) = 오류**: `deleteWikiArticle`이 실제 meta+body 둘 다 정리 중.
- **디자인 방향 재고**(사용자 주도): Linear 과한 절제 탈피 → ③진단→①철학재조정→②전면, 목업 우선. 코어 불변. → 다음 세션. (memory `project_design_direction_reconsider.md`)

### 완료 (3 PR)
- PR1 #508 삭제 cascade 완전성 / PR2 #509 re-seed v154(부활 0, 웰컴 노트) / PR3 #510 trash 좀비(SmartBookPreset/WikiTemplate).

### 기술 학습 (영구)
- `.test.ts` 수정 후 tsc 재검증 필수(vitest 통과 ≠ tsc implicit-any, build는 test 제외, 파이프 head/tail은 exit code 가림). worktree+한글경로 turbopack build 불가→`--webpack`. 마이그 검증=사용자 실화면(env preview store 약함).

### 다음 우선순위 (P0)
1. **디자인 ③ 진단** (홈/사이드바/노트리스트/에디터/인사이트 "어디 답답한지") → ① 재조정. 목업 우선.
2. (별도) comments/folders soft-trash(PR4) · migrate-v107 7개(기존) · turbopack worktree build.

### Store version / HEAD
**v153→v154** (`hasSeeded`). main HEAD = PR3 머지 후(`6c8a011` #510) + after-work docs. 머신=집/Windows.

---

## ✅ 2026-05-31 (밤 늦게) — 데이터 라이프사이클 감사 발견: re-seed 부활 버그 + 위키 blocks IDB orphan (전수 감사 다음 세션, 앱 코드 무변경) ⭐⭐⭐⭐⭐

**범위**: 상용화 데이터 질문 3개(시드/영구삭제/OS휴지통) 실측 → **확정 버그 2개** 발견 + 데이터 라이프사이클 감사 spec 작성. **앱 코드 무변경.** SOT=`docs/01-plan/features/data-lifecycle-audit.spec.md`.

### 핵심 결정 (영구)
- **삭제 정확성 = 상용화 핵심**(신뢰/저장/GDPR): 데이터 부활 0·orphan 0·완전 삭제.
- **"별도 IDB store" 엔티티 = 위험지대**: Zustand persist와 별개로 IDB에 본문/blocks 저장 → 영구삭제 시 둘 다 지워야. 노트=됨(`removeBody`), **위키=누락**(`deleteArticleBlocks` 미호출).
- **시드 = 1회성이어야**: re-seed "비면 부활"(`index.ts:319`)은 버그. 신규 유저=빈 상태(or 웰컴 노트 1개).
- **OS 휴지통(Q3)**: 지금/IDB ❌, P2(.md 파일) ✅(Tauri `trash`/Electron `shell.trashItem` = 옵시디언 방식).

### 확정 버그 (수정 대상)
1. 🔴 re-seed 부활: `index.ts:319` notes 비면 전 엔티티 부활 + 북 backfill(`:338`).
2. 🔴 위키 blocks IDB orphan: `wiki-articles.ts:188 deleteWikiArticle`가 `deleteArticleBlocks` 미호출.

### 기술 학습 (영구)
- **삭제 감사 = array + 별도 IDB store + cascade + re-seed 전부** 봐야 "완전 삭제" 보장. 정리함수 *존재 ≠ 호출* — grep으로 삭제 액션이 실제 호출하는지 확인 필수.

### 다음 우선순위 (P0)
1. **데이터 라이프사이클 전수 감사 + 수정** (출시 전 필수, 사용자 명시 "다음 세션"). 엔티티×축 매트릭스, 병렬 workflow 권장.
2. 데스크톱 캐치올 라우팅(ⓑ). 3. carry: §13 남음(notes /insights·그래프=lens).

### Store version / HEAD
**무변경**. main HEAD = 이 PR 머지 후(직전 `fb1c682` #506). worktree `claude/data-lifecycle-audit`. 머신=집/Windows.

---

## ✅ 2026-05-31 (밤) — 상용화 전략 수립: 무료 로컬-퍼스트 데스크톱 로드맵 (계획 세션, 앱 코드 무변경) ⭐⭐⭐⭐⭐

**범위**: "상용화 가능?" → 실측(백엔드 0/인증·결제 0/IDB 로컬/테스트~12/version 0.1.0) = 디자인 상용급·인프라 0.1단계 → 무료 데스크톱 먼저 전략 + 옵시디언급 데이터 소유 논의 → 로드맵 spec 작성. **앱 코드 무변경.** SOT=`docs/01-plan/features/desktop-local-first.spec.md`.

### 핵심 결정 (영구)
- **상용화 순서 = A(빠른 출시)**: 무료 데스크톱(IDB-on-desktop + export) → 백업 → 유료 싱크+모바일. 데스크톱=데이터가 앱 디스크 영속(브라우저 eviction 없음)이라 "캐시 증발" 블로커 해소 → .md 소유(P2)는 v1.1.
- **저장 = 하이브리드(B)**: 본문 `.md`(사용자 소유) + 부가(books/SRS/온톨로지/뷰) `.plot/` 사이드카. = 옵시디언 방식(.md + .obsidian/). 순수 파일(A)은 우리 관계형 기능과 충돌.
- **셸 = Tauri**(경량·모바일까지, 스파이크 후 / Electron 폴백). **라우팅 = ⓑ 캐치올**(`[[...slug]]` — 정적화 + `/inbox` anomaly 동시 해결). **클라우드 = 중계+백업**(Yjs CRDT 이미 깔림, 데이터는 각 기기 로컬).

### 기술 학습 (영구)
- **상용화 ≠ 디자인**: 디자인 상용급이어도 백엔드/인증/싱크/결제/QA/법무가 제품 레이어. 메모리(RAM)≠저장소(디스크).
- **`/inbox` anomaly = 정적 SPA 라우팅과 동근**: activeRoute 모듈상태 hard-load 복원 실패. 캐치올 라우팅이 둘 다 해결.

### 다음 우선순위 (P0)
1. **데스크톱 P0 — 캐치올 라우팅(ⓑ)**: `[[...slug]]` + `output:export` → `out/`. `/inbox` 동시 해결. **fresh 집중 세션**(코어 라우팅, blast radius 큼, env preview route 검증 약함).
2. Tauri 1일 스파이크(렌더 확인). 3. carry: §13 남음(notes /insights·그래프=lens).

### Store version / HEAD
**무변경**. main HEAD = 이 PR 머지 후(직전 `83c8ec9` #505). worktree `claude/desktop-local-first`. 머신=집/Windows.

---

## ✅ 2026-05-31 (저녁) — 온톨로지 정리 §13 (insights 해체→Dashboard+Inbox+그래프 rings) + 사이드바 헤더(닫힘 B) + /graph-insights 폐기 ⭐⭐⭐⭐⭐

**범위**: before-work로 §13 진입 → 사용자가 **"insights(발견)≠dashboard(분석)"**이라 spec "dashboard→insights 흡수"를 뒤집음 → C안 합성. + 사이드바 닫힘 버튼 헤더화(B). + /graph-insights 폐기. build 0/tsc 0. **Store 무변경**. 1 PR(19파일 +135/−758).

### 핵심 결정 (영구)
- **insights(발견) ≠ dashboard(분석)**: 분석 차트=Dashboard 한 곳(Cohesion radial/복합 Top Notes(WAR)/Density 흡수, 중복 donut 버림), 발견(Nudge orphan/promote/unlinked/linked)=Inbox `detected`(`ontology-nudge` kind, Lightbulb 아이콘), 그래프는 `connectionCount===0` 고아 ring으로 발견 시각 잔존, insights 탭 해체(graph/dashboard 2-way + persisted 가드). 헌법 "액션은 Inbox 단일화" 실현. **spec §13 "흡수" → "해체"로 정정**.
- **사이드바 닫힘 = 헤더 행(B)**: 리니어 방식(헤더에 닫힘/콘텐츠 아래). 우리 사이드바는 공간전환을 액티비티바로 빼서 헤더 없어 닫힘이 Inbox 카운트 위에 떠 겹쳤음(실측 x261 vs x260) → aside 최상단 `<header>`(좌 공간명 `t(\`nav.space.${activeSpace}\`)`/우 닫힘 hover). §10 "사이드바=인-패널" 유지.
- **/graph-insights 폐기**: GraphInsightsView(343줄, 고아 라우트·Dashboard 중복·stale noteType) 삭제. "insights 3개 분산(notes/ontology/graph) 통합"의 graph 조각 = 폐기.

### 기술 학습 (영구)
- **preview route-gated 화면 오독 주의**: hard-nav /inbox→home을 "버그 확정"이라 성급 단정 → 실은 사이드바(공간 콘텐츠)를 메인으로 오독. **data-active + visible heading(h1/h2/header)으로 메인 뷰 정체 확정** 후 판단. 사이드바는 route-gated 아니라 rect 실측 가능.
- **nudge ts = noteById 계산**: useKnowledgeNudges 안 건드리고 use-inbox에서 `noteById.get(nudge.id.split(":")[1])?.updatedAt`. nudge.id primary 토큰=항상 note id.
- **사이드바 헤더 placement**: `.a-sidebar` flex-col이라 shrink-0 헤더 + flex-1 nav 자연 배치(nav pt-2.5→pt-1).

### 다음 우선순위 (P0)
1. **(검증) `/inbox` refresh→home anomaly** — 인앱 클릭 정상, F5/직접URL만 의심. `layout.tsx:96` syncFromPathname vs `:105` start-view redirect.
2. **§13 남음** — notes `/insights` 통합 + 그래프=display mode(렌즈, 큰 리팩터 scope 먼저).
3. carry: Book kind 라벨(Auto/Manual/Mixed)·noteType 데드코드·모션/A3.1 LCH.

### Store version / HEAD
**무변경**. main HEAD = 이 PR 머지 후(직전 `fbc7b7e` #504). worktree `claude/loving-perlman-14676f` → 머지 후 fresh. 머신=집/Windows.

---

## ✅ 2026-05-31 (오후) — 셸 §10 Phase 2·3 완성 — 사이드바 hover 토글 + 햄버거 완전 제거 + 액티비티 바 토글 → 상단바 ⭐⭐⭐⭐⭐

**범위**: before-work로 §10 Phase 2 시작 → Phase 3(햄버거 제거+액티비티 바 토글) + 사용자 요청으로 액티비티 바 토글 위치를 인-패널→상단바로 이전. tsc 0 / build 0. **Store version 무변경(전부 UI/shell).**

### 핵심 결정 (영구)
- **패널 토글 분산 완성**: 디테일=콘텐츠 우상단 / 사이드바=인-패널 hover(우상단 `PanelLeft`) / 액티비티 바=상단바 영속(`PanelLeftClose`/`PanelLeftOpen`). **비대칭 의도적** — 크롬 패널(좁은 레일, 모드 스위치) → 상단바; 콘텐츠 패널(폭, 맥락적) → 인-패널. 대칭(상단바 2개) = 펼쳐놓은 햄버거 재현 → 기각.
- **사이드바 접힘 = 좌측 expand rail**(`w-3.5`, faint `›`, hover 강조). 사이드바 `return null` 아님.
- **액티비티 바 접힘 = `return null` 유지** — 상단바 토글로 복귀. 인-패널 rail 없음(actbar+sidebar rail 2개 나란히 어색).
- **PanelsMenu 완전 삭제** — `components/panels-menu.tsx` git rm. GlobalTopBar 단일 소비자였음. 햄버거 #120 LOCKED 패턴 폐기.

### 기술 학습 (영구)
- **`return null` collapsed 패턴** = 상단바 등 외부에 재-open 경로 필수. 없으면 키보드(⌘⇧A)만.
- **dev bottom-left "N" = NEXTJS-PORTAL** — 인-패널 `mt-auto`(foot) 배치 시 겹침. 프로덕션 없음.
- **상단바 버튼 순서**: [P @14] → [액티비티 바 토글 @68] → [시계 @97] → [‹ @127] → [› @157].

### 다음 우선순위 (P0)
1. **온톨로지 정리 (§13)** — dashboard→insights 흡수, NUDGE→Inbox `detected`, 그래프=display mode.
2. carries: Book kind 라벨·noteType 데드코드·모션/A3.1 LCH·wiki status 세터화.

### Store version / HEAD
무변경. main HEAD = 이 PR 머지 후. 머신=집/Windows.

---

## ✅ 2026-05-31 (낮~오후) — §11 북·위키 status/priority 워크플로 완성 + 코멘트→Inbox + 북마크 capped + 셸 PanelsMenu/§10 Phase1 (4 P0, 1 PR) ⭐⭐⭐⭐⭐

**범위**: before-work로 PR #501 이어받음 → P0 #0(코멘트→Inbox)·#0b(북마크 capped)·#1(§11 북·위키 status/priority) + 사용자 적발 셸 PanelsMenu 중복 버그 → §10 Phase 1까지. 4 P0를 1 PR로 한꺼번에 머지.

### 핵심 결정 (영구)
- **§11 북·위키 status·priority 워크플로 = 3-entity 통일 완성**: Books status 세터 = **detail panel(BookDetailPanel) + 보드 status 4컬럼 드래그 + list 인라인 StatusDropdown + 그리드/보드 배지**. Book·Wiki **priority 필터·배지·세터**. **status·priority = manual·hybrid만(smart = N/A)** — 세터/배지 전부 `kind!=='smart'` gate, 보드 status 그룹핑선 smart=backlog.
- **Books도 detail panel 있음** (사용자 적발): `showDetailPanel:false`는 *list view* 한정 — 실제 = `sidePanelContext{type:"book"}`→`BookDetailPanel` + `/books/{id}` `BookDetailPage`. status 세터 proper home.
- **HTML 중첩 제약**: 그리드/보드 카드=`<button>` → 인라인 피커(button) 중첩 불가 → **카드=배지(읽기전용), 인라인 피커는 BookTable 행(`<div>`)**.
- **코멘트=task급 → Inbox `comment` kind**: `CommentStatus` todo/blocker → `do` 섹션(backlog/done 제외). 클릭=anchor(note/wiki) 네비. ("활동 위젯"은 메모리 drift였고 코멘트만 진짜 고아였음 — spec 실측 확인.)
- **§10 패널토글 = 리니어식 분산** (중앙 햄버거 폐기 방향): 디테일=콘텐츠 우상단(Phase1✅, 이미 구현돼 있었음), 사이드바=엣지핸들(Phase2), 중앙 `PanelsMenu` 제거(Phase3). Notion식 중앙 체크리스트 ≠ Linear.

### 기술 학습 (영구)
- **adapter-equivalence.test.ts = 하드코딩 필터 카테고리 assertion**: `*_SCHEMA` 필터 prop 추가/이동 시 cluster/key 배열 갱신 필수. **PR #501이 books status 필터 추가하며 이 테스트 미갱신 → pre-existing 실패 1건**이었음(이번 정정 + wiki도 갱신, 24/24).
- **displayOrder tie-break = 선언 인덱스**: 기존 값 안 건드리고 신규 prop을 displayOrder 0으로 두면 선언순 정렬.
- **PanelsMenu 단일 mount(#120) drift**: view-header는 GlobalTopBar로 이관됐는데 note-editor(`:470`)/book-detail-page(`:792`) 헤더만 옛 패턴 잔존 → "에디터 햄버거 중복" 버그. (주석 "Mirrors view-header" stale.)
- **preview**: store-eval로 데이터/배지/보드컬럼/패널 검증 OK. **route 전환(노트 에디터 mount) = module state라 eval 불가** → 셸/에디터 시각은 사용자 실화면.

### 다음 우선순위 (P0)
1. **셸 §10 Phase 2** — 사이드바 토글 분산(엣지핸들 + 헤더 토글, `linear-sidebar.tsx`). 이후 Phase 3(중앙 PanelsMenu 제거 + `⌘\` 충돌 + 단축키 정리).
2. **온톨로지 정리**(§13: dashboard→insights, NUDGE→Inbox, 그래프=display mode).
3. carry: Book kind 라벨 Auto/Manual/Mixed · noteType 데드코드 · 모션/A3.1 LCH · wiki status 세터화(현 read-only 배지).

### Store version / HEAD
**무변경**(status/priority/reads는 v153 기존, 이번 전부 UI). main HEAD = 이 PR 머지 후(직전 `e9a1e09` #502). worktree `claude/gracious-mclean-5045c6` → 머지 후 fresh. 머신=집/Windows.

---

## ✅ 2026-05-31 (밤) — 아이콘 리니어화 + SPACE_ICONS SOT + Item C 인기순위/§11 북 status·reads(v153) + Home §13 슬림화 (PR #501, 2커밋) ⭐⭐⭐⭐⭐

**범위**: before-work 시작 → 사용자 연쇄 §13 정합 지적(아이콘 drift→KB 3그룹화→inbox 중복)으로 확장. 아이콘 전면 SOT화 + Item C(인기순위 신규) + Home §13 슬림화. PR #501 머지.

### 핵심 결정 (영구)
- **SPACE_ICONS SOT 신설**(`lib/entity-icons.tsx`, 7공간) — 엔티티 ENTITY_ICONS처럼 공간 아이콘도 단일 정의. Archive가 books/library/references 혼용된 표면 drift 해소. 온톨로지 Waypoints·캘린더 CalendarDays·자료실 Library·**라벨 Ribbon 확정**.
- **§13 Home = cross-cutting only**: 본진 있는 것(Inbox=전역공간 / 최근=상단바 recently-viewed) 미리보기 제거. 지식베이스 3그룹화(본체/분류/출처). "액션은 Inbox 단일화."
- **§11 북 = 데이터/필터까지만**(status/priority/reads + v153 + status필터 + kind→classification). 세터 UX·priority 표시는 다음(Books detail panel 없어 설계 결정).
- **인기 순위 = reads 기반**(Note/Wiki/Book.reads). Home(노트+북 cross-entity)·Wiki(위키) top5.

### 기술 학습 (영구)
- **delegated executor 산출물 = tsc 직접 검증 필수**("completed"인데 깨진 채 보고 사례 — JSX 안 지우고 데이터/import만 지움). 
- **큰 정렬/nbsp 블록 = Edit보다 Write 전체교체**. **파일 겹침 = 비대화형 hunk 분리 불가**(2커밋 타협).
- **메모리가 spec과 drift할 수 있음 — spec/코드 실측 우선** (세션 끝 토론 발견): §13 "활동 위젯(코멘트/북마크/링크)"은 메모리 elaboration이고 spec(§13 Home=3위젯)엔 없었음. 코드 실측 = 북마크는 퀵링크스 **capped 버그**(sortKey5+limit8로 핀 많으면 증발), 링크는 온톨로지, **코멘트만 task급(blocker) 고아 → Inbox**. 코멘트 `CommentStatus`=backlog/todo/done/blocker(거의 이슈급).

### 다음 우선순위 (P0, 사용자 명시 — 다음 세션 첫 작업)
1. **코멘트 → Inbox 통합** (정정 — "활동 위젯" 폐기, 메모리 drift였음). 코멘트=task급(`CommentStatus` blocker)인데 글로벌 액션 뷰 없음 → Inbox `comment` kind(todo/blocker=do). + **북마크 퀵링크스 capped 버그 승급**(mixed-quicklinks sortKey5+limit8 증발).
2. **§11 북 status 세터 UX**(보드 드래그 vs 인라인 피커 설계) + priority 표시.
3. carry: 온톨로지 정리·셸 §10·Book kind 라벨·noteType·**6-item Claude Design 사전정지 트랙**.

### Store version / HEAD
**v153**(Book.status/priority/reads + WikiArticle.priority 멱등 백필). main HEAD = PR #501 머지 후(직전 `47a4e93` #500). worktree `claude/stupefied-swartz-285672` → 머지 후 fresh. 머신=집/Windows.

---

## ✅ 2026-05-31 (낮~저녁) — 셸 §10 footer/레일 + 색·아이콘 시스템 정합 + IA 헌법 §13(Home 종합대시보드 A→C) + 지식베이스 9-entity + 엔티티 아이콘 SOT (8커밋) ⭐⭐⭐⭐⭐

**범위**: 헌법 §10 적용 시작(셸 footer/레일) → 사용자 "뒤죽박죽" 적발로 **색·아이콘 시스템 전면 정합** → IA 재논의(Home/Inbox/온톨로지) → **§13 Home 슬림화 A→C 정정**(Plane 반례·노트앱 진입 검증) → 지식베이스 9-entity + **엔티티 아이콘 SOT 신설**. 8커밋(origin/main `159ee1e` 기준 → 이 세션 PR/머지).

### 핵심 결정 (영구)
- **IA 헌법 §13 = Home 종합 대시보드 (A→C 정정)**: Home 폐지(A)는 리니어/Plane=PM툴 편향. 노트앱(Notion=Home위젯/Anytype=사이드바위젯/Logseq=Daily Note)은 위젯 진입 정당. 퀵링크스(`MixedQuicklinks`=통합 핀 허브, 사이드바 Pinned보다 포괄)·지식베이스(개요≠Library 관리)는 고유 → **Home = 개인 활동 종합 대시보드 (cross-cutting only)**. **자산**(본체/분류/출처) + **활동**(코멘트/북마크/링크) 2단.
- **"액션은 Inbox로 단일화"**: Home 미리보기·온톨로지 NUDGE → Inbox `detected`(이미 중복).
- **색·아이콘 SOT**: `KNOWLEDGE_INDEX_COLORS`(색, 9 entity) + `lib/entity-icons.tsx` `ENTITY_ICONS`(아이콘). 표면별 하드코딩 금지. 라벨=Badge/카테고리=Layers/태그=Tag 갈라짐, books=BookMarked(자료실 Archive 분리).
- **priority=색→3-막대**(status 색 충돌 해소) / **book kind=무채**(분류축=형태) / **status hex→var**(모드별 명도).

### 기술 학습 (영구)
- **리니어/Plane=PM툴 vs 우리=노트앱**: IA 판단 시 비교 대상 편향 주의(Home 폐지 A안이 이 편향이었음).
- **SOT 부재 = 표면별 drift**: Label/Categories/Tags가 detail panel서 전부 PhTag였던 게 증거. 색·아이콘 둘 다 SOT.
- **9 entity distinct hue = 색공간 포화**(books/labels rose 인접·categories/tags green 인접 → 명도/그룹). **dev screenshot Next16 느림/검은화면**(사용자 실화면). **lucide 아이콘 = 표정/디자인 포함**(Sticker=웃는 표정 → 커스텀 SVG).

### 다음 우선순위 (P0)
1. **스티커 접힌-모서리 커스텀 SVG**(사용자 명시, `lib/entity-icons.tsx` ENTITY_ICONS.stickers, 현 StickyNote 임시).
2. **Home 종합 대시보드 구현**(자산/활동 2단, 활동 위젯 코멘트/북마크/링크 신규, Inbox미리보기/추천/최근 제거).
3. **온톨로지 정리**(dashboard→insights, NUDGE→Inbox, insights 3개 통합, 그래프=display mode).

### Current main HEAD / worktree
`159ee1e`(PR #499) → 이 세션 8커밋 머지 후. worktree `claude/loving-yalow-ebc0d3` → 머지 후 main 기준 fresh. **머신**: 집/Windows.

---

## ✅ 2026-05-31 (심야) — IA 헌법 수립 (리니어 관점 정보구조 전면 재설계) + Inbox 전역 승격 (PR #497/#498) ⭐⭐⭐⭐⭐

**범위**: 코드 거의 안 짠 순수 브레인스토밍 세션. 사용자 "느낌" IA 결정(섹터/status/라벨/북/스티커)을 코드 전수조사 + 리니어 109캡처 실측으로 검증 → git-tracked 헌법. **SOT = `docs/01-plan/features/linear-ia-constitution.spec.md`(14챕터).** PR #497(헌법+Inbox 승격+목업), #498(after-work docs). 이번 세션=결정, 다음=적용(구현).

**사용자 의도** (인용): "개념과 기능을 우선 리니어 수준, 리니어 관점(시각), 리니어 해석으로 깎아보자" + "리니어 팀이 만들었다면" + "이미 구현된 기능/개념/명칭 재논의·재설계, 필요하면 과감히 제거".

### 핵심 결정 (영구, IA 헌법)
- **트리코토미** = 모든 개념 Destination/Display-mode/Facet 중 하나 (배치의 법). 리니어 Label=facet("눈에 안 보이게"의 정체).
- **렌즈 모델** = 7 space는 atom(Note)의 6렌즈 + 진입점. "자유도 최대"의 메커니즘.
- **MIRROR/ADAPT/SKIP** = 리니어 흡수 분류 (탭=도입 확정 / Cycles·Linear Diffs=SKIP).
- **atom-home = multi-lens by reference** (코드 검증, 2 에이전트 교차). 비대칭 C노선(Calendar 위키 누락만 메움, Folder 타입감옥=의도).
- **noteType==="wiki" = 레거시 데드**(사용자 적발). 진짜 위키 = WikiArticle. **Notes/Wiki = 2 destination 유지**.
- **Calendar/Graph → display mode**, **Tags/Labels/Stickers → facet**. Ontology(graph+dashboard+insights)/Library/References/Files = destination 유지.
- **Book vs Sticker = 중복 아님**(Sticker=facet 강등). **3-entity 워크플로 통일**: Notes/Wiki/Books 모두 status(4단계)+priority(5단계). Book=manual·hybrid만(smart=N/A), kind→classification 이동.
- **공통자산 커스텀**: Status/Priority 고정 / Label(N:1 종류)·Tag·Category 커스텀. **크롬 일관성은 A3.2 스키마엔진이 이미 강제.**
- **Book kind 라벨**: Smart/Manual/Hybrid → Auto/Manual/Mixed(코드 키 불변). **Smart Book ≠ Template**(생성틀 vs 라이브쿼리).
- **셸**: 레일 유지+리니어 톤다운(절제). Inbox 최상단(완료)/Trash 하단/Help 하단/설정=워크스페이스메뉴. 아이콘=Lucide 문법+도메인 글리프만 정밀.

### 기술 학습 (영구)
- **IA 결정 = 코드 전수조사 필수**("코드 봐라"가 2번 내 추측 정정: Ontology/Library 강등 과잉, noteType 데드). Explore 에이전트 보고도 grep 호출처 0으로 교차검증.
- **명칭 통일 = 본질 같을 때만**(이름 같다고 합치면 혼란). type은 Label 전용.
- **리니어 Project(=Book)는 status+priority 둘 다 보유**(캡처 실측 `Filter-Project properties-Project status.png`). 리니어 status 2층(고정 type+커스텀 값) — 우리는 type층(4단계)만=노트앱 충분, 2층 커스텀=SKIP.
- PowerShell here-string `@` 누수 → 커밋 메시지 첫 줄 오염(PR #497 제목 `@`). commit -F 파일/here-doc 권장.

### 다음 우선순위 (P0, 헌법 적용 단계)
1. **셸 목업 락 → 포팅** (§10): 목업 `docs/v3-mockup/shell-linear-mirror.html` 사용자 승인 → Trash 하단 강등 / Help `?` 버튼 / 레일 톤다운 / 패널 토글 분산.
2. **Book 워크플로 축** (§11, ~25줄+store version bump): status(노트 4단계)+priority(노트 5단계) 추가, kind→classification, Wiki priority 추가. 크롬은 스키마엔진 자동.
3. **Book kind 라벨** (§13): Auto/Manual/Mixed (코드 키 불변, 라벨+i18n만). + noteType 데드코드 정리(chip, wiki-auto-enroll 실동작 확인 먼저).

### Current main HEAD / worktree
PR #497/#498 머지 후 main (직전 `b5edf28` #496). worktree `claude/quirky-williams-7c00a9`. 다음 = main 기준 fresh. **머신**: 집/Windows.

---

## ✅ 2026-05-30 (밤) — A3.2 스키마 엔진 머지 + A3.3 필터 크롬 + 노트행 모션 + 셸 1차 정리 (레이아웃 모방 전환) ⭐⭐⭐⭐⭐

**범위**: A3.2(스키마 엔진 M0~M4)+폰트 Pretendard PR #495 머지. A3.3(필터 크롬 divider/16px/칩바). 노트행 모션 슬라이스(토큰 시드). 사용자 "레이아웃 골격도 완벽 모방" 방향 전환 → 셸 보조UI 진단 + 1차 정리(⌘K 팔레트/죽은코드/avatar 드롭다운/이니셜). worktree 7커밋 → 이 PR 머지.

### 핵심 결정 (영구)
- **레이아웃도 리니어 완벽 모방** (사용자 전환): 3-zone 골격 유지 + 그 안 디테일(모션/호버/색/보조액션 배치)을 리니어 문법으로. **MIRROR**(리니어 푼 것)+**EXTRAPOLATE**(우리 고유 zone=액티비티바/디테일바/스플릿뷰). 핵심 미덕=**절제**(안 보여줄 건 ⌘K/풀페이지로 숨김).
- **폰트 Pretendard** (Inter 메트릭 복제+한글 네이티브, 다국어). **수직 슬라이스 전략**(넓게=체감0 → 한 표면 깊게 → 토큰 확립 → 전파).
- **A3.2 스키마 엔진**: `PropertyDef[]`(6-카테고리)→어댑터→4표면 자동생성 = config 역전. 출력 계약 불변=소비 0수정. 진짜 동등성=원본 스냅샷 비교(swap 후 테스트는 tautology).
- **리니어 검색 = 3-way 공존**(⌘K 팔레트 / `/` 전역검색 / ⌘F 뷰내. 양자택일 X — 기억 단정 말고 실측).
- **"뒤죽박죽"=미완성 리팩터**(셸 크롬 GlobalTopBar 이사 절반→⌘K 팔레트 고아+죽은코드+과노출). **Trash**=리니어 계정메뉴에 안 둠→사이드바 하단 강등(2차).
- **메모리 정정**: 셸 크롬 이미 `global-top-bar.tsx`로 hoist. 실제 셸 호스트=`app/(app)/layout.tsx`(메모리 "layout.tsx 607/sidebar 2129 god" 부분 stale).

### 기술 학습 (영구)
- **이 환경 preview eval 한계**: route 전환+키 이벤트(⌘K) dispatch가 module state라 안 됨 → visible=사용자 실화면.
- **모션 zero-shift**: 호버 등장은 opacity/visibility(공간 미리 확보), display/width 변동 X.
- **모델 ID**: `/model` 메뉴 선택(괄호 타이핑=may not exist + agent Bash 막힘).

### 다음 우선순위 (P0)
1. **셸 2차**: Inbox 전역 승격 / Trash 사이드바 강등 / Help 시각 진입점 / 액티비티바 존치 결정(대형).
2. **모션 전파**(노트행 토큰→사이드바/버튼) + **A3.1 LCH 토큰 전역화**(oklch 씨앗→colors.ts flat hex 마이그).
3. **A4 priority 막대 SVG**(carry). + follow-up: toggleFilter 死코드 3곳/⌘F 뷰내검색/setSidebarCollapsed.

### Current main HEAD / worktree
이 PR 머지 후 (직전 `693a31b` PR #495). worktree `claude/happy-leavitt-1fb897` → 머지 후 main 기준 fresh.

---

## ✅ 2026-05-30 (저녁) — Track A 착수: 리니어 필터/디스플레이 "200% 미러" 전략 플랜 ⭐⭐⭐⭐⭐

**범위**: 전략 세션. 필터/디스플레이를 리니어 수준으로 미러링하는 대형 initiative 착수. A0(구현)+A1(리니어 분석)+A2(전략 락). spec = `docs/01-plan/features/linear-filter-display-mirror.spec.md`. 커밋 `3f7e22e`(A0).

### 완료
- **A0**: Q1 list-nav dropdown 그룹 캡처 마무리(notes-board/wiki-board/wiki-list) + notes-grid `.a-tg` 헤더+collapse(store-backed `viewState.collapsedGroups`) + `components/group-header.tsx` 공유 추출(GroupHeaderIcon/resolveGroupLabel). tsc 0 / store-eval.
- **A1**: 리니어 캡처 ~100장 `linear-design-mirror` 분석 → spec 문서(드롭다운/패널 spec·컨텍스트 매트릭스·priority 막대 SVG).
- **A2 LOCKED**: 전략 전면 확정.

### 핵심 결정 (영구)
- **Track A/B 분리**: A=필터/디스플레이 리니어 미러(지금). B=`layout.tsx`(607)+`linear-sidebar.tsx`(2129 god) 분해(나중, 셸 리디자인 시). "분해 먼저"는 풀-셸 전제 → 우리 목표엔 detour.
- **리니어 "딱 맞는 옷" = 크롬(structure) 통일 + 콘텐츠(options) 컨텍스트별.** ground truth: Issues/Projects/Inbox 완전히 다른 필터 택소노미(Inbox 5개 알림중심, Projects=Lead/Health/Milestones).
- **Tier**: T1 풀=Notes/Wiki / T2 중간=Books / **Library 유지 + 엔티티별 비례 컨트롤**(평면 Tags/Labels/Templates=경량). "걷어냄"=heavy 패널 제거지 surface 삭제·settings 이동 아님.
- **Priority**: Notes/Wiki(둘 다 status축)✅, **Books=Kind+Priority**(status 없음). 아이콘 = **리니어 3-막대**(화살표 폐기).
- **6-카테고리 공유 축 스키마**(Workflow/Classification/Relations/Metrics/Time/Content) — 엔티티 네이티브 축으로 슬롯 채움(Books 빈약 해결).
- **schema-driven 엔진(FlowBase 차용)**: PropertyDef[]→filter/display/group/sort 자동 생성 = 일관성 코드 강제. **커스텀 상한 L3**(표시토글+SavedViews+값/옵션). **L4(사용자 필드타입 생성)=안 함**(FlowBase 몫, Plot 정체성). 두 앱 DNA 구분.
- **FlowBase 우위 → A3 흡수**: OKLCH/LCH 토큰(리니어도 LCH, Plot flat hex 마이그), paired `-bg/-fg`+`toneClassDual`, 제네릭 `setViewOption`.
- **현 앱 = 기대치 70%** (비는 30% = 정합성·일관성·fit). "리니어 제작진 노트앱" 컨셉 = MIRROR(리니어 있는 것)+EXTRAPOLATE(온톨로지/그래프/인사이트=리니어 7원칙 적용)로 달성 가능. 조건 = 공유 디자인시스템(A3) 락 + 모든 표면 法으로 강제.

### 기술 학습 (영구)
- **디자인 미러 ≠ 창작**: 정확 레퍼런스(실 SVG/CSS) 없이 기억으로 아이콘 그리면 가짜(이번에 priority/tag 가짜 그려 지적). Lucide ~80% + 리니어 고유 DevTools 실측.
- **컨텍스트별 ≠ 비일관**: 일관성은 *틀*(크롬)에서 나옴. schema-driven = 일관성 엔진(사용자 커스텀 무관, 코드 강제).
- dev 서버 screenshot 타임아웃 지속(Next16) — 정적 mockup(serve)은 됨.

### 다음 우선순위 (P0)
1. **A3** 리니어 필터/디스플레이 미러: ①스키마 엔진(keystone) → ②공유 크롬(Linear 5규칙) → ③LCH 토큰(병렬). **미결정: 폰트 Geist/Inter.** spec 먼저 read.
2. (병행 hygiene) 옛 status 코드명(stone/brick/keystone) **119곳/26파일** 정리 (migrate/seeds/tests 옛 enum = backward-compat 유지, 나머지만).
3. (carry) Phase C StatsCard / Books kind nav / Entity Insights recharts / Wiki breadcrumb 마이그.

---

## ✅ 2026-05-30 — 통합 정합성 플랜: 네비 골격 통일 + 온톨로지 재설계 + grid selection/그룹 + Q1 dropdown 그룹 ⭐⭐⭐⭐⭐

**범위**: 직전 P0 #0(notes-grid 비대칭)을 **옵션 B**로 해결 → "즉흥 말고 규칙성 제대로" 사용자 요청 → **통합 정합성 플랜**(네비게이션 + 온톨로지 + 오버뷰) 승인·실행. 8 커밋, branch claude/interesting-varahamihira-eeeaef → main squash. tsc 0 / store-eval 검증(위키·온톨로지 화면은 SPA route 환경상 사용자 직접). v152 유지(전부 UI / 세션 한정).

### 완료 (8 커밋)
- 북스 breadcrumb 버그(book 컨텍스트 note picker → 정적 separator) + list-nav 진행바 + 위키 공간 breadcrumb(ViewHeader titleNode) + grid 카드 selection(board parity) + **preview IPv4 fix**(launch.json -H 127.0.0.1).
- **Phase A** list-nav book TOC dropdown 통일 (note picker 흡수).
- **Phase B** 온톨로지 색=status/모양=공간 + LEGEND 재구조(STATUS/TYPE/BOOKS) + Wiki hexagon glyph + BOOKS BookKindIcon 색.
- sticker member book resolve 누락 수정.
- grid 그룹 섹션 (No grouping만 → status/folder 세로 섹션).
- **Q1** list-nav dropdown 그룹 (인프라 + notes-table; 나머지 site 헬퍼 재사용 남음).

### 핵심 결정 (영구)
- **네비게이션 골격 통일**: book/note/wiki = "공간 › [컨텍스트 dropdown ⌄] › 제목 · N/M · 진행바 · ‹ ›". list-nav = book TOC dropdown 패턴. note picker는 book/list-nav active일 때 숨김(suppressNotePicker).
- **온톨로지 색=status / 모양=공간**: 위키도 status 색(violet 폐기). 공간=모양(note circle/wiki hexagon). LEGEND 축 분리(STATUS 색-dot/TYPE 모양/BOOKS kind). **근본원인 = graph.ts 위키 노드 status "done" 하드코딩**.
- **grid도 그룹 섹션** (board=컬럼 가로 ↔ grid=세로 섹션). view-configs groupingOptions modes에 grid 추가.
- **list-nav dropdown 그룹**: 캡처가 groups(label+ids)도 freeze → dropdown 섹션(≥2그룹). 그룹 label은 view-engine이 이미 resolve(NoteGroup.label).
- **book = graph에서 hull(영역)**, 노드 아님 → LEGEND TYPE은 note/wiki만. **Manual book kind = 무채색**(BookKindIcon: Smart violet/Hybrid amber/Manual neutral).
- **notes-grid 비대칭 해결 = 옵션 B**(더블클릭 open+capture + board parity selection).

### 기술 학습 (영구)
- **preview MCP IPv4 fix**: Next 16 IPv6(::) 바인딩 → preview MCP IPv4 probe 실패. launch.json dev `-H 127.0.0.1`로 근본 해결(이 환경 고질). screenshot은 이 환경서 타임아웃(eval/snapshot/console만).
- **자동검증 한계**: `window.__plotStore` store-eval로 노트·book·온톨로지 노드·dropdown 검증. 위키/온톨로지 **화면 전환은 activeRoute module state라 eval/click 불가** → 사용자 직접 시각.
- **eval 함정**: `const st=getState()` 후 setViewState → `st.*`는 stale. fresh `getState()` 재호출 필요.
- **graph wiki node status 하드코딩** → wa.status + buildOntologyGraphData param·ontology-view 매핑 추가.
- **radix dropdown = pointer 이벤트**: `.click()` 안 됨 → `dispatchEvent(PointerEvent pointerdown/up)`.
- **setViewState = raw merge**(normalizeViewState/applyModeAwareGroupBy 안 거침). grid grouping 노출 = display-panel isGroupingModeAllowed + view-configs modes.

### Watch Out
- Q1 미완(notes-table만). notes-grid/board + wiki list/board 캡처 헬퍼 재사용 마무리.
- 사용자 시각 확인 누적(온톨로지/위키 breadcrumb/grid/sticker book/dropdown/Wiki hexagon).
- grid 빈 섹션(Todo 0) 표시 미결. Phase B 라이트 노드 대비는 사용자 "만족"이라 미터치.

---

## ✅ 2026-05-29 (심야) — list-context-navigation 구현 (Linear 리스트 peek 네비) ⭐⭐⭐⭐

**범위**: 리스트/보드/그리드에서 노트·위키 열면 그 화면 visible-ordered ids를 freeze 캡처 → 에디터 "← {label} N/M →" prev/next + 복귀. bookContext/BookContextNav 일반화한 **형제**. branch claude/hardcore-gauss-c01d27 → main squash. tsc 0 / build / test 282 / Architect APPROVED / preview 런타임 검증.

### 완료
- **인프라**(직접): `ListNavContext` + `listNavContext:{primary,secondary}` + `setListNavContext` (세션 한정 strip/reset) · `lib/list-nav/flatten.ts` · `hooks/use-list-context-nav.ts`(freeze ids prev/next/back, pane-aware) · `components/list-context-nav.tsx` · `hooks/use-list-nav-capture.ts`(route/filter 자동 캡처 헬퍼).
- **mount**: note-editor + wiki-view (우선순위 bookContext > listNavContext).
- **capture**(executor-high + Architect): notes-table/board + wiki-list/board/grid **5뷰**. notes-grid 보류.

### 핵심 결정 (영구)
- **freeze 스냅샷**: list-nav는 클릭 시점 ids 고정(book은 영속이라 매 렌더 재계산). 필터 변경 후에도 "그때 그 리스트" 안정.
- **세션 한정 = store version 무관**: partialize strip → IDB 무영향, **v152 유지**(bump 불필요).
- **클릭 동작 보존**: 노트=더블클릭(단일=preview 기존동작), 위키=단일클릭 → 캡처 지점 다름.
- **notes-grid 비대칭 = 다음 세션 P0 (사용자 지정)**: notes-grid는 preview-only(에디터 직접진입 없음)라 보류, wiki-grid는 적용됨.

### 기술 학습 (영구)
- freeze vs 재계산: `liveIndex = ctx.ids.indexOf(refId)` (book nav는 resolvedContentItems 재계산).
- 세션 한정 store 필드는 version bump 불필요(partialize strip).
- `setActiveFolderId/TagId/LabelId/ViewId` 상호배타 → goBack if/else-if 분기 복원.
- 위키 secondary pane 네비 unmount 한계(book nav와 동일 seam, 수용).

---

## ✅ 2026-05-29 (밤) — Wiki status v151 + 사이드바 정합 + 노트 merge/split + Smart Book Preset (store v152) ⭐⭐⭐⭐

**범위**: NoteStatus 4단계를 Wiki로 확장(v151) + 위키/노트 사이드바·merge/split 정합 + Smart Book Preset 시스템 신설(v152). branch claude/smart-book-preset(a259061 위키 기반) → main squash merge (PR #490 supersede). build/tsc/test green + Architect APPROVED + preview runtime 검증.

### 완료 (5건, 전부 검증)
1. **Wiki status 4단계 (v150→v151)**: `WikiArticle.status`(= NoteStatus) 신규. 자동 stub/article → 수동 backlog/todo/in_progress/done. **시딩 = onRehydrateStorage**(content→done / empty-template→backlog) — partialize가 blocks strip하므로. 색/아이콘/i18n Notes 공유. 보드 2→4 컬럼. Architect HIGH 버그 2개 수정.
2. **Wiki 사이드바 정합**: Merge/Split→More, `/wiki/insights` 신설, Overview 아래 status nav(`wikiStatusFilter`), Recent legacy-filter 버그 수정.
3. **노트 standalone merge/split**: `note-view-mode` store + NoteMergePage + NoteSplitPage + Notes More. overlay route-gated(isTableView) + leaving reset.
4. **Smart Book Preset (v151→v152)**: `SmartBookPreset` 모델 + `lib/store/slices/smart-book-presets.ts` + 3 seed + `/books/smart-books` 갤러리 + Books More(Smart Book + Insights) + `/books/insights`(kind breakdown). 기존 resolver/createBook 재사용.
5. **Wiki 데이터 복원** (런타임/IDB only): trashed 위키 17개 복원.

### 핵심 결정 (영구)
- **Full editor 경계 = Notes/Wiki only** (authored content). 분류/기록 entity(Tags/Labels/Categories/References/Stickers/Files)는 inline + member-list page. **References만 미래 *구조화 상세 폼*(full editor 아님) 후보**.
- **Books 축 = kind**(smart/manual/hybrid), status 아님. **Books Overview 보류**(Insights + 사이드바 Pinned/Recent 중복, continue-reading 빈 상태).
- **list-context-navigation 설계 확정**(plan doc): 진입 화면의 필터+그룹 적용된 *visible ordered set* freeze 캡처 → 에디터 "← {라벨} N/M →" prev/next + 복귀. `bookContext` 일반화, pane별·세션 한정. list/grid/board(timeline 보류), All/status/folder/saved-view 진입. **다음 세션 P0 #0 구현**.
- **Books kind nav 설계 LOCKED**: wiki `wikiStatusFilter` 패턴 1:1 미러 — `bookKindFilter` external store + 사이드바 + getBookKind 필터. (P0 #1)

### 기술 학습 (영구)
- **partialize가 blocks strip → content 기반 시딩은 onRehydrateStorage에서**: WikiArticle status를 content로 매기려면 migrate-time(blocks 부재) 아니라 rehydrate 후 판정. migrate-time이면 all-backlog 버그(Architect 발견).
- **노트 overlay cross-route 누수**: merge/split overlay를 route-gate(isTableView) + leaving reset 안 하면 다른 라우트로 leak(Architect 발견).
- **Wiki Recent legacy-filter**: wikiArticles store 읽기 + trashed 제외 — 옛 필터가 잘못된 소스 읽던 버그.
- v152 = SmartBookPreset 슬라이스 추가(엔진 신규 아님 — 기존 AutoSource/resolver/getBookKind 재사용, Preset 청사진 레이어만).
- **다른 컴퓨터 IDB 머신별 분리** → 첫 실행 시 v150→v151→v152 순차 마이그(데이터 손실 0).

### Watch Out (다음 세션)
- **list-nav freeze 타이밍**: "그 순간 보이던 순서 있는 집합" 캡처. 필터/그룹 변경 후 재진입 시 재캡처. pane별 세션 한정(영속 X).
- **Books kind nav = wikiStatusFilter 1:1**. Books Overview 만들지 말 것.

---

## ✅ 2026-05-29 (오후) — NoteStatus 3→4 단계 REPLACE 완료·머지 (store v150) ⭐⭐⭐⭐

**범위**: 노트 status를 3단계(stone/brick/keystone) → 4단계(backlog/todo/in_progress/done)로 **REPLACE**. 85파일 atomic rename + 라우트 rename + store v150 마이그레이션. executor-high 구현 + Architect APPROVED + tsc/build/test green.

### 핵심 결정 (영구)
- **완성도 축 유지, 3→4 세분화 + 라벨 교체**. Linear 어휘(Backlog/Todo/In Progress/Done)를 빌리되 **의미는 "노트 완성도"로 재정의** — 태스크 관리 피벗 아님. `colors.ts:141` 주석이 이미 brick=정리 중·keystone=완성으로 적시(2026-05-13) → 같은 축의 진화.
- **3→4 매핑**: stone→backlog · brick→in_progress · keystone→done · **todo=신규 수동 단계**(매핑 소스 없음, 빈 채 시작). KO: 대기/준비/정리 중/완성.
- **🔒 LOCKED #118 + #100 폐기**: #118(스톤/브릭/블록 음역 시그니처) + #100(phosphor 건물 아이콘 3종) → 4단계 완성도 축 + Linear circle 아이콘(CircleDashed/Circle/CircleHalf/CheckCircle)으로 대체. 축 의미는 동일.
- **todo는 수동 단계**: 자동 승격 규칙이 todo로 옮기지 않음. autopilot 기존 규칙은 같은 매핑으로 동작 보존(backlog→in_progress, in_progress→done).
- **색**: backlog `#94a3b8` slate(=옛 stone) / todo `#3b82f6` blue(신규, tweakable) / in_progress `#f59e0b` amber(=옛 brick) / done `#34d399` emerald(=옛 keystone).
- **라우트**: `/backlog /todo /in-progress /done` (slug `in-progress` kebab ≠ enum `in_progress` snake).

### 기술 학습 (영구)
- **cardinality 변경(3→N) 마이그레이션 함정**: 신규 단계(todo)는 legacy 소스가 없어, garbage-cleanup(v131 `VALID_STATUSES` allow-list)이 todo를 "무효 status"로 보고 stone "복구"→v150이 backlog 재매핑 = **silent 데이터 유실**. 회피 = cleanup allow-list에 신규 enum 포함(`migrate.ts:1987-1990`). 1:1 rename과 다른 순서 의존성.
- **early-bird viewStateByContext rename**은 `normalizeViewStatesMap`(VALID keys만 iterate) **전에** 돌아야 per-status 커스터마이즈 유실 안 됨(`migrate.ts:96-118`).
- v150 = 6개 영속 surface 매핑(notes.status / viewStateByContext keys / savedViews.space+filters / autopilotRules conditions+actions / customQuickFilters), idempotent.
- **이 환경 preview MCP 불가**: node 누적 + Next 16 dev IPv6(`::`) 바인딩 → IPv4 probe 실패. 시각 검증은 사용자 직접.

### 미해결 (다음 세션 — 전부 "둠"으로 머지)
- a. settings-store `startView:"stone"` 리터럴(별도 store, 라우트 매핑으로 동작). b. `app/preview/linear` 목업(격리, 자체 타입). c. 죽은 i18n 키 `sidebar.stone/brick/block`(미참조). + **UI 시각 미검증**.

---

## 🔧 2026-05-29 (before-work 크로스머신 정정) — A+ folder + Book 폴더 Phase 2 완료 확인

**상황**: 직전 docs(아래 2026-05-28 오후 후속 entry)는 **A+ book/wiki folder = note 패턴**을 P0 #0 최우선으로, **Book 폴더 Phase 2**를 P0로 남겨뒀음. before-work 시 git HEAD가 `3f02d80`(PR #488)인데, 이 둘이 **다른 컴퓨터에서 이미 완료·머지**됐고 SESSION-LOG에 미기록이라 docs가 stale이었음. 코드로 직접 검증 후 정정.

### 코드 검증 (완료 확정)
- **A+ book/wiki folder = note 패턴 → PR #488 (`3f02d80`)**: `lib/view-engine/use-books-view.ts:281` `useBooksView(contextKey, folderId?)` + `:304` `folderId ? visible.filter((b) => b.folderIds.includes(folderId)) : visible`. `components/linear-sidebar.tsx:1147-1156`(wiki)/`1774-1782`(book) 핸들러에 `// A+ folder=filter` 주석 + `setActiveFolderId` + `setActiveRoute("/wiki")`|`"/books"` + `router.push`. folder page는 direct URL용 유지(폐기 안 됨). 파일: linear-sidebar/books-view/wiki-list/wiki-view/use-books-view.
- **Book 폴더 Phase 2 UI → PR #487 (`65efec1`)**: 사이드바 Books Folders section(`linear-sidebar.tsx:1737~` "note/wiki folders by Folder.kind" 주석 + book folder 핸들러) 존재. createFolder/setBookFolders + folder space fix 포함.

### 새 현재 방향 (다음 우선순위, 정정)
1. **🔴 P0 #0**: **Entity Insights 정보 아키텍처 통일 PRD** (plan 완료 = `docs/01-plan/features/entity-insights-coherence.plan.md` A안 확정, **design 남음**. 차트 = recharts 표준화). Notes=별도 `/insights` page / Wiki=dashboard 임베드 / Books=없음 / Ontology=top-level → 위치 통일.
2. **🟡 P0 #1 (carry)**: Wiki `← Overview` → breadcrumb 마이그 (LibraryBreadcrumb 패턴, `wiki-list.tsx:794-802`)
3. **🟡 P0 #2 (carry)**: Phase 3.1 `/preview/linear` reference 비교 + Phase 4 filter-bar Linear 마이그 (source 정리) / Category-Label 필터 비대칭

### 교훈 (영구)
- **크로스머신 stale docs**: 다른 컴퓨터에서 작업·머지 후 after-work(SESSION-LOG/TODO 갱신)를 안 하면 docs가 코드보다 뒤처짐. before-work는 **git HEAD PR 제목 ↔ TODO P0** 대조로 stale 감지 → 코드 grep 검증 → 정정. 이번엔 PR #487/#488 제목이 P0 항목과 1:1 매칭이라 빠르게 잡힘.

---

## 🚀 2026-05-28 (오후 후속) — Library 정합: categories 체크박스 + 컬럼 헤더 i18n + Book 폴더 Phase 2 + folder space fix ⭐⭐⭐

**범위**: Library 정합 연속. PR #486(categories 체크박스 + i18n) + 이 PR(Book 폴더 Phase 2 + space fix).

### 머지된 PR
- **PR #486**: categories list 체크박스(hover-only + 헤더 select-all all/partial/none, CategoryFullListView row button→div) + 컬럼 헤더/탭 i18n (`column.*`/`filter.tab.*` 21쌍 EN+KO + 9 view useT). 한글 헤더 정합.
- **이 PR**: Book 폴더 Phase 2 (createFolder +`"book"`, setBookFolders/addBookToFolder/removeBookFromFolder, folder-picker book, 사이드바 Books Folders section, folder page book branch, book context menu "폴더로 이동") + **table-route folder space fix**.

### 큰 결정 (영구 LOCKED 후보 #169~#170)
- **#169 folder 진입 = entity view + folder filter (note 패턴)**: note folder = `/notes` + folder filter (notes-table 풀폭, linear-sidebar:905-911). wiki/book folder = `/folder/[id]` folder page(max-w-3xl 좁음) = **비대칭 부채**. → **다음 세션 A+ 최우선**: book/wiki도 `/books`|`/wiki` + folder filter 풀폭. folder page는 direct URL용 잔존.
- **#170 table-route inferSpace /folder cross-kind**: `/folder/[id]`는 note|wiki|book 다 가능 → route만으론 space 추론 불가 (default notes 버그 = "북 폴더 클릭 시 사이드바 Notes"). fix = setActiveRoute `/folder/` skip inferSpace(현재 context 유지) + spaceHint, folder page useEffect folder.kind→space.

### 다음 우선순위 (P0, 재정렬)
1. **🔴 P0 #0**: **A+ book/wiki folder = note 패턴** (/books|/wiki + folder filter 풀폭 + breadcrumb). books-view/wiki-view folderId filter(notes `extras.folderId` 복제) + 사이드바 클릭 핸들러(905-911 복제) + breadcrumb. ⭐ 다음 세션 최우선 (사용자 명시, 다른 컴퓨터)
2. **🔴 P0 #1 (carry)**: Entity Insights 정보 아키텍처 통일 PRD (plan 완료, design 남음. 차트=recharts 표준화)
3. **🟡 P0 #2 (carry)**: Wiki ← Overview breadcrumb / Phase 3.1 / Phase 4 filter-bar(source) / Category-Label 필터 비대칭

### 기술 학습 (영구)
- **note folder = /notes + activeFolderId filter** (use-notes-view.ts:96 `extras.folderId`). wiki/book folder = folder page (비대칭 부채).
- **inferSpace(/folder/[id]) cross-kind 한계** — route만으론 note|wiki|book 구분 불가. spaceHint 또는 현재 context 유지.
- **CategoryFullListView = wiki/library 공통** — categories 체크박스/i18n 변경이 양쪽 영향.
- **preview full-reload는 SPA folder page 검증 불가** (store 미노출 + activeRoute SPA). 실제 확인 필요.

---

## 🚀 2026-05-28 (오후) — 사이드바 책 BookKindIcon 정합 + Wiki More section (1 PR) + entity 정합 brainstorm ⭐⭐⭐

**범위**: 사이드바 정합 세션. Books 책 아이콘 부채(BookOpen=Wiki와 동일) 정정 + Wiki More section + entity Insights/Smart Book/Book폴더 정합 brainstorm 대량. `components/linear-sidebar.tsx` 1 파일.

### 머지된 PR (이번 세션, 1 통합)
- **PR (이)** — 사이드바 책 BookKindIcon 정합 + Wiki More:
  - Books 사이드바 pinned/recent + Home/Calendar mixed list 책 = `BookKindIcon` (Smart⚡violet/Manual✏️muted/Hybrid✨amber) — Notes(status)/Wiki(stub-article) 사이드바 패턴 정합
  - `HomePinnedItem`에 `bookKind` 필드 추가 (getBookKind 주입)
  - Wiki More Section 신설 (Templates 이동, Notes 정합 Folders→More→Recent)
  - `Book` import 제거, `BookOpen`은 Wiki Overview NavLink만 (펼친책=Wiki metaphor)

### 큰 결정 (영구 LOCKED 후보 #166~#168)
- **#166 (vision)** 사이드바 entity 항목 = 내부 상태/kind icon 의무. `BookKindIcon` = 모든 surface(사이드바 포함) single source. mixed list도 동일.
- **#167 (vision)** 사이드바 More section 통일 (Notes/Wiki = Pinned→Views→Folders→More→Recent). Books는 Templates 폐기(Smart Book 대체)로 More 보류 — Insights 신설 시 부활.
- **#168 (vision)** Entity Insights 정보 아키텍처 비대칭 = 다음 PRD 핵심. Notes=별도 `/insights` page / Wiki=dashboard 임베드(WikiInsightsChart) / Books=없음 / Ontology=top-level. 위치 통일 필요 (영구 룰 #140 Ontology 전체/entity 세부).

### 조사 결과
- **NoteSource**(manual/webclip/import/share/api) 거의 dead (Web Clipper 미구현, helpers.ts default "manual"). WikiArticle엔 source 필드 없음. Web Clipper도 source 필수 아님(분류 라벨). → 옵션 1(필터 숨김) 합의했으나 filter-bar가 Book kind와 group 공유 + Phase 4 마이그 대상 → **Phase 4 defer**.
- **Smart Book** = Templates의 Books 대응이나 형태 다름(page 없는 book 속성). Smart Book Preset(smart-book-prd.md:601, v2 미구현)이 진짜 대응. ROI 검토(book 생성 빈도 낮음).
- **Book 폴더**: 데이터 Phase 1 완료(`Folder.kind="book"` + Book.folderIds + v149), UI Phase 2 미구현 (createFolder note|wiki만, 사이드바 section 없음, folder page book branch 빈).
- **Category/Label**: 데이터 글로벌(Note/Wiki/Book 모두 categoryIds/labelId + Library hub), 필터 UI 비대칭(Category=Wiki만, Label=Wiki 제외).

### 다음 우선순위 (P0, 재정렬)
1. **🔴 P0 #0**: Entity Insights 정보 아키텍처 통일 PRD (위치 통일 + Books More + Smart Book Preset) ⭐ 다음 세션 첫 작업
2. **🔴 P0 #1**: Book 폴더 Phase 2 (createFolder +"book" + 사이드바 Folders section + folder/[id] page book branch + book-folder-picker)
3. **🟡 P0 #2 (carry)**: Wiki `← Overview` → breadcrumb 마이그 (직전 오전 P0 #0, 이번 미진행)
4. **🟡 P0 #3 (carry)**: Phase 3.1 `/preview/linear` reference + Phase 4 filter-bar Linear 마이그(= source 정리)
5. **🟢 P0 #4 (carry)**: Category/Label 필터 비대칭 (의도 vs 부채)

### 기술 학습 (영구)
- **BookKindIcon = derived(getBookKind), Book.kind 필드 없음**: smartSources/items 유무로 smart/manual/hybrid 계산. 사이드바도 getBookKind(book) 호출.
- **filter-bar "source" FilterGroup = {Note.source + Book.kind + Book.sourceType}** 공유 — group 통째 제거 시 Books 필터 깨짐.
- **Wiki insights 재료(WikiInsightsChart Growth/Connectivity) 이미 존재**, wiki-dashboard 임베드 — 별도 page 아님. entity Insights 위치 비대칭 근원.
- **HomePinnedItem mixed type에 entity별 메타 주입**: note=status, wiki=isStub, book=bookKind.

---

## 🚀 2026-05-28 (오전) — Chrome icon 굵기/선명 + chip strip 시인성 + Books table notes/wiki parity 부채 정정 (1 통합 PR) ⭐⭐⭐

**범위**: 사용자 시각 polish 세션. 라이트 모드 시인성 강화 + Books entity의 1년 차 parity 부채 정정. 5 파일 +40/-26.

### 머지된 PR (이번 세션, 1 통합)
- **PR (이)** — Chrome icon + chip strip + Books parity:
  - `global-top-bar.tsx` (8 곳): chrome icons strokeWidth 2 → 2.25, `text-muted-foreground/70` → `text-muted-foreground`
  - `panels-menu.tsx` (1 곳): 햄버거 trigger 동일 패턴 + ListIcon에 strokeWidth 2.25 명시
  - `view-header.tsx` (4 곳): quick filter chip strip border `/60`, chip pill outline `/70` (3개), "+" dashed `/70` → 풀 `border-border`
  - `wiki-list.tsx` (1 곳): Wiki sub-tabs controls bar `border-subtle` → `border`
  - `book-table.tsx` (5 곳): cols.map header+body title cell에 `marginLeft: -8` patch + TH `font-normal` → `font-medium` (2개) + body title span에 `font-medium` 추가

### 큰 결정 (영구 LOCKED 후보 #163~#165)

**1. #163 (vision) Chrome icon 굵기/색 표준 (라이트 모드 시인성)**:
- chrome icon 카테고리 = strokeWidth **2.25**, opacity 70% 금지
- view-configs.tsx 메인 콘텐츠 SVG (strokeWidth 1.2~1.4)와 별도 카테고리
- DESIGN-TOKENS.md에 `--stroke-chrome: 2.25` 토큰 등록 가치 (다음 세션 carry)
- 보조 UI (placeholder, kbd cap)는 `/70` opacity 유지 (자연스러운 hierarchy)

**2. #164 (vision) Wiki `← Overview` 폐기 결정 (1년 차 정합성 부채)**:
- `library-breadcrumb.tsx:6` 코멘트 명시: "사용자 시그널 **2026-05-14**: Wiki의 `← Overview` 패턴보다 Notes의 breadcrumb 패턴이 더 자연"
- Library는 그때 마이그됐으나 Wiki만 누락 → 1년 가까이 부채로 남음
- 다음 세션 P0 #0: 옵션 A (최소 마이그) 진행. Linear/Notion/Plain 모두 breadcrumb 정통.

**3. #165 (vision) Entity table 시각 parity audit 의무화**:
- Books만 marginLeft -8 + font-medium 둘 다 누락 발견
- 새 entity table 추가 시 `notes-table.tsx:1890` 코멘트 기준 visual parity audit 의무
- audit grep 패턴: `cols.map.*c.width` 안 marginLeft 부재 + TH `font-normal` + body title 미 font-medium

**(별도 결정 carry)** border 토큰 swap 의혹:
- 라이트 모드 `--border: #a8a8ad` < `--border-subtle: #a1a1aa` (subtle이 더 진함) = semantic reverse
- 옵션 1) subtle 더 옅게 (#d4d4d8 zinc-300), 옵션 2) border 더 진하게 (#71717a zinc-500), 옵션 3) 현행 유지
- 글로벌 영향이라 사용자 결정 대기

### v3 PRD 영향
- Plot v2 Linear 재디자인 Path A 부수 작업 (라이트 모드 시인성). 본격 마이그(filter-bar/display-panel)는 Phase 4 carry.
- Wiki breadcrumb 마이그 = chrome 통일 path와 정합. 다음 entity 추가 시 EntityBreadcrumb 공통 컴포넌트 추출 가치 (옵션 B).

### 다음 우선순위 (P0, 재정렬)
1. **🔴 P0 #0 (이번 세션 결과)**: Wiki `← Overview` 폐기 → breadcrumb 마이그 (1년 차 정합성 부채, 옵션 A 50-80줄)
2. **🔴 P0 #1 (carry)**: Phase 3.1 — `/preview/linear` 12장 reference 이미지 1:1 비교 + fine-tune
3. **🔴 P0 #2 (carry)**: Phase 4 — `components/filter-bar.tsx` + `components/display-panel.tsx` Linear 마이그레이션 (사용자 명시)
4. **🟡 P0 #3 (carry)**: PR #481 close 결정 (PR #482와 중복)
5. **🟡 P0 #4 (이번 세션 발견)**: 다른 entity table parity 부채 audit (Calendar/Ontology/Library categories grep)
6. **🟡 P0 #5 (별도 결정)**: border 토큰 swap 정정 (글로벌 영향)
7. **🟢 P0 #6**: Coverage entity dropdown / Books 엔티티 방향 / NUDGE / Insights KPI 정합 / Book 폴더 Phase 2 (carry)

### 기술 학습 (영구)
- **opacity modifier 누적 = 라이트 모드 시인성 위해**: `text-muted-foreground/70` + `border-border/60` 패턴이 muted 토큰 위에 추가 opacity 곱셈 → 라이트 모드 거의 안 보임. chrome 카테고리는 opacity 사용 금지.
- **notes/wiki 정합 코멘트 = source of truth**: `notes-table.tsx:1890` 같은 코드 내 코멘트가 디자인 의도 source. 새 entity 추가 시 grep 검색으로 발견 가능. 코멘트 부재 = 누락 가능성.
- **사용자 추정 "잘못된 공간" = 정확한 시그널**: 사용자 시각적 부조화 인식 = 거의 항상 코드 부재/오류. 추측 fix 말고 코드 ground truth로 분석 (이번 books marginLeft case 정확히 적중).
- **font-weight 누락 패턴**: Plot row chrome 표준 = `font-medium` (Notes/Wiki). 새 컴포넌트가 `font-normal` Tailwind default로 만들어지면 시각적 mismatch. 항상 `.a-row__title` (font-weight 500) 또는 font-medium 명시.
- **border 토큰 swap 의혹**: `--border` (#a8a8ad RGB 168) < `--border-subtle` (#a1a1aa RGB 161) 진함 — semantic reverse. 라이트 모드 chrome 디자인 결정 시 토큰 정의 의도 검토 필요.

---

## 🚀 2026-05-27 (저녁) — Plot v2 Linear 재디자인 Phase 1+2+3 — `/preview/linear` 라이브 demo (1 통합 PR) ⭐⭐⭐⭐

**범위**: 사용자 명시 큰 결정 ("Plot v2 통째 재설계 Path A" + 12장 reference 이미지) 본격 진입. globals.css에 Linear 토큰 머지 + preview 라우트 라이브 demo 신규 + Filter/Display/Books 풀 재설계.

### 머지된 PRs (이번 세션, 1 통합 PR)
- **PR (이)** — Plot v2 Linear 재디자인 Phase 1+2+3:
  - Phase 1: `app/globals.css` Linear 토큰 머지 (+154줄, `--ln-*` namespace + un-prefixed scale/semantic/spacing/motion/shadow)
  - Phase 2: `app/preview/linear-styles.css` (993줄) + `app/preview/linear/page.tsx` 신규 — 5 surface 라이브 demo (List/Editor/Table/Palette/Dialog)
  - Phase 3: Filter popover (10 fields + 4 quick filters) + Display popover (5 mode + 7 group + multi-sort + 12 prop) + Books surface (4번째 탭, 5 collections + recent), page.tsx 547→993줄 재작성
  - 22개 inline SVG 아이콘 (14px, strokeWidth 1.2~1.4) view-configs.tsx와 동일 시각 어휘

### 큰 결정 (영구 LOCKED 후보 #153~#157)

**1. #153 (vision) Linear 토큰 통합 namespace 전략 (영구)**:
```
--ln-* prefix  → panel hierarchy / hover-selected / border / accent variants (개념 신규)
un-prefixed    → semantic (success/warn/info) / text / spacing (--s-1..10) / motion / shadow / radii
```
- 이유: Linear 컴포넌트 클래스가 토큰을 un-prefixed로 참조 (`var(--panel)`). `.ln-app` scope에서 alias로 격리.
- **v3 LOCKED 토큰 + shadcn 토큰 + Phase 3 mockup `.a-*` 클래스 모두 0 touch**.

**2. #154 (vision) Linear CSS 격리 = preview-only**:
- `app/preview/linear-styles.css`에 격리 (globals.css 0 touch)
- Phase 4 마이그레이션 때 필요 클래스만 globals.css로 promotion
- 이유: 기존 앱 zero regression 보장 + 빠른 실험 가능

**3. #155 (vision) `.ln-*` prefix 일관 적용** (충돌 회피):
- shadcn `.sidebar/.card/.kbd` + Plot 기존 `.a-*` 와 충돌 없음
- Linear 원본의 unprefixed `.app/.sidebar/.kbd/.card` 80개 → PowerShell regex로 자동 prefix 변환

**4. #156 (vision) Phase 4 진입점 = filter-bar.tsx + display-panel.tsx (사용자 명시)**:
- 사용자 인용: "필터와 디스플레이는 리니어식으로 꾸며졌거든? 아예 그렇게 해야 될 거 같은데"
- 현재 코드 이미 Linear 4-part chip 패턴 (`[icon] field | op | value | ×`) — 마이그레이션 용이
- preview의 Filter/Display popover (사용자 실 코드 옵션 100% 반영)를 reference로 사용
- 아이콘/폰트/옵션까지 전부 재설계 OK (사용자 명시)

**5. #157 (vision) dev server 포트 = 3000** (NOT 3002):
- `package.json`의 `dev` script = `next dev --webpack` (포트 인자 없음 → 3000부터 잡힘)
- CLAUDE.md의 3002는 오래된 기록, 갱신 필요할 수 있음

**Books surface 방향 미결정** (Phase 4 진입 시 결정):
- 사용자 지적: "book도 없네! 코드에는 있는데, 목업에는 없다"
- 옵션 A) `/library` 별칭 탭 / B) 7번째 entity (rose space, Smart Book v2 plan과 연결)

### v3 PRD 영향
- **Plot v2 Linear 재디자인 Path A 본격 진입** — Phase 0 design language 결정 = Linear 채택 (12장 reference 이미지). 사용자 의도 = "오픈 디자인이라는 강수를 도입. 통째 재설계 의도".
- Phase 4.3 chrome 통일 (기존 north star) → Linear 재디자인 path와 합류. filter-bar / display-panel 마이그레이션이 chrome 통일의 첫 실제 단계.

### 다음 우선순위 (P0, 재정렬)
1. **🔴 P0 #1 (이번 세션 결과)**: Phase 3.1 — `/preview/linear` 12장 reference 이미지 1:1 비교 → fine-tune ⭐ 추천 (다음 세션 첫 작업)
2. **🔴 P0 #2**: Phase 4 — `components/filter-bar.tsx` + `components/display-panel.tsx` Linear 마이그레이션 (사용자 명시)
3. **🔴 P0 #3 (직전 세션 carry)**: Coverage entity dropdown 옵션 C/B/D 결정 (별도 진행 가능)
4. **🟡 P0 #4**: Books 엔티티 방향 결정 — A) 별칭 / B) 7번째 entity
5. **🟡 P0 #5 (계속 deferred)**: Plot v2 PRD 작성 — 이제 Phase 1+2+3로 일부 진행됨, PRD는 다음 Phase 4+에서
6. **🟢 P0 #6**: NUDGE Connect / Insights KPI 정합 / viewport 검증 / Book 폴더 Phase 2 (carry)

### 이번 세션 기술 학습
- **`.dark` 토글 + ThemeProvider 공존** — preview의 직접 토글이 새로고침 시 ThemeProvider에 의해 덮어쓰임. preview demo 한정이라 OK.
- **PowerShell regex 자동 변환** — Linear `assets/app.css` 944줄을 한 번에 prefix 변환. double-prefix 0, 미처리 클래스 0. CLI 시간 큰 saving.
- **Token alias scope 격리** — `.ln-app { --panel: var(--ln-panel) }` 패턴으로 Linear 원본 CSS의 unprefixed 참조를 globals.css 외부에 영향 없이 살림. namespace 격리 모범 사례.
- **HMR로 빠른 iteration** — 기존 dev server (PID 11312)에 `app/preview/*` 자동 인식. 별도 npm run dev 불필요.
- **22개 inline SVG 아이콘** 직접 작성 — view-configs.tsx와 동일 시각 어휘 (14px, strokeWidth 1.2~1.4)로 토픽바·필터·디스플레이·detail·Books 카드 통일.

### 아직 PR 안 한 작업물 (이번 세션 untracked, secondary)
- preview는 mock 데이터 (Zustand 미연동) — Phase 4에서 실 연동
- 실 `(app)/*` 페이지 마이그레이션 (Phase 4)
- Books 엔티티 방향 결정
- mpnsyqu1-image.png + .od-skills/ orphan files (commit 제외)

---

## 🚀 2026-05-27 (오전~새벽) — Search entity-aware + Ontology Insights v2 + HoverCard 학습 패턴 (PR #473-#479, 8 PR 23 commits) ⭐⭐⭐⭐⭐

**범위**: 누적 8 PR 머지. (a) Search entity-aware refactor (3 PR): hardcoded "RECENT NOTES" only 버그 fix → 11 entity 분기 + section title 통일 + Linear/Notion progressive disclosure. (b) Ontology Insights v2 재설계 (옵션 A Power Sabermetrics): 4 section + Coverage Mosaic 3 chart + Composite score horizontal bar. (c) Tab highlight bug fix (reactive subscribe). (d) HoverCard 학습 패턴 도입 (4 chart + 4 KPI ⓘ icon).

**핵심 결정 (영구 LOCKED 후보 #148~#152)**:
- **#148 (vision)**: **Ontology Insights = Power Sabermetrics 정체성**. Composite WAR-like score + Coverage Mosaic (Tagged/Orphan/Cohesion donut+radial) + NUDGE actionable + visualization. Daily habit (streak/heatmap) 미채택. 가끔 deep dive power-tool. knowledge app 중 독특 정체성 (Obsidian = graph view, Linear = BI, Anki = personal stats, Plot = sabermetrics + actionable nudge).
- **#149 (vision)**: **Linear/Notion progressive disclosure 패턴** — 8 limit + "Show all {count} →" button. Recency bias + cognitive load 감소. Plot search view 적용. 다른 surface (sidebar/inbox)에도 확대 가능.
- **#150 (vision)**: **HoverCard 학습 패턴 = abstract metric 학습 도구**. ⓘ Info icon + Radix HoverCard. Plot identity ("Gentle by default") 정통 — 강제 노출 X, 학습 의지로 hover. Composite formula + 정의 + 예시. metric/term 추상도 높은 곳 (Cluster Cohesion / Density / WAR-score 등) 적용. 다른 추상 용어 (status pill / kind chip 등)에도 확대 가치.
- **#151 (vision)**: **Search section title = entity name만 + entity별 sort**. RECENT prefix 제거 (사용자 의도 옵션 1). updatedAt desc / name asc / createdAt desc / lastAccessedAt fallback per entity timestamp 유무. 8 limit + Show More.
- **#152 (vision, 다음 세션 결정)**: **Coverage entity dropdown** — 옵션 C (Tagged/Orphan dropdown + Cohesion fixed) vs B (Notes/Wiki만) vs D (entity별 별도 page).

**완료** (8 PR 누적):
- Search entity-aware (#473/#474/#475): !hasFuzzyQuery 11 entity 분기 + section title 통일 + Show More button
- Ontology Insights v2 (#476): 4 section Power Sabermetrics 재설계. insights-charts.tsx 신규
- Tab highlight bug (#477): linear-sidebar.tsx reactive subscribe
- HoverCard 학습 (#478/#479): 4 chart + 4 KPI ⓘ icon + Radix HoverCard

**기술 학습 (영구)**:
- **`usePlotStore.getState()` static read는 reactive X** — selector hook (`usePlotStore(s => ...)`)으로 subscribe 필요. 사이드바 currentMode 등 store-dependent display value는 반드시 subscriber 패턴.
- **Radix HoverCard 패턴**: `<HoverCard openDelay={150}><HoverCardTrigger asChild><button/></HoverCardTrigger><HoverCardContent side="top" align="end" className="w-72">...</HoverCardContent></HoverCard>`. asChild로 button을 trigger. side/align prop으로 popup 위치 제어.
- **Recharts BarChart onClick payload**: `state.activePayload[0].payload` type assertion 필요.
- **RadialBarChart % indicator pattern**: PolarAngleAxis domain [0,100] + RadialBar value 0-100 + absolute-positioned `<span>` 안 % display + `pointer-events-none` (chart interaction 방해 X).
- **entity-aware IIFE 분기**: 11 entity 각자 다른 data/handler/icon이라 IIFE 안 helper functions로 단순화. nav() helper로 navigation target wire.
- **Linear/Notion Show More pattern**: `count > LIMIT && <button onClick={navigate}>전체 {count}개 보기 →</button>`. 8 limit + count badge + entity별 navigation. progressive disclosure 정통.

**다음 P0** (사용자 명시):
1. **🔴 P0 #1 (사용자 최우선)**: **Coverage entity dropdown 논의 + 진행**. 옵션 C/B/D 결정. Books orphan 정의. Cohesion entity별 vs 그래프 전체.
2. **🔴 P0 #2**: Phase 0 Design Language + Plot v2 PRD (2 세션째 deferred).
3. **🟡 P0 #3**: NUDGE Connect 실제 동작 (Link Picker Auto-Open 패턴 A — 답 안 함).
4. **🟡 P0 #4**: Insights에서 Notes/Wiki KPI 폐기 검토 (Dashboard 중복 정합).
5. **🟢 P0 #5**: 사용자 viewport 검증 잔여 (PR #473-#479 모두).
6. **🟢 P0 #6**: Book 폴더 Phase 2 UI.

---

## 🚀 2026-05-26 (저녁) — viewport polish 세션: LOCKED #136 v2 revised + Book 폴더 Phase 1 + entity list Notes parity 점진 정합 (PR #472, 13 commits) ⭐⭐⭐⭐

**범위**: 단일 PR 누적 13 commits. (a) Layout LOCKED #136 v1→v2 (풀 폭 → max-w-5xl Home pattern, 사용자 viewport revert), (b) Dashboard KPI i18n + 버그 fix + wiki_breakdown, (c) Book 폴더 Phase 1 (schema + migration v149 + dashboard sub-line + 12 cascade fix), (d) Books → Notes parity 점진 정합 8 commits (header layout + Title cap 폐기 + font/height/gap/padding + cover icon naked), (e) Wiki 순서 swap + minimal checkbox + 광범위 fix broken/revert.

**핵심 결정 (영구 LOCKED #136 v2 + 후보 #143~#147)**:
- **#136 LOCKED v2 (2026-05-26 revised)**: **Two-Layout Rule v2** — Overview/Dashboard/Insights = Home pattern (`mx-auto w-full max-w-5xl px-6 py-10`, ~1024px). v1 (2026-05-25 풀 폭 PR #463) 사용자 viewport revert. Article 본문/Settings max-width / 차트 ResizeObserver / Mosaic layout 모두 keep.
- **#143 (vision)**: **Notes `.a-th`/`.a-row` CSS system = entity list chrome design system source of truth**. globals.css padding 0 20px + gap 8px + .a-th height 30px + .a-row height 38px font-size 13px + .a-row__icon (no width wrapper, naked SVG) + .a-row__lead (display: flex, gap 8px) + inline grid-template-columns 동적. Plot v2 P0 #1에서 entity list 모두 이 system 사용 결정 가치.
- **#144 (vision)**: **Plot root font-size = 14px (사용자 customization feature)**. lib/settings-store.ts:83 default "14" + components/settings-sync.tsx:20 html inline style 적용. Tailwind 16px base 가정과 misalignment (rem-based class 모두 ~12% 작음 — px-5 = 17.5px / gap-2 = 7px / w-8 = 28px / text-sm = 12.25px). 근본 fix 3 path 모두 cascade 큼 → Plot v2 P0 #1 일괄 결정.
- **#145 (vision)**: **Book 폴더 Phase 1 완료, Phase 2 UI 후속**. Phase 1 = schema + migration + dashboard sub-line. Phase 2 = book-folder-picker + linear-sidebar book folder section + smartSources resolver book folder kind + app/(app)/folder/[id]/page.tsx book branch (현재 빈 페이지). Plot v2 P0 #1과 통합 가치.
- **#146 (vision)**: **entity별 column 구조 다르므로 동일 fix 일괄 적용 X**. Books column wrapper = 자체 padding 없음 → gap-[8px] 안전. Wiki column wrapper = 자체 px-2 padding → gap-[8px] 추가 시 double spacing → broken. 이번 세션 820370b broken case가 교훈.
- **#147 (vision)**: **Cover icon wrapper (h-5 w-5 20×20 box) anti-pattern**. Notes .a-row__icon는 width 명시 없음 = SVG content 자체 width. icon 14px + wrapper padding 6px → 시각 spacing 과도. naked SVG로 진행. Plot v2에서 모든 entity row icon naked pattern keep.

**완료** (13 commits):
- Layout (`bcccd3d`): 4 페이지 max-w-5xl revert
- Dashboard KPI (`2af3b9c`, `616441f`): Wiki/Categories 라벨 단순화 + Block 버그 fix + wiki_breakdown 신규
- Books list header (`1fce99b`, `4088086`): wrapper padding/gap + Title cap 폐기 + itemCount column width
- Book 폴더 Phase 1 (`85514b9`): types + migrate v149 + dashboard sub + i18n + 12 cascade fix
- Books Notes parity (`cea814b`, `a792774`, `b17c6d3`): font/height/gap/padding pixel-perfect (px-[20px] gap-[8px] w-[32px])
- Wiki Updated/Created order swap (`cea814b`)
- Wiki list broken + revert (`820370b`, `bd44e43`)
- Wiki checkbox 32px minimal (`4ff0fb1`)
- Books cover icon wrapper 제거 naked (`4fa6756`)

**기술 학습 (영구)**:
- **preview_inspect = pixel 정확 진단**: 시각 추정 (사용자 viewport에서 "더 크다") vs 실제 측정 (14px / 30px / 20px). 정확 fix.
- **Plot root font-size 14px → Tailwind 단위 misalignment**: rem-based Tailwind class가 14px root에서 ~12% 작음. 절대 px 명시 (`text-[13px]`, `px-[20px]`, `gap-[8px]`, `w-[32px]`) 미세 정합 path.
- **Notes `.a-th`/`.a-row` = grid + inline style 동적**: globals.css는 chrome only. column system은 inline `style={{ display: 'grid', gridTemplateColumns: '...' }}` 동적 생성.
- **gap-[8px] cascade**: flex sibling 구조에 entity별 다름. Books column wrapper padding 없어서 안전. Wiki column wrapper px-2 padding 있어서 double spacing → broken.
- **Cover icon wrapper anti-pattern**: 20×20 box + 14px SVG → 6px 빈 여백. Notes naked SVG 정통.
- **TypeScript cascade fix**: Folder.kind 확장 + Book.folderIds required → 12 cascade error (seeds.ts 8 + slices/books.ts + test files + setGlobalSearchQuery type 누락 의외 발견).
- **Book 폴더 migration v148→v149 idempotent**: if(!Array.isArray) folderIds = [].

**다음 P0** (이전 세션 명시 그대로):
1. **🔴 P0 #1**: **여전히 Phase 0 — Design Language 결정 + Plot v2 통째 재설계 PRD 작성**. 이번 세션 미시작. Open Design web UI + 71 system + critic 검토 + Chrome surface 첫 mockup. ~17-28시간 (12-20 PR, 1-2주).
2. **🟢 P0 #2**: chunk 2b / 3b / Phase A2 / B/C deferred (Plot v2 결정 후).
3. **🟢 P0 #3**: TABS hardcoded → 동적 entity registry refactor.
4. **🟢 P0 #4**: 사용자 viewport 검증 (PR #472 신규 13 변경 모두 + 이전 누적).
5. **🟡 P0 #5**: Book 폴더 Phase 2 UI (book-folder-picker + sidebar section + folder/[id]/page.tsx book branch).
6. **🟡 P0 #6**: Wiki list view 정밀 진단 + Notes parity (Plot v2 entity list 통합 가치).

---

## 🚀 2026-05-25 (대규모 세션 #3) — P0 #1/#2 완성 + 검색 정통화 + Open Design install + Plot v2 통째 재설계 결정 (PR #459-#470, 12 PR) ⭐⭐⭐⭐⭐

**범위**: 단일 세션 누적 12 PR. (a) Chrome architecture 완성 ('P' brand mark → UserAvatar, chunk 분할 + dropdown revert), (b) 검색 architecture 정통화 (Path A — GlobalTopBar 진짜 input + SearchView input 제거 + entity TABS 7→11), (c) Dashboard 풀 폭 + Mosaic 차트 4개 + 색상 token 정합, (d) Insights 손질 (Ontology + Notes), (e) Books list 시각 균형, (f) **Plot v2 통째 재설계 결정 (Path A)** + Open Design install.

**핵심 결정 (영구 LOCKED #136 + 후보 #137~#142)**:
- **#136 LOCKED (2026-05-25 v1 → 2026-05-26 v2 viewport revised)**: **Two-Layout Rule** (Plot 전체 영구 적용):
  1. Overview / Dashboard / Insights = **Home pattern** (max-w-5xl + mx-auto + px-6 py-10, ~1024px) ← **2026-05-26 revised** (이전: 풀 폭. 사용자 viewport 검증 결과 빽빽해서 Home과 같은 max-width 여백이 정합 — #468 chunk 3 패턴 재현. "Gentle by default" Plot 정체성 정합)
  2. Article 본문 = max-width 유지 (가독성)
  3. Settings = max-width 유지 (form readability)
  4. 차트 = ResizeObserver + useRef (ResponsiveContainer 금지 — React 19/Next 16 width-0 issue)
  5. Dashboard 차트 layout = Mosaic (좁아진 컨테이너에서도 ResizeObserver 자동 적응)
- **#137 (vision, 다음 세션 LOCKED 후보)**: **Plot 통째 재설계 (Path A) — Functional/UI layer 분리 워크플로우**. lib/* + hooks/* 그대로 keep. components/* + app/(app)/*/page.tsx + globals.css 통째 재설계 가능. 사용자 명시 의도.
- **#138 (vision)**: **mockup-first 워크플로우 정통화**. mockup 생성 → `/plot-frontend:implement` 4-gate → Plot 영구 룰 자동 정합. Plot v2 디자인 작업의 표준 패턴.
- **#139 (vision)**: **Open Design는 prototype generator지 React component library 아님**. HTML 출력 → 매뉴얼 변환 필수. Plot identity 보존 + 영구 룰 정합 매뉴얼 결정.
- **#140 (vision)**: **Information architecture — Insights는 entity 별 + 전체 분리**. Ontology Insights = 전체 노드 통합. Notes/Wiki/Books Insights = 세부. 사용자 명시.
- **#141 (vision)**: **검색 진입점 통합 (Path A)** — GlobalTopBar 진짜 input + SearchView 자체 input 제거 + globalSearchQuery store + ⌘K input focus. Linear/Notion 정통.
- **#142 (vision)**: **Chrome layout 4-region**: identity (P avatar) | tools (PanelsMenu hamburger) | navigation (clock/back/forward) | search | right cluster (theme/settings/trash). divider 2개 (Avatar 옆 + search↔chrome 사이만).

**완료** (12 PR 누적):
- Chrome architecture (#459/#460/#468/#470): 'P' brand mark → UserAvatar. chunk 3 dropdown 흡수 후 사용자 viewport 결정으로 분리 복원. 최종 `[P] │ [≡] [⏰] [<] [>] ─ search ─ │ [☀][⚙][🗑]`.
- 검색 architecture (#461/#462): entity TABS 7→11개 (Books/Categories/Stickers/References). Path A — globalSearchQuery store + ⌘K focus + SearchView input 제거.
- Dashboard 풀 폭 + Mosaic 차트 (#463/#464/#465): max-width 제거 4 페이지 + LOCKED #136. dashboard-charts.tsx 신규 (4 chart 2x2). 색상 token 정합 (NOTE_STATUS_HEX/WIKI_STATUS_HEX). Books KPI + Wiki stubs 메타.
- Insights 손질 (#466/#467): Ontology sidebar Stats 제거 + Knowledge WAR → Top Notes + composite score 공식. Notes Insights PhActivity → Activity + i18n + Health compact.
- Books list (#469): Title flex max-w-[480px] cap + visibleColumns 6개 default.
- Open Design install: ~/Desktop/open-design (51.7k stars, Apache 2.0, 71 design systems, 19 skills). pnpm 10.29→10.33.2. daemon 3844 + web 3845.

**기술 학습 (영구)**:
- **React 19 + Radix Popover asChild useId mismatch**: PopoverTrigger의 `asChild + Slot` 패턴이 `aria-controls` ID server/client mismatch 일으킴. `asChild` 제거 + PopoverTrigger 자체 button 렌더로 Slot tree 단축. (#460 fix)
- **ResponsiveContainer 절대 금지** (React 19/Next 16 width-0 issue): WikiGrowthChart의 `useRef + ResizeObserver` 패턴 정통. dashboard-charts.tsx의 `useChartWidth` hook으로 공통화.
- **Color token enforcement**: hardcoded RGB 위험 — NOTE_STATUS_HEX/WIKI_STATUS_HEX token import 강제. brick=amber/article=emerald/stub=orange 영구 룰.
- **Default visibleColumns persist 영향**: default 변경은 새 사용자 또는 persist 안 된 viewState에만. Component-level 변경(Title flex max-w)은 즉시 효과.
- **Squash merge 후 worktree branch conflict**: `git fetch origin main && git merge origin/main --strategy=ours` + push + retry. 이번 세션 12 PR 모두 안정 적용.
- **Windows pnpm + better-sqlite3**: corepack EPERM (admin 필요) 우회 → `npm install -g pnpm@<version>`. better-sqlite3는 node-gyp + Visual Studio Build Tools 2022 필요.
- **Search store state (URL X)**: globalSearchQuery store persist 제외 (partialize strip). App Router useSearchParams Suspense 제약 + Plot offline-first → 가장 단순.
- **Insights composite score 공식** (영구 reference): `backlinks×2 + linksOut + tags×0.5 + ageDays/30 + (orphan ? -2 : 0)`. "WAR" 명명은 sabermetrics 차용 — Plot identity 어긋남 → "Top Notes" rename.
- **chunk 결정 사용자 viewport 검증 후 revert 정당**: 디자인 정통성 ≠ 사용자 선호. chunk 3 dropdown 흡수가 시각적으론 정통이지만 사용자 사용 패턴은 분리 선호. revert 정당 (#468).

**다음 P0** (사용자 명시):
1. **🔴 P0 #1**: **Phase 0 — Design Language 결정 + Plot v2 통째 재설계 PRD 작성**. Open Design web UI 진입 + 71 system 비교 + critic 검토 + Chrome surface 첫 mockup. ~17-28시간 (12-20 PR, 1-2주).
2. **🟢 P0 #2**: chunk 2b / 3b / Phase A2 / Phase B/C deferred (Phase 0 결정 후).
3. **🟢 P0 #3**: TABS hardcoded → 동적 entity registry refactor (사용자 비판 잔여).
4. **🟢 P0 #4**: 사용자 viewport 검증 (Books list 등).

---

## 🚀 2026-05-25 (대규모 세션 #2) — i18n 마무리 + Custom Quick Filter feature + 디자인 브레인스토밍 (PR #438-#457, 20 PR) ⭐⭐⭐⭐⭐

**범위**: 단일 세션 누적 20 PR. (a) i18n 마무리 광범위 ~250+ 신규 keys, (b) wikiRegistered 정정 — 제목 매칭→실제 임베드 멤버십, (c) Custom Quick Filter feature MVP, (d) 디자인 브레인스토밍 — 다음 세션 P0.

**핵심 결정 (영구 LOCKED #131~#135 + 후보 #136)**:
- **#131 LOCKED**: SavedView ≠ CustomQuickFilter 의미 분리. 통합 X.
- **#132 LOCKED**: wikiRegistered = 실제 임베드 멤버십 (wikiArticles.noteIds 체크, 제목 매칭 X). filter 라벨/desc는 실제 동작과 일치.
- **#133 LOCKED**: module-level static config labelKey 패턴 확장 (#126 일반화 → 영구). EVENT_CONFIG verbKey / SECTION_META / STATUS_CONFIG / view-configs 일관 적용.
- **#134 LOCKED**: Custom Quick Filter promote-then-save (D+A 결합). chip bar "+ 버튼" + Dialog (current activeFilters 자동 prefill + filterCategories 있으면 popover로 FilterPanel 임베드).
- **#135 LOCKED**: Plot UI text는 entity 이름과 generic form field 명명 충돌 회피. "Label" form field → "Name" (Plot Label entity 충돌). 다른 generic field 명명 시 동일 룰.
- **#136 (vision)**: Dashboard / Overview = 풀 폭 (Linear/Plane 정합) / Article 본문 = max-width 유지 (가독성). 다음 세션 대시보드 재설계에서 LOCKED 진입 권장.

**완료** (20 PR 누적):
- i18n 마무리 (~250+ 신규 keys, 13 PR): WikiInsightsChart / Trash All view (+ Hook 룰 fix) / Trash chrome / Notes-Trash empty + tooltip + split toast / notes-table TrashEntityList + context menu / 3 Floating Action Bars / inbox+books / wiki-view / library-view (refs/tags/files+chrome) / SearchView Linear breadcrumb + i18n / Side panel 3 탭 + EVENT_CONFIG 44 verbs / 참고문헌→레퍼런스 정정
- wikiRegistered 정정 (PR #449/#450) — 라벨 misleading 해소 + 동작 실제 멤버십으로
- Custom Quick Filter feature (PR #452-#456): Zustand slice v148 + Dialog + Wiki/Books seed + "Label"→"Name"
- 디자인 브레인스토밍 (다음 세션 P0 #1/#2 hook)

**기술 학습 (영구)**:
- **Zustand selector 안 `.filter()` 직접 = referential equality 깨짐**. "getServerSnapshot should be cached" infinite loop. 외부 useMemo로 filter 또는 store에 derived state.
- **Module-level pure function (formatFilterChip)에 i18n**: `t?: (k:string)=>string` 옵셔널 인자 패턴. caller가 React면 useT() 결과 전달, 아니면 영어 fallback.
- **Filter 평가 로직** (filter.ts:35-39): 다른 field 간 AND, 같은 field 안 OR. SQL의 (A=1 OR A=2) AND (B=true) 자연스러운 형태. Quick filter도 같은 로직.
- **EVENT_CONFIG verbKey 패턴**: module-level Record에 verbKey 옵셔널 — 44 verb 모두 i18n 가능, React Hook 룰 위반 X.
- **PreviewCard inner function**: outer 컴포넌트의 useT은 inner function에 닿지 않음. inner function이 own state면 own useT 필요.
- **wiki list 모드 진입 path 부재**: dashboard "위키 글" 카드 click이 list로 가지만 명시적 nav 없음. viewContext="wiki" 항상 전달로 dashboard에도 chip bar + 버튼 노출 가능 (PR #454).

**다음 P0** (사용자 명시):
1. **🔴 P0 #1**: 'P' brand mark 제거 + GlobalTopBar user avatar 통합 — chunk 분할 (P 제거 / avatar 추가 / dropdown 통합)
2. **🔴 P0 #2**: 온톨로지 대시보드 layout 재설계 — 풀 폭 + KPI 4 카드 + 차트 7-8개 (PRD 작성 권장)
3. **🟢 P0 #3**: 좌우 여백 정통화 (홈/라이브러리/온톨로지 풀 폭)
4. **🟢 P0 #4**: Quick filter polish (chip edit / drag-to-reorder)
5. **🟢 P0 #5**: Editor toolbar / slash menu i18n (마지막 큰 i18n)

---

## 🚀 2026-05-24 (밤) — **i18n 잔여 surface 마무리 + Linear 정합 polish** ⭐⭐⭐⭐

**범위**: 한국어 일관성 마무리 chunk. Todos/Calendar/Ontology/Library/Wiki/Books 6 view 한국어 wire + Wiki sidebar Merge/Split 한국어 + 타임라인 button wrap fix + Books 컬럼 + view-configs Books labelKey 모두 적용.

**핵심 결정 (영구 LOCKED #122)**:
- **#122 module-level static config labelKey 일관 적용 의무** — NOTES_VIEW_CONFIG / BOOKS_VIEW_CONFIG / BookColumnDef 등 모든 entity-specific column/property def에 labelKey 필드 동시 추가 패턴 강제. 영어/한국어 mix는 사용자 혼란.

**완료**: 6 view i18n wire (~70 keys 신규), Wiki Merge/Split → 병합/분리, 타임라인 whitespace-nowrap, BOOKS_VIEW_CONFIG + book-table 전체 labelKey, Library 잔여 (Top Tags / unused tag / unlinked ref) 한국어.

**기술 학습 (영구)**:
- whitespace-nowrap = 다국어 button label wrap 회피 표준 (한국어가 영어보다 글자당 폭 ↑)
- module-level static config labelKey 패턴 확장 (#122) — BookColumnDef 등 entity-specific도 동일 적용
- AskUserQuestion "다음 세션으로" 답변 시 — SESSION-LOG hook에 후보 + 사전 진단 보존해야 다음 세션 첫 행동 즉시 진입 가능

**미완**: production-ui-refiner 후보 선택 + 5-phase refine — 사용자가 다음 세션 첫 todo로 명시.

**다음**: refiner 4 후보 (Inbox SectionCard / Library 6 stat / Books grid card / SearchDialog 더 깊게) 중 사용자 선택 → 5-phase.

---

## 🚀 2026-05-24 (저녁 후속) — **GlobalTopBar 신설 + Phase 1c Inbox + i18n 깊은 확장 + cmdk polish + production-ui-refine — 5 chunk 누적** ⭐⭐⭐⭐⭐

**범위**: 사용자 의도 흐름 따른 multi-chunk 세션 (Phase 1c → i18n main app → i18n 깊은 확장 필터/디스플레이 → GlobalTopBar 재구성 → cmdk polish + production-ui-refine). 한국어 일관성 + Linear chrome 정합이 메타 의도.

**핵심 결정 (영구 LOCKED #117~#121)**:
- **#117 Library → 자료실**: 활동 바 5글자 잘림 → 3글자 음역 절충
- **#118 Stone/Brick/Block 음역 (스톤/브릭/블록)**: 영어 정체성 + 한국어 흐름. 의역은 시그니처 약화
- **#119 GlobalTopBar = workspace chrome single source**: 시계/<>/검색/테마/설정/휴지통 모두 top bar. Hide-all-panels 상태 chrome 접근 가능 — 미래 컨트롤도 이 원칙
- **#120 PanelsMenu = top bar 단일 mount**: view-header 등 다른 곳 추가 mount 금지. 햄버거 중복은 사용자 혼란
- **#121 Command palette hybrid mode badge**: 기본 commands 모드 뱃지 제거 (Linear 정합), sub-mode만 뱃지

**완료** (5 chunk, 누적 2 PR):
1. Phase 1c — Inbox Do/Review/Detected 3 SectionCard (use-inbox section field + plan-due source 신규 + Q6 정합)
2. i18n 확장 main app — Activity Bar/Sidebar/Home/Quick Capture/StatsRow useT wire
3. i18n 깊은 확장 — Filter Panel + Display Panel + ChipDropdown + Notes table column headers + view-configs labelKey 옵셔널 패턴. Status 음역 (#118) + Library → 자료실 (#117)
4. GlobalTopBar 신설 — workspace chrome 단일 source (#119). PanelsMenu top bar 단일 mount (#120). linear-sidebar 헤더/푸터 + activity-bar 테마 + view-header PanelsMenu 모두 제거
5. Command palette Linear 정합 — hybrid mode badge (#121) + 전체 i18n + Escape handler (cmdk Korean IME 회피) + production-ui-refine 5-phase (Group A spacing + B icon + C search + D right cluster divider)

**기술 학습 (영구)**:
- **i18n labelKey 패턴**: module-level static config (view-configs / COLUMN_DEFS / SPACES)는 React Hook 못 호출. `labelKey?: string` 옵셔널 필드 추가 → consumer가 `t(labelKey) ?? label`로 resolve
- **cmdk Escape 안 통하는 IME 케이스**: Korean composition flag 동안 CommandPrimitive.Input의 Escape가 Radix Dialog로 bubble 안 됨. handleKeyDown에서 명시 closePalette() 호출이 안전한 fallback
- **production-ui-refiner 5-phase 워크플로우** (audit script 없는 환경): vision + 코드 검사로 AUDIT, hedged language로 DIAGNOSE, 카테고리 그룹별 PRESCRIBE, 사용자 그룹 승인 후 APPLY, 시각 비교로 VERIFY
- **single chrome source 원칙** (#119): hide-all-panels 시에도 사용 가능한 컨트롤은 chrome layer. sidebar/activity-bar는 panel-scope 액션만. 미래 컨트롤 추가 시 이 분리 원칙으로 위치 결정

**미완**: i18n 잔여 surface (Wiki/Books/Library/Ontology view + 우클릭 메뉴 + dialog 잔여 + status pill 음역). 사용자 viewport 검증 4건 (Inbox 3 카드 / Backup Restore / GlobalTopBar Hide-all / Cmd+K Escape).

**다음**: i18n 잔여 → Phase 2 (watch + recurring) → production-ui-refiner 다른 surface.

---

## 🚀 2026-05-24 (오후) — **Phase 1b 통합 (1b1+1b2+1b3) + Settings 전수 wire (5/5) — 8 task 단일 PR** ⭐⭐⭐⭐⭐

**범위**: 단일 거대 PR. (a) Phase 1b 전 단계 통합 — workflow.ts/wiki-articles.ts hooks wire (1b1) → read-site 12+ 파일 마이그 (1b2) → legacy 필드 영구 제거 + v146→v147 migration (1b3). (b) 사용자 "Settings 모두 구현되어야 한다" 신호로 Settings 5 페이지 전수 wire — Start view 라우팅 / Sync 솔직한 backup reminder reframe / Line numbers CSS gutter / Backup Restore (Import) / i18n (EN+KO 완전).

**핵심 결정 (영구 LOCKED #113~#116)**:
- **#113 Hook = single source of truth** — `Note.reviewAt` / `WikiArticle.plannedDate` / `srsStateByNoteId` 영구 제거. 1-step migration (Q3) 완수. 신규 temporal 기능은 무조건 Hook 위에.
- **#114 planning intent ≠ content activity 확장** — setReminder/clearReminder/batchSetReminder는 notes.updatedAt 갱신하지 않음 (#89 wiki 한정 룰을 note까지). triageSnooze는 triageStatus/snoozeCount만 갱신 (non-temporal workflow state).
- **#115 Sync 페이지 = honesty over hype** — Plot은 cloud sync 백엔드 없음. fake auto-sync 제거, backup reminder + "Not available" 명시 disclosure가 정통.
- **#116 i18n = 간단한 dictionary lookup** — next-intl 등 외부 의존성 없이 `lib/i18n.ts` + `useT()` 훅. 미번역 키는 EN fallback → literal key fallback (graceful degradation).

**완료** (8 task 단일 PR):
1. Phase 1b1 — workflow + wiki-articles hooks wire (dual-write 안전)
2. Phase 1b2 — read-site 마이그 (getReviewQueue/useInbox/wiki-timeline/sidebar/insights/settings 모두 hooks 기반, lib/store/hook-selectors.ts 신규)
3. Phase 1b3 — legacy 제거 + v146→v147 strip migration + reviewAt filter operator drop
4. Settings #1 Start view — app/(app)/layout.tsx 라우팅 (persist hydration 대기 패턴)
5. Settings #2 Sync reframe — backupReminder/lastBackupAt + toast nudge
6. Settings #3 Line numbers — CSS counter 기반 gutter
7. Settings #4 Backup Restore — restoreFromBackup + Import UI + reload
8. Settings #5 i18n — lib/i18n.ts (Locale union + EN/KO dictionary + ja/es/fr/de placeholders + useT 훅)

**기술 학습 (영구)**:
- Zustand persist hydration 타이밍 — 첫 mount useEffect는 비동기 hydration 전 fire 가능 → `useStore.persist.hasHydrated()` + `onFinishHydration` 콜백 패턴
- pure 헬퍼는 set/precomputed param이 best — `buildDueSnoozeSet(hooks)` 미리 계산 후 전달
- SRS state mirror = trigger.srsState + state.srsState 둘 다 set (read는 trigger 우선)
- Backup restore openDbForRestore 패턴 — plain open → store 없으면 version+1 upgrade
- CSS counter line numbers — `.ProseMirror > *::before { counter-increment }` + position absolute gutter, NodeView 불필요
- i18n flat key + Partial<Record> + translate fallback chain (target → EN → key)
- router.replace vs push for start-view — replace = history 누적 X, push = back loop

**미완**: Phase 1c (Inbox Do/Review/Detected 섹션 재배선) — 다음 P0 #1. i18n 확장 (ja/es/fr/de) + 외 surface — 사용자 신호 시.

**다음**: Phase 1c → i18n 확장 (선택) → Phase 2 (watch + recurring).

---

## 🚀 2026-05-24 (새벽) — **Temporal Hooks PRD v0.2 + Phase 1a foundation (Hook model + slice + v145→v146 migration)** ⭐⭐⭐⭐

**범위**: PR #411 머지. temporal-hooks PRD v0.1 → v0.2 (Q3/Q4/Q6 RESOLVED). Phase 1a foundation — Hook 모델 + slice + 마이그레이션. legacy 필드 Phase 1a keep, Phase 1b에서 wire + 제거.

**핵심 결정 (영구 LOCKED #111~#112)**:
- **#111 temporal 도구는 단일 `Hook` 모델로 통합** — snooze/plan/srs/staleness/recurring/watch 6 정책, 하나의 Hook 추상. per-entity 필드 (reviewAt/plannedDate/srsStateByNoteId) = 파편화 재발 — 절대 추가 X. EntityRef-keyed store. 신규 temporal 기능은 모두 Hook 위에.
- **#112 Hook trigger 갈래 둘 (scheduled / event-match), 엔진 하나** — EntityEvent 스트림이 척추. Timeline=시각화 / Hook engine=구독 / Inbox=발화 슬라이스. 세 소비자가 한 스트림 공유.

**완료**: PRD v0.2 + Hook model + slice + v145→v146 migration (3 legacy 흡수).

**미완**: Phase 1b (workflow wire + read-site + legacy 제거) — 다음 P0 #1.

**다음**: Phase 1b → Phase 1c (Inbox Do/Review/Detected 재배선) → Phase 2 (watch + recurring).

---

## 🚀 2026-05-24 (저녁) — **거대 세션 #2: Notes timeline ViewHeader + File 엔티티 v1 (6 PR) + Notes/Wiki Grid + Display Panel Audit + Q-series Q1~Q5 (11 변경 단위)** ⭐⭐⭐⭐⭐

**범위**: 단일 거대 PR (36 파일 변경 + 5 신규). 30+ round 사용자 대화. 사용자 신호 기반 cleanup + scaling 본질 도구 구축 (group collapse + quick filter chip universal).

**핵심 결정 (영구 LOCKED #105~#110)**:
- **#105 ViewHeader = chrome layer 통일**: quickFilters/display/filter/save/detail panel 모두 ViewHeader-level. 모든 view mode (list/board/grid/timeline) 일관 UX.
- **#106 Grid mode = flat card grid (Books parity)**: no grouping semantics. view-configs explicit `modes: ["list", "board"]` (grid 제외). Grid 카드 자체 fixed display (status icon + title + preview + footer).
- **#107 collapsedGroups = store-level**: viewState.collapsedGroups. list/board/timeline 모두 동일 read. mode 전환 시 fold 유지.
- **#108 Grouping = organize / Filter = focus**: 사용자가 "특정 영역만 보기" 의도는 filter primary path. 큰 corpus에선 group collapse + quick filter chip이 scaling 본질 도구.
- **#109 Linear board column collapse pattern**: 40px narrow vertical bar + chevron up + vertical label (writing-mode: vertical-rl) + status icon + count. expanded 시 header에 chevron-down.
- **#110 File 엔티티 v1 완료**: PR 1a/1b/1c/1b'/2/3. v2 (content-hash dedup / hard-delete dangling cleanup) Phase 2 이관. Books 접점 직접 참조 0 (간접만).

**완료** (11 변경 단위, 단일 PR):

1. **Notes timeline ViewHeader** (P0 #1 해소): notes-timeline-shell.tsx에 ViewHeader + FilterChipBar chrome wrapper
2. **File 엔티티 v1 PR 1a**: Attachment.noteId → originEntity (EntityRef|null) + v144→v145 마이그레이션 + 7 호출처 + 2 read-side (file-detail-panel/side-panel-connections) — `lib/store/migrate.ts` lookup으로 note/wiki id kind 판정
3. **PR 1b — Note picker UI**: `components/file-picker.tsx` 신규 (Dialog overlay + 검색 + image grid + file list) + insert-menu "From library…" item (FolderOpen 아이콘)
4. **PR 1c — Wiki picker**: AddBlockButton `onAddFromFile` prop + "From file…" 버튼 + FilePicker (`accept="image"`) — wiki-article-view 2 caller (prepend/append) → `addWikiBlock(articleId, {type:"image", attachmentId, caption}, anchor)`
5. **PR 1b' — Books 접점 close-out**: Book.items + AutoSource.kind 모두 File 미포함 (직접 참조 0). PRD §6-3 + §7 Q2 CLOSED 표기 + §8 v1 진행 매트릭스
6. **PR 2 — Usage 인덱스 (§3)**: `lib/extract-attachment-refs.ts` 신규 (ProseMirror tree walk + wiki blocks scan + findAttachmentUsage + buildAttachmentDeleteWarning). file-detail-panel/side-panel-connections에 "Used in" 일반화
7. **PR 3 — Hard delete 경고 dialog (§5)**: notes-table.tsx + trash-all-view.tsx handleDelete에 attachment 분기 (usage 기반 warning augment)
8. **Library Labels 아이콘 fix (#103 cascading)**: library-view.tsx Labels 카드 `<Tag>` → `<IconLabel>` (Bookmark, sidebar 정합)
9. **Notes/Wiki Grid Display (Books parity)**: notes-grid-view.tsx / wiki-grid-view.tsx / notes-grid-shell.tsx 신규 (Books-grid-parity 카드 grid)
10. **Display Panel Audit 3-Fix**: Grid mode 정합 (groupingOptions explicit modes) + Timeline group spacing 강화 (divider opacity 0.55→0.85 + 4px tint band, header band 16→20) + filterAwareRole 라벨 "Role from filtered view"
11. **Q-series Q1~Q5**:
    - Q1: Grid 카드 아이콘 박스 폐기 (#103 cascading — notes/wiki/book grid-card 3 파일)
    - Q3: Quick filter chip toolbar universal (ViewHeader 3 prop + rounded-full chip 1-click toggle, 모든 mode 자동 적용)
    - Q2: collapsedGroups store 승격 (ViewState 필드 + normalize 보존)
    - Q4: Wiki timeline lane collapse (visibleLanes filter + group header click + "Expand all" 버튼)
    - Q5: Notes Board column collapse (Linear 40px narrow bar + chevron + vertical label)

**기술 학습 (영구)**:
- ViewState 신규 필드 추가 시 **3곳 갱신 필수**: types.ts + defaults.ts (DEFAULT_VIEW_STATE) + normalizeViewState return. 빠뜨리면 setViewState 직후엔 보이지만 normalize 거치면 stripped.
- Set/Array dual representation: store에 array (IDB serializable) + 컴포넌트 안 `useMemo(() => new Set(array))` wrapper + `useCallback` setter writeback. 기존 호출 시그니처 유지하면서 store-backed migrate 가능.
- Dropdown + plain overlay z-index 충돌: Radix Dialog (Templates)는 portal로 dropdown 위에 부상. plain overlay (FilePicker)는 portal 없어서 dropdown에 가려짐 → `e.preventDefault()` 제거하고 dropdown 자동 close 후 overlay mount.
- LOCKED rule cascading: 영구 룰 (예: #103 box 폐기)이 list row 한정이었어도 grid card 등 다른 컴포넌트에 동일 패턴 잔존 가능. 새 컴포넌트 만들 때 reference 패턴 점검 필요.
- `useEffect` cleanup으로 setState 호출 금지 — mode 전환 시 의도치 않은 reset 위험.

**미완**: Wiki Board column collapse (notes-board PR-Q5 패턴 복제) + Notes/Books Timeline lane collapse (PR-Q4 패턴 확장) + Group-collapse ghost row v2.

**다음**: Wiki Board column collapse → Notes/Books Timeline lane collapse → ghost row v2 (사용자 viewport 검증 후). SESSION-LOG 2026-05-24 (저녁) hook 참조.

---

## 🚀 2026-05-24 — **거대 세션: PR-X5/X6 (lucide 68파일) + Activity bar lucide + audit v2 완성 (PR-B/B2/C) + Notes/Books Timeline + Gallery 폐기** ⭐⭐⭐⭐⭐

**범위**: 거대 세션 단일 PR (93 파일 / +1891 −2622). 20+ round 사용자 대화. audit v2 *완성판* (PR-B/B2/C) + Plot icon ecosystem 통일 + 신규 entity-level feature (Notes/Books Timeline) + view mode 정리 (Gallery 폐기).

**핵심 결정 (영구 LOCKED #98~#104)**:
- **#98 Gallery 폐기 → Grid 통일** (4 entity). 자동 마이그레이션 (gallery → grid alias in normalizeViewState).
- **#99 Wiki timeline bar 단일 색** — D1 past/future gradient 폐기. 모든 entity bar = status color full opacity.
- **#100 Brand 3종 = Stone/Brick/Block만 phosphor**. Wiki Stub/Article도 lucide (Book/BookMarked). Activity bar + sidebar + action 모두 lucide.
- **#101 Timeline = entity-agnostic sub-components + entity adapter**: sub-components (timeline-bar/grid/label-column/tooltip/event-markers/utils)는 `<T extends TimelineEntity>` generic + adapter callback prop. Wiki/Notes/Books 모두 같은 sub-components 사용.
- **#102 Notes timeline = Shell 패턴, Books = 직접 호출**: NotesTable이 자체 ViewHeader 가지므로 NotesTimelineShell이 useNotesView wrapper. Books는 books-view가 직접 BooksTimelineView 호출. *결과: Notes timeline ViewHeader 누락 → 다음 세션 P0 #1.*
- **#103 `.a-row__icon` 박스 폐기** — 22×22 tinted square 폐기. color tone만 (Linear/Plain 톤).
- **#104 Books list row = Notes parity** — book-table.tsx h-9 → py-2.5.

**완료**:
- **PR-X5/X6 lucide 마이그레이션 68 파일** — editor 8 + wiki-editor 13 + comments 3 + notes-table/board/editor/property-chips/display-panel (큰 imports) + books mid+large 10 + home 4 + ontology 4 + inspector + insights + calendar + board-workbench + 기타
- **plot-icons.tsx 전체 재작성** — 자체 SVG 25+ 함수 → lucide alias wrap (default size 유지, strokeWidth=1.5 mockup tone)
- **audit v2 PR-B/B2/C 완성**:
  - PR-B: ModeList/GroupingOption/OrderingOption/DisplayProperty.modes/DisplayConfig.defaultGroupByByMode/defaultSortByMode + 11 ViewConfig modes 선언 + DisplayPanel mode filter + normalizeViewState mode-aware auto-cleanup + getViewConfigForContext export
  - PR-B2 (5건): B11 References groupBy 단일화 (GroupBy union에 "type"/"fieldKey") / B6 timeline-label-column visibleColumns / B12 templates grid groups / B5 wiki gallery wikiGroups *(그 후 gallery 폐기)* / B4 timeline lane 헤더 + canvas divider
  - PR-C (4건): B10 wiki tier sort (depthMap closure) / B13 Books board groupOrder+showEmptyGroups / B14 use-templates-view isHydrated / B4 detail canvas divider
- **Notes/Books Timeline 신규** — sub-components 7개 generic화 + NotesTimelineView/Shell/BooksTimelineView 3 신규 파일 (~900줄) + view 분기 + NOTES/BOOKS_VIEW_CONFIG timeline mode
- **Gallery 전수 폐기** — 3 파일 삭제 + 4 view 분기 정리 + types.ts ViewMode union/VALID_VIEW_MODES + normalize alias migration
- **spacing/icon polish** — `.a-row__icon` 박스 폐기 + Books row height parity
- **wiki timeline 선 단일 색** — D1 gradient 제거

**기술 학습 (영구)**:
- **lucide 마이그레이션 일관 변환 룰** (PR-X1~X6 누적): weight prop 5종 → strokeWidth/fill. import block 통째 교체 + replace_all + tsc 매 batch.
- **Generic timeline 추출 패턴** — sub-components를 `T extends TimelineEntity` generic + adapter callback prop. caller가 adapter inline. duplication 0.
- **alias migration for deprecated viewMode** — normalizeViewState alias로 persisted 데이터 자동 변환. Store-level migration 불필요.
- **dead branch + dead function 정리** — gallery 분기 제거 시 import + 함수 정의 모두 grep으로 수동 확인.

**미완**: **Notes timeline ViewHeader 누락** (사용자 명시 P0 #1).

**다음**: Notes timeline ViewHeader 추가 → File 엔티티 v1 → temporal-hooks PRD 후속. SESSION-LOG 2026-05-24 hook 참조.

---

## 🚀 2026-05-23 (후속) — **Audit v2 + PR-A 데이터 무결성 + Lucide 마이그레이션 90 파일 (PR-X1~X4)** ⭐⭐⭐⭐⭐

**범위**: 거대 세션 단일 PR. 16+ round 사용자 대화 (audit 브레인스토밍 → Linear 마인드셋 결정 → PR-X1~X4 mechanical batch). Audit 문서 v2 + PR-A 데이터 무결성 5건 + Lucide 마이그레이션 90 파일. Store v144 무변경.

**핵심 결정 (영구, 후보 #94~#97)**:

- **#94 Lucide-react = Plot icon library 통일 표준** (shadcn 정통). Linear/Vercel/Tailwind 톤. Phosphor의 weight variant 다양성 대신 sharp/geometric/minimal 톤 + shadcn 정합. Plot의 Linear-level polish 추구와 align.
- **#95 Brand icon 5종만 phosphor 유지** — Stone(Hexagon)/Brick(Cube)/Block(Cuboid2x2 자체)/Stub(IconWikiStub 자체)/Article(IconWikiArticle 자체). Smart/Hybrid/Manual Books는 utility로 통일 (Zap/Sparkles/Pencil). Plot 자체 컴포넌트는 phosphor weight prop만 받음 → lucide 변환 시 자체 컴포넌트엔 strokeWidth 박지 말 것.
- **#96 Phosphor → Lucide weight prop 변환 룰** — `regular`→`strokeWidth={2}` / `bold`→`strokeWidth={2.5}` / `light`→`strokeWidth={1.5}` / `thin`→`strokeWidth={1}` / `fill`→`fill="currentColor"` / `duotone`→`strokeWidth={1.5}` / dynamic `weight={cond?"fill":"regular"}`→`fill={cond?"currentColor":"none"}`.
- **#97 (후보, PR-B에서 구현) Mode-aware UI 룰 (Linear-style)**:
  - L1: UI 노출 = 100% 동작 (modes 선언과 코드 갭 해소는 같은 PR)
  - L2: Show, don't disable (의미 없으면 안 보여줌)
  - L3: View is a memo, not a config (mode 전환 시 invalid 옵션 normalize auto reset)
  - L4: Make the right thing default (각 mode default groupBy/sort product 결정)
  - L5: Self-documenting source of truth (view-configs.tsx declarative modes 필드)

**Audit + 계획 산출물**: `.omc/plans/view-state-reliability-audit.md` v2 — 4 dimension × 11 ViewConfig × view modes 매트릭스 + PR 분할 7개 (PR-A~G) + §8 사용자 결정 3개 (timeline default groupBy / PR-B2 같이 갈지 / Library hook 통합).

**완료**:

- **PR-A 데이터 무결성 5건** (사용자 신고 "가끔 안 됨" 8할 해소):
  - B1 types.ts:257 — `VALID_GROUP_BY`에 `firstLetter`/`createdAt`/`wikiStatus` 추가
  - B2 types.ts:248 — `VALID_SORT_FIELDS`에 `articles` 추가
  - B3 defaults.ts:17 — `"words"` → `"wordCount"` (VALID_COLUMNS 매치)
  - B8 use-tags/stickers/references-view — fail-closed `return false` → fail-open `return true`
  - B9 use-files-view — searchQuery stage 추가
- **PR-X1~X4 Lucide 마이그레이션 90 파일**: UI primitive 21 + chrome 17 + side-panel 17 + view components 30 = 85 (+ 잔여 5 wiki-timeline/wiki-editor/workspace)
- **부수 효과**: carousel.tsx KeyboardEvent.key 비교 버그 자동 fix (`'PhArrowLeft'` → `'ArrowLeft'`, lucide alias replace_all로)

**기술 학습 (영구)**:

- **자체 컴포넌트는 lucide-incompatible** — Plot icons는 phosphor weight prop만 받는 자체 SVG. strokeWidth 박으면 TS error. lucide 변환 대상에서 의도적 제외.
- **carousel.tsx 사례 — alias 이름이 string literal로 박힌 패턴** — KeyboardEvent.key 같은 비교 string도 lucide alias replace_all로 부수 fix됨.
- **timeline-event-markers처럼 indirect phosphor 사용** — phosphor import 없어도 다른 module(wiki-timeline-config)에서 import한 컴포넌트 사용. 잔여 weight 잡으려면 grep 풀스캔.
- **마이그레이션 batch 패턴** — Grep 인벤토리 → Read 부분 (import 영역) → import block 통째 교체 → weight 4-5종 replace_all → tsc → 잔여 fix.
- **Phosphor 별칭 import 패턴 (alias 유지)** — `import { Lucide as PhAlias } from "lucide-react"` — JSX 변경 0 (minimum-diff).
- **Audit-first 워크플로우의 가치** — "계획부터" 룰로 거대 작업 (90 파일 + 14 버그) 깔끔 진행. PR-A는 audit 끝나야 진입. PR-X1~X4는 mechanical이라 audit 없이 batch.

**다음**: PR-X5 (editor + wiki block + comments lucide ~30 파일) → audit §8 사용자 결정 후 PR-B (mode-aware UI) → PR-X6 잔여 lucide. SESSION-LOG 2026-05-23 후속 hook 참조.

---

## 🚀 2026-05-23 — **타임라인 비주얼 리디자인 (얇은 선 / 스타트칩 / status 색) + "All" 모드** ⭐⭐⭐⭐⭐

**범위**: 사용자와 다단계 브레인스토밍·반복으로 타임라인 막대/마커/색 전면 재설계. 단일 PR, 8파일 (+224/−141, 전부 `components/views/wiki-timeline*`). Store v144 무변경.

**핵심 결정 (영구)**:
- **타임라인 막대 = 얇은 선, 이벤트 칩이 주인공** — 막대는 "정보 컨테이너"가 아님(이름 없음). 막대 일 = 길이(수명) + 색(status) + 그라데이션(과거/미래). `BAR_HEIGHT` 28→5.
- **스타트칩 = 막대 고유 origin 요소 (이벤트 아님)** — `created`는 *활동*이 아니라 *수명 시작 경계*. 막대 왼쪽 끝에 항상 렌더 (이벤트 로그/window 필터/Events 토글 무관). `created` 이벤트는 별도 마커 X.
- **선 색 = status 아이콘 색 일치** — stub 주황 `#f97316` / article 에메랄드 `#10b981` (`WIKI_STATUS_HEX`). 중립 회색 시도 → 라벨 컬럼 컬러 아이콘과 따로 놀아 폐기.
- **"All" 모드 = fit-to-content overview** — 5번째 timeline 모드, 기본값. 전체 content span을 viewport에 맞춤. readability floor(6px/day)로 거대 데이터 degrade. viewport-fit은 *옵션*이면 antipattern 아님.
- **이벤트 마커 = 막대 안(중앙선)** — `EVENT_MARKER_Y_OFFSET` 0, 칩 흰 테두리(어떤 막대 색 위에서도 분리).

**완료**: `wiki-timeline-config.ts`(`TimelineMode` 타입·`TIMELINE_MODES`·`BAR_HEIGHT` 5) / `wiki-timeline-utils.ts`(`computeAllFit`·`laneArticles` day-quantize·`buildTicks` adaptive) / `wiki-timeline-view.tsx`(cfg/winStart "all" 분기·viewport 폭 측정) / `timeline-bar`·`timeline-event-markers`·`timeline-grid`·`timeline-tooltip`·`timeline-controls`. tsc exit 0.

**다음**: P0 #1 = Display Properties / Grouping / Ordering 신뢰성 (전 view mode 감사, 계획부터). #2 = Notes/Books Timeline 모드. #3 = File 엔티티 v1. SESSION-LOG 2026-05-23 hook 참조.

---

## 🚀 2026-05-22 (후속 #3) — **Display 탭 Linear segmented control + 타임라인 화살촉 제거** ⭐⭐⭐

**범위**: ① Display 패널 view-mode 탭 스트립 = Linear segmented control (popover 360px 확대 + flex-1) ② 타임라인 막대 status 화살촉 제거 ③ 막대 이름·마커 clip 결정 (구현은 다음 세션).

**핵심 결정 (영구)**:
- **타임라인 막대 = 순수 수명, 이름은 좌측 라벨 컬럼 전담 (A안 확정)** — 막대 너비(수명) ↔ 이름 너비(글자수) 무관 → "항상 막대 안"은 물리적 불가. 좌측 `timeline-label-column`이 이미 이름 담당 → 막대엔 이름 제거 (구현 = 다음 세션).
- **타임라인 status = 막대 색만** — 화살촉 폐기. 영구 룰 후보 #91 obsolete.
- **Display 탭 = Linear segmented control** — 둥근 컨테이너 + flex-1 균등 탭 + active pill + gap seam, popover는 탭 수용 폭(360px).

**완료**: `display-panel.tsx`·`view-header.tsx`(탭 스트립 + popover 360px) / `timeline-bar.tsx`·`wiki-timeline-config.ts`(화살촉·ARROW_DEPTH 제거). tsc clean. Store v144 무변경.

**다음**: 타임라인 폴리시 — 막대 이름 제거(A안) + 마커 clip 수정(`LANE_TOP_PAD` 캔버스 inset, 6곳). 그 다음 File 엔티티 v1. SESSION-LOG hook 참조.

---

## 🚀 2026-05-22 (후속 #2) — **File 엔티티 PRD + TODO 3건 (Timeline 아이콘 / EVENT_MARKER / 라이브러리 Index 그룹핑)** ⭐⭐⭐⭐

**범위**: ① File 독립 엔티티 PRD v0.2 작성 ② P0 #3 Timeline 탭 아이콘 ③ P1 EVENT_MARKER_CONFIG 4종 ④ P0 #2 라이브러리 5종 Index 그룹핑.

**핵심 결정 (영구)**:
- **File 엔티티 Q1/Q2 LOCKED** — 타입명 `Attachment` 유지 (DOM 전역 `File` 타입 충돌 회피, `keystone`/"Block" 선례). `noteId` → `originEntity: EntityRef | null` (note·wiki origin 정직 표현, provenance 강등 — 제거 X). PRD = `.omc/plans/file-entity-prd.md` v0.2.
- **라이브러리 Index 그룹핑 = 컴포넌트-사이드 패턴** — 훅 불변. `groupXByFirstLetter` 헬퍼 + render-order 평탄화 배열 + `.a-tg` 헤더 밴드(book-table 패턴). 그룹 모드에선 drag-select 비활성.
- **영구 룰 #92 (Index = Grouping, not a column) LOCKED** — content 5종(PR #400) + 라이브러리 5종(이번) 완료.

**완료**: `.omc/plans/file-entity-prd.md`(신규) / `display-panel.tsx`(Timeline 아이콘 `ChartBarHorizontal`) / `wiki-timeline-config.ts`(EVENT_MARKER 4종) / `view-configs.tsx` + `tags-view.tsx`·`labels-view.tsx`·`stickers-view.tsx`·`library-view.tsx`(라이브러리 Index). tsc + build clean. Store v144 무변경.

**다음**: File 엔티티 v1 구현 (§6-1, PR 2개 — 마이그레이션+모델 / 피커 UI). 또는 P1 temporal-hooks PRD 후속.

---

## 🚀 2026-05-22 (후속) — **레거시 Index 토글 제거 (PR #401) + File 독립 엔티티 브레인스토밍** ⭐⭐⭐⭐

**범위**: ① PR #401 — 레거시 `showAlphaIndex`/`showAllArticles` 알파벳-인덱스 토글 메커니즘 완전 제거 (6 파일, +9/−173). ② File(Attachment)를 진짜 독립 Library 엔티티로 만드는 브레인스토밍 — 결정 locked.

**핵심 결정 (영구)**:
- **Index = 순수 Grouping 옵션** — PR #401로 옛 토글 버튼 + `showAllArticles` 렌더 경로 완전 제거. Index는 Status 등과 차별 없는 그룹핑 옵션 (영구 룰 후보 #92 — 라이브러리 5종 완료 시 LOCKED).
- **File 독립 엔티티로 간다** — `attachment://<id>` 스킴 덕에 콘텐츠는 이미 파일을 ID 참조 + `Attachment.noteId`는 이미 vestigial(`""`/`"__library__"` sentinel) → 풀 리빌드 아님. 작업: `noteId`→`originNote` 강등 / "기존 파일 삽입" 피커 / N:M usage 인덱스 / `Attachment`→`File` 리네임. 결정: noteId 강등(제거 X) / dedup Phase 2 / Books fast-follow.
- **글로벌 엔티티 현황** — Tag/Label/Category(LOCKED #53-#58) + Sticker = standalone cross-entity. File만 note-scoped 예외였음 (→ 위 독립화).

**완료**: PR #401 (executor-high 에이전트 작업, diff + 빌드 독립 검증 후 머지). main `af192c8`. Store 무변경.

**다음**: File 독립 엔티티 PRD 작성 (`.omc/plans/file-entity-prd.md`) / A 라이브러리 Index 그룹핑 / Timeline 탭 아이콘. SESSION-LOG hook 참조.

---

## 🚀 2026-05-22 — **통합 시간 모델 PRD + Index→Grouping 통일 (content 5종)** ⭐⭐⭐⭐⭐

**범위**: ① 통합 시간 모델 심층 브레인스토밍 → `.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1) ② Index를 가짜 DP 칩에서 Grouping으로 통일 (Wiki/Templates/Books — Notes/Categories는 기존 정합) ③ 빌드 에러 픽스 (worktree node_modules).

**핵심 결정 (영구)**:
- **Index = Grouping, not a column** — DP(Display Properties) 칩은 진짜 컬럼과 1:1이어야 함 (사용자 핵심 원칙). "Index"는 컬럼이 아니라 알파벳 그룹핑 모드 → Grouping 드롭다운. `group.ts:groupByFirstLetter` docstring이 이미 "replaces legacy showAlphaIndex" 명시 — Notes만 마이그레이션됐던 걸 이번에 Wiki/Templates/Books로 확장.
- **사용자 원칙**: Display 패널 지원하는 모든 엔티티는 Index를 Grouping으로 지원 → 라이브러리 5종(Tags/Labels/Stickers/Files/References) 다음 세션 (A).
- **통합 시간 모델 (temporal hooks)** — snooze/SRS/plannedDate/staleness = "언제 다시 띄울까 + 왜"의 4중 파편. 단일 `Hook` 모델로 통합 (이벤트 축, `EntityEvent` 스트림 척추, Inbox/Timeline 2 표면, atom/aggregate). 상세 = `unified-temporal-hooks-prd.md`. **DRAFT — 구현 승인 전.**

**완료**: `view-configs.tsx`(Wiki/Templates/Books grouping `firstLetter` + `showAlphaIndex` 칩 제거 + `IndexIcon` 제거) / `wiki-list-pipeline.ts`·`use-books-view.ts`·`use-templates-view.ts`(`firstLetter` case) / `library-categories-view.tsx`(타입 캐스트 정정). 빌드 clean. Store v144 변경 없음 (view-engine 레이어만).

**기술 학습**: Plot SRS = `lib/srs` 7단 사다리(`INTERVALS=[1,3,7,14,30,60,120]`일), keystone enroll, `promote`→`enrollSRS` 자동. 라이브러리 뷰(`stickers-view.tsx` 등)는 flat-only — 훅의 `groups` 무시하고 `flatX` 렌더.

**다음**: A — 라이브러리 5종 Index 그룹핑 (뷰 flat-only → 그룹 렌더링 신규). SESSION-LOG hook 참조.

---

## 🚀 2026-05-21 (저녁 후속 #6) — **wiki-timeline-view.tsx sub-component 분리 (1380→386줄)** ⭐⭐⭐⭐

**범위**: 거대 컴포넌트 리팩토링. `wiki-timeline-view.tsx` 1380줄 → **386줄 orchestrator** + 9 모듈 파일 (`components/views/wiki-timeline/`).

**완료**:
- 신규 9 파일: `wiki-timeline-config.ts` (types/constants/ZOOM_CONFIGS/EVENT_MARKER_CONFIG/state interfaces) / `wiki-timeline-utils.ts` (pure 함수) / `timeline-controls.tsx` / `timeline-axis.tsx` / `timeline-grid.tsx` / `timeline-bar.tsx` / `timeline-event-markers.tsx` / `timeline-label-column.tsx` / `timeline-tooltip.tsx`
- orchestrator는 모든 React state/memo/effect/callback 보유, 시각 조각만 컴포넌트로
- 순수 리팩토링 (런타임 behavior 불변). 검증 4종: tsc clean + build clean + 시각 렌더 동일 + console-parity (stash로 원본 비교)

**핵심 결정 (영구)**:
- **거대 컴포넌트 분리 = orchestrator + presentational 패턴** — state/memo/effect는 orchestrator, 시각 조각은 explicit-props 컴포넌트. closure → props. tsc가 prop contract 강제 (explicit Props interface, `any` 금지).
- **순수 리팩토링 검증 4종** — tsc + build + 시각 렌더 + console-parity (`git stash push <file>`로 원본 비교).

**기술 학습 (영구)**:
- `git stash push <file>`로 단일 파일만 stash → 원본 vs 변경본 런타임 비교. untracked 신규 파일은 stash 안 됨 (원본이 self-contained면 OK).
- render-function → component 전환: `renderX(item,i)` → `<X item={} laneIndex={i} key={}/>`, key는 map element로. SVG sub-component는 fragment `<>` 반환.

**Watch Out**: timeline 진입 시 console 경고 8개 ("state update on component that hasn't mounted") — **refactor 무관, pre-existing** (stash 비교 확인). 별도 조사 (다음 P0 #2).

**(저녁 후속 #5, PR #398)**: `router.push("/wiki/[id]")` dead code 정리 — 6 파일 9 call site, 404 유발 호출을 `setActiveRoute("/wiki")`+`navigateToWikiArticle(id)` 패턴으로 교체. `/wiki/[id]` Next 라우트 미존재.

**다음**: P0 #1 EVENT_MARKER_CONFIG 신규 이벤트 매핑 (merged/unmerged/split/section_collapsed). SESSION-LOG hook 참조.

---

## 🚀 2026-05-21 (저녁 후속 #4) — **Books own Views section (P0 #3 완료) — 🟡 P0 전부 소진** ⭐⭐⭐

**범위**: `linear-sidebar.tsx` 2줄. Books section에 `renderViewsSection("books", "/books")` 추가.

**완료**: Books space 사이드바에 own Views section (Notes/Wiki/Calendar/Ontology와 동일 패턴). 영구 룰 #87 정합 (single-entity space는 own Views 보유). 인프라(`getSavedViewSpaceForActivity` books 지원, `SavedView.space` union books 포함)는 이미 준비됨 — 호출만 누락이었음.

**기술 학습**: `renderViewsSection(spaceFilter, routeOnClick)`는 완전 generic 헬퍼 — 신규 space에 Views = 호출 한 줄.

**현황**: TODO.md P0의 🟡(medium) 항목 전부 소진. 남은 P0는 모두 🟢 (timeline polish 요청 시만 / sub-component 분리 / router.push dead code 정리 / EVENT_MARKER_CONFIG 매핑). 다음 세션은 사용자 의향 청취.

---

## 🚀 2026-05-21 (저녁 후속 #3) — **Activity events 후속 — granular events wire-up (P0 #2 완료)** ⭐⭐⭐⭐

**범위**: 4 파일 (+83/-11). wiki/book/label entity에 discrete activity events 발화 wire-up.

**완료**:
- `wiki-articles.ts` — `block_added`/`block_removed`/`block_reordered`/`merged`/`unmerged`/`split` + `opened`(incrementWikiArticleReads)
- `books.ts` — `item_added`/`item_removed`/`chapter_added`/`smart_source_added`/`smart_source_removed`
- `labels.ts` — slice가 `appendEvent` 전무였음 → `createLabelsSlice(set, appendEvent)` 시그니처 변경 + `store/index.ts` 인자 추가. `created`/`renamed`/`color_changed`/`updated`/`trashed`/`untrashed`/`member_added`/`member_removed` (tags.ts 패턴 정합).
- 의도적 제외: `updateWikiBlock` (블록 본문 편집 — 키스트로크 flood).
- preview 검증: 6 신규 이벤트 발화 확인.

**핵심 결정 (영구)**:
- **granular event는 구조적 mutation만, 본문 편집 제외** — block add/remove/reorder/merge/unmerge/split은 discrete. `updateWikiBlock`(본문 편집)은 키스트로크마다 호출 → flood → 제외. 본문 변경은 article-level `updated`로 충분.
- **slice가 appendEvent 안 받으면 그 entity 활동 추적 불가** — labels가 그 상태였음. 신규 entity slice는 `createXSlice(set, appendEvent)` 시그니처 권장.
- **1:1 관계 setter는 set/clear/switch/no-op 4-case 분기 의무** — `setNoteLabel` switch(A→B) 시 A `member_removed` + B `member_added` 둘 다.

**기술 학습 (영구)**:
- Zustand `set(updater)` 안에서 closure 변수로 이전 값 capture 가능 (updater 동기 실행).
- `EntityEventType`은 `NoteEventType` 포함 — `split`/`opened` 등을 wiki/book에도 사용 가능.
- success-path event = `let added=false` flag 패턴 (dedup 가드 있는 mutation).

**다음**: P0 #3 Books own Views section. SESSION-LOG hook 참조.

---

## 🚀 2026-05-21 (저녁 후속 #2) — **Ontology graph node → SmartSidePanel 동기화 (P0 #1 완료)** ⭐⭐⭐⭐

**범위**: 3 파일 (+40/-227). Ontology graph node 클릭 → 통합 사이드바 동기화. legacy 패널 제거.

**완료**:
- `ontology-view.tsx` — 싱글클릭(`onSelectNode`): `setSidePanelContext({type,id})` + `setSidePanelOpen(true)`. node type별 — note raw id / wiki `"wiki:"` strip / tag `"tag:"` strip. 더블클릭(`onOpenNote`): note `openNote` / wiki `setActiveRoute("/wiki")`+`navigateToWikiArticle` / tag no-op.
- `ontology-detail-panel.tsx` **삭제** (215줄 legacy note-only floating 패널) — SmartSidePanel 4탭이 대체.
- `side-panel-detail.tsx` — `activeSpace === "ontology"` placeholder 가드에 `&& !sidePanelContext` 추가 (노드 선택 후 디테일 차단 버그 fix).

**핵심 결정 (영구)**:
- **Ontology node 클릭 = SmartSidePanel 4탭** — legacy OntologyDetailPanel(note-only)은 "모든 entity 4탭 통일" 룰 위반 + wiki/tag 미지원. SmartSidePanel이 더 capable → 제거가 정답.
- **graph node id 스킴** — note는 raw id, **wiki는 `"wiki:" + id`, tag는 `"tag:" + id`** (`lib/graph.ts:218,250`). 사이드바/네비 wire 시 prefix strip 의무.

**기술 학습 (영구)**:
- **Plot 내부 라우팅 = `setActiveRoute` (external store), Next.js router 아님** — `router.push("/wiki/[id]")`는 그 Next 라우트가 없어 **404**. wiki article 열기 = `setActiveRoute("/wiki")` + `navigateToWikiArticle(id)` (`wikilink-context-menu.tsx:179` 검증 패턴). `router.push("/wiki/${id}")`는 코드베이스 곳곳에 있지만 dead code (P0 #5로 정리 대상).
- **`side-panel-detail.tsx`에 space별 하드 가드** — `activeSpace === "ontology"`면 placeholder 강제. 신규 entity를 특정 space 사이드바에 띄울 땐 space 가드 확인 의무.
- **explore agent 결과 = 가설** — agent가 "wiki 노드 id는 raw"라 보고했으나 실제론 `"wiki:"` prefix. preview eval 실데이터로 드러남. ground truth는 코드/실행.

**다음**: P0 #2 Activity events 후속 (granular wiki/book events wire-up + opened emit + label events). SESSION-LOG hook 참조.

---

## 🚀 2026-05-21 (저녁 후속) — **timeline 막대 끝점 재설계 (circle dot → Article 화살촉 / Stub rounded)** ⭐⭐⭐⭐

**범위**: 단일 파일 `wiki-timeline-view.tsx` (+22/-36, 순 −14줄 청소). PR #393 후속. 사용자가 막대 끝 circle dot을 보고 "요 동그라미가 최선인가?" → 브레인스토밍 → 옵션 C 채택.

**완료**:
- 떠 있던 circle status dot 제거 → **Article = 막대 끝 solid 화살촉 ▶ (`<polygon>`, ARROW_DEPTH 9px)** / **Stub = 막대 rounded end (별도 요소 없음)**
- planned horizon dashed tail 초안 추가 → 사용자 "별론데" → **제거** (막대가 Now 라인 넘어 future stripe 진입 = 계획됨, 위치로 자명 — 시각 신호 중복)
- `horizonSource`/`isPlanned` const + `getHorizonSource` import 제거 (dashed tail 폐기로 unused). 헬퍼 자체는 `lib/wiki-utils.ts` 유지.
- 사용자 평 **"마음에 든다 이 정도면"** → timeline 시각 작업 일단락.

**핵심 결정 (영구 후보 #91)**:
- **#91 후보**: 막대 끝점 = status는 도형 자체로 (Article 화살촉 / Stub rounded end). 떠 있는 circle dot은 막대와 disconnect + 단조로움. 도형이 곧 메타포 (화살촉 = 도착/완성/directional, rounded = soft/open).
- **시각 신호 중복 제거 원칙** — 한 정보를 두 곳에서 표현하면 군더더기. horizon source는 막대 위치(future stripe)가 이미 말함 → dashed tail 폐기.

**기술 학습**: SVG `<polygon>` 화살촉 = rect 막대 끝 triangle tip (`points` 3점), `fillOpacity`로 막대 gradient 끝 opacity 매칭, `filter="url(#bar-shadow)"` 공유 → 막대와 시각 통합 / status는 떠있는 요소보다 막대 본체 도형 일부가 통합감.

**다음**: timeline 일단락. P0 = Ontology graph node 사이드바 → Activity events → Books own Views. SESSION-LOG hook 참조.

---

## 🚀 2026-05-21 (저녁) — **timeline 옵션 C drag + event marker chips + Reticle polish (단일 거대 PR)** ⭐⭐⭐⭐⭐

**범위**: 단일 거대 PR #393 (1 파일 `wiki-timeline-view.tsx`, +526/-50). 4 사용자 피드백 라운드 누적 (drag → marker 도입 → 도형 다양화 → 도형 폐기 + Phosphor chip + Reticle polish). 사용자 평 **"아직은 아쉬운데"** → 끝점 재설계 후속으로 일단락.

### Round 1+2+3+4 누적 변경

#### Round 1 — 옵션 C drag로 plannedDate
- `dragState` + window-level pointer listeners + Escape 취소 + `document.body.style.cursor` 잠금
- `clientXToSvgX` + `snapEndXToDay` + `endXToPlannedISO` 헬퍼
- grab handle 12px (cursor ew-resize) + hover/drag 중 vertical hint line
- 막대 width 실시간 확장 (`liveEndX`/`liveWidth` override) + `isPlanned` forced → dashed end-cap 즉시 전환
- `pointerup` → `setWikiArticlePlannedDate(id, iso)` (planning intent)
- 라이브 tooltip "Planning {date} ({relative})"

#### Round 2 — 이벤트 마커 도입
- `entityEvents` selector + `eventsByArticleId` memo + "Events" 토글
- 같은 날 클러스터 → 개별 분리 + 7px stack + `+N` overflow
- 색 매핑 (14 타입)

#### Round 3 — 추상 도형 다양화 (중간, polish 도중 폐기)
- 11종 도형 (ring/circle/square/square-ring/diamond/diamond-ring/triangle/triangle-ring/cross/x/pentagon)
- 사용자 평 "그냥 컬러 dot만 나오는데" → 식별 불가 → **Phosphor chip으로 폐기 전환**

#### Round 4 (최종) — Phosphor 아이콘 chip + Reticle-feel polish
- **Phosphor 아이콘 chip** (Round 3 도형 완전 대체):
  - `MarkerConfig: { icon: Icon, color, label }` — 14 매핑
  - `<circle r=7 fill={color}/>` + `<IconComp x y width height weight="bold" color="white"/>` (nested SVG)
  - 아이콘 12개 import: Plus / PencilSimple / Eye / Trash / ArrowCounterClockwise / LinkSimple / LinkBreak / StackPlus / StackMinus / ArrowsLeftRight / Paperclip / DotOutline
- **Reticle-feel polish**:
  - 막대 dimension: `LANE_HEIGHT 48→52` / `BAR_HEIGHT 24→28` / `BAR_RADIUS 6→8`
  - 막대 depth: 2-layer fill (past/future + vertical highlight gradient) + `feDropShadow` filter
  - Now anchor: vertical line + top dot (r=3.5) + label fontWeight 700
  - Today 컬럼 subtle tint (0.04 opacity)
  - Axis typography 위계: month-start bold / day muted
  - 컨트롤 바 divider (Events / zoom 사이)

### 핵심 결정 (영구 후보 #90, 누적 영구 룰)

- **#90 후보** (사용자 OK 대기): **event markers = icon chip 패턴** — filled colored ring + Phosphor 흰 아이콘 inline (nested SVG). 추상 도형은 작은 사이즈에서 식별 불가 (작업 원칙 #8 reinforce). Gentle ≠ illegible. 사이즈 식별 가능 > 컬러 다양성 > 도형 다양성.
- **bars + events 보완 관계** — bars = 수명 (느린 서사) / events = 사용 활동 (펑크처드 markers). Reticle 패턴 확장.
- **마커 디자인 우선순위** — 사이즈 식별 가능 > 컬러 다양성 > 도형 다양성. 사이즈가 너무 작으면 컬러/도형 변형 무력.
- **막대 depth = 2-layer gradient + drop-shadow 패턴** — past/future 가로 gradient + vertical highlight + `feDropShadow`. SVG filter는 CSS filter보다 SVG element에 정합.
- **Now anchor = vertical line + top dot** — 라인만으론 시각 무게 약함. 4px top dot 추가하면 "지금 여기" 앵커 시각 확립.
- **Today 컬럼 subtle tint** — 라인의 보완. 컬럼 tint = "공간" → 오늘 일자 컨텍스트 자연 그루핑.
- **axis typography 위계** — month vs day differentiation. 1일 tick bold + fg / 일반 day tick light + muted.

### 기술 학습 (영구, 2026-05-21 저녁)

- **SVG nested SVG는 모던 브라우저 정합** — `<svg><svg x y width height>...</svg></svg>` 패턴. Phosphor React component는 자체 `<svg viewBox>` 출력하므로 부모 SVG 안에서 x/y prop으로 위치. foreignObject 회피.
- **Phosphor `weight="bold" color="white"` 패턴** — 작은 사이즈(8~10px)에서 stroke 굵기가 식별성 좌우.
- **SVG `feDropShadow` filter** — `<defs><filter id><feDropShadow dx dy stdDeviation floodColor floodOpacity/></filter></defs>` + `<rect filter="url(#id)"/>`. 막대 main rect에만 적용 (overlay/cap/dot에는 X — muddiness 회피).
- **SVG `<linearGradient>` 2개 매김** — `${gradId}-vh` 패턴으로 ID 충돌 회피.
- **native pointer events vs dnd-kit** — 단순 drag (한 축 + snap)는 native pointer events만으로 충분. 의존성 절약.
- **drag closure 패턴** — useEffect dep에 `dragState?.id, dragState?.pointerId` + 핸들러 내부에서 매번 lanes.find() 로 최신 lane 조회. stale closure 회피.
- **`document.body.style.cursor` 드래그 잠금** + **cleanup에서 prev cursor 복원** 의무.
- **`onMouseLeave` 가드 (드래그 중 tooltip 유지)** — `if (dragState?.id === article.id) return;` 가드.
- **추상 도형 변형은 작은 사이즈(r<5)에서 식별 불가** — 컬러는 식별되지만 도형은 "그냥 dot" 인지. 사이즈 키우거나 Phosphor 아이콘 inline 패턴.
- **`<IconComp x y width height>` 동적 컴포넌트 JSX** — `const IconComp = mc.icon; <IconComp .../>` 패턴이 type-safe.
- **showStubs 토글 = wiki articles 노출 기본 OFF** — 신규 article은 stub 기본. 시드 데이터 검증 시 showStubs ON 의무.

### 환경

- Store version: **144** (변경 없음 — UI 변경만)
- Phosphor 12개 신규 import (`@phosphor-icons/react/dist/ssr/{Name}` SSR variant)
- 단일 파일 부담: `wiki-timeline-view.tsx` 1500+ 줄 — sub-component 분리 후보 (Watch Out)
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓
- 다음: **사용자 시각 검증 + polish 후속** (a-e 후보 중 사용자 우선순위 청취) → OK 시 P0 #2-6 진행. SESSION-LOG hook 참조.

---

## 🚀 2026-05-21 — **bars-first timeline 3 라운드 refine 완성 (단일 거대 PR)** ⭐⭐⭐⭐⭐

**범위**: 단일 거대 PR (+1000/-506, 9 파일 modified, wiki-timeline-view.tsx 1067줄 거대 rewrite). 1+2+3 라운드 누적 완성. dots → bars-first 본질 회복 + 가로 스크롤 표준 패턴 + 시각 효과 풍부화. **사용자 본인 viewport 시각 검증 미완** (after-work 우선 진행 신호로 머지).

### Round 1+2+3 누적 변경

#### Round 1 — 막대 정보 컨테이너 + TODAY 톤다운 + Future stripe
- 막대 안 title embed (`TITLE_THRESHOLD` 60px) — 충분히 넓으면 inside (white + SVG clipPath), 좁으면 outside (`var(--muted-foreground)` start anchor)
- TODAY 빨강 → `var(--border-strong)` 1px opacity 0.7 subtle
- "TODAY" 큰 빨간 라벨 → axis row 안 작은 "Now" (`text-2xs var(--muted-foreground)`)
- Future zone SVG rect `fill="var(--muted)" opacity={0.06}` (nowX → canvasWidth)

#### Round 2 — 가로 스크롤 + sticky + zoom별 px-per-day
- viewport fit 강제 제거. canvas 폭 = `pxPerDay × totalDays`
- ZoomConfig 매핑: Week 80/24/60, Month 32/18/60, Quarter 10/12/50, Year 3/8/40 (px-per-day / MIN_BAR / TITLE_THRESHOLD)
- totalDays: Week 14 / Month 60 / Quarter 120 / Year 400
- Tick collision: Week 1일 / Month Monday-snap 7일 / Quarter 14일 / Year 월초-snap
- "Now" 라벨 옵션 c: vertical line 우측 5px offset (textAnchor: start)
- Sticky: axis header top (z=20) + corner cell (z=30) + label column left (z=10), 모두 불투명 `var(--bg)`

#### Round 3 — 캔버스 depth + 막대 affordance + Past/Future gradient
- **A1 Weekend stripe** — `dayOfWeek===0||6`, opacity 0.04 (Year zoom에선 자연 fade)
- **A2 Month boundary** — 매월 1일 1px opacity 0.5, 일반 day tick 0.5px opacity 0.25 (차별화)
- **A3 Row separator** — 기존 lane-sep opacity 0.25 → 0.2
- **B1 Hover state** — React `hoveredId` + mouseEnter/Leave (SVG :hover 불충분). rect bg 0.12 + stroke ring 0.5 + 라벨 column `bg-secondary/40`
- **B2 Tooltip** — absolute div 4줄 (Title+icon / Status / Created / Planned in N days or Updated). SVG foreignObject 회피
- **B3 Status dot** — Stub hollow (`fill=bg, stroke=color, sw=2`, raw 메타포) / Article solid (completed 메타포)
- **D1 Past/Future gradient** — `<linearGradient>` 1개, past 0.78 → future 1.0, gradStop = (nowX-x)/width clamped
- **D2 horizon source** — `getHorizonSource(article): "planned" | "updated" | "created"` 헬퍼 신규. plannedDate horizon 시 우측 끝 dashed vertical overlay

### 핵심 결정 (영구 후보 #89, 누적 영구 룰)

- **#89 후보** (사용자 OK 대기): **planning intent ≠ content activity** — `setWikiArticlePlannedDate`는 `updatedAt` 갱신 안 함. planning은 의도 표명이지 content 변경 아님.
- **bars-first timeline = 막대가 정보 컨테이너 (Reticle 패턴)** — dots-first는 산점도 (위치만), bars-first는 timeline (위치 + 길이 + 정보). 막대 안/옆 title + 끝점 status dot + Tooltip이 본질.
- **viewport fit 강제는 timeline antipattern** — 1일에 충분한 px (zoom별 80/32/10/3) + 가로 스크롤 인정 = Gantt/Linear/Reticle 표준. fit forcing은 tick label도 막대도 다 압축.
- **"Now" 라벨은 axis tick과 다른 alignment** — vertical line 우측 5px offset + textAnchor "start". 같은 row여도 alignment 차로 collision 회피.
- **Plot "Gentle" 톤 = subtle layers + opt-in affordance** — Weekend stripe 0.04 / Future stripe 0.06 / NOW line 0.7 / hover ring 0.5 / gradient 0.78→1.0. 모든 시각 효과 subtle, intrusive X.
- **Status dot 메타포 (timeline 한정)** — Stub = hollow (raw, unfinished), Article = solid (completed, present).
- **horizon source 3분기** — `plannedDate` (intent, dashed end-cap) / `updatedAt` (last activity, solid) / `createdAt` (last-resort fallback). 우측 끝 dashed vs solid가 source 시각 분리.

### 기술 학습 (영구, 2026-05-21)

- **SVG hover는 React state + mouseEnter/Leave 패턴** — CSS :hover 불충분 (SVG 자식 selector 까다로움). React state hoveredId로 SVG 그룹 전체 + 라벨 column 동기.
- **SVG bar에 Tooltip = absolute div wrapper** — `<foreignObject>`는 z-index / 브라우저 호환 까다로움. 막대 위 invisible hit area + 외부 absolute Tooltip이 안전.
- **D1 Past/Future gradient = linearGradient 1개 > split rect 2개** — 부드러운 transition + 픽셀 완벽.
- **gradient stop clamp 의무** — `Math.max(0, Math.min(1, ratio))`. 클램프 안 하면 nowX가 막대 밖일 때 invalid.
- **sticky element 불투명 배경 의무** — `position: sticky` + 불투명 `var(--bg)`. 투명하면 막대가 비춰 sticky 효과 X.
- **sticky z-index 위계** — corner (max) > sticky col (mid) > sticky header (low) > content (base).
- **px-per-day zoom 별 상수 매핑 > 비례 공식** — `pxPerDay * factor` 계산은 zoom 경계에서 minBar 점프 발생. zoom 별 상수가 명시적 + 디버깅 쉬움.
- **`window.__plotStore` dev expose 패턴** — Plot은 store를 window에 노출 (dev 검증용). preview MCP eval로 store action 직접 호출 가능. **production 노출 여부 확인 의무** (다음 세션 grep).
- **preview MCP IDB는 사용자 본인 viewport와 분리** — 같은 origin 같은 path여도 별도 browser context. dummy data sync 안 됨. 시각 검증은 사용자 본인 viewport가 진실 source.

### 환경

- Store version: **144** (변경 없음 — `plannedDate`는 additive optional, migration 불필요)
- 신규 store action: `setWikiArticlePlannedDate(articleId, iso | null)` (planning intent, updatedAt 안 건드림)
- 신규 헬퍼 (`lib/wiki-utils.ts`): `safeDate`, `horizonOf`, `getHorizonSource`
- 단일 거대 파일 부담: `wiki-timeline-view.tsx` 1067줄 — sub-component 분리 후보
- 정리: `nul` 파일 삭제 + `.claude/worktrees/` gitignore
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓
- 다음: **bars-first 시각 검증** (사용자 본인 viewport, dummy snippet) → OK 시 **옵션 C (drag로 plannedDate)** 별도 PR. SESSION-LOG 최신 entry hook 참조.

---

## 🚀 2026-05-20 — **4영역 작업 + timeline-planning bars-first 전환** ⭐⭐⭐⭐

**범위**: dead-block cleanup + Home Overview NavLink + breadcrumb 통일 + timeline-planning(PDCA Plan/Design + 구현 진행 중). 단일 PR.

### 완료
- **dead block cleanup** (3 파일) — PR #387 옵션 A 잔존: `wiki-view-mode.ts` `WikiViewMode` union `"category"` 제거 / `side-panel-context.tsx` `isCategoryMode` dead block 제거 / `library-categories-view.tsx` stale 주석.
- **Home "Overview" NavLink** — `linear-sidebar.tsx` Home 사이드바에 Overview 진입점 추가 (Home Overview = `HomeView` 대시보드, 이미 존재했고 사이드바 NavLink만 부재였음).
- **Breadcrumb 통일** — `library/book-breadcrumb.tsx` crumb 아이콘 제거(텍스트-only, Notes 기준) + `inbox-view.tsx` "Home › Inbox" breadcrumb 신설.
- **timeline-planning PDCA Plan+Design** — `docs/01-plan/features/timeline-planning.plan.md` + `docs/02-design/features/timeline-planning.design.md` 신규.
- **timeline-planning 구현 진행 중** — `wiki-timeline-view.tsx` 신규 + `WikiArticle.plannedDate?` 필드 + `ViewMode "timeline"` 등록(types/view-configs/display-panel) + `wiki-view.tsx` 분기. **dots 기반 (bars-first 재설계 직전)**.

### 핵심 결정 (영구)
- **timeline-planning**: Todo = **1a(지식 엔티티 계획 도구)** 채택, 1b(TickTick 범용 투두) 폐기 — Plot 코어 이탈. planning layer = 경량 `WikiArticle.plannedDate` 필드 (신규 엔티티 X). Timeline = **view-engine display mode** (List/Board/Gallery 형제), Calendar 전용 X.
- **★ bars-first 전환**: dots-only 타임라인은 약함 (Reticle 레퍼런스 비교 — 막대라야 타임라인). 막대 = `createdAt → horizon(plannedDate ?? updatedAt)`. 막대 범위 = planning이므로 Stage 1(dots)/Stage 2(planning) 구분 폐기·통합.
- **Home/Inbox 구조 정정**: Inbox = attention 큐(reminder/SRS/snooze/wiki제안). Home Overview = `HomeView` 대시보드 (기존). status와 Inbox는 별개 layer.

### 기술 학습 (영구)
- **신규 뷰 컴포넌트는 Plot 토큰/패턴 명시 지시 의무** — agent standalone 제작 시 Plot 타이포 토큰(`text-note`/`text-2xs`)과 단절. 기존 뷰 reference 명시 + 시각 검증.
- **SVG/CSS `height="100%"`는 부모 명시 height 필요** — `min-height`로는 % 해소 X. 스크롤 영역 채우기 = ResizeObserver 측정 → 명시 px.
- **타임라인은 planning(막대) 없이 약함** — dots = 산점도, 범위 막대라야 타임라인.

### 환경
- Store version: **144** (변경 없음 — `plannedDate`는 additive optional, migration 불필요)
- 다음: timeline-planning **bars-first 재설계** (design §5/§3/§11 재작성 → `wiki-timeline-view.tsx` 재구현). SESSION-LOG 최신 entry hook 참조.

---

## 🚀 2026-05-19 (밤 후속 #2) — **P0 #1 Plan A++ 완료 (PR #387)** ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`nervous-pare-362441`). 단일 PR #387 (20 파일 +315/-162, 신규 1) + 이번 docs sync. Plan A++ — Categories own view component 분리 + Library Views section 제거 + SavedView.space migrate v143→v144 + HIGH risk fix.

### 핵심 결정 (영구 LOCKED #84-#88, 5개 신규)

이번 PR이 직전 brainstorming 결과 + 부산물 5개 영구 룰 LOCKED:

- **#84**: wiki-view-mode external store는 LibraryCategoriesView가 직접 구독 (own component own state subscribe)
- **#85**: layout.tsx mount 조건 정확 매핑 의무 (`activeRoute === "/library/categories"` vs `startsWith("/library")` too broad)
- **#86**: Save view 의미 = entity 본질 따라 differentiate
- **#87**: Library = hub. own Views section 없음. 1차 시민이지만 view는 sub-entity가
- **#88**: Categories own view component (cross-entity 본질 회복)

### PR 요약

**PR #387** (`fb4c2da`, +315/-162, 20 파일, 1 new): Plan A++ paired PR

**Phase 1 — Categories own view (8 파일)**:
- 신규 `components/views/library-categories-view.tsx` (147 lines, own contextKey `"library-categories"`)
- `components/views/wiki-view.tsx` — `wikiViewMode === "category"` 분기 4곳 + state + import 완전 제거 (~160 lines)
- `app/(app)/layout.tsx` — WikiView ↔ LibraryCategoriesView mount 분리
- `components/views/library-view.tsx` — Categories card navigate `/wiki` → `/library/categories` + stale 코멘트 제거
- `app/(app)/library/categories/page.tsx` — stale JSDoc 제거
- `lib/table-route.ts` + `lib/view-engine/types.ts` + `lib/view-engine/defaults.ts` + `lib/view-engine/view-configs.tsx` — `"library-categories"` 등록

**Phase 2 — Library Views section 제거 + migrate (4 파일)**:
- `components/linear-sidebar.tsx` — Library section `renderViewsSection` 제거 + Categories sub-page conditional + `getSavedViewSpaceForActivity(activeSpace, activeRoute)` route 인자
- `lib/types.ts` — SavedView.space union "library" 제거 + "library-categories" 추가
- `lib/store/migrate.ts` — v143→v144 migration (실제 mutation, re-tag, idempotent)
- `lib/store/index.ts` — persist version 144
- `lib/view-engine/saved-view-context.ts` — 시그니처 확장 + "library-categories" 매핑

**HIGH risk fix (옵션 A, 6 파일)** — Architect 1차 verification에서 발견:
- `lib/wiki-view-mode.ts` — setter 부작용 제거 (setWikiViewMode("category") 호출 제거)
- 6 cross-entity 호출처 `router.push("/library/categories")` 페어링:
  - `wiki-article-view.tsx:1124-1129` / `navbox-block.tsx:293-299`
  - `side-panel-context.tsx` (useRouter import 추가) / `side-panel-connections.tsx` (navigateToCategory useCallback)
  - `category-detail-panel.tsx` (navigateToCategory useCallback)

### 검증

- npx tsc --noEmit: clean (0 errors)
- npm run build: clean (40/40 static pages, 13s)
- setWikiViewMode("category") 호출 grep: **0 hits**
- Architect verification 2회: 1차 opus APPROVED_WITH_NOTES → fix → 2차 sonnet APPROVED_WITH_NOTES (LOW dead block follow-up)

### 기술 학습 (영구, 2026-05-19 밤 후속 #2)

- **wiki-view-mode external store 부작용 분리 패턴**: setter가 wikiViewMode 전환 + 다른 state 갱신할 때, wikiViewMode가 더 이상 처리 안 되면 setter에서 wikiViewMode 호출만 제거 + 다른 state 유지. enum value 잔존은 LOW risk (별도 cleanup PR로 분리 OK).
- **Cross-entity click handler paired route navigate 패턴**: cross-entity 자원 click 시 own page navigate 의무. handler 시그니처 `setX(id) + setActiveRoute(path) + router.push(path)` 3-tuple.
- **Architect verification 2회 패턴 효율**: 1차 opus + 2차 sonnet (짧게) — 정확도 + 효율 balance.
- **getSavedViewSpaceForActivity 시그니처 확장 (space + route)**: activeSpace 단독으로는 sub-entity 분리 불충분.
- **VIEW_CONFIGS defensive shallow clone**: `{ ...WIKI_CATEGORY_VIEW_CONFIG }` — future cross-contamination 회피.
- **Library hub 본질 = sub-entity가 view 보유**: 1차 space ≠ own view 필수. multi-entity hub은 sub-entity가 view 보유 (Linear 패턴 정합).

### 환경 변경

- Main HEAD: `529cfcb` → `fb4c2da` (PR #387)
- Store version: **143 → 144** (v143→v144 실제 mutation migration)
- 신규 file: `components/views/library-categories-view.tsx` (147 lines)
- ViewContextKey 확장: "library-categories"
- SavedView.space 변경: "library" → "library-categories"

### 다음 세션 즉시 액션 (TODO.md P0)

🟣 **P0 follow-up**: dead block cleanup (side-panel-context.tsx:131-156 + WikiViewMode "category" 제거 + setter 정리) — LOW risk, ~3 파일
🟡 **P0**: Calendar / Ontology graph node / Activity events / Books own Views section gap (영구 룰 #87)
🟢 **manual smoke 누적 14 PR (#373-#387)** — fresh dev 재현 권장

---

## 🚀 2026-05-19 (밤 후속) — **13 PR squash + Library Views 본질 brainstorming** ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`keen-torvalds-ba16f7`). 13 PR (#373-#385) + 이번 docs sync. 후반부 view-engine + Library 회귀 fix 6 PR (#381-#385) + 4단 본질 brainstorming.

### Brainstorming 4단 사용자 통찰 (다음 세션 핵심 진입점)

#### 통찰 1: Save view 의미 = entity 본질 따라 differentiate
- Notes/Wiki/Books: variation 많음 → Save 큼
- Categories: hierarchy + grouping → Save 의미
- Tags/Labels/References/Stickers/Files: variation 적음 → Save 약함 (이미 코드 호출 없음)

#### 통찰 2: Library cross-entity hub 본질 회복 (영구 LOCKED #54/#57 회복)
- Labels/Categories Library 이동 = 2026-05-17 영구 결정 (cross-entity 분류 hub)
- ✓ OK

#### 통찰 3: View = 메타-entity (자기 정체성)
- SavedView id/name/icon/color → entity처럼 행동
- 단 first-class data 아님 — 메타 (entity의 view 저장)
- Notion/Linear/Airtable 모두 entity-tied 패턴

#### 통찰 4 (최종): Categories own view component 필요
- **"카테고리스 뷰를 위키 뷰로 나오게 하면, 카테고리스가 범용 엔티티가 아니라 위키 종속 엔티티처럼 느껴지는데??"**
- PR #383: `/library/categories` → wiki-view mount → **wiki 종속 부조화**
- 영구 룰 #54 (cross-entity) + #57 (Library hub) 위반
- → **Plan A++ CategoriesView own component 분리** (다음 세션 P0 #1)

### PR 요약 (이번 세션 누적 13 PR + docs sync)

P0/P1 8 PR (#380에서 정리 완료):
- #373/#374/#375/#376/#377/#378/#379/#380

P1 view-engine + Library 회귀 5 PR (이번 entry 신규):
- **PR #381** (`430b6de`): view-engine Phase 1 filter popover 표준 정합 (Tags/Labels sub-page)
- **PR #382** (`853e1d1`): Library visibility fix — LibraryView sub-route hide (split view 자동 fix)
- **PR #383** (`3226fb6`): Categories Library sub-page route (wiki page jump 해소)
- **PR #384** (`3636555`): LibraryView fallback 회귀 fix (Tags/References 빈 화면 회복)
- **PR #385** (`1426ec8`): Library Views section + Labels filter (B+E entity-uniformity)

### 영구 LOCKED 결정 후보 (다음 세션 결정 대기)

이번 세션 신규 영구 룰 추가 0건. 단 brainstorming 결과 #86-#88 후보:
- **#86**: Save view 의미 = entity 본질 따라 differentiate
- **#87**: Library 1차 space → own Views section (entity-uniformity)
- **#88**: Categories own view component 분리 (cross-entity 본질 회복) — Plan A++ 진행 시 LOCKED

### 기술 학습 (영구, 2026-05-19 밤 후속)

- **layout.tsx visibility condition 핵심 — main-content panel 안 multi-view mount**: `activeRoute?.startsWith()` too broad → main-content 양분 (split-like 화면). 정확 매핑 필요 (`=== "/library"` vs sub-route).
- **Save view 시스템 entity-tied 본질**: SavedView.space 별로 sidebar Views section. Linear 패턴 정합 — workspace/team own views.
- **View = 메타-entity**: id/name/icon/color로 자기 정체성. 단 first-class data X. 사용자 mental model: 절단 패턴 저장.
- **Categories own view 필요성 — cross-entity 본질**: wiki-view 통한 표시 = wiki 종속 부조화. 영구 룰 #54 (WikiCategory 풀 공유) + #57 (Library cross-entity hub) 정합 위해 own view component 분리.
- **사용자 brainstorming 시 docs 회복 중요성**: "왜 라벨/카테고리를 라이브러리로 옮긴 거였어?" 의문에 영구 LOCKED 결정 #53-#58 (2026-05-17) 발견 → mental model 회복. 영구 결정 docs 검색 의무 패턴.
- **다층 디자인 결정 분리 의무**: 분류 메커니즘 cross-entity ≠ Save view 의미 ≠ View entity 위치. 각자 본질 다름, 결정 분리 필요.

### 환경 변경

- Main HEAD: PR #380 → PR #381-#385 누적 → 이 docs sync PR
- Store version: 143 (변동 없음, schema 변경 0)
- 신규 file: `app/(app)/library/categories/page.tsx` (PR #383)
- SavedView.space 확장: `"library"` 추가 (back-compat)
- FilterField 확장: `"usage"` (Labels-entity)

### 다음 세션 즉시 액션 (TODO.md P0)

🔴 **P0 #1**: CategoriesView own view component 분리 (Plan A++, ~5-7 파일, 사용자 brainstorming 결정 대기)
🟣 **P0 #2**: Library Views section 본질 결정 (Plan A++ 후 dynamic 또는 제거)
🟡 **P0 #3-5**: Calendar 사이드바 / Ontology graph 사이드바 / Activity events / manual smoke

---

## 🚀 2026-05-19 (저녁/밤) — **P0 1-4 + P1 3개 (7 PR squash 머지) — view-engine 통합 진단** ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`keen-torvalds-ba16f7`). 7 PR — PR #373 (light mode contrast), PR #374 (group header tint), PR #375 (WikiTemplate hero UI), PR #376 (TS debt cleanup), PR #377 (Wiki Template insert), PR #378 (TagDetailPanel cross-entity), PR #379 (split view quick fix).

P0 1-4 + P1 3개 모두 완료. Tags/Labels view-engine 통합 진단 후 다음 세션으로 보류.

**사용자 시그널 (그대로 인용)**:
1. "P0#1을 하자. 근데 해당 작업 내용이 뭐지?" → 직관 설명 후 진행
2. "지금 뭐가 바뀐 거지??" → PR 효과 사용자 관점 설명 (themeColor 설정 article에서만 보임)
3. "ㄴㄴ 다음 작업 진행하자" → 우선순위 명확
4. (스크린샷) "태그스는 필터위치가 이상해... 라벨스의 경우 자꾸 스플릿뷰로 나오거든? 이거 버그같은데" → 진단 + quick fix
5. "우선 2를 하고 1을 해보자" → split view fix (PR #379) 진행, view-engine 통합 다음 세션
6. "after-work + 다음 세션 (Recommended)" → mental state 정리

### PR 요약

- **PR #373** (P0 #1): light mode hex contrast — `useTintedText` hex 지원 (1 파일, ~10줄)
- **PR #374** (P0 #2): group header tint cascade — Tailwind arbitrary selector + `color-mix(15%)` (3 파일)
- **PR #375** (P0 #3): WikiTemplate detail panel hero edit UI (1 파일 +68)
- **PR #376** (P0 #4): **TS debt 10 → 0 errors** + dead code + doc + hatnotes (11 파일 +38/-704)
- **PR #377** (P1): Wiki Template insert via AddBlockButton (3 파일 +82/-9)
- **PR #378** (P1): TagDetailPanel cross-entity 강화 (1 파일 +121/-20)
- **PR #379** (P1 quick fix): Labels/Tags split view auto-close (2 파일 +20)

### 영구 LOCKED 결정 (이번 세션, 신규 0 — 기존 영구 룰 적용)

이번 세션 7 PR 모두 기존 영구 룰 자연 follow-up:
- #69 (generic patch) — PR #377/#375 재사용
- #82 (cascade opt-in) — PR #374 group header tint
- #83 (component prop optional + back-compat) — PR #377 WikiTemplatePicker mode
- #21 (entity-uniformity) — PR #378 TagDetailPanel / PR #379 labels+tags 동일 패턴

### 기술 학습 (영구, 2026-05-19 저녁/밤)

- **`color-mix(in srgb, ...)` Tailwind arbitrary value**: `bg-[color:color-mix(in_srgb,var(--xxx)_15%,transparent)]` (underscore = space). 모던 브라우저 작동. opacity 조정만으로 다양한 강도 가능.
- **WikiTemplate insert path 단순화**: 신규 store action 불필요. 기존 `getWikiTemplateBlocksExpanded` + `updateWikiArticle({blocks})` 조합 (영구 룰 #69 generic patch).
- **split view state persist 버그 패턴**: Zustand persist 대상에 `secondaryNoteId` / `activePane` 포함. Library sub-page mount once `closeSecondary()` 자동 호출 패턴으로 해결.
- **사전 부채 cascading**: SortField type 확장 시 `Record<SortField, X>` 매핑도 확장 필요 (PR #376의 cascading fix). tsc 자동 검출.
- **InfoboxHeroPicker self-contained Portal Dialog**: caller가 add/edit 분기 안 가짐 — picker가 `initial` null/non-null로 자체 분기. mount 위치 자유.

### 환경 변경

- Main HEAD: PR #379 머지 후 + docs sync
- Store version: 143 (변동 없음, schema 변경 0)
- 신규 파일: 0 (PR #376에서 `components/note-detail-panel.tsx` 삭제만)
- 영구 룰 추가: 0
- **TS 부채 청소: 10 → 0** (이제부터 tsc --noEmit 항상 clean 의무)

### 다음 (TODO.md P0)

🔴 **P0 #1**: Tags/Labels sub-page view-engine 통합 (~10 파일). Tags filter 위치 정합화 + ViewHeader 표준 적용. 사용자 결정 받음.
🟡 **P0 #2-3**: Calendar/Ontology graph 사이드바 (의도 결정 후)
🟡 **P0 #4**: Activity events 후속 (Granular + Label)
🟡 **P0 #5**: Tags/Labels 사이드바 회귀 재진단 (2026-05-15 보고)

---

## 🚀 2026-05-19 (저녁) — **PR #370 polish + PR #371 themeColor cascade (2 PR squash 머지)** ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`angry-shtern-b2ac28`). 2 PR — PR #370 (Hatnote dialog polish, conflict resolve 머지), PR #371 (themeColor cascade system, +356/-27, 11 files, 1 new).

PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md` **Phase 5+ second wave 완료**. BRAINSTORM Top 7 #4 (themeColor 시스템) 정합. Plot 시각적 정체성 강화 — 사용자가 article마다 자기 "주제 색" 지정 → infobox header / hatnote accent / h2 section borders cascade.

**사용자 시그널 (그대로 인용)**:
1. "야 Type 안에 글자들이 너무 박스 안에서 빼곡한 느낌인데... 브레인스토밍 좀 해볼래" → PR #370 polish (옵션 2)
2. "1인데, 이건 위키의 테마 컬러를 말하는 건가??" → themeColor 작동 방식 설명 + 6 옵션 정리
3. "오케이 너의 제안으로" → A1 + B2 + C3 따라 진행
4. "다른 컴퓨터로 올거니까 after-work 완벽하게" → architect NEEDS FIXES 모두 적용 후 PR #371 squash 머지

### PR 요약

- **PR #370** — Hatnote dialog Type Select polish: SelectItem 2-line → 제목 한 줄 + Select 아래 hint
- **PR #371** — themeColor cascade: 단일 hex string + `--wiki-theme-color` CSS variable inject (root container) + infobox header fallback + hatnote accent border + h2 section borders opt-in (Tailwind arbitrary selector) + PRESET_COLORS 18색 picker dialog + Persist v143

### 영구 LOCKED 결정 (이번 세션, #81-#83)

- **#81. themeColor = 단일 hex string + CSS variable cascade 패턴**: `{light, dark}` 이중 객체 X (over-engineering). `--wiki-theme-color` CSS variable inject + light/dark 분기는 `useTintedBg` hook (next-themes)에 위임. 향후 다른 cascade color (NavBox accent, Ambox 등) 동일 패턴.
- **#82. 디자인 cascade는 opt-in 의무** (영구 룰 #67 정합 강화): themeColor null 시 모든 cascade chrome 0. Tailwind arbitrary selector (`[&_[data-h2]]:`) 패턴으로 root container className 토글. 영구 적용 + transparent fallback은 매력적이지만 default chrome noise를 invite하므로 폐기.
- **#83. Component prop signature 확장은 optional + back-compat 의무**: 모든 신규 prop은 default `undefined` + caller 영향 0 가능해야 함. WikiInfobox `themeColor?` / `onThemeColorChange?` 미사용 caller (note-editor.tsx, wiki-article-reader.tsx) 영향 0.

### 기술 학습 (영구, 2026-05-19 저녁)

- **CSS variable cascade vs prop drilling**: 동일 색을 5+ 컴포넌트에 전달 시 CSS variable inject이 prop drilling보다 정직. SSR-safe, 분기 코드 0, 자손 자동 수신.
- **Tailwind arbitrary selector + CSS variable**: `[&_[data-h2]]:border-l-[3px] [&_[data-h2]]:pl-3 [&_[data-h2]]:border-l-[color:var(--wiki-theme-color)]` 한 줄로 자손 cascade. v3.2+ 작동.
- **useTintedBg hex desaturate 안 함 부채**: `lib/tinted-bg.ts:60-61` regex가 `rgba` 전용. hex 입력은 light/dark 둘 다 unchanged passthrough → light mode contrast 부족 (vivid yellow/lime/amber). `lib/wiki-color-contrast.ts::shouldUseLightText` 통합 follow-up 의무.
- **Encyclopedia layout = 4 mount 위치**: wiki-view 메인 / split secondary / note-hover-preview / wiki-embed-node. cascade 추가 시 두 root 경로 모두 수정 필수 (architect 검증으로 발견).
- **Stacked PR + 같은 파일 polish conflict**: 머지된 PR 직후 같은 파일 polish 시 line-level conflict. HEAD 우선 + Edit으로 manual marker 제거 안정 패턴.

### 환경 변경

- Main HEAD: `91c8eca` → `a5e6ef8` (PR #371)
- Store version: 142 → **143** (PR-E2 v142→v143 sentinel)
- 신규 type field: `WikiArticle.themeColor?: string | null`
- 신규 setter: `setWikiArticleThemeColor`
- 신규 file: `components/wiki-editor/wiki-theme-color-picker.tsx`
- WikiInfobox prop 확장: `themeColor?` + `onThemeColorChange?` (optional, back-compat)
- 영구 룰 추가: #81-#83

### 다음 (TODO.md P0)

🔴 **P0 #1**: light mode hex contrast follow-up — `useTintedText`에 `shouldUseLightText` 통합 (단일 파일 ~10줄). 사용자가 vivid PRESET_COLORS 클릭 시 흰 글씨 가독성 망함. **우선순위 가장 높음**.
🟣 **P0 #2 (PR-E3 후보)**: `편집 히스토리 v1` (multi-machine PRD 시점 권장 — 지금 만들면 재설계) / `Ambox` (Skip 권장, noise risk) / `Group header tint` (themeColor follow-up) / `SectionTemplate` (MVP 후) 중 결정.
🟡 **P0 #3**: WikiTemplate detail panel hero edit UI (~3 파일, PR-C 후속).
🟢 **P0 #4**: dead code + TS 부채 cleanup PR + doc comment 부정확 3건 (PR-E1 architect non-blocking).

---

## 🚀 2026-05-19 — **PR-E1: Hatnotes + Preset import/export (Phase 5+ first wave, PR #368 squash 머지)** ⭐⭐⭐⭐

**범위**: 1 worktree (`angry-shtern-b2ac28`). 1 PR — PR #368 (Hatnotes + Preset I/O, 1 commit squash, +828/-4, 11 files).

PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md` **Phase 5+ Out of Scope** 후보 6개 (Hatnote / Ambox / themeColor / 편집 히스토리 / SectionTemplate / Preset I/O) 중 첫 2개 도입. Plot 제텔카스텐 본질 강화 (문서 관계 명시) + PR-D ecosystem 완성.

**사용자 시그널 (그대로 인용)**:
1. "1을 자세히 말해봐" → PR-E (Phase 5+) 후보 6개 정리 보고
2. "너의 제안을 듣고 싶어, 어떤 것부터 작업하는 게 좋을지" → Hatnote + Preset I/O 추천 (Plot 정체성 + Linear 미니멀 + 위험 낮음)
3. "ㅇㅇ 진행해" → 전체 워크플로우 자동 진행

### PR 요약

- **PR #368** — Hatnotes (Wikipedia/나무위키 표준 5 type) + Preset import/export JSON (PR-D 자연 후속). Persist v141→v142 sentinel.

### 영구 LOCKED 결정 (이번 세션, #79-#80)

- **#79. Hatnote = Wikipedia/나무위키 표준 5 type 정합**: above (Part of) / below (Subtopics) / distinguish (Not to be confused with) / main (Main article) / see-also (See also). 5 라벨 영어 통일. 향후 다른 wiki feature도 동일 i18n 패턴.
- **#80. JSON export envelope = `{ version, exportedAt, presets }` 패턴**: 향후 다른 entity export (WikiTemplate / Reference 등) 동일 envelope shape로 미래 호환성 확보. raw array fallback 지원.

### 기술 학습 (영구, 2026-05-19)

- **JSON paste textarea + file upload 양쪽 입력 패턴**: 짧은 JSON은 paste, 긴 JSON은 file upload. 두 path 다 동일 parser 통과 → preview → import 일관.
- **SSR-safe browser download**: `typeof window === "undefined" || typeof document === "undefined"` guard 필수. Blob + URL.createObjectURL + anchor click + URL.revokeObjectURL 패턴.
- **WikiPicker `excludeIds` cycle safety**: cross-link feature target picker에 자기 자신 제외해서 self-reference 사고 방지. 향후 See also auto-suggest 등 동일 패턴.
- **executor-high (opus) 멀티파일 작업 패턴 정합**: explore (sonnet) → executor (opus) → architect (opus) 3-stage. explore가 정확한 line + 패턴 파악, executor가 최소 diff 구현, architect가 영구 룰 정합 검증. 한 세션에 11 파일 +828/-4 안정 처리.

### 환경 변경

- Main HEAD: `0531f38` → `56ecb24` (PR #368)
- Store version: 141 → **142** (PR-E1 v141→v142 sentinel)
- 신규 type: `HatnoteType` + `Hatnote`
- 신규 필드: `WikiArticle.hatnotes?: Hatnote[]`
- 신규 setter: `setWikiArticleHatnotes`
- 신규 file (4): `wiki-hatnotes.tsx` + `hatnote-edit-dialog.tsx` + `import-preset-dialog.tsx` + `lib/wiki-infobox-presets-io.ts`
- 영구 룰 추가: #79-#80

### 다음 (TODO.md P0)

🟣 **P0 #1 (PR-E2 후보)**: `themeColor 시스템` (BRAINSTORM #4, 디자인 정체성, light/dark cascade) 또는 `편집 히스토리 v1` (multi-machine PRD 시점에 자연 통합 권장) 중 사용자 우선순위 결정. 메인 추천: themeColor.
🟡 **P0 #2**: WikiTemplate detail panel hero edit UI (~3 파일, PR-C 후속).
🟢 **P0 #3**: dead code + build TS 부채 cleanup PR.

---

## 🚀 2026-05-18 (저녁) — **fix bundle + PR-D + PR-C Hero Image (3 PR squash, 6 commits + 1 stacked re-target)** ⭐⭐⭐⭐

**범위**: 1 worktree (`musing-gagarin-62e958`). 3 PR — PR #365 (fix bundle, 4 commits squash), PR #363 (PR-D UserInfoboxPreset, 1 commit squash), PR #367 (PR-C Hero Image 재타겟, 1 commit squash, 원래 PR #366는 base 자동 close).

PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md` **Phase 1+2+3+4 모두 완료**. Phase 5+ (Hatnote / Ambox / themeColor / SectionTemplate / import-export) Out of Scope, P0 후보.

**사용자 시그널 (그대로 인용)**:
1. "야 우선 밑줄부터가 업노트가 훨씬 더 부드러운 느낌(우리는 ...인 느낌)" → EmptyHint UpNote 스타일 (commits 3)
2. "야 이거 그리고 영어버전인데 왜 한글로 설명이 나오는 거야??" → WikiTemplate seed 8 description 영어 통일
3. "엔터를 치자마자 나와서 깜짝 놀랐어" → EmptyHint trigger 강화 (paraCount===1+!paraHasText)
4. "drag로 위치 바꾸려고 하면 컬럼이 만들어져서" → block-drag-overlay regular block side-drop 폐기 (영구 룰 #8)
5. "위키의 infobox에서는 에디트를 눌러도 이미지 파일 삽입 기능이 없네?" → PR-C Hero Image

### PR 요약

- **PR #365** — fix bundle (i18n + EmptyHint trigger + UpNote 스타일 + drag column 폐기)
- **PR #363 (PR-D)** — UserInfoboxPreset Save as preset (PRD Phase 4, persist v140)
- **PR #367 (PR-C 재타겟)** — Hero Image (PRD Phase 3, InfoboxHero type + 3 entity field + figure slot + 신규 picker dialog, persist v141)

### 영구 LOCKED 결정 (이번 세션, #74-#78)

- **#74. EmptyHintPlaceholder trigger = top-level paragraph 1개 + 비어있을 때만**: heading 무시. childCount > 1 조건은 빈 신규 노트도 차단 사고 → forEach로 paragraph만 카운트.
- **#75. ProseMirror Decoration.widget placeholder UX**: inline 위치 → cursor 충돌. `position: absolute; left: 0` + 부모 paragraph `position: relative` (Decoration.node)로 layout 분리. cursor가 paragraph 시작에 자연 위치 (UpNote/Notion 패턴).
- **#76. Block drag side-drop column 자동 생성 폐기 (영구 룰 #8 재확인)**: regular block 좌/우 edge → column 생성은 사용자 직관 위반. column 만들기는 slash `/2 Columns` 또는 Insert (+) 메뉴 명시 action만. columnsBlock target drop은 유지.
- **#77. Hero image = 별도 필드 (entries 외)**: 의미 명확 + 1개 제한 자연. 향후 banner image 등 다른 visual asset도 동일 패턴.
- **#78. Cross-entity hero shape 통일**: 3 entity 동일 `InfoboxHero { url, caption?, alt? }`. Template → Article 변환 시 자동 복사.

### 기술 학습 (영구)

- **TipTap editor plugin closure는 HMR로 갱신 안 됨**: Plugin 등록 후 closure가 editor instance에 박힘. 코드 변경해도 옛 closure 유지. **Full reload 필수**. 사용자 fix 안 보인다 보고 시 reload 부탁이 첫 step.
- **Stacked PR + squash 머지 패턴 사고**: PR-C가 PR-D base였는데 PR-D squash 머지 → PR-C base branch 사라짐 → PR-C 자동 closed. closed PR은 base 변경/reopen 불가. **새 PR을 head 그대로 + base=main 생성 + `git merge origin/main` + conflict resolve**가 답.

### 환경 변경

- Main HEAD: PR #365 + PR #363 + PR #367 누적
- Store version: 140 → **141** (PR-C v140→v141 sentinel)
- 신규 type: `InfoboxHero { url, caption?, alt? }`
- 신규 필드: `WikiArticle.infoboxHero?` + `Note.wikiInfoboxHero?` + `WikiTemplate.infoboxHero?`
- 신규 컴포넌트: `components/editor/infobox-hero-picker.tsx`
- 영구 룰 추가: #74-#78

---

## 🚀 2026-05-18 (오후) — **Infobox UX 종합 대규모 — PR #361/#362/#363 (3 PR, 22 commit, ~700+ 줄)** ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`brave-rubin-3e45fa`). 3 PR — PR #361 (7 commit, merged d95b61b), PR #362 (3 commit, merged 43fcd44), PR #363 (1 commit, open). PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md` Phase 1/2/4 완료. Phase 3 (Hero Image) 남음.

**사용자 시그널 (그대로 인용)**:
1. "infobox 16 preset이 좁아서 X 버튼 가려져" → PR #361 commit 6/7 (auto-expand)
2. "스플릿뷰랑 사이드바가 추가로 더 나오는 버그" → PR #361 commit 5 (panel toggle dedup)
3. "ADDITIONAL INFO 토글이 작동을 안 함" → PR #361 commit 2 (pubsub fix)
4. "Genre 아래 새 field 추가하고 싶으면" + "핸드드래그 도입" → PR #361 commit 3+4
5. "preset fields 풍부화 + Note에서도 preset 사용 가능?" → PR #362
6. "유저가 만든 걸 재사용할 수 있게" → PR #363

### PR 요약

- **PR #361** — Infobox UX 종합 강화 (Preset 3-way / collapse pubsub / Add field inline / drag / panel cleanup / auto-expand / 가로 스크롤 + 38%)
- **PR #362** — Infobox preset 16종 풍부화 + Note cross-entity 활성화 (Note.infoboxPreset/HeaderColor 신규 필드)
- **PR #363** — UserInfoboxPreset 신규 (Save as preset, Phase 4, ~10 파일, persist v140)

### 영구 LOCKED 결정 (이번 세션, #64-#73)

#### Phase 1 + UX polish (PR #361)
- **#64. Preset switching = 3-way dialog** (Cancel / Preserve matching (N) / Replace all) — 사용자 데이터 보호 우선. 모든 entity preset 패턴 영구.
- **#65. localStorage-backed UI state + in-memory pubsub 병행** — 다중 hook instance가 같은 key 공유 시 sync 필수. `useInfoboxGroupCollapsed` reference.
- **#66. ephemeral `_id` 패턴 = list-style edit UI 표준** — TipTap NodeView 외 일반 list edit UI (drag/reorder)에 stable identity 필요시.
- **#67. Edit mode auto-expand 패턴** = "Gentle by default, powerful when needed" 적용 — 평소 narrow / 편집 시 자동 expand / Done 시 user layout 복원. SmartSidePanel state 인지 추가 expand (24/30/38%).

#### Cross-entity (PR #362)
- **#68. Infobox preset = cross-entity 자원** — Wiki Article + Note 둘 다 동일 preset 인프라. 향후 Book / Reference 자연 확장.
- **#69. updateNote / updateWikiArticle generic patch 정직** — entity별 별도 setter 시리즈 추가 X. Partial<Entity> 한 곳으로 통합. DRY.

#### Phase 4 (PR #363, UserInfoboxPreset)
- **#70. UserInfoboxPreset = WikiTemplate와 별도 시스템** (infobox-only 가벼움) — Wikipedia 패턴 정합 (`Template:Infobox person`이 별도 namespace).
- **#71. `(string & {})` widen 패턴** — TypeScript literal union을 string으로 widen 방지. builtin autocomplete 보존 + user id 확장.
- **#72. onPresetChange callback 3번째 인자 (`defaultHeaderColor?`)** — caller가 builtin + user preset 둘 다 색 자동 적용. Note와 Wiki 일관.
- **#73. Orphan reference graceful fallback** — user preset 삭제 후 사용 article의 `infoboxPreset` 그대로 유지. `getPresetDefinitionUnified`가 "custom" 반환. entries는 article 자체 저장이라 영향 0.

### 기술 학습 (영구, 2026-05-18 오후)

- **drag-and-drop stable id 패턴** (dnd-kit): handleChange 등이 새 object 생성 시 reference id 잃는 한계. `_id` ephemeral 필드를 useState 진입 시 부여 + persist 시 strip이 정직. WeakMap based id는 entry mutation 시 깨짐.
- **react-resizable-panels imperativeAPI** (`ImperativePanelGroupHandle`): `getLayout()` / `setLayout(sizes)` 둘 다 검증된 API. `setLayout` 호출 시 첫 mount skip 패턴 (`hasMountedRef`)으로 autoSave layout 우선 보존.
- **CSS `overflow-x: auto` + inner `min-width` 패턴**: 가로 스크롤 fallback. `overflow-x-auto overflow-y-hidden` 분리 가능.
- **TypeScript `(string & {})` widen hack**: builtin literal union을 string으로 widen 방지. autocomplete 보존 + 확장 자유.
- **Generic seed-based helper pattern**: `mergePresetWithExisting(presetId)` → `mergeSeedWithExisting(seed, existing)` 통합 generic 함수로 user preset도 처리. wrapper로 back-compat.
- **Panel toggle cluster 중복 회피**: view-header default toolbar가 `SidebarSimple` + `SplitViewButton` 자체 render. wiki-view actions에 수동 mount는 중복 — default toolbar 위임이 정직.
- **WikiInfobox callback signature 확장 시 caller back-compat**: TypeScript 함수 인자는 less args도 OK이라 기존 caller 자연 호환. 3-arg 인자는 optional 처리.
- **Cross-entity preset 확장 = 단일 component reuse**: WikiInfobox component (kind prop routing) + 동일 preset infra = 모든 entity 동일 UX. caller만 entity-specific.
- **`(string & {})` widen + `INFOBOX_PRESETS.find` 호환**: builtin enum lookup이 user id 들어와도 undefined 자연. `getPresetDefinitionUnified`가 fallback "custom" 반환으로 graceful.

### 환경 변경 (다음 머신 sync 필수)

- Main HEAD: `43fcd44` (PR #362 squash merged)
- 신규 file (PR #363 — open):
  - `lib/store/slices/wiki-infobox-presets.ts`
  - `components/editor/save-preset-dialog.tsx`
- 신규 type:
  - `UserInfoboxPreset` (id/label/hint?/defaultHeaderColor/defaultEntries/createdAt/updatedAt ISO)
  - `WikiInfoboxBuiltinPreset` (기존 literal union 재명명)
- Persist version: 139 → **140** (PR #363 머지 시 main 반영)
- `Note.infoboxPreset?` + `Note.infoboxHeaderColor?` 신규 optional 필드 (PR #362 merged)
- 영구 widen: `WikiInfoboxPreset = WikiInfoboxBuiltinPreset | (string & {})`
- 영구 callback signature 확장: `onPresetChange(preset, seed, defaultHeaderColor?)`
- 영구 결정 #64-#73 (총 10개 추가)

### 다음 (TODO.md P0)

🔴 **P0 #1**: PR #363 manual verify + squash merge (10단계 체크리스트)
🟡 **P0 #2**: PR-C 시작 — Hero Image + caption (PRD Phase 3, ~7 파일, v141)
🟣 **P0 #3** (선택): PR-E 후보 (Phase 5+, SectionTemplate / Hatnote / Ambox / 편집 히스토리)

---

## 🚀 2026-05-18 (오전) — **Wiki Delete soft delete + Wiki Template 신설 + Infobox preset 6 + dropdown fix** ⭐⭐⭐⭐

**범위**: 1 worktree (`kind-zhukovsky-1a4485`). 3 sequential PR + docs sync. 사용자 시그널 4건 응답.

### PR 요약
- **PR #357** — Wiki Delete = hard → soft delete (Note 2단 정합)
- **PR #358** — Wiki Template 신설 (NoteTemplate 정합 + Wiki 본질 확장, 5 신규 파일)
- **PR #359** — Infobox preset 6 신규 (나무위키 정합) + Preset dropdown 잘림 portal fix

### 핵심 결정 (영구 LOCKED, 2026-05-18 오전)

**#62. Wiki Delete = Note 정합 2단 패턴**: Trash 거쳐 soft delete (trashWikiArticle) → Trash 안에서 "Delete forever" hard delete. 모든 entity Delete 패턴 통일 영구 룰.

**#63. Floating menu (dropdown/popover) = portal + fixed + viewport bound check + 자동 flip**: ancestor `overflow-hidden` 영향 회피. PresetDropdown reference (createPortal + useLayoutEffect + triggerRef + viewport bound). 모든 entity dropdown에 동일 패턴 적용.

**WikiTemplate = NoteTemplate 1:1 mirror + Wiki 본질 확장**: `blocks[]` (TipTap contentJson 아닌 Wiki blocks 구조) + `infobox` + `infoboxPreset` + `defaultCategoryIds` + `defaultLabelId` + `defaultLayout` 등 추가 필드. `WikiArticle.templateId` reverse-lookup으로 "Used by N wiki articles" stats.

**Wiki Template apply 두 path 의도 분리**: 생성 picker (Wiki "+ Article") = article level 전체 (blocks+infobox+categoryIds+labelId+layout) / slash insert (P1 후속) = blocks만 inline (article 메타 안 건드림).

### 기술 학습 (영구, 2026-05-18 오전)

- **store hydration safety**: 신규 array state 추가 시 IDB serialize round-trip이 array를 object로 변형하는 case 보호 — `onRehydrateStorage`에서 `Array.isArray` check + SEED 강제 초기화 필수. migration만으로는 hot-reload IDB stale state 못 잡음. selector level fallback도 `Array.isArray ? : []` 패턴 권장.
- **사용자 IDB stale state**: dev hot-reload 또는 partial save로 array state가 empty object 가능. onRehydrateStorage가 array 강제 → 사용자 새 IDB 영향 없이 safe.
- **createPortal + fixed positioning은 ancestor overflow 영향 0**: dropdown의 `absolute` + `max-height` 처리해도 parent의 `overflow-hidden`이 우선이라 잘림. portal로 document.body에 mount하면 ancestor 무관.
- **build TypeScript 부채 분리 패턴**: `git stash` 후 main 상태에서 tsc 실행으로 사전 부채 분리. 내 변경 관련 에러만 fix하고 사전 부채는 별도 cleanup PR (현재 `insights-view.tsx:268 noteEvents` 잔재).
- **Wiki 본질 vs Note 본질 차이가 slash insert path 디자인 좌우**: Wiki article = blocks[] 구조 (sections + text + infobox), Note = contentJson (TipTap). Wiki slash insert는 article level apply가 자연. Note slash insert는 contentJson splice가 자연.
- **나무위키 정합 preset 확장 패턴**: typed field + group-header collapse + color token. 11 → 17. color 충돌 회피 위해 신규 tokens (cyan/lime/pink/brown). Tier 2-4 본격 고도화 시 base.

### Wiki Templates 신규 8 seed

Empty (default) + Wikipedia 정합 5 (Concept / Person / Place / Reference / Book Note) + Plot 본질 3 (Tutorial / Project Log).

### Infobox preset 11 → 17 (나무위키 신규)

기존 11: custom / person / character / place / organization / work-film / work-book / work-music / work-game / event / concept

신규 6: school (brown) / animal (lime) / software (cyan) / food (pink) / vehicle (slate) / sport-team (blue)

### 환경

- Store version: v137 → v138 (Wiki trashedAt) → v139 (wikiTemplates init + id-dedup append)
- 신규 파일 5개 (모두 PR #358 — Wiki Templates)
- 사용자 IDB stale wiki templates `{}` empty object case 보고 → onRehydrateStorage defense로 해결

### 다음 (TODO.md P0)

🔴 **P0 #1**: Wiki Template slash insert (PR #358 후속, ~3 파일)
🟡 **P0 #2**: 나무위키 Infobox Tier 2-4 본격 (PRD 분리 권장, 큰 작업)
🟡 **P0 #3**: Library Tags Detail panel (~5 파일, PR #331 Files Detail 패턴 정합)

---

## 🚀 2026-05-17 (밤) — **Books sidebar transition + Trash hardcoded grouping + Trash entity-native icon 3 fix** ⭐⭐⭐

**범위**: 1 worktree (`awesome-mcnulty-cac926`). 단일 sequential 3 PR. 사용자 시그널 4건 응답 (3건 fix + 1건 진단 결과 사용자 결정 대기).

**사용자 시그널 (그대로)**:
1. "북스 체크 시 우측 사이드바가 변경되는 화면전환이 제대로 안 이뤄지네. 하드코딩된 거 같다니까??"
2. "체크박스에 처음으로 체크를 하게 되면 자동으로 우측 사이드바가 열려야 되는 거 아니야? 노트의 경우엔 그러는데?"
3. "노 그룹핑 상태인데 왜 트래쉬에서 카인드별로 리스트업이 되고 있는 거야??"
4. "stub는 삭제하면 자동으로 완전 삭제가 되어버리는 건가??" — Wiki hard delete 진단 보고
5. "노트는 이 아이콘이 아닌데? 엔티티와 그 내부 아이콘들까지 고려해서 표시"

**변경 (3 PR)**:
- **PR #353**: `book-table` checkbox 체크 시 sidebar transition (notes-table:561 useEffect 패턴 정합)
- **PR #354**: Trash All view groupBy 설정 정합 — `'none'` → flat list / `'kind'` → 섹션 헤더 (하드코딩 해제)
- **PR #355**: Trash row EntityKindIcon → entity-native (Wiki=Stub/Article + Book=kind + Tag/Label=color dot)

### 핵심 결정 (영구 LOCKED, 2026-05-17 밤)

**59. Display panel 설정 = 모든 view 일관 적용**: Trash 같은 특수 view도 viewStateByContext context 통해 groupBy 받기. 하드코딩 금지.

**60. selection state → sidebar mirror useEffect 패턴 영구**: `selectedIds.size === 1` 시 setSidePanelContext + setSidePanelOpen. notes-table:561 reference. 모든 entity table (books / wiki / tags / labels)에 동일 적용.

**61. Trash row icon = entity-native 일관**: Wiki=Stub/Article (`isWikiStub()` 분기), Book=kind (`getBookKind()` 분기), Tag/Label=color dot, Note=status (`StatusShapeIcon`). 영구 룰 25 확장.

### 기술 학습 (영구)

- **하드코딩 진단 패턴**: 사용자 "왜 안 됨" 보고 시 코드의 hardcoded branch (sections.map / case 명시) 직접 찾기. 추측 X.
- **EntityKindIcon helper에 entity-specific 정보**: Wiki는 isStub, Book은 kind, Tag/Label은 color. helper props에 추가 + 호출 site에서 build-time derive (데이터 모델 변경 없음).
- **selection ↔ sidebar mirror = 모든 entity table 표준 패턴**: 누락 시 "하드코딩 같다" 사용자 시그널 트리거. 영구 룰.

### Wiki hard delete 진단 결과 (사용자 결정 대기)

`deleteWikiArticle()` (wiki-articles.ts:156) = **hard delete** 직행. Wiki Board ContextMenu / Wiki Detail "Delete" 버튼이 모두 이걸 호출 → Trash 거치지 않음.

**사용자 결정**: Wiki Delete를 Note 패턴 (Trash 거쳐 soft delete → Trash 안에서 hard) 변경. 별도 PR 진행 (다음 세션 P0).

### 환경

- Branch: `awesome-mcnulty-cac926` (계속 사용)
- Store version: v137 그대로 (UI/UX fix만)
- 신규 파일 없음
- Preview verify:
  - books table checkbox: book-3 → book-4 transition ✅
  - Trash groupBy='none' → flat / 'kind' → 섹션 ✅
  - Wiki SVG path ≠ Note SVG path (entity-native icon 분기 작동) ✅

### 다음 (TODO.md P0)

🔴 **P0**: Wiki Delete = hard → soft delete 패턴 변경 (~5 파일, 사용자 결정 받음)
🔴 **P0 (이전)**: Wiki Template 신설 (~20 파일)
🟡 **P1**: Book Template 도입 brainstorming
🟡 **P1**: Categories 본격 분리 (길 B)
🟣 **P2**: `components/note-detail-panel.tsx` dead code 정리

---

## 🚀 2026-05-17 (저녁) — **Label/Category cross-entity 전면 확장 + Library hub 재배치 + v137 migration** ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`awesome-mcnulty-cac926`). 단일 PR. 사용자 5건 시그널 + brainstorming 합의 응답 — Label/Category를 모든 entity에 cross-entity 확장 + Library hub로 사이드바 재배치 + Memo 자동 부여 폐기 + Library Overview UI 6 stat card.

**사용자 시그널 (그대로)**:
1. 사용자 처음 mental model: "라벨 = 가장 큰 분류, 카테고리 = 라벨 내 세부, 태그 = 자유 키워드" (계층)
2. **계층 의존 폐기** 결정: "라벨도, 카테고리도, 태그도 붙이든 말든 전부 유저 마음대로. Category 자유 (Label과 독립)" — orthogonal 독립
3. "사이드바에서 태그 추가의 경우 기존에 있는 태그만 추가 가능 — inline Create 가능하게"
4. "노트의 경우 따로 라벨 채택 안 하면 자동으로 memo 분류 — 이 방식 없애야"
5. "라이브러리로 배치해야 형평성이 맞을 거 같은데" — cross-entity = Library hub
6. "왜 카테고리스랑 라벨스는 화면에 안 나옴??" — Library Overview UI stat card 누락 발견

**변경 파일 (12 + 1 신규 + 1 신규 page)**:
- `lib/types.ts` — WikiArticle.labelId / Note.categoryIds / Book.labelId+categoryIds+tags 신규
- `lib/store/slices/notes.ts` — `createNote` Memo 자동 부여 폐기 (line 11-17)
- `lib/store/migrate.ts` — v137 block (default 추가, 사용자 데이터 보존)
- `lib/store/index.ts` — persist version 137
- `lib/colors.ts` — KNOWLEDGE_INDEX_COLORS에 labels (rose) + categories (emerald) 추가
- `lib/table-route.ts` — VIEW_ROUTES에 `/library/labels` 추가
- `components/category-picker.tsx` (신규) — entity-agnostic CategoryPicker (TagPicker 패턴)
- `components/side-panel/side-panel-context.tsx` — Note Detail에 CategoryPicker
- `components/side-panel/wiki-article-detail-panel.tsx` — Label section 신규 + Categories read-only → CategoryPicker
- `components/side-panel/book-detail-panel.tsx` — Label + Categories + Tags 3 row 신규
- `components/linear-sidebar.tsx` — Labels/Categories를 Library로 재배치 (Notes/Wiki 사이드바에서 제거)
- `components/views/library-view.tsx` — LibraryOverview 6 stat card grid (Labels + Categories 추가)
- `app/(app)/layout.tsx` — `/library/labels` 분기 추가 (LabelsView mount)
- `app/(app)/library/labels/page.tsx` (신규) — 새 route page
- `components/note-detail-panel.tsx` — CategoryPicker 추가 (단 dead code, 별도 cleanup 후보)

### 핵심 결정 (영구 LOCKED, 2026-05-17 저녁)

**53. Label/Category/Tag = orthogonal 독립 + 자유 선택** — 계층 의존 X. 각 entity에 자유 부여 가능 (없어도 OK). 사용자 명시: "라벨도, 카테고리도, 태그도 붙이든 말든 전부 유저 마음대로".

**54. WikiCategory 풀 공유 (cross-entity)** — Note/Wiki/Book 모두 같은 카테고리 시스템. 별도 entity별 풀 X. Smart Book의 `kind: "category"` source도 cross-entity 자연 확장.

**55. Wiki Category DAG hierarchy 유지** — N-level 깊이 그대로. Note/Book 사용자는 1-level만 써도 자유. wiki 본질 (학문 분류) 보존.

**56. Memo 자동 부여 폐기 영구** — `createNote` 시 labelId 미지정 → null. Label chip은 labelId 있을 때만 표시. 모든 entity 동일 패턴.

**57. cross-entity 분류 메커니즘 = Library hub** — Label/Category/Tag (모두 cross-entity)는 Library 사이드바에 모임. Notes/Wiki entity 사이드바에서 제거. Templates/Folders 같은 entity-specific만 유지.

**58. CategoryPicker entity-agnostic** — `components/category-picker.tsx`. Note/Wiki/Book 모두 같은 컴포넌트 + 다른 callback wire-up. TagPicker / LabelPicker / FolderPicker 패턴 정합.

### 기술 학습 (영구)

- **사용자 mental model이 코드 디자인보다 우선**: 사용자가 처음 떠올린 "Label > Category > Tag 계층"을 reframe해 "orthogonal 독립"으로 정착. mental model 명확화 → 코드 단순화.
- **CategoryPicker는 TagPicker 패턴 그대로 재활용**: `flat list + search input + inline Create + exactMatch 체크`. wikiCategories DAG는 데이터 모델 그대로지만 picker는 flat 검색으로 충분.
- **dead code 잠재 (note-detail-panel.tsx)**: 큰 변경 후 실제 mount 컴포넌트 확인 의무. Grep `<ComponentName` 또는 selector verify로 dead code 발견.
- **stat card 누락 → 시각 확인이 가장 빠름**: 사용자가 스크린샷 보고 "왜 안 나옴" 보고. 사이드바 + Overview UI는 같이 보강하는 패턴.
- **derive vs mutate 결정의 본질**: Book.tags 신규 필드 (mutate) — 단순 + manual 부여 가능. derive만 했으면 manual UI 불가. 이번엔 둘 다 (Book.tags 신규 + Book.items derive 합집합).

### 환경

- Branch: `awesome-mcnulty-cac926` (계속 사용)
- Store version: **v136 → v137** (cross-entity Label/Category default 추가)
- Persist version: 137
- 신규 파일: `components/category-picker.tsx` + `app/(app)/library/labels/page.tsx`
- 데이터 모델 변경: 4 신규 optional 필드 (Wiki.labelId / Note.categoryIds / Book.labelId+categoryIds+tags)
- 색 토큰 추가: KNOWLEDGE_INDEX_COLORS.labels (rose) + .categories (emerald)

### 알려진 / Watch Out

- **note-detail-panel.tsx dead code**: 어디서도 import 안 됨. 별도 cleanup PR.
- **사용자 사전 노트의 Memo label 잔존**: 기존 노트는 그대로 Memo label 부여 상태. 일괄 제거 원하면 별도 migration PR.
- **WikiCategory cross-entity 의미 변화**: "Computer Science" 카테고리가 wiki 학문분류 → 노트/책에도 부여 가능. 사용자 의미 충돌 시 보고 받기.
- **Categories 길 A (단순)**: 사이드바 entry만 Library, click 시 wiki page로 navigate. 본격 분리 (`/library/categories` + CategoriesView)는 별도 PR.

### 다음 (TODO.md P0)

🔴 **P0**: Wiki Template 신설 (사용자 명시, 큰 작업 ~20 파일)
- 새 type / slice / seed / UI (Templates entry + Picker + Detail panel)
- 다음 세션 핵심 작업
🟡 **P1**: Book Template 도입 가능성 논의 (사용자 "확신 안 듦" — brainstorming 필요)
🟡 **P1**: Categories 본격 분리 (길 B — `/library/categories` 신규 route)
🟣 **P2**: note-detail-panel.tsx dead code 제거 cleanup
🟣 **P2**: 사용자 사전 노트 Memo label 일괄 제거 (사용자 결정 시)

---

## 🚀 2026-05-17 — **Tags/Labels sub-page entity-uniformity 1차 + cross-entity derive + seeds v135/v136 + FunnelSimple fix** ⭐⭐⭐⭐

**범위**: 1 worktree (`awesome-mcnulty-cac926`). 단일 PR. 사용자 보고 5건 응답 — 사이드바 mount + checkbox + dblclick navigate + Tag cross-entity + inline Create + 글로벌 find-replace 사고 fix.

**사용자 시그널** (그대로 인용):
1. 라벨 sub-page 사이드바 미구현 + 체크박스 + 더블클릭 navigate
2. 더블클릭 → 노트 editor 실제 진입 안 됨
3. Tag sub-page는 cross-entity (노트/위키/북) 분리 표시
4. "북에 소속된 노트의 태그가 자동으로 흡수" — derive 직관
5. 사이드바 "Add tag"가 기존 tag만 추가 가능, inline Create 없음
6. Tags/Labels sub-page Display/Filter UI 기존 Plot 정합과 다름 (toolbar에 "FunnelSimple" 텍스트 잔재)

**변경 파일 (10)**:
- `components/views/entity-note-list-row.tsx` (신규) — DRY row helper. `<div role="button">` + hover checkbox + single click toggle + dblclick navigate
- `components/views/labels-view.tsx` — sub-page useEffect (sidePanelContext sync) + selectedNoteIds state + `navigateToNote` (4단 세트) + Selection bar + button row → EntityNoteListRow
- `components/views/tags-view.tsx` — Labels와 동일 패턴 + 3 cross-entity 섹션 (Notes/Wiki/Books) + 빈 섹션 hide
- `components/side-panel/wiki-article-detail-panel.tsx` — Tags read-only chip → `<TagPicker>` (inline Create 자동)
- `lib/store/seeds.ts` — wiki-8~17 tags 분산 적용 (10개)
- `lib/store/migrate.ts` — v135 (wiki tag fill) + v136 (notes backfill) block
- `lib/store/index.ts` — persist version 136
- `components/filter-bar.tsx` — FunnelSimple 텍스트 잔재 8곳 fix

### 핵심 결정 (영구 LOCKED, 2026-05-17)

**46. Entity sub-page row UX 영구 룰** — `EntityNoteListRow` helper. hover checkbox + single click toggle + double click navigate. Notes/Wiki table row 패턴 정합 (영구 룰 21 entity-uniformity 확장). Tags/Labels/Stickers/Categories sub-page 모두 동일.

**47. Sub-page → 노트 editor 진입 패턴** — 4단 세트:
1. `setSelectedXxxId(null)` (sub-page exit)
2. `setActiveRoute("/notes")` (store-level view switch)
3. `openNote(id)` (selectedNoteId + sidePanelContext + tab sync)
4. `router.push("/notes")` (URL 변경)

`openNote(id)` 단독으로는 sub-page 분기에 가려 editor 안 보임 (Plot `isEditingInTableView = isTableView && !!selectedNoteId` 조건 정합).

**48. Tag sub-page cross-entity = derive (B2)** — Book entity에 tags 필드 X. 대신 runtime 합집합:
- `Book.items` 안 노트/위키 중 selectedTagId 가진 게 있거나
- `Book.smartSources`에 `{kind:"tag", refId:selectedTagId}` 있으면 표시

데이터 모델 변경 0, sync 버그 0, 사용자 의도 충족 ("북에 소속 노트의 태그가 자동 흡수").

**49. Wiki tag 부여 = 명시적만** — Note는 본문 #해시태그 자동 sync (`syncHashtagsToTags`). Wiki는 자동 sync 미적용 (P1 후속 — wiki text block editor에 wire-up 가능). 시드 + UI picker로만 부여.

**50. Seed 증가 동반 migration 영구 룰** — 시드 코드 변경 시 자동 backfill migration 동반. id-dedup append (v130/v134/v136) 또는 빈 필드만 fill (v135) — 명시적 비움 데이터 보존. 다음 세대도 동일 패턴.

**51. 글로벌 find-replace 사고 grep 의무** — PR 머지 전 placeholder/string literal에 icon 이름이 박혀있는지 검수. MagnifyingGlass (2026-05-14) + FunnelSimple (2026-05-17) 두 번째 사고. **영구 PR review checkpoint** — grep `"<IconName>\s+\w+"` 또는 `placeholder="<IconName>"`.

**52. TagPicker entity-agnostic 재활용** — `components/note-fields.tsx:365` TagPicker 컴포넌트. prop `noteId`는 string entityId 의미. Note/Wiki/Book 모두 같은 컴포넌트 + 다른 callback wire-up.

### 기술 학습 (영구)

- **derive 패턴 = data sync 버그 0**: Book.tags 신규 필드 (B1 mutate) 대신 runtime 합집합. 노트 tag 바뀔 때마다 모든 책 tags 재계산 X — Tag sub-page query 시점만.
- **v134→v135 backfill 패턴**: wiki tags가 v134 backfill로 빈 채 들어왔던 경우, v135에서 seed.tags가 비어있지 않을 때만 update. 사용자 명시 비움 보호. idempotent.
- **글로벌 find-replace 영향 범위**: VS Code Replace All은 import / JSX 사용처 / string literal 모두 변환 — 의도 안 한 placeholder 깨짐.
- **setActiveRoute + router.push 둘 다 필요**: 전자는 store-level state (view switch), 후자는 URL 변경. Plot client-side routing은 둘 다 sync.
- **wiki-article-detail-panel onCreateTag closure stale risk**: article prop closure capture. createTag 후 즉시 updateWikiArticle 호출 — preview verify 시 한 번 article.tags가 빈 배열로 보임. P2 후속 — 콜백 안 `usePlotStore.getState()` 직접 read로 변경.

### 환경

- Branch: `awesome-mcnulty-cac926` (계속 사용 — squash merge 후 같은 worktree에서 다음 PR)
- Store version: **v134 → v135 → v136** (wiki tag fill + notes backfill)
- Persist version: 136
- 신규 파일: `components/views/entity-note-list-row.tsx`
- 데이터 모델 변경 없음 (derive only)
- Preview verify: Tag #Knowledge Management → NOTES 5 / WIKI ARTICLES 4 / BOOKS 4 ✅

### 알려진 회귀 / Watch Out

- **wiki-1~13 trashed:true 잔존**: 사용자 본인 환경 사전 데이터. v134/v135/v136 모두 trashed flag 안 건드림. fresh user는 정상.
- **Tags/Labels sub-page Display 부실** (사용자 명시 시그널): view-engine 통합 본격 PR 필수 (다음 세션 P0).
- **wiki-article-detail-panel onCreateTag closure stale**: preview에서 한 번 발생, 사용자 환경에서는 안 발생 가능성. P2 follow-up.

### 다음 (TODO.md P0)
🔴 **P0**: Tags/Labels sub-page를 view-engine 통합 (ViewHeader + 표준 DisplayPanel + List/Grid + 풍부한 Grouping/Display Properties + FilterPanel). 작업량 ~10 파일.
🟡 **P1**: Wiki 본문 #해시태그 자동 sync (Note editor 패턴)
🟡 **P1**: Wiki blocks 임베드 노트의 tag derive (reference-aware sub-page)
🟡 **P1**: Note의 wikilink가 가리키는 entity tag derive
🟡 **P1**: Book Detail manual TagPicker (사용자 결정 필요)
🟣 **P2**: wiki-article-detail-panel onCreateTag closure stale fix (usePlotStore.getState() 직접 read)

---

## 🚀 2026-05-16 — **Wiki/Books board 우클릭 ContextMenu + Workbench inline Create + v134 seed backfill** ⭐⭐⭐⭐

**범위**: 1 worktree (`awesome-mcnulty-cac926`). 단일 PR. 사용자 보고 2건 + seed 보강 1건 응답 — Wiki/Books board UX entity-uniformity 마무리 + 시드 자동 보충.

**사용자 시그널 (그대로)**:
1. "위키 보드 디스플레이 모드에서 Add to category할 때 기존에 없었던 카테고리를 생성할 수 있는 기능이 있어야 해. (기존 코드 재활용.) Add to Tags도 마찬가지."
2. "보드 디스플레이 모드일 때 마우스 우클릭이 안 되네? 노트는 돼. 위키랑 북도 되어야 해."
3. "야 시드데이터를 다시 만들어줘. 위키 시드데이터가 지금 0이라서 테스트가 안 돼"

**변경 파일 (12)**:
- `components/books/book-context-menu-items.tsx` (신규) — `BookContextMenuItems` helper. Notes 패턴 정합.
- `components/books/book-grid-card.tsx` — helper 사용으로 단순화 (~51 line 제거)
- `components/books/books-board.tsx` — `BookBoardCard` ContextMenu wrap + callbacks chain (BoardCard / BoardColumn / BoardProps)
- `components/views/books-view.tsx:272` — BooksBoard에 4 callbacks 전달 (`onRename / onDelete / onRestore / onPermanentDelete`)
- `components/views/wiki-board.tsx` — Card visual을 `<ContextMenu>` wrap. `WikiArticleMenuItems` import (이미 wiki-list export). CardProps + WikiBoardProps에 `onMergeArticle / onSplitArticle / onDeleteArticle / onShowConnectedArticle` 추가. board callback (`onMerge(sourceId)`)는 menu callback (`() => onMerge(article.id)`)으로 wrap.
- `components/views/wiki-view.tsx:1400` — WikiBoard에 `onDeleteArticle / onShowConnectedArticle` 전달 (WikiList 패턴 정합)
- `components/wiki-board-workbench.tsx` — CategoryAddPopover / TagsAddPopover 재작성. `query` state + filtered list (case-insensitive includes) + `exactMatch` 체크 + `showCreate` 조건부 inline button. `createWikiCategory` / `createTag` 호출 → 새 id 자동 picked.
- `lib/store/slices/tags.ts:11-18` — `createTag` `void → string` 시그니처 변경 (id 반환)
- `lib/store/types.ts:287` — `createTag` 타입 변경
- `lib/store/migrate.ts:2072-2104` — v134 backfill block. `SEED_WIKI_ARTICLES + SEED_WIKI_CATEGORIES` 누락 시드만 push (id-dedup append, idempotent). v130 backfill 패턴 정합.
- `lib/store/index.ts:257` — persist version `133 → 134`
- `CLAUDE.md` — Stack 표기 `22-slice, v134`

### 핵심 결정 (영구 LOCKED, 2026-05-16)

**42. ContextMenu helper 추출 패턴 영구** — entity별 `<entity>-context-menu-items.tsx` helper 파일 (Notes / Books 양쪽). list/board/gallery 3 surface에서 재활용. props는 dumb (모든 store mutation/toast는 callback). 영구 룰 21 entity-uniformity 확장.

**43. createTag id 반환 시그니처** — `createTag(name, color?) => string`. 모든 entity create action은 id 반환이 호출자 편의 우선 (createWikiCategory 패턴 정합). slice + types.ts 동시 변경 의무.

**44. Popover inline Create option = 검색 input + cmdk 패턴** — Plot의 Tag/Category picker에 `query` state + filtered list + exactMatch 체크 + `showCreate` 조건부 inline button. native `prompt()` 회피 (영구 룰 i18n + Linear polish). placeholder "Find or create category…/tag…".

**45. Seed backfill migration 패턴 영구** — 시드 증가 (예: 7 → 17 articles) 시 자동 backfill migration 동반 의무. id-dedup append (사용자 추가 데이터 보존 + 누락 시드만 push). v130 / v134가 같은 패턴.

### 기술 학습 (영구)

- **Radix ContextMenuTrigger asChild + dnd-kit attributes/listeners 조합 안전**: outer div (drag) + inner visual (ContextMenuTrigger). left-click = drag, right-click = contextmenu. 별 set이라 충돌 X.
- **DragOverlay는 ContextMenu wrap 제외**: `if (isDragOverlay) return visual` 분기 유지.
- **WikiArticleMenuItems prop signature mismatch (id 안 받음)**: board에서 `(article.id)` wrap 필요. board callback (`onMerge(sourceId)`)와 menu callback (`onMerge()`) 시그니처 다름.
- **회귀 보고 verify 패턴**: 코드 verified + 같은 IDB로 fresh preview에서 작동 재현 시 = HMR/multi-port stale 추정. 코드 fix 안 함, 사용자에게 환경 정리 안내. "재현 안 되는 회귀"는 진단 후 close 가능.
- **시드 증가 동반 마이그레이션 의무**: 시드 코드만 늘리면 fresh user만 받음. 기존 사용자는 새 migration block 필요 (idempotent id-dedup).

### 알려진 회귀

**P0-1 Tags / Labels 사이드바 진단 결과**: fresh preview (port 3002, 본 worktree)에서 두 surface 모두 정상 작동 verified.
- `/library/tags #brandnewtag` 클릭 → sidePanelContext `{type:"tag", id}` set ✅ → TagDetailPanel render ✅
- `/labels Diary` 클릭 → sidePanelContext `{type:"label", id:"label-4"}` set ✅ → LabelDetailPanel render ✅
- root cause 추정: (a) HMR stale 또는 (d) Multi-worktree port 충돌
- **코드 fix 불필요**. 사용자 본인 환경 hard refresh + 다른 worktree dev 정리 후 재확인 대기.

### 환경

- Branch: `claude/awesome-mcnulty-cac926`
- Store version: **v133 → v134** (wiki seed backfill)
- Persist version: 134
- 신규 파일: `components/books/book-context-menu-items.tsx`
- 데이터 모델 변경: `createTag` `void → string`

### 다음 (TODO.md P0)
🔴 **P0-2**: 4 신규 + 12 기존 PR 통합 manual verify
🔴 **P0-1 재확인**: Tags/Labels 사이드바 사용자 본인 환경에서
🟡 **P1**: wiki-floating-action-bar.tsx에도 Workbench와 같은 검색+Create UX 적용 (list mode 일관성)
🟡 **P1**: Calendar / Ontology graph 사이드바 의도 명확화
🟡 **P1**: Granular events / Label events / EVENT_HEX palette / EDGES section

---

## 🚀 2026-05-15 (저녁) — **Wiki entity-uniformity 완성 + Category sidebar 흡수 + 다양한 polish** ⭐⭐⭐⭐⭐

**범위**: 단일 worktree (`xenodochial-wing-654662`). 큰 단일 PR — 영구 룰 21 entity-uniformity 본질 진전 (Wiki Articles board = Notes parity + Wiki Categories sidebar 흡수 + Books board default kind + 다양한 polish).

**변경 파일 (~20+)**:
- `lib/store/types.ts` (SidePanelContext + wiki-category)
- `lib/store/slices/wiki-categories.ts` (CATEGORY_COLOR_NAMES + getCategoryColorName)
- `lib/store/seeds.ts` (Wiki articles 7 → 17 + tier 분포 10/4/3 + category spread 10)
- `lib/view-engine/types.ts` (GroupBy: firstLetter / createdAt / wikiStatus 추가)
- `lib/view-engine/group.ts` (groupByFirstLetter / groupByCreatedAt helper)
- `lib/view-engine/defaults.ts` (wiki-category default groupBy "family")
- `lib/view-engine/view-configs.tsx` (DisplayProperty boardOnly flag, DisplayConfig supportsSubGrouping/allowFamilyOnBoard, WIKI_CATEGORY_VIEW_CONFIG/WIKI_VIEW_CONFIG/BOOKS_VIEW_CONFIG/NOTES_VIEW_CONFIG 확장, boardDefaultGroupBy "wikiStatus"/"kind" 추가)
- `lib/view-engine/wiki-list-pipeline.ts` (case "wikiStatus")
- `components/display-panel.tsx` (boardOnly chip 자동 숨김, supportsSubGrouping UI hide, allowFamilyOnBoard board 허용)
- `components/notes-table.tsx` (showAlphaIndex 로직 → groupBy firstLetter + 인라인 toggle 제거)
- `components/views/wiki-view.tsx` (articleCount 음수 fix + WikiBoard onMerge/onMultiMerge/onSplit + onClearSelection/onSelectAll + onSelect multi:true board 누적 + floating bar board mode 숨김)
- `components/views/wiki-board.tsx` (WikiBoardWorkbench wire-up + Card hover checkbox + onClick single-click select + onDoubleClick navigate)
- `components/views/wiki-category-page.tsx` (layout fix list flex-1 + editor w-420 / handleBackgroundClick e.target check / Plot DropdownMenu + Color picker / 새 grouping/sort/filter + boardColumns valid whitelist)
- `components/side-panel/category-detail-panel.tsx` (신규 — Color picker + Properties + Parent + Subcategories preview + Articles preview)
- `components/side-panel/side-panel-detail.tsx` (wiki-category dispatch)
- `components/side-panel/side-panel-connections.tsx` (CategoryConnections + 분기)
- `components/side-panel/side-panel-activity.tsx` (wiki-category SoloHistory kind:"category")
- `components/side-panel/side-panel-bookmarks.tsx` (wiki-category EntityAnchorPlaceholder)
- `components/wiki-board-workbench.tsx` (신규 — Phase 1+2 Overview/Selection/Pin/Move folder/Add to category/Add tags/Split/Merge/Trash + CategoryAddPopover + TagsAddPopover)

### 핵심 결정 (영구 LOCKED, 2026-05-15 저녁)

**31. Wiki Categories sidebar 흡수** — mini panel content를 4탭 사이드바로 흡수 (Detail/Connections/Activity/Bookmarks). Tag/Label 패턴 mirror. 영구 룰 21 정합.

**32. Wiki Articles board = Notes board parity** — single click select / hover checkbox / multi-select 누적 (modifier 무관) / WikiBoardWorkbench (Pin/Move folder/Add to category/Add tags/Split/Merge/Trash) / floating bar board mode 숨김. 영구 룰 21 정합.

**33. Wiki status grouping = wikiStatus (Stub / Article 2 column)** — Notes Stone/Brick/Block 패턴 mirror. isWikiStub heuristic 기반 (drag 변경 무의미, read-only column). board default.

**34. Index = grouping option (showAlphaIndex toggle 폐기)** — Notes/Wiki/Templates/Labels 모두 groupingOptions에 firstLetter 추가. Plot 일관 UX. legacy toggle 자동 호환.

**35. boardOnly chip pattern** — list view에 column 없는 properties (Notes Tags/Priority/Label) 는 list mode에서 chip 자동 숨김. board mode에서만 표시.

**36. boardDefaultGroupBy entity-native enum** — Notes: status, Wiki: wikiStatus, Books: kind. 모든 entity board 첫 진입 시 3 column 균형 보장 (Wiki는 2 column).

**37. Wiki 시드 17 articles + tier 분포 10/4/3** — board column 다양성 보장 (fresh user). category spread 10 카테고리 (Computer Science / Algorithms / Data Structures / Productivity / Epistemology 포함).

**38. Wiki Category dropdown = Plot DropdownMenu** — native `<select>` 폐기. chevron + FolderSimple + category color + 활성 bg-accent/10. 영구 룰 17 정합.

**39. Wiki Category color picker in sidebar** — Detail panel Color row click → Popover ColorPickerGrid (Tag/Label과 차별화된 sidebar inline edit). getCategoryColorName(hex) helper (10 palette → 친근 이름).

**40. Color grouping 폐기** (의미 부재 — 자동 cyclic 할당) — Categories grouping에서 제거. filter/properties color는 유지 (사용자 manual).

**41. articleCount invariant** — `wikiNotes` (trashed-filtered)에서 stub/article 계산. 음수 차단.

---

## 🚀 2026-05-15 — **12 PR 머지** + Activity Unification PRD 완료 + Library entity-uniformity 100% ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`keen-bassi-afd1b6`). 단일 day 12 PR 누적 — Library entity-uniformity 5 entity 완성 + Activity Unification PRD 4 단계 + Library Connections 차트화 + Ontology Legend 위치 변경.

**PR 목록 (12)**:
- **#334** Library Tags Detail panel (Tag.createdAt 없음 → Dates 생략)
- **#335** Library Stickers Detail panel (cascade #334, createdAt + members 7 kinds)
- **#336** Wiki blocks anchor extractor (`extractAnchorsFromWikiBlocks` + WikiLocalAnchors)
- **#337** Ontology Legend redesign (Option A+B, 3 그룹 + Plot icon system)
- **#338** Header breadcrumb + 사이드바 토글 (ViewHeader titleNode prop + showDetailPanel default true)
- **#339** Library 4탭 entity-aware 분기 (placeholder — sidebar Note Detail 회귀 fix)
- **#340** PR 5a Activity Foundation (NoteEvent → EntityEvent v133 migration + backward compat)
- **#341** PR 5b Activity Wire-up Wiki/Template/Book (CRUD events)
- **#342** PR 5c Activity Wire-up Tag/Sticker/File/Reference (CRUD + membership events)
- **#343** PR 5d Activity UI 활성화 (EVENT_CONFIG 17 신규 + ActivityTimeline 모든 entity)
- **#344** Library Connections 차트화 (placeholder → TagConnections/StickerConnections/FileConnections/ReferenceConnections)
- **#345** Labels Detail panel + Ontology Legend 위치 변경 (좌하단)

### 핵심 결정 (영구 LOCKED, 2026-05-15)

**21. Library entity-uniformity 100% 완성** — 5 entity (References / Files / Tags / Stickers / Labels) 모두 우측 사이드바 4탭 entity-aware. row name 클릭 → drill-down + side panel 동시 open. checkbox는 selection only.

**22. Activity entity-agnostic 데이터 모델 `EntityEvent`** (Store v133):
- `{ id, entity: EntityRef, type: EntityEventType, at: ⭐ required ISO, meta? }`
- `at` 필드 ⭐ required (사용자 요구) — Time grouping + recency sort + 자체 createdAt 없는 entity (Tag/Label)의 유일 timestamp source
- Migration v132 → v133: NoteEvent { noteId } → EntityEvent { entity: { kind: "note", id: noteId } }. Idempotent, 데이터 손실 X.
- Backward compat: `createAppendEvent(string | EntityRef)`, `getEventsForNote = getEventsForEntity({ kind: "note", id })` wrapper, ActivityTimeline `noteId | entity` 둘 다 지원

**23. EntityKind 10 kinds** (확장) — note / wiki / tag / label / category / file / reference / template / book / sticker. Sticker.members[] backward compat (template/book 추가 가능).

**24. Comments wire-up은 Note/Wiki만** (영구) — Template/Book/Library는 collaboration 단위 X. SoloHistory wrapper로 분리.

**25. row 클릭 패턴 영구 룰**:
- **row name 텍스트** 클릭 → drill-down + 사이드바 detail 자동 open
- **checkbox** 클릭 → selection only
- 5 Library entity 모두 동일 패턴

**26. Ontology Legend 좌하단** (영구) — 미니맵 (우상단) 가림 회피.

**27. EVENT_CONFIG graceful fallback** — unknown type은 ActivityTimeline에서 `if (!config) return null` 스킵.

**28. PRD 점진 분할 패턴** — 큰 작업 (Activity Unification)을 4 PR로 (Foundation / Wire-up Wiki+Template+Book / Wire-up Library / UI activation). review 명확 + manual verify 단계별 + cascade conflict 회피.

### 기술 학습 (영구)

- **NoteEvent → EntityEvent backward compat 패턴**: `createAppendEvent` overload `string | EntityRef`. 호출 site 안 변경 + 새 시스템 작동.
- **`getEventsForNote` deprecated wrapper**: `getEventsForEntity({ kind: "note", id })`. 점진 마이그레이션.
- **`extractAnchorsFromWikiBlocks` 재귀 패턴**: section block.title + text block contentJson (재귀 `extractAnchorsFromContentJson`) → AnchorItem[].
- **`ViewHeader` titleNode + auto store wire-up**: `titleNode?: ReactNode` (있으면 default 타이틀 대체) + `showDetailPanel ?? true` (사이드바 토글 모든 entity 자동).
- **EntityEvent 마이그레이션 idempotent 패턴**: `state.noteEvents` 있으면 변환, 없으면 fresh state. 재실행 안전.

### 알려진 회귀 (Watch Out 다음 세션)

**🔴 Tags / Labels 사이드바 작동 안 함** (사용자 보고 2026-05-15):
- 코드 verified 정상 (tags-view line 820-823, labels-view 신규 onClick)
- 사용자 dev:3002 hard refresh + IDB 마이그레이션 후에도 같은 시그널
- 진단 후보: HMR stale (60%) / 코드 회귀 어딘가 (30%) / IDB v133 마이그레이션 실패 (10%)
- 다른 머신 fresh dev로 재현 진단 필요 — fresh에서도 안 되면 회귀 fix
- 후보 grep: `setSidePanelContext\(null\)` 또는 비슷한 reset useEffect

### 환경
- Branch: `claude/labels-detail-tags-fix-legend-position` (PR #345 base)
- Store version: **v132 → v133** (entityEvents migration)
- 신규 파일: tag-detail-panel / sticker-detail-panel / label-detail-panel / library-breadcrumb / book-breadcrumb / ontology-legend / activity-unification-prd
- 데이터 모델: EntityEvent / EntityEventType / EntityKind 확장 / SidePanelContext 5 entity / SidePanelEntityResult 10 entity

### 다음 (TODO.md P0)
🔴 **P0-1**: Tags / Labels 사이드바 회귀 진단 (다른 머신 fresh dev)
🔴 **P0-2**: 12 PR 누적 통합 manual verify
🟡 **P1**: Calendar / Ontology graph 사이드바 의도 명확화 (사용자 결정)
🟡 **P1**: Granular wiki/book events wire-up / Label entity events (PR 5e)

---

## 🚀 2026-05-14 (저녁) — PR #333 폴리시 7 commits (Linear-faithful sidebar + Ontology breadcrumb + search typo) ⭐⭐⭐⭐

**범위**: 1 worktree (`claude/relaxed-hodgkin-5a2905`). 사용자 시그널 "Linear 정합 + 일관성 무조건 신경써" — Notes 정확 패턴 mirror 4차 iter.

**PR**: **#333** (OPEN, manual verify 대기 후 머지)

**7 commits** (한 흐름):
- `3864651` polish(sidebar): typography + width (10.5→12px, weight 600→500, uppercase 제거, 220→240px)
- `2bd44aa` feat(ontology): header breadcrumb (`ViewHeader.subtitle?: ReactNode` prop)
- `62d2329` fix(ontology): subtitle → DropdownMenu trigger + CaretDown ⌄ (1차 사용자 시그널)
- `64457ce` fix(ontology): CaretDown 제거 (2차)
- `dde4122` fix(ontology): chevron `>` **자체**가 dropdown trigger (3차, Notes `NotePickerChevron` 정확 mirror)
- `db7ff2c` feat(ontology): dropdown item 아이콘 + 활성 bg/text (4차)
- `c9824cc` fix(search): `MagnifyingGlass` placeholder typo 5곳 → `Search`

### 핵심 결정 (영구 LOCKED, 2026-05-14 저녁)

**15. 사이드바 토큰 정합 룰** (`.a-sb-section__head` / `.a-sb-section__hint`):
- font-size 12px (Plot 토큰 "보조 12px") / weight 500 / letter-spacing 0 / text-transform none
- hint font-size 11px (Plot 토큰 "배지" 11px)
- Linear 정합

**16. 사이드바 너비 240px** (Linear 정합): `--sidebar-w` / `--sidebar-default-width` 220→240.

**17. Breadcrumb 일관성 룰** (강한 사용자 시그널 "일관성 무조건 신경써", **영구 LOCKED**):
- 모든 sub-view/sub-page entity 동일 패턴: `[Parent label]` → `[chevron > button → dropdown trigger]` → `[Active label]`
- Notes `editor-breadcrumb.tsx:237 NotePickerChevron` **정확 mirror**
- **chevron 자체가 button** (CaretDown ⌄ 등 추가 시그널 X)
- DropdownMenuItem: 아이콘 + 라벨 + 활성 시 `bg-accent/10 text-accent` (Check icon 잉여)
- Search input: 5개 이상 item일 때만. 3개 이하면 잉여.
- **대상**: Ontology (DONE) / Library (TODO R1) / Wiki/Books (향후)

**18. ViewHeader `subtitle` prop API**: `subtitle?: ReactNode` 그대로 렌더링 (chevron 자동 출력 X). 외부에서 chevron + label 직접 구성. Backward compat.

**19. "엉망진창" 시그널 = 앱 전체 폴리시 PRD 필요**: 매 PR마다 fix 반복 = 비효율. R2부터 본격 PRD.

**20. Linear 미러링 자료 통합 룰**: `.claude/skills/linear-design-mirror/` + `docs/reference/linear/` 50+ 스크린샷 + `GOTCHAS.md` 셋 다 활용.

### 기술 학습 (영구)

- **Notes breadcrumb 정확 패턴** (`editor-breadcrumb.tsx`): parent button + chevron PopoverTrigger button + title span
- **DropdownMenuItem 활성 패턴**: `className={cn(active && "bg-accent/10 text-accent")}` (`editor-breadcrumb.tsx:132-141`)
- **find-replace 사고 검출**: `"<IconName>\s+\w+"` grep 패턴. icon 이름이 string literal/comment에 있으면 사고. 이번 5곳 발견.
- **Multi-server dev 환경 risk**: 매 fix 후 정확한 port URL + `preview_list` inventory 의무
- **Browser cache risk**: 매 fix 후 hard refresh (Ctrl+Shift+R) 안내 의무
- **Plot 토큰 vs CSS 갭**: DESIGN-TOKENS "보조 12px"인데 실 CSS 10.5px (토큰 위반). R2 audit에서 broader 점검.

### 환경

- Branch: `claude/relaxed-hodgkin-5a2905`
- Store version: 변경 없음
- API 확장 (backward compat): `ViewHeader.subtitle?: ReactNode` 신규 prop
- 신규 파일: 없음 (모두 기존 수정)
- CSS 토큰: `--sidebar-w` / `--sidebar-default-width` 220→240px

### 다음 (TODO.md P0)

🔴 **PR #333 manual verify 5 surface** + squash merge
🟡 **R1 (작은 PR)**: Library breadcrumb (Notes/Ontology 패턴 mirror)
🟡 **R2 (큰 그림)**: 앱 전체 폴리시 PRD 작성 (`linear-design-mirror` audit)
🟡 **R3+**: 폴리시 PR 시리즈 / 커맨드 팔레트 ⌘K / 풀 검색 페이지 / Wiki·Books 폴더

---

## 🚀 2026-05-14 (밤 후속) — 4 PR 추가 (PR 4a Template anchor + Library 확장 + Books table 일관성) ⭐⭐⭐⭐

**범위**: 1 worktree (`brave-moore-ceaf44`). 낮~밤 6 PR 후속 — entity-uniformity PR 4 시작 + Library entity 확장 + Books table 시각 격자 통일.

**PR 목록**:
- **#329** feat: Template anchor pinning (PR 4a — GlobalBookmark.targetKind 확장)
- **#330** fix: Library list view row divider 제거 (Notes/Wiki 일관성)
- **#331** feat: Library Files Detail panel 신설 (entity-uniformity 확장)
- **#326 update**: Books table checkbox column w-6 → w-8 (Notes 일관성 통합)

### 추가 핵심 결정 (영구 LOCKED, 2026-05-14 밤 후속)

**10. GlobalBookmark.targetKind 확장 패턴** — optional 필드 enum 확장 (backward compat). 같은 패턴 미래 "book" 추가도 가능.

**11. NoteLocalAnchors entity-agnostic 재사용** — prop name "note"는 legacy artifact. 실제 의존성은 `{ id, contentJson }` shape. Template 객체 그대로 호환.

**12. Library entity도 4탭 사이드바 통합** (entity-uniformity 확장) — Files/Tags/References/Stickers. Reference는 이미 panel 있음. Files (#331) 완료, Tags/Stickers 다음 세션.

**13. Files Detail panel 본질 — Source + Used in cross-reference** — Plot 패턴 정합. attachment.noteId = source, wiki blocks attachmentId = used in. 이미지 thumbnail.

**14. Notes/Books table 시각 격자 통일 영구 룰**:
- 행 구분선 X (둘 다 flat) — hover bg만으로 row separation
- Checkbox column w-8 (32px) — entity 무관 동일
- 모든 entity table은 같은 격자 적용 (Notes/Wiki/Books/Library)

### 기술 학습 추가 (영구)

- **Optional 데이터 모델 확장 패턴** — enum 확장 (backward compat, 마이그레이션 X)
- **Legacy artifact prop name 재사용** — entity-agnostic shape면 그대로 재사용. rename은 polish PR.
- **사용자 시그널 "다 순차"** — 같은 패턴 작업 시리즈는 분리 PR로 (manual verify 쉬움, 머지 충돌 risk ↓)
- **PR cascade base 결정 룰**: 데이터 모델 의존성 없으면 main 기반, 컴포넌트 의존성 있으면 cascade
- **attachment cross-reference 추적**: noteId (1:1 source) + wiki blocks attachmentId reference (cross-entity)

### 환경
- Branch: `claude/sync-2026-05-14-evening`
- Store version: 변경 없음 (모든 변경은 derive view 또는 optional 필드)
- 신규 파일: `components/side-panel/file-detail-panel.tsx`
- 데이터 모델 확장 (optional, backward compat):
  - `GlobalBookmark.targetKind`에 "template" 추가
  - `SidePanelContext`에 "file" type 추가

### 다음 (TODO.md P0)

🔴 **사용자 manual verify** 누적 9 PR (#322-#327 + #329-#331) — dev hard refresh 후 한 번에 검증
🟡 **다음 PR 후보** (P1):
- Library Tags Detail panel + Stickers Detail panel
- Ontology legend redesign (Option A + B: icon silhouette + entity 그룹화)
- PR 4b Wiki blocks anchor extractor
- PR 5 Activity entity-agnostic 통합 (별도 PRD 필수)

---

## 🚀 2026-05-14 (낮~밤) — 6 PR 누적 (entity-side-panel-uniformity + time grouping + books-divider) ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`brave-moore-ceaf44`). 단일 세션 6 PR 푸시. 사용자 시그널 "Plot UI 일관성: 4탭 사이드바 모든 entity 공통" 추진.

**PR 목록**:
- **#322** feat: Template Detail 재설계 + 4탭 entity별 분기 + Wiki Stub badge fix (PR 1)
- **#323** feat: Book 우측 사이드바 신설 + Items by kind & status (PR 2)
- **#324** feat: Connections 분류 stats Note/Wiki/Template 확장 (PR 3)
- **#325** feat: Book Bookmarks "IN THIS BOOK" context filter (PR 4 — 방향 4)
- **#326** fix: Books list view row divider 제거 (Notes/Wiki 일관성)
- **#327** feat: Time grouping ("Updated" 5단) 모든 entity 적용

### 핵심 결정 (영구 LOCKED, 2026-05-14)

**1. 모든 entity 4탭 사이드바 통일** — Plot UI 일관성. Detail 자유 / 4탭 골격 공유. (`useSidePanelEntity` book 분기, SidePanelContext type 확장)

**2. Properties = stats only** — 분류 메타는 별도 섹션. 각 entity별 본질 stats (Note Words/Chars/Headings/Source, Wiki Blocks/Sections/Text blocks/Note refs/Images/Layout, Template Words/Chars/Headings/Placeholders, Book Total/Notes/Wikis/Chapters/Smart/Manual).

**3. Template = recipe, not collaboration** — Activity Comments 의도적 제외. "Template → Note" 변환 metaphor.

**4. Connections 분류 stats 패턴** — kind & status 2단 (Notes → Stone/Brick/Block, Wikis → Stub/Article). `NoteStatusBreakdown` / `WikiStatusBreakdown` 공통 컴포넌트. dot + count, 0 status hide.

**5. "Used by N notes" event log reverse-lookup** — `noteEvents.created.meta.templateId` 기반. 신규 데이터 모델 없음. 다른 entity-cross "사용 추적"도 같은 패턴.

**6. Book Bookmarks "IN THIS BOOK" pure derive filter** — Book entity contentJson 없음 → 직접 anchor 불가. 책의 items의 anchor만 자동 grouping. `resolveBookItems` 활용 Smart/Hybrid 호환. 데이터 모델 변경 없음.

**7. Wiki Stub vs Article badge** — `isWikiStub()` 기반. `IconWikiStub`/`IconWikiArticle` + muted/accent 색상 분리.

**8. Time grouping 5단 ("Updated" 기준)** — Today/Yesterday/This Week/This Month/Older. Yesterday는 isThisWeek 전 체크 (week boundary edge case). 빈 bucket hide. 모든 entity (Notes/Wiki/Templates/Books) entity-specific pipeline에서 동일 로직.

**9. Books list view row divider X** — flat (Notes/Wiki 일관성). hover bg만으로 row separation.

### 기술 학습 (영구)

- **entity별 사이드바 자유 + 4탭 골격 공유** — Plot UI 일관성. `useSidePanelEntity` entity-aware dispatch + 4 sub-panel branch (Detail/Connections/Activity/Bookmarks).
- **`sidePanelContext` type 확장 패턴** — entity 추가 시 `{ type: "<kind>"; id }` union 확장 → useSidePanelEntity 분기 → 4 dispatch에 case → 신규 *DetailPanel 컴포넌트 신설.
- **`noteEvents.meta.templateId`로 reverse-lookup** — 데이터 모델 신규 없이 "Used by N" 추적. event log 이미 있으면 활용 우선.
- **`isWikiStub()` contentJson-only 헬퍼** — note outline extraction 같은 패턴. 재사용성 ↑.
- **resolveBookItems의 ResolverStore** — 7 store hook (notes/folders/wikiArticles/wikiCategories/tags/labels/stickers) 한 번에. Smart/Hybrid/Manual book 통합 view.
- **Plot `updateBook` direct pattern** — 별도 toggle* 액션 없이 `updateBook(id, { pinned: !pinned })` 직접 사용. `togglePin`은 note 전용.
- **"date" GroupBy 누락 fix** — type union 정의는 있지만 VALID_GROUP_BY 검증 list 누락. 동기화 의무 (마이그레이션 fallback에 쓰임).
- **빈 bucket filter 한 줄** — `.filter((key) => buckets[key].length > 0)`. 모든 grouping에 적용 가능.

### 환경
- Branch: `claude/sync-2026-05-14` (sync commit)
- Store version: 변경 없음 (모두 derive view + UI 변경)
- 신규 파일: `components/side-panel/book-detail-panel.tsx`, `.omc/plans/entity-side-panel-uniformity-prd.md`
- 신규 컴포넌트: `BookDetailPanel`, `BookContextBookmarks`, `NoteStatusBreakdown`, `WikiStatusBreakdown`, `DotCount`
- 신규 helper: `countPlaceholders` + `PLACEHOLDER_PATTERN` (templates.ts), `BookKind`/`getBookKind` 재사용
- view-engine 확장: `VALID_GROUP_BY`에 `"date"` 등록 + cross-entity groupings

### 다음 (TODO.md P0)

🔴 **사용자 manual verify**: 6 PR 효과 dev hard refresh 후 7 surface 점검 (Template Detail / Wiki Stub / Book 사이드바 4탭 / Connections status dots / Book Bookmarks IN THIS BOOK / Books divider X / Time grouping 5단).
🟡 **다음 PR 후보** (PRD §4):
- **PR 4a** Template anchor pinning (`GlobalBookmark.targetKind` 확장 + Template anchor UI)
- **PR 4b** Wiki blocks anchor extractor
- **PR 5** Activity entity-agnostic 통합 (별도 PRD 작성 후)

---

## 🚀 2026-05-13 (밤) — PR #321 11 commits (Status 색 재정렬 + Templates UpNote 패턴 + 9 follow-up)

**범위**: 1 worktree (`elegant-jepsen-2b3731`). PR #319 manual verify로 발견된 13 시그널 누적 한 PR. 18 files modified + 2 신규 (`templates-picker-dialog.tsx`, `empty-hint-placeholder.ts`).

### 추가 핵심 결정 (영구 LOCKED, 위 entry에 이어)

**7. Templates UpNote 패턴 (영구 LOCKED)**:
- 템플릿 생성 다이얼로그 (Name+Description) 제거 — 즉시 빈 "Untitled" template + editor 진입
- 빈 노트 hint = ProseMirror Decoration widget (paragraph 안 inline clickable). absolute overlay X / 별도 row X.
- slash 메뉴 = 단일 "Insert template…" entry → `plot:open-templates-picker` custom event → TemplatesPickerDialog
- 모든 entry path (inline / slash / 향후 toolbar) 동일 dialog + event 통일
- contentJson 우선 적용 (heading title + rich body). plain content는 fallback.

**8. Template placeholder expansion contentJson 의무**:
- `expandPlaceholdersInJson` 재귀 traversal — text node `text` 필드만 expand
- attrs / meta verbatim 보존 (URL params, IDs 보호)
- `createNoteFromTemplate` + slash command apply path 둘 다 동일 expand 사용 (일관성)
- 지원: UpNote `{{YYYY}}/{{MM}}/{{DD}}/{{HH}}/{{mm}}/{{date}}/{{time}}` + Plot legacy `{date}/{time}/{datetime}/{year}/{month}/{day}`

**9. ProseMirror Decoration vs Placeholder extension**:
- `@tiptap/extension-placeholder`는 `:before` pseudo (clickable 불가, plain text only)
- inline clickable element 필요 시 ProseMirror Plugin + `Decoration.widget` 사용
- widget DOM `contentEditable="false"` + `ignoreSelection: true` 의무 (cursor/selection 충돌 회피)
- decoration plugin은 매 transaction시 doc 순회 — 첫 매치 후 break으로 비용 제어

**10. Editor 영역 layout 패턴**:
- scroll container `overflow-y-auto`에 `flex flex-col` 명시 의무 — 자식 flex-1 늘어남 보장 → counts row 자연스럽게 toolbar 위 footer 위치
- counts row sticky bottom: 0 + `marginTop: auto` — scroll 안에서도 항상 visible
- editor placeholder text 빈 시 hint extension에 위임 (충돌 회피)

**11. Custom event editor ↔ outer state bridge**:
- TipTap extension에서 dialog open 시 callback prop 전달은 무거움 (editor re-init 비용)
- `window.dispatchEvent(new CustomEvent("plot:..."))` + parent useEffect listener 패턴이 가볍
- listener cleanup (returnempty function) + dependency array 의무

### 기술 학습 추가 (위 entry 학습에 이어)

- **chip ↔ icon mismatch root cause** — 같은 status가 chip은 `var(--chart-N)` / icon은 `var(--status-*)` 사용 시 시각 다름. STATUS_CONFIG 같은 single source 의무.
- **flex-1 min-w-0 narrow viewport collapse** — title column이 0px squeeze 시 text overflow + 옆 컬럼 위 겹침. `min-w-[N]` + cell `overflow-hidden` 둘 다 의무.
- **scroll container flex column** — `overflow-y-auto`만으론 자식이 자연 height. `flex flex-col` 추가로 flex-1 자식이 늘어남.
- **TipTap contentJson 우선 사용** — `NoteEditorAdapter.initialContent` (line 119) — contentJson 있으면 plain content 무시. expansion 시 둘 다 처리 의무.
- **SVG weight "fill" 한계** — Phosphor Hexagon/Cube는 fill 작동, custom Cuboid2x2 (line-only)는 stroke 기반이라 fill 무효. 통일 weight 필요 시 "bold" 안전.
- **ProseMirror Decoration widget mount** — `Decoration.widget(pos, dom, {side, ignoreSelection, key})`. side -1로 paragraph 시작 앞.
- **빈 paragraph detect** — `node.type.name === "paragraph" && node.content.size === 0`. heading은 별도 placeholder extension 사용.

### 추가 PR (11 commits in PR #321)
1. `438853c` Status 색 재정렬 + 6 UX follow-up
2. `b5b6eb6` template 생성 다이얼로그 제거
3. `ce6ed10` TitlePatternBar 제거 + counts row 위치
4. `dd1e880` counts row sticky bottom
5. `509a564` TemplateEditorAdapter `flex flex-col`
6. `5cfbed0` template placeholder expansion contentJson
7. `4b2b84d` slash command template contentJson 우선
8. `0ef3803` Templates entry UpNote 패턴
9. `3e61e1a` hint 별도 row + UpNote 카피 회피
10. `3bf9a95` ProseMirror Decoration paragraph 안 inline
11. `bce50cb` placeholder light mode 가시성

---

## 🚀 2026-05-13 (밤, 초기) — Status 색 메타포 재정렬 + 6 follow-up (PR #319 manual verify 결과)

**범위**: 1 worktree (`elegant-jepsen-2b3731`). 사용자 시각 시그널 6개 한 PR 묶음. 10 files modified.

### 핵심 결정 (영구 LOCKED, 2026-05-13)

**1. Status 색 메타포 재정렬** — 사용자 결정:
- **Stone** = slate (회색, raw) — light `#475569` slate-600 / dark `#94a3b8` slate-400
- **Brick** = amber (kiln-fired, in progress) — light `#D97706` amber-600 / dark `#f59e0b` amber-500 (유지)
- **Block (keystone)** = emerald (finished crystal, settled) — light `#059669` emerald-600 / dark `#34d399` emerald-400
- 메타포: 마지막 단계가 가장 vivid color로 끝나는 progression (이전엔 Block이 가장 옅은 slate라 어색).
- 색 변경 시 3곳 동시 update 의무: `app/globals.css` (light + dark) + `lib/colors.ts NOTE_STATUS_HEX` (dark canonical).

**2. STATUS_CONFIG var(--status-*) 통일 영구 룰**:
- `components/note-fields.tsx` STATUS_CONFIG의 color/bg/border는 `var(--status-{stone|brick|keystone})`만 사용.
- `var(--chart-N)`는 chart 시각화 전용 (PR #319 영구 룰). status에 chart-N mapping 금지.
- chip ↔ row icon 색 정확 동일 보장 (둘 다 동일 CSS var 받음).

**3. 그룹 헤더 `.a-tg` 영구 패턴 (모든 entity)**:
- Notes/Wiki/Books 3 entity 모두 `.a-tg` CSS 클래스 + `.a-tg__label`/`.a-tg__count`/`.a-tg__line` 통일.
- grid-template-columns: 11px auto auto auto 1fr (chevron / icon / label / count / divider line).
- label color: var(--fg) (진함). count: var(--whisper-fg) (옅음). line: var(--border) flex 1fr.
- 새 entity 도입 시 same pattern 사용 의무.

**4. BookTable narrow viewport overflow 영구 룰**:
- list table cells에 `overflow-hidden` 필수 (text overflow → 옆 cell 겹침 회피).
- flex-1 title column에 `min-w-[120px]` (좁은 viewport 0 collapse 방지). Notes/Wiki 같은 pattern 시 동일.

**5. Home stats card layout 영구 패턴**:
- icon은 label **좌측** (`flex items-center gap-1.5`). `justify-between` X — label 길이 무관 일관성.
- label 길면 `truncate`. tracking 자제 (uppercase font-medium 충분).

**6. i18n 영어 통일 영구 룰**:
- 다이얼로그 / 버튼 / footer 텍스트는 영어. 한국어 사용자라도 일관성 우선.
- 위반 시 같은 다이얼로그 안 한/영 혼합 → 시각 일관성 ↓.

### 기술 학습 (영구)

- **CSS var vs TS const 동기화 의무** — globals.css `--status-*` 변경 시 lib/colors.ts `NOTE_STATUS_HEX` 같이 update. mismatch → ontology canvas stale.
- **STATUS_CONFIG chip 패턴 root cause** — chip이 쓰는 var와 row icon이 쓰는 var가 다르면 사용자 시각 "다른 색" 인식. 통일 의무.
- **SVG weight "fill" 한계** — Cuboid2x2 custom icon은 line-only SVG라 fill 작동 X. weight "bold"가 다른 weight들과 일관.
- **flex-1 min-w-0 narrow viewport collapse** — title column이 0px squeeze 가능. min-w-[N] 추가로 minimum 보장.

---

## 🚀 2026-05-13 — Smart Book v2 풀 완성 + Ontology Hull P1-4 + 11 follow-up (PR #319, 17 commits mega-PR)

**범위**: 1 worktree (`brave-ardinghelli-209f9b`). 단일 세션, 17 commits 단일 PR. Smart Book v2 (Phase G/H/K 전체) + Ontology Hull (Phase 1/2/3/4 전체) + Linear refs 137 + 다수 bug fix.

### 핵심 결정 (영구 LOCKED)

**1. Smart Book v2 PRD v1.0 LOCKED 13 결정** — 모두 추천값 (same-source reorder / silent undo / outline / Book.color 우선 / overlap 허용 / dashed thin sequence / opt-in / picker 너비 + cross-tab / userOrder + autoUserOrders map / G+H+K MVP / Hull/Sequence 별도 PRD 분리).

**2. Ontology Hull PRD v0.1 LOCKED**: Hull = display rendering (filter X) / Sticker+Folder+Book 3-source / Status nested (Note/Wiki/Book sub-section) / Smart Book auto items 포함 (resolveBookItems via prop) / picker filter "Visible hulls" / Sequence edge opt-in dashed.

**3. status 색 영구 룰**: `var(--status-{stone|brick|keystone})`만. `var(--chart-N)`는 chart 시각화 전용 (LOCKED 색 변경 따라가지 않음 — 이번 teal→slate 사례). status에 chart-N mapping 금지.

**4. dnd-kit collision normalize 모든 board 영구 룰**: `useSortable("col-${key}")` + `useDroppable(key)` 이중 binding 시 over.id 비결정 → handler에서 `overId.startsWith("col-") ? overId.slice(4) : overId` 의무. notes/books/wiki 3 board 적용 완료. 새 board 도입 시 동일.

**5. Filter values icon 일관성 영구 룰** — 같은 카테고리 안 cross-entity values는 각 entity chip/badge icon 그대로 재사용 (color dot 단독 X). Status Note(Hexagon/Cube/Cuboid2x2) + Wiki(IconWikiStub/IconWikiArticle) + Book(Lightning/PencilSimple/Sparkle).

**6. Chapter context derive 패턴**: useBookContextNav 안에서 sourceRefId clustering. auto items + manual items with Tweak B tag. UI caller가 5 store lookup으로 source name + glyph 표시. manual no-source items는 badge hide.

**7. Resolver 외부 view 재사용 패턴**: ontology-view 등에서 useMemo로 resolveBookItems 호출 → child 컴포넌트에 prop으로 전달. canvas store coupling 회피, props-driven 유지.

**8. `npm install` 새 worktree 첫 setup 룰**: node_modules 없는 상태에서 dev server 시작 시 module not found. before-work 단계 자동 체크 + install 후보.

**9. PRD 분리 trigger**: 한 PRD scope 다른 도메인 침범 시 사용자 한마디로 분리 (이번 Smart Book v2 안 Ontology Hull I/J → 별도 PRD). draft 단계에 분리 가능성 미리 명시.

**10. cmdk multi-select 패턴**: onSelect는 mouse event detail 없음 → modifier key 직접 처리 어려움 → explicit bulk mode 토글 우회 (cmdk와 호환).

### 기술 학습 (영구)

- **FilterValue group field 패턴**: `group?: string` optional + FilterPanel이 group 변경 시점 detect → uppercase tracking sub-header. nested UI 효과를 flat data shape로.
- **Hull picker filter 패턴**: filterCategories.values runtime hydration (groupBy 따라 다른 entity list 동적). FilterRule "hullEntity" field → visibleHullKeys Set → canvas filter.
- **Sequence edge SVG marker**: `<defs><marker>` 1번 정의 + `markerEnd="url(#book-seq-arrow)"` reuse. `currentColor` inherit으로 stroke 색 자동 매칭.
- **var(--chart-N) vs var(--status-*) 분리**: chart는 시각화 (D3 등), status는 LOCKED 색. 잘못된 mapping이 LOCKED 색 변경 미반영 회귀 원인.

### Phase 분해 시간

| Phase | scope | 시간 |
|---|---|---|
| Smart Book v2 Phase G (chapter ordering) | G-1 core + G-2 UI + 1 follow-up (chapter context badge) | ~5h |
| Smart Book v2 Phase H (reading view) | lastRead + Resume + progress bar | ~3h |
| Smart Book v2 Phase K (picker UX) | dialog + cross-tab + 1 follow-up (bulk select) | ~3h |
| Ontology Hull Phase 1 (Status nested) | flat + sub-section headers | ~2h |
| Ontology Hull Phase 2 (Book hull) | groupBy + 1 follow-up (Smart auto items in hull) | ~3h |
| Ontology Hull Phase 3 (Sequence edge) | dashed arrow + marker | ~2h |
| Ontology Hull Phase 4 (Hull picker filter) | filter category dynamic | ~2h |
| Linear refs + README | 137 captures 카테고리 인덱스 | ~30분 |
| Bug fix (3 initial + 4 follow-up) | board normalize + select-all + icon mapping + Block 색 | ~3h |

**합계**: ~23h 작업, 17 commits 단일 PR (squash merge 후보).

### 환경
- Branch: `claude/brave-ardinghelli-209f9b`
- Store version: 변경 없음 (Phase G-1 데이터 모델 additive optional)
- Tests: 39 → 43/43 pass (+4 userOrder priority/fallback/scoping/empty)
- Build: ✅ / TSC: ✅ 0 errors (매 commit 검증)

---

## ⭐ 작업 원칙 (영구, 모든 PR/작업에 적용)

> **"정확도 + 버그 위험 최소화"**

### 핵심 규칙
1. 변경 전 코드/패턴 정확히 이해 (추측 X)
2. 최소 diff (executor scope 초과 X)
3. 빌드/타입 검증 의무 (`npm run build` + `tsc --noEmit`)
4. 사용자 reproduce 정보 우선 (추측 fix X)
5. 마이그레이션 신중 (백업/롤백 가능)
6. UI + 데이터 모델 분리 PR
7. Edge case 점검 (빈/거대/hydration/SSR)
8. 사용자 직관 = 디자인 시그널 (무시 X)
9. docs는 진실 source (검증된 사실만)
10. 커밋 메시지 명시 (무엇/왜/검증)

### 재발 방지 사례
- Executor scope 초과 → 명시적 prompt + 결과 검증
- 추측 fix → reproduce + 원인 분석 후 fix
- 거대 PR 시리즈 (10+ PR) 후 conflict 빈번: 매 PR 머지 후 즉시 fetch+merge origin/main 습관
- 4 PR cascade (#305-#308) 단일 세션 — 같은 worktree에서 누적 변경 squash 머지 4회. conflict는 build artifact만 (`--ours` 패턴).
- 2026-05-12 (저녁) — multi-server dev (port 3002 + port 61869 동시) 환경에서 stale build 화면 보고 사용자가 fix 안 보인다고 보고. **교훈: 매 fix 후 정확한 port URL 안내. `preview_list` 로 inventory 확인.**
- 2026-05-12 (저녁) — 사용자 "위키 북마크" = pin 의미 (bookmark 아님). 추측으로 진행하다 fix 의도 달라짐. **교훈: 사용자 어휘 매핑 명확화 후 진행.**
- 2026-05-12 (밤) — Books list mode grouping 회귀 (PR #317): board/gallery는 `groups + groupBy` 받지만 list만 누락. 사용자 스크린샷 한 장으로 발견. **교훈: viewMode 추가/변경 시 모든 entity의 모든 view mode에 같은 prop 흐름 적용 영구 룰.**
- 2026-05-12 (밤) — Smart Book 5 source case 작성 중 emit helper 추출. **교훈: case 5+ 비슷한 흐름은 helper 추출이 *논리 단일화*. LOCKED #10 v1.2 같은 미묘 룰을 단일 지점에서 보장.**
- 2026-05-12 (밤) — ResolverStore 새 필드 추가 시 test mock 14곳 수정 부담. **교훈: 새 필드는 optional + `?? []` fallback 패턴. 기존 caller silent compatible.**

---

## 🚀 2026-05-12 (밤) — Smart Book Phase A-F 전체 완성 + 4 polish PR (6 PR 누적 #312-#317)

**범위**: 1 worktree (`condescending-yonath-23775a`). 단일 세션에서 6 PR. Smart Book PRD §4 LOCKED 12개 결정 모두 구현. 5 AutoSource kind 모두 활성.

### 큰 결정 (영구 LOCKED)

**1. Smart Book INVARIANT 영구 확정 (PRD §2)**:
- BookItem.kind = `note` | `wiki` | `chapter-heading` 만
- AutoSource는 **공급원**이지 멤버 kind가 아님 — label/tag/sticker entity가 책 페이지가 되는 게 X
- Sticker는 7-kind 중 note/wiki만 추출 (다른 kind 무시)
- 5 source 매핑: folder(note) / category(wiki) / tag(cross-entity) / label(notes-only) / sticker(note+wiki filter)

**2. Smart Book 5 heading icon 매핑 (LOCKED)**:
- folder → 📁 / category → 📚 / tag → # / label → 🏷 / sticker → ✨

**3. `emitSection` helper 패턴 (영구)**:
- resolver의 5 source case가 동일 흐름: heading + items + dedup + LOCKED #10 v1.2 empty-skip
- helper 추출로 단일 지점에서 룰 보장. Phase G+ 시 같은 패턴 (template source 등 추가 가능성)

**4. Convert to manual (LOCKED #9 manual override 액션화)**:
- sources 있을 때만 표시되는 버튼
- resolveBookItems → auto items 추출 → fresh uuid + clean BookItem shape → book.items append + smartSources/excludeIds clear
- Use case: 자동 curate된 책을 source 변경 영향에서 freeze
- window.confirm 가드 (destructive, undo path 없음)

**5. Trash guard LOCKED #11 lazy detection 패턴**:
- Tag/Label/Sticker → `if (!entity || entity.trashed) continue`
- WikiCategory + Folder → hard-delete only이므로 기존 stale-ref guard로 충분
- restore 시 자동 revive (별도 path 불필요)

**6. ResolverStore optional 확장 패턴 (영구)**:
- 새 phase 추가 시 `field?: T[]` + `(store.field ?? [])` fallback
- 기존 caller (Phase A-only test mock 14곳) silent compatible
- 모든 entity slice 확장 시 같은 패턴

**7. 5-tab dialog UI (`sm:max-w-md` ~448px)**:
- grid-cols-5 + icon-only tabs (title hint)
- 좁은 dialog에 깔끔. label 길면 잘림 → tooltip 보완
- 미래 6 tab 이상이면 dropdown 또는 segmented control 재검토

**8. viewMode props 일관성 영구 룰**:
- 새 viewMode 추가 시 모든 entity의 모든 view mode에 같은 prop 흐름 (`books + groups + groupBy + viewMode...`)
- Notes/Wiki/Books × list/board/gallery/grid 16 조합 중 한 곳 누락 = 사용자 직관 깨짐
- PR #317로 Books list mode 회귀 catch

### 기술 학습 (영구)

- **Plot routing이 module-level state** (`_activeRoute` in `lib/table-route.ts`) — preview MCP로 wiki/books list 시각 검증 어려움. `setActiveView('books')` 만으로는 view mount 안 됨. 시각 verify는 사용자가 dev server에서 직접 하는 게 효율적.
- **squash merge 후 base stale → conflict 패턴** — `git merge origin/main --no-ff` 후 `--ours`로 resolve. tsconfig.tsbuildinfo + .omc/continuation-count.json 등 auto-gen 파일은 무조건 ours.
- **nanoid import** — `import { nanoid } from "nanoid"` (package.json 이미 있음). Convert to manual에서 fresh book item id 만들 때 사용.

### Phase 분해 시간

| Phase | PR | Estimate | 실제 |
|---|---|---|---|
| B (Category) | #314 | ~1-2h | ~1h |
| C+D+E (Tag/Label/Sticker) | #315 | ~5h | ~2h (helper 추출로 단축) |
| F (trash + Convert) | #316 | ~2-3h | ~1h |
| Polish (list grouping fix) | #317 | — | ~30분 (사용자 보고 즉시) |

### 환경
- Branch: `claude/condescending-yonath-23775a`
- Store version: 변경 없음 (Phase A migration 이미 v121, B-F는 additive)
- Tests: 55 → 59/59 pass (+4 trash guard tests)
- Build: ✅ / TSC: ✅ 0 errors

---

## 🚀 2026-05-12 (저녁) — Trash All + Status-icon-stale root fix + Wiki pin + 9 fix mega-PR (Store v130 → v132)

**범위**: 1 worktree (`quirky-colden-bcf3de`). 9 fix 통합 단일 PR. Store v130 → v132. 사용자가 보고한 다섯 가지 issue (Trash All, Status icon stale, Board drag move semantic, Books checkbox visibility, Trash checkbox 부재, Wiki pin 위치) + 그 연쇄 root cause fix.

### 큰 결정 (영구 LOCKED)

**1. Trash "All" 통합 view 신규**:
- `components/views/trash-all-view.tsx` (~380 LOC final including multi-select)
- 8 entity (Notes/Wiki/Books/Tags/Labels/Templates/References/Files) trashed 통합 표시
- entity별 section header, 통합 row layout, status별 leading icon (Notes만 StatusShapeIcon)
- multi-select + 하단 floating bulk action bar (Restore / Delete forever / Clear)
- `trashTabCounts.all`에 wikiArticles 합산 보강 — count 모순 해소
- 사용자 의도 *"ALL은 모든 entity의 trashed 통합 표시"*

**2. dnd-kit DOM ref 합치기 위험 패턴 (영구 학습 LOCKED)**:
- `useSortable("col-${key}")`와 `useDroppable("${key}")`를 같은 ref에 bind 시 collision detection 비결정
- card drop의 `over.id`가 sortable id (`col-stone`) 또는 droppable id (`stone`) 중 비결정 반환
- handler에서 무조건 id normalize: `overId.startsWith("col-") ? overId.slice(4) : overId`
- 같은 패턴 사용 시 (books-board 등) 같은 normalize 적용

**3. Status icon stale root cause + 3-layer fix (영구 결정)**:
- root cause 명확: dnd-kit DOM ref 이중 binding (위 #2). garbage `col-stone` 등이 `note.status`에 저장 → StatusShapeIcon (else→Cuboid/Block) + StatusBadge (fallback→brick) mismatch
- **Fix #1 root prevention**: `notes-board.tsx:968` overId strip
- **Fix #2 memo safety**: BoardCard memo에 status 비교 추가
- **Fix #3 data recovery**: `migrate.ts` v131 NoteStatus garbage cleanup (idempotent)
- Store version: 130 → **131**

**4. v132 folderIds garbage cleanup**:
- 같은 dnd-kit root cause가 folderIds에도 garbage (`col-folder-1`, `col-_no_folder` 등) 저장 가능
- 사용자 toast 본 *"Added X to col-_no_folder"* 가 직접 증거
- v132 마이그레이션: `state.folders` Set 외 folderId 제거. notes + wikiArticles 둘 다
- Store version: 131 → **132**

**5. Board drag default = Move semantic (영구 결정 변경 LOCKED)**:
- 이전 N:M 패턴: folder drop default = Add / Shift = Move
- **신규** (2026-05-12 저녁 user feedback): default = **Move** (folderIds 교체) / Shift+drop = **Add** (N:M 기존 유지)
- 사용자 직관 *"옮기면 진짜로 속성이 바뀌어야"* 우선. 작업 원칙 #8.
- status / priority / triage는 single-valued라 항상 Move (불변)
- 이전 결정 (PR (c) Add-default) 폐기, 새 결정 LOCKED

**6. row checkbox 패턴 — 모든 entity 일관 (영구 LOCKED)**:
- 패턴: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`
- 부모에 `group` className 필수
- 적용: notes-table NoteRow / wiki-list ArticleRow / book-table BookRow (이번 세션 fix) / trash-all-view TrashRow (이번 세션 신규)
- 사용자 보고: Books visible mismatch + Trash 부재

**7. Pin 위치 = title 옆 (영구 결정 #301 재실현, Books 패턴 reference)**:
- title span에서 `flex-1` 제거 + pin `ml-1 shrink-0`
- 모든 entity 표준
- elastic-darwin의 status chip 옆 이동(`1d8b30f`) 영구 폐기 재확인
- 사용자 보고 *"왜 스테이터스 칩 왼쪽에 있냐고. 북마크가 아니라 pin이었어!!"*

**8. Migration 2-layer 패턴 (영구 LOCKED)**:
- 코드 fix만으로는 이미 corrupted된 IDB 데이터 정리 X
- root prevention (코드) + data recovery (migration) 둘 다 필수
- v131 / v132 idempotent — valid 데이터 pass through. 재실행 안전.

### 기술 학습 (영구)

- **dnd-kit collision detection**: useSortable이 내부적으로 useDroppable wrap. 같은 DOM ref bind 시 over.id가 어느 id 반환할지 비결정. handler normalize 필수.
- **Zustand persist `partialize`**: notes의 content/contentJson 제거 후 저장. body는 별도 IDB store. migration 시 state.notes에 body 없음.
- **preview_eval로 IDB 직접 dump**: `indexedDB.open("plot-zustand")` + `tx.objectStore("kv").getAll()`. zustand persist 검증 효과적.
- **사용자 IDB-aware migration**: SEED 코드 vs 사용자 데이터 분리. SEED는 valid enum 사용해도 사용자 IDB에 옛 enum/garbage 잔존 가능. migration이 root cause 진단 + recovery 둘 다 담당.
- **multi-server preview troubleshooting**: 사용자 본 화면 ≠ AI verify 화면. port URL 명시 + `preview_list` 로 inventory.
- **Hover-only checkbox**: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`. 부모 `group` className. 모든 entity 일관.
- **Floating bulk action bar (sticky bottom)**: `sticky bottom-4 z-20 mx-auto w-fit ... backdrop-blur shadow-lg`. selection 활성 시 mount.
- **Migration silent log**: console `[migrate] vN→vN+1`. dev tools 없으면 사용자 못 봄. toast 알림 follow-up 후보.
- **Wiki list rendering chain**: wiki-view (line 372 trashed filter) → filteredWikiNotes → wikiGroups → WikiList (filteredWikiNotes prop). 단 wikiArticles 원본 prop도 별도 (backlink resolution용, 표시 X).
- **`overId.slice(4)` vs `.replace("col-", "")` 비교**: slice가 prefix 일관 처리 더 안전 (replace는 모든 occurrence 처리, 한 번만 처리해야).

### 다음 (TODO.md P0 참조)

🔴 **BoardCard chip overflow fix** — 사용자 보고 *"박스 밖으로 `#Productivity` 글자가 빠져나오는 연출"*. notes-board.tsx의 BoardCard chips row에 overflow:hidden + truncate. 정책 A (truncate, 한 줄 유지) 추천.

🟡 9 fix manual verify (localhost:61869):
- /trash All / /notes board drag / /library Books / /wiki pin / migration log

🟢 TrashEntityList multi-select (entity별 탭) — follow-up

### 머신
집 (Windows)

### 누적 commits (이번 세션, 1 mega-PR)
- v131 migration (NoteStatus garbage cleanup) + Trash All view 신규 + 9 fix 통합
- 모든 코드 변경 + docs sync (TODO + SESSION-LOG + CONTEXT + MEMORY)
- tsc / build / preview console clean 매 fix마다 검증

---

## 🚀 2026-05-12 (오후) — Board/Gallery polish + Split view + hotfix (4 PR cascade)

**범위**: PR #305 직후 사용자 시그널 5건 follow-up. 4 PR 단일 worktree squash 머지 (#305 → #308). PR #306 split view → #307 Block 색 + Gallery click → #308 hotfix (JSX parser + null guard).

### 큰 결정 (영구 LOCKED)

**1. Block 색 = slate (Plot 건축 메타포)**:
- teal `#0E9384/2dd4bf` 폐기. slate `#475569/94a3b8`.
- stone (beige) → brick (orange) → block (slate) earthy progression
- chart-5 accent와 시각 분리 + status "settled" 의미 유지

**2. Gallery click 패턴 = list/board parity (Linear principle)**:
- Single click → preview pane
- Double click → open (편집)
- cmd/ctrl-click 또는 selection 활성 중 click → toggle multi-select
- Hover → 카드 우상단 checkbox
- Selection 시 → 하단 FloatingActionBar
- 모든 view mode 동일 패턴 = muscle memory 학습 부담 0

**3. Split view 보드 = secondary pane workbench hide**:
- viewport 절반에서 workbench `flex-1` grow가 column 잘림
- primary pane만 workbench (시그니처 보존)
- secondary pane은 board column만 (drop target 보존, batch action은 primary로 유도)

**4. STATUS_CONFIG 패턴 — lookup map null guard 의무**:
- 모든 `Record<X, Y>` lookup access에 `if (!value) return null` graceful skip
- corruption / 옛 enum / 빈 값 대응
- crash 대신 silent degradation

**5. JSX expression parens 안전 패턴 (LOCKED)**:
- conditional render `{cond && <X .../>}` 위험 (webpack/swc regex 오해석)
- **무조건 parens**: `{cond && (<X ... />)}`
- 향후 모든 conditional JSX 이 패턴

### 기술 학습 (영구)

- **webpack/swc JSX parser ambiguity**: `/>}` 시퀀스 → regex literal 오해석. "unterminated regexp literal" 에러 = 같은 패턴 의심. parens가 expression boundary 명확화.
- **STATUS_CONFIG runtime undefined**: store normalize는 type-level 보호. user IDB stale enum / data corruption은 runtime에 lookup undefined → cfg.bg crash. lookup map access 의무 null guard.
- **Gallery selection 진입 3 경로**: cmd/ctrl-click + hover checkbox + selection 활성 중 일반 click도 toggle. Linear principle 4 접근 경로 패턴 정합 (button/keyboard/context-menu/command-palette).
- **GalleryCard onClick 시그니처 확장**: `() => void` → `(e: React.MouseEvent | React.KeyboardEvent) => void` (modifier key 검출). caller side 영향 — event arg 받도록.
- **dropAnimation cubic-bezier 220ms polish**: dnd-kit 기본은 즉시 snap. `dropAnimation={{ duration: 220, easing: cubic-bezier(0.18, 0.67, 0.6, 1.0), sideEffects: defaultDropAnimationSideEffects(...) }}` 명시화로 부드러운 drop.
- **빈 status group의 Kanban 의미**: drop target 유지 필수. `groupBy === "status"` 분기로 dynamic group (folder/label)과 격리.
- **PR cascade 시 build artifact conflict 패턴**: `.omc/continuation-count.json`, `docs/.pdca-status.json`, `tsconfig.tsbuildinfo` — `--ours` resolve 매번 동일. 같은 worktree에서 시리즈 진행 시 정착.

### PR 정보

| PR | 핵심 |
|----|---|
| [#306](https://github.com/peterkwon248/linear-note-plot-/pull/306) | Split view secondary pane workbench hide |
| [#307](https://github.com/peterkwon248/linear-note-plot-/pull/307) | Block 색 slate + Gallery click parity + 하단 FloatingActionBar |
| [#308](https://github.com/peterkwon248/linear-note-plot-/pull/308) | Hotfix — notes-board JSX parser + FloatingActionBar cfg null guard |

### 다음 세션 P0

🔴 **Trash "All" 통합 view 신규** (~150-200 LOC)
🔴 **#2 Status icon stale** — 사용자 reproduce 정보 받기
🟡 Block 색 + Gallery click + Split view 사용자 manual verify
🟢 STATUS_CONFIG 패턴 다른 lookup map 적용 (PRIORITY_CONFIG 등)

### 환경 변경

- Store version v130 (이번 세션 변경 X)
- 4 PR squash merged
- 사용자 IDB wiki-1/2/3 trashed=true 상태 (사용자 결정 대기)

---

## 🚀 2026-05-12 (낮~오후) — ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 (Store v129 → v130)

**범위**: 단일 worktree. 11 작업 통합. 사용자 manual verify 흐름과 결합. **NEXT-ACTION.md 영구 폐지 + ContextMenu DRY (3 surface 통일) + Wiki UX 통합 + Board polish**가 핵심.

### 큰 결정 (영구)

**1. NEXT-ACTION.md 영구 폐지 (2026-05-12 LOCKED)**:
- 정보 3중복 해소 (NEXT-ACTION ↔ TODO P0 ↔ SESSION-LOG 끝 "다음")
- 다음 세션 즉시 액션 = **SESSION-LOG entry 첫 줄 hook + TODO P0** 두 source
- 글로벌 commands (`~/.claude/commands/`, 머신마다 vergent) → project-level (`.claude/commands/`, git tracked) 이전
- 새 before-work: SESSION-LOG 최신 entry + TODO P0. 새 after-work: SESSION-LOG entry 첫 줄에 hook 통합.

**2. Pin indicator 위치 = title 옆 영구 결정 재확인**:
- PR #301 commit message 영구 결정 = "title 옆 우측 (status chip / label chip 안 침범)"
- 직전 세션 끝 "status chip 옆" 정정 시그널은 잘못된 docs 기록 (commit이 진실)
- `elastic-darwin-382a48` branch의 `1d8b30f` (status chip 옆 이동)은 사용자 폐기 결정

**3. Multi-select UI 패턴 (Linear principle + Plot 도메인 분리)**:
- **List mode** → 하단 FloatingActionBar (compact)
- **Board mode** → 우측 BoardWorkbench (시그니처 패널, 풍부)
- **Gallery mode** → 하단 FloatingActionBar (compact, 향후 신규 PR)
- 공통 action set은 mode 무관 동일. presentation만 mode-specific.

**4. ContextMenu DRY 패턴 (Linear principle)**:
- 모든 surface (list row / board card / gallery card)가 동일 13-item 메뉴
- `note-context-menu-items.tsx` helper가 단일 source
- callback wiring은 caller-specific (store action 직접 호출). helper는 dumb component.

**5. Kanban 패턴 — 빈 status column 항상 표시**:
- 카드를 drag로 다른 column 이동 후 원래 column 비어도 column 유지 (drop target)
- `groupBy === "status"`일 때만 (folder/label 등 dynamic group은 기존 동작)

**6. Books entity icon 분기 (영구)**:
- ActivityBar / Sidebar / ViewHeader Secondary popover = `BookOpen` icon
- Library의 phosphor `Books` (책 모음 메타포)와 시각 구별 — 두 entity가 popover에 함께 나올 때 명확

**7. Trash "All" tab 의미 = 통합 (모든 entity)**:
- 현재 count는 통합, display는 notes만 = 모순
- 다음 세션 P0: 통합 view 컴포넌트 신규 (entity별 section)

### 기술 학습 (영구)

- **transition-all과 dnd-kit transform 충돌**: card의 `transition-all`이 transform property도 transition 처리 → dnd-kit 매 프레임 transform 업데이트마다 jitter. `transition-colors`로 제한이 정답.
- **DragOverlay dropAnimation polish**: dnd-kit 기본은 즉시 snap. `dropAnimation={{ duration: 220, easing: cubic-bezier(0.18, 0.67, 0.6, 1.0), sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}` 명시.
- **Cherry-pick id-dedup pattern**: SEED backfill에 `existingIds = new Set(...)` + 누락분만 push (Books v127 → Wiki v130 동일 패턴). 사용자 IDB의 기존 데이터 보존.
- **빈 group의 default hide 부작용**: kanban 패턴은 빈 column이 drop target. dynamic group (folder/label)에는 자연스러운 hide. **groupBy 분기 필수**.
- **Helper extraction signature**: helper가 store action을 직접 호출 X (caller flexibility). callback prop으로 받음. 단 helper 내부에서 *항상 동일* store action (예: `usePlotStore.getState().openInSecondary`)은 직접 호출 OK.
- **Cherry-pick으로 다른 머신 작업 통합**: `git cherry-pick -n <commit>`으로 staging만 + 검토 후 우리 변경과 함께 commit. base의 폐기 변경은 cherry-pick 변경 안에 없으면 묻어들어오지 않음 (auto-merge).
- **`text-2xs` (Tailwind ≈11px) vs `.a-tg__label` 11px**: 같은 크기지만 시각 비교 시 다르게 느낄 수 있음. 단순 13px로 키우는 게 명확 안전.
- **flatNotes vs columns 합**: workbench의 "total notes"는 flatNotes.length (filter 후 sorted, group 전). columns의 cards 합은 groups.flatMap. 일반적으로 동일하지만 group이 hidden되면 차이 발생.

### PR 정보

이번 세션 단일 PR (squash merge 예정). 11 작업 + 25 파일 변경:
- Helper 신규: `components/note-context-menu-items.tsx`
- Cherry-pick: `42c6e59` Wiki UX 3 issues (gallery-view / wiki-list / wiki-view / wiki-floating-action-bar)
- Major refactor: notes-table / notes-board / gallery-view-shell / board-workbench
- Visual polish: globals.css (group header + metadata 폰트)
- Data: seeds.ts (Wiki seed 4 추가) + migrate.ts (v130) + index.ts (version bump)
- Workflow: .claude/commands/before-work.md + after-work.md (project-level 신규 정의) + docs/NEXT-ACTION.md 삭제

### 다음 세션 P0

🔴 **Trash "All" 통합 view 신규** (~150-200 LOC) — sample 통일 후 entity 통합 display
🟡 사용자 manual verify (Wiki UX cherry-pick + ContextMenu 4 surface + Board drag/empty column)
🟢 Notes Gallery 하단 floating bar (Linear parity 마무리)
🟢 Books grid/board/gallery pin 위치 점검

### 환경 변경

- Store version v129 → **v130** (Wiki seed backfill)
- Tests: 255/255 (변화 없음 추정)
- 신규 파일: `components/note-context-menu-items.tsx`
- 삭제 파일: `docs/NEXT-ACTION.md` (영구 폐지)
- Project-level commands: `.claude/commands/before-work.md` + `after-work.md`

---

## 🚀 2026-05-12 (저녁~밤, 거대) — Books view-engine 10 PR polish + Pin 통일 + emoji 폐기 (Store v126 → v129)

**범위**: 오후 4 PR 시리즈에 이어 거대한 polish + extension. 매 사용자 manual verify 후 회귀 즉시 fix → commit → 머지 반복. 6 추가 PR (#296-#301) + emoji 영구 폐기 결정.

### PR 누적 (10 PR squash 머지)

| # | PR | 핵심 |
|---|---|---|
| 1 | [#292](https://github.com/peterkwon248/linear-note-plot-/pull/292) | view-engine 4 viewMode (grid/list/board/gallery, v122→v126) |
| 2 | [#293](https://github.com/peterkwon248/linear-note-plot-/pull/293) | BookTable column-rich + checkbox (NotesTable 정합) |
| 3 | [#294](https://github.com/peterkwon248/linear-note-plot-/pull/294) | Kind-shape carries meaning (Lightning/Sparkle/PencilSimple + 색) |
| 4 | [#295](https://github.com/peterkwon248/linear-note-plot-/pull/295) | SEED_BOOKS 8 demo books |
| 5 | [#296](https://github.com/peterkwon248/linear-note-plot-/pull/296) | v127 migration backfill (기존 사용자에도 seed inject) |
| 6 | [#297](https://github.com/peterkwon248/linear-note-plot-/pull/297) | Polish 1 (emoji/properties/groupBy validation, v128) |
| 7 | [#298](https://github.com/peterkwon248/linear-note-plot-/pull/298) | **emoji 영구 폐기** (Phosphor BookKindIcon 통일, v129) |
| 8 | [#299](https://github.com/peterkwon248/linear-note-plot-/pull/299) | Polish 2 (chip 색 + filter icon + Save view) |
| 9 | [#300](https://github.com/peterkwon248/linear-note-plot-/pull/300) | Pin 통일 (Books floating + Notes pin) |
| 10 | [#301](https://github.com/peterkwon248/linear-note-plot-/pull/301) | Pin indicator (Notes/Wiki title 옆) |

### 큰 결정 (영구)

**1. emoji 영구 폐기 (PR #298 LOCKED)**:
- Apple/Unicode color emoji ↔ Phosphor outline 시스템 mismatch
- Plot icon 시스템 = Phosphor outline only (Linear-style)
- BookKindIcon이 cover 책임 (kind 표현)
- Book.coverEmoji 타입 보존 (round-trip), UI 안 읽음
- 미래 unique cover icon = Phosphor icon picker (Book.coverIcon 필드, follow-up)

**2. Books 자체 정체성 = kind 유지 (status 도입 X)**:
- 사용자 통찰: "config에 status 빼고 kind 넣기 = 이미 그렇게 됨"
- normalizeViewState books-specific validation (`CONTEXT_VALID_GROUP_BY.books = [none/kind/pinned/date]`)
- stale "status" 자동 reset
- kind config = Smart/Manual/Hybrid (derived)

**3. BookKindChip = StatusBadge 패턴 (색 + bg 18% + border 35% + icon + label)**:
- Smart: violet `#5E6AD2` / `#7C8AE7`
- Manual: muted-foreground (neutral)
- Hybrid: amber `#D97706` / `#f59e0b`
- BookKindIcon (leading)도 동일 색 + 모양

**4. Pin 통일 = 모든 entity 표준 (Notes/Wiki/Books)**:
- 우클릭 메뉴 + 플로팅 바 + inline indicator
- batch pin UX: mixed → pin (allPinned 시만 unpin)
- 위치 (현재 PR #301): title 옆. 사용자 마지막 시그널: **status chip 옆으로 이동 필요** (follow-up)

**5. Plot ViewHeader actions 표준 = Save view 버튼 (Trash chip 거부)**:
- Books trashed 책은 `/trash` 페이지 (2026-05-10 통합)
- Save view = 모든 entity 일관

**6. Books DisplayPanel properties 4 toggle**:
- Item count / Kind / Sources / Pin (사용자 column 자유도)
- BookTable에 column 정의 + renderCell 분기

**7. Books DisplayPanel groupingOptions = [none/kind/pinned]**:
- normalizeViewState books-specific validation으로 stale "status" 차단

### 기술 학습 (영구)

- **emoji 데이터 wipe migration 패턴**: 타입 필드 보존 (round-trip) + `state.books.forEach(b => b.coverEmoji = null)` (UI는 무관)
- **CONTEXT_VALID_GROUP_BY map**: entity-specific validation을 normalize 단계에서 적용. `isGroupByValidForContext(g, ctx)` helper
- **store version bump = normalizeViewStatesMap 재실행 트리거**: migrate gate가 persisted version 기준. types union 확장 후에도 version bump 필요 (사용자 viewState 재normalize 위해)
- **id-dedup append backfill (v127 패턴)**: `existingIds.has(seed.id)` 확인 후 push. 사용자 기존 데이터 보존 + 누락 시드만 추가
- **BookKindChip vs BookKindIcon 분리**: chip은 색 + bg + 작은 icon (StatusBadge 패턴), leading icon은 모양만 (큰 size). 같은 row에서 둘 다 보여도 시각 분리 — 색이 분리 도구
- **Conflict resolve pattern**: 매 PR squash 후 base divergence. `git fetch + merge origin/main` → conflict 있으면 `git checkout --ours <file>` (HEAD 우선) → `git commit --no-edit`
- **dnd-kit BookFloatingBar inline**: 단순 entity는 floating bar를 BookTable 안 inline 정의 가능 (Notes FloatingActionBar처럼 별도 파일 추출 안 함)

### 다음 세션 P0

🔴 **Pin indicator 위치 fix** — Notes/Wiki status chip 옆으로 이동 (사용자 시그널 끝)
🟡 **Wiki 우클릭 메뉴 + 플로팅 바 Pin 추가** — PR #300 follow-up
🟢 **Books view-engine 시리즈 manual verify** — 회귀 발견 시 fix

### 환경 변경

- Store version v126 → v129 (3 step — v127 backfill, v128 groupBy validation, v129 emoji wipe)
- Tests: 255/255 (변화 없음)
- 신규 파일 (이번 세션 추가): `components/books/book-table.tsx` (BookTable + BookFloatingBar inline)
- launch.json `npx next` (한글 경로 안전성)
- BookKindChip / BookKindIcon (property-chips.tsx) — Plot status 패턴 정합

### Architect 검증

자동: tsc 0 errors + npm run build 0 / 0 + npm run test 255/255. 시각 verify는 사용자 manual.

---

## 🚀 2026-05-12 (마라톤) — Books view-engine 풀 통합 4 viewMode (Store v122 → v126, ~1200 LOC)

**범위**: 단일 worktree (`suspicious-williamson-3670e0`). 4 PR 시리즈 통합 squash 머지. Books entity가 view-engine pipeline에 완전 통합되어 grid/list/board/gallery 4 viewMode 지원.

### 큰 작업 요약

**1. PR 1 (v123) — 인프라 + grid 보존**
- `useBooksView` thin fork hook (8번째 thin fork, use-templates-view 패턴)
- `"books"` ViewContextKey + CONTEXT_DEFAULTS
- BooksGrid → useBooksView 통합. showTrashed → viewState.toggles persist
- 시각 변경 0 — grid 모드 보존, 인프라만 깔기

**2. PR 2 (v124) — list mode + sort/group/filter UI + 3 PropertyChip**
- SortField `itemCount`, FilterField `kind`/`sourceType` 추가
- `BOOKS_VIEW_CONFIG` (filter 4 cats + display config)
- 3 신규 chip: BookItemCountChip / BookKindChip (Lightning/PencilSimple/Sparkle) / BookSourceKindChip mini-bar
- `book-list-row.tsx` + `book-grid-card.tsx` 신규 (grid 카드 별도 분리)
- ViewHeader Search/Filter/Display popover 활성화
- pinned-first sort 활성화

**3. PR 3 (v125) — board mode (Option A: column drag + card drag)**
- GroupBy `kind`/`pinned` 추가
- `books-board.tsx` 신규 (320 LOC, dnd-kit) — NotesBoard 패턴 정합
- Column drag/reorder + groupOrder persist
- Card drag UX:
  - pinned column → 즉시 toggle
  - kind smart/hybrid → manual: confirm dialog (smartSources 제거)
  - kind manual → smart/hybrid: toast hint
- 3 column for kind (Smart/Hybrid/Manual), 2 column for pinned (Pinned/Others)

**4. PR 4 (v126) — gallery mode (entity-agnostic adapter)**
- `books-gallery-adapter.tsx` 신규 — Book → GalleryItem 매핑
- 2026-05-11 entity-agnostic GalleryView 재사용 (Notes/Wiki/References 일관)
- kind-based accent color (Smart=violet `#7C8AE7` / Hybrid=amber `#f59e0b` / Manual=slate `#94a3b8`)

**부속**:
- Plan: `.omc/plans/books-view-engine-integration.md` (~600 line, 15 sections)
- launch.json: `node next/dist/bin/next` → **`npx next`** (한글 경로 안전성)

### 큰 결정 (영구)

**1. 사용자 결정 4가지 (AskUserQuestion 2026-05-12) LOCKED**:
- PR 분할: C 점진 4 PR
- viewMode default: grid 유지 (cover emoji 활용)
- default sort: updatedAt desc 유지
- default groupBy: none (UI 옵션은 노출)

**2. Option A — Plot 일관성 풀 (column drag + card drag)**: Notes/Wiki와 동일 dnd-kit 패턴. 학습 부담 0. card drag의 destructive 행동은 confirmation으로 안전화.

**3. kind column card drag UX 분기**: 
- smart/hybrid → manual: confirm ("Remove N sources?")
- manual → smart/hybrid: toast hint (BookDetailPage 안내)
- pinned column: 즉시 toggle (안전)

**4. Smart Book INVARIANT 보존**: resolver / BookDetailPage / SourcesSection 동작 변화 0. view-engine 통합은 Books **list view 자체**만 변경.

**5. thin fork hook 영구 (Generic 추출 X)**: `useBooksView`가 8번째 thin fork. Notes pipeline 격리. "Scope guard" 헤더 주석.

**6. 마이그레이션 옵션 A 영구 (idempotent skip)**: 모든 4 store version (v123-v126) — 데이터 변경 0, types union 확장만. 기존 사용자 viewState 보존.

**7. BooksGalleryAdapter accent color kind-based**: 단순 entity-color 매핑보다 책 본질 (Smart/Hybrid/Manual) 반영. 의미적 시각 정체성.

### 기술 학습 (영구)

- **VALID_VIEW_CONTEXT_KEYS 확장만으로 자동 마이그레이션**: `normalizeViewStatesMap`이 진입 시 모든 valid key에 default 채움. 명시적 마이그레이션 코드 불필요.
- **store version bump는 boundary 표시 목적**: 데이터 모델 변경 시만 필수. types union 확장은 normalize가 처리.
- **NotesBoard column drag 패턴**: `SortableContext` + `horizontalListSortingStrategy` + `useSortable({ id: col-${key} })` + `useDroppable({ id: groupKey })` for cards. Books도 동일 적용.
- **dnd-kit DragOverlay**: 드래그 중인 카드의 visual 복제. Books의 BookBoardCardInner를 별도 함수로 두어 재사용.
- **확인 다이얼로그 + 토스트 분기 UX**: destructive (smart→manual) = confirm. non-destructive (manual→smart) = toast hint. 사용자 직관 부담 ↓.
- **launch.json `node` → `npx` 전환**: 한글 경로에서 node module resolution 일시적 실패 → npx PATH lookup으로 안정.
- **`.next/dev` stale cache**: build 시 종종 발생. dev server 재시작 또는 `rm -rf .next/dev .next/cache`.
- **GalleryView entity-agnostic 활용 가능성**: 2026-05-11 generic이 잘 작동. Books도 adapter 1개로 통합. 미래 entity 추가 시 동일 패턴.

### 다음 세션 P0

🔴 **Manual verify Books 4 viewMode** (TODO.md P0의 7-step 절차) — 사용자 직접 시각 확인 + 회귀 fix
🟡 Wiki 그룹 헤더 아이콘 (~30분)
🟢 다음 큰 트랙 (Smart Book v2 / Wiki view-engine board) brainstorm

### 환경 변경

- Store version v122 → v126 (4 step, 모두 idempotent / types union 확장)
- Tests: 255/255 (변화 없음)
- Build/TSC: 0 errors
- launch.json: `npx next` 기반
- 신규 파일 6개 (`use-books-view.ts`, `book-list-row.tsx`, `book-grid-card.tsx`, `books-board.tsx`, `books-gallery-adapter.tsx`, plan)

### Architect 검증

자동 verify: tsc + build + tests OK (255/255). dnd-kit visual verify는 사용자 manual 필수.

---

## 🚀 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic (27 files, 9 카테고리)

**범위**: 단일 worktree (`lucid-agnesi-b963f3`). 27 files (+735 / -847), 2 파일 삭제 (dual mode).

### 큰 작업 요약

**1. 책 UX 개선 4 fixes (이슈 2/3/4 + ←→ 단축키)**
- 책 목차 드롭다운 (BookContextNav): kind icon (Note cyan / BookOpen violet) + status icon (StatusShapeIcon / IconWikiStub/Article) 추가
- NoteEditor BookContextNav 우측 → 좌측 통일 (EditorBreadcrumb 옆)
- BookWikiReader "Books > Article Title" breadcrumb 추가
- Read mode 키보드 ←/→ 네비 (NoteEditor + BookWikiReader + SecondaryWikiArticle)

**2. 책 Split View 풀 지원 (이슈 1, ~4h)**
- SecondaryViewRouter에 /books + /books/{id} case 추가
- BookDetailPage pane-aware refactor (readingEntityId, cleanup pane-scoped)
- BooksView pane-aware (useActiveRoute ↔ useSecondaryRoute)
- layout.tsx `isEditingInTableView` (book route는 layout이 split panel 렌더)
- SecondaryPanelContent priority (books route > secondaryNoteId)
- 5 케이스 모두 동작 (같은 책 두 페이지, 다른 책 비교, 책 list + 메타, 메타 + reading, 같은 책 note+wiki)

**3. Dual mode 완전 폐기 (10 파일, Store v122 migration)**
- ViewMode + VALID_VIEW_MODES + view-configs supportedModes 정리
- DisplayPanel "Dual" 버튼 + isDualDisabled 로직 제거
- use-effective-view-mode.ts + dual-list-editor.tsx 파일 삭제
- ⌘⇧E Dual toggle 제거 (NoteEditor read/edit toggle만 유지)
- Store v122: viewMode === "dual" → "list" (viewStateByContext + savedViews idempotent)

**4. 갤러리 entity-agnostic 리디자인 (Notes + Wiki + References)**
- v3 mockup `u-*` 클래스 폐기 → Plot 토큰 (`bg-card`, `border-border`)
- Generic GalleryView (GalleryItem/GalleryGroup interface)
- 3 entity adapters (Notes/Wiki/References)
- Wiki + References supportedModes에 `"gallery"` 추가
- 클릭 = 풀 에디터 (preview pane → openNote)
- `.gallery-cover` CSS class (light/dark alpha 분기, `--cover-color` 변수)

**5. View-engine 그룹핑 + 그룹 헤더 아이콘 통일**
- Gallery 시간 그룹핑 폐기 → view-engine groupBy 활용 (status/label/folder/tag/family/priority)
- 그룹 헤더 아이콘: status=StatusShapeIcon, label=color dot, folder=Folder, tag=Hash, family=Tree
- Notes Table/Board/Gallery 모두 통일
- 버그 fix: notes-table GroupHeaderIcon `label.toLowerCase()` → `groupKey` (NoteStatus cast bug)

**6. NOTE_STATUS_COLORS stale CSS var 버그 fix**
- 기존: `var(--chart-2)` (cyan in dark) — 다크모드에서 stone이 cyan으로 보이던 버그
- 새: `var(--status-stone)` (#cbd5e1 slate-300 → toasted sand #e8d5a3)
- learnings.md의 v3 phase 1 의도와 코드 불일치 해소

**7. Status 색 강화 (다크 모드)**
- Stone: gray → toasted sand (warm earthy)
- `--status-stone` light `#c9a87c` / dark `#e8d5a3`
- Brick `#f59e0b` (dark), Keystone `#2dd4bf` (dark)
- 다크 캔버스에서 모든 status 가시성 강화

### 큰 결정 (영구, 이번 세션)

**1. Dual mode 폐기 LOCKED**: Split view + list mode + editor pane으로 충분. 중복 메커니즘 제거. v3 mockup의 결정이었지만 Plot 정체성과 충돌 — "Gentle by default" 위배. v122 migration으로 사용자 데이터 자동 fix.

**2. 갤러리 = entity-agnostic generic**: GalleryItem interface로 Note/Wiki/Reference 통합. 미래 entity 추가 시 adapter만 작성. v3 mockup CSS 클래스 (`u-*`) 영구 폐기 — Plot 디자인 토큰만 사용.

**3. 단일 클릭 = 풀 에디터 (Plot 표준)**: preview pane → openNote 변경. List/Board/Gallery 모두 일관.

**4. Books split view 풀 지원**: 5 케이스 모두 secondary pane 인프라 활용. URL은 primary 전유, secondary는 store-driven. `_interceptForSecondary` + PaneProvider 기존 인프라가 핵심.

**5. Stone 색 = toasted sand**: neutral gray(zinc)에서 자연 돌(sandstone) 색으로 변경. brick(orange)과 같은 따뜻한 군이지만 saturation 다름. keystone(teal)과 cool/warm contrast.

**6. 그룹 헤더 아이콘 view 간 통일**: list/board/gallery 모두 같은 (status shape / label color / folder icon). 학습 부담 0.

**7. 키보드 단축키 두 패턴 공존**: ⌘[/⌘] (modifier, Safari/Chrome 패턴) + plain ←/→ (read mode, Reader app 패턴) 모두 지원.

### 기술 학습 (영구)

- **NOTE_STATUS_COLORS stale CSS var bug** — `var(--chart-2)` 가리켰는데 globals.css에 `--status-stone` 별도 정의. 매핑 mismatch. 1줄 fix로 Plot 전체 stone 색 일관성 회복.
- **`e.target` window일 때 `closest` undefined** — synthetic `window.dispatchEvent` 시 target=window. Real keyboard input은 target=focused element. Optional chain `target.closest?.()` 방어.
- **WorkspaceEditorArea NotesTableView 전용** — split panel을 자체 처리. 다른 view (BooksView, WikiView 등)는 layout.tsx가 처리해야. `isEditingInTableView = isTableView && !!selectedNoteId`.
- **SecondaryPanelContent priority** — secondaryNoteId 우선이면 BookDetailPage가 unmount → cleanup이 bookContext 클리어. 책 라우트(`/books*`)는 secondary route 우선 처리해야 BookDetailPage가 reading mode 자체 처리.
- **notes-table GroupHeaderIcon label vs groupKey** — label은 display alias ("Block" for keystone), groupKey는 raw value. NoteStatus cast 시 groupKey 필수. label.toLowerCase() 패턴은 잠재 버그.
- **CSS-aware color via color-mix + custom property** — 인라인 style은 dark variant 불가. `.gallery-cover` 클래스 + `--cover-color` 변수로 light/dark 분기. Plot 토큰 패턴 정합.

---

## 🚀 2026-05-10 (마라톤) — Phase A polish + Smart Book Phase A + 책 reading flow (33 files, 9 작업 + 12 polish steps)

**범위**: 단일 worktree (`distracted-heyrovsky-f06ba0`)에 누적. 33 files (+1289 / -187), 4 신규 파일.

### 큰 작업 요약

**1. UI 버그/UX 5 fixes**
- /trash 페이지에 Books entity 통합 (`components/notes-table.tsx`)
- Path B Step A: globals.css `.a-th, .a-row` 6-col grid hardcoded 제거 (chrome-only)
- Dual mode pane gating + i18n: 한글→영어 5 strings + secondary pane dual 비활성 (PRD §LOCKED #9)
- ⌘⇧E pane-aware: secondary focus면 no-op + toast hint
- DisplayPanel "Dual" 버튼 disabled in secondary (3-layer closure)

**2. Smart Book PRD 작성**
- `.omc/plans/smart-book-prd.md` (656 line, 12 LOCKED decisions)
- draft → revision (BLOCKING 3 + recommended 7) → 2x critic 통과
- INVARIANT: AutoSource는 공급원, BookItem kind는 note/wiki/chapter-heading만

**3. Smart Book Phase A 10 sub-steps 완성**
- Step 1: Schema (AutoSource type) + Store API (5 methods, dedup guard) + v121 migration + 11 tests
- Step 2.1: Resolver pure function (folder source only, multi-source dedup) + 14 tests
- Step 2.2: BookDetailPage 통합 (resolver useMemo + drag/up-down auto guard)
- Step 2.3: SourcesSection UI (folder picker + add/remove)
- Step 2.4: AddItemDialog "Smart" 탭
- Step 2.5: BookItemRow source-aware (visual + remove branch)
- Step 2.6 (Tweak A): empty source heading hide
- Step 2.7 (Tweak B): manual override source badge
- Step 2.8 (Tweak C): folder picker preview count
- Step 2.9: In-book navigation includes auto items (`resolvedContentItems`)

**4. 책 reading flow 도입 (Step 2.10~2.21)**
- Read button + read mode + Linear ←→ navigation + TOC dropdown
- BookDetailPage가 NoteEditor / BookWikiReader 직접 mount (URL `/books/{id}` 유지)
- BookWikiReader full chrome (Aa font / collapse / WikiLayoutToggle / Edit/Done)
- max-w 풀폭 default + sub-route fallback double-mount fix (50% → 100%)

### 큰 결정 (영구, 이번 세션)

**1. Plot 모토 = 풀페이지 default**: max-w 제한 없이 본문 풀폭. 우측 SmartSidePanel은 opt-in (⌘B). NotesView/WikiView/BookDetailPage 통일.

**2. Books reading flow 패턴**: /books/{id} URL 유지 + BookDetailPage가 NoteEditor / WikiArticleView 직접 mount. Cleanup unmount 시 bookContext + selectedNoteId clear.

**3. layout.tsx isViewRoute sub-route 포함**: `/books/{id}`, `/library/*` 같은 sub-route를 view-route로 인정 → fallback children div 동시 mount 방지 (50% 폭 stealing fix).

**4. Empty infobox 자동 hide**: read 모드 + 콘텐츠 비어있으면 infobox rail 숨김. 본문이 22% 회수.

**5. Smart Book INVARIANT**: AutoSource = "어디서(공급원)", 멤버 kind 아님. 모든 source는 note/wiki만 filter.

**6. PRD §LOCKED #9 3-layer 일관**: 시각 fallback + 입력 가드 (⌘⇧E) + UI 가드 (Dual 버튼) — defense-in-depth.

### 기술 학습 (영구)

- **flex item에 `w-full flex-1` 필수** — 누락 시 contents 폭만 차지 (intrinsic width). BookWikiReader가 81%만 차지하던 진짜 원인
- **Layout fallback double-mount 패턴** — `isFallback` 정의에서 sub-route 누락 시 children + view 동시 visible → flex-1 50%씩
- **Resolver fractional key seeding** — `lastManualOrder` 추출 후 auto 시퀀스 → manual top + auto bottom 자연 보장
- **Multi-source dedup** — `seenAutoRefIds` Set으로 첫 source 우선
- **데이터 모델 silent assumption 위험**:
  - `Folder.noteIds` 없음 (Note.folderIds reverse N:M)
  - `WikiArticle.categoryIds: string[]` (DAG 다중 부모)
  - `Folder.kind = "note" | "wiki"` (둘 다 X)
  - Folder + WikiArticle 모두 hard-delete only
- **PRD critic agent 2회 가치** — silent assumption catch (Plot codebase 직접 검증으로)
- **HMR 한계** — 큰 파일 변경 시 HMR 못 잡고 stale view 표시 → dev server 재시작 또는 hard reload (Ctrl+Shift+R)

### 환경 변경

- Store version 120 → 121 (Smart Book: smartSources/excludeIds defaults)
- 신규 파일 4: `smart-book-prd.md`, `resolver.ts`, `resolver.test.ts`, `sources-section.tsx`
- Tests: 246 → 255 (+9 utils tests, 14 resolver tests, 11 books-slice tests)
- Build/TSC: 모두 ✅ pass
- Architect 7회 검증 통과

### 다음 세션 P0 (사용자 명시)

1. **Close 버튼** — 위키에만 있는데 노트에도 추가할지 vs 그냥 없애기 (의논)
2. **Books 뒤로가기 별로** — 위키처럼 타이틀 헤더 아래 sub-nav 패턴 (`← All / Articles / Stubs`) 적용 검토
3. **Books 리스트 무조건 그리드** — list mode/grid mode 통일 검토
4. **Edit 버튼 색상/폰트** — 책 안 wiki reading의 Edit 버튼이 일반 wiki view와 색상/사이즈 다름 → 통일

---

## 🚀 2026-05-09 (마라톤) — Book entity + Dual mode + Filter Path A 완전 종결 (~45 변경, 2 PRD, 단일 PR)

**범위**: 하루에 polish 시리즈 + Path A 완성 + 두 큰 entity 도입 (Book + Dual mode) + plugin install. 단일 squash PR로 머지 예정.

### 큰 작업 요약 (~45개 변경)

**Polish + cleanup (12개)**
- StatusShapeIcon `Cuboid` → `Cuboid2x2` 통일
- `.a-row__icon` + `.a-stchip` chip 가시성 12% → 24% (라이트모드)
- Wiki list leading icon `.a-row__icon` chip wrapper 추가
- Studio + Editorial 제거 + migration v119 (영구 규칙 #1 cleanup)
- ViewSwitcher 제거 → Display popover [List|Board|Gallery] 3-segment
- 사이드바 active icon 공간별 색상 (`data-active-space` + 6 space CSS 매핑)
- Stone/Brick/Block 헤더 status 아이콘 분기 (FileText → Hexagon/Cube/Cuboid2x2)
- Wiki article 헤더 stub/article 아이콘 분기 (BookOpen → IconWikiStub/Article)
- Inbox 라우팅 home space (`inferSpace` `/inbox` → `home`)
- Inbox B1+B2+B3 (max-width + count chip + Next-up 카드)
- Home sidebar 보강 (Pinned + Recent cross-entity Note+Wiki+Book)
- PanelsMenu 미니어처 (4-region SVG, panel별 layout 시각화)
- Old Cuboid (1×2) `components/icons/Cuboid.tsx` 삭제 + Notes config Cuboid2x2 통일

**Filter coverage Path A 완전 종결 (6 entity)**
- Step 1: Files type filter (image/url/file)
- Step 2: References type filter (link/citation)
- Step 3: Wiki Category status filter (has-articles/empty) + tier value fix
- Step 4: Tags color filter (set/unset)
- Step 5: Inbox source filter (5 InboxItemKind)
- Bonus: Sticker memberStatus + memberKind (7-kind)

**Book entity 도입 (PRD + Critic + Phase 1-4 + 통합)**
- PRD: `.omc/plans/book-entity-prd.md` (revised v1.1, 6 critic issues 반영)
- Phase 1: Data infra — Book/BookItem types + BooksSlice + 25 vitest tests + IDB v120 migration + `fractional-indexing` package
- Phase 2: ActivityBar 7th space (Wiki와 Calendar 사이) + /books route + Burgundy 색 `#be123c` + sidebar
- Phase 3: Manual book view — books grid + BookDetailPage + dnd-kit drag/↑↓ reorder + AddItemDialog + chapter heading insert + dropdown context menu
- Phase 4: In-book navigation — `N/M ↑↓` counter + breadcrumb + ⌘[/⌘] 단축키 + pane-scoped bookContext (primary/secondary)
- "In Books" 섹션 (note/wiki detail panel — 공용 InBooksSection 컴포넌트)
- Book pin → Home Quicklinks 통합 (mixed-quicklinks book + sidebar HomePinnedItem)
- Book trash UI 통합 (showTrashed toggle + restore/forever-delete)
- Books 색상 burgundy (#be123c rose-700, 6 다른 space와 distinct)

**Dual mode 도입 (PRD + Critic + Phase 1-3+5+6, Books skip locked)**
- PRD: `.omc/plans/split-mode-prd.md` (revised v1.1, 6 critic issues 반영)
- 핵심: 이름 "Split" → "Dual" rename — 기존 NoteSplitOverlay와 충돌 회피
- Phase 1: 인프라 — DualListEditor (autoSaveId, controlled X) + useEffectiveViewMode (SSR-safe, transition-only debounced toast) + ⌘⇧E 단축키 + UI slice (dualSelection flat, dualRatio)
- Phase 2: Notes view 통합 — DisplayPanel "Dual" entry + NotesTable dualMode + NoteEditor reuse
- Phase 3: Wiki view 통합 — WikiList dualMode + WikiArticleView reuse (sub-modes 우선순위 보존)
- Phase 4: Books skip — LOCKED (자체가 list 구조)
- Phase 5: References 통합 — ReferenceDetailPanel reuse
- Phase 6: Polish — 키보드 ↑↓ navigation (Notes/Wiki/References) + DefaultEmptyState 강화 (⌘⇧E hint) + Display button title hint
- Mail-client 패턴 5-pane (AB / SB / List / Editor / Detail), 1200px viewport fallback

**Plugin install**
- plot-frontend 글로벌 등록 (~/claude-plugins/plot-frontend-plugin/ + known_marketplaces.json + settings.json)
- 다음 세션부터 자동 활성: 3 skills (production-ui-refiner, mockup-faithful-implementation, frontend-orchestrator) + 4 hooks + 4 commands

**Bug fixes**
- FilterRule.op → operator typo fix (References filter)
- VALID_VIEW_MODES runtime validator 누락 — Critic이 Dual PRD에서 발견 (TS union만으론 부족, IDB hydration 시 silent fallback 위험)

### 큰 결정 (영구)

**1. Books 색상 = Burgundy `#be123c`**:
- 6 기존 space (cyan/violet/teal/pink/amber/indigo)와 distinct
- Plot 2.0 docs에 이미 정의된 rose-700과 정합
- 책 표지 가죽 메타포

**2. Book = cross-entity ordered sequence (Note + Wiki MVP)**:
- 4사분면 컨테이너 모델 마지막 자리 채움
- Heading-as-divider 단일 모델 (flat + nested 자연스럽게 통합)
- N:M 다중 멤버십, 책 내 dedup
- fractional-indexing string order (sparse integer 대신 underflow 회피)
- Smart Book = AutoSource는 v2 (별도 PRD)

**3. Dual mode = "Split" 이름 회피**:
- 기존 NoteSplitOverlay (`lib/note-split-mode.ts`)와 이름 충돌
- "Dual"로 rename → "main viewport을 list+editor로 분할" 의미
- NoteSplitOverlay 우선순위 (z-40 overlay, dual mode 시각 suppressed but state 보존)

**4. Filter coverage Path A 완성 — 6 entity**:
- Files / References / Wiki Category / Tags / Inbox / Stickers
- 모든 필터 view-engine config + applyXxxFilters Stage 통일 패턴
- Plan §11.2 우선순위 모두 적용

**5. Plot 사이드바 active icon = 공간별 색상**:
- 이전: 모든 공간에서 cyan (notes 색) hardcoded
- 지금: `data-active-space` attribute 기반 6 공간 CSS 매핑

### 기술 학습

- **fractional-indexing 패턴**: sparse integer halving 대신 lexicographic key (`generateKeyBetween`). 50회 같은 위치 insert 후 underflow 회피. ~5-10 bytes 추가 storage.
- **VALID_VIEW_MODES runtime validator**: TS union만 update하면 IDB hydration 시 silent fallback. 두 곳 같이 update 필수.
- **autoSaveId pattern**: `react-resizable-panels`의 `defaultSize` controlled 시 안 작동 (uncontrolled). `autoSaveId`로 라이브러리 자체 persistence 활용.
- **SSR-safe hook**: `mounted` state guard로 hydration mismatch 회피. `transition-only` debounced toast로 resize spam 방지.
- **Pane-scoped state**: bookContext (primary/secondary 독립). Plot의 SmartSidePanel dual pane 인프라와 정합.
- **Critic agent 가치**: 두 PRD (Book + Dual) 모두 6 issues씩 정확히 잡음. PRD 신선할 때 review = mid-implementation pivot 위험 회피.

### Phase별 미완 (다음 세션 후보)

- Smart Book (Phase 5) — AutoSource resolver, 별도 PRD 필요 (~4-5h)
- /trash 페이지 books section 통합 (notes-table refactor, ~1h)
- Path B Step A — globals.css `.a-th/.a-row` 6-col grid hardcoded refactor (~1.5h)
- 나무위키 인포박스 고도화 Tier 1 — 대표 이미지+캡션, 헤더 색상 테마, 접기/펼치기 (~3-4h)
- 다중 기기 sync Phase 1 (PRD LOCKED, ~몇 세션)

### 환경 변경
- Store version 119 → 120 (v120 = Books migration)
- npm 패키지 추가: `fractional-indexing@^3.2.0`
- Plugin global install: `plot-frontend@plot-frontend` (~/claude-plugins/)

---

## 🚀 2026-05-08 (오후) — Status icons + Phase 4.3 chrome 통일 (시도→revert→정리) + Filter coverage plan (5 PR + docs sync)

**범위**: 사용자 회귀 발견 (PR 4.3a `.a-row` grid 충돌) + 즉시 fix. Phase 4 north star (filter model 통찰) 명문화. 4.3 chrome 통일은 globals.css refactor prerequisite.

### 머지된 PRs (이번 세션, 5 PR + docs sync)
- **PR #271** (claude/status-icons-metaphor): Status icons + UI 라벨 "Keystone" → "Block" + Cuboid (1×2 isometric block) + Save view button icon-only 16px (HBtn pattern). 4 atomic commits + merge resolution (origin/main 25+ commits behind).
- **PR #282** (claude/v3-phase-4-3): PR 4.3a Tags+Labels chrome 통일 시도. `.a-th` + `.a-row` 적용.
- **PR #283** (claude/v3-phase-4-3a-fix): PR #282 partial revert. `.a-row`가 globals.css에서 6-column grid 강제로 layout 깨짐 (`#Knowledge Management` 두 줄 wrap + ~90px dead space).
- **PR #284** (claude/v3-phase-4-3a-fix-2): Tags row `border-b border/50` 제거 (Notes/Labels 패턴 일관) + plan update Section 9-10 (lessons + revised roadmap).
- **PR #285** (claude/v3-phase-4-3-plan-filter-coverage): plan Section 11 — Filter coverage 분석 (entity별 도메인 + Step 1-5 series).
- **(docs sync PR)**: NEXT-ACTION / SESSION-LOG / MEMORY (이 entry) / TODO / CONTEXT 5/8 진척 반영.

### 큰 결정 (영구)

**1. Filter model 통찰 (사용자 직관)**:
```
LIST/TABLE: column = passive attribute view, Filter button = active narrow
BOARD:      column = grouping attribute, Filter button = other axis
GRID:       card chip = attribute viz, Filter button = chip narrow
```
- Filter 없는 view = 도메인 attribute 부족 (column 자체가 단순)
- column 추가 시 Filter도 자연스레 가능 (Tags color, Files type 등)
- **이 model이 PR 4.3 chrome 통일의 north star** — 단순 visual 통일이 아닌 filter/column model 통일

**2. NoteStatus enum value `keystone` 유지** (UI 라벨만 "Block"):
- internal `keystone` 그대로 (URL `/keystone`, IDB key, type literal)
- 이유: AddBlock / BlockTree / ContentBlock 등 기존 `block` identifier와 충돌 회피
- mismatch는 디버그 콘솔 + URL bar에 한정 (사용자 영향 X)
- 영구 결정

**3. Cuboid 컴포넌트 신규** (`components/icons/Cuboid.tsx`):
- 두 큐브가 한 면을 공유한 1×2 isometric block (직육면체)
- 단일 SVG, 11 line elements (outer hexagon 6 + Y junction 3 + cube divider 2)
- Pre-computed isometric vertices (256 viewBox + 16px padding) — 수정 금지 (격자 정렬)
- Phosphor wrapper 인터페이스 (size / weight / color / mirrored)
- IconBlock = 단순 wrapper (`<Cuboid weight="regular" />`)

**4. View modes 평가** (사용자 회의 직관):
- **Studio + Editorial**: 영구 규칙 #1 위반 ("멋진 레이아웃 / 시각적 다양성 방향 제안 금지") + TODO 폐기 항목 ("매거진 pivot 폐기 2026-04-22") 부활 → **제거 예정** (Path C)
- **Gallery**: 카드 형태 자체는 좋음. 단 (1) 편집 불가 read-only (2) 하드코딩 styling (cream 강제, Plot tokens 무시) → **polishing 후 재도입** (Path D)
- 통합 방향: Display popover `[List | Board | Gallery]` 3-segment + ViewSwitcher tab 제거

**5. `.a-th, .a-row` grid hardcoded 발견**:
- globals.css에서 `display: grid; grid-template-columns: minmax(0, 2.4fr) minmax(0, 1.3fr) 110px 90px 70px 80px;` (notes-table 6-column 강제)
- NotesTable은 inline grid로 덮어씀 → OK / 다른 view (3-element flex)는 layout 깨짐
- **refactor 필요**: chrome-only 분리 (height/border/sticky/bg/font-size) + grid는 consumer 책임 (Path B Step A)

**6. Filter coverage 도메인 분석**:
- 명확 가치 (높음): Files (type), References (type), Wiki Category (보강), Inbox (source)
- 일관성 추가 (중간): Tags / Labels color, Stickers
- Filter 없는 게 자연스러움: Insights (analytics)
- **Step 1-5 series** — view-engine config 변경만 (chrome refactor와 독립, 병렬 PR 가능)

### v3 PRD 영향
- Phase 4.3 분해 정정: chrome 통일 prerequisite (globals.css refactor) + Filter coverage 보강 (Step 1-5)
- Phase 5 재검토: Studio/Editorial 제거 + Gallery polish 후 재도입

### 다음 우선순위 (P0)
1. **Path A Step 1** — Files type filter (가장 작고 명확) ⭐ 추천
2. **Path B Step A** — globals.css `.a-th/.a-row` refactor (chrome 통일 prerequisite)
3. **Path C** — Studio + Editorial 제거 (영구 규칙 위반 cleanup)
4. **Path A Step 2-3** — References / Wiki Category filter

### 이번 세션 기술 학습
- **PR cycle (#282 → #283 → #284)**: 시도 → revert → 정리. globals.css 구조 문제는 단순 className 추가로 해결 안 됨 — 깊은 refactor 필요. 사용자 visual feedback이 가장 빠른 진단 path.
- **NoteStatus rename 회피 결정**: 53 files atomic rename + IDB v118 + route redirect 큰 작업 회피. UI 라벨만 변경으로 90% 가치 + 10% 작업.
- **Filter model 통찰 → roadmap**: 사용자 직관 ("필터/디스플레이 다 있어야 되는 거 아니냐")이 phase 4.3 진짜 의미를 명확화. 단순 visual 통일 X, **filter/column model 통일**.
- **PR 머지 시 충돌 대응**: origin/main 25+ commits behind 시 view-header.tsx / home-view.tsx 등 자주 변경되는 파일에서 충돌. 머지 commit + 충돌 해결 + push의 표준 절차 수립.

### 아직 PR 안 한 작업물 (이번 세션 untracked, secondary)
- `docs/status-icons-preview.html` (시안 HTML) — 작업물, 정리 권장
- `docs/WIKI-REDESIGN-INSTRUCTIONS.md`, `plot-wiki-collection-mockup.html`, `plot-wiki-full-flow.html` — 3/19 작성 mockup, 별 의미 없음 (정리 또는 .gitignore)

### Plan 문서 보존
- `.omc/plans/v3-phase-4-3-decompose.md` — Section 9-11 핵심 (Lessons + Roadmap chrome + Filter coverage)
- `.omc/plans/v3-phase-4-decompose.md` — Phase 4 원본

---

## 🚀 2026-05-07 (밤) — Mockup 직접 서빙 + PanelsMenu 통합 (PR #281)

**범위**: 이전 after-work 후 사용자와 큰 토론. mockup HTML을 dev server에 직접 서빙해서 내가 직접 작동시켜 인터랙션 분석. 발견된 spec을 PR #281에 누적 5 commits로 적용.

### 큰 발견 (영구 인사이트)

**Mockup 직접 서빙 = 인터랙션 spec 추출 가능**:
- 이전엔 mockup JSX/CSS 코드만 읽음 → 인터랙션 spec 누락
- `npx serve docs/v3-mockup/ -l 3003` + preview MCP로 직접 작동 확인
- 다른 Claude 인스턴스 만들기 ≠ 빠름 (같은 한계 + 시간 두 배)
- **나에게 mockup 작동을 보여주는 것이 진짜 답**

### 추출된 mockup 인터랙션 spec
- **4-panel toggle 시스템**: actbar / sidebar / list / detail 각자 독립
- **Edge re-open button**: collapsed 시 chevron right
- **Popover preset**: "Show all" / "Hide all" 통합 menu
- **단축키**: ⌘⇧\ (actbar) / ⌘\ (sidebar) — Plot ⌘\ 충돌
- **`.a-shell` grid**: CSS var driven (`--a-actbar-w` 등) + 0.18s ease 트랜지션
- **Filter popover**: Linear-style 2-column (왼: filter type, 오: checkbox)

### PR #281 누적 (5 commits)
1. `bb3f36c` Activity bar collapse + edge re-open (분산 패턴, 5에서 통합으로 교체)
2. `a6e7a9e` Save view 단어 제거 (모든 view 플로피 icon만)
3. `3224e9d` ⌘⇧A 단축키 (actbar collapse 토글)
4. `c17c0aa` **PanelsMenu (햄버거) 신규** — mockup spec 정확 적용
   - 분산 close button (actbar X / sidebar) → 통합 햄버거 menu
   - Popover with Activity bar / Sidebar / Detail 체크박스 + Show all / Hide all preset

### 영구 결정 (이번 세션)
1. **Mockup-first 한계 패턴**: layout/cell mockup, typography/badges/spacing은 Plot 우선
2. **Mockup 직접 서빙으로 인터랙션 분석** (별도 Claude 인스턴스 X)
3. **PanelsMenu 통합** — 분산 close button 패턴 폐기, 통합 햄버거 menu
4. **단축키 정합 (Plot ↔ mockup 충돌 시 Plot 키 신규)**:
   - ⌘⇧F: sidebar (Plot 기존)
   - ⌘⇧A: activity bar (mockup ⌘⇧\ 충돌 회피)
   - ⌘B: side panel
5. **View modes / Display panel 통합 토론 → 보류** (사용자 결정: 그대로 유지)

### 사용자 통찰 (정리)
- "디자인만 가져오기, 기능은 살리자"
- "별도 Claude 만들기" 아이디어 → 한계 인정 → mockup 직접 서빙 채택
- "Save view 단어 빼라" → 모든 view 플로피 icon만
- "햄버거 menu 패턴 mockup처럼" → PanelsMenu 통합

### 다음 우선순위
- 🔴 PR #281 머지 (사용자 승인)
- 🟡 Phase 6 본 작업: Filter popover (Linear 2-column) + .a-shell grid layout
- 🟡 Phase 5.4 Graph (남은 view mode)
- 🟡 List/Detail panel collapse (PanelsMenu에 이미 있음, 시각 layout만)

---

## 🚀 2026-05-07 (저녁/밤) — v3 Phase 4.2 + Phase 5 4 PR + mockup-first 패턴 정착

**범위**: Inbox Layer 머지 후 v3 visual refresh 대규모 진행. notes-table reskin + Gallery + Studio + Editorial. 사용자와 mockup-first 한계 토론, Plot 정체성 보존 패턴 정착.

### 머지된 PRs
- **#276** v3 Phase 4.2 — notes-table.tsx reskin (.a-* row chip patterns)
- **#277** v3 Phase 5.1 — Gallery view (mockup wow factor #1, warm canvas + cards)
- **#278** v3 Phase 5.1b — Table/Board .u-mode shell wrapper
- **#279** v3 Phase 5.2 + 7 fixes — Studio (dark forced + SRS) + mockup-first 보정 패턴
- **#280 OPEN** v3 Phase 5.3 — Editorial (Source Serif 4 magazine 룩)

### 큰 사용자 통찰 (영구 결정)

**1. mockup-first의 한계 명확화**:
- 사용자: "디자인만 가져오고 싶다, 기능은 살려라"
- mockup의 layout/structure/cell 패턴은 가져오되 **이미 잘 잡힌 Plot 디자인은 보존**
- mockup이 Plot 정체성을 무단 교체하면 안 됨

**2. mockup vs Plot 결정 매트릭스 (영구)**:
| 영역 | 정책 |
|------|------|
| Layout / structure / cell / shell | mockup ✅ |
| Card / chip 패턴 (.u-card, .a-row) | mockup ✅ |
| 다크 Studio / Source Serif 4 | mockup ✅ |
| Header typography | Plot 위키 정합 (mockup .a-th__cell 폐기) |
| Status badge | Plot StatusBadge (mockup .a-stchip 폐기) |
| Memo label | Plot 보존 (사용자 명시 "무조건") |
| Default columns | mockup-friendly + Plot folder 보존 |
| spacing (gap, padding) | Plot 정체성 우선 (위키 정합) |

**3. PR #279 7 fixes (Studio 외)**:
- Header `.a-th__cell` → 위키 typography (14px medium normal-case)
- Status chip → StatusBadge rollback
- Default visibleColumns → mockup 6 + Plot folder
- gap 16→8 (위키 wiki-list.tsx gap-2 정합)
- Title cell marginLeft -8 (gap 상쇄, 체크박스에 가깝게)
- padding 16→20 (헤더+row 체크박스 정렬)

### Phase 5 view modes (4 modes)

| Mode | 핵심 |
|------|------|
| 5.1 Gallery | warm canvas + oklch hue cards + Source Serif title |
| 5.2 Studio | dark forced + SRS segments + transport bar |
| 5.3 Editorial | magazine spread + drop cap + 2-column |
| 5.4 Graph (대기) | SVG deterministic positioning |

### 인프라 완성
- `lib/v3/note-helpers.ts` — getHueFromNoteId / getCoverGradient / getExcerpt / getSpread / getWordCount / getStudioSegments / roundFillTo01 / getSubtitle / extractParagraphs / getIssueNumber
- `components/views/view-switcher.tsx` — Table/Gallery/Studio/Editorial 4 buttons
- `components/views/{gallery,studio,editorial}-view.tsx` + `*-view-shell.tsx` (parallel pattern)
- `lib/view-engine/types.ts` — ViewMode union 4 modes 확장
- `app/globals.css` — `.u-vs / .u-mode / .u-gallery* / .u-card* / .u-studio* / .u-edit*` mockup CSS 그대로 이식

### Plot Q-decisions 적용 검증
- Q4 Studio dark forced ✅
- Q5 Editorial body = extractParagraphs runtime ✅
- Q9 Gallery hue = noteId hash ✅
- Q10 Editorial subtitle = note.summary ✅
- Q11 5-mode = Notes list만 ✅
- Q12 Studio segments = SRS 진행도 ✅
- Q13 ViewSwitcher = workspace header ✅

### 다음 우선순위
- 🔴 PR #280 머지 (사용자 승인)
- 🟡 Phase 5.4 Graph (마지막 view mode)
- 🟡 Phase 6 (Filter Popover + Workspace Chrome)
- 🟡 Phase 7 (QA + cleanup)

---

## 🚀 2026-05-07 (오후) — Phase B Inbox Layer 시리즈 완성 (4 PR) + 큰 방향 전환

**범위**: 새 worktree `magical-curie-ad6175`. Inbox layer 4 PR (3 머지 + 1 OPEN). entity-based → action-based 큰 방향 전환.

### 머지된 PRs
- **#272** (3019b37) — inbox infra (action-based dismiss/snooze + reminder source) + IDB v117 + plan v2
- **#273** (edd902b) — home inbox card with reminder source
- **#274** (7169eaf) — /inbox full-page + srs/snooze-expired sources + dismiss/snooze hover button
- **#275** (OPEN, 0043597) — sidebar entry + wiki-redlink/auto-enroll sources + InboxSourceIcon dedup

### 큰 방향 전환 (영구)

**v1 plan 폐기 → v2 action-based 채택**:
- v1: entity-based "stone + 미분류" 필터 = "정리 안 된 dashboard"
- 실측 발견: createNote가 항상 Memo label 자동 부여 + onRehydrate backfill → useInbox 항상 0 항목
- 사용자 통찰: "스톤은 인박스가 아니야. 기존 인박스가 스톤으로 이름이 바뀐 건데. 아예 없던 인박스 개념을 새로 만들어내는 거야. 리니어의 인박스처럼."
- v2: action notification queue (Linear 정합) — "내가 *반응*해야 할 일들"

### 5 sources 완성 (action-based)

| Source | 데이터 | 의미 |
|--------|--------|------|
| 🔔 reminder | Note.reviewAt | 사용자 명시 due 도래 (today + overdue) |
| 🧠 srs | srsStateByNoteId.dueAt | SRS 리뷰 도래 |
| ⏰ snooze-expired | snoozedInboxItems | 사용자 snooze 만료 항목 재노출 |
| 🔗 wiki-redlink | linksOut + wikiArticles | unresolved [[wiki-link]] (refs >= 2) |
| 💡 auto-enroll | clusterSuggestions | wiki 자동 등재 제안 (status === pending) |

### 핵심 인프라
- `lib/store/slices/inbox.ts` — `InboxItemKind` type + dismiss/snooze actions (5 actions)
- `lib/hooks/use-inbox.ts` — useInbox() unified hook, 5 sources, dedup/snooze 필터
- `components/inbox/inbox-source-icon.tsx` — kind→icon 공용 매핑 (Bell/Brain/MoonStars/LinkBreak/Sparkle)
- `components/views/inbox-view.tsx` — full-page (filter tabs + hover dismiss/snooze + popover)
- IDB v117 migration (idempotent — Array.isArray 가드)

### 영구 결정
1. **Inbox = action notification queue** — entity-based 폐기. Linear 정합.
2. **dismiss/snooze identifier = (kind, sourceId)** — 안정적 키, 5 source 호환
3. **InboxItemKind ≠ EntityKind** — kind는 "왜 inbox에 있는가" (action source), entity 분류 아님
4. **wiki-redlink threshold = 2** — noise 방지
5. **clusterSuggestions filter = "pending"만** — accepted/dismissed 제외
6. **Sidebar Inbox link = Home space만** — 다른 space와 분리

### 기술 학습
- **Memo backfill 함정**: createNote가 항상 Memo 자동 부여 + onRehydrate backfill — entity-based "no label" 필터 무효화. 영구 정책으로 알려둘 것
- **VIEW_ROUTES 등록 필수**: 새 always-mounted route는 `lib/table-route.ts`의 VIEW_ROUTES에 추가 필수 (designer 누락 사례)
- **Fast Refresh hook 순서 변경**: hook 추가 시 full reload 발생 — 정상 (HMR 한계)
- **InboxItemKind 분리**: EntityKind와 명확 구분 — semantic 명확화

### Architect 검증 결과
- PR #272: APPROVED (3 Low concerns, inbox-3에서 처리)
- PR #273: APPROVED (3 Low concerns, inbox-4에서 처리)
- PR #274: APPROVED (2 Low concerns, inbox-4에서 처리)
- PR #275: APPROVED (concerns 없음)

### Phase B 시리즈 완성 🎉
Linear-style action queue 완성. dismiss/snooze/undo/popover 모두 작동. 5 sources 통합. Plot "Gentle by default" + Linear UX 패턴 정합.

### 다음 우선순위
- 🟡 Phase 4 PR 4.2+ (notes-table.tsx reskin, stone/brick/keystone 명칭)
- 🟡 Wiki template 3-layer
- 🟡 Smart Book v2 (AutoSource[5])
- 🟢 (옵션) Inbox-5: SRS review mode 진입, mobile, grouping by date

---

## 🚀 2026-05-08 (새벽) — NoteStatus rename + Inbox layer 큰 결정 (plan 작성)

**범위**: 새 worktree `note-status-rename`. PR 4.1 (Phase 4 CSS 통합) 머지 + 2 plan 작성. 작업은 다음 세션.

### 머지된 PRs
- **#267** (PR 4.1 — claude/v3-phase-4-plan): feat(v3-phase-4-1) table mode CSS 통합 (`.a-table` / `.a-row` / `.a-th` / `.a-tg` / `.a-stchip` / `.a-tag` / `.a-tool`). 시각 변경 0. +487 LOC.

### Plan 파일 작성 (작업은 다음 세션)
- `.omc/plans/note-status-rename.md` — Phase A: NoteStatus 단순 atomic rename (53 files / 274 occ + IDB v116 migration)
- `.omc/plans/inbox-layer.md` — Phase B: 단일 통합 Inbox layer (4-5 PR, 새 기능)

### 큰 결정 (영구)

**1. NoteStatus 명칭 변경 (Phase A)**:
- `inbox/capture/permanent` → **`stone/brick/keystone`** (건축 메타포)
- 의미 progression 유지 (raw → processed → keystone). 색 동일 (Q3 LOCKED).
- 단일 atomic PR (분리 시 컴파일 에러). 6 commits in 1 PR.
- IDB v116 migration. route redirect (`/inbox` → `/stone` 등)

**2. Inbox 개념 분리 (Phase B)**:
- inbox는 NoteStatus enum이 아니라 **별도 layer** (Linear / Things3 패턴)
- 새 의미: "처리 대기" 알림함

**3. 단일 통합 Inbox** (per-entity 분산 X):
- 하나의 inbox = Notes/Wiki/Book/Reference/Files 모두 통합
- Plot 정체성 ("Gentle by default") + IKEA 전략 + Linear/Things3 패턴 정합
- per-entity 분산 = 사용자 부담 ↑

**4. Inbox 위치**: Home 안 카드 + `/inbox` full-page
- v3 11결정 #1 (7-space) 보존
- top-level activity bar 8번째 X

**5. Inbox 정의**: 하이브리드
- 자동 entity별 필터 default + 사용자 dismiss/snooze
- entity별 자동 필터:
  - Notes: stone + 미분류
  - Wiki: stub status
  - Reference: 미링크
  - Files: 미분류
  - (옵션) SRS: scheduled review 도래

### v3 PRD 영향
- Phase 5 적용 범위 변경: `/notes, /inbox, /capture, /permanent, ...` → `/notes, /stone, /brick, /keystone, ...`. `/inbox` 제거 (별도 layer).
- v3 mockup의 inbox/capture/permanent → stone/brick/keystone로 적용. inbox layer는 mockup 외 신규 디자인.

### 다음 우선순위 (P0)
1. **🔴 Phase A**: NoteStatus rename (atomic 단일 PR, executor agent 위임 권장)
2. **🟡 Phase B**: Inbox layer (4-5 PR, Phase A 완료 후)
3. **🟢 Phase 4 재개**: PR 4.2 notes-table.tsx reskin (새 명칭 사용)

### 이번 세션 기술 학습
- **plan-only 세션 패턴**: 큰 결정사항 명확히 docs에 박은 후 다음 세션에서 작업. 작업 원칙 #4 (사용자 reproduce 정보 우선) 정합.
- **Atomic rename 원리**: 53 files / 274 occ는 분리 시 컴파일 에러. 단일 PR이 안전.
- **Per-entity vs 통합 inbox**: 단일 통합이 Plot 정체성 + UX 인지 부하 최적.

---

## 🚀 2026-05-07 (밤 늦게) — Plot v3 Phase 3 완료 (4 PR — Activity Bar / Sidebar Chrome reskin)

**범위**: 새 worktree `v3-phase-3-plan` 생성 + Phase 3 분해 plan + 4 PR 완료. Activity Bar (72px) + Sidebar (`.a-sb-*` 패턴) + Brand mark (Plot 로고 SVG) v3 mockup 적용.

### 머지된 PRs
- **98f9277** PR 3.1 — CSS 통합. `.a-actbar` / `.a-sidebar` / `.a-sb-*` (link / section / head / hint / search / scroll / foot / link__count / link__dot) / `.a-icb` / `.a-kbd` / `.a-detail` / `.a-shell` 통합. `--sidebar-fg` alias + shell vars 추가. **시각 변경 0**. +729 LOC.
- **5ac22ef** PR 3.2 — activity-bar.tsx reskin. width 44→72px, label permanent, brand mark, active 표시 변경. **Plot 6-space 색 보존** (mockup 단일 cyan → SPACE_COLORS 6색 inline override).
- **8155530** PR 3.3 — linear-sidebar.tsx reskin. NavLink + Section + 11 inline button 일괄 (`.a-sb-link[data-active]` + `.a-sb-section + head + hint`). +43/-61 (코드 18줄 감소!).
- **3761e42** PR 3.4 — brand mark을 Plot 로고 SVG 교체 (네트워크 그래프 6 nodes + 10 edges + 강조 center node = "central knowledge node" 메타포 — Zettelkasten × Palantir).

### 큰 결정 (영구)

**PR 3.4 scope 변경**:
- 원래 `.a-shell` shell layout grid → ResizablePanel + view-split + side panel과 충돌
- **결정**: brand mark SVG 교체로 전환. Shell grid는 Phase 6 (filter popover + workspace chrome)에서.

**Plot 6-space 색 보존 (activity bar)**:
- v3 mockup 단일 cyan → SPACE_COLORS 6색 inline override (color-mix bg + color + boxShadow)

**Sidebar 단일 cyan (visual confirm 후 결정)**:
- v3 `.a-sb-link[data-active] svg { color: var(--space-notes); }` 단일 cyan
- visual confirm 후 회귀로 판단되면 fix PR

### 외부 도구 평가 (영구 결정)
- **Front-End-Design-Checklist** (passive 5.2k): ❌ 적용 X. 4 design skills과 중복

### 이번 세션 기술 학습
- **새 worktree 생성**: `git worktree add ../<name> -b claude/<branch> origin/main` + EnterWorktree (path 인자)
- **Preview tool cwd cache**: EnterWorktree 후 preview_start cwd가 이전 worktree로 cache. workaround 한계 → 사용자 manual 권장
- **CSS 클래스 통합 패턴**: v3 mockup CSS를 globals.css 끝에 그대로 이식 + 부족 token alias만 추가. **시각 변경 0** PR로 다음 PR 안전성 확보
- **className replace_all**: 동일 substring 일괄 변경. 11 inline button 중 5개 정적 즉시 처리
- **Edit minimal diff 효과**: PR 3.3 +43/-61 (코드 18줄 감소). v3 패턴이 Tailwind utility 인라인보다 짧음

### 다음 우선순위
- 🔴 **Visual confirm** (사용자 manual `npm run dev`)
- 🟡 OK면: Phase 4 (Table reskin) 또는 Phase 5 (View Switcher) / Phase 6 (Filter + Shell grid)
- ⚠️ 회귀 시: fix PR (sidebar svg 색 6-space 별 등)

### Plan 문서 보존
- `.omc/plans/v3-phase-3-decompose.md` (이번 세션)

### Phase 진행 상황
- ✅ Phase 0: cleanup (v112)
- ✅ Phase 1: token foundation
- ⏸️ Phase 2: Imperial icon kit DEFER
- ✅ **Phase 3: Activity Bar / Sidebar Chrome** (이번)
- ⏳ Phase 4-7

---

## 🚀 2026-05-07 (밤) — Group C PR-D 5/5 완성 + 4 design skills install

**범위**: PR 3 Stickers (v113) + PR 4 References (v114) + PR 5 Files (v115) + skills install. Group C PR-D 시리즈 종료.

### 머지된 PRs (이번 세션, 모두 같은 worktree)
- **a055581 v113** — PR group-c-d-3 Stickers view-engine 통합. `stickers` ViewContextKey + useStickersView thin fork (~180 LOC, cross-entity members count) + StickerMemberCountChip (Stack icon) + STICKERS_LIST_VIEW_CONFIG + ViewMode list+grid + idempotent v113 migration. 9 files +427/-92.
- **c3700ad v114** — PR group-c-d-4 References view-engine 통합. 첫 non-Note entity. `references` ViewContextKey + useReferencesView thin fork (~155 LOC, caller가 pre-filtered Reference[] 전달, enrich + sort + group) + 3 신규 chips (RefTypeChip / RefFieldCountChip / RefImageChip) + REFERENCES_VIEW_CONFIG + Grid mode (image preview + title + content excerpt + chips). sort + viewMode → viewState. quickFilter / fieldKey filter / search 로컬 유지 (multi-state UI가 viewState.toggles boolean record에 안 맞음). 9 files +408/-43.
- **f210fcf v115** — PR group-c-d-5 Files view-engine 통합. media entity (Attachment image/url/file). `files` ViewContextKey + useFilesView thin fork (~135 LOC) + 2 신규 chips (FileTypeChip / FileSizeChip) + FILES_VIEW_CONFIG + Grid mode (4:3 thumbnail block + chip row) + column header sort "type" → "fileType" 명시 변환. 신규 SortField: size + fileType. 9 files +423/-39.

### 부수 fix (반복)
- `notes-table.tsx` SORT_FIELD_LABELS Record<SortField, string> exhaustive 매번 update — memberCount, fieldCount, size, fileType 추가 (PR 3/4/5). next build type error 방지.
- 로컬 type alias `SortDir` 제거 (사용처 0)

### 디자인 인프라 보강 (이번 세션)
- **0f7e2ec** — taste-skill 4개 install (project-level, `.agents/skills/`)
  - design-taste-frontend (Senior UI/UX, metric-based)
  - high-end-visual-design (agency-grade fonts/spacing/shadows)
  - redesign-existing-projects (v3 visual refresh와 정합)
  - minimalist-ui ("Gentle by default" 정합)
- universal symlink (Codex/Cursor/Copilot 등 12 agents 호환). Claude Code 자동 활성
- skills-lock.json (cross-machine sync). 새 머신: `npx skills experimental_install`로 symlink 재생성

### 외부 도구 평가 (영구 결정)
- **shadcn-ui**: ✅ 이미 적용 (components.json + 30+ 컴포넌트 + @radix-ui 28개). v3 PRD "shadcn cascade 보존" 명시
- **onlook** (visual code editor, 25.7k stars): ❌ Plot 부적합. production app 자동 코드 변경 회귀 위험. greenfield/marketing에 적합
- **Front-End-Design-Checklist** (passive 40+ items, 5.2k stars): ❌ design-quality-gate / linear-design-mirror / 4 design skills과 중복. handoff 가이드라 1인 dev에 audience 불일치
- **huashu-design** (mockup/prototype 도구): △ Plot production code에는 적용 X. v3 mockup 단계에서만 유용

### Group C PR-D 시리즈 완성 🎉
- ✅ PR 1: Tags v110 (#261)
- ✅ PR 2: Labels v111 (#262)
- ✅ PR 3: Stickers v113 (a055581)
- ✅ PR 4: References v114 (c3700ad)
- ✅ PR 5: Files v115 (f210fcf)

5 entity 모두 view-engine pipeline + ViewHeader + viewState persist + list/grid mode 통합. thin fork 패턴 정합 (Generic 화 X 영구). Saved View가 5 entity context 자동 적용.

### 다음 우선순위 (NEXT-ACTION.md 참조)
- 🔴 **Plot v3 Phase 3+** 분해 plan (Notion/Linear 하이브리드 에디터 / Type rename / 5 view modes / activity-bar reskin / Linear-style filter popover)
- 🟡 Wiki template 3-layer (Layout Preset + Content Template + Typed Infobox)
- 🟡 Smart Book v2 — AutoSource[5] (folder/category/tag/label/sticker)

### Store Version 진화 (이번 세션)
v112 → v113 (Stickers) → v114 (References) → v115 (Files)

---

## 🚀 2026-05-07 (밤) — Plot v3 Phase 2 DEFERRED (큰 방향 결정)

**범위**: Phase 2 (Imperial icon kit) 도입 **보류** 결정. PRD 상단 DECISION banner + plan 문서 ARCHIVED. partial work 그대로 유지.

### 결정 (영구)
- **Imperial 전면 도입 보류**: phosphor-icons 그대로 유지
- 직전 plan (`.omc/plans/v3-phosphor-inventory.md`) **부정확** ("2 files / 4 icons" → 실측 **119 files / 60+ icons / 87 files weight 사용**)
- 119 files = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
- phosphor regular ↔ Imperial 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) → Imperial 도입의 시각 가치 약함
- 빌드 정상 (tsc 0 / build clean / 185 tests pass)
- lucide / 외부 라이브러리 추가 도입은 의미 없음 (phosphor 광범위)

### 처리한 작업
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` 상단 DECISION banner 추가. Status v1.1 → v1.2. §0 TL;DR Imperial 항목 strike-through
- `.omc/plans/v3-phosphor-inventory.md` ARCHIVED banner. historical reference로 보존
- CONTEXT/MEMORY 결정 기록

### 보존된 partial work (revert 안 함)
- `components/icons/imperial.tsx` + `imperial-extras.tsx` 모듈 보존
- `components/activity-bar.tsx` Imperial 마이그레이션
- `components/plot-icons.tsx` `IconWiki = WikiBook`
- `components/views/{note-split,wiki-merge,wiki-split}-page.tsx` 일부
- `components/side-panel/backlink-card.tsx` weight 제거

### 다음 P0
- **Group C PR-D PR 3-5** (Stickers→Pack / References / Files view-engine 통합) 또는
- **Plot v3 Phase 3+** (PRD 후속 phases — Notion/Linear 하이브리드 에디터, Type rename 등)

---

## 🚀 2026-05-07 (저녁) — Plot v3 Phase 2 부분 진행

**범위**: Imperial icon kit 모듈 작성 + 일부 migration. 사용자 위임 거절로 부분 완료 상태에서 commit.

### 완료
- `components/icons/imperial.tsx` 신규 (Imperial 80+ icons, 1.5px stroke, currentColor, `weight: never` 의도적 typing — phosphor 잔존을 컴파일 에러로 surface)
- `components/icons/imperial-extras.tsx` 신규 (Plot 도메인: WikiBook, OntologyWide, Bookshelf 등)
- `components/activity-bar.tsx` — phosphor SSR (Graph/Books/BookOpen/SidebarSimple) → Imperial
- `components/plot-icons.tsx` — `IconWiki = BookOpen` (phosphor) → `IconWiki = WikiBook` (Imperial)
- `components/views/{note-split,wiki-merge,wiki-split}-page.tsx` — lucide → Imperial 일부
- `components/side-panel/backlink-card.tsx` — `weight="regular"` 제거 (Imperial weight: never 충돌 fix)

### 잔여 (다음 세션 0.5일)
- 5+ files / 85+ occurrences `weight=` props 잔존 (calendar-view.tsx, display-panel.tsx, filter-bar.tsx, board-workbench.tsx, color-picker-grid.tsx 외)
- lucide / iconoir / tabler / remixicon 잔존 사용처
- imperial-extras.tsx의 Plot 도메인 icon SVG 정확성 검증

### 검증
- `tsc --noEmit`: 0 errors
- `npm run build`: clean
- `npm run test`: 185 pass (0 regression)

---

## 🚀 2026-05-07 — Plot v3 Phase 1 (token foundation) 완료

**범위**: v3 design tokens 통합 + Q1-Q3, Q8 LOCKED 결정 적용 + Source Serif 4
font + `_legacy/` 폴더 마련. Phase 0 위에서 진행.

### 주요 결정 (LOCKED 적용)
- **Q1 SPACE_COLORS = B**: Plot 유지 (notes=cyan, wiki=violet, calendar=pink 등). v3 mockup 값 적용 안 함.
- **Q2 --accent = A (v3)**: light `#5E6AD2`, dark `#7C8AE7`. cascading 토큰 (`--ring`, `--sidebar-primary`, `--toolbar-active` 등) 모두 따라 변경.
- **Q3 NOTE_STATUS_HEX = A (v3 desaturated)**: inbox `#6B7280`, capture `#D97706`, permanent `#0E9384`.
- **Q8 Priority namespace = A**: `--v3-priority-{high,medium,low}` v3 mockup 값 채움 (`#DC6803`, `#5E6AD2`, `#98A2B3`). Plot `--priority-*` 5-tier 100% 보존.

### 머지 예정 PRs (Phase 1)
- **PR #NEW** Plot v3 Phase 1 — 6 commits:
  - `chore(tokens): Token Cascade Map analysis (Phase 1.1)` — `.omc/plans/v3-phase-1-cascade-map.md`. v3 신규 토큰 grep 0 hits + Plot 기존 토큰 shadcn 의존 매핑.
  - `feat(tokens): integrate v3 design tokens with alias policy (Phase 1.2)` — `app/globals.css` 3-Layer alias 정책 적용. v3 surface (`--bg`, `--fg`, `--soft-fg` 등) + space (Q1) + status (Q3) + priority (Q8) + typography + radii + motion + shadow. Plot 기존 토큰 100% 보존. `@theme inline`에 v3 토큰 노출.
  - `feat(colors): add v3 color aliases, apply Q3 desaturated status (Phase 1.3)` — `lib/colors.ts` NOTE_STATUS_HEX 변경 + 신규 export `TEXT_HIERARCHY`/`MOTION`/`RADIUS`.
  - `feat(fonts): add Source Serif 4, verify Geist (Phase 1.4)` — next/font 추가. self-reference 회피 위해 `--font-source-serif` → `@theme inline`에서 `--font-serif`로 alias.
  - `chore(_legacy): scaffold _legacy folder + import policy (Phase 1.7)` — `components/_legacy/` + README.md 4 정책.
  - `docs(plot-v3): Phase 1 token migration complete` — CONTEXT/MEMORY 업데이트.

### Token alias 정책 (3-Layer)
```
Layer 1: v3 names    (--bg, --fg, --soft-fg, --bg-elev, --space-*, --v3-priority-*)
                     ↓ same hex
Layer 2: Plot names  (--background, --foreground, --muted-foreground, --card, --priority-*)
                     ↓ expose
Layer 3: Tailwind    (@theme inline → --color-background, --color-fg-soft, etc.)
```

### 검증 결과
- `tsc --noEmit`: 0 errors
- `npm run build`: clean (33 routes prerendered)
- `npm run test`: 185 tests passed (0 regression)
- shadcn/ui Tailwind cascade: 정상 (40+ ui/* 컴포넌트 의존하는 Plot 기존 토큰 모두 보존)

### 다음
Phase 2 (Imperial icons codemod, ~0.5일 예상) — 121 phosphor import 사이트
변환. `_legacy/` 폴더 본격 사용 시작점.

---

## 🚀 2026-05-07 — Plot v3 PRD 작성 + Phase 0 cleanup

**범위**: Plot 2.0 → v3 visual refresh 리브랜드. Critic 발견 2가지 사전 정리 (C1 priority namespace / C2 ViewMode mismatch). Store v112.

### 주요 결정 (영구)
- **Plot 2.0 폐기, v3 visual refresh 채택**: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` — Notion/Linear 하이브리드 에디터 방향 + 토큰 시스템 전면 교체
- 앞 세션 11가지 결정 (7-space, Type rename 등)은 v3 PRD에 통합

### 머지 예정 PRs (#NEW — Phase 0 cleanup)
- **PR #NEW** v112 — Plot v3 Phase 0 cleanup.
  - `lib/types.ts`: SavedView.viewState.viewMode `"table"` 제거 + `"grid"` 추가 (view-engine ViewMode exact match, @migrated v112 JSDoc)
  - `lib/view-engine/defaults.ts`: normalizeViewState에 legacy `"table"` → `"list"` rawViewMode 매핑 helper
  - `lib/store/migrate.ts` + `lib/store/index.ts`: v112 마이그레이션 (savedViews viewMode `"table"` → `"list"`, idempotent)
  - `app/globals.css`: `--v3-priority-{high,medium,low}: unset` 선언 자리 마련 (`:root` + `.dark`, 값은 Phase 1)
  - tsc 0 errors / 185 tests pass / build clean

### Store version 진화 (이번 세션)
v111 (labels-list) → **v112** (SavedView viewMode "table"→"list" + --v3-priority-* namespace)

---

## 🚀 2026-05-05 — Group C PR-D 시리즈 진행 + UI hotfix + Plot 2.0 PRD 시작

**범위**: PR #261 (Tags) merged, PR #262 (Labels) created. UI hotfix 8개. **Plot 2.0 진화 PRD Phase A 완료 + 핵심 결정 11가지 확정**.

### 머지된 PRs (이번 세션)
- **#261** v110 — Group C PR-D PR 1 (Tags). `tags-list` ViewContextKey + CONTEXT_DEFAULTS, useTagsView thin fork (~165 LOC), TAGS_LIST_VIEW_CONFIG, TagNoteCountChip, ViewMode list+grid, v110 idempotent migration. 9 files +954/-83 LOC. Architect APPROVED 3 NITs (모두 fix). Preview 검증 완료 (Display popover, Grid mode, viewState persist).
- **#262** v111 — Group C PR-D PR 2 (Labels). #261 패턴 그대로 + Label 특성 (color non-nullable, 1:1 labelId, /labels 라우트 유지). useLabelsView thin fork (~155 LOC), LABELS_LIST_VIEW_CONFIG, LabelNoteCountChip. Architect APPROVED 0 NITs. Preview 검증 (Memo label 3 노트 정확). 8 files +577/-239 LOC.

### Hotfix 8개 (PR #262와 함께 묶음)
1. `status-icon.tsx` defensive guard — `NOTE_STATUS_COLORS[status]?.css ?? "currentColor"` (groupBy="status" + invalid label crash 방지, pre-existing 버그 fix)
2. `notes-table.tsx` — Index 헤더 위치 (justify-between → gap-2, Title 옆), TH `hideInactiveHint` prop (Title 컬럼만 invisible sort arrow 숨김 → wiki/templates 간격 통일)
3. `wiki-list.tsx` — Index 헤더 gap-2, checkbox `w-7 → w-8`, **wiki article icon status color** (stub=orange, article=emerald)
4. `templates-table.tsx` — Index gap-2, row `gap-3 py-2 → gap-2 py-2.5`, title cell wrapper `gap-1.5 → gap-2`
5. `labels-view.tsx` — row 체크박스 hover-only (Templates 패턴)
6. `tags-view.tsx` — list mode 체크박스 hover-only
7. `stickers-view.tsx` — row 체크박스 hover-only
8. `linear-sidebar.tsx` — **Notes 사이드바 Folders ↔ Views 순서 변경** (Views 위, Folders 아래)

### 🆕 Plot 2.0 PRD 시작 (큰 결정)

**자료**: 사용자가 ChatGPT 목업 20장 (`C:\Users\user\Desktop\플롯 UI 진화 가이드자료\`) 첨부 → Plot 진화 vision 영감

**Phase A 완료** — 코드베이스 깊이 정독 + 진화 진단:
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` 신규 — 22 slice / 8 entity / 17 ViewContextKey / 7 ViewMode 완전 매핑 + 진화 매트릭스 + Open Questions 10개
- 1차 목업: `docs/PLOT-2.0-MOCKUP.html` (5 화면 1차 prototype)
- 1차 정밀화: `docs/PLOT-2.0-NOTES.html` (designer-high 정밀화, 90점)

**확정된 11가지 결정** (영구):
1. **Activity Bar 7-space** (home/notes/wiki/calendar/ontology/library/**books NEW**)
2. **7-space 새 팔레트**: home indigo, notes cyan, wiki violet, calendar pink, ontology emerald, library amber, **books rose** (#fb7185 dark / #e11d48 light)
3. **분류 체계 4-system → 3-system**: Label → **Type** (note pool, 단일), Category → **Type** (wiki pool, DAG 다중), Tag (그대로), **Sticker → Pack** (rename + 새 시각 정체성)
4. **Type rename 방식**: UI 레이블만 변경 (코드 그대로), 나중에 별도 PR로 코드 rename
5. **Type 컬럼 Display picker**: Hidden / Icon only (default) / Text only / Icon + Text
6. **이모지 vs Custom Icon**: emoji 단일 필드 먼저 prep, `Label.icon: { type: "emoji" | "custom"; value: string }` 이중 구조로 swap 가능 (사용자 직접 디자인 진행 중)
7. **Tags 사이드바 인라인 색 dot** (큰 변화)
8. **Templates 사이드바 승격** (More section → 별도 섹션, [Note] [Wiki disabled] 탭)
9. **Timeline = ViewMode** (별도 ContextKey X), `VALID_VIEW_MODES`에 `timeline` 추가
10. **Detail Panel 5-tab**: Detail / Connections / Activity / Bookmarks / **Stats** (NEW). "Insights" 단어는 Plot 전체 분석에 보존, **Stats**는 단일 노트
11. **Focus Mode**: Default / Focus / Zen / Compact. 3-진입점 (단축키 ⌘. + 우상단 버튼 + Settings)

**Plot 2.0 핵심 영구 결정 보존**:
- "Gentle by default, powerful when needed"
- Note/Wiki 2-entity 영구 분리
- 색 정책 4사분면 (Label/Sticker→Pack 필수, Folder/Tag opt-in)
- LLM/API 미사용
- Note split = UniqueID 활용

**Phase B-D 남음**:
- Phase B: 완벽한 목업 제작 (반응형 + 토글 + 데이터 정확도) — 5-7 화면
- Phase C: 사용자 검토 + 수정
- Phase D: PRD 작성 + 작업 단위 분해 (2-4개월 구현 로드맵)

### 큰 결정 (영구, 이번 세션)
- **Plot 2.0 진화 = 95% 적용 가능** — 기능 손실 0, 80% 표면 강화 + 20% 새 layer
- **Label/Category/Sticker → Type/Pack rename** (UI 단어 변경, 데이터 모델 그대로)
- **사용자 직접 아이콘 디자인 진행 중** — 완성 시 custom icon registry로 swap (이중 구조)
- **새 7-space 팔레트** — 기존 SPACE_COLORS 재디자인 (새 술 새 부대)
- **Sticker → Pack** (Bundle 비추, Box는 Inbox/Infobox와 헷갈림, Album은 이미지 인상 강함)
- **"Insights" vs "Stats" 분리** — Plot 전체 분석=Insights, 단일 노트=Stats

### 이번 세션 기술 학습
- **TH 컴포넌트 hideInactiveHint prop** — Title cell의 invisible sort arrow가 12px width 차지 → notes Title이 wiki/templates와 다른 간격. prop 추가로 Title만 hide (다른 컬럼 hover hint 보존).
- **체크박스 hover-only 패턴**: `selectionActive || isChecked ? "visible" : "invisible group-hover:visible"` (Templates 패턴, 모든 entity에 일괄 적용).
- **사이드바 섹션 순서**: Views → Folders가 Notes에서 더 자연 (사용자 직관, 2026-05-05 결정).
- **Wiki article icon color**: 회색 + Status 컬럼 badge 분리 의도였지만 사용자가 "노트처럼 색 직접" 원함 → leading icon에도 status color 적용. WIKI_STATUS_HEX inline.
- **explore-high agent 활용 = Phase A 적합** — 22 slice + 8 entity + 디자인 토큰 + 진화 진단까지 한 번에 (코드 정독 + 미래 진단).
- **designer-high agent (Opus)** = 1.5-2시간 정밀화 (한 화면). 5 화면 다 한 번에 4-6시간.

### 다음 세션 우선순위
1. **🔴 Plot 2.0 Phase B 진행** — designer-high에게 Notes 시그니처 위임 (반응형 + 토글 + 모든 결정 반영)
2. Phase B 만족 → 같은 디자인 언어로 나머지 4 화면 (Wiki / Home / Library + Books / Focus)
3. Phase C: 검토 후 Phase D PRD 작성 + Phase 1 구현 시작 (2-3주)
4. Group C PR-D PR 3-5 (Stickers→Pack / References / Files) — Phase 1 진행 중에 동시 가능

### Plan 문서 보존
- `.omc/plans/group-c-prd-view-engine-integration.md` (PR 1, 2 완료, 3-5 남음)
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` (Plot 2.0 Phase A 보고서)
- `.omc/notepad.md` (Plot 2.0 PRD 진행 + 11가지 결정 + 다음 세션 컨텍스트)

### Store version 진화 (이번 세션)
v109 → v110 (tags-list viewState) → v111 (labels-list viewState)

---

## 🚀 2026-05-04 (오후) — Templates 데이터 모델 정리 + 색 opt-in 정책 (v108/v109)

**범위**: Templates 시리즈 마무리 + Folder/Tag 색 정책 큰 결정. 2-PR 분리 머지.

### 머지된 PRs (이번 세션)
- **#258** v108 — NoteTemplate slim. `description` / `status` / `priority` 3 필드 데이터 모델에서 제거 (이전 카드 표시 폐기 → 데이터 모델 정리 follow-up). 사이드 패널 Status/Priority row 제거, Label/Folder만 유지. `createNoteFromTemplate` default `"inbox"` / `"none"` 하드코딩. 시드 13개에서 3 필드 strip. v108 마이그레이션: 기존 templates 3 필드 idempotent strip. 부수: footnotes-footer Zustand selector 무한 루프 BUG fix (`EMPTY_REF_IDS` stable ref). templates-table row 시각 baseline notes-table와 일치 (Layout 아이콘 제거, pin만 유지). 13 files +74/-145 LOC.
- **#259** v109 — Folder/Tag 색 opt-in 정책. 자동 부여(palette cycle / pickColor 해시) 폐지 → 신규 폴더/태그는 `color: null`로 시작. 사용자가 우클릭 "Change color..."로 명시적 부여. `Folder.color` / `Tag.color` → `string | null`. helper `getEntityColor(c)` 추가 (null → STATUS_DOT_FALLBACK 회색). 30+ 표시 사용처에 fallback 일괄 적용. 사이드바 폴더 우클릭 + Tags-view row 우클릭에 Reset color 옵션. v109 마이그레이션: no-op (옵션 A — 기존 사용자 색 그대로 유지). 27 files +219/-105 LOC.

### 큰 결정 (영구, 이번 세션)
- **Templates는 카드 + 데이터 모델 모두 정리**: status/priority/description은 default 값으로서도 가치 약 (사용자가 어차피 변경) → 완전 제거. 새 노트는 inbox/none으로 시작.
- **Templates row 시각 = Notes row baseline**: 같은 list라 같은 시각. Layout entity 아이콘 = 차별화 0 → 시각 노이즈로 제거. 핀만 inline 유지 (정보 차이 있는 곳).
- **색 정책 4사분면 (LOCKED)**:
  - Label / Sticker = 색 필수 유지 (chip / hull 시각 도구)
  - Folder / Tag = **opt-in** (이름·계층이 정체성, 색은 강조 옵션)
- **Tag 본질 재정의**: 본문 hashtag로 자동 생성되는 가벼운 마커. 색 의도 0이라 자동 부여(pickColor)는 노이즈.
- **마이그레이션 옵션 A 채택**: 기존 사용자 색 그대로 유지 (의식적 reset 가능). 데이터 손실 0.
- **PR 분리 원칙 준수**: v108(Templates) → squash merge → v109(색) 별도 작업. UI + 데이터 모델 둘 다 변경하더라도 의미 단위로 묶음.

### 이번 세션 핵심 결정사항
- **footnotes-footer BUG**: zustand selector에서 매번 새 빈 array `[]` 반환 → React 19 useSyncExternalStore "infinite loop" 감지. `EMPTY_REF_IDS` stable ref 패턴으로 해결 (lib/stickers.ts `EMPTY_STICKER_ARRAY` 컨벤션 따름).
- **Templates 사이드 패널 default 의미**: 사용자가 헷갈렸음 ("이 properties 의미?") → status/priority가 default 값이라는 게 직관적이지 않음 = 제거 신호.
- **시각 매칭 검증 = DOM measure**: 같은 14px 이라도 outline vs filled, 무채색 vs status컬러 차이로 시각 무게 다름. 사용자 직관 = 디자인 시그널.
- **Tag opt-in 시각화 = leading dot**: tags-view row에 색 dot 추가하면서 우클릭 picker 진입점 마련. 색 변경 즉시 시각 피드백.
- **Folder vs Tag entity 구별**: Folder는 사용자가 의식적으로 만듬. Tag는 hashtag로 우연 생성 가능. opt-in 정책에 차이 없지만 UX 진입점은 다름 (Folder = 사이드바 우클릭, Tag = tags-view row 우클릭).

### 이번 세션 기술 학습
- **Zustand selector + React 19**: 매번 새 array/object 반환하면 useSyncExternalStore 안티패턴. 모듈 레벨 stable empty constant 패턴 정합 (이미 lib/stickers.ts:47에 있던 컨벤션).
- **executor agent 위임 효과**: v109 type error 30+ 사이트 일괄 fix를 executor에 위임 → 자동으로 helper 호출 + import 정리 + tsc 0 errors까지. multi-file 변경에 강력.
- **Worktree branch 관리**: v108 squash-merge 후 origin/branch는 squash 전 원본 commit. force push 회피하려면 새 branch checkout (Plot 워크플로우: branch per PR).
- **`gh pr merge` worktree 충돌**: `--delete-branch` 옵션이 local checkout 시도 → main worktree 점유로 실패. `--squash`만 사용하면 remote merge OK. local cleanup은 별도.
- **Color picker UI 재사용**: 이미 ColorPickerGrid 컴포넌트 + 사이드바 Folder 우클릭에 wired. v109 작업이 인프라 추가가 아니라 *기존 인프라의 default 정책 변경* + Tag entry point 추가로 minimal.

### 다음 세션 우선순위 (재정렬)

#### 🟡 큰 작업 후보 (시드 템플릿 BUG는 v108에서 해결됨)
1. **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs). Templates/Folder가 본보기. **planner 권장**.
2. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
3. **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
4. **Template seed audit** — `PlotTemplate<T>` 추상화 검토

#### 🟣 마지막
5. **Note UI toolbar** (UpNote-style)
6. **House (계보 시각화)** — 토론 후 결정

#### 🟢 작은 후속 정리
- Templates grid chip 시스템 완전 통일 (PR e deviation)
- 키보드 shortcut (D/T/P 등) — 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)
- Tag 우클릭 메뉴 Rename 옵션 추가 (v109에서 Change color/Reset/Delete만 추가됨)
- Label 색 정책 재검토 — 현재 필수지만 Tag와 같은 opt-in 가능성 토론 필요

### Plan 문서 보존 / 신규
- `.omc/plans/folder-nm-migration.md` (이전, PR a/b/c 완료)
- `.omc/plans/template-b-edit-ui-unification.md` (이전, v108 정리 토대)

### Store version 진화 (이번 세션)
v107 → v108 (NoteTemplate description/status/priority strip) → v109 (Folder/Tag color nullable, no-op migration)

---

## 🚀 2026-05-04 — Folder N:M 시리즈 완성 (PR b/c)

**범위**: PR (folder-b) UI 분리 + PR (folder-c) Multi-folder UX. Folder type-strict + N:M 시리즈 3-PR 완성.

### 머지된 PRs (이번 세션)
- **#255** PR (folder-b) — UI type-strict 시각화. 신규 `folder-picker.tsx` (kind-aware, 3가지 export로 4곳 dedup) + 사이드바 Notes/Wiki Folders 분리 (kind="note" / kind="wiki") + `/folder/[id]` kind 분기 + DnD wrong-kind drop 거부 + notes board/table 다중 폴더 FolderChip ("+N more"). 8 files +744/-397 LOC, 5 commits.
- **#256** PR (folder-c) — Multi-folder UX. FolderPicker `selectMode="multi"` 활성화 (체크박스 + Apply) + Detail panel 다중 폴더 chip strip (note + wiki) + 우클릭 메뉴 / floating-action-bar "Add to folders…" + group-by-folder MultiFolderMarker (다른 폴더 카운트) + DnD Shift modifier (no shift = Add, Shift = Move). 10 files +931/-124 LOC, 5 commits, 18 신규 N:M action 테스트.

### Folder N:M 시리즈 총합 (PR a/b/c)
- **3 PRs**, 17 commits, 65+ files, **+3215 / -685 LOC**
- 데이터 N:M (PR a) → UI type-strict (PR b) → multi-folder UX (PR c)
- Test coverage: 167 → 185 (18 신규 N:M action 테스트)

### 이번 세션 핵심 결정사항
- **FolderPicker는 단일 컴포넌트 + 3가지 export** (Popover / inline-submenu / 훅) — 4곳의 chrome 차이 흡수
- **DnD modifier 시맨틱**: 일반 drop = Add (N:M 자연), Shift+drop = Move (single 시맨틱 보존). 첫 drop 시 toast로 안내.
- **MultiFolderMarker**: group-by-folder에서 다중 폴더 노트는 현재 컬럼 외 다른 폴더 수만 chip으로 표시 (전체 chip 아님 — 카드 과밀 방지)
- **Wiki bulk action**: 별도 floating bar 없음. wiki-list 우클릭 메뉴만. 향후 wiki bulk bar 만들 때 같은 패턴 transplant.
- **FolderPicker 검색 필터**: 미구현 (50+ 폴더 시점에 도입 검토)

### 이번 세션 기술 학습
- **FolderPicker 추상화 패턴**: 다양한 chrome (Popover/Submenu/inline-expand) 흡수하는 design = 단일 컴포넌트 + 다중 export. 호출 사이트가 자기 chrome 결정.
- **DnD shiftKey 감지**: dnd-kit에서 `shiftPressedRef` (global keydown/keyup listener) 패턴으로 re-render 없이 modifier 추적.
- **vitest + jsdom 미설정**: 프로젝트는 .ts 만 테스트 (component .tsx 테스트 X). 슬라이스 액션 단위 테스트로 대체.
- **multi-mode picker 디자인**: local pending Set + Apply 버튼이 single-toggle보다 명확. count summary 노출.

### 다음 세션 우선순위 (재정렬)

#### 🔴 즉시 (사용자 워크플로우 차단)
1. **BUG fix** — 시드 템플릿 더블클릭 에러. 콘솔 메시지 미수집. `template-edit-page.tsx` + `templates-table.tsx` 디버깅 필요.

#### 🟡 큰 작업 후보
2. **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs). Templates/Folder가 본보기. **planner 권장**.
3. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
4. **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
5. **Template seed audit** — `PlotTemplate<T>` 추상화 검토

#### 🟣 마지막
6. **Note UI toolbar** (UpNote-style)
7. **House (계보 시각화)** — 토론 후 결정

#### 🟢 작은 후속 정리
- Templates grid chip 시스템 완전 통일 (PR e deviation)
- NoteTemplate 타입에서 description/status/priority 필드 제거
- 키보드 shortcut (D/T/P 등) — 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)

### Plan 문서 보존
- `.omc/plans/folder-nm-migration.md` (PR a/b/c 모두 완료)
- `.omc/plans/template-b-edit-ui-unification.md` (이전)

### Store version (현재 v107)
v100 → v107 (Sticker.members → Template icon/color drop → templates context → visibleColumns 단순화 → description 제거 → seed 9개 주입 → Folder kind+N:M)

---

## 🚀 2026-05-03 (저녁) — Templates 시리즈 종결 + Folder N:M 시작

**범위**: Templates 시리즈 4개 PR + Folder type-strict N:M 데이터 모델 PR (a) 1개. 총 5개 PR squash-merge.

### 머지된 PRs
- **#249** Template PR c — view-engine 통합 (list/grid + multi-select + alpha index + chip 일관성). 마이그레이션 v102→v105 (templates context 등록 + visibleColumns 단순화)
- **#250** Template PR d — seed templates 4→13 (Weekly Review/Monthly Reflection/1:1 Meeting/Standup/Reading Notes/Diary/Goal Setting/Decision Log/Project Kickoff). 신규 사용자 only.
- **#251** PR e — Linear-style properties-aware cards. 12개 도메인 chip (`property-chips.tsx`) + notes/wiki board + templates grid `visibleColumns` wiring + `+N more` overflow. ViewMode union에 "grid" 추가.
- **#252** PR f — v106 migration: 기존 사용자에게 9개 신규 시드 idempotent 주입.
- **#253** PR (folder-a) — Folder type-strict + N:M 데이터 모델 + 마이그레이션 v107. Folder.kind: "note"|"wiki", Note.folderIds[], WikiArticle.folderIds[]. 혼합 폴더 자동 분리 (`{name} (Wiki)` 클론). 45 files +634/-169 LOC.
- **#254** docs: after-work session wrap-up — notepad + worklog 동기화.

### 핵심 결정사항
- **Templates 디스플레이 properties 단순화**: status/priority/label/folder/tags/description 폐기 → Index/Updated/Created 3개만
- **Templates 본질**: 선택 도구 (vs 노트=탐색 대상). Board 모드 미지원, list+grid만.
- **NoteTemplate.status/priority/description** = "default 값"이지 카드 정체성 X. 카드 표시 폐기. 타입 필드 제거는 별도 PR.
- **Linear-style chips**: 도메인별 chip (B 옵션) + 하드 캡 3개 (A density). pinned는 always-on (toggle 없음).
- **Folder type-strict**: 노트 폴더 = 노트만 / 위키 폴더 = 위키만. 4사분면 모델 (Folder=type-strict / Sticker=type-free) 명확화.
- **혼합 폴더 자동 분리** (마이그레이션 정책): 데이터 손실 0. `{name}` (note) + `{name} (Wiki)` (wiki) 두 폴더로.
- **Templates folderId**: single 유지 (개수 적어 N:M 가치 낮음, YAGNI).

### 다음 세션 우선순위 (순서)
1. **BUG fix**: 템플릿 더블클릭 시 에러 (시드는 보이나 편집 안 됨) — 사용자 워크플로우 차단 중
2. **PR (folder-b)** — UI 분리 type-strict 시각화: 사이드바 Notes/Wiki 분리, /folder/[id] kind 분기, Folder picker kind 검증, DnD kind 검증
3. **PR (folder-c)** — Multi-folder UX: detail panel 다중 폴더 chips, multi-folder picker, DnD add vs move, group-by-folder 다중 마커
4. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
5. **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs, planner 권장)
6. **Smart Book v2** (AutoSource[5] + Sticker source + Hybrid manual/auto)
7. **Template seed audit** (`PlotTemplate<T>` 추상화)
8. **(마지막) Note UI toolbar** (UpNote-style)
9. **(논의)** House (계보 시각화) — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체. 마지막에 토론.

### 기술 학습
- **시드 템플릿 마이그레이션 정책** (PR d/f): 신규 사용자 only가 안전한 default. 기존 사용자는 별도 idempotent 마이그레이션 (id 충돌 시 skip).
- **Linear chip 패턴 wiring 발견**: 노트/위키 board는 이미 `visibleColumns + isVisible(key)` 가드 있었음. 진짜 문제는 ad-hoc inline span 시각. 디자인 + 누락 properties 추가가 본질.
- **wordCount derived from preview** (`note.preview.split(/\s+/).filter(Boolean).length`) — `notes-table`의 기존 패턴. 별도 store 필드 추가 X.
- **memo comparator 업데이트 의무**: BoardCard 새 prop 추가 시 (note.labelId, note.tags, note.pinned 등) memo 비교에도 추가 안 하면 update 안 됨.
- **Migration v107 혼합 폴더 알고리즘**: 데이터 기반 자동 추론 + 혼합 시 클론 분리 (id `{origId}-wiki`). 7 test cases (5 plan-required + 2 edge) all PASS.
- **N:M view-engine 영향**: `group-by-folder`는 한 노트가 여러 폴더에 속하면 N번 등장. count는 unique 처리 별도 필요 (PR c에서).
- **Templates view-engine 발견**: `useNotesView`는 `Note[]` 전용. Templates는 thin fork (`useTemplatesView`)가 정합. Generic 화는 scope 폭발.

### Plan 문서 보존
- `.omc/plans/template-b-edit-ui-unification.md` (이전 세션)
- `.omc/plans/folder-nm-migration.md` (이번 세션, PR (folder-b/c) 참고)

### Store version 진화 (이번 세션)
v102 → v103 (templates context) → v104 (visibleColumns 단순화) → v105 (description 제거) → v106 (시드 9개 주입) → v107 (Folder kind + N:M)

---

## 🚀 2026-05-03 (오후 후반) — 11 PRs 머지 거대 세션

**범위**: 디자인 결정 → 즉시 구현. 6시간 동안 11 PRs squash-merge to main.

### 머지된 PRs (순서)
- **#237** 옵션 B: 11 commits 묶음 (33 design decisions + Hull 버그 fix + Sticker 사이드바)
- **#238** Sticker v2 Phase 1 — 데이터 모델 (옵션 D2, `Sticker.members[]` cross-everything, v100→v101)
- **#239** Sticker v2 Phase 2 — Library 진입점 + cross-everything detail + cascade cleanup
- **#240** docs — 6 design decisions (Folder type-strict re-confirm + Smart Book + Template policy)
- **#241** notes 인덱스 버그 — virtualItems가 groupBy="none"에서 showAlphaIndex 무시 (1줄 fix)
- **#242** 노트 템플릿 UpNote Phase 1/3 — `{{YYYY}}` 변수 호환 + SelectFromTemplatesModal + Insert 메뉴
- **#243** Group A 색상 통일 — `KNOWLEDGE_INDEX_COLORS` const + wiki status emerald + graph wiki violet 보존
- **#244** Group A 아이콘 통일 — IconWiki→BookOpen alias (13 사이트 자동) + IconWikiStub/Article 활성화
- **#245** Group C PR-A — wiki board 도달 (showViewMode prop) + notes board visibleColumns + boardDefaultGroupBy
- **#246** Template PR a — 메타 슬림화 (icon/color 폐기, v101→v102)
- **#247** Template PR b — 편집 UI 통합 (NoteEditor 재사용 + TemplateDetailPanel 사이드 패널)

### 핵심 결정사항 (재확정 / 신규)
- **Folder type-strict + N:M** (33 §2 재확정, 마이그레이션 미구현 → 큰 PR 예정)
- **Smart Book = AutoSource[]** 5종 (folder/category/tag/label/sticker) — 엑셀 함수 패턴
- **Note template = UpNote opt A only** (메타 슬림 + 사이드 패널, Smart Template = v2 보류)
- **Wiki status 색 분리**: stub=orange, article=emerald, entity=violet (wiki entity ≠ article state)
- **Sticker = cross-everything Library only** 진입점 (33 §8 정정)
- **Plot 정체성 영구 정의**: "Gentle by default, powerful when needed"
- **작업 원칙 영구 정의**: "정확도 + 버그 위험 최소화" (10가지 규칙)

### 다음 세션 우선순위 (순서)
1. **Template PR c** — template-only views (filter/display + view-engine)
2. **Template PR d** — 시드 10-20개 clean slate
3. **Group C PR-D** — Tags/Labels/Stickers/Refs/Files view-engine 통합 (5-8 PRs, 큰 작업)
4. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
5. **§2 Folder type-strict + N:M 마이그레이션** (큰 PR)
6. **Smart Book v2** (AutoSource + Sticker source + Hybrid manual/auto)
7. **Template seed audit** (`PlotTemplate<T>` 추상화 — 인포박스/배너/카테고리 등 통합)
8. **(마지막) Note UI toolbar** (UpNote-style, minimalist 5-6 buttons, configurable, "Organize..." multi-action)

### 기술 학습
- **IconWiki → BookOpen alias 1줄 수정 = 13 site 자동 적용** (`export { BookOpen as IconWiki }`)
- **DisplayConfig interface 두 곳 중복 정의** (display-panel.tsx + view-configs.tsx) — 향후 통합 검토
- **TemplateEditorAdapter thin fork (140 LOC) vs NoteEditorAdapter (460 LOC)** — Y.Doc/IDB body/hashtag-sync 생략으로 충분
- **architect Opus agent stalled 17분 사례** — 큰 PR (615+/317- 6 files) 검증 시 시간 weight 고려, medium 옵션 검토
- **Store: v100 → v101 (Sticker.members) → v102 (Template icon/color drop)**

### Plan 문서 보존
`.omc/plans/template-b-edit-ui-unification.md` — Template PR b planner 결과물 (다음 PR 참고)

---

## 🚀 2026-05-03 (오전) — 대규모 디자인 토론 + Hull 버그 fix

**범위**: 코드 변경 (Hull 버그 fix 3개) + 33개 디자인 결정 (앞으로 작업 방향)

### 코드 변경 (PR #237에 누적, 9 → 11 커밋)
- 90e18f1: Hull 클릭 안 되는 버그 (pointerEvents)
- 9cec76a: Hull stuck 버그 (renderTick deps)
- b65caa3: Hull 우클릭 sticker 메타 액션 (Rename / Change color / Delete)

### 핵심 디자인 결정 (33개 → 큰 그림)

#### A. 4사분면 모델 정립
```
                Unordered (collection)    Ordered (sequence)
Type-strict     Folder                    (의미 약함)
Type-free       Sticker                   Book ⭐ (신규)
```

#### B. Folder 변경 (큰 PR)
- type-strict (Note 폴더 = 노트만, Wiki 폴더 = 위키만)
- N:M 멤버십 (한 노트 → 여러 폴더)

#### C. Sticker v2 (큰 PR, cross-everything)
- 모든 entity 수용 (Note + Wiki + Tag + Label + Category + File + Reference)
- 정참조 모델 (`Sticker.members[]`)
- Universal Entity Picker UI

#### D. Book entity 신규 (v3급 PR)
- Activity Bar 7번째 (7개 OK)
- cross-entity (Note + Wiki 포괄, 단일 Book entity)
- ordered sequence (chapter 순서가 본질)
- Manual drag-drop default + Auto-sort 액션
- 시각화: Hull + Sequence edge + 별도 Reading view
- Wikilink: `[[Book]]` / `[[Book#Chapter]]`

#### E. Page entity = 폐기 (확정)
- 제텔카스텐 atomic 위배
- Book entity로 needs 충족 (atomic 보존 + sequence)

#### F. Sandbox + Save view 통합 (옵션 B)
- Save view = 보기 + 데이터 staging 함께 영구
- Sandbox = 그래프만 (노트/위키 즉시 영구)
- Wikilink = 본문에서만, Relation = 그래프에서

#### G. Relation 저장 = 본문 embed 자동 추가
- 본문 contentJson에 직접 embed (footer 추가 X)
- 사용자 첫 번째만 prompt + "기억" 옵션
- 위키: 자동 "See also" 섹션 + entity-ref WikiBlock 일반화

#### H. Sticker 진입점 = Library만 (정정)
- 이전 4 space에서 추가 → Library만으로 변경
- 다른 4 space에서 NavLink 제거 작업 필요

#### I. 사이드 패널 변경
- Detail/Connections/Activity 모두 영향
- 각 큰 PR이 자기 부분 처리 (별도 사이드 패널 PR 없음)

#### J. Linear-style entity navigation (의미 A)
- view 안 노트 간 ↑/↓ 키, 1/N 표시
- 작은 PR로 즉시 가능

#### K. 마크다운 단축키 (Obsidian 90% 수준)
- Phase 1: `---` Enter 패턴 + Highlight + Image embed
- Phase 2: Math + Heading anchor
- Phase 3: Block reference + Definition list (큰 작업)

### 다음 작업 큐 (재정렬, 우선순위 순)

**🟢 작은 polish PR (즉시)**
1. `---` Enter 패턴 + Highlight + Image embed (마크다운 Phase 1)
2. Linear-style entity navigation (↑/↓ 키)
3. Wiki "Blocks" Display Property
4. Stickers Library만 진입점 (4 space에서 NavLink revert)
5. Notes 사이드바 위계 (Notes ▼ Status 그룹)

**🟡 중간 PR**
6. NoteStatus 리네이밍 (PRD 사전 조사 완료)
7. 마크다운 Phase 2 (Math + Heading anchor)
8. Filter chip 3-part 드롭다운
9. Linear 검색창 패턴

**🔴 큰 데이터 모델 PR (의존성 큼)**
10. Folder type-strict + N:M
11. Sticker v2 (cross-everything)
12. Sandbox + Save view 통합
13. Entity-ref WikiBlock 일반화
14. 온톨로지 그래프 노드 확장 (모든 entity)

**🟣 v3급 PR (가장 마지막)**
15. Book entity (cross-entity, ordered sequence)
16. Activity Bar 7개 확장

**🎨 디자인 polish (별도)**
- 컬럼 헤더 아이콘 통일
- Status 아이콘 시리즈 (Linear 빈/반/꽉)
- Updated/Created 아이콘 분기

### Technical Learnings (이번 세션)

#### 1. Hull 클릭 안 됨 — `pointer-events: visiblePainted` 함정
- SVG default `pointer-events="visiblePainted"`는 fillOpacity 0.04~0.10을 "not painted"로 판단
- 클릭 이벤트가 통과해 SVG background로 빠짐
- 해결: `style.pointerEvents = "all"` 명시

#### 2. Hull stuck 버그 — useMemo deps 누락
- `clusterHulls` useMemo deps에 viewport `transform`만 있어서 노드 드래그 시 재계산 안 됨
- `positionsRef`는 ref라 React 추적 X
- 해결: `forceRender`의 카운터 (renderTick) 노출 + deps에 추가

#### 3. 자료구조 본질 — Set vs Sequence
- Sticker = collection (set, 무순서)
- Book = sequence (list, 순서 있음)
- 다른 자료구조 → 다른 entity 정당화

#### 4. 종이책 메타포 함정
- "한 책 = 한 종류 콘텐츠" 종이책 메타포에 갇히면 안 됨
- 디지털 책은 cross-type 자유 (Notion 페이지 패턴)
- Plot의 Sticker도 cross-everything → Book도 같은 패턴

#### 5. 사용자 통찰 = 디자인 시그널
- 사용자가 "Sticker = 글로벌 폴더 같은 것" 통찰 = 의미 분리 약하다는 신호
- 사용자가 "Detail 패널 = 본문 변화 추적/반영" 통찰 = 본문 source of truth 원칙
- 사용자 직관을 무시하지 말 것

#### 6. Page vs Book — 같은 needs, 다른 정체성 정합
- Page = sub-entity (atomic 위배)
- Book = entity 묶음 (atomic 보존)
- 같은 사용자 needs (소설 회차)지만 정체성 측면에서 Book이 정합

---

## 🚀 2026-05-02 (늦은 밤) 세션 — Index 버튼 위치 통일 + viewState.toggles 보존 (옵션 B)

**범위**: Notes/Wiki list view의 Index 토글 위치 통일. Display 패널 토글 + viewState.toggles 보존으로 saved view에 같이 저장.

### 핵심 결정사항
- **Index 위치 = Title 컬럼 헤더 옆 inline (통일)**: 데이터 영역에 인접 → "이 컬럼들을 알파벳 그룹화" 의미 명확. 위키도 동일 위치로 마이그레이션
- **viewState.toggles.showAlphaIndex**: 로컬 useState 폐기, viewState에 보존 → saved view 스냅샷에 자동 포함
- **컬럼 헤더 inline + Display 패널 두 진입점**: 같은 state (synced), Linear 패턴 모방
- **viewStateEquals에 toggles 비교 추가**: dirty 검증 범위 확장. Index 토글 변경 시 ViewHeader Save 버튼 자동 등장 (보존 일관성)
- **ViewHeader extraToolbarButtons는 글로벌 액션만**: Filter/Display/Save view만 — 데이터 액션(Index)은 컬럼으로 강등

### 코드 변경 요약
- `components/notes-table.tsx` — useState → useCallback 래퍼 (viewState.toggles 패치). ViewHeader에서 Index 버튼 제거. COLUMN_DEFS map의 title 컬럼에 `<button>Index</button>` inline. Collapse-all 버튼 등 다른 extraToolbar 항목은 유지
- `components/views/wiki-list.tsx` — `ColumnHeaders` props에 `showAlphaIndex` + `onToggleAlphaIndex` 추가. 별도 toolbar의 Index 버튼 + divider 제거. 두 위치(alphabetical view + 일반 view)의 ColumnHeaders 호출처에 props 전달
- `components/views/wiki-view.tsx` — `showAllArticles` useState 제거 → `wikiViewState.toggles?.showAlphaIndex ?? false`. setShowAllArticles 콜백이 `updateWikiViewState({ toggles: { ..., showAlphaIndex } })` 호출
- `lib/view-engine/saved-view-context.ts` — `viewStateEquals`에 `toggles` map 비교 추가 (Object.keys 비교 + 각 키 값 비교)
- `lib/view-engine/view-configs.tsx` — `NOTES_VIEW_CONFIG.displayConfig.toggles`와 `WIKI_VIEW_CONFIG.displayConfig.toggles`에 `{ key: "showAlphaIndex", label: "Alphabetical index" }` 추가

### Technical Learnings
- **변수 선언 순서 함정**: `wikiViewState`를 사용하는 hook을 그것 정의 위에 놓으면 TS error TS2448 ("used before declaration"). 의존성 그래프 따라 선언 순서 신경 써야
- **toggles 비교 = saved view 보존의 단서**: 기존 viewStateEquals에서 toggles 비교 빠뜨려서 graph 관련 toggles(showWikilinks 등)도 dirty 감지 안 됐음. 통일된 비교로 모든 toggles가 saved view에 의미 있게 보존됨
- **컬럼 헤더 inline 토글 = 데이터 액션 / ViewHeader = 글로벌 액션**: Linear 멘탈모델. Filter는 모든 데이터에 적용 → 글로벌. Index는 그룹화 모드 → 데이터 직접 액션 → 컬럼 인접

---

## 🚀 2026-05-02 (밤) 세션 — Saved Views 스냅샷 UX (Linear 패턴, 옵션 C)

**범위**: PR #237 직후 같은 워크트리에서 진행. 사용자 합의된 옵션 C 구현.

### 핵심 결정사항
- **빈 뷰 생성 → 현재 viewState 캡처로 의미 변경**: 사이드바 + 버튼이 더 이상 빈 default state를 만들지 않음. `createSavedView(name, currentViewState, space)` — 이름 받자마자 현재 활성 context의 viewState 그대로 저장
- **ViewHeader Save 버튼 신규** (Linear 패턴): 변경 감지 시 강조 색상으로 "Save" 등장. 활성 view 없을 땐 "Save view" popover로 이름 입력
- **사이드바 우클릭 메뉴 확장**: Update view (덮어쓰기) / Reset to saved (되돌리기) 2개 추가. 기존 Rename / Delete 유지
- **Dirty 검증 범위**: viewMode/sortField/sortDirection/groupBy/showEmptyGroups + filters[] + visibleColumns[]. toggles는 의도적 제외 (per-context 플래그라 SavedView 모델에 없음)
- **활성 view 자동 활성화**: save-as 모드에서 새 뷰 생성 시 setActiveViewId 호출 → 이후 편집은 dirty 추적
- **5 view 모두 적용**: notes-table, notes-board, wiki-view (list mode), ontology-view, calendar-view. wiki dashboard 모드는 의도적 hidden

### 코드 변경 요약
- **신규 helper**: `lib/view-engine/saved-view-context.ts` — `getCurrentViewContextKey(space, route)`, `getSavedViewSpaceForActivity(space)`, `viewStateEquals(a, b)`
- **신규 hook**: `lib/view-engine/use-save-view-props.ts` — `useSaveViewProps(contextKey, space)` 자동 계산
- **사이드바**: `components/linear-sidebar.tsx` — `handleNewViewSubmit` viewState 캡처로 변경, `handleUpdateView` / `handleResetView` 신규, ContextMenu 항목 4개로 확장
- **ViewHeader**: `components/view-header.tsx` — `saveViewMode` (hidden/save-as/update/clean) + `onSaveView` props 추가, FloppyDisk 아이콘 + Save 버튼 (popover/직접 호출 분기)
- **5 view 호출처**: notes-table, notes-board, wiki-view, ontology-view, calendar-view에 `useSaveViewProps` 호출 + ViewHeader prop 전달

### 다음 작업 후보 (큐)
- **NoteStatus 리네이밍 Phase 1** — `inbox/capture/permanent` → `stone/brick/keystone` + IDB v101 마이그레이션. PRD 사전 조사 완료
- **Filter chip 3-part 드롭다운 Step B** — Field/Operator/Value 모두 popover, Linear 한 술 더 뜸
- **linear-sidebar wiki space 카테고리 트리 표시** — 현재 wiki-category-page에서만 색 dot 보임
- **dead code 정리** — `components/views/wiki-sidebar.tsx`

### Technical Learnings
- **shallow viewState 비교**: filters/visibleColumns는 deep 비교 안 해도 ordering이 stable해서 index-based 비교로 충분 (filter 추가 시 항상 끝에 push)
- **save-as 자동 activate**: createSavedView 후 setActiveViewId — 사용자가 입력 후 즉시 dirty 추적 시작
- **dynamic context (notes)**: notes context는 route에 따라 inbox/capture/permanent/folder/tag/label 변동. helper가 route 분기로 처리
- **ViewHeader save 버튼 클로저 함정**: hydrated 가드 안 두면 Popover 마운트 시점이 server vs client 다름. 기존 Filter/Display 패턴 그대로 따름

---

## 🚀 2026-05-02 (오후) 세션 — docs 정리 + Saved Views 완성 + 카테고리 색 UI + Sticker 사이드바 (사이드바 polish + Sticker 1급 UI 통합 PR)

**범위**: 5개 작업 묶음 PR. PR #236 직후 fresh worktree에서 시작.

### 핵심 결정사항
- **stale docs 5개 archive로 분리**: TODO.md/NEXT-ACTION.md/SESSION-LOG.md (CONTEXT.md/MEMORY.md/worklog와 정보 중복, 매번 갱신 누락 패턴), PHASE-PLAN-wiki-enrichment.md (v75→v83 가정 깨짐), plot-discussion/ 11개 (historical, 일부 결정 뒤집힘). **single source 원칙**: 이제 CONTEXT.md + MEMORY.md만 갱신
- **PHASE-PLAN-wiki-enrichment 분할 재작성 방침**: 한 큰 PRD 대신 필요할 때 작은 단위로 (REDESIGN_INFOBOX_TIER1, REDESIGN_BANNER_NAVBOX, REDESIGN_MACROS)
- **Sticker 1급 UI 완성**: 그래프 우클릭 메뉴에서만 가능했던 sticker 생성/관리를 라벨처럼 사이드바 진입점 + /stickers 페이지로. LabelsView 패턴 1:1 복제 (754줄)
- **Saved Views Wiki/Ontology/Calendar 완성**: 기존 Notes 패턴 복제 — Notes의 viewState 복원 useEffect를 3개 view로 확장, SavedView.space 가드 추가
- **SavedView.viewMode 타입에 graph/dashboard 추가**: ontology saved view viewMode 보존 가능 (잠재 버그 사전 차단)
- **Saved Views 스냅샷 UX 결함 식별**: 현재 사이드바 + 버튼은 빈 default state 뷰만 생성. ViewHeader Save 버튼 부재 → 사용자가 현재 viewState를 스냅샷으로 저장 불가. 다음 PR로 분리 (옵션 C: ViewHeader Save + 사이드바 + 버튼 의미 변경)

### 코드 변경 요약
- **이동**: `docs/TODO.md` → `docs/.archive/`, NEXT-ACTION/SESSION-LOG/PHASE-PLAN-wiki-enrichment 동일, `docs/plot-discussion/` → `docs/.archive/plot-discussion/`
- **신규 docs**: `docs/.archive/README.md` (보관 이유 가이드)
- **타입**: `lib/types.ts:314` SavedView.viewMode union에 `"graph" | "dashboard"` 추가
- **3개 view (saved view 복원)**: `components/views/wiki-view.tsx`, `ontology-view.tsx`, `components/calendar-view.tsx`에 `useActiveViewId` import + savedView 복원 useEffect (~10줄 × 3)
- **카테고리 UI**: `components/views/wiki-category-page.tsx` 121줄 추가 — ContextMenu/ColorPickerGrid/Popover imports, CategoryFullListView에 색 dot + ContextMenu(Rename/Change color/Delete + undo), CategoryEditor에 Color Popover. `lib/store/types.ts` updateWikiCategory color 파라미터 추가
- **Sticker UI (신규)**:
  - `components/views/stickers-view.tsx` 신규 (754줄, LabelsView 복제)
  - `app/(app)/stickers/page.tsx` 신규 shell
  - `app/(app)/layout.tsx` StickersView always-mounted 등록
  - `components/linear-sidebar.tsx` More 섹션에 Stickers NavLink (Sticker Phosphor 아이콘 + count + dragContent)
  - `lib/table-route.ts` VIEW_ROUTES에 `/stickers` 추가

### 다음 작업 후보 (큐)
- **Saved Views 스냅샷 UX 개선 (옵션 C)** — ViewHeader Save 버튼 + 사이드바 + 버튼 의미 변경 (현재 viewState 캡처). 사용자 합의됨, 별도 PR
- **NoteStatus 리네이밍 Phase 1** — `inbox/capture/permanent` → `stone/brick/keystone` + IDB v101 마이그레이션. PRD 사전 조사 완료 (영향 범위 65 파일/353회). NoteTemplate.status, settings-store startView, graph-filter-adapter 인라인 리터럴, 테스트 4개, AGENTS.md까지 포함
- **Filter chip 3-part 드롭다운 Step B** — Field/Operator/Value 모두 popover, Linear 한 술 더 뜸. 사용자 명시 요청
- **카테고리 사이드바 트리** — linear-sidebar의 wiki space에 카테고리 트리 + 색 dot. 이번 PR scope 초과로 deferred
- **dead code 정리** — `components/views/wiki-sidebar.tsx` 어디서도 import 안 됨, 삭제 후보

### Technical Learnings
- **dead code 발견**: `components/views/wiki-sidebar.tsx`는 자기 자신만 정의, 어디서도 import 안 됨. 다음 정리 PR에서 삭제 후보
- **Saved View 적용 범위**: 사이드바 라우팅은 모든 space에서 동작했으나 viewState 복원은 Notes만 동작이었음. useEffect 패턴 복제만으로 해결 (~10줄/view)
- **Saved View 스냅샷 UX 결함**: + 버튼이 `createSavedView(name, undefined, space)` 호출 → 빈 default state 뷰 생성. 사용자가 "내 현재 상태를 저장" 의도로 + 누르면 빈 뷰만 생기는 문제. Linear 패턴 (ViewHeader Save 버튼)이 정답
- **single source docs 원칙**: 정보 중복 = 갱신 누락의 주범. CONTEXT.md/MEMORY.md/worklog가 같은 정보를 다른 형식으로 보존 → 별도 TODO/NEXT-ACTION/SESSION-LOG는 stale의 불가피한 운명
- **LabelsView 1:1 복제 패턴**: Sticker UI 만들 때 LabelsView 구조 그대로 복제 → 일관된 UX 자동 보장. drag-to-select, ColorPickerGrid, ContextMenu, ViewHeader 등 동일

---

## 🚀 2026-05-01 ~ 2026-05-02 세션 — Light Mode + Ontology 대규모 재설계 + Group by Hull + Sticker entity + Dashboard 3분할 (단일 PR 누적)

**범위**: 12개 큰 작업이 한 PR에 누적.

### 핵심 결정 1: "그래프 hull = 사용자 group by"

이전 멘탈모델 분열 ("Notes는 Group by, Ontology는 BFS 자동")을 깨고 통합. **Ontology = Notes/Wiki와 동일 view-engine**의 그래프 시각화 모드일 뿐.

### 핵심 결정 2: Sticker — 새 1급 entity

라벨/카테고리/태그가 의미 충돌 없이 분리되어 있는 상태에서 "임의 묶음" 슬롯이 비어있었음. Sticker가 그걸 채움:

| Entity | 대상 | 의미 |
|---|---|---|
| Label | 노트 only | 색 분류 (Linear 라벨) |
| WikiCategory | 위키 only | 분류 트리 (DAG) |
| Tag | 양쪽 | 주제/맥락 (`#zettelkasten`) |
| **Sticker** | **양쪽** | **임의 묶음 마커** (포스트잇) |

### 핵심 결정 3: 온톨로지 3분할

- **Graph** — 시각화 ("내 지식 구조가 어떻게 생겼지?")
- **Insights** — 행동 유발 ("내가 뭘 해야 하지?")
- **Dashboard** — raw stats, "사브메트릭스" ("내 지식 베이스 디테일이 궁금하다")

Stats(사이드바)는 stats에 충실, 행동 유발은 Insights로 분리.

### 새 데이터 모델 (v98 → v100)
- `WikiCategory.color: string`
- `WikiArticle.folderId?: string | null`
- `Sticker` interface 신규 + Note/WikiArticle.stickerIds (multi)
- 신규 slice: `lib/store/slices/stickers.ts` (CRUD + bulkAddSticker)
- `OntologyNode.tags/folderId/categoryIds/stickerIds` — group by lookup
- `GroupBy` 타입: `tag` / `category` / `connections` / `sticker` 추가
- `ViewMode`에 `dashboard` 추가
- v99: 카테고리 자동 색, v100: stickers: [] 보장

### 새 컴포넌트
- `components/ontology/node-context-menu.tsx` — 우클릭 메뉴 + 인라인 스티커 생성 (Linear quick-add 패턴) + 색 picker (생성 시 + 기존 스티커 변경)
- `components/ontology/ontology-dashboard-panel.tsx` — Volume/Connectivity/Health/Hubs/Tag frequency 섹션 (placeholder 수준, 다음 PR에서 확장)

### Hull 색 = entity 색 (자동 동기화)
| Group by | 색 출처 | 사용자 변경 |
|---|---|---|
| Sticker | `sticker.color` | ✅ 우클릭 메뉴 dot 클릭 (G8) |
| Label | `label.color` | ✅ 라벨 페이지 |
| Tag | `tag.color` | ✅ 태그 페이지 |
| Folder | `folder.color` | ✅ 폴더 시스템 |
| Wiki Category | `category.color` | (사이드바 UI는 다음 PR) |
| Status | NOTE_STATUS_HEX | ❌ 시스템 의미 보존 |
| Connections (legacy) | 알고리즘 기반 | ❌ entity 없음 |

→ Hull 색 변경 = entity 색 변경. 일관성 유지.

### Hull 인터랙티브
- hull = 블록 = 안의 노드들의 그룹 핸들
- `mousedown` → 멤버 multi-select + 첫 멤버 drag 트리거 → 그룹 이동
- `click` → 그룹 선택만
- `contextmenu` → 메뉴 (해당 그룹 전체 대상)

### 다중 선택 + Hull 드래그 (Mac Finder/Linear 패턴)
- **Ctrl/Cmd+click** = 노드 toggle (in/out)
- **Shift+click** = 노드 add (toggle X — 추가만)
- **Shift+drag** = marquee (영역 선택)
- 좌상단 hint: 선택 0개=단축키 안내(Kbd badge), 선택 시=카운트 + ✕

### Hull 드래그 부드럽게 (drag jitter 해소)
이전: 드래그 중 매 tick마다 hull path 재계산 → "꿈틀거림" + 사라졌다 다시 생기는 느낌.
신규: 드래그 시작 시 hull path 모양 freeze + SVG `transform=translate(dx,dy)`로 통째 이동. 멤버 노드들은 기존 group-drag 로직으로 동일 delta 적용. 드래그 종료 시 transform 해제 + 자연스러운 hull 재계산 (멤버 위치가 동일 delta로 이동했으므로 점프 없음).

### 연결 끊기 (시각 필터, 데이터 보존)
- ViewState에 `hiddenEdgeIds` / `hiddenEdgeKinds` / `isolatedNodeIds` 추가
- 우클릭 메뉴 액션: **Hide connections** (선택 노드의 모든 엣지 숨김) / **Isolate** (선택만 풀 opacity, 나머지 dim) / **Show all** (복원)
- 좌상단 amber 인디케이터: "N hidden · M isolated · Show all"
- visibleEdges 계산: filter pass + hiddenEdgeIdSet/hiddenEdgeKindSet 차단 + isolation 모드면 양 endpoint 모두 isolated이어야 통과
- 엣지 직접 우클릭은 다음 PR (path hit-area overlay 필요)
- Display popover edge type 세분화 (showWikilinks/relations/tags 토글)도 다음 PR

### Ontology 사이드바 진입점 재설계 (Wiki/Library 패턴)
이전: More 섹션에 Insights만, Dashboard는 별도 button. Overview 클릭해도 그래프로 안 돌아감.
신규: **Graph / Insights / Dashboard 셋 다 상단 navigation NavLink** (Wiki/Library와 동일 패턴). NavLink에 `onClickOverride` prop 추가 — 라우트는 모두 /ontology이지만 클릭 시 `plot:set-ontology-tab` 이벤트 fire → ontology-view에서 viewMode 전환 (graph layout/positions 보존).

### 범례 라이트모드 가시성
이전: 텍스트 색이 status별 (cyan #22d3ee 등) → 라이트 배경에서 거의 안 보임.
신규: 텍스트는 통일된 `#1e293b` (slate-800) + font-weight 500. Color 정보는 swatch (circle/hexagon)에서만 표시. Linear status badge 패턴.

### Stats 재구조 (Notes/Wiki 큰 카드 + 호버 tooltip)
이전: 작은 row만 (Nodes 9 / Edges 13) — 정보 부족.
신규: **Notes/Wiki 큰 숫자 카드** (grid-2col, font-semibold, 16px). 호버 시 native title로 status breakdown + 노트 제목 미리보기 8개. 행마다 `cursor-help` + 의미 설명. 푸터에 `N edges → Dashboard` 포인터.

### Filter chip 인라인 편집 (Step A — connectedTo direction만)
**3단계 로드맵**:
- Step A (이번 PR): connectedTo chip의 direction Popover 토글 (Both/In/Out)
- Step B (다음 PR): 모든 chip의 value 인라인 편집 (Status/Folder/Label 등)
- Step C (별도 PRD): chip의 Field 자체 swap (Connected → Status로 변경, value reset)

**구현**:
- FilterChipBar에 optional `onUpdateFilter?: (idx, rule) => void` prop
- chip render 시 `field === "connectedTo"` && `onUpdateFilter` 있으면 value를 PopoverTrigger button으로 wrap
- Popover 안: 3가지 옵션 (Both / Backlinks only / Links out only) + 현재 선택 ✓
- notes-table, notes-board에서 wire (next + idx replace)

**왜 Step A부터?**: Connection 필터는 사용자가 자주 방향 바꾸는 use case. 매번 우클릭 → submenu 가는 게 귀찮음. value 토글만 인라인이어도 핵심 가치 충족.

### 폴더 인라인 생성 (3개 진입점)
- **노트 우클릭** Move to folder → "+ New folder…" → window.prompt → 즉시 생성 + 자동 부여
- **위키 row 메뉴** FolderPickerSubmenu → "+ New folder…" 동일 흐름
- **multi-select 플로팅바** Folder popover → "+ New folder…" → bulk apply
- `createFolder` slice가 생성된 ID 반환하도록 변경 (void → string). type signature 동기화. palette 색 7개 cycle.

### Connection 필터 (in-place backlink/links 필터)
**핵심**: Ontology 그래프 가지 않고도 노트/위키 뷰 안에서 "이 노트와 연결된 entity만" 필터링.

**데이터 모델**:
- FilterField에 `connectedTo` 추가
- value 포맷: `<targetId>:<direction>` (direction = both | in | out)
- type ConnectionDirection export

**Filter 로직**:
- Notes (`lib/view-engine/filter.ts`): `note.linksOut` (this→target) + `extras.backlinksMap.get(targetId)` (target→this)로 양방향 처리. 자기 자신 제외
- Wiki (`lib/view-engine/wiki-list-pipeline.ts`): wiki linksOut가 titles라 `allArticles` extras 추가, title + aliases 매칭으로 양방향 체크

**UI**:
- 노트 우클릭 메뉴 → ContextMenuSub "Show connected" (Both / Backlinks only / Links out only)
- 위키 row 메뉴 → ShowConnectedSubmenu (FolderPickerSubmenu와 동일 인라인 expand-to-list 패턴)
- Filter chip 표시: `Connected · "노트 제목" (↔ both)`. formatFilterChip에 connectedTo 처리 추가
- 적용 시 토스트로 확인 알림

**3방향 토글 분리**:
- Both: 양방향 (default, 가장 직관)
- In (Backlinks): 이 노트를 참조하는 다른 entity만
- Out (Links out): 이 노트가 참조하는 다른 entity만

**Out of scope (다음 PR)**:
- 사이드 패널 Connections 탭 강화 (sortable + clickable list)
- Filter popover에 Connection 카테고리 (노트 picker로 직접 선택 — 우클릭 진입으로 충분히 커버됨)

### 다크모드 엣지 색 강화
EDGE_STYLE.alpha 값이 다크가 라이트보다 *낮게* 설정돼 있어 다크 모드 그래프에서 엣지가 거의 안 보였음. 수정:
- alphaRelation: dark 0.12 → 0.38 (light 0.30 유지)
- alphaWikilink: dark 0.08 → 0.30 (light 0.22 유지)
- alphaTag: dark 0.06 → 0.22 (light 0.16 유지)
다크 모드 가시성 ~3× 개선.

### 사이드바 Insights/Dashboard 아이콘 분리
이전: 둘 다 `IconInsight` (sparkle) — 시각적 구별 불가.
신규: Insights = `IconInsight` 유지 / Dashboard = `ChartBar` (이미 import되어 있던 컴포넌트).

### 폴더 = 글로벌 컨테이너 (노트+위키 공유)
**핵심 결정**: v99에서 이미 노트+위키 둘 다 folderId 가질 수 있게 데이터 모델 확장됐으나 UI는 노트만 표시. 이번에 UI까지 통합 완성.

**이름 결정 — Folder 유지**:
- Notion에는 "폴더" 자체가 없고 (Page hierarchy), Notion이 "Space"를 다른 의미로 사용 (Teamspace)
- 진짜 폴더 메타포 사용 앱: Apple Notes / Obsidian / Logseq / Evernote(Notebook)
- 친숙도 ★★★★★ + 노트앱 세계에서 폴더는 자연스러운 컨테이너
- 이름 변경 없이 의미만 확장 (학습 비용 0)

**구현**:
- 노트 row 우클릭 → "Move to folder" 서브메뉴 (Radix ContextMenuSub)
- 노트 플로팅바 → Folder popover 버튼 (bulk batchUpdateNotes)
- 위키 row 메뉴 → FolderPickerSubmenu 컴포넌트 (인라인 expand-to-list)
- 폴더 detail 페이지 `/folder/[id]` 완전 재작성 — 두 섹션 (Wiki / Notes) + "+ Add" 드롭다운
- 사이드바 폴더 카운트 = noteCount + wikiCount 합산
- layout.tsx 라우팅 fix — pathname `/folder/` 등은 isFallback 강제 (children 표시)
- createWikiArticle에 folderId? 필드 추가
- 위키 detail panel folder 셀렉터는 다음 PR

**Out of scope (다음 PR)**:
- 위키 detail panel에 폴더 셀렉터 (UI 영역 큼)
- 노트 detail panel folder display 정리
- 폴더 안에서 노트/위키 sort + group by

### 가시성 fix
- 위키 hex `#8b5cf6` → `#7c3aed` (더 진한 violet)
- light fillOpacity wiki 0.33 → 0.55, strokeWidth 2.0 → 2.4
- HULL light/dark 분기 (light fillOpacity 0.04 → 0.10, strokeOpacity 0.12 → 0.32)
- 범례 theme-aware (light = 흰 배경 + slate 텍스트)

### Phase 7 버그 fix
- `showViewMode` prop 누락 → ontology-view에서 Graph/Insights 토글 안 보였음. 1줄 수정.

### Stats 재설계 (Health → Stats)
- Density 삭제 (추상)
- Top hub: 숫자 → 노트 제목 표시
- 행동 유발 메트릭(Orphans/Untagged/Wiki coverage/Most linked)은 위, 단순 카운트(N nodes · N edges)는 푸터

### Display popover 정리
- Ontology View Mode 섹션 제거 (Graph/Insights/Dashboard는 사이드바 진입)

### Out of scope (다음 PR)
- 사이드바 Stickers 섹션 + /stickers 페이지 관리 UI
- 카테고리 사이드바 색 dot + Change color
- 위키 폴더 입력 UI
- Dashboard 추가 섹션 (time series, distribution, cluster analysis)
- 모바일 long press + 하단 액션바
- Phase 8 (계층 시각화), Phase 5 (Layout Switcher)

---

## 🚀 2026-04-30 야간 ~ 2026-05-01 새벽 세션 — Linear-style 필터/디자인 종합 개편 + 라이트모드 가시성 일괄 강화 + Ontology 그래프 통합 (PR #229~#232 4건 머지)

**범위**: 디자인/UX 종합 정비. Linear 필터 칩 패턴 + 필터 mismatch 수정 + Notes Index + 라이트모드 가시성 일괄 강화 + Ontology 그래프 WikiArticle 통합

### 완료 PR (4건)

**PR #229** — Notes/Wiki Parent·Children 컬럼 + Hierarchy 4분류 + StatusBadge border
- 이전 elated-cerf worktree의 작업 정리 commit + push + squash merge
- Notes 테이블 + Wiki 리스트에 Parent / Children 컬럼 (Display Properties 토글)
- Wiki Hierarchy 필터 4분류 (Root/Parent/Child/Solo, classifyWikiArticleRole 일관)
- StatusBadge border 추가 (다크/라이트 양쪽 가시성↑)
- 신규 ParentIcon / ChildrenIcon

**PR #230** — Linear-style 필터/디자인 종합 개편 (22 files, +425/-178)
- **필터 칩 4-part Linear 패턴**: `icon + field | op | value | ×`. `formatFilterChip` 헬퍼로 모든 case 분해
- **Order by chip 3-part**: `key | value+direction | ×`, 톤다운, py-2 균형
- **필터 시스템 mismatch 2건 수정**:
  - Pinned: view-configs `yes/no` ↔ filter.ts `true/false` → key 변경 + legacy backward compat
  - Content: `hasImage`/`hasCode`/`hasTable` 미구현 → 정규식 구현 추가
- **라벨 테두리 강화** (1.5px borderWidth + color-mix 55%) — 4곳 일관 (note-fields/notes-table/calendar-view/editor-breadcrumb)
- **Notes Index 토글** (Wiki 패턴 이식) — `groupByInitial` 기반 alphabetical view
- **Children hover tooltip** — Radix Tooltip로 자식 노트 이름 표시
- **wikiCategories 중복 제거** — 17 → 10개 (v95 → v96 마이그레이션)
- **Wiki 아이콘 통일** (BookOpen, 활동바와 일치)
- **체크박스 색상 통일** (`text-accent-foreground`)
- **드롭다운 가시성 강화** (QUICK FILTERS accent, 검색창 border, desc full opacity)
- Detail/Connections/Activity/Bookmarks 사이드 패널 라이트모드 가시성

**PR #231** — 라이트모드 가시성 일괄 강화 (78 files)
- 시스템적 sed 정비: `text-muted-foreground/20~50 → /50~70`
  - /20, /25 → /50
  - /30 → /60
  - /40, /50 → /70
- Library Needs Attention banner 강화 (border-2 amber-600/60, 텍스트 amber-600/400 font-medium)
- Wiki article "Updated 5d ago" + Aliases — `text-muted-foreground` full

**PR #232** — Ontology 그래프 라이트모드 + Wiki Article 노드 통합 + Labels/Library/Calendar (6 files)
- **Ontology 그래프 라이트모드 텍스트** — 노드 라벨 fill 하드코딩 흰색 → `var(--foreground)`. 엣지 라벨도 `var(--muted-foreground)`
- **WikiArticle 그래프 노드 통합** (사용자 지적: legacy isWiki 모델 deprecated):
  - `wiki:{id}` prefix 노드
  - parent-child hierarchy edges
  - article → note (note-ref blocks) edges
- Library Needs Attention border-2 amber-600/60
- Notes Labels 페이지: 컬럼 헤더 + 체크박스 (Notes 테이블과 통일)
- Calendar 요일 헤더 `text-foreground`

### 큰 결정 (영구)
- **필터 칩 4-part Linear 패턴 채택** (옵션 A) — `icon + field | op | value | ×` 모든 케이스
- **Quicklinks 위치**: Home prominent + 각 영역 사이드바 하단 collapsed (영역별 persist)
- **Quickfilters/Views 통합**: 시스템 quickFilter (🔒) + 사용자 SavedView (⭐) 한 섹션. 필터 드롭다운에서 Quick Filters 제거
- **사이드바 Inline Edit Mode**: 8px slide-right + DotsSix 핸들 + 👁 hide/show. 영역별 customization persist
- **WikiArticle은 그래프 노드로 통합** — legacy `isWiki` (Note에 wiki 분류) 모델 deprecated
- **체크박스 단일 패턴** — `bg-card border-zinc-400` + `bg-accent + PhCheck text-accent-foreground`. 모든 곳 통일

### 다음 즉시 액션 (우선순위 순)

**🔥 최우선 (디자인/가시성)**
1. **Library References/Tags/Files 페이지** 가시성 + 디자인 통일 (All Notes 수준)
2. **Library Filter/Display 디자인** (All Notes 수준)

**중간 (UX 신기능)**
3. **Quicklinks 구현** — globalBookmarks anchorType 확장 (folder/savedView/category 추가) + 사이드바 섹션 + Home prominent
4. **Quickfilters 통합** — view-configs.quickFilters → SavedView로 자동 시드 + `builtin: boolean` 필드
5. **사이드바 Inline Edit Mode** — DotsSix 핸들 + 드래그 + 👁 hide/show + sidebarCustomization persist (영역별)

**후순위 (Insights 정리 — 합의됨, 옵션 D)**
6. **GraphInsightsView → OntologyInsightsPanel 흡수** (graph stats 추가). 사이드바 More의 `/graph-insights` 제거
7. **InsightsView 이름 "Notes Health"** (Notes 영역 그대로 유지 — 처방 컨텍스트 보전)
8. **결정 근거**: "Single Source" 원칙은 **metrics에만** 적용. 개별 처방(Notes Issues)은 Notes 영역 유지가 컨텍스트 단절 없음

### Watch Out
- Tailwind `border-[1.5px]`은 v4에서 미적용 → `style={{ borderWidth: "1.5px" }}` 직접
- Store v96 (wikiCategories dedup). 다음은 v97 후보
- 라이트모드 새 코드 작성 시 `text-muted-foreground/30~50` 사용 자제 — `/60+` 또는 `var(--muted-foreground)` 직접

---

## 🚀 2026-04-30 오후 세션 — Sprint 1.4 완료 (4 PR 통합) + Wiki Hierarchy filter fix follow-up

**범위**: Sprint 1.4 4 PR 묶음 작업을 단일 commit으로 통합. Parent 위계 활성화 + Wiki 컬럼/차트/보드 뷰

### 완료 (Sprint 1.4 4 PR — 통합 단일 commit, ~40 파일)

**PR 1 (D) — Parent 위계 활성화 (노트 + 위키)**:
- 인프라: `lib/note-hierarchy.ts` 신규 (wiki-hierarchy 1:1 미러), `setNoteParent` action, view-engine extras에 allNotes/filterAwareRole/categoryNames
- UI: 사이드 패널 **Connections > Hierarchy 섹션** 신설 (Detail에서 Parent/Children 이동), Set parent picker, Children + Add child (multi-select picker, lazy mount), 노트 에디터 breadcrumb Parent crumb (1/2/3+ collapse), 노트 본문 footer 폐기 (NoteChildrenFooter 삭제)
- view-engine: Family / Parent / Role grouping (4 카테고리 Root/Parent/Child/Solo), Filter-aware role 토글
- Picker: NotePickerDialog/WikiPickerDialog multi-select 모드, queueMicrotask 순서, lazy mount
- UX 폴리시: CommandItem hover bg-accent → bg-hover-bg, DialogTitle/Description을 DialogContent 안으로, hover preview delay 300→500ms (Notion/Gmail 표준)

**PR 2 (B) — Wiki 컬럼 정비**:
- `WikiArticle.reads?: number` 필드 + **store v95 마이그레이션** (reads: 0 백필)
- `incrementWikiArticleReads` action + `openArticle` 시 호출
- view-engine SortField status (isWikiStub) / reads, WIKI_VIEW_CONFIG orderingOptions/properties 확장
- WikiList ColumnHeaders + ArticleTableRow에 status/reads/createdAt 컬럼

**PR 3 (C) — Wiki 차트 개선**:
- TimeSeriesPoint 5 필드 추가 (totalArticles/totalStubs/newArticles/newStubs/totalWikiEdges)
- timeseries.ts Article/Stub 분리 누적 + totalWikiEdges (wiki article 간 backlinks)
- WikiGrowthChart 리팩터 (bucketSize/dataFilter prop)
- WikiConnectivityChart 신규 (totalWikiEdges AreaChart, ResizeObserver)
- WikiInsightsChart 신규 wrapper ([Growth | Connectivity] + [Day Week Month] + Sub-tabs with count)

**PR 4 (A) — Wiki 보드 뷰**:
- WIKI_VIEW_CONFIG.supportedModes에 "board" 추가 → toggle 자동 노출
- `components/views/wiki-board.tsx` 신규 (~430 lines, Linear-style compact)
- **Multi-membership**: card key = `${articleId}::${groupKey}`, 같은 article 여러 컬럼에 unique 렌더
- Drag 분기: Category=multi-set add/remove, Parent=setWikiArticleParent, tier/linkCount/role/family/none=비활성
- 카드: 제목 + Status badge + Backlinks + Reads + Categories chip (label groupBy 시 자동 숨김)
- categoryNames extras로 raw id 누수 fix

### 큰 결정 (영구)
- **노트 parent 활성화** — 사용자 자유 트리 구조 ("유저의 마음대로"). 직전 cleanup 결정 번복
- **Hierarchy 섹션 = Connections 탭** — Detail은 메타데이터, Connections는 관계
- **본문 하단 footer 폐기** — 사이드 패널 Hierarchy가 단일 출처
- **Multi-membership 채택** (Category) — Plot 정체성
- **4 카테고리 모델** Root/Parent/Child/Solo (mutually exclusive). 코드는 일반 트리 정의 (parent X = root) 유지. UI 분류는 4 카테고리
- **Filter-aware role 디폴트 OFF** — 본질이 디폴트
- **Hover preview delay 500ms** Notion/Gmail 표준
- **위키피디아 + 나무위키 하이브리드** — 카테고리 DAG + Article 위계 single-parent tree
- **"Solo" 명칭 채택** — Orphan과 충돌 회피

### 다음 즉시 액션 (다음 세션)
1. **Wiki Hierarchy filter 4 카테고리 fix** (S, ~10분) — `_root`가 Solo 포함하는 이슈
2. **Sprint 1.5**: Outlinks 컬럼 + 위계 컬럼 (Children/Parent)
3. **follow-up**: 모든 picker lazy mount, Wiki List multi-membership 일관, Wiki 본문 footer 신규, v96 sortField 제거 단독

### Watch Out
- "Can't perform a React state update" warning = StrictMode dev only, prod 영향 없음
- Store v95 (reads). v96은 sortField/sortDirection 제거 단독
- "tier" 명칭 절대 사용 X — Stub/Article은 항상 "Status"

---

## 🚀 2026-04-30 오전 세션 — Sprint 1.3 완료 (디자인 polish + 사이드 패널 동기화 + Display Properties 동적 컬럼) + Sprint 1.4 plan 합의

**범위**: Sprint 1 후속 — 디자인 polish + 사이드 패널 + Display Properties + Wiki Article Detail typeof guard + 출시 빌드 fix

### Sprint 1.3 완료 (PR #228)

#### 12 파일 변경

**1. 아이콘 일관성 (3곳 통일 원칙)**

원칙 코드화: **공간 Overview 아이콘 = Activity Bar 아이콘 = ViewHeader 아이콘**

| 항목 | Before | After |
|------|--------|-------|
| Activity Bar Wiki | `BookOpen weight="light"` (흐림) | `BookOpen weight="regular"` |
| Activity Bar Library | `Books weight="light"` (흐림) | `Books weight="regular"` |
| Sidebar Wiki Overview | `IconWiki` | `BookOpen weight="regular"` (Activity Bar와 일치) |
| Sidebar Library Overview | `SquaresFour weight="light"` (뜬금없음) | `Books weight="regular"` |
| Sidebar References | `Books weight="light"` (Library와 충돌) | `Quotes weight="regular"` (인용 메타포) |
| ViewHeader Wiki | `IconWiki size={20}` (Activity Bar와 다름) | `BookOpen size={20} weight="regular"` |
| ViewHeader Library Overview | `SquaresFour weight="duotone"` | `Books weight="regular"` |
| ViewHeader References | `Books weight="duotone"` | `Quotes weight="regular"` |
| Library Empty State (refs) | `Books weight="duotone"` | `Quotes weight="regular"` |
| KB 카드 (Notes/Wiki/Tags/Refs/Files) | bgColor 박스만 (텍스트 0~+) | 실제 5 아이콘 채움 |
| Home INBOX section | `Tray` (사이드바와 다름) | `IconInbox` (사이드바와 일치) |

**2. Wiki Dashboard polish**
- `wikiViewMode === "dashboard"`일 때 Display + DetailPanel 토글 둘 다 숨김 (mode 분기)
- Wrapper에 `bg-secondary/20` (페이지 배경 톤) — 카드(bg-card)와 분리감 강화
- 카드들에 `shadow-sm` rest state 추가 (라이트모드 contrast)

**3. 라이트모드 Wiki List contrast**
- 컬럼 헤더: `text-2xs muted/70` → `text-note text-foreground/80` → 최종 `text-muted-foreground` (Notes 패턴 일치) + `bg-secondary/30`
- 체크박스: `border-border` → `border-zinc-400 dark:border-zinc-600 shadow-sm` (Notes row 체크박스와 일치)
- Sub-tabs (Overview/All/Articles/Stubs/Index): 비-active `/50`, `/60` → `text-muted-foreground` (full opacity, contrast 유지하며 흐림 해소)

**4. Quick Capture placeholder cycle**
- 정적 "What's on your mind?" → 5문구 cycle (3s 간격, 입력 시 정지)
- "Capture a thought…" / "Meeting notes…" / "A quotation…" / "An idea…" / "Something learned…"
- Linear 검색바 패턴

**5. 사이드 패널 동기화 (3건)**
- Wiki List 단일 select → sidePanelContext mirror (`selectedArticleIds.size === 1`)
- Notes List 단일 select → 동일 패턴 (`selectedIds.size === 1`)
- Space 전환 시 sidePanelContext null clear (Activity Bar `handleSpaceClick`) — wiki article context가 Notes로 안 따라감

**6. Wiki Article Detail Panel runtime fix**
- `article.layout.charAt is not a function` 에러 fix
- 옛 store 데이터의 layout이 `{type, columns}` object (Book Pivot 흔적)인 케이스
- `typeof article.layout === "string"` guard 2곳 추가 (line 147, 355)

**7. Wiki List Display Properties 동적 컬럼 ★ 핵심 fix**
- **사용자 직접 발견**: "Categories/Aliases 토글했는데 컬럼에 안 나옴 — 버그 아님?"
- 원인: WikiList가 hardcoded 4 컬럼 (Title/Backlinks/체크박스/Updated). visibleColumns 토글 무시
- Fix: `WikiListProps`에 `visibleColumns?: string[]` + `wikiCategories?: WikiCategory[]` 추가
- ColumnHeaders + ArticleTableRow conditional render
- Categories chip + count 패턴: 첫 chip (accent) + `+N` (Linear 식 컴팩트)
- Aliases도 동일 패턴
- hover 시 native `title` attr로 전체 표시
- `—` JSX text node escape 버그 → `{"—"}` expression으로 fix

**8. 빌드 fix (pre-existing)**
- `home-view.tsx:41 n.backlinks?.length` (Note type에 없음) — `useBacklinksIndex` hook 사용으로 정확히 fix
- 출시 빌드 통과로 NEXT-ACTION.md 알려진 이슈 1건 해소

#### 사용자 명시 결정 (Sprint 1.3 도중)

- **(b1) worktree 정리**: `naughty-khorana-7b0358` worktree 제거 (force, file lock으로 디렉토리 일부 잔존하지만 git에서 unregister) → 현재 worktree(`upbeat-kare-f30bd8`)에서 그 브랜치 체크아웃하여 작업 통합
- **위키 아이콘 다른 거로 교체 X** — BookOpen 유지하되 weight만 강화
- **카테고리 chip + count** — list view 컴팩트 우선, 전체는 Detail 패널에서 (시각적 hierarchy)

#### 학습

- **사용자 직접 버그 발견 → 즉각 fix가 정답** (Display Properties 동적 컬럼)
- **들여쓰기 차이로 replace_all 누락**: line 944 `<IconWiki size={20} />` 들여쓰기 8 spaces, 다른 두 곳은 10 spaces. replace_all이 들여쓰기까지 매칭하니 누락. 수동 직접 변경 필요했음
- **JSX text node에 em dash 직접 입력**: Edit 도구가 `—` literal string으로 저장해 버그. `{"—"}` expression이 안전
- **`article.layout` object 잔존 데이터**: Book Pivot 흔적. typeof guard로 빠른 fix, 마이그레이션은 별도 PR로
- **Plot 영구 규칙 재검토 가능**: "Wiki Gallery만 신중 검토"였던 영구 규칙, 사용자가 보드 뷰 필요하다 판단해서 재검토. group by 명확하면 검토 OK
- **Hub Tier 자동 분류 → 폐기**: "사용자 통제 없는 자동 분류는 혼선" — 좋은 비판
- **dev server preview 포트**: 처음 13497, 이후 reused: true로 3002 (실제 우리 server). 사용자 화면 = 우리 코드 반영

### Sprint 1.4 plan 합의 (2026-04-30 다음 세션, "tier" 충돌 발견 + Parent 위계 활성화 추가 후 수정 — 2주 묶음)

**A. Wiki 보드 뷰**
- `WIKI_VIEW_CONFIG.supportedModes`에 "board" 추가
- View mode toggle (List ↔ Board)
- `WikiBoard` 컴포넌트 (Notes 보드 패턴 재활용)
- **Group by 4종** (Multi-membership: article이 `categoryIds[]` 길이만큼 N번 표시 — Plot "지식 관계망" 정체성 부합):
  - default: **Category** (가변, 카테고리 이름 자체)
  - **Category Tier** ★ 신규 (1st/2nd/3rd+ depth, `WikiCategory.parentIds` 트리 깊이)
  - **Status** (Stub/Article 2-column, `isWikiStub` 기반). 옛 "Tier" 명칭 폐기 — "tier"는 코드베이스에 4가지 의미로 이미 사용 (CategoryDepth / ArticleParentDepth / wikiTierFilter / Infobox PR Tier)
  - **Parent Article** (`parentArticleId` 위계, `lib/wiki-hierarchy.ts` 인프라 재활용 — PR #218 "Tier 4c 위키 parent-child article")
- 카드: 제목 + **Status badge** (Stub/Article) + Backlinks + Updated + 옵션 Categories chip
- 카드 drag → 그룹 변경 (Category / Status / Parent)

**B. Wiki 컬럼 정비** (List + Board 카드 공유)
- **Status** 컬럼/badge (Stub/Article 자동, `isWikiStub` 기반) ★ 새 — "Tier" 명칭 폐기
- Reads 컬럼 ★ 새 — `WikiArticle.reads: number` 필드 + store 마이그레이션 **v96** (v95 = sortField deprecated 제거 단독, 분리) + `openWikiArticle` reads++ 로직. SortField `"reads"`는 [lib/view-engine/types.ts:35](lib/view-engine/types.ts:35)에 이미 정의됨
- Created 컬럼 ★ 새

**D. Parent 위계 활성화** (Note + Wiki 양쪽) ★ 신규 — A의 Group by Parent Article 의존성으로 같은 sprint
- **D1. Parent picker UI** (사이드 패널 Detail): 위키 (set 추가) + 노트 (set 신규). WikiPickerDialog / NotePickerDialog 재활용. 사이클 가드 `lib/note-hierarchy.ts` 신규 (wiki-hierarchy 패턴)
- **D2. 노트 breadcrumb + Children 섹션** (위키 이미 있음): 에디터 상단 + 본문 하단
- **D3. List 뷰 Family 그룹핑 옵션** (Notes + Wiki): view-engine `applyGrouping` family case. 같은 루트 조상 묶고 depth 들여쓰기. **List 5종 / Board 4종** 차이
- 데이터 변경 없음 (Note `parentNoteId` + WikiArticle `parentArticleId` 둘 다 single-parent tree, 이미 정의됨)

**C. Wiki 차트 개선**
- Growth 차트 Article/Stub 분리 (stacked bar + multi-line)
- 차트 sub-tabs (`All` / `Articles` / `Stubs`) — Wiki List sub-tabs와 동일 디자인
- **Knowledge Connectivity 차트 추가** ★
  - 차트 종류 토글 (`Growth` / `Connectivity`)
  - 시간별 wiki article 간 backlinks 합 시각화
  - `cumEdges` 인프라 재활용 (timeseries.ts 이미 부분 계산 중)

UI 계층:
```
[Growth | Connectivity]                    ← 차트 종류 (상위)
                       [Day Week Month]    ← 시간 단위
[All] [Articles] [Stubs]                   ← 데이터 필터 (Growth만)
```

### Sprint 1.5 plan

- **Outlinks 컬럼** (Notes + Wiki 일관 적용) — 데이터는 이미 존재, UI만 추가

### 폐기 (영구)

- Hub Tier 자동 분류 (사용자 통제 부재로 혼선)
- Folder 컬럼 (Wiki) — Categories가 그 역할
- Words 컬럼 (Wiki) — 길이로 분류 안 함

---

## 🚀 2026-04-29 (오후 후반) 세션 — **출시 준비 우선 결정. Sync는 v2.0**

**같은 세션 내 재고 — (a) → (c) 변경**:

Sync 6개 결정 + PRD 작성 후 사용자 재고: "꼭 페이즈 1부터 해야 되나? 우선은 앱부터 다듬고 출시 계획을 제대로 진행하고 싶은데?"

→ 결정 #3 **(a) Sync 포함 출시 → (c) Free 출시 후 v2.0에 Sync** (6개월~1년 후)

**이유**:
- Sync = 3~4개월 작업, 그 동안 사용자 facing 개선 멈춤 위험
- 앱 폴리시 빚 있는 채로 인프라 쌓는 건 위험
- 출시 후 실제 사용자 피드백 반영해서 sync 설계 보강 가능
- 1인 개발 부담 분산

### 출시 4-Sprint 계획 수립

**타임라인**: 자유 (끝날 때까지) — 품질 우선
**플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일
**모바일 전략**: PWA + TWA (Bubblewrap → Google Play Store)

**Sprint 1 (~2주): 빠른 wins**
- P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) 한 PR
- 필터/디스플레이 드롭다운 정리 (액티비티별 일관성)

**Sprint 2 (~3주): 핵심 폴리시**
- 노트 템플릿 시드 10~20개 (onboarding 강화)
- 온톨로지 메트릭 설명 툴팁
- 캘린더 현황 점검 + 부족분
- Views 업그레이드 (실용적으로)
- Insights 업그레이드 (실용적으로)

**Sprint 3 (~2주): 데스크톱 출시 자산**
- 도메인 결정 + 구매
- 마케팅 사이트 (별도 워크트리)
- Privacy Policy + Terms (sync 없는 버전, 한국 + GDPR)
- 데스크톱 웹 배포

**🎯 데스크톱 Free 출시**

**Sprint 4 (회원 수 충분해진 후): 모바일 추가**
- 모바일 반응형 감사
- PWA manifest + Service Worker
- Bubblewrap TWA 빌드
- Google Play Store

**Sync v2.0 (출시 후 6개월~1년)**
- SYNC-PRD.md 활성화 (PRD 보존됨)
- 사용자 피드백 반영해서 보강

### 학습

- **(a) → (c) 재고가 좋은 예** — 결정 후에도 "정말 지금 시작?" 자기 검증
- **PRD 보존이 좋은 결정** — v2.0 시점에 다시 활성화 가능, 작업 낭비 X
- **출시 → 피드백 → sync 설계 보강** = 더 나은 sync 결과 기대

---

## 🚀 2026-04-29 (오후) 세션 — **다중 기기 sync 6개 결정 LOCKED + PRD 작성**

**큰 방향 전환 확정**: Plot에 다중 기기 sync 도입 + 수익 모델. 영구 규칙 "큰 방향 전환 전 전체 설계 확정"에 따라 6개 결정 받고 PRD까지 작성한 후 Phase 진행.

### 6개 결정 (LOCKED)

| # | 항목 | 결정 | 비고 |
|---|------|------|------|
| 1 | Sync 옵션 | **B. Supabase + E2E 암호화** | 균형 (프라이버시 + 일정 + 비용) |
| 2 | 가격 | **Free / Sync $5 / Pro $10** | Obsidian 동일 |
| 3 | 출시 시점 | **(a) Sync 포함 출시** | 첫인상 sync 가치 어필 |
| 4 | CRDT/Y.Doc | **노트+메타 모두 Yjs** | 충돌 안전 최대화 |
| 5 | 결제 | **결정 보류** (Phase 4 시점) | Lemon Squeezy 잠정 |
| 6 | 인증 | **Magic link + Google + Kakao** | SMS 영구 폐기 |

### 결정 흐름

1. 사용자 의향 (이전 세션 끝): "다중 기기 sync 필요해. 옵시디언도 이걸로 유료 구독료 받잖아."
2. /before-work 실행 → SYNC-DESIGN-DECISIONS.md (이전 세션 작성한 옵션 비교) 가이드 받음
3. 사용자에게 6개 결정 받음 (옵션 / 가격 / 출시 시점 / CRDT / 결제 / 인증)
4. 옵션 1번 (Sync 옵션)에서 사용자가 비용 비교 요청 → A vs B 상세 비용 분석 제시 → B 선택
5. 인증에서 한국 OAuth (카카오, SMS) 질문 → SMS 영구 폐기 + Kakao 추가 결정
6. 6개 결정 → PRD 작성 (10 섹션, 11~15주 = 3~4개월 phase 분할)

### 산출물

- **`docs/SYNC-PRD.md`** (신규, 10 섹션):
  - Goals + Non-Goals
  - User Stories (Free / Sync / Pro)
  - Technical Architecture (Stack, 데이터 모델, E2E 흐름, Sync 프로토콜, 결제 흐름)
  - Phase 분할 (Phase 1: 인증+백업 3~4주 / Phase 2: 양방향 sync+Yjs 4~5주 / Phase 3: 다중기기+Pro 2~3주 / Phase 4: 결제+출시 2~3주)
  - Risks & Mitigations (9개 위험)
  - Open Questions (Phase 진입 전 결정 항목)
  - Success Metrics (출시 6개월 후 목표: 500+ 사용자, 3% 전환율, $75+ MRR)

- **`docs/SYNC-DESIGN-DECISIONS.md`** (갱신): 6개 결정 LOCKED 표 + 위험 재정리
- **`docs/NEXT-ACTION.md`** (갱신): Phase 1 Week-by-Week 작업 가이드 + 사전 작업 체크리스트
- **`docs/CONTEXT.md`** (갱신): 최상단에 sync 결정 + Phase 분할 추가
- **`docs/TODO.md`** (갱신): "큰 방향 sync" 섹션을 LOCKED + Phase 1 작업으로 변경

### Y.Doc 폐기 결정 (2026-04-27) 뒤집음

이전 "Wiki Y.Doc 폐기"는 **단일 사용자 + 단일 IDB** 전제. 다중 기기 sync 도입 시 CRDT(Yjs)가 충돌 해결의 표준이라 재활용 결정. 노트 본문 + 메타 모두 Yjs.

### 영구 규칙 추가 (sync 관련)

- 단일 사용자 도구 유지 — 협업 모드 안 만듦. 다중 기기만 sync.
- E2E 암호화 절대 양보 X — 사용자 노트 내용은 서버가 못 봄.
- 오프라인 우선 — sync는 옵션, 인터넷 없을 때도 동작.
- 마스터 비번 분실 = 데이터 복구 불가 — Recovery Phrase 강제 표시.

### 다음 세션 즉시 시작 (Phase 1)

1. Supabase 계정 + 프로젝트 3개 (dev/staging/prod)
2. Lemon Squeezy + Kakao Developers + Google Cloud Console 사전 준비
3. `@supabase/supabase-js` 설치 + `lib/supabase/` 신규
4. Magic link 인증 UI

---

## 🟢 2026-04-29 (오전) 세션 — v0 협업 흡수 + UI polish + dead code 정리 + P0 필터 + Row density 시도/revert (5 PR)

5개 PR 머지. 이 세션 주제는 "외부 디자인 도구(v0)와 협업 흡수 + 5 앱 필터 리서치 기반 P0 강화 + 영구 규칙(시각적 다양성 ≠ Plot 코어) 재확인".

### PR #220 (23fe1be): v0 작업 흡수
v0 cloud에서 작업한 라이트모드 contrast + Home View 리디자인 12개 파일 흡수. v0 환경 wrapper(`next.config.mjs` — `*.vusercontent.net` 도메인 / turbopack v0 캐시 / `next.user-config.mjs` 의존)는 별도 commit으로 revert. 깔끔한 PR. **워크플로우 정립**: v0가 push → Claude Code가 git worktree로 받아서 환경 잡음 제거 → PR + 머지.

### PR #221 (4f5165a): UI polish + dead code 14개
**체크박스 6 위치 통일**:
- `bg-card` (라이트 흰 배경) / `dark:bg-input/30` + `border-zinc-400` / `dark:border-zinc-600` + `shadow-sm` + `rounded-[4px]` + `hover:border-zinc-500`
- `components/ui/checkbox.tsx` (Radix base), `notes-table.tsx` (header select-all + row), `wiki-list.tsx`, `library-view.tsx`, `filter-panel.tsx`

**라이트모드 chart 색 WCAG AA 통과**:
- `--chart-2` (Inbox) #0891b2 → **#0e7490** (cyan-700, contrast 3.4 → 5.5)
- `--chart-3` (Capture) #ea580c → **#c2410c** (orange-700, 3.7 → 4.6)
- `--chart-5` (Permanent) #16a34a → **#15803d** (green-700, 3.0 → 5.0)
- `StatusShapeIcon`: `NOTE_STATUS_HEX` (hex 직접) → `NOTE_STATUS_COLORS[status].css` (CSS var) — 라이트/다크 자동 분리. 노트 row 왼쪽 작은 ○ 아이콘이 라이트모드에서 더 진해짐

**Dead code 14개 정리**:
- Notes: `orderPermanentByRecency`, `showThread`, `nestedReplies` toggle
- Wiki: `showStubs`, `showRedLinks` toggle
- Wiki Category: `showDescription` toggle, `showEmptyGroups` toggle, `tier`/`parent`/`family` grouping options
- Calendar: `showReminders` toggle
- `display-panel.tsx` "Built-in toggles" 섹션 통째 제거

**유지** (Explore가 dead 분류했으나 executor 깊이 파보니 실제 사용): `showNotes`/`showWiki` (calendar-view), `showDescription` 내부 (wiki-category-page), `showEmptyGroups` ViewState (notes-table/board), `tier`/`parent`/`family` 내부 grouping (wiki-category-page)

### PR #222 (f613532): P0 필터 강화 (5 앱 리서치 기반)
다른 노트앱 5개 (Linear/Notion/Obsidian/Capacities/Bear) 필터 시스템 리서치 후 P0 4개 도출:

- **P0-1 역링크 수 소트** — 이미 구현+노출 확인 (sort dropdown "Links" + sort.ts:46 `backlinksMap` 정렬). 사용자에게 안내만
- **P0-2 True orphan 필터** — `_orphan` value 추가 (linksOut=0 AND backlinks=0). 새 quickFilter "True orphans". 기존 "Orphans" → "Unlinked (no outbound)" 라벨 명확화
- **P0-2 보너스 "Has backlinks" 활성화** — view-configs에 옵션 있었으나 filter.ts 처리 X였던 dead config 활성화
- **P0-3 Wiki-registered 필터** — `FilterField.wikiRegistered` 추가. Note title+aliases ↔ WikiArticle title+aliases lowercase 매칭. `PipelineExtras.wikiTitles?: Set<string>` 추가
- **P0-4 부분 적용** — Has backlinks로 일부. note picker 기반은 다음 PR

**인프라 확장**: `applyFilters(notes, filters)` → `applyFilters(notes, filters, extras?)`. extras에 `backlinksMap` + `wikiTitles`. pipeline.ts / use-notes-view.ts 호출부 갱신. `wikiTitles` Set은 use-notes-view에서 wikiArticles store 구독해서 title + aliases lowercase로 합산.

### PR #223 (7423c08): Row density dropdown 통합 (시도)
**문제**: Compact mode + Show card preview 두 토글이 같은 차원(행 밀도) 별도 관리 → 충돌 가능 + 사용자 혼란.

**시도**: Notion식 Row height (Short/Medium/Tall) 패턴으로 통합. `ViewState.rowDensity?: "compact" | "standard" | "comfortable"` 새 필드. v92 migration. display-panel에 segmented 3-button control + 라인 밀도 SVG 아이콘.

### PR #224 (7472321): Row density 제거 (Linear 방식 회귀)
**사용자 피드백**: "Comfortable 모드 엉망. Linear 방식(별도 토글 X)으로 가자."

**revert**: rowDensity 필드 + segmented control + 모든 사용처 제거. v93 migration으로 rowDensity 필드 삭제. Linear 스타일 정착:
- Notes 리스트 단일 행 (40px)
- 자동 반응형 `containerWidth < 480` → 32px (모바일/좁은 화면)
- preview 없음 (Linear는 preview 토글 없음)

**의의**: "시각적 다양성 ≠ Plot 코어" 영구 규칙(2026-04-22 자각) 재확인. Notion 패턴 시도 후 Plot에 안 맞음 발견 → 즉시 revert. Plot 코어(지식 관계망)에 토글 옵션 적은 게 맞다는 학습.

### Store version
v91 → **v92** (PR #223 rowDensity 추가) → **v93** (PR #224 rowDensity 제거). Forward-only chain. 사용자 어떤 버전에서 시작해도 Linear 스타일로 정착.

### 5 앱 리서치 결과 (Plot 향후 방향)

**P0 (모두 이번 세션 완료)**: 역링크 소트 / 고아 필터 / 위키 등재 / 역방향 링크

**P1 (다음 세션)**:
- ✨ **Sub-group** (S, 인프라 있음) — Notes만. Status × Priority 같은 두 차원 그룹핑
- **Multi-sort** (S~M) — Primary + Secondary
- **날짜 상대값** (S) — "이번 주" / "지난 7일"
- **Wiki 1차 groupBy** (M, 별도 PR) — WikiList에 그룹핑 자체 X. linkCount bucket / infoboxPreset 별

**P1에서 제외**:
- Saved View — 이미 구현됨 (`lib/store/slices/saved-views.ts`). 검증만
- 그룹별 카운트 — 사이드바와 중복 ROI 낮음

**P2 (출시 후 검토)**:
- AND/OR 중첩 필터 빌더 (L, over-engineering 위험)
- Wiki Gallery 뷰 (L, Notes Gallery는 영구 규칙 위반)
- Time in status (M, noteEvents 활용 단축 가능)

**Anti-pattern (영구 폐기 권장)**:
- 뷰 타입 대량 추가 (Notion 8가지 같은) — Plot은 데이터베이스 앱 X
- AI/LLM 필터 — Plot 영구 결정 위반
- 태그별 독립 정렬 — Bear 커뮤니티 미해결, 인지 부하 ↑
- 과도한 컬럼 (Linear 15+) — Plot dimensional 부족
- Manual ordering 드래그 — 노트 수십~수백 규모에서 유지 불가

### 작업 흐름 학습

- **executor agent 위임 패턴 정립** — multi-file 변경(체크박스 6 / dead code 14 / P0 4 / Row density 통합 9 / Row density 제거 8)은 모두 executor 위임이 효율적. 명확 spec + tsc/test 자동 검증
- **dead code 정밀 분리 패턴** — Explore agent 1차 분류 후 executor가 깊이 파봐서 "UI dropdown만 dead vs state field 진짜 사용" 분리. 무자비한 삭제 X
- **HMR 캐시 이슈** — 큰 schema 변경(P0 PR / Row density 시도) 후 React Hooks 순서 에러 / Fast Refresh full reload 발생. dev server restart로 해결
- **Recharts ResponsiveContainer 회피 (계속 적용)** — React 19/Next 16에서 width 0. ResizeObserver 직접 패턴 (`wiki-growth-chart.tsx` 참고)
- **v0 + Claude Code 협업 패턴** — v0가 디자인 작업 자동 push → Claude Code가 worktree로 받아서 환경 잡음 제거 후 PR + 머지

---

## 🟢 2026-04-26 세션 — Plot 디자인 + 인사이트 대규모 (큰 세션, ~9시간)

**한 세션 9개 PR + 다수 핫픽스 — 인포박스/Navbox/배너 다채로움 + Connections 풀 강화 + Ontology Insights 허브 + Home 정체성 분리.**

### 핵심 아키텍처 결정
- **Home = 데이터 대시보드 + 빠른 진입** (Quick Capture / Stats / Recent / Quicklinks). 시간 기반 워크플로우(Inbox/Today/Snooze) 제거.
- **Ontology = Single Source of Insights** — 모든 정비 행동(Orphan/Promote/Unlinked/메트릭)은 Ontology Insights 탭으로 이전.
- **Pinned 통합 시스템** — Note.pinned + WikiArticle.pinned (NEW) + Folder.pinned + SavedView.pinned + globalBookmarks 모두 Mixed Quicklinks에 통합.

### PR 1-3: 인포박스/Navbox/배너 다채로움
- **PR 1**: Wiki Infobox type 11 프리셋 (custom/person/character/place/organization/work-film/work-book/work-music/work-game/event/concept) + Group Header 토글 + 색상 picker. Store v83.
- **PR 2**: Navbox/Navigation 풀 디자인 — 다단 헤더 / 그룹 / 색상 / 1-6 col 그리드 / 펼치기·접기 (Editorial-Imperial 스타일, 나무위키 "명 황제" 수준). Store v84. luminance 기반 자동 contrast.
- **PR 3**: Banner 4 다채로움 — 좌측 아이콘 8종 / Compact·Default·Hero / stripe 옵션 / gradient 옵션. Settings 통합 popover. Store v85.

### PR 4: Connections 상세 (블록 단위 + 인라인 스니펫)
- `extractBlockLinkContexts` walker — TipTap JSON 재귀, 4종 링크(wikilink/noteEmbed/wikiEmbed/referenceLink) + mention 노드 매칭, blockId dedupe, 140자 스니펫
- `useBacklinksWithContext` 훅 — 2단계 (title-match 동기 + IDB 비동기 contentJson 로드)
- `BacklinkCard` — Obsidian 스타일 카드 + sub 스니펫 + hover 풀 프리뷰 (`showNotePreviewById` 재사용)
- 위키 source도 contentJson scan (block 단위 추출)
- `outboundLinked`에 위키 article title 매칭 추가 (이전 누락 버그)
- `@` mention도 Connections에 잡히게 (4종 케이스 [[]] / @ × 노트 / 위키 모두 처리)

### PR 5: Discover mention + 위키 source + IDB 캐시 + hydration
- `discover-engine.ts`에 mention 가중치 추가 (W_BACKLINK 4 / shared mention 2x)
- `mention-index-store.ts` 신설 — `plot-mention-index` IDB DB (edges + sources 양방향). `getMentionSources(targetId)` O(1) 룩업
- `persistBody/removeBody` hook에 자동 wiring → 모든 노트 CRUD가 자동 인덱싱
- `view-header.tsx` 3 Popover에 hydrated guard (Radix aria-controls SSR/CSR mismatch fix)
- `<ClientOnly>` 신규 컴포넌트 추가 (재사용)

### PR 6: Ontology Insights 탭
- `lib/insights/types.ts` + `lib/insights/metrics.ts` (순수 함수 엔진)
- `useKnowledgeMetrics` 훅 (사이드바 Health + Insights 패널 단일 source)
- 새 메트릭 7종: Knowledge WAR (top 10), Concept Reach (2-hop), Hubs, Link Density, Orphan Rate, Tag Coverage, Cluster Cohesion
- `OntologyTabBar` (Graph / Insights), Graph keep-alive (display:hidden 토글)
- `OntologyInsightsPanel` — 세이버메트릭스 미니멀 (라벨 + 숫자 row만)
- `OntologyNudgeSection` 추가 — Orphan / 위키 승격 후보 / Unlinked Mention 액션 카드
- `linear-sidebar.tsx`의 Health 섹션 O(N²) 인라인 → O(1) 훅 호출

### PR 7-8: Home 정체성 분리 + 디자인 iteration
**원칙**: Home은 담백한 데이터 대시보드. 시간 기반 (Inbox/Today/Review) 제거. 정비 인사이트 → Ontology.

**Home 최종 구성** (사용자 다회 피드백 반영):
- Quick Capture (max-w-2xl 가운데)
- StatsRow (5 카드: Notes/Wiki/Tags/Refs/Files, 컬러 적용 — blue/violet/emerald/amber/rose, sub 텍스트로 Coverage/Stubs/Active/Unused/Size)
- RecentCards (4 카드, h-32, preview + meta)
- MixedQuicklinks (Note pinned + Wiki pinned + Folder pinned + SavedView pinned + Bookmark 통합 카드)
- "Improve your knowledge graph →" CTA → Ontology Insights 탭으로 점프
- max-w-5xl

**시도 후 롤백한 것들**:
- Linear 큰 리스트 (옵션 1): "디자인 별로"
- Plane 풀 미러 (Greeting + Quicklinks + Stickies + Rediscover): "너무 많음"
- Knowledge Nudge in Home: 압박감 → Ontology로 이전

### Wiki article 핀 시스템 (NEW)
- `WikiArticle.pinned: boolean` 필드 추가 (Store v87)
- `toggleWikiArticlePin` 액션 추가
- 사이드패널 wiki article detail 우상단 Pin 버튼 (PushPin 아이콘, accent 강조)
- Wiki dashboard에 PINNED 섹션 추가 (Featured Article 다음, Categories 전)
- Home Quicklinks에도 통합 표시

### 핫픽스 다수 (v86-v91)
- **v86**: `wikiArticle.infobox` undefined backfill (런타임 TypeError 해결)
- **v87**: `WikiArticle.pinned` 백필
- **v88**: 모든 위키 article 강제 unpin (잘못 박힌 핀 클린업)
- **v89**: `noteType wiki` notes dedup by title (가장 오래된 keep, 나머지 trashed)
- **v90**: `wikiArticles` 배열 dedup (별도 entity)
- **v91**: idempotent re-run (이전 마이그레이션 누락 대비)
- `createWikiStub` dedupe 가드 — 동일 title 이미 있으면 ID 재사용 (자동 등재 무한 누적 방지)
- Wiki view에 `!trashed` 필터 추가
- Slash description 영어 통일 / 루비 텍스트 base 티어에서 완전 제거 / Inline Math NodeView (Popover) 신규 / popover 정렬 (`align="start"` + collisionPadding) 통일

### Note Split 기능 (P2 must-todo 완료)
- WikiSplitPage 패턴 그대로 노트에 적용
- `lib/note-split-mode.ts` (외부 store, useSyncExternalStore)
- `components/views/note-split-page.tsx` (좌 체크리스트 / 우 새 노트 preview, heading 그룹 자동 선택)
- `splitNote` action (atomic, source content 분할 + 새 노트 생성 + persistBody 양쪽)
- 진입점 3곳: 노트 에디터 ⋯ / 리스트 우클릭 / 플로팅 액션 바
- 글로벌 마운트 (app/(app)/layout.tsx의 NoteSplitOverlay)
- 빈 컨텐츠 graceful 처리 + IDB hydration

### 나무위키 Tier 2-4 (사용자 결정으로 진행)
- **Tier 2 배너 블록** (PR 3 참조)
- **Tier 3a age + dday** 인라인 매크로 (Popover NodeView, 한국식 만 나이 + 한국어/영어 라벨 영어로 통일)
- **Tier 3b Include** — 기존 NoteEmbed/WikiEmbed에 alias + 양방향 활성화 + cycle guard (`lib/embed-cycle.ts`)
- **Tier 4a 각주 이미지** — Reference.imageUrl 필드 + footnote modal에 Image URL input + footer 썸네일. Store v81.
- **Tier 4b 루비 텍스트** — 사용자 결정으로 **완전 제거** (한국어 사용자 거의 안 씀, 노트앱 표준 X)
- **Tier 4c 위키 parent-child article** — `WikiArticle.parentArticleId` + breadcrumb + Children 섹션 + 사이클 가드 (`lib/wiki-hierarchy.ts`)

### Y.Doc P0-1 (P0 부분 진행)
- y-indexeddb 패키지 설치
- `lib/y-doc-manager.ts`에 IndexeddbPersistence 통합 + `whenReady` Promise + `getIsFresh()` post-hydration 판정
- `NoteEditorAdapter`에 `ydocReadyForNoteId` state 추가 (mount gate)
- 사이드 이슈: `plot-note-bodies` IDB v3 bump + post-open store-presence check, StarterKit duplicate extension (link/underline/gapcursor) 비활성화

### Store version: v82 → **v91**
9 마이그레이션 추가 (v83~v91). 모두 안전 (백필 또는 idempotent dedup).

---

## 🟢 2026-04-25 세션 — 코멘트 시스템 대규모 작업 + 통합 + 미니맵

**한 세션 18 커밋 — Plot 코멘트 인프라 전체 구축 + 사이드패널 통합 + 디자인 폴리시.**

### Phase 1: Comment 데이터 모델 (v77~v79)
- `Comment.status: "backlog" | "todo" | "done" | "blocker"` (Linear 스타일)
- `Comment.parentId` (1단계 답글 / threaded reply)
- `CommentAnchor` 4 종: `note`, `note-block`, `wiki`, `wiki-block`
- v77: status + parentId 필드, v78: Reflection/Thread → Comment 마이그레이션, v79: "note" → "backlog" 리네임

### Phase 2: 코멘트 UI 시스템
- **`CommentPopover`** (인라인 트리거): 위키 블록 옆 호버 → 클릭 시 popover (560px, w/ overflow-hidden 클립)
- **`CommentsByEntity`** (사이드패널 Activity 탭): 엔티티의 모든 코멘트 한 곳 — block + entity-level 통합
- **`CommentEditor`** (TipTap "comment" tier — 라이트): `[[wikilinks]]` + `#tags` + 마크다운 단축키. 툴바 X (코멘트는 가벼운 메모라는 사용자 결정)
- **`CommentBodyDisplay`**: read-only 렌더 (JSON or plain text 둘 다)
- **`StatusPicker`**: portal 기반 (z-[10011], 부모 popover 오버플로우 영향 X)
- **`MoreMenu`**: ⋯ — Reply primary, Convert to Note + Delete inside

### Phase 3: 블록 마커 + 인라인 진입점
- **`BlockCommentMarker`**: 블록 우측에 항상 보이는 말풍선 + status dot + 갯수. 클릭 시 popover trigger 역할
- **`use-block-comment-status.ts`**: `useBlockCommentStatus(anchor)` + `useCommentStatusByBlockId(blockId)`
- **위키 모든 블록 8종 대칭**: section/text/note-ref/image/url/table/navbox/navigation 모두 인라인 [💬 마커] [🔖 북마크] [⋯ 메뉴] cluster (left-full top-1 ml-2 거터)
- **`NoteCommentMarkerLayer`**: ProseMirror 블록 위 absolute overlay → 노트 본문 어디든 인라인 코멘트 (BlockDragOverlay 패턴)

### Phase 4: 통합
- **Activity 통합**: ThreadPanel/ReflectionPanel 폐기 → `CommentsByEntity` 단일 컴포넌트 (note + wiki 공용). `lib/store/slices/reflections.ts` 삭제
- **Bookmarks 통합**: `GlobalBookmark.targetKind: "note" | "wiki"` (v80 migration). 사이드패널 Bookmarks 탭 = 모든 핀 통합 표시 + Filter chips ([All/Notes/Wiki]) + Search input. SECTIONS 섹션 제거 (Detail Outline과 중복)
- **Connections 통합**: 위키에 `linkingNotes` 추가 (linksOut 기반 backlinks)
- **Pin → Bookmark 네이밍 통일**: `PushPin` → `BookmarkSimple` 아이콘. 사이드패널 PINNED 헤더 제거 (탭 이름과 중복)

### Phase 5: 위키 블록 + Navbox
- **Navbox 하이브리드** (Wiki 표준 호환): Auto/Manual 모드 토글
  - Auto: 카테고리 자동 필터 (기존)
  - Manual: WikiPickerDialog로 article 직접 선택 (Wikipedia/나무위키 표준)
  - Wiki 리서치 결과: Navbox는 100% 수동 큐레이션이 표준 — Plot은 둘 다 지원
- 모든 블록 cluster overflow-hidden 잘림 버그 수정 (wrapper 분리)

### Phase 6: 코멘트 composer 디자인 폴리시
- 본문 article 섹션 번호와 일치하는 미니맵 (Option F + G):
  - Phosphor 아이콘 통일 (이모지 전부 제거: 📄📝📎🖼️🔗📊🗺️🧭)
  - 블록 타입별 컬러 stripe (note-ref=blue, image=emerald, url=cyan, table=purple, navbox/nav=amber, callout=yellow, code=pink)
  - 섹션 = accent 색깔 번호 badge ("1", "1.1", "2.3.1") — H 아이콘 제거
  - 섹션 사이 separator + font-semibold visual 강조
- TipTap 툴바 시도 (note tier + FixedToolbar) → 사용자 피드백으로 라이트 코멘트 tier로 롤백

### TOC entry 코멘트 배지
- TOC 항목에 코멘트 갯수 배지 (`useCommentStatusByBlockId` 활용)
- 코멘트 있는 블록을 가리키는 TOC entry 즉시 인지

### 활동 바 + 클릭 네비게이션
- Activity Bar Wiki 아이콘 `IconWiki` → `BookOpen` (Notes와 시각 구분)
- Wiki 북마크 클릭 시 `setActiveRoute("/wiki")` + `navigateToWikiArticle()` (이전엔 `window.location.hash`만 변경되어 안 됐음)
- 8회 retry scroll + ring-2 highlight (1.5s)

**커밋 18개:**
1. session: TOC 세로선 제거 + comments/bookmarks WIP
2. feat(comments): Linear status + threaded + Activity 통합
3. feat(comments): 노트 인라인 마커 + 레거시 정리 + Note→Backlog
4. feat: Bookmarks + Connections 통합
5. feat(comments): TOC entry 코멘트 배지 + 통합 마무리
6. feat: Bookmark 네이밍 통일 + 노트 인라인 북마크
7. feat(bookmarks): 모든 위키 블록 cluster + Filter chips + Search
8. feat(navbox): Auto/Manual 하이브리드
9. feat(comments): TipTap 미니 에디터 통합
10. fix(comments): 풀 에디터 + 폭 조정 + 본문 스크롤
11. fix(comments): 컴팩트 툴바
12. fix(comments): 풀 FixedToolbar 복원
13. fix(comments): 툴바 가로 스크롤 작동
14. revert(comments): 풀 툴바 롤백 — 라이트 유지
15. refactor(comments): document-level 드롭다운 Phosphor 통일
16. feat(comments): document-level 드롭다운 미니맵 (Option G)
17. feat(comments): 미니맵 섹션 번호 (1, 1.1, 1.2)

**핵심 정책 결정**:
- Comment 본질: 가벼운 메모. 풀 에디터 툴바 X. 마크다운 단축키 + 위키링크 + 해시태그로 충분
- Linear 스타일 status: Backlog/Todo/Done/Blocker (Linear 정통 영감)
- Pin = Bookmark (네이밍 통일, 시각 통일 BookmarkSimple)
- Navbox: 자동(편의) + 수동(Wiki 표준) 둘 다 (하이브리드)
- 미니맵: 코드 아이콘 일관 (F) + 시각적 구조 표현 (G)

**스토어 v80 (이전 v76)**.

---

## 🟢 2026-04-24 세션 — TOC 비주얼 폴리시 + contentBlock Enter 조사

**TOC gutter 번호 계층 시각화 최종 결정**:
- 세로선(실선/점선/페이드/원+선) 전부 "별로" 피드백
- 웹 리서치(Notion/Craft/Obsidian/Bear/Wikipedia/나무위키): **본문에 부모-자식 연결선을 그리는 앱 거의 없음**. Outliner(Logseq/Workflowy)만 사용. 문서 앱은 전부 폰트 크기+들여쓰기+여백만으로 계층 표현.
- 최종: 세로선 완전 제거. 번호만 거터에 opacity 0.9 / weight 700 유지 (희미하게 바꿨다가 "잘 안 보인다" 피드백으로 롤백).
- `components/editor/EditorStyles.css`의 `[data-toc-child-depth]::after` 제거됨.

**contentBlock Enter 버그 조사 (미해결)**:
- 증상: contentBlock 안 단락 중간에서 Enter → 블록 밖으로 튀어나감
- 원인: ProseMirror `splitBlock` 기본 동작이 `$from.depth === 0 ? 1 : 2`로 split하여 contentBlock 래퍼까지 쪼갬
- 시도: `addKeyboardShortcuts` Enter 커스텀 핸들러 + `tr.split(pos, depth-cbDepth)` + `priority: 1000` — 전부 효과 없음
- 결론: **"근본적으로 안 되는 걸로 알기"로 사용자 판단**. 롤백 완료.

**리서치 레퍼런스** (세로선 구현 관련):
- Obsidian Lapel 플러그인 = gutter 텍스트 레이블 방식
- CSS counter로 TipTap 자동 번호 가능 (GitHub Discussion #914)
- Logseq bullet threading은 `:has()` 셀렉터 필요 → 퍼포먼스 이슈

---

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

## Store Slices (22 total, v94)
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
- **PR #NEW (2026-05-07)**: Plot v3 Phase 0 cleanup (store v112)
  - `lib/types.ts`: SavedView.viewState.viewMode `"table"` → `"grid"` 교체 (view-engine ViewMode exact match)
  - `lib/view-engine/defaults.ts`: normalizeViewState legacy `"table"` → `"list"` rawViewMode helper
  - `lib/store/migrate.ts` / `lib/store/index.ts`: v112 idempotent migration
  - `app/globals.css`: `--v3-priority-{high,medium,low}: unset` `:root` + `.dark` 선언

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
