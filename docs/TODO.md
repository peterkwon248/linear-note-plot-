# Plot — TODO (2026-04-29 오후 후반 갱신)

> CONTEXT.md가 source of truth. **2026-04-29 오후 후반 결정**: 출시 준비 우선, Sync는 v2.0 (출시 후 6개월~1년).

---

## 🎯 큰 방향 — 출시 준비 우선 (결정 #3 = c)

**타임라인**: 자유 (끝날 때까지) — 품질 우선
**플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일 (PWA + TWA)
**Sync**: v2.0 (출시 후 6개월~1년). PRD 보존 ([`docs/SYNC-PRD.md`](./SYNC-PRD.md))

**자세한 작업 가이드**: [`docs/NEXT-ACTION.md`](./NEXT-ACTION.md)

---

## 🚀 Sprint 1 (~2주): 빠른 wins

### P1 Notes 3개 — 한 PR ★ 다음 세션 즉시 시작

`feat(filter): P1 Notes — Sub-group + Multi-sort + 날짜 상대값`

- [ ] **Sub-group** (S) — 인프라 100% 있음. UI dropdown 추가만
- [ ] **Multi-sort** (S~M) — `applySort` 시그니처 변경 + comparator chain + v94 migration
- [ ] **날짜 상대값** (S) — date-fns 활용, `parseRelativeTime` 확장

### 필터/디스플레이 드롭다운 정리

- [ ] 각 Activity Bar 공간 (Inbox / Notes / Wiki / Calendar / Ontology / Library) 사이드바 필터/디스플레이 매핑
- [ ] 중복/dead 옵션 추가 정리 (PR #221에서 14개 정리됐으나 추가 검토)
- [ ] 디자인 일관성 (segmented vs dropdown vs toggle)
- [ ] 사이드바 토글 패턴 통일

---

## 🟡 Sprint 2 (~3주): 핵심 폴리시

### 노트 템플릿 시드 10~20개

**ROI 높음 — 첫 사용자 onboarding**:
- [ ] 일기 / 회의록 / 독서 노트 / 프로젝트 노트 / 데일리 노트
- [ ] 리서치 노트 / 인터뷰 노트 / 아이디어 / 회고 / 위키 stub
- [ ] (선택) 책 노트 / 영화 리뷰 / 학습 노트 / 칸반 / OKR
- [ ] 첫 사용 시 템플릿 둘러보기 모달 (선택적 onboarding)

### 온톨로지 메트릭 설명 툴팁

- [ ] Knowledge WAR / Concept Reach / Hubs / Link Density / Orphan Rate / Tag Coverage / Cluster Cohesion
- [ ] 각 메트릭 row에 ⓘ 호버 툴팁

### 캘린더 현황 점검 + 부족분

- [ ] 현재 동작 점검 (Month / Week / Agenda / Date Source / Layer 시스템 / FilterPanel 재사용)
- [ ] 빈 날짜 클릭 → 노트 생성 동작
- [ ] 사이드바 (미니 캘린더 / 오늘의 요약 / Upcoming) 구현 상태
- [ ] 부족분 구현

### Views 업그레이드 (실용적으로)

**범위 사용자와 함께 결정**:
- [ ] 사이드바 Views 섹션 사용성 점검
- [ ] Saved View 검증 (이미 구현됨)
- [ ] 커스텀 뷰 생성/편집 UX 점검

### Insights 업그레이드 (실용적으로)

**범위 사용자와 함께 결정**:
- [ ] 온톨로지 Insights 탭 (PR #218) 점검
- [ ] Knowledge Nudge 액션 카드 (Orphan / 위키 승격 / Unlinked Mention) 동작 확인
- [ ] 시계열 메트릭 (PR #219) 점검
- [ ] 부족분 보강

---

## 🟢 Sprint 3 (~2주): 데스크톱 출시 자산

### 도메인 결정 + 구매
- [ ] 후보: plot.app / plotnote.com / plot.so / 기타?
- [ ] 한국 / 글로벌 양쪽 검토

### 마케팅 사이트 (별도 워크트리)
- [ ] 별도 Next.js 프로젝트 + Vercel 배포
- [ ] 랜딩 / 스크린샷 / /pricing / /docs

### Privacy Policy + Terms (sync 없는 버전)
- [ ] 한국 개인정보보호법 + GDPR 부합
- [ ] 100% 로컬 IDB 명시
- [ ] 변호사 검토 권장

### 데스크톱 웹 배포
- [ ] Vercel 환경 변수 정리
- [ ] 빌드 에러 수정 (home-view.tsx:41 backlinks 등)
- [ ] 프로덕션 빌드 검증
- [ ] 도메인 연결

### 🎯 데스크톱 Free 출시

---

## 🟡 Sprint 4: 모바일 추가 (회원 수 충분해진 후)

- [ ] 모바일 반응형 감사 — 깨지는 페이지 매핑
- [ ] PWA manifest + Service Worker
- [ ] Bubblewrap TWA 빌드
- [ ] Google Play Store 자산
- [ ] (Phase 후순위) iOS App Store

---

## 🚀 Sync v2.0 (출시 후 6개월~1년)

**SYNC-PRD.md 활성화** — 출시 후 사용자 피드백 반영해서 보강:

### 6개 결정 LOCKED

| # | 항목 | 결정 |
|---|------|------|
| 1 | Sync 옵션 | B. Supabase + E2E |
| 2 | 가격 | Free / Sync $5 / Pro $10 |
| 3 | 출시 시점 | **(c) v2.0** ← 변경됨 |
| 4 | CRDT/Y.Doc | 노트+메타 모두 Yjs |
| 5 | 결제 | 보류 (v2.0 시점) |
| 6 | 인증 | Magic + Google + Kakao |

### Phase (총 11~15주 ≈ 3~4개월, v2.0 시점)

- Phase 1: 인증 + 기본 sync 인프라 (3~4주)
- Phase 2: 양방향 sync + Yjs 본 통합 (4~5주)
- Phase 3: 다중 기기 + 백업 + Pro (2~3주)
- Phase 4: 결제 + Sync v2.0 출시 (2~3주)

---

## 🟡 별도 PR (다음 또는 그 다음 세션)

- [ ] **Wiki 1차 groupBy 추가** (M) — linkCount bucket / infoboxPreset 별. view-engine 사용 X
- [ ] **P0-4 note picker 기반 inbound link filter** (M) — UX 결정 필요

### Multi-sort follow-ups (Sprint 1 PR architect 검증에서 발견)
- [ ] **column-click이 secondary/tertiary sort drops** — `notes-table.tsx:597-600` 컬럼 헤더 클릭 시 chain head를 갱신하지만 tail 보존 안됨. 사용자가 secondary sort 설정 후 컬럼 헤더 클릭하면 secondary 사라짐. 옵션: (a) tail 보존하도록 핸들러 수정 (b) "컬럼 클릭은 primary만 변경" 명시. P2.
- [ ] **view-configs.tsx:133 "reads" 라벨 오류** — `{ value: "reads", label: "Word count" }` 잘못 표시. `"Reads"` 또는 `"wordCount"` 필드로 수정. 기존 버그, multi-sort UI에서 더 두드러짐.

---

## ✅ 2026-04-29 세션 완료

| 묶음 | PR | 상태 |
|------|-----|------|
| v0 협업 흡수 (라이트모드 contrast + Home View) | #220 | ✅ 머지 |
| 체크박스 통일 + chart 색 WCAG AA + dead code 14개 | #221 | ✅ 머지 |
| P0 필터 강화 (True orphan + Has backlinks + Wiki-registered) | #222 | ✅ 머지 |
| Row density dropdown 통합 (Notion 패턴) | #223 | ✅ 머지 |
| Row density 제거 (Linear 스타일 — revert) | #224 | ✅ 머지 |
| docs (다중 기기 sync 큰 결정 보류) | #225, #226 | ✅ 머지 |

**오후 후반 작업** (이번 세션, PR 미생성):
- Sync 6개 결정 LOCKED (Supabase B + Free/$5/$10 + Yjs 전체 + Magic+Google+Kakao)
- PRD 작성 (docs/SYNC-PRD.md)
- 결정 #3 재고 → (c) 변경 (출시 우선, Sync는 v2.0)
- 출시 4-Sprint 계획 수립

Store version: v91 → v92 → v93

---

## 🟡 P2 — 미루는 작업

### 5 앱 리서치 결과 P2 (출시 후 검토)
- [ ] **AND/OR 중첩 필터 빌더** (L) — Linear 패턴. Plot 현재 사용자 규모(주로 본인)에 over-engineering 위험
- [ ] **뷰 타입 전환 Wiki Gallery** (L) — Wiki만 한정 신중 검토
- [ ] **Time in status 표시** (M) — Linear 패턴. noteEvents 활용

### 기존 P2 (이전 세션부터)
- 노트 Split 검증 — `note-split-page.tsx` 만들어졌으나 실제 동작 검증 필요
- 인포박스 base 티어 통합 — `WikiInfobox` → `InfoboxBlockNode` 단일화 (중장기)
- Connections 상세 — 블록/코멘트 단위 어느 위치에서 링크되는지
- Red Link 선택 팝업 UX — 클릭 → 노트/위키 분기 모달

---

## 🔵 P3 — 사이드패널 + 뷰 확장
- Connections 인라인 프리뷰 (Obsidian식)
- 동음이의어 해소 페이지
- 커맨드 팔레트 확장

## 🟣 P4 — 지능 + 검색
- 풀페이지 검색 분리, 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화

---

## 🚫 폐기됨 (영구)

### 2026-04-29 폐기 (Row density 시도)
- **Notion식 Row density dropdown** — 시도(#223) 후 즉시 revert(#224). Linear 방식 (별도 토글 X). **시각적 다양성 ≠ Plot 코어** 영구 규칙 재확인.

### 2026-04-27 폐기 (Sync 도입 시 재활성)
- **AI provider 연결** — CLAUDE.md "LLM 없이 규칙/통계/그래프" 정체성 위반 (영구)

### 2026-04-22 폐기 (Hard reset to PR #194)
- Book Pivot 5 shell (#211-213) / Page Identity Tier (#209) / 메타→블록 통합 (#208) / 컬럼 시스템 (#198-#205) / WikiTemplate 8 built-in (#197)

### 5 앱 리서치 anti-pattern (영구 폐기 권장)
- 뷰 타입 대량 추가 (Notion 8가지 같은) — Plot은 데이터베이스 앱 X
- AI/LLM 기반 스마트 필터 — Plot 영구 결정 위반
- 태그별 독립 정렬 — Bear 커뮤니티 미해결 요청
- 과도한 디스플레이 컬럼 (15+) — Linear 협업 도구 패턴
- Manual ordering — 노트 수십~수백 개에서 유지 불가

---

## 🧊 당분간 안 하는 것 (자기만족 리스크)

- **위키 시각적 다양화** — 추가 레이아웃 프리셋, 5 shell 등
- **나무위키 Top 7 나머지** — Hatnote / Ambox / 편집 히스토리
- **Notes Gallery 뷰** — 영구 규칙 위반 위험 (Wiki Gallery만 신중 검토)

---

## 📚 참조

- `docs/CONTEXT.md` — 현재 상태 + 설계 결정
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처
- `docs/SESSION-LOG.md` — 시간순 세션 기록
- `docs/NEXT-ACTION.md` — 다음 즉시 액션 (★ 가장 먼저 읽기)
- `docs/SYNC-PRD.md` — Sync v2.0 spec (보존)
- `docs/SYNC-DESIGN-DECISIONS.md` — Sync 6개 결정
- `docs/DESIGN-TOKENS.md` — 디자인 토큰
