# Plot — TODO (2026-04-29)

> CONTEXT.md가 source of truth. 2026-04-29 세션에서 5 PR 머지 완료. 다음 세션은 다른 컴퓨터.

---

## 🚨 큰 방향 — 다중 기기 sync + 수익 모델 (사용자 의향, 결정 보류)

**자세한 설계 문서**: [`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md) ★

- [ ] 6개 결정 받기 (옵션 / 가격 / 출시 시점 / Y.Doc 재활용 / 결제 / 인증)
- [ ] 결정 후 PRD 작성 (별도 문서)
- [ ] phase 분할 (Phase 1: 인증+기본 sync 2~3주 / Phase 2: 양방향 sync+CRDT 3~4주 / Phase 3: 다중 기기 1~2주 / Phase 4: 출시 1~2주)
- [ ] 구현 시작

**제약**: 영구 규칙 "큰 방향 전환 전 전체 설계 확정" → 결정 받기 전 코드 X

---

## 🎯 다음 세션 즉시 (P1 Notes 3개 — sync와 무관, 병행 가능)

한 PR로 묶어서 진행 권장 (Notes display & filter 영역).

- [ ] **Sub-group** (S, 가장 빠른 wins) — 인프라 100% 있음. UI dropdown 추가만 (display-panel)
- [ ] **Multi-sort (Primary + Secondary)** (S~M) — sort.ts comparator chain + UI 1→2~3개 dropdown. v94 migration (sortField → sortFields[])
- [ ] **날짜 상대값** (S) — date-fns로 "이번 주" / "지난 7일" / "오늘" / "어제" 옵션. filter.ts 기존 `parseRelativeTime` 확장

---

## 🟡 별도 PR (다음 또는 그 다음 세션)

- [ ] **Wiki 1차 groupBy 추가** (M) — WikiList에 현재 그룹핑 X. linkCount bucket 또는 infoboxPreset 별. WikiList가 view-engine 파이프라인 사용 안 함 → 직접 적용 vs 별도 grouping 결정 필요
- [ ] **P0-4 note picker 기반 inbound link filter** (M) — 특정 노트로 inbound link한 노트만. UX 결정 필요 (SmartSidePanel Connections 강화 vs FilterPanel picker)

---

## ✅ 2026-04-29 세션 완료

| 묶음 | PR | 상태 |
|------|-----|------|
| v0 협업 흡수 (라이트모드 contrast + Home View) | #220 | ✅ 머지 |
| 체크박스 통일 + chart 색 WCAG AA + dead code 14개 | #221 | ✅ 머지 |
| P0 필터 강화 (True orphan + Has backlinks + Wiki-registered) | #222 | ✅ 머지 |
| Row density dropdown 통합 (Notion 패턴) | #223 | ✅ 머지 |
| Row density 제거 (Linear 스타일 — revert) | #224 | ✅ 머지 |

Store version: v91 → v92 → v93

---

## 🚀 출시 모드 (여전히 결정 대기)

**사용자 의향**: Google Play Store + 마케팅 웹사이트 출시 (이전 세션부터 보류)

### 결정 대기
- [ ] 모바일 전략: PWA → TWA OK?
- [ ] 출시 전 부족분 우선순위 (온톨로지 / 캘린더 / 템플릿)
- [ ] 웹사이트 옵션 (별도 Next.js + Vercel?) + 도메인
- [ ] 타임라인 (1개월 / 3개월 / 자유?)

### 결정 후 작업 후보
1. [ ] 모바일 반응형 감사 — 깨지는 페이지 매핑
2. [ ] 노트 템플릿 시드 10~20개 (가장 ROI 높음)
3. [ ] PWA manifest + Service Worker
4. [ ] 온톨로지 메트릭 설명 툴팁 + 액션 nudge 강화
5. [ ] 캘린더 현황 점검 + 부족분 구현
6. [ ] 마케팅 사이트 셋업 (별도 워크트리)
7. [ ] Privacy Policy 초안
8. [ ] 스토어 자산 + Bubblewrap TWA 빌드

---

## 🟡 P2 — 미루는 작업

### 5 앱 리서치 결과 P2 (출시 후 검토)
- [ ] **AND/OR 중첩 필터 빌더** (L) — Linear 패턴. Plot 현재 사용자 규모(주로 본인)에 over-engineering 위험. Saved View 안정화 후 검토
- [ ] **뷰 타입 전환 Wiki Gallery** (L) — Notion/Capacities 패턴. 단 Notes Gallery 비추 (영구 규칙). **Wiki만 한정** 신중 검토
- [ ] **Time in status 표시** (M) — Linear 패턴. noteEvents 활용으로 단축 가능. "방치된 노트" 식별

### 기존 P2 (이전 세션부터)
- **노트 Split 검증** — `note-split-page.tsx` 만들어졌으나 실제 동작 검증 필요 (PR #218에서 신규 생성)
- **인포박스 base 티어 통합** — `WikiInfobox` → `InfoboxBlockNode` 단일화 (중장기)
- **Connections 상세** — 블록/코멘트 단위 어느 위치에서 링크되는지 (사용자가 7시간 작업으로 미룸 — 2026-04-25)
- **Red Link 선택 팝업 UX** — 클릭 → 노트/위키 분기 모달

---

## 🔵 P3 — 사이드패널 + 뷰 확장
- Connections 인라인 프리뷰 (Obsidian식)
- 동음이의어 해소 페이지
- 커맨드 팔레트 확장 (풀페이지 검색, 북마크 커맨드)

## 🟣 P4 — 지능 + 검색
- 풀페이지 검색 분리, 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화

---

## 🚫 폐기됨 (영구)

### 2026-04-29 폐기 (Row density 시도)
- **Notion식 Row density dropdown** — Compact/Standard/Comfortable segmented 시도(#223) 후 사용자 피드백으로 즉시 revert(#224). Linear 방식 (별도 토글 X) 채택. **시각적 다양성 ≠ Plot 코어** 영구 규칙 재확인.

### 2026-04-27 폐기
- **Wiki Y.Doc 적용** — WikiBlock 배열 구조라 Note Y.Doc 패턴 직접 적용 불가. 블록 단위라 race 표면적 작음
- **AI provider 연결** — CLAUDE.md "LLM 없이 규칙/통계/그래프" 정체성 위반

### 2026-04-22 폐기 (Hard reset to PR #194)
- Book Pivot 5 shell (#211-213) / Page Identity Tier (#209) / 메타→블록 통합 (#208) / 컬럼 시스템 (#198-#205) / WikiTemplate 8 built-in (#197)

→ 이후 PR #215~218에서 일부는 다른 형태로 재구현. 컬럼/Book Pivot은 영구 폐기.

### 5 앱 리서치 anti-pattern (영구 폐기 권장)
- 뷰 타입 대량 추가 (Notion 8가지 같은) — Plot은 지식 관계망 앱, 데이터베이스 앱 X
- AI/LLM 기반 스마트 필터 — Plot 영구 결정 위반
- 태그별 독립 정렬 — Bear 커뮤니티 미해결 요청. 인지 부하만 ↑
- 과도한 디스플레이 컬럼 (15+) — Linear 협업 도구 패턴, Plot에 dimensional 부족
- Manual ordering (드래그 수동 정렬) — 노트 수십~수백 개에서 유지 불가능

---

## 🧊 당분간 안 하는 것 (자기만족 리스크)

- **위키 시각적 다양화** — 추가 레이아웃 프리셋, 5 shell 등
- **나무위키 Top 7 나머지** — Hatnote / Ambox / 편집 히스토리
- **Wiki Y.Doc + 협업 모드** — 로컬 앱이라 우선순위 낮음
- **Notes Gallery 뷰** — 영구 규칙 위반 위험 (Wiki Gallery만 신중 검토)

---

## 📚 참조

- `docs/CONTEXT.md` — 현재 상태 + 설계 결정
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처
- `docs/SESSION-LOG.md` — 시간순 세션 기록
- `docs/NEXT-ACTION.md` — 다음 즉시 액션
- `docs/DESIGN-TOKENS.md` — 디자인 토큰
