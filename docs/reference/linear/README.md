# Linear 디자인 참고자료 (137 captures)

> Plot 앱의 디자인 폴리시 작업 (아이콘 / 폰트 / 글자 크기 / 간격 / UI 패턴 / 색상) 시 두고두고 참고.
> 사용자가 Linear 데스크톱 앱 내부를 직접 캡쳐한 자료 (2026-05-13 수집).

---

## 🎯 사용법

1. **폴리시 트리거 발생 시** (예: "사이드바 spacing 어색해") → 해당 카테고리 파일 찾기 (아래 인덱스)
2. **vision으로 분석** — Claude Code Read tool로 .png 직접 보기
3. **`linear-design-mirror` skill 활용** — surface별 가이드 자동 생성 (`.claude/skills/linear-design-mirror/references/surfaces/`)
4. **`design-quality-gate` skill 자동 활성화** — 디자인 토큰 일관성 검증

---

## 📂 카테고리 인덱스

### 1. 메인 화면 & 레이아웃 (6장)
| 파일 | 용도 |
|---|---|
| `메인 화면.png` | 전체 layout 기본 |
| `메인 화면 Go back 호버.png` | 네비게이션 back 버튼 호버 상태 |
| `메인화면 Go forward 호버.png` | 네비게이션 forward 버튼 |
| `메인화면-Recently viewed.png` | Recently viewed dropdown |
| `좌측 사이드바.png` | 좌측 사이드바 풀 layout |
| `우측 사이드바.png` | 우측 사이드바 (이슈 detail용) |

### 2. ⭐ 커맨드 팔레트 (12장) — 핵심 reference
| 파일 | 용도 |
|---|---|
| `커맨드팔레트 모달 다이얼로그 메인화면.png` | Cmd+K 모달 entry |
| `커맨드팔레트 모달 다이얼로그 스크롤2.png` ~ `스크롤12.png` (11장) | 풀 command list 스크롤 분량 |

**활용**: 검색창/명령어 시스템 개편 시 (Plot search-dialog.tsx + search-view.tsx 강화)

### 3. ⭐ 좌측 사이드바 More + Customize sidebar (10장)
| 파일 | 용도 |
|---|---|
| `왼쪽 사이드바-More 내부.png` | More dropdown |
| `왼쪽 사이드바-More-Customize sidebar 모달 다이얼로그.png` | Customize 모달 메인 |
| `...Customize sidebar 모달 다이얼로그-Default badge style 내부.png` | Badge 스타일 옵션 |
| `...Personal-Inbox/My issues/Drafts 내부.png` | Personal 섹션 옵션 |
| `...Workspace-Projects/Views/Teams/Members 내부.png` | Workspace 섹션 옵션 |

**활용**: 사이드바 customization 시스템 도입 시

### 4. 필터 시스템 (36장) — 가장 풍부
| 파일 패턴 | 용도 |
|---|---|
| `필터 메인화면.png` | Filter 패널 진입 |
| `필터-스테이터스/스테이터스 타입/어사인/에이전트/크리에이터.png` | 한국어 필터 5종 |
| `Filter-Priority/Labels/릴레이션스/Suggested label.png` | 기본 필터 4종 |
| `Filter-Dates-{Due/Created/Updated/Started/Completed/Triaged} date.png` | 날짜 필터 6종 |
| `Filter-Dates-Time in current status.png` | 시간 경과 필터 |
| `Filter-Project/Project priority/Project lead/Project milestone name.png` | 프로젝트 필터 |
| `Filter-Project properties-Project status.png` | 프로젝트 status 필터 |
| `Filter-Subscribers/External source/Content/Filter by content/Links/Template.png` | 기타 필터 6종 |
| `Filter-columns/Rows/Row order/Ordering/Board options.png` | View 필터 옵션 |
| `List-Add Filter.png` / `List-Status 표시.png` | List에서 Filter 진입 |

**활용**: Plot FilterPanel 강화 시 (현재 view-engine 7-8 카테고리 → Linear 수준으로 확장)

### 5. Display & 그룹핑 (8장)
| 파일 | 용도 |
|---|---|
| `Display-List 내부.png` / `Display-Board 내부.png` | List/Board 디스플레이 옵션 |
| `Display-List-Grouping.png` | List 그룹핑 옵션 |
| `Display-List-Sub-groping.png` | List 서브 그룹핑 (오타 sub-grouping) |
| `Display-List-Group order.png` | 그룹 순서 |
| `Display-List options.png` | List 옵션 풀 |
| `New view(New Issues).png` | New view 모달 |

**활용**: Plot DisplayPanel 정합성 (이미 view-engine 통일됨, polish reference)

### 6. ⭐ Search 탭 (4장)
| 파일 | 용도 |
|---|---|
| `메인화면-Search 화면.png` | Search 탭 진입 (별도 페이지) |
| `메인화면-Search-Filter.png` | Search 결과 Filter |
| `메인화면-Search-Display.png` | Search 결과 Display |
| `메인화면-Search-Display-Ordering.png` | Search 결과 Ordering |

**활용**: Plot search-view.tsx 강화 시 (Filter / Display 패널 추가)

### 7. Inbox (9장)
| 파일 | 용도 |
|---|---|
| `Inbox 메인화면.png` | Inbox 메인 |
| `Inbox-Filter 내부.png` | Filter 패널 |
| `Inbox-Filter-{Notification type/From/Project/Issue Priority/Issue status type}.png` | Filter 5종 |
| `Inbox-Display 내부.png` / `Inbox-Display-Ordering 내부.png` | Display 옵션 |
| `Inbox Display properties.png` | Display properties |

**활용**: Plot Inbox 강화 (현재 HomeView dashboard → Linear-style Inbox layer)

### 8. Projects 전체 (18장)
| 파일 패턴 | 용도 |
|---|---|
| `Projects-메인 화면.png` | Projects 메인 |
| `Projects-Filter.png` / `Projects-Display.png` | Filter/Display |
| `Projects-List-{Grouping/Ordering/Show closed projects} / Projects-List options.png` | List 모드 |
| `Projects-Board 메인 화면.png` + 6장 | Board 모드 (Columns / Rows / Ordering / Hidden columns / 컬럼 추가 / New project) |
| `Projects-Timeline 메인 화면.png` + 4장 | Timeline 모드 |
| `Projects-Views 메인화면.png` | Views 탭 |

**활용**: Plot Books view-engine과 비교 (이미 4 viewMode 통일), Timeline 도입 시 reference

### 9. Issues / My issues (8장)
| 파일 | 용도 |
|---|---|
| `Issues-Active-우측 사이드바 {Assignees/Priorty/Projects/labels}.png` | Issue detail 우측 사이드바 |
| `Issues-backlog-히든 컬럼스.png` | Backlog 히든 컬럼 |
| `My issues 내부.png` + 3장 | My issues (Created / Activity / Subscribed 탭) |

**활용**: Plot 노트 detail 우측 사이드바 reference (현재 SmartSidePanel)

### 10. Settings & Preferences (8장)
| 파일 | 용도 |
|---|---|
| `Settings 내부{1,2}.png` | Settings 메인 |
| `Settings-Preferences {1-4}.png` | Preferences 4 페이지 |
| `Settings-Preferences-General-Default home view 내부.png` | Default home view |
| `Settings-Preferences-General-Display names 내부.png` | Display names |

**활용**: Plot Settings 페이지 강화 시

### 11. Tabs 관리 (4장)
| 파일 | 용도 |
|---|---|
| `New tab 화면 1.png` / `New tab 화면 2.png` | New tab 모달 |
| `Tap 내의 Copy page URL 호버.png` | 탭 우클릭 (오타 Tap) |
| `Tab 내부 버튼 및 호버.png` | 탭 호버 상태 |

**활용**: Plot 탭 시스템 도입 시 (현재 없음, 사용자 결정 사항)

### 12. Create modals (5장)
| 파일 | 용도 |
|---|---|
| `Create new issue 버튼 1.png` | Create new issue 버튼 |
| `Create New issue 모달 다이얼로그.png` | 모달 메인 |
| `Create New issue 모달 다이얼로그 내부 추가 옵션 버튼.png` | 추가 옵션 |
| `New issue 모달 다이얼로그 Expand 호버.png` | Expand 호버 |
| `New issue 모달 다이얼로그 Attach images, files or videos.png` | 첨부 |

**활용**: Plot 노트/위키 create 모달 강화 시

### 13. Notification / Help / Invite (4장)
| 파일 | 용도 |
|---|---|
| `Notification settings 호버.png` / `Notification settings 내부.png` | 알림 설정 |
| `사이드바 Help with 호버.png` | Help 호버 |
| `사이드바-Invite to your workspace 모달 다이얼로그.png` | Invite 모달 |

**활용**: Plot 알림 시스템 / Help 시스템 도입 시 (현재 미구현)

### 14. Views (2장)
| 파일 | 용도 |
|---|---|
| `Views-Display 내부.png` | Views display |
| `Views-Display-Ordering 내부.png` | Views ordering |

**활용**: Plot Saved Views 시스템 (이미 도입)

---

## 🔗 관련 인프라

- [.claude/skills/linear-design-mirror/](../../../.claude/skills/linear-design-mirror/) — Linear 디자인 분석 + Plot 적용 가이드 skill
- [.claude/skills/anthropic-skills/design-quality-gate](../../../.claude/skills) — 디자인 품질 자동 게이트 (DESIGN-TOKENS.md 위반 사전 차단)
- [docs/PLOT-V3-VISUAL-REFRESH-PRD.md](../../PLOT-V3-VISUAL-REFRESH-PRD.md) — Plot v3 visual refresh PRD
- [docs/UI-CONSISTENCY-AUDIT.md](../../UI-CONSISTENCY-AUDIT.md) — UI 일관성 audit (2026-04-29, Phase 1-6 plan)
- [imperial-design-system](https://github.com/peterkwon248/imperial-design-system) — 사용자가 별도 만든 design system repo (Plot 적용은 v3 Phase 2 deferred 상태)

---

## 📊 카테고리 분포 통계

| 카테고리 | 장수 | 우선순위 |
|---|---:|---|
| 필터 시스템 | 36 | ⭐⭐⭐ (가장 풍부) |
| Projects | 18 | ⭐⭐ |
| 커맨드 팔레트 | 12 | ⭐⭐⭐ (검색 개편 시) |
| 좌측 More + Customize sidebar | 10 | ⭐⭐ |
| Inbox | 9 | ⭐ |
| Display & 그룹핑 | 8 | ⭐ |
| Issues / My issues | 8 | ⭐ |
| Settings & Preferences | 8 | ⭐ |
| 메인 화면 & 레이아웃 | 6 | ⭐⭐ |
| Create modals | 5 | ⭐ |
| Notification / Help / Invite | 4 | ⭐ |
| Search 탭 | 4 | ⭐⭐ (검색 개편 시) |
| Tabs 관리 | 4 | ⭐ (Plot 미도입) |
| Views | 2 | (이미 도입) |

**합계**: 137장

---

## 💡 polish 작업 시 참고 순서

1. **현재 Plot 상태 확인** — 어느 컴포넌트의 어느 surface인지
2. **해당 카테고리 캡쳐 분석** — `Read` tool로 .png 직접 보기 (vision)
3. **gap 식별** — Plot vs Linear (시각적 / 인터랙션 / 정보 밀도)
4. **`linear-design-mirror` skill의 surface 가이드 작성** (`.claude/skills/linear-design-mirror/references/surfaces/{surface-name}.md`)
5. **Plot 코드 변경** — minimal diff, executor agent 위임 권장
6. **`design-quality-gate` 자동 검증** — DESIGN-TOKENS.md 위반 없는지

---

## 📅 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-13 | 137 captures 초기 인덱스 작성 |
