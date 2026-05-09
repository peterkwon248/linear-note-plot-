# Session Notepad (Updated: 2026-05-09 마라톤)

## Critical Context

### 오늘 마라톤 — ~45 변경 + 2 PRD + Plugin install 🎉🎉🎉
- **Polish 시리즈**: status icon Cuboid2x2 통일, chip 24%, ViewSwitcher 제거, 사이드바 active 색상, header status 아이콘 (Stone/Brick/Block + Wiki stub/article), Inbox B1+B2+B3, Home sidebar 보강, PanelsMenu 미니어처
- **Filter Path A 완전 종결**: Files / References / Wiki Category / Tags / Inbox / Stickers (6 entity)
- **Studio + Editorial 제거** + migration v119 (영구 규칙 #1 cleanup)
- **Book entity 도입** (PRD + Critic + Phase 1-4): data infra v120 + ActivityBar 7th burgundy + Manual view + In-book navigation
- **Dual mode 도입** (PRD + Critic + Phase 1-3+5+6): "Split" → "Dual" rename, 5-pane mail-client 패턴, ⌘⇧E 단축키
- **plot-frontend plugin** 글로벌 등록 (~/.claude/settings.json)

### 큰 영구 결정 (이번 세션)
- Books 색상 = Burgundy `#be123c` (rose-700)
- Book = cross-entity ordered sequence + heading-as-divider 단일 모델
- Dual mode 이름 (Split → Dual rename, NoteSplitOverlay 충돌 회피)
- Books = ActivityBar Wiki 아래
- Filter coverage Path A 완성 (6 entity)
- 사이드바 active icon = 공간별 색상 (data-active-space)

### 기술 학습 (이번 세션)
- fractional-indexing 패턴 (sparse integer 대신)
- VALID_VIEW_MODES runtime validator 누락 함정 (TS union만으론 부족)
- ResizablePanelGroup autoSaveId pattern (controlled X)
- SSR-safe hook (mounted guard + transition-only toast)
- Critic agent 가치 (PRD 신선할 때 review)

### 환경 변경
- Store v120 (Books migration)
- npm: fractional-indexing@^3.2.0
- Plugin global: plot-frontend@plot-frontend

## Active Tasks (다음 세션)

- [ ] Smart Book (Phase 5) — AutoSource resolver, 별도 PRD (~4-5h)
- [ ] /trash 페이지 books section 통합 (~1h)
- [ ] Path B Step A — globals.css `.a-th/.a-row` 6-col grid hardcoded refactor (~1.5h)
- [ ] 나무위키 인포박스 고도화 Tier 1 (~3-4h)
- [ ] 다중 기기 sync Phase 1 (PRD LOCKED, 몇 세션)

## Blockers

- 없음. 모든 작업 tsc/build clean, 221/221 tests pass.

## 다음 세션

- `/before-work` 첫 명령
- plot-frontend plugin 자동 활성 검증 (skill matching 정확도 관찰)
- 추천 다음 작업: Smart Book PRD or /trash 통합 or Path B refactor
