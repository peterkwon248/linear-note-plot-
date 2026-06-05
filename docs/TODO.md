# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제. 자세한 history는 SESSION-LOG.md + MEMORY.md.

**마지막 갱신**: 2026-06-05 (집/Windows, 저녁) — **에디터 버그픽스 3건 (PR #539) + 마크다운 템플릿 D안 착수→롤백**. yjs OFF 배지 제거 + placeholder 힌트 영구 숨김 latch + backlog nudge 제거(#539 머지, 클린빌드 50/50). 이어 마크다운 템플릿 변환(유저 "## Today raw" 버그) D안 착수 — UpNote 조사로 "명시적 변환 명령(Ctrl+Alt+V)" 모델 확정. `@tiptap/markdown@3.25` 공식확장은 core 3.25 exact peerDep → react@3.22 등과 버전스큐 빌드깨짐 → **롤백**. **다음 = B방식(marked+generateJSON 격리 유틸, core 무관)으로 재구현** — SESSION-LOG hook 참조. **🔴 교훈: @tiptap 부분 버전업 금지(스큐), computer-use 보조모니터 불안정.**

---

## 🟣 P0 — 즉시 (cross-machine 진입점, 2026-05-31 — IA 헌법 적용 단계)

### 0.0003. **🔴 P0 (다음 세션 최우선): 마크다운 템플릿 변환 — D안 B방식 (marked + generateJSON)**

> 유저 버그: 템플릿에 `## Today` 마크다운 넣으면 raw로 박힘(Plot=리치텍스트, 마크다운 파서 없음). `## `는 실시간 타이핑 input rule로만 H2 변환, 일괄삽입/템플릿은 raw. **D안 = UpNote식 명시적 변환 명령**(`Ctrl+Alt+V` "Paste from Markdown", 일반 붙여넣기·코드/인용은 안 건드림). 날짜치환(`{{YYYY}}-{{MM}}-{{DD}}`→오늘)은 이미 됨(`lib/store/slices/templates.ts` `expandPlaceholders`, UpNote 호환).
> - **B방식 확정** (A=@tiptap 전체 3.25 통일은 NodeView[math/infobox/callout/columns/banner] 회귀위험으로 기각): `@tiptap/markdown@3.25`는 core 3.25 **exact** peerDep라 단독설치 시 react@3.22 등과 스큐(`cancelPositionCheck` 없음) 빌드깨짐 → **롤백 완료**. → **core-독립** = `marked`(md→HTML) + TipTap `generateJSON(html, createRenderExtensions())`(HTML→JSON) 격리 유틸.
> - **첫 스텝**: `marked` 설치 확인(@tiptap/markdown 롤백으로 빠졌을 수 있음, 없으면 `npm i marked`) → `lib/editor/markdown.ts` 신규(`markdownToJson`/`jsonToMarkdown`, 메인 에디터 0터치) → vitest(`## Today`·리스트·bold·유저 멀티블록 템플릿) → 클린빌드.
> - **그 다음**: ② `Ctrl+Alt+V` "마크다운으로 붙여넣기" 명령 ③ 템플릿 적용 시 마크다운 변환 + 템플릿 작성 "마크다운으로 입력" 옵션.
> - SOT: SESSION-LOG 2026-06-05 저녁 hook.

> ✅ **2026-06-05 저녁 (PR #539): 에디터 버그픽스 3건** — ① yjs OFF 배지 완전 제거(`NoteEditorAdapter`, dev PoC 진단배지+dead import `getRefCount`) ② placeholder 힌트 영구 숨김 latch(`empty-hint-placeholder`, plugin state `dirtied` — 글자 넣었다 지워도 부활X, 제목 heading도 내용판정) ③ backlog nudge 제거(`use-autopilot-nudges`+i18n, backlog=기본 휴식 상태라 노트1개만 있어도 매 세션 triage spam이던 것; SRS·클러스터 유지; dead i18n키 `nudge.backlog.*` EN/KO 정리). 클린빌드 50/50·tsc0. **데스크톱 plot.exe는 `npx tauri build` 재빌드해야 반영.**

> ✅ **2026-06-05 오후~저녁 (PR #538, 6커밋): 대규모 i18n sweep + 버그픽스** — ① 필터 드롭다운 화면 잘림(FilterPanel 가용 뷰포트 높이 캡+collisionPadding) ② 에디터 placeholder 동작(제목/본문 어디든 쓰면 사라짐, top-level paragraph만 보던 버그) ③ v139 위키템플릿 부활 버그(migrate else 분기 제거, v106/v127/v152 동일 정정) ④ **i18n ~500+ 문자열**(위키·에디터 툴바/표/메뉴/다이얼로그·인서트/슬래시 블록라벨·Books 전체·사이드패널 connections~45/detail·사이드바 메뉴·헤더툴팁 +→"새 노트") ⑤ 에디터 버그2(블록 우측 북마크 □ opacity-20→0 호버노출·yjs 배지 dev게이팅). 전수 스캔(~400) 후 고가시성 ~250 처리. 검증: 클린빌드 exit0·vitest318·tsc0·참조키 grep 전수.

### 0.0005. **🔴 P0 (이번 직속 후속): 남은 영어 i18n 2차 sweep (~150개)**

> 고가시성(Books·패널·다이얼로그·사이드바·에디터)은 PR #538서 완료. 전수 스캔으로 확정된 **남은 표면**:
> - **설정**: appearance/editor/preferences/backup/sync 옵션 라벨 + 동적 메시지(백업/복원 토스트, relativePast 헬퍼 "Xm ago" 등) — `app/settings/**`
> - **온톨로지**: `ontology-graph-canvas.tsx` 그래프 컨트롤 ~8 title(Cluster/Spread/Zoom/Reset/Clear selection 등) + `ontology-tab-bar.tsx` aria + `insights-charts.tsx`
> - **뷰 leftover**: library-view ~30(References/필드 추가·View as·Sort by 등)·templates ~23·folder-detail ~16(섹션 헤딩·빈 상태, useT 없음)·inbox ~6·home 약간
> - **인포박스 프리셋 라벨**("Blank/Person/Place…") = `lib/wiki-infobox-presets.ts` **데이터 레이어** → preset에 labelKey 추가 + 소비처 `t(labelKey)` (블록 라벨 패턴과 동일)
> - **슬래시 블록 *설명* sub-text**(라벨은 했고 description만 영어 남음) + FixedToolbar 오버플로 그리드 단축 라벨
> - **방법(확립됨)**: 병렬 executor wiring(하위 컴포넌트마다 useT)+키맵 → KO 일괄(용어 가이드, docs SESSION-LOG hook) → `git diff`로 EN 복원 → 참조키 grep 전수검증 → **`rm -rf .next && npm run build`(파이프 없이)**.
> - **첫 스텝**: 설정 + 뷰 leftover(가시성 높음)부터.

> ✅ **2026-06-05 (PR #537): 로케일별 온보딩 시드** — 브라우저 언어 감지(`settings-store.ts` detectInitialLanguage, SSR 가드) → KO 브라우저는 한국어 UI+한국어 시드, EN은 영어. KO 온보딩 볼트(`lib/store/seeds-ko.ts`): 노트 8(사용법·정리 도구 한눈에·제텔카스텐·영구/임시 노트·실전·복리·메모)+위키 4(note-ref 임베드·카테고리 DAG)+북 2(수동·스마트)+카테고리 5(DAG)+태그/라벨 5+스티커 1. EN 보강(`seeds.ts`: Organizing Tools 노트+SEED_STICKERS). onRehydrate 게이트 로케일 분기 + 전 시드 노트 body IDB 영속(리로드 유지) + 위키블록/Memo라벨 로케일 분기. build0. 헤드리스(`--lang=ko-KR`+새 프로필) 노트/위키/북 육안 검증. **신규 유저만 적용**(hasSeeded 게이트).

### 0.0008. **🟡 P0 (사용자 관심, 2026-06-05): 모바일 대응 — 반응형 진단 → PWA/네이티브**

> 사용자 "모바일 배포 가능?" 문의. 현 앱=데스크톱 UI(사이드바·다중 패널·호버) + 로컬퍼스트 **무싱크** → "바로"는 불가. **첫 스텝**=반응형 진단(폰 375px서 깨지는 곳 헤드리스 `--window-size=390,844` 캡처·목록화). 다음=PWA(정적 `out/`+manifest/SW→설치, GH Pages 가능) 또는 네이티브(Tauri 2 모바일, Xcode/Android Studio+스토어 계정 $99/$25·서명). **근본 제약=싱크 부재**(모바일=데이터 섬) → 클라우드 싱크(Yjs CRDT 로드맵)와 동반 필요. 랜딩은 이미 모바일 반응형+배포됨.

### 0.001. **🔴 P0: 앱 영어 잔여 i18n 일괄 점검 (sweep)** (사용자 지정)

> 2026-06-04 밤 넛지 토스트 3종(백로그·SRS·클러스터)이 `useT` 없이 영어 하드코딩된 것 사용자 적발·수정(이 PR). 적발식 대응(이전 온톨로지 포함)=whack-a-mole → **선제 일괄 sweep** 전환.
- **색출**: 사용자 노출 문자열인데 `t(`/`useT` 안 거치는 것 — `toast("`+``toast(` `` 영문, JSX 텍스트 영문, `aria-label`/`placeholder` 영문. `hooks/`·`components/` 우선.
- **수정 패턴**: `useT()` 배선 + 영문 리터럴 → `t("key")` + `lib/i18n.ts` EN/KO 키(보간 `.replace("{count}", String(n))`). 본보기=`hooks/use-autopilot-nudges.ts`(이 PR).
- **i18n 시스템**: `lib/i18n.ts` — EN(@20, `DictKey=keyof typeof EN`) / KO Partial(@1079) / `useT`(@2149, `useSettingsStore.language`). 신규 키 EN+KO 둘 다.
- **검증**: `npm run build`(유일 신뢰 게이트). dev서 언어 ko 토글 육안.

> ✅ **2026-06-04 밤 (이 PR)**: **랜딩 보강 + 번역투 정리 + 제텔카스텐 섹션 + 앱 토스트 i18n** — ① 랜딩 "How it works" 3단계 walkthrough(wiki/books/home.png) + 그래프 조작법 스트립 + "사용법" nav(검증된 플로우 기반, 미사용 스샷 3장 소진) ② 랜딩 KO 번역투 ~34곳(당신 남발 제거·직역 관용구 한국어화) ③ "제텔카스텐이 뭔가요?" 설명 섹션(루만+원칙3+Plot연결) ④ 고아→고립(8곳) ⑤ **앱 넛지 토스트 3종 영어 하드코딩 → useT**(nudge.* 10키 EN/KO). build0. 랜딩=브라우저 검증(데스크톱/모바일/EN-KO/콘솔0).

### 0.005. **🟡 뷰엔진 타임라인 그룹 마무리 (#10/#11/#4/#7)** (carry — 랜딩 우선으로 후순위)

> 2026-06-04 뷰엔진 11버그 중 보드/그리드/휴지통 7개 완료(아래 ✅), **타임라인 4개 WIP**. 사용자 데스크톱 재빌드(plot.exe)로 1~9 테스트 중 — 피드백 받고 진행.
- **#10 북 타임라인 캔버스 collapse**: TimelineControls는 뜨나 그 아래 SVG 캔버스가 0높이. books-view 래퍼 `overflow-y-auto`→`flex overflow-hidden`(notes shell 패턴) 적용했으나 dev서 여전히 collapse. `books-timeline-view.tsx` height 체인 vs `notes-timeline-view.tsx`(전용 shell) 비교 필요.
- **#11 북 타임라인 그룹화 작동 X**: `books-view.tsx bookGroups={groups}`가 패널 groupBy 변경에 recompute되는지 와이어링 확인. `defaultGroupByByMode.timeline="kind"` 락 의심.
- **#4/#7 노트/위키 타임라인**: 컨트롤 게이팅 풀림(display-panel) → 뷰가 그룹화 지원하므로 재빌드 검증 대기. (위키 서브그룹핑은 위키 전반 미지원=별도.)
- **검증**: dev preview 불안정(screenshot 타임아웃·HMR stale) → 빌드+사용자 화면이 신뢰 게이트.

> ✅ **2026-06-04 (이 PR)**: **뷰엔진 디스플레이 7버그** — #1/#5 보드 "+N more"→HoverCard(가려진 칩 내용 표시, property-chips PropertyChipRow) · #8 북 보드 visibleColumns 기반 칩 · #3/#6/#9 노트/위키/북 그리드 디스플레이 프로퍼티스 칩 + 선택 체크박스 · #2 휴지통 배지(TrashedChip) · display-panel 게이팅(grid/timeline이 board 상속→타임라인 그룹화·프로퍼티스/그리드 프로퍼티스 토글 노출). architect 전수매핑 후 3 executor 병렬. build0.

> ✅ **2026-06-02** (이 PR): **P1 데스크톱 셸 (Tauri 확정) + Plot 아이콘** — `src-tauri/` scaffold(Tauri 2.0, frontendDist=../out, `com.plot.app`, plot.exe, 창 1280×800) + `devUrl` 제거(debug도 out/ embed) + out/ 빌드 검증(50p) + 기동(WebView2 Chromium 147 렌더: Home/사이드바/웰컴노트) + 다크 그레이 관계망 구 아이콘(`app-icon.svg`→tauri icon, 라이트/다크 양쪽 대비). `@tauri-apps/cli` devDep. 앱/Store 무변경(v154). **Tauri 확정**(Electron 폴백 불필요).

> ✅ **2026-06-01 저녁** (PR #513): **캐치올 라우팅** — 동적 4개(folder/tag/label/books [id]) → 단일 클라이언트 캐치올 `app/(app)/[...slug]` + folder UI 추출(`folder-detail-view`) + `output:export`(prod만, env-gated) + `generateStaticParams` placeholder. **`out/` 50p+404.html+`_.html`.** tsc 0, dev catch-all 동적 렌더 검증.
> ✅ **2026-06-01 저녁** (PR #514): **디테일바 peek** — `NotesTableView` onRowClick single click 시 `sidePanelOpen`이면 `sidePanelContext` 갱신(`handleRowPreview`). 디테일이 클릭 따라옴 + 폴더 전환 stale 해소.
> ✅ **2026-06-01 저녁** (타임라인 PR): **타임라인 막대 약화** — `timeline-bar` opacity 0.45(인터랙션 0.95). status 막대 full color ↔ 이벤트 노드 구분(메모리 룰 "이벤트 칩 주인공").
> ✅ **2026-06-01 오후** (이 PR): **리디자인 비파괴 프리뷰 스캐폴딩** — 5 surface(홈/사이드바/노트리스트/에디터/인사이트)를 라이브 0 touch로 순수 presentational+mock+view-model+preview 라우트 추출(`components/redesign/` + `app/preview/redesign/`, 23파일, 병렬 4-executor). Open Design 핸드오프용. tsc 0, 5라우트 렌더 검증, hydration 픽스(Date.now()→PREVIEW_NOW). **앱/Store 무변경(v154).** 디자인 보류·상용화 우선 결정.
> ✅ **2026-06-01** (PR #508): **데이터 라이프사이클 PR1 — 삭제 cascade 완전성**. `deleteNote`(attachment blob/comments/books.items) + `deleteWikiArticle`(자식 reparent/attachment/relations/comments/books.items/wikiCollections) + `permanentlyDeleteTag/Label/Reference` cross-entity dangling + `permanentlyDeleteBook` sticker. + books-slice.test tsc hotfix. 회귀 테스트 6.
> ✅ **2026-06-01** (PR #509): **PR2 — re-seed 1회성 (store v153→v154)**. `hasSeeded` flag + onRehydrate dev(데모)/prod(웰컴노트 1개) 분기 + migrate id-dedup backfill 3곳 제거 + `WELCOME_NOTE`. 삭제 데이터 부활 0. 사용자 실화면 검증(보존+부활0).
> ✅ **2026-06-01** (PR #510): **PR3 — trash UI 좀비 해소**. `permanentlyDeleteSmartBookPreset` 신설 + trash-all-view에 WikiTemplate/SmartBookPreset 섹션 노출 + i18n.
> ✅ **2026-05-31 밤늦게** (이 PR, 계획): **데이터 라이프사이클 감사 발견 + spec** (`data-lifecycle-audit.spec.md`) — re-seed 부활 버그(`index.ts:319` notes 비면 전 엔티티 부활) + 위키 blocks IDB orphan(`deleteArticleBlocks` 미호출 — **후속 감사서 오류 판명, 실제 정상**) 확정. 전수 감사는 다음 세션. 앱 코드 무변경.
> ✅ **2026-05-31 밤** (이 PR, 계획 세션): **상용화 전략 + 데스크톱 로드맵 spec** (`desktop-local-first.spec.md`) — 무료 로컬-퍼스트 데스크톱 먼저(A) / 하이브리드 저장(B: .md+.plot 사이드카) / Tauri / 캐치올 라우팅(ⓑ). 앱 코드 무변경.
> ✅ **2026-05-31 저녁** (이 PR): **온톨로지 정리 §13** — insights(발견) 탭 해체 → 분석=Dashboard 통합(Cohesion/Top Notes/Density) · 발견(Nudge)=Inbox `detected`(ontology-nudge) · 그래프 고아 ring · 사이드바 Insights nav 제거 + Home→Inbox. + **사이드바 헤더 행**(닫힘 버튼 B, Inbox 카운트 겹침 해소) + **/graph-insights 폐기**(고아·Dashboard 중복·stale). 19파일 +135/−758.
> ✅ **2026-05-31 낮~오후** (이 PR): §11 북·위키 status/priority 워크플로 완성 — Books status 세터 = **detail panel + 보드 status 4컬럼 드래그 + list 인라인 피커 + 그리드/보드 배지**, Book·Wiki **priority 필터·배지·세터**(manual·hybrid만). + **코멘트→Inbox**(`comment` kind, todo/blocker→do) + **북마크 퀵링크스 capped 버그** + **셸 PanelsMenu 중복 제거/§10 Phase1**(디테일 토글 우상단 정합 + 에디터 햄버거 중복 제거).
> ✅ **2026-05-31 밤** (PR #501, 2커밋): 아이콘 리니어화(스티커 SVG·온톨로지 Waypoints·라벨 Ribbon) + **SPACE_ICONS SOT** + Item C 인기순위(Home·Wiki) + §11 북 status필터·reads(v153) + Home §13 슬림화(KB 3그룹 + 중복 4섹션 제거).
> ✅ **2026-05-31 낮~저녁** (8커밋): 셸 §10 footer/레일(Trash 강등·Help·레일 절제) + 색·아이콘 시스템 정합 + IA 헌법 §13(Home 종합대시보드 A→C) + 지식베이스 9-entity + 엔티티 아이콘 SOT(`lib/entity-icons.tsx`).
> ✅ **2026-05-30 심야 완료** (PR #497): **IA 헌법 수립**(14챕터) + **Inbox 전역 승격**.
> ✅ **2026-05-30 밤** (PR #495+#496): A3.2 스키마 엔진 + 폰트 Pretendard + A3.3 필터 크롬 + 노트행 모션 + 셸 1차.
> ✅ **2026-05-30 저녁/낮**: Track A 착수(A0~A2) PR #494 / 통합 정합성 8커밋 PR #493.

### 0.01. **🟡 보류: 디자인 ③ 진단 → ① 철학 재조정 (Linear 과한 절제 탈피)** (상용화 후 재개)

> ⏸️ **보류(2026-06-01 오후)**: 사용자 결정 "디자인은 다음에, 상용화 우선". 리디자인 **비파괴 프리뷰 스캐폴딩 완료** → `/preview/redesign`에서 5 surface(홈/사이드바/노트리스트/에디터/인사이트) shell 확인 가능. 재개 시 = 내부 콘텐츠(에디터 실제 블록·사이드바 5/7 컨텍스트·노트 board/grid·인사이트 그래프) + 나머지 ~20 surface 추출 + Open Design 핸드오프. 컨벤션: `components/redesign/README.md`.

> 사용자 결정(2026-06-01): "리니어에 너무 집착", "지나친 절제에 매몰". 노트앱=실용·심플·발견성. 기능 많은 Plot엔 Notion식 발견성/블록 유연성이 더 맞을 수 있음. SOT = memory `project_design_direction_reconsider.md` + SESSION-LOG 2026-06-01.

**접근 (순차, 위험 단계적 + 목업 우선)**: **③ 진단**(홈/사이드바/노트리스트/에디터/인사이트 "어디가 답답한지/발견성↓" 구체 점검 → ground truth) → **① 철학 재조정**(토큰·인프라 유지, 절제→실용·발견성, Notion 장점 선택 도입) → 필요시 **② 전면 재설계**.
- **첫 스텝**: surface별 진단 — 각 화면 캡처/실측으로 "기능이 숨어 답답한" 지점 목록화. `linear-design-mirror` 스킬 + Notion/실사용 레퍼런스 비교. 목업 = Open Design 또는 HTML 프로토타입(코드 전 시각 검증).
- **불변(코어)**: 지식 관계망(팔란티어×제텔카스텐)·NOTE_STATUS_HEX·"Gentle by default"(**gentle ≠ 절제**). Notion 약점(산만·느림) 답습 경계.
- **데이터 감사 = 완료** (PR1/2/3 머지, 위 ✅). 출시 블로커 0.

### 0.015. **🟡 P0 (감사 잔여, 별도 트랙): comments/folders soft-trash (PR4 후보)**

감사 중 발견: `comments`(`deleteComment` hard)·`folders`(`deleteFolder` hard, cascade는 완벽)는 soft-trash 없음 → 실수 삭제 시 복구 불가. soft-trash(trashed 필드 + restore + trash UI 노출) 추가. **schema 변경 + store version bump 동반**이라 PR2급 신중 작업(데이터 모델 변경 분리 원칙).

### 0.02. **🔴 P0 #1: P3 — 출시 전 안정화 (백업/복원 완전성 점검+수정 ✅)** ← 다음 시작점

> SOT: `desktop-local-first.spec.md` Roadmap **P1✅(Tauri 확정+release 번들)** → **P3**(백업 완전성✅ → 안정화 잔여). **출시범위 A = P0+P1+P3**(P2 `.md` 저장은 v1.1).

- ✅ **2026-06-02 정오**: **release 빌드 + 양쪽 번들 완료(무서명)** — `npx tauri build` → `.msi`(7.7MB) + NSIS `.exe`(6.6MB) + plot.exe 스모크(WebView2 렌더). NSIS flaky(`os error 5`=부분추출, AV 아님) 해결=캐시 삭제 재시도. config 폴리시(publisher Plot/identifier com.plot.desktop/nsis currentUser). **무서명 v0.1.0 합의**(Azure $9.99/월=한국 지역 자격 미달 공산, OV/EV=유저 0 과투자). MSI 메타 검증.
- ✅ **2026-06-02**: Tauri 2.0 스파이크 — scaffold + out/ embed 렌더 = Tauri 확정 + 관계망 구 아이콘.
- ✅ **2026-06-02 오후**: **백업/복원 완전성 점검+수정** — `plot-wiki-block-meta`(out-of-line keyed) 백업 format "objects"→**"kv"**(articleId 키 유실+복원 DataError 버그) + openDbForRestore keyPath=format기반 + 복원 후 mention/search 캐시 리셋 + fake-indexeddb 라운드트립 테스트(신규). 5 store 중 1개 깨짐(수정), yjs=실험 OFF라 무관, note.content=meta 존재.
- ✅ **2026-06-02 오후#2**: **그린 테스트 스위트** — pipeline date grouping 2개 stale 수정(빈 버킷 숨김+Yesterday 반영, 구현이 옳음) + migrate-v107 7개 `describe.skip`(문서화: vitest ESM이 migrate lazy require 못 풂, frozen 마이그라 prod-critical migrate.ts 미수정). **318 passed/7 skipped/0 failed**, tsc 0.
- ✅ **2026-06-02 오후#3**: **데드코드 — 죽은 auto-enroll/wiki-conversion 서브시스템 제거**. `wiki-auto-enroll.ts` 삭제(startAutoEnrollment 호출 0=타이머 미시작) + createWikiStub/convertToWiki/revertFromWiki 액션·타입·죽은 구독 제거(live wiki=createWikiArticle로 이미 이전, convertToWiki "삭제 예정" 결정 실행). tsc0/test0/build0. noteType live setter=0됨.
- ✅ **2026-06-03**: **P3 안정화 마무리 — Wiki Reader 클러스터 제거 + stone/brick 정리 + 스모크**. ① **noteType="wiki"**: architect 전수 분류 → 107곳 대부분 **backward-compat 방어망(보존)**, 진짜 데드 = 레거시 Wiki Reader 클러스터 1개(4파일 삭제 + note-editor `WikiReadLayout` + wiki-view 레거시 분기, ~1036줄). ② **stone/brick**: 라우트는 이미 table-route.ts에서 rename됨, 119곳 대부분 보존(persist 식별자·migrate·목업) → 진짜 작업 = i18n `added_toast` 버그 2 + dead i18n키 6 + Icon별칭 3. ③ 스모크 QA(console 0). tsc0/build0.
- ✅ **2026-06-03 (출시후 스프린트, #524~#528 — 백필)**: v0.1.0 first-launch 버그 2(#524) → 프로덕션 온보딩 시드(#525) → Tauri 자동 업데이트(#526) → 사이드바 업데이트 인디케이터+v0.1.1(#527) → v0.1.2(#528). 신규 `auto-updater.tsx`·`sidebar-update-indicator.tsx`·`updater-store.ts`. Store v154 무변경. (당시 docs 미기록 → 2026-06-04 before-work서 적발·백필.)
- ✅ **2026-06-04**: **북 생성/열기 "홈 깜빡임" 수정** — 생성=그자리 in-place(`handleCreate` 네비 제거) + 열기=`/books/{id}`→`/books?book={id}`(위키식 쿼리스트링, 11파일, hard-nav 제거). 근원=정적 export서 path-param→hard-nav→루트 index.html 폴백→start-view `/home` 리다이렉트. build0, dev 전 시나리오(생성·열기[그리드+사이드바]·F5·복귀) 통과. **folder/tag/label 동일 클래스 미해결**(→0.025).
- **P3 출시 전 안정화 = 완결**. (별개 부채) migrate-v107 7개 재활성 = 순수 헬퍼 추출 or 번들러 하니스.
- **코드사이닝 = 보류**(무서명 출시): 매출/유저 생기면 도입. macOS는 별도(Apple $99+공증 필수, 하드블록). **MS Store MSIX** = 서명 우회 트랙 후보.
- **별개 트랙**: ~~SPA fallback(lib.rs custom protocol)~~ **불필요 판명**(2026-06-04 — Tauri `get_asset`이 이미 index.html 빌트인 폴백; 깜빡임은 폴백 부재가 아니라 루트 index.html→start-view 리다이렉트라서, hard-nav 제거가 정답) / **macOS WebKit 렌더+서명 검증**(이번 Windows만) / folder·tag·label hard-nav+F5(→0.025로 승격).

### 0.025. **🔴 P0 (북 수정 후속): folder/tag/label hard-nav "홈 깜빡임" + 필터 F5 URL화**

**2026-06-04 북 수정으로 패턴 확립** — 정적 export(Tauri)서 path-param 라우트(`/folder/{id}`·`/tag/{id}`·`/label/{id}`)는 책과 동일하게 hard-nav→루트 index.html 폴백→start-view `/home` 리다이렉트(홈 깜빡임). 책은 `routeToUrl()`로 `/books?book=` 쿼리화해 해결 → folder/tag/label도 동일 적용. **단 흐름이 다름**: tag/label은 catch-all이 필터 설정 후 `/notes`(프리렌더)로 bounce → 실제 깜빡이는지 검증 먼저; folder는 자체 뷰(catch-all `FolderDetailView`)라 쿼리화에 **설계 결정 필요**(`/notes?folder=` 필터 유지·간단 vs `/folder/{id}` 유지). 추가로 사이드바 클릭이 `activeFolderId`(모듈상태)라 F5 리셋되는 것도 같이 해소. 사용자 적발(2026-06-01). 참고=`lib/table-route.ts routeToUrl`, `components/views/catch-all-route.tsx`, `components/linear-sidebar.tsx`.

### 0.026. **🟢 P0 (타임라인 후속, 디자인성): start chip 색 + grouping 비대칭 + hydration**
- `EVENT_MARKER_CONFIG.created = NOTE_STATUS_HEX.done`(초록) → created≠done, done 막대와 색 충돌. 중립색/created 고유색 정정.
- Notes 타임라인 grouping default 누락(→none) — Wiki는 `timeline: "wikiStatus"` 명시. 비대칭. no grouping 유지(타임라인=시간축이 주) 확정 또는 default 추가 결정.
- hydration mismatch(radix `useId`·resize-handle id): prod export(SSG hydration) 영향 가능성, 상용화 전 점검.

### 0.035. **🔴 P0 #2: §13 남음 — insights 분산 통합 + 그래프=display mode(렌즈)**

ontology insights 탭은 이번에 해체(→Dashboard+Inbox+ring). 남은 것:
- **notes `/insights` 통합**: `components/insights-view.tsx`(Notes)가 ontology Dashboard와 역할 겹치는지 → 통합/역할분리 결정.
- **그래프 = display mode(렌즈)**: `ontology-graph-canvas`를 list/board처럼 어느 컬렉션서도 띄우는 큰 리팩터 — scope 먼저 확인.

### 0.04. **✅ 셸 §10 패널토글 분산 완료** (Track B 셸 리팩터)

- ✅ Phase 1: 디테일 토글 = 콘텐츠 우상단
- ✅ Phase 2: 사이드바 hover-reveal 접기(우상단) + expand rail(좌측 `w-3.5`)
- ✅ Phase 3: PanelsMenu 햄버거 완전 제거 + 액티비티 바 토글 → 상단바(시계 왼쪽) 이전

### 0.06. **🟡 P0 #2: Book kind 라벨 변경 (헌법 §13, 가벼움)**

Smart/Manual/Hybrid → **Auto/Manual/Mixed**(자동/수동/혼합). **코드 키(`smart`/`manual`/`hybrid`) 불변**, 라벨+i18n만: `books.schema.tsx` values + `lib/i18n.ts`(en Auto/Manual/Mixed + ko 자동/수동/혼합). "스마트북" 단어 소멸.

### 0.07. **✅ noteType==="wiki" — 분류 완료 (2026-06-03)**

107곳 대부분 **살아있는 backward-compat 방어망**(migrate 보존 + graph/side-panel/trash/search/calendar/insights/hover-preview/filter)으로 판명 → **보존 확정**. 진짜 데드 = 레거시 Wiki Reader 클러스터(제거 완료). noteType FIELD 유지. **추가 정리 불필요.**

### 0.1. **🟡 P0: 모션/색 전파 + A3.1 LCH 토큰** (carry)
- 노트행 시드 토큰(`--row-hover-bg` oklch / `--duration-fast` / `--ease-out`, 커밋 `295be0a`)을 **사이드바 항목·버튼·드롭다운**에 전파(avatar 드롭다운은 이미 재활용).
- **A3.1 LCH 토큰 전역화** — 노트행 oklch가 씨앗 → `lib/colors.ts` flat hex → OKLCH/LCH + paired `-bg/-fg` + `toneClassDual` (app-wide careful 패스).
- **A4 priority 막대** (carry) — `note-fields.tsx` 화살표 → 리니어 3-막대 SVG (spec §3 geometry, `schema/icons.tsx`). A3.3 opacity 위계 클래스 뼈대의 0.9/0.7/0.5 최종값도 여기서.

### 0.3. **✅ stone/brick/keystone — 분류 완료 (2026-06-03)**
119곳 대부분 보존(migrate/seeds/tests/목업 격리 + autopilot/analysis rule id·settings `startView:"stone"` = persist 식별자 + 라우트는 이미 `lib/table-route.ts`에서 rename됨). 안전 작업 완료 = i18n `added_toast` 버그 2 + dead i18n키 6 + Icon별칭 3. **남은 cosmetic(cmdk 키·queries 주석/함수명)은 동작 정상이라 보류. AGENTS.md `/stone` 라우트 = stale 문서(정정 후보).**

### 0.5. **🔴 P0 #1: Phase C — 오버뷰 StatsCard 통일** (미시작, 통합 플랜 마지막 Phase)

**왜**: 홈/위키/라이브러리 KPI 박스 py(4 vs 2.5)·숫자(text-2xl vs text-xl)·아이콘(12 vs 18px) 제각각, 공통 컴포넌트 없음.
**첫 스텝**:
1. 공통 `components/stats-card.tsx` 신규 (value/label/sub/icon/color/size) — `rounded-lg border px-3 py-3` + `text-xl` + 아이콘 14.
2. 적용: `components/home/stats-row.tsx`(L118 StatsRow) / `components/views/wiki-dashboard.tsx` MiniStat(L395) / `components/views/library-view.tsx` LibraryStatCard(L606).
3. StatusCard(4단계 breakdown) 추출: `wiki-insights-view.tsx` WikiStatusBreakdown(L24) + wiki-dashboard 인라인(L150) 통합.
4. recharts 표준화 (Notes insights MiniBarChart → recharts).

**플랜 문서**: `C:\Users\user\.claude\plans\playful-honking-octopus.md` (Phase A·B 완료, Phase C 남음).

### -5. **🔴 P0 #1 (설계 LOCKED): Books kind nav** (All Books 아래 Smart/Manual/Hybrid) ⭐ 다음 세션

**왜**: Books는 status가 아니라 **kind 축**(smart/manual/hybrid). All Books 아래 kind별 nav. **설계 = wiki `wikiStatusFilter` 패턴 1:1 미러**.

**첫 스텝**:
1. wiki `wikiStatusFilter` external store + 사이드바 status nav 링크 패턴 read (미러 소스)
2. `bookKindFilter` external store 신설 (wikiStatusFilter 복제)
3. 사이드바 Books "All Books" 아래 Smart/Manual/Hybrid 링크 + 카운트 (Smart 3 / Manual 2 / Hybrid 2)
4. books-view 필터: `getBookKind`로 분기 (이미 존재하는 헬퍼)
5. `tsc --noEmit` + 사용자 시각

**⛔ Books Overview = 보류 (만들지 말 것)**: Insights + 사이드바 Pinned/Recent와 중복, continue-reading 빈 상태. 이번 세션 결정.

### -4. **🔴 P0 #2 (carry, 대부분 진행됨): Entity Insights 정보 아키텍처 통일 PRD**

**진행 상황** (2026-05-29 밤): **`/wiki/insights` + `/books/insights` 신설 완료** (이번 세션). Notes=별도 `/insights` / Wiki=신설 `/wiki/insights` / Books=신설 `/books/insights`(kind breakdown) / Ontology=top-level. 위치 통일 거의 됨 — 나머지 = recharts 표준화 + Ontology(전체) vs entity(세부) 역할 분리(#140) 마무리.

**남은 첫 스텝**:
1. `components/insights-view.tsx`(Notes) + `components/views/books-insights-view.tsx`(신규) + Wiki insights 비교 → 일관 레이아웃 확정
2. recharts 차트 표준화 (Notes Insights MiniBarChart → recharts)
3. Ontology Insights(전체) vs entity Insights(세부) 중복 회피 역할 분리 (#140)
4. `docs/01-plan/features/entity-insights-coherence.plan.md`(A안 확정) 나머지 design

**References = 분류/기록 entity지만 유일하게 미래 *구조화 상세 폼*(full editor 아님) 후보. 후속 고려.**

**위험**:
- Ontology Insights(전체)와 entity Insights(세부) 중복 회피
- Wiki를 별도 page로 분리했으면 Dashboard 재구성 동반 검토

### -2. **🟡 P0 #1 (carry, 직전 오전 P0 #0 미진행): Wiki `← Overview` 폐기 → breadcrumb 패턴 마이그** (1년 차 정합성 부채)

**사용자 의도** (2026-05-28 오전):
> "위키와 라이브러리 모두 오버뷰가 있는데, ←오버뷰 버튼은 위키에만 있거든? 노트나 라이브러리처럼 바꾸는 거에 대해 어떻게 생각해? 브레인스토밍해볼까."

**핵심 근거** — `components/library/library-breadcrumb.tsx` 헤더 코멘트 (라인 6):
> "사용자 시그널 (**2026-05-14**): Wiki의 `← Overview` 패턴보다 Notes의 breadcrumb 패턴 (`Notes > Quick Memo`)이 더 자연. Library도 같은 패턴 적용."
→ 1년 전 결정. Library는 그때 마이그됐지만 **Wiki만 누락**된 채 남음 = 정합성 부채.

**다음 세션 첫 스텝** (옵션 A 권장, 최소 ~50-80줄):
1. `components/library/library-breadcrumb.tsx` read — 패턴 + props 인터페이스 확인
2. `components/wiki/wiki-breadcrumb.tsx` 신규 — LibraryBreadcrumb 복제 + Wiki 도메인 변환 (entity = "wiki", sub-views = dashboard/list, 또는 5 quick filter 포함 결정 필요)
3. `components/views/wiki-list.tsx` 라인 794-802 (`← Overview` 버튼 + 분리선) → 제거 후 `<WikiBreadcrumb current={wikiViewMode} onNavigate={setWikiViewMode} />` 삽입
4. 다른 wiki view 진입점 (`wiki-view.tsx`, `wiki-dashboard.tsx`) breadcrumb 적용 검증
5. `tsc --noEmit` + 사용자 시각 검증

**옵션 B (체계 refactor, ~100-150줄)**: 공통 `EntityBreadcrumb` 컴포넌트 추출 → Notes/Wiki/Library 모두 동일 사용. 다음 entity 추가 시 부담 0.

**옵션 C (큰 작업, ~200줄+)**: Wiki sub-section을 사이드바로 이동 (Library 패턴 풀 적용). 상단 quick filter chips (`Stale articles / Orphans / Hubs / With aliases / Recent`) → 사이드바 항목으로. UX 결정 多.

**위험 + 회피**:
- wikiViewMode enum: 현재 `"dashboard" | "list"` 2-mode. breadcrumb sub-view에 5 quick filter 포함할지 결정 필요. quick filter는 view-header 영역이라 분리가 자연.
- LibraryBreadcrumb 패턴 = entity name + popover trigger. Wiki는 view mode 전환 + filter chip 분리.

**파일 reference**:
- `components/library/library-breadcrumb.tsx` (사용자 시그널 2026-05-14 source)
- `components/views/wiki-list.tsx` (라인 794-802 fix 대상)
- `components/views/wiki-view.tsx`, `wiki-dashboard.tsx` (적용 검증)

### -1. **🔴 P0 #1 (carry): Phase 3.1 — `/preview/linear` 12장 reference 이미지 1:1 비교 + fine-tune**

**다음 세션 첫 스텝**:
1. dev server 확인 (preview MCP `preview_start "dev"`, launch.json port 3002 + autoPort)
2. 브라우저 `http://localhost:3002/preview/linear`
3. 12장 reference 이미지 (채팅 첨부 또는 `~/Desktop/open-design/.od/projects/04375e11-0f45-4428-92df-aeb8faf27039/`) 와 surface별 비교
   - Tabs: List / Editor / Table / Books
   - ⌘K command palette
   - + New Quick Capture dialog
   - Filter popover (10 fields + sub-menus + 4 quick filters)
   - Display popover (5 mode + 7 group + multi-sort + 12 prop)
   - 라이트/다크 토글 (activity bar sun/moon)
4. 어긋난 surface/디테일 짚어서 Phase 3.1 fine-tune

**검증 의무** (Phase 3.1 후): `npm run build` + `tsc --noEmit` 통과.

### 0. **🔴 P0 #1 (이번 세션 결과): Phase 4 — 실 컴포넌트 마이그레이션** (사용자 명시 진입점)

**사용자 의도** (2026-05-27 저녁):
> "필터와 디스플레이는 리니어식으로 꾸며졌거든? 아예 그렇게 해야 될 거 같은데. 그리고 book도 없다. 기왕 만드는 김에 나는 우리 코드가 실제로 쓰는 필터 내의 아이콘들과 폰트, 디스플레이 내의 옵션들과 아이콘들까지 전부 재설계 해도 좋을 거 같아. 리니어 느낌이 나도록."

**진입점 (작은 것부터)**:
1. **`components/filter-bar.tsx`** → Linear `.ln-popover` 패턴 (10 fields + 4 quick filters + 4-part chip bar)
2. **`components/display-panel.tsx`** → Linear popover (5 segmented mode + 7 grouping + multi-sort chain + 12 property chip + 2 toggle)
3. **Inbox 또는 Notes split view 한 페이지** 풀 마이그레이션 (Zustand store 연동)
4. **Books 엔티티 방향 결정** — A) `/library` 별칭 탭 / B) 7번째 entity (rose space, Smart Book v2 plan과 연결)

**파일 reference**:
- `app/preview/linear-styles.css` (Linear 컴포넌트 클래스 993줄, `.ln-*` prefix)
- `app/preview/linear/page.tsx` (5 surface + Filter/Display/Books 인터랙티브 992줄)
- `app/globals.css` `:root` + `.dark` Linear 토큰 블록 (Phase 1)
- `components/filter-bar.tsx` (현재 코드, 이미 Linear 4-part chip 패턴)
- `components/display-panel.tsx` (현재 코드)
- `lib/view-engine/view-configs.tsx` NOTES_VIEW_CONFIG (사용자 실 옵션 set 100% 반영 source)

**위험 + 회피**:
- **Linear CSS 격리 위반 위험** — `.ln-app` scope 안에서만 unprefixed 토큰 (`--panel`) 살아있음. 외부 컴포넌트 사용 시 미정의. globals.css promotion 시 토큰 명시 필요.
- **shadcn `.sidebar/.card/.kbd` 충돌** — Linear `.ln-*` prefix로 회피했지만, globals.css promotion 시 다시 점검.
- **Phase 3 mockup `.a-*` 클래스와 공존** — 일단 둘 다 살림. Path C (Studio/Editorial cleanup) 시 정리.

### 1. **🔴 P0 #2 (직전 세션 carry): Coverage entity dropdown 논의 + 진행**

**사용자 의도** (2026-05-27):
> "커버리지가 단순히 고정이 되어서 나오는 것보다는 드롭다운이 있고 선택해서 노트 기준, 위키 기준, 북 기준, 이렇게 해서 각 섹션별로 다르게 보여주는 게 낫지 않나"

**옵션** (사용자 결정 필요):
- **C (즉시, 작음)**: Tagged/Orphan dropdown (Notes/Wiki/Books 기준) + Cohesion fixed (그래프 전체). Books orphan 정의 필요.
- **B (중간)**: Notes/Wiki만 dropdown (Books 제외 — cohesion 의미 모호). Cohesion entity별 cluster detection.
- **D (큰 작업)**: 각 entity별 별도 Insights page (Notes/Wiki/Books). 이전 P0 #2 후보 (Phase A2/B/C). Plot v2 P0 #1 통합 가치.

**첫 스텝**:
1. 사용자 옵션 결정 (C/B/D) + Books orphan 정의 + Cohesion sub-label 결정
2. 새 branch `claude/coverage-entity-dropdown`
3. `hooks/use-knowledge-metrics.ts` entity별 metrics 확장 (또는 별도 hook)
4. `components/ontology/ontology-insights-panel.tsx` Coverage section header에 dropdown UI
5. `components/ontology/insights-charts.tsx` 3 chart entity prop 추가
6. i18n keys (dropdown labels + entity별 sub-labels)

**파일 reference**:
- `components/ontology/ontology-insights-panel.tsx` Section 2 Coverage Mosaic
- `components/ontology/insights-charts.tsx` (TaggedDonut / OrphanDonut / CohesionRadial)
- `hooks/use-knowledge-metrics.ts` (현재 Note 기준 only)
- `lib/insights/metrics.ts` (Note graph cluster algorithm)
- `lib/insights/types.ts` (KnowledgeMetrics interface)
- `components/ui/select.tsx` (dropdown UI)

### 1. **🔴 P0 #2 — Phase 0 Design Language + Plot v2 통째 재설계 PRD (2 세션째 deferred)**

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

### 4. **🟢 사용자 viewport 검증 미완 (이전 세션 누적 + 이번 PR #472)**

이전:
- Backup Restore round-trip (Full Backup → Import → reload)
- GlobalTopBar Hide-all-panels 후 chrome 접근
- Cmd+K Escape 닫힘 (Path A로 검색 통합 후 영향 검토)
- Inbox Phase 1c 3 SectionCard 작동
- Phase α-2 위키 체크박스 시드 검증
- Books list 모드 visibleColumns default 확장 효과

PR #472 신규:
- 4 페이지 max-w-5xl (Ontology Dashboard/Insights + Wiki Dashboard + Library Overview)
- Ontology Dashboard KPI 라벨 "Wiki / Categories" 일관
- status_breakdown EN "Stone · Brick · Block" Cap 정합
- Wiki sub "{articles} Article · {stubs} Stub" 표기
- Folders sub-line "X 노트 · Y 위키 · Z 책" (v149 migration 후)
- Books Title cap 폐기 (우측 빈 공간 해소)
- Books row Notes parity (h-[38px], 13px font, gap-[8px], px-[20px], w-[32px], cover icon naked)
- Wiki list checkbox 32px (진입 path = sidebar "병합" → Cancel button)

### 5. **🟡 Book 폴더 Phase 2 (UI 작업)**

Phase 1 완료 (schema + migration v149 + dashboard sub-line). UI 후속:
- `book-folder-picker` UI (folder-picker 일반화 or 신설)
- `linear-sidebar` book folder section
- `smartSources resolver` book folder kind 지원
- `app/(app)/folder/[id]/page.tsx` book branch (현재 빈 페이지)
- Folder context menu "Book Folder" 신설 옵션

Plot v2 P0 #1과 통합 가치 (entity-folder 아키텍처 결정).

### 6. **🟡 Wiki list view 정밀 진단 + Notes parity**

이번 세션 broken commit (820370b) revert. minimal fix만 (checkbox 32px). 진정한 Notes parity는 entity별 column 구조 다름이 root cause. Wiki는 column wrapper에 자체 px-2 padding → gap-[8px] 추가 시 double spacing. Plot v2에서 entity list 통합 design 일괄 결정 가치.

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

- **2026-05-27 (오전~새벽)**: **Search entity-aware refactor + Ontology Insights v2 (Power Sabermetrics) + HoverCard 학습 패턴** (PR #473-#479, 8 PR 23 commits). (a) Search entity-aware (#473): !hasFuzzyQuery 블록 11 entity 분기 (notes/wiki/books/categories/tags/labels/stickers/references/templates/folders). (b) Search section title 통일 + sort (#474): entity name만 (RECENT prefix 제거) + entity별 sort logic (updatedAt/name/createdAt/lastAccessedAt). (c) Linear/Notion progressive disclosure (#475): "전체 {count}개 보기 →" button (count > 8). 11 entity별 navigation target. (d) Ontology Insights v2 Power Sabermetrics (#476): 4 section 재설계 — Graph Health KPI / Coverage Mosaic 3 chart (TaggedDonut/OrphanDonut/CohesionRadial) / NUDGE keep / TopNotesBar (composite WAR-like horizontal bar). insights-charts.tsx 신규. (e) Tab highlight bug fix (#477): linear-sidebar.tsx currentMode static getState() → reactive subscribe. (f) HoverCard 학습 패턴 (#478/#479): 4 chart + 4 KPI에 ⓘ icon + HoverCard 설명. ChartCard/StatLine에 helpTitle/helpBody props. "Cluster Cohesion" / "Edges" / "Density" 등 추상 용어 학습. Plot identity ("Gentle by default") 정합. (g) 영구 LOCKED 후보 #148~#152 (Power Sabermetrics 정체성 / progressive disclosure / HoverCard 학습 / search section title 통일 / Coverage entity dropdown — 다음 세션 결정).
- **2026-05-26 (저녁)**: **viewport polish 세션 — LOCKED #136 v2 revised + Book 폴더 Phase 1 + entity list Notes parity 점진 정합** (PR #472, 13 commits). (a) Layout (`bcccd3d`): 4 페이지 풀 폭 → Home pattern max-w-5xl. LOCKED #136 v1 → v2 (사용자 viewport revert). (b) Dashboard KPI (`2af3b9c`, `616441f`): "Wiki articles"→"Wiki" / "Wiki categories"→"Categories" + EN status_breakdown "keystone"→"Block" 버그 fix + Wiki sub `wiki_breakdown` (article+stub 둘 다 표기). (c) Book 폴더 Phase 1 (`85514b9`): Folder.kind 확장 + Book.folderIds + migrate v148→v149 + Folders sub-line "X 노트 · Y 위키 · Z 책" + folder_breakdown i18n + 12 cascade fix (seeds.ts + slices/books.ts + 2 test files + setGlobalSearchQuery type 누락). (d) Books → Notes parity 점진 정합 (8 commits): header layout / Title cap 폐기 / font-weight 400 + 13px row / gap-2 / pixel-perfect (px-[20px] gap-[8px] w-[32px] — Plot root font-size 14px Tailwind misalignment 정합) / cover icon wrapper 제거 naked SVG. (e) Wiki: Updated/Created 순서 swap + minimal checkbox 32px (광범위 fix는 broken → revert). (f) 영구 LOCKED #136 v2 + 후보 #143~#147 (Notes .a-th/.a-row CSS system / Plot root font-size 14px / Book 폴더 Phase 2 / entity별 column 구조 다름 / cover icon naked SVG).
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

- **넛지(우하단 토스트) 루틴화/설정화** (2026-05-29 parked) — 현재 `hooks/use-autopilot-nudges.ts`에 **하드코딩**: 3종(Stone triage / SRS due / Wiki cluster), 4h 쿨다운(`plot-nudge-cooldowns`), mount 시 fire-once. 목표 = 어떤 넛지를·어떤 임계값/주기로·어떤 문구로 띄울지 **설정 가능**하게. 기존 `lib/autopilot/*` 룰 엔진(store CRUD 있으나 settings UI 없음)과 통합 검토 + settings UI 신설. 넛지 ↔ 룰 엔진 = 현재 완전 분리된 두 시스템.
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
