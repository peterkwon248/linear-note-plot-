# PLOT Wiki 리디자인 — Claude Code 실행 지시문

> **참조 목업**: `docs/mockups/plot-wiki-full-flow.html` (브라우저에서 열어서 3개 탭 확인)
> **이 문서를 Phase 순서대로 실행하세요. 각 Phase 완료 후 커밋.**

---

## Phase 1: 위키 홈 대시보드

### 목표
현재 WikiView의 Articles/Red Links 탭 리스트를 **나무위키 홈 스타일 대시보드**로 교체.

### 참조
목업의 **① 위키 홈** 탭. 검색창 + 통계 바 + 6개 카드 그리드.

### 변경 파일
- `components/views/wiki-view.tsx` — 전면 리디자인

### 구현 상세

#### 1-1. 상단 Hero 영역
```
📖 Plot Wiki
"내 지식의 백과사전"

42 문서 · 7 빨간 링크 · 156 내부 링크 · 847 연결된 노트
```
- 통계는 실시간 계산:
  - 문서 수: `notes.filter(n => n.isWiki).length`
  - 빨간 링크 수: 기존 `redLinks` 계산 로직 재사용 (현재 WikiView에 이미 있음)
  - 내부 링크 수: `notes.reduce((sum, n) => sum + (n.linksOut?.length ?? 0), 0)`
  - 연결된 노트: 위키 문서에 backlink가 있는 고유 노트 수

#### 1-2. 검색 바
- 현재 ViewHeader의 searchPlaceholder를 사용하지 말고, **대시보드 중앙에 큰 검색창** 배치
- 타이핑하면 기존 FlexSearch로 위키 문서 필터링, 드롭다운으로 결과 표시
- Enter 또는 결과 클릭 시 해당 위키 문서로 이동 (`navigateToNote`)
- 주의: 이건 글로벌 SearchView와 별개. 위키 홈 내 로컬 검색.

#### 1-3. 카드 그리드 (3열)
6개 카드. 각 카드는 `<div className="rounded-lg border border-border bg-card p-5">` 스타일.

**카드 1: 최근 변경**
- `notes.filter(n => n.isWiki).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)`
- 각 항목: 파란 점 + 제목 + 상대시간 (`relativeTime` 함수 재사용)
- 클릭 시 해당 문서로 이동

**카드 2: 가장 연결 많은 문서**
- 각 위키 노트의 backlink 수 계산 → 정렬 → 상위 5개
- `lib/backlinks.ts`의 `getBacklinks(noteId, notes)` 또는 `linksOut` 역추적
- 각 항목: 제목 + "N개 노트" 표시

**카드 3: 아직 안 만든 개념 (빨간 링크)**
- 기존 WikiView의 `redLinks` 계산 로직 그대로 사용
- 각 항목: 빨간색 제목 + "N회 언급" + hover 시 `+ 생성` 버튼
- 생성 버튼: 기존 `createWikiStub` 호출

**카드 4: 카테고리별 (2열 span)**
- 위키 노트에 달린 태그를 카테고리로 사용
- `tags` 중 위키 노트에서 사용된 것만 추출 → badge로 나열
- 미분류 (태그 없는 위키): amber 색상 badge
- 클릭 시 해당 태그로 필터링 (향후 구현, 지금은 클릭 이벤트만)

**카드 5: 방치 문서 (Insight 레이어링)**
- 위키 노트 중 updatedAt이 14일 이상 지난 것
- 30일+: 빨간 점, 14일+: amber 점
- `notes.filter(n => n.isWiki && (Date.now() - new Date(n.updatedAt).getTime()) > 14 * 86400000)`

#### 1-4. 스타일 규칙
- 기존 DESIGN-TOKENS.md 준수
- 카드 배경: `bg-card` (= `rgba(255,255,255,0.02)` 다크 모드)
- 카드 border: `border-border`
- 점 색상: 파란(`text-accent`), 빨강(`text-destructive`), amber(`text-warning` 또는 `text-yellow-500`)
- 폰트: 카드 제목 `text-sm font-semibold text-muted-foreground`, 항목 `text-sm text-foreground`
- 그리드: `grid grid-cols-3 gap-5`, 카테고리 카드는 `col-span-2`
- **목업의 이모지(📝, 🔥, 🔴, 📂, ⚠️)는 사용하지 마세요.** 대신 Lucide 아이콘 사용:
  - 최근 변경: `Clock`
  - 가장 연결 많은: `TrendingUp`
  - 빨간 링크: `CircleDot` (빨강)
  - 카테고리: `FolderOpen`
  - 방치: `AlertTriangle`

#### 1-5. ViewHeader 유지
- WikiView 상단에 기존 ViewHeader는 유지하되, searchPlaceholder 제거 (대시보드에 검색창이 있으므로)
- ViewHeader에는 아이콘(BookOpen) + "Wiki" + count만 표시
- 우측 actions에 `+ 새 문서` 버튼 (기존 createWikiStub 호출)

### 테스트
- [ ] 위키 홈에 6개 카드가 보이는가
- [ ] 통계 수치가 실시간 반영되는가
- [ ] 빨간 링크에서 `+ 생성` 클릭 시 위키 문서 생성되는가
- [ ] 각 카드의 항목 클릭 시 해당 문서로 이동하는가
- [ ] 위키 문서가 0개일 때 빈 상태 표시가 되는가

---

## Phase 2: 위키 문서 읽기 레이아웃

### 목표
현재 note-editor의 위키 읽기 모드를 **나무위키 스타일 3단 레이아웃**으로 업그레이드.

### 참조
목업의 **③ 위키 문서** 탭. TOC 사이드바 + 본문(동음이의어 배너, 번호 목차, 파란/빨간 링크, 관련 문서, 백링크, 각주) + Infobox+활동 통계.

### 변경 파일
- `components/note-editor.tsx` — 위키 읽기 모드 영역 교체
- `components/editor/wiki-toc.tsx` — 목차에 번호 추가
- `components/editor/wiki-infobox.tsx` — 하단에 활동 통계 추가
- `components/editor/backlinks-footer.tsx` — "이 문서를 참조하는 노트" 리디자인
- 새 파일: `components/editor/wiki-related-docs.tsx` — 관련 문서 칩
- 새 파일: `components/editor/wiki-disambig.tsx` — 동음이의어 배너

### 구현 상세

#### 2-1. 3단 레이아웃 (note-editor.tsx 위키 읽기 모드)

현재 구조 (`note.isWiki && isReadMode` 분기):
```
flex →
  aside (TOC, w-[200px]) →
  div (content area, flex-1)
    float-right Infobox
    NoteEditorAdapter
    WikiCategories
    BacklinksFooter
```

새 구조:
```
flex →
  aside (TOC sidebar, w-[200px], border-r) →
  div (article content, flex-1, overflow-y-auto, max-w-[780px]) →
    WikiDisambig (조건부)
    h1.article-title
    p.article-subtitle (aliases 표시)
    NoteEditorAdapter (editable=false)
    WikiRelatedDocs (관련 위키 문서 칩)
    BacklinksFooter (리디자인)
    FootnotesSection (TipTap 각주 확장이 있다면)
  aside (infobox sidebar, w-[240px]) →
    WikiInfobox
    WikiCategories (badge 형태)
    ActivityStats (활동 미니 통계)
```

#### 2-2. WikiDisambig (새 컴포넌트)
- `components/editor/wiki-disambig.tsx`
- 조건: 같은 제목(또는 alias)을 가진 다른 위키 노트가 있을 때만 표시
- 스타일: `rounded-lg bg-accent/5 border border-accent/15 p-3 text-sm text-muted-foreground mb-6`
- 내용: "**{title}**은(는) 여기로 연결됩니다. {otherTitle}에 대한 내용은 {link} 문서를 참고하십시오."
- 구현: `notes.filter(n => n.isWiki && n.id !== note.id && (n.title === note.title || n.aliases?.includes(note.title)))`

#### 2-3. WikiTOC 업그레이드
- 현재: 헤딩 텍스트만 나열
- 변경: **번호 매김** 추가 (1. 개요, 2. 계산법, 2.1. 기본 공식, ...)
- 활성 상태: 현재 스크롤 위치에 해당하는 TOC 항목에 `border-l-2 border-accent text-accent bg-accent/5` 스타일
- IntersectionObserver로 스크롤 추적 (이미 구현되어 있을 수 있음 — 확인 후 보강)

#### 2-4. Infobox → 우측 사이드바로 이동
- 현재: 본문 영역 내 float-right
- 변경: 독립된 우측 aside (w-[240px])
- Infobox 카드 아래에:
  - WikiCategories를 badge 형태로 (`rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs`)
  - 활동 미니 통계:
    - 연결된 노트: backlinks 수
    - 최근 7일 편집: `noteEvents`에서 계산 (noteEvents가 없으면 updatedAt 기반 간소화)
    - 온톨로지 연결: `relations.filter(r => r.sourceId === note.id || r.targetId === note.id).length`
    - 최종 수정: `relativeTime(note.updatedAt)`

#### 2-5. WikiRelatedDocs (새 컴포넌트)
- `components/editor/wiki-related-docs.tsx`
- 이 위키 문서의 `linksOut`에서 다른 위키 문서만 추출
- 칩 형태로 나열: `rounded-md bg-secondary border border-border px-3 py-1.5 text-sm`
- 클릭 시 해당 위키 문서로 이동

#### 2-6. BacklinksFooter 리디자인
- 현재: 단순 리스트
- 변경: "이 문서를 참조하는 노트 (N)" 제목 + 노트 아이콘 + 제목 + 상대시간
- 4개까지 표시, 그 이상은 "+ N개 더 보기" 토글
- 클릭 시 해당 노트로 이동

#### 2-7. 편집 모드 전환
- [편집] 버튼 클릭 시 3단 레이아웃 → 기존 단일 에디터 레이아웃으로 전환
- 이미 `isReadMode` 토글이 있으므로 동작 변경 불필요, 레이아웃만 분기

### 스타일 규칙
- article-title: `text-[28px] font-bold text-foreground tracking-tight`
- article-subtitle: `text-sm text-muted-foreground mb-6`
- section-h2의 번호: `text-accent font-bold` (번호는 TipTap 렌더에서 추가하기 어려우므로, TOC에서만 번호 표시. 본문 헤딩에는 번호 추가하지 않음)
- 본문 내 wiki-link 스타일: 이미 `WikilinkDecoration.ts`에서 처리 중. 존재하는 링크=`text-accent`, 빨간 링크=`text-destructive` 확인
- 구분선: `border-t border-border`
- 목업의 정확한 px 값이 아닌, Tailwind 유틸리티 클래스 사용

### 테스트
- [ ] 위키 노트를 읽기 모드로 열면 3단 레이아웃이 보이는가
- [ ] TOC에 번호가 매겨지는가
- [ ] Infobox가 우측 사이드바에 보이는가
- [ ] 활동 통계가 Infobox 아래에 보이는가
- [ ] 관련 문서 칩이 본문 하단에 보이는가
- [ ] 백링크가 리디자인되어 보이는가
- [ ] 편집 모드 전환이 정상 작동하는가
- [ ] 위키가 아닌 일반 노트는 기존 레이아웃 그대로인가

---

## Phase 3: 위키 검색 통합

### 목표
기존 SearchView에서 위키 검색 경험 강화. 별도 위키 전용 검색을 만들지 않고, 기존 SearchView를 활용.

### 참조
목업의 **② 검색 중** 탭. 위키/노트/태그가 섹션별로 분리, 빨간 링크에 +생성 버튼.

### 변경 파일
- `components/views/search-view.tsx` — 위키 탭 추가 + 검색 결과에 위키 섹션

### 구현 상세

#### 3-1. 탭에 "Wiki" 추가
현재 탭: `All | Notes | Tags | Labels | Templates | Folders`
변경: `All | Notes | Wiki | Tags | Labels | Templates | Folders`

#### 3-2. All 탭에서 위키 섹션 분리
- 현재 All 탭은 모든 결과를 타입별 구분 없이 나열
- 변경: 검색 결과를 **위키 문서 → 빨간 링크 → 내 노트 → 태그 → 라벨 → 템플릿 → 폴더** 순서로 섹션 구분
- 각 섹션에 `text-xs font-semibold text-muted-foreground uppercase tracking-wider` 스타일 헤더

#### 3-3. 위키 결과 아이콘 차별화
- 위키 문서: `BookOpen` 아이콘 + accent 색상 배경 (`bg-accent/10 text-accent`)
- 빨간 링크: `CircleDot` 아이콘 + destructive 색상 (`bg-destructive/10 text-destructive`)
- 일반 노트: `FileText` 아이콘 + 기존 muted 색상

#### 3-4. 빨간 링크에 "+ 생성" 버튼
- 검색 결과에 빨간 링크 매칭이 있으면, 우측에 `+ 생성` 텍스트 버튼
- 클릭 시 `createWikiStub` 호출 → 생성된 문서로 이동
- 설명 텍스트: "아직 생성되지 않음 · N회 언급됨"

#### 3-5. 검색창 하단 빠른 생성 링크
- 검색 결과 하단에: `"{query}"로 새 위키 문서 만들기` 링크
- 클릭 시 해당 제목으로 `createWikiStub` 호출

### 테스트
- [ ] SearchView 탭에 Wiki가 추가되었는가
- [ ] Wiki 탭 클릭 시 위키 문서만 필터링되는가
- [ ] All 탭에서 위키/노트/태그가 섹션별로 구분되는가
- [ ] 빨간 링크에 + 생성 버튼이 보이는가
- [ ] 위키 문서 결과의 아이콘이 차별화되는가

---

## 실행 순서

```
Phase 1 → 커밋 → 테스트
Phase 2 → 커밋 → 테스트
Phase 3 → 커밋 → 테스트
```

**각 Phase는 독립적으로 동작해야 합니다.** Phase 2가 실패해도 Phase 1은 정상 작동해야 합니다.

## 주의사항

1. **기존 데이터 구조 변경 없음** — Note 타입, store 슬라이스, 마이그레이션 추가 없음
2. **기존 컴포넌트 재사용 최대화** — WikiTOC, WikiInfobox, WikiCategories, BacklinksFooter, ViewHeader는 수정은 하되 삭제하지 않음
3. **DESIGN-TOKENS.md 준수** — strokeWidth 1.5, 하드코딩 hex 금지, transition 75/150/200만 사용
4. **이모지 아이콘 금지** — 모든 아이콘은 Lucide 사용
5. **목업은 방향 참조용** — px 단위를 그대로 복사하지 말고 Tailwind 유틸리티로 구현
6. **성능 고려** — useMemo로 비용 높은 계산 캐싱 (backlinks 수 계산, 빨간 링크 등)
