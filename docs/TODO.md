# TODO

> 우선순위 기반 작업 목록. NEXT-ACTION.md는 즉시 액션, 이 파일은 전체 우선순위 큰그림.
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-12 (밤) — Priority 영구 폐기 + UI 선명화 + Books polish + Wiki 그룹 헤더

---

## 🔴 P0 — 즉시 (다음 세션)

### PR #304 visual 검증 + squash merge ⭐
NEXT-ACTION.md 참조. 회귀 없으면 squash merge to main.

---

## 🟡 P1 — 가까운 미래

### Imperial Design System 사용 검증 (별개 프로젝트)
- 새 Claude Code 세션 (빈 폴더)에서 `/plugin install github.com/peterkwon248/imperial-design-system`
- 5 슬래시 커맨드 등록 확인 (new-mockup/new-landing/new-graphic/handoff/design-review)
- 동작 안 하면 Local install (`~/.claude/plugins/imperial-design-system/`)로 fallback

### docs/PLOT-CURRENT-STATE-FOR-2.0.md priority 제거
Note 타입 정의 + SortField/GroupBy union + CSS 토큰에서 priority 제거. PRD 정확성 보장.

### Wiki 우클릭 메뉴 + 플로팅 바 Pin 추가 follow-up
PR #303 close됐지만 어제 Wiki 우클릭 메뉴/플로팅바 작업 일부 이미 main에 적용됐을 가능성 (PR #300/#301 commit). 확인 후 빈 부분 추가.

---

## 🟢 P2 — 추후

### Books view-engine 10 PR 시리즈 회귀 점검
4 viewMode (grid/list/board/gallery) manual verify. Filter Kind values icon 노출, BookKindChip 색, BookFloatingBar, Save view 버튼 등.

### 나무위키 리서치 기능 도입
- Tier 1 인포박스 고도화: 대표 이미지+캡션, 헤더 색상 테마, 접기/펼치기, 섹션 구분 행
- Tier 2 새 블록: 배너 블록, 둘러보기 틀 (Navigation Box)
- Tier 3 매크로: 나이 계산, D-Day, Include
- 아키텍처: 모든 새 기능 = base 티어 (노트+위키 공용)
- 인사이트 허브: 온톨로지 Single Source of Insights

---

## 🔵 보류 (Deferred)

### Plot 사이드바 inline edit mode
- DotsSix 핸들 + slide-right transition
- 섹션 단위 재배열
- 👁 hide/show 토글
- sidebarCustomization.byContext

### Quicklinks 위치 통일
- Home 사이드바 prominent 섹션
- 각 영역 사이드바 하단 collapsed
- 키보드 shortcut (⌘K 또는 ⌘1~9)

---

## ✅ 최근 완료 (참고용, 다음 세션 시작 시 삭제)

- ~~Priority 전면 폐기~~ (2026-05-12 밤, PR #304 - 247 tests pass, Store v130)
- ~~SourceIcon 완전 제거~~ (2026-05-12 밤, PR #304)
- ~~그룹 헤더 디자인 통일~~ (2026-05-12 밤, PR #304)
- ~~컬럼 헤더 + toolbar 아이콘 선명화~~ (2026-05-12 밤, PR #304)
- ~~Books Pin 위치 (Notes 패턴) + index 컬럼~~ (2026-05-12 밤, PR #304)
- ~~Books Pin 컬럼 + DisplayProperties 토글 제거~~ (2026-05-12 밤, PR #304)
- ~~Wiki list/board 그룹 헤더 아이콘 추가~~ (2026-05-12 밤, PR #304)
- ~~Imperial Design System v0.3.0 publish~~ (2026-05-12 밤, 별개 repo)
- ~~PR #303 close~~ (Pin status chip 옆 이동 결정 폐기)

---

## 🧠 영구 결정 인덱스

상세는 docs/MEMORY.md / docs/CONTEXT.md / `.omc/notepads/general/decisions.md` 참조.

- **Priority 영구 폐기** (2026-05-12)
- **Pin = identity, not meta toggle** (Linear 패턴, 2026-05-12)
- **SourceIcon 폐기** (visual noise, 2026-05-12)
- **그룹 헤더 = Linear list-grouped 스타일** (2026-05-12)
- **emoji 영구 폐기** (Phosphor outline only, 2026-05-12)
- **Pin 통일 모든 entity** (Name 옆 inline, 2026-05-12)
- **Books 자체 정체성 = kind 유지** (status 도입 X, 2026-05-12)
- **Dual mode 영구 폐기** (Split view + list로 충분, 2026-05-11)
- **갤러리 = entity-agnostic** (2026-05-11)
- **Note/Wiki 2-entity 영구 분리** (2026-04-14)
- **"Gentle by default, powerful when needed"** (Plot 모토)
- **LLM/API 미사용** (규칙 기반 + 통계 + 그래프 알고리즘)
