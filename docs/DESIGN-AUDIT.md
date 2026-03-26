# Plot Design Audit — Design Spine 수립을 위한 전수 감사

> 2026-03-26 실시. 전체 코드베이스 22개 핵심 파일 감사.

## 5대 문제

### 1. 타이포 스케일 혼란 (심각도: 높음)

커스텀 토큰 4단계: `text-2xs`(11px) / `text-note`(13px) / `text-ui`(15px) / `text-title`(28px)

하지만 Tailwind 기본값이 혼재되어 실질 7단계:

| 위치 | 현재 | px | 수정 |
|------|------|-----|------|
| `view-header.tsx:126` | `text-sm` | 14px | `text-note` (13px) 또는 `text-ui` (15px) |
| `notes-table.tsx:142` | `text-[13px]` | 13px | `text-note` |
| `note-list.tsx:99` | `text-sm` | 14px | `text-note` |
| `wiki-view.tsx:67` | `text-sm` | 14px | `text-note` |
| `calendar-view.tsx:270` | `text-[10.5px]` | 10.5px | `text-2xs` (11px) |
| `filter-panel.tsx:137` | `text-xs` | 12px | `text-note` (메인 검색과 통일) |

**원칙**: `text-xs`(12px), `text-sm`(14px), `text-base`(16px)는 사용 금지. 커스텀 토큰만 허용.

### 2. Toggle 다크모드 전용값 (심각도: 높음)

3곳에 복제된 Toggle 컴포넌트 전부 라이트모드 깨짐:

| 파일 | 라인 | 위반 |
|------|------|------|
| `display-panel.tsx` | 76, 80 | `bg-white/[0.12]`, `bg-white`, 하드코딩 shadow |
| `wiki-view.tsx` | 75, 79 | 동일 |
| `wiki-view.tsx` | 139, 143 | 동일 |

**수정**: 공유 Toggle 컴포넌트 추출 (`components/ui/toggle-switch.tsx`) + `--toggle-off` CSS 변수 추가.

### 3. Border Opacity 카오스 (심각도: 중간)

5가지 불일치:

| 현재 | 사용 위치 | 표준화 |
|------|----------|--------|
| `border-border` | 구조적 경계 (헤더, 사이드바) | 유지 |
| `border-border/30` | notes-table 헤더 | → `border-border-subtle` |
| `border-border/50` | wiki-category-page 카드 | → `border-border-subtle` |
| `border-border/60` | display-panel 구분선, calendar | → `border-border-subtle` |
| `border-border/80` | chip 드롭다운 | → `border-border-subtle` |

**원칙**: 2단계만 허용 — `border-border`(구조) + `border-border-subtle`(가벼운 구분).

### 4. Hover 배경 파편화 (심각도: 중간)

| 컴포넌트 | 현재 hover | 표준화 |
|----------|-----------|--------|
| Activity bar 버튼 | `hover:bg-secondary/60` | → `hover:bg-hover-bg` |
| 사이드바 네비게이션 | `hover:bg-sidebar-hover` | 유지 (사이드바 전용) |
| ViewHeader HBtn | `hover:bg-hover-bg` | 유지 (기준) |
| FixedToolbar 버튼 | `hover:bg-foreground/[0.06]` | → `hover:bg-hover-bg` |
| Note list 행 | `hover:bg-secondary/50` | → `hover:bg-hover-bg` |
| Trash entity 행 | `hover:bg-secondary/30` | → `hover:bg-hover-bg` |
| Filter panel 행 | `hover:bg-hover-bg` | 유지 (기준) |

**원칙**: 2가지만 — `hover:bg-hover-bg`(메인) + `hover:bg-sidebar-hover`(사이드바).

### 5. 아이콘 비표준 사이즈 (심각도: 낮음)

표준 그리드: 10(micro) / 12(tiny) / 14(small) / 16(default) / 20(nav) / 24(toolbar)

| 위치 | 현재 | 수정 |
|------|------|------|
| `view-header.tsx:172,191,207,214` | `size={15}` | → `size={14}` |
| `FixedToolbar.tsx:335` | `size={23}` | → `size={24}` |

## 하드코딩 위반 전체 목록

| # | 파일 | 라인 | 현재 | 수정 |
|---|------|------|------|------|
| 1 | `linear-sidebar.tsx` | 577 | `text-red-400` | `text-destructive` |
| 2 | `side-panel-context.tsx` | 181 | `text-amber-500/60` | `text-chart-3` |
| 3 | `FixedToolbar.tsx` | 177 | `shadow-[0_4px_24px_rgba(0,0,0,0.55)]` | 토큰 or 유틸리티 |
| 4 | `FixedToolbar.tsx` | 62,167 | `hover:bg-foreground/[0.06]` | `hover:bg-hover-bg` |
| 5 | `FixedToolbar.tsx` | 72 | `bg-foreground/10` | `bg-border-subtle` |
| 6 | `FixedToolbar.tsx` | 187 | `style={{ fontSize }}` | Tailwind 클래스 |
| 7 | `display-panel.tsx` | 80 | `shadow-[0_1px_3px_rgba(0,0,0,0.25)]` | 토큰 |
| 8 | `notes-board.tsx` | 98 | `bg-popover` | `bg-surface-overlay` |
| 9 | `filter-panel.tsx` | 126 | `bg-popover` | `bg-surface-overlay` |

## 4px 그리드 이탈

| 파일 | 라인 | 값 |
|------|------|-----|
| `filter-panel.tsx` | 149 | `py-[7px]` → `py-2` (8px) |
| `calendar-view.tsx` | 124 | `py-[3px]` → `py-1` (4px) |
| `calendar-view.tsx` | 249 | `gap-[3px]` → `gap-1` (4px) |

## Surface 계층 불일치

토큰 정의: `background`(S0) → `card`(S1) → `surface-overlay`(S2) → `popover`(S3)

| 컴포넌트 | 현재 | 올바른 값 |
|----------|------|----------|
| Board InlineSelect dropdown | `bg-popover` | `bg-surface-overlay` |
| Filter sub-panel | `bg-popover` | `bg-surface-overlay` |
| Sidebar recently-viewed | `bg-popover` | `bg-surface-overlay` |

## 실행 계획 (5-Phase)

```
Phase 1 → Toggle 컴포넌트 통합 + 다크/라이트 CSS 변수
Phase 2 → Typography 표준화 (text-sm/text-xs → 커스텀 토큰)
Phase 3 → Border 2단계 표준화 + 4px 그리드 수정
Phase 4 → Hover 배경 통일 + Surface 계층 정리
Phase 5 → 아이콘 사이즈 + 하드코딩 위반 일괄 정리
```
