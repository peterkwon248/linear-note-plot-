# Plot 기능 카탈로그 — 지식관리 & 워크플로우 & 자동화

> 2026-03-30 대화 기반 전체 정리.

---

## 지식관리 / 온톨로지

| 기능 | 설명 | 구현 비용 | 기존 인프라 |
|------|------|----------|-----------|
| Turn Into Type (Label 전환) | 페이지 상단 Label 뱃지 클릭 → 드롭다운 전환 | 낮음 | Label 시스템 |
| 태그 템플릿 (Supertag) | 태그에 templateId 연결. 태그 달면 "이 템플릿 적용할까요?" 제안 | 낮음 | Tag + Template |
| Unlinked Mentions 서페이싱 | Home Discover에서 적극 표면 노출 | 낮음 | unlinked-mentions 이미 있음 |
| 시맨틱 관련 콘텐츠 추천 (More Like This) | Side Panel Discover에서 현재 페이지 기준 유사 페이지 5개 | 낮음 | Discover 엔진 |
| MOC 자동 생성 (Map of Content) | 태그/폴더의 모든 페이지를 목차로 자동 정리 | 낮음 | Autopilot + 인라인 쿼리 |
| 인용 네트워크 (Citation Graph) | WikiQuote 생성 시 자동 `inspired-by` relation 추가. 그래프에서 방향 표시 | 낮음 | WikiQuote + Relations |
| 지식 성숙도 시각화 | "작성 횟수 × 링크 수 × 읽기 횟수" → 리스트에서 색상 강도 표시 | 매우 낮음 | reads + linksOut |
| 중복 페이지 감지 | 비슷한 제목/내용의 페이지 자동 발견 → "합칠래?" 제안 | 낮음 | co-occurrence + Levenshtein |
| 블록 레퍼런스 (앵커 참조) | 특정 앵커 포인트를 다른 페이지에서 참조 | 중간 | 앵커 시스템 확장 |
| SRS 플래시카드 뷰 | `::앞면::뒷면::` 마크업 → 플래시카드 UI로 복습 | 중간 | SRS 엔진 재활용 |
| 읽기 진행률 / 상태 추적 | "읽기 시작/읽는 중/완독" 상태. Autopilot으로 자동 세팅 가능 | 낮음 | 메타 필드 |
| 네트워크 중심성 분석 | "어떤 페이지가 허브인지" degree centrality 계산 | 낮음 | 그래프 데이터 |
| 지식 갭 분석 | 카테고리별 문서 수 불균형 감지 → 보강 제안 | 낮음 | 카테고리 count() |
| 태그 트렌드 차트 | 태그별 사용량 변화 라인 차트 | 낮음 | noteEvents 집계 |
| 작성 패턴 히트맵 | GitHub contribution 스타일 365일 히트맵 | 낮음 | noteEvents 날짜별 카운트 |
| 역방향 검색 | "이 페이지가 어떤 검색어로 발견되는지" | 중간 | 역인덱스 |

---

## 투두 / 태스크 관리

| 기능 | 설명 | 구현 비용 | 기존 인프라 |
|------|------|----------|-----------|
| 체크박스 인덱싱 (TaskIndex) | 모든 페이지의 체크박스 자동 수집 → 통합 투두 뷰 | 낮음 | TaskList 파싱 + view-engine |
| Things 4분류 | Today/Upcoming/Anytime/Someday 자동 분류 | 낮음 | dueDate 기반 |
| 자연어 날짜 (`/tomorrow`) | 체크박스에 날짜 자연어 파싱 | 낮음 | mention-date-parser 재활용 |
| 우선순위 플래그 | P1(빨강)/P2(주황)/P3(파랑)/P4 컬러 점 | 낮음 | TaskIndex priority |
| 뽀모도로 태스크 연결 | 특정 태스크에 타이머 붙이기 → 소요 시간 기록 | 낮음 | noteEvents focus |
| 습관 히트맵 | 반복 체크리스트 완료율 → GitHub 스타일 히트맵 | 중간 | noteEvents |
| 사이클/스프린트 | 주 단위 목표. 미완료 → 다음 주 이월 | 중간 | Autopilot on_weekly |
| 리마인더 (`/remind`) | `/remind tomorrow` → reviewAt + Home 표시 | 낮음 | reviewAt + 날짜파서 |
| 마감일 시각화 | 오버듀→빨강, 오늘→주황, 여유→초록 그라데이션 | 매우 낮음 | TaskIndex dueDate |
| 반복 루틴 (Habit Tracker) | 데일리 노트 + 태그 템플릿 조합 | 낮음 | 데일리노트 + 태그템플릿 |
| Recurrence (반복 스케줄) | "매주 월요일 이 페이지 복제해서 Inbox에" cron식 | 중간 | Autopilot on_schedule |

---

## Autopilot 확장 (자동화)

| 기능 | 설명 | 구현 비용 |
|------|------|----------|
| on_daily 트리거 | 매일 아침 (데일리 노트 생성, Inbox 리마인드) | 낮음 |
| on_weekly 트리거 | 주간 요약 생성 | 낮음 |
| on_monthly 트리거 | 월간 리포트 자동 생성 | 낮음 |
| on_idle_7d 트리거 | 7일 안 열린 페이지에 자동 액션 | 낮음 |
| on_stale_30d 트리거 | 30일 방치 → Ghost Node 전환 제안 | 낮음 |
| on_schedule (cron) | 사용자 정의 스케줄 | 중간 |
| 워크플로우 체인 | 규칙 시퀀스: Inbox 3일→스누즈→7일→리마인드→30일→Trash 제안 | 중간 |
| 주간 다이제스트 자동 생성 | "이번 주 생성 N개, 연결 N개, 성장 위키 N개" 페이지 자동 생성 | 낮음 |
| 월간 리포트 자동 생성 | 작성량 + 태그 분포 + 그래프 성장 + 완료 태스크 합본 | 낮음 |
| 쓰레기통 자동 비우기 | 30일 이상 쓰레기통 페이지 자동 삭제 | 매우 낮음 |
| 자동 최적화 제안 | 30일+ 미열람 페이지 이미지 압축 / 미사용 첨부파일 정리 제안 | 낮음 |

---

## 워크플로우 / 생산성

| 기능 | 설명 | 구현 비용 | 기존 인프라 |
|------|------|----------|-----------|
| 데일리 노트 | Calendar 날짜 클릭 → 해당 날짜 페이지 자동 생성/열기 | 낮음 | Calendar + 템플릿 |
| Quick Capture | 글로벌 단축키 → 미니 입력창 → Inbox 직행 | 중간 | PWA |
| 웹 클리퍼 | 브라우저 익스텐션으로 페이지/선택 텍스트 → Inbox | 중간 | Note.source "webclip" |
| 시간 추적 (페이지별) | 페이지 열고 있는 시간 자동 기록 → Insights TOP 5 | 낮음 | noteEvents opened/closed |
| 포커스 세션 기록 | 뽀모도로 결과 누적. "이번 주 집중 14시간" | 낮음 | noteEvents focus |
| 글쓰기 통계 대시보드 | 오늘 단어 수, 이번 주 페이지 수, 연속 작성 일수 | 낮음 | noteEvents 집계 |
| 스트릭 / 게이미피케이션 | 연속 작성 일수, 성취 뱃지. Home 카드 | 낮음 | noteEvents |
| 블록 클리핑 보드 | 블록 우클릭 → "Save to Clipboard" → 다른 페이지에서 `/paste-clip` | 중간 | 별도 store |
| 타임스탬프 삽입 | `/now` → 현재 날짜/시간 인라인 삽입 | 매우 낮음 | 날짜 파서 |
| 배치 작업 (Bulk Actions) | 여러 페이지 선택 → 일괄 태그/폴더/Label 변경, 일괄 삭제 | 중간 | store 함수 |
| 머지 (일반 페이지) | 두 페이지 합치기. 위키 Merge 확장 | 낮음 | 위키 Merge 재활용 |
| 스플릿 (일반 페이지) | 긴 페이지를 Heading 기준 분할 | 낮음 | 위키 Split 재활용 |
| 페이지 비교 (Diff 뷰) | 두 페이지/버전 나란히 차이점 하이라이트 | 중간 | diff 알고리즘 |
| "오늘 뭐 했지?" 타임라인 | Home에 오늘 활동 시간순 나열 | 낮음 | noteEvents 렌더링 |
