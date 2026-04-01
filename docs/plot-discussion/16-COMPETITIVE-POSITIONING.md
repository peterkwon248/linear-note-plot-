# 16. Competitive Positioning — Block-Based App Landscape

> 2026-03-31. ChatGPT + Claude 대화 기반 경쟁 분석 요약 + 오픈소스 검증 완료.

## 블록 기반 앱 분류

### 1. 문서 = 앱 수준 (노션 확장형)
- **Coda** — 노션 + 엑셀 + 자동화. 문서 하나가 앱처럼 동작. **클로즈드 소스, 클라우드 전용**
- **Microsoft Loop** — 블록(Loop component)이 다른 MS 앱에서도 실시간 동기화. **클로즈드 소스** (단, 기반 기술 Fluid Framework은 MIT 오픈소스)

### 2. 로컬 + 연결 기반 (사고 중심)
- **Obsidian** — 마크다운 + 그래프/백링크. 완전 로컬. **클로즈드 소스** (플러그인 API만 공개)
- **Anytype** — 오브젝트 기반 + 관계 + P2P 싱크. **Source-available** (OSI 미승인, 상업적 사용 제한). 프로토콜(any-sync)은 MIT

### 3. 캔버스 + 블록 혼합 (미래형)
- **AFFiNE** — 노션 + 화이트보드. 페이지 <-> 캔버스 동기화. **MIT 오픈소스** (클라이언트). GitHub 66.7k stars
- **AppFlowy** — 노션 클론. **AGPLv3 오픈소스**. GitHub 68.9k stars (이 그룹 최다). Flutter + Rust

### 4. 올인원 업무툴 (탈락)
- ClickUp, Monday.com — 팀 업무툴. 개인용 아님. 블록 자유도 낮음

## 오픈소스 검증 결과 (2026-03-31)

| 앱 | 오픈소스? | GitHub | Stars | 라이선스 | 에디터 | 스택 |
|---|---|---|---|---|---|---|
| **AFFiNE** | O (클라이언트) | [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | 66.7k | MIT (client) / Proprietary (server) | BlockSuite (자체) | React + TS + Yjs CRDT |
| **AppFlowy** | O | [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | 68.9k | AGPLv3 | AppFlowy Editor (자체) | Flutter + Rust + yrs CRDT |
| **Anytype** | Source-available | [anyproto/anytype-ts](https://github.com/anyproto/anytype-ts) | 7.3k | Any Source Available 1.0 (비OSI) | 자체 | TS + Electron + Go P2P |
| **Obsidian** | X | 소스 없음 | N/A | Proprietary | 자체 (마크다운) | Electron |
| **Coda** | X | 소스 없음 | N/A | Proprietary | 비공개 | 클라우드 SaaS |
| **MS Loop** | X (Loop 자체) | [Fluid Framework](https://github.com/microsoft/FluidFramework) | 4.9k | Proprietary / MIT (FF) | Fluid Framework 기반 | TS + SharePoint |

**Plot 코드 참고에 가장 유용한 순서: AFFiNE > Anytype > AppFlowy**
- AFFiNE: 같은 웹 스택 (React + TS + 블록 에디터 + IDB + Yjs CRDT)
- AppFlowy: Flutter라서 코드 참고 가치 낮음
- 향후 캔버스/CRDT 구현 시 AFFiNE BlockSuite 코드 분석 예정

## Plot 기준 경쟁자 평가

| 기준 | Obsidian | Anytype | AFFiNE |
|------|----------|---------|--------|
| 로컬 퍼스트 | O | O | O |
| 개인 워크스페이스 | X (노트앱) | O (오브젝트로 뭐든) | O (블록+캔버스) |
| 온톨로지/그래프 | O | O | X |
| 라이트유저 친화 | X (진입장벽) | X (러닝커브) | O (노션처럼 쉬움) |
| 블록 자유도 | X (마크다운) | 보통 | O (노션급+캔버스) |
| 속도 | O | O | 보통 |

**결론: Anytype가 가장 가까운 경쟁자**
- Type + Relation + Set = Plot의 Label + Tag + WikiCategory와 1:1 대응
- 약점: UI 폴리싱 부족, 블록 자유도 노션 미만, 온보딩 불친절

## Plot 포지셔닝

```
Anytype의 철학      (로컬, 오브젝트, 관계, 그래프)
+ AFFiNE의 자유도   (블록, 캔버스, 문서<->캔버스)
+ 노션의 친절함     (템플릿 갤러리, 디자인 폴리싱, 빈 상태 안내)
+ Obsidian의 속도   (로컬 파일, 밀리초 응답)
+ Plot만의 차별화   (온톨로지 제안, 무의식적 제텔카스텐, No-AI)

= "세상에서 가장 빠른 개인 워크스페이스. 쓸수록 발견이 많아지는."
```

경쟁 앱 중 이 다섯 가지를 **전부** 가진 앱은 없음.

## Anytype 약점 = Plot 기회

| Anytype 약점 | Plot이 채울 수 있는 것 |
|-------------|---------------------|
| 러닝커브 1~3주 | 템플릿 갤러리로 5분 시작 |
| UI 폴리시 부족 | Linear-level 디자인 폴리싱 |
| 블록 자유도 노션 미만 | TipTap 25+ 확장으로 이미 노션급 |
| 온보딩 불친절 | "빈 페이지에서 뭐든 시작해" UX |
| 기능 발견 어려움 | "라이트유저가 헤비유저 착각" 설계 |

## 각 앱에서 가져올 것

### AFFiNE -> Plot (향후)
- **캔버스 <-> 문서 동기화**: 같은 콘텐츠를 문서로도 캔버스로도 볼 수 있는 구조
- 우선순위: P3~P4 (코어 에디터 완성 후)

### Obsidian -> Plot (이미 완료)
- 그래프, 백링크, 로컬 퍼스트 — 이미 다 있음
- Plot이 Obsidian보다 나은 점: 블록 에디터, 뷰 시스템, 위키

### Anytype -> Plot (참고)
- 오브젝트 타입 시스템 — Plot의 Label/noteType으로 이미 방향 설정
- Relation 시스템 — Plot의 온톨로지 엔진이 더 자동화됨 (수동 Relation 설정 불필요)

## 실행 순서 (이 분석 기반)

포지셔닝 실현을 위한 우선순위:

1. ~~Note/Wiki 통합~~ (폐기 — 독립 엔티티 유지)
2. **Home 공간** ✅ 완료
3. ~~Pages 네이밍~~ (폐기 — 독립 공간 유지)
4. **인라인 쿼리 뷰** ✅ MVP 완료
5. **투두 시스템** ✅ MVP 완료
6. ~~캔버스 뷰~~ (보류)
