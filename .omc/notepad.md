# Session Notepad (Updated: 2026-05-11 21:00)

## Critical Context

### 이번 세션 — PR #303 (2 commit, 6 files, +412 -104)
1. **Pin 위치 이동** (1d8b30f): title 옆 → status chip 옆, 3 entity 통일 (Notes/Wiki/Books)
2. **Wiki UX 3 이슈** (42c6e59):
   - 우클릭 위치 fix (Popover anchor → Radix ContextMenu)
   - 플로팅 바 확장 (Pin/Move/Add to category 추가)
   - 갤러리 우클릭 fix (forwardRef + renderContextMenu render-prop)

### 영구 결정 (이번 세션)
- **Pin 위치 = status chip 옆** (3 entity 통일 LOCKED)
- **WikiArticleMenuItems DRY** (3 surface 공유)
- **Radix asChild + function component**: forwardRef + `{...rest}` 표준 패턴
- **GalleryView renderContextMenu API**: entity-agnostic + 카드 메뉴 entity-specific

### 기술 학습
- Radix ContextMenu = cursor anchor, Popover = trigger element anchor
- React fiber inspection (`__reactProps$xxx`) — dev tool 없이 props 디버깅
- `display: contents` wrapper로 grid layout 영향 없이 prop wrapping

## Active Tasks

- [ ] **PR #303 머지 대기** — 사용자 manual verify 후 squash merge
- [ ] **Wiki 그룹 헤더 아이콘** — Notes 패턴 그대로 적용 (~30분)
- [ ] **Books view-engine 회귀 점검** (P2)

## Blockers
없음.

## 다음 세션 시작 시
1. `/before-work`
2. PR #303 머지 여부 체크
3. 머지 → Wiki 그룹 헤더 아이콘 P1
4. 미머지 → 추가 요청/회귀 fix
