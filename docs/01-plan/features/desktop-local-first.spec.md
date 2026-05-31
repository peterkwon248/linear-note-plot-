# Plot — 데스크톱 & 로컬-퍼스트 소유 로드맵 (SPEC)

> 상태: **결정 단계** (2026-05-31 수립). 실행 전.
> SOT: 이 문서. 결정/순서가 바뀌면 여기 먼저 갱신.

## 비전

**무료 로컬-퍼스트 데스크톱 앱**으로 출발 → (나중) **유료 동기화 + 모바일**.
레퍼런스 = **Obsidian 모델**(앱 무료 + 유료 Sync/Publish).

---

## Locked Decisions (2026-05-31 브레인스토밍)

1. **순서**: ① 무료 데스크톱 → ② export/백업 → ③ 유료 싱크 + 모바일. (비용·리스크 최소 순)
2. **셸 스택**: **Tauri 2.0** 우선 (경량 ~3-10MB, FS/SQLite, 자동업데이트, **모바일까지 동일 코드**). ⚠️ OS webview 렌더 쿼크 가능 → **1일 렌더 스파이크**(TipTap+d3 그래프) 먼저, 쿼크 나면 **Electron 폴백**(Chromium 내장=Chrome 동일).
3. **저장 모델 = 하이브리드(B)**: 본문 = `.md` 파일(사용자 소유, 어디서든 열림) + 부가데이터 = `.plot/` 로컬 사이드카(앱 전용). = Obsidian 자신의 방식(`.md` + `.obsidian/`).
4. **정적화 가능 확인됨**: `output:'export'` 빌드가 **4개 동적 라우트(generateStaticParams 필요)만 빼고 통과**. 숨은 export 비호환 0. (Phase 0 spike, 2026-05-31)

---

## 데이터 분할 (하이브리드 B)

| `.md` 파일 (사용자 소유·이동성·백업 자유) | `.plot/` 사이드카 (로컬·앱 전용 포맷) |
|---|---|
| 노트 / 위키 **본문** | **Books** (순서 컬렉션 + 스마트북=쿼리) |
| frontmatter: status / tags / priority | **SRS 복습 스케줄** (간격·ease) |
| `[[wikilinks]]` | **온톨로지 relations / 그래프 캐시** |
| | saved views, hooks/리마인더, comments(앵커), stickers |

**핵심**: "내 글"은 열린 파일 → lock-in 없음. "똑똑한 기능"은 텍스트가 아니라 데이터 → 로컬 사이드카(여전히 사용자 디스크 = 백업 가능).

---

## 동기화 토대 (나중 ③)

- **Yjs CRDT 이미 깔림** (`yjs` + `y-indexeddb` + tiptap collaboration). → 싱크 서버(y-websocket / Hocuspocus / Liveblocks / Y-Sweet)만 얹으면 다기기.
- **클라우드 = 중계 + 백업** (데이터는 각 기기 로컬 유지 → 오프라인 동작). ≠ Notion식 클라우드-퍼스트.
- 유료 정당성: 무료 데스크톱=서버 0=비용 0 / 싱크=상시 서버 비용 → 그 지점에 과금.

---

## Roadmap (phased)

| Phase | 내용 | 크기 | 비고 |
|---|---|---|---|
| **P0** | 정적화 — `output:'export'` + 4 동적 라우트(`books/folder/tag/label [id]`) **정적 SPA 라우팅 처리**(↓ Risk #6) → `out/` 생성 | 중간 | build feasibility 검증됨, **라우팅 모델 결정 선행** |
| **P1** | 데스크톱 셸 — Tauri 렌더 스파이크 → `out/` 로드 + 윈도우/아이콘/앱명(`my-project`→Plot). IDB 그대로(앱 디스크 영속) | 중간 | "돌아가는 데스크톱 앱" |
| **P2** | **파일 저장 (하이브리드 B)** — persist 레이어 IDB→FS 어댑터 + `.md` writer/watcher + `.plot/` 사이드카 | **큼 (핵심)** | 옵시디언급 소유 |
| **P3** | export/import/백업 + 출시 전 안정화 (QA, `/inbox` anomaly, 데드코드, 스모크 테스트) | 중간 | |
| **P4** | (유료) 싱크 서버 + 모바일(Tauri mobile) | 큼 | ③, 나중 |

---

## ⚠️ Open Decisions / Risks

1. ✅ **RESOLVED → A (빠른 출시)** (2026-05-31): 첫 무료 출시 = **P0+P1+P3 (IDB-on-desktop + export)**, **P2(.md 파일 소유)는 v1.1 업그레이드**. 근거: 데스크톱 IDB는 이미 앱 디스크 영속이라 데이터 손실 위험 0 → .md 재작업(P2, 최대 작업)을 출시 블로커로 두지 않음. 빠른 유저 검증 우선.
2. **MD round-trip 손실**: TipTap 리치 콘텐츠(테이블/수식/임베드/커스텀 블록/위키 infobox) ↔ Markdown 무손실 변환 불가 항목 처리(확장 frontmatter? `.plot` 사이드카로? 손실 허용?).
3. **외부 편집 충돌**: 파일 watcher(외부 .md 편집) vs 앱 상태 동기화/충돌.
4. **Tauri webview 호환**: 복잡 UI(TipTap·d3)가 WebView2/WebKit서 정상인지(스파이크로 판가름).
5. **배포**: 코드사이닝(Win)·공증(Mac)·자동업데이트·설치파일(.msi/.dmg/AppImage).
6. **정적 SPA 라우팅 모델 (P0 핵심 결정)**: `output:export`에선 동적 라우트(`/folder/{id}` 등)가 `generateStaticParams:[]`면 *페이지 생성 안 됨* → 직접접근·클라이언트네비 둘 다 404. **★ 연결: 이게 `/inbox` refresh→home anomaly와 같은 뿌리** — 라우팅이 `activeRoute` 모듈상태라 hard-load가 뷰를 복원 못 함. 옵션: ⓐ 쿼리파람(`/notes?folder=`) / ⓑ 캐치올 `[[...slug]]` 단일 셸 + 클라 라우팅 / ⓒ `activeRoute` 클라 라우팅 전면화 / ⓓ 무시(데스크톱은 index만 로드). **추천 = ⓑ 또는 ⓒ** — 앱이 이미 `activeRoute` 보유 → 통일하면 **export 정적화 + `/inbox` anomaly 동시 해결**(일석이조).

---

## 다음 액션 (다음 세션 첫 작업)

> 결정 완료: 출시범위=**A(빠른 출시)** · 라우팅=**ⓑ(캐치올)** · 셸=**Tauri(스파이크 후 확정)**.

1. **P0 — 정적 SPA 라우팅 (ⓑ 캐치올, Risk #6)**: 새 데스크톱 worktree(main `83c8ec9` 기준) → 동적 라우트(`books/folder/tag/label [id]`)를 `[[...slug]]` 캐치올 **클라이언트** 라우트로 통합(로드 시 `syncFromPathname`로 뷰 복원) + `output:'export'` → `out/` 생성. **★ 동시에 `/inbox` refresh→home anomaly 해결됨**(같은 뿌리). ⚠️ 코어 라우팅이라 blast radius 큼 + 이 env preview는 route 검증 약함 → **사용자 실화면 검증 필수**, fresh 집중 세션 권장.
2. **Tauri 1일 스파이크**: `out/`을 Tauri 창에 띄워 TipTap+d3 그래프 렌더 확인 → Tauri/Electron 확정.
3. 이후 P1(셸 마감) → P3(export/백업/안정화) → **무료 데스크톱 출시**. P2(.md 소유)·P4(싱크/모바일)는 후속.
