# PLOT-DESIGN-POLISH-FINAL.md
# Claude Code 실행 가이드 — Linear 수준 디자인 폴리시

> 이 문서는 Claude Code가 Plot의 디자인 품질을 Linear 프로덕션 수준으로 올리기 위한 **실행 지침서**입니다.
> 5개 Phase를 순서대로 실행하세요. 각 Phase는 독립적으로 커밋 가능합니다.
> 모든 변경은 `design-quality-gate` 스킬과 `docs/DESIGN-TOKENS.md`를 준수해야 합니다.

---

## 참조 데이터: Linear 프로덕션 CSS (2026-03-24 추출)

Linear 웹앱 빌드 CSS 번들에서 직접 추출한 실제 값.

### Linear 배경 elevation (Dark)
```
level-0: #08090a   (앱 배경 — 거의 순수 검정)
level-1: #0f1011   (사이드바/패널)
level-2: #141516   (콘텐츠 영역)
level-3: #191a1b   (카드)
secondary: #1c1c1f
tertiary: #232326
```

### Linear 텍스트 (Dark)
```
primary:    #f7f8f8  (≈opacity 0.97)
secondary:  #d0d6e0  (≈opacity 0.82)
tertiary:   #8a8f98  (≈opacity 0.55)
quaternary: #86848d  (≈opacity 0.53)
```

### Linear 보더 (Dark)
```
primary:     rgba(255,255,255, 0.08)
secondary:   rgba(255,255,255, 0.12)
tertiary:    rgba(255,255,255, 0.15)
translucent: rgba(255,255,255, 0.05)
```

### Linear 트랜지션 빈도
```
160ms — 17회 (최다, 기본)
200ms — 11회
120ms — 6회
150ms — 4회
```

### Linear 폰트
```
패밀리: Inter Variable (UI), Berkeley Mono (코드)
기본 본문: 14px (최다 사용)
보조: 13px
작은 텍스트: 12px
```

### Linear 라디우스
```
4 / 6 / 8 / 12 / 16 / 24 / 32 / 9999px
```

### Linear 버튼 높이
```
24 / 32 / 40 / 48px (4단계)
```

---

## Phase 1: ViewHeader + DisplayPanel 폴리시

**대상 파일:**
- `components/view-header.tsx` (356줄)
- `components/display-panel.tsx` (480줄)

### 1.1 view-header.tsx

**현재 문제:**
- 3개 인라인 SVG 아이콘 (FilterIcon, DisplayIcon, PanelRightIcon) — strokeWidth 1.2-1.3
- Lucide import: `Search, X, FileText, Pin`
- 인라인 SVG가 `const`로 모듈 스코프에 정의

**액션:**
```
1. @phosphor-icons/react 설치 확인 (npm ls @phosphor-icons/react)
   미설치 시: npm install @phosphor-icons/react

2. 인라인 SVG 3개 → Phosphor로 교체:
   FilterIcon → import { FunnelSimple } from "@phosphor-icons/react/dist/ssr/FunnelSimple"
   DisplayIcon → import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal"
   PanelRightIcon → import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
   
   사용: <FunnelSimple size={15} weight="regular" />
   (strokeWidth prop 제거 — Phosphor는 weight 사용)

3. Lucide 4개 → Phosphor로 교체:
   Search → MagnifyingGlass
   X → X (Phosphor에도 X 있음)
   FileText → FileText
   Pin → PushPin

4. HBtn 컴포넌트의 rounded-[6px] → rounded-md (토큰 기반)

5. 삭제: FilterIcon, DisplayIcon, PanelRightIcon const 정의 전체
```

### 1.2 display-panel.tsx

**현재 문제:**
- `style={{ background: on ? "#5e6ad2" : "rgba(255,255,255,0.12)" }}` (hardcoded hex + 인라인)

**액션:**
```
1. hardcoded hex → CSS 변수:
   "#5e6ad2" → bg-accent (토글 on)
   "rgba(255,255,255,0.12)" → bg-border-secondary 또는 bg-white/[0.12]
   
   교체: style={{...}} → className={cn(on ? "bg-accent" : "bg-white/[0.12]")}

2. Lucide import 확인 후 Phosphor로 교체
```

### 커밋 메시지
```
design: polish ViewHeader + DisplayPanel — Phosphor migration, token compliance
```

---

## Phase 2: 아이콘 시스템 정리

**목표:** Lucide 57파일 → Phosphor 전환 시작 (최소 상위 15파일)

### 2.1 설치 확인
```bash
npm install @phosphor-icons/react
```

### 2.2 전환 우선순위 (사용자에게 보이는 빈도순)

| 순서 | 파일 | Lucide 수 | 이유 |
|------|------|----------|------|
| 1 | view-header.tsx | 8 | Phase 1에서 완료 |
| 2 | linear-sidebar.tsx | — | ChevronDown/Right만 (plot-icons가 나머지) |
| 3 | floating-action-bar.tsx | 15 | 벌크 선택 시 항상 보임 |
| 4 | note-editor.tsx | — | 에디터 진입 시 |
| 5 | search-dialog.tsx | — | ⌘K 열 때 |
| 6 | editor/EditorToolbar.tsx | — | 에디터 항상 보임 |
| 7 | editor/FixedToolbar.tsx | — | 에디터 항상 보임 |
| 8 | note-detail-panel.tsx | — | 사이드 패널 |
| 9 | editor/SlashCommand.tsx | — | / 입력 시 |
| 10 | editor/ImageNode.tsx | — | 이미지 삽입 시 |

### 2.3 공통 매핑 테이블

| Lucide | Phosphor | weight | import |
|--------|----------|--------|--------|
| `ChevronDown` | `CaretDown` | regular | `@phosphor-icons/react/dist/ssr/CaretDown` |
| `ChevronRight` | `CaretRight` | regular | `.../CaretRight` |
| `ChevronLeft` | `CaretLeft` | regular | `.../CaretLeft` |
| `Search` | `MagnifyingGlass` | regular | `.../MagnifyingGlass` |
| `X` | `X` | regular | `.../X` |
| `Plus` | `Plus` | regular | `.../Plus` |
| `Trash2` | `Trash` | regular | `.../Trash` |
| `MoreHorizontal` | `DotsThree` | bold | `.../DotsThree` |
| `MoreVertical` | `DotsThreeVertical` | bold | `.../DotsThreeVertical` |
| `Copy` | `Copy` | regular | `.../Copy` |
| `Scissors` | `Scissors` | regular | `.../Scissors` |
| `Download` | `DownloadSimple` | regular | `.../DownloadSimple` |
| `FileText` | `FileText` | regular | `.../FileText` |
| `Pin` | `PushPin` | regular | `.../PushPin` |
| `Edit2` / `Pencil` | `PencilSimple` | regular | `.../PencilSimple` |
| `ArrowLeft` | `ArrowLeft` | regular | `.../ArrowLeft` |
| `ArrowRight` | `ArrowRight` | regular | `.../ArrowRight` |
| `Eye` | `Eye` | regular | `.../Eye` |
| `EyeOff` | `EyeSlash` | regular | `.../EyeSlash` |
| `Star` | `Star` | regular | `.../Star` |
| `Settings` / `Gear` | `GearSix` | regular | `.../GearSix` |
| `Calendar` | `CalendarBlank` | regular | `.../CalendarBlank` |
| `Tag` | `Tag` | regular | `.../Tag` |
| `Folder` | `FolderSimple` | regular | `.../FolderSimple` |
| `Link` | `Link` | regular | `.../Link` |
| `ExternalLink` | `ArrowSquareOut` | regular | `.../ArrowSquareOut` |
| `Filter` | `FunnelSimple` | regular | `.../FunnelSimple` |
| `SortAsc` | `SortAscending` | regular | `.../SortAscending` |
| `Check` | `Check` | bold | `.../Check` |
| `AlertCircle` | `WarningCircle` | regular | `.../WarningCircle` |
| `Info` | `Info` | regular | `.../Info` |
| `Archive` | `Archive` | regular | `.../Archive` |
| `PanelRight` | `SidebarSimple` | regular | `.../SidebarSimple` |
| `AlignLeft` | `TextAlignLeft` | regular | `.../TextAlignLeft` |
| `AlignCenter` | `TextAlignCenter` | regular | `.../TextAlignCenter` |
| `AlignRight` | `TextAlignRight` | regular | `.../TextAlignRight` |

### 2.4 Import 규칙 (필수)

```tsx
// ✅ 올바름 (tree-shaking)
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"

// ❌ 금지 (전체 번들 포함)
import { MagnifyingGlass } from "@phosphor-icons/react"
```

### 2.5 Weight 규칙 (DESIGN-TOKENS.md 준수)

| 컨텍스트 | Weight |
|---------|--------|
| 사이드바 inactive | `light` |
| 사이드바 hover | `regular` |
| 사이드바 active | `bold` |
| 에디터 툴바 | `regular` |
| ViewHeader 아이콘 | `regular` |
| 빈 상태 일러스트 | `thin` |
| 체크마크, 점 3개 | `bold` |

### 2.6 strokeWidth prop 처리

```tsx
// ❌ Phosphor에서는 strokeWidth 사용하지 않음
<MagnifyingGlass strokeWidth={1.5} />

// ✅ weight prop 사용
<MagnifyingGlass weight="regular" />
```

기존 `strokeWidth={1.5}` prop은 모두 제거. Phosphor는 weight로 굵기를 제어한다.

---

## Phase 3: Hardcoded hex 제거

### 3.1 중앙화 대상

여러 파일에서 반복되는 색상 배열을 `lib/colors.ts`에 중앙화:

```ts
// lib/colors.ts에 추가
export const PRESET_COLORS = [
  "var(--accent)",       // #5e6ad2 / #6366f1
  "var(--chart-2)",      // #26b5ce / #22d3ee
  "var(--chart-3)",      // #f2994a / #f97316
  "var(--destructive)",  // #e5484d / #ef4444
  "var(--chart-5)",      // #45d483 / #22c55e
  "var(--wiki-complete)", // #7c3aed / #8b5cf6
  "var(--chart-4)",      // (pink) ec4899
  "var(--priority-medium)", // #d97706 / #f59e0b
] as const
```

### 3.2 파일별 교체 목록

| 파일 | 현재 | 교체 |
|------|------|------|
| `create-dialog.tsx` | 8개 hex 배열 | `PRESET_COLORS` import |
| `note-fields.tsx` | 10개 hex 배열 | `PRESET_COLORS` import |
| `templates-view.tsx` | 8개 hex 배열 + 기본 `#5e6ad2` | `PRESET_COLORS` + `PRESET_COLORS[0]` |
| `linear-sidebar.tsx:373` | `"#5e6ad2"` | `PRESET_COLORS[0]` |
| `tags-view.tsx:210` | `"#888888"` | `"var(--muted-foreground)"` |
| `display-panel.tsx:114` | `"#5e6ad2"` | `bg-accent` (Tailwind) |
| `notes-board.tsx:217-220` | 4개 hex | CSS 변수 매핑 |
| `calendar-view.tsx:134` | `"#6b7280"` | `var(--muted-foreground)` |
| `graph-insights-view.tsx:177,226` | `text-[#f5a623]` | `text-chart-3` |
| `ontology-graph-canvas.tsx:143` | `ACCENT_COLOR = "#5e6ad2"` | `getComputedStyle` 또는 토큰 |

---

## Phase 4: 인라인 style 제거

### 원칙
- `style={{}}` → Tailwind 클래스로 전환
- 동적 값(width, top, left 등 JS 계산 값)은 예외 허용
- 정적 색상, 배경, 폰트 크기는 절대 인라인 금지

### 정당한 예외
| 파일 | 이유 |
|------|------|
| `ontology-graph-canvas.tsx` | Canvas 기반 동적 렌더링 |
| `calendar-view.tsx` | 이벤트 위치 동적 계산 |
| `editor/ImageNode.tsx` | 리사이즈 width 동적 |
| `editor/TipTapEditor.tsx` | TipTap 내부 스타일 |

### 제거 대상 (상위 10)
| 파일 | 인라인 style 유형 |
|------|-----------------|
| `display-panel.tsx` | 정적 background 색상 |
| `editor/HashtagSuggestion.tsx` | `color: "#6366f1"` |
| `notes-board.tsx` | 정적 색상 매핑 |
| `filter-panel.tsx` | 정적 배경색 |
| `note-fields.tsx` | 색상 표시용 (동적이지만 CSS 변수로 가능) |
| `views/search-view.tsx` | `backgroundColor: label.color` |
| `linear-sidebar.tsx` | 일부 정적 스타일 |
| `insights-view.tsx` | 차트 관련 |
| `board-workbench.tsx` | 일부 정적 스타일 |
| `editor/EditorToolbar.tsx` | 일부 정적 스타일 |

---

## Phase 5: 비표준 값 통일

### 5.1 duration-300 → duration-200

```bash
# 4건 찾기 및 교체
grep -rn "duration-300" components/ --include="*.tsx"
# 모두 duration-200으로 교체
```

대상: `graph-insights-view.tsx`, `wiki-dashboard.tsx`, `linear-sidebar.tsx` (프로그래스바)

### 5.2 strokeWidth 비표준 → 제거 (Phosphor 전환 후 자동 해결)

Phase 2에서 Phosphor로 전환하면 대부분 해결.
잔여: `filter-panel.tsx`의 인라인 SVG 체크박스 아이콘 (strokeWidth 2.2)

### 5.3 border 정리 (선택적)

모든 148건을 제거할 필요는 없음. 아래 유형만 검토:
- 리스트 행 간 `border-b` → spacing + hover 배경으로 충분한가?
- 섹션 간 `border-b` → gap 증가로 충분한가?
- 패널 경계 `border-r` → 유지 (구조적으로 필요)

---

## 검증 체크리스트

각 Phase 완료 후:

```
- [ ] npm run build — 빌드 에러 없음
- [ ] npm run test — 테스트 통과
- [ ] grep "from \"lucide-react\"" 대상 파일 — 0건
- [ ] grep "style={{" 대상 파일 — 정당한 예외만
- [ ] grep "#[0-9a-fA-F]{6}" 대상 파일 — 0건 (예외: lib/colors.ts)
- [ ] grep "duration-300" components/ — 0건
- [ ] 다크모드 + 라이트모드 모두 시각 확인
- [ ] DESIGN-TOKENS.md 체크리스트 실행
```
