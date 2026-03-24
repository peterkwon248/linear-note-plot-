# Plot Design Audit — Linear 갭 분석

> 2026-03-24 생성. Plot 레포 전체(306 파일) 코드 스캔 기반.
> 목적: Linear 수준 디자인 퀄리티 달성을 위한 현재 갭과 우선순위 도출.

---

## 요약: 5대 시스템 위반

| # | 위반 | 심각도 | 영향 범위 | 수치 |
|---|------|--------|----------|------|
| 1 | **Phosphor 마이그레이션 0%** | 🔴 Critical | 57개 파일 | Lucide import 57개 파일, Phosphor import 0개 |
| 2 | **인라인 style 객체** | 🟠 High | 46개 파일 | DESIGN-TOKENS "Tailwind-first, 인라인 금지" 위반 |
| 3 | **Hardcoded hex 색상** | 🟠 High | 15+ 파일 | `#5e6ad2`, `#6b7280`, `#45d483` 등 직접 사용 |
| 4 | **border 과다 사용** | 🟡 Medium | 148건 | `border-b`/`border-t` 등 148건 (Linear: spacing 우선) |
| 5 | **비표준 값 혼재** | 🟡 Medium | 산재 | duration-300(4건), strokeWidth 1.2/1.3/2.0/2.2(15+건) |

---

## 1. 아이콘 시스템: Lucide 57파일 / Phosphor 0파일

**현황:** DESIGN-TOKENS.md에서 Phosphor 마이그레이션을 선언했지만 **단 하나의 파일도 전환하지 않았다.**

3가지 아이콘 시스템이 혼재:
- **Lucide** (57파일): 사실상 전체 앱이 Lucide 의존
- **plot-icons.tsx** (30+ 커스텀 SVG): ActivityBar, Sidebar nav 등 핵심 크롬에서 사용
- **view-header.tsx 인라인 SVG** (3개): FilterIcon, DisplayIcon, PanelRightIcon — strokeWidth 1.2-1.3

**Lucide 의존도 Top 5:**
| 파일 | Lucide import 수 |
|------|-----------------|
| tags-view.tsx | ~19 |
| labels-view.tsx | ~19 |
| note-picker-dialog.tsx | ~18 |
| floating-action-bar.tsx | ~15 |
| wiki-block-renderer.tsx | ~14 |

**권장 액션:**
- Phase 1: 가장 눈에 보이는 크롬(ActivityBar, Sidebar, ViewHeader)부터 Phosphor 전환
- Phase 2: 에디터 관련 (EditorToolbar, SlashCommand, ImageNode)
- Phase 3: 뷰 컴포넌트 (Tags, Labels, Templates, Wiki)
- Phase 4: 나머지 전체

---

## 2. 인라인 style 객체: 46개 파일

**현황:** DESIGN-TOKENS.md에서 "Tailwind-first, `style={{}}` 금지"를 선언했지만 46개 파일에서 사용 중.

**심각한 케이스:**
- `ImageNode.tsx`: 가장 많은 인라인 스타일 (width, height, display, backgroundColor, fontSize 등)
- `ontology-graph-canvas.tsx`: Canvas 렌더링이므로 일부는 정당
- `calendar-view.tsx`: 동적 위치 계산으로 일부 정당
- `display-panel.tsx`: `style={{ background: "#5e6ad2" }}` — 명백한 위반

**정당한 예외:**
- Canvas/SVG 기반 렌더링 (ontology-graph-canvas)
- 동적으로 계산되는 위치/크기 (calendar-view의 이벤트 배치)
- TipTap 에디터 내부 노드 (ImageNode의 width 리사이즈)

**제거 필요:**
- 정적 스타일링을 인라인으로 한 모든 케이스 → Tailwind 클래스로 전환
- 특히 색상(`color`, `backgroundColor`)은 절대 인라인 금지

---

## 3. Hardcoded hex 색상: 15+ 파일

**현황:** DESIGN-TOKENS.md의 "Hex → CSS 변수 매핑 (금지 목록)"을 위반하는 직접 hex 사용.

**주요 위반:**

| 파일 | 위반 내용 |
|------|----------|
| `create-dialog.tsx` | 8개 hex 색상 배열 (`#5e6ad2`, `#26b5ce` 등) |
| `note-fields.tsx` | 10개 hex 색상 배열 |
| `templates-view.tsx` | 8개 hex 색상 배열 + 기본값 `#5e6ad2` |
| `display-panel.tsx` | `background: "#5e6ad2"` 직접 사용 |
| `ontology-graph-canvas.tsx` | `ACCENT_COLOR = "#5e6ad2"`, 여러 hex 직접 |
| `notes-board.tsx` | 링크 밀도 색상 4개 직접 hex |
| `calendar-view.tsx` | 상태 dot 색상 `#6b7280` 직접 |
| `linear-sidebar.tsx` | 폴더 생성 기본 색상 `#5e6ad2` 직접 |
| `tags-view.tsx` | 태그 생성 기본 색상 `#888888` 직접 |
| `graph-insights-view.tsx` | `text-[#f5a623]` Tailwind arbitrary 사용 |

**권장:** `PRESET_COLORS` 배열을 `lib/colors.ts`에 중앙화, CSS 변수 기반으로 전환.

---

## 4. Border 과다 사용: 148건

**현황:** Linear의 "Structure felt, not seen" 원칙 대비 border 사용이 과다.

DESIGN-TOKENS.md에서 이미 "border 대신 spacing + hover 배경으로 구분"을 선언했지만, 코드에는 아직 148건의 `border-b`/`border-t`/`border-r`/`border-l` 사용이 남아있음.

모든 border가 제거 대상은 아니지만, 상당수는 spacing이나 surface 색상 차이로 대체 가능.

**우선 검토 대상:**
- 리스트 행 간 `border-b` → spacing + hover 배경
- 섹션 구분 `border-b` → gap 증가
- 패널 경계 `border-r` → 일부는 유지 필요 (사이드바-콘텐츠 경계)

---

## 5. 비표준 값

### duration-300 (금지 목록)
4건: `graph-insights-view.tsx`, `wiki-dashboard.tsx`, `linear-sidebar.tsx` 프로그래스바.
→ 모두 `duration-200`으로 교체 가능.

### strokeWidth 비표준
- `view-header.tsx`: 1.2, 1.3 (인라인 SVG 아이콘)
- `filter-panel.tsx`: 1.2, 2.2
- `calendar-view.tsx`: 2
- `ontology-graph-canvas.tsx`: 0.8, 1.0, 1.05, 1.2, 1.3, 2.0, 2.5 (Canvas이므로 일부 정당)

### rgba() 직접 사용
32건 — CSS 변수로 이미 정의된 값을 직접 rgba로 사용하는 케이스.

---

## 6. 파일 크기 = 분해 필요성

| 파일 | 줄 수 | 상태 |
|------|------|------|
| ontology-graph-canvas.tsx | 2048 | Canvas 기반, 분해 어려움 |
| notes-table.tsx | 1957 | 🔴 분해 필요 (행 렌더링, 헤더, 그룹, 정렬 분리) |
| linear-sidebar.tsx | 1186 | 🟠 분해 가능 (NavLink, FolderTree, SectionGroup) |
| calendar-view.tsx | 1182 | 🟠 분해 가능 (MonthGrid, DayCell, EventItem) |
| notes-board.tsx | 1121 | 🟠 분해 가능 (BoardColumn, BoardCard) |
| filter-bar.tsx | 1076 | 🟠 분해 가능 (FilterChip, FilterDropdown) |

---

## 가장 시급한 표면: `view-header.tsx` + `display-panel.tsx`

**선정 이유:**
1. **모든 뷰의 최상단**에 위치 — 사용자가 가장 먼저 보는 컴포넌트
2. **작은 파일**(356줄 + 480줄) — 빠르게 완료 가능
3. **모든 위반 유형을 포함**: 인라인 SVG 아이콘(strokeWidth 비표준), Lucide import, 인라인 style, hardcoded hex
4. **Linear의 핵심 패턴과 직접 대응**: Linear의 뷰 헤더 → Display Options → 필터 패턴

**현재 문제:**
- `view-header.tsx`의 3개 인라인 SVG(FilterIcon, DisplayIcon, PanelRightIcon)가 strokeWidth 1.2-1.3으로 plot-icons.tsx의 1.5와 불일치
- `display-panel.tsx`에 hardcoded `#5e6ad2`, 인라인 style
- ViewHeader의 버튼 크기(h-7 w-7)와 border-radius(rounded-[6px])가 토큰 기반이 아닌 직접 지정
- 기존 Lucide 아이콘(`Search`, `X`, `FileText`, `Pin`)이 Phosphor로 미전환

**폴리시 액션:**
1. 인라인 SVG 3개 → Phosphor 아이콘으로 교체 (FunnelSimple, SlidersHorizontal, SidebarSimple)
2. Lucide 4개 → Phosphor 교체
3. display-panel.tsx의 hardcoded hex → CSS 변수
4. 인라인 style → Tailwind 클래스
5. 버튼 크기/radius를 토큰 기반으로
6. strokeWidth 통일 (1.5)

---

## Claude Code 실행 계획

이 감사 결과를 Claude Code에서 실행할 때의 작업 순서:

### Phase 1: ViewHeader + DisplayPanel 폴리시 (즉시)
```
1. npm install @phosphor-icons/react (아직 안 되어 있다면)
2. view-header.tsx: 인라인 SVG → Phosphor, Lucide → Phosphor
3. display-panel.tsx: hex → CSS 변수, style → Tailwind
4. DESIGN-TOKENS.md 체크리스트 실행
```

### Phase 2: 아이콘 시스템 정리 (이번 주)
```
1. plot-icons.tsx의 커스텀 아이콘 → Phosphor 대체 가능한 것 식별
2. 상위 15개 Lucide 의존 파일 순서대로 전환
3. view-header.tsx 인라인 SVG 제거 확인
```

### Phase 3: Hardcoded hex 제거 (이번 주)
```
1. PRESET_COLORS 배열을 lib/colors.ts에 중앙화
2. create-dialog, note-fields, templates-view 등 교체
3. display-panel, calendar-view, notes-board 등 교체
```

### Phase 4: 인라인 style 제거 (다음 주)
```
정당한 예외(Canvas, 동적 위치)를 제외한 모든 style={{}} 제거
```

### Phase 5: Border 정리 + 비표준 값 (다음 주)
```
1. 행 간 border-b → spacing으로 가능한 곳 교체
2. duration-300 → duration-200
3. strokeWidth 비표준 → 1.5 통일
```

---

## linear-design-mirror 스킬 연동

이 감사 결과를 `linear-design-mirror` 스킬의 references에 반영:

### implementation-specs.md에 추가
- Plot 현재 토큰 vs 실제 코드 괴리 목록
- Phosphor 마이그레이션 진행 상태 트래킹

### SKILL.md Apply 모드에 추가
- "Linear처럼 만들어줘" 요청 시, 먼저 해당 컴포넌트의 감사 상태 확인
- 위반 사항이 있으면 폴리시를 먼저 수행 후 새 기능 구현

### design-quality-gate 연동 강화
- 새 코드에서 Lucide import 시 → Phosphor 사용 안내
- 인라인 style 감지 시 → Tailwind 전환 안내
- hardcoded hex 감지 시 → CSS 변수 매핑 안내
