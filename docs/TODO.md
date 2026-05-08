# TODO

> 우선순위 기반 작업 목록. NEXT-ACTION.md는 즉시 액션, 이 파일은 전체 우선순위 큰그림.
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-08 (5 PR 머지 + Phase 4.3 plan 보강 후)

---

## 🔴 P0 — 즉시 (다음 세션)

### Path A — Filter coverage Section 11 (작은 PR 시리즈) ⭐ 추천
plan: `.omc/plans/v3-phase-4-3-decompose.md` Section 11

```
Step 1: Files type filter (image/url/file) ← 가장 작고 명확. 즉시 visual 효과
Step 2: References type filter (book/article/url/quote)
Step 3: Wiki Category filter 보강 (사용자 직접 우려 — 부실)
Step 4: Tags / Labels color filter (선택)
Step 5: Stickers / Inbox source filter (선택)
```

각 Step = view-engine config 변경만 (showFilter true + filterCategories 채움). chrome refactor와 독립 — 병렬 PR 가능.

### Path B — Chrome refactor Section 10 (큰 작업, 시각 일관성 prerequisite)
plan: `.omc/plans/v3-phase-4-3-decompose.md` Section 10

```
Step A: globals.css `.a-th, .a-row` grid 분리 (chrome-only로) ← 모든 view chrome 통일의 prerequisite
Step B: Tags/Labels chrome 재적용 (#282 retry — 폰트/height 자동 통일)
Step C: column model 확장 (displayProperties)
Step D: 다른 view (wiki / library / templates / stickers)
```

### Path C — Studio + Editorial 제거 (영구 규칙 위반 cleanup)

- Studio + Editorial shell 삭제 (`components/views/studio-view*.tsx`, `editorial-view*.tsx`)
- ViewSwitcher tab 정리 (4-tab → 2-tab Table/Board)
- viewMode type 축소 (`"list" | "board" | "gallery"`)
- IDB migration (옛 `"studio" | "editorial"` 값 → `"list"` fallback)
- SRS 기능 살아있으면 별도 path 보존 (Studio 외)

근거: 메모리 영구 규칙 #1 + TODO 폐기 항목 ("매거진 pivot 폐기 2026-04-22") 위반

### Path D — Gallery polishing (별도 sprint)

- 편집 가능하게 (NotesGallery 신규 또는 NotesTable grid mode 통합)
- Plot tokens 정합 (cream 강제 제거 → light/dark 반응)
- Display popover 통합 (`[List | Board | Gallery]` 3-segment)
- ViewSwitcher 제거

---

## 🟡 P1 — 큰 작업 후보

### Wiki template 3-layer
- Layout Preset + Content Template + Typed Infobox
- Wiki domain. v3 Phase 3+와 독립

### Smart Book v2 — AutoSource[5]
- folder / category / tag / label / sticker 자동 source
- Book entity 신규 (v3 7번째 space, rose 팔레트 #fb7185 dark / #e11d48 light)
- chapter 정렬 (Manual drag default + Auto-sort)
- Hull + Sequence edge 시각화 + Reading view

### Note UI toolbar (UpNote-style)
- 미루기 — 별도 큰 작업

### House (계보 시각화)
- 미루기 — 토론 필요

---

## 🟣 P2 — 작은 후속 정리

- Templates grid chip 시스템 완전 통일 (PR e deviation)
- 키보드 shortcut (D/T/P 등) 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)
- Tag 우클릭 메뉴 Rename 옵션 추가
- Label 색 정책 재검토 (Tag opt-in 가능성)
- ReferencesView quickFilter / fieldKey filter → viewState.filters lift (PR 4 follow-up)
- FilesView type filter (all/image/document) → viewState.filters lift (PR 5 follow-up — Path A Step 1과 정합)
- File grid mode 실제 image preview (blob URL 처리, PR 5 follow-up)
- `docs/status-icons-preview.html` 등 mockup HTML untracked 파일 정리 (.gitignore 또는 삭제)

---

## ⏸️ 보류 / 영구 폐기

### Plot v3 Phase 2 (Imperial icon kit) — DEFERRED
- 119 files codemod scope 비대 + 시각 위화감 미미
- partial work (activity-bar 등) 그대로 보존
- 재개 조건: 정확한 인벤토리 + 매핑 coverage 검증 + 단일 책임 PR 분할

### onlook (visual code editor) — 적용 X
- production app 자동 코드 변경 회귀 위험
- greenfield/marketing 사이트에 적합

### Front-End-Design-Checklist — 적용 X
- design-quality-gate + linear-design-mirror + 4 design skills과 중복
- handoff 가이드 (디자이너↔개발자), 1인 dev audience 불일치

### Plot 2.0 브랜딩 — v3 visual refresh로 리브랜드
- 11가지 결정은 v3 PRD에 통합 보존

### 매거진/뉴스페이퍼/북 Pivot — 폐기 (2026-04-22)
- ⚠️ Studio/Editorial view modes (PR #279/#280)가 이 폐기 항목 부활 — Path C로 cleanup 예정
### AI provider 연결 — 정체성 위반 (2026-04-27)
### Notion식 Row density toggle — Linear 코어 (PR #224 revert)
### Page entity 신규 — atomic 위배 (2026-05-03)

---

## ✅ 최근 완료

### 2026-05-08 (오후) — Status icons + Phase 4.3 plan 보강 (5 PR + docs sync)
- ✅ **PR #271**: Status icons + UI 라벨 "Block" + Cuboid (1×2 isometric block) + Save view 16px (HBtn pattern)
- ✅ **PR #282**: PR 4.3a Tags+Labels chrome 통일 시도
- ✅ **PR #283**: PR #282 partial revert (`.a-row` grid 6-col 강제 충돌)
- ✅ **PR #284**: Tags row border-b 제거 + plan Section 9-10 (lessons + roadmap)
- ✅ **PR #285**: plan Section 11 Filter coverage 분석 (Step 1-5)
- ✅ **(이 PR)** docs sync — NEXT-ACTION / SESSION-LOG / MEMORY / TODO / CONTEXT

### 2026-05-07 (밤 늦게) — Plot v3 Phase 3 (4 PR)
- ✅ PR 3.1 (98f9277): CSS 통합 — `.a-actbar` / `.a-sidebar` / `.a-sb-*` (시각 변경 0)
- ✅ PR 3.2 (5ac22ef): activity-bar.tsx reskin (width 72px / label / brand mark / per-space 6색 inline)
- ✅ PR 3.3 (8155530): linear-sidebar.tsx reskin
- ✅ PR 3.4 (3761e42): brand mark = Plot 로고 SVG (네트워크 그래프) → 후 PR #270으로 mockup 패턴 P glyph 복귀

### 2026-05-07 (밤) — Group C PR-D 시리즈 5/5 완성
- ✅ Tags v110 / Labels v111 / Stickers v113 / References v114 / Files v115

### Plot v3 Phase 2 DEFER 결정 (3b84d7e)
### 4 design skills install (0f7e2ec)
