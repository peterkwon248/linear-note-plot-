# Plot Wiki Collection System — Design Document

> **Status**: Draft (2026-03-19)
> **Prerequisite**: WikiView 내부 편집 모드 (아직 미구현)

---

## 1. Philosophy

### Plot = 제텔카스텐 시스템 그 자체

```
전통 제텔카스텐:
  1. 메모를 쓴다 (Fleeting → Literature → Permanent)
  2. 메모끼리 연결한다 (링크)
  3. 연결된 메모들이 쌓이면 → 글/논문이 나온다

Plot:
  1. 노트를 쓴다 (Inbox → Capture → Permanent)
  2. 노트끼리 연결된다 (위키링크, 태그, 백링크, 온톨로지)
  3. 연결된 노트들이 쌓이면 → 위키 문서가 나온다
```

**위키 = 제텔카스텐의 출력물 중 하나.** 온톨로지, 인사이트, 리플렉션도 마찬가지.
위키를 특별 취급하면 안 된다. Plot이 제공하는 여러 "렌즈" 중 하나일 뿐.

### 위키의 고유 가치

위키 자체로도 가치가 있지만, 핵심 가치는 **내가 직접 정리한 신뢰할 수 있는 참고자료**라는 것.
다른 글을 쓸 때, 리서치할 때, 새 노트를 쓸 때 — 구글링할 필요 없이 내 위키를 참조하면 된다.
내가 직접 검증하고 정리한 텍스트, 이미지, 파일, URL이 다 있으니까.

```
일반 노트 = 생각의 조각 (흘러가는 것)
위키 문서 = 내가 정리한 신뢰할 수 있는 참고자료 (쌓이는 것)
```

### 재귀적 지식 순환

모든 레이어가 재귀적으로 서로 주고받으며 확장/고도화되는 구조:

```
노트 ──→ 위키      (Pull: 흩어진 메모를 정리된 문서로)
위키 ──→ 노트      (Extract: 위키에서 쓴 내용을 독립 노트로 추출)
노트 ←──→ 온톨로지  (자동 관계 추출, 백링크, 공기어)
온톨로지 → 위키     (관계 탐색에서 새 위키 문서 아이디어 발견)
위키 → 온톨로지     (위키링크가 관계 데이터의 소스)
```

## 2. Problem

위키 문서를 쓸 때 "빈 종이에 처음부터 쓰는" 경험이다.
이미 노트 시스템에 흩어져 있는 관련 메모, 태그, 라벨, 링크를 활용할 방법이 없다.

## 3. Three Levels of Integration

### Level 1: Link (연결)
> "이 개념이 존재한다"

- `[[EPS]]` 위키링크로 다른 문서/노트 참조
- **이미 구현됨**: WikilinkSuggestion, WikilinkDecoration
- 추가 작업 없음

### Level 2: Embed (임베드)
> "이 내용을 여기에 가져온다"

- 기존 노트에서 텍스트를 발췌해서 위키 본문에 인용 블록으로 삽입
- **Snapshot 방식**: 삽입 시 텍스트 복사 + 출처 noteId 메타데이터 보관
- Transclusion(라이브 참조)은 오버엔지니어링 → 나중에 필요하면 업그레이드

```
인용 블록 렌더링:
┌─────────────────────────────────────────┐
│ "현재 PER 12.3배, 5년 평균 대비 저평가" │
│                    — 삼성전자 PER 분석 ↗ │
└─────────────────────────────────────────┘
```

#### TipTap 구현
- Custom Node: `WikiQuote`
  - Attributes: `sourceNoteId`, `sourceTitle`, `quotedAt` (timestamp)
  - Render: blockquote 스타일 + 출처 링크
  - 출처 링크 클릭 → 원본 노트로 이동

### Level 3: Collect (수집)
> "아직 정리 안 했지만 관련 있다"

- 위키 문서에 연관된 자료를 "일단 던져놓는" 스테이징 영역
- 나중에 본문으로 정리하거나, 삭제하거나, 링크만 남기거나

---

## 4. Collection Data Model

### Option: Separate Slice (채택)

Note 타입을 더럽히지 않고, 별도 슬라이스로 관리.

```ts
// lib/types.ts
interface WikiCollectionItem {
  id: string
  type: 'note' | 'url' | 'image' | 'text'
  // note reference
  sourceNoteId?: string
  // URL reference
  url?: string
  urlTitle?: string      // OG title or user-provided
  // freeform memo
  text?: string
  // metadata
  addedAt: string
}

// lib/store/types.ts
interface PlotStore {
  // ...existing...
  wikiCollections: Record<string, WikiCollectionItem[]>  // key = wikiNoteId
  addToCollection: (wikiNoteId: string, item: Omit<WikiCollectionItem, 'id' | 'addedAt'>) => void
  removeFromCollection: (wikiNoteId: string, itemId: string) => void
  clearCollection: (wikiNoteId: string) => void
}
```

### Why separate slice?
- Note 타입에 필드 추가 안 함 (이미 Note가 큼)
- 수집함 데이터는 위키 문서와 1:N 관계
- 수집함 비우거나 초기화해도 노트에 영향 없음
- 마이그레이션: `wikiCollections: {}` 추가만 하면 됨

---

## 5. UI: Edit Mode Right Sidebar

위키 편집 모드에서 우측 사이드바에 3개 섹션 표시.

```
┌──────────────────┐
│ 📎 Collect        │
│                  │
│ [Search notes...]│
│                  │
│ ── Related ──    │  ← 자동 발견 (backlinks, same tags, linksOut)
│ 삼성전자 분석  ⊕ │
│ 투자원칙 정리  ⊕ │
│ PBR 비교 메모  ⊕ │
│                  │
│ ── Collected ──  │  ← 수동으로 추가한 것들
│ 📄 버핏 인터뷰 ✕ │
│ 🔗 article.com  ✕ │
│ 📝 "PER 한계..." ✕│
│                  │
│ ── Red Links ──  │  ← 본문에서 [[링크]]했지만 문서 없는 것
│ 🔴 PEG Ratio    │
│ 🔴 Moat         │
│                  │
│ [+ Add note]     │
│ [+ Add URL]      │
│ [+ Add memo]     │
└──────────────────┘
```

### Related Section (자동)
- 이 위키 문서에 backlink가 있는 노트
- 같은 태그를 가진 노트
- `linksOut`에서 참조하는 노트
- 이미 Collected에 있거나 본문에 임베드된 것은 제외
- `useBacklinksFor` + 태그 매칭으로 계산

### Collected Section (수동)
- `wikiCollections[noteId]` 데이터
- 타입별 아이콘: 📄 note, 🔗 url, 📝 text (Lucide 아이콘으로 대체)
- ✕ 클릭 → 수집함에서 제거
- 클릭 → 미리보기 또는 노트 열기

### Red Links Section
- 기존 빨간 링크 계산 로직 재사용 (현재 wiki-view.tsx에 있음)
- 이 위키 문서의 본문에서 참조하는 빨간 링크만 표시
- 클릭 → 위키 스텁 생성

### ⊕ Button Actions (Related 항목)
- **Single click**: `[[제목]]` 위키링크를 에디터 커서 위치에 삽입 (Level 1)
- **Shift+click** 또는 메뉴: Insert as quote (Level 2) — 노트 내용을 WikiQuote 블록으로 삽입
- **Alt+click** 또는 메뉴: Add to collection (Level 3) — Collected 섹션으로 이동

### Add Buttons
- **+ Add note**: 노트 검색 팝오버 → 선택하면 Collected에 추가
- **+ Add URL**: URL 입력 → Collected에 추가
- **+ Add memo**: 텍스트 입력 → Collected에 추가 (짧은 메모)

---

## 6. Extract as Note (위키 → 노트 추출)

위키 본문에서 텍스트를 선택한 후 독립 노트로 추출.

### Flow
```
1. 위키 편집 모드에서 텍스트 범위 선택
2. Floating toolbar 또는 우클릭 메뉴에 "Extract as Note" 버튼
3. 클릭 → 다이얼로그:
   - Title: 자동 추천 (선택 텍스트 첫 줄 또는 가장 가까운 헤딩)
   - Status: Inbox (기본)
   - Tags: 현재 위키의 태그 자동 적용
   - [Create]
4. 결과:
   - 새 노트 생성 (선택 텍스트가 content)
   - 위키 본문에서 선택 텍스트 → [[새 노트 제목]] 링크로 대체
   - (선택) 원본 텍스트를 WikiQuote로 유지하고 출처를 새 노트로 설정
```

### TipTap 구현
- Bubble menu 확장 또는 custom floating toolbar
- `editor.state.selection` 에서 선택 범위 텍스트 추출
- `createNote()` 호출 → `editor.commands.insertContent()` 로 링크 삽입

---

## 7. Read Mode vs Edit Mode Layout

### Read Mode (현재 구현)
```
┌──────┬──────────────────┬──────────┐
│ TOC  │  Article Content │ Infobox  │
│      │  Disambig        │ Categori │
│      │  Body            │ Activity │
│      │  Related Docs    │          │
│      │  Backlinks       │          │
└──────┴──────────────────┴──────────┘
```

### Edit Mode (새로 구현)
```
┌──────────────────────────┬──────────┐
│  TipTap Editor           │ Collect  │
│  (editable=true)         │ Related  │
│  + FixedToolbar (bottom) │ Collectd │
│                          │ RedLinks │
│                          │ +Add...  │
└──────────────────────────┴──────────┘
```

- 편집 모드에서는 TOC 사이드바 숨김 (편집 중 TOC는 불필요)
- Infobox → Collect 사이드바로 교체 (읽기에서 편집으로 전환 시)
- Infobox 편집은 Collect 사이드바 상단에 "Edit Infobox" 섹션으로 통합

---

## 8. Implementation Phases

### Phase A: WikiView 내부 편집 모드 (선행 조건)
- WikiView에서 Edit 클릭 → /notes 이동 대신 내부에서 편집 모드 전환
- NoteEditorAdapter `editable={true}` + FixedToolbar
- "Done" 버튼 → 읽기 모드로 복귀
- Infobox 편집도 여기서 처리
- **난이도: ★★☆**

### Phase B: Collection Slice + Basic UI
- `wikiCollections` 슬라이스 추가 (store v41)
- 편집 모드 우측 사이드바 기본 구조
- Related 섹션 (자동 발견)
- Collected 섹션 (Add/Remove)
- **난이도: ★★☆**

### Phase C: Link Insertion from Sidebar
- Related/Collected 항목 클릭 → 에디터 커서 위치에 `[[링크]]` 삽입
- 에디터 인스턴스 접근 필요 (ref or context)
- **난이도: ★★☆**

### Phase D: WikiQuote (Embed)
- TipTap custom node: WikiQuote
- Snapshot 방식: 텍스트 복사 + sourceNoteId 메타
- Shift+click으로 Related 항목을 인용 블록으로 삽입
- 인용 블록 렌더링 (blockquote + 출처 링크)
- **난이도: ★★★**

### Phase E: Extract as Note
- 텍스트 선택 → "Extract as Note" bubble menu
- 새 노트 생성 + 위키 본문에 링크 대체
- **난이도: ★★☆**

### Phase F: Red Links in Sidebar
- 편집 중 본문의 빨간 링크 실시간 추적
- 사이드바에 표시 + 클릭으로 스텁 생성
- **난이도: ★☆☆**

---

## 9. Open Questions

1. **Collected 항목 정렬**: 추가 순서? 타입별 그룹? 최근 사용순?
2. **수집함 → 본문 자동 배치**: 수집한 이미지/URL을 자동으로 적절한 섹션에 배치하는 것은 Phase F 이후?
3. **수집함 공유**: 한 위키의 수집함에 있는 항목을 다른 위키에서도 볼 수 있어야 하나?
4. **수집함 persistence**: 위키 문서를 삭제하면 수집함도 같이 삭제?
5. **Embed 갱신**: 원본 노트가 수정되면 WikiQuote에 "원본 업데이트됨" 표시할 건가?
6. **Extract 역방향**: 노트에서 "Send to Wiki" 기능도 필요한가? (노트 → 특정 위키의 수집함에 추가)
7. **태그/라벨 끌어오기**: 태그를 수집함에 추가하면 뭘 의미하나? 해당 태그의 모든 노트를 Related로 표시?

---

## 10. Dependencies

- WikiView 내부 편집 모드 (Phase A) — 이것 없이는 사이드바를 보여줄 곳이 없음
- TipTap editor instance 접근 — 링크/인용 삽입에 필요
- Store version bump (v41) — wikiCollections 슬라이스 추가

---

## 11. Virtual Wiki (가상 위키) — Auto-Discovery

### 개념

빨간 링크 = 사실상 가상 위키다.
누군가 `[[PER]]`이라고 언급했지만 아직 위키 문서가 없는 상태 = 개념은 존재하지만 실체는 없는 것.

```
현재 흐름 (이미 구현):
1. 유저가 노트에 [[PER]] 작성
2. PER 위키 문서가 없으면 → 빨간 링크 (= 가상 위키)
3. 대시보드 "Missing Concepts"에 표시 + "N회 언급"
4. 유저가 "+ Create" 클릭 → 실제 위키로 승격
5. 편집은 유저가 수동으로
```

### 확장: [[위키링크]] 없이도 개념 자동 감지

유저가 `[[]]`를 직접 쓰지 않아도 앱이 개념을 자동 감지하여 가상 위키 후보로 제안.
**AI API 없이, 로컬에서, 비용 0으로 구현 가능.**

### 감지 방법 3가지 (모두 10k 노트 기준 성능 검증됨)

#### Method 1: 태그/라벨 활용 — ✅ 즉시 가능
```
태그 #PER이 3개 노트에 붙어 있는데 위키가 없다
→ "PER" 가상 위키 후보로 제안
```
- 구현: `notes.filter()` + Map 연산
- 성능: O(n), 1만개에 <1ms
- 정확도: 높음 (유저가 직접 태그를 붙였으므로)

#### Method 2: 공기어 엔진 활용 — ✅ 이미 구현됨
```
온톨로지 슬라이스에 co-occurrence 엔진이 있음
자주 같이 등장하는 단어 쌍을 이미 추적 중
→ 상위 공기어를 가상 위키 후보로 활용
```
- 구현: 기존 `lib/store/slices/ontology.ts` 재사용
- 성능: 증분 업데이트 방식, 10k에서 검증됨
- 정확도: 중간 (노이즈 가능, 임계값 조정 필요)

#### Method 3: 반복 키워드 추출 — ⚠️ 조건부 가능
```
전체 노트에서 2회 이상 등장하는 고유 단어/구문 추출
TF-IDF 통계적 방법
→ 고빈도 키워드를 가상 위키 후보로 제안
```
- 구현: Web Worker에서 증분 처리 (FlexSearch와 동일 패턴)
- 성능: 전체 스캔은 느림, 증분(변경 노트만)이면 10k OK
- 정확도: 낮음~중간 (고유명사 vs 일반명사 구분 어려움)

### 통합 가상 위키 후보

```
가상 위키 후보 = 빨간 링크 (Level 1, 가장 확실)
              + 다빈도 태그 중 위키 없는 것 (Level 2, 높은 신뢰)
              + 공기어 상위 키워드 (Level 3, 탐색적)
              + (추후) TF-IDF 반복 키워드 (Level 4)
```

### UI: 위키 대시보드에 "Suggested Articles" 카드 추가

```
┌────────────────────────────────────┐
│ 💡 Suggested Articles              │
│                                    │
│ From tags:                         │
│   PER (3 notes) ............. [+]  │
│   가치투자 (5 notes) ........ [+]  │
│                                    │
│ From co-occurrence:                │
│   Forward PER (appears with PER).. │
│   배당수익률 (appears with 투자).. │
└────────────────────────────────────┘
```

- [+] 클릭 → 위키 스텁 생성 (유저 수동 승격)
- 가상 위키는 실체가 없으므로 유저가 명시적으로 승격해야만 실제 위키가 됨

---

## 12. Not In Scope (for now)

- AI 기반 자동 정리/요약
- 수집함 → 본문 자동 배치 (AI)
- 실시간 공동 편집
- 수집함 항목에 대한 코멘트/메모
- 위키 문서 버전 히스토리
- TF-IDF 키워드 추출 (Method 3 — Phase A~F 이후 별도 구현)
