# Entity Insights 정보 아키텍처 통일 — Plan

> **PDCA Phase**: Plan
> **작성**: 2026-05-28 (오후)
> **머신**: 집 (Windows)
> **출처**: 2026-05-28 사이드바 정합 세션 brainstorm → entity Insights 위치 비대칭 발견

---

## 1. 개요 (문제 정의)

Plot의 entity 세부 Insights가 **위치·존재가 제각각**이라 정보 아키텍처가 비대칭이다.

| Entity | 현재 Insights 위치 | 내용 |
|--------|-------------------|------|
| **Notes** | 별도 `/insights` page (`insights-view.tsx`) | StatCards(Stone/Brick/Block/Wiki) + 7-day activity MiniBarChart + Analysis(orphans/issues) |
| **Wiki** | Dashboard(`/wiki`) 임베드 (`wiki-dashboard.tsx:262` `WikiInsightsChart`) | Growth / Connectivity (Day/Week/Month) |
| **Books** | **없음** | — |
| **Ontology** | top-level 탭 (Graph/Insights/Dashboard) | Power Sabermetrics (Graph Health + Coverage Mosaic + Nudge + Top Notes) = **전체 cross-entity** |

근본 원인: entity마다 "메인 화면" 성격이 다름 (Notes=list / Wiki=dashboard / Books=list). 사용자가 사이드바 정합 작업 중 "위키랑 북 More에도 인사이트가 들어가야겠다"고 인식.

---

## 2. 목표

1. entity 세부 Insights를 **별도 page로 위치 통일** (A안, 사용자 결정 2026-05-28)
2. Notes / Wiki / Books 모두 사이드바 **More section에 Insights entry**
3. 영구 룰 #140 유지: **Ontology = 전체(cross-entity) / 각 entity = 세부**. 중복 회피.

---

## 3. 핵심 결정 (확정)

- **위치 통일 = A안 (별도 page + 사이드바 More entry)** — 사용자 결정 (2026-05-28 오후, AskUserQuestion)
  - `/insights` (Notes, 기존 유지)
  - `/wiki/insights` (신설 — Wiki Dashboard의 `WikiInsightsChart` 분리/이동)
  - `/books/insights` (신설)
  - Ontology = 전체 유지 (top-level 탭, 변경 없음)
- 영구 룰 후보 **#168**: Entity Insights = 별도 page 통일 + More entry. Ontology(전체) vs entity(세부) 정보 아키텍처 LOCKED.

---

## 4. 범위

### In Scope (이 PRD)
- **FR-1**: `/wiki/insights` page 신설 — 기존 `WikiInsightsChart`(Growth/Connectivity) 재활용
- **FR-2**: `/books/insights` page 신설 — 내용 신규 정의 (§6)
- **FR-3**: Notes `/insights` 정합 점검 (기존 유지, 필요 시 레이아웃 통일)
- **FR-4**: 사이드바 More에 Insights entry — Wiki More(기존 Templates 옆), **Books More section 신설**(Insights entry로 시작)
- **FR-5**: Wiki Dashboard 재구성 — 차트 분리 후 Dashboard 허전함 처리 (차트 이동 vs 요약 유지 = design 결정)
- **FR-6**: Ontology(전체) vs entity(세부) 중복 회피 — 각 entity insights는 자기 entity 세부만, 전체 graph metric은 Ontology

### Out of Scope (후속/별도)
- **Smart Book Preset** — 사용자가 "Books More에 Smart Book도" 제안했으나 ROI 불확실(book 생성 빈도 낮음) + 별도 성격(기능 vs 표시). `smart-book-prd.md:601` v2 항목. **별도 결정 PRD**.
- **Book 폴더 Phase 2** — 별도 PRD (데이터 Phase 1 완료, UI 미구현)
- **Category/Label 필터 비대칭** — 별도 brainstorm
- **source 필터 정리** — Phase 4 filter-bar Linear 마이그에서

---

## 5. 요구사항 상세 (FR)

### FR-1: Wiki Insights page (`/wiki/insights`)
- 기존 `components/wiki-editor/wiki-insights-chart.tsx`(`WikiInsightsChart`) 재활용
- Growth / Connectivity 차트 (Day/Week/Month + All/Articles/Stubs sub-tab)
- ViewHeader + 레이아웃은 Notes `/insights` 패턴 정합 (max-w-5xl, #136 v2)
- `app/(app)/wiki/insights/page.tsx` (always-mounted view 패턴)

### FR-2: Books Insights page (`/books/insights`)
- 내용 §6 정의
- `app/(app)/books/insights/page.tsx`

### FR-3: Notes Insights 정합
- 기존 `/insights` (insights-view.tsx) 유지
- Wiki/Books page와 레이아웃·헤더 통일 점검

### FR-4: 사이드바 More entry
- Wiki More: 기존 Templates + **Insights** 추가
- Books More section 신설: **Insights** entry (Smart Book Preset은 후속)
- Notes More: 기존 Templates + Insights (이미 있음)

### FR-5: Wiki Dashboard 재구성
- `wiki-dashboard.tsx`에서 `WikiInsightsChart` 분리
- 옵션 (design): (a) 완전 이동 — dashboard에 요약 KPI만 / (b) dashboard 미니 요약 + page 상세
- Dashboard 허전함 회피

### FR-6: 정보 아키텍처 (Ontology vs entity)
- Ontology Insights = 전체 graph health, coverage mosaic, composite (cross-entity)
- entity Insights = 자기 entity 세부 (Notes=lifecycle/activity, Wiki=growth/connectivity, Books=reading/coverage)
- 중복 metric 식별 + 분리 규칙

---

## 6. 각 entity Insights 내용 정의

| Entity | 세부 metric (entity 고유) |
|--------|--------------------------|
| **Notes** | lifecycle(Stone/Brick/Block) + 7-day activity + analysis(orphans/issues) — 기존 |
| **Wiki** | Growth(누적/월별 신규) + Connectivity(wikilink 연결성) — 기존 WikiInsightsChart |
| **Books** (신규 정의 후보) | ① reading progress (lastReadAt/lastReadItemId 기반 "읽는 중" 책) ② coverage (book이 묶은 note/wiki 수, smart source 자동 채움 비율) ③ kind 분포 (smart/manual/hybrid) ④ 가장 활발한/큰 book |

> Books Insights 내용은 design 단계에서 데이터 가용성(Book.items, smartSources, lastReadAt) 검증 후 확정.

---

## 7. 성공 기준

- [ ] Notes/Wiki/Books Insights가 **모두 별도 page**로 위치 일관
- [ ] 각 entity 사이드바 More에 Insights entry (Books More section 신설)
- [ ] Wiki Dashboard 차트 분리 후 Dashboard 자연스러움 유지
- [ ] Ontology(전체) vs entity(세부) 중복 metric 없음
- [ ] `tsc --noEmit` exit 0 + 사용자 시각 검증 (라이트/다크)

---

## 8. 리스크

| 리스크 | 완화 |
|--------|------|
| Wiki Dashboard 차트 분리 시 Dashboard 허전 | FR-5에서 요약 KPI 유지 or 미니 차트 |
| Books insights 데이터 빈약 (book 적음) | §6 데이터 가용성 design 검증, empty state 설계 |
| Ontology와 entity insights 중복 | FR-6 분리 규칙 — entity는 자기 세부만 |
| Notes/Wiki/Books 레이아웃 불일치 | 공통 InsightsLayout 컴포넌트 추출 검토 (design) |
| PR 비대 | entity별 분리 PR 가능 (Wiki insights → Books insights → 정합) |

---

## 9. 다음 단계

```
/pdca design entity-insights-coherence
```

design 단계에서:
- Wiki Dashboard 재구성 방식 (FR-5 a/b) 확정
- Books Insights 내용 데이터 가용성 검증 + 확정 (§6)
- 공통 InsightsLayout 추출 여부
- 정보 아키텍처 중복 분리 규칙 (FR-6)
- 구현 순서 (Wiki → Books → Notes 정합 → More entry)

---

## 참고 파일

- `components/insights-view.tsx` — Notes Insights (기준 패턴)
- `components/wiki-editor/wiki-insights-chart.tsx` — Wiki 재료 (Growth/Connectivity)
- `components/views/wiki-dashboard.tsx:262` — WikiInsightsChart 현재 임베드 위치
- `components/ontology/ontology-insights-panel.tsx` — Ontology 전체 (중복 회피 기준)
- `components/linear-sidebar.tsx` — 사이드바 More section (Wiki 977 근처 + Books section)
- `lib/types.ts` Book interface (lastReadAt/items/smartSources — Books insights 데이터)
- 영구 룰 #140 (Ontology=전체/entity=세부), #167 (More section), #168 (Insights 위치 통일)
