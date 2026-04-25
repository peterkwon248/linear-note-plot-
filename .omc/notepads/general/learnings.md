# Technical Learnings

## 2026-03-16
- Store는 실제 16 슬라이스 (relations 슬라이스가 문서에서 누락되어 있었음)
- TemplatesView가 layout.tsx에 2번 마운트되는 복붙 버그 — mount-once 패턴에서 블록 복사 시 주의
- Implementation Order 2번(Thread)과 3번(읽기/편집 토글)이 이미 구현되어 있었음
  - Thread: thinking slice + ThreadPanel (components/editor/thread-panel.tsx)
  - 읽기/편집 토글: isReadMode state + Ctrl+Shift+E in note-editor.tsx
- search-dialog.tsx에 삭제된 기능으로 연결하는 dead 커맨드 팔레트 항목이 남아있었음
- dead code 검증 방법: Grep으로 import/참조 검색 → 자기 파일에서만 참조되면 dead

## 2026-03-19
- LayoutMode의 진짜 문제: workspace tree를 프리셋으로 덮어씀 (유저 커스텀 레이아웃 파괴). 해결: LayoutMode 삭제, tree가 유일한 진실
- Red link는 가상 상태(useMemo 계산 결과), stub는 실체(Note 객체). 자동 등재 시 red link가 소멸 (자기 조절)
- useMemo([notes]) 의존성: Zustand notes 배열 참조가 아무 노트 수정 시 바뀜 → useMemo 재계산. Web Worker 분리 또는 granular selector 필요
- Linear의 Search: 상단 유틸리티 바에 아이콘, 클릭하면 풀페이지 SearchView (모달 아님)
- wiki-view.tsx red link 계산: wikiTitleSet에 isWiki:true만 포함. 일반 노트가 존재해도 wiki 아니면 red link로 잡힘
- 자동 등재 시 기존 노트가 있으면 convertToWiki 사용해야 함 (createWikiStub로 새 Note 만들면 같은 제목 충돌)
- 초성 인덱스: `(charCode - 0xAC00) / 588 + 0x3131`로 한글 초성 추출. 성능 비용 거의 없음

## 2026-03-27 (Unified Pipeline)
- viewStateByContext에 새 ViewContextKey 추가 시, 기존 persist된 store에는 해당 키가 없음 → `?? buildViewStateForContext("key")` 방어 필수
- ToggleSwitch off 상태: `bg-border`는 다크모드에서 배경과 구분 안됨 → `bg-muted-foreground/40` 사용
- ToggleSwitch on knob: `bg-background`는 다크모드에서 검정 → `bg-white` 고정이 올바름
- Graph OntologyFilters → FilterRule[] 어댑터 패턴: 캔버스 내부는 OntologyFilters 유지하되 UI는 통합 FilterPanel 사용. 양방향 변환으로 브릿지
- Design Spine을 구조 통합에 녹이는 전략이 효과적: 파일 1번만 터치하면 시각적+구조적 일관성 동시 달성

## 2026-04-13 (Expand/Collapse All + TextBlock 개선)
- CSS 스펙: `overflow-y: auto` 설정 시 `overflow-x`가 `visible`이면 자동으로 `auto`로 변경됨 → 패딩 레이어와 스크롤 레이어를 분리해야 left:-28px 핸들이 잘리지 않음
- BlockDragOverlay는 `blocks.length > 1`일 때만 핸들 렌더링 — 블록 1개면 정상적으로 숨김
- Details extension `persist: true`면 `open` attr이 문서 JSON에 저장됨 → `tr.setNodeMarkup(pos, undefined, { open: value })`로 일괄 토글 가능
- InsertMenu/SlashCommand가 schema 체크 없이 메뉴 항목 표시 → TipTap extension이 특정 tier에 미등록이면 silent fail. TocBlockNode이 wiki tier에 없어서 Insert→TOC가 무반응이던 버그
- `useBlockResize` 훅은 TipTap NodeView 전용 (`updateAttributes` 필요) → 일반 React 컴포넌트(WikiTextEditor)에서는 인라인 mouseMove/mouseUp 패턴으로 직접 구현

## 2026-04-05 (호버 프리뷰 + Note/Wiki 링크)
- ProseMirror read-only 모드에서 React synthetic event(onClick/onMouseDown)가 에디터 DOM에서 parent로 bubble 안 됨 → native addEventListener 필요
- ProseMirror handleClick prop은 atom 노드(@mention)에 대해 잘 안 됨 → handleDOMEvents.mousedown이 더 확실
- 호버 프리뷰에서 generateHTML은 WikilinkDecoration 등 ProseMirror 플러그인 비포함 → TipTap read-only 에디터가 더 정확한 렌더링
- note.contentJson이 IDB에 null로 저장될 수 있음 (partialize + BodyProvider hydrate 순서). BodyProvider hydrate 후 Zustand에서 읽는 게 IDB 직접 읽기보다 안정적
- data-hover-preview 속성을 가드로 사용해서 프리뷰 안 ProseMirror 이벤트 (hover/click) 재귀 방지 패턴
- mouseup 리스너 등록(el)과 해제(document) 불일치 → 메모리 누수. cleanup에서 동일 대상 사용 필수

## 2026-04-14 — 기술 발견

**UniqueID extension 이미 준비됨**
- `shared-editor-config.ts:361` — top-level 23종 노드(heading/paragraph/table/image/list/etc.)에 영속 data-id 자동 부여
- 노트 split 구현의 인프라 완비 (WikiBlock[]과 동등한 ID 추적 가능)
- 노트 split 액션 = 약 50줄, UX는 WikiSplitPage 복사 + TipTap 조작으로 교체

**Next.js webpack dev vs Turbopack build 타입 검증 차이**
- dev server (webpack) pass → production build (turbopack) fail 가능
- 증거: `registry.ts:63` RemixiconComponentType 에러 — dev는 실행되는데 build는 실패
- 정기적으로 `npm run build` 돌려야 함

**WikiInfobox vs InfoboxBlockNode 2중 구현체**
- `components/editor/wiki-infobox.tsx` (WikiArticle.infobox용, float-right 사이드바)
- `components/editor/nodes/infobox-node.tsx` (TipTap 노드, 노트+위키 본문)
- 같은 UX지만 데이터 쉐입 다름. 중장기 통합 TODO (base 티어 단일화)
- 양쪽 동일 기능 추가할 때 코드 2번 복제 필요 (현재 현실)

**Skill 시스템 본질**
- `/after-work` 슬래시 커맨드 = expand된 프롬프트 전달
- Skill tool 재호출해도 같은 프롬프트 반복
- 실행 주체는 Claude. Skill = 프롬프트 템플릿 + command mapping 인프라


## 2026-04-25 — 코멘트 + 사이드패널 작업 학습

### Flex 자식 contents-driven 확장 (자주 발생)
**증상**: `flex-1` 자식이 contents 따라 부모 폭을 1400px+로 확장
**원인**: flex item 기본 `min-width: auto` — contents 사이즈 이하로 못 줄임
**해결**: 자식에 `min-w-0` 추가 → contents 무시하고 flex 분배만 따름
**주의**: popover/dropdown 안에서 toolbar overflow 잘림 = 거의 항상 이 원인

### Radix PopoverContent 기본 overflow
- 기본값: `overflow: visible` → 자식 내용이 popover 경계 밖으로 빠져나갈 수 있음
- 컴팩트 popover에서 자식 toolbar 등이 클립 안 됨
- **해결**: `className="overflow-hidden"` 명시

### 글로벌 scrollbar-color (전역 영향)
- `globals.css`에서 `*` 셀렉터로 `scrollbar-color: rgba(0,0,0,0)` 적용 중
- 어떤 곳에서든 스크롤바가 시각적으로 안 보임 (hover 시에만 흐릿하게)
- **명시적 색깔 필요한 경우**: 별도 CSS 클래스 + WebKit + Firefox 둘 다

### FixedToolbar 임베드 패턴
- `FixedToolbar`는 sticky bottom-0 + overflow-x-auto 자체 보유
- 좁은 컨테이너에 그대로 넣으면 자체 overflow가 외곽 스크롤을 무력화
- **해결**: `embedded` prop 추가 — 자체 sticky/overflow 비활성화 + `w-max` (contents 너비)
- 외곽 wrapper가 진짜 스크롤 컨테이너 역할

### Wiki Navbox 표준 (리서치)
- Wikipedia/나무위키 둘 다 100% **수동 큐레이션**
- 카테고리 자동 필터는 비표준 (Plot 기존 구현)
- 둘 다 지원하는 하이브리드가 정답

### TipTap "comment" tier vs "note" tier
- Comment는 짧은 메모 → "comment" tier (heading/codeBlock/horizontalRule 제외)
- Note/Wiki는 상세 작성 → "note" tier (모든 기능)
- 같은 컴포넌트가 다른 tier로 다른 UX 제공

### 섹션 번호 매기기 알고리즘
```ts
const counters: number[] = []
let lastDepth = -1
function next(depth: number): string {
  if (depth > lastDepth) while (counters.length <= depth) counters.push(0)
  else if (depth < lastDepth) counters.length = depth + 1
  counters[depth] = (counters[depth] || 0) + 1
  lastDepth = depth
  return counters.slice(0, depth + 1).join(".")
}
```
- 더 깊으면 새 카운터 시작
- 위로 올라오면 깊은 카운터 trim
- depth 0: "1"/"2", depth 1: "1.1"/"1.2", depth 2: "1.1.1"

### Comment popover 사이즈 시행착오
- 720 → 너무 큼
- 480 → 너무 작음
- **560** → 적정 (균형)
- 폭 결정만큼 중요한 것: contents가 넘치지 않게 `min-w-0` + `overflow-hidden` 처리

### 사용자 피드백 패턴 (이번 세션)
- "엉망진창" → 시각/구조 문제. 즉시 디버깅 모드
- "별로" → 디자인 quality 문제. 옵션 제시하고 결정 받기
- "롤백" → 직진하지 말고 한 단계 뒤로
- "F도 마음에 들고 G로 진화" → 점진적 향상이 best
