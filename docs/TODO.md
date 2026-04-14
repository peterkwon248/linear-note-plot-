# Plot — TODO (2026-04-14)

## ✅ 최근 완료 (2026-04-14)

- [x] **Tier 1 인포박스 전체 완료** 🎉 (PR #192, #194)
  - 대표 이미지+캡션, 헤더 색상 테마, 접기/펼치기, 섹션 구분 행, 필드 값 리치텍스트
  - PR #194: Default 레이아웃 인포박스 통합, 사이드바 Infobox 섹션 제거, 사이드바 클릭 버그 수정
- [x] **엔티티 철학 확정** — Note/Wiki 2-entity 영구 유지 (엔티티 통합 영구 폐기)
- [x] **위키 템플릿 통합 모델 재설계** — 3-layer 모델 폐기 → 컬럼+섹션배치=템플릿

## P2 — 컬럼 레이아웃 + WikiTemplate 시스템 (1순위)

**상세**: `docs/BRAINSTORM-2026-04-14-column-template-system.md`

- [ ] **Phase 0 — 문서 정비** (진행 중)
- [ ] **Phase 1 — 데이터 모델 + 기본 템플릿 8종**
  - ColumnStructure 타입, WikiTemplate 인터페이스
  - wikiTemplates slice + built-in 8종 (Blank/Encyclopedia/Person/Place/Concept/Work/Organization/Event)
  - WikiArticle.layout (string → ColumnStructure), titleStyle, columnAssignments, templateId
  - Store migration (기존 default/encyclopedia 자동 변환)
  - 새 위키 생성 시 템플릿 선택 다이얼로그
- [ ] **Phase 2 — 컬럼 렌더러 + titleStyle**
- [ ] **Phase 3 — 편집 UX** (컬럼 드래그, 추가/삭제, 중첩 3 depth, 블록 이동)
- [ ] **Phase 4 — 사용자 커스텀 템플릿 편집기**
- [ ] **Phase 5 — 나무위키 잔여 기능** (Hatnote, Ambox, Navbox, Callout 12타입, 섹션 icon/themeColor)
- [ ] **Phase 6 — 편집 히스토리 + 요약** (스냅샷 → diff → 롤백)
- [ ] **Phase 7 — 노트 split 기능** (WikiSplitPage 패턴 복사)

## P2 — 기타

- [ ] **Library FilterPanel Notes 수준** — view-engine 인프라 재사용
- [ ] **인사이트 중앙 허브** — 온톨로지 Single Source of Insights
- [ ] **Reference Usage 섹션** — 이미 부분 구현됨, 확장 여부 검토

## P3 — 사이드패널 + 뷰 확장

- [ ] **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식)
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드
- [ ] **노트 전체 접기/펼치기 버튼** — 복잡한 노트에서 일괄 제어

---

## 최근 PR

- PR #194: Tier 1 인포박스 전체 완료 + 위키 디자인 버그 수정
- PR #193: docs MEMORY.md에 PR #192/#191 추가
- PR #192: Y.Doc split-view sync PoC + Block Registry 단일화 + 인포박스 Tier 1-1/1-3
- PR #191: 나무위키 리서치 결과 + TODO 최신화 + 아키텍처 결정
- PR #190: Reference Usage + Note History + Wiki Activity 정리
