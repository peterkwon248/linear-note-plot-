# Plot — Session Log

> 시간순 chronological 세션 기록 (append-only). 직전 세션 멘탈 상태 복원용.
> 가장 최근이 위에. 오래된 세션은 아래로 밀려남.
> Session entry 형식: 날짜 + 머신 + 완료 + 결정 + 다음

---

## 2026-04-29 (집, v0 협업 흡수 + UI polish + dead code 정리 + P0 필터 강화 + Row density 시도/revert — 5 PR)

### 완료 (5 PR 머지)

**PR #220 (23fe1be) — v0 작업 흡수**: v0 cloud에서 작업한 라이트모드 contrast 개선 + Home View 리디자인 12개 파일 흡수. v0 환경 wrapper (`next.config.mjs` — `*.vusercontent.net` 도메인, turbopack v0 캐시, `next.user-config.mjs` 의존)는 제외. git worktree로 분리 + 머지

**PR #221 (4f5165a) — UI polish + dead code 14개**:
- 체크박스 6 위치 통일: `bg-card` 흰 배경 + `border-zinc-400` (라이트) / `dark:border-zinc-600` + `shadow-sm` + `rounded-[4px]` + `hover:border-zinc-500`. ui/checkbox.tsx (Radix base) / notes-table.tsx (header select-all + row) / wiki-list.tsx / library-view.tsx / filter-panel.tsx
- 라이트모드 chart 색 WCAG AA: `--chart-2` #0891b2 → **#0e7490** (cyan-700, contrast 3.4→5.5) / `--chart-3` #ea580c → **#c2410c** (orange-700, 3.7→4.6) / `--chart-5` #16a34a → **#15803d** (green-700, 3.0→5.0)
- StatusShapeIcon hex 직접 → CSS var (`NOTE_STATUS_HEX[status]` → `NOTE_STATUS_COLORS[status].css`) — 라이트/다크 자동 분리. 노트 row 왼쪽 작은 ○ 아이콘 더 진해짐
- Dead code 14개: Notes(orderPermanentByRecency / showThread / nestedReplies toggle), Wiki(showStubs / showRedLinks toggle), Wiki Category(showDescription / showEmptyGroups toggle, tier/parent/family grouping options), Calendar(showReminders), display-panel "Built-in toggles" 섹션. **유지** (UI toggle만 dead, 내부 사용 중): showNotes/showWiki (calendar-view), showDescription 내부 (wiki-category-page), showEmptyGroups ViewState (notes-table/board), tier/parent/family 내부 (wiki-category-page)

**PR #222 (f613532) — P0 필터 강화 (5 앱 리서치 기반)**:
- **P0-1 역링크 수 소트** 이미 구현+노출 확인 (sort dropdown "Links" + sort.ts:46 backlinksMap 정렬)
- **P0-2 True orphan 필터** (linksOut=0 AND backlinks=0) — `_orphan` value + quickFilter "True orphans" 추가. 기존 "Orphans" → "Unlinked (no outbound)" 명확화
- **P0-2 보너스 Has backlinks 활성화** — view-configs 옵션은 있었으나 filter.ts 처리 X였던 dead config 활성화
- **P0-3 Wiki-registered 필터** — Note title+aliases ↔ WikiArticle title+aliases lowercase 매칭. `PipelineExtras.wikiTitles?: Set<string>` 추가, `applyFilters(notes, filters, extras?)` 시그니처 확장
- **P0-4 부분 적용** — Has backlinks로 일부 효과. note picker 기반은 다음 PR

**PR #223 (7423c08) — Row density dropdown 통합**: Compact + Show card preview 두 토글이 같은 차원 별도 관리 → 충돌 + 혼란. Notion식 segmented (Compact / Standard / Comfortable + 라인 밀도 SVG) 통합. v92 migration

**PR #224 (7472321) — Row density 제거 (Linear 스타일)**: 사용자 피드백 "Comfortable 엉망. Linear 방식 = 별도 토글 X". v93 migration으로 rowDensity 필드 삭제. List 뷰 단일 행 (40px) + 자동 반응형 (`containerWidth < 480` → 32px) 만 유지. 영구 규칙 "시각적 다양성 ≠ Plot 코어" 재확인

### 큰 결정

- **dead code 정리 원칙**: Explore agent 1차 분류 후 executor가 실제 사용처 깊이 파봐서 "toggle UI dead vs state field 진짜 사용" 분리. UI dropdown만 제거하고 내부 구현은 보존하는 정밀 정리
- **5 앱 필터 리서치 (Linear/Notion/Obsidian/Capacities/Bear)** 결과 P0 4개 / P1 5개 / P2 3개 도출. **Anti-pattern** 명시 (뷰 타입 대량 추가 / AI 필터 / Manual ordering / 과도한 컬럼)
- **Sub-group 인프라 이미 있음 발견**: `ViewState.subGroupBy` 필드 + `applyGrouping` 재귀 처리 + `NoteGroup.subGroups?` 모두 구현됨. UI 노출만 남음 → 다음 세션 빠른 wins (S 난이도)
- **Wiki Sub-group 비추**: WikiArticle은 status 필드 자체 없음 (isWikiStub 런타임 파생). 1차 그룹핑 dimension 빈약. Sub-group 전에 1차 groupBy(linkCount bucket / infoboxPreset) 추가가 우선
- **Library Sub-group 비추**: References/Tags/Files 각 탭 1차 groupBy로 충분
- **Saved View 이미 구현됨 발견**: `lib/store/slices/saved-views.ts` + linear-sidebar에 `createSavedView` 등 존재. P1에서 제외 (검증만 필요)
- **그룹별 카운트 ROI 낮음**: 사이드바와 중복 느낌. P1에서 제외
- **Linear 스타일 채택**: "시각적 다양성 ≠ Plot 코어" 영구 규칙 재확인. Notion식 Row density 토글 시도 후 사용자 피드백으로 회귀. Plot 코어(지식 관계망)에 토글 옵션 적은 게 맞다는 학습

### 작업 흐름 학습

- **v0 + Claude Code 협업 패턴**: v0가 디자인 작업 → 자동 push되는 별도 브랜치 → Claude Code가 git worktree로 받아서 v0 환경 잡음(next.config.mjs)만 제거 후 PR. 깔끔히 흡수 가능
- **executor agent 위임 패턴**: multi-file 변경(체크박스 6 / dead code 14 / P0 4 / Row density 통합 9 / Row density 제거 8)은 executor 위임이 효율적. 명확 spec + tsc/test 자동 검증
- **HMR 캐시 이슈**: 큰 schema 변경 후 React Hooks 순서 에러 / Fast Refresh full reload 발생 가능. dev server restart로 해결

### 추가 큰 결정 — 다중 기기 sync (보류)
세션 끝나기 전 사용자 의향: "**다중 기기 sync 필요해. 옵시디언도 이걸로 유료 구독료를 받잖아.**"
- **수익 모델 + Sync 도입 결정** — Plot "비용 0" 영구 규칙을 "구독 모델"로 변경 의향. E2E 암호화 + 프라이버시 + 오프라인 우선 + 단일 사용자 정체성은 유지
- 6개 옵션 비교 + Obsidian Sync 모델 분석 + 가격 모델 제안 + 임시 phase 안 → `docs/SYNC-DESIGN-DECISIONS.md` 작성
- **추천 옵션 B (Supabase + E2E 암호화)**: 균형 (프라이버시 + 비용 + 출시 일정). $4 Sync / $8 Pro 가격. 7~11주 작업
- **Y.Doc 재활용 결정 뒤집기 필요**: 이전 (2026-04-27) "Wiki Y.Doc 폐기"는 단일 사용자 IDB 전제. 다중 기기 sync = CRDT가 자연스러운 솔루션
- 영구 규칙 "큰 방향 전환 전 전체 설계 확정" → **결정 6개 받기 전 코드 X**
- 다음 세션 첫 액션: 결정 6개 받고 PRD 작성 → phase 분할 → 구현

### 다음 세션 (다른 컴퓨터)

- **즉시 시작 옵션 A**: 다중 기기 sync 결정 6개 받기 (`docs/SYNC-DESIGN-DECISIONS.md` 참고). 큰 방향이라 우선
- **즉시 시작 옵션 B**: P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) — sync와 무관, 병행 가능
- **권장 순서**: A 결정 받고 → PRD 분할 → P1 Notes 3개 (sync와 무관) 빠르게 끝내고 → sync phase 시작
  - **Sub-group**: 인프라 있어 UI dropdown 추가만 (S, 가장 빠른 wins)
  - **Multi-sort**: sort.ts comparator chain + UI 1→2~3개 dropdown 확장
  - **날짜 상대값**: date-fns로 "이번 주"/"지난 7일" 등. filter.ts에 일부 stale 처리 있음, 확장
- **별도 PR**: Wiki 1차 groupBy (linkCount bucket / infoboxPreset) — M 난이도, 새 컨텍스트
- **선택**: P0-4 note picker 기반 inbound link filter (M)

### 출시 방향 (여전히 결정 대기)
이전 세션부터 보류. 다음 세션에서 사용자 결정 받으면 진행:
- 모바일 전략 (PWA → TWA?)
- 출시 전 부족분 우선순위 (온톨로지 / 캘린더 / 템플릿)
- 마케팅 웹사이트 옵션
- 타임라인

### Watch Out

- **Sub-group UI**: `viewState.subGroupBy` dropdown만 노출. 인프라 그대로 사용 (display-panel 확장)
- **Multi-sort signature 변경**: `applySort(notes, field, direction, backlinksMap)` → `applySort(notes, sorts[], backlinksMap)`. 모든 사용처 영향. 호환성 위해 단일 sort도 배열로 normalize
- **날짜 상대값**: filter.ts에 이미 "stale" / "24h" / "7d" 처리 있음. 호환성 유지하며 확장
- **Wiki 1차 groupBy**: WikiList가 view-engine 파이프라인 사용 안 함. 직접 적용 vs 별도 grouping 구현 결정 필요
- **Store version**: v93. Sub-group은 store 변경 불필요. Multi-sort는 sortField → sortFields[] 변경 시 v94 migration
- **Plot 코어 정체성 영구 규칙**: 토글 추가 신중. Linear 방식 우선 — 진짜 필요한 옵션만 노출

### 머신
집 → **다음 세션은 다른 컴퓨터** (사용자 명시)

---

## 2026-04-27 (집, Doc sync + group-header + attachment drag-drop + 시계열 메트릭 + 출시 방향 논의)

### 완료
- **Doc sync** — PR #218 이후 stale했던 SESSION-LOG/NEXT-ACTION/TODO를 CONTEXT.md(2026-04-26) 기준으로 정합성 회복. Wiki Y.Doc + AI provider 영구 폐기 결정 반영
- **InfoboxBlockNode group-header 지원** — 노트 TipTap 인포박스에 `"group-header"` row 타입 + in-memory collapse + 8 프리셋 컬러 피커 + custom hex + "Add group" 버튼. 위키 `WikiInfobox` 컴포넌트(PR #218에서 함)와 일관성 회복
- **Attachment drag-drop 연결** — `shared-editor-config.ts` FileHandler onDrop/onPaste 구현. 이미지 → image 노드 (`attachment://` URL), 파일 → download 링크. `EditorConfigOptions.noteId` 추가, TipTapEditor에서 전달. **E2E 검증 완료** (가짜 PNG 2개 paste → attachments slice +2, ImageNode가 attachment:// → blob URL 자동 resolve)
- **시계열 메트릭 + Wiki Dashboard 통합** — `lib/insights/timeseries.ts` (`computeWikiTimeSeries`, day/week/month 버킷, createdAt 기반 cumulative + delta), `components/wiki-editor/wiki-growth-chart.tsx` (recharts AreaChart + BarChart, ResizeObserver 직접 패턴), `wiki-dashboard.tsx` Categories 아래 통합. ResponsiveContainer 0-width 이슈 우회

### 큰 결정
- **Wiki Y.Doc 영구 폐기** — WikiBlock 배열 구조라 Note Y.Doc 패턴 직접 적용 불가. 블록 단위라 race 표면적 작음. CONTEXT.md "위험" 표기가 자연스러운 신호. 유저 동의
- **AI provider 폐기** — CLAUDE.md "LLM 없이 규칙/통계/그래프" 정체성 위반. lib/ai/index.ts placeholder 유지
- **Recharts ResponsiveContainer 회피** — React 19/Next 16 환경에서 width 0 측정 이슈. 직접 ResizeObserver + width-state 패턴으로 우회. 이후 차트 추가 시 동일 패턴 사용 권장

### 출시 방향 논의 (결정 대기)
- **사용자 의향**: Google Play Store + 마케팅 웹사이트 출시
- **사용자 지적**: 온톨로지 / 캘린더 / 노트·위키 템플릿 종류 부족
- **제안한 길**:
  - 모바일: PWA → TWA(Trusted Web Activity) 추천 (Plot 100% 클라이언트라 적합, 1~2주)
  - 웹사이트: 별도 Next.js 워크트리 (`plot-website`) + Vercel
  - 부족한 부분 ROI: 노트 템플릿 시드 → 온톨로지 nudge → 캘린더 점검 순
- **결정 대기**: 4개 (모바일 전략 / 부족분 우선순위 / 웹사이트 옵션 / 타임라인). 결정 받기 전 코드 X (영구 규칙)

### 다음
- 사용자 결정 4개 받기
- 결정 후 첫 작업 후보: 모바일 반응형 감사 + 노트 템플릿 시드 10개

### Watch Out
- Recharts ResponsiveContainer는 이 환경에서 작동 X — 새 차트 만들 때 ResizeObserver 패턴 (`wiki-growth-chart.tsx` 참고)
- 시계열 차트 실제 시각 검증은 사용자 직접 (preview headless에선 viewport=0)
- 모바일 출시 전 hover-only UI는 touch UX로 마이그레이션 필요
- TipTap atom node에서 group-header collapse는 in-memory (위키처럼 persist 안 됨 — atom은 stable id 없어서)

### 머신
집

---

## 2026-04-26 (집, Plot 디자인 + 인사이트 대규모 — 9시간, 9 PR + 핫픽스, Store v82→v91)

### 완료
- **Home = 데이터 대시보드 + 빠른 진입**: 시간 기반 X. Quick Capture / Stats (컬러) / Recent (4 카드) / Quicklinks (Mixed pinned 통합) / CTA. max-w-5xl
- **Ontology = Single Source of Insights**: 모든 정비 행동(Orphan/Promote/Unlinked/메트릭) Ontology Insights 탭으로 이전. 새 메트릭: Knowledge WAR / Concept Reach / Hubs / Density / Coverage / Tag Coverage / Cluster Cohesion
- **Pinned 통합**: Note + Wiki + Folder + SavedView + Bookmark(글로벌) 모두 Mixed Quicklinks. WikiArticle.pinned 신설 (Store v87)
- **나무위키 Tier 2-4 완료**: 배너 블록 (4 다채로움) + age/dday 매크로 + Include 양방향 + 각주 이미지 + 위키 parent-child. 루비 텍스트 제거 (한국어 fit X)
- **인포박스 Type 11 프리셋 + 그룹 토글** + Navbox 풀 디자인 (Editorial-Imperial, 다단/그룹/색상/그리드/펼치기)
- **Connections 풀 강화**: 블록 단위 인라인 스니펫 + 호버 풀 프리뷰 + mention 처리 + 위키 source contentJson scan + mention IDB 인덱스 캐시 (O(1) 룩업)
- **Y.Doc 본 구현 (P0-1 부분)**: y-indexeddb 영속화 + 4 race guard 유지 + side issue 정리 (plot-note-bodies / duplicate extensions)
- Store version: **v82 → v91** (9 마이그레이션, v86~v91은 핫픽스)
- PR #218 머지

### 큰 결정
- **Wiki Y.Doc 폐기** (2026-04-27 추가 결정): WikiBlock 배열 구조라 Note Y.Doc 패턴 직접 적용 불가, 블록 단위라 race 표면적 작아 안 해도 안전. 솔직히 지금 할 일 아님
- **AI provider 연결 폐기**: "LLM 없이 규칙/통계/그래프" 코어 정체성 위반

### 다음
- Doc sync (NEXT-ACTION/SESSION-LOG/TODO 정합성 회복) ← 다음 세션 즉시
- TipTap InfoboxBlockNode group-header 지원 (작은 폴리시)
- Attachment drag-drop 연결 (FileHandler onDrop/onPaste TODO)
- 시계열 메트릭 + Wiki Dashboard 통합

### Watch Out
- Wiki Y.Doc는 영구 폐기 — CONTEXT.md "다음 작업 후보"에 적힌 거 무시하라
- 노트 InfoboxBlockNode는 "field"/"section"만 지원 ("group-header" 미적용 — 위키와 일관성 깨짐)

### 머신
집

---

## 2026-04-25 (집, 코멘트 시스템 대규모 + 사이드패널 통합 + 미니맵 — 18 커밋)

### 완료
- **Comment 시스템 신규**: Linear 스타일 status (Backlog/Todo/Done/Blocker), 1단계 답글, CommentAnchor 4종 (note/note-block/wiki/wiki-block), 인라인 진입점 (위키 8종 + 노트 모든 블록), Convert to Note 액션
- **Activity 통합**: ThreadPanel/ReflectionPanel 폐기 → CommentsByEntity 단일
- **Bookmarks 통합**: targetKind ("note"|"wiki") + Filter chips + Search
- **Connections**: 위키 incoming wikilink 추가
- **Pin → Bookmark 네이밍 통일** (BookmarkSimple 아이콘)
- **Wiki SECTIONS 섹션 제거** (Detail Outline과 중복)
- **Navbox 하이브리드**: Auto(카테고리 자동) + Manual(WikiPickerDialog) 토글
- **미니맵 (Document-level)**: Phosphor 통일, 블록 타입별 컬러 stripe, 섹션 accent 번호 badge
- Store v76 → **v80** (v77 Comment.status+parentId, v78 Reflections/Threads→Comments, v79 status backlog, v80 GlobalBookmark.targetKind)
- PR #217 머지

### 결정
- **Comment 본질 = 가벼운 메모**: 풀 에디터 툴바 X. 라이트 tier (마크다운 + 위키링크 + 해시태그)
- **노트/위키 대칭**: 모든 블록에서 인라인 코멘트 가능
- **Pin = Bookmark**: 시각/네이밍 통일
- **미니맵 G 진화 폐기**: Document-level 드롭다운으로 충분

### 다음
- Connections 상세 (블록/코멘트 단위 — 7시간 작업으로 미룸)

### 머신
집

---

## 2026-04-24 (TOC 세로선 제거 + comments/bookmarks WIP — PR #216)

PR #216 머지 (interim WIP, 2026-04-25 세션의 prep). Note: 이 세션은 별도 entry 없이 PR로만 기록.

---

## 2026-04-23 (Wiki visual polish + Ontology rename + IDB fix)

### 완료
- **Graph → Ontology rename** (5파일): `editor-breadcrumb.tsx`, `linear-sidebar.tsx`, `view-header.tsx`, `secondary-panel-content.tsx`, `ontology-view.tsx` — activity bar는 이미 "Ontology"였음
- **Wiki Encyclopedia TOC 리디자인**: dark-only `white/XX` hardcoded color → 디자인 토큰 (`border-border-subtle`, `bg-secondary/20`, `text-foreground/80`). 라이트/다크 모드 호환
- **두 모드 공통 updatedAt 추가**: 타이틀 아래 "최근 수정: N시간 전" (`shortRelative()` 사용)
- **Default 모드 TOC 조용하게**: "Contents" uppercase → "목차" quiet (`text-[11px] text-muted-foreground/50`), max-width 280→240px
- **IDB fix**: `plot-note-bodies` DB_VERSION 1→2 (corrupted state 복구, bodies store 재생성)
- PR #215 생성 (2 commits)

### 브레인스토밍 & 큰 결정
- **나무위키 스타일 채택**: TOC + updatedAt 위치, categories 인라인 — 두 모드 모두 적용
- **두 모드 병행 유지**: Default (TOC 좌측 aside + Infobox float-right) + Encyclopedia (TOC 박스 inline + Infobox 스택) — 장기적 단일화는 나중에
- **Wiki TOC = 자동 생성** 재확인: section blocks 기반 sectionIndex, TipTap toc-node는 별개
- **Infobox 위치 = 문서 내 유지**: sidebar Detail과 대립하지 않음 (사용자 pain은 없었음)
- **Ontology를 Activity Bar 공간으로 유지**: Display View에 통합 안 함 (사용자 결정)

### 다음
- PR #215 머지
- 사용자에게 "가장 거슬리는 UI 3가지" 구체화 요청
- UI 일관성 감사 계속

### Watch Out
- IDB 에러 1/11 → 0: DB_VERSION 2로 해결됨. 다음 세션 새 브라우저에서도 재현 안 될 것
- `search-dialog.tsx`의 "Graph" 헤딩은 그래프 시각화 커맨드용이라 유지 (Ontology로 바꾸지 않음)
- 기존 hydration mismatch (Radix UI aria-controls ID) — pre-existing, 기능 영향 없음

### 머신
집

---

## 2026-04-22 (집, Hard reset to PR #194 + 도돌이표 자각 + UI 일관성 방향 전환)

### 수행 작업

**Hard reset 실행**:
- `git reset --hard 3f2e54c` — PR #194 commit으로 branch 이동
- PR #195 ~ #213 (2026-04-14 저녁 ~ 2026-04-21) 변경사항 전부 working tree에서 제거
- 삭제된 기능 시스템: WikiTemplate, 컬럼 시스템, 메타→블록화, Page Identity Tier, Book Pivot 5 shell

**docs 정비** (PR #194 시점 원본 + 2026-04-22 공지):
- NEXT-ACTION.md 전면 재작성 (UI 일관성 방향 + Git 주의)
- TODO.md 전면 재작성 (pain point 기준)
- CONTEXT.md, MEMORY.md 상단 롤백 공지 추가
- SESSION-LOG.md 이번 세션 추가

### 의사결정 과정 (사용자 주도)

1. **Book Pivot 자기만족 자각** (세션 초반) — 매거진/뉴스페이퍼/북 5 shell 자기만족 확인. 사용자: "그저 나의, 개발자의 자기만족"
2. **도돌이표 자각** — 2주간 대결정 3회(Column → Identity → Book Pivot) 반복, 구현 직후 폐기
3. **Book Pivot 롤백 진행** → 완료 (executor로 삭제/수정 + tsc/build/tests clean)
4. **위키 자체 재검토** — "위키는 그냥 냅두자" → "색 넣기랑 컬럼시스템 이전으로" → PR #194 hard reset 결정
5. **themeColor 시스템 유지 확정** — α 옵션 선택 (PR #194 상태 그대로)
6. **진짜 pain point 확인** — 사용자: "ui가 너무 이상함. 일관성 없고". 기능 추가보다 UI 일관성 개선 우선

### 핵심 영구 규칙 (자각에서 도출)

- 기능 제안 전 "Plot 코어(지식 관계망, 팔란티어×제텔카스텐)에 부합하나?" 자문
- "멋진 레이아웃", "시각적 다양성" 방향 제안 금지
- 큰 방향 전환 전 전체 설계 확정 (PDCA plan)
- Phase 쪼개기 전에 "진짜 이 방향이 맞나?" 자문
- Claude memory: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

### 리서치 수행 (4 병렬 researcher — 결과는 부분적으로만 사용)

- 전통 위키 / PKM 앱 / Notion DB 뷰 / PKM 담론
- Category Board + Health Dashboard 제안 → 사용자 기각 ("Health 별로", "위키는 냅두자")
- 결과: 리서치 통찰은 메모에 저장됐으나 이번 세션엔 구현 안 함

### 다음 세션

- UI 일관성 감사 + 개선
- `docs/DESIGN-AUDIT.md` 5-Phase Design Spine 재검토
- 사용자에게 가장 거슬리는 UI 3-5개 구체화 요청
- design-quality-gate 스킬 + designer 에이전트 활용

### ⚠️ Git 주의

현재 branch `claude/mystifying-poitras-48b32a`가 PR #194 commit(3f2e54c)로 hard reset됨.
main은 PR #213(bd50b00)까지 있어 **시간 역행 상태**.

다음 세션 before-work의 `git merge origin/main -X theirs` 실행 시 **롤백 자동 취소** 가능성 높음.
곧 commit + push + PR 해서 main에 반영 필요 (또는 before-work Step 0 skip).

### 머신
집

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
