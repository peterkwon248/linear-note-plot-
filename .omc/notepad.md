# Session Notepad (Updated: 2026-05-10 14:40 마라톤)

## Critical Context

### 이번 세션 마라톤 — 33 파일 (+1289 / -187)
- **9 카테고리 작업**: /trash Books / Path B Step A / Dual mode i18n / ⌘⇧E pane-aware / DisplayPanel disabled / Smart Book PRD / Phase A 10 sub-steps / 책 reading flow / 책 reading polish 12 iteration steps
- **Smart Book Phase A 100% 완성** (Step 1 + 2.1-2.9 + Tweaks A/B/C)
- **책 reading flow 완성** (Step 2.10-2.21): Read button + read mode + Linear ←→ + TOC dropdown + 풀폭 default + wiki chrome
- **PRD `.omc/plans/smart-book-prd.md`** (656 line, 12 LOCKED, 2x critic 통과)

### 큰 영구 결정 (이번 세션)
- Plot 모토 = 풀페이지 default (max-w 제거, SmartSidePanel은 opt-in)
- Books reading = books route 유지 + BookDetailPage가 NoteEditor/WikiArticleView 직접 mount
- layout.tsx isViewRoute sub-route 포함 (`/books/*`, `/library/*`)
- Empty infobox 자동 hide (read 모드 + 비어있을 시)
- Smart Book INVARIANT: AutoSource는 공급원, BookItem kind는 note/wiki/chapter-heading만
- LOCKED #5c manual top/auto bottom, #10 v1.2 empty source skip, #12 dedup guard
- PRD §LOCKED #9 3-layer 일관 (시각/입력/UI)

### 기술 학습
- flex item `w-full flex-1` 필수 (BookWikiReader 81% 원인)
- Layout fallback double-mount 패턴 (sub-route 누락 시 50% stealing)
- Folder.noteIds 없음 (Note.folderIds reverse N:M)
- WikiArticle.categoryIds: string[] (DAG)
- Folder.kind 분리, hard-delete only
- HMR 한계 — dev 재시작 권유

### 환경 변경
- Store v121 (Smart Book: smartSources/excludeIds defaults)
- 신규 4 파일: smart-book-prd.md, resolver.ts, resolver.test.ts, sources-section.tsx
- Tests 246 → 255

## Active Tasks (다음 세션 P0)

- [ ] **Close 버튼 일관성** — 위키만 있는데 노트는 없음. 노트 추가 vs 그냥 없애기 (의논)
- [ ] **Books 뒤로가기 redesign** — 위키 sub-nav 패턴 (`← All / Articles / Stubs`) 적용 검토
- [ ] **Books 리스트 list mode 통일** — 그리드 외 옵션 검토
- [ ] **Edit 버튼 색상/폰트 통일** — book wiki vs 일반 wiki (text-xs vs text-note + px-2 vs px-2.5)

## Blockers
없음. 255/255 tests, tsc clean, build pass, architect 7회 통과.

## 다음 세션
- `/before-work` 첫 명령
- 추천 순서: Edit 버튼 통일 (10분) → Close 버튼 의논 → Books 뒤로가기 sub-nav (30분) → Books 리스트 mode (1-2h)
- 주의: HMR 못 잡으면 dev 재시작 권장
