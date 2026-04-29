# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.

---

**Last Updated**: 2026-04-29 (오후 후반) — **출시 준비 우선 결정. Sync는 v2.0 (출시 후 6개월~1년)**

---

## 🎯 큰 방향 (2026-04-29 오후 후반 결정)

**Sync 대신 출시 준비 먼저** — 결정 #3 변경: (a) Sync 포함 출시 → **(c) Free 출시 후 v2.0에 Sync**

**이유**: Sync = 3~4개월, 그 동안 사용자 facing 개선 멈춤. 앱 폴리시 빚 있는 채로 인프라 쌓는 건 위험. 출시 후 사용자 피드백 받고 sync 설계 보강 가능.

**타임라인**: **자유 (끝날 때까지)** — 품질 우선
**플랫폼**: **데스크톱 우선 출시** → 회원 수 충분해지면 모바일 (PWA + TWA)
**Sync**: PRD 보존 ([`docs/SYNC-PRD.md`](./SYNC-PRD.md)). v2.0 진입 시점에 활성화

---

## 🚀 Sprint 1 (~2주): 빠른 wins

### P1 Notes 3개 — 한 PR 묶음 ★ 가장 빠른 시작

`feat(filter): P1 Notes — Sub-group + Multi-sort + 날짜 상대값`

- [ ] **Sub-group** (S, 가장 빠른 wins) — 인프라 100% 있음. UI dropdown 추가만
  - 변경: [components/display-panel.tsx](components/display-panel.tsx) Grouping dropdown 옆에 Sub-grouping dropdown
  - 검증: [components/notes-table.tsx](components/notes-table.tsx)에서 `groups[].subGroups` 렌더 확인
- [ ] **Multi-sort (Primary + Secondary)** (S~M)
  - [lib/view-engine/sort.ts](lib/view-engine/sort.ts) `applySort` 시그니처: `(notes, field, direction, ...)` → `(notes, sorts: Array<{field, direction}>, ...)`
  - comparator chain: `(a, b) => sorts.reduce((acc, s) => acc !== 0 ? acc : compareSingle(a, b, s), 0)`
  - UI: dropdown 1개 → 2~3개 (`+ Add another sort`). 최대 3단계
  - ViewState: `sortField: string` → `sortFields: Array<{field, direction}>`
  - **v94 migration** (sortField → sortFields[])
  - 호환성: 단일 sort도 length-1 배열로 normalize
- [ ] **날짜 상대값** (S)
  - [lib/view-engine/filter.ts](lib/view-engine/filter.ts) 기존 `parseRelativeTime` 확장 (`stale`, `24h`, `7d`)
  - 새 옵션: "이번 주" (7d), "이번 달" (30d), "지난 7일", "오늘" (24h), "어제"
  - [lib/view-engine/view-configs.tsx](lib/view-engine/view-configs.tsx) `filterCategories.updatedAt.values` / `createdAt.values`에 추가
  - date-fns 의존성 확인 (없으면 직접 구현 — 시간대 주의)

### 필터/디스플레이 드롭다운 정리 ★ 액티비티별 일관성

각 Activity Bar 공간 (Inbox / Notes / Wiki / Calendar / Ontology / Library)의 사이드바 필터/디스플레이 드롭다운 일관성 점검:
- [ ] 각 공간별 어떤 필터/디스플레이 옵션이 어디에 노출되는지 매핑
- [ ] 중복/dead 옵션 제거 (PR #221에서 14개 정리됐지만 추가 검토)
- [ ] 디자인 일관성 (segmented vs dropdown vs toggle)
- [ ] 사이드바 토글 패턴 통일

---

## 🟡 Sprint 2 (~3주): 핵심 폴리시

### 노트 템플릿 시드 10~20개

**ROI 높음 — 첫 사용자 onboarding 강화**:
- [ ] 일기 / 회의록 / 독서 노트 / 프로젝트 노트 / 데일리 노트
- [ ] 리서치 노트 / 인터뷰 노트 / 아이디어 / 회고 / 위키 stub
- [ ] (선택) 책 노트 / 영화 리뷰 / 학습 노트 / 칸반 / OKR
- 위치: [lib/store/slices/templates.ts](lib/store/slices/templates.ts) 시드 데이터 + 마이그레이션
- UI: 첫 사용 시 템플릿 둘러보기 모달 (선택적 onboarding)

### 온톨로지 메트릭 설명 툴팁

각 메트릭에 대한 사용자 친화적 설명:
- [ ] Knowledge WAR — "지식 그래프 연결도 종합 지표"
- [ ] Concept Reach — "한 노트에서 평균 N홉으로 도달 가능한 노트 수"
- [ ] Hubs — "5개 이상에 연결된 허브 노트"
- [ ] Link Density — "노트당 평균 링크 수"
- [ ] Orphan Rate — "고립된 노트 비율"
- [ ] Tag Coverage — "태그가 있는 노트 비율"
- [ ] Cluster Cohesion — "관련 노트들이 얼마나 묶여있는지"
- 위치: [components/ontology/](components/ontology/) 각 메트릭 row에 ⓘ 호버 툴팁

### 캘린더 현황 점검 + 부족분

**설계는 docs/CONTEXT.md에 있음 (확정). 실제 구현 vs 설계 갭 매핑 필요**:
- [ ] 현재 캘린더 동작 점검 (Month / Week / Agenda)
- [ ] Date Source 토글 (createdAt / updatedAt / reviewAt) 확인
- [ ] Layer 시스템 (Notes/Wiki/Reminders ON, Relations/Tags/Templates OFF) 확인
- [ ] FilterPanel/DisplayPanel 재사용 확인
- [ ] 빈 날짜 클릭 → 노트 생성 동작
- [ ] 사이드바 (미니 캘린더 / 오늘의 요약 / Upcoming) 구현 상태
- [ ] 부족분 구현

### Views 업그레이드 (실용적으로)

**범위 사용자와 함께 결정 필요**:
- 사이드바 Views 섹션 사용성 점검
- Saved View 검증 (이미 구현됨, 동작 확인)
- 커스텀 뷰 생성/편집 UX 점검

### Insights 업그레이드 (실용적으로)

**범위 사용자와 함께 결정 필요**:
- 온톨로지 Insights 탭 (PR #218에서 추가) 점검
- Knowledge Nudge 액션 카드 (Orphan / 위키 승격 / Unlinked Mention) 동작 확인
- 시계열 메트릭 (PR #219) 점검
- 부족분 보강

---

## 🟢 Sprint 3 (~2주): 데스크톱 출시 자산

### 도메인 결정 + 구매
- [ ] 도메인 후보: plot.app / plotnote.com / plot.so / 기타?
- [ ] 한국 / 글로벌 양쪽 검토
- [ ] 비용 (.app 도메인 ~$15/년)

### 마케팅 사이트 (별도 워크트리)
- [ ] 별도 Next.js 프로젝트 / 별도 Vercel 배포
- [ ] 랜딩 페이지: 가치 제안 (제텔카스텐 + 위키 + 지식 관계망)
- [ ] 스크린샷 (데스크톱 + 위키 + 온톨로지 그래프)
- [ ] /pricing 페이지 (현재는 Free만)
- [ ] /docs (사용 가이드)
- [ ] /blog (선택)

### Privacy Policy + Terms of Service (sync 없는 버전)
- [ ] 한국 개인정보보호법 부합
- [ ] GDPR 부합 (글로벌 출시 대비)
- [ ] 데이터 저장 위치 명시 (현재 100% 로컬 IDB)
- [ ] sync 없으므로 데이터 수집 없음 명시
- [ ] 변호사 검토 권장

### 데스크톱 웹 배포
- [ ] Vercel 환경 변수 정리
- [ ] 빌드 에러 수정 ([components/views/home-view.tsx:41](components/views/home-view.tsx:41) backlinks 등)
- [ ] 프로덕션 빌드 검증
- [ ] 도메인 연결
- [ ] (선택) Sentry / Plausible Analytics

### 🎯 데스크톱 Free 출시

---

## 🟡 Sprint 4: 모바일 추가 (회원 수 충분해진 후)

데스크톱 회원 수가 충분해지면 진행:

- [ ] 모바일 반응형 감사 — 깨지는 페이지 매핑
- [ ] PWA manifest + Service Worker
- [ ] Bubblewrap TWA 빌드
- [ ] Google Play Store 자산 (스크린샷 / 설명 / 아이콘)
- [ ] App Store 등록 (iOS는 Apple OAuth 필요 시점)

---

## 🚀 Sync v2.0 (출시 후 6개월~1년)

**SYNC-PRD.md 활성화** — 출시 후 사용자 피드백 반영해서 보강:

1. Phase 1: 인증 + 기본 sync 인프라 (3~4주)
2. Phase 2: 양방향 sync + Yjs 본 통합 (4~5주)
3. Phase 3: 다중 기기 + 백업 + Pro 기능 (2~3주)
4. Phase 4: 결제 + Sync v2.0 출시 (2~3주)

**6개 결정 LOCKED** ([`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md)):
- B. Supabase + E2E / Free $0 / Sync $5 / Pro $10 / Yjs 전체 / Magic+Google+Kakao

---

## ✅ 2026-04-29 세션 완료

| 작업 | 결과 |
|------|------|
| Sync 6개 결정 LOCKED | Supabase B + Free/$5/$10 + Yjs 전체 + Magic+Google+Kakao |
| **결정 #3 재고 → (c)로 변경** | **출시 준비 우선, Sync는 v2.0** |
| PRD 작성 | docs/SYNC-PRD.md (v2.0 spec으로 보존) |
| 출시 계획 수립 | 4 Sprint (Sprint 1~3 데스크톱 출시 / Sprint 4 모바일 / Sync v2.0) |
| 출시 결정 | 데스크톱 우선, 자유 타임라인 (품질 우선), PWA+TWA (모바일 시점) |

---

## 🟢 잊지 말 것 (영구 규칙)

### Plot 코어 정체성
- Plot = 노트 + 위키 + **지식 관계망** (팔란티어 × 제텔카스텐)
- LLM 없이 **규칙/통계/그래프 알고리즘**
- **시각적 다양성 ≠ Plot 코어**
- 토글 옵션 적게 (Linear 방식)

### Sync 영구 규칙 (NEW, 2026-04-29 — v2.0 시점에 적용)
- 단일 사용자 도구 유지 (협업 X, 다중 기기만)
- E2E 암호화 절대 양보 X
- 오프라인 우선
- 마스터 비번 분실 = 데이터 복구 불가 → Recovery Phrase 강제

### 큰 방향 전환 전 전체 설계 확정
- ✅ 2026-04-29 sync는 6개 결정 + PRD 후 시작 — 좋은 예
- ✅ 같은 세션 내 (a) → (c) 재고 — "정말 지금 시작?" 자기 검증 좋음

---

## 🟡 알려진 이슈 (pre-existing, 기능 영향 없음)

- TipTap duplicate extension warnings (link/underline/gapCursor)
- Hydration mismatch (Radix UI aria-controls ID)
- ResponsiveContainer (recharts) — React 19/Next 16 환경 → ResizeObserver 패턴 우회
- `home-view.tsx:41` backlinks 관련 tsc 에러 1건 (Sprint 3 출시 빌드 검증 시 수정)

---

## 📚 필수 참고

- [`docs/CONTEXT.md`](./CONTEXT.md) — 현재 Plot 상태 + 설계 결정
- [`docs/MEMORY.md`](./MEMORY.md) — 전체 PR 히스토리
- [`docs/TODO.md`](./TODO.md) — Sprint 진행 추적
- [`docs/SYNC-PRD.md`](./SYNC-PRD.md) — Sync v2.0 PRD (보존, 향후 활성화)
- [`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md) — Sync 6개 결정
- [`docs/DESIGN-TOKENS.md`](./DESIGN-TOKENS.md) — 디자인 토큰
