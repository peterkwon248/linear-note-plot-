# Plot — TODO (2026-04-15)

## ✅ 최근 완료 (2026-04-15)

- [x] **Phase 1 — WikiTemplate 데이터 모델 + 8 built-in 템플릿 + picker UI** 🎉
  - ColumnStructure / WikiTemplate / TitleStyle / ThemeColor 타입
  - wikiTemplates slice (CRUD + built-in 가드)
  - 8 built-in 템플릿 (Blank/Encyclopedia/Person/Place/Concept/Work/Organization/Event)
  - WikiArticle optional 확장 (`columnLayout`/`columnAssignments`/`titleStyle`/`themeColor`/`templateId`)
  - Store migration v76 + seed factory 동기화
  - `createWikiArticle({ templateId? })` — 템플릿 → blocks/columnLayout/infobox 자동 채움
  - `WikiTemplatePickerDialog` (2칼럼 카드 그리드)
  - **setWikiInfobox 버그 수정** (entityType prop, 6 호출 지점 명시)
  - 검증: build 통과, 159 tests 통과, 브라우저 end-to-end 확인

## ✅ 이전 완료 (2026-04-14)
- [x] Tier 1 인포박스 전체 (PR #192, #194)
- [x] 엔티티 철학 확정 — Note/Wiki 2-entity 영구 유지
- [x] 위키 템플릿 통합 모델 재설계 — 3-layer 폐기 → 컬럼+섹션배치=템플릿

## P2 — 컬럼 레이아웃 + WikiTemplate 시스템 (계속)

**상세**: `docs/BRAINSTORM-2026-04-14-column-template-system.md`

- [x] **Phase 1 — 데이터 모델 + 기본 템플릿 8종** ✅ (2026-04-15)
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
