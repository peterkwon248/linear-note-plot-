/**
 * Realistic mock data for the Insights preview.
 *
 * 라이브 계산(runAnalysis / computeActivityStats)을 대체하는 현실적 샘플.
 * - severity 다양하게 6개 (critical 2 / warning 2 / info 2)
 * - 7일 활동 차트 데이터
 * - most-opened 5개
 * - lifecycle counts
 * - 한국어 라벨
 *
 * 순수 상수 파일 — import 심볼: InsightsViewModel 타입만.
 */

import type { InsightsViewModel } from "./insights.types"

/** 오늘 기준 -N일 "yyyy-MM-dd" */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const insightsMock: InsightsViewModel = {
  labels: {
    pageTitle: "인사이트",
    sectionActivity: "활동",
    statToday: "오늘",
    statThisWeek: "이번 주",
    statThisMonth: "이번 달",
    chart7dayActivity: "7일 활동",
    sectionMostOpened: "많이 열어본 노트",
    sectionLifecycle: "라이프사이클",
    statusBacklog: "백로그",
    statusTodo: "할 일",
    statusInProgress: "진행 중",
    statusDone: "완료",
    lifecycleWiki: "위키",
    sectionHealth: "건강 체크",
    emptyAllGood: "이슈 없음",
    emptyNoIssues: "지식 그래프가 깔끔한 상태입니다.",
    showNMore: "{count}개 더 보기",
    showNNotes: "노트 {count}개 모두 보기",
    eventsCount: "{count}건",
  },

  activityStats: {
    todayCount: 8,
    weekCount: 37,
    monthCount: 124,
    mostOpened: [
      { noteId: "n1", title: "제텔카스텐 방법론 정리", count: 21 },
      { noteId: "n2", title: "팔란티어 온톨로지 모델", count: 17 },
      { noteId: "n3", title: "이번 분기 목표 OKR", count: 14 },
      { noteId: "n4", title: "Linear 디자인 원칙 노트", count: 11 },
      { noteId: "n5", title: "주간 회고 2026-W22", count: 9 },
    ],
    dailyActivity: [
      { date: daysAgo(6), count: 5 },
      { date: daysAgo(5), count: 12 },
      { date: daysAgo(4), count: 8 },
      { date: daysAgo(3), count: 3 },
      { date: daysAgo(2), count: 19 },
      { date: daysAgo(1), count: 14 },
      { date: daysAgo(0), count: 8 },
    ],
  },

  lifecycleCounts: {
    backlog: 28,
    todo: 17,
    inProgress: 9,
    done: 64,
    wiki: 12,
  },

  severityCounts: {
    critical: 2,
    warning: 2,
    info: 2,
  },

  sortedResults: [
    /* ── critical ──────────────────────────────────────────────── */
    {
      ruleId: "orphan-notes",
      label: "고립된 노트",
      description: "아무 연결도 없는 노트. 지식 그래프 밖에 떠 있는 상태.",
      severity: "critical",
      count: 23,
      matchedNotes: [
        { id: "o1", title: "임시 메모 20260412" },
        { id: "o2", title: "아이디어 스크래치 #1" },
        { id: "o3", title: "미분류 링크 모음" },
        { id: "o4", title: "읽을 거리 2026-05" },
        { id: "o5", title: "회의 메모 (미완성)" },
        { id: "o6", title: "제목 없는 노트" },
        { id: "o7", title: "TODO 임시 덤프" },
        { id: "o8", title: "레퍼런스 정리 초안" },
      ],
    },
    {
      ruleId: "stale-in-progress",
      label: "오래된 진행 중 노트",
      description: "14일 이상 상태 변경이 없는 '진행 중' 노트.",
      severity: "critical",
      count: 4,
      matchedNotes: [
        { id: "s1", title: "온톨로지 엔진 v2 설계" },
        { id: "s2", title: "사이드바 리팩터 계획" },
        { id: "s3", title: "SRS 알고리즘 개선 메모" },
        { id: "s4", title: "데스크톱 라우팅 스파이크" },
      ],
    },

    /* ── warning ────────────────────────────────────────────────── */
    {
      ruleId: "low-srs-retention",
      label: "복습 미흡 노트",
      description: "SRS 정답률 60% 미만. 더 자주 복습이 필요한 노트.",
      severity: "warning",
      count: 7,
      matchedNotes: [
        { id: "r1", title: "Rust 소유권 모델 요약" },
        { id: "r2", title: "함수형 프로그래밍 패턴" },
        { id: "r3", title: "SQL 윈도우 함수 레퍼런스" },
      ],
    },
    {
      ruleId: "missing-backlinks",
      label: "역링크 없는 위키",
      description: "작성은 됐지만 아무 노트도 이 위키를 참조하지 않음.",
      severity: "warning",
      count: 5,
      matchedNotes: [
        { id: "w1", title: "CRDT 개론" },
        { id: "w2", title: "Yjs 아키텍처" },
        { id: "w3", title: "IndexedDB 스토리지 설계" },
      ],
    },

    /* ── info ───────────────────────────────────────────────────── */
    {
      ruleId: "no-tag-notes",
      label: "태그 없는 노트",
      description: "태그 미분류 노트. 태그를 추가하면 검색·필터 활용도가 높아짐.",
      severity: "info",
      count: 18,
      matchedNotes: [
        { id: "t1", title: "아침 루틴 기록" },
        { id: "t2", title: "독서 발췌 2026-05-30" },
        { id: "t3", title: "프로젝트 아이디어 목록" },
      ],
    },
    {
      ruleId: "done-not-linked",
      label: "완료 후 연결 안 된 노트",
      description: "'완료' 상태지만 다른 노트가 참조하지 않는 노트. 지식화 고려.",
      severity: "info",
      count: 11,
      matchedNotes: [
        { id: "d1", title: "데이터 라이프사이클 감사 PR1" },
        { id: "d2", title: "re-seed 1회성 정책 PR2" },
        { id: "d3", title: "trash UI 좀비 해소 PR3" },
        { id: "d4", title: "빌드 오류 수정 메모" },
      ],
    },
  ],
}
