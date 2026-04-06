# Plot Brainstorming — 2026-04-06

## 합의된 사항

### 1. Thread 풀페이지 뷰
- Thread 데이터는 동일, **뷰만 2개**: 사이드바(기존) + 풀페이지(펨코식 코멘트 뷰)
- Side Panel Activity 탭에서 "Open full" 버튼으로 풀페이지 전환
- 별도 Comment 엔티티는 만들지 않음 — Thread가 양쪽 역할
- **미결**: 풀페이지 Thread 뷰의 구체적 레이아웃 (본문 아래? 별도 페이지?)

### 2. 각주 (Footnote) 노드
- 나무위키 방식: 본문에 `[1]` 인라인 마크 + 하단 각주 목록
- 호버 → 말풍선으로 내용 표시
- 클릭 → 하단 각주 목록으로 스크롤 점프
- 참조(reference)와 주석(footnote)을 **하나의 footnote 노드로 통합**
- 내용이 URL이면 참조, 텍스트면 주석 — UI 구분 없음
- 각주 안에 노트/위키 링크 + 요약 가능 → 인라인 딕셔너리 역할
- 구현: TipTap `footnote` mark + `footnoteList` node

### 3. 딕셔너리 → 별도 공간 불필요
- 위키 stub/짧은 문서가 사실상 딕셔너리
- 각주 안에 위키링크 + 요약 넣으면 인라인 딕셔너리
- 별도 Dictionary 공간 만들지 않음

### 4. Library = Activity Bar 6번째 공간
- 이미지 + 파일 + URL 북마크 전용 공간
- **독립 엔티티** — 노트에 "붙어있는" 게 아니라 노트보다 먼저 존재할 수 있음
- 사용 시나리오: 폰으로 사진 찍어 저장 → 나중에 노트/위키에서 꺼내 씀
- 드래그 또는 슬래시 명령어로 노트/위키에 삽입
- Activity Bar: Home / Notes / Wiki / Calendar / Ontology / Library

### 5. 멀티 링크 (Alias + 동음이의어)
- aliases 이미 있음 (WikiArticle.aliases)
- **추가 필요**: 동음이의어 해소 페이지
  - "아브라"가 여러 문서에 매칭 → 나무위키처럼 선택 화면
  - 또는 동음이의어 전용 위키 문서 (disambiguation page)

### 6. Side Panel 풀페이지 확장
- 모든 Side Panel 탭에 "Open full" 버튼 추가
- 사이드바가 기본, 유저가 원하면 풀페이지

| 탭 | 사이드바 | 풀페이지 |
|----|---------|---------|
| Detail | 메타데이터 | 메타데이터 + 편집 |
| Connections | 연관 목록 | 연관 그래프 + 목록 |
| Activity | Thread 짧게 | Thread 전체 (코멘트뷰) |
| Peek | 미리보기 | 불필요 (Open = 풀페이지) |
| Bookmarks | 앵커 목록 | 앵커 + 컨텍스트 |

### 7. LLM 없이 요약 — 전부 구현
- 첫 N문장 추출 (첫 2~3문장)
- 키워드 추출 (TF-IDF, FlexSearch 인덱스 활용)
- 헤딩 목차 (h2/h3 필터)
- 하이라이트 집계 (유저가 볼드/하이라이트한 부분)
- 링크 밀도 (위키링크/멘션 많은 문단 = 핵심)
- 최근 편집 구간
- 백링크 기반 중요도
- 태그 공출현
- 첫 문장 + 마지막 문장

### 8. 인포박스 고도화 → 나무위키 프로필 수준
- 대표 이미지 필드 추가
- 섹션 구분 행 (배경색 헤더)
- 접기/펼치기 토글
- 셀에 위키링크 삽입 가능

### 9. 나무위키 틀(템플릿) 시스템

| 틀 유형 | 현재 | 필요 작업 |
|---------|------|---------|
| 프로필 카드 | 인포박스 (기본) | 이미지+섹션+접기 고도화 |
| 계보/계승 테이블 | 없음 | 테이블 + 배경색 + 위키링크 조합 |
| 네비게이션 박스 | 없음 | 커스텀 TipTap 노드 or 카테고리 활용 |
| 시리즈 박스 | 없음 | 카테고리 기반 자동 수집 그리드 |
| 접기/펼치기 | Details/Toggle | 이미 있음 |
| 안내 배너 | Callout | 이미 있음 |
| 인용문 | WikiQuote | 이미 있음 |

## WikiEmbed + 변환 함수

### WikiEmbed (라이브 참조)
- TipTap node view로 `articleId`만 저장
- 렌더링 시 `WikiArticleEncyclopedia` 컴포넌트 그대로 렌더 (읽기 전용)
- 위키 원본 수정하면 자동 반영
- NoteEmbed 패턴 동일

### 변환 함수 (복사)
- 위키 데이터(WikiBlock[]) → TipTap JSON 변환
- 독립 사본으로 노트에 삽입, 편집 가능
- 위키에 새 블록 타입 추가 시 매핑만 추가하면 확장 가능

### Quote 개선
- 위키 프리뷰에서 Quote 버튼 활성화 (완료)
- 위키에서는 "select all" 스킵 → 드래그 선택 필수
- 선택한 텍스트만 WikiQuote로 삽입

## 구현 순서

```
Phase 1 (현재): WikiEmbed + Quote 개선
Phase 2: 각주 (footnote) 노드
Phase 3: 인포박스 고도화 (이미지 + 섹션 구분 + 접기)
Phase 4: 나무위키 틀 (네비게이션 박스, 계보 테이블)
Phase 5: Library (6번째 공간)
Phase 6: Side Panel 풀페이지 확장 (Thread 포함)
Phase 7: 요약 엔진 (첫 N문장 + 키워드 + 목차)
Phase 8: 동음이의어 해소 페이지
```
