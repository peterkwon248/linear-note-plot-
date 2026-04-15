# Plot — TODO (2026-04-15 밤)

## ✅ 최근 완료 (2026-04-15, 하루에 9개 PR)

- [x] **Phase 2-2-B-3-a — 컬럼 추가/삭제 버튼** (PR #205, 2026-04-15 밤)
- [x] **Phase 2-2-B-2 — 블록 컬럼 간 드래그** (PR #204)
- [x] **Phase 2-2-B-1 — 컬럼 비율 드래그 + 메타 위치 UI** (PR #203)
- [x] **Phase 2-2-A — ColumnPresetToggle** (PR #202)
- [x] **Phase 2-1B-3 — Cleanup 1662줄 삭제** (PR #201)
- [x] **Phase 2-1B-2 — 편집 모드 흡수** (PR #200)
- [x] **Phase 2-1B-1 — WikiArticleRenderer (read-only)** (PR #199)
- [x] **Phase 2-1A — 컬럼 시스템 인프라** (PR #198)
- [x] **Phase 1 — WikiTemplate 데이터 모델 + 8 built-in 템플릿 + picker UI** (PR #197) 🎉

## ✅ 이전 완료 (2026-04-14)
- [x] Tier 1 인포박스 전체 (PR #192, #194)
- [x] 엔티티 철학 확정 — Note/Wiki 2-entity 영구 유지
- [x] 위키 템플릿 통합 모델 재설계 — 3-layer 폐기 → 컬럼+섹션배치=템플릿

## P2 — 컬럼 레이아웃 + WikiTemplate 시스템 (계속)

**상세**: `docs/BRAINSTORM-2026-04-14-column-template-system.md` (2026-04-15 밤 대결정 포함)

- [x] **Phase 1 — 데이터 모델 + 기본 템플릿 8종** ✅
- [x] **Phase 2-1A — 인프라 (ColumnRenderer + WikiTitle + ThemeProvider)** ✅
- [x] **Phase 2-1B — 렌더러 통합 + 편집 모드 흡수 + cleanup** ✅ (1~3 시리즈)
- [x] **Phase 2-2-A — ColumnPresetToggle** ✅
- [x] **Phase 2-2-B-1 — 컬럼 비율 드래그 + 메타 위치 UI** ✅ (2-2-C에서 메타 위치 UI 폐기 예정)
- [x] **Phase 2-2-B-2 — 블록 컬럼 간 드래그** ✅
- [x] **Phase 2-2-B-3-a — 컬럼 추가/삭제 버튼** ✅
- [ ] **Phase 2-2-B-3-b — 빈 컬럼 AddBlock + 중첩 컬럼 생성 UI** (다음)
- [ ] **Phase 2-2-C 신규 — 메타 → 블록 통합** (2026-04-15 밤 대결정, 큰 리팩토링)
  - WikiBlockType에 "infobox" / "toc" 추가
  - Migration v78: article.infobox/tocStyle → 블록으로 변환
  - ColumnMetaPositionMenu 폐기
  - WikiArticle scalar 메타 필드 삭제 (infobox, infoboxHeaderColor, infoboxColumnPath, tocStyle)
- [ ] **Phase 3 — 노션식 블록 분기 (편집 UX 고급)**
- [ ] **Phase 4 — 사용자 커스텀 템플릿 편집기**
- [ ] **Phase 5 — 나무위키 잔여 기능 (Hatnote/Navbox/Callout 전부 블록으로)**
- [ ] **Phase 6 — 편집 히스토리 + 요약**
- [ ] **Phase 7 — 노트 split 기능**
- [ ] **마지막: built-in 템플릿 풍성화** (Phase 5 완료 후, heroImage / 헤더 배너 / 섹션 icon / themeColor 다양화 등)

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

- PR #205: Phase 2-2-B-3-a — 컬럼 추가/삭제 버튼
- PR #204: Phase 2-2-B-2 — 블록 컬럼 간 드래그
- PR #203: Phase 2-2-B-1 — 컬럼 비율 드래그 + 메타 위치 UI
- PR #202: Phase 2-2-A — ColumnPresetToggle
- PR #201: Phase 2-1B-3 — Cleanup 1662줄 삭제 + layout rename + migration v77
- PR #200: Phase 2-1B-2 — 편집 모드 흡수 + 4곳 마이그레이션
- PR #199: Phase 2-1B-1 — WikiArticleRenderer (read-only)
- PR #198: Phase 2-1A — 컬럼 시스템 인프라
- PR #197: Phase 1 — WikiTemplate 시스템 + 8 built-in + picker UI
