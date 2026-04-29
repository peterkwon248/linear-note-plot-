# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.

---

**Last Updated**: 2026-04-29 — v0 협업 흡수 + UI polish + dead code 정리 + P0 필터 강화 + Row density 시도/revert (5 PR 머지) + **다중 기기 sync 큰 결정 보류**

**다음 머신**: 다른 컴퓨터 (사용자 명시). before-work에서 git pull + IDB 별도 인지

---

## 🚨 다음 세션 첫 액션 — 다중 기기 sync 결정 6개 받기 (큰 방향 전환)

**사용자 의향 (2026-04-29)**: "다중 기기 sync 필요해. 옵시디언도 이걸로 유료 구독료를 받잖아."

→ **수익 모델 + Sync 도입 결정**. 영구 규칙 "큰 방향 전환 전 전체 설계 확정" 적용. **결정 6개 받기 전 코드 X.**

### 자세한 옵션 비교: `docs/SYNC-DESIGN-DECISIONS.md` ★

요약:
- **추천 옵션 B (Supabase + E2E 암호화)** — 균형 (프라이버시 + 출시 일정 + 비용)
- **추천 가격**: Free / Sync $4 / Pro $8
- **추천 결제**: Lemon Squeezy (Merchant of Record)
- **추천 인증**: Magic link + OAuth (Google/Apple)
- **Y.Doc 재활용 결정 뒤집기**: 노트 본문에 CRDT 재도입 (충돌 해결)
- **임시 phase 안**: 7~11주 = 2~3개월 (4 phase)

### 결정 받아야 할 6개 (`docs/SYNC-DESIGN-DECISIONS.md` 참고)
1. **옵션 선택**: A / B / C / D / E / F (추천 B)
2. **가격 모델**: Free / $4 / $8 OK? 다른 가격?
3. **출시 시점**: sync 포함 출시 / 출시 후 추가 / v2.0
4. **CRDT/Y.Doc 재활용**: 이전 폐기 뒤집을 것인가
5. **결제 시스템**: Lemon Squeezy / Stripe / Paddle
6. **인증**: 이메일+비번 / Magic link / OAuth (Google/Apple) / 모두

→ 결정 후 → 별도 PRD 작성 → phase 분할 → 구현 시작.

**P1 Notes 3개는 sync와 무관**한 일반 강화. sync 결정 받기 전이라도 P1 진행 가능 (병행).

---

## 🎯 다음 세션 즉시 시작 (선택 1) — P1 Notes 3개

이번 세션 P0 4개 다 완료 (PR #222). 5 앱 리서치 기반 P1 후속:

### 1. Sub-group ★ 가장 빠른 wins (S 난이도)
**인프라 100% 이미 구축됨**:
- `lib/view-engine/types.ts`: `ViewState.subGroupBy: GroupBy` ✓
- `lib/view-engine/group.ts`: `applyGrouping` 재귀 처리 ✓
- `NoteGroup.subGroups?: NoteGroup[]` 타입 ✓

**UI 노출만 남음** — `components/display-panel.tsx`에 Grouping dropdown 옆에 Sub-grouping dropdown 추가. notes-table.tsx에서 `groups[].subGroups` 렌더 (이미 있을 수도, 확인 필요). 작업량 거의 0.

**의미 있는 조합** (사용자 시나리오):
- Status × Priority — Inbox 안에서 Urgent/High 그룹별 정리
- Folder × Status — 프로젝트별로 진행 상황 시각화
- Date × Priority — 시간순 + 우선순위

**Wiki/Library Sub-group은 비추** (분석 결과). 직교하는 두 dimension이 Notes에만 존재.

### 2. Multi-sort (S~M)
- `lib/view-engine/sort.ts`: `applySort(notes, field, direction, backlinksMap)` → `applySort(notes, sorts: Array<{field, direction}>, backlinksMap)` 시그니처 변경
- comparator chain 패턴: `(a, b) => sorts.reduce((acc, s) => acc !== 0 ? acc : compareSingle(a, b, s), 0)`
- UI: dropdown 1개 → 2~3개 (`+ Add another sort` 버튼). 최대 3단계 제한
- ViewState: `sortField: string` → `sortFields: Array<{field, direction}>`. v94 migration 필요
- 호환성: 단일 sort도 length-1 배열로 normalize

### 3. 날짜 상대값 (S)
- `lib/view-engine/filter.ts`에 이미 일부 처리 있음 (`stale`, `24h`, `7d` 같은 `parseRelativeTime`). 확장.
- 새 옵션: "이번 주" (7d), "이번 달" (30d), "지난 7일", "오늘" (24h), "어제"
- `view-configs.tsx` `filterCategories.updatedAt.values` / `createdAt.values`에 추가
- date-fns 활용 (이미 의존성 있는지 확인. 없으면 직접 구현 — 시간대 처리 주의)

### 작업 묶음 권장
**한 PR로 묶음** (Notes display & filter 영역):
- Title: `feat(filter): P1 Notes — Sub-group + Multi-sort + 날짜 상대값`
- 변경 파일: types.ts, group.ts (이미 OK), sort.ts, filter.ts, view-configs.tsx, display-panel.tsx, defaults.ts, migrate.ts(v94?), notes-table.tsx (subGroups 렌더 확인)

---

## 🟡 별도 PR (다음 세션 또는 그 다음)

### Wiki 1차 groupBy 추가 (M)
- WikiList는 view-engine 파이프라인 사용 안 함. 직접 적용 vs 별도 grouping 구현 결정 필요
- 제안: `linkCount bucket` (5+ / 10+ / no backlinks) → "허브 위키" 식별
- 또는 `infoboxPreset` 별 (person / place / concept 등)
- WikiArticle은 status 필드 X (isWikiStub 런타임 파생). 1차 dimension 빈약
- Plot 코어 적용도 (지식 관계망): "linkCount 많은 stub" = 자주 참조되지만 미완성 → actionable

### P0-4 note picker 기반 inbound link filter (M)
- 특정 노트 ID picker → "그 노트로 inbound link한 노트만" 필터
- UX 결정 필요: SmartSidePanel Connections 강화 vs FilterPanel에 새 picker
- 현재 "Has backlinks" 만 활성화 (PR #222). 특정 노트 지정은 미구현

---

## ✅ 2026-04-29 세션 완료

| PR | 내용 | Commit |
|----|------|--------|
| #220 | v0 작업 흡수 (라이트모드 contrast + Home View 리디자인) | 23fe1be |
| #221 | UI polish (체크박스 + chart 색) + dead code 14개 | 4f5165a |
| #222 | P0 필터 강화 (True orphan + Has backlinks + Wiki-registered) | f613532 |
| #223 | Row density dropdown 통합 (Compact + Show card preview) | 7423c08 |
| #224 | Row density 제거 — Linear 스타일 단일 행 | 7472321 |

Store version: **v91 → v92 → v93** (PR #223 v92 + PR #224 v93)

---

## 🟢 잊지 말 것

### Plot 코어 정체성 (영구 규칙)
- Plot = 노트 + 위키 + **지식 관계망** (팔란티어 × 제텔카스텐)
- LLM 없이 **규칙/통계/그래프 알고리즘**
- **시각적 다양성 ≠ Plot 코어** ← 2026-04-22 자각 + 2026-04-29 Row density 시도/revert로 재확인
- "멋진 레이아웃" 방향 X
- 토글 옵션 적게 (Linear 방식). 진짜 필요한 것만

### 큰 방향 전환 전 전체 설계 확정
- 2026-04-29 Row density 시도가 좋은 예 — Notion 패턴이 Plot에 안 맞아 revert
- 다음 큰 변경(예: Sub-group UX) 전에 사용자 사용 시나리오 확실히

### 코드 패턴
- **executor agent 위임**: multi-file 변경 효율적. tsc/test 자동 검증
- **dead code 정리**: Explore 1차 분류 후 executor 정밀 분리 (UI dead vs state dead)
- **HMR 캐시 이슈**: 큰 schema 변경 후 hooks 에러 가능 — dev server restart
- **Recharts ResponsiveContainer 회피**: React 19/Next 16에서 width 0. ResizeObserver 직접 패턴 (`wiki-growth-chart.tsx`)

### Plot 사용자가 보일 새 P1 옵션
- **True orphans** quickFilter (linksOut=0 AND backlinks=0)
- **Wiki-registered** filter (note가 위키화 됐는가)
- **Has backlinks** filter (역링크 있는 노트만)
- **Row density 토글 사라짐** — 단일 행 (Linear 스타일). 자동 반응형은 모바일에서 그대로

---

## 🚀 출시 방향 (여전히 보류)

이전 세션부터 결정 대기 4개. 다음 세션에서 사용자에게 받기:
1. **모바일 전략**: PWA → TWA OK?
2. **출시 전 부족분 우선순위**: 온톨로지 / 캘린더 / 템플릿
3. **웹사이트 옵션**: 별도 Next.js + Vercel? 도메인?
4. **타임라인**: 1개월 / 3개월 / 자유?

→ 결정 받기 전 출시 관련 코드 X. **단 P1 Notes 3개는 출시와 무관한 일반 강화라 진행 OK**.

---

## 🟡 알려진 이슈 (pre-existing, 기능 영향 없음)
- TipTap duplicate extension warnings (link/underline/gapCursor)
- Hydration mismatch (Radix UI aria-controls ID, suppressHydrationWarning으로 가림)
- ResponsiveContainer (recharts) — React 19/Next 16 환경에서 width 0 발생 → ResizeObserver 패턴 우회 (PR #219)
- `home-view.tsx:41` backlinks 관련 tsc 에러 1건 (기존, 우리 작업 무관)

---

## 📚 필수 참고

- `docs/CONTEXT.md` — Source of truth (PR #224 + 이번 세션 반영)
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처
- `docs/TODO.md` — 우선순위 (P0/P1/P2/P3)
- `docs/DESIGN-TOKENS.md` — 디자인 토큰
- `docs/SESSION-LOG.md` — 시간순 세션 기록 (2026-04-29 entry 가장 위)
