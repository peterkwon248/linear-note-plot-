# TODO

> 우선순위 기반 작업 목록. NEXT-ACTION.md는 즉시 액션, 이 파일은 전체 우선순위 큰그림.
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-07 (Phase A 작업 후)

---

## 🔴 P0 — 즉시 (다음 세션)

### 0. PR #269 머지 (Phase A NoteStatus rename)
- 사용자가 직접 squash merge — https://github.com/peterkwon248/linear-note-plot-/pull/269
- 머지 후 IDB v115→v116 자동 migration (idempotent) — 첫 실행 시 1회

### 1. Brand mark fix (작은 follow-up PR)
- PR 3.4의 네트워크 SVG → mockup 패턴 (`<div className="a-brand__mark">P</div>`) 복귀
- 일단 하드코드 `"P"` (workspace name 설정 필드는 별도 작업)
- `components/activity-bar.tsx` line 88-112 교체
- ~3 files / 작은 diff

### 2. Status icons stone/brick/keystone metaphor 적용
- 현재 `StatusShapeIcon` = 일반 phosphor (CircleDashed/CircleHalf/CheckCircle)
- 새 컨셉: 돌멩이 윤곽 (불규칙 다각형) / 둥근 직사각형 + mortar line / 사다리꼴 (wider top, 키스톤)
- 색은 그대로 (Q3 LOCKED — `--status-stone/brick/keystone`)
- `components/status-icon.tsx` + `components/icons/imperial-extras.tsx`
- 시안 보고 조정 — 작업 시 design mockup HTML 또는 Preview에서 확인

### 3. Phase 4 재개
- PR 4.2 notes-table.tsx reskin (stone/brick/keystone 새 명칭 사용)
- PR 4.3 other list views

### 4. Phase B (Inbox 알림함) — ⏸️ DRAFT 미확정
- `.omc/plans/inbox-layer.md` = Draft. 사용자 결정 필요
- "Inbox 단어를 알림함 의미로 부여 + 기능 구현" 미확정
- 나중에 새 layer로 추가 가능 (Phase A에서 `/inbox` redirect 제거 후 신규 page 생성 필요)

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
- FilesView type filter (all/image/document) → viewState.filters lift (PR 5 follow-up)
- File grid mode 실제 image preview (blob URL 처리, PR 5 follow-up)

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
### AI provider 연결 — 정체성 위반 (2026-04-27)
### Notion식 Row density toggle — Linear 코어 (PR #224 revert)
### Page entity 신규 — atomic 위배 (2026-05-03)

---

## ✅ 최근 완료

### 2026-05-07 (밤 늦게) — Plot v3 Phase 3 (4 PR)
- ✅ PR 3.1 (98f9277): CSS 통합 — `.a-actbar` / `.a-sidebar` / `.a-sb-*` / `.a-icb` / `.a-kbd` / `.a-detail` / `.a-shell` (시각 변경 0)
- ✅ PR 3.2 (5ac22ef): activity-bar.tsx reskin (width 72px / label / brand mark / per-space 6색 inline)
- ✅ PR 3.3 (8155530): linear-sidebar.tsx reskin (NavLink + Section + 11 inline 일괄)
- ✅ PR 3.4 (3761e42): brand mark = Plot 로고 SVG (네트워크 그래프 — Zettelkasten × Palantir 정체성 정합)

### 2026-05-07 (밤) — Group C PR-D 시리즈 5/5 완성
- ✅ PR 1: Tags v110 (#261)
- ✅ PR 2: Labels v111 (#262)
- ✅ PR 3: Stickers v113 (a055581)
- ✅ PR 4: References v114 (c3700ad)
- ✅ PR 5: Files v115 (f210fcf)

### Plot v3 Phase 2 DEFER 결정 (3b84d7e)

### 4 design skills install (0f7e2ec)
- design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
