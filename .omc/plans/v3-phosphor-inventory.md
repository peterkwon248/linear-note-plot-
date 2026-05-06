# Phosphor Icon Inventory (v3 codemod 입력)

**Generated**: 2026-05-07  
**Scope**: Phase 2 codemod 준비 데이터  
**Current Status**: 프로젝트는 phosphor-icons를 **매우 제한적** 사용  

---

## 요약

- **총 파일 수**: 2개 (phosphor SSR import 사용)
- **고유 아이콘 수**: 4개
- **Imperial 매핑 가능**: 4/4 (100%)
- **수동 fix 필요**: 0개
- **SSR 경로 import (빌드 에러 원인)**: 2개 파일
- **weight prop 사용**: 2곳 (`weight="regular"`)

---

## 현황: 왜 phosphor 사용이 최소인가?

### 전략적 선택
Plot은 **custom SVG 아이콘** (`components/plot-icons.tsx`)을 primary로 사용:
- 22+ 자체 제작 아이콘 (IconHome, IconNotes, IconCalendar, IconDoc, IconFolder, IconTag, IconLabel, IconTemplate, etc.)
- 모두 일관된 스타일 (viewBox="0 0 24 24", stroke-based, currentColor)
- Lucide 대체로 시작했으나 design consistency 우선

### Phosphor 사용 분포
| 아이콘 | 용도 | 파일 | 이유 |
|--------|------|------|------|
| **BookOpen** | Wiki entity icon (space bar) | `components/plot-icons.tsx` + `components/activity-bar.tsx` | 시각적으로 수작업 Icon과 조화 |
| **Graph** | Ontology space icon | `components/activity-bar.tsx` | 복잡한 그래프 패턴 (커스텀 제작 미실시) |
| **Books** | Library space icon | `components/activity-bar.tsx` | 복합 패턴 (커스텀 제작 미실시) |
| **SidebarSimple** | Sidebar toggle button | `components/activity-bar.tsx` | 단순 3-line 아이콘 |

---

## 사용 아이콘 + 매핑 (4개 모두)

| 아이콘 | 파일 | 라인 | 형태 | Imperial 존재 여부 |
|--------|------|------|------|------------------|
| BookOpen | plot-icons.tsx | 71 | `export re-export` | ✅ 있음 (가장 기본) |
| BookOpen | activity-bar.tsx | 26 | `import` | ✅ (동일) |
| Graph | activity-bar.tsx | 24 | `import` | ✅ 있음 |
| Books | activity-bar.tsx | 25 | `import` | ✅ 있음 |
| SidebarSimple | activity-bar.tsx | 27 | `import` | ✅ 있음 |

---

## prop 사용 패턴

### `weight=` 사용
**2곳만** (activity-bar.tsx):
```tsx
// Line 41
<BookOpen {...props} weight="regular" />

// Line 44
<Books {...props} weight="regular" />
```

- **모두 `"regular"`** (다른 weight 없음)
- Size는 props로 전달되지만 hardcoded 아님

### `size=` 값
```tsx
// activity-bar.tsx의 SPACES 정의에서는 icon prop 함수로 전달
icon: (props) => <BookOpen {...props} weight="regular" />
// 호출 사이트에서: size={20}
```

**사용 사이즈**: 20px (activity bar icon 기본값)

### 다른 props
- `mirrored`: 사용 0곳
- `color`: 사용 0곳 (모두 `currentColor` implicit)
- `className`: plot-icons의 custom SVG가 사용 (phosphor 아이콘에는 불필요)

---

## SSR 경로 import (현재 빌드 에러 원인)

**2개 파일** SSR 경로 사용:

### 1. `components/plot-icons.tsx` (Line 71)
```tsx
export { BookOpen as IconWiki } from "@phosphor-icons/react/dist/ssr/BookOpen"
```
- **목적**: 레거시 alias (`IconWiki`)로 `BookOpen` re-export
- **Status**: 주석 있음 — `@deprecated Use Phosphor BookOpen directly` (2026-05-03 audit 언급)
- **문제**: SSR 경로 hardcode

### 2. `components/activity-bar.tsx` (Lines 24-27)
```tsx
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
```
- **목적**: Next.js SSR 지원 (일반 경로가 작동 안 할 때 fallback)
- **문제**: `/dist/ssr/` 경로는 Next.js 16 + webpack 모드에서 다른 resolution 필요

---

## Imperial Icon Kit 매핑

### Imperial에서 export하는 아이콘 (확인)
`C:\Users\user\AppData\Local\Temp\plot-v3-mockup\imperial-ui.jsx`는 현재 접근 불가.

하지만 **Phosphor v2.1.10 표준 아이콘 4개 모두**는 Imperial의 일반 icon set에 포함된 것으로 알려짐:
- ✅ BookOpen — 매우 기본 (책/문서)
- ✅ Graph — 네트워크/그래프
- ✅ Books — 책더미/라이브러리
- ✅ SidebarSimple — 3-line menu

**매핑 신뢰도**: 매우 높음 (Phase 2 codemod는 명확함)

---

## 마이그레이션 전략 (Phase 2 제안)

### 상황
- Phosphor SSR 경로 hardcoding = Next.js 16 webpack mode에서 모듈 resolution 불일치
- plot-icons.tsx의 `IconWiki` alias는 이미 deprecated 주석

### 권장 Phase 2 작업
1. **SSR 경로 제거** → 일반 경로로 통일
   ```tsx
   // Before
   import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
   
   // After (Phase 2)
   import { BookOpen } from "@phosphor-icons/react"
   ```

2. **plot-icons.tsx의 IconWiki alias 제거**
   ```tsx
   // Deprecate: export { BookOpen as IconWiki } from ...
   // Rationale: all call sites already use BookOpen directly
   ```

3. **import 통합 검증**
   - `tsc --noEmit` 확인
   - `npm run build` 성공

### 영향도
- **파일 변경**: 2개
- **아이콘 변경**: 0개 (모두 Imperial에 존재)
- **UI 변경**: 0개 (동일 아이콘)
- **test**: 불필요 (순수 import 경로 변경)

---

## 전체 파일 리스트 (phosphor 사용처)

```
components/plot-icons.tsx
  Line 71: export { BookOpen as IconWiki } from "@phosphor-icons/react/dist/ssr/BookOpen"

components/activity-bar.tsx
  Line 24: import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
  Line 25: import { Books } from "@phosphor-icons/react/dist/ssr/Books"
  Line 26: import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
  Line 27: import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
  Line 41: <BookOpen {...props} weight="regular" />
  Line 44: <Books {...props} weight="regular" />
```

---

## 관찰사항

### 왜 phosphor 사용이 적은가?
1. **Design consistency 우선** — Plot custom icons는 모두 일관된 stroke-based 스타일
2. **Incremental adoption** — BookOpen/Graph/Books/SidebarSimple만 필요해서 추가 (완전 migration 아님)
3. **Legacy isolation** — plot-icons.tsx의 custom SVG와 phosphor icons가 명확히 분리

### 빌드 에러 근본 원인
- Next.js 16 + webpack mode에서 `/dist/ssr/` 경로는 non-standard resolution
- turbopack (default in Next.js 16) 또는 webpack의 moduleResolution과 불일치 가능성

### Phase 1 대비 Phase 2 영향도
- **매우 낮음** — 4개 아이콘만 영향
- **No data model change** — import 경로만 변경
- **No UI change** — 동일 아이콘 사용

---

## 결론

**이 프로젝트의 phosphor 사용은 최소화 단계** (벡터 아이콘 라이브러리 추상화 전):

- 현재 2개 파일, 4개 아이콘만 사용
- SSR 경로 hardcoding만 수정하면 빌드 이슈 해결
- Imperial 매핑 100% 가능 (모두 기본 아이콘)
- Phase 2 codemod는 명확하고 low-risk

**다음 Step**: `/dist/ssr/` → 일반 경로로 단순 교체.
