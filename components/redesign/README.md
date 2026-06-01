# Redesign Scaffolding (preview-first, non-destructive)

> Open Design / Claude Design 핸드오프를 위한 **격리된 리디자인 작업 공간**.
> 라이브 앱(`app/(app)/*`, `components/` god들)은 **0 touch**. 여기서 시각만 따로 떠서 도구에 넘기고, 디자인 확정 후 라이브로 promotion한다.
> 프로젝트 DNA: `app/preview/linear/` 선례 + memory #138(mockup-first) / #154(preview-only 격리) / #137(Path A: lib·hooks keep, components 재설계).

## 왜 이 구조인가

Open Design은 **HTML 프로토타입 생성기**(React 직접 소비 X, memory #139). 즉 지금 만드는 presentational은 **곧 도구가 새 디자인으로 갈아엎을 대상**이다. 그렇다면:

- ❌ 라이브 god을 위험하게 인플레이스 리팩터 → 아직 확정 안 된 디자인 전에 blast radius 선부담
- ✅ 라이브는 그대로, **순수 presentational + mock**만 격리 추출 → 도구에 넘김 → 확정 후 라이브 스왑

## 디렉터리 규약

```
components/redesign/<surface>/
  <surface>.types.ts        ← view-model (props 계약). store 모양을 plain data로.
  <surface>-view.tsx        ← 순수 presentational. 이 파일을 Open Design에 넘긴다.
  <surface>.mock.tsx        ← 현실적인 sample 데이터 (preview 렌더용)
app/preview/redesign/<surface>/page.tsx   ← <SurfaceView vm={mock} /> 렌더 라우트
app/preview/redesign/page.tsx             ← 5개 surface 인덱스
app/preview/redesign/layout.tsx           ← 프리뷰 공통 프레임
```

## "순수 presentational" 규칙 (엄수)

핸드오프 단위가 자기완결적이어야 도구가 다룰 수 있다.

- **금지**: `usePlotStore`, `useRouter`/`usePathname`, `useT`, 데이터 hook(`useBacklinksIndex` 등), 직접 store mutation
- **허용**: props(view-model) · UI-로컬 `useState`(입력값/펼침 등) · 순수 import(아이콘 `@/components/plot-icons`·`@/lib/entity-icons`·`lucide-react`, 색 `@/lib/colors`, `cn`)
- **라벨**: i18n 텍스트는 view-model에 문자열로 담는다(mock이 실제 한/영 리터럴 제공) → 도구가 진짜 텍스트를 봄
- **핸들러**: optional callback prop으로, 기본 noop

## 충실도 규칙 (fidelity)

도구가 **진짜 화면**을 리디자인하도록, 추측이 아니라 복제한다.

1. 라이브 god의 JSX + className을 **그대로** 옮긴다 (재해석 X)
2. store 파생값 → view-model prop으로 치환
3. 핸들러 → optional callback (기본 noop)
4. `.a-*` 등 디자인 시스템 className 문자열은 **글자 하나도 바꾸지 않음** (토큰 훅)

## Open Design 핸드오프 → 라이브 promotion 루프

1. **추출** (여기): 라이브 → 순수 presentational + mock + preview 라우트. `tsc`/build 검증.
2. **핸드오프**: Open Design에 `<surface>-view.tsx` + preview 스크린샷 전달 → 리디자인된 HTML 수령.
3. **수동 변환**: 새 HTML을 presentational JSX로 다시 작성, **view-model 계약은 유지**.
4. **promotion** (나중, 디자인 확정 후): 라이브 container가 새 presentational을 렌더하도록 스왑 + 옛 인라인 JSX 제거. 이때만 라이브 touch.

## Surface 현황

| Surface | 라이브 god | 줄수 | presentational | preview |
|---|---|---|---|---|
| 홈 | `views/home-view.tsx` (+`home/*`) | 267 | ✅ `home/home-view.tsx` | `/preview/redesign/home` |
| 사이드바 | `linear-sidebar.tsx` | 2011 | ✅ `sidebar/sidebar-view.tsx` | `/preview/redesign/sidebar` |
| 노트리스트 | `notes-table.tsx` (+`notes-board`) | 1993 | ✅ `notes-list/notes-list-view.tsx` | `/preview/redesign/notes-list` |
| 에디터 | `note-editor.tsx` (+`FixedToolbar`) | 905+ | ✅ `editor/editor-view.tsx` | `/preview/redesign/editor` |
| 인사이트 | `insights-view.tsx` (대시보드) | 404 | ✅ `insights/insights-view.tsx` | `/preview/redesign/insights` |

### 컨텍스트별 부분 포팅 (후속)
- **사이드바**: Notes/Home 컨텍스트만 포팅. Wiki/Calendar/Ontology/Library/Books 5개는 동일 패턴 — `sidebar.mock` 에 `SidebarContextModel` 추가만 하면 렌더(view 코드 변경 0).
- **에디터**: 크롬/툴바만. 본문은 정적 근사(TipTap 엔진 제외 — 의도).
- **인사이트**: insights 대시보드만. `ontology-graph-canvas`(force graph)는 별도 surface 후보.
