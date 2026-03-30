# Design Spine 8-Phase 폴리싱 플랜

> 목표: 63,000줄 코드베이스의 시각적 일관성을 Notion 수준으로 올린다.
> 구조 변경 없음. CSS + Tailwind 클래스 작업만.
> 매 Phase 끝나면 dev 서버 스크린샷으로 시각적 검증.

---

## 현재 진단 요약

| 문제 | 심각도 | 파일 수 |
|------|--------|---------|
| Hover 배경 3종 혼재 (`bg-secondary` vs `bg-hover-bg` vs `bg-active-bg`) | 높음 | 15+ |
| Active 상태 3종 혼재 (`bg-secondary` vs `bg-active-bg` vs `bg-sidebar-active`) | 높음 | 10+ |
| 에디터 Heading/폰트 전부 hardcoded px (토큰 아님) | 높음 | EditorStyles.css |
| 에디터 max-width 없음 (글이 화면 끝까지 펼쳐짐) | 높음 | note-editor.tsx |
| Border radius 불일치 (`rounded-lg` vs `rounded-md` vs `rounded-[10px]`) | 중간 | 10+ |
| `h-[52px]` 같은 매직넘버 (토큰 아님) | 중간 | view-header 등 |
| 에디터 내 링크색/인라인코드/체크박스 hardcoded hex | 중간 | EditorStyles.css |
| `text-sm`(14px), `text-xs`(12px) 비표준 사용 | 중간 | 5+ |
| Activity Bar `bg-background` ≠ Sidebar `bg-sidebar-bg` | 낮음 | 2 |

---

## Phase 1: Interaction Tokens 통일 (Hover / Active / Border)

**목표**: 마우스 올렸을 때, 클릭했을 때, 경계선이 앱 전체에서 동일하게 느껴지도록.

### 1-1. Hover 배경 통일

**규칙**: 2가지만 허용
- `hover:bg-hover-bg` — 메인 영역 (리스트, 버튼, 패널)
- `hover:bg-sidebar-hover` — 사이드바 전용

**수정 대상** (모두 → `hover:bg-hover-bg`로):
- `note-editor.tsx` 헤더 버튼: `hover:bg-secondary` → `hover:bg-hover-bg`
- `smart-side-panel.tsx` 닫기 버튼: `hover:bg-secondary` → `hover:bg-hover-bg`
- `smart-side-panel.tsx` 탭 inactive: 이미 `hover:bg-hover-bg` ✅
- `activity-bar.tsx` inactive: 이미 `hover:bg-hover-bg` ✅
- 기타 `hover:bg-secondary/50`, `hover:bg-secondary/30` 등 비표준 → `hover:bg-hover-bg`

### 1-2. Active 상태 통일

**규칙**: 3가지만 허용
- `bg-sidebar-active` — 사이드바 NavLink 선택 상태
- `bg-active-bg` — 메인 영역 버튼/탭 활성 (가벼운)
- `bg-active-bg-strong` — 강한 활성 (Activity Bar 선택된 공간)

**수정 대상**:
- `activity-bar.tsx` active: `bg-secondary` → `bg-active-bg-strong`
- `smart-side-panel.tsx` 탭 active: `bg-secondary` → `bg-active-bg`
- `view-header.tsx` HBtn active: 이미 `bg-active-bg` ✅

### 1-3. Border 2단계 표준화

**규칙**: 2가지만 허용
- `border-border` — 구조적 경계 (레이아웃 패널 분리)
- `border-border-subtle` — 가벼운 구분 (카드, 드롭다운)

**수정**: `/30`, `/50`, `/60`, `/80` opacity 변형 전부 → `border-border-subtle`

### 검증
- [ ] tsc --noEmit 통과
- [ ] dev 서버 스크린샷: 사이드바, 리스트, 에디터, 사이드패널 hover/active 상태 확인
- [ ] 라이트/다크 양쪽 확인

---

## Phase 2: Typography 표준화

**목표**: 앱 전체가 4단계 폰트 스케일만 사용. 비표준 `text-sm`/`text-xs` 전부 제거.

### 2-1. 허용 스케일 (4단계만)

| 토큰 | 크기 | 용도 |
|------|------|------|
| `text-2xs` | 11px | 뱃지, 카운트, 마이크로 라벨 |
| `text-note` | 13px | 본문, 리스트 아이템, 패널 텍스트 |
| `text-ui` | 15px | 사이드바 네비게이션, 에디터 본문 |
| `text-title` | 28px | 에디터 제목 (H1/H2 타이틀) |

### 2-2. 비표준 제거

**수정 대상**:
- `text-sm` (14px) 사용처 전부 → `text-note` (13px) 또는 `text-ui` (15px) 판단해서
- `text-xs` (12px) 사용처 전부 → `text-2xs` (11px) 또는 `text-note` (13px)
- `text-[13px]` arbitrary → `text-note`
- `text-[10.5px]` arbitrary → `text-2xs`
- `text-base` (16px) → `text-ui` (15px)

### 검증
- [ ] Grep으로 `text-sm`, `text-xs`, `text-base`, `text-[` 잔존 확인 → 0건
- [ ] 스크린샷으로 폰트 크기 일관성 시각 확인

---

## Phase 3: Editor Typography 토큰화

**목표**: EditorStyles.css의 hardcoded px 값을 CSS 변수로 전환. 나중에 변수 하나 바꾸면 전체 에디터가 따라 바뀌도록.

### 3-1. 새 CSS 변수 추가 (globals.css)

```css
/* Editor Spine */
--editor-font-size: 15px;
--editor-line-height: 1.75;
--editor-h1: 28px;
--editor-h2: 23px;
--editor-h3: 19px;
--editor-h4: 16px;
--editor-h5: 14.5px;
--editor-h6: 13px;
--editor-block-gap: 0.4em;
--editor-code-bg: rgba(0,0,0,0.05);
--editor-code-radius: 4px;
--editor-link-color: var(--accent);
```

### 3-2. EditorStyles.css 수정

모든 hardcoded px → CSS 변수 참조:
- `font-size: 15px` → `font-size: var(--editor-font-size)`
- `h1 { font-size: 28px }` → `h1 { font-size: var(--editor-h1) }`
- 링크 `#7B8CDE` → `var(--editor-link-color)`
- 인라인 코드 `rgba(0,0,0,0.05)` → `var(--editor-code-bg)`
- 체크박스 `#FFFFFF` → `var(--accent-foreground)`

### 검증
- [ ] 에디터에서 H1~H6, 코드블록, 링크, 체크박스 스크린샷
- [ ] CSS 변수 하나 바꿔서 전체 반영되는지 확인 (예: --editor-font-size를 16px로)

---

## Phase 4: Editor Layout — 숨 쉬는 여백

**목표**: 에디터 컨텐츠에 max-width + 여유 padding 적용. "글이 숨 쉬는" 느낌.

### 4-1. 새 CSS 변수

```css
--editor-max-width: 720px;
--editor-padding-x: 48px;  /* 양쪽 48px = 96px */
--editor-padding-y: 32px;
```

### 4-2. note-editor.tsx 수정

현재 `px-6 py-4` (24px/16px) → CSS 변수 기반:
```
<div style="max-width: var(--editor-max-width); margin: 0 auto; padding: var(--editor-padding-y) var(--editor-padding-x);">
```

또는 Tailwind 커스텀 클래스.

### 4-3. 페이지 레이아웃 프리셋 준비 (CSS 변수만)

```css
/* Standard (기본) */
--editor-max-width: 720px;

/* Wide */
[data-layout="wide"] { --editor-max-width: 960px; }

/* Journal */
[data-layout="journal"] { --editor-max-width: 560px; font-family: var(--font-serif); }
```

이 Phase에서는 CSS 변수만 정의. 프리셋 전환 UI는 나중에.

### 검증
- [ ] 에디터 스크린샷: 좁은 화면, 넓은 화면에서 여백 확인
- [ ] 긴 글 스크롤 시 읽기 편안함 확인

---

## Phase 5: Surface 계층 + Border Radius 통일

**목표**: 배경색 계층과 모서리 둥글기가 앱 전체에서 일관.

### 5-1. Surface 계층 규칙

```
S0: bg-background    — 앱 바닥 (에디터 영역)
S1: bg-card           — 패널, 사이드바
S2: bg-surface-overlay — 드롭다운, 팝오버, 모달
S3: bg-popover        — 중첩 팝오버 (있으면)
```

**수정**: 잘못된 surface 사용 (예: 드롭다운에 `bg-popover` 대신 `bg-surface-overlay` 등)

### 5-2. Border Radius 3단계

```
작은 요소 (뱃지, 칩): rounded-sm (4px)
중간 요소 (버튼, 입력, 카드): rounded-md (6px)
큰 요소 (모달, 팝오버): rounded-lg (8px)
```

**수정**: `rounded-[10px]`, `rounded-lg`(8px) 혼용 → 규칙대로 통일

### 5-3. Activity Bar 배경 결정

`activity-bar.tsx`의 `bg-background`를 `bg-sidebar-bg`로 통일하거나, 의도적으로 분리 유지 결정.

### 검증
- [ ] 팝오버/드롭다운/모달 열었을 때 배경 계층 스크린샷
- [ ] 라이트/다크 양쪽 surface 구분 확인

---

## Phase 6: 4px Grid + Magic Number 제거

**목표**: 모든 spacing이 4의 배수. hardcoded 매직넘버를 CSS 변수 또는 Tailwind 표준값으로.

### 6-1. Grid 이탈 수정

- `py-[7px]` → `py-2` (8px)
- `py-[3px]` → `py-1` (4px)
- `gap-[3px]` → `gap-1` (4px)
- 기타 비표준 arbitrary spacing

### 6-2. 매직넘버 토큰화

```css
--header-height: 52px;
--activity-bar-width: 44px;
--sidebar-min-width: 200px;
--sidebar-max-width: 320px;
```

`h-[52px]` → `h-[var(--header-height)]` 또는 `h-13` (52px)

### 검증
- [ ] Grep으로 `\-\[.*px\]` 패턴 — 의도적인 것만 남았는지 확인
- [ ] 레이아웃 스크린샷으로 정렬 확인

---

## Phase 7: Hardcoded 색상 + 아이콘 정리

**목표**: hex 직접 사용 제거, 아이콘 사이즈 표준화.

### 7-1. Hardcoded hex 제거

DESIGN-AUDIT.md에 나열된 9건 + EditorStyles.css 내 hardcoded 색상 전부.
→ CSS 변수 또는 `lib/colors.ts` 참조로 전환.

### 7-2. 아이콘 사이즈 표준

```
10 — micro
12 — tiny (뱃지 내)
14 — small (리스트 아이템)
16 — default (대부분)
20 — nav (사이드바, Activity Bar)
24 — toolbar
```

`size={15}` → `size={14}` 또는 `size={16}` 판단해서 표준 그리드로.

### 검증
- [ ] Grep으로 `#[0-9a-fA-F]{3,8}` — CSS 변수에 정의된 것 외 잔존 0건
- [ ] 아이콘 사이즈 시각 확인

---

## Phase 8: 빈 상태 + 페이지 아이콘 + 마이크로 인터랙션

**목표**: "친절한" 앱 느낌. 빈 화면이 안내하고, 페이지에 이모지 아이콘 붙이고, 전환이 부드럽게.

### 8-1. 빈 상태 안내

각 공간의 빈 상태에 일러스트/아이콘 + 안내 텍스트 + CTA 버튼:
- Notes 빈 상태: "첫 번째 페이지를 만들어보세요" + 새 페이지 버튼
- Wiki 빈 상태: "노트가 쌓이면 위키가 자라납니다"
- Calendar 빈 상태: "날짜를 클릭해서 오늘의 기록을 시작하세요"

### 8-2. 페이지 아이콘 (이모지)

Note 메타에 `icon: string | null` 필드 추가 (store migration).
사이드바, 리스트, 에디터 상단에 표시. 클릭하면 이모지 피커.

### 8-3. 트랜지션 표준화

```css
--transition-fast: 120ms ease;
--transition-default: 160ms ease;
--transition-slow: 200ms ease;
```

`duration-200`, `duration-300` 혼용 → 3단계만.

### 검증
- [ ] 빈 상태 스크린샷 (Notes, Wiki, Calendar)
- [ ] 페이지 아이콘 사이드바/리스트/에디터 스크린샷
- [ ] hover/전환 모션 부드러움 시각 확인

---

## 실행 순서 요약

```
Phase 1 → Interaction (hover/active/border)     → 인터랙션 일관성
Phase 2 → Typography (text-sm/xs 제거)          → "정돈된" 느낌
Phase 3 → Editor Typography (CSS 변수화)         → 에디터 토큰화
Phase 4 → Editor Layout (max-width + padding)    → "숨 쉬는" 느낌
Phase 5 → Surface + Radius (배경/모서리 통일)     → 계층 명확
Phase 6 → Grid + Magic Numbers (4px + 토큰)     → 미세 정렬
Phase 7 → Colors + Icons (hex 제거 + 사이즈)     → 완성도
Phase 8 → Empty States + Icons + Motion          → "친절한" 느낌
```

**예상 작업량**: Phase당 1~2시간. 전체 8~16시간.
**각 Phase는 독립 커밋 가능.**

---

## 검증 프로토콜 (모든 Phase 공통)

```
1. 코드 변경
2. tsc --noEmit 빌드 통과 확인
3. dev 서버 시작 (npm run dev)
4. 스크린샷 촬영 (라이트 + 다크)
5. 시각적 확인 — 안 되면 재분석 → 재작업 → 다시 확인
6. 통과하면 커밋
```
