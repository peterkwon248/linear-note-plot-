# Plot — 사이드바 & 위키 재설계 브레인스토밍

작성일: 2026-03-18

## 1. 사이드바 재구성

### 현재 문제
- Notes 화면에 [All Notes] [Inbox] [Capture] [Permanent] [Unlinked] 5개 탭 하드코딩
- 커스텀 뷰 추가 불가
- 탭이 지저분함 (Status 필터 3개 + 전체 + 이질적인 Unlinked 혼재)

### 원자 단위 분석 (일론머스크식)

쪼갤 수 없는 원자:
- Note, Tag, Label, Template

쪼갤 수 있는 복합체:
- Folder = Note들의 묶음
- Ontology = Note + Relation의 시각화
- Insights = Note 속성의 집계

### 핵심 발견
"노트를 보여주는 모든 것 = 필터 뷰"

| 현재 섹션 | 실체 |
|-----------|------|
| Inbox | Notes + Status=Inbox |
| Notes | Notes + 필터 없음 |
| Pinned | Notes + Pinned=true |
| Trash | Notes + Deleted=true |
| Folder 클릭 | Notes + Folder=X |
| Tag 클릭 | Notes + Tag=X |
| Label 클릭 | Notes + Label=X |

### Tag / Label / Folder 구분 (확정)

| 축 | 질문 | 예시 |
|---|---|---|
| Tag | "뭘 다루나?" (what) | #AI, #비용, #디자인 |
| Label | "어떤 종류냐?" (how) | Memo, Idea, Research, Meeting |
| Folder | "어디 소속이냐?" (where) | AI 프로젝트, 회사업무, 개인 |

세 개는 완전히 다른 축. 전부 유지.

### 확정된 사이드바 구조

```
Inbox (3)          ← 독립, 최상단 (액션 포인트)
Notes              ← 메인 작업 화면 (Filter + Display)
Wiki               ← 위키 전용 뷰 ✅ 구현 완료
Views              ← 뷰 관리 페이지 (Linear 방식)

Folders
├── Projects
├── Daily Log

Tools
├── Tags
├── Labels
├── Templates
├── Ontology

──────────
🗑 Trash
⚙ Settings
```

### Inbox 독립 유지 이유
- 단순 필터 뷰가 아니라 "처리해야 할 것들"이라는 액션 포인트
- 배지 숫자가 바로 보여야 "3개 처리해야 하네" 인지 가능
- Linear도 Inbox는 최상단 독립

### Views 관리 페이지 (Linear A 방식)
- 사이드바에 커스텀 뷰가 직접 나열되지 않음 (사이드바 안 늘어남)
- Views 클릭 → 뷰 관리 화면 (목록, 생성, 삭제)
- 뷰 클릭 → 해당 필터 적용된 노트 리스트로 이동

### 뷰 권한 체계

| 구분 | 예시 | 삭제 | 필터 수정 | 순서 변경 |
|------|------|------|-----------|-----------|
| 시스템 뷰 | All, Inbox, Pinned | ❌ | 제한적 | ✅ |
| 커스텀 뷰 | "High Priority" 등 | ✅ | ✅ 전부 | ✅ |

### 제거 항목
- 하드코딩 탭 (All Notes/Inbox/Capture/Permanent/Unlinked) → Filter 칩으로
- Quick Filters → Views 시스템 뷰로
- Calendar, Insights → 당장 불필요, 나중에 추가

## 2. Filter / Display / Layout 정리

### Filter (확정)
```
Status (Inbox / Capture / Permanent)
Priority
Folder
Label
Tags
Source
Dates
Links
Content
Pinned
```
→ Quick Filters 제거 (Views 시스템 뷰로 이동)

### Display (확정)
```
View Mode: List / Board
Layout: Single / Split / Panels
Grouping
Ordering
Show empty groups
Display properties
```
→ Insights, Calendar 제거 (독립 Tool로 이동 또는 제거)
→ Layout을 Display 안에 통합 (별도 스위처 불필요)

### Layout을 Display에 통합한 이유
- Layout은 "있으면 편리한" 수준 (핵심 기능 아님)
- Display 안에 넣으면 버튼이 하나 줄어듦 ([Filter] [Display] 만으로 충분)
- 파워유저 기능이니까 Display 안에 숨겨도 됨
- Linear도 List/Board를 Display 안에 넣음

### 콘텐츠 헤더 최종 형태
```
[뷰 이름]                              [Filter] [Display]
```
→ 사이드바에서 레이아웃 스위처 제거

### 뷰마다 독립 저장 (미결정)
- All Notes 뷰 → Three-column, Priority순
- Inbox 뷰 → Focus
- 커스텀 "Research" 뷰 → Split, 날짜순

## 3. Wiki 재설계

### 현재 상태
- isWiki 플래그, convertToWiki, createWikiStub 기능 구현 완료
- WikiTOC, WikiInfobox, WikiCategories 컴포넌트 존재
- ✅ Wiki 사이드바 섹션 추가 완료 (2026-03-18)
- ❌ 위키 전용 대시보드/인터페이스 없음

### 위키의 본질
위키 = 완성된 문서가 아니라 "살아있는 수집함"

기존 앱들의 한계:
- 나무위키: 완성된 문서만 존재
- Obsidian: 노트 파일 하나가 전부
- Notion: 페이지 안에 다 넣어야 함

Plot 위키: "아직 정리 안 됐지만 이 주제에 관련된 것"을 빠르게 던져놓을 수 있어야 함

### 위키 수집 워크플로우
```
1. 길가다 사진 찍음 → "PER 분석법" 위키에 던짐
2. 관련 기사 봄 → 링크 던짐
3. 생각 떠오름 → 메모 던짐
4. 나중에 시간 날 때 → 본문에 정리
5. (또는) 앱이 규칙에 따라 자동 정리/배치
```

### 자동 배치 규칙

| 던진 타입 | 자동 배치 위치 | 표시 방식 |
|----------|--------------|----------|
| 이미지 (첫 번째) | 대표 이미지 블록 | 인포박스 옆 |
| 이미지 (2장+) | 갤러리 블록 | 그리드 |
| 텍스트 메모 | 본문 마지막 섹션에 append | 단락 |
| URL | 각주/참고자료 블록 | 링크 카드 (OG 미리보기) |
| 첨부 파일 | 각주/참고자료 블록 | 파일 아이콘 + 이름 |
| [[위키링크]] | 관련 문서 블록 | 자동 수집 |

### 위키 블록 구조 (나무위키 스타일)

```
┌─────────────────────────────────────────┐
│ PER (주가수익비율)                  [편집] │
├─────────────────────────────────────────┤
│ [대표 이미지]  분류: 투자지표             │
│               관련: PBR, ROE            │
├─────────────────────────────────────────┤
│ 목차 (자동 생성)                         │
│ 1. 개요  2. 계산법  3. 활용  4. 한계     │
├─────────────────────────────────────────┤
│ 1. 개요                                 │
│ 주가를 주당순이익으로 나눈 값...           │
│                                         │
│ [갤러리: 관련 이미지들]                   │
│                                         │
│ 2. 계산법                               │
│ PER = 주가 / EPS                        │
├─────────────────────────────────────────┤
│ 관련 문서                               │
│ [[FCF 가치평가]] · [[PBR]] · [[삼성전자]] │
├─────────────────────────────────────────┤
│ 각주/참고자료                            │
│ [1] https://article.com/per-guide       │
│ [2] valuation-models.pdf                │
└─────────────────────────────────────────┘
```

### TipTap 구현 방향

| 블록 | TipTap 구현 | 상태 |
|------|------------|------|
| 헤더 | Heading + InfoboxNode | ✅ WikiInfobox 있음 |
| 대표 이미지 | ResizableImage | ✅ 있음 |
| 목차 | WikiTOC | ✅ 있음 |
| 본문 | paragraph/heading nodes | ✅ 있음 |
| 갤러리 | custom GalleryNode | ❌ 새로 만들어야 함 |
| 관련 문서 | custom RelatedDocsNode | ❌ 새로 만들어야 함 |
| 각주 | custom FootnotesNode | ❌ 새로 만들어야 함 |

### 위키 전용 인터페이스 (TODO)
- 위키 대시보드 (최근 변경, 인기 문서, 카테고리)
- 위키 읽기 전용 탐색 모드 (에디터 없이 문서만 넘기기)
- 위키 전용 레이아웃 (왼쪽 TOC + 가운데 본문 + 오른쪽 관련 문서)

### 온톨로지와의 관계
- 온톨로지 그래프에서 위키 노드는 이미 별도 스타일로 표시 (이중 링 + W 배지)
- 위키가 온톨로지의 앵커 역할 → 일반 노트들이 위키로 연결되면서 지식 구조 가시화
- 위키 노트가 많아질수록 온톨로지가 더 의미 있어짐

## 4. 미결정 사항

- 커스텀 뷰의 필터 조건 범위 (전부 열지, 단계적으로 열지)
- 뷰마다 Display/Layout 독립 저장 여부
- "Save as View" UX 디테일
- Folders 안에서도 Filter/Display 사용 가능하게 할지
- Tags/Labels 클릭 시 동작 (필터 적용된 뷰 자동 이동 vs 관리 화면 유지)
- 위키 자동 배치 AI/규칙 엔진 상세 설계
- 위키 수집 모드 모바일 UX
