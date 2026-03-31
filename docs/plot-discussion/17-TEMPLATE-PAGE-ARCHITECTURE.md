# 17. Template Page Architecture — Activity Bar = System Template Pages

> 2026-03-31 대화 기반 정리

## 핵심 전환

```
Before: Activity Bar 5개 = "앱 기능" (Home, Notes, Wiki, Calendar, Ontology)
After:  Activity Bar 5개 = "시스템 기본 템플릿 페이지" + 유저 커스텀 페이지
```

노션처럼 모든 페이지가 블록 기반 캔버스이되, Plot은 **기본 템플릿 5개를 내재**하는 방식.

---

## 개념 모델

### 모든 것은 "페이지"

```
Home      = 대시보드 템플릿 페이지 (Today/Insights/Discover/Recent 블록)
Notes     = 노트 리스트 템플릿 페이지 (필터+테이블 블록)
Wiki      = 위키 대시보드 템플릿 페이지 (Overview+Articles+Categories 블록)
Calendar  = 캘린더 템플릿 페이지 (월간뷰+투두+일정 블록)
Ontology  = 그래프 템플릿 페이지 (노드맵+인사이트 블록)
```

### 시스템 페이지 vs 유저 페이지

| | 시스템 페이지 (5개) | 유저 페이지 |
|---|---|---|
| Activity Bar | 항상 상단 고정 | 아래 스크롤 영역 |
| 삭제 | 불가 | 가능 |
| 순서 변경 | 가능 | 가능 |
| 사이드바 | 템플릿별 전용 사이드바 | 템플릿 타입에 따라 결정 |
| 예시 | Home, Notes, Wiki, Calendar, Ontology | My Dashboard, Sprint Board |

### Activity Bar 스케일

- **시스템 5개**: 항상 상단 고정 (스크롤 밖)
- **유저 페이지**: 무제한 추가 가능, 스크롤 영역
- **드래그 순서 변경**: 유저 영역 내에서 가능
- **기능 저하 없음**: 아이콘 = 버튼이라 렌더링 영향 0. UX는 스크롤로 해결

---

## 사이드바 역할 정의

### 좌측 사이드바 = "페이지 사이드바"

페이지 템플릿이 사이드바 구성을 결정:

| 템플릿 타입 | 좌측 사이드바 내용 |
|---|---|
| 대시보드 | 위젯/인텔리전스 (Home Intelligence Panel) |
| 리스트 | 필터/폴더/뷰 (Notes 사이드바) |
| 위키 대시보드 | Overview/Merge/Split/Categories |
| 캘린더 | 미니캘린더/Today/Todos/Upcoming |
| 그래프 | 노드타입/필터/건강지표 |
| 빈 페이지 | 사이드바 없음 (메인 영역만) |

### 우측 사이드바 = "문서 사이드바"

열린 문서에 반응. 어떤 페이지(템플릿)에 있든 동일:

```
Detail      = 메타데이터 (status, folder, tags, labels)
Connections = 백링크 + 추천 (Connected + Discover)
Activity    = Thread + Reflection
Bookmarks   = 앵커/북마크
```

### 구분

```
좌측 = "지금 어떤 페이지에 있나"  (페이지 레벨, 템플릿이 결정)
우측 = "지금 어떤 문서를 보고 있나" (문서 레벨, 열린 노트가 결정)
```

---

## 블록 = 모든 것의 기본 단위

노션과 동일한 원칙: **페이지 안의 모든 것이 블록**

```
텍스트, 헤딩, 체크박스, 이미지, 테이블, 칸반, 캘린더,
인라인 쿼리 뷰, 투두 블록, 그래프 블록, 위젯 블록...
전부 TipTap 커스텀 노드(블록)로 존재
```

### 노션과의 차이

| | 노션 | Plot |
|---|---|---|
| 페이지 생성 | 빈 캔버스 → 유저가 블록 조합 | 빈 캔버스 + **기본 템플릿 5개 내재** |
| 인라인 DB | 유저가 스키마 설계 | **스키마 없는 쿼리 뷰** (기존 메타데이터 활용) |
| 투두 | 별도 시스템 없음 (체크박스 = DB 행) | 체크박스 인덱싱 → 투두 블록으로 모아보기 |
| 위키 | 없음 (페이지 = 위키) | 별도 WikiArticle 엔티티 (블록 기반 조립) |
| 온톨로지 | 없음 | 자동 관계 분석 + 그래프 시각화 |

### IKEA 전략 (기존 설계 유지)

```
노션 = 목공소 (진짜 자유, 근데 어려움)
Plot = IKEA (조합이 한정적이지만 충분히 예쁘고, 5분이면 완성)
```

기본 템플릿 5개가 IKEA의 "전시 세트" — 그대로 쓸 수 있고, 커스터마이즈도 가능.

---

## 투두 시스템 방향

### 현재 (MVP)
- 체크박스 = 에디터 블록 (TaskList/TaskItem)
- TodoIndex가 contentJson에서 자동 인덱싱
- /todos 뷰에서 모아보기 (Calendar 공간 하위)

### 향후 (템플릿 페이지 관점)
- "투두 블록" = 인라인 쿼리 뷰의 변형 (체크박스 필터)
- 아무 페이지에 투두 블록을 넣을 수 있음
- Calendar 템플릿 페이지에 기본 배치
- TickTick 수준의 분류: Today/Upcoming/Anytime/Someday (dueDate 파싱 필요)

---

## 구현 우선순위 (이 문서 기반)

이 아키텍처는 **점진적으로 구현 가능**:

1. ~~isWiki→noteType~~ ✅
2. ~~Home 공간 + Intelligence Panel~~ ✅
3. ~~인라인 쿼리 뷰 MVP~~ ✅
4. ~~투두 시스템 MVP~~ ✅
5. **Turn Into 메뉴** — 블록 타입 변환
6. **Notes→Pages 네이밍** — 기능이 워크스페이스급 된 후
7. **템플릿 갤러리 강화** — 새 페이지 생성 시 템플릿 선택 UX
8. **커스텀 페이지 핀** — Activity Bar에 유저 페이지 추가
9. **블록 위젯화** — 캘린더 블록, 그래프 블록 등 인라인 삽입 가능
10. **투두 고도화** — dueDate 파싱, Things 3식 분류, TickTick 수준 UI
