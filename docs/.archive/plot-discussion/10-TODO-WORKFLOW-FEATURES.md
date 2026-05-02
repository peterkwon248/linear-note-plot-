# 투두 시스템 & 워크플로우 & 타 앱 킬러 기능 믹스

> 2026-03-30 대화 기반 정리

---

## 투두 = 새 엔티티가 아니라 노트의 파생 데이터

### 원칙

노트 안의 체크박스(TaskList)를 **인덱싱**해서 뷰로 올리는 것. 별도 Task 엔티티 불필요.

```
유저가 아무 페이지에서든 체크박스 쓰면 →
시스템이 자동 수집 →
Todo 뷰에서 전체 투두를 한눈에 관리
```

### 구현: TaskIndex (캐시/파생 데이터)

```typescript
interface TaskIndex {
  id: string              // 자동 생성
  noteId: string          // 원문 노트
  text: string            // 체크박스 텍스트
  completed: boolean      // 체크 여부
  dueDate: string | null  // 자연어 파싱 결과
  priority: number        // /p1~/p4
  sectionHeading: string | null  // 상위 헤딩
  position: number        // 노트 내 순서
}
```

- 노트 contentJson 파싱 → TaskList 노드 추출 → 인덱스 업데이트
- 인덱스 깨지면? 재빌드하면 끝. 원본은 노트 하나뿐
- view-engine에 `context: "todo"` 추가 → 기존 파이프라인 재활용

### 이 방식의 장점

```
위험한 방식:  Task (새 엔티티) ←→ Note (양방향 관계 관리)
             삭제 시 양쪽 동기화, migration 필요

안전한 방식:  Note.contentJson 파싱 → TaskIndex (캐시)
             노트 저장 시 재생성. 원본은 노트 하나뿐.
```

---

## 투두앱 킬러 기능 믹스

### Things 3 — 시간 기반 4분류

```
Today     = 날짜가 오늘 or 오버듀
Upcoming  = 날짜가 이번 주
Anytime   = 날짜 없음 + 미완료
Someday   = /someday 태그 or 스누즈된 것
```

유저는 체크박스에 날짜만 붙이면 됨. 분류는 시스템이 자동.

### Todoist — 자연어 날짜

`mention-date-parser.ts`가 이미 있으므로:
```
- [ ] 보고서 작성 /tomorrow
- [ ] 면접 준비 /next monday
- [ ] 세금 신고 /4월 15일
```

### Todoist — 우선순위 플래그

P1(빨강) / P2(주황) / P3(파랑) / P4(없음). 에디터에서 `/p1` 치면 해당 태스크에 플래그.

### TickTick — 뽀모도로 내장

특정 태스크에 타이머 연결. 완료 후 소요 시간 기록. noteEvents에 `focus_started / focus_ended` 추가.

### TickTick — 습관 히트맵

반복 체크리스트 완료 데이터를 GitHub 스타일 히트맵으로 시각화.

### Linear — 사이클/스프린트

주 단위 목표 설정. 미완료 → 다음 주 자동 이월. Autopilot `on_weekly` 트리거.

---

## 온톨로지 통합 — 투두가 그래프에 들어가면

```
그래프에서 보이는 것:

   [프로젝트A 페이지] ←── extends ──→ [위키:React]
         │                              │
    has-task                       referenced-by
         │                              │
   [□ API 설계]                  [프로젝트B 페이지]
         │
    depends-on
         │
   [□ DB 스키마]
```

Insights에서:
- "미완료 태스크가 가장 많은 페이지 TOP 5"
- "이 위키와 연결된 미완료 태스크 N개"
- "지난 달 대비 태스크 완료율 변화"

**Todoist, Things, TickTick 다 못 하는 것.** 투두앱들은 태스크가 고립된 아이템. Plot에선 태스크가 지식 그래프의 노드.

---

## 타 앱 킬러 기능 — ROI 순

### Capacities

| 기능 | Plot 적용 | 구현 비용 |
|------|----------|----------|
| Turn Into Type (타입 전환) | Label 뱃지 클릭 → 드롭다운에서 전환 | 낮음 (UI만) |
| Unlinked Mentions 서페이싱 | Home Discover 섹션에서 표면 노출 | 낮음 (이미 있음) |
| 시맨틱 관련 콘텐츠 추천 | Side Panel Discover 탭 강화 | 낮음 (이미 있음) |

### Logseq

| 기능 | Plot 적용 | 구현 비용 |
|------|----------|----------|
| 인라인 쿼리 블록 | `/query` 슬래시 커맨드 → 뷰 엔진 결과 렌더 | 중간 |
| 블록 레퍼런스 | 앵커 시스템 확장 → 문단 단위 참조 | 중간 |

### Bear / Craft / UpNote

| 기능 | Plot 적용 | 구현 비용 |
|------|----------|----------|
| 타이포 프리셋 (Serif/Sans/Mono) | CSS 변수 3세트 + Settings 토글 | 매우 낮음 |
| 문서 커버 이미지 | Note 메타에 `coverImage` 추가 | 낮음 |

### Apple Notes

| 기능 | Plot 적용 | 구현 비용 |
|------|----------|----------|
| 스마트 폴더 | SavedView를 사이드바에서 폴더와 동급 표시 | 낮음 (이미 있음) |
| Quick Note (0.5초 캡처) | 글로벌 단축키 → 미니 입력창 | 중간 |

### Tana

| 기능 | Plot 적용 | 구현 비용 |
|------|----------|----------|
| 태그 템플릿 (Supertag) | Tag에 `templateId` 필드 추가. 태그 달면 "이 템플릿 적용할까요?" 제안 | 낮음 |

### Readwise Reader

| 기능 | Plot 적용 | 구현 비용 |
|------|----------|----------|
| 하이라이트 파이프라인 | 웹 클리퍼 하이라이트 → WikiQuote로 저장 | 중간 (웹클리퍼 전제) |

---

## 워크플로우 기능

### 리마인더 / 스누즈

`/remind tomorrow` → `reviewAt` 필드 재활용 + `mention-date-parser.ts` 연결. Home에 표시.

### 반복 루틴 (Habit Tracker 라이트)

데일리 노트 + 태그 템플릿 조합. Autopilot으로 "데일리 노트 생성 시 → #morning-routine 태그 자동 추가" 설정.

### SRS 플래시카드 뷰

에디터에서 `::앞면::뒷면::` 마크업 → Review 모드에서 플래시카드 UI. SRS 엔진 재활용.

### 글쓰기 통계 대시보드

오늘 쓴 단어 수, 이번 주 작성 페이지 수, 연속 작성 일수. noteEvents 집계 쿼리만 추가.

### 포커스 모드 타이머

`/focus 25min` → 사이드바 닫힘, 25분 타이머, 토스트 알림. setTimeout + UI 상태 토글.

### 지식 성숙도 시각화

"작성 횟수 × 링크 수 × 읽기 횟수"로 성숙도 점수 → 리스트에서 색상 강도로 표시.

### 인용 네트워크 (Citation Graph)

WikiQuote 생성 시 자동으로 `inspired-by` relation 추가. 그래프에서 인용 방향 표시.

### 블록 클리핑 보드

에디터에서 블록 우클릭 → "Save to Clipboard" → 다른 페이지에서 `/paste-clip`.

### 읽기 진행률

"읽기 시작 / 읽는 중 / 완독" 상태. Autopilot으로 "3번 이상 열면 → 읽는 중" 자동 세팅.

---

## Autopilot 확장

### 시간 기반 트리거 추가

```
on_daily       → 매일 아침 (데일리 노트 생성, Inbox 리마인드)
on_weekly      → 주간 요약 생성
on_idle_7d     → 7일 안 열린 노트에 자동 액션
on_stale_30d   → 30일 방치 → Ghost Node 전환 제안
```

### 워크플로우 체인 (규칙 시퀀스)

```
Inbox 노트 → 3일 경과 → 자동 스누즈
          → 7일 경과 → 트리아지 리마인드
          → 30일 경과 → Trash 제안
```

### 주간/월간 다이제스트 자동 생성

`on_weekly` 트리거로 "이번 주 생성 N개, 연결 N개, 성장 위키 N개" 노트 자동 생성.

---

## 연결 / 통합

### 로컬 API (인풋 전용)

`POST /api/capture` → Inbox에 페이지 생성. Shortcuts, Raycast, Alfred, 북마클릿에서 호출.

### Share Target (PWA)

모바일에서 "공유" → Plot Inbox 직행.

---

## 버그 방어 전략

### 4가지 원칙

1. **새 엔티티 최소화** → 파생 데이터(인덱스/캐시)로 대체
2. **기능 토글** → 안 쓰는 기능은 결합 자체를 끊음 (Plane 방식)
3. **레이어 규칙** → 하위→상위 참조 금지
4. **핵심 경로 테스트** → 연쇄 삭제 + 마이그레이션

### 기능 토글 예시

```
Settings:
☑ Pages (끌 수 없음)
☑ Wiki
☐ Todo (기본 꺼짐)
☐ SRS
☐ Autopilot
☐ Thread
☐ Ontology Graph
```

꺼진 기능은 슬라이스 초기화 안 하고, 컴포넌트 lazy import 안 하고, 이벤트 리스너 안 걸면 결합 자체가 발생 안 함.

### 레이어 규칙

```
OK:  Home → Pages 데이터 읽기 (상위가 하위를 읽음)
OK:  Todo → Pages.contentJson 파싱 (상위가 하위를 읽음)
BAD: Pages → Todo 완료율 참조 (하위가 상위를 읽음)
BAD: Autopilot → UI 상태 직접 변경
```
