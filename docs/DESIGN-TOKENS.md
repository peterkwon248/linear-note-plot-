# Design Tokens — Plot 설계 기준

> 이 문서는 `design-quality-gate` 스킬의 **단일 진실 공급원(Single Source of Truth)**입니다.
> 모든 설계 값의 중앙 저장소로 기능합니다. 이 파일에 없는 값을 코드에 도입하려면 반드시 사용자 승인이 필요합니다.

## 서문

Plot의 모든 설계 결정은 Linear 수준의 미니멀리즘을 추구합니다. 이 문서는:

- **CSS 변수 정의** — Light/Dark 테마별 색상, 타이포그래피, 스페이싱
- **Tailwind 매핑** — CSS 변수 → Tailwind 클래스 대조표
- **Hardcoded 금지** — hex 색상, 임의 값은 이 파일에 등록된 것만 사용
- **아이콘 규칙** — strokeWidth, 사이즈 스케일, 금지 패턴
- **버전 제어** — 설계 변경은 커밋 메시지에 "design: " prefix 사용

**사용법:**
1. 새 색상/사이즈 필요 → 이 문서에 먼저 등록
2. 코드 리뷰 시 → 이 파일에 없는 값 사용 시 반려
3. 설계 변경 → 반드시 이 파일 업데이트 후 코드 변경

---

## 색상 시스템

### Light 테마 (:root)

| 토큰 | 용도 | 값 | Tailwind 클래스 |
|------|------|-----|-----------------|
| `--background` | 페이지 배경 | `#ffffff` | `bg-background` |
| `--foreground` | 기본 텍스트 | `#1a1a2e` | `text-foreground` |
| `--card` | 카드/패널 배경 | `#f7f8fa` | `bg-card` |
| `--card-foreground` | 카드 텍스트 | `#1a1a2e` | `text-card-foreground` |
| `--popover` | 팝오버/드롭다운 배경 | `#ffffff` | `bg-popover` |
| `--popover-foreground` | 팝오버 텍스트 | `#1a1a2e` | `text-popover-foreground` |
| `--primary` | 주 색상 | `#1a1a2e` | `bg-primary`, `text-primary` |
| `--primary-foreground` | 주 색상 텍스트 | `#ffffff` | `text-primary-foreground` |
| `--secondary` | 보조 배경 | `#f0f1f4` | `bg-secondary` |
| `--secondary-foreground` | 보조 텍스트 | `#1a1a2e` | `text-secondary-foreground` |
| `--muted` | 비활성 배경 | `#f0f1f4` | `bg-muted` |
| `--muted-foreground` | 비활성 텍스트 | `#6b7280` | `text-muted-foreground` |
| `--accent` | 강조 색상 | `#5e6ad2` | `bg-accent`, `text-accent` |
| `--accent-foreground` | 강조 텍스트 | `#ffffff` | `text-accent-foreground` |
| `--destructive` | 삭제/위험 | `#e5484d` | `bg-destructive`, `text-destructive` |
| `--destructive-foreground` | 삭제 텍스트 | `#ffffff` | `text-destructive-foreground` |
| `--border` | 보더 | `#e2e3e8` | `border-border` |
| `--input` | 입력 필드 | `#e2e3e8` | `border-input` |
| `--ring` | Focus ring | `#5e6ad2` | `ring-ring`, `outline-ring/50` |

### Dark 테마 (.dark)

| 토큰 | 용도 | 값 | Tailwind 클래스 |
|------|------|-----|-----------------|
| `--background` | 페이지 배경 | `#09090b` (zinc-950) | `dark:bg-background` |
| `--foreground` | 기본 텍스트 | `#fafafa` | `dark:text-foreground` |
| `--card` | 카드/패널 배경 | `#18181b` | `dark:bg-card` |
| `--card-foreground` | 카드 텍스트 | `#fafafa` | `dark:text-card-foreground` |
| `--popover` | 팝오버 배경 | `#18181b` | `dark:bg-popover` |
| `--popover-foreground` | 팝오버 텍스트 | `#fafafa` | `dark:text-popover-foreground` |
| `--primary` | 주 색상 | `#fafafa` | `dark:bg-primary` |
| `--primary-foreground` | 주 색상 텍스트 | `#09090b` | `dark:text-primary-foreground` |
| `--secondary` | 보조 배경 | `#27272a` | `dark:bg-secondary` |
| `--secondary-foreground` | 보조 텍스트 | `#fafafa` | `dark:text-secondary-foreground` |
| `--muted` | 비활성 배경 | `#27272a` | `dark:bg-muted` |
| `--muted-foreground` | 비활성 텍스트 | `#a1a1aa` | `dark:text-muted-foreground` |
| `--accent` | 강조 색상 | `#6366f1` (indigo-500) | `dark:bg-accent`, `dark:text-accent` |
| `--accent-foreground` | 강조 텍스트 | `#fafafa` | `dark:text-accent-foreground` |
| `--destructive` | 삭제/위험 | `#ef4444` (red-500) | `dark:bg-destructive`, `dark:text-destructive` |
| `--destructive-foreground` | 삭제 텍스트 | `#fafafa` | `dark:text-destructive-foreground` |
| `--border` | 보더 | `#27272a` | `dark:border-border` |
| `--input` | 입력 필드 | `#27272a` | `dark:border-input` |
| `--ring` | Focus ring | `#6366f1` | `dark:ring-ring` |

### 차트 색상

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--chart-1` | `#5e6ad2` | `#6366f1` | 기본 그래프 색 |
| `--chart-2` | `#26b5ce` | `#22d3ee` | 두 번째 계열 |
| `--chart-3` | `#f2994a` | `#f97316` | 세 번째 계열 |
| `--chart-4` | `#e5484d` | `#ef4444` | 네 번째 계열 (위험) |
| `--chart-5` | `#45d483` | `#22c55e` | 다섯 번째 계열 (성공) |

**사용:**
- `bg-chart-1`, `text-chart-1`, `dark:bg-chart-1` 등

### Hex → CSS 변수 매핑 (금지 목록)

다음 값들은 **반드시 CSS 변수로 사용**하고 hardcoded hex 금지:

| Hex | 변수 | 사용처 |
|-----|------|--------|
| `#45d483` | `var(--chart-5)` | 성공/긍정 (Tailwind: `text-chart-5`) |
| `#f2994a` | `var(--chart-3)` | 경고 (Tailwind: `text-chart-3`) |
| `#5e6ad2` | `var(--accent)` | 강조 (Tailwind: `text-accent`) |
| `#0a0a0a` | `var(--primary)` | 텍스트 (Tailwind: `text-primary-foreground`) |
| `#26b5ce` | `var(--chart-2)` | 정보 (Tailwind: `text-chart-2`) |
| `#EF4444` | `var(--destructive)` | 삭제 (Tailwind: `text-destructive`) |

---

## 사이드바 색상 (다크모드 전용)

다크 테마에서 사이드바는 **단색 배경 + Opacity 계층** 구조를 사용합니다.

### 배경 & 기본

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--sidebar-bg` | `#1c1c20` | 사이드바 배경 (charcoal) |
| `--sidebar-border` | `rgba(255,255,255, 0.06)` | 사이드바 보더 |
| `--sidebar-hover` | `rgba(255,255,255, 0.05)` | 호버 배경 |
| `--sidebar-accent` | `#27272a` | 비활성 항목 배경 |
| `--sidebar-ring` | `#6366f1` | Focus ring (accent와 동일) |

### 텍스트 Opacity 계층

| 계층 | Opacity | RGB 값 | 용도 |
|------|---------|---------|------|
| **활성** | 0.93 | `rgba(255,255,255, 0.93)` | 선택된 nav 항목, 활성 텍스트 |
| **기본** | 0.85 | `rgba(255,255,255, 0.85)` | 호버 텍스트 |
| **비활성** | 0.65 | `rgba(255,255,255, 0.65)` | 일반 nav 텍스트 |
| **아이콘** | 0.45 | `rgba(255,255,255, 0.45)` | 비활성 아이콘 |
| **보조/카운트** | 0.38 | `rgba(255,255,255, 0.38)` | 카운트, 작은 텍스트 |
| **약함** | 0.35 | `rgba(255,255,255, 0.35)` | 매우 약한 보조 정보 |

### Primary 색상

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--sidebar-primary` | `#6366f1` | 활성 색상 (다크: indigo) |
| `--sidebar-primary-foreground` | `#fafafa` | Primary 텍스트 |
| `--sidebar-foreground` | `rgba(255,255,255, 0.65)` | 기본 sidebar 텍스트 |
| `--sidebar-muted` | `rgba(255,255,255, 0.38)` | 약한 텍스트 |
| `--sidebar-accent-foreground` | `#fafafa` | Accent 텍스트 |

---

## 타이포그래피

### 폰트 패밀리

| 변수 | 값 | 용도 |
|------|-----|------|
| `--font-sans` | `'Geist', 'Geist Fallback'` | UI, 본문 (기본) |
| `--font-mono` | `'Geist Mono', 'Geist Mono Fallback'` | 코드, 프로그래밍 관련 |

### 폰트 사이즈 스케일

| 토큰 | Rem | Px | 용도 |
|------|-----|-----|------|
| `--font-size-2xs` | 0.6875 | 11px | 타이니 라벨, 에디터 메뉴, 배지 |
| `--font-size-note` | 0.8125 | 13px | 노트 콘텐츠, 보조 텍스트, 대부분의 UI |
| `--font-size-ui` | 0.9375 | 15px | 사이드바 nav, 섹션 헤더, 페이지 헤더 |

### Tailwind 폰트 사이즈 매핑

| 클래스 | 실제 값 | 용도 |
|--------|---------|------|
| `text-2xs` | 0.6875rem (11px) | 배지, 타이니 라벨 |
| `text-xs` | 0.75rem (12px) | 보조 텍스트 |
| `text-sm` | 0.875rem (14px) | 바디 텍스트 |
| `text-base` | 1rem (16px) | 표준 |
| `text-lg` | 1.125rem (18px) | 섹션 헤더 |
| `text-xl` | 1.25rem (20px) | 페이지 헤더 |
| `text-2xl` | 1.5rem (24px) | 에디터 제목 (TipTap) |

### 폰트 가중치

| 클래스 | 용도 |
|--------|------|
| `font-normal` | nav 항목, 기본 텍스트 |
| `font-medium` | 배지, 라벨, 강조 |
| `font-semibold` | 페이지 헤더, 섹션 제목 |
| `font-bold` | 중요한 제목 (드물게) |

---

## 아이콘

### strokeWidth 규칙

**금지 사항 없음. strokeWidth = 1.5 (변경 불가)**

- 모든 아이콘 스트로크: `strokeWidth={1.5}`
- 온톨로지 줌 비례 계산 시만 수정 허용 (예: `strokeWidth={1.5 * zoomLevel}`)
- 스트로크 너비 커스터마이징 불가

### 아이콘 사이즈 스케일

| 용도 | Tailwind 클래스 | Px | 사용처 |
|------|-----------------|-----|--------|
| **표준 UI** | `h-4 w-4` | 16px | 버튼, nav, 대부분의 UI 아이콘 |
| **사이드바 nav** | `h-5 w-5` | 20px | 사이드바 메뉴 항목 |
| **작은 인라인** | `h-3.5 w-3.5` | 14px | 옆에 텍스트가 붙는 작은 아이콘 |
| **인디케이터** | `h-2 w-2` | 8px | 점, 상태 표시기 |
| **대형** | `h-6 w-6` | 24px | 헤더 타이틀 앞 아이콘 (드물게) |

### 금지 사항

**사용 금지 크기:**
- `h-4.5 w-4.5` — 반쪽 값, 경계선 사이 사이즈
- 비대칭 사이즈 (`h-4 w-5` 등) — 항상 정사각형
- 임의 사이즈 (`h-[17px]`, `w-[23px]`)

**정정:** 반드시 위 스케일 중 하나 선택

---

## 스페이싱 (4px 그리드)

### 기본 그리드

Plot은 **4px 기본 그리드**를 사용합니다. 모든 스페이싱은 4의 배수여야 합니다.

| Rem | Px | Tailwind | 용도 |
|-----|-----|----------|------|
| 0.25 | 4px | `p-1` | 최소 패딩, 타이트 |
| 0.5 | 8px | `p-2` | 작은 패딩 |
| 0.75 | 12px | `p-3` | 중간 패딩 |
| 1 | 16px | `p-4` | 표준 패딩 |
| 1.25 | 20px | `p-5` | 넉넉한 패딩 |
| 1.5 | 24px | `p-6` | 큰 패딩 |

### 권장 패딩 (컨텍스트별)

| 영역 | Tailwind | Px | 목적 |
|------|----------|-----|------|
| **페이지 헤더** | `px-4` | 16px | 페이지 좌우 여백 |
| **사이드바 내부** | `px-2.5` | 10px | 사이드바 아이템 좌우 여백 |
| **에디터 콘텐츠** | `px-6` | 24px | 노트 편집 영역 |
| **카드/패널** | `px-4` | 16px | 카드 내부 |
| **모달/다이얼로그** | `p-4` | 16px | 팝업 내부 |

### Density 설정 (동적 스페이싱)

Plot은 3가지 density 모드를 지원합니다:

#### Compact 모드 (`[data-density="compact"]`)

```css
--density-py: 4px;      /* 노트 행 상하 패딩 */
--density-nav-py: 2px;  /* nav 항목 상하 패딩 */
--density-gap: 0px;     /* 항목 간 갭 */
```

**사용처:** 많은 항목 표시 필요 시

#### Default 모드 (`[data-density="default"]`)

```css
--density-py: 10px;     /* 노트 행 상하 패딩 */
--density-nav-py: 4px;  /* nav 항목 상하 패딩 */
--density-gap: 2px;     /* 항목 간 갭 */
```

**사용처:** 표준 (기본값)

#### Comfortable 모드 (`[data-density="comfortable"]`)

```css
--density-py: 14px;     /* 노트 행 상하 패딩 */
--density-nav-py: 6px;  /* nav 항목 상하 패딩 */
--density-gap: 4px;     /* 항목 간 갭 */
```

**사용처:** 명확함과 여유로움 선호 시

### CSS 사용

```css
.note-row {
  padding-top: var(--density-py, 10px);
  padding-bottom: var(--density-py, 10px);
}

.nav-item {
  padding-top: var(--density-nav-py, 4px);
  padding-bottom: var(--density-nav-py, 4px);
}
```

---

## 보더 라디우스

### 라디우스 스케일

기본값: `--radius: 0.5rem` (8px)

| 토큰 | 계산식 | Px | 용도 |
|------|--------|-----|------|
| `--radius-sm` | `calc(var(--radius) - 4px)` | 4px | 타이트한 라디우스 |
| `--radius-md` | `calc(var(--radius) - 2px)` | 6px | 중간 라디우스 |
| `--radius-lg` | `var(--radius)` | 8px | 표준 라디우스 (기본) |
| `--radius-xl` | `calc(var(--radius) + 4px)` | 12px | 큰 라디우스 |

### Tailwind 매핑

| 클래스 | 값 | 용도 |
|--------|-----|------|
| `rounded-sm` | 0.125rem (2px) | 매우 약한 라운딩 |
| `rounded` | 0.25rem (4px) | `--radius-sm` 대체 |
| `rounded-md` | 0.375rem (6px) | `--radius-md` 대체 |
| `rounded-lg` | 0.5rem (8px) | `--radius-lg` 대체 |
| `rounded-xl` | 0.75rem (12px) | `--radius-xl` 대체 |
| `rounded-full` | 9999px | 완전 원형 (아바타, 배지) |

**권장:** CSS 변수 사용 > Tailwind 클래스 (일관성)

---

## 트랜지션

### 허용 Duration

| Duration | Tailwind | 용도 |
|----------|----------|------|
| 75ms | `duration-75` | 빠른 상호작용 (호버, 포커스) |
| 150ms | `duration-150` | 표준 상호작용 |
| 200ms | `duration-200` | 느린 전환 (모달 오픈 등) |

**Tailwind 클래스 사용:**
```html
<button class="transition-colors duration-150 hover:bg-accent">...</button>
```

### 금지 Duration

| Duration | 사유 |
|----------|------|
| 100ms | 너무 애매함 (75ms/150ms 중 선택) |
| 300ms | 너무 느림 (150ms/200ms 선택) |
| 500ms+ | 사용자 답답함 유발 |

### 트랜지션 속성

| 속성 | Tailwind | 용도 |
|------|----------|------|
| 색상 변경 | `transition-colors` | 배경색, 텍스트색 |
| 모든 속성 | `transition` | 종합 변경 |
| 투명도 | `transition-opacity` | 페이드 인/아웃 |
| 스케일 | `transition-transform` | 확대/축소 |

---

## 스크롤바

### 스타일 규칙

| 항목 | 설정 |
|------|------|
| **너비/높이** | 6px (얇음) |
| **Thumb (핸들)** | `border-radius: 9999px` (완전 원형) |
| **Thumb 기본** | `transparent` (숨김) |
| **Thumb 호버** | Light: `rgba(0,0,0, 0.08)`, Dark: `rgba(255,255,255, 0.08)` |
| **Thumb 활성 호버** | Light: `rgba(0,0,0, 0.16)`, Dark: `rgba(255,255,255, 0.16)` |
| **트랙** | `transparent` (항상 숨김) |
| **전환** | `background-color 0.2s ease` |

### CSS 구현

```css
/* 표준 scrollbar (Firefox) */
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

*:hover {
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}

.dark *:hover {
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}

/* Webkit scrollbar (Chrome, Safari) */
*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

*::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

*:hover::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.08);
}

.dark *:hover::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.08);
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.16);
}

.dark *::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.16);
}
```

---

## Tailwind 클래스 매핑 참조표

### 색상 매핑

#### 배경색

| CSS 변수 | Tailwind Light | Tailwind Dark |
|----------|-----------------|-----------------|
| `--background` | `bg-background` | `dark:bg-background` |
| `--card` | `bg-card` | `dark:bg-card` |
| `--secondary` | `bg-secondary` | `dark:bg-secondary` |
| `--muted` | `bg-muted` | `dark:bg-muted` |
| `--accent` | `bg-accent` | `dark:bg-accent` |
| `--destructive` | `bg-destructive` | `dark:bg-destructive` |
| `--sidebar-bg` | N/A | `dark:bg-sidebar-bg` |

#### 텍스트색

| CSS 변수 | Tailwind Light | Tailwind Dark |
|----------|-----------------|-----------------|
| `--foreground` | `text-foreground` | `dark:text-foreground` |
| `--card-foreground` | `text-card-foreground` | `dark:text-card-foreground` |
| `--primary-foreground` | `text-primary-foreground` | `dark:text-primary-foreground` |
| `--muted-foreground` | `text-muted-foreground` | `dark:text-muted-foreground` |
| `--accent-foreground` | `text-accent-foreground` | `dark:text-accent-foreground` |
| `--destructive-foreground` | `text-destructive-foreground` | `dark:text-destructive-foreground` |

#### 보더

| CSS 변수 | Tailwind |
|----------|----------|
| `--border` | `border-border`, `divide-border` |
| `--input` | `border-input` |
| `--ring` | `ring-ring`, `outline-ring/50` |

### 차트 색상 매핑

```tailwind
/* Light 테마 */
text-chart-1, bg-chart-1  → #5e6ad2
text-chart-2, bg-chart-2  → #26b5ce
text-chart-3, bg-chart-3  → #f2994a
text-chart-4, bg-chart-4  → #e5484d (destructive와 동일)
text-chart-5, bg-chart-5  → #45d483 (성공)

/* Dark 테마 */
dark:text-chart-1, dark:bg-chart-1  → #6366f1
dark:text-chart-2, dark:bg-chart-2  → #22d3ee
dark:text-chart-3, dark:bg-chart-3  → #f97316
dark:text-chart-4, dark:bg-chart-4  → #ef4444
dark:text-chart-5, dark:bg-chart-5  → #22c55e
```

### 사이드바 색상 매핑

```tailwind
/* Dark 모드 전용 */
dark:bg-sidebar-bg                  → #1c1c20
dark:text-sidebar-foreground        → rgba(255,255,255, 0.65)
dark:text-sidebar-muted             → rgba(255,255,255, 0.38)
dark:bg-sidebar-accent              → #27272a
dark:text-sidebar-primary           → #6366f1
dark:text-sidebar-primary-foreground → #fafafa
dark:border-sidebar-border          → rgba(255,255,255, 0.06)
```

### 타이포그래피 매핑

```tailwind
/* 폰트 패밀리 */
font-sans  → 'Geist', 'Geist Fallback'
font-mono  → 'Geist Mono', 'Geist Mono Fallback'

/* 폰트 사이즈 */
text-2xs  → 0.6875rem (11px)
text-xs   → 0.75rem (12px)
text-sm   → 0.875rem (14px)
text-base → 1rem (16px)
text-lg   → 1.125rem (18px)

/* 가중치 */
font-normal     → 400
font-medium     → 500
font-semibold   → 600
font-bold       → 700
```

---

## 체크리스트: 설계 가이드라인 준수

설계 리뷰 시 다음 항목을 확인하세요:

- [ ] **색상**: hex 코드 직접 사용 안 함 (항상 `--variable` 또는 Tailwind 클래스)
- [ ] **아이콘**: strokeWidth = 1.5, 사이즈는 스케일 중 하나
- [ ] **스페이싱**: 4px 그리드, density 변수 사용
- [ ] **타이포그래피**: 이 문서의 폰트 사이즈 스케일만 사용
- [ ] **트랜지션**: 75ms, 150ms, 200ms만 사용
- [ ] **라디우스**: `--radius-*` CSS 변수 또는 Tailwind 클래스
- [ ] **사이드바 다크모드**: opacity 계층 구조 준수
- [ ] **스크롤바**: 6px 너비, 호버 시에만 보이기

---

## 변경 이력

| 날짜 | 변경 | 버전 |
|------|------|------|
| 2026-03-17 | 초기 문서 작성 | 1.0 |

---

## FAQ

### Q: 새 색상을 추가하고 싶습니다.
**A:** 이 파일의 "색상 시스템"에 먼저 정의하세요. `globals.css`에 CSS 변수 추가 후, Tailwind 설정에 등록하세요.

### Q: 임의 사이즈 (예: `h-[17px]`)를 써도 될까요?
**A:** 금지. 이 파일의 스케일만 사용하세요. 새 사이즈 필요 시 먼저 이 문서 수정.

### Q: Dark 테마에서 Light 색상을 쓸 수 있나요?
**A:** 권장하지 않음. Dark 테마는 다른 hex 값을 사용합니다 (`#6366f1` vs `#5e6ad2`). Dark 색상을 명시적으로 사용하세요.

### Q: Density를 동적으로 바꿀 수 있나요?
**A:** 네. HTML에 `data-density="compact"` 속성을 추가하면, CSS 변수가 자동으로 적용됩니다.

### Q: 스크롤바를 항상 보이게 하려면?
**A:** `globals.css` 스크롤바 섹션 수정 필요. 먼저 이 문서 업데이트 후 코드 변경하세요.

---

**이 문서는 design-quality-gate의 사실 공급원입니다. 설계 검토 시 항상 참조하세요.**
