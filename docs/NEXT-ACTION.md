# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.

---

**Last Updated**: 2026-04-30 (오후) — **Sprint 1.4 완료 (4 PR 통합 단일 commit). 다음은 Sprint 1.5 (Outlinks + 위계 컬럼) + Wiki Hierarchy filter fix.**

---

## 🆕 다음 컴퓨터에서 시작할 때 (다른 머신 인계)

1. `git pull origin main` — Sprint 1.4 머지 코드 가져오기
2. 새 worktree 생성:
   ```bash
   git worktree add .claude/worktrees/<new-name> -b claude/<new-name>
   cd .claude/worktrees/<new-name>
   npm install
   ```
3. `npm run dev` (port 3002 기본)
4. **이 파일 읽고 Sprint 1.5 또는 follow-up fix 시작**

---

## 🎯 큰 방향 (변경 없음)

**Sync 대신 출시 준비 먼저** — 결정 #3 = (c) Free 출시 후 v2.0에 Sync (6개월~1년 후).

**타임라인**: 자유 — 품질 우선
**플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일 (PWA + TWA)
**Sync**: PRD 보존 ([`docs/SYNC-PRD.md`](./SYNC-PRD.md)). v2.0 시점 활성화

---

## 🚨 다음 즉시 액션 — Wiki Hierarchy filter 4 카테고리 fix (S, ~10분)

**이슈** (사용자가 Sprint 1.4 끝에서 발견): wiki Hierarchy filter의 `_root` 옵션이 Solo 노트도 포함. 일반 트리 정의 (Root = parent X)라 Solo (parent X + children X)도 Root로 분류됨.

**Fix**: 사용자 정의 4 카테고리로 변경
- `_root` (parent X + children O)
- `_parent` (parent O + children O)
- `_child` (parent O + children X)
- `_solo` (parent X + children X)

**작업 위치**:
- [lib/view-engine/wiki-list-pipeline.ts:169-185](lib/view-engine/wiki-list-pipeline.ts:169) `case "wikiTier"` 4 분기로 변경
- [lib/view-engine/view-configs.tsx:198-202](lib/view-engine/view-configs.tsx:198) WIKI_VIEW_CONFIG `wikiTier` filter values 4 옵션
- `classifyWikiArticleRole` (이미 PR 1에 추가됨) 재활용 가능

**Notes Filter Role도 동일 누락** — wiki와 일관 적용 (Notes filter에 "role" filter 추가 또는 누락된 wikiTier 류 filter 검토)

---

## 🚀 Sprint 1.5 (~3일): Outlinks + 위계 컬럼

### A. Outlinks 컬럼 (Notes + Wiki 일관 적용)
- `Note.linksOut`, `WikiArticle.linksOut` 데이터 이미 존재 ([lib/types.ts:270, 344](lib/types.ts))
- List 컬럼 (Notes + Wiki 양쪽)
- Board 카드 옵션 표시 (Display Properties 토글)

### B. 위계 컬럼 (Notes + Wiki, Sprint 1.4 follow-up)
- **Children 컬럼** (자식 수) — Hub note 식별, sort 가능 ★
- **Parent 컬럼** (직속 부모 노트 제목) — row 단위 부모 인지
- ~~Root 컬럼~~ (비추 — Parent와 거의 중복)

### Sprint 1 P1 잔존
- **Sub-group** UI dropdown (인프라 100% 있음 — display-panel에 추가만)

---

## 🟡 follow-up (별도 PR 또는 Sprint 1.4 후속)

**Sprint 1.4 발견:**
- [ ] **모든 picker lazy mount 일괄 적용** — StrictMode dev warning 정리 (prod 영향 없지만 정합성). `components/side-panel/side-panel-context.tsx` Set parent picker, `wiki-article-detail-panel.tsx` parent picker, 기타 picker 사용처 grep
- [ ] **Wiki List multi-membership 일관성** — 현재 single (categoryIds[0]만). Board처럼 multi-membership 적용해서 일관
- [ ] **Wiki 본문 하단 children footer 신규** — 노트와 일관 (현재 노트 footer는 폐기, 사이드 패널 통합)
- [ ] **Board 단일 선택 컨텍스트 메뉴** (merge/split/delete) — PR 4 미구현
- [ ] **v96 sortField/sortDirection deprecated 제거 단독** — 사용처 marathon (notes-table 8곳, calendar-view "Date source" 오버로드, query-node 12곳)
- [ ] **a11y / Hydration mismatch 깊이 분석** — 기존 알려진 이슈와 연결 가능성

---

## 🟡 Sprint 2 (~3주): 핵심 폴리시

(변경 없음 — [docs/TODO.md](./TODO.md) 참조)

- 노트 템플릿 시드 10~20개 (onboarding 강화)
- 온톨로지 메트릭 설명 툴팁
- 캘린더 현황 점검 + 부족분
- Views 업그레이드 (실용적으로)
- Insights 업그레이드 (실용적으로)

---

## 🟢 Sprint 3 (~2주): 데스크톱 출시 자산

(변경 없음 — [docs/TODO.md](./TODO.md) 참조)

- 도메인 결정 + 구매
- 마케팅 사이트 (별도 워크트리)
- Privacy Policy + Terms (sync 없는 버전, 한국 + GDPR)
- 데스크톱 웹 배포

### 🎯 데스크톱 Free 출시

---

## 🟡 Sprint 4: 모바일 추가 (회원 수 충분해진 후)

(변경 없음)

---

## 🚀 Sync v2.0 (출시 후 6개월~1년)

(변경 없음 — `docs/SYNC-PRD.md` 보존)

---

## ✅ 2026-04-30 Sprint 1.4 완료 (4 PR — 단일 commit 통합)

### PR 1 (D Parent 위계 활성화) — 노트 + 위키 양쪽
- `lib/note-hierarchy.ts` 신규 (wiki-hierarchy.ts 1:1 미러: getNoteAncestors / getNoteChildren / getNoteDescendants / wouldCreateNoteCycle / classifyNoteRole)
- `setNoteParent` action + ViewState/Store 타입 확장
- 사이드 패널 **Connections > Hierarchy 섹션** 신설 (Detail에서 Parent/Children 이동) — Set parent picker + Children + Add child (multi-select picker)
- 노트 에디터 breadcrumb에 Parent crumb (ancestors 1/2/3+ 단계별 collapse)
- 노트 본문 하단 footer 폐기 (사이드 패널 단일 출처)
- view-engine **Family / Parent / Role grouping** (4 카테고리: Root/Parent/Child/Solo)
- **Filter-aware role 토글** (default OFF = 본질 store 전체 기준, ON = 필터 후)
- NotePickerDialog/WikiPickerDialog **multi-select 모드** (Add children 일괄)
- CommandItem hover 색 (bg-accent → bg-hover-bg, 라이트모드 contrast)
- Hover preview delay 300 → **500ms** (Notion/Gmail 표준)

### PR 2 (B Wiki 컬럼 정비)
- `WikiArticle.reads?: number` 필드 + **store v95 마이그레이션** (reads: 0 백필)
- `incrementWikiArticleReads` action + `openArticle` 시 reads++ 호출
- view-engine wiki SortField status (isWikiStub) / reads
- WIKI_VIEW_CONFIG orderingOptions에 reads/status + properties에 status/reads/createdAt
- WikiList ColumnHeaders + ArticleTableRow에 status/reads/createdAt 컬럼 (Status badge: Stub=zinc / Article=accent)

### PR 3 (C Wiki 차트 개선)
- `lib/insights/types.ts` TimeSeriesPoint 5 필드 추가 (totalArticles/totalStubs/newArticles/newStubs/totalWikiEdges)
- `lib/insights/timeseries.ts` Article/Stub 분리 누적 + totalWikiEdges (wiki article 간 backlinks)
- `WikiGrowthChart` 리팩터 (bucketSize/dataFilter prop, stacked bar + multi-line)
- `WikiConnectivityChart` 신규 (totalWikiEdges AreaChart, ResizeObserver 패턴)
- `WikiInsightsChart` 신규 wrapper ([Growth | Connectivity] + [Day Week Month] + [All N | Articles M | Stubs K] sub-tabs with count)
- `WikiDashboard`에서 WikiInsightsChart로 교체

### PR 4 (A Wiki 보드 뷰)
- `WIKI_VIEW_CONFIG.supportedModes`에 "board" 추가 → View mode toggle 자동 노출
- `components/views/wiki-board.tsx` (신규, ~430 lines) — Linear-style compact board for WikiArticle
- **Multi-membership**: card key = `${articleId}::${groupKey}`, 같은 article이 여러 Category 컬럼에 N번 unique 렌더
- **Drag 분기**: Category=multi-set add/remove, Parent=setWikiArticleParent, tier/linkCount/role/family/none=비활성
- 카드 디자인: 제목 + Status badge + Backlinks + Reads + Categories chip (label groupBy 시 자동 숨김) + Updated relative
- `categoryNames` extras 추가 — wiki-list-pipeline에서 category name lookup (raw id 누수 fix)

### Store / 마이그레이션
- v94 → **v95** (reads 백필)
- 다음 cleanup PR에서 v96 = sortField/sortDirection deprecated 제거 단독 (별도)

---

## 📝 사용자 명시 결정 (2026-04-30 세션)

### 큰 결정 (영구)
- **노트 parent 활성화** — 사용자 자유 트리 구조 ("유저의 마음대로"). 제텔카스텐 + 폴더 + 링크 + threading와 함께 위계 옵션 추가
- **Hierarchy 섹션 = Connections 탭** — Detail은 메타데이터, Connections는 관계. parent-child = 본질적으로 관계
- **본문 하단 footer 폐기** — 사이드 패널 Hierarchy가 단일 출처 (set parent + add child + children 표시)
- **Multi-membership 채택** (Category grouping) — Plot "지식 관계망" 정체성 부합
- **4 카테고리 모델** — Root/Parent/Child/Solo (mutually exclusive). 코드는 일반 트리 정의 (parent X = root) 유지. UI 분류는 4 카테고리
- **Filter-aware role 디폴트 OFF** — 본질이 디폴트, 필터 후 분류는 토글 옵션
- **Hover preview delay 500ms** — Notion/Gmail 표준. 갑작스러움 방지
- **위키피디아 + 나무위키 하이브리드** — 카테고리 DAG (위키피디아) + Article 위계 single-parent tree (나무위키)

### Plot 영구 규칙 재확인
- "시각적 다양성 ≠ Plot 코어" — 단, 명확한 그룹 차원 + 사용자 가치 판단 시 검토 가능
- 단순/명확/사용자 통제 친화적
- "tier" 명칭 절대 사용 X (4가지 의미 충돌) — Stub/Article은 항상 **"Status"**

---

## 🟡 알려진 이슈

- TipTap duplicate extension warnings (link/underline/gapCursor) — 기능 영향 없음
- Hydration mismatch (Radix UI aria-controls ID) — 기능 영향 없음
- "Can't perform a React state update on a component that hasn't mounted yet" warning — **StrictMode dev only, prod 영향 없음**. Picker dialogs 항상 mount 패턴 + Radix Dialog Title/Description id-association race
- ResponsiveContainer (recharts) — React 19/Next 16 환경 → ResizeObserver 패턴 우회 (이미 적용)

---

## 📚 필수 참고

- [`docs/CONTEXT.md`](./CONTEXT.md) — 현재 Plot 상태 + 설계 결정
- [`docs/MEMORY.md`](./MEMORY.md) — 전체 PR 히스토리
- [`docs/TODO.md`](./TODO.md) — Sprint 진행 추적
- [`docs/SYNC-PRD.md`](./SYNC-PRD.md) — Sync v2.0 PRD (보존, 향후 활성화)
- [`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md) — Sync 6개 결정
- [`docs/UI-CONSISTENCY-AUDIT.md`](./UI-CONSISTENCY-AUDIT.md) — UI 일관성 audit (Sprint 1.2)
- [`docs/DESIGN-TOKENS.md`](./DESIGN-TOKENS.md) — 디자인 토큰
