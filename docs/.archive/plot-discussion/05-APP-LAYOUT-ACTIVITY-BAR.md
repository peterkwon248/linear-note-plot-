# 앱 레이아웃 구조 & Activity Bar 최종 설계

> 2026-03-30 대화 기반 정리

## 레이아웃 뼈대 — Plane에서 가져온 구조

```
┌──────────────────────────────────────────────────────┐
│ Activity Bar │ 좌측 사이드바 │    메인 스페이스    │ 우측 │
│  (아이콘)    │  (내비게이션)  │  (에디터/리스트)   │ 패널 │
│              │               │                    │      │
│   Home       │  [Inbox]      │                    │Detail│
│   Notes      │  [Capture]    │                    │Conn. │
│   Wiki       │  [Permanent]  │                    │Activ.│
│   Calendar   │  [Pinned]     │                    │Peek  │
│   Graph      │  [Folders...] │                    │Book. │
│              │  [Views...]   │                    │      │
└──────────────────────────────────────────────────────┘
```

### Plane → Plot 매핑

| Plane | Plot | 비고 |
|-------|------|------|
| Your Work (Home) | **Home** | 오늘 할 일 + Insights + Discover |
| Projects 사이드바 | **Notes/Wiki 사이드바** | 폴더/뷰 내비게이션 |
| Work Items 메인 | **메인 스페이스** | 리스트/보드/에디터 |
| 우측 Peek/Detail | **SmartSidePanel** | 5탭 컨텍스트 패널 |
| Intake/Triage | **Inbox (Home에 흡수)** | 미처리 노트 트리아지 |
| Pages/Wiki | **Wiki 공간** | 지식 정리 |

### 근본 구조를 바꿀 필요가 없는 이유

Activity Bar → 사이드바 → 메인 → 우측 컨텍스트 패널 구조는 Linear, VS Code, Figma, Arc Browser, Plane 등 검증된 패턴. "정답에 가까운 레이아웃"이므로 바꿀 이유 없음. **바꿔야 할 건 각 칸에 뭐가 들어가느냐.**

---

## Activity Bar 변경 — Inbox 제거, Home 추가

### Before → After

```
Before:  Inbox / Notes / Wiki / Calendar / Graph  (5개)
After:   Home / Notes / Wiki / Calendar / Graph    (5개)
```

### Inbox 독립 공간에서 제거하는 이유

- Linear에서 Inbox가 최상위인 이유는 **팀 협업 알림**이 들어오기 때문
- Plot은 **싱글 유저** → 외부에서 들어오는 게 없음
- Inbox의 역할 "아직 정리 안 한 노트를 트리아지하는 곳"은 **워크플로우 모드**이지 **데이터 공간**이 아님
- Home에 Inbox 미처리 카드가 있고, 한 번 클릭으로 트리아지 모드 진입 가능하면 독립 공간 불필요

### Inbox의 새 위치

Notes 공간 사이드바의 첫 번째 항목:
```
Notes 사이드바 = [Inbox] [Capture] [Permanent] [Pinned] [Folders...] [Views...]
```

---

## Home 공간 설계 — "오늘의 조종석"

### Home = Insights + Discover + Today + Inbox 요약

```
Home 구성:

┌─ Today ──────────────────────────────┐
│ 데일리 노트 + 오늘 수정한 노트들      │
│ SRS 리뷰 대기 N개                     │
│ Inbox 미처리 N개 → 클릭시 트리아지     │
└──────────────────────────────────────┘

┌─ Insights (온톨로지에서 승격) ────────┐
│ 지식 건강 점수 / 고립 노트 N개        │
│ 관계 밀도 / 클러스터 성장 추이         │
│ "이 노트들 연결해보세요" 추천          │
└──────────────────────────────────────┘

┌─ Discover ────────────────────────────┐
│ 오늘의 재발견 1~2개                   │
│ 위키 stub → article 승격 후보         │
│ Unlinked mentions 제안                │
└──────────────────────────────────────┘

┌─ Recent ──────────────────────────────┐
│ 최근 열어본 노트/위키 5~7개           │
└──────────────────────────────────────┘
```

### Insights가 Home으로 오는 이유

- Insights가 Graph 공간 안에 있으면 "일부러 Graph 들어가야 볼 수 있는 분석 리포트"
- Insights의 본질은 **"네 지식에 이런 기회/문제가 있어"**라는 넛지 → 앱 열자마자 보여야 의미 있음
- Home에서 Insights 카드 보고 "고립 노트 12개" 클릭 → Graph로 이동해서 해당 노트들 하이라이트
- **Home이 발견, Graph가 행동** 흐름

### Graph에서 Insights가 빠지면

Graph는 **순수하게 "관계 탐색 도구"**가 됨:
- 노드 클릭하고 연결 따라가고 패턴 발견하는 인터랙티브 공간
- 분석 대시보드 없이 → 오히려 정체성이 더 명확

---

## Activity Bar 5개 스페이스 최종 정의

| Space | 역할 | 데이터 관점 |
|-------|------|------------|
| **Home** | 오늘의 조종석. 뭘 할지 정리하고 추천 | Today + Insights + Discover + Recent |
| **Notes** | 캡처/정리 공간. Inbox 포함 | notes (status 기반 필터 뷰) |
| **Wiki** | 지식 정리 공간 | wikiArticles (또는 통합 후 Label 필터) |
| **Calendar** | Cross-Space 시간 대시보드 | 전체 엔티티의 시간축 투영 |
| **Graph** | 관계 탐색 도구 (순수 시각화) | 전체 엔티티의 관계축 투영 |

### 5개 유지 판단 근거

- Calendar와 Graph는 데이터를 "다른 차원"으로 보는 것 → 독립 공간 확실
- Notes와 Wiki는 통합 엔티티로 가더라도 유저 입장에서 모드 전환 신호로서 분리 유지
- Home은 Inbox를 흡수하면서 Insights까지 담는 대시보드 → 기존 Inbox 자리에 자연스럽게 들어감
- 총 5개 유지 → Activity Bar 개수 변동 없음
