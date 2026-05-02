# 18. Home 대시보드 + 투두 — 남은 작업 목록

> 2026-03-31 세션에서 발견된 버그/미완성 항목

---

## Home 대시보드 카드 클릭 동작 (버그)

현재: 대부분의 카드가 `setActiveRoute("/notes")`만 호출 → 그냥 Notes 전체 리스트로 이동.

### 수정 필요

| 카드 | 현재 동작 | 올바른 동작 |
|------|---------|----------|
| Inbox | `/inbox` 이동 | ✅ 정상 |
| Review Due | `/notes` 이동 (필터 없음) | reviewAt ≤ today 노트만 필터링 |
| Edited Today | `/notes` 이동 (필터 없음) | 오늘 수정된 노트만 필터링 |
| Total Notes | 미동작 | `/notes` 이동 |
| Wiki Articles | 미동작 | `/wiki` 이동 |
| Orphans | 미동작 | Home 드릴다운 or 필터링 |
| Red Links | 미동작 | `/wiki` + Red Links 필터 or Home 드릴다운 |

### 근본 문제

Notes 뷰에 "외부에서 동적 필터를 전달하는" 인프라가 없음. URL 파라미터 or 글로벌 state로 필터를 주입해야 함.

### 해결 방향

1. `table-route.ts`에 `setInitialFilter(filters: FilterRule[])` 추가
2. Home 카드 클릭 → `setInitialFilter([{field: "updatedAt", operator: "eq", value: todayString}])` + `setActiveRoute("/notes")`
3. Notes 뷰가 `initialFilter`를 감지하면 적용 후 클리어

---

## 투두 시스템 고도화 (TickTick 수준)

### 현재 MVP 상태
- ✅ 체크박스 인덱싱 (contentJson → TaskIndex)
- ✅ Todo 뷰 (Incomplete/Completed 2섹션)
- ✅ 인라인 추가 (Quick Tasks 노트에 자동 추가)
- ✅ 체크 토글 (원본 노트 contentJson 업데이트)
- ✅ Calendar 공간 하위 배치

### 부족한 것 (TickTick 참고)
- ❌ dueDate 파싱 — `/tomorrow`, `/next monday` 등 자연어 날짜
- ❌ 시간 분류 — Today / Upcoming / Anytime / Someday (Things 3)
- ❌ 리스트(폴더) 연동 — 태스크를 폴더별로 분류
- ❌ 우선순위 — /p1~/p4 플래그
- ❌ 태스크 상세 패널 — 날짜, 설명, 우선순위 편집
- ❌ 사이드바 섹션 — Today(N) / Upcoming(N) / All Tasks(N) / 리스트별

### 구현 순서 (제안)
1. dueDate 파싱 (`lib/mention-date-parser.ts` 재활용)
2. TaskItem에 dueDate/priority 필드 추가
3. 사이드바 리디자인 (Today/Upcoming/All Tasks)
4. 태스크 상세 패널 (우측 사이드바 or 인라인)
5. Calendar 뷰에 태스크 날짜별 표시

---

## 인라인 쿼리 뷰 개선

### 현재 MVP 상태
- ✅ `/query` 슬래시커맨드
- ✅ 프리셋 피커 (Status/Folder/Label 선택)
- ✅ 설정 바 (Filter/Sort/Group) 호버-reveal
- ✅ Change query (프리셋 재선택)
- ✅ 경량 InlineQueryTable

### 부족한 것 (노션 수준)
- ❌ 뷰 전환 (Table → Board → Gallery)
- ❌ 뷰 탭 (같은 쿼리 데이터를 다른 레이아웃으로)
- ❌ Tags 프리셋 (폴더/라벨만 있고 태그 없음)
- ❌ "이 노트에 연결된 노트들" 프리셋
- ❌ 인라인 행 추가 (쿼리 결과에서 바로 새 노트 생성)
- ❌ Linked View (같은 쿼리를 여러 페이지에 독립 삽입)

---

## Home Intelligence Panel 사이드바

### 개별 항목 클릭 동작
- ✅ View all → Home 드릴다운 (상세 뷰)
- ✅ 개별 노트 클릭 → Notes 공간 전환 + 에디터 열기
- ❌ Unlinked Mentions 항목 클릭 → "Link" 액션 (위키링크 자동 생성)
- ❌ Suggestions Accept/Dismiss → 동작하지만 UI 피드백 약함

---

## Wiki Dashboard

- ✅ Coverage → Uncategorized 교체
- ✅ View all 버튼 (6개 초과 시)
- ❌ RECENT CHANGES 항목 클릭 → 해당 위키 열기 동작 확인 필요
- ❌ RED LINKS 항목 클릭 → 위키 생성 동작 확인 필요
