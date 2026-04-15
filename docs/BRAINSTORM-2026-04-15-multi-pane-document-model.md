# Multi-pane Document Model (Phase 3 재정의)

**날짜**: 2026-04-15 밤
**상태**: 브레인스토밍 완료 → Phase 3 진입 대기
**이전 문서**: `BRAINSTORM-2026-04-14-column-template-system.md` ("2026-04-15 밤 대결정" 절)

---

## 1. 배경 — 왜 재설계가 필요한가

Phase 2-2-A ~ 2-2-C까지 완료된 현재 모델:
- `WikiArticle.blocks[]` = 모든 블록을 한 pool에 저장
- `WikiArticle.columnAssignments: Record<blockId, ColumnPath>` = 블록별 컬럼 매핑
- 컬럼 = **view-level projection** (데이터는 공유, 렌더 시 분배)
- 섹션 넘버링은 전체 `blocks[]` 기준으로 계산

### 관찰된 UX 문제 (2026-04-15 밤 테스트)

1. **3컬럼 Fleeting Note에서 섹션 추가 시 번호 뒤섞임** — "1. Definition" 다음에 "5. Untitled Section" (전역 counter 때문)
2. **빈 컬럼의 "or split: 2/3" 버튼이 혼란** — AddBlock, Drop zone, Split 3개 요소가 같은 공간에서 경쟁
3. **하단 글로벌 AddBlock이 어느 컬럼으로 가는지 불명확** — 암묵적으로 main [0]
4. **컬럼이 "독립 공간"이 아님** — 블록 하나가 여러 컬럼 사이를 떠도는 느낌

### 사용자 멘탈 모델 (인터뷰로 확인됨)

> "각 컬럼이 독자적인 공간으로 제공됐으면. 타이틀을 하나로 두고 그 아래 컬럼에 맞는 독자적인 공간을 갖는 느낌. 디자인 레이아웃을 원하는 대로 배치."

→ 위키피디아/노션 둘 다 아닌 **"잡지식 다단 레이아웃"**. 각 컬럼이 자체 flow를 가진 독립 하위 문서.

---

## 2. 핵심 비전

### "컬럼 = 독립 공간" + "메타 자유 배치"

- 타이틀/서브타이틀/별칭 = 문서 최상단에 **공유 레이어**로 고정
- 그 아래 N개 pane이 각자 독립적으로:
  - 자체 `blocks[]`
  - 자체 섹션 넘버링
  - 자체 TOC / Infobox 등 메타 (드래그로 어느 pane에든 배치 가능)
  - 자체 배경색 / 이름 / themeColor (잡지식 꾸밈)

### 현재 모델 vs 새 모델

| 차원 | 현재 (공유 pool) | 새 모델 (per-column) |
|---|---|---|
| 블록 저장 | `WikiArticle.blocks[]` 하나 | `ColumnBlocksLeaf.blocks: WikiBlock[]` 자체 보유 |
| 컬럼 매핑 | `columnAssignments` map | 구조 자체가 매핑 |
| 섹션 넘버링 | 전역 counter | 각 pane 독립 |
| 컬럼 identity | 없음 | `name`, `themeColor`, `bg` |
| 메타 위치 | `columnAssignments`에 할당 | 각 pane의 blocks 중 하나 |

---

## 3. 결정사항 (최종)

### 구조
| 항목 | 결정 |
|---|---|
| 기본 방향 | Horizontal (가로) |
| Vertical 지원 | 컬럼 메뉴 ⋯ "Split vertically" (중첩/최상위 모두 허용) |
| 방향 혼합 | 중첩 3 depth 내 자유롭게 (H 안에 V, 역도) |
| 1 pane 모드 | 기존 나무위키 스타일 유지 (섹션 넘버링 활성화) |
| 타이틀/서브타이틀/별칭 | 최상단 공유 레이어 고정, 1개만 |

### 크기 제어
| 항목 | 결정 |
|---|---|
| 가로 폭 | 컬럼 경계 드래그 → `ratio` (react-resizable-panels, 이미 구현) |
| 세로 높이 | 기본 = 컨텐츠 fit. 경계 드래그하면 `ratio` 고정 모드 전환. Reset 버튼으로 auto 복귀 |
| 이미지 크기 | 블록 레벨 4코너 리사이즈 (기존 유지) |
| "잡지식 높이 맞춤" | **Phase 3.1로 분리** (Match heights + Fill container) |

### UX
| 항목 | 결정 |
|---|---|
| 컬럼 구분 | 세로선/가로선 + 고유 배경색 (투명도 낮게, 잡지 스타일) |
| 컬럼 이름 | `ColumnDefinition.name?` 속성 (블록 아닌 컬럼 속성) |
| 컬럼 메뉴 ⋯ | Split H / Split V / Set name / Set color / Delete |
| 빈 컬럼 UX | AddBlock만 (Split은 메뉴로 이동) |
| Split 버튼 노출 | 빈 컬럼 하단에서 제거 → 컬럼 메뉴로 |
| 메타 자유 배치 | TOC/Infobox 어느 pane이든 드래그 이동 가능 |
| 섹션 넘버링 | pane별 독립 (각자 "1. ~ N." 재시작) |
| 1↔N 전환 | 자동 병합/분할. column[1]+ 비어있지 않으면 경고창 |
| 용어 (i18n) | 한국어 "컬럼/행" 또는 "가로/세로", 영어 "Column/Row". 현재 UI 언어 따름 |
| 컬럼 색 상속 | 메타 블록은 컬럼 배경 상속. 메타 자체 `headerColor` 있으면 override |

---

## 4. 데이터 모델 변경 (상세)

### Before (Phase 2-2-C 기준)
```typescript
WikiArticle = {
  blocks: WikiBlock[]                            // 전역 pool
  columnAssignments?: Record<string, ColumnPath> // blockId → path
  layout?: ColumnStructure                        // view 규칙
  // ...
}

ColumnBlocksLeaf = { type: "blocks", blockIds: string[] }  // derived view
```

### After (Phase 3)
```typescript
WikiArticle = {
  // blocks[] 제거 (또는 read-only derived view로 남김)
  layout: ColumnStructure                         // 이제 canonical
  // ...
}

ColumnBlocksLeaf = {
  type: "blocks"
  blocks: WikiBlock[]                             // ← 블록 자체를 여기 저장
  sectionIndex?: WikiSectionIndex[]               // pane별 독립 index
}

ColumnDefinition = {
  ratio?: number
  minWidth?: number
  minHeight?: number                              // vertical에서 씀
  priority?: number
  name?: string                                   // 컬럼 라벨 (신규)
  themeColor?: WikiThemeColor                     // 컬럼 색 (신규)
  content: ColumnContent
}

ColumnStructure = {
  type: "columns"
  direction?: "horizontal" | "vertical"           // vertical 실제 사용
  columns: ColumnDefinition[]
}
```

### Migration v80 (예상)
1. 각 article의 기존 `blocks[]` + `columnAssignments` → 각 leaf pane의 `blocks[]`로 분배
2. 빈 leaf pane은 `blocks: []`
3. `WikiArticle.columnAssignments` 필드 제거
4. `WikiArticle.blocks[]` 제거 (또는 derived getter로)

---

## 5. Phase 3 범위 (이번 PR)

### 포함
- [ ] 데이터 모델 전환 (`ColumnBlocksLeaf.blocks`, `ColumnDefinition.name/themeColor`)
- [ ] Migration v80
- [ ] 섹션 넘버링 pane별 독립 계산
- [ ] 컬럼 메뉴 ⋯ 신규 (Split H / V, Set name, Set color, Delete)
- [ ] 빈 컬럼 UX 정리 (AddBlock만)
- [ ] 컬럼 배경색/세로선 렌더
- [ ] Vertical split UI (`direction: "vertical"` 데이터 + 렌더)
- [ ] 1↔N 전환 경고창
- [ ] 컬럼 이름 인라인 편집
- [ ] `useWikiBlockActions` + 컴포넌트들 per-column API로 전환

### 제외 (Phase 3.1+ 이후로)
- Match heights (컬럼 간 높이 일치)
- Fill container (블록이 pane 가득 채우기)
- Explicit height 설정 (px/vh)
- 반응형 축약 (모바일에서 컬럼 자동 접힘)

### 제외 (Phase 4+ 이후로)
- 사용자 커스텀 템플릿 편집기 (Phase 4)
- Hatnote/Navbox/Callout 추가 블록 (Phase 5) — Phase 3 후 블록 타입 추가만 하면 됨

---

## 6. Phase 3.1 범위 (후속 PR, 잡지식 고도화)

- [ ] "Match heights" 옵션 (가로 컬럼들 높이 일치, CSS align-items: stretch)
- [ ] 이미지 블록 `fitMode: "content" | "fill"` 속성
- [ ] Pane `explicit height` (px/vh 지정 UI)
- [ ] Pane 배경 이미지 (선택적)

### Phase 3.1 동작 예시

> 사용자: 왼쪽 본문(텍스트) + 오른쪽 이미지 하나, 이미지가 왼쪽 높이만큼 꽉 차게

```
1. 컬럼 메뉴 ⋯ → "Match heights" 토글 (같은 행 컬럼들 높이 일치)
2. 이미지 블록 메뉴 → "Fill container" 토글
→ 자동으로 왼쪽 본문 길이에 오른쪽 이미지가 꽉 참
```

---

## 7. 영향받는 기존 Phase 재정렬

| Phase | 원래 계획 | 조정 |
|---|---|---|
| **Phase 3** | 노션식 블록 분기 (편집 UX) | **Multi-pane Document Model로 재정의** (이 문서) |
| **Phase 3.1** | 없음 | **잡지식 높이 고도화** (신규) |
| **Phase 4** | 사용자 커스텀 템플릿 편집기 | 유지. Phase 3 모델 위에서 구현 |
| **Phase 5** | 나무위키 잔여 블록 (Hatnote 등) | 유지. Phase 3 후 block type 추가만 |
| **Phase 6** | 편집 히스토리 | 유지 |
| **Phase 7** | 노트 split | 유지 |

Phase 5는 Phase 3 완료 후 **작아짐**. 블록 자유 배치가 per-column이라 Hatnote/Navbox를 추가해도 UX 고민 적음.

---

## 8. 열린 질문 (구현 시 결정)

- **컬럼 이름 편집 UX** — 컬럼 헤더 더블클릭? 컬럼 메뉴 안 입력? 헤더 항상 표시 vs hover?
- **컬럼 색 피커** — 8 프리셋 (Infobox headerColor와 동일?) + custom?
- **Split V 한 뒤 맨 아래 pane에도 AddBlock 노출?** — 예/아니오
- **1 pane 상태에선 컬럼 메뉴 ⋯ 숨김?** — 아니면 "Split H / V"만 노출?
- **경고창 구현** — shadcn `AlertDialog` 재사용 (이미 merge/split에 씀)
- **섹션 넘버링 pane별 독립 — "전체 1. ~ N." 합산 모드도 옵션으로?** — 기본 독립, 필요 시 추후

---

## 9. 구현 리스크

1. **Migration v80 손상 위험** — 기존 blocks[] + columnAssignments → per-column blocks 변환. 철저한 테스트 필요
2. **IDB 저장 구조 변경** — `plot-wiki-block-meta`가 article ID 기준이었는데 이제 (article, columnPath) 조합?
3. **WikiMergeSnapshot 재설계** — snapshot에 저장되는 `blocks[]`, `blockIds` 구조가 pane 구조 반영해야 함
4. **기존 renderer 대수술** — WikiArticleRenderer, ColumnRenderer, WikiBlockRenderer 전부 영향
5. **Phase 2-2-C 인프라 활용** — 메타=블록 결정은 그대로. 이 결정 덕분에 메타 자유 배치가 자연스러움

---

## 10. 사용자 확인 필요 (구현 전)

- [ ] 이 문서 전체 방향 동의
- [ ] 기존 Fleeting Note 등 seed 데이터 migration 후 예상 레이아웃 시뮬레이션
- [ ] Phase 3 PR 시작 시점 (지금? Phase 2-2-B-3-b + Phase 2-2-C 커밋 정리 후?)

---

## 참조

- 이 브레인스토밍의 모태: `BRAINSTORM-2026-04-14-column-template-system.md` ("2026-04-15 밤 대결정" 절에서 메타 → 블록 통합 결정, 그 후 per-column blocks 논의로 확장)
- Phase 2-2-C 구현 (메타 → 블록 통합): 완료. 이 문서는 그 **다음 단계**
- 사용자 인터뷰 (2026-04-15 밤): 스크린샷 기반 UX 문제 확인 + "잡지식 자유 배치" 비전 확정
