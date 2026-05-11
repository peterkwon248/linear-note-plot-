# TODO

> 우선순위 기반 작업 목록. NEXT-ACTION.md는 즉시 액션, 이 파일은 전체 우선순위 큰그림.
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-12 (Books view-engine 4 PR 시리즈 종료)

---

## 🔴 P0 — 즉시 (다음 세션)

### Manual verify Books 4 viewMode + 회귀 fix ⭐ 추천
다음 세션 시작 시 진행. NEXT-ACTION.md 7 step 절차.

```
1. Grid mode 정상 (cover emoji + 카드, 우클릭 메뉴)
2. Search "Search books" → title/description 실시간 필터링
3. List mode → BookListRow chip (Kind/ItemCount/SourceKind/Pin/Time)
4. Filter popover 4 categories (Kind/SmartSource/Pin/Updated)
5. Pinned-first sort → reload 후 유지
6. viewState persist (viewMode/sort/filter)
7. Board mode → column drag + card drag (pinned toggle / kind confirm)
8. Gallery mode → entity-agnostic GalleryView (accent kind-based)
```

회귀 발견 시 즉시 fix → 추가 commit.

### (verify 통과 시) Wiki 그룹 헤더 아이콘 (~30분)
- WikiList/WikiBoard 미적용 (Notes Table/Board/Gallery는 5-11에서 통일됨, Books는 5-12)
- 자투리 시간 정리 후보

---

## 🟡 P1 — 큰 작업 후보

### Smart Book v2 — AutoSource picker UX 강화
- folder/category/tag/label/sticker source picker 풀 도입
- chapter 정렬 (Manual drag default + Auto-sort)
- Hull + Sequence edge 시각화

### Wiki view-engine board 도입
- Plot 일관성 (Notes/Books와 동일 viewMode 토글)
- WikiList → WikiBoard 라우트 통합

### Notes/Wiki/Books 통합 entity-agnostic ListRow/BoardCard 패턴
- Books의 BookListRow + BookGridCard 패턴 일반화
- generic 추출 없이도 reuse 패턴 (`renderListRow` prop) 도입

### Note UI toolbar (UpNote-style)
- 미루기 — 별도 큰 작업

### House (계보 시각화)
- 미루기 — 토론 필요

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
- ✅ Studio/Editorial view modes 제거 완료 (Store v119, 2026-05-09)
### Dual mode — 폐기 (2026-05-11)
- Split view + list mode + editor pane으로 충분. v122 migration으로 자동 fix.
### AI provider 연결 — 정체성 위반 (2026-04-27)
### Notion식 Row density toggle — Linear 코어 (PR #224 revert)
### Page entity 신규 — atomic 위배 (2026-05-03)
### Generic `useEntityView<T>` hook 추출 — 영구 거부 (scope 폭발)

---

## ✅ 최근 완료

### 2026-05-12 (마라톤) — Books view-engine 풀 통합 4 viewMode (Store v122 → v126)
- ✅ **PR 1 (v123)**: 인프라 + grid 보존. useBooksView thin fork. 시각 변경 0
- ✅ **PR 2 (v124)**: list mode + sort/group/filter UI + 3 chip (BookItemCount/BookKind/BookSourceKind mini-bar). ViewHeader Search/Filter/Display 활성화. pinned-first sort
- ✅ **PR 3 (v125)**: board mode Option A (column drag + card drag, dnd-kit). groupBy kind/pinned. card drag UX: pinned 즉시 toggle / kind smart→manual confirm / manual→smart toast hint
- ✅ **PR 4 (v126)**: gallery mode (entity-agnostic adapter). 2026-05-11 GalleryView 재사용. kind-based accent color
- ✅ launch.json `npx next` 전환 (한글 경로 안전성)
- ✅ Plan `.omc/plans/books-view-engine-integration.md` 작성

### 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic (PR #291)

### 2026-05-10 (마라톤) — Smart Book Phase A + 책 reading flow (PR #290)

### 2026-05-09 (마라톤) — Book entity + Dual mode + Filter Path A 완전 종결 (PR #289)

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
