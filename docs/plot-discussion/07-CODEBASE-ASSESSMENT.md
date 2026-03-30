# 코드베이스 현황 평가 & 디자인 폴리싱이 핵심인 이유

> 2026-03-30 대화 기반 정리. 레포: github.com/peterkwon248/linear-note-plot-

---

## 코드베이스 규모

- **63,000+ 줄** (TypeScript 96.8%)
- **35 커밋**, **130+ PR** 누적
- **20개 Zustand 슬라이스**, store version **v65**
- 디렉토리: `.claude/`, `app/`, `components/`, `docs/`, `hooks/`, `lib/`, `styles/`

---

## 이미 구현된 기능 (대부분 완료)

### 에디터 (TipTap 3, 25+ extensions)
- 4-tier 확장 시스템 (base / note / wiki / template)
- Toggle, Callout, Table, TOC (플로팅+인라인), Code, Math, Columns, Summary, Infobox, NoteEmbed
- @멘션 (노트/위키/태그/날짜 4종 통합)
- 블록 드래그 (dnd-kit) + 사이드 드롭 → 칼럼 자동 생성
- 42항목 커스텀 툴바 + Arrange Mode (dnd-kit)
- WikiQuote, WikiLink, 앵커/북마크
- 테이블 BubbleMenu (Row/Col/Merge/Split/Align/Bold/Color/Header/Delete)

### 뷰 시스템
- `context→filter→search→sort→group` 파이프라인 (view-engine)
- List / Board 뷰 + 서브그루핑
- FilterPanel 2단계 nested (Linear식)
- DisplayPanel, SavedView, Sub-group Order

### 지식 시스템
- 백링크 (incremental index, keyword/tag scoring, alias support)
- FlexSearch Worker 기반 검색 (IDB persistence)
- co-occurrence 엔진, 관계 제안, Discover 추천 엔진
- 온톨로지 그래프 (SVG, Web Worker 레이아웃, viewport culling, LOD)
- SRS 복습 시스템

### 위키
- WikiArticle 별도 엔티티 (article/stub)
- 카테고리 DAG 트리, 머지/스플릿
- WikiCollection (staging area), WikiQuote
- Auto-enroll, 초성 인덱스

### 기타
- Autopilot 규칙 엔진 (WHEN→THEN)
- 템플릿 시스템
- SmartSidePanel 5탭 (Detail/Connections/Activity/Peek/Bookmarks)
- 캘린더 뷰 (독립 공간, 크로스스페이스)
- Undo Manager (LinkedList, 50단계)
- Settings (appearance/editor/shortcuts/backup/sync)

---

## 불만족의 원인 = 디자인 폴리싱

### DESIGN-AUDIT.md에 진단된 5대 문제

#### 1. 타이포 스케일 혼란 (심각도: 높음)
- 커스텀 토큰 4단계 정의: `text-2xs`(11px) / `text-note`(13px) / `text-ui`(15px) / `text-title`(28px)
- 하지만 `text-sm`(14px), `text-xs`(12px), `text-[13px]`, `text-[10.5px]` 등 비표준 값 혼재
- 같은 리스트인데 어디는 13px 어디는 14px → "뭔가 정돈 안 된 느낌"

#### 2. 라이트모드 깨짐 (심각도: 높음)
- `bg-white/[0.12]` 같은 다크 전용 값이 토글 컴포넌트 3곳에 복붙
- 라이트모드에서 어색한 결과

#### 3. Border opacity 카오스 (심각도: 중간)
- `/30`, `/50`, `/60`, `/80`이 파일마다 제각각
- 같은 "가벼운 구분선"인데 투명도가 전부 다름

#### 4. Hover 배경 파편화 (심각도: 중간)
- 7가지 서로 다른 hover 배경색 사용
- 같은 "마우스 올렸을 때"인데 파일마다 다른 색

#### 5. 4px 그리드 이탈 (심각도: 낮음)
- `py-[7px]`, `py-[3px]`, `gap-[3px]` 등 비정규 값
- 미세하지만 정렬 불일치 느낌

### 핵심 진단

> 디자인 토큰(DESIGN-TOKENS.md)은 잘 정의돼있고, 디자인 감사(DESIGN-AUDIT.md)도 끝났고, 5-Phase 실행 계획까지 세워져있다. **아직 실행이 안 됐다.**

TODO P0에 "Design Spine 수립 ← 최우선"이라고 적혀있음.

---

## 결론

> 기능은 Linear + Obsidian + Notion의 좋은 부분을 63,000줄에 담아놨는데, 표면의 일관성이 아직 안 잡혀서 "어딘가 부족한" 느낌이 드는 것.
>
> 기능을 더 추가하는 게 아니라 **DESIGN-AUDIT.md의 5-Phase를 실행하는 게 체감 만족도를 가장 크게 올린다.**

### 5-Phase 실행 계획

```
Phase 1 → Toggle 컴포넌트 통합 + 다크/라이트 CSS 변수
Phase 2 → Typography 표준화 (text-sm/text-xs → 커스텀 토큰)
Phase 3 → Border 2단계 표준화 + 4px 그리드 수정
Phase 4 → Hover 배경 통일 + Surface 계층 정리
Phase 5 → 아이콘 사이즈 + 하드코딩 위반 일괄 정리
```
