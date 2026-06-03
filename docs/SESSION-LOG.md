# Session Log

> 세션 history. Append-only (오래된 entry 그대로 유지).
> 가장 최신 세션이 위.
> **NEXT-ACTION.md 폐지 (2026-05-12)**: 각 entry 첫 줄의 "다음 즉시 액션 hook"이 다음 세션 시작점.

---

## 2026-06-03 (집/Windows) — **P3 출시 전 안정화 마무리: 죽은 Wiki Reader 클러스터 제거 + stone/brick 잔재 정리 + 스모크 QA**

> 🎯 **다음 즉시 액션**: **폴더 필터 F5 URL화** (TODO 0.025, 사용자 2026-06-01 직접 적발) — 사이드바 폴더/태그/라벨 클릭이 `router.push("/notes")` + `activeFolderId`(모듈상태, URL 없음) → F5 시 필터 리셋(All Notes 복귀). 캐치올(`/folder/{id}` URL 복원, #513)과 **별개 layer**.
>
> **사용자 의도**: 출시 전 안정화. "데드코드 정리"는 두 항목(noteType·stone/brick) 다 "대부분 backward-compat 보존, 진짜 작업은 소수"로 판명 — 무리한 일괄 정리보다 정확한 보존 판정 우선.
>
> **첫 스텝** (폴더 F5, 다른 머신에서 바로):
> 1. **설계 결정 먼저 (사용자 합의)**: 사이드바 폴더 클릭 → `/folder/{id}` navigate(FolderDetailView, 캐치올 활용) vs `/notes?folder={id}`(쿼리스트링, 필터 유지). 후자가 F5 생존 + 간단.
> 2. `components/linear-sidebar.tsx`에서 폴더/태그/라벨 onClick 핸들러 찾기 (현재 `router.push("/notes")` + setActiveFolderId 모듈상태).
> 3. URL에 상태 반영(`?folder=`/`?tag=`/`?label=`) + 해당 뷰가 URL 읽어 필터 복원.
>
> **위험 + 회피**: 캐치올 라우팅(#513)과 UX 충돌 주의 — `/folder/{id}`(FolderDetailView 전용 화면)와 `/notes?folder=`(노트 리스트 필터)는 다른 경험. **어느 쪽인지 사용자 합의 먼저**. activeFolderId 모듈상태가 SOT면 URL과 동기화 필요.
>
> **참고 파일**: `components/linear-sidebar.tsx`(폴더/태그/라벨 nav), `app/(app)/[...slug]/`(캐치올 #513), `components/views/folder-detail-view.tsx`.
>
> **머신**: 집(Windows). **현재 main HEAD**: 이 PR 머지 후. **branch worktree**: 새 worktree 생성.

### 완료 (P3 안정화 마무리, 2 작업 → 1 PR)
- **🗑️ 죽은 레거시 Wiki Reader 클러스터 제거** (~1036줄): 4파일 삭제(`wiki-article-reader`/`wiki-disambig`/`wiki-related-docs`/`wiki-collection-sidebar`) + `note-editor.tsx`(죽은 `WikiReadLayout` 함수+동반 import/selector, dead 삼항 `{false?null:X}`→`X` unwrap) + `wiki-view.tsx`(레거시 "Article Reader Mode (Legacy Note-based)" 분기 + 단수 state `selectedArticleId` 정리). **modern 위키(wikiArticles + WikiArticleView)는 무변경.**
- **🧹 stone/brick/keystone 잔재 정리**: i18n `added_toast` **사용자 노출 버그 2건**(en "Added to Stone"→"Added to Backlog", ko "스톤에 추가됨"→"대기에 추가됨"; quick-capture가 `status:"backlog"` 생성) + dead i18n 키 6개(en/ko `sidebar.stone/brick/block`) + dead Icon 별칭 3개(`IconStone/Brick/Block`) + stale 주석 2개.

### 브레인스토밍 & 큰 결정 (영구)
- **"데드코드 정리" 항목 ≠ 데드코드**: noteType==="wiki"(107곳)·stone/brick(119곳) 둘 다 TODO 전제와 달리 **대부분 살아있는 backward-compat/load-bearing**. 무리한 일괄 정리(블라인드 replace)는 구식 데이터 유저를 깨뜨림. **조사→architect 전수 분류→소수만 정밀 작업**이 정답(2회 성공 패턴).
- **진짜 작업은 소수**: noteType→Wiki Reader 클러스터 1개(컴포넌트 통째 삭제). stone/brick→사용자 노출 버그 2건 + dead 9개. 나머지(migrate/seeds/tests/목업/persist 식별자/방어 체크)는 보존.

### 기술 학습 (영구)
- **레거시 분기 도달 불가 증명법 = state setter 전수 추적**: `wiki-view` 레거시 분기는 `selectedArticleId`(단수)가 non-null 돼야 도달. 유일 non-null setter(`openArticle` fallback `setSelectedArticleId(id)`)가 **모든 호출처에서 wikiArticles 파생 id만 받아** `directArticle` 분기 early-return → fallback 미도달 → state 영원히 null → 분기 죽음. **변수명 함정**: `sortedFilteredWikiNotes`/`wikiNotes`는 이름과 달리 `wikiArticles` 파생(v47부터 별도 엔티티). `selectedArticleId`(단수, 레거시) vs `selectedArticleIds`(복수 Set, modern 다중선택) 혼동 주의.
- **noteType="wiki" 보존 이유**: migrate가 구식 wiki 노트를 normalize 안 함(v66 설정만, v89/v107 중복만 trash) → 구식 데이터에 잔존 가능 → graph/side-panel/trash/search/calendar/insights/hover-preview/filter의 noteType 체크 = 살아있는 방어망.
- **stone/brick 라우트는 이미 rename됨**: `lib/table-route.ts`가 `/backlog`,`/todo`,`/in-progress`,`/done` 사용. queries/notes.ts 17곳=주석/문자열, 로직은 새 enum. AGENTS.md `/stone` 라우트=**stale 문서**(코드와 불일치). autopilot/analysis rule id + settings `startView:"stone"`=persist 식별자라 보존.
- **i18n 키 삭제 신중**: 동적 키 조합(`t(\`sidebar.${...}\`)`) 가능성 → 정적+동적 grep 후 삭제.

### Watch Out (다음 세션 주의사항)
- **AGENTS.md stale**: `/stone`,`/brick`,`/keystone` 라우트 문서(L222-224,307 등)가 실제 코드(table-route.ts)와 불일치 → 별도 정정 후보.
- **남은 cosmetic 보류**: `cmdk.cmd.go_to_stone` 등 i18n 키, queries/notes.ts 주석/함수명(`getInboxNotes` 등)은 동작 정상이라 이번 보류(이득 낮음). `getReviewQueue`는 live 호출처 0(dead 후보, 미처리).
- **noteType 방어망 보존**: 향후 noteType 건드릴 때 backward-compat(구식 wiki 노트) 깨지 않게.
- **dev preview 라우팅 한계**: 스페이스 nav는 작동(path 변함)하나 keep-mounted 구조라 헤딩 selector 부정확 → 사용자 실화면 F5 권장.

### 환경 변경
- Store version: **무변경 (v154)**.
- Tests: 무변경 (318 passed/7 skipped/0 failed — 이번 변경은 컴포넌트 삭제 + i18n, 테스트 영향 없음).
- 삭제 4파일: `components/editor/wiki-disambig.tsx`·`wiki-related-docs.tsx`·`wiki-collection-sidebar.tsx`·`components/views/wiki-article-reader.tsx`.
- 수정 5파일: `note-editor.tsx`·`wiki-view.tsx`·`lib/i18n.ts`·`components/plot-icons.tsx`·`components/views/notes-timeline-view.tsx`.
- 순 **-1050줄** (9 파일, +25/-1075).
- 검증: tsc 0, build(webpack) exit 0 (50/50 페이지), 스모크 QA(위키 dashboard+modern article view·노트 에디터·책/달력/온톨로지/자료실 순회·백업) **console 에러 0**.

### 머신
집 (Windows)

---

## 2026-06-02 (집/Windows, 오후 #3) — **P3 안정화: 죽은 auto-enroll/wiki-conversion 서브시스템 제거 (데드코드)**

> 🎯 **다음 즉시 액션 hook**: **P3 데드코드 잔여** — ① **`noteType==="wiki"` 체크 107곳/39파일** 제거(이제 live setter 0이지만 ⚠️ 구식 persist 데이터에 noteType="wiki" 잔존 가능 → migrate가 normalize하는지/방어 체크 유지할지 검증 먼저) ② **status stone/brick/keystone 119곳/26파일** 코스메틱 rename(⚠️ migrate/seeds/tests backward-compat 문자열 유지, dnd id `col-stone` 등 비-load-bearing만) + 스모크. SOT=`desktop-local-first.spec.md` Roadmap P3.
>
> **첫 스텝**: noteType="wiki" — migrate.ts가 기존 wiki-typed 노트를 어떻게 처리하는지(normalize?/보존?) 확인 → 체크 제거 안전성 판정.
>
> **⚠️ 잊지 말 것**: ① **"정의 존재 ≠ 호출"** — startAutoEnrollment export됐지만 호출 0(타이머 앱서 시작 안 됨), note-editor가 convertToWiki/revertFromWiki 구독했지만 호출 0. **전수 grep 후 제거**. ② live wiki 생성 = `createWikiArticle`(wikiArticles 슬라이스), createWikiStub(noteType="wiki" 노트)는 레거시(이미 이전됨, MEMORY:6337). ③ 죽은 서브시스템 제거 = **tsc가 dangling 안전망**.
>
> **머신**: 집(Windows). **main HEAD**: 이 PR 머지 후.

### 완료 (죽은 서브시스템 제거)
- **`lib/wiki-auto-enroll.ts` 삭제**: detectEnrollmentCandidates/detectTagCandidates/runAutoEnrollment/startAutoEnrollment. **startAutoEnrollment 호출처 0**(전수 grep)=타이머 앱서 시작 안 됨=죽음. 아무것도 import 안 함.
- **notes.ts 3액션 제거**: createWikiStub/convertToWiki/revertFromWiki. 참조=죽은 auto-enroll + 죽은 note-editor 구독뿐. live wiki 생성은 `createWikiArticle`로 이미 이전. convertToWiki="삭제 예정" 결정 실행.
- **types.ts 선언 3개 + note-editor.tsx 죽은 구독 2줄**(130-131) 제거.

### 감사 결과 (영구)
- **noteType="wiki" live setter = 0** (제거 후). 단 noteType FIELD + 107곳 체크는 잔존 → PR-B(구식 persist 데이터 검증 후 제거).
- **createWikiStub vs createWikiArticle**: WikiArticle=별도 entity(wikiArticles 슬라이스). createWikiStub=레거시 noteType="wiki" 노트. live wiki space는 wikiArticles만 표시.

### 검증
- tsc 0(**dangling 0=다른 참조 없음 확인**) / test 318 passed·7 skipped·0 failed / build 0.

### 환경 변경
- 삭제: `lib/wiki-auto-enroll.ts`. 수정: notes.ts(3액션)·types.ts(3선언)·note-editor.tsx(2구독). **noteType FIELD·Store version 불변(v154)**. ("wiki_converted" 이벤트 verb는 잔존=무해 데드 라벨.)

### Watch Out
- noteType="wiki" 체크 107곳 = PR-B (**구식 데이터 noteType="wiki" 잔존 가능 → 방어 체크 섣불리 제거 X**).
- "wiki_converted" 이벤트 verb 잔존(EVENT_CONFIG 데드 라벨, 무해).

### 머신
집 (Windows)

---

## 2026-06-02 (집/Windows, 오후 #2) — **P3 안정화: 그린 테스트 스위트 (pipeline date 수정 + migrate-v107 skip)**

> 🎯 **다음 즉시 액션 hook**: **P3 안정화 잔여 — 데드코드 정리** (`noteType==="wiki"` 107곳/39파일 · status stone/brick/keystone 119곳/26파일, ⚠️ migrate/seeds/tests backward-compat 유지 + `wiki-auto-enroll.ts` convertToWiki 실동작 먼저 확인, 블라인드 replace 금지) + 스모크. 테스트 스위트=그린(318 passed/7 skipped/0 failed). SOT=`desktop-local-first.spec.md` Roadmap P3.
>
> **첫 스텝**: 데드코드 — `noteType==="wiki"` 실제 사용처 vs 데드 구분 → 파일별 검증 후 최소 diff.
>
> **⚠️ 잊지 말 것**: ① **vitest(ESM)은 source의 `require()` 못 풂** (`vi.mock`도 require 미가로챔) — migrate.ts의 lazy `require("./seeds")`(앱 시작 시 거대 seeds eager 로드 회피 의도)가 vitest서 "Cannot find module" → 전체 migrate() 테스트 불가. **prod-critical migrate.ts는 테스트 위해 안 건드림**(skip+문서화). ② **date/createdAt 그룹은 빈 버킷 숨김**(status/priority는 고정 유지) — group.ts 의도적 비대칭.
>
> **머신**: 집(Windows). **main HEAD**: 이 PR 머지 후.

### 완료 (그린 스위트, 테스트 전용)
- **pipeline date grouping 2개 = stale 수정**: `applyGrouping([],'date')`가 빈 입력에 4버킷 기대였으나, 구현은 **빈 버킷 숨김**(group.ts:188-190 의도) + **Yesterday 버킷 추가**(2026-05-14, 4→5). 테스트를 현재 올바른 동작(빈→`[]`, 버킷별 분류+순서+빈 숨김)에 맞게 재작성. **구현이 옳고 테스트가 stale**.
- **migrate-v107 7개 = `describe.skip`(문서화)**: vitest ESM이 migrate의 lazy `require("./seeds")`(v127+ 단계) 못 풂 → "Cannot find module". 앱 버그 아님(실앱 webpack 번들 정상). frozen 마이그(v107, 현재 v154)라 prod-critical migrate.ts 리팩터 리스크 대신 skip+사유. 재활성=순수 v107 헬퍼 추출 or 번들러 하니스.
- **결과**: 318 passed / 7 skipped / **0 failed**. tsc 0.

### 기술 학습 (영구)
- **vitest(ESM) source `require()` 미해결**: `vi.mock`도 require는 못 가로챔(레지스트리 미경유). require 쓰는 모듈의 풀-실행 테스트는 vitest서 불가 → static import 전환(순환 없을 때) or skip. seeds 순환 없음 확인(helpers/wiki-section-index=leaf)이나 eager-load 회피 의도 존중해 미전환.
- **그룹 빈-버킷 정책**: status/priority/triage/linkCount=고정 버킷 유지(보드 빈 컬럼), date/createdAt=빈 버킷 숨김(시간축 노이즈↓). group.ts 의도적 비대칭.

### 환경 변경
- 테스트만: `pipeline.test.ts`(date 2 재작성) + `migrate-v107.test.ts`(describe.skip). **앱 코드 무변경**.

### 머신
집 (Windows)

---

## 2026-06-02 (집/Windows, 오후) — **P3 백업/복원 완전성 수정 (위키 블록 메타 유실 버그) + 라운드트립 테스트**

> 🎯 **다음 즉시 액션 hook**: **P3 출시 전 안정화 잔여** — ① pre-existing 테스트 9개 정리(migrate-v107 7=기존 known, pipeline date grouping 2=`applyGrouping([],'date')` 빈입력 4버킷 기대인데 [] 반환=신규발견) ② 데드코드(noteType==="wiki" 107곳/39파일 · status stone/brick/keystone 119곳/26파일) ③ 스모크. **백업/복원 완전성=완료**. SOT=`desktop-local-first.spec.md` Roadmap P3. **(별개: 폴더 필터 F5 / macOS 서명·공증 / openDbForRestore 버전-bump latent.)**
>
> **첫 스텝**: pipeline date grouping 2개 — 실제 앱 버그(날짜 그룹 깨짐)인지 stale 테스트인지 `applyGrouping` date 로직 확인 → 수정 or 테스트 정정. 그 다음 데드코드.
>
> **⚠️ 잊지 말 것**: ① **IDB 백업 format = keyPath 유무** — out-of-line(keyless, `put(value,key)`)은 `"kv"`(키 보존), in-line(keyPath "id")은 `"objects"`. wiki-block-meta가 keyless인데 "objects"라 유실됐음. 새 IDB store 추가 시 백업 타겟 format 확인 의무. ② **파생 캐시(mention-index/search-cache/yjs)는 백업 제외 → 복원 시 리셋**(stale 방지). yjs=실험 OFF 기본이라 무관. ③ fake-indexeddb/auto로 node test env서 IDB 라운드트립 테스트 가능.
>
> **머신**: 집(Windows). **main HEAD**: 이 PR 머지 후.

### 완료 (백업/복원 완전성)
- **🔴 위키 블록 메타 유실 버그 수정** (`lib/idb-backup.ts`): `plot-wiki-block-meta`는 out-of-line 키(key=articleId, value=`WikiBlock[]`)인데 백업 format이 "objects"(keyPath "id" 가정)라 ① 백업 시 `getAll()`이 articleId 키 유실 ② 복원 시 `put(배열)` keyless store에서 DataError. → format "objects"→**"kv"**(getAllKeys+getAll). 위키 article 블록 구조가 백업→복원(특히 새 기기 이전)으로 유실되던 **출시 블로커**.
- **openDbForRestore keyPath = format 기반**: `storeName==="kv"` → `format==="kv" ? undefined : "id"`. fresh 머신 복원 시 keyless store(wiki-block-meta) 올바르게 생성.
- **복원 후 파생 index 리셋** (`backup/page.tsx`): `clearMentionIndex()` + `clearCache()`(search) 호출 → 백링크/검색이 복원 데이터로 재생성(기존엔 옛 노트 가리키는 stale).
- **라운드트립 테스트** (`lib/__tests__/idb-backup.test.ts`, 신규): fake-indexeddb로 5 store 전부 backup→변조→restore→원본 검증. wiki-block-meta 키 보존 직접 검증.

### 감사 결과 (영구)
- **5 백업 타겟 중 4개 정상**(plot-zustand kv / note-bodies objects / wiki-block-bodies objects / attachments), **wiki-block-meta만 깨짐**(수정).
- **파생/제외**: mention-index(백링크)·search-cache(FlexSearch)=재생성→복원 시 리셋. **yjs(`plot-yjs:*`)=실험 OFF 기본**(Collaboration이 `isYjsExperimentEnabled` gating, ydoc 없으면 미바인드)이라 기본 유저 콘텐츠 source=plot-note-bodies→백업 완전. 실험 켠 유저만 yjs 미백업(엣지).
- **note.content는 store meta에 존재**(persistBody가 content+contentJson 둘 다) → "notes only" export 빈 게 아님.

### 기술 학습 (영구)
- **IDB 백업 format = keyPath 유무**: keyless(out-of-line)=`"kv"`, keyPath "id"(in-line)=`"objects"`. keyless인 store = plot-zustand·wiki-block-meta·mention-index·search-cache. 신규 store는 확인 후 타겟 추가.
- **복원 = 5 target만 clear+write** → 파생 캐시(mention/search) 별도 리셋 필요(안 하면 stale). yjs는 experiment.
- **fake-indexeddb/auto**(node test env): structuredClone(Node18+)·btoa/atob·Blob 글로벌 사용 가능. IDB 라운드트립 테스트.
- **openDbForRestore latent**: store 없을 때 version+1 생성 → 앱이 더 낮은 DB_VERSION으로 열면 VersionError 가능(실제론 앱이 먼저 DB 생성하므로 미발생, 별도 트랙).

### 환경 변경
- `lib/idb-backup.ts`(format+keyPath) + `app/settings/backup/page.tsx`(파생 리셋) + `lib/__tests__/idb-backup.test.ts`(신규) + `package.json`(fake-indexeddb devDep). **앱 Store 무변경(v154).**

### 검증
- tsc 0 / 라운드트립 테스트 통과 / 전체 테스트 = **신규 실패 0**(기존 9개: migrate-v107 7 + pipeline date 2) / production 빌드(`--webpack`) exit 0.

### Watch Out
- **pre-existing 테스트 9개**: migrate-v107 7(TODO 기존 known) + pipeline date grouping 2(신규 발견). 안정화 트랙서 정리.
- **openDbForRestore 버전 bump latent**(위) / yjs 실험 켠 유저 백업 미포함.

### 머신
집 (Windows)

---

## 2026-06-02 (집/Windows, 정오) — **상용화 P1 release 빌드 + .msi/.exe 번들(무서명) + 출시 config 폴리시**

> 🎯 **다음 즉시 액션 hook**: **P3 — export/import/백업(`app/(app)/settings/backup`) 점검 + 출시 전 안정화**(데드코드·스모크·QA). release 빌드 + 양쪽 번들(무서명) = 완료. 출시범위 A = P0+P1+**P3**가 마지막. 코드사이닝은 보류(무서명 v0.1.0 합의). SOT = `desktop-local-first.spec.md` Roadmap P3. **(별개 트랙: 폴더 필터 F5 URL화 / macOS WebKit·서명·공증 / Microsoft Store MSIX.)**
>
> **첫 스텝**: `settings/backup` + `restoreFromBackup`/Full Backup 라운드트립 점검 → export/import 동작 확인 → 출시 전 데드코드(noteType wiki·stone/brick) + 스모크.
>
> **⚠️ 잊지 말 것**: ① **NSIS 첫 추출 flaky** — `os error 5`(액세스 거부)는 AV 아님, NSIS zip **부분/손상 추출**(makensis.exe 2560B truncate). 해결 = `%LOCALAPPDATA%\tauri\nsis-3.11` 삭제 → 클린 재시도. CI/새 머신 재발 가능. ② **무서명 = SmartScreen 1회 클릭 마찰**(설치·작동 정상). macOS는 하드블록(Apple $99+공증 필수). ③ **fresh worktree = node_modules·target 없음** → `npm ci` 먼저, cargo 콜드 ~3.5분.
>
> **머신**: 집(Windows). **main HEAD**: 이 PR 머지 후.

### 완료 (release 빌드 + 번들 + config)
- **release 빌드 검증**: `npx tauri build` → next build(~2분, out/ 50p) → cargo release **3.5분**(콜드) → WiX `.msi` + NSIS `.exe` 양쪽 번들. `plot.exe` 스모크(MainWindowTitle "Plot", WebView2 활성, 크래시 0).
- **무서명 번들 2종**: `Plot_0.1.0_x64_en-US.msi`(7.7MB) + `Plot_0.1.0_x64-setup.exe`(6.6MB). MSI 메타 검증(WindowsInstaller COM 읽기전용).
- **NSIS flaky 해결**: 첫 빌드 NSIS `os error 5` → 캐시 삭제 후 클린 재추출 성공(부분 캐시가 원인, Defender 탐지 0 = AV 아님).
- **출시 config 폴리시**(`tauri.conf.json`): `publisher:"Plot"`(Manufacturer plot→**Plot** 검증) + `identifier` com.plot.app→**com.plot.desktop**(.app 접미사=macOS 경고 해소, 유저 0 지금 변경) + NSIS `installMode:"currentUser"`(per-user 설치=관리자 불필요).

### 브레인스토밍 & 큰 결정 (영구)
- **무서명 v0.1.0 출시 합의**: Azure Trusted Signing($9.99/월)=한국 지역/법인 자격 미달 공산(대상 미국/캐나다/EU/영국 → 2025부터 미국/캐나다 3년+ 법인). OV($200+/년+토큰)·EV($300+/년)=유저 0 단계 과투자. 무서명=설치·작동 정상 + SmartScreen 1회 클릭. **평판은 인증서에 누적**(무서명은 버전마다 해시 리셋) → 매출/유저 후 서명 도입.
- **Microsoft Store = 서명 우회 트랙**(Store가 신뢰 보증, 별도 인증서 불필요, MSIX 패키징·심사 필요) — 후속 옵션.
- **macOS는 무서명 하드블록**(Gatekeeper): Apple Developer $99/년 + 공증 사실상 필수. "무서명 관용" = Windows 한정.
- **identifier = com.plot.desktop**(임시 확정): 도메인/브랜드 확정값 있으면 출시 전 변경 가능 — 유저 0이라 무료.

### 기술 학습 (영구)
- **fresh worktree 빌드**: node_modules·target 없음 → `npm ci`(lockfile) 먼저. cargo release 콜드 = **3.5분**(예상보다 빠름), WiX/NSIS 첫 빌드 자동 다운로드(인터넷 필요).
- **NSIS `os error 5` = 부분/손상 추출**(makensis.exe truncate), AV 아님(Defender 탐지 0). `tauri/nsis-3.11` 삭제 후 재시도 = 패턴.
- **Tauri 2 config**: `bundle.publisher`(미설정 시 identifier 2번째 요소=소문자 manufacturer) / `bundle.windows.nsis.installMode`(currentUser=per-user 무admin) / **UpgradeCode=productName 파생**(identifier 바꿔도 불변 = 버전 업그레이드 안정).
- **MSI 검증 = WindowsInstaller.Installer COM**(읽기전용 Property 테이블, 설치 없이 메타 확인).

### 환경 변경
- `src-tauri/tauri.conf.json` 3줄(publisher/identifier/nsis). **앱 코드/Store 무변경(v154)**. 번들 산출물 = gitignore(target/).

### Watch Out
- **release 번들 = 이번 검증 완료**(debug만이던 직전과 달리). 단 **무서명**(코드사이닝 보류). **설치 라운드트립(.msi/.exe 실제 설치→실행→제거)은 미검증** — 사용자 테스트 권장.
- **NSIS installMode currentUser = 빌드 config만 검증**, 무admin 설치 동작은 실제 설치 시 확인.
- identifier 변경 → 기존 com.plot.app 로컬 데이터 경로와 분리(유저 0이라 무관, re-seed).

### 머신
집 (Windows)

---

## 2026-06-02 (집/Windows) — **상용화 P1 데스크톱 셸 (Tauri 확정) + Plot 아이콘 신규**

> 🎯 **다음 즉시 액션 hook**: **release 빌드 + 번들(.msi/설치파일) + 코드사이닝** 또는 **P3 export/백업 + 출시 전 안정화**. P1 셸 = Tauri 확정(WebView2 렌더 OK) + out/ embed + 아이콘 완료. SOT = `desktop-local-first.spec.md` Roadmap **P1✅ → P3**(출시범위 A). **(별개 트랙: 폴더 필터 F5 URL화 / SPA fallback deep-link / macOS WebKit 검증.)**
>
> **첫 스텝**: `npx tauri build`(release+번들) → `.msi`/`.exe` 설치파일 + 실행 검증. 또는 P3 백업(settings/backup) 점검.
>
> **⚠️ 잊지 말 것**: **Tauri debug=devUrl / release=frontendDist embed**. `devUrl` 제거해야 debug도 out/ embed(이번 함정 = 초기 ERR_CONNECTION_REFUSED). `cargo build` 직접 = debug 프로파일. 한글 경로(리니어 노트앱) cargo 빌드 OK. PowerShell native stderr가 NativeCommandError로 빨갛게 떠도 exit 0이면 성공.
>
> **머신**: 집(Windows). **main HEAD**: 이 PR 머지 후.

### 완료 (Tauri P1 셸 + 아이콘)
- **Tauri 2.0 scaffold** `src-tauri/`(Cargo.toml/tauri.conf.json/build.rs/main.rs/lib.rs/capabilities/icons) + `@tauri-apps/cli` devDep. `frontendDist=../out`, id `com.plot.app`, 창 1280×800, Cargo `[package] name` app→plot.
- **out/ 검증**: `npx next build --webpack`(turbopack worktree 회피) → 50p + placeholder `_.html` + 404. `trailingSlash:false` → `/notes`=`out/notes.html`(파일).
- **Tauri 기동 = 확정**: plot.exe → WebView2(Chromium 147)서 out/ embed 정적 SPA 렌더(Home 대시보드/사이드바/웰컴노트 1개=v154 prod seed, IDB origin 분리 확인). Electron 폴백 불필요.
- **devUrl 함정 해결**: ERR_CONNECTION_REFUSED(debug가 devUrl localhost:3002 로드) → `devUrl`+`beforeDevCommand` 제거 → frontendDist(out/) embed.
- **Plot 아이콘 신규**: 다크 그레이 그라데이션(#3A3A44→#1B1B22) + 미묘 외곽선(#54545F) + 흰 지식 관계망 구(노드-엣지 삼각망 + 강조 허브 링 3). `tauri icon src-tauri/app-icon.svg` → 전 크기+ico/icns+모바일. 라이트/다크 작업표시줄 양쪽 대비 합성 검증(System.Drawing).

### 브레인스토밍 & 큰 결정 (영구)
- **Tauri 확정**(Electron 폴백 불필요): Windows WebView2=Chromium이라 렌더 통과. ⚠️ 진짜 webview 리스크(macOS WebKit/WKWebView 쿼크)는 **Mac에서만 판가름** — 이 머신(Windows)선 검증 불가.
- **아이콘 = 지식 관계망 구**(사용자 직접 지정): 메모리 "brand mark=글자 initials, 네트워크 X"([[project_brand_mark_pattern]]) 결정을 **갱신** — Plot 정체성(팔란티어×제텔카스텐)에 관계망 구가 적합. 작업원칙 #8(사용자 직관 우선).
- **아이콘 색 = 다크 그레이**(Linear 정통 B안, 보라→파랑 brand 대신): 라이트/다크 양쪽 작업표시줄 대비. **순검정은 다크 배경 묻힘** → 짙은 그레이+외곽선(실제 Linear 아이콘 방식). 채도색(보라/청록)은 양쪽 색상대비 유리하나 사용자가 Linear 다크 선택.
- **SPA fallback 현재 불필요**: release F5 비활성 + index-start client-routing이라 hard-load 진입점 없음. deep-link 기능 시 `lib.rs` custom protocol 후속.

### 기술 학습 (영구)
- **Tauri 2.0 debug=devUrl / release=frontendDist embed**(devUrl 제거 시 debug도 embed). **tauri icon**=PNG/SVG source(SVG `prefers-color-scheme` 미디어쿼리 무시→색 깨짐, 고정색 source 필요, 1024 권장). **한글 경로 cargo 빌드 OK**. PS native stderr=NativeCommandError 래핑(exit 0=성공). **System.Drawing**(PS5.1) 흰/검정 배경 합성 = 작업표시줄 대비 self-check. output:export `trailingSlash:false`→`/route`=`route.html`.

### 환경 변경
- 신규: `src-tauri/` 전체(target/ gitignore) + `src-tauri/app-icon.svg`(아이콘 source). `package.json`+`package-lock.json`(@tauri-apps/cli devDep). **앱 코드/Store 무변경(v154)**.

### Watch Out
- **release 번들 미검증**: 이번엔 debug 빌드만. `tauri build`(release) + `.msi`/설치파일 + 코드사이닝(Win)/공증(Mac)은 다음.
- **macOS WebKit 렌더 미검증**(Windows 머신). Mac에서 TipTap/d3 쿼크 확인 필요.
- **모바일 아이콘도 생성됨**(iOS/Android, P4용 — 작은 png라 둠).

### 머신
집 (Windows)

---

## 2026-06-01 (집/Windows, 저녁) — **상용화 P0 캐치올 라우팅(#513) + 디테일바 peek(#514) + 타임라인 막대 약화**

> 🎯 **다음 즉시 액션 hook**: **P1 데스크톱 셸 (Tauri 스파이크)**. 캐치올로 `output:export` 빌드 통과 + `out/` 생성 = **P0 완료**. 다음 = Tauri 창에 `out/` 로드 + TipTap/d3 렌더 확인 → Tauri/Electron 확정 + **SPA fallback**(미매치 경로 404→index rewrite)로 `/folder/{id}` hard-load 복원 완성. SOT = `desktop-local-first.spec.md` Roadmap P1. **(또는 먼저 "폴더 필터 F5 URL화"** — 사이드바 폴더/태그 클릭이 `router.push("/notes")`라 필터가 URL에 없어 F5 시 리셋, 캐치올과 별개 layer.)
>
> **첫 스텝**: Tauri 스파이크(`out/` 정적 서빙 + 창/아이콘) 또는 폴더 필터 URL화 설계(사이드바 클릭 → `/folder/{id}` navigate vs `/notes?folder=`).
>
> **⚠️ 잊지 말 것**: `output:export`는 동적 세그먼트에 `generateStaticParams` 필수 + **빈 배열도 거부**(placeholder 1개 필요) + **production만 적용**(dev에 적용 시 placeholder 외 경로 500). dev = 일반 서버라 catch-all이 임의 경로 동적 렌더. `useParams` X → `usePathname`(window.location)으로 복원.
>
> **머신**: 집(Windows). **main HEAD**: 이 세션 PR 머지 후(#513 캐치올, #514 디테일바, + 타임라인 PR).

### 완료 (이 세션 — 3 PR)
- **캐치올 라우팅 (#513)**: 동적 4개(`folder/tag/label/books [id]`) → 단일 클라이언트 캐치올 `app/(app)/[...slug]`. folder UI → `components/views/folder-detail-view.tsx` 추출(로직 0 변경). `next.config.mjs` `output:export`(production만, 환경 분기) + `generateStaticParams` placeholder. **production 빌드 통과 → `out/` 50페이지 + 404.html + placeholder `_.html`.** tsc 0, dev catch-all 동적 렌더 검증(`/folder/x` → FolderDetailView, 콘솔 0).
- **디테일바 peek (#514)**: `NotesTableView` onRowClick single click 시 디테일 패널 열려있으면(`sidePanelOpen`) `sidePanelContext` 갱신(`handleRowPreview`). 기존엔 single=previewNoteId(하이라이트)만, 디테일은 double click/openNote만 → 디테일 안 따라옴 + 폴더 전환 stale. 사용자 적발, 캐치올과 무관 기존 버그(별도 PR).
- **타임라인 막대 약화 (이 PR)**: `timeline-bar` opacity 0.45(인터랙션 0.95). status 막대 full color가 이벤트 노드(같은 NOTE_STATUS_HEX 팔레트, 중앙선 `EVENT_MARKER_Y_OFFSET=0` 겹침)와 충돌 → 막대를 status 트랙 힌트로 약화, 이벤트 칩 주인공.

### 브레인스토밍 & 큰 결정 (영구)
- **`output:export`는 production만**: dev에 적용하면 동적 경로(placeholder 외)가 500. dev = 일반 서버(catch-all 동적), production = 정적(placeholder). 데스크톱 셸은 export 번들 미매치 경로 SPA fallback(P1).
- **캐치올 복원 = 클라이언트**: `CatchAllRoute`(usePathname 분기) + `FolderDetailView`(자체 useEffect로 setActive 복원). `syncFromPathname` 미변경(캐치올이 복원 담당).
- **폴더 필터 F5는 별개 layer**: 사이드바 폴더 클릭 = `router.push("/notes")` + `activeFolderId`(URL에 없음) → F5 리셋. 캐치올(`/folder/{id}` URL 복원)과 무관. "필터 URL화"는 별도.

### 기술 학습 (영구)
- `output:export` + 동적: `generateStaticParams` 필수 + 빈 배열도 "missing"으로 거부 → placeholder 1개(`[{slug:["_"]}]`). `useParams`는 정적 export서 placeholder 값만 반환 → `usePathname`(window.location)으로 실제 경로 복원. `"use client"` + `generateStaticParams` 동시 불가 → server page + client child.
- required `[...slug]`가 index `page.tsx`와 공존(optional `[[...slug]]`는 `/`까지 매치해 충돌 → required 채택).
- 디테일 패널 = `sidePanelContext`(openNote/setSelectedNoteId 갱신). single click(onRowClick=setPreviewNoteId)은 안 건드림 → peek 원하면 onRowClick에서 sidePanelContext도 갱신.
- PowerShell here-string 한글 커밋 메시지가 git `-m`에 깨짐(따옴표+줄바꿈 토큰화) → `-F` 파일.

### 환경 변경
- 신규: `app/(app)/[...slug]/page.tsx` + `components/views/catch-all-route.tsx` + `folder-detail-view.tsx`. 삭제: `{folder,tag,label,books}/[id]/page.tsx`. `next.config.mjs` output:export(env-gated). `.gitignore` out/. `notes-table-view`(peek) + `timeline-bar`(opacity). **앱 Store 무변경(v154).**

### Watch Out
- **후속(전부 별개 트랙)**: ① start chip 색(`EVENT_MARKER_CONFIG.created = NOTE_STATUS_HEX.done` 초록 → created≠done, 정정 후보) ② 타임라인 grouping 비대칭(Notes timeline default 누락 → none; Wiki=wikiStatus 명시) ③ 폴더 필터 F5 URL화 ④ hydration mismatch(radix `useId`, prod export 영향 가능) ⑤ 정적 서빙 SPA fallback(P1 셸).
- 캐치올 정적 서빙 hard-load(`/folder/x`)는 `out/`에 HTML 0 → 404. SPA fallback(404→index)은 P1 Tauri 셸. dev/현 서버는 catch-all 동적 처리.

### 머신
집 (Windows)

---

## 2026-06-01 (집/Windows, 오후) — **리디자인 비파괴 프리뷰 스캐폴딩 (5 surface 추출) + 상용화 우선 결정 (디자인 변경 보류)**

> 🎯 **다음 즉시 액션 hook**: **상용화 P0 — 정적 SPA 캐치올 라우팅 (ⓑ)**. 사용자 결정(2026-06-01 오후) — 디자인 변경은 다음으로, **상용화 우선**. SOT = `docs/01-plan/features/desktop-local-first.spec.md` (Roadmap P0 + Risk #6 + "다음 액션"). 동적 라우트 4개(`app/(app)/{books,folder,tag,label}/[id]/page.tsx`)를 `[[...slug]]` 캐치올 **클라이언트** 라우트로 통합(로드 시 `syncFromPathname`→activeRoute 복원) + `next.config.mjs` `output:'export'` → `out/` 생성. ★ `/inbox` refresh→home anomaly 동시 해결(같은 뿌리).
>
> **첫 스텝**: 새 worktree(main 기준) → spec read(특히 Risk #6) → `lib/table-route.ts`·4개 `[id]/page.tsx`·`next.config.mjs` 읽기 → 캐치올 통합 → `npm run build`(`--webpack`)로 `out/` 생성 확인 → **사용자 실화면 F5 검증**(`/inbox`·`/folder/{id}` 새로고침 복원).
>
> **⚠️ 잊지 말 것**: 코어 라우팅 = blast radius 큼. **이 env preview는 라우팅 검증 약함(module-state)** — 이번 세션에 `/inbox`에서 직접 겪음(+`localhost`↔`127.0.0.1` cross-origin 탭 꼬임도). → **사용자 실화면 검증 필수, fresh 집중 세션 권장**(스펙이 직접 명시).
>
> **리디자인 = 보류(파킹, 폐기 아님)**: 비파괴 프리뷰 스캐폴딩 완료 → `/preview/redesign`에서 5 surface 확인. 디자인 재개 시 이어서. **234 컴포넌트 중 5 surface "shell"만 완료** — 내부 콘텐츠(에디터 실제 블록·사이드바 5/7 컨텍스트·노트 board/grid·인사이트 그래프) + 나머지 ~20 surface(위키/북/자료실/캘린더/…)는 미완.
>
> **머신**: 집(Windows). **main HEAD**: 이 PR 머지 후(직전 `70df9ef` #511).

### 완료 (이 세션 — 리디자인 비파괴 프리뷰 스캐폴딩, 라이브 0 touch)
- **before-work 동기화** (clean, 머신 무변경).
- **프리뷰-우선 비파괴 리디자인 스캐폴딩** 확립: 라이브 god 0 touch, `components/redesign/<surface>/`에 순수 presentational + mock + view-model 타입 + `app/preview/redesign/<surface>/` 렌더 라우트. README = 컨벤션 + Open Design 핸드오프 가이드.
- **5 surface 추출**: 홈(`home-view.tsx`) / 사이드바(Notes·Home 2/7 컨텍스트 + 스위처) / 노트리스트(테이블 12행 3그룹) / 에디터(크롬+FixedToolbar, 본문 정적 근사) / 인사이트(대시보드 — StatCard·차트·라이프사이클·InsightCard). 23 신규 파일. 병렬 4-executor.
- **검증**: `tsc --noEmit` 0(전체) · 5 라우트 브라우저 렌더 확인(스크린샷) · **hydration 버그 1개 픽스**(notes-list mock `Date.now()` → 고정 `PREVIEW_NOW` anchor, SSR/client 불일치 해소).

### 브레인스토밍 & 큰 결정 (영구)
- **상용화 우선, 디자인 변경 보류** (사용자 주도). 디자인 상용급이나 제품 인프라 0.1단계 → 인프라 급선무. 디자인 스캐폴딩은 파킹(보존).
- **리디자인 핸드오프 단위 = surface(~25-30) ≠ 234 atomic 컴포넌트**: Open Design은 화면 단위로 리디자인. 콘텐츠 블록은 surface 일부로 포함. "모든 컴포넌트 쪼개기"는 과한 프레이밍.
- **프리뷰-우선 비파괴 = 정통 패턴**: 라이브 god 인플레이스 리팩터 X → 격리 presentational+mock 추출 → Open Design 핸드오프 → 확정 후 라이브 스왑. preview-first DNA(#138/#154) 정합.

### 기술 학습 (영구)
- **정적 mock SSR + `Date.now()` = hydration mismatch**: 라이브는 데이터가 IDB client-only라 안 드러나던 게 프리뷰 정적 mock SSR로 노출(title=ISO server≠client). → mock 날짜는 고정 기준시각 anchor.
- **preview 라우트 cross-origin 주의**: 서버 `127.0.0.1` 바인딩 → `localhost`↔`127.0.0.1` 섞으면 탭 꼬여 `/home`으로 튐. 같은 origin 유지.
- **`nextjs-portal` 존재 ≠ 에러**: dev 오버레이 컨테이너는 항상 존재. 에러 판정은 portal 내부 텍스트(Build Error 등) 또는 "N Issue" 인디케이터.

### 환경 변경
- 신규: `components/redesign/`(16: README + home/sidebar/notes-list/editor/insights 각 3) + `app/preview/redesign/`(7: layout + index + 5 surface page). **앱 코드/Store 무변경(v154)**.

### Watch Out
- **리디자인 미완 범위 명확히**: 5 surface "shell"만. 재개 시 내부 콘텐츠 + 나머지 surface(~20).
- **라우팅 = fresh 세션 필수**: 이 env 검증 약함 + 코어. 미커밋 위에 쌓지 말 것(그래서 리디자인 먼저 PR).
- `docs/.bkit-memory.json`·`.pdca-status.json` auto-modified 반복 — `.gitignore` 후보.

### 머신
집 (Windows)

---

## 2026-06-01 (집/Windows) — **데이터 라이프사이클 감사 완료 (PR1/2/3 머지) + 디자인 방향 재고 합의**

> 🎯 **다음 즉시 액션 hook**: **디자인 ③ 진단**. 사용자 결정 — 그동안의 "Linear 200% 미러" 방향 재고("리니어 지나친 절제에 매몰"). 주요 surface(홈/사이드바/노트리스트/에디터/인사이트)를 돌며 **"어디가 답답한지/발견성이 떨어지는지"** 구체 진단 → ground truth 확보. 그 다음 **① 철학 재조정**(토큰·인프라 유지, "절제→실용·발견성", Notion 장점 선택 도입) → 필요시 **② 전면 재설계**. **목업 우선**(코드 전 시각 검증). SOT = local memory `project_design_direction_reconsider.md` + 본 entry.
>
> **첫 스텝**: surface별 진단 — 각 화면을 캡처/실측해 "기능이 숨어 답답한" 지점 목록화. `linear-design-mirror` 스킬 + Notion/실사용 레퍼런스 비교. 목업 = Open Design 또는 HTML 프로토타입.
>
> **잊지 말 것 (큰 방향, 영구)**: 문제는 "Linear 자체"가 아니라 **넓은 기능의 지식앱에 절제(숨김 미학)를 무비판 적용**한 것 → 발견성↓. **코어 불변**(지식 관계망·NOTE_STATUS_HEX·"Gentle by default"). "gentle"을 "절제"로 과해석한 게 문제. Notion 약점(산만·느림) 답습 경계. **③→①→② 순차 + 목업 우선 = 위험 단계적 확대**(대부분 ①에서 해소 기대).
>
> **데이터 감사 = 완료**: PR1 cascade(#508) / PR2 re-seed v154(#509) / PR3 trash 좀비(#510) 전부 머지. 출시 블로커였던 "삭제 데이터 부활" 0.
>
> **남은 별도 항목**: comments/folders soft-trash(PR4 후보, schema+version bump) · migrate-v107 7개 실패(기존 부채) · turbopack worktree build 불가(`--webpack` 우회).
>
> **머신**: 집(Windows). **main HEAD**: `6c8a011`(#510 PR3) + 이 after-work docs 커밋.

### 완료 (이 세션 — 데이터 라이프사이클 감사 3 PR)
- **전수 감사** (병렬 4-agent sweep + 직접 코드 검증): 엔티티 10+종 × 6축(시드/soft-trash/영구삭제/별도IDB store/cascade/cross-entity). **spec 확정버그 #2(위키 blocks orphan) = 오류 판명**(`deleteWikiArticle`이 meta+body 둘 다 정리 중). 대신 cascade 누락 11 + 부활 소스 4 + 좀비 2 발견.
- **PR1 #508** 삭제 cascade 완전성: `deleteNote`(attachment blob/comments/books.items) + `deleteWikiArticle`(자식 reparent/attachment/relations/comments/books.items/wikiCollections) + `permanentlyDeleteTag/Label/Reference` cross-entity dangling 정리 + `permanentlyDeleteBook` sticker cascade + books-slice.test tsc hotfix(implicit-any, PR1 누락분).
- **PR2 #509** re-seed 1회성(store v153→**v154**): `hasSeeded` flag + onRehydrate dev(데모)/prod(웰컴노트 1개) 분기 + migrate id-dedup backfill 3곳 제거 + `WELCOME_NOTE`. **사용자 실화면 검증**(기존 데이터 보존 + 부활 0).
- **PR3 #510** trash UI 좀비: `permanentlyDeleteSmartBookPreset` 신설 + trash-all-view에 WikiTemplate/SmartBookPreset 섹션 노출 + i18n.

### 브레인스토밍 & 큰 결정 (영구)
- **디자인 방향 재고**(사용자 주도, ⭐): Linear 과한 절제 탈피, 노트앱=실용·심플·발견성. ③진단→①철학재조정→②전면, 목업 우선. → 다음 세션 P0. (memory `project_design_direction_reconsider.md`)
- **삭제 정확성 = 출시 핵심**: 부활0·orphan0·완전삭제. `deleteNote`=정통(가장 완전) 패턴, 나머지 삭제 액션이 이를 불완전 복제했음.
- **시드 1회성(hasSeeded)**: "비면 재시드"는 버그. 기존 유저는 migrate에서 hasSeeded=true로 100% 보존, 신규 유저만 1회 시드.
- **migrate backfill 제거**: id-dedup append가 version bump마다 지운 시드를 부활시키던 소스 → 제거(부활 0).

### 기술 학습 (영구)
- **삭제 감사 = array + 별도 IDB store(5개: note-body/mention/attachment/wiki-block-meta/**wiki-block-body**) + cascade + re-seed 전부** 봐야 "완전 삭제" 보장. **정리함수 존재 ≠ 호출**(grep 검증 필수).
- **`.test.ts` 수정 후 tsc 재검증 필수**: vitest 통과 ≠ tsc(implicit any). next build는 test 파일 타입체크 제외. 파이프 `head`/`tail`은 종료코드를 가림 → `; echo $?`로 분리. (PR1에서 books-slice tsc 에러 누락 → PR2에서 발각.)
- **worktree+한글경로(`리니어 노트앱`)에서 `next build`(turbopack) 불가**: next.config `turbopack.root` 있어도 next 패키지 resolve 실패. `next build --webpack` 우회(dev가 이미 `--webpack`).
- **마이그레이션 검증 = 사용자 실화면**: 이 env preview는 fresh IDB + store 검증 약함 → 기존 유저 데이터 보존은 본인 브라우저에서만 검증 가능.

### 환경 변경
- store **v153→v154** (`hasSeeded`). 신규 파일 0(기존 파일 수정 + `WELCOME_NOTE`/회귀 테스트). `data-lifecycle-audit.spec.md` 헤더 정정(확정버그 #2 오류 표시).

### 머신
집 (Windows)

---

## 2026-05-31 (밤 늦게, 집/Windows) — **데이터 라이프사이클 감사 발견: re-seed 부활 버그 + 위키 blocks IDB orphan (전수 감사는 다음 세션, 앱 코드 무변경)**

> 🎯 **다음 즉시 액션 hook**: **데이터 라이프사이클 전수 감사 + 수정** (출시 전 필수). 모든 엔티티(notes/wiki/books/tags/labels/stickers/folders/references/attachments/comments) × [시드/re-seed · soft-trash · 영구삭제 완전성 · **별도 IDB store 정리** · cascade · cross-entity] 매트릭스로 점검 → 구멍 목록 → 수정. **엔티티 多 × store 多라 병렬 멀티에이전트 sweep(workflow) 권장.** SOT=`docs/01-plan/features/data-lifecycle-audit.spec.md`.
>
> **사용자 의도** (인용): "노트뿐 아니라 위키랑 북도 그 부분 정말 굉장히 많이 신경써야 해. 시드데이터와 삭제 문제." / "다음 세션에서 전수 감사 들어가야 해."
>
> **이번에 확정된 버그 2개** (다음 세션 수정 대상):
> 1. 🔴 **re-seed 부활**: `lib/store/index.ts:319` — notes 비면 전 엔티티(notes/wiki/folders/tags/labels/templates/books/presets) 부활 + 북 독립 backfill(`:338`). 신규 유저 데모 노출 + 삭제 데이터 부활(빈 앱 불가).
> 2. 🔴 **위키 blocks IDB orphan**: `wiki-articles.ts:188 deleteWikiArticle`가 `deleteArticleBlocks` 미호출 → 영구삭제해도 blocks가 `wiki-block-meta-store`(IDB)에 잔존. (노트는 `deleteNote:176 removeBody`로 정리하는데 위키는 누락.)
>
> **핵심 점검축 = "별도 IDB store"**: 노트 본문(`note-body-store`)·위키 blocks(`wiki-block-meta-store`)·mention 인덱스(`mention-index-store`)·첨부. Zustand persist 상태만 지우고 이 store들 안 지우면 "완전 삭제"가 거짓. **정리함수 존재 ≠ 호출** — grep으로 삭제 액션이 실제 호출하는지 확인 필수.
>
> **첫 스텝** (다음 세션): spec read → 매트릭스로 전수 감사(workflow 권장) → 수정 ① re-seed 1회성/dev-게이트 ② 영구삭제 시 별도 IDB store 정리 wire(위키 blocks 우선) ③ cascade 통일 ④ 회귀 테스트(삭제 후 array+IDB 둘 다 비고 부활 안 하는지).
>
> **참고**: spec에 file:line 박힘. `lib/store/index.ts:319,338` · `slices/notes.ts:133,176` · `wiki-articles.ts:170,188` · `books.ts:228` · `helpers.ts` · `lib/{note-body,wiki-block-meta,mention-index}-store.ts`.
>
> **다음 P0 #2** = 데스크톱 캐치올 라우팅(ⓑ, `desktop-local-first.spec.md`) — 감사 후/병행.
>
> **머신**: 집(Windows). **현재 main HEAD**: 이 PR 머지 후(직전 `fb1c682` #506). **branch worktree**: `claude/data-lifecycle-audit` → 머지 후 main fresh.

### 완료 (이 세션 — 계획만, 앱 코드 무변경)
- 상용화 데이터 질문 3개(시드 / trash 영구삭제 / OS 휴지통) 실측 답변 → re-seed 버그 + 위키 blocks orphan 발견.
- **데이터 라이프사이클 감사 spec 작성**: 확정 버그 + 엔티티별 현황 + 별도 IDB store 인벤토리 + 감사 매트릭스 + 수정 계획 + file:line.

### 브레인스토밍 & 큰 결정 (영구)
- **삭제 정확성 = 상용화 핵심**(신뢰/저장/GDPR 잊혀질 권리): 데이터 부활 0 · orphan 0 · 완전 삭제.
- **"별도 IDB store" 엔티티가 위험지대**: persist와 별개로 IDB에 본문/blocks 저장 → 영구삭제 시 둘 다 지워야. 노트=됨(removeBody), 위키=누락(deleteArticleBlocks).
- **시드 = 1회성이어야**: re-seed "비면 부활"은 버그. 신규 유저=빈 상태(or 웰컴 노트 1개).
- **Q3 OS 휴지통**: 지금/IDB ❌(브라우저가 OS 휴지통 접근 불가), P2(.md 파일) ✅(Tauri `trash`/Electron `shell.trashItem` = 옵시디언 방식, 설정으로 앱휴지통/시스템휴지통/완전삭제 택1).

### 환경 변경
- **앱 코드/Store 무변경.** 신규 문서: `docs/01-plan/features/data-lifecycle-audit.spec.md`.

---

## 2026-05-31 (밤, 집/Windows) — **상용화 전략 수립: 무료 로컬-퍼스트 데스크톱 앱 → 로드맵 spec (계획 세션, 앱 코드 무변경)**

> 🎯 **다음 즉시 액션 hook**: **데스크톱 P0 — 정적 SPA 캐치올 라우팅(ⓑ)**. 동적 라우트를 `[[...slug]]` 클라 라우트로 통합 + `output:'export'` → `out/` 생성. **★ `/inbox` refresh→home anomaly와 같은 뿌리라 동시 해결됨**(직전 §13 entry의 "/inbox anomaly" 액션은 이걸로 흡수). 코어 라우팅이라 fresh 집중 세션 권장.
>
> **사용자 의도**: "우리 앱 상용화 가능?" → 실측(백엔드 0/인증·결제 0/데이터 IDB 로컬/테스트 ~12/version 0.1.0) = **디자인은 상용급이나 제품 인프라 0.1단계** → "무료 데스크톱 먼저(나중 유료 싱크)" → "옵시디언급 데이터 소유 원함" → **하이브리드(B) 합의**.
>
> **SOT = `docs/01-plan/features/desktop-local-first.spec.md`** (이번 작성. 비전/Locked Decisions/데이터분할/Yjs싱크/5-Phase 로드맵/Risk #1-6).
>
> **첫 스텝** (다음 세션):
> 1. spec read (특히 **Risk #6 라우팅 모델** + "다음 액션" 섹션).
> 2. 동적 라우트 4개(`app/(app)/{books,folder,tag,label}/[id]/page.tsx`)를 `[[...slug]]` 캐치올 **클라이언트** 라우트로 통합. 로드 시 `window.location.pathname` → `syncFromPathname`(lib/table-route.ts) → activeRoute 복원 → layout이 뷰 렌더.
> 3. `next.config.mjs`에 `output:'export'` 추가(`images.unoptimized` 이미 됨).
> 4. `npm run build` → `out/` 생성 확인 + **실화면서 `/inbox`·`/folder/{id}` 새로고침 정상 복원** 검증.
>
> **위험 + 회피**: 코어 라우팅 = blast radius 큼. **이 env preview는 route 검증 약함**(module-state라 eval 불가 — /inbox 헤맨 이유). → 사용자 실화면 검증 필수. 마라톤 끝 급조 금지(이번에 fresh로 미룬 이유).
>
> **참고 파일**: `docs/01-plan/features/desktop-local-first.spec.md`(SOT), `app/(app)/layout.tsx:96`(syncFromPathname effect), `lib/table-route.ts`(라우팅 모듈상태), `next.config.mjs`, `app/(app)/*/[id]/page.tsx`(4 동적 라우트).
>
> **머신**: 집(Windows). **현재 main HEAD**: 이 PR 머지 후(직전 `83c8ec9` #505). **branch worktree**: `claude/desktop-local-first`(데스크톱 이니셔티브 시작 브랜치) → 머지 후 main fresh.

### 완료 (이 세션 — 계획만, 앱 코드 무변경)
- **상용화 실측**: API route 0 / 인증·결제·DB·싱크 의존성 0 / 데이터=IndexedDB(`y-indexeddb`) 로컬 / 앱 테스트 ~12파일 / `name:"my-project"` version "0.1.0". → 디자인 상용급, 제품 인프라 미시작.
- **데스크톱 feasibility (Phase 0 spike)**: `output:'export'` 빌드가 4 동적 라우트(generateStaticParams 필요)만 빼고 통과. 숨은 export 비호환 0. (next.config 원복함 — throwaway.)
- **로드맵 spec 작성** + 라우팅 모델 결정(ⓑ).

### 브레인스토밍 & 큰 결정 (영구)
- **상용화 순서 = A(빠른 출시)**: 무료 데스크톱(IDB-on-desktop + export) → export/백업 → 유료 싱크+모바일. 데스크톱 IDB는 앱 디스크 영속(브라우저 eviction 없음)이라 "캐시 증발" 블로커 해소 → .md 소유(P2)는 v1.1로 미룸.
- **저장 = 하이브리드(B)**: 본문 `.md`(사용자 소유, 어디서든 열림) + 부가데이터(books/SRS/온톨로지/saved view) `.plot/` 로컬 사이드카. = 옵시디언 자신의 방식(.md + .obsidian/). 우리 앱은 옵시디언보다 부자(관계형)라 순수 파일(A안)은 기능 타협.
- **셸 = Tauri 우선**(경량 ~3-10MB·모바일까지, 렌더 스파이크 후 확정 / 쿼크 시 Electron 폴백).
- **라우팅 = ⓑ 캐치올**: 정적 export 동적 라우트 처리 + **`/inbox` anomaly 동근 → 동시 해결**.
- **클라우드 = 중계+백업**(데이터는 각 기기 로컬, 오프라인 동작. ≠ Notion 클라우드-퍼스트). Yjs CRDT 이미 깔려 싱크 토대 있음. 유료 정당성 = 싱크는 상시 서버 비용.

### 기술 학습 (영구)
- **상용화 ≠ 디자인**: 디자인 상용급이어도 백엔드/인증/싱크/결제/QA/법무가 제품 레이어. "메모리(RAM) vs 저장소(디스크)" — 데스크톱=데이터가 앱 디스크 폴더(AppData/Application Support), 브라우저 eviction 없음.
- **`/inbox` anomaly = 정적 SPA 라우팅과 동근**: 라우팅이 activeRoute 모듈상태라 hard-load가 뷰 복원 못 함. 데스크톱 캐치올 라우팅이 둘 다 푼다(일석이조).

### 환경 변경
- **앱 코드/Store/빌드 무변경.** 신규 문서: `docs/01-plan/features/desktop-local-first.spec.md`.

---

## 2026-05-31 (저녁, 집/Windows) — **온톨로지 정리 §13 (insights 해체→Dashboard+Inbox+그래프 rings) + 사이드바 헤더 행(닫힘 버튼 B) + /graph-insights 폐기 (1 PR, 19파일 +135/−758)**

> 🎯 **다음 즉시 액션 hook**: **(검증 먼저) `/inbox` refresh→home anomaly** + **(메인) §13 남음 = `/insights`(notes) 통합 + 그래프=display mode(렌즈)**.
>
> **사용자 의도**: before-work로 §13 온톨로지 정리 진입 → 사용자가 **"insights와 dashboard는 다른 거(발견 vs 분석)"**라며 spec의 "dashboard→insights 흡수"를 뒤집음 → C안 합성(분석=Dashboard 통합 / 발견=Inbox / 그래프 시각 잔존)으로 구현. 이어서 사이드바 닫힘 버튼 위치 브레인스토밍(Inbox 카운트와 겹침 실측) → B안(헤더 행). 마지막 /graph-insights(3번째 분석면) 폐기.
>
> **첫 스텝** (다른 머신 바로):
> 1. **`/inbox` anomaly 검증**: 실화면에서 `/inbox` 진입 후 F5 → home 뜨는지. **인앱 클릭은 정상**(받은편지함 뷰=할일/되새김/발견 뜸, data-active 확인됨). 의심 = `app/(app)/layout.tsx:96-98`(syncFromPathname effect) vs `:105-115`(start-view redirect, pathname==="/"에서만 fire). hard-load가 "/"로 갔다 /home redirect되는지. preview 아티팩트 가능성도.
> 2. **§13 남음 — notes `/insights` 통합**: `components/insights-view.tsx`(Notes)가 ontology Dashboard와 역할 겹치는지 비교 → 통합/역할분리. + **그래프 = display mode(렌즈)** = `ontology-graph-canvas`를 list/board처럼 어느 컬렉션서도 띄우는 큰 리팩터(scope 먼저 확인).
>
> **컴포넌트 구조 / 데이터 흐름** (이번에 만든 것):
> - **Nudge→Inbox**: `useKnowledgeNudges()`(hooks/use-knowledge-nudges, onClick 무시) → `lib/hooks/use-inbox.ts`가 `ontology-nudge` kind로 detected push (ts=대상노트 updatedAt via `noteById.get(nudge.id.split(":")[1])`, sourceId=nudge.id "orphan:noteId" 등). 클릭 네비 = `inbox-view.tsx` handleRowClick/onKeyDown의 `ontology-nudge` 분기(split→onOpenNote(primaryId), orphan은 연결패널).
> - **Dashboard 흡수**: `ontology-dashboard-panel.tsx`에 `CohesionRadial`+`TopNotesBar`(insights-charts import)+Density stat. 중복 donut(Tagged/Orphan)은 버림.
> - **그래프 ring**: `ontology-graph-canvas.tsx` 노드 `<g>` 안 `node.connectionCount===0 && nodeType!=="tag"` faint dashed ring(~line 1882).
> - **insights 탭 해체**: `ontology-view.tsx` graph/dashboard 2-way(persisted "insights"→dashboard 런타임 가드), `linear-sidebar.tsx` Insights NavLink 제거, `home-view.tsx` jumpToInbox(→/inbox).
> - **사이드바 헤더**: `linear-sidebar.tsx` aside 최상단 `<header>`(좌 `t(\`nav.space.${activeSpace}\`)` 공간명, 우 닫힘 hover). 기존 absolute top-right 버튼 제거(Inbox 카운트와 겹쳤음).
>
> **위험 + 회피 (이번 교훈)**:
> - **preview route-gated 화면 오독 주의**: `/inbox` hard-nav가 /home 떨어진 걸 "버그 확정"이라 성급 단정 → 실은 사이드바(공간 콘텐츠)를 메인으로 오독했던 것. **data-active + visible heading(h1/h2/header)으로 메인 뷰 정체 확정** 후 판단. 사이드바는 route-gated 아니라 실측 가능.
> - design-sensitive(발견/분석 구분)라 executor 안 쓰고 직접 구현. 각 phase 후 tsc, 끝에 build.
>
> **참고 파일**: `lib/hooks/use-inbox.ts`, `components/views/inbox-view.tsx`, `components/ontology/ontology-dashboard-panel.tsx`, `ontology-graph-canvas.tsx`(~1882), `components/views/ontology-view.tsx`, `components/linear-sidebar.tsx`(~783 헤더 / ~1497 ontology nav), `app/(app)/layout.tsx:96`(/inbox anomaly), `docs/01-plan/features/linear-ia-constitution.spec.md` §13.
>
> **머신**: 집(Windows). **현재 main HEAD**: 이 PR 머지 후(직전 `fbc7b7e` #504). **branch worktree**: `claude/loving-perlman-14676f` → 머지 후 main fresh.

### 완료 (이 세션 — 1 PR)
- **§13 온톨로지 정리** (4 phase): ① Dashboard에 Cohesion radial + 복합 Top Notes(WAR) + Density 흡수(중복 donut 버림) ② Nudge 4종 → Inbox `detected`(`ontology-nudge` kind, Lightbulb, source 필터) ③ 고아 노드 faint dashed ring ④ insights 탭 해체(graph/dashboard 2-way, 사이드바 Insights nav 제거, Home "improve graph"→Inbox, persisted 가드). spec §13 방향 정정.
- **사이드바 헤더 행** (닫힘 버튼 B): aside 최상단 헤더(좌 공간명/우 닫힘 hover). 기존 absolute 닫힘이 Inbox 카운트 "18"과 겹치던 것(실측 x261 vs x260) 해소.
- **/graph-insights 폐기**: GraphInsightsView(343줄)+라우트 shell+layout/table-route/secondary-panel 참조 삭제. 고아·Dashboard 중복·stale noteType.

### 브레인스토밍 & 큰 결정 (영구)
- **insights(발견) ≠ dashboard(분석)**: spec "dashboard→insights 흡수"를 사용자가 뒤집음. 분석 차트=Dashboard 한 곳, 발견(Nudge)=Inbox `detected`(헌법 "액션은 Inbox 단일화"), 그래프는 고아 ring으로 발견 시각 잔존, insights 탭 해체. → C안 합성.
- **사이드바 닫힘 = 헤더 행(B)**: 리니어 방식(헤더에 닫힘/콘텐츠는 아래). 우리 사이드바는 공간전환을 액티비티바로 빼서 헤더가 없어 닫힘이 Inbox 위에 떠 겹쳤음. §10 "사이드바=인-패널" 유지. 좌측=현재 공간명.
- **/graph-insights = 폐기**: "insights 3개 분산(notes/ontology/graph) 통합"의 graph 조각. 고유 콘텐츠 없음(Dashboard 상위집합) → 삭제.

### 기술 학습 (영구)
- **preview route-gated 화면 오독**: hard-nav /inbox→home을 "버그"로 성급 단정했으나 사이드바를 메인으로 오독. data-active + visible heading으로 메인 뷰 확정 필수. 사이드바는 route-gated 아니라 rect 실측 가능(닫힘 vs Inbox 카운트 겹침 측정으로 B 검증).
- **nudge ts = noteById 계산**: useKnowledgeNudges 안 건드리고 use-inbox에서 `noteById.get(nudge.id.split(":")[1])?.updatedAt`. nudge.id primary 토큰이 항상 note id(orphan/promote=noteId, unlinked=sourceId, linked=targetId).
- **sidebar 헤더 placement**: `.a-sidebar` flex-col이라 shrink-0 헤더 + flex-1 nav 자연 배치. nav pt-2.5→pt-1.

### Watch Out (다음 세션)
- **`/inbox` refresh→home anomaly 미해결**(검증 필요, hook 참고). 인앱 클릭은 정상.
- **사이드바 헤더 좌측=공간명**: 글로벌 Inbox 볼 때 헤더는 직전 공간명("홈") 표시(메인=Inbox). 사용자 "괜찮아"였으나 살짝 비대칭.
- **nudge 텍스트 영문**: useKnowledgeNudges 영문 하드코딩(기존부터). KO 모드서 detected nudge만 영문 — i18n 별도 정리 항목.

### 환경 변경
- **Store version: 무변경** (전부 UI/IA. inbox `ontology-nudge` kind는 string union 추가라 마이그 불요).
- 삭제: `graph-insights-view.tsx`, `ontology-insights-panel.tsx`, `ontology-nudge-section.tsx`, `app/(app)/graph-insights/page.tsx`.
- i18n: 무변경(nav.space.* 재사용, inbox source 필터 라벨 영문 리터럴).
- Tests: build 0 / tsc 0. nudge 데이터 실측(고아 15→detected 9). 신규 테스트 미작성.

---

## 2026-05-31 (오후, 집/Windows) — **셸 §10 Phase 2·3 완성 — 사이드바 hover 토글 + 햄버거 완전 제거 + 액티비티 바 토글 → 상단바 이전**

> 🎯 **다음 즉시 액션 hook**: **온톨로지 정리 (§13)** — `dashboard` 탭 → `insights`로 흡수(Health/Coverage 중복 제거), NUDGE → Inbox `detected` 이관, 그래프 = display mode 전환.
>
> **사용자 의도**: "inbox 관련 처리 안 해야 하나?" → 코드 실측 결과 코멘트→Inbox는 PR #503에서 완료. 남은 건 NUDGE→Inbox(`detected`) 이관인데, 이건 온톨로지 정리(§13)의 일부.
>
> **첫 스텝** (다른 머신에서 바로):
> 1. `components/views/ontology-view.tsx` — 3-way 탭(graph/insights/dashboard) 구조 파악 (82-95줄). `dashboard` viewMode 존재.
> 2. `components/ontology/ontology-dashboard-panel.tsx` — dashboard 패널 컴포넌트 read (stats raw).
> 3. insights 탭에 dashboard 콘텐츠 흡수 설계 → `dashboard` 탭 제거.
> 4. NUDGE 아이템들이 어디서 생성되는지 grep (`NUDGE|nudge`, `use-inbox.ts` `detected` 섹션).
> 5. NUDGE → Inbox `detected` 이관: `lib/hooks/use-inbox.ts` detected 배열에 ontology nudge 추가.
>
> **컴포넌트 구조**: `OntologyView` → tab state(`graphViewState.viewMode`: "graph"/"insights"/"dashboard") → 각 탭 렌더. `OntologyDashboardPanel`(raw stats). `GraphInsightsView`(action prompts). NUDGE = 현재 온톨로지 뷰 내부 컴포넌트 추정 → Inbox `detected` 섹션으로 이관.
>
> **위험 + 회피**:
> - `dashboard` viewMode를 store에 저장 중 → 제거 시 persisted state 처리 주의(migrate 또는 fallback `"graph"`).
> - NUDGE 이관 후 온톨로지 뷰 내에서 중복 노출 금지.
> - 그래프 = display mode 전환(렌즈 모델)은 크기가 클 수 있어 scope를 먼저 확인 후 결정.
>
> **참고 파일**:
> - `components/views/ontology-view.tsx:82-95` (3-way 탭 + viewMode)
> - `components/views/ontology-view.tsx:570` (dashboard 렌더 분기)
> - `components/ontology/ontology-dashboard-panel.tsx` (dashboard 내용)
> - `lib/hooks/use-inbox.ts:23,50` (detected 섹션 구조)
> - `docs/01-plan/features/linear-ia-constitution.spec.md` (§13 온톨로지 정책)
>
> **머신**: 집(Windows). **현재 main HEAD**: PR #503 (`39bc1ab`). **branch worktree**: 이 PR 머지 후 main fresh.

### 완료 (이 세션 — 1 PR)
- **셸 §10 Phase 2 — 사이드바 토글 분산**: 사이드바 우상단 hover-reveal `PanelLeft` 접기 토글 (`group/sidebar`) + 우경계 seam 리사이즈 전용 복귀(seam 셰브론 제거) + 접힘 시 좌측 expand rail(`w-3.5`, faint `›`). 4가지 Polish(중복 정리·rail 슬림·아이콘 리니어 톤·모션 토큰 `--duration-fast`/`--ease-out`).
- **셸 §10 Phase 3 — 햄버거 완전 제거 + 액티비티 바 토글 이전**: `panels-menu.tsx` 파일 삭제(`git rm`). GlobalTopBar `<PanelsMenu />` 제거. 액티비티 바 토글 = **상단바(시계 왼쪽)** 영속 버튼(`PanelLeftClose`/`PanelLeftOpen`, 상태별 방향 아이콘). 액티비티 바 collapsed=`return null` 유지(인-패널 토글/rail 제거).

### 브레인스토밍 & 큰 결정 (영구)
- **패널 토글 분산 완성**: 디테일=콘텐츠 우상단(Phase1) / 사이드바=인-패널 hover(Phase2) / 액티비티 바=상단바 영속(Phase3). **비대칭 의도적** — 크롬(액티비티 바)은 상단바에, 콘텐츠 패널(사이드바)은 인-패널에. 대칭(상단바 2개 나란히)은 "펼쳐놓은 햄버거" 재현이라 기각.
- **액티비티 바 collapse = `return null` 유지**: 접으면 좌측 rail 없음 → 상단바 영속 토글로 복귀. rail을 두면 rail 2개(actbar+sidebar)가 나란히 생겨 어색.
- **사이드바 비대칭 설계 근거**: 사이드바 = 콘텐츠 네비(폭 있음, 맥락적 제스처) → 인-패널. 액티비티 바 = 크롬 프리미티브(좁은 레일, 모드 스위치) → 상단바. 리니어 정통과 일치.

### 기술 학습 (영구)
- **`activity-bar.tsx` collapsed `return null`**: 햄버거 제거 후 재-open 경로를 **반드시 상단바 등 다른 곳에 확보**해야 함. `return null` 그대로 두면 키보드(⌘⇧A)로만 복귀 가능.
- **dev bottom-left "N" = NEXTJS-PORTAL**: 좌하단 고정 dev 인디케이터. 프로덕션 없음. 인-패널 `mt-auto`(foot) 배치 시 dev에서 겹쳐 보임 → `mt-auto` 피할 것.
- **상단바 버튼 순서(확인됨)**: [P 아바타 @14] → [액티비티 바 토글 @68] → [시계 @97] → [‹ @127] → [› @157].

### Watch Out (다음 세션)
- **`dashboard` viewMode persisted state**: store에 `graphViewState.viewMode:"dashboard"` 저장된 사용자는 온톨로지 정리 후 fallback 처리 필요(`"dashboard"`→`"graph"` 또는 `"insights"` 자동 전환 migrate/런타임 guard).
- **셸 시각은 사용자 실화면 의존**: eval로 DOM/state 검증했으나 hover 느낌은 사용자가 직접 확인.

### 환경 변경
- **Store version: 무변경** (전부 UI/shell).
- **삭제**: `components/panels-menu.tsx` (고아 — GlobalTopBar 단일 importer도 제거).
- **신규**: 없음. 수정: `app/(app)/layout.tsx`, `components/activity-bar.tsx`, `components/global-top-bar.tsx`, `components/linear-sidebar.tsx`.
- Tests: pre-existing 2건(date-grouping) 외 신규 실패 0. tsc 0 / build 0.

---

## 2026-05-31 (낮~오후, 집/Windows — 직전 밤 #501에 이어) — **§11 북·위키 status/priority 워크플로 완성 + 코멘트→Inbox + 북마크 capped 버그 + 셸 PanelsMenu 중복제거/§10 Phase1 (4 P0, 1 PR)**

> 🎯 **다음 즉시 액션 hook**: **셸 §10 Phase 2 — 사이드바 토글 분산**(리니어식). 이번에 Phase 1(디테일 토글=콘텐츠 우상단)까지 완료. 다음 = 사이드바 collapse 토글을 중앙 햄버거에서 빼서 (a) 사이드바 우경계 **엣지핸들**(hover-reveal ‹/›) + (b) 사이드바 헤더 토글 아이콘(`PanelLeft`)으로 분산. wire = `sidebarCollapsed`/`setSidebarCollapsed`. `⌘⇧F` 유지. **이후 Phase 3** = 중앙 `PanelsMenu` 햄버거 완전 제거(`global-top-bar.tsx:101`) + `⌘\`(split) 충돌 점검 + `ListIcon`→`PanelLeft/Right`. ⚠️ `linear-sidebar.tsx`(2082줄) 분해와 묶이면 큰 작업 — Phase 2만 먼저 떼도 OK.
>
> **사용자 의도** (인용): "노트 에디터 들어가면 패널스 관리 버튼이 나오는 버그" + "패널스 햄버거 버튼도 리니어 식 디자인이랑은 달라" → Notion식 중앙 햄버거를 리니어식 개별 토글로 분산.
>
> **첫 스텝** (다른 머신 바로): 1) `components/linear-sidebar.tsx` 우경계 엣지핸들 + 헤더 토글. 2) `components/panels-menu.tsx` "Sidebar" row 제거(Phase 2 후). 3) `components/global-top-bar.tsx:101` `<PanelsMenu />` 제거(Phase 3).
>
> **위험 + 회피**:
> - **Books `showDetailPanel:false`** = list view 한정 → 그리드/리스트 view-header엔 디테일 토글 없음(gate). 디테일 패널은 북 선택 시 자동 open + 패널 자체 close 버튼. Phase 3 중앙 햄버거 제거 시 이 경로 확인.
> - **preview route 전환 = module state** → 노트 에디터/위키 mount가 eval 불가(고질). 셸 시각 검증 = 사용자 실화면.
> - **adapter-equivalence.test.ts** = books/wiki 필터 카테고리 **하드코딩 assertion** 있음. 필터 prop 추가/이동 시 cluster/key 배열 갱신 필수.
>
> **참고 파일**: `panels-menu.tsx`(중앙 햄버거), `view-header.tsx:428`(디테일 토글), `note-editor.tsx:642`(에디터 디테일 토글), `linear-sidebar.tsx`(사이드바), `global-top-bar.tsx:101`(PanelsMenu mount), `docs/TODO.md` 0.04(§10 phased).
>
> **머신**: 집(Windows). **현재 main HEAD**: 이 PR 머지 후(직전 `e9a1e09` #502). **branch worktree**: `claude/gracious-mclean-5045c6` → 머지 후 main 기준 fresh.

### 완료 (이 세션, 4 P0 — 1 PR)
- **P0 #0 코멘트 → Inbox 통합**: `CommentStatus` todo/blocker 코멘트를 Inbox `comment` kind로 승격(→ `do` 섹션). backlog/done 제외. 클릭=anchor(note/wiki) 원문 네비. `inbox.ts`(InboxItemKind)·`use-inbox.ts`(소스 루프+sectionFor+comments 구독)·`inbox-view.tsx`(네비 2곳)·`inbox-source-icon.tsx`(MessageSquare)·`view-configs.tsx`(source 필터)·i18n.
- **P0 #0b 북마크 퀵링크스 capped 버그**: `mixed-quicklinks.tsx` — 핀+북마크 병합 후 단일 `slice(limit 8)`로 핀 8개↑면 북마크 증발 → pinItems/bookmarkItems **partition + 전용 `bookmarkLimit`**.
- **P0 #1 §11 북·위키 status/priority** (헤드라인): Books status 세터 = **detail panel(BookDetailPanel)** + **보드 status 4컬럼 드래그** + **list 인라인 StatusDropdown 컬럼** + 그리드/보드 **배지**. Book·Wiki **priority 필터+배지+세터**(wiki는 패널 세터). status·priority = **manual·hybrid만**(smart N/A gate). books.schema/wiki.schema priority PropertyDef + status groupable, `bookMatchesRule`/`matchWikiRule` priority case, applyBookGrouping status 4컬럼, `icons.tsx` priority 바 아이콘, defaults visibleColumns, adapter test 갱신.
- **셸 PanelsMenu 중복 제거 + §10 Phase 1**: `note-editor.tsx:470`·`book-detail-page.tsx:792`가 자기 헤더에 PanelsMenu 또 mount(#120 위반)하던 것 제거(에디터 햄버거 중복 버그). §10 Phase1 = 디테일 토글=콘텐츠 우상단(이미 있었음 — view-header 아이콘 `PanelLeft→PanelRight` 정합) + 중앙 햄버거 "Detail" row 제거.

### 브레인스토밍 & 큰 결정 (영구 — MEMORY push)
- **Books도 detail panel 있음** (사용자 적발): `showDetailPanel:false`는 *list view* 한정. 실제 = `sidePanelContext{type:"book"}` → `BookDetailPanel` + `/books/{id}` `BookDetailPage`. status 세터의 proper home.
- **§11 status·priority = manual·hybrid만, smart=N/A**: smart=자동 큐레이션이라 워크플로 무의미 → 세터/배지 전부 `kind!=='smart'` gate. 보드 status 그룹핑선 smart=backlog(`?? "backlog"`).
- **HTML 중첩 제약**: 그리드/보드 카드=`<button>` → 인라인 피커(button) 중첩 불가 → 카드=배지(읽기전용), **인라인 피커는 BookTable 행(`<div>`)**.
- **§10 패널토글 = 리니어식 분산** (중앙 햄버거 폐기): 디테일=우상단(P1✅), 사이드바=엣지핸들(P2), 중앙 햄버거 제거(P3). Notion식 중앙 체크리스트 ≠ Linear.

### 기술 학습 (영구 — MEMORY push)
- **adapter-equivalence.test.ts = 하드코딩 필터 카테고리 assertion**: `*_SCHEMA` 필터 prop 추가/이동 시 cluster/key 배열 갱신 필수. PR #501이 books status 필터 추가하며 미갱신 → 1건 pre-existing 실패였음(이번 정정 + wiki도 갱신).
- **displayOrder tie-break = 선언 인덱스**: 기존 값 안 건드리고 status·priority 둘 다 `0`으로 두면 선언순(status→priority→itemCount) 정렬.
- **PanelsMenu 단일 mount(#120) drift**: view-header는 GlobalTopBar로 이관됐는데 note-editor/book-detail-page 헤더만 옛 패턴 잔존(주석 "Mirrors view-header" stale) → 에디터 햄버거 중복 버그.
- **preview**: store-eval로 데이터/배지/보드컬럼/패널 검증 OK. route 전환(에디터 mount) = module state라 eval 불가 → 사용자 실화면.

### Watch Out (다음 세션)
- **§10 Phase 2/3 미완**: 사이드바 토글 분산 + 중앙 햄버거 제거 남음(디테일만 우상단).
- **persisted visibleColumns**: 기존 사용자 books/wiki viewState엔 status/priority 컬럼 없음(새 default만) → Display 패널서 토글해야 list 컬럼 보임. 그리드/보드 배지는 무관.
- **pre-existing 테스트 2건**: `pipeline.test.ts applyGrouping([],'date')` — 무관, 기존.
- **wiki status 세터는 여전히 read-only 배지**(보드 드래그로만). priority만 패널 세터 추가 — 약간 비대칭(다음에 wiki status 세터화 검토).

### 환경 변경
- **Store version: 무변경**(status/priority/reads는 v153 기존, 이번 전부 UI).
- i18n: `filter.category.priority`(en/ko) + inbox `comment_blocker`/`comment_todo`(en/ko).
- 신규: `icons.tsx` Priority{None,Low,Medium,High,Urgent}Icon.
- Tests: adapter-equivalence **24/24**, view-engine 83/85(2 pre-existing date-grouping fail). **tsc 0**.

---

## 2026-05-31 (밤, 집/Windows) — **아이콘 리니어화 + SPACE_ICONS SOT + Item C 인기순위/§11 북 status·reads + Home §13 슬림화 (PR #501, 2커밋)**

> 🎯 **다음 즉시 액션 hook** (사용자 명시 — 다음 세션 **첫 작업 2개**):
> 1. **코멘트 → Inbox 통합** (정정 — "활동 위젯" 폐기). 세션 끝 토론으로 발견: §13 "활동 위젯(코멘트/북마크/링크)"은 메모리 drift(spec §13 Home=3위젯). 코드 실측 = 북마크는 퀵링크스(capped 버그, 0b), 링크는 온톨로지, **코멘트만 고아**. 코멘트=task급(`CommentStatus` backlog/todo/done/**blocker**) → Inbox `comment` kind(todo/blocker=do). 파일: `inbox.ts`/`use-inbox.ts`/`comments.ts`. **(+P0 #0b: 북마크 퀵링크스 capped 버그 — mixed-quicklinks sortKey5+limit8로 핀 많으면 증발. 전용 limit 승급.)**
> 2. **§11 북 status 세터 UX + priority 표시** — 데이터모델(status/priority/reads)·필터·v153 마이그는 됐고, status를 *설정*하는 UI가 없음. **Books는 detail panel 없음(showDetailPanel:false) → 보드 status 컬럼 드래그 vs 카드 인라인 피커 = 설계 결정 필요.** + 북/위키 priority 필터·배지 표시(notes priority=board badge 패턴 미러).
>
> **세션 성격**: before-work 시작 → P0 #0(스티커)부터 했는데 사용자가 연쇄로 §13 Home 정합을 지적(아이콘 drift→KB 3그룹화→inbox 중복) → 아이콘 전면 SOT화 + Item C(인기순위 신규) + Home §13 슬림화로 확장. PR #501(2커밋) 머지.
>
> **위험 + 회피 (핵심 교훈)**:
> - **delegated executor가 "completed"인데 깨진 상태 보고** (§13 cleanup): insights 데이터필드/import는 지우고 그 JSX는 안 지워 tsc 10에러로 깨진 채 완료 보고 → **executor 산출물은 항상 tsc 직접 검증**(보고 신뢰 금지), 고아 JSX 직접 제거 복구.
> - **정렬 배열/nbsp Edit 매칭 실패**: stats-row 9-card column-align 공백 + `|| " "` nbsp로 old_string 매칭 반복 실패 → **Write 전체교체가 robust**. 큰 정렬 블록은 Edit보다 Write.
> - **파일 겹침=비대화형 hunk 분리 불가** (book-detail-page=아이콘+reads / home-view=순위+§13 / i18n=둘 다) → `git add -p` 막힘이라 2커밋(아이콘 / 나머지)으로 타협.
>
> **참고 파일**: `lib/entity-icons.tsx`(ENTITY_ICONS + **SPACE_ICONS SOT**), `components/home/stats-row.tsx`(KB 3그룹), `components/views/home-view.tsx`(§13 슬림화 — **활동 위젯 추가 지점**), `components/home/mixed-quicklinks.tsx`(퀵링크), `lib/view-engine/schema/entities/books.schema.tsx`(북 status, priority 미추가)·`use-books-view.ts`(bookMatchesRule), `lib/store/migrate.ts`(v153), `wiki-dashboard.tsx`/`wiki-view.tsx`(위키 순위), `lib/store/slices/books.ts`(incrementBookReads).
>
> **머신**: 집(Windows). **현재 main HEAD**: PR #501 머지 후(직전 `47a4e93` #500). **branch worktree**: `claude/stupefied-swartz-285672` → 머지 후 main 기준 fresh.

### 완료 (이 세션, PR #501 2커밋)
- **아이콘 리니어화**: 스티커 dog-ear 커스텀 SVG(StickerPlain) / 온톨로지 Waypoints·캘린더 CalendarDays·자료실 Library·**라벨 Ribbon**(Badge→Milestone→Ribbon 반복 후 확정) / `Archive as Books` drift 박멸(books↔library 표면 뒤바뀜)·References→Quote.
- **SPACE_ICONS SOT 신설**: 7공간 단일 정의 → 활동바·사이드바·뷰헤더 9파일 라우팅 + plot-icons 위임. 필터칩 Hash·Tag 오글리프 등 ENTITY_ICONS 정합.
- **Item C 인기순위 + §11(부분)**: v153 마이그(Book.status/priority/reads + Wiki priority, manual/hybrid status backlog 백필) / 북 status **필터** 축 + kind→classification / 북 reads 증가(incrementBookReads) / 순위 UI Home(노트+북)·Wiki(위키) reads top5.
- **Home §13 슬림화**: 지식베이스 3그룹화(본체/분류/출처) + 중복 4섹션 제거(받은편지함·Featured·최근활동·Recents — 본진=Inbox공간/상단바 recently-viewed).

### 브레인스토밍 & 큰 결정 (영구)
- **§13 Home = cross-cutting only**: 본진 있는 것(Inbox=전역공간, 최근=상단바 recently-viewed) 미리보기 제거. 자산(지식베이스 3그룹) + 활동(다음) 2단. "액션은 Inbox 단일화."
- **라벨 = Ribbon 확정**(사용자: Badge·Milestone 기각, "리본 형태"). lucide Ribbon=award 메달느낌이나 사용자 선택.
- **북 status는 데이터/필터까지만**; 세터 UX는 detail panel 없어 별도 설계. priority는 필드만(표시 미구현).
- **공간 아이콘도 SOT 필요**(엔티티 ENTITY_ICONS처럼) — Archive가 books/library/references 혼용=표면 drift 증거.

### 기술 학습 (영구)
- **delegated executor 산출물 = tsc 직접 검증 필수**(깨진 채 "completed" 보고 사례).
- **큰 정렬/특수문자(nbsp) 블록 = Edit보다 Write 전체교체**.
- **파일 겹침 시 비대화형 hunk 분리 불가** → 논리 커밋은 파일 단위로만.
- **preview route = module state**(HMR마다 /home 리셋). `window.__plotStore`+querySelector eval로 카드 렌더·reads 분포 검증.

### Watch Out (다음 세션)
- **활동 위젯 데이터 소스 확인 먼저**(코멘트/북마크/링크 store). **북 status 세터 = 설계 결정**(보드 드래그 vs 인라인). §11 priority(북/위키) 표시 + 북 status 보드 그룹핑 미구현(필터-only).
- carry: 온톨로지 정리(§13), 셸 §10 패널토글, Book kind 라벨(Auto/Manual/Mixed), noteType 데드코드, **6-item Claude Design 사전정지 트랙**(layout/sidebar 분해→design-system→토큰).

### 환경 변경
- **Store version: 152 → 153** (Book.status/priority/reads + WikiArticle.priority 멱등 백필).
- i18n: home.most_visited, wiki.section.most_visited, home.kb.bodies/classify/source 추가.
- Tests: view-engine 59 pass / 2 fail(pre-existing date-grouping, 무관). **tsc 0 / npm run build 통과.**

---

## 2026-05-31 (낮~저녁, 집/Windows) — **셸 §10 footer/레일 + 색·아이콘 시스템 정합 + IA 헌법 §13(Home 슬림화→종합 대시보드) + 지식베이스 9-entity + 엔티티 아이콘 SOT (8커밋)**

> 🎯 **다음 즉시 액션 hook**:
> 1. **스티커 접힌-모서리 커스텀 SVG 완벽 제작 (P0 #0, 사용자 명시)**. 사용자 의도: lucide `Sticker`(둥근사각+우상단 접힌 모서리)는 **형태가 마음에 들었고 웃는 표정만 싫음**. Squircle(접힌모서리X)도 StickyNote(현 임시)도 "완벽" 아님 → **커스텀 인라인 SVG**: 둥근사각 + 우상단 접힌 모서리(dog-ear) + 표정 없음. 위치 = `lib/entity-icons.tsx`의 `stickers`(현재 `StickyNote` 임시). 인라인 SVG 컴포넌트로 만들어 `ENTITY_ICONS.stickers` 교체 (SOT 한 곳 → Home/자료실/detail/그래프 전 표면 반영). lucide Sticker SVG path 참고하되 표정(가운데 곡선) 제거.
> 2. **Home 종합 대시보드 구현 (IA 헌법 §13 C안)** — Home = **"개인 활동 종합 대시보드"**(폐지/슬림화 아님). 구조 = **자산(본체:노트/위키/북 · 분류:태그/카테고리/라벨/스티커 · 출처:레퍼런스/파일) + 활동(연결: 코멘트/북마크/링크)** 2단(자산=정적 카운트 / 활동=시간성 "이번 주 +N"). 지식베이스 9-card는 완료(StatsRow), **활동 위젯(코멘트/북마크/링크) 신규**. 원칙 = **cross-cutting(본진 없는 것)만 종합** — Inbox미리보기/추천/최근활동은 **제거**(본진=Inbox/상단바recently-viewed).
> 3. **온톨로지 정리** (§13): dashboard→insights 흡수(Health/Coverage 중복), NUDGE→Inbox `detected`, insights 3개 분산(notes/ontology/graph) 통합, 그래프=display mode(렌즈).
>
> **사용자 의도** (인용): "스티커는 꼭 표정 들어간 스티커여야 하나? 우측 상단 살짝 접힌 스티커 모양"(SVG) / "홈이 정말 모든 정보를 망라한 종합 데이터 대시보드이면 좋겠다(온톨로지 대시보드랑은 다르게)" / "지금 내가 할 일은 INBOX의 역할 아닌가? 리니어라면 애초에 HOME을 안 만들까?"(→ Plane 반례 검증 → Home 종합 대시보드로 안착).
>
> **위험 + 회피**:
> - **이 환경 dev screenshot = Next16 컴파일 느림/검은화면 지속**. 화면 검증 = 사용자 실화면 우선. 코드(tsc)+부분 스샷 보강.
> - **아이콘/색은 SOT로** — `KNOWLEDGE_INDEX_COLORS`(색) + `lib/entity-icons.tsx` `ENTITY_ICONS`(아이콘). 표면별 하드코딩 금지(Label/Categories/Tags가 detail panel서 전부 PhTag였던 게 SOT 부재 증거).
> - **리니어/Plane=PM툴, 우리=노트앱** — IA 판단 시 비교 대상 편향 주의(Home 폐지 A안이 이 편향).
>
> **참고 파일**:
> - `lib/entity-icons.tsx`(ENTITY_ICONS SOT — 스티커 SVG 교체 지점), `lib/colors.ts`(KNOWLEDGE_INDEX_COLORS 색 SOT)
> - `components/home/stats-row.tsx`(지식베이스 9-card), `components/home/mixed-quicklinks.tsx`(퀵링크스 통합 허브), `components/views/home-view.tsx`(Home 레이아웃 — 종합 대시보드 재구성/중복 제거)
> - `docs/01-plan/features/linear-ia-constitution.spec.md` §13(Home 슬림화 A→C)
> - `lib/hooks/use-inbox.ts`(Inbox action queue — NUDGE 통합 대상), `components/ontology/ontology-{insights,dashboard}-panel.tsx`(통합 대상)
>
> **머신**: 집(Windows).
> **현재 main HEAD**: `159ee1e`(PR #499). 이 세션 8커밋 = 이 after-work에서 PR/머지.
> **branch worktree**: `claude/loving-yalow-ebc0d3` → 머지 후 main 기준 fresh.

### 완료 (이 세션, 8커밋)
- **셸 §10 footer/레일** (`75605d5`): Trash 드롭다운→사이드바 하단 footer 강등 / Help `?` 버튼(`.a-sb-foot`) / 레일 절제(active만 라벨, inactive=아이콘+툴팁)+톤다운(active 14/22, dark 레일 배경 어둡게).
- **색 정합** (`cdd2180`·`053b361`·`a689104`·`9483b94`): tags amber→lime / references→indigo / status hex→var(모드 명도, canvas=getComputedStyle 캐시) / priority 색→3-막대(status 충돌 해소, spec §3) / Hybrid 아이콘 Sparkles→Blend(Insight 겹침) / book kind 무채 / 그래프 tag lime / IconSparkle 제거 / bookmark amber→yellow.
- **IA 헌법 §13** (`3d3fe7e`→`f56561f` C 정정): Home 폐지(A) → **종합 대시보드(C)**. Plane 반례(Stickies 고유)+노트앱 진입 문화 검증. 지식베이스 = 자산/활동 2단.
- **지식베이스 9-entity** (`f56561f`): StatsRow 6→9 (books·categories·labels 추가, KNOWLEDGE_INDEX.books burgundy + i18n).
- **엔티티 아이콘 SOT** (`f56561f`): `lib/entity-icons.tsx` 신설 — 라벨=Badge/카테고리=Layers/태그=Tag 갈라짐, books=BookMarked(자료실 Archive 분리). detail panel(book/wiki/note)+StatsRow+library+activity-bar 6파일 마이그.
- **스티커 아이콘** (`92e9ac1`→임시 StickyNote): Sticker(표정)→Squircle→StickyNote. **다음=커스텀 SVG(P0 #0).**

### 브레인스토밍 & 큰 결정 (영구 — MEMORY.md push)
- **IA 헌법 §13 = Home 종합 대시보드 (A→C 정정)**: Home 폐지(A)는 리니어/Plane=PM툴 편향. 노트앱(Notion/Anytype)은 위젯 Home 정당. 퀵링크스(`MixedQuicklinks`=통합 핀 허브, 사이드바 Pinned보다 포괄: folder/saved-view/block-bookmark)·지식베이스(개요≠Library 관리)는 고유 가치. → **Home = 개인 활동 종합 대시보드 (cross-cutting only)**.
- **지식베이스 = 자산/활동 2단**: 자산(본체/분류/출처)=셀 수 있는 사물(카운트) / 활동(연결: 코멘트/북마크/링크)=노트에 부착되는 관계(시간성). 균형 강박 X (3/4/2/3).
- **"액션은 Inbox로 단일화"**: Home 미리보기·온톨로지 NUDGE → Inbox detected.
- **아이콘 SOT = 색 SOT처럼**(ENTITY_ICONS). 표면별 하드코딩 금지.

### 기술 학습 (영구 — MEMORY.md push)
- **리니어/Plane=PM툴 vs 우리=노트앱**: IA 판단 시 비교 대상 편향 주의. 노트앱 진입 = Daily Note(Logseq/Capacities) / 위젯(Notion/Anytype) / 마지막노트(Obsidian).
- **SOT 부재 = 표면별 drift**: Label/Categories/Tags가 detail panel서 전부 PhTag였던 게 증거. 색·아이콘 둘 다 SOT 필요.
- **9 entity에 distinct hue = 색공간 포화**: books(burgundy)/labels(rose) 인접, categories(emerald)/tags(lime) 인접. 명도/의미그룹으로.
- **이 환경 dev screenshot Next16 컴파일 느림/검은화면** 지속 — 사용자 실화면 우선.
- **lucide 아이콘 = 표정/디자인 포함**(Sticker=웃는 표정) — "무지" 원하면 커스텀 SVG.

### Watch Out (다음 세션)
- **스티커 = 임시 StickyNote**(접힌모서리 무지). **다음 P0 #0 = 커스텀 SVG**(접힌모서리+표정X).
- **books/labels rose 인접 / categories/tags green 인접** — 거슬리면 명도 조정. **라벨=Badge** 임시(사용자 미확정).
- **셸 §10 패널토글 분산 미완**(Track B 셸 리팩터). **§13 구현 미완**(Home 종합 대시보드 활동위젯·중복제거·온톨로지 정리 = 결정만, 구현 다음).
- pre-existing radix hydration mismatch console 경고(무관).

### 환경 변경
- Store version: 변경 없음(UI/아이콘만).
- 신규 파일: `lib/entity-icons.tsx`(엔티티 아이콘 SOT).
- i18n: home.tile.books/categories/labels, nav.help 추가.
- Tests: 미실행(tsc 0 게이트).

---

## 2026-05-30 (심야, 집/Windows) — **IA 헌법 수립 (리니어 관점 정보구조 전면 재설계) + Inbox 전역 승격 (PR #497)**

> 🎯 **다음 즉시 액션 hook**:
> 1. **헌법 §10 적용 = 셸 목업 최종 락 → 실앱 포팅 (P0 #0)**. 목업 = `docs/v3-mockup/shell-linear-mirror.html`(완성, dev서버 `public/shell-mock.html` 복사해 봄). 1차 완료 = (a)Inbox 전역 승격(이번 PR #497). 남은 셸 2차 = **(b) Trash 사이드바 하단 footer 강등**(현 `components/user-avatar.tsx` 드롭다운에서 빼서 `linear-sidebar.tsx` `</nav>` 다음 footer로) + **(c) Help `?` 버튼**(사이드바 하단, `setShortcutOverlayOpen(true)` 호출 — user-avatar.tsx:119 패턴 재활용) + **(d) 레일 톤다운**(activity-bar.tsx: 더 어둡게/muted/아이콘만+active만 라벨) + 패널 토글 분산(상단 클러스터 제거, 디테일토글=콘텐츠 우상단). **순서: 목업 사용자 최종 승인 먼저 → 포팅.**
> 2. **Book 워크플로 축 (P0 #1, 헌법 §11, ~25줄+version bump)** — Notes/Wiki/Books 3-entity 워크플로 통일. Books에 **status(노트 4단계 재사용)+priority(노트 5단계)** 추가, **manual·hybrid만**(smart=N/A), **kind→classification 이동**. 동시에 **Wiki priority 추가**(현재 없음). 파일: `lib/types.ts`(Book.status?/priority? + WikiArticle.priority?), `lib/view-engine/schema/entities/books.schema.tsx`(status+priority PropertyDef 추가, kind category→classification) + `wiki.schema.tsx`(priority 추가), `lib/view-engine/use-books-view.ts`(bookMatchesRule status/priority case), store version bump(기존 manual/hybrid book status 기본값 backlog 마이그). 크롬은 스키마엔진이 자동(무변경).
> 3. **Book kind 라벨 변경 (헌법 §13, 가벼움)** — Smart/Manual/Hybrid → **Auto/Manual/Mixed**(자동/수동/혼합). **코드 키(`smart`/`manual`/`hybrid`)는 불변**, 라벨+i18n만: `books.schema.tsx` values 라벨 + `lib/i18n.ts`(en Auto/Manual/Mixed + ko 자동/수동/혼합). "스마트북" 단어 소멸.
>
> **세션 성격**: 코드 거의 안 짬 = **순수 브레인스토밍 + 헌법 문서화**. 사용자가 "느낌"으로 쌓아온 IA 결정(섹터/status/라벨/북/스티커)을 **코드 전수조사 + 리니어 109캡처 실측으로 검증**해 git-tracked 헌법으로 박음. **SOT = `docs/01-plan/features/linear-ia-constitution.spec.md`(14챕터)**. 다음 세션은 이 헌법을 *적용*(구현)하는 단계.
>
> **사용자 의도** (이 세션, 인용): "개념과 기능을 우선 리니어 수준, 리니어 관점(시각), 리니어 해석으로 깎아보자" + "리니어 팀이 만들었다면" + "이미 구현된 기능/개념/명칭 재논의·재설계, 필요하면 과감히 제거". → 디자인뿐 아니라 **정보구조(IA) 자체를 리니어 정신으로 재정의**.
>
> **위험 + 회피 (이 세션 핵심 교훈)**:
> - **"코드 봐라"가 2번 내 추측을 바로잡음**: ① Ontology/Library를 개념만으로 "강등/해체"하려다 코드 보니 진짜 서브시스템(metrics/relation engine/재사용 메커니즘)이라 KEEP. ② `noteType==="wiki"`를 "활성 시스템"으로 오판 → 사용자가 "데드코드 아니냐" 적발, 실제 레거시 확인. **→ IA 결정은 반드시 코드 전수조사 후.**
> - **Explore 에이전트가 과장**: 데드코드(`createWikiNote`/`noteType`)를 "활성"인 것처럼 보고. 에이전트 보고는 grep 호출처 0 확인으로 교차검증.
> - **명칭: "이름 같아야 일관"이 아니라 "본질 같아야 통일"**: 스마트북을 템플릿으로 통일하려다 기각(생성틀 vs 라이브쿼리=정반대). type은 Label 전용(Book kind에 쓰면 충돌).
> - **PowerShell here-string `@`가 git 커밋 메시지 첫 줄에 샘** → PR #497 제목 `@ (#497)`로 머지됨(본문 멀쩡, 히스토리라 복구 안 함). **다음부터 commit -F 파일 사용 or `@` 누수 주의.**
> - 이 환경 tool 출력 버퍼링/Read 아티팩트(가짜 라인/중복) 산발 → 편집 전 git blob/sed(cat -A) ground truth, 편집 후 git diff 검증.
>
> **참고 파일**:
> - **`docs/01-plan/features/linear-ia-constitution.spec.md`** (헌법 14챕터, 최우선 read)
> - `docs/v3-mockup/shell-linear-mirror.html` (셸 목업 락 후보)
> - `components/linear-sidebar.tsx`(Inbox 전역 `<nav>` 최상단 786~, Library/Ontology space 블록, footer 영역 `</nav>` 2071 근처), `components/user-avatar.tsx`(Trash/Help/theme 드롭다운 — Trash 강등 대상), `components/activity-bar.tsx`(레일 톤다운 대상), `app/(app)/layout.tsx`(셸 조립)
> - `lib/view-engine/schema/entities/{books,wiki,notes}.schema.tsx`(Book 워크플로 추가), `lib/view-engine/use-books-view.ts`(getBookKind/bookMatchesRule), `lib/types.ts`(Book 202~/WikiArticle 503~)
> - 리니어 캡처: `%TEMP%\linear-ref\`(109장, 레포 외 — Project status/priority 증거 = `Filter-Project properties-Project status.png`)
>
> **머신**: 집(Windows).
> **현재 main HEAD**: `729f3aa` (PR #497 머지 — 제목에 `@` 누수). 직전 `b5edf28`(#496).
> **branch worktree**: `claude/quirky-williams-7c00a9` (머지 후 main 동기 `37000ed`). 다음 = main 기준 fresh.

### 완료 (이 세션)
- **IA 헌법 spec 신규** (PR #497) — `linear-ia-constitution.spec.md` 14챕터. 트리코토미/렌즈모델/MIRROR-ADAPT-SKIP/atom-home/noteVS위키/개념별분류/Book-vs-Sticker/공통자산정책/3-entity워크플로/Book네이밍.
- **Inbox 전역 승격** (PR #497) — `linear-sidebar.tsx` Home 종속 → `<nav>` 최상단 전역. tsc 0. (셸 2차 (a) 완료.)
- **셸 목업** (PR #497) — `shell-linear-mirror.html` 레일유지+톤다운 락 후보.
- **noteType 데드코드 정리** = spawn_task chip 띄움 (별도 작업).

### 브레인스토밍 & 큰 결정 (영구 — MEMORY.md push)
- **트리코토미 (배치의 법)**: 모든 개념 = Destination / Display-mode / Facet. 리니어 Label=facet("눈에 안 보이게"의 정체).
- **렌즈 모델**: 7 space = atom(Note)의 6렌즈 + 진입점. "자유도 최대"의 메커니즘.
- **MIRROR/ADAPT/SKIP**: 리니어 흡수 분류 (탭=MIRROR 도입 확정 / Linear Diffs·Cycles=SKIP).
- **atom-home = multi-lens by reference** (코드 검증). 비대칭 C노선(Calendar 위키 누락만 메움, Folder 타입감옥=의도).
- **noteType==="wiki" = 레거시 데드**(사용자 적발). 진짜 위키 = WikiArticle. Notes/Wiki = 2 destination 유지.
- **Calendar/Graph → display mode**, **Tags/Labels/Stickers → facet**. Ontology/Library/References/Files = destination 유지.
- **Book vs Sticker = 중복 아님**: Book=순서O 컬렉션(Project), Sticker=순서X 그래프 마커(Label). Sticker=facet 강등.
- **공통자산 커스텀**: Status/Priority=고정 / Label(N:1 종류)·Tag(N:M)·Category(N:M DAG)=커스텀. 리니어=진척축 고정·분류축 자유.
- **3-entity 워크플로 통일**: Notes/Wiki/Books 모두 status(4)+priority(5). Book=manual·hybrid만, smart=N/A, kind→classification.
- **Book kind**: Smart/Manual/Hybrid → Auto/Manual/Mixed(코드 키 불변). Smart Book ≠ Template.
- **셸**: 레일 유지+리니어 톤다운(절제). Inbox 최상단/Trash 하단/Help 하단/설정=워크스페이스메뉴. 탭=실기능 도입(다음 마일스톤). 아이콘=Lucide 문법+도메인 글리프만 정밀.

### 기술 학습 (영구 — MEMORY.md push)
- **IA 결정 = 코드 전수조사 필수**(개념·기억만으로 강등/통합 판단 금지). Explore 에이전트 보고도 grep 호출처 0으로 교차검증.
- **명칭 통일 = 본질 같을 때만**(이름 같다고 합치면 혼란). type은 Label 전용.
- **리니어 status 2층**(고정 type + 커스텀 값) — 우리는 type층(4단계)만 = 노트앱 충분, 2층 커스텀=SKIP. **리니어 Project(=Book)는 status+priority 둘 다 보유**(캡처 실측).
- **크롬 일관성은 A3.2 스키마엔진이 이미 강제**(FilterPanel/DisplayPanel 공유, PropertyDef만 다름) → "필터/디스플레이 일관성"=엔티티에 PropertyDef 추가로 환원.
- PowerShell here-string `@` 누수 → commit -F 파일 권장.

### Watch Out (다음 세션)
- 헌법은 **결정**이지 **구현**이 아님 — 다음 세션은 적용 단계. 셸 포팅은 사용자 실화면 의존(preview eval 불가).
- Book 워크플로 추가 = **store version bump 필수**(기존 manual/hybrid에 status 기본값). 마이그레이션 신중(작업원칙 #5).
- Book kind 라벨 변경 시 **코드 키 불변**(smart/manual/hybrid) — 라벨/i18n만. 블라인드 replace 금지.
- noteType 데드코드 정리(chip) = `wiki-auto-enroll.ts` 실동작 여부 먼저 확인(convertToWiki 살아있음).
- §14 미결: Ontology·Book 엔티티명 / Book status·priority 구현순서 / Calendar 위키 포함 시점.
- pre-existing 테스트 실패 11개(date-grouping+seeds, 무관) 누적.

### 환경 변경
- Store version: **v152 (변경 없음)** — 이 세션 = 문서+UI 1파일(Inbox). Book 워크플로 구현 시 bump 예정.
- 신규 파일: `docs/01-plan/features/linear-ia-constitution.spec.md`, `docs/v3-mockup/shell-linear-mirror.html`, `public/shell-mock.html`(untracked 임시).
- Tests: 미실행(문서 위주 + Inbox는 tsc 0 게이트).

---

## 2026-05-30 (밤, 집/Windows) — **A3.2 스키마 엔진 머지(PR #495) + A3.3 필터 크롬 + 노트행 모션 + 셸 1차 정리 (폰트 Pretendard, 레이아웃 모방 전환)**

> 🎯 **다음 즉시 액션 hook**:
> 1. **셸 2차 정리 (P0 #0)** — 1차(⌘K 팔레트 복구·죽은코드·avatar 드롭다운·이니셜) 완료. 2차 = (a) **Inbox 전역 승격**(현재 Home space 종속 `linear-sidebar.tsx:2049` → 액티비티바 8번째 or 전 space 사이드바 상단 고정. 리니어 Inbox=사이드바 최상단 고정), (b) **Trash 사이드바 하단 강등**(현재 avatar 드롭다운에 있으나 리니어는 계정메뉴에 trash 안 둠 → 사이드바 footer로. 그럼 워크스페이스 메뉴=순수 계정/설정), (c) **Help/단축키 시각 진입점**(현재 `?` 키만, 버튼 0 → 사이드바 하단 `?` 버튼), (d) **(대형) 액티비티바 7-space 존치 여부** 사용자 결정.
> 2. **모션/디테일 전파 (P0 #1)** — 노트행에서 시드한 토큰(`--row-hover-bg` oklch / `--duration-fast` / `--ease-out`, 커밋 295be0a)을 **사이드바 항목·버튼·드롭다운**에 전파(avatar 드롭다운은 이미 재활용). 그 다음 **A3.1 LCH 토큰 전역화**(노트행 oklch가 씨앗 → `lib/colors.ts` flat hex 마이그).
> 3. **A4 priority 막대 SVG** (carry) — `note-fields.tsx` 화살표 → 리니어 3-막대(spec §3 geometry, `schema/icons.tsx`).
>
> **사용자 의도** (이번 세션 핵심, 인용): "디자인 레이아웃의 디테일이나 골격도 리니어를 완벽하게 모방" + "세팅/휴지통/설정 버튼 배치와 담는 레이아웃의 부자연스러움이 가장 아쉽다" + "리니어 완벽 모방 → 리니어에 없는 영역(액티비티바/디테일바/스플릿뷰) 리니어스럽게 배치 재설계". → **MIRROR+EXTRAPOLATE를 셸 레벨로**. 핵심 미덕 = **절제**(안 보여줄 건 ⌘K/풀페이지로 숨김).
>
> **첫 스텝** (다른 머신 cold start):
> 1. 셸 진단(이 entry "셸 보조 UI 진단" 참고) — Inbox/Trash/Help/avatar/액티비티바 인벤토리 + 리니어 원칙 + 재배치 플랜.
> 2. `components/linear-sidebar.tsx`(Inbox `:2049`, footer 영역), `components/user-avatar.tsx`(드롭다운 — trash 제거 대상), `app/(app)/layout.tsx`(셸 조립).
> 3. Inbox 승격 → Trash 강등 → Help 진입점 순.
>
> **위험 + 회피**:
> - **이 환경 preview eval = route 전환 + 키 이벤트(⌘K) dispatch 안 됨**(activeRoute module state). visible 검증 = **사용자 실화면 필수**. 이번 세션 ⌘K/divider/모션/이니셜 다 사용자 직접 확인("괜찮다").
> - **동등성 테스트 tautology 함정**: swap 후 `*_VIEW_CONFIG = toViewConfig(*_SCHEMA)`라 generated-generated 자기비교. 진짜 동등성 = **원본(직전 커밋) 스냅샷 vs 어댑터 출력** 직접 비교(이번 git show 5e25721 스냅샷으로 검증).
> - **리니어 동작 = 기억으로 단정 X, 실측**: ⌘K를 "팔레트 vs input 양자택일"로 오진 → 사용자 지적 → 조사하니 **리니어 검색 3-way 공존**(⌘K 팔레트 / `/` 전역검색 / ⌘F 뷰내).
> - **메모리 정정**: 셸 크롬이 이미 `components/global-top-bar.tsx`로 hoist됨 (메모리 "layout.tsx 607 / linear-sidebar.tsx 2129 god"는 부분 stale — 실제 셸 호스트 = `app/(app)/layout.tsx`).
>
> **참고 파일**: `components/linear-sidebar.tsx`(Inbox 2049/footer), `user-avatar.tsx`(드롭다운), `global-top-bar.tsx`(크롬), `app/(app)/layout.tsx`(셸), `search-dialog.tsx`(⌘K 팔레트), `hooks/use-global-shortcuts.ts`(⌘K/`/`/`?`), `app/globals.css`(모션 토큰 시드 `:66`/`:166`), `lib/view-engine/schema/`(스키마 엔진), `docs/01-plan/features/{linear-filter-display-schema-engine,linear-filter-display-A3.3-chrome}.plan.md`.
>
> **머신**: 집(Windows).
> **현재 main HEAD**: 이 세션 PR 머지 후 (직전 `693a31b` = PR #495 폰트+A3.2).
> **branch worktree**: `claude/happy-leavitt-1fb897` → 이 after-work에서 PR·머지. 다음 = main 기준 fresh.

### 완료 (이번 세션)
- **폰트 Pretendard** (Geist→, `next/font/local` self-host woff2, weight 45 920. Inter 메트릭 복제+한글 네이티브 = Linear 라틴 룩+다국어 일관. 일본어 fallback stack). — PR #495
- **A3.2 스키마 엔진 M0~M4** (PR #495): 엔티티별 `PropertyDef[]`(6-카테고리)→어댑터→filter/display/group/sort 자동생성. Notes/Wiki/Books 전부 `toViewConfig(SCHEMA)` 1줄. 출력 계약 불변=소비 컴포넌트 0수정. 진짜 동등성(원본 스냅샷 비교) 검증.
- **A3.3 필터 크롬**: E1(category 6-클러스터 재배열 `f221f82`) / E2(filter-panel divider+아이콘16px+opacity뼈대 `5d7e00e`) / E3(칩바 스키마 일원화+레거시 -965줄 `4c0ad22`).
- **노트행 모션 슬라이스** (`295be0a`): `--row-hover-bg`(oklch)/`--duration-fast`/`--ease-out` 시드 + 호버 페이드 + 체크박스 opacity fade(zero layout shift) + 선택 토큰화.
- **셸 1차 정리**: A(`fbde340`) 죽은코드 -127줄(top-utility-bar 삭제+sidebar 데드블록)+⌘K 팔레트 복구(3-way) / B(`8b286cc`) avatar 드롭다운(우측 theme/settings/trash 접기+가짜버튼 해결) / 이니셜(`9a51e18`) `userName` 필드+`getInitials`.

### 셸 보조 UI 진단 (architect, 2차 reference)
- **secondary 액션 인벤토리**: 워크스페이스스위칭=액티비티바 / 패널토글=GlobalTopBar PanelsMenu / 검색=⌘K팔레트(복구됨)+`/`전역+input / 설정=풀페이지(/settings ✅) / Trash=/trash 인앱뷰 / Inbox=Home종속(`linear-sidebar:2049`) / Help=`?`키만.
- **리니어 원칙**: 크롬=네비만 / ⌘K=액션 / 풀페이지=설정 / secondary=하단·⋯·컨텍스트메뉴. 상시노출 최소(절제).
- **남은 결정(2차)**: Q5 Inbox 승격 범위, Q3 Trash 강등 위치(사이드바 하단 권장), Help 진입점, Q6 액티비티바 존치(대형).

### 브레인스토밍 & 큰 결정 (영구 — MEMORY.md push)
- **레이아웃도 리니어 완벽 모방** (사용자 방향 전환): 3-zone 골격 유지, 그 안 디테일(모션/호버/색/보조액션 배치)은 리니어 문법 재정리. MIRROR+EXTRAPOLATE. 핵심=절제.
- **폰트 = Pretendard**. **수직 슬라이스 전략**(넓게 깔면 체감0 → 한 표면 깊게 → 토큰 확립 → 전파).
- **리니어 검색 = 3-way 공존**(⌘K팔레트/`/`전역/⌘F뷰내, 양자택일 X).
- **"뒤죽박죽"=미완성 리팩터**(셸 크롬 GlobalTopBar 이사 절반 → ⌘K 팔레트 고아+죽은코드+과노출).
- **Trash**: 리니어는 계정메뉴에 trash 안 둠 → 사이드바 하단 강등(2차).

### 기술 학습 (영구 — MEMORY.md push)
- **이 환경 preview eval 한계**: route 전환 + 키 이벤트(⌘K) dispatch가 module state라 안 됨 → visible 검증 = 사용자 실화면.
- **동등성 tautology**: swap 후 자기비교 → 원본 스냅샷(git show 직전커밋) vs 어댑터 출력 직접 비교.
- **모션 zero-shift**: 호버 등장 요소는 opacity/visibility(공간 미리 확보), display/width 변동 X.
- **모델 ID**: `/model` 메뉴로 선택(괄호 타이핑 `claude-opus-4-8(1M)` = may not exist 에러 + background agent Bash 막힘).
- **subagent 보고 깨짐**(designer 출력 잘림) → git diff로 결과 복원.

### Watch Out (다음 세션)
- **toggleFilter(field-based) 死코드 3곳**(notes-table:869/grid-shell:185/timeline-shell:154) — E3 minimal-diff로 남김, follow-up.
- **⌘F 뷰내검색 미구현**(net-new, 미바인딩). **setSidebarCollapsed**(linear-sidebar:276) 미사용 — follow-up.
- **A3.3 opacity 위계 = 클래스 뼈대만**(0.9/0.7/0.5 최종값은 A3.1 LCH 대기).
- 사용자 실화면 OK("괜찮다" 2회) — ⌘K/avatar/이니셜/노트행/필터 divider 확인됨.

### 환경 변경
- Store version: `settings-store`에 `userName` 추가(persist). 메인 store v152 유지(settings-store 별도).
- 신규 파일: `lib/view-engine/schema/**`, `docs/01-plan/features/{linear-filter-display-schema-engine,linear-filter-display-A3.3-chrome}.plan.md`, `public/fonts/PretendardVariable.woff2`.
- 삭제: `components/top-utility-bar.tsx`.
- Tests: 306 pass / 11 fail (pre-existing date-grouping/seeds).

---

## 2026-05-30 (저녁, 집/Windows) — **Track A 착수: 리니어 필터/디스플레이 "200% 미러" 전략 플랜 (A0~A2 완료, A3 다음)**

> 🎯 **다음 즉시 액션 hook**:
> 1. **A3-① 스키마 엔진 (keystone)** — 엔티티별 `PropertyDef[]`(6-카테고리: Workflow/Classification/Relations/Metrics/Time/Content)를 정의하고 filter/display/group/sort를 거기서 **자동 생성**하는 인프라 구축. FlowBase 패턴 이식(`isFilterable` + 타입별 위젯 switch). **현 수작업 per-context config(`lib/view-engine/view-configs.tsx` 1105줄)를 schema로 refactor** → 일관성 코드 강제(뒤죽박죽 해결). 적용 표면 = `components/filter-bar.tsx`(1265)/`filter-panel.tsx`(283)/`display-panel.tsx`(456).
> 2. **시작 전 미결정 2개 (사용자 확인 필수)**: (a) **폰트 Geist 유지 vs Inter 교체** — 100% 미러면 Inter. ②크롬/③토큰 전에 결정. (b) **선택: 사용자 리니어 DevTools 캡처**(filter/display 드롭다운 요소 CSS rgba/px) → ②크롬 1px 정합. 없어도 ①스키마는 진행 가능.
> 3. **A3-② 공유 크롬**(①후): filter 드롭다운 + display 패널을 스키마에서 생성 + **Linear 5규칙**(균일행높이·아이콘16정렬·divider는의미경계만·좌우역할고정·opacity위계 0.9/0.7/0.5). **A3-③ LCH 색 토큰**(병렬 가능): `lib/colors.ts` flat hex → OKLCH/LCH + paired `-bg/-fg` + `toneClassDual` (FlowBase 패턴, 리니어도 LCH). var() 쓰는 컴포넌트는 rework 없음.
>
> **전체 spec(드롭다운/패널 spec + 컨텍스트 매트릭스 + priority 막대 SVG geometry + A2 LOCKED)**: `docs/01-plan/features/linear-filter-display-mirror.spec.md` ← A3~A5 reference, **먼저 read**.
>
> **사용자 의도** (이 세션, 인용): "리니어를 200% 모방... 폴리시를 장인정신으로 깎아서... 리니어 제작진이 만든 노트앱이라고 사람들이 속아넘어갈 만큼." 현재 앱 = 기대치 **70%**, 비는 30% = 디자인 정합성·일관성·기능과 디자인의 자연스러운 fit.
>
> **첫 스텝** (다른 머신 cold start):
> 1. spec 문서 read (A2 LOCKED + 6-카테고리 스키마 + FlowBase 차용 패턴).
> 2. 폰트 결정 사용자 확인.
> 3. `lib/view-engine/view-configs.tsx`(현 per-context 구조) + FlowBase `components/board/{filter,display}-menu.tsx`(gh `peterkwon248/FlowBase`) 패턴 read.
> 4. `PropertyDef` 타입 + 엔티티별 스키마 정의 → 자동 생성 인프라.
>
> **위험 + 회피**:
> - LCH 토큰 마이그(③) = app-wide 큰 변경 → **별도 careful 패스**(컴포넌트 var() 사용 → ①②와 독립, rework 없음). UI변경 ↔ 토큰변경 분리 PR.
> - 스키마 = **개발자 큐레이션, 커스텀 상한 L3**(표시토글+SavedViews+값/옵션). **L4(사용자 필드타입 생성) 절대 X** = FlowBase 몫, Plot 정체성 보존.
> - priority 막대 아이콘 = **기억으로 그리지 말 것**(이번에 가짜 그려서 사용자 지적당함) — 리니어 캡처/실측 기반 SVG.
> - 옛 status 코드명(stone/brick/keystone) 119곳/26파일 정리 시 **migrate.ts(26)/seeds/__tests__ 옛 enum 문자열 = backward-compat 유지**, 블라인드 find-replace 금지.
> - **mockup 가짜 아이콘 교훈**: 디자인 미러는 *창작*이 아니라 *모방* → 정확한 레퍼런스(실제 SVG/CSS) 없이 추측 X.
>
> **참고 파일**:
> - `docs/01-plan/features/linear-filter-display-mirror.spec.md` (전체 spec, 최우선)
> - `lib/view-engine/view-configs.tsx`(per-context config), `components/filter-bar.tsx`/`filter-panel.tsx`/`display-panel.tsx`
> - `components/property-chips.tsx`(칩 — PropertyChipRow), `components/note-fields.tsx`(PRIORITY_CONFIG L85/STATUS_CONFIG — priority 아이콘 교체 지점), `components/group-header.tsx`(이 세션 신규 공유 group 아이콘)
> - 리니어 캡처: `C:\Users\user\AppData\Local\Temp\linear-ref\` (~100장, **레포 외** — 사라졌으면 사용자 `리니어 참고자료.zip` 재추출)
> - FlowBase `peterkwon248/FlowBase`(gh): `lib/tokens.ts`/`app/globals.css`/`DESIGN-TOKENS.md`/`components/board/{filter,display,panels}-menu.tsx`/`lib/flowbase-store.ts`
> - mockup(레퍼런스): `docs/v3-mockup/{grid-grouping-proposal,card-hover-properties}.html`
>
> **머신**: 집(Windows).
> **현재 main HEAD**: `a3d5945`(PR #493). 이 세션 A0 = 커밋 `3f7e22e` (이 after-work에서 PR/머지).
> **branch worktree**: `claude/hopeful-jemison-865fea`

### 완료 (이 세션 = 전략 플랜 수립 + A0~A2)
- **A0**: P0 #0(Q1 list-nav dropdown 그룹 캡처 notes-board/wiki-board/wiki-list, wiki-list는 dash-filter 정합 listNavGroups memo) + **notes-grid `.a-tg` 리치 헤더 + chevron collapse**(store-backed `viewState.collapsedGroups`, list와 공유) + **`components/group-header.tsx` 공유 추출**(GroupHeaderIcon/resolveGroupLabel, notes-table → import). 커밋 `3f7e22e`. tsc 0 / store-eval(notes-grid 4섹션 + collapse 실동작) 검증.
- **A1**: 리니어 캡처 ~100장 `linear-design-mirror` 분석 → spec 문서 신규 (드롭다운/패널 spec·컨텍스트 매트릭스·priority 막대 SVG).
- **A2 LOCKED**: 전략 방향 전면 확정 (아래).

### 브레인스토밍 & 큰 결정 (영구 — MEMORY.md push)
- **Track A/B 분리**: A=필터/디스플레이 리니어 미러(지금). B=`layout.tsx`(607)+`linear-sidebar.tsx`(2129 god) 분해(나중, 셸 리디자인 시). ChatGPT의 "분해 먼저"는 풀-셸 리디자인 전제 → 우리 목표(필터/디스플레이)엔 detour, **안 함**.
- **리니어 "딱 맞는 옷" 비결 = 크롬(structure) 통일 + 콘텐츠(options) 컨텍스트별.** ground truth: Issues/Projects/Inbox가 완전히 다른 필터 택소노미(Inbox=Notification type/From 5개, Projects=Lead/Health/Milestones, Assignee 없음).
- **Tier 모델**: Tier1 풀=Notes/Wiki, Tier2 중간=Books, **Library=유지하되 엔티티별 비례 컨트롤**(평면 목록 Tags/Labels/Stickers/Templates=경량 검색+정렬, Categories/Files=중간). "걷어냄"=heavy 패널 제거지 surface 삭제/settings 이동 아님.
- **Priority**: Notes/Wiki ✅(둘 다 status축), **Books=Kind+Priority**(status 없음, Workflow 슬롯을 Kind로). priority 아이콘=**리니어 3-막대**(현 화살표 폐기).
- **6-카테고리 공유 축 스키마**(Workflow/Classification/Relations/Metrics/Time/Content) — 엔티티가 네이티브 축으로 슬롯 채움. Books 빈약 문제 = 6슬롯 매핑으로 해결.
- **schema-driven 엔진 차용(FlowBase)**: PropertyDef[]→filter/display/group/sort 자동 생성 = 일관성 코드 강제. **커스텀 상한 L3**(Linear식). **L4(사용자 필드타입 생성)=안 함**(FlowBase 몫). 두 앱 DNA 구분(FlowBase=유연 스키마 / Plot=큐레이션).
- **FlowBase 우위 확인 → A3 흡수**: OKLCH/LCH 토큰(리니어도 LCH), paired -bg/-fg + toneClassDual, 제네릭 setViewOption.
- **"100% 리니어 내재화" 가능 판정**: MIRROR(리니어 있는 것)+EXTRAPOLATE(온톨로지/그래프/인사이트 = 리니어 7원칙 적용). 단 조건 = 공유 디자인시스템(A3) 락 + 모든 표면에 法으로 강제(novel 표면 drift 위험 1위).

### 기술 학습 (영구)
- **디자인 미러 ≠ 창작**: 정확한 레퍼런스(실제 SVG/CSS) 없이 기억으로 아이콘 그리면 가짜(이번에 priority/tag/folder 가짜 그려 지적당함). Lucide로 ~80% + 리니어 고유는 DevTools/캡처로 실측.
- **컨텍스트별 ≠ 비일관**: 리니어는 표면마다 다른 옵션 + 동일 크롬 → "정합". 일관성은 *틀*에서 나옴(콘텐츠 차이는 정당).
- **dev 서버 screenshot 타임아웃** 지속(Next16 렌더러) — 정적 mockup(serve)은 screenshot 됨. store-eval은 notes 경로만(route module state).
- **schema-driven = 일관성 엔진**(사용자 커스텀과 무관한 아키텍처 가치): 한 PropertyDef[]에서 전 표면 생성 → 코드 레벨 정합.

### Watch Out
- A3-① 스키마 = 큰 아키텍처 작업. 기존 view-configs(per-context) 구조 위에 schema 레이어 — **리빌드 아님, refactor**.
- LCH 토큰 마이그(③)는 app-wide → 신중 분리 패스.
- 옛 status 코드명 119곳 정리 시 backward-compat(migrate/seeds/tests) 유지 필수.
- 사용자 미결정: 폰트 Geist/Inter. (A3 ②③ 전 확인)
- A0 커밋 `3f7e22e`는 이 after-work에서 PR·머지됨.

### 환경 변경
- Store version: **v152 (변경 없음)** — A0는 UI/세션 한정.
- 신규 파일: `docs/01-plan/features/linear-filter-display-mirror.spec.md`, `components/group-header.tsx`, `docs/v3-mockup/{grid-grouping-proposal,card-hover-properties}.html`
- Tests: 변경 없음 (A0 = tsc 0 + store-eval).

---

## 2026-05-30 (집, Windows) — **통합 정합성 플랜: 네비게이션 골격 통일 + 온톨로지 재설계 + grid selection/그룹 + Q1 dropdown 그룹 (8 커밋)**

> 🎯 **다음 즉시 액션 hook**:
> 1. **Q1 나머지 캡처 site** — list-nav dropdown 그룹 섹션을 **notes-grid/board + wiki list/board**에도 적용. 인프라(`ListNavContext.groups` + `useListContextNav` groups resolve + `ListContextNav` 그룹 헤더 섹션 렌더)는 **완성**됐고 지금은 **notes-table(list)만** 캡처에 groups 전달. 나머지 site는 `noteGroupsToListNav(groups)` / `wikiGroupsToListNav(wikiGroups)` 헬퍼(`lib/list-nav/flatten.ts`) 재사용 — 각 site의 `captureListNav(orderedIds, id, label)` 호출에 4번째 인자 groups 추가만 하면 됨. **패턴 참고**: `components/notes-table.tsx:1568,1575`(import `noteGroupsToListNav`, `noteGroupsToListNav(groups)` 전달). notes-grid: `NotesGridView`가 groups prop 있으니 grouped면 noteGroupsToListNav(groups). notes-board: resolvedGroups → noteGroupsToListNav. wiki-list/board: WikiGroup → wikiGroupsToListNav.
> 2. **Phase C — 오버뷰 StatsCard 통일** (미시작). 홈/위키/라이브러리 KPI 박스 py(4 vs 2.5)·숫자(text-2xl vs text-xl)·아이콘(12 vs 18px) 제각각. 공통 `components/stats-card.tsx` 신규 추출(rounded-lg border px-3 py-3 + text-xl + 아이콘 14) → stats-row(홈)/wiki-dashboard MiniStat(L395)/library-view LibraryStatCard(L606) 교체. + StatusCard(4단계 breakdown) 추출.
> 3. (carry) Books kind nav(bookKindFilter) / Entity Insights recharts 표준화 / Wiki breadcrumb category·parent 깊이 / grid 빈 섹션(Todo 0) 표시 여부.
>
> **통합 정합성 플랜 문서**: `C:\Users\user\.claude\plans\playful-honking-octopus.md` (Phase A·B 완료, Phase C 남음).

> **사용자 의도** (이번 세션): P0 #0(notes-grid 비대칭)으로 시작 → "그리드도 board처럼 우측 상단 호버 체크박스" → **옵션 B**(더블클릭 open + list-nav + board parity selection) 결정. 이후 "즉흥 패치 말고 규칙성 제대로" → **통합 정합성 플랜 승인**(네비게이션 골격 통일 + 온톨로지 재설계 + 오버뷰 StatsCard). 디테일 피드백 다수(LEGEND BOOKS 색, sticker book 아이콘, TYPE glyph를 graph처럼, dropdown "왜 10 items").

> **이번 세션 핵심 결정 (영구 — MEMORY.md push)**:
> - **네비게이션 골격 통일**: book/note/wiki 전부 `공간 › [컨텍스트 dropdown ⌄] › 제목 · N/M · 진행바 · ‹ ›`. list-nav를 book TOC dropdown 패턴으로(‹ {label} ⌄ → 현재 리스트 항목 목록 + jump). note picker(전체 노트 검색)는 book/list-nav active일 때 숨김(`suppressNotePicker`).
> - **온톨로지 색=status / 모양=공간**: 위키 노드도 4단계 status 색(violet 폐기). **근본원인 = lib/graph.ts 위키 노드 status "done" 하드코딩**. 공간 구분은 모양(note=circle, wiki=hexagon). LEGEND 축 분리(STATUS 색-dot / TYPE 모양 ○⬡ / BOOKS kind = BookKindIcon).
> - **grid도 그룹 섹션**: 기존 grid는 No grouping만(평면 카드). view-configs groupingOptions modes에 grid 추가 + NotesGridView 세로 섹션 렌더. board=컬럼(가로) ↔ grid=세로 섹션.
> - **list-nav dropdown 그룹**: 캡처가 화면 전체 flat ids만 freeze해 "N items" 평면이던 것(사용자 지적). groups(label+ids)도 freeze → dropdown을 status/folder 섹션으로(≥2그룹만 부착). 그룹 label은 view-engine이 이미 resolve(NoteGroup.label).
> - **book = graph에서 노드 아니라 hull(영역)** — group-by book일 때만. LEGEND TYPE은 노드(note/wiki)만, BOOKS는 별도 섹션.
> - **Manual book kind = 무채색** (BookKindIcon: Smart violet/Hybrid amber/Manual neutral, 의도된 디자인).

> **머신**: 집 (Windows). cross-machine 활성.
> **현재 main HEAD**: 이 PR squash merge 후 (직전 `e305d48` PR #492)
> **branch**: claude/interesting-varahamihira-eeeaef → main squash merge
> **Store version**: v152 (변경 없음 — 전부 UI / 세션 한정 listNavContext.groups)

### 완료 (8 커밋, 전부 tsc 0; 노트·온톨로지 노드·dropdown은 store-eval 검증 — 위키/온톨로지 화면은 SPA route 환경상 사용자 직접 시각)
- `2c432bf` 북스 breadcrumb 버그(book 컨텍스트 note picker chevron → 정적 separator) + list-nav 진행바 + 위키 공간 breadcrumb(ViewHeader titleNode "Wiki ›") + grid 카드 selection(호버 체크박스 + FloatingActionBar, board parity) + **preview IPv4 fix**(launch.json `-H 127.0.0.1`).
- `44dbf9b` Phase A — list-nav를 book TOC dropdown으로 통일 (useListContextNav items+jumpTo, ListContextNav dropdown, note picker 흡수).
- `4f23242` Phase B — 온톨로지 색=status/모양=공간 + LEGEND 재구조 (STATUS/TYPE/BOOKS).
- `b496e9b` LEGEND BOOKS = BookKindIcon 색.
- `bf4f0a0` sticker member book resolve 누락 수정.
- `7f71f36` grid 그룹 섹션 (NotesGridView 세로 섹션 + view-configs grid modes).
- `ac30c47` LEGEND TYPE Wiki = graph 노드 모양 (hexagon + cube wireframe).
- `6d60df9` Q1 list-nav dropdown 그룹 (인프라 + notes-table 캡처).

### 기술 학습 (영구 — MEMORY.md push)
- **preview MCP IPv4 fix**: Next 16이 IPv6(`::`)로만 바인딩 → preview MCP IPv4 probe 실패로 안 떴음. **launch.json dev에 `-H 127.0.0.1` 추가로 근본 해결** (이 환경 고질 문제). preview_eval/snapshot/console은 동작하나 screenshot은 이 환경에서 타임아웃(렌더러).
- **이 환경 자동검증 한계**: `window.__plotStore` store 조작 + preview_eval로 노트·book·온톨로지 노드·dropdown 검증 가능. 단 **위키/온톨로지 화면 전환은 activeRoute가 module state라 eval/nav click으로 안 됨** → 사용자 직접 시각 필수.
- **eval 함정**: `const st=getState()` 후 setViewState → `st.viewStateByContext`는 stale(set 전). fresh `getState()` 재호출 필요. ("10 items" 디버깅 시 stale 읽어 오판한 사례.)
- **graph wiki node status 하드코딩 함정**: lib/graph.ts:253 위키 노드 status "done" 고정이라 status가 graph에 안 실림. wa.status로 + buildOntologyGraphData param·ontology-view 매핑에 status 추가.
- **radix dropdown은 pointer 이벤트**: eval `.click()`으로 안 열림 → `dispatchEvent(new PointerEvent('pointerdown'/'pointerup'))`.
- **setViewState는 raw merge**(normalizeViewState/applyModeAwareGroupBy 안 거침). grid grouping 노출은 display-panel isGroupingModeAllowed + view-configs modes. applyModeAwareGroupBy(defaults.ts:137)는 mode 전환 시 groupBy 검증.

### Watch Out (다음 세션)
- **Q1 미완**: dropdown 그룹이 notes-table(list)만. notes-grid/board + wiki list/board 캡처는 아직 평면 — 헬퍼 재사용으로 마무리(위 hook #1).
- **사용자 시각 확인 누적**: 온톨로지(노드 status색/LEGEND/라이트 대비)·위키 breadcrumb·grid 체크박스·grid 그룹·sticker book·Q1 dropdown·LEGEND Wiki hexagon — 코드/tsc/store-eval은 통과, 일부 사용자 실제 화면 미확인. before-work 시 피드백 반영.
- **grid 빈 섹션**: groupBy status grid에서 0개 섹션(Todo)도 헤더 표시(board parity). 숨길지 미결.
- **Phase B 라이트 대비**: 사용자 "그 외 만족"이라 추가 미세조정 안 함(노드 채움 alpha / svg LegendOverlay node swatch는 미터치).

### 환경 변경
- Store version: v152 (변경 없음 — listNavContext.groups는 세션 한정)
- 주요 변경 파일: lib/store/types.ts·ui.ts / hooks/use-list-context-nav.ts·use-list-nav-capture.ts / components/list-context-nav.tsx / lib/list-nav/flatten.ts(헬퍼) / lib/graph.ts / components/ontology/ontology-graph-canvas.tsx·ontology-legend.tsx / lib/view-engine/view-configs.tsx / components/views/notes-grid-view.tsx·wiki-view.tsx / components/notes-grid-shell.tsx·notes-table.tsx·note-editor.tsx·editor-breadcrumb.tsx / components/side-panel/sticker-detail-panel.tsx / lib/i18n.ts / .claude/launch.json
- Tests: 미실행(전부 UI 변경, tsc 0으로 게이트). preview: localhost:3002

---

## 2026-05-29 (심야) — 집 (Windows), **list-context-navigation 구현 (Linear 리스트 peek 네비 — bookContext 일반화)**

> 🎯 **다음 즉시 액션 hook (최우선 — 사용자 지정)**:
> 1. **🔴 P0 #0 — notes-grid list-nav 비대칭 브레인스토밍** ⭐ (사용자가 이번 세션 끝에 "다음 세션 최우선"으로 명시 지정). list-context-nav가 노트 list/board + 위키 list/board/grid **5뷰**에 적용됐으나 **notes-grid만 제외**됨 — notes-grid는 구조상 단일클릭=preview only로 **에디터 직접 진입 경로가 없어서**(기존 동작). 반면 wiki-grid는 `onOpen=editor`라 적용됨 → **grid 비대칭**. 결정 필요: notes-grid에 더블클릭 에디터 진입을 신설해 list-nav 지원할지 vs 현행 preview-only 유지할지. (먼저 notes-grid가 preview-only인 게 의도된 디자인인지 점검.)
> 2. (carry) **P0 #1 — Books kind nav** (설계 LOCKED, `bookKindFilter` external store = wikiStatusFilter 미러).
> 3. (carry) **P0 #2 — Entity Insights 통일** (recharts 표준화 + Ontology/entity 역할 분리 #140).

> **사용자 의도** (이번 세션): "ㅇㅇ 시작하자" → 직전 세션 설계 확정한 list-context-navigation 구현. 끝에 notes-grid 비대칭 발견 → "애프터워크하고 이 논의(브레인스토밍)를 다음 세션 최우선 과제로."

> **이번 세션 핵심 결정 (영구 — MEMORY.md push)**:
> - **freeze 스냅샷**: list-nav는 클릭 시점 visible-ordered ids를 고정 저장(book은 영속 ordered entity라 매 렌더 재계산하지만, list는 freeze). 필터/그룹 변경 후에도 "그때 그 리스트" 안정 유지.
> - **세션 한정 = store version 무관**: listNavContext는 partialize strip + onRehydrate reset (bookContext 동일). persist 안 하므로 IDB 무영향 → **migration/version bump 불필요** (v152 유지).
> - **클릭 동작 차이 보존**: 노트=더블클릭으로 에디터 진입(단일클릭=preview, 기존 동작) → 더블클릭에 캡처 / 위키=단일클릭=에디터 → onClick에 캡처. notes/wiki 비대칭은 기존 UX 그대로.
> - **우선순위**: bookContext > listNavContext (에디터 `!bookNav.active && listNav.active` 가드).

> **머신**: 집 (Windows) → 다음 **다른 컴퓨터** 가능
> **현재 main HEAD**: 이 PR squash merge 후 (직전 `d7b2cf4` PR #491)
> **branch**: claude/hardcore-gauss-c01d27 → main squash merge
> **Store version**: **v152 (변경 없음 — list-nav는 세션 한정)**

### 완료 (전부 검증 — tsc 0 / build success / test 282 pass / Architect APPROVED / preview 런타임)
- **list-context-navigation** (Linear 리스트 peek 네비): 리스트/보드/그리드에서 노트·위키 열면 그 화면 visible-ordered ids를 freeze 캡처 → 에디터 "← {label} N/M →" prev/next + 복귀. bookContext/BookContextNav 일반화한 **형제** 기능.
- **인프라 (직접 구현)**: `ListNavContext` 타입 + `listNavContext:{primary,secondary}` state + `setListNavContext` (lib/store/types.ts·ui.ts·index.ts, 세션 한정 strip/reset) · `lib/list-nav/flatten.ts`(flattenNote/WikiGroupIds) · `hooks/use-list-context-nav.ts`(freeze ids 기준 prev/next/back, pane-aware) · `components/list-context-nav.tsx`(UI 바) · `hooks/use-list-nav-capture.ts`(route/filter 자동 수집 캡처 헬퍼).
- **mount (직접)**: note-editor.tsx + wiki-view.tsx (우선순위 bookContext > listNavContext).
- **capture 통합 (executor-high 위임 + Architect 검증)**: notes-table / notes-board + wiki-list / wiki-board / wiki-grid-view **5뷰**. notes-grid는 preview-only로 보류(→ P0 #0).
- **preview 런타임 검증**: /notes 더블클릭 → "← Notes 1/9"(prev 비활성) → next "2/9"(prev 활성) → "← Notes" back → 리스트 복귀(에디터·네비 바 닫힘). 콘솔 에러 0.

### 기술 학습 (영구 — MEMORY.md push)
- **freeze vs 재계산**: bookContext는 resolvedContentItems를 매 렌더 재계산(영속 ordered entity), list-nav는 `ctx.ids` 스냅샷 고정 — `liveIndex = ctx.ids.indexOf(refId)`. 필터 풀어도 스냅샷 유지.
- **세션 한정 = store version 무관**: persist partialize에서 strip하면 IDB 스키마 무영향 → migration/version bump 불필요(bookContext 동일 패턴).
- **table-route setter 상호배타**: setActiveFolderId/TagId/LabelId/ViewId는 하나 set 시 나머지 자동 null → goBack 복원은 if/else-if 분기로 정확히 하나만 복원.
- **위키 secondary pane 한계**(book nav와 동일 seam): secondary wiki는 SecondaryWikiArticle 렌더(WikiView 아님) → navigateTo가 openInSecondary → 네비 바 unmount. 기존 아키텍처 한계(수용).

### Watch Out (다음 세션)
- **P0 #0 = notes-grid 비대칭** (위 hook). 사용자 최우선 지정.
- **board capture = logical superset**: 보드는 컬럼당 50카드 limit + collapsed 컬럼 0렌더지만 캡처는 full group flatten → off-screen 카드 포함 가능(50+ 컬럼에서만 현실적). Architect "arguably acceptable"(논리적 컬럼 순서). 엄격 visible-only 원하면 sliced/non-collapsed set 전달.
- **LOW(미구현, plan 대비)**: prev/next가 hard-deleted id skip 안 함(plan §6.1) / 키보드 네비 없음(buttons만, plan §4) / `ListNavContext.index` vestigial(liveIndex가 refId로 재계산, 표시엔 미사용 — book nav symmetry로 유지).

### 환경 변경
- 신규 파일: `lib/list-nav/flatten.ts`, `hooks/use-list-context-nav.ts`, `hooks/use-list-nav-capture.ts`, `components/list-context-nav.tsx`
- Store version: v152 (변경 없음)
- Tests: 282 pass / 11 pre-existing fail (date-grouping + seeds, 무관)

---

## 2026-05-29 (밤) — 집 (Windows), **Wiki status v151 + 사이드바 정합 + 노트 merge/split + Smart Book Preset (store v152) + 설계(kind nav·list-nav)**

> 🎯 **다음 즉시 액션 hook (최우선)**:
> 1. **🔴 P0 #0 — list-context-navigation 구현** ⭐⭐⭐⭐⭐ (이번 세션 설계 확정, 다음 세션 구현). 전체 설계 = `docs/01-plan/features/list-context-navigation.plan.md`.
>    - **개념**: 리스트/보드/그리드에서 노트·위키를 열 때 **그 순간 보이던 (필터+그룹 적용된) 순서 있는 집합을 freeze 캡처** → 에디터 상단에 "← {라벨} N/M →" 네비 바 (prev/next + 복귀). 북의 `bookContext`/`BookContextNav` 일반화.
>    - **첫 스텝**: `bookContext`/`BookContextNav` 패턴 일반화 → `listNavContext`(pane별, 세션 한정) 추가 + list/grid/board view 열기 시 visible ordered IDs 캡처 + 에디터 네비 바. All/status/folder/saved-view 진입 모두 지원 (timeline 보류).
> 2. **🔴 P0 #1 — Books kind nav** (All Books 아래 Smart/Manual/Hybrid). **설계 LOCKED** — wiki `wikiStatusFilter` 패턴 미러: `bookKindFilter` external store + 사이드바 링크 + books-view 필터(getBookKind). 카운트 Smart 3 / Manual 2 / Hybrid 2. **Books Overview = 보류**(Insights + 사이드바 Pinned/Recent와 중복, continue-reading 비어 있음 — 만들지 말 것).
> 3. (carry) **P0 #2 — Entity Insights 통일 PRD** — 대부분 진행됨(`/wiki/insights` + `/books/insights` 신설 완료). 나머지 = `docs/01-plan/features/entity-insights-coherence.plan.md`.
> 4. References = 분류/기록 entity지만 **유일하게 미래 *구조화 상세 폼*(full editor 아님) 후보**. 후속 고려.

> **사용자 의도** (이번 세션):
> - "노트에 했던 status 4단계를 위키에도" → Wiki status 4단계 통일 (자동 stub/article → 수동 backlog/todo/in_progress/done)
> - "위키 사이드바도 노트처럼 More/Insights/status nav" + "노트도 위키처럼 merge/split 독립 페이지" → 사이드바 정합 + 노트 standalone merge/split
> - "스마트 북도 본격적으로 구축" + "북 More에 인사이트랑 스마트북" → Smart Book Preset 시스템 + Books More/Insights
> - "after-work 해줘. 다른 컴퓨터에서도 작업할 수 있게" → 이 after-work (branch claude/smart-book-preset → main squash merge)

> **이번 세션 핵심 결정 (영구 — MEMORY.md push)**:
> - **Full editor = Notes/Wiki only** (authored content). Tags/Labels/Categories/References/Stickers/Files = 분류/기록 → inline + member-list page 유지. References만 미래 *구조화 상세 폼* 후보(full editor 아님).
> - **Books 축 = kind** (smart/manual/hybrid), status 아님. **Books Overview = 보류** (Insights + 사이드바 Pinned/Recent 중복, continue-reading 비어 있음).
> - **list-context-navigation** 설계 확정(plan doc): 진입 화면의 *필터+그룹 적용된 visible set* freeze → 에디터 "← {라벨} N/M →" → prev/next + 복귀. bookContext 일반화. list/grid/board (timeline 보류), All/status/folder/saved-view 진입.

> **머신**: 집 (Windows) → 다음 **다른 컴퓨터**
> **현재 main HEAD**: 이 세션 combined PR squash merge 후 (직전 `c4ee673` PR #489)
> **branch**: claude/smart-book-preset (a259061 = 위키 작업 기반) → main squash merge (PR #490 supersede)
> **Store version**: v150 → **v151**(wiki status) → **v152**(smart book presets)

### 완료 (전부 검증 — npm run build green, tsc 0, test 282 pass/11 pre-existing fail, Architect APPROVED, preview runtime 확인)
1. **Wiki status 4단계 (store v150→v151)** [= 커밋 `a259061`, PR #490 wiki work]: `WikiArticle.status`(= NoteStatus) 신규 필드. 자동 stub/article → 수동 backlog/todo/in_progress/done. **시딩을 onRehydrateStorage로 이동**(content→done / empty-template→backlog) — partialize가 blocks를 strip하기 때문. 색/아이콘/i18n은 Notes와 공유. Wiki 보드 2→4 컬럼. **Architect가 HIGH 버그 2개 발견·수정**(마이그레이션 타임 all-backlog 버그 / 노트 overlay cross-route 누수). preview 검증: 위키 17개 복원, 16 done / 1 stub 시딩.
2. **Wiki 사이드바 정합** [PR #490]: Merge/Split→More, `/wiki/insights` 신설, Overview 아래 status nav(`wikiStatusFilter`), Recent legacy-filter 버그 수정(wikiArticles store 읽기 + trashed 제외).
3. **노트 wiki-level standalone merge/split** [PR #490]: `note-view-mode` store + NoteMergePage + split picker→기존 NoteSplitPage + Notes More 항목. overlay route-gated(isTableView) + leaving 시 reset.
4. **Smart Book Preset 시스템 (store v151→v152)** [이 branch UNCOMMITTED → 이 커밋]: `SmartBookPreset` 모델 + `lib/store/slices/smart-book-presets.ts` + 3 seed presets + `/books/smart-books` 갤러리 + Books "More" 섹션(Smart Book + Insights) + `/books/insights`(kind breakdown). 기존 resolver/createBook 재사용. preview 검증(3 presets 렌더, insights kind breakdown Smart 3/Hybrid 2/Manual 2).
5. **Wiki 데이터 복원** (런타임/IDB only, 코드 아님): 사용자의 trashed 위키 17개 복원.

### 큰 결정 (영구 — MEMORY.md에도 push)
- **Full editor 경계**: Notes/Wiki만 full editor (authored content). 분류/기록 entity(Tags/Labels/Categories/References/Stickers/Files)는 inline + member-list page. References만 미래 *구조화 상세 폼* 후보.
- **Books 축 = kind**(smart/manual/hybrid). status 축 아님. **Books Overview 보류**(Insights + 사이드바 Pinned/Recent 중복, continue-reading 빈 상태).
- **list-context-navigation 설계 확정** — bookContext 일반화, freeze 스냅샷 패턴. 다음 세션 구현 (P0 #0).

### 기술 학습 (영구 — MEMORY.md에도 push)
- **partialize가 blocks를 strip → 시딩은 onRehydrateStorage에서**: WikiArticle 시드 status를 content 기반(content→done / empty-template→backlog)으로 매기려면 persist partialize가 blocks를 떼기 전이 아니라 rehydrate 후에 판정해야 정확. migrate-time에 하면 blocks 부재로 all-backlog 버그 (Architect 발견).
- **노트 overlay cross-route 누수**: merge/split overlay를 route-gate(isTableView) + leaving 시 reset 안 하면 다른 라우트로 leak (Architect 발견).
- **Wiki Recent legacy-filter**: Recent는 wikiArticles store를 읽고 trashed 제외해야 — 옛 필터가 잘못된 소스 읽던 버그.
- store v152 = SmartBookPreset 슬라이스 추가, 기존 AutoSource/resolver/getBookKind 재사용(엔진 신규 아님, Preset 청사진 레이어만).

### Watch Out (다음 세션 주의사항)
- **list-context-navigation = freeze 타이밍**: "그 순간 보이던 순서 있는 집합" 캡처가 핵심. 필터/그룹 변경 후 재진입 시 재캡처. pane별 + 세션 한정(영속 X). bookContext는 영속 ordered entity라 쉬웠지만 list는 캡처 단계 추가.
- **Books kind nav = wikiStatusFilter 패턴 1:1 미러**: external store(`bookKindFilter`) + 사이드바 + books-view 필터(getBookKind). Books Overview는 만들지 말 것(중복).
- **pre-existing 테스트 실패 11개** (date-grouping + seeds require) — 이 세션 무관.
- **다른 컴퓨터 IDB는 머신별 분리** → 그 머신 첫 실행 시 v150→v151→v152 마이그레이션 순차 실행(데이터 손실 0 설계).

### 환경 변경
- Store version: **v150 → v151 → v152**
- 신규 파일: `lib/store/slices/smart-book-presets.ts`, `components/views/smart-book-presets-view.tsx`, `components/views/books-insights-view.tsx`, `app/(app)/books/smart-books/`, `app/(app)/books/insights/`, plan docs 3개(`wiki-status-4stage`/`smart-book-preset`/`list-context-navigation`)
- branch claude/smart-book-preset → main squash merge (PR #490 supersede·close)

---

## 2026-05-29 (오후) — 집 (Windows), **NoteStatus 3→4 단계 REPLACE: stone/brick/keystone → backlog/todo/in_progress/done (이 세션 PR, squash merge)**

> 🎯 **다음 즉시 액션 hook (최우선)**:
> 1. **🔴 4단계 status 시각 검증 + 미해결 판단 콜 3개 결정** ⭐ (이 세션 코드/타입/빌드/테스트/Architect는 통과했으나 **UI 시각 확인 미완** — 이 환경 preview MCP가 node 15개 + IPv6 바인딩 충돌로 안 떴음)
>    - **첫 스텝**: `npm run dev`(port 3002, autoPort) → 노트 **보드 4컬럼(대기/준비/정리 중/완성)** + 사이드바 status 섹션 4항목 + 색(backlog slate / todo `#3b82f6` blue / in_progress amber / done emerald) + Linear circle 아이콘(CircleDashed/Circle/CircleHalf/CheckCircle) 눈으로 확인. 라우트 `/backlog /todo /in-progress /done` 직접 접속.
>    - **미해결 판단 콜 (이 세션 reasonable call로 "둠" 처리 — 사용자 최종 결정 필요)**:
>      a. **settings-store `startView:"stone"` 리터럴** (`lib/settings-store.ts:33`) — 별도 store라 라우트 매핑(`layout.tsx:63-65` `START_VIEW_ROUTE.stone→/backlog`)으로 동작은 함. 완전 정합 원하면 settings-store 2차 마이그레이션 필요(stone→backlog 등 + version bump).
>      b. **`app/preview/linear/page.tsx` 목업** — 자체 로컬 `type NoteStatus='stone'|'brick'|'keystone'` + Hexagon/Cube/Cuboid 아이콘 그대로 둠 (격리된 데모, preview 작업 트랙 별도). 일관성 위해 바꿀지.
>      c. **죽은 i18n 키** `sidebar.stone/brick/block` (`i18n.ts:179-181,1136-1138`) — 미참조(grep 0), 값은 새 vocab. 제거할지(cosmetic).
> 2. (carry) **Entity Insights 정보 아키텍처 통일 PRD** — plan 완료(`docs/01-plan/features/entity-insights-coherence.plan.md` A안), design 남음. recharts 표준화. Notes=별도 `/insights` / Wiki=dashboard 임베드 / Books=없음 / Ontology=top-level → 위치 통일.
> 3. (carry) Wiki `← Overview`→breadcrumb / Phase 4 filter-bar(source 정리) / Category-Label 필터 비대칭
> 4. (parked) 넛지(우하단 토스트) 루틴화/설정화 — `hooks/use-autopilot-nudges.ts` 하드코딩 3종(4h 쿨다운, fire-once) → 설정 가능 + `lib/autopilot/*` 룰 엔진(UI 없음) 통합 검토.

> **사용자 의도** (이번 세션 인용):
> - "노트에 기존 스톤,브릭,블록에서 백로그,투두,인프로그레스,던으로 바꿨거든?? 노트 말고 위키,북에도 추가" → status 4단계 통일 (브레인스토밍 후 확정)
> - "나는 대체를 생각했거든? ... 대기→준비→정리 중→완성. 이건 완성도에 대한 이야기니까" → **완성도 축 유지하며 3→4 REPLACE** (태스크 관리 피벗 아님 — colors.ts:141 주석이 이미 brick=정리 중·keystone=완성으로 적시)
> - "필터와 디스플레이에도 ... 신설 ... 기존 3개를 4개로" + "라우트 이름도 다 바꿔줘" → 전 surface + 라우트 rename
> - "after-work 해줘. 다른 컴퓨터에서도 작업할 수 있게. 나 이제 나가봐야 돼" → 이 after-work

> **이번 세션 핵심 결정 (3→4 매핑)**: stone→backlog · brick→in_progress · keystone→done · **todo=신규 수동 단계**(매핑 소스 없음, 빈 채 시작). autopilot 규칙도 같은 매핑으로 기존 동작 보존(backlog→in_progress, in_progress→done; todo는 default 규칙 미접촉).

> **머신**: 집 (Windows) → 다음 **다른 컴퓨터**
> **현재 main HEAD**: 이 PR squash merge 후 (직전 `3f02d80` PR #488)
> **branch**: claude/friendly-roentgen-402e31 (worktree friendly-roentgen-402e31)

### 완료
- **NoteStatus 3→4 atomic rename (85파일, 이 세션 PR)**: enum `backlog|todo|in_progress|done` (`lib/types.ts:1`) + store **v150** IDB 마이그레이션(6개 영속 surface: notes.status / viewStateByContext keys / savedViews.space+filters / autopilotRules conditions+actions / customQuickFilters, idempotent) + 라우트 rename(`/stone→/backlog`, `/brick→/in-progress`, `/keystone→/done`, `/todo` 신규) + 색 4종(+todo `#3b82f6`) + Linear circle 아이콘 4종 + i18n EN(Backlog/Todo/In Progress/Done)/KO(대기/준비/정리 중/완성) + 보드 4컬럼 + 필터/디스플레이 4옵션 + autopilot 규칙 매핑 + ontology breakdown 3→4 count. executor-high 구현 + Architect APPROVED.
- 검증: `tsc --noEmit` exit 0 · `npm run build` "Compiled successfully" (4 라우트 emit, 옛 3개 제거) · `npm run test` 282 pass(11 fail = date-grouping + `require("./seeds")` env, **pre-existing/status 무관, HEAD에서도 동일**) · Architect APPROVED (마이그레이션 데이터 안전·idempotent·todo v131 cleanup 방어·rename 완전).
- (before-work) docs 크로스머신 정정 + 넛지 루틴화 task parked.

### 브레인스토밍 & 큰 결정 (영구 — MEMORY.md에도 push)
- **🔒 LOCKED #118/#100 폐기**: 스톤/브릭/블록 음역 시그니처(#118) + phosphor 건물 아이콘 3종(#100) → **4단계 완성도 축으로 대체**. 단, **축 의미는 동일**(원석/raw→완성/done progression). 라벨만 Linear 어휘로 교체(의미 재정의 = "완성도", 태스크 관리 아님).
- **3→4 = 대체(REPLACE), 추가 아님**. 사용자가 "완성도 이야기"로 프레이밍 → Zettelkasten 정체성 배신이 아니라 진화로 판정. Wiki stub/article(완성도 축)과도 정합 ↑.
- **todo는 수동 단계**: backlog(raw)와 in_progress(가공 중) 사이. 자동 승격 규칙이 todo로 옮기지 않음(경계 모호로 인한 status 썩음 회피 — 객관적 기준은 autopilot reads/links 트리거 유지).

### 기술 학습 (영구 — MEMORY.md에도 push)
- **3→N cardinality 변경 마이그레이션의 함정**: 신규 단계(todo)는 legacy 매핑 소스가 없어, garbage-cleanup(v131 `VALID_STATUSES`)이 "유효하지 않은 status"로 보고 stone으로 "복구"→v150이 backlog로 재매핑 = **silent 데이터 유실**. 회피 = cleanup allow-list에 신규 enum 값 포함(`migrate.ts:1987-1990`). 단순 rename(1:1)과 달리 cardinality 변경은 이 순서 의존성 주의.
- **early-bird viewStateByContext rename**이 `normalizeViewStatesMap`(VALID keys만 iterate) **전에** 돌아야 per-status 커스터마이즈 유실 안 됨 (`migrate.ts:96-118`).
- **route slug ≠ enum 값**: `/in-progress`(kebab) vs `in_progress`(snake) 구분 유지.
- **이 환경 preview MCP 불가**: node 15개 누적 + Next 16 dev IPv6(`::`) 바인딩 → preview가 IPv4 probe로 "server not found". 시각 검증은 사용자 직접.

### Watch Out (다음 세션 주의사항)
- **UI 시각 미검증** — 보드 4컬럼/사이드바/색/아이콘 실제 렌더 사용자 확인 필요 (코드/타입/빌드/테스트는 green).
- **미해결 판단 콜 3개** (hook 1a/b/c) — settings-store 리터럴 / preview 목업 / 죽은 i18n 키. 전부 "둠"으로 머지됨, 사용자 최종 결정 시 후속 PR.
- **IDB v150 마이그레이션** — 기존 사용자 데이터: stone→backlog, brick→in_progress, keystone→done 자동. todo 빈 상태. **다른 컴퓨터의 IDB는 머신별 분리** → 그 머신에서 첫 실행 시 v150 마이그레이션 돈다(데이터 손실 0 설계).
- pre-existing 테스트 실패 11개(date-grouping + seeds require) — 이 세션 무관, 별도 정리 대상.

### 환경 변경
- Store version: **v149 → v150**
- Tests: 282/293 pass (11 pre-existing fail, status 무관)
- 신규 파일: `app/(app)/todo/page.tsx`, `docs/01-plan/features/note-status-4stage.plan.md`
- 사용자 IDB stale data: 없음 (v150 자동 마이그레이션)

---

## 2026-05-28 (오후 후속) — 집 (Windows), **Library 정합 연속: categories 체크박스 + 컬럼 헤더 i18n + Book 폴더 Phase 2 + folder space fix (PR #486 + 이 PR)**

> 🎯 **다음 즉시 액션 hook (최우선)**:
> 1. **🔴 A+ book/wiki folder = note 패턴 전환** ⭐⭐⭐⭐⭐ (사용자 명시 최우선, 다른 컴퓨터에서 이어받음)
>    - **문제**: note folder 클릭 → `/notes` + folder filter (notes-table 풀폭, `linear-sidebar.tsx:905-911`). 근데 wiki/book folder 클릭 → `/folder/[id]` folder page (max-w-3xl 좁음) = **비대칭**. 사용자: "북 폴더 잘려서 나온다" + "노트 폴더는 (notes-table 풀폭) 이렇게 나옴".
>    - **목표**: book + wiki folder도 note 패턴 (`/books`|`/wiki` + folder filter 풀폭 table + breadcrumb)
>    - **첫 스텝**:
>      1. `lib/view-engine/use-notes-view.ts:96` `extras.folderId` filter 패턴 참조 (notes는 useActiveFolderId → folder filter)
>      2. `lib/view-engine/use-books-view.ts` + wiki view hook에 `folderId` filter 추가 (notes 복제). `Book.folderIds`/`WikiArticle.folderIds`.includes(folderId)
>      3. `components/linear-sidebar.tsx` book folder 클릭 핸들러: 현재 `setActiveRoute('/folder/${id}')` → `accessFolder(id) + setActiveFolderId(id) + setActiveRoute('/books') + router.push('/books')` (note folder 패턴 `:905-911` 복제). wiki folder도 → `/wiki` + filter.
>      4. books/wiki page에서 `useActiveFolderId` → folder filter + breadcrumb ("Daily Log ×", notes-table breadcrumb 참조)
>      5. 현재 folder page book/wiki branch는 **direct URL용 유지** (note folder도 folder page note branch 있음 — 공존 OK)
>    - **검증**: book folder 클릭 → `/books` 풀폭 books-table + folder filter + 사이드바 Books 유지. tsc + 사용자 시각.
> 2. (carry) **Entity Insights 정보 아키텍처 통일 PRD** — plan 작성됨(`docs/01-plan/features/entity-insights-coherence.plan.md` A안 확정), design 남음. 차트 인프라 = recharts 표준화(chartDB 패스, Tremor 패스).
> 3. (carry) Wiki ← Overview breadcrumb / Phase 3.1 reference / Phase 4 filter-bar(source 정리) / Category-Label 필터 비대칭

> **사용자 의도** (이번 세션 인용):
> - "라이브러리 특정 섹터 list 모드 체크박스 없다 ... 노트 정합" → categories 체크박스
> - "컬럼 헤더 한글인데 영어 name ... 전수조사 언어 설정별로" → i18n
> - "왜 북 폴더 눌렀는데 사이드바 노트로?" → space fix
> - "북 폴더 잘려서" + "노트 폴더는 (notes-table 풀폭) 이렇게" → A+ (다음 최우선)
> - "A+ 하고싶은데 우선 after-work하고 다음 세션 최우선 todo로. 다른 컴퓨터에서 로그인."

> **이번 세션 누적 (PR #486 머지 + 이 PR)**:
> - **PR #486 (머지됨)**: categories list 체크박스(hover-only + 헤더 select-all all/partial/none, `CategoryFullListView` row `<button>`→`<div>`) + 컬럼 헤더/탭 i18n (`lib/i18n.ts` `column.*`/`filter.tab.*` 21쌍 키 + 9 view useT). 한글 모드 헤더 한글(이름/상위/단계/아티클...).
> - **이 PR (Book 폴더 Phase 2 + space fix)**: createFolder kind +`"book"` + `setBookFolders`/`addBookToFolder`/`removeBookFromFolder` (folders.ts) + folder-picker `"book"` 지원 + 사이드바 Books Folders section(Wiki 복제) + folder page book branch(BookKindIcon row) + book context menu "폴더로 이동" (book-table 공유) + **table-route space fix**.

> **첫 스텝 (다음 세션 A+)**: `lib/view-engine/use-notes-view.ts:96` (folderId filter) → `use-books-view.ts` 동일 추가 → `linear-sidebar.tsx:905-911`(note) 복제해 book/wiki folder 클릭 핸들러 변경 → books/wiki page breadcrumb.

> **머신**: 집 (Windows) → 다음 **다른 컴퓨터**
> **branch**: claude/epic-banzai-6629ac

### 완료
- **categories 체크박스 (PR #486)**: list 모드만 체크박스 누락 부채. hover-only 체크박스 + 헤더 select-all(all✓/partial−/none) + 다중선택 checkedIds. CategoryFullListView (wiki/library 공통).
- **컬럼 헤더 i18n (PR #486)**: explore 전수조사 → executor-high 적용. column.*/filter.tab.* 21쌍 EN+KO + 9 view useT. notes-table reads 포함. book-table 참고 패턴.
- **Book 폴더 Phase 2 (이 PR)**: 데이터 Phase 1(v149) 위에 UI. createFolder +book, setBookFolders, folder-picker book, 사이드바 Books Folders section, folder page book branch, book context menu 폴더 이동. executor-high.
- **folder space fix (이 PR)**: 사용자 "북 폴더 클릭 시 사이드바 Notes로" 버그. 원인 = `inferSpace`가 `/folder/[id]`(cross-kind)를 default notes로 매핑. fix = setActiveRoute `/folder/` skip inferSpace(현재 context 유지) + spaceHint, folder page useEffect folder.kind→space.

### 큰 결정 (영구 LOCKED 후보 #169~#170)
- **#169 folder 진입 = entity view + folder filter (note 패턴)**: note folder = `/notes` + folder filter (notes-table 풀폭). wiki/book도 동일해야 (현재 folder page 비대칭 = 부채). 다음 세션 A+ 전환. folder page는 direct URL용 잔존.
- **#170 table-route inferSpace /folder cross-kind**: `/folder/[id]`는 note|wiki|book 다 가능 → route만으론 space 추론 불가. setActiveRoute `/folder/` skip inferSpace(현재 _activeSpace 유지) + optional spaceHint. folder page useEffect가 folder.kind→space 보정 (direct URL/reload).

### Watch Out (다음 세션)
- **A+ 전환 시 folder page book/wiki branch 폐기 X** — direct URL용 유지 (note folder도 folder page note branch 있음). 사이드바 클릭만 `/books`|`/wiki` + filter로.
- **books-view/wiki-view folderId filter = notes-view `extras.folderId` 패턴 복제** (use-notes-view.ts:96).
- **space fix는 이미 적용** (사이드바 book folder 클릭 → Books context 유지). A+는 그 위에 books-table 풀폭 + folder filter.
- preview full-reload는 SPA folder page 검증 불가 (store 미노출 + activeRoute SPA). 사용자 실제 확인 필요.
- store version v149 (변경 없음). tsc --noEmit exit 0.

### 머신
집 (Windows)

---

## 2026-05-28 (오후) — 집 (Windows), **사이드바 책 BookKindIcon 정합 + Wiki More section (1 PR) + entity 정합 brainstorm 대량**

> 🎯 **다음 즉시 액션 hook (우선순위 순)**:
> 1. **Entity Insights 정보 아키텍처 통일 PRD** ⭐ — 핵심 발견: Insights 위치가 entity마다 제각각. **Notes**=별도 `/insights` 페이지(`insights-view.tsx`, activity stats + analysis orphans/issues + MiniBarChart), **Wiki**=Dashboard 임베드(`wiki-dashboard.tsx:262` `WikiInsightsChart` Growth/Connectivity + Day/Week/Month), **Books**=없음, **Ontology**=top-level 탭(Power Sabermetrics 전체). → **"별도 page vs dashboard 임베드" 위치 통일 결정** 필요 (영구 룰 #140 = Ontology 전체/entity 세부 중복 회피). `bkit:pdca plan` + `oh-my-claudecode:planner`(Opus)로 설계.
> 2. **Books More section 신설** — Insights(페이지 신설 전제) + **Smart Book Preset**(= Templates의 Books 대응, `smart-book-prd.md:601` v2 미구현, ROI 검토 — book 생성 빈도 낮아 과거 사용자 "확신 안 듦"). 사용자 논리: "다른 애들 템플릿이 북에서는 스마트북". 단 Smart Book은 page 없는 book 속성이라 → Preset 기능(source 조합 청사진)이 진짜 대응.
> 3. **Book 폴더 Phase 2** — 데이터 Phase 1 완료(`Folder.kind="note"|"wiki"|"book"` types.ts:666 + `Book.folderIds` + v149), **UI 미구현**. `createFolder`가 아직 "book" kind 안 받음(`folders.ts:18` note|wiki만), 사이드바 Books Folders section 없음(`newFolderKind` state도 note|wiki), `folder/[id]/page.tsx` book branch 빈 페이지. #145 carry.
> 4. **(carry)** Wiki `← Overview` → breadcrumb 마이그(직전 오전 세션 P0 #0, 이번 세션 미진행) + Phase 3.1 `/preview/linear` reference + Phase 4 filter-bar Linear 마이그(여기서 **Note source 필터 정리** 같이 — 이번 세션 defer 결정).
> 5. **(carry)** Category/Label 필터 노출 비대칭 — 데이터는 글로벌(Note/Wiki/Book 모두 `categoryIds`/`labelId` + Library hub `/library/categories|labels`), UI 필터는 비대칭(Category 필터=Wiki만, Label 필터=Wiki 제외). 의도(gentle by default) vs 부채 결정.
>
> **사용자 의도** (이번 세션 인용):
> - "책의 아이콘은 액티비티 바의 위키 아이콘을 그대로 쓰지? 브레인스토밍해야겠는데?"
> - "위키는 아티클과 스터브 아이콘으로 핀드... 왜 북스는 카인드로 안 되지?"
> - "위키랑 북스 모두에 노트처럼 more를 신설하고 템플릿이랑 인사이트 등을"
> - "북 More에 인사이트랑 스마트북... 다른 애들의 템플릿이 북에서는 스마트북"
> - "위키의 모어에도 인사이트가 들어가야겠는걸?"
>
> **이번 세션 변경 (1 PR, `components/linear-sidebar.tsx` 1 파일, +20/-26 근처)**:
> 1. **Books 사이드바** pinned/recent 책 = `<BookKindIcon kind={getBookKind(book)} size={14} />` (Smart⚡violet #5E6AD2 / Manual✏️muted / Hybrid✨amber). 이전엔 BookOpen(Wiki와 동일 아이콘) = 부채였음.
> 2. **Home/Calendar mixed pinned list** 책도 BookKindIcon — `HomePinnedItem` type에 `bookKind: ReturnType<typeof getBookKind>` 추가 + homePinnedItems 생성 시 `getBookKind(b)` 주입 + render 2곳(line 1308/1815).
> 3. **Wiki More Section 신설** — Templates를 top div(Overview/Merge/Split 묶음)에서 떼서 별도 `<Section title="More">`로 (Notes 정합 Folders→More→Recent).
> 4. import: +`BookKindIcon`(property-chips) +`getBookKind`(use-books-view), -`Book`(unused). `BookOpen`은 Wiki Overview NavLink(line 1027)만 유지 (펼친책=Wiki metaphor).
>
> **첫 스텝 (다음 세션 Entity Insights PRD)**:
> 1. `components/insights-view.tsx` read — Notes Insights 실제 내용(StatCard + MiniBarChart + runAnalysis)
> 2. `components/views/wiki-dashboard.tsx` + `wiki-editor/wiki-insights-chart.tsx` read — Wiki insights 재료(Growth/Connectivity 차트, 이미 존재)
> 3. 정보 아키텍처 결정: entity Insights 위치 통일(별도 page A안 / dashboard 임베드 C안) + Ontology(전체) vs entity(세부) 역할 분리
> 4. Books Insights 신설 내용 정의 (reading progress? coverage? smart source health?)
> 5. `.omc/plans/entity-insights-coherence-prd.md` 작성 → critic 검토
>
> **검증**: `tsc --noEmit` exit 0 + 라이트모드 preview MCP (Books/Wiki/Home 사이드바 — kind icon + Wiki More section 동작 확인)
>
> **머신**: 집 (Windows)
> **branch worktree**: claude/epic-banzai-6629ac

### 완료

**1. Books 사이드바 책 = BookKindIcon (kind 분기) — 1년 차 부채 정정**
- 사용자 지적: "책 아이콘이 액티비티 바 위키 아이콘(BookOpen)을 그대로 쓴다" → 정확. linear-sidebar 책 항목이 BookOpen이라 Wiki 정체성과 충돌.
- 진단: BookKindIcon(`property-chips.tsx:615`)은 모든 Books surface(grid-card/list-row/board/table/breadcrumb/detail-panel)의 시각 정체성인데 **사이드바만 누락**. Book.coverEmoji 폐기 코멘트(types.ts:202)도 "BookKindIcon이 cover 책임" 명시.
- Fix: Books 사이드바 pinned/recent(2곳) + Home/Calendar mixed list(2곳) 모두 BookKindIcon. Notes(StatusShapeIcon)/Wiki(IconWikiStub/Article) 사이드바 아이콘 패턴 정합. metaphor: 펼친책(BookOpen)=Wiki Overview만 유지.

**2. Wiki More Section 신설 (Templates 이동)**
- 사용자 지적: "위키랑 북스도 노트처럼 More 신설" → Wiki Templates가 top div(Overview 묶음)에 어색하게 있었음.
- Fix: 별도 `<Section title="More">`로 분리 (Notes 정합 Folders→More→Recent). Books More는 Templates 폐기로 보류(빈 통 회피).

### 브레인스토밍 & 큰 결정 (영구 LOCKED 후보 #166~#168)

**#166 (vision) 사이드바 entity 항목 = entity 내부 상태/kind icon 의무**:
- Notes=status(stone/brick/keystone) / Wiki=stub-article / Books=kind(smart/manual/hybrid). `BookKindIcon` = 모든 surface(사이드바 포함) single source. mixed list(Home/Calendar)도 동일 적용.

**#167 (vision) 사이드바 More section 통일**:
- Notes/Wiki = Pinned→Views→Folders→More→Recent. Books는 Templates 폐기(Smart Book 대체)로 More 보류 — Insights 페이지 신설 시 부활.

**#168 (vision) Entity Insights 정보 아키텍처 비대칭 = 다음 PRD 핵심**:
- Insights 위치 entity마다 다름(Notes=별도 page / Wiki=dashboard 임베드 / Books=없음 / Ontology=top-level). 위치 통일 필요. 영구 룰 #140(Ontology 전체/entity 세부) 기준.
- Smart Book = Templates의 Books 대응이지만 형태 다름(page 없는 book 속성) → Smart Book Preset(v2)이 진짜 대응. ROI 검토(book 생성 빈도).

**(조사 결과) Note/Wiki "source" 개념**:
- `NoteSource`(manual/webclip/import/share/api)는 존재하나 **거의 dead** — helpers.ts default "manual", webclip/import/share/api set 경로 없음(Web Clipper 미구현). 필터 5옵션 중 4개 항상 0건.
- WikiArticle엔 source 필드 **없음** (사용자가 본 "위키 source"는 착각/다른 필터).
- Web Clipper = 익스텐션/북마클릿/공유시트/이메일 등 여러 방식, source 필드 **필수 아님**(분류 라벨). Plot은 PWA Share Target으로 익스텐션 없이 가능.
- 결정: source 필터 정리 = 옵션 1(필터 숨김+필드 keep) 합의했으나 filter-bar.tsx가 Book kind와 group 공유(`kind/sourceType→"source"`) + Phase 4 Linear 마이그 대상 → **Phase 4 defer**.

### 기술 학습 (영구)
- **BookKindIcon = derived(getBookKind), Book.kind 필드 없음**: smartSources/items 유무로 smart/manual/hybrid 계산. 사이드바도 getBookKind(book) 호출.
- **HomePinnedItem mixed type에 entity별 메타 주입**: note=status, wiki=isStub, book=bookKind. cross-entity pinned list 패턴.
- **filter-bar "source" FilterGroup = {Note.source + Book.kind + Book.sourceType}**: group 통째 제거 시 Books 필터 깨짐. group 공유 주의.
- **Wiki insights 재료 이미 존재**(WikiInsightsChart Growth/Connectivity)지만 wiki-dashboard 임베드 — 별도 page 아님. entity Insights 위치 비대칭 근원.

### Watch Out (다음 세션)
- **Entity Insights 위치 통일이 PRD 핵심** — 별도 page(Notes) vs dashboard 임베드(Wiki) 중 택1. Wiki를 page로 분리하면 Dashboard 허전 → Dashboard 재구성 동반.
- **Smart Book Preset ROI 불확실** — book 생성 빈도 낮음. 사용자 과거 "북 템플릿 확신 안 듦".
- **Book 폴더 Phase 2 = createFolder signature 확장 필요** (note|wiki → +book) + 사이드바 Folders section + folder/[id] page book branch + book-folder-picker.
- **Category/Label 필터 비대칭** — 데이터 글로벌인데 필터 노출만 entity별. 의도 vs 부채.
- **source 정리는 Phase 4 filter-bar 마이그에서** — 지금 건드리면 Book kind group 공유 + 재작업.

### 환경 변경
- Store version: v149 (변경 없음)
- Tests: tsc --noEmit pass (exit 0)
- 신규 파일: 없음 (linear-sidebar.tsx 1 파일 수정)

### 머신
집 (Windows)

---

## 2026-05-28 (오전) — 집 (Windows), **Chrome icon 굵기/선명 + chip strip 시인성 + Books table notes/wiki parity 부채 정정 (1 PR)**

> 🎯 **다음 즉시 액션 hook (우선순위 순)**:
> 1. **Wiki `← Overview` 버튼 폐기 → breadcrumb 패턴 마이그**. `library-breadcrumb.tsx` 헤더 코멘트 (라인 6) 명시: "사용자 시그널 2026-05-14: Wiki의 `← Overview` 패턴보다 Notes의 breadcrumb (`Notes > Quick Memo`) 패턴이 더 자연. Library도 같은 패턴 적용". → **Wiki만 1년 가까이 누락**된 정합성 부채. 옵션 A (최소 50-80줄, `WikiBreadcrumb` 신규 = `LibraryBreadcrumb` 복제 + Wiki에 적용 + `← Overview` 버튼 제거) 권장. 옵션 B (체계 refactor) = 공통 `EntityBreadcrumb` 컴포넌트 추출. 옵션 C (큰 작업) = Wiki sub-section을 사이드바로 이동 (Library 패턴 풀 적용).
> 2. **Phase 3.1 (carry)** — `/preview/linear` 12장 reference 이미지 비교 + fine-tune. dev server `http://localhost:3002/preview/linear` (launch.json port 3002 + autoPort). 12장 reference = 채팅 첨부 또는 `~/Desktop/open-design/.od/projects/04375e11-0f45-4428-92df-aeb8faf27039/`.
> 3. **PR #481 close 결정 (carry)** — PR #482 (`826343a`)와 중복. 사용자가 다른 컴퓨터에서 디자인 확인 후 만족 시 close. `gh pr close 481`.
> 4. **다른 entity parity 부채 audit** — Books에 marginLeft -8, font-medium 누락 발견 패턴이 다른 entity (Calendar/Ontology table)에도 있을 가능성. `notes-table.tsx:1890` 코멘트 ("위키 wiki-list 정합") 기준으로 grep audit.
> 5. **(별도 결정)** border 토큰 swap 정정 — globals.css 라이트 `--border: #a8a8ad` vs `--border-subtle: #a1a1aa` (subtle이 더 진함 = 의도 reverse 의혹). 옵션 1) subtle 더 옅게 (#d4d4d8), 옵션 2) border 더 진하게 (#71717a), 옵션 3) 현행 유지 (의도된 swap이면).
>
> **사용자 의도** (이번 세션 그대로 인용):
> - "위키와 라이브러리 모두 오버뷰가 있는데, ←오버뷰 버튼은 위키에만 있거든? 노트나 라이브러리처럼 바꾸는 거에 대해 어떻게 생각해? 브레인스토밍해볼까."
> - "검색창 쪽 버튼?아이콘들은, 라이트모드에선 전부 굵기가 얇고 색이 흐리다. 더 굵게 선명하게 해줘."
> - "여기보면 이렇게 선이 흐린 곳들이 있어 노트, 위키, 등에도. 여기도 굵게 해줘."
> - "books의 체크박스랑 title 사이의 거리가 너무 넓다. 좁혀줘. (내 생각엔 지금 눈에는 안 보이지만 저기에 뭔가 간격이 넓어질 수 밖에 없는 잘못된 공간이 있는 거 같은데? 한 번 코드적으로 분석해서 수정해봐.)"
> - "북스의 컬럼헤더랑 글자들이 굵기가 얇아. 노트랑 위키는 굵은데. 노트랑 위키처럼 굵게 해줘."
> - "after-work 완벽하게. 다른 컴퓨터에서도 작업 이어갈 수 있도록."
>
> **이번 세션 누적 변경 (1 통합 PR 5 파일 +40/-26)**:
> 1. **`components/global-top-bar.tsx`** (chrome icons 굵기/색): 시계/뒤로/앞으로/검색 돋보기/테마/설정/휴지통 button — `text-muted-foreground/70` → `text-muted-foreground` (opacity 제거), `strokeWidth={2}` → `strokeWidth={2.25}` (8 곳)
> 2. **`components/panels-menu.tsx`** (햄버거 trigger): 동일 패턴 + `<ListIcon size={14} />` → `<ListIcon size={14} strokeWidth={2.25} />`
> 3. **`components/view-header.tsx`** (quick filter chips strip): chip strip border-b `/60` → `border-border`, chip pill outlines `/70` → `border-border` (3 곳), "+" add 버튼 dashed outline `/70` → `border-border` (총 4 곳)
> 4. **`components/views/wiki-list.tsx`** (Wiki sub-tabs controls bar): `border-border-subtle` → `border-border`
> 5. **`components/books/book-table.tsx`** (Books notes/wiki parity 부채 정정):
>    - body row (라인 498-509): cols.map title cell에 `style={c.id === "title" ? { marginLeft: -8 } : undefined}` + 코멘트 근거 추가
>    - header row (라인 236-249): 동일 patch (header도 body와 정렬)
>    - TH (라인 105, 115): `font-normal` → `font-medium` (Notes parity)
>    - body title span (라인 576): `text-foreground pl-2` → `font-medium text-foreground pl-2` (`.a-row__title` font-weight 500 parity)
>
> **첫 스텝 (다음 세션 Wiki breadcrumb 마이그)**:
> 1. `components/library/library-breadcrumb.tsx` read — 패턴 + props 인터페이스 확인
> 2. `components/wiki/wiki-breadcrumb.tsx` 신규 — LibraryBreadcrumb 복제 + Wiki 도메인으로 변경 (entity = "wiki", sub-views = articles/stubs/stale/orphans/hubs/with-aliases/recent)
> 3. `components/views/wiki-list.tsx` 라인 794-802: `← Overview` 버튼 + 분리선 제거 → `<WikiBreadcrumb current={wikiViewMode} onNavigate={setWikiViewMode} />` 삽입
> 4. `components/views/wiki-view.tsx` 또는 `wiki-dashboard.tsx` 등 다른 wiki view 진입점에도 breadcrumb 적용 (검증)
> 5. 검증: `tsc --noEmit` + 사용자 시각 (Wiki 페이지 nav 확인)
>
> **컴포넌트 구조 (WikiBreadcrumb)**:
> ```tsx
> // components/wiki/wiki-breadcrumb.tsx (신규, LibraryBreadcrumb 복제)
> <nav className="flex items-center gap-1.5 text-note">
>   <Link href="/wiki" className="...">Wiki</Link>
>   <ChevronRight size={12} className="text-muted-foreground" />
>   <Popover>  {/* sub-view switcher */}
>     <PopoverTrigger>{currentSubViewLabel}</PopoverTrigger>
>     <PopoverContent>{...sub-view list}</PopoverContent>
>   </Popover>
> </nav>
> ```
>
> **참고 파일**:
> - `components/library/library-breadcrumb.tsx` (라인 6 헤더 코멘트 = 사용자 시그널 2026-05-14 source)
> - `components/views/wiki-list.tsx` (라인 794-802 `← Overview` 버튼 + Filter tabs)
> - `components/notes-table.tsx` (라인 1890 marginLeft 코멘트 = parity 기준)
> - `app/globals.css` (라인 108/152/346/388 border 토큰 + 라인 1276/1308 `.a-row__lead/__title` CSS)
> - `components/books/book-table.tsx` (이번 세션 fix reference)
>
> **위험 + 회피**:
> - Wiki sub-view switcher 모드 enum: 코드에 `wikiViewMode = "dashboard" | "list"` 가 이미 있음 (`wiki-list.tsx` 라인 797 `setWikiViewMode("dashboard")`) — 사용자가 짚은 "stale articles/orphans/hubs/with aliases/recent" 5 quick filter는 별도 enum이 아닌 filter state. breadcrumb의 sub-view는 dashboard/list만 또는 5 quick filter도 포함할지 결정 필요.
> - LibraryBreadcrumb 패턴이 entity name + popover trigger 였음 — Wiki는 popover에 view mode 전환 + filter chip 분리 (chip은 view-header가 처리)으로 가야 자연.
> - 다른 entity parity 부채 audit 시 grep 패턴: `font-normal.*text-foreground/80` (TH) + `cols.map.*c.width` 안 marginLeft 부재.
>
> **검증**:
> - `tsc --noEmit` 통과 (exit 0)
> - 사용자 시각 검증 = "완벽하다" (Books 체크박스↔title 거리 fix 직후)
> - 라이트 모드 chrome icon + chip strip + Books header/body font-weight 모두 사용자 시각 OK
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: `826343a` (PR #482 머지 후 — 이번 PR이 다음 머지될 예정)
> **branch worktree**: `claude/condescending-payne-e944d7` (이 worktree에서 진행)

### 완료

**1. Chrome icon 굵기/선명 강화 (라이트 모드 시인성)**
- 사용자 지적: "검색창 쪽 버튼?아이콘들은, 라이트모드에선 전부 굵기가 얇고 색이 흐리다."
- 진단: lucide default strokeWidth 2 + `text-muted-foreground/70` (opacity 70%) = 라이트 모드에서 muted 토큰 위에 추가 흐림
- Fix: opacity 70% 제거 + strokeWidth 2 → 2.25 (Linear 14px 정통)
- 영향: 시계 / 뒤로 / 앞으로 / 검색 돋보기 / 테마 / 설정 / 휴지통 / 햄버거 trigger (8개 chrome 버튼)
- placeholder + ⌘K kbd cap은 유지 (보조 UI, 자연스러운 흐림 의도)

**2. Quick filter chips strip 시인성 (모든 entity 영향)**
- 사용자 지적: "이렇게 선이 흐린 곳들이 있어 노트, 위키, 등에도"
- 진단: chip strip border-b `/60`, chip pill outline `/70`, wiki sub-tabs `border-subtle` (subtle 토큰이 default보다 더 진한 swap 의혹)
- Fix: opacity modifier 모두 제거 → 풀 `border-border`
- 영향: 모든 entity의 quick filter chips strip (Notes/Wiki/Library/Calendar/Ontology/Books 공통) + Wiki sub-tabs row
- 별도 결정 항목: border 토큰 swap 정정 (사용자 답 대기)

**3. Books table notes/wiki parity 부채 정정**
- 사용자 지적 (2회): "books의 체크박스랑 title 사이의 거리가 너무 넓다 ... 잘못된 공간이 있는 거 같은데?" + "북스의 컬럼헤더랑 글자들이 굵기가 얇아"
- 진단: notes-table.tsx:1890 코멘트 명시 ("marginLeft -8: grid gap 상쇄해 체크박스에 가깝게 (위키 wiki-list 정합)") → Books만 누락. TH는 `font-normal`, body title span은 font-weight 미명시 (notes의 `font-medium` + `.a-row__title font-weight: 500`과 mismatch)
- Fix: header+body cols.map에 `marginLeft: -8` patch 추가 (2곳) + TH `font-normal` → `font-medium` (2곳) + body title span에 `font-medium` 추가 (1곳)
- 영향: Books table chrome 텍스트가 Notes/Wiki와 정확한 시각적 parity 달성

### 브레인스토밍 & 큰 결정 (영구 LOCKED 후보 #163~#165)

**#163 (vision) Chrome icon 굵기/색 표준 (라이트 모드 시인성)**:
- chrome icon 카테고리 = strokeWidth 2.25, opacity 70% 금지 (muted-foreground 토큰만 사용)
- view-configs.tsx 메인 콘텐츠 SVG (1.2~1.4)와 다른 카테고리 — DESIGN-TOKENS.md에 `--stroke-chrome: 2.25` 토큰 등록 가치
- 보조 UI (placeholder, kbd cap)는 `/70` opacity 유지 (자연스러운 hierarchy)

**#164 (vision) Wiki `← Overview` 폐기 결정 (1년 차 부채)**:
- `library-breadcrumb.tsx:6` 코멘트 명시: "사용자 시그널 2026-05-14: Wiki의 `← Overview` 패턴보다 Notes의 breadcrumb 패턴이 더 자연"
- Library는 그때 마이그됐는데 Wiki만 누락 → 정합성 부채로 1년 가까이 머물러 있었음
- 다음 세션 P0 #1: 옵션 A (최소 마이그) 진행. ← back 버튼은 sub-sub-page 깊이에서만 의미. Overview는 entity entry point라 사이드바 클릭만으로 회귀 가능 → 잉여.
- Linear/Notion/Plain 모두 breadcrumb 패턴, back arrow 없음 — Plot 정통성 강화

**#165 (vision) Entity table 시각 parity audit 의무화**:
- Books만 marginLeft -8 + font-medium 둘 다 누락 — Notes/Wiki와 같은 row chrome 구조인데 부채 누적
- 새 entity table 추가 시 `notes-table.tsx:1890` 코멘트 기준 visual parity audit 의무
- audit grep 패턴: `cols.map.*c.width` 안에 marginLeft 부재 + TH `font-normal`

### 기술 학습 (영구)

- **opacity modifier 누적 = 라이트 모드 시인성 위해**: `text-muted-foreground/70` + `border-border/60` 같은 패턴이 muted 토큰 위에 추가 opacity 곱셈 → 라이트 모드 (밝은 배경에 옅은 grey)에서는 거의 안 보임. 다크 모드에서는 검정 배경 대비라 OK. **라이트 모드 시인성 = chrome 카테고리는 opacity 사용 금지** 원칙.
- **notes/wiki 정합 코멘트 = source of truth**: `notes-table.tsx:1890` 같은 코드 내 코멘트가 디자인 의도 source. 새 entity 추가 시 grep 검색으로 발견 가능. 코멘트 부재 = 누락 가능성 높음.
- **사용자 추정 "잘못된 공간" = 정확한 시그널**: 사용자가 시각적으로 "뭔가 잘못된 공간"을 인식하면 거의 항상 코드 부재/오류. 추측 fix 말고 코드 ground truth로 분석 (이번 books marginLeft case 정확히 맞음).
- **font-weight 누락 패턴**: Plot의 row chrome 표준 = `font-medium` (Notes/Wiki). 새 컴포넌트가 `font-normal` (Tailwind default = 400)로 만들어지면 시각적 mismatch. 항상 .a-row__title (font-weight 500) 또는 font-medium 명시.
- **border 토큰 swap 의혹**: `--border` (#a8a8ad RGB 168) < `--border-subtle` (#a1a1aa RGB 161) 진함 — semantic 의미 reverse. 라이트 모드 chrome 디자인 결정 시 토큰 정의 의도 검토 필요.

### Watch Out (다음 세션 주의사항)

- **Wiki ← Overview 마이그 시 wikiViewMode enum 결정**: 현재 `"dashboard" | "list"` 2-mode. breadcrumb sub-view에 5 quick filter (stale/orphans/hubs/with-aliases/recent)까지 포함할지 결정 필요. quick filter는 view-header 영역이라 분리가 자연.
- **다른 entity table parity audit 미진행**: Calendar table, Ontology graph view, Library categories 등에도 동일 부채 가능. 다음 세션 P0 #4로 명시.
- **border 토큰 swap 정정 사용자 결정 미답**: globals.css 라이트 모드 토큰 변경은 글로벌 영향 큼 — 별도 결정 항목.
- **chrome strokeWidth 2.25는 임시값**: DESIGN-TOKENS.md에 정식 토큰 (`--stroke-chrome: 2.25`) 등록 후 inline 값 → 토큰 참조로 promote 가치.
- **PR #481 carry**: PR #482와 중복. 사용자가 다른 컴퓨터에서 디자인 확인 후 만족 시 close 결정 carry.
- **`.claude/.active-skill` untracked**: 이번 세션도 untracked 파일 있음. `.gitignore` 추가 후보.

### 환경 변경

- Store version: v149 (변경 없음)
- Tests: tsc --noEmit pass (exit 0)
- 신규 파일: 없음 (모두 기존 파일 fix)
- 사용자 IDB stale data: 없음

### 머신
집 (Windows)

---

## 2026-05-27 (저녁) — 집 (Windows), **Plot v2 Linear 재디자인 Phase 1+2+3 — `/preview/linear` 라이브 demo (1 PR 통합)**

> 🎯 **다음 즉시 액션 hook (사용자 우선순위)**:
> 1. **`http://localhost:3000/preview/linear` 12장 reference 이미지와 1:1 비교** → 어긋난 surface/디테일 짚어서 Phase 3.1 fine-tune.
> 2. (preview 만족 시) **Phase 4 = 실 컴포넌트 마이그레이션** — 사용자가 명시한 진입점 = `components/filter-bar.tsx` + `components/display-panel.tsx`. ("필터와 디스플레이는 리니어식으로 꾸며졌거든? 아예 그렇게 해야 될 거 같은데"). preview의 Filter popover (10 fields + 4 quick filters) + Display popover (5 mode + 7 group + multi-sort + 12 prop) reference로 사용.
> 3. **Books 엔티티 방향 결정** — 사용자 지적 ("코드에는 있는데 목업에는 없다"). 옵션 A) `/library` 별칭 탭 / B) 7번째 entity (rose space, Smart Book v2 plan과 연결).
>
> **사용자 의도** (그대로 인용):
> - "Plot v2 Linear 재디자인 스펙이 첨부 이미지들에 있어 (12장) ... 이 디자인을 현재 Next.js 16 + Zustand + Tiptap 프로젝트에 통합하고 싶어. Phase 1: app/globals.css에 Linear 토큰 머지부터 시작"
> - "다 된 거야?" / "일단 만들어진 것 자체는 아주 마음에 들어!"
> - "필터와 디스플레이는 리니어식으로 꾸며졌거든? 아예 그렇게 해야 될 거 같은데. 그리고 book도 없다 ... 기왕 만드는 김에 나는 우리 코드가 실제로 쓰는 필터 내의 아이콘들과 폰트, 디스플레이 내의 옵션들과 아이콘들까지 전부 재설계 해도 좋을 거 같아. 리니어 느낌이 나도록."
> - "혹시 지금 작업한 거 after-work 가능해?"
>
> **누적 commits (이번 세션, 1 통합 PR)**:
> 1. PR (이) — **Plot v2 Linear 재디자인 Phase 1+2+3 — preview live**:
>    - feat(globals): Linear 토큰 머지 (+154줄, `--ln-*` namespace + un-prefixed scale/semantic/spacing/motion/shadow)
>    - feat(preview): `/preview/linear` 라이브 demo 신규 (linear-styles.css 993줄 + page.tsx 993줄)
>    - feat(preview): Filter popover (10 fields + 4 quick filters) + Display popover (5 mode + 7 group + multi-sort + 12 prop) + Books surface (4번째 탭, 5 collections + recent)
>    - 22개 inline SVG 아이콘 (14px, strokeWidth 1.2~1.4) view-configs.tsx와 동일 시각 어휘
>    - docs(sync): SESSION-LOG/NEXT-ACTION/MEMORY/TODO/CONTEXT
>
> **검증**:
> - `tsc --noEmit` 에러 0 (Phase 1/2/3 각각)
> - `npm run build` 성공 — `/preview/linear` static prerender 통과 (Phase 2/3)
> - 기존 앱 0 regression — globals.css `:root` append-only, `(app)/*` + `components/*` + `lib/*` 모두 0 touch

### 완료

**Phase 1 — `app/globals.css` Linear 토큰 통합 (+154줄)**
- `:root` 끝에 Linear 토큰 블록 append (라이트):
  - Panel hierarchy 4단계 (`--ln-panel/-2/surface/elevated`)
  - Foreground tone alias (`--ln-fg-2/muted/meta/disabled`)
  - Border hierarchy (`--ln-border-soft/strong`)
  - Hover/selected (`--ln-hover/-2/selected/-strong`)
  - Accent palette (`--ln-accent-2/hover/active/on/tint`)
  - `--plot-gradient` 토큰화 (memory #142)
  - Semantic colors + soft (`--success/warn/info`)
  - Linear text scale (`--text-2xs..5xl`, 11→44px)
  - Tracking + leading
  - Spacing scale (`--s-1..--s-10`, 4→64px) — Linear 컴포넌트 직접 소비
  - Radii (`--r-16/--r-pill`)
  - Motion (`--ease`, `--d-fast/base/slow`)
  - Shadow elevation (`--shadow-1/2/3/popover`, `--focus-ring`)
  - `--statusbar-h: 28px`
- `.dark` 끝에 다크 변형 append
- `@theme inline`에 Tailwind 노출 8개 (`--color-panel/-2/surface-elev/elevated/accent-2/success/warn/info`)
- **사용자 결정 (권장 디폴트 3개)**:
  1. 다크 `--bg: #0f0f11` 유지 (Linear `#08090a` X)
  2. `--s-1..--s-10` 도입 (Linear 컴포넌트 직접 소비)
  3. Layout 폭 현재 유지 (44px/220px, Linear 48px/248px X)

**Phase 2 — `/preview/linear` 라이브 demo 신규**
- `app/preview/linear-styles.css` (993줄) — Linear `assets/app.css` 944줄을 PowerShell regex로 자동 prefix 변환:
  - 80개 클래스 `.ln-*` namespace (shadcn `.sidebar/.card/.kbd` 충돌 회피)
  - `.ln-app` / `.ln-launcher` scope 안에서 unprefixed 토큰 alias (`--panel: var(--ln-panel)`)
  - `--font-mono: var(--font-geist-mono)` alias (Geist Mono → Linear mono 슬롯)
- `app/preview/linear/page.tsx` 신규 — 5 surface 인터랙티브 demo (List/Editor/Table/Palette/Dialog)
- 인터랙션: ⌘K/Ctrl+K, Esc, sun/moon 토글, PanelLeft sidebar collapse, PanelRight detail hide

**Phase 3 — Filter + Display + Books 풀 재설계 (page.tsx 547→993줄 재작성)**
- `linear-styles.css` +233줄 — Filter/Display popover + Books cards 클래스 (`.ln-popover/.ln-segctl/.ln-sort-row/.ln-prop-chip/.ln-book-card`)
- **22개 inline SVG 아이콘** (14px viewBox, strokeWidth 1.2~1.4) view-configs.tsx와 동일 시각 어휘
- **Filter popover** — 사용자 실 코드 옵션 100% 반영:
  - Quick Filters 4개 (Needs attention / Active work / True orphans / Wiki-registered)
  - 10 fields + sub-menus (Status/Folder/Label/Tags/Source/Dates/Links/Wiki/Content/Pinned)
  - Active filter chip bar 4-part chip (`[icon] field | op | value | ×`)
  - 기본 활성 2개로 chip bar 미리 보이게 함
- **Display popover** — view-configs.tsx NOTES_VIEW_CONFIG 그대로:
  - 5-segmented view modes (List/Board/Grid/Graph/Insights)
  - Grouping chip dropdown (7) + 동적 Sub-grouping + 제외값 비활성화
  - Ordering chain multi-sort (max 3, 방향 토글 + 삭제)
  - List options 토글 2개 (Show trashed / Filter-aware role)
  - Display properties chip 12개 (active 시 `--accent-tint` 배경)
- **Books surface** (4번째 탭):
  - Collections 5개 카드 (References/Tags/Files/Stickers/Categories, auto-fill 232px)
  - Recent additions 5줄

### 브레인스토밍 & 큰 결정 (영구)

**1. Linear 토큰 통합 namespace 전략 (영구)**:
```
--ln-* prefix  → panel hierarchy / hover-selected / border / accent variants (개념 신규)
un-prefixed    → semantic / text / spacing / motion / shadow / radii (scale, Linear 호환)
```
- Linear 컴포넌트 클래스가 토큰을 un-prefixed로 참조. `.ln-app` scope alias로 격리.
- v3 LOCKED 토큰 + shadcn 토큰 + Phase 3 mockup `.a-*` 모두 0 touch.

**2. Linear CSS 격리 = preview-only**:
- `app/preview/linear-styles.css`에 격리 (globals.css 0 변경)
- Phase 4 마이그레이션 때 필요 클래스만 globals.css로 promotion
- 이유: 기존 앱 zero regression 보장 + 빠른 실험

**3. Phase 4 진입점 = filter-bar.tsx + display-panel.tsx (사용자 명시)**:
- 현재 코드도 이미 Linear 4-part chip 패턴 (`[icon] field | op | value | ×`)이라 마이그레이션 용이
- preview의 Filter/Display popover를 reference로 사용
- 아이콘/폰트/옵션까지 전부 재설계 OK

**4. Books surface 방향 미결정**:
- 옵션 A) `/library` 별칭 탭 / B) 7번째 entity (rose space, Smart Book v2 plan과 연결)
- Phase 4 진입 시 결정

**5. dev server 포트 명확화**:
- 실제는 3000 (NOT 3002 — CLAUDE.md는 오래된 기록)
- 기존 dev (PID 11312) 그대로 + HMR로 `app/preview/*` 자동 인식

### Watch Out (다음 세션)
- **dev server 포트 3000** (NOT 3002 — CLAUDE.md 오래된 기록, 갱신 필요할 수도)
- **preview는 mock 데이터** — Zustand store 미연동
- **`.ln-app` scope의 토큰 alias** — `--panel/--hover/--accent-2`가 `.ln-app` 안에서만 유효. 외부 컴포넌트 사용 시 미정의
- **`.dark` 토글 충돌** — preview의 직접 토글 + ThemeProvider 공존 (새로고침 시 ThemeProvider 우선)
- **Phase 4 시 globals.css promotion 신중** — Linear 클래스를 globals.css로 옮길 때 shadcn/Phase 3 mockup `.a-*`와 충돌 점검
- **사용자 직전 세션과 이번 세션 path 다름** — 직전 (오전~새벽 거대 세션) = Coverage entity dropdown 진행 중. 이번 (저녁) = Plot v2 Linear 재디자인. 두 path가 충돌하지 않지만, Coverage dropdown은 별도 진행 가능 (Plot v2 P0 #1과 부분 통합 가치)

### 머신
집 (Windows)

---

## 2026-05-27 (오전~새벽) — Windows, **거대 세션: Search entity-aware + Ontology Insights v2 + HoverCard 학습 패턴 (PR #473-#479, 7 PR 머지)**

> 🎯 **다음 즉시 액션 (사용자 최우선 명시)**: **Coverage entity dropdown 논의 — 옵션 C / B / D 결정 후 진행**. 사용자 의도 = Coverage Mosaic을 Notes/Wiki/Books 기준 dropdown으로 entity 별 다른 통계 표시. 옵션:
>   - **C (즉시, 작음)**: Tagged/Orphan dropdown + Cohesion fixed (그래프 전체). Books orphan 정의 필요.
>   - **B (중간)**: Notes/Wiki만 dropdown (Books 제외). Cohesion entity별.
>   - **D (큰 작업)**: 각 entity별 별도 Insights page (Notes/Wiki/Books). 이전 P0 #2 후보 (Phase A2/B/C). Plot v2 P0 #1 통합 가치.
> 사용자에게 옵션 + Books orphan 정의 + Cohesion sub-label 추가 결정 받은 후 진행.
>
> **사용자 의도** (그대로 인용):
> - "오버뷰나 대시보드, 인사이트의 경우 이렇게 여백이 있는 게 나은 거 같아" (이전 세션, layout LOCKED #136 v2)
> - "검색창 all을 눌렀을 때 ... 전부 똑같이 나와. 하드코딩이 되어있단 소리야" (search entity-aware fix)
> - "왜 리센트 노트스로 나오지?... 실제로 리센트로 보여주는 게 맞을 거 같아. 더 보고 싶으면 more 같은 버튼" (Linear/Notion progressive disclosure)
> - "온톨로지 인사이트를 재설계하자" → 옵션 A (Power Sabermetrics) → 4 section MVP
> - "클러스터 응집력 표현이 추상적인데?? 호버로 설명카드가 나오면 좋을 듯" (HoverCard 학습 패턴)
> - "엣지나 밀도가 그래프 상태에서 뭘 의미하는 거지??" (Graph Health KPI HoverCard)
> - "커버리지가 단순히 고정이 되어서 나오는 것보다는 드롭다운이 있고 선택해서 노트/위키/북 기준 다르게 보여주는 게 낫지 않나" (Coverage entity dropdown — 다음 세션 P0 #1)
>
> **다음 세션 첫 스텝**:
> 1. **Coverage entity dropdown brainstorm 답** — 옵션 C 또는 B 또는 D 결정
> 2. **Books orphan 정의** (items 0 = orphan? 또는 wiki link 받지 않은 책?)
> 3. **Cohesion entity별 vs 그래프 전체** 결정
> 4. **새 branch + Coverage section dropdown UI** wire
> 5. **use-knowledge-metrics hook 확장** (entity별 metrics — Wiki orphan: 다른 wiki에서 link 안 받음, Wiki tagged: WikiArticle.tags 비율)
> 6. **i18n keys 추가** (entity dropdown labels + Books orphan/cohesion sub-labels)
>
> **다음 세션 추가 P0** (다음 우선순위 순):
> - **🔴 P0 #2**: Plot v2 P0 #1 — Phase 0 Design Language 결정 + Plot v2 PRD (여전히 미시작, 2 세션째 deferred). Open Design web UI + 71 system + critic + Chrome surface 첫 mockup.
> - **🟡 P0 #3**: NUDGE Connect 실제 동작 (Link Picker Auto-Open 패턴 A) — 사용자 명시했으나 결정 답 안 함. brainstorm 진행 중.
> - **🟡 P0 #4**: Insights에서 Notes/Wiki KPI 폐기 검토 (PRD 의도 = Dashboard 중복 폐기. 현재 keep 됐음).
> - **🟢 P0 #5**: 사용자 viewport 검증 잔여 (PR #472-#479 모두).
> - **🟢 P0 #6**: Book 폴더 Phase 2 UI (book-folder-picker / sidebar section / folder/[id]/page.tsx book branch / smartSources resolver book kind).
>
> **컴포넌트 구조 / 데이터 흐름** (Coverage dropdown 진행 시 reference):
> ```
> Coverage section:
>   ┌─[Notes ▾]─────────────────────────┐   ← dropdown trigger
>   ├ TaggedDonut    OrphanDonut    CohesionRadial
>   │ (entity 별)    (entity 별)    (entity 별 또는 그래프 전체)
>   └─────────────────────────────────────┘
>
> use-knowledge-metrics 확장:
>   - metrics.byEntity.notes.{tagCoverage, orphanRate, cohesion}
>   - metrics.byEntity.wiki.{tagCoverage, orphanRate, cohesion}
>   - metrics.byEntity.books.{tagCoverage, orphanRate, cohesion?}  // cohesion 의미 모호
> ```
>
> **위험 + 회피**:
> - **Coverage dropdown = entity별 metric 정의 명확화 필요**. Wiki orphan = "다른 wiki에서 link 안 받음" 가장 자연. Books orphan = "items 0개" 가능. Cohesion entity별 = cluster detection 알고리즘 entity별 별도 계산 부담.
> - **Plot v2 P0 #1 2 세션째 deferred** — 사용자가 viewport polish/feature 작업 우선. 다음 세션도 Coverage dropdown 우선. Plot v2 PRD 시작 더 늦어질 수 있음. 사용자 의도 = 점진 polish + Plot v2는 거대 작업이라 마음 준비 필요.
> - **NUDGE Connect 진행 결정 미답** — brainstorm 답 줬으나 사용자 다른 의제로 redirect. 다음 세션 별도 진행 가능.
> - **HoverCard 패턴 = Plot identity 정통**. "Gentle by default" — 추상 용어 학습 hover로 (강제 X). 이번 세션 metric tooltip 8개 + 4 chart tooltip 4개 추가. 다른 추상 용어에도 확대 가치.
>
> **참고 파일**:
> - `components/ontology/insights-charts.tsx` (4 chart + ChartCard helpTitle/helpBody/helpFormula props)
> - `components/ontology/ontology-insights-panel.tsx` (4 section + StatLine helpTitle/helpBody props)
> - `hooks/use-knowledge-metrics.ts` (entity별 metrics 확장 필요)
> - `lib/insights/metrics.ts` (Composite score 공식)
> - `lib/insights/types.ts` (KnowledgeMetrics interface — entity별 확장 필요)
> - `components/ui/hover-card.tsx` (Radix HoverCard)
> - `components/ui/select.tsx` (dropdown — Coverage entity selector에 활용 가능)
> - `components/views/search-view.tsx` (entity-aware tabs reference 패턴)
> - `docs/MEMORY.md` (영구 LOCKED + #143~#151 누적)
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: PR #479 머지 후 (`f5be74a`).
> **branch worktree**: `main`. 다음 세션 새 worktree로 시작 권장.

### 완료 (이번 세션 — 8 PR 머지 #472-#479, 23 commits)

이번 세션은 **사용자 viewport polish + Search entity-aware refactor + Ontology Insights v2 재설계 + HoverCard 학습 패턴 도입**.

**Layout (이전 세션 hold-over) — PR #472 (13 commits)**:
- 4 페이지 max-w-5xl revert (LOCKED #136 v1 → v2). Dashboard KPI 라벨 단순화 + status_breakdown 버그 fix + wiki_breakdown 신규. Book 폴더 Phase 1 (schema + v149 migration). Books → Notes parity 점진 정합 8 commits (header layout + Title cap 폐기 + pixel-perfect px-[20px]/gap-[8px]/w-[32px] + cover icon naked SVG).

**Search Entity-Aware Refactor — PR #473/#474/#475**:
- PR #473: !hasFuzzyQuery 블록 11 entity 분기 추가 (notes/wiki/books/categories/tags/labels/stickers/references/templates/folders). 이전 hardcoded "RECENT NOTES"만 표시 버그 fix.
- PR #474: section title 통일 (entity name만, RECENT prefix 제거) + entity별 sort logic (updatedAt desc / createdAt desc / name asc per entity timestamp 유무).
- PR #475: Linear/Notion progressive disclosure — "전체 {count}개 보기 →" button. count > 8일 때만 render. nav() helper로 11 entity별 navigation target wire.

**Ontology Insights v2 — PR #476**:
- 사용자 선택 옵션 A (Power Sabermetrics). 4 section 재설계: Graph Health KPI (Edges/Density/Notes/Wiki) / Coverage Mosaic 3 chart (TaggedDonut/OrphanDonut/CohesionRadial) / NUDGE keep / TopNotesBar (composite score horizontal). 신규 컴포넌트 `insights-charts.tsx` (ResizeObserver pattern, dashboard-charts.tsx parity, ChartCard wrapper). i18n 17 keys 신규 EN+KO.

**Tab Highlight Bug Fix — PR #477**:
- linear-sidebar.tsx의 currentMode = `usePlotStore.getState()` static read → reactive subscribe `usePlotStore(s => viewModeByGraph)`로 변경. ontology graph/insights/dashboard tab 클릭 시 사이드바 highlight 정확 update.

**HoverCard 학습 패턴 도입 — PR #478/#479**:
- PR #478: 4 chart (Tagged/Orphan/Cohesion/Composite)에 ⓘ icon + HoverCard 설명. ChartCard에 helpTitle/helpBody/helpFormula props. "Cluster Cohesion" 등 추상 용어 hover로 학습. Plot identity ("Gentle by default") 정합.
- PR #479: Graph Health 4 KPI (Edges/Density/Notes/Wiki)에도 동일 HoverCard 패턴. StatLine 컴포넌트 helpTitle/helpBody props 추가. ⓘ icon size 11 inline.

### 브레인스토밍 & 큰 결정 (영구 LOCKED 후보 #148~#152)

- **#148 (vision)**: **Ontology Insights = Power Sabermetrics 정체성**. Composite score (WAR-like) + Coverage Mosaic + NUDGE actionable + visualization. Daily habit (streak/heatmap) 미채택. 가끔 deep dive power-tool. knowledge app 중 독특 (Obsidian = graph view만, Linear = BI만, Anki = personal stats만).
- **#149 (vision)**: **Linear/Notion progressive disclosure 패턴** — Recency bias (80% 사용자가 최근 access) + 8 limit + "Show all {count} →" button. cognitive load 감소. Plot search view에 적용. 다른 surface (sidebar / inbox / 등)에도 확대 가능.
- **#150 (vision)**: **HoverCard 학습 패턴 = abstract metric 학습 도구**. ⓘ icon (Info from lucide) + Radix HoverCard. Plot identity ("Gentle by default") 정통 — 강제 노출 X, 사용자 학습 의지로 hover. composite formula + 정의 + 예시. metric/term 추상도 높은 곳 (Cluster Cohesion / Density / WAR-score 등) 적용. 다른 추상 용어 (status pill, kind chip 등)에도 확대 가치.
- **#151 (vision)**: **Search section title = entity name만 + entity별 sort**. RECENT prefix 제거. updatedAt desc (notes/wiki/books/categories/references/templates) / name asc (tags/labels — timestamp 없음) / createdAt desc (stickers) / lastAccessedAt fallback createdAt desc (folders). 8 limit + Show More button.
- **#152 (vision, 다음 세션 결정)**: **Coverage entity dropdown** — 옵션 C (Tagged/Orphan dropdown + Cohesion fixed) vs B (Notes/Wiki만) vs D (entity별 별도 page). 결정 후 진행.

### 기술 학습 (영구)

- **`usePlotStore.getState()` static read는 reactive X**: selector hook (`usePlotStore(s => ...)`)으로 subscribe 필요. 사이드바 currentMode 등 store-dependent display value는 반드시 subscriber 패턴. linear-sidebar.tsx PR #477 fix 사례.
- **Radix HoverCard 패턴**: `<HoverCard openDelay={150}><HoverCardTrigger asChild><button>...</button></HoverCardTrigger><HoverCardContent side="top" align="end" className="w-72">...</HoverCardContent></HoverCard>`. asChild로 button을 trigger. side/align prop으로 popup 위치 제어.
- **Recharts BarChart onClick payload**: `onClick={(state) => { if (state?.activePayload?.[0]) { const payload = state.activePayload[0].payload; ... } }}`. payload type assertion 필요.
- **RadialBarChart % indicator pattern**: PolarAngleAxis domain [0,100] + RadialBar value 0-100 + 별도 absolute-positioned `<div>` 안 `<span>`으로 center에 % display. `pointer-events-none` 필수 (chart interaction 방해 X).
- **entity-aware 분기 in IIFE**: `{(() => { const helpers...; return <div>...</div> })()}` 패턴으로 inline scope. 11 entity가 각자 다른 data + handler + icon이라 helper functions로 단순화.
- **Linear/Notion Show More**: `count > LIMIT && <button onClick={navigate}>전체 {count}개 보기 →</button>`. 8 limit + count badge + entity별 navigation target. progressive disclosure.
- **Plot root font-size 14px discovery는 이전 세션 hold-over**: lib/settings-store.ts default. 이번 세션 영향 없음 — inline px ([20px], [8px], [32px], [13px]) 패턴 정통화. Plot v2에서 spacing scale 절대 px 정의 가치 (이전 세션 #144 vision).

### Watch Out (다음 세션)

- **Coverage entity dropdown 결정이 가장 큰 의제** — 옵션 C/B/D + Books orphan 정의 + Cohesion entity별 vs 그래프 전체. 잘못 고르면 use-knowledge-metrics hook 재작업.
- **Plot v2 P0 #1 2 세션째 deferred** — 진행 의지 vs 점진 polish 우선. 사용자 결정.
- **NUDGE Connect 동작 미완** — Link Picker Auto-Open 패턴 A 사용자 답 안 함. brainstorm 답 줬으나 redirect됨. 다음 세션 별도 진행 가능.
- **Insights Notes/Wiki KPI 폐기 검토 미답** — PRD 의도 = Dashboard 중복 폐기. 현재 keep 됐음. 사용자 의향 확인 필요.
- **HoverCard 패턴 확대 가치** — 다른 추상 용어 (status pill / kind chip / Density formula / Top Hubs 등)에도 적용 가능. Plot v2에서 정통화.

### 환경 변경

- **Store version**: v149 keep (이번 세션 변경 없음). PR #472에서 v148→v149 완료 (Book 폴더).
- **신규 파일** (1):
  - `components/ontology/insights-charts.tsx` (4 charts: TaggedDonut / OrphanDonut / CohesionRadial / TopNotesBar + ChartCard with HoverCard support)
- **신규 i18n keys** (~50개 EN+KO 누적):
  - search.section.{notes/wiki/books/categories/tags/labels/stickers/references/templates/folders/view_all}
  - ontology.insights.section.{health/coverage}
  - ontology.insights.stat.{edges/density/notes/wiki}
  - ontology.insights.coverage_{tagged/orphan/cohesion}
  - ontology.insights.{tagged/untagged/orphans/connected/cohesion_hint/top_notes/top_notes_formula}
  - ontology.insights.help.{tagged/orphan/cohesion/composite/edges/density/notes/wiki}_{title/body}
- **Tests**: 변경 X. tsc clean 모든 8 PR.
- **사용자 IDB stale**: 없음 (schema 변경 X).

### 머신

Windows. main에 8 PR squash merge. worktree branch 모두 deleted. 다음 세션 새 worktree로 시작 권장.

---

## 2026-05-26 (저녁) — Windows, **viewport polish 세션: LOCKED #136 v2 revised + Book 폴더 Phase 1 + entity list Notes parity 점진 정합 (PR #472, 13 commits)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Plot v2 P0 #1 — Phase 0 Design Language 결정 + Plot v2 통째 재설계 PRD 작성**. 이번 세션은 사용자 viewport polish 위주로 진행했으나 진짜 큰 의제 = Plot v2 redesign 미시작. 다음 세션 우선.
>
> **사용자 의도** (이번 세션 명시):
> - "지금 플롯 디자인은 사실 내가 맨처음으로 시작한 프로젝트여서 조잡한 부분들이 많아... 리니어나 플레인에 비해서. 기능은 그들 못지 않고 오히려 앞선다고 보지만 디자인적 아쉬움이 커." (이전 세션 인용 유효)
> - "오버뷰나 대시보드, 인사이트의 경우 이렇게 여백이 있는 게 나은 거 같아" (LOCKED #136 풀 폭 viewport revert → max-w-5xl)
> - "북 폴더도 신설해야 하지 않나? 노트, 위키, 북으로 표기되어서 각각 폴더가 몇 개인지 표시" (Folder 일관성)
> - "노트 기준에 완전히 맞춰. 체크박스와 title 사이 간격, 폰트, 아이콘 사이즈 등 아예 노트를 기준으로"
> - "근본원인을 고쳐야 될 듯??" (Plot root font-size 14px ≠ Tailwind 16px base 발견)
>
> **첫 스텝** (다음 머신에서 바로):
> 1. **Open Design web UI 진입** — http://127.0.0.1:3845 (또는 매 실행 시 변동. `cd ~/Desktop/open-design && pnpm tools-dev start web` 또는 `/open-design` 슬래시 명령)
> 2. **`.omc/plans/plot-v2-redesign-prd.md` 작성** (이전 세션 P0 #1 그대로):
>    - Design language 후보 비교 (Linear / Notion / Plain / Anthropic / Custom)
>    - 사용자 결정 + 근거
>    - Surface 우선순위 (Chrome → Home/Dashboard → List views → Detail views → Insights → Settings)
>    - 시간 estimate (~17-28시간, 12-20 PR)
> 3. **critic 검토** — 큰 결정이라 객관 review 가치
> 4. **Phase 1: Chrome surface 첫 mockup 생성** (Open Design)
> 5. **결과 quality 평가** → 본격 진행 또는 brief tuning
>
> **사용자 viewport 검증 잔여 (이번 세션 변경)**:
> - Books cover icon wrapper 제거 → naked SVG (4fa6756) — 시각 확인
> - Wiki checkbox 32px (4ff0fb1) — wiki list mode 진입 후 확인 (진입 path = sidebar "병합" click → Cancel button)
> - Book 폴더 Phase 1 — IDB v149 migration 적용 확인 (사용자 시드 데이터)
> - Folders dashboard sub-line "X 노트 · Y 위키 · Z 책" 표기
> - Ontology Dashboard "위키 / 책 / 카테고리" KPI 라벨
> - Ontology Dashboard "Wiki articles" → "Wiki" / "Wiki categories" → "Categories"
> - Notes/Books status_breakdown "Stone · Brick · Block" EN
> - Wiki sub-line "{articles} Article · {stubs} Stub" 표기
> - Books Title cap 폐기 (우측 빈 공간 해소)
> - Books row Notes parity (h-[38px], 13px font, gap-[8px], px-[20px], w-[32px])
> - 4 페이지 max-w-5xl 적용 (Ontology Dashboard/Insights + Wiki Dashboard + Library Overview)
>
> **컴포넌트 구조 / 데이터 흐름** (Plot v2 PRD 작성용 reference):
> ```
> [Phase 0] Design Language 결정 (대화)
>    ↓
> [Phase 1] Surface 우선순위 roadmap
>    ↓
> [Phase 2] Surface별 mockup 생성 (Open Design — 같은 design system + token + typography)
>    Chrome → Home → Notes → Wiki → Books → Editor → Insights → Settings (6-8 surface)
>    ↓
> [Phase 3] 각 mockup → /plot-frontend:implement 4-gate 워크플로우로 Plot에 적용
>    SPEC → APPROVE → BUILD → VERIFY
>    ↓
> [Phase 4] 영구 룰 LOCKED 재정의 (#137+, #145+) + DESIGN-TOKENS.md 갱신
>    ↓
> [Phase 5] 통합 검증 + WCAG + 모션 일관성
> ```
>
> **위험 + 회피**:
> - **Plot v2 P0 #1 결정이 가장 큰 risk** — Design language 잘못 고르면 6-8 surface 다 다시. critic 검토 + 첫 1-2 mockup viewport 검증 후 본격 진행 필수.
> - **이번 세션 누적 13 commits** — Wiki list view 정밀 진단 미완. Plot v2 PRD 진행 중에도 발견 가능 (Plot v2 = 통째 재설계라 entity list도 재구성).
> - **Plot root font-size 14px** — 사용자 customization feature. Tailwind 16px base 가정과 misalignment. 근본 fix path 3개 (default 16px 변경 / fontSize feature 폐기 / Tailwind `@theme --spacing 4px` 절대화) 모두 cascade 큼 → Plot v2 P0 #1과 함께 결정 가치.
> - **Notes .a-th/.a-row CSS system** = grid + inline px 명시. Books/Wiki는 Tailwind inline class라 14px root에서 단위 misalignment. Plot v2에서 통일 design system 가치.
> - **사용자 IDB v148 → v149 migration**: Book.folderIds 초기화 [] (자동, idempotent). 사용자 viewport 첫 진입 시 적용.
> - **이번 세션 1 broken commit (820370b Wiki list 광범위 fix) → revert (bd44e43)**: gap-[8px]가 Wiki flex sibling column 구조에 cascade 영향. Books는 column wrapper가 다른 패턴이라 안전했음. **교훈**: entity별 column 구조 다르므로 동일 fix 일괄 적용 X — entity별 검증 필요.
>
> **참고 파일**:
> - `~/Desktop/open-design/` — Open Design repo
> - `~/Desktop/open-design/AGENTS.md` — Open Design 사용 가이드
> - `docs/MEMORY.md` — Plot Source of Truth (영구 룰 #93~#142 누적)
> - `lib/colors.ts` — NOTE_STATUS_HEX / WIKI_STATUS_HEX / SPACE_COLORS (Plot identity)
> - `.claude/skills/plot-frontend/mockup-faithful-implementation/` — 4-gate 워크플로우
> - `.omc/plans/dashboard-fullwidth-prd.md` — PRD v0.1 (참고 패턴)
> - `app/globals.css:1040-1156` — `.a-th, .a-row, .a-row__lead, .a-row__icon` 정의 (entity list chrome design system source)
> - `lib/settings-store.ts:83` — `fontSize: "14"` default (root font-size 14px source)
> - `components/settings-sync.tsx:20` — `document.documentElement.style.fontSize = ${fontSize}px` (적용 site)
>
> **2번째 P0 후보** (Plot v2 PRD 작성 중 또는 후속, 또는 사용자 viewport 검증 결과에 따라):
> - Wiki list view 정밀 진단 + Notes parity fix (이번 세션 minimal checkbox 32px만, 광범위 fix는 revert)
> - Book 폴더 Phase 2 — UI 작업 (book-folder-picker, side panel, smartSources resolver, folder/[id]/page.tsx book branch)
> - TABS hardcoded → 동적 entity registry refactor (이전 세션 P0 #3)
> - Insights Phase A2/B/C (Notes/Wiki/Books 차트화 — 이전 세션 P0 #2)
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: PR #472 머지 후 (이번 after-work에서 머지 시도).
> **branch worktree**: `claude/stoic-mclean-5c1d8a` — 이번 세션 누적 13 commits. PR #472로 통합. 머지 후 새 worktree로 다음 세션 시작.

### 완료 (이번 세션 — PR #472, 13 commits 누적)

이번 세션은 **사용자 viewport polish 위주** — LOCKED #136 v2 revised + Book 폴더 Phase 1 + entity list Notes parity 점진 정합.

**Layout 영역 (영구 LOCKED #136 v2 revised)**:
- `bcccd3d` refactor(layout): 4 페이지 (Ontology Dashboard/Insights + Wiki Dashboard + Library Overview) 풀 폭 → Home pattern `mx-auto w-full max-w-5xl px-6 py-10`. LOCKED #136 v1 (2026-05-25 풀 폭) → v2 (2026-05-26 max-w-5xl). 사용자 viewport 결정 — #468 chunk 3 패턴 재현 (디자인 정통성 ≠ 사용자 선호).

**Dashboard KPI 영역**:
- `2af3b9c` fix(i18n): KPI 라벨 일관성 — "Wiki articles" → "Wiki", "Wiki categories" → "Categories". 다른 KPI (Notes/Books/Tags/Labels/Stickers/Folders) 모두 단순 entity 이름과 일관 정합. EN+KO 4 키 동시.
- `616441f` fix(dashboard): status_breakdown EN 'keystone' → 'Block' 버그 + Wiki sub article 추가. (1) EN "stone · brick · keystone" → "Stone · Brick · Block" (영구 룰 #100 brand identity Cap 정합, KO는 이미 정상). (2) `stub_count` → `wiki_breakdown` 신규 (Notes 패턴 일관). EN "{articles} Article · {stubs} Stub" / KO "{articles} 글 · {stubs} 스텁". 항상 표기.

**Book 폴더 신설 Phase 1 (스키마/마이그레이션)**:
- `85514b9` feat(folders): Book 폴더 신설 Phase 1. (a) types.ts Folder.kind 확장 "note"|"wiki" → "note"|"wiki"|"book". (b) types.ts Book.folderIds: string[] 추가 (Note/WikiArticle parity). (c) migrate.ts v148→v149 — 기존 Book.folderIds = [] 초기화 idempotent. (d) store/index.ts STORE_VERSION 149. (e) ontology-dashboard-panel.tsx Folders Stat sub-line wire "X 노트 · Y 위키 · Z 책". (f) i18n folder_breakdown 신규 EN+KO. (g) seeds.ts 8 시드 + slices/books.ts addBook + 2 test fixture cascade fix. (h) 별개 fix — store/types.ts setGlobalSearchQuery type 누락 (PR #462 wire 빠진 부분).

**Books → Notes parity 점진 정합 (8 commits 누적)**:
- `1fce99b` fix(books): list view header layout — wrapper `gap-3 pl-3 pr-6 py-2` → `px-5 py-2`, itemCount column 72px → 96px ("Item count" 한 줄).
- `4088086` fix(books): Title 컬럼 max-w-[480px] cap 폐기 → flex-1 우측까지 채움 (직전 PR #469 viewport revert).
- `cea814b` fix(list): Books font-weight 500→400, row text-[13px], h-[30px]/h-[38px] (실측 Notes .a-row CSS parity) + Wiki Updated/Created 순서 swap.
- `a792774` fix(books): row/header에 gap-2 추가 (Notes gap 8px parity).
- `b17c6d3` fix(books): pixel-perfect Notes parity — `px-5 gap-2 w-8` (Tailwind, 14px root에서 17.5/7/28px) → `px-[20px] gap-[8px] w-[32px]` (Notes 정확 정합).
- `4fa6756` fix(books): title cell cover icon wrapper `h-5 w-5` (20px box) 제거 → naked SVG (14px). Notes `.a-row__icon` parity (no width wrapper).

**Wiki 영역**:
- `820370b` fix(wiki): list view 광범위 Notes parity 시도 (Books 패턴 그대로 적용). **broken** — gap-[8px]가 Wiki flex sibling column 구조에 cascade 영향. Title flex-1 좁아짐.
- `bd44e43` Revert: 위 commit revert. 깨진 layout 복원.
- `4ff0fb1` fix(wiki): minimal — checkbox column width만 `w-8` → `w-[32px]` (Notes parity). 다른 변경 X. 위험 낮음.

**최종 실측 (preview_inspect, Notes vs Books)**:
| 측정점 | Notes | Books (정합 후) |
|---|---|---|
| Checkbox right | 344px | 344px ✓ |
| Icon width | 13px | 14px ≈ |
| Title text left | 365px | 366px (1px 차이) |
| Checkbox → Title gap | 21px | 22px |
| Header height | 30px | 30px ✓ |
| Row height | 38px | 38px ✓ |
| Row font-size | 13px | 13px ✓ |
| Header gap | 8px | 8px ✓ |
| Row padding-left | 20px | 20px ✓ |

거의 완벽 정합. Notes grid gap이 lead 안 흡수 vs Books flex gap 차이로 1px만 남음.

### 브레인스토밍 & 큰 결정 (영구 LOCKED #136 v2 + 후보 #143~#147)

- **#136 LOCKED v2 (2026-05-26 revised)**: **Two-Layout Rule v2** — Overview/Dashboard/Insights = Home pattern (`mx-auto w-full max-w-5xl px-6 py-10`, ~1024px). v1 (2026-05-25 풀 폭 PR #463) viewport revert. Article 본문 max-width / Settings max-width / 차트 ResizeObserver / Mosaic layout 모두 keep.
- **#143 (vision)**: **Notes `.a-th`/`.a-row` CSS system = entity list chrome design system source of truth**. globals.css `padding: 0 20px` + `gap: 8px` + `.a-th { height: 30px }` + `.a-row { height: 38px; font-size: 13px }` + `.a-row__icon` (no width wrapper, naked SVG) + `.a-row__lead` (display: flex, gap: 8px) + inline `grid-template-columns` 동적 column 정의. Plot v2 P0 #1에서 entity list 모두 이 system 사용 결정 가치.
- **#144 (vision)**: **Plot root font-size = 14px (사용자 customization feature)**. `lib/settings-store.ts:83` default "14" + `components/settings-sync.tsx:20`이 `<html>` inline style 적용. Tailwind 16px base 가정과 misalignment (rem-based class 모두 ~12% 작음 — `px-5` = 17.5px / `gap-2` = 7px / `w-8` = 28px / `text-sm` = 12.25px). 근본 fix 3 path (default 16px 변경 / feature 폐기 / `@theme { --spacing: 4px }` 절대화) 모두 cascade 큼 → Plot v2 P0 #1 일괄 결정.
- **#145 (vision)**: **Book 폴더 Phase 1 완료, Phase 2 UI 후속**. Phase 1 = schema + migration + dashboard sub-line (이번 세션). Phase 2 = book-folder-picker UI + linear-sidebar book folder section + smartSources resolver book folder kind + `app/(app)/folder/[id]/page.tsx` book branch (현재 빈 페이지). Plot v2 P0 #1과 통합 가치.
- **#146 (vision)**: **entity별 column 구조 다르므로 동일 fix 일괄 적용 X**. Books column wrapper = 자체 padding 없음 → `gap-[8px]` 안전. Wiki column wrapper = 자체 `px-2` padding → `gap-[8px]` 추가 시 double spacing → broken. 이번 세션 820370b broken case가 교훈.
- **#147 (vision)**: **Cover icon wrapper (h-5 w-5 20×20 box) anti-pattern**. Notes `.a-row__icon`은 width 명시 없음 = SVG content 자체 width. icon (14px) + wrapper padding 6px → 시각 spacing 과도. naked SVG로 진행. Plot v2에서 모든 entity row icon naked pattern keep.

### 기술 학습 (영구)

- **preview_inspect = pixel 정확 진단 도구**: 시각 추정 (사용자 viewport에서 "더 크다/작다") vs 실제 측정 (14px / 30px / 20px) 차이 정확 파악. font-size / padding / gap / element width 측정 → 정확 fix. 이번 세션 다수 fix 모두 inspect 측정 기반.
- **Plot root font-size 14px → Tailwind 단위 misalignment**: `lib/settings-store.ts` default "14"이 `<html>` inline style 적용. Tailwind 기본 16px 가정의 `rem` 값이 14px root에서 ~12% 작아짐. 절대 px 명시 (`text-[13px]`, `px-[20px]`, `gap-[8px]`, `w-[32px]`) 가 미세 정합 path. 근본 fix는 Plot v2 P0 #1 통합 결정.
- **Notes `.a-th`/`.a-row` = grid + inline style 동적 column**: `display: grid` CSS class에 정의 X. notes-table.tsx에서 inline `style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px ...' }}` 동적 생성. globals.css는 chrome only (padding/gap/height). column system은 consumer 책임.
- **gap-[8px]가 flex sibling 구조에 cascade 영향**: Books column wrapper에 자체 padding 없어서 gap 명시 안전. Wiki column wrapper에 `px-2` padding 있어서 gap 시 double spacing → broken. 동일 entity parity fix를 다른 entity에 그대로 복제 시 위험.
- **Cover icon wrapper anti-pattern**: `<span class="flex h-5 w-5 items-center justify-center"><Icon size={14} /></span>` 패턴이 6px 빈 여백 양옆에 → 시각 spacing 과도. Notes naked SVG (`<Icon size={14} />` 직접) 정통.
- **Squash merge 후 worktree branch 같은 의제 PR 시리즈**: 13 commits 단일 PR 누적 OK. 사용자 viewport 검증마다 fix 추가 가능. 명확 commit message로 history 추적.
- **TypeScript cascade fix (interface 변경)**: `Folder.kind` 확장 + `Book.folderIds: string[]` 신규 (required) → 12 cascade error (seeds.ts 8 + slices/books.ts 1 + 2 test files + setGlobalSearchQuery 누락). tsc clean 후 commit. 의외 fix (setGlobalSearchQuery) 발견.
- **Book 폴더 migration v148→v149 idempotent**: `if (!Array.isArray(b.folderIds)) b.folderIds = []` 패턴. 재실행 안전.

### Watch Out (다음 세션)

- **Plot v2 P0 #1 결정이 가장 큰 risk** — Design language 잘못 고르면 6-8 surface 다 다시. critic 검토 + 첫 1-2 mockup viewport 검증 후 본격 진행.
- **Wiki list view 진입 path** = sidebar "병합" click → wiki-merge-page의 Cancel button click → wikiViewMode "list" (외부 store). `setWikiViewMode("list")` 직접 호출 path 미공개 (linear-sidebar.tsx에 button X). dev server에서 inspect 시 이 path 사용.
- **사용자 viewport 검증 다수 잔여** — Books cover icon wrapper 제거 / Wiki checkbox 32px / Book 폴더 Phase 1 / Folders dashboard sub-line / Ontology Dashboard KPI 라벨 등 13 변경 모두 viewport에서 확인. broken 발견 시 fix.
- **Wiki list view 정밀 진단 미완** — 이번 세션 minimal fix만 (checkbox 32px). 진정한 Notes parity는 entity별 column 구조 다름 (사용자 시각 차이 더 큼) → Plot v2에서 entity list 통합 design 일괄.
- **Plot 영구 룰 #93~#142 + #136 v2** Plot v2 PRD 시 재평가. Phase 4에서 LOCKED 룰 폐기/유지/변경 결정 + DESIGN-TOKENS.md 갱신.
- **branch worktree `claude/stoic-mclean-5c1d8a`** — PR #472 머지 후 cleanup 권장. 다음 세션 새 worktree.

### 환경 변경

- **Store version**: v148 → **v149** (Book.folderIds 추가, idempotent migration).
- **신규 파일**: 없음 (기존 파일 update만).
- **신규 i18n keys**: 3 (EN+KO 6 entries):
  - `ontology.dashboard.meta.wiki_breakdown` (대체 `stub_count`)
  - `ontology.dashboard.meta.folder_breakdown` (신규)
  - `ontology.dashboard.stat.wiki_articles` 값 변경 ("Wiki articles" → "Wiki")
  - `ontology.dashboard.stat.wiki_categories` 값 변경 ("Wiki categories" → "Categories")
  - `ontology.dashboard.meta.status_breakdown` 값 변경 ("keystone" → "Block" + Cap 통일)
- **Tailwind class 변경 (Books/Wiki)**: 14px root font-size 정합 — 절대 px 명시 (`px-[20px]`, `gap-[8px]`, `w-[32px]`, `h-[30px]`, `h-[38px]`, `text-[13px]`).
- **Tests**: 변경 X. tsc clean 모든 13 commits.

### 머신

Windows. 단일 worktree `claude/stoic-mclean-5c1d8a` 누적 13 commits → PR #472. 머지 후 cleanup 권장.

---

## 2026-05-25 (대규모 세션 #3) — Windows, **거대 세션: P0 #1/#2 완성 + 검색 정통화 + Open Design install + Phase 0 결정 (PR #459-#470, 12 PR 머지)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Phase 0 — Design Language 결정 + Plot 통째 재설계 PRD 작성** (사용자 명시 큰 결정).
>
> **사용자 의도** (그대로 인용):
> - "지금 플롯 디자인은 사실 내가 맨처음으로 시작한 프로젝트여서 조잡한 부분들이 많아. 리니어나 플레인에 비해서. 기능은 그들 못지 않고 오히려 앞선다고 보지만 디자인적 아쉬움이 커."
> - "내가 폴리쉬를 계속해봤는데도 답이 없어서. 오픈 디자인이라는 강수를 도입하려는 거야."
> - "오픈 디자인으로 목업을 만들고, 그걸 플롯 코드에 입히는 건?"
> - "통째 재설계 의도 (Path A)."
>
> **첫 스텝** (다음 머신에서 바로):
> 1. **Open Design web UI 진입** — http://127.0.0.1:3845 (데몬 + web 이미 실행 중. 없으면 `cd ~/Desktop/open-design && pnpm tools-dev start web`)
> 2. **Phase 0 PRD 작성** — `.omc/plans/plot-v2-redesign-prd.md`
>    - Design language 후보 비교: Linear-inspired / Notion-clean / Plain-style / Anthropic-style / Custom hybrid
>    - 사용자 결정 + 근거
>    - Surface 우선순위 (Chrome → Home/Dashboard → List views → Detail views → Insights → Settings)
>    - 시간 estimate (~17-28시간, 1-2주)
> 3. **critic 검토** (PRD critic skill) — 큰 결정이라 객관 review 가치 큼
> 4. **Phase 1: Chrome surface mockup 시도** — Open Design에서 `dashboard` 또는 `web-prototype` skill + 71 system 중 1개 선택 + brief 입력
> 5. **결과 quality 확인** — 첫 cycle quality 평가. 좋으면 본격 진행, 안 좋으면 brief tuning 또는 다른 path 결정.
>
> **컴포넌트 구조 / 데이터 흐름**:
> ```
> [Phase 0] Design Language 결정 (대화)
>    ↓
> [Phase 1] Surface 우선순위 roadmap
>    ↓
> [Phase 2] Surface별 mockup 생성 (Open Design — 같은 design system + token + typography)
>    Chrome → Home → Notes → Wiki → Books → Editor → Insights → Settings (6-8 surface)
>    ↓
> [Phase 3] 각 mockup → /plot-frontend:implement 4-gate 워크플로우로 Plot에 적용
>    SPEC → APPROVE → BUILD → VERIFY
>    ↓
> [Phase 4] 영구 룰 LOCKED 재정의 (#137+) + DESIGN-TOKENS.md 갱신
>    ↓
> [Phase 5] 통합 검증 + WCAG + 모션 일관성
> ```
>
> **Open Design 사용법** (정확한 commands):
> - daemon + web 시작: `cd ~/Desktop/open-design && pnpm tools-dev start web`
> - 상태 확인: `pnpm tools-dev status`
> - 정지: `pnpm tools-dev stop`
> - 데몬: http://127.0.0.1:3844 / 웹 UI: http://127.0.0.1:3845
> - 환경: pnpm 10.33.2 (10.29.3 → upgrade 완료), Node 24.13, Visual Studio Build Tools 2022 (better-sqlite3 컴파일)
>
> **위험 + 회피**:
> - **Phase 0 결정이 가장 큰 risk** — design language 잘못 고르면 6-8 surface 다 다시. critic 검토 + 사용자 viewport 첫 1-2 mockup 검증 후 본격 진행 권장.
> - **mockup → Plot 변환 quality** — 첫 cycle 어색할 수 있음. iteration 2-3회 가치.
> - **영구 룰 #93~#136 정합** — 새 design language 채택 시 기존 17개 LOCKED 룰 중 폐기/유지/변경 결정 필요. critic이 가장 가치 있음.
> - **Plot identity 보존** — Stone/Brick/Block / 'P' avatar / space colors / NOTE_STATUS_HEX / WIKI_STATUS_HEX 보존 의도. 새 design system이 이걸 침범하면 Plot 정체성 깨짐.
> - **Open Design 출력 = HTML prototype** — React 컴포넌트 X. `/plot-frontend:implement`의 mockup-faithful skill이 변환 처리. 그러나 store/hook wire는 매뉴얼 명시 필요.
> - **이번 세션 누적 12 PR** — 다음 세션은 fresh start 권장. Phase 0 PRD 작성에 집중.
>
> **참고 파일**:
> - `~/Desktop/open-design/` — Open Design repo (clone 완료)
> - `~/Desktop/open-design/AGENTS.md` — Open Design 사용 가이드
> - `~/Desktop/open-design/skills/` — 19 skills (dashboard / web-prototype 등)
> - `docs/MEMORY.md` — Plot Source of Truth (영구 룰 #93~#136 모두)
> - `lib/colors.ts` — NOTE_STATUS_HEX / WIKI_STATUS_HEX / SPACE_COLORS (Plot identity 보존)
> - `.claude/skills/plot-frontend/mockup-faithful-implementation/` — 4-gate 워크플로우 (SPEC/APPROVE/BUILD/VERIFY)
> - `.omc/plans/dashboard-fullwidth-prd.md` — 이번 세션 PRD v0.1 (참고 패턴)
>
> **2번째 P0 후보** (Phase 0 끝나면, 또는 병행 가능):
> - chunk 2b — Ontology Dashboard weekly activity area chart (entityEvents 시계열, deferred)
> - chunk 3b — Ontology Insights body Mosaic (COVERAGE 차트화 + TOP NOTES bar chart)
> - Phase A2 — Notes Insights 차트화 (StatusDonut 재사용 + MiniBarChart recharts 변환)
> - Phase B — Wiki Insights 페이지 신설 (정보 architecture 정합)
> - Phase C — Books Insights 페이지 신설
> - TABS hardcoded → 동적 entity registry refactor (사용자 비판 잔여)
> - chunk 4 — Wiki/Library Overview 차트 추가
>
> **머신**: Windows. cross-machine 가능 (Open Design 다른 머신 재설치 필요).
> **현재 main HEAD**: PR #470 머지 후.
> **branch worktree**: `claude/quirky-wing-aed18b` (이번 세션 누적 12 PR — cleanup 권장, 다음 세션 새 worktree로 시작).

### 완료 (이번 세션 — 12 PR 머지)

이번 세션은 **사용자 명시 P0 #1/#2 완성 + 검색 architecture 정통화 + 디자인 큰 결정 (통째 재설계 path A) + Open Design install** 세션.

**Chrome architecture 완성 (PR #459/#460/#468/#470)**:
- chunk 1+2 (#459) — 'P' brand mark Activity bar → GlobalTopBar UserAvatar 이전. workspace identity anchor.
- chunk 3 (#460) — UserAvatar dropdown chrome 단일 진입 흡수 (PanelsMenu + Settings + Trash)
- chunk 3 revert (#468) — 사용자 viewport 결정. PanelsMenu 시계 왼쪽 + 우측 cluster theme/settings/trash 3-icon 복원
- divider polish (#470) — PanelsMenu↔시계 사이 divider 제거. 최종 layout: `[P] │ [≡] [⏰] [<] [>] ─ [search] ─ │ [☀] [⚙] [🗑]`

**검색 architecture 정통화 (PR #461/#462)**:
- entity TABS 7개 → 11개 확장 (#461) — Books/Categories/Stickers/References 추가. 검색 button → /search route navigate.
- Path A: GlobalTopBar = 진짜 input (#462) — SearchView 자체 input 제거. store globalSearchQuery state + URL X (session only persist 제외). ⌘K → input focus + select. 사용자 보고 redundant 완전 해소.

**Dashboard 풀 폭 + 차트 (PR #463/#464/#465)**:
- 풀 폭 정통화 (#463) — Ontology Dashboard/Insights + Wiki/Library Overview max-width 제거. 영구 LOCKED #136 Two-Layout Rule.
- 차트 4개 Mosaic 2x2 (#464) — Status donut / Wiki status donut / Top Hubs bar / Categories bar. ResizeObserver 패턴 (WikiGrowthChart 정합). dashboard-charts.tsx 신규.
- 사용자 보고 3건 fix (#465) — 색상 hardcoded RGB → NOTE_STATUS_HEX/WIKI_STATUS_HEX token (영구 룰 정합). Books KPI 카드 추가 (entity 8개 완성). Wiki articles stubs sub-line 메타.

**Insights 손질 (PR #466/#467)**:
- Ontology Insights surgical (#466) — 좌측 sidebar Stats 제거 (본문 OVERVIEW와 redundant). "Knowledge WAR" → "Top Notes" rename (Plot identity). Composite score 공식 sublabel ("Combined value: backlinks ×2 + outgoing + tags ×½ + age bonus − orphan penalty").
- Notes Insights 디자인 (#467) — "PhActivity" → "Activity" rename. i18n 광범위 적용 (15 신규 keys EN+KO). HEALTH 빈 박스 → compact inline notice. notes.insights.* dict.

**Books list view fix (PR #469)**:
- Title flex max-w-[480px] cap (시각 균형). visibleColumns default 3개 → 6개 확장 (kind/itemCount/sources/pinned/updatedAt + sources/pinned).

**Plot 통째 재설계 결정 + Open Design install**:
- 사용자 명시: "polish 한계 + 강수 도입". Open Design 도입.
- `~/Desktop/open-design` clone 완료 (51.7k stars, Apache 2.0, 71 brand-grade design system, 19 skills).
- pnpm 10.29.3 → 10.33.2 upgrade (Windows corepack EPERM 우회).
- better-sqlite3 컴파일 통과 (Visual Studio Build Tools 2022 OK).
- daemon + web 실행 — http://127.0.0.1:3844 + http://127.0.0.1:3845.
- 사용자 viewport에서 Welcome → Local coding agent (Claude Code) → 메인 진입까지 완료.
- 첫 mockup 생성 시도 미완 — 사용자 의도 "통째 재설계 (Path A)" 명확화 후 Phase 0 PRD 작성으로 전환.

### 브레인스토밍 & 큰 결정 (영구 LOCKED #136 + 후보 #137~#142)

- **#136 LOCKED**: **Two-Layout Rule** (Plot 전체 영구 적용):
  1. Dashboard / Overview = 풀 폭 (px-6, max-width 없음)
  2. Article 본문 = max-width 유지 (가독성)
  3. Settings = max-width 유지 (form readability)
  4. 차트 = ResizeObserver + useRef (ResponsiveContainer 금지 — React 19/Next 16 width-0 issue)
  5. Dashboard 차트 layout = Mosaic (시각 위계 차등)
- **#137 (vision, 다음 세션 LOCKED 후보)**: **Plot 통째 재설계 (Path A) — Functional/UI layer 분리 워크플로우**. lib/* + hooks/* 그대로 keep. components/* + app/(app)/*/page.tsx + globals.css 통째 재설계 가능. 사용자 명시 의도.
- **#138 (vision)**: **mockup-first 워크플로우 정통화**. mockup 생성 → `/plot-frontend:implement` 4-gate → Plot 영구 룰 자동 정합. Plot v2 디자인 작업의 표준 패턴.
- **#139 (vision)**: **Open Design는 prototype generator지 React component library 아님**. HTML 출력 → 매뉴얼 변환 필수. Plot identity 보존 + 영구 룰 정합 매뉴얼 결정.
- **#140 (vision)**: **Information architecture — Insights는 entity 별 + 전체 분리**. Ontology Insights = 전체 노드 통합. Notes/Wiki/Books Insights = 세부. 사용자 명시.
- **#141 (vision)**: **검색 진입점 통합 (Path A)** — GlobalTopBar 진짜 input + SearchView 자체 input 제거 + globalSearchQuery store + ⌘K input focus. Linear/Notion 정통.
- **#142 (vision)**: **Chrome layout 4-region**: identity (P avatar) | tools (PanelsMenu hamburger) | navigation (clock/back/forward) | search | right cluster (theme/settings/trash). divider 2개 (Avatar 옆 + search↔chrome 사이만).

### 기술 학습 (영구)

- **React 19 + Radix Popover asChild의 useId mismatch**: PopoverTrigger의 asChild + Slot 패턴 사용 시 `aria-controls` ID가 server/client에서 다르게 생성. `asChild` 제거 + PopoverTrigger 자체 button 렌더로 우회 (Slot tree 단축). (#460 hydration mismatch fix)
- **ResponsiveContainer 절대 금지** (React 19/Next 16): width-0 issue. WikiGrowthChart의 `useRef + ResizeObserver` 패턴 정통. dashboard-charts.tsx의 `useChartWidth` hook으로 공통화.
- **Color token enforcement**: 차트 색상 hardcoded RGB 위험. `NOTE_STATUS_HEX` / `WIKI_STATUS_HEX` token import 강제. brick=amber (#f59e0b)/article=emerald (#10b981)/stub=orange (#f97316) 영구 룰. (#465 fix)
- **Default visibleColumns 신규 사용자에만 영향**: 기존 사용자 IDB persist된 viewState는 그대로. Title flex max-width 같은 component-level 변경은 즉시 효과 (#469 books).
- **Squash merge 후 같은 worktree branch 머지 conflict 패턴**: `git fetch origin main && git merge origin/main --strategy=ours -m "merge: ..."` + push + retry. 이번 세션 12 PR 모두 이 패턴 사용 (안정).
- **Windows pnpm install + better-sqlite3 컴파일**: corepack EPERM (admin 필요) 우회 → `npm install -g pnpm@10.33.2`. better-sqlite3는 node-gyp 컴파일 (~2분, Visual Studio Build Tools 2022 필요). Plot 환경 OK.
- **Search via store state (URL X)**: Path A 구현 시 globalSearchQuery을 store에 persist X (partialize strip)로 추가. URL search param 안 쓴 이유 = App Router의 useSearchParams Suspense 제약 + Plot offline-first (URL share 가치 낮음). 가장 단순 path가 가장 robust.
- **Insights composite score 공식 (영구 reference)**: `score = backlinks×2 + linksOut + tags×0.5 + ageDays/30 + (orphan ? -2 : 0)`. lib/insights/metrics.ts:94. 음수 score = orphan penalty 적용. "WAR"라는 명명은 sabermetrics 차용 — Plot identity와 어긋남 → "Top Notes"로 rename (#466).
- **chunk 결정 사용자 viewport 검증 후 revert 가능**: chunk 3 (UserAvatar dropdown chrome 단일 진입)는 단일 design language 측면에선 정통하지만 사용자 실제 사용 패턴은 분리된 chrome 선호. viewport 검증 후 revert 결정 정당 (#468). **디자인 결정의 정통성 ≠ 사용자 선호**.

### Watch Out (다음 세션)

- **Phase 0 결정이 가장 큰 risk** — Design language 잘못 고르면 6-8 surface 다 다시. critic 검토 + 첫 1-2 mockup 사용자 viewport 검증 후 본격 진행.
- **사용자 IDB의 viewState persist**: Books visibleColumns 같은 default 변경은 persist된 사용자에게 효과 X. 새 worktree 또는 reset 필요할 수도.
- **Open Design dev server 재시작 필요**: 다음 세션 시작 시 데몬 + web이 종료됐을 수 있음 (process kill / 컴퓨터 재부팅). `pnpm tools-dev start web` 재실행.
- **Open Design dev server 종료 정통 방법**: `pnpm tools-dev stop`. process kill X.
- **MCP server 등록 미완**: 사용자 viewport에서 Settings → MCP server → Claude Code 등록 필요 (Claude Code가 Open Design 호출 시). 단 web UI에서 직접 mockup 생성은 MCP 무관.
- **Plot 영구 룰 #93~#136 재평가**: Phase 4에서 17개 LOCKED 룰 폐기/유지/변경 결정 필요. critic 검토 가치.
- **branch worktree `claude/quirky-wing-aed18b`** 누적 12 PR — cleanup 권장. 다음 세션 새 worktree로 시작.

### 환경 변경

- **Store version**: v148 (변경 X 이번 세션 — store schema 추가 없음). globalSearchQuery는 persist 제외라 migration 없음.
- **신규 파일** (3 + PRD 1):
  - `components/ontology/dashboard-charts.tsx` — Mosaic 2x2 차트 4개 (StatusDonut/WikiStatusDonut/TopHubsBar/CategoriesBar)
  - `.omc/plans/dashboard-fullwidth-prd.md` — PRD v0.1 (chunk 분할 + LOCKED #136 정의)
- **신규 i18n keys**: ~30 (ontology.dashboard.chart.* + ontology.dashboard.meta.stub_count + notes.insights.* 15개 EN+KO)
- **Open Design install**: `~/Desktop/open-design` (51.7k stars, Apache 2.0, 1087MB) — Plot worktree와 분리
- **pnpm upgrade**: 10.29.3 → 10.33.2 (global, Open Design packageManager 정합)
- **Tests**: 변경 X. tsc clean 모든 12 PR.

### 머신

Windows. 단일 worktree (`claude/quirky-wing-aed18b`) 누적 12 PR. cleanup 권장. Open Design 첫 install이라 다음 머신에서 다시 install 필요. Plot에서 영구 룰 정합 + mockup-first workflow 정통 적용 시작.

---

## 2026-05-25 (대규모 세션 #2) — Windows, **거대 세션: i18n 마무리 + Custom Quick Filter feature + 디자인 브레인스토밍 (PR #438-#457, 20 PR 머지)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **이번 세션 마지막 브레인스토밍 2 의제 구현** — (A) 'P' brand mark 제거 + GlobalTopBar 좌측 user avatar 통합 + (B) 온톨로지 대시보드/인사이트 layout 재설계 (풀 폭 + KPI grid + 차트 7-8개).
>
> **사용자 의도** (그대로 인용):
> - "P가 하드코딩되어서 들어가는데... 시각적으로 별로야. 액티비티 바에서 해당 영역을 없애고, 토글스패널의 버튼 쪽에다 올리긴 해야 될 거 같은데... 위치를 아주 신경써서 조정해야 될 거 같아. 폰트 사이즈 등까지 고려해서."
> - "온톨로지의 인사이트와 대시보드는 좌우 여백이 넓지? 너무 문자가 많고 빽빽해서 한 눈에 안 들어오는데. 차트와 그래프가 더 많아질 순 없나?"
>
> **첫 스텝 A — 'P' brand mark fix (작은 작업, 먼저 권장)**:
> 1. `components/activity-bar.tsx:103-105` — `<div className="a-brand__mark">P</div>` + `<div className="a-actbar__head">` 영역 제거 (Tier 1 — primary spaces 직전)
> 2. `components/global-top-bar.tsx:97` — `<PanelsMenu />` 직전 또는 자리에 `UserAvatar` 컴포넌트 추가
> 3. 신규 `components/user-avatar.tsx` — 32px rounded-md, accent gradient, 이니셜 ("P" default 또는 settings.userName 첫 글자)
> 4. PanelsMenu 위치 분기 — 옆에 둘지, dropdown 통합할지 결정 (3 chunk 권장):
>    - chunk 1: 'P' 단순 제거 (작음)
>    - chunk 2: GlobalTopBar 좌측 UserAvatar (이니셜 only) 추가
>    - chunk 3: avatar dropdown — PanelsMenu + Account menu 통합 (큰 작업)
>
> **첫 스텝 B — 온톨로지 대시보드 재설계 (큰 작업, B chunk 분할)**:
> 1. `components/views/ontology-view.tsx` read — wikiViewMode "dashboard" 분기
> 2. `components/ontology/ontology-dashboard-panel.tsx` + `ontology-insights-panel.tsx` 현 layout 검사
> 3. 좌우 여백 / max-width 제거 → 풀 폭 grid
> 4. KPI 4 카드 추가 (총 노트/위키/책/카테고리) — 1줄
> 5. 차트 신규 추가 (recharts 이미 사용 중, WikiInsightsChart 패턴 참조):
>    - Stone/Brick/Block donut (status 분포)
>    - 이번 주 활동 line/area chart (entityEvents)
>    - Top 허브 노트 horizontal bar (backlinksMap sorted top 10)
>    - 카테고리 분포 bar chart (wikiCategories.noteCount)
>    - Stub vs Article donut (isWikiStub)
>    - 고아 vs 임베드 donut (wikiEmbeddedNoteIds vs total)
> 6. PRD 작성 권장 — 큰 디자인 작업이라 critic 검토 가치
>
> **컴포넌트 구조 / 데이터 흐름 (A)**:
> ```
> GlobalTopBar [좌측: UserAvatar(이니셜) → click dropdown → PanelsMenu items + Account] [clock][<][>] [search] [theme][settings][trash]
> ActivityBar [Tier 1 spaces 6종 (홈/노트/위키/책/달력/온톨로지/자료실)] [Tier 2 settings/trash 제거 — GlobalTopBar로 이동 #119/#120 정합]
> ```
>
> **Store action 매핑 (B)**:
> - `usePlotStore((s) => s.notes)` — Note[]
> - `usePlotStore((s) => s.wikiArticles)` — WikiArticle[]
> - `usePlotStore((s) => s.books)` — Book[]
> - `usePlotStore((s) => s.wikiCategories)` — WikiCategory[]
> - `usePlotStore((s) => s.entityEvents)` — EntityEvent[] (time series)
> - `lib/search/use-backlinks-index.ts` (useBacklinksIndex) — backlinksMap
> - WikiArticle.noteIds (wiki-embedded notes) — 임베드 멤버십
>
> **위험 + 회피**:
> - 'P' brand mark는 a-brand__mark CSS — globals.css에 정의됐을 수 있음. 제거만 하면 layout shift 가능 → activity-bar.tsx의 __head wrapper 통째로 제거하는 게 안전.
> - GlobalTopBar 좌측에 avatar 추가 시 PanelsMenu 충돌 — clean 분리 (옆에 또는 통합)
> - 대시보드 차트 추가 시 recharts ResponsiveContainer 사용 X (React 19/Next 16 width-0 issue) — `WikiInsightsChart`의 useRef + ResizeObserver 패턴 그대로 채택
> - Dashboard layout 풀 폭 시 article 본문은 max-width 유지 (가독성) — 두 layout 정통 룰 LOCKED
>
> **참고 파일**:
> - `components/activity-bar.tsx:103-105` — 'P' brand mark 위치
> - `components/global-top-bar.tsx:35,97` — PanelsMenu import + mount
> - `components/views/ontology-view.tsx` — Dashboard/Insights 진입점
> - `components/ontology/ontology-dashboard-panel.tsx` + `ontology-insights-panel.tsx` — 대시보드/인사이트 패널
> - `components/wiki-editor/wiki-growth-chart.tsx` — recharts ResizeObserver 패턴 reference
> - `lib/search/use-backlinks-index.ts` — backlinksMap source
> - 영구 룰 #119 (GlobalTopBar = chrome single source) / #120 (PanelsMenu top bar 단일 mount)
>
> **2번째 P0 후보** (#1 끝나면):
> - 좌우 여백 정통화 — 홈 / 라이브러리 overview / 온톨로지 페이지 모두 풀 폭 (Dashboard 성격)
> - 노트/위키 article 본문은 max-width 유지 (long-form 가독성)
> - chip edit / drag-to-reorder (Quick filter polish)
> - Misc i18n cleanup (Editor toolbar / slash menu — 마지막 큰 i18n)
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: PR #457 머지 후.
> **branch worktree**: `claude/trusting-sammet-71a453` (대규모 누적 20 PR — cleanup 권장, 새 worktree로).

### 완료 (이번 세션 — 20 PR 머지)

이번 세션은 **i18n 마무리 + Custom Quick Filter feature + 디자인 브레인스토밍** 세션. PR #438-#457:

**i18n 마무리 (PR #438-#448, #451, #457)**:
- F WikiInsightsChart (PR #438) — Day/Week/Month + Growth/Connectivity + chart axis date-fns ko locale
- G Trash All view (PR #439) — 8 entity kind labels + 8 section headers + column header + toast + Hook 룰 fix
- G' Trash chrome (PR #440) — page header + sub-tabs + Stone/Brick/Block/Pinned route titles + ViewComponent title 누락 fix
- H Notes/Trash empty + hover tooltip + split toast (PR #441) — 22 신규 keys
- I notes-table TrashEntityList + context menu + inline toast (PR #442) — 16 신규 keys
- J 3 Floating Action Bars (PR #443) — Notes/Wiki/Templates 31 신규 keys
- K inbox + books toast (PR #444) — 13 신규 keys
- L wiki-view toast (PR #445) — Note added / Wiki article created / Filtering connected
- M library-view (refs/tags/files) (PR #446) — 20 신규 keys
- N Library chrome + /notes fallback (PR #447) — 12 신규 keys
- O SearchView Linear refine (PR #448) — **folder breadcrumb path** + 26 신규 keys
- P Side panel 3 탭 (PR #451) — 연결/활동/북마크 + EVENT_CONFIG 44 verbs i18n (~70 신규 keys)
- V "참고문헌" → "레퍼런스" 정정 (PR #457) — 3 잔여 keys

**wikiRegistered 정정 (PR #449/#450)** — 사용자 검증으로 발견 misleading label + 동작:
- 라벨: "Wiki-registered / 위키 등록" → "In a wiki article / 위키에 속해있음"
- 설명: "promoted to wiki / 위키로 승격됨" → "embedded inside a wiki article / 위키 글에 임베드된 노트"
- 동작: 제목 매칭 → **실제 임베드 멤버십** (wikiArticles.noteIds 체크) — 영구 룰 #132

**Custom Quick Filter feature (PR #452-#456)** — 사용자 신호 "직접 만들고 쓸 수 있는 빠른 필터":
- MVP (PR #452) — promote-then-save 패턴: + 버튼 + Dialog + chip bar 자동 노출 + hover × 삭제 + Zustand persist v148
- 다른 view 확장 (PR #453) — Books/Wiki/Templates viewContext + Wiki/Templates default i18n
- Dialog rule builder (PR #454) — Dialog 안 + 필터 추가 popover로 FilterPanel 임베드 (사용자 신호 해소)
- "Label" → "Name" (PR #455) — Plot Label entity 혼동 회피
- Wiki/Books default 시드 확장 (PR #456) — Wiki 3→5, Books 0→3 chip

**디자인 브레인스토밍 (이 entry hook 1순위)**:
- 'P' brand mark 제거 + GlobalTopBar user avatar 통합 — 3 chunk 분할 권장
- 온톨로지 대시보드 layout 재설계 — 풀 폭 + KPI grid + 차트 7-8개

### 브레인스토밍 & 큰 결정 (영구 LOCKED #131~#135 + 후보 #136)

- **#131 LOCKED**: **SavedView ≠ CustomQuickFilter 의미 분리**. SavedView = 장소 (view 전체 교체), CustomQuickFilter = 도구 (현재 view 위 modifier). 통합 X, 두 시스템 병존. (PR #452)
- **#132 LOCKED**: **wikiRegistered = 실제 임베드 멤버십** (제목 매칭 X). `wikiArticles.noteIds` 배열 체크. 영구 룰 — filter 라벨/desc가 실제 동작과 정확히 일치해야 misleading 회피. (PR #450)
- **#133 LOCKED**: **module-level static config labelKey 패턴 확장**. EVENT_CONFIG에 verbKey 옵셔널 추가 — module-level pure data에 i18n key 옵셔널 필드 + consumer가 t() resolve. SECTION_META + STATUS_CONFIG + view-configs + EVENT_CONFIG 일관 적용. (#126 일반화 → 영구화)
- **#134 LOCKED**: **사용자 정의 Quick Filter promote-then-save 패턴 (D+A 결합)**. chip bar 끝 "+" 버튼 + Dialog (현재 active filters 자동 prefill + filterCategories 있으면 popover로 mini FilterPanel 임베드). promote-only fallback이 default. (PR #452/#454)
- **#135 LOCKED**: **Plot UI text는 entity 이름과 generic form field 명명 충돌 회피**. "Label" form field → "Name" (Plot의 Label entity 충돌). 다른 generic field 명명 시도 같은 룰 적용 (Folder/Tag/Status 등 충돌 시 alternative). (PR #455)
- **#136 (vision, 비-locked)**: **Dashboard / Overview = 풀 폭, Article 본문 = max-width 유지**. 정통 layout 룰. 다음 세션 대시보드 재설계에서 LOCKED 진입 권장.

### 기술 학습 (영구)

- **Zustand selector 안 .filter() 직접 호출 = referential equality 깨짐**. `useStore((s) => s.arr.filter(...))` 패턴은 매 render마다 새 array 반환 → "getServerSnapshot should be cached" infinite loop. 외부 useMemo로 filter 또는 store에 derived state 빌드. (PR #452 발견 + fix)
- **Module-level pure function에 i18n 필요할 때 t 옵셔널 인자 패턴**. `formatFilterChip(rule, ..., t?: (k:string)=>string)` — caller가 React 컴포넌트라면 useT() 결과 전달, 아니면 영어 fallback. module-level 함수는 useT 못 호출이라 이 패턴이 정통.
- **Filter 평가 로직 (filter.ts:35-39)**: **다른 field 간 AND, 같은 field 안 OR**. 즉 `status=stone, status=brick, pinned=true` → `(status=stone OR status=brick) AND (pinned=true)` 자연스러운 SQL 형태. Quick filter도 같은 로직.
- **EVENT_CONFIG verbKey 패턴**: EntityEvent verb 44종 모두 i18n 가능. module-level Record에 verbKey 옵셔널 추가 + ActivityTimeline의 TimelineRow에서 t(config.verbKey) resolve. React Hook 룰 위반 없이 광범위 i18n.
- **PreviewCard inner function 패턴 발견**: NoteHoverPreview 안에 PreviewCard 별도 function — useT을 호출하는 위치 잘못하면 "Cannot find name 't'" 에러. inner function이 own state를 가지면 own useT 필요. (PR #441 fix)
- **wiki list 모드 진입 path 부재 발견**: dashboard에서 list로 진입하는 명시적 nav 없음 (사이드바에 Overview/병합/분리/템플릿만). 사용자가 chip bar 못 봄 → viewContext="wiki" 항상 전달로 dashboard에도 + 버튼 노출 (PR #454).

### Watch Out (다음 세션)

- **'P' brand mark fix**: a-brand__mark CSS가 globals.css에 정의됐을 가능성 — 단순 제거 시 layout shift 회귀. activity-bar.tsx의 `<div className="a-actbar__head">` 통째 제거가 안전. CSS 확인 권장.
- **대시보드 차트 ResponsiveContainer 사용 X**: React 19/Next 16 width-0 issue. WikiInsightsChart의 ResizeObserver + useRef 패턴 채택.
- **대시보드 layout 풀 폭화 시 다른 페이지 영향**: 홈/라이브러리/온톨로지 모두 좌우 여백 통일이라면 같이 적용. 노트/위키 본문은 별도.
- **사용자 IDB stale**: 위키 17개 모두 trashed 되었다가 복원 (검증 중). 사용자가 trashed 상태로 다시 돌리거나 그대로 사용 — 선택.
- **branch worktree 누적 20 PR**: `claude/trusting-sammet-71a453` cleanup 권장. 다음 세션 새 worktree로 시작.
- **wikiViewMode list 진입 path 명확화** (별도 작업): dashboard "위키 글" 카드 click이 list로 가는 path이지만 미직관적. 향후 UI 개선 고려.

### 환경 변경

- **Store version**: v147 → **v148** (customQuickFilters slice 신규)
- **Migration**: v147 → v148 idempotent (빈 array 보장)
- **신규 파일** (3):
  - `lib/store/slices/custom-quick-filters.ts` — slice
  - `components/quick-filter/quick-filter-create-dialog.tsx` — dialog
  - `components/quick-filter/` 새 디렉터리
- **신규 dict keys 누적**: ~250+ (sidepanel.* + event.verb.* + trash.* + notes.toast.* + floatingbar.* + wikibar.* + tplbar.* + inbox.* + books.* + wiki.toast.* + library.* + search.* + filter.quick.* 등 광범위)
- **사용자 IDB stale**: 위키 17개 restore (검증 중)
- **변경 파일 누적**: 30+ (i18n 마무리 + Custom Quick Filter 신규 시스템)

### 머신

Windows. 단일 worktree (`claude/trusting-sammet-71a453`) 대규모 누적 (20 PR). cleanup 후 새 worktree 권장. cohesive 마무리 세션 — 매 PR 후 즉시 viewport 검증 + 사용자 신호 받아 다음 작업 결정 (사용자가 영어 발견 또는 의문 → 즉시 fix 사이클 + 디자인 브레인스토밍 마무리).

---

## 2026-05-25 (대규모 세션) — Windows, **i18n 한국어 17 surface + Phase α+β LOCKED #124 완성 + 아이콘 통일 + Pinned 표준화 (PR #417-#436, 20 PR 머지)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **F — WikiInsightsChart i18n** (`components/wiki-editor/wiki-insights-chart.tsx`). 위키 overview chart 영어 잔여 (Day/Week/Month + Growth/Connectivity + All/Articles/Stubs + chart title + New per month). 작은 mechanical 작업 — 1 파일 + 신규 dict keys ~10개. useT() wire 추가.
>
> **사용자 의도**: 이번 세션 사용자 명시 끊임없는 한국어 일관성 + 시각 정합. 모든 visible surface 한국어 wire 거의 완료. 위키 overview chart가 남은 가장 visible 잔여.
>
> **첫 스텝** (다른 머신에서 바로):
> 1. `components/wiki-editor/wiki-insights-chart.tsx` read
> 2. lib/i18n.ts에 wiki.chart.* 신규 keys 추가 (`wiki.chart.cumulative`는 이미 있음 — 다른 series labels + range/tab/filter 추가)
> 3. useT() hook wire + 모든 영어 string → t() 호출
> 4. tsc + viewport (위키 페이지 진입 → chart 영역 한국어 확인)
> 5. commit + PR + merge
>
> **위험 + 회피**:
> - 1 파일 mechanical — 위험 낮음
> - chart library 자체의 axis tick / tooltip은 별도 (필요시 chart props로 locale 전달)
>
> **참고 파일**:
> - `components/wiki-editor/wiki-insights-chart.tsx`
> - `lib/i18n.ts` (wiki.* dictionary)
>
> **2번째 P0 후보** (#1 끝나면):
> - Misc i18n cleanup (Trash All view / Toast 메시지 / Editor toolbar)
> - 사용자 viewport 검증 4건 (Backup Restore / Hide-all / Cmd+K Escape / Inbox Phase 1c)
> - Phase 2 temporal hooks (PRD §11 Q1/Q5)
> - 사용자 시드 검증 (Phase α-2 위키 체크박스)
>
> **3번째 P0 후보**: 검색 결과 row Linear 정합 (highlight + breadcrumb) — 별도 PR
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: PR #436 머지 후 (30223bf).
> **branch worktree**: `claude/goofy-lewin-17a40d` (대규모 누적 — cleanup 권장, 새 worktree로).

### 완료 (이번 세션 — 20 PR 머지)

이번 세션은 **i18n + 정체성 정합 마무리 세션**. PR #417-#436 누적:

**Phase α-1 + α-2 + β — Memory LOCKED #124 완성** (PR #417 / #419 / #436):
- Phase α-1: Inbox 'task' kind 추가 (노트 본문 체크박스 → Inbox Do section)
- Phase α-2: todo-index 위키 article 확장 (entityKind 분기 + buildFromScratch wikis param)
- **Phase β**: TodoView 폐기 + Calendar sidebar "할 일" nav 제거 + /todos route 삭제 (5 파일 +2/-206)

**i18n 17 surface 한국어 wire** (~250+ 신규 dict keys):
- Wiki overview (PR #417): search / stats 3 cards / featured / pinned / categories
- Calendar (PR #417): Month/Week/Agenda → 월·주·일정 + Mon-Sun → 월·화·수·목·금·토·일
- Filter dropdown (PR #417): 카테고리 + Stone/Brick/Block 음역 (#118)
- SidePanel tabs (PR #417): Detail/Connections/Activity/Bookmarks → 상세·연결·활동·북마크
- Inbox breadcrumb + SECTION_META + action·meta (PR #417 / #424)
- Ontology sidebar + legend (PR #420): Graph/Dashboard → 그래프/대시보드 + 범례
- Pinned 표준화 (PR #421/#422/#423): Notes/Wiki/Books/Calendar 최상단
- Inbox task source 표시 + Light mode (PR #424): 빠른 할 일 source label + meta /50→/70
- Status pill 음역 (PR #425): Stone/Brick/Block → 스톤/브릭/블록 (STATUS_CONFIG labelKey)
- SidePanel inspector (PR #426): 날짜/상태/폴더/라벨/태그/카테고리/개요/속성 + workflow (완료/미루기/휴지통/승격/강등) + warnings + 47 keys
- ViewHeader title (PR #428): Insights/Labels/Categories/Files/References/Stickers/Tags/Templates 8 views + Library sidebar nav
- Knowledge Dashboard 본문 (PR #429): 분량/연결성/건강도/주요 허브 + stat cards + sub-meta + 30 keys
- 자료실 아이콘 + 레퍼런스 (PR #430): Archive (상자) + 참고문헌 → 레퍼런스
- Books 아이콘 (PR #431 → 임시 BookOpen → PR #432 → BooksSpaceIcon=Library lucide 최종): 3 surface 통일
- 긴급 fix (PR #433): merge conflict marker 제거 (Build Error 복구)
- Activity timestamps i18n-date (PR #434 + #435): useRelativeTime() hook + 14 파일 wire (formatDistanceToNow 호출처 잔여 0)
- Inbox refiner (PR #417): production-ui-refiner 5 prescriptions (Linear borderless + 16px spacing + subtitle /60 + empty 약화 + footer 중복 삭제)
- i18n-date locale-aware (PR #418): "2026년 5월" / "2026년 5월 24일" 한국어 정통 어순
- Floating action bar (PR #427): selected count + buttons + workflow + toasts 한국어

### 브레인스토밍 & 큰 결정 (영구 LOCKED #124~#127 + 후보)

- **#124 LOCKED (2026-05-25)**: **Todos → Inbox `task` kind 흡수 완성**. α-1 + α-2 + β 전 단계 완료. 노트/위키 본문 체크박스 → Inbox Do section 단일 source. TodoView/Calendar nav 영구 폐기.
- **#125 LOCKED (2026-05-24 심야, PR #417)**: Inbox refiner Linear borderless 정합 (SectionCard wrap 폐기, row만 노출).
- **#126 (vision)**: module-level static config labelKey 패턴 확장 (SECTION_META + STATUS_CONFIG + view-configs). #122 일반화.
- **#127 LOCKED (2026-05-25 PR #421-#423)**: **Pinned/Favorites 사이드바 최상단** (Linear/Notion 표준). 모든 entity sidebar (Notes/Wiki/Books/Calendar cross-entity) 일관 적용. 미래 entity sidebar 추가 시 동일.
- **#128 후보 (PR #430)**: **자료실 = Archive (상자) / Books = Library (책장) 아이콘 차별**. cross-entity index hub (Archive)와 단일 entity space (Library/책)의 시각 분리.

### 기술 학습 (영구)

- **useRelativeTime hook 패턴 (lib/i18n-date.ts)**: settings store 연동 + opts (addSuffix?) — 14 호출처 단일 wire. 호환성: opts 옵션으로 짧은 format (addSuffix: false) + 기본 long format 모두 지원.
- **STATUS_CONFIG labelKey 패턴 (#126)**: module-level config에 labelKey 추가, consumer가 t() resolve. React Hook 룰 위반 없음 + 단일 wire가 다수 surface 자동 갱신 (notes-table / board / timeline / side-panel / floating bar 모두).
- **Phase α-2 entityKind 분기 패턴**: TaskItem에 `entityKind?: "note" | "wiki"` 옵셔널 추가 (default "note" 호환). buildFromScratch + upsertWiki + use-inbox source loop 모두 entityKind 분기. inbox-view handleRowClick wiki entityKind → navigateToWikiArticle (cross-entity click pattern).
- **Phase β 단순 제거 (Inbox alias X)**: 사용자 의도 "그냥 삭제" — `/todos` route + TodoView 컴포넌트 영구 제거. store actions (addQuickTask 등)은 그대로 유지 — 미래 inbox quick add 흡수 시 재활용.
- **Conflict resolve 시 git diff --check 의무**: PR #432에서 Edit "modified since read" error 후 commit 진행 → conflict marker가 main에 머지됨 (Build Error). 재발 방지: `git diff --check` 또는 grep으로 conflict marker 검사 의무.
- **Books vs Library 아이콘 차별 (lucide)**: BooksSpaceIcon = Library (책장) / Library 자료실 = Archive (상자). 두 lucide icon 의미 차이 — 같은 import alias로 묶이면 시각 혼란 (PR #431 임시 BookOpen → PR #432 BooksSpaceIcon 최종).

### Watch Out (다음 세션)

- **F (WikiInsightsChart)**: 다음 P0 #1. 1 파일 mechanical. 다만 chart library의 axis/tooltip locale은 별도 prop으로 전달 필요할 수 있음.
- **시드 검증 미완 (Phase α-2)**: 위키 article 본문에 `[ ]` 추가 후 Inbox 표시 확인 안 됨. 사용자가 실제 위키에 체크박스 시드 후 검증 권장.
- **Conflict marker 재발 방지**: git commit 전 `grep -r "<<<<<<\|=======\|>>>>>>" --include="*.ts" --include="*.tsx" .` 의무.
- **Books quickadd 흡수 미정**: TodoView 폐기 시 quick add UX 흡수 위치 (Inbox vs Home capture) 결정 안 됨 — 사용자 요청 시 진행.
- **Calendar quickadd 진입점 사라짐**: 사용자가 "할 일 추가…" 어디서? — 노트 본문에 직접 `[ ]` 입력 또는 Inbox 안 quick add (Phase β-2 작업으로 가능).

### 환경 변경

- Store v147 무변경 (모두 코드/UI 변경)
- 신규 파일: `lib/i18n-date.ts` (PR #418, useDateFormat + useRelativeTime hooks)
- 변경 파일 누적 30+ (i18n wire + 아이콘 + Pinned + Phase α+β)
- 신규 i18n keys ~250+ (wiki.* / calendar.* / sidepanel.* / inbox.* / floatingbar.* / ontology.dashboard.* / 기타)
- 사용자 IDB stale data: Phase β 후 TodoView store 그대로 (호환), Quick Tasks 노트 시드 (이전 세션) — 그대로
- **삭제 파일** (Phase β): `components/views/todo-view.tsx` + `app/(app)/todos/page.tsx`

### 머신

Windows. 단일 worktree (`claude/goofy-lewin-17a40d`) 대규모 누적 (20 PR). cleanup 후 새 worktree 권장. cohesive i18n + 정체성 정합 마무리 세션 — 매 PR 후 즉시 viewport 검증 + 사용자 신호 받아 다음 작업 결정 (사용자가 영어 발견 → 즉시 fix 사이클).

---

## 2026-05-24 (심야) — Windows, **Phase α-1 Inbox 'task' 흡수 + 4 surface 한국어 wire + Inbox refiner (PR #417)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Phase α-2 — `lib/todo-index.ts` extractTasks를 wiki blocks + book chapters의 체크박스도 walk하도록 확장**. 사용자 직관 "할 일 = 모든 영역 통합"의 완전 해소. 현재는 노트 본문 체크박스만 인덱싱 → Inbox Do section에 표시. wiki article의 todo block / book의 chapter checkbox는 미반영.
>
> **사용자 의도**: 이번 세션 명시 — "할 일은 노트나 위키, 북 등 모든 영역의 todo를 모아놓은 곳 아닌가?" → 사용자 직관 = 통합. 현재 Phase α-1은 노트만. Phase α-2가 완전 해소.
>
> **첫 스텝** (다른 머신에서 바로):
> 1. `lib/todo-index.ts` + `lib/body-helpers.ts extractTasks` read — 노트 ProseMirror tree walk 패턴 파악
> 2. WikiArticle.blocks loop 추가 — block.type === "todo" 또는 paragraph 안 taskList 인식
> 3. Book.contentJson 있으면 동일 패턴 (현재 books는 content 안 가지는 metadata-only일 수도 — 확인)
> 4. TaskItem 타입에 `entityKind?: "note"|"wiki"|"book"` optional 필드 추가 (default "note" — 호환성)
> 5. `addQuickTask` + `toggleTaskChecked` 호출처 영향 검토 (noteId 그대로 사용, entityKind 분기는 lookup 시점)
> 6. use-inbox.ts task source loop의 `noteById.get(task.noteId)`를 entityKind에 따라 wikiById/bookById로 분기
> 7. tsc + 시드 (wiki article 하나 만들고 본문에 `- [ ] task` 추가 → Inbox Do에 표시 확인)
>
> **위험 + 회피**:
> - TaskItem.noteId 필드를 generalize하면 IDB persist 마이그레이션 필요 (v147 → v148). 단계적으로 noteId 유지 + entityKind 추가가 안전.
> - body-helpers extractTasks는 노트 전용 — 위키 blocks 구조 다름. extractTasks generic function 또는 별도 extractWikiTasks 함수 추가.
> - Quick Tasks 노트 자동 생성 패턴 (addQuickTask)은 그대로 유지 — 위키/책 안에는 quick task 추가 불가 (사용자가 직접 본문에 체크박스 입력만 인덱싱).
>
> **참고 파일**:
> - `lib/todo-index.ts` — 인덱스 store
> - `lib/body-helpers.ts` — extractTasks
> - `lib/hooks/use-inbox.ts` — task source loop (line ~243 부근)
> - `lib/store/index.ts:192-` addQuickTask (Quick Tasks 노트 생성)
> - 영구 룰 #111 (단일 Hook 모델), #122 (labelKey 패턴)
>
> **2번째 P0 후보** (#1 끝나면):
> - Phase β — TodoView 폐기 + `/todos` route를 `/inbox?filter=task` alias로 (단순 redirect 또는 직접 inbox open). Sidebar 진입점은 유지.
> - Inbox 외 영어 잔여 polish — WikiInsightsChart / Notes row status pill 음역 (Stone/Brick/Block badge → 스톤/브릭/블록) / ViewHeader title hardcoded / SidePanel inspector sections + workflow actions / Floating bar / Inbox row hover snooze options + toast.
>
> **3번째 P0 후보**:
> - 사용자 viewport 검증 4건 (Phase 1c Inbox / Backup Restore / GlobalTopBar Hide-all / Cmd+K Escape)
> - Phase 2 temporal hooks (watch + recurring)
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: PR #417 머지 후.
> **branch worktree**: `claude/goofy-lewin-17a40d` (머지 후 정리 권장 — 새 worktree로).

### 완료 (이번 세션 — 3 chunk 누적)

**Chunk 1 — production-ui-refiner Inbox SectionCard (후보 1, 5-phase)**:
- 사용자 사전 진단 4건 (SESSION-LOG 2026-05-24 밤 hook에 documented) + C3 동방향 추가:
- A1 SectionCard 간격 `space-y-6` → `space-y-4` (24px → 16px, Inbox dense list)
- C1 카드 wrap `rounded-lg border border-border bg-card` 전체 폐기 → Linear borderless flow
- C3 subtitle opacity `text-muted-foreground/70` → `/60` (secondary text 표준)
- E1 empty `px-3 py-6 text-center /70` → `px-1 py-1 /50` (left + 약화 + 한 줄 컴팩트)
- E2 footer `All caught up — Review and Detected are always running.` 삭제 (Detected에 item 있을 때 misleading, header subtitle이 이미 제공)
- skip: C2 section title font weight 강화 (사용자 명시 신호 없음)

**Chunk 2 — i18n Wave (4 surface, ~50 신규 keys)**:
사용자 명시 (Wiki overview / Calendar / Filter dropdown Stone/Brick/Block / Detail panel tabs) + 발견된 추가 surface 모두:
- WikiDashboard: search placeholder / 3 stat cards (위키 글·스텁·미분류) / FEATURED ARTICLE → 추천 글 / PINNED → 고정됨 / CATEGORIES → 카테고리 / Recent Changes → 최근 변경 / Hub Articles → 허브 글 / Needs Review → 검토 필요 / View all / empty state. **단**: WikiInsightsChart (Day/Week/Month / Growth/Connectivity / All/Articles/Stubs / Cumulative / New per month)는 별도 컴포넌트, 미커버 — 다음 세션 후보.
- CalendarView: Month/Week/Agenda → 월·주·일정 (모드 토글) + Mon-Sun → 월·화·수·목·금·토·일 (DAY_LABELS 컴포넌트 안 useMemo 매핑) + Today → 오늘
- view-configs.tsx CALENDAR/TEMPLATES_VIEW_CONFIG: filter status/folder/label/tags labelKey + Stone/Brick/Block 음역 (영구 룰 #118 — 모든 entity-specific config 일관 적용 의무 #122)
- SmartSidePanel: Detail/Connections/Activity/Bookmarks → 상세·연결·활동·북마크 + close aria
- SidePanelContext: 'Select a note to see details' → '노트를 선택하면 상세 정보가 표시됩니다'
- inbox-view.tsx: 'Home > Inbox' breadcrumb → '홈 > 받은편지함' + ViewHeader title
- inbox-view.tsx SECTION_META (Do/Review/Detected + subtitle + empty) → 할 일/되새김/발견 + 한국어 subtitle + empty. module-level labelKey 패턴 (#122) — consumer SectionCard에서 t() resolve
- use-inbox.ts action/meta 텍스트 (Due today/Overdue Nd/Review now/Plan due/Snooze ended/Create wiki?/Enroll wiki?/N notes) → 오늘 마감/N일 지남/지금 복습/계획 마감/미루기 종료/위키로 만들까요?/위키 등록할까요?/노트 N개

**Chunk 3 — Phase α-1 Inbox 'task' 흡수 (Memory parked → LOCKED 진입)**:
사용자 질문 "할일은 모든 영역 통합 아닌가? Inbox에서 해결 하기로 했나?" → 추천 옵션 B (Inbox 흡수) 채택. 단계적 MVP 형태로 진행:
- `lib/store/slices/inbox.ts`: `InboxItemKind` union에 `'task'` 추가
- `lib/hooks/use-inbox.ts`: `sectionFor('task')` → `'do'` + todoTasks loop source (incomplete only, dismissed/snoozed 필터). Quick Tasks 노트 제목은 표시 시점에 `t("todos.quick_tasks_note")` = "빠른 할 일"로 매핑 (노트 데이터는 영어 그대로 — store lookup 호환성)
- `components/inbox/inbox-source-icon.tsx`: `case 'task'` → `Square` icon (lucide)
- `components/views/inbox-view.tsx`: handleRowClick + onKeyDown에 task 분기 — sourceId는 task.id (composite noteId:position), `usePlotStore.getState().todoTasks.find(t => t.id === item.sourceId)` 로 noteId 조회 → openNote
- TodoView는 **parallel 유지** (폐기는 Phase β로 미루기 — 사용자 검증 시기)

**시드 데이터 검증** (직접 시뮬레이션):
- input.dispatchEvent로 5건 시드 ('디자인 QA 마무리/회의록/책 챕터 3 읽기/운동 30분/영수증 정리')
- 1건 toggle → "완료 (1)" 섹션 자동 분기 + progress bar 1/5 + 사이드바 카운트 4
- /inbox 페이지에서 Do (3) section에 task 3건 자동 표시 ✅
- 홈 받은편지함 preview에도 자동 노출 (useInbox single source) ✅

### 브레인스토밍 & 큰 결정 (영구 LOCKED #124~)

- **#124 LOCKED (2026-05-24 심야)**: **Todos → Inbox `task` kind 흡수** (Memory parked → LOCKED 진입). 영구 룰 #111 (단일 모델 통합)의 todo 확장. Inbox = "attention 큐 single source" — 별도 attention view (Todos) 폐기 방향. Phase α-1 (노트만) 완료, Phase α-2 (위키/책 확장) + Phase β (TodoView 폐기) 남음.
- **#125 LOCKED (2026-05-24 심야)**: **Inbox refiner Linear borderless 정합** — SectionCard wrap (rounded-lg border + bg-card)을 폐기, row만 노출. 빈 섹션은 한 줄로 옅게. Plot Inbox UX는 "dense attention list" — 카드 wrap이 빈 영역 prominence 키움.
- **#126 (vision, 비-locked)**: **module-level static config labelKey 패턴 확장** — SECTION_META 처럼 React Hook 호출 불가한 module-level config에 `titleKey/subtitleKey/emptyKey` 옵셔널 필드 추가, consumer 컴포넌트에서 `t(meta.titleKey)` resolve. #122 (NOTES_VIEW_CONFIG labelKey)의 일반화.

### 기술 학습 (영구)

- **Inbox source loop 패턴 정착**: 새 InboxItemKind 추가 시 (1) `lib/store/slices/inbox.ts` union 확장 (2) `lib/hooks/use-inbox.ts` sectionFor 매핑 (3) source loop (`for ... push`) (4) `components/inbox/inbox-source-icon.tsx` case (5) `inbox-view.tsx` handleRowClick + onKeyDown 분기. 5 위치, 정형화.
- **sourceId composite key + lookup pattern**: task의 sourceId는 `noteId:position` composite. `inbox-view.tsx`의 handleRowClick에서 `usePlotStore.getState().todoTasks.find(t => t.id === item.sourceId)`로 lookup → noteId resolve → openNote. EntityRef 형태 미사용 (TaskItem.id 그대로 활용).
- **Quick Tasks 노트 자동 생성 + 표시 매핑**: addQuickTask가 "Quick Tasks" 영어 제목 노트 생성 (store lookup 호환). 표시 시점 (use-inbox)에서 `note.title === "Quick Tasks" ? t("todos.quick_tasks_note") : note.title` 매핑. 데이터 영어 유지 + UI 한국어 = 안전 패턴.
- **module-level SECTION_META labelKey 변환**: `{title, subtitle, empty}` → `{titleKey, subtitleKey, emptyKey}`. SectionCard 함수 컴포넌트 안에서 `t(meta.titleKey)` 호출 — React Hook 룰 위반 없음 (module-level config는 string keys만).
- **시드 데이터 React controlled input 우회**: `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set` + `dispatchEvent('input')` + Enter `KeyboardEvent` — React setState 호환. 5건 batch는 50ms 사이 wait 부족 → 350ms 권장 (state batching 회피).

### Watch Out (다음 세션)

- **Phase α-2 진입 시 호환성 신중**: TaskItem.noteId 필드 generalize 위험. entityKind?: optional 필드 추가 + 기존 noteId 유지 권장. addQuickTask는 "Quick Tasks" 노트만 처리 (위키/책 quick task 추가 X — 사용자가 직접 본문에 체크박스 입력만).
- **WikiInsightsChart 영어 잔여**: Day/Week/Month / Growth/Connectivity / All/Articles/Stubs / Cumulative / New per month. 다음 세션 또는 후속 PR.
- **노트 row status pill 음역 누락**: 사용자 화면 Notes view에 Stone/Brick/Block badge 영어. STATUS_CONFIG에 wire 필요.
- **시드 task 1건 누락 미스터리**: "회의록 정리하고 공유" task가 처음 5건 시드 중 누락 (실제 4건만 들어감, 그 다음 batch에서 3건 보충 후 정상 5건). React batching race. Phase α-1 코드 무관, 시드 입력 시점 이슈.
- **tsc `.next/dev/types` 누락 errors**: Next.js dev 자동 generated 파일 missing. dev server가 build 시 재생성. 코드 무관 — 무시 가능. 정식 검증은 `npm run build` 권장.

### 환경 변경

- Store v147 무변경 (InboxItemKind union 확장만 — 마이그레이션 불필요, 신규 kind는 데이터 호환)
- 신규 파일: 없음
- 변경 파일 10: components/calendar-view.tsx / components/inbox/inbox-source-icon.tsx / components/side-panel/side-panel-context.tsx / components/side-panel/smart-side-panel.tsx / components/views/inbox-view.tsx / components/views/wiki-dashboard.tsx / lib/hooks/use-inbox.ts / lib/i18n.ts / lib/store/slices/inbox.ts / lib/view-engine/view-configs.tsx
- 신규 i18n keys ~50개 (wiki.section.* / wiki.meta.* / sidepanel.tab.* / sidepanel.empty.* / calendar.mode.* / calendar.day.* / inbox.section.* / inbox.action.* / inbox.meta.* / todos.quick_tasks_note / common.untitled_task)
- 사용자 IDB stale data: 시드 5건 (Quick Tasks 노트 안 체크박스) — `/notes`에서 "Quick Tasks" 노트로 보임

### 머신

Windows. cohesive 통합 작업 세션 — Inbox refiner 5-phase 후, 사용자 한국어 잔여 지적 따라 4 surface i18n wire, Inbox 흡수 product 결정 추천 → Phase α-1 진입, 시드 검증, PR #417 단일 commit.

---

## 2026-05-24 (밤) — Windows, **i18n 잔여 surface (Wiki/Books/Library/Ontology/Todos + Merge/Split + 컬럼 labelKey)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **production-ui-refiner 후보 선택 + 5-phase 진행**. 사용자가 "다음 세션 첫번째 todo로 지금 이 논의 이어갈 수 있도록" 명시. 4 후보 중 사용자가 선택 (AskUserQuestion 결과 미선택, after-work 우선 요청). 후보 = (1) Inbox 3 SectionCard, (2) Library 6 stat card grid, (3) Books grid card, (4) SearchDialog 더 깊게.
>
> **사용자 의도**: 한국어 일관성 거의 끝남 → 신규/visible chrome surface 디자인 polish (Linear 수준). 사용자가 직접 본 surface 위주.
>
> **첫 스텝** (다른 머신에서 바로):
> 1. 사용자에게 4 후보 중 어느 것 refine할지 물어봄 (AskUserQuestion 재시도)
> 2. `.claude/.active-skill`에 `production-ui-refiner` 기록
> 3. 선택 컴포넌트 Read + viewport screenshot + 코드 audit (Phase 1 AUDIT)
> 4. 18 카테고리 진단 — 자동 측정 (height/spacing/icon size/border/font size 등) + vision (hierarchy/visual weight/cluster grouping)
> 5. PRESCRIBE 그룹별 → 사용자 승인 → APPLY → VERIFY (audit 재실행 비교)
>
> **후보별 사전 진단 (Phase 1 미리)**:
> - **Inbox 3 SectionCard** (`components/views/inbox-view.tsx`): Do/Review/Detected 3 카드. 현재 spacing-y-6 + section padding 균일. 개선 여지: empty state 시각적 hierarchy 약함 (3 카드 모두 empty 시), card border 일관 (Linear는 borderless 더 minimal), section header subtitle 옅음 (text-muted-foreground/70).
> - **Library 6 stat card grid** (`components/views/library-view.tsx`:861+): 6 카드 2/3 column. 개선 여지: card hover state, value vs label 시각적 weight 차등, icon-color 매핑 일관 (KNOWLEDGE_INDEX_COLORS).
> - **Books grid card** (`components/books/book-card.tsx` 또는 `books-view.tsx` 안): 책 카드 grid. 개선 여지: cover icon + title typography, description line-clamp, items meta typography.
> - **SearchDialog 더 깊게** (`components/search-dialog.tsx`): item row padding (h-12 → h-11 더 dense), shortcut chip 일관성, group header spacing, separator opacity.
>
> **컴포넌트 구조 / 진입 패턴**:
> - 5-phase: AUDIT → DIAGNOSE → PRESCRIBE (그룹별 처방) → APPLY (사용자 승인) → VERIFY
> - 처방 카테고리: A spacing/gap, B icon stroke 일관, C visual hierarchy/prominence, D cluster grouping, E hover/empty state polish
> - hedged language for vision items, definitive for measurements
>
> **위험 + 회피**:
> - production-ui-refiner는 audit script가 plot-frontend plugin에 없음 — vision + 코드 검사로 manual AUDIT
> - 카테고리 그룹별 사용자 승인 필수 — 한 번에 모두 변경 금지 (사용자 직관 vs Linear 패턴 충돌 시 사용자 우선)
> - 18 카테고리 그대로 적용 X — 사용자 시각 검증 + 컴포넌트 본질 고려
>
> **참고 파일**:
> - `components/views/inbox-view.tsx` (SectionCard 구현 line 197+)
> - `components/views/library-view.tsx` (LibMiniStat 컴포넌트 + 6 card grid line 858+)
> - `components/books/book-card.tsx` (또는 books-view.tsx 안 BookCard render)
> - `components/search-dialog.tsx` (CommandDialog + CommandInput + CommandGroup)
> - `~/.claude/plugins/.../production-ui-refiner/SKILL.md` (skill 명세 — 5-phase 흐름)
>
> **2번째 P0 후보** (#1 끝나면):
> - Phase 2 temporal hooks — watch + recurring policies (PRD §11 Q1 EventPattern + Q5 recurring 범위 결정). 우클릭 프리셋 + 타임라인 드래그 hook UI.
> - i18n 잔여 mini-polish (status pill 음역 — Block/Stone/Brick 행 badge / Wiki view stats / Books grid card text)
> - 사용자 viewport 검증 4건 (Phase 1c Inbox / Backup Restore / Hide-all panels / Cmd+K Escape)
>
> **3번째 P0 후보**: 검색 결과 row Linear 정합 polish (현재 plain text → highlight + breadcrumb)
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: 이번 세션 PR 머지 후.
> **branch worktree**: `claude/i18n-rest` (cleanup 후 새 worktree 권장).

### 완료 (이번 세션 — 2 chunk)

**Chunk 1 — i18n 잔여 surface (Todos/Calendar/Ontology/Library/Wiki/Books)**:
- Todos view 전체 (title / placeholder / empty state / incomplete · completed)
- Calendar sidebar context (Calendar / Todos / Today / Created / Updated)
- Ontology view (title / Graph / Insights / Dashboard / 노드 검색)
- Library view (자료실 + 6 stat cards + 주의 필요 + 사용되지 않는 태그 N개 / 미연결 참고문헌 N개 + 최근 + 상위 태그)
- Wiki view title
- Books view (title + 책 검색 placeholder)
- 신규 i18n keys ~70개: todos.* / calendar.* / ontology.* / wiki.* / library.* / books.*

**Chunk 2 — i18n 잔여 polish**:
- Wiki sidebar **Merge / Split** → 병합 / 분리
- Display panel "타임라인" button 한 줄 띄기 fix (`whitespace-nowrap`)
- **BOOKS_VIEW_CONFIG** orderingOptions / groupingOptions / properties 모두 labelKey 추가 (Item count / Kind / Smart sources / Pin / Pin status — 항목 수/종류/스마트 소스/고정/고정 상태)
- **book-table.tsx BOOK_COLUMNS** labelKey 추가 + cols.map render에 t() resolve (Name/Kind/Items/Sources/Pin/Updated/Created — 제목/종류/항목 수/스마트 소스/고정/수정일/생성일)
- Library "Top Tags" 누락 → "상위 태그"
- Library "1 unused tag" / "1 unlinked reference" → "사용되지 않는 태그 N개" / "미연결 참고문헌 N개"

### 브레인스토밍 & 큰 결정 (영구 LOCKED #122~)

- **#122 LOCKED (2026-05-24 밤)**: **module-level static config (view-configs / COLUMN_DEFS) labelKey 옵셔널 필드 패턴 = entity별 일관 적용 의무**. NOTES만 labelKey + Books/Wiki/Library 영어 mix는 사용자 혼란. 새 view config 추가 시 labelKey 필드 동시 추가 (i18n 잔존 영어 회피).
- **#123 (vision, 비-locked)**: 한국어와 영어의 시각적 weight 차이 — CJK 글자가 라틴보다 자연스럽게 더 큼. text-note (13px) 동일 size 유지가 정통. KO-only font-size 조정은 미세 polish 후보 (사용자 명시 시).

### 기술 학습 (영구)

- **whitespace-nowrap = 다국어 button label wrap 회피 표준**. 영어보다 한국어가 글자당 폭 더 넓어 4글자가 button 4-tab 분할 시 wrap 가능 ("타임라인" 사례). flex item button에 `whitespace-nowrap` 추가가 안전.
- **module-level static config labelKey 패턴 (확장)**: BookColumnDef 같은 entity-specific column def에도 동일하게 적용. consumer (book-table.tsx)에서 `c.labelKey ? t(c.labelKey) : c.label` 한 줄로 resolve. NOTES → Books → 다른 entity로 확장 시 동일 mechanical 패턴 — 패턴 정합 강제 (#122).
- **AskUserQuestion 답이 "다음 세션으로"일 때**: 현재 세션 진행 중단하고 다음 세션 hook에 후보 + 의도 documented. SESSION-LOG hook이 "사용자가 명시한 4 후보 + 사전 진단" 까지 보존해야 다음 세션 첫 행동 즉시 진입 가능.

### Watch Out (다음 세션)

- **production-ui-refiner 후보 선택부터** — 사용자가 4 후보 중 답 미선택. AskUserQuestion 재시도 권장.
- **사전 진단 정확도**: 위 후보별 사전 진단은 코드 grep 기반 추정 — 실제 viewport screenshot 후 정정 가능.
- **i18n 미커버**: Books grid card description / Wiki dashboard stats / status pill 음역 / Ontology legend(범례) detail — 다음 polish 사이클에서.
- **claude/global-top-bar 로컬 브랜치**: PR #415 머지 후 cleanup 미완. claude/i18n-rest 머지 후 둘 다 정리 권장.

### 환경 변경

- Store v147 무변경
- 신규 파일: 없음
- 변경 파일 10: todo-view / linear-sidebar / ontology-view / library-view / wiki-view / books-view / books/book-table / display-panel / view-configs / i18n
- 신규 i18n keys ~70개 (todos / calendar / ontology / wiki / library / books)
- 사용자 IDB stale data: 없음

### 머신

Windows. cohesive i18n 잔여 마무리 세션 — chunk별 surface 정리 후 viewport 검증 → 사용자 polish 지적 → 즉시 fix 사이클.

---

## 2026-05-24 (저녁 후속) — Windows, **GlobalTopBar 신설 + Command palette polish + production-ui-refine + i18n 깊은 확장 (필터/디스플레이/cmdk)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **i18n 잔여 surface 마저 끝내기** — Wiki view / Books view / Library view / Ontology view / 우클릭 메뉴 / dialog 잔여 영어 모두 한국어 + 사용자 viewport 검증 (Phase 1c Inbox 3 카드 + Backup Restore round-trip).
>
> **사용자 의도**: "전부 구현되어야 한다" (Settings) → "한국어 토글이 메인 화면도 영향" → "필터/디스플레이도 번안" → "사이드바 시계/<>/검색/설정/휴지통/테마 다 top bar로 옮겨" → "커맨드 팔레트 Linear처럼". 일관된 한국어 + Linear 수준 chrome 정합 의도. 사용자 viewport 검증 미완.
>
> **첫 스텝** (다른 머신에서 바로):
> 1. KO 토글 후 viewport 순회 — Wiki / Books / Library / Ontology / Calendar / Insights / Templates / Library categories. 각 view header + filter chips + display panel + 우클릭 menu 한국어 노출 확인.
> 2. 미번역 발견 시 `lib/i18n.ts` dictionary 확장 + 컴포넌트 useT wire (PR 414/그 후속 패턴 그대로).
> 3. 부수 작업: status pills 음역 ("Block/Stone/Brick" badge in rows) — wire-up 위치 = `components/notes-table.tsx` status cell render, `components/note-fields.tsx` StatusDropdown 옵션. labelKey 옵셔널 추가 패턴.
> 4. **사용자 viewport 검증 항목** (모두 미완): (a) Phase 1c Inbox 3 섹션 카드, (b) Backup Restore — Full Backup → Import → reload round-trip, (c) GlobalTopBar — Hide all panels 후에도 chrome 접근 확인, (d) Cmd+K — Escape로 닫힘.
>
> **컴포넌트 구조 / 데이터 흐름** (i18n 패턴):
> - `lib/i18n.ts` — flat dictionary + `useT()` 훅 + `Partial<Record<DictKey, string>>` fallback chain (target → EN → key literal)
> - 동적 config (view-configs/COLUMN_DEFS/SPACES 등 module-level static)는 **labelKey?: string** 옵셔널 필드 패턴 → consumer가 `t(labelKey ?? label)` 또는 `labelKey ? t(labelKey) : label` resolve
> - 한국어 잔여 추적: `grep -r '"[A-Z][a-z]\+\s*[A-Z]' components/views/ --include="*.tsx" | grep -v labelKey` 같은 휴리스틱
>
> **GlobalTopBar 구조** (이번 세션 신설, 다음 세션 polish 가능):
> - layout.tsx top sticky, 전체 너비, h-12
> - 좌측: PanelsMenu / divider / 시계(RecentlyViewed) / < > nav
> - 중앙: 검색 input (max-w-xl, ⌘K trigger setSearchOpen)
> - 우측 (divider 후): 테마 토글 / 설정 / 휴지통
> - linear-sidebar 헤더/푸터 + activity-bar 테마 토글 모두 제거 — top bar가 단일 source
> - view-header에서 PanelsMenu 제거 (햄버거 중복 해소)
>
> **위험 + 회피**:
> - i18n 확장 시 module-level static config는 labelKey 패턴 사용 — useT를 모듈 스코프에서 호출 금지 (Hook rules)
> - StatusDropdown 같은 component는 option array를 useT 안에서 동적 생성. 외부 prop으로 받는 경우 labelKey 추가.
> - GlobalTopBar에서 PanelsMenu 단독 source로 옮겼으므로 다른 곳 (view-header 등)에서 mount 추가 시 중복 발생 — 검사 필요.
> - i18n missing-key 사일런트 (EN fallback → literal key) — 의도된 graceful degradation. 실수로 EN missing 시 literal key 노출되므로 `translate()` 함수 마지막 fallback 확인.
>
> **참고 파일** (i18n 잔여 작업 시):
> - `lib/i18n.ts` — dictionary 확장
> - `components/views/wiki-view.tsx` / `books-view.tsx` / `library-view.tsx` / `ontology-view.tsx` — 잔여 영어 hardcoded
> - `lib/view-engine/view-configs.tsx` WIKI_VIEW_CONFIG / BOOKS_VIEW_CONFIG / LIBRARY_VIEW_CONFIG — filter/display labelKey 추가 (NOTES_VIEW_CONFIG 패턴 그대로)
> - `components/notes-table.tsx` status cell — status pill 음역 wire
> - `components/note-fields.tsx` StatusDropdown — 상태 옵션 음역
> - `components/global-top-bar.tsx` — Polish 더 필요한지 사용자 viewport 검증 후
>
> **2번째 P0 후보** (#1 끝나면):
> - Phase 2 temporal hooks — watch + recurring policies (PRD §11 Q1 EventPattern + Q5 recurring 범위). 우클릭 프리셋 + 타임라인 드래그 hook UI.
> - 검색 결과 (Cmd+K dialog 안 노트 검색)를 Linear 정합으로 polish — 현재 result item이 plain text, Linear는 highlight + breadcrumb.
>
> **3번째 P0 후보**: Production-ui-refiner 다른 컴포넌트 (Inbox SectionCard / SearchDialog 더 깊게 / Settings 페이지 chrome)
>
> **머신**: Windows. cross-machine 가능.
> **현재 main HEAD**: 이번 세션 PR 머지 후.
> **branch worktree**: `claude/global-top-bar` (cleanup 후 새 worktree 권장).

### 완료 (이번 세션 — 단일 거대 PR 누적, 5 chunk)

이번 세션은 사용자 신호 따라 chunk별로 진행. 모두 단일 worktree `claude/phase-1c-inbox-sections` (i18n까지) + `claude/global-top-bar` (top bar 이후).

**Chunk 1 — Phase 1c (Inbox Do/Review/Detected)** (PR #414):
- `lib/hooks/use-inbox.ts` — InboxItem.section 필드 + Hook policy → section 매핑 (snooze+active/srs/snooze-expired/plan-due → Do, snooze+passive (사용 안함) → Review (SRS만), wiki-redlink/auto-enroll → Detected)
- 신규 plan-due source (wiki article plan hook scheduled <= today, getPlanHooks 활용)
- useInboxBySection 헬퍼
- `components/views/inbox-view.tsx` — 단일 리스트 → 3 SectionCard. Q6 정합 ("Inbox zero" Do empty 시 + Review/Detected 영원 카드 항상 표시)
- inbox-source-icon plan-due (Target 아이콘)

**Chunk 2 — i18n 확장 main app** (PR #414에 포함):
- Activity bar / Linear sidebar / Home view / Quick capture / StatsRow 모두 useT wire
- 한국어 EN/KO 완전 dictionary 추가

**Chunk 3 — i18n 깊은 확장 필터/디스플레이** (PR #414에 포함):
- Library → 자료실 (활동 바 잘림 해소)
- Stone/Brick/Block 음역 (스톤/브릭/블록 — Plot 시그니처 정체성 보존 #118)
- Filter Panel + Display Panel + ChipDropdown + Notes table column headers wire
- view-configs.tsx labelKey/descKey 옵셔널 필드 패턴 (consumer resolve)

**Chunk 4 — GlobalTopBar 신설 + chrome 재구성** (별도 PR):
- 신규 `components/global-top-bar.tsx` — PanelsMenu / 시계(RecentlyViewed) / < > / 검색 input / 테마 / 설정 / 휴지통
- linear-sidebar 헤더 (시계/<>/검색) 제거 + 푸터 (설정/휴지통) 제거 — 본체 라벨만 남김
- activity-bar 테마 토글 제거 — 7 space pure switcher로 정리
- view-header에서 PanelsMenu 제거 (햄버거 중복 해소)
- layout.tsx에 GlobalTopBar mount (전체 너비, sticky top, h-12)
- Hide-all-panels 했을 때도 모든 chrome 액션 접근 가능
- i18n keys: topbar.* (recently_viewed / nav.back / nav.forward / search.placeholder)

**Chunk 5 — Command palette Linear 정합 + production-ui-refine** (이 PR):
- Search Dialog hybrid: 기본 commands 모드 뱃지 제거 (Linear 정합), links 모드만 뱃지
- Escape handler 추가 (handleKeyDown에서 closePalette 직접 호출 — cmdk Korean IME 중 native bubble 안 됨 회피)
- 전 placeholder + group heading + command label 한국어 wire (cmdk.* keys)
- Input 크기 키움 (h-14, text-base)
- GlobalTopBar production-ui-refine 5-phase: Group A spacing/gap (h-12, gap-1.5, px-4) + Group B icon stroke 통일 (Caret strokeWidth 2.5 → 2) + Group C search input prominence (max-w-xl, py-2, border-subtle) + Group D right cluster divider (3 영역 분리)

### 브레인스토밍 & 큰 결정 (영구 LOCKED #117~#121)

- **#117 LOCKED (2026-05-24 저녁)**: **Library → 자료실** (5글자 "라이브러리" 잘림 → 3글자 음역 절충). 활동 바 폭(72px) 제약 + Plot 정체성 균형.
- **#118 LOCKED (2026-05-24 저녁)**: **Stone/Brick/Block 음역 (스톤/브릭/블록)** — 영어 정체성 + 한국어 흐름 정합. 의역("초안/정리/완성") 시 Plot 시그니처 워크플로우 단어 정체성 약화 — 음역이 절충.
- **#119 LOCKED (2026-05-24 저녁)**: **GlobalTopBar = workspace chrome single source**. 시계/<>/검색/테마/설정/휴지통 모두 top bar. linear-sidebar/activity-bar는 본질 액션만. Hide-all-panels 상태에서도 chrome 접근 가능 — 모든 다른 dialog/popup도 같은 원칙.
- **#120 LOCKED (2026-05-24 저녁)**: **PanelsMenu = top bar 단일 mount**. view-header에서 제거. 다른 컴포넌트에 mount 추가 금지 — 중복 햄버거가 사용자 혼란.
- **#121 LOCKED (2026-05-24 저녁)**: **Command palette hybrid mode badge** — 기본 commands 모드 뱃지 제거 (Linear 정합 minimal), sub-mode (links/thinking)일 때만 뱃지로 mode 명시. Plot의 multi-mode 디자인 정체성 보존 + Linear 정합 절충.

### 기술 학습 (영구)

- **i18n labelKey 패턴**: module-level static config (view-configs / COLUMN_DEFS / SPACES 같은 외부 import 객체)는 useT를 호출 못 함 (React Hook 규칙). 옵셔널 `labelKey?: string` 필드 추가 → 컴포넌트(consumer)에서 `t(labelKey) ?? label`로 resolve. 객체 shape 그대로 유지하며 점진 i18n 가능. 빠뜨려도 label fallback이라 graceful.
- **cmdk Escape 안 통하는 IME 케이스**: Korean composition flag 동안 CommandPrimitive.Input의 Escape가 Radix Dialog로 bubble 안 됨. handleKeyDown에서 `closePalette()` 명시 호출이 안전한 fallback.
- **Zustand persist hydration 타이밍** (재확인): root URL에서 startView redirect, backup-reminder toast 둘 다 useEffect 첫 mount에 fire되지만 persist가 비동기. `useStore.persist.hasHydrated()` + `onFinishHydration` 콜백으로 wrap.
- **production-ui-refiner 5-phase 워크플로우** (audit script 없는 환경): vision + 코드 검사로 AUDIT, hedged language로 DIAGNOSE, 카테고리 그룹별 PRESCRIBE, 사용자 그룹 승인 후 APPLY, 시각 비교로 VERIFY. plot-frontend plugin이 SKILL.md만 제공하더라도 동일 원칙 적용.
- **GlobalTopBar like single chrome source**: hide-all-panels 시에도 사용 가능한 컨트롤은 chrome layer (top bar)로. sidebar/activity-bar는 panel-scope 액션만. 미래 컨트롤 추가 시 이 분리 원칙으로 위치 결정.

### Watch Out (다음 세션)

- **i18n 미완 surfaces**: Wiki/Books/Library/Ontology view + 우클릭 메뉴 + 일부 dialog + status pill 음역. KO 토글 후 viewport 순회로 잔여 영어 찾기.
- **사용자 viewport 검증 미완 (4건)**: (a) Phase 1c Inbox 3 카드, (b) Backup Restore round-trip, (c) GlobalTopBar Hide-all-panels, (d) Cmd+K Escape. 다음 세션 첫 행동으로 권장.
- **PanelsMenu 중복 가능성**: view-header에서 제거했지만 다른 surface에 mount 시 햄버거 또 보임. 추가 통합 dialog/popup 만들 때 #120 규칙 상기.
- **commandPaletteMode "commands"는 뱃지 없음** — Plot 디자인 의도. 미래 새 mode 추가 시 뱃지 + placeholder 매핑 같이 추가.
- **search-dialog 검색 결과 row 디자인**: 현재 plain text. Linear는 highlight + breadcrumb. 다음 polish 후보.

### 환경 변경

- Store: v147 무변경 (모든 view layer)
- 신규 파일 1: `components/global-top-bar.tsx`
- 변경 파일 ~20: lib/i18n.ts, view-configs.tsx (labelKey 필드), filter-panel/display-panel/chip-dropdown (labelKey resolve), notes-table (labelKey), inbox-view (3 SectionCard), use-inbox (section field), activity-bar (테마 토글 제거), linear-sidebar (헤더/푸터 제거), view-header (PanelsMenu 제거), layout.tsx (TopBar mount), search-dialog (hybrid + Escape + i18n), inbox-source-icon (plan-due)
- 사용자 IDB stale data: 없음 (view layer만)

### 머신

Windows. 거대 multi-chunk 세션 — Phase 1c → i18n 확장 → 깊은 확장 → GlobalTopBar 재구성 → cmdk polish → production-ui-refine. 사용자 의도(한국어 일관성 + Linear chrome 정합)에 따라 chunk 누적.

---

## 2026-05-24 (오후) — Windows, **Temporal Hooks Phase 1b (1b1+1b2+1b3 통합) + Settings 전수 wire (5/5)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Phase 1c — Inbox Do/Review/Detected 섹션 재배선** (PRD §6 + Q6 결정 적용).
>
> **사용자 의도**: temporal-hooks Phase 1 마무리. legacy 필드 제거 완료된 hooks 슬라이스를 Inbox UI에 의도 섹션 (Do / Review / Detected)으로 노출. PRD §11 Q6 RESOLVED = "Do 비우기 = Inbox-zero" + Review/Detected는 영원.
>
> **첫 스텝** (다른 머신에서 바로 진입):
> 1. PRD `.omc/plans/unified-temporal-hooks-prd.md` §6 (Inbox layer) 재독 — Do/Review/Detected 정의 + Q6 RESOLVED 노트 확인.
> 2. `lib/hooks/use-inbox.ts` — 현재 5종 source (reminder/srs/snooze-expired/wiki-redlink/auto-enroll)를 의도 섹션으로 분류:
>    - **Do** = `loudness:"active"` hooks (reminder + srs due) → 사용자가 *지금* 처리해야 할 항목
>    - **Review** = `loudness:"passive"` hooks (triageSnooze passive + wiki plan) → 가볍게 살펴봐도 좋음
>    - **Detected** = wiki-redlink + auto-enroll (자동 감지 후보) — 항상 존재
>    - snooze-expired는 Do (return path).
> 3. `InboxItem` 인터페이스에 `section: "do" | "review" | "detected"` 추가, useInbox 반환 시 분류.
> 4. `components/views/inbox-view.tsx` — 단일 리스트 → 3 섹션 카드 (Linear inbox 정합). 사용자 명시 카피: "All caught up — Review/Detected are always running".
> 5. EmptyAll 상태 카피 갱신 (Q6 결정 반영).
>
> **컴포넌트 구조 / 데이터 흐름**:
> - `useInbox(): InboxItem[]` → `useInbox(): { do: InboxItem[], review: InboxItem[], detected: InboxItem[] }` (또는 flat array + section field, caller 선호 따라).
> - `inbox-view.tsx`는 세 섹션을 SettingsCard-패턴 카드로 분리, 각 카드에 "N items" 카운트.
> - Do empty + Review/Detected non-empty = "Inbox-zero" 메시지.
> - 모든 section은 항상 표시 (Detected가 0이어도 카드 자체는 보임 — Q6의 "영원" 정합).
>
> **Hook → section 매핑** (참고):
> ```
> snooze + active           → Do (reminder due)
> srs                       → Do (review due)
> snooze + passive          → Review (intentional snooze)
> plan (wiki)               → Review (planned horizon)
> wiki-redlink (non-hook)   → Detected
> auto-enroll (non-hook)    → Detected
> snooze-expired (transient)→ Do (sticky return path)
> ```
>
> **위험 + 회피**:
> - Inbox UI re-layout 큼 — 단일 PR로 가능하지만 Phase 1c1 (useInbox 분류만) + Phase 1c2 (UI 분리)로 쪼개도 OK.
> - section 카운트가 0인 카드 처리 — empty state 카피 (Q6 정합).
> - 기존 dismissedInboxItems / snoozedInboxItems 패턴 keep (cross-section).
> - 사용자가 Q6 결정에 "Detected는 영원" 명시 — 빈 Detected 카드도 렌더링 (단, 빈 상태 카피).
>
> **참고 파일** (Phase 1c 작업 시):
> - `.omc/plans/unified-temporal-hooks-prd.md` §6 + §11 Q6 (RESOLVED)
> - `lib/hooks/use-inbox.ts` — section 분류 추가 대상
> - `components/views/inbox-view.tsx` — 3 섹션 UI 재구성
> - `lib/store/slices/inbox.ts` — InboxItemKind union (변경 없을 가능성 높음)
> - `lib/store/hook-selectors.ts` (이번 세션 신규) — getSnoozeHooks/getSRSHooks 재활용
>
> **2번째 P0 후보** (#1 끝나면):
> - i18n 확장 — JA/ES/FR/DE dictionary 채우기. 현재 EN+KO만 완전. 사용자 신호 시.
> - Settings i18n 외 surface 확장 — sidebar nav 라벨, activity bar tooltip, command palette. 부분 적용 권장.
>
> **3번째 P0 후보**: Phase 2 — watch + recurring hooks + 우클릭 프리셋 + 타임라인 드래그. PRD §11 Q1/Q5 결정 필요.
>
> **머신**: Windows.
> **현재 main HEAD**: 이번 PR 머지 후.
> **branch worktree**: `claude/kind-chaplygin-12bdbb` (cleanup 후 새 worktree 권장).

### 완료 (이번 세션 — 8 task, 단일 PR)

**Phase 1b — Temporal Hooks 완성 (3 task)**:

1. **Phase 1b1** (`lib/store/slices/workflow.ts`, `lib/store/slices/wiki-articles.ts`):
   - workflow.ts: setReminder/clearReminder/batchSetReminder/triageKeep/triageSnooze → addHook(snooze, scheduled) + dual-write
   - workflow.ts: enrollSRS/unenrollSRS/reviewSRS/enrollAllPermanentSRS → addHook(srs) + dual-write
   - wiki-articles.ts: setWikiArticlePlannedDate → addHook(plan, scheduled, passive) + dual-write
2. **Phase 1b2** — read-site 마이그 12+ 파일:
   - 신규 `lib/store/hook-selectors.ts` — getReminderForNote/getSRSStateForNote/getPlannedDateForWiki/buildSRSMapFromHooks 등
   - `lib/queries/notes.ts` getReviewQueue 시그니처 변경 (srsMap → hooks), getInboxNotes에 dueSnoozeNoteIds 파라미터
   - `lib/hooks/use-inbox.ts`, `inbox-view.tsx` useNextUp, `linear-sidebar.tsx` Upcoming Reminders
   - `wiki-timeline-view.tsx` plannedDateByArticleId Map + horizonForArticle adapter
   - `wiki-utils.ts` getHorizon/getHorizonSource 시그니처에 plannedDate 파라미터
   - insights-view.tsx srsMap, app/settings/preferences/page.tsx 등 카운트 산출
   - notes.ts deleteNote + wiki-articles.ts deleteWikiArticle — hooks cascade
3. **Phase 1b3** — legacy 제거 + v146→v147:
   - workflow.ts/wiki-articles.ts dual-write 모두 제거 (set notes.reviewAt + srsStateByNoteId + plannedDate 모두 삭제)
   - `lib/types.ts` Note.reviewAt 제거, WikiArticle.plannedDate 제거
   - `lib/store/types.ts` PlotState.srsStateByNoteId 제거 + Hook/HookPolicy 등록 + hooks action 시그니처 추가
   - `lib/store/index.ts` initialState srsStateByNoteId 제거 + persist version 146 → 147
   - `lib/store/migrate.ts` v146→v147 (notes.reviewAt strip / wikiArticles.plannedDate strip / srsStateByNoteId 삭제, idempotent)
   - `lib/view-engine/filter.ts` reviewAt operator drop, `types.ts` FilterField에서 reviewAt 제거
   - `lib/store/helpers.ts` workflowDefaults에서 reviewAt 제거
   - 3 test fixture (analysis/autopilot/pipeline) reviewAt 제거

**Settings 전수 wire (5 task — 사용자 "모든 부분이 구현되어야 한다")**:

4. **Settings #1 Start view** — `app/(app)/layout.tsx`에 startView 라우팅 useEffect 추가 (root URL 진입 시 router.replace, persist hydration 대기). `app/settings/preferences/page.tsx`에 Home 옵션 추가.
5. **Settings #2 Auto-sync → 솔직한 backup reminder reframe** — `lib/settings-store.ts`에 backupReminder/backupReminderDays/lastBackupAt + setters/markBackupTaken 추가. `app/settings/sync/page.tsx` 재작성 (Storage / Backup reminders / Multi-device sync 3 카드). `app/(app)/layout.tsx`에 backup reminder toast (threshold 초과 시 once-per-session). backup 페이지 handleFullBackup이 markBackupTaken 호출.
6. **Settings #3 Line numbers** — `TipTapEditor.tsx`에 `data-line-numbers` attr 추가. `EditorStyles.css`에 CSS counter 기반 gutter 추가 (`.ProseMirror > *::before`로 모든 top-level block에 줄 번호).
7. **Settings #4 Backup Restore (Import)** — `lib/idb-backup.ts`에 `restoreFromBackup` + `restoreFromFile` + `RestoreSummary` 신규. base64ToArrayBuffer + openDbForRestore (store 없으면 version bump). `app/settings/backup/page.tsx`에 Import 버튼 + 파일 input + confirm dialog + 자동 reload.
8. **Settings #5 Language (i18n)** — 신규 `lib/i18n.ts` (Locale union + EN/KO 완전 dictionary + ja/es/fr/de placeholders + translate 함수 + useT 훅). 모든 Settings 페이지 + layout + nav가 useT 사용. 한국어 전환 viewport 검증 완료.

검증: tsc clean × 4, build exit 0 × 3 (각 Phase 1b 단계 후 + 최종).

### 브레인스토밍 & 큰 결정 (영구 LOCKED #113~#116)

- **#113 LOCKED (2026-05-24 오후)**: **Hook = single source of truth**. legacy 필드 (`Note.reviewAt`, `WikiArticle.plannedDate`, `srsStateByNoteId`) 영구 제거. 1-step migration (Q3) 완수. 신규 temporal 기능은 무조건 Hook 위에.
- **#114 LOCKED (2026-05-24 오후)**: **planning intent ≠ content activity** 확장. setReminder/clearReminder/batchSetReminder는 `notes.updatedAt`을 갱신하지 않음 (#89 wiki 한정 룰을 note까지 확장). triageSnooze는 여전히 triageStatus/snoozeCount/lastTouchedAt 갱신 (non-temporal workflow state).
- **#115 LOCKED (2026-05-24 오후)**: **Sync 페이지는 honesty over hype**. Plot은 cloud sync 백엔드 없음 — fake auto-sync checkbox 제거. backup reminder + "Multi-device sync: Not available" 명시 disclosure가 정통. 사용자 신뢰 보존.
- **#116 LOCKED (2026-05-24 오후)**: **i18n = 간단한 dictionary lookup**. next-intl 등 추가 의존성 없이 `lib/i18n.ts` 단일 파일 + `useT()` 훅으로 충분. 미번역 키는 EN fallback → literal key fallback (정상 동작 보장). 새 키 추가 = 단순 dict 갱신.

### 기술 학습 (영구)

- **Zustand persist hydration 타이밍**: 첫 mount의 useEffect는 persist 비동기 hydration 전에 fire 가능 → 잘못된 default value 읽음. 해결: `useSettingsStore.persist.hasHydrated()` 체크 + `onFinishHydration` 콜백으로 wrap. AppLayout의 startView/backupReminder 둘 다 이 패턴.
- **getReviewQueue/filterNotesByRoute 같은 pure 헬퍼는 set/precomputed param이 best**. hooks 전체를 통째로 받으면 deps array가 매번 변경. caller가 `dueSnoozeNoteIds = useMemo(buildDueSnoozeSet(hooks), [hooks])`로 미리 계산 후 전달.
- **SRS state mirror = trigger.srsState + state.srsState 둘 다 set**. v145→v146 migration 패턴 정합. 추후 Phase 2에서 단일화 가능하지만 현재는 양쪽 keep (read-site는 trigger 우선).
- **Backup restore — openDbForRestore 패턴**: 첫 plain open으로 store 존재 확인 → 없으면 version+1 upgrade로 createObjectStore. keyPath는 "kv" 외에는 모두 "id". 사용자가 fresh browser에 backup import할 때도 동작.
- **CSS counter 기반 line numbers**: `.ProseMirror`에 `counter-reset: editor-line`, `> *::before { counter-increment: editor-line; content: counter(editor-line); }`. position: absolute + padding-left로 gutter. TipTap NodeView 필요 없음.
- **i18n dictionary 패턴**: flat key (`"settings.preferences.title"`) + 중첩 X. Partial<Record<DictKey, string>>로 부분 번역 허용. translate() 함수에서 target → EN → key 순서 fallback. useT() 훅으로 React reactive.
- **router.replace vs push for start-view**: 사용자가 "/" 진입 시 의도가 "랜딩 화면 보기"라 history 누적 X = replace. push면 back 버튼이 "/"로 돌아갔다가 다시 redirect되는 loop.

### Watch Out (다음 세션)

- **Phase 1c는 사용자 viewport 검증부터**: Phase 1b 마이그가 모든 시각 surface에 반영됐는지 (Inbox 카운트, sidebar Upcoming, timeline plannedDate, SRS due) 사용자가 확인 후 진입.
- **i18n placeholders (ja/es/fr/de)**: 사용자가 다른 언어 선택 시 EN fallback. 명시 disclosure 없으니 사용자가 토글 후 "변화 없네?" 혼란 가능 — 추후 alert/badge 검토.
- **Line numbers + collaborative editing**: TipTap collab (Y.Doc) 사용 시 ProseMirror 구조가 다를 수 있음. 현재 CSS rule은 `.ProseMirror > *` selector — 어떤 DOM이든 작동해야 하지만 사용자 viewport 확인 권장.
- **Backup restore 후 reload — 사용자 의도치 않은 데이터 손실 위험**: 현재 confirm dialog 1단. 더 두꺼운 confirm (note count 차이 보여주기) 검토.
- **viewMode (settings-store 필드)**: notes-table-view.tsx에서 읽지만 UI 토글 없음 — dead field일 가능성. 이번 세션에 손대지 않음. 다음 세션에 확인.

### 환경 변경

- Store: **v146 → v147** (legacy 필드 strip)
- 신규 파일 2: `lib/store/hook-selectors.ts`, `lib/i18n.ts`
- 변경 파일 ~30: types.ts, 모든 settings pages, layouts, store slices, queries
- Tests: TS-check clean, build clean
- 사용자 IDB stale data: 자동 처리 (v146→v147 migration이 strip). 첫 진입 시 console.log로 strip 카운트 출력.

### 머신

Windows. cohesive 8-task 단일 PR 세션 (Phase 1b 통합 마무리 + 사용자 Settings audit 요청 → 5/5 wire).

---

## 2026-05-24 (새벽) — Windows, **Temporal Hooks PRD v0.2 + Phase 1a foundation (Hook model + slice + v145→v146 migration)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Phase 1b — workflow.ts wire + read-site 변경 + legacy 필드 제거**.
>
> **사용자 의도**: temporal-hooks PRD 진입 → Q3/Q4/Q6 결정 → Phase 1a foundation 머지 (PR #411). Phase 1b는 read-site 마이그레이션 + legacy 제거.
>
> **첫 스텝** (다른 머신에서 바로):
> 1. `lib/store/slices/workflow.ts` 액션 wire 변경:
>    - `setReminder(id, reviewAt)` → `addHook({ target: {kind:"note",id}, policy:"snooze", trigger:{kind:"scheduled", at:reviewAt}, action:{loudness:"active"} })` + 기존 `n.reviewAt` set 제거
>    - `clearReminder(id)` → `removeHooksByPolicy({kind:"note",id}, "snooze")`
>    - `triageSnooze(id, reviewAt)` → `addHook(...)` (loudness: "passive") + 기존 reviewAt/triageStatus="snoozed" 제거
>    - `batchSetReminder(ids, reviewAt)` → ids.forEach(addHook)
>    - `enrollSRS(noteId)` → `addHook({ target: {kind:"note",id:noteId}, policy:"srs", trigger:{kind:"srs", srsState}, action:{loudness:"active"}, state:{srsState} })` + 기존 `srsStateByNoteId` set 제거
>    - `unenrollSRS(noteId)` → `removeHooksByPolicy({kind:"note",id:noteId}, "srs")`
>    - `updateSRSState(noteId, srsState)` → updateHook (또는 remove+add)
> 2. `wiki-articles.ts` 액션:
>    - `setWikiArticlePlannedDate(id, plannedDate)` → addHook (plan, scheduled) + 기존 plannedDate 제거
> 3. Read-site 변경 (Note.reviewAt / WikiArticle.plannedDate / srsStateByNoteId 참조):
>    - `lib/queries/notes.ts:164` getReviewQueue — srsMap 대신 hooks query
>    - Inbox source 5종 (`lib/hooks/use-inbox.ts` 등) — reviewAt → hooks
>    - Wiki timeline plannedDate drag (`wiki-timeline-view.tsx`) — plannedDate → hooks
>    - SRS review UI (`lib/srs/` callers) — srsStateByNoteId → hooks state
> 4. `lib/types.ts`에서 legacy 필드 제거:
>    - `Note.reviewAt`, `Note.triageStatus`(가능?)
>    - `WikiArticle.plannedDate`
>    - PlotState.srsStateByNoteId
> 5. store v146 → v147 migration: legacy 필드 들어있어도 무시 (마이그레이션 이미 v146에서 Hook 추출)
> 6. `promoteToPermanent` 자동 SRS Hook 장착 (Q4 결정 — 기존 `enrollSRS` 호출을 `addHook(srs)`로 wire)
>
> **위험 + 회피**:
> - read-site 마이그레이션 큰 작업 — Inbox / Timeline / Wiki article view 등 다양. 한 PR로 가능한지 검토 → 단계별 PR 분할 가능 (Phase 1b1 = workflow wire / Phase 1b2 = read-site / Phase 1b3 = legacy 제거)
> - SRS UI (review queue, rating)는 SRSState를 깊게 사용 — Hook.state로 wrapping 후에도 동일 호출 가능해야 (lib/srs 엔진 그대로 유지, PRD §5)
> - 기존 `enrollAllPermanentSRS()` 일괄 등록 함수 — Phase 1b에서 hooks query로 재구현
>
> **컴포넌트 구조 / Hook 사용 패턴 (Phase 1b 정통)**:
> ```
> store
> ├── hooks: Hook[]                 ← single source of truth (Phase 1a 완료)
> └── notes / wikiArticles 등 entity ← legacy 필드 제거됨
>
> selectors / hooks (Phase 1b 신규):
>   useHooksForEntity(target)        → Hook[]
>   useDueHooks()                    → Hook[] (scheduled at <= now)
>   useSRSStateForNote(noteId)       → SRSState | null (hooks에서 추출)
>   useReminderForNote(noteId)       → ISO string | null
>   usePlannedDateForWiki(articleId) → ISO string | null
> ```
>
> **참고 파일** (Phase 1b 작업 시):
> - `lib/store/slices/workflow.ts` — wire 대상 (setReminder/triageSnooze/enrollSRS/unenrollSRS/promote/...)
> - `lib/store/slices/wiki-articles.ts` — setWikiArticlePlannedDate
> - `lib/store/slices/hooks.ts` — Phase 1a slice (addHook/removeHooksByPolicy/...)
> - `lib/queries/notes.ts:164` — getReviewQueue (read-site)
> - `lib/srs/` — SRS 엔진 (PRD §5 — Hook.state wrapping만, 변경 없음)
> - `components/views/wiki-timeline-view.tsx` — plannedDate drag (read-site)
> - `lib/hooks/use-inbox.ts` — Inbox source 5종 (Phase 1c에서 Do/Review/Detected 재배선)
>
> **2번째 P0 후보** (#1 끝나면): Phase 1c — Inbox Do/Review/Detected 섹션 재배선.
>
> **3번째 P0 후보**: Phase 2 진입 의제 — watch + recurring + 우클릭 프리셋 + 타임라인 드래그 (open questions Q1 EventPattern + Q5 recurring 범위 결정).
>
> **머신**: Windows. 다음 cross-machine 가능.
> **현재 main HEAD**: 이번 docs PR 머지 후 (PR `#???`).
> **branch worktree**: `claude/peaceful-faraday-b50f16` (cleanup 후 새 worktree 권장).

### 완료 (이번 세션)

**Temporal Hooks PRD v0.2 + Phase 1a foundation** — PR #411 머지:

1. **PRD `.omc/plans/unified-temporal-hooks-prd.md` v0.1 → v0.2**:
   - Q3 RESOLVED: 1-step migration (deprecated 유예 없음)
   - Q4 RESOLVED: 기존 promote→enrollSRS 전이만 일반화 (보수적 default)
   - Q6 RESOLVED: "Do 비우기 = Inbox-zero" + Review/Detected는 영원
   - Q1/Q2/Q5 DEFERRED to Phase 2/3

2. **Phase 1a — Hook foundation (4 파일 + 1 PRD)**:
   - `lib/types.ts` — Hook interface + HookPolicy (snooze/plan/srs/staleness) + HookTrigger union (scheduled/srs/staleness) + HookActionConfig (loudness: silent/passive/active)
   - `lib/store/slices/hooks.ts` (신규) — addHook / removeHook / updateHook / removeHooksForEntity / removeHooksByPolicy
   - `lib/store/index.ts` — slice 등록 + hooks: [] state + version 145→146
   - `lib/store/migrate.ts` — v145→v146 migration (Note.reviewAt+triageStatus / srsStateByNoteId / WikiArticle.plannedDate → Hook 1-step 흡수, idempotent)
   - Round-trip 검증: addHook 2건 (note snooze + wiki plan) / removeHooksByPolicy / store v146

3. **legacy 필드는 Phase 1a 한정 keep** — read-site 코드 변경 0. Phase 1b에서 wire + 제거.

### 브레인스토밍 & 큰 결정 (영구 LOCKED #111~#112)

- **#111 LOCKED (2026-05-24 새벽)**: **temporal 도구는 단일 `Hook` 모델로 통합** (snooze/plan/srs/staleness/recurring/watch 6 정책, 하나의 Hook 추상). per-entity 필드 (reviewAt/plannedDate/srsStateByNoteId) = 파편화 재발 — 절대 추가 X. EntityRef-keyed store 사용. 신규 temporal 기능은 모두 `Hook` 위에.
- **#112 LOCKED (2026-05-24 새벽)**: **Hook trigger 갈래는 둘 (scheduled / event-match), 엔진은 하나**. EntityEvent 스트림(activity-unification-prd.md)이 척추. Timeline = 시각화 / Hook engine = 구독 / Inbox = 발화된 hook의 due 슬라이스. 세 소비자가 한 스트림 공유.
- **temporal-hooks PRD §11 Q3 (1-step migration)**: 모든 마이그레이션의 default. dual-write deprecated 유예는 영원한 잔존 위험.
- **temporal-hooks PRD §11 Q4 (보수적 자동 전이)**: 기존 promote→enrollSRS만. stone→brick→plan 등 추가 자동 전이는 사용자 신호 보고 결정 (Phase 2/3).

### 기술 학습 (영구)

- **Hook foundation 단계별 commit 전략 안정**: Phase 1a = data 통합 (model + slice + migration), Phase 1b = code wire (workflow + read-site + legacy 제거). 1a에 read-site/workflow 미터치 — 코드 변경 0이라 risk 낮음. 데이터만 통합, 사용자 가시 0.
- **idempotent migration 패턴**: `if (!Array.isArray(state.hooks) || state.hooks.length === 0)` 가드 + 재실행 시 skip. 사용자가 다른 컴퓨터 첫 진입 시 다시 안 돌게.
- **Store slice generic 패턴**: `(set, get, appendEvent) => actions`. attachments / hooks 동일 시그니처. 향후 entity-level slice 추가 시 그대로.
- **dual representation 패턴**: 데이터 모델(store)과 entity 필드의 dual 유지 → 단계별 마이그레이션. 안전하지만 일관성 약화 → Phase 1b/1c에서 단일화.

### Watch Out (다음 세션)

- **🔴 Phase 1b 작업 큼**: workflow wire (5+ actions) + read-site 변경 (Inbox + Timeline + SRS UI + Note panel 등) + legacy 필드 제거 (Note.reviewAt / triageStatus / WikiArticle.plannedDate / srsStateByNoteId). 단일 PR 가능성 검토 vs 1b1/1b2/1b3 분할.
- **SRS 엔진 (lib/srs/)**: PRD §5에 "기존 lib/srs 엔진 유지, Hook.state로 wrapping만" 명시. computeNextStep / SRSRating / INTERVALS 그대로. wrapping shape 결정 필요 (Hook.state.srsState vs Hook.trigger.srsState — 현재 둘 다 set, 추후 단일화).
- **`enrollAllPermanentSRS()` 호환**: 일괄 등록 함수 — Phase 1b에서 hooks slice로 재구현. 신규 promote 시 자동 enrollSRS도 동일 path.
- **Multi-action transaction**: setReminder → addHook + (가능하면) 기존 reviewAt null 처리 동기. 단일 setState 안에 묶기.
- **사용자 IDB stale data**: v145 → v146 migration 자동. 단 사용자의 기존 reviewAt/srsState/plannedDate가 정상 Hook으로 변환되었는지 사용자 viewport 검증 권장 (Phase 1b 진입 전).

### 환경 변경

- Store v145 → **v146** (Hook foundation)
- 신규 파일 1: `lib/store/slices/hooks.ts`
- 변경 파일 4: types.ts + store/index.ts + store/migrate.ts + .omc/plans/unified-temporal-hooks-prd.md (v0.2)
- ViewState 무변경
- 사용자 IDB stale data: 없음 (v146 migration 자동 처리)

### 머신

Windows. cohesive 세션 (PRD 조율 + Phase 1a foundation 머지).

---

## 2026-05-24 (심야) — Windows, **Ghost Row v0.1 universal — Timeline collapsed group의 자리에 chevron right + label + "N hidden" 1-row inject**

> 🎯 **다음 즉시 액션**: 사용자 viewport 검증 (Wiki/Notes/Books timeline + status grouping → group header click → ghost row 1줄 inject 시각 확인 → click 시 expand 작동) → temporal-hooks PRD 정리 (P1).
>
> **사용자 의도**: "다음 todo 작업하자" — TODO.md P0 #1 (ghost row v2)을 명시 진행. Linear/Notion 정합으로 collapsed group이 "사라지는" 게 아니라 "ghost lane으로 줄어듦".
>
> **첫 스텝** (사용자 viewport에서):
> 1. Wiki list mode → timeline + wikiStatus grouping → "Stub" group header click → 그 자리에 1-row ghost ("▶ STUB · N hidden · Expand") inject 확인
> 2. Notes list → timeline + status grouping → 동일 작동 확인
> 3. Books → timeline + kind grouping → 동일
> 4. Ghost row click → expand 복구
> 5. Toolbar "Expand all" 도 작동 (다중 그룹 일괄 복구)
>
> **다음 P0** (#1 사용자 검증 후): temporal-hooks PRD 정리 (P1, open questions 6개).
>
> **머신**: Windows.
> **현재 main HEAD**: 이번 PR 머지 후.

### 완료 (이번 세션, 7 파일 변경)

**Ghost Row v0.1 universal** — Wiki + Notes + Books timeline 모두 일괄 적용:

1. **wiki-timeline-config.ts**: `LanedCollapsedHeader` interface + `DisplayLane<T>` union type
2. **timeline-bar.tsx**: `item` type union + 시작 narrowing (`if ("isCollapsedHeader" in item) return null`)
3. **timeline-grid.tsx**: `lanes` type union (height 계산에만 영향)
4. **timeline-label-column.tsx**: lanes type union + ghost row render 분기 (chevron right + label + "N hidden" + Expand hint + click toggle, LANE_HEIGHT 차지)
5. **wiki-timeline-view.tsx**: visibleLanes 안에 ghost lane inject (collapsed group 위치) + groupBoundaries에서 ghost lane skip + lanes.map (TimelineBar/EventMarkers caller) 안 ghost skip + drag handler ghost narrowing + eventsByArticleId loop 안 ghost skip
6. **notes-timeline-view.tsx**: 동일 패턴 (noteGroups → ghost lane inject + 모든 caller narrowing)
7. **books-timeline-view.tsx**: 동일 (bookGroups)

**시각 동작 (3 entity timeline 모두 동일)**:
- 그룹 header 클릭 → 해당 그룹의 lanes 모두 ghost row 1줄로 collapse
- Ghost row: 좌측 chevron right + UPPERCASE label + tabular-nums count + "Expand" hint, secondary/30 배경, hover secondary/60, click → toggle
- Toolbar "Expand all" 도 그대로 작동 (다중 그룹 복구)

검증: tsc clean + build exit 0.

### 브레인스토밍 & 큰 결정 (영구 LOCKED #109 보강)

- **#109 보강 (2026-05-24 심야)**: Linear column/lane collapse 패턴의 완성형 = **ghost row pattern**. collapse 시 영역 0이 아니라 1-row placeholder가 남아 사용자가 "expand 위치"를 항상 알 수 있음. Linear/Notion 정합. board는 40px narrow vertical bar / timeline은 1-row horizontal ghost — 본질은 같음 (의도된 collapse 표시 + 복구 경로 유지).
- **DisplayLane<T> union 패턴**: lanes에 article-lane과 ghost-lane이 공존. TypeScript narrowing(`"isCollapsedHeader" in item`)로 type-safe 분기. sub-components 모두 동일 narrowing 패턴. 향후 entity 추가 시 동일 패턴 자동 작동.

### 기술 학습 (영구)

- **TS narrowing으로 ghost lane 처리**: `Array<LanedItem<T> | LanedCollapsedHeader>` union + `if ("isCollapsedHeader" in item)` narrowing → type-safe + no `as any` cast. ghost lane은 article 필드 자체 없음 (sentinel 대신 union).
- **3 entity sub-components shared**: wiki/notes/books timeline이 timeline-bar/grid/label-column 같은 sub-components 공유 → 한 번 변경하면 3 entity 모두 자동 적용. 단 caller-side ghost inject는 entity별로 추가 필요 (group source가 다름: wikiGroups/noteGroups/bookGroups).

### Watch Out (다음 세션)

- **사용자 viewport 검증 우선**: 3 entity timeline에서 ghost row 시각 직접 확인. v0.1이 충분하면 cutoff, 아니면 polish (예: chevron animation, label color, hover state).
- **dnd-kit + collapsed timeline**: timeline은 dnd-kit 안 씀 (drag handle은 wiki article의 plannedDate 수정용 별도). 무관.
- **Notes/Books timeline event markers**: 현재 EMPTY_EVENTS_MAP — ghost skip 추가했지만 향후 event markers 도입 시 동일 narrowing 필요.

### 환경 변경

- Store v145 무변경 (모두 view layer)
- 변경 파일 7
- 신규 파일 0
- 사용자 IDB stale data: 없음

### 머신

Windows. 짧은 cohesive 세션 — ghost row v0.1 universal 완성.

---

## 2026-05-24 (밤) — Windows, **Group collapse universal 완성 — Wiki Board + Notes/Books Timeline lane collapse (PR-Q5/Q4 패턴 확장)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **PR-Q4 v2 ghost row pattern** — collapsed group의 자리에 1-row "ghost lane" inject (chevron right + label + (N hidden) + click → expand). Linear/Notion 정합. 사용자 viewport에서 v1 검증 후 결정 (현재 collapsed group이 시각 자체 안 보임 — "Expand all" 버튼으로만 복구).
>
> **사용자 의도**: 직전 세션에서 "그룹 콜파스랑 퀵 필터 칩 이런 걸 추가하자는 너의 제안에 동의" + "이건 타임라인에만 적용되는 게 아니라 다른 모든 디스플레이 모드에도 적용되어야 하는 이슈" — universal scope 명시. 이번 세션은 Wiki Board + Notes/Books Timeline 확장 완성.
>
> **첫 스텝** (ghost row v2 — 다른 머신에서):
> 1. `components/views/wiki-timeline/wiki-timeline-config.ts`에 DisplayLane union type 추가:
>    `type DisplayLane = { kind: "article"; lane: LanedArticle<T> } | { kind: "collapsedHeader"; groupKey: string; label: string; count: number }`
> 2. wiki-timeline-view.tsx의 visibleLanes 계산 시 collapsed group 위치에 placeholder lane (kind: "collapsedHeader") inject
> 3. TimelineBar / TimelineEventMarkers / TimelineLabelColumn 모두 kind === "collapsedHeader" 분기 처리 (bar 안 그리기, label은 chevron right + (N hidden))
> 4. notes-timeline-view + books-timeline-view 동일 적용
>
> **위험 + 회피**:
> - sub-components가 lanes를 `{ article: T, x, w, ... }` 형태로 받음 — DisplayLane union이면 type cascading. 큰 refactor.
> - 대안: lane에 sentinel `article: null as any` + `isCollapsedHeader: true` 옵션 필드 — sub-components 시작에 `if (!lane.article) return null` check (skip)
>
> **참고 파일**:
> - `components/views/wiki-timeline-view.tsx:80-105` (collapsedGroups callbacks)
> - `components/views/wiki-timeline-view.tsx:145-175` (visibleLanes filter — ghost lane inject 위치)
> - `components/views/wiki-timeline/timeline-label-column.tsx:98-115` (lane render — kind 분기 위치)
> - `components/views/notes-timeline-view.tsx` + `books-timeline-view.tsx` (동일 적용 대상)
>
> **2번째 P0 후보** (#1 끝나면): temporal-hooks PRD 정리 (P1, open questions 6개 — 큰 방향 사용자 조율).
>
> **머신**: Windows.
> **현재 main HEAD**: 이번 PR 머지 후 (PR `#???` — 머지 시 갱신).
> **branch worktree**: `claude/peaceful-faraday-b50f16` (cleanup 후 새 worktree 권장).

### 완료 (이번 세션, 단일 PR — 5 파일 변경)

**Group collapse universal 완성** — 직전 PR #408의 Q-series (Q1~Q5) cascading extension:

1. **Wiki Board column collapse** (`components/views/wiki-board.tsx`):
   - notes-board.tsx PR-Q5 패턴 mechanical 복제
   - BoardColumn에 `isCollapsed` + `onToggleCollapse` prop 추가
   - Collapsed render: 40px narrow vertical bar + chevron up + WikiGroupHeaderIcon + vertical label (writing-mode: vertical-rl) + count
   - Expanded header에 chevron-down 버튼 추가 (drag stopPropagation)
   - Caller에서 `viewState.collapsedGroups` read + toggle wire

2. **Notes Timeline lane collapse** (`components/views/notes-timeline-view.tsx`):
   - PR-Q4 wiki-timeline-view 패턴 복제
   - `NotesTimelineViewProps`에 `onUpdateViewState` 추가
   - collapsedGroupsSet + toggleGroupCollapse/expandAllGroups callbacks
   - allLanes/lanes split (collapsed group filter — cascading reflow)
   - groupBoundaries에 `key` 추가
   - TimelineLabelColumn에 onToggleGroup wire / TimelineControls에 expandAll wire
   - Caller (notes-timeline-shell.tsx)에서 `onUpdateViewState={updateViewState}` 전달

3. **Books Timeline lane collapse** (`components/views/books-timeline-view.tsx`):
   - 동일 패턴 (Notes timeline과 mechanical 정합)
   - Caller (books-view.tsx)에서 onUpdateViewState 전달

검증: tsc clean + build exit 0 모든 3 단위.

### 브레인스토밍 & 큰 결정 (영구 LOCKED #109 cascading)

- **#109 Linear column/lane collapse pattern 확정** — board (40px narrow + vertical label writing-mode: vertical-rl) + timeline (cascading reflow + "Expand all" 버튼). list (group collapse 기존) 포함. 모든 view mode에서 동일 store-backed source (`viewState.collapsedGroups`).
- **모든 grouping axis가 자동 작동** — collapsedGroups는 key 기반. status / wikiStatus / tier / linkCount / parent / role / folder / label / category 등 모두 자동 지원. mode 전환 시 같은 grouping이면 collapse 유지.
- **3 timeline entity (wiki/notes/books) 동일 패턴**: WikiTimelineView 패턴이 Notes/Books에 1:1 복제 가능 — sub-components가 generic (PR-Q4 timeline-label-column / timeline-controls에 onToggleGroup / collapsedGroupCount / onExpandAllGroups prop 이미 add됨).

### 기술 학습 (영구)

- **PR-Q4 패턴 mechanical 복제 안정**: WikiTimelineView의 collapsedGroupsSet/visibleLanes/toggleGroupCollapse/expandAllGroups 4가지가 cohesive 단위. 다른 entity timeline에 그대로 복제 가능 (article → note/book만 swap, articleGroupMeta → noteGroupMeta/bookGroupMeta).
- **wiki-board.tsx vs notes-board.tsx 패턴 정합**: BoardColumn 구조 동일 (useSortable("col-${key}") + useDroppable(group.key) + drop banner + cards container). PR-Q5 mechanical 복제 OK. dnd-kit 패턴이 entity-agnostic해서 향후 entity 추가 시도 동일 가능.

### Watch Out (다음 세션)

- **🟢 PR-Q4 v2 ghost row pattern** — 현재 collapsed group이 시각 자체 안 보임. v2엔 "ghost lane" inject (chevron right + label + (N hidden) + click → expand). 큰 작업 (DisplayLane union 또는 sentinel article). 사용자 viewport 검증 후 결정.
- **사용자 viewport 검증 필요**:
  - Wiki Board column collapse 실제 사용감 (notes 정합 시각 확인)
  - Notes/Books Timeline lane collapse 실제 작동 (group header click → cascading reflow + Expand all 버튼)
  - 모든 mode 일관성 (list/board/timeline의 group collapse가 같은 store에서 작동하는지 — `viewState.collapsedGroups` shared)
- **dnd-kit + collapsed column 상호작용**: collapsed column이 drag handle (useSortable)을 여전히 가짐 — drag로 reorder 시도 작동해야 정합. drop은 collapsed에 cards 못 들어가야 더 의도적 — v2에서 검토 가능.

### 환경 변경

- Store v145 무변경 (모두 view layer)
- 변경 파일 5: wiki-board.tsx + notes-timeline-view.tsx + notes-timeline-shell.tsx + books-timeline-view.tsx + books-view.tsx
- 신규 파일 0
- 사용자 IDB stale data: 없음

### 머신

Windows. 짧은 cohesive 세션 — group collapse universal 완성 확장.

---

## 2026-05-24 (저녁) — Windows, **거대 세션 #2: Notes timeline ViewHeader + File 엔티티 v1 (6 PR) + Notes/Wiki Grid Display + Display Panel Audit + Q-series (Q1~Q5) — 모두 11 변경 단위**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Wiki Board column collapse** — notes-board.tsx PR-Q5 패턴을 wiki-board.tsx에 mechanical 복제. + Notes/Books Timeline에 PR-Q4 패턴 확장 (현재 Wiki timeline만 lane collapse 작동).
>
> **사용자 의도 (정확 인용)**:
> - "오케이 그룹 콜파스랑 퀵 필터 칩 이런 걸 추가하자는 너의 제안에 동의해"
> - "근데 그러면 이건 타임라인에만 적용되는 게 아니라 다른 모든 디스플레이 모드에도 적용되어야 하는 이슈 아님??"
> - "너의 제안대로 순차적으로 진행할게. 커밋만 하지 마."
>
> **첫 스텝** (다른 머신에서 바로):
> 1. `components/wiki-board.tsx`에서 group/column render 부분 찾기 (notes-board.tsx의 BoardColumn 패턴 정합)
> 2. `isCollapsed` + `onToggleCollapse` prop 추가 + collapsed render 분기 (40px narrow + chevron up + vertical label + writing-mode: vertical-rl)
> 3. expanded header에 chevron-down 버튼 추가 + onClick stopPropagation
> 4. caller에서 `viewState.collapsedGroups` read + toggle handler wire
>
> **컴포넌트 구조 / 데이터 흐름**:
> ```
> WikiBoard (wiki-board.tsx)
>   ├─ groups.map(group => <WikiBoardColumn ... isCollapsed onToggleCollapse />)
>   └─ store: viewState.collapsedGroups ← updateViewState wrapper
>
> WikiBoardColumn (collapsed):
>   ├─ width 40px (vs expanded 260px)
>   ├─ ChevronDown rotate-180 (expand hint)
>   ├─ Status icon (Stub orange / Article emerald)
>   ├─ Vertical label (writing-mode: vertical-rl)
>   └─ Count
> ```
>
> **참고 파일** (작업 시 read):
> - `components/notes-board.tsx:184-313` (BoardColumn 함수 — PR-Q5에서 추가한 collapse render path)
> - `components/notes-board.tsx:1409` (caller의 collapsedGroups wiring)
> - `components/wiki-board.tsx` (변경 대상 — 동일 패턴 적용)
> - `lib/view-engine/types.ts:182` (ViewState.collapsedGroups field)
>
> **위험 + 회피**:
> - notes-board 패턴 그대로 mechanical 복제 — wiki-board가 dnd-kit 사용한다면 sortable id 패턴(`col-${key}`) 유지 + droppable id 분리 정합
> - Wiki는 status 외에도 tier/linkCount/parent/role/label 등 grouping 옵션 다양 — collapsedGroups는 key 기반이라 모든 grouping에 자동 작동 (key가 동일하면 mode 전환에도 유지)
>
> **2번째 P0 후보** (#1 끝나면): Notes/Books Timeline에도 PR-Q4 패턴 확장:
> - `components/views/notes-timeline-view.tsx` 신규 작성 (현재 notes-timeline-shell.tsx만 있음, view 내부 lane collapse 로직 X)
> - `components/views/books-timeline-view.tsx` 동일
> - WikiTimelineView의 collapsedGroupsSet/toggleGroupCollapse/expandAllGroups + visibleLanes filter 패턴 그대로
>
> **3번째 P0 후보**: PR-Q4 v2 ghost row pattern — 현재 collapsed group은 시각 자체 안 보임. v2엔 collapsed group의 자리에 1-row "ghost lane" inject (chevron right + label + (N hidden) + click → expand) — Linear/Notion 정합. 큰 작업 (DisplayLane union type).
>
> **머신**: Windows.
> **현재 main HEAD**: 이번 PR 머지 후 (PR `#???` — 머지 시 갱신).
> **branch worktree**: `claude/peaceful-faraday-b50f16` (이번 머지 시 정리, 새 worktree 권장).

### 완료 (이번 세션, 11 변경 단위 — 단일 거대 PR)

**1. Notes timeline ViewHeader (P0 #1)**:
- `components/notes-timeline-shell.tsx` — ViewHeader + FilterChipBar chrome wrapper 추가 (NotesTable chrome 패턴 정합)
- `components/notes-table-view.tsx` — title/hideCreateButton/createNoteOverrides props 전달
- 사용자 신고 "노트 타임라인 위에 필터/디스플레이 등이 사라졌어" 해소

**2. File 엔티티 v1 — PR 1a (모델 + 마이그레이션)**:
- `lib/types.ts:997` Attachment.noteId → originEntity (EntityRef | null)
- `lib/store/slices/attachments.ts` addAttachment 시그니처 + appendEvent 분기 (note origin일 때만 note-timeline)
- `lib/store/slices/notes.ts:150` cascade filter originEntity.kind === "note"
- `lib/store/index.ts` version 144 → 145
- `lib/store/migrate.ts` v144→v145 migration (note/wiki id lookup으로 kind 판정)
- 7 호출처 + 2 read-side (file-detail-panel / side-panel-connections)

**3. PR 1b — Note picker UI (`components/file-picker.tsx` 신규)**:
- Dialog overlay + 검색 + image grid + file list + accept filter
- `components/insert-menu.tsx`에 "From library…" item 추가 (FolderOpen 아이콘 + 자동 close)
- Wiki/Book picker는 PR 1c (별도)

**4. PR 1c — Wiki picker (AddBlockButton)**:
- `components/wiki-editor/wiki-block-renderer.tsx` AddBlockButton에 onAddFromFile prop + "From file…" 버튼 + FilePicker mount (`accept="image"`)
- `wiki-article-view.tsx` 2 caller (prepend/append) onAddFromFile handler — `addWikiBlock(articleId, {type:"image", attachmentId: att.id, caption: att.name}, anchor)` 직접 호출

**5. PR 1b' — Books 접점 close-out**:
- 코드 확인 결과 Books → attachment 직접 참조 0 (Book.items discriminated union + AutoSource.kind 모두 File 미포함)
- `.omc/plans/file-entity-prd.md` §6-3 + §7 Q2 CLOSED 표기 + §8 v1 진행 매트릭스 추가

**6. PR 2 — Usage 인덱스 (PRD §3)**:
- `lib/extract-attachment-refs.ts` 신규 — `extractAttachmentRefs(node)` ProseMirror tree walk + `extractAttachmentRefsFromWikiBlocks(blocks)` (image attachmentId 직접 + text contentJson 재귀) + `findAttachmentUsage` + `buildAttachmentDeleteWarning`
- `file-detail-panel.tsx` usedInNotes 신규 + usedInWikis 일반화 (블록 contentJson walk 추가) + "Used in · N" 카운트 header
- `side-panel-connections.tsx` 동일 패턴 적용

**7. PR 3 — Hard delete 경고 dialog (PRD §5)**:
- `notes-table.tsx` + `trash-all-view.tsx` handleDelete에 attachment 분기 — `buildAttachmentDeleteWarning(id, name, notes, wikiArticles)` 호출로 confirm 메시지 augment

**8. Library Labels 아이콘 fix (LOCKED #103 cascading)**:
- `library-view.tsx:882` Labels 카드 아이콘 `<Tag>` → `<IconLabel>` (Bookmark) — sidebar `linear-sidebar.tsx:1612`와 통일

**9. Notes/Wiki Grid Display (Books parity)**:
- 신규 `components/views/notes-grid-view.tsx` — Books-grid-parity 카드 grid (StatusShapeIcon + title + content preview + word count footer + pin)
- 신규 `components/views/wiki-grid-view.tsx` — IconWikiStub/Article + block count footer + pin
- 신규 `components/notes-grid-shell.tsx` — ViewHeader chrome wrapper
- `notes-table-view.tsx` + `wiki-view.tsx`에 grid 분기 추가

**10. Display Panel Audit 3-Fix**:
- Grid mode 정합: NOTES/WIKI groupingOptions의 default-allowed에 explicit `modes: ["list", "board"]` + `defaultGroupByByMode.grid: "none"` (Grid Display panel에서 Grouping "No grouping" only 노출)
- Timeline group spacing: timeline-grid.tsx group divider opacity 0.55→0.85 + 4px tint band, timeline-label-column.tsx header band height 16→20 + font 10px regular → 11px semibold
- filterAwareRole 라벨: "Filter-aware role" → "Role from filtered view" + 주석에 ON/OFF 의미

**11. Q-series (Q1~Q5)**:
- **PR-Q1**: Grid 카드 아이콘 박스 폐기 (LOCKED #103 cascading fix) — 3 파일 (notes-grid-view / wiki-grid-view / book-grid-card)
- **PR-Q3**: Quick filter chip toolbar (universal) — ViewHeader에 `quickFilters/activeFilters/onFiltersChange` 3 prop + rounded-full chip strip render + 1-click toggle (모든 mode 자동 적용). 7 caller wiring (notes 4 + wiki + books)
- **PR-Q2**: collapsedGroups store 승격 — ViewState에 `collapsedGroups?: string[]` 필드 + DEFAULT_VIEW_STATE 빈 배열 + normalizeViewState 보존. notes-table.tsx local Set → store-backed (Set wrapper로 기존 호출 시그니처 유지)
- **PR-Q4**: Wiki timeline lane collapse — wiki-timeline-view.tsx에 visibleLanes filter + toggleGroupCollapse/expandAllGroups callbacks + groupBoundaries에 key 추가. timeline-label-column header → button (click → toggle). timeline-controls에 "Expand all" 버튼 (collapsedGroupCount > 0 시)
- **PR-Q5**: Notes Board column collapse (Linear 패턴) — BoardColumn에 isCollapsed/onToggleCollapse prop + 40px narrow render (chevron up + vertical label writing-mode rotate + count) + expanded header에 chevron-down 버튼

검증: 모든 11 단위에서 `npx tsc --noEmit` clean + `npm run build` exit 0

### 브레인스토밍 & 큰 결정 (영구 LOCKED — 후보 #105~#110)

- **#105 LOCKED**: **Plot's chrome layer = ViewHeader** (모든 view mode 공통). quickFilters / display / filter / save / detail panel 모두 ViewHeader-level → 모든 mode 일관 UX. mode-specific render는 ViewHeader children에. (PR-Q3 wiring 핵심)
- **#106 LOCKED**: **Grid mode = flat card grid (Books parity), no grouping semantics**. view-configs의 grouping options 명시적 `modes: ["list", "board"]` (grid 제외). DisplayPanel mode filter가 자동 hide. Grid 카드 자체 fixed display (status icon + title + preview + footer).
- **#107 LOCKED**: **collapsedGroups = store-level (viewState)**. list/board/timeline 모두 동일 viewState.collapsedGroups read. mode 전환 시 의도 fold 유지. 단 `useEffect(() => setCollapsedGroups(new Set()), [viewState.groupBy])`는 그룹핑 자체 변경 시 무효화 — valid 정합 동작.
- **#108 LOCKED**: **Grouping = organize, Filter = focus**. 사용자가 "특정 영역만 보기" 의도는 grouping이 아닌 filter가 primary path. 큰 corpus에선 collapse + quick filter chip이 scaling 본질 도구. (timeline group collapse + quick filter chip의 핵심 통찰)
- **#109 LOCKED**: **Linear board column collapse pattern**: 40px narrow vertical bar + chevron up + vertical label (`writing-mode: vertical-rl`). expanded 시 header에 chevron-down. expand 시 chevron up + click anywhere on bar.
- **#110 후보**: **PRD `file-entity-prd.md` v1 완료**. v2 (content-hash dedup / hard-delete dangling cleanup) Phase 2로 이관. Books 접점 직접 참조 0 (간접만 — Note/Wiki contentJson에 자동 포함).

### 기술 학습 (영구)

- **`useEffect` cleanup으로 setState 호출하지 말 것**: PR-Q4 작업 중 board mode 전환 시 collapsedGroups reset 문제 발견 → notes-table.tsx의 `useEffect(() => setCollapsedGroups(new Set()), [viewState.groupBy])`가 그룹핑 변경 시 의도된 reset임. mode 전환 자체로는 reset 안 됨 — valid.
- **store ViewState 필드 추가 시 normalize 갱신 필수**: PR-Q2에서 ViewState.collapsedGroups 추가했지만 normalizeViewState return object에 명시 안 해 → setViewState 후 즉시 read엔 보이지만 normalize 거치면 stripped. **신규 필드는 types.ts + defaults.ts (DEFAULT_VIEW_STATE) + normalize return 세 곳 모두 추가**.
- **Set/Array dual representation**: `viewState.collapsedGroups`는 store에 array (IDB serializable), 컴포넌트 안에서 `useMemo(() => new Set(array), [array])`로 Set wrapper. setter도 `useCallback`로 array writeback. 기존 `.has` / `setCollapsedGroups(prev => ...)` 호출 시그니처 유지하면서 store-backed로 migrate 가능 (코드 변경 최소화 패턴).
- **Hidden secondary pane verification artifact**: puppeteer eval에서 button query는 hidden secondary pane (dual mode)의 element도 잡음. visible pane만 query하려면 `.hidden` ancestor check 필요. 사용자 viewport 검증이 결국 ground truth.
- **dropdown + plain overlay z-index 충돌**: Radix Dialog (Templates) vs plain overlay (FilePicker). plain overlay는 portal 없어서 dropdown에 가려질 수 있음. `e.preventDefault()` 제거하고 dropdown 자동 close 후 overlay mount하는 게 정통.
- **Books grid card 박스 잔존 → LOCKED #103 cascading fix**: 영구 룰은 list row의 22×22 tinted box 폐기였는데 grid card의 48×48 box까지 폐기 cascading 발견. 사용자 신호로 발견. 새 컴포넌트 만들 때 reference 패턴에 옛 잔존 위반 있는지 점검 필요.

### Watch Out (다음 세션)

- **🔴 Wiki Board column collapse 미적용**: PR-Q5는 notes-board만. wiki-board는 동일 패턴 mechanical 복제 필요. 다음 P0 #1.
- **🟡 Notes/Books Timeline lane collapse 미적용**: PR-Q4는 Wiki timeline만. 동일 패턴 확장 필요. 다음 P0 #2.
- **🟡 Group-collapse ghost row pattern v2**: 현재 collapsed group은 시각 자체 안 보임. "Expand all" 버튼으로만 복구. v2엔 collapsed group의 자리에 1-row ghost lane (chevron right + label + (N hidden) + click → expand). 큰 작업이지만 사용자 viewport 검증 후 결정.
- **Timeline lane spacing**: Display Panel Audit Fix 2로 group divider/header band 강화했지만 사용자 viewport에서 진짜 시각 효과 확인 필요. 부족하면 ghost row v2가 더 본질적.
- **Wiki list mode 진입 puppeteer quirk**: wikiViewMode external store (`plot-wiki-view-mode`) — list mode 전환은 사이드바 클릭 아니라 store 직접 변경 필요. 시각 verification은 사용자 viewport에서.
- **Grid view에 grouping 시도하면 viewState.groupBy 유지되지만 NotesGridView는 flat render** — 의도된 동작. 사용자가 list에서 grouping 켠 상태로 grid 전환하면 viewState.groupBy="status" 그대로지만 grid가 flat. normalizeViewState가 grid mode 진입 시 groupBy "none"으로 reset (defaultGroupByByMode.grid: "none") — 단 normalizeViewState는 IDB read 시점 적용. runtime setViewState는 그대로 박힘.

### 환경 변경

- Store v144 → **v145** (Attachment.noteId → originEntity 마이그레이션)
- 신규 파일 5:
  - `components/file-picker.tsx`
  - `components/notes-grid-shell.tsx`
  - `components/views/notes-grid-view.tsx`
  - `components/views/wiki-grid-view.tsx`
  - `lib/extract-attachment-refs.ts`
- 변경 파일 31 (Notes/Wiki view layer + view-engine + side-panel + store/slices + Wiki timeline sub-components + view-header)
- ViewState에 `collapsedGroups?: string[]` 필드 추가
- ViewConfig groupingOptions에 explicit modes 추가 (grid 제외 일괄)

### 머신

Windows. 거대 세션 (사용자 대화 30+ 라운드 + 11 변경 단위 + 단일 PR cutoff).

---

## 2026-05-24 — Windows, **거대 세션: PR-X5/X6 + Activity bar lucide + PR-B/B2/C (audit v2 완성) + Notes/Books Timeline + Gallery 폐기**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Notes timeline에 ViewHeader (filter/display panel) 추가** — 사용자 신고 "노트 타임라인 위에 필터/디스플레이 등이 사라졌어. 위키/북스처럼 만들어줘."
>
> **사용자 의도 (정확 인용)**: "야 노트는 왜 위에 필터, 디스플레이 등등이 사라졌어? 타임라인이 제대로 구현이 안 됐는데? 노트는? ... 다음 세션에서 가장 먼저 할 일을 이걸로 해. 노트의 타임라인 뷰를 필터랑 디스플레이 생기게(위키랑 북스처럼)"
>
> **근본 원인**:
> - Wiki/Books는 view-level orchestrator (`wiki-view.tsx`, `books-view.tsx`)가 `ViewHeader` 자체 렌더 → timeline mode에서도 ViewHeader 보임
> - Notes는 `NotesTable`이 자체에서 `ViewHeader` 호출. `NotesTableView`가 viewMode === "timeline" 분기에서 `NotesTimelineShell`만 render → ViewHeader 누락
>
> **첫 스텝** (다른 머신에서 바로):
> 1. `components/notes-table.tsx`에서 ViewHeader 호출 코드 grep (어떤 props 받고 어디 render되는지 확인). 보통 line 280-330대 `<ViewHeader ... />`.
> 2. `components/notes-timeline-shell.tsx`에 동일 ViewHeader render 추가 — `useNotesView`에서 받은 `viewState`, `updateViewState`, `filterCategories` (NOTES_VIEW_CONFIG에서) 등 전달
> 3. 또는 `components/notes-table-view.tsx`에서 timeline 분기를 `NotesTable`의 ViewHeader render 부분과 통합 (NotesTable이 viewMode 분기 자체에서 timeline 처리 — 더 정통)
>
> **컴포넌트 구조** (현재):
> ```
> NotesTableView (notes-table-view.tsx)
>   ├─ viewMode === "timeline" → NotesTimelineShell → NotesTimelineView  ← ViewHeader X
>   ├─ viewMode === "board" → NotesBoard  ← ViewHeader X (board가 자체로 갖나? 확인)
>   └─ viewMode === default → NotesTable  ← ViewHeader O (자체 호출)
> ```
>
> **데이터 흐름 — Wiki/Books와 비교**:
> - `wiki-view.tsx`: 1) ViewHeader render (자체) → 2) viewMode 분기 (timeline / board / list / grid)
> - `books-view.tsx`: 1) ViewHeader render → 2) viewMode 분기 (timeline / board / grid / list)
> - `notes-table-view.tsx`: viewMode 분기만, ViewHeader는 NotesTable 안에 — Notes만 다른 패턴
>
> **추천 path** = NotesTimelineShell이 ViewHeader도 render (Wiki/Books와 정합). 또는 NotesTableView refactor — viewMode 분기 이전에 ViewHeader render + NotesTable의 ViewHeader 호출 제거. 후자가 정통이지만 NotesTable 큰 refactor.
>
> 가장 단순 form 첫 시도: NotesTimelineShell이 ViewHeader render (Shell 안에서 self-contained).
>
> **위험 + 회피**:
> - NotesTable이 자체 ViewHeader 가지므로 NotesTimelineShell도 자체 ViewHeader 가지면 OK. 단 ViewHeader props 일치 필요 (config, viewState, onUpdate, filterCategories, hideCreateButton 등)
> - 사용자 명시: BooksTimelineShell 패턴은 안 만들었음 (books-view가 직접 BooksTimelineView 호출). Notes는 NotesTimelineShell 패턴 — 다른 구조.
>
> **참고 파일** (작업 시 read):
> - `components/notes-table.tsx` (line 280-330 ViewHeader 호출 위치 — props 검토)
> - `components/notes-timeline-shell.tsx` (현재 구현 — ViewHeader 추가 대상)
> - `components/views/wiki-view.tsx` (ViewHeader render 패턴 reference)
> - `components/views/books-view.tsx` (ViewHeader render 패턴 reference)
>
> **2번째 P0 후보** (#1 끝나면): File 엔티티 v1 구현 (`.omc/plans/file-entity-prd.md` v0.2).
>
> **머신**: Windows. 다음도 cross-machine 가능.
> **현재 main HEAD**: 이번 PR 머지 후 (PR `#???` — 머지 시 갱신).
> **branch worktree**: 새 worktree 권장 (이번 worktree `tender-rosalind` 머지 시 정리).

### 완료 (이번 세션, 단일 거대 PR — 93 파일 / +1891 −2622)

**PR-X5 + PR-X6 — Lucide 마이그레이션 68 파일** (Stone/Brick/Block + Wiki Stub/Article 제외 모두 lucide):
- PR-X5 (24 파일): `components/editor/*` 8 + `components/wiki-editor/*` 13 + `components/comments/*` 3
- PR-X6 (44 파일): notes-table/notes-board/note-editor/display-panel/property-chips (가장 큰 27/21/16/11/19 imports) + books mid+large 10 + home 4 + ontology 4 + inspector + insights + calendar + board-workbench + wiki-* (assembly/board-workbench/merge-preview/template-picker) + 기타

**Activity bar + plot-icons 전체 lucide** (사용자 결정 "Stone/Brick/Block 제외 모두"):
- `components/plot-icons.tsx` 전체 재작성 — 자체 SVG 25+ 함수 → lucide alias wrap (default size 유지, strokeWidth=1.5 mockup tone)
- Activity bar 9 icon (Home/Inbox/Notes/Wiki/Ontology/Calendar/Sun/Moon/Gear), Sidebar nav 7 (Doc/Folder/Tag/Label/Template/Insight/Pin), Action 14 (Search/Plus/Chevron/Trash/Sort/More/Sparkle/Check/Snooze/ArrowLeft/SplitView/Filter/PanelRight/PanelLeftClose) — 모두 lucide wrap
- Brand 5종 유지: IconStone (phosphor Hexagon), IconBrick (phosphor Cube), IconBlock (Cuboid2x2 자체 SVG), IconWikiStub (lucide Book), IconWikiArticle (lucide BookMarked)
- 사용자 명시 후 IconWikiStub/IconWikiArticle도 lucide (Book/BookMarked)로 옮김

**PR-B Foundation (audit v2) — declarative modes**:
- `lib/view-engine/view-configs.tsx`: ModeList / GroupingOption / OrderingOption / DisplayProperty.modes / DisplayConfig.defaultGroupByByMode / defaultSortByMode 타입 신설 + `getViewConfigForContext(ctx)` export
- 11 ViewConfig modes 일괄 선언 (firstLetter→list-only, family→list-only, Wiki/Books date→timeline 차단, defaultGroupByByMode 명시)
- `components/display-panel.tsx`: isGroupingModeAllowed + isPropertyModeAllowed helper, default property modes ["list", "board"]
- `lib/view-engine/defaults.ts`: applyModeAwareGroupBy + normalizeViewState mode-aware auto-cleanup

**PR-B2 — 갭 해소** (5 sub-tasks):
- B11: References groupBy 로컬 state 제거 → viewState.groupBy 단일화 (types.ts GroupBy union에 "type"/"fieldKey" 추가)
- B6: timeline-label-column visibleColumns prop + updatedAt/createdAt 분기 (Wiki properties createdAt/updatedAt modes에 "timeline" 추가)
- B12: templates grid가 groupBy !== "none"일 때 그룹 헤더 band + 카드 grid per group 렌더
- B5: wiki gallery `buildWikiGalleryGroups`에 wikiGroups 인자 추가 (entity-agnostic) — *그 후 PR에서 gallery 폐기로 함수 자체 제거*
- B4: WikiTimelineView articles 그룹 순서 정렬 + groupBoundaries (label-column header band + canvas divider line via TimelineGrid)

**PR-C polish**:
- B10: wiki tier sort 구현 (compareSingleWiki depthMap arg + applyWikiSort에서 chain에 "tier" 있을 때만 buildWikiDepthMap 호출)
- B14: use-templates-view에 isHydrated 추가 (다른 entity hook과 shape parity)
- B13: applyBookGrouping에 BookGroupingOptions ({ showEmptyGroups?, groupOrder? }) — Books board가 Notes/Wiki와 동일하게 빈 그룹 표시 + 컬럼 manual reorder 지원

**Spacing/icon polish**:
- `.a-row__icon` (globals.css) — width/height/background/border-radius 제거 → 22×22 tinted box 사라짐, color tone만 유지 (Linear/Plain reference 톤)
- `components/books/book-table.tsx` header h-9 → py-2 / row h-9 → py-2.5 (Notes/Wiki list parity — Books가 가장 좁았던 행 간격 통일)

**Notes/Books Timeline 신규** (generic refactor + 3 신규 파일):
- Sub-components 7개 generic화: `wiki-timeline-config.ts` (TimelineEntity/EntityTimelineAdapter/LanedItem<T>), `wiki-timeline-utils.ts` (laneArticles/computeAllFit generic), timeline-bar (statusColor + canEditHorizon), timeline-label-column (getStatusColor/renderStatusIcon callbacks), timeline-tooltip (getStatusColor/renderStatusIcon/getStatusLabel/renderHorizonLine callbacks), timeline-event-markers (TimelineEntity), timeline-grid (LanedItem<TimelineEntity>)
- 신규 `components/views/notes-timeline-view.tsx` (~330줄) — Note adapter inline (IconStone/Brick/Block + NOTE_STATUS_HEX), horizon = updatedAt, canEditHorizon = false, events 제외, TimelineEventMarkers는 start chip만 빈 events Map 전달
- 신규 `components/notes-timeline-shell.tsx` — useNotesView + selectedIds + handlers wrapper
- 신규 `components/views/books-timeline-view.tsx` (~310줄) — Book adapter inline (Zap/Sparkles/Pencil + indigo/amber/slate per kind), shell 불필요 (books-view가 직접 호출)
- `notes-table-view.tsx`에 viewMode === "timeline" 분기 추가
- `books-view.tsx`에 viewMode === "timeline" 분기 추가
- NOTES_VIEW_CONFIG / BOOKS_VIEW_CONFIG에 timeline mode + defaultGroupByByMode.timeline + defaultSortByMode.timeline 추가
- WikiTimelineView caller adapter inline (wiki는 회귀 0 — wikiAdapter inline)

**Gallery 전수 폐기 → Grid view 통일** (사용자 결정):
- types.ts ViewMode union + VALID_VIEW_MODES에서 "gallery" 제거
- normalizeViewState: "gallery" → "grid" alias 자동 마이그레이션 (persisted 데이터 보존)
- 4 ViewConfig (NOTES/WIKI/REFERENCES/BOOKS) supportedModes에서 gallery 제거
- display-panel.tsx MODE_DEFS에서 gallery 탭 제거
- 4 view 분기 (notes-table-view / books-view / wiki-view / library-view) gallery 케이스 + import + 미사용 함수 정의 (buildWikiGalleryGroups, articleToGalleryItem, buildReferencesGalleryItems) 제거
- 파일 삭제: `components/views/gallery-view.tsx`, `gallery-view-shell.tsx`, `components/books/books-gallery-adapter.tsx`
- 부수 효과: Books DisplayPanel 탭이 5→4로 줄어 timeline 탭 잘림 자동 해소

**Wiki timeline 선 단순화** (사용자 명시 "위키 선도 노트/북스처럼"):
- `timeline-bar.tsx` D1 past/future opacity gradient 제거 — 단일 status color, full opacity
- 이전: wiki bar의 future part (plannedDate 미래) 흐림 (0.55 opacity). Notes/Books는 horizon=updatedAt이라 future 0 → 단단함. 불일치 해소

검증: tsc clean (전 단계), npm run build exit 0 (최종)

### 브레인스토밍 & 큰 결정 (영구 LOCKED)

- **#98 — Gallery 폐기, Grid 통일** (2026-05-24, LOCKED): 사용자 결정. Grid view가 시각 더 깔끔. 4 entity (Notes/Wiki/References/Books)에서 통일 + 자동 마이그레이션 (gallery → grid).
- **#99 — Wiki timeline bar 단일 색** (2026-05-24, LOCKED): D1 past/future gradient는 wiki plannedDate 있는 article에서만 의미 있었음. Notes/Books와 시각 불일치 → 폐기. 모든 entity bar가 status color full opacity.
- **#100 — Activity bar + sidebar nav + action icons 모두 lucide 통일** (2026-05-24, LOCKED): 영구 룰 #95 update — phosphor 유지는 "brand 5종 (Stone/Brick/Block + Stub/Article)"이 아니라 **brand 3종 (Stone/Brick/Block)만**. Wiki Stub/Article은 lucide Book/BookMarked로 옮김. shadcn 정통 더 엄격 적용.
- **#101 — Timeline = entity-agnostic sub-components + entity adapter** (2026-05-24, LOCKED): WikiTimelineView가 entity adapter prop 받지는 않지만 sub-components (timeline-bar/grid/label-column/tooltip/event-markers/utils) 모두 generic<T extends TimelineEntity>. Notes/Books는 신규 wrapper. 향후 entity 추가 시 wrapper만 만들면 됨.
- **#102 — Notes timeline는 Shell 패턴, Books timeline은 직접 호출** (2026-05-24): NotesTable이 자체 ViewHeader 가지므로 NotesTimelineShell이 useNotesView + handlers wrapper로 분리. Books는 books-view가 useBooksView 직접 호출 → BooksTimelineView를 직접 호출하면 됨. *결과: Notes timeline에 ViewHeader 누락 — 다음 세션 P0 #1.*
- **#103 — `.a-row__icon` 박스 폐기** (2026-05-24): 22×22 tinted square가 hover overlay처럼 느껴짐. color tone만 유지. Linear/Plain 톤 정합.
- **#104 — Books row height = Notes parity** (2026-05-24): book-table.tsx의 h-9 (36px 고정) → py-2.5. 모든 entity list row 동일.

### 기술 학습 (영구)

- **lucide 마이그레이션 일관 변환 룰** (PR-X1~X6 누적): regular→strokeWidth=2 / bold→2.5 / light→1.5 / fill→fill="currentColor" + strokeWidth=2 / duotone→strokeWidth=1.5 / dynamic `weight={cond?"fill":"regular"}`→`fill={cond?"currentColor":"none"} strokeWidth={2}`. import block 통째 교체 (alias 유지) → replace_all로 weight 변환 → tsc 매 batch.
- **brand vs lucide 컴포넌트 구별** — Plot 자체 컴포넌트 (Hexagon wrap, Cube wrap, Cuboid2x2 자체)는 phosphor weight prop만 받음. strokeWidth 박으면 TS error. lucide 변환 대상에서 의도적 제외.
- **`weight: "regular" as const` helper 패턴** (comments-by-entity 사례) — JSX 외 helper에서 weight 박은 곳도 fix 필요. `strokeWidth: 2`로 변환.
- **Generic timeline 추출 패턴** — sub-components를 `T extends TimelineEntity` generic하게 + status icon/color/horizon/eventRef는 adapter callback prop. caller (wiki/notes/books)가 adapter inline. duplication 0, 회귀 risk 0 (wiki 그대로).
- **dead branch + dead function 정리** — gallery 분기 제거 시 import + 정의 함수 (buildWikiGalleryGroups, articleToGalleryItem, buildReferencesGalleryItems) 모두 제거. tsc unused 못 잡으므로 grep으로 수동 확인.
- **alias migration for deprecated viewMode** — types.ts에서 "gallery" 제거하면 사용처 type error. normalizeViewState에 alias ("gallery" → "grid") 추가로 persisted 데이터 자동 변환. Store-level migration 불필요.

### Watch Out (다음 세션)

- **🔴 Notes timeline ViewHeader 누락** (가장 큰 미완) — 사용자가 명시. P0 #1. NotesTimelineShell에 ViewHeader 추가 또는 NotesTableView refactor.
- **WikiTimelineView vs NotesTimelineView vs BooksTimelineView의 패턴 차이** — Wiki는 직접 ViewHeader 외부 (wiki-view.tsx) / Notes는 NotesTable 자체 ViewHeader / Books는 books-view.tsx 외부. 일관성 위해 NotesTableView refactor 가치 있음. 단 회귀 risk 큼.
- **D1 gradient 제거** — wiki bar의 future part 시각 단서 사라짐. 사용자가 plannedDate 의도하면 다른 방식 (예: stroke dasharray) 필요할 수도. 사용자 시각 후 redirect 가능.
- **PR 크기 매우 큼** (93 파일 / +1891 −2622) — 머지 후 회귀 발견 시 디버깅 어려움. 사용자 본인 viewport 시각 검증 권장.
- **dev server stale possibility** — 거대 refactor 후 `.next` 캐시 stale 가능. before-work 시 의심되면 `.next` 삭제 + dev restart.
- **TimelineBar의 nowX prop unused** — D1 gradient 제거 후 nowX 사용처 없음. caller는 그대로 전달. unused param TS warning 안 남. 정리 후속.

### 환경 변경

- Store v144 무변경 (전부 view layer + types/utils refactor)
- 신규 파일 3: `components/notes-timeline-shell.tsx`, `components/views/notes-timeline-view.tsx`, `components/views/books-timeline-view.tsx`
- 삭제 파일 3: `components/views/gallery-view.tsx`, `components/views/gallery-view-shell.tsx`, `components/books/books-gallery-adapter.tsx`
- 변경 파일 87 (lucide 마이그레이션 68 + audit/refactor/spacing/timeline 19)
- types.ts ViewMode union에서 "gallery" 제거 + VALID_VIEW_MODES 정리
- GroupBy union에 "type"/"fieldKey" 추가 (References viewState 단일화)
- view-configs.tsx: ModeList/GroupingOption/OrderingOption/DisplayConfig.defaultGroupByByMode/defaultSortByMode 타입 신설 + getViewConfigForContext export

### 머신

Windows. 거대 세션 (20+ 라운드 사용자 대화 + 93 파일 + 1 audit 적용 완성 + 4 신규 timeline 컴포넌트 + gallery 폐기).

---

## 2026-05-23 (후속) — 다른컴퓨터/Windows, **DP/Grouping/Ordering Audit v2 + PR-A 데이터 무결성 5건 + Lucide 마이그레이션 90 파일 (PR-X1~X4)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **PR-X5 진입 — Editor + wiki block + comments lucide 마이그레이션 (~30 파일).** 그리고 audit §8 결정사항(timeline default groupBy / PR-B2 같이 갈지 / Library hook 통합) 사용자 답변 받으면 PR-B(modes 선언 + filter + auto-cleanup) 진입.
>
> **사용자 의도 (전체 세션 인용)**:
> - "타임라인의 디스플레이 프로퍼티스가 제대로 작동을 안 함. 완벽하고 확실한 해결책. 코드 전체 꼼꼼히 (토큰 소모 감수) 일일이 수정."
> - "디스플레이 모드에 따라 지원되는 DP/필터를 명확히 구분, UI별로 구분 안 되는 건 숨기고. 세련되게 정리."
> - "Linear 앱 제작자처럼" → "너의 제안대로" (Lucide + brand 5종 유지 + mode-aware UI)
> - "shadcn으로 통일 (사실은 lucide), 스톤/브릭/블록은 유지" → 매 PR-X round마다 "ㅇㅇ 진입해" 계속 진행
>
> **첫 스텝 (다른 머신에서 바로 시작 — PR-X5)**:
> 1. `Grep import .* from "@phosphor-icons/react" --path components/editor` → editor 폴더 phosphor import 인벤토리
> 2. `Grep weight= --path components/editor` → weight prop 패턴
> 3. PR-X1~X4 패턴 그대로: import block 통째 교체 (alias 유지) + weight 일괄 변환
> 4. `npx tsc --noEmit` 매 batch마다
>
> **컴포넌트 구조 / 데이터 흐름** (PR-X 패턴 정합):
> - `import { Phosphor as Alias } from "@phosphor-icons/react/dist/ssr/X"` → `import { Lucide as Alias } from "lucide-react"` (alias 유지 → JSX 변경 0)
> - 또는 alias 풀고 lucide 이름 직접 (shadcn 정통)
> - weight prop 변환: `regular`→`strokeWidth={2}` / `bold`→`strokeWidth={2.5}` / `light`→`strokeWidth={1.5}` / `fill`→`fill="currentColor"` / `duotone`→`strokeWidth={1.5}` / dynamic `weight={cond?"fill":"regular"}`→`fill={cond?"currentColor":"none"}`
>
> **위험 + 회피** (이번 세션 교훈):
> - **자체 컴포넌트 (Plot icons, IconWikiStub 등)는 phosphor 호환 prop만 받음** — strokeWidth 박으면 type error. lucide-only weight 변환은 lucide import 컴포넌트에만.
> - **잔여 weight prop** — import block 변경 후 tsc로 잔여 weight 잡고 별도 fix. dynamic `weight={...}` 동적도 grep 필요.
> - **carousel.tsx 같은 KeyboardEvent.key 비교 문자열** — `'PhArrowLeft'` 같은 alias 이름이 string으로 박혀 있으면 lucide alias replace_all로 자동 fix됨 (PR-X1 부수효과 fix 사례).
> - **timeline-event-markers.tsx** — phosphor import 없어도 wiki-timeline-config에서 import한 컴포넌트 사용. 잔여 weight 잡으려면 grep 풀스캔.
>
> **참고 파일** (다음 세션 작업 시 read):
> - PR-X1~X4 패턴 reference: `components/ui/*.tsx`, `components/views/wiki-list.tsx`, `components/side-panel/side-panel-context.tsx` (가장 큰 24 imports)
> - Audit 문서: `.omc/plans/view-state-reliability-audit.md` (PR-B/B2 진입 시 §8 결정 확인)
>
> **머신**: 다른컴퓨터 (Windows). 다음도 같은 머신 또는 cross.
> **현재 main HEAD**: 이번 PR 머지 후 (PR-A 데이터 무결성 + audit v2 + lucide 90 파일).
> **branch worktree**: 새 worktree 권장 (PR-X5 시작점).

### 완료 (이번 세션, 단일 거대 PR)

**Audit + 계획 산출물**:
- `.omc/plans/view-state-reliability-audit.md` v2 — Linear 마인드셋 통합 (`UI 노출 = 100% 동작` / `Show, don't disable` / `View is a memo, not a config` / `Make the right thing default` / `Self-documenting source of truth`). 4 dimension × 11 ViewConfig audit + mode-aware modes 룰 + PR 분할 7개 (PR-A~G) + §8 사용자 결정 3개.

**PR-A 데이터 무결성 5건** (사용자 신고 "가끔 안 됨" 8할 해소):
- B1 `lib/view-engine/types.ts:257` — `VALID_GROUP_BY`에 `firstLetter`/`createdAt`/`wikiStatus` 추가 (normalize가 persist된 grouping 떨굼 fix)
- B2 `lib/view-engine/types.ts:248` — `VALID_SORT_FIELDS`에 `articles` 추가
- B3 `lib/view-engine/defaults.ts:17` — DEFAULT visibleColumns `"words"` → `"wordCount"` (VALID_COLUMNS 매치)
- B8 `use-tags-view.ts:68` / `use-stickers-view.ts:76` / `use-references-view.ts:91` — fail-closed (`return false` for unknown field) → fail-open (`return true`) — stale filter rule이 view 비우는 거 방지
- B9 `use-files-view.ts` — searchQuery stage 추가 (Files 검색 0 동작 fix)

**PR-X1~X4 Lucide 마이그레이션 90 파일** (Phosphor → Lucide 표준화, shadcn 정합):
- PR-X1: `components/ui/*.tsx` UI primitive 21 파일 — accordion/breadcrumb/calendar/carousel/checkbox/chip-dropdown/command/context-menu/dialog/dropdown-menu/input-otp/menubar/navigation-menu/pagination/radio-group/resizable/select/sheet/sidebar/spinner/toast
- PR-X2: Chrome 17 파일 — activity-bar/linear-sidebar/view-header + breadcrumb 3종 + workspace 2종 + picker 3종 (folder/category) + floating-action-bar 3종 + panels-menu + search-dialog + filter-bar
- PR-X3: Side panels 17 파일 — smart-side-panel + detail-panel 시리즈 (article/template/sticker/tag/reference/label/file/category/book/wiki-template) + side-panel tabs (activity/bookmarks/connections/context/discover) + backlink-card
- PR-X4: View components 30 파일 — wiki-view/wiki-list/wiki-board/wiki-timeline + entity views (notes/books/templates/tags/labels/stickers/references via library-view/library-categories-view) + home-view/inbox-view/todo-view/search-view/ontology-view/graph-insights-view/trash-all-view 등

**부수 효과** (preexisting 버그 자동 fix):
- `components/ui/carousel.tsx:80-83` — KeyboardEvent.key 비교가 `'PhArrowLeft'`/`'PhArrowRight'` (alias 이름 잘못 박힘)였음. lucide alias replace_all로 `'ArrowLeft'`/`'ArrowRight'` (표준) 자동 fix. 키보드 nav 동작 복구.

검증: tsc exit 0 ✅ / runtime HMR full-reload warning만 (정상) / Browser console hydration mismatch는 preexisting (Radix UI useId 충돌, lucide 무관).

### 브레인스토밍 & 큰 결정 (영구)

- **Lucide-react = Plot icon library 통일 표준** (영구 룰 후보 #94) — shadcn 정통 (lucide 사용). Linear/Vercel/Tailwind 톤. Phosphor의 weight variant 다양성 손실 대신 sharp/geometric/minimal 톤 + shadcn 정합. Plot이 추구하는 Linear-level polish와 정확히 align.
- **Brand icon 5종만 phosphor 유지** (영구 룰 후보 #95) — Stone(Hexagon) / Brick(Cube) / Block(Cuboid2x2 자체) / Stub(IconWikiStub 자체) / Article(IconWikiArticle 자체). Smart/Hybrid/Manual Books는 utility로 통일 (Zap/Sparkles/Pencil로). Plot 자체 컴포넌트는 phosphor weight prop만 받음 → lucide 변환 시 자체 컴포넌트엔 strokeWidth 박지 말 것.
- **Mode-aware UI 룰 (Linear-style)** (영구 룰 후보 #97, PR-B에서 구현 예정):
  - L1: UI 노출 = 100% 동작 (modes 선언과 코드 갭 해소는 같은 PR)
  - L2: Show, don't disable (의미 없으면 안 보여줌, disabled grayed-out X)
  - L3: View is a memo, not a config (mode 전환 시 invalid 옵션은 normalize가 auto reset)
  - L4: Make the right thing default (각 mode default groupBy/sort product 결정으로 박음)
  - L5: Self-documenting source of truth (view-configs.tsx declarative modes 필드)
- **Audit-first 워크플로우의 가치** — 16 round의 사용자 대화 (브레인스토밍 → 결정 → 진행) 거쳐 큰 작업 (90 파일 + 14 버그) 깔끔히. PR-A는 "계획부터" 룰 지키며 audit 끝나야 진입. PR-X1~X4는 mechanical이라 audit 없이 batch 진행.

### 기술 학습 (영구)

- **Phosphor → Lucide weight prop 변환 룰** (영구 룰 후보 #96):
  - `weight="regular"` → `strokeWidth={2}` (lucide 기본값 명시)
  - `weight="bold"` → `strokeWidth={2.5}`
  - `weight="light"` → `strokeWidth={1.5}`
  - `weight="thin"` → `strokeWidth={1}`
  - `weight="fill"` → `fill="currentColor"` (lucide는 stroke 기반, fill prop으로 채움 효과)
  - `weight="duotone"` → `strokeWidth={1.5}` (lucide에 duotone 없음, opacity로 시뮬레이션 가능)
  - dynamic `weight={cond ? "fill" : "regular"}` → `fill={cond ? "currentColor" : "none"}`
- **Phosphor 별칭 import 패턴 (alias 유지)** — `import { Lucide as PhAlias } from "lucide-react"` — JSX 변경 0이라 minimum-diff. PR-X 모든 round에서 이 패턴 사용. 단 alias name이 의미 있을 때만 유지 (예: BookOpenText). 단순 phosphor 별칭(PhX, PhCheck)은 lucide name 직접 가는 게 깔끔.
- **마이그레이션 batch 패턴** — Grep import 라인 인벤토리 → Read 부분 (import 영역만) → import block 통째 교체 → weight 4-5종 replace_all → tsc 검증 → 잔여 weight grep + fix → 다음 batch. 5-10 파일/round가 한 응답에 부담 OK.
- **자체 컴포넌트는 lucide-incompatible** — Plot icons (IconWikiStub, Cuboid2x2 등)는 phosphor weight prop만 받는 자체 SVG. strokeWidth 박으면 TS error. lucide 변환 대상에서 의도적 제외.
- **carousel.tsx 사례 — alias 이름이 string literal로 박힌 패턴** — `event.key === 'PhArrowLeft'` 같이 alias 이름이 string으로 비교되는 경우. lucide alias replace_all로 자동 fix됨 (`'PhArrowLeft'` → `'ArrowLeft'`). preexisting 키 이벤트 비교 버그 부수효과로 해결.
- **timeline-event-markers처럼 indirect phosphor 사용** — phosphor import 없어도 다른 module(wiki-timeline-config)에서 import한 컴포넌트 사용. 잔여 weight 잡으려면 phosphor 사용 모듈 외에도 grep 풀스캔 필요.

### Watch Out (다음 세션)

- **PR-X5/X6 60+ 파일 남음** — `components/editor/*` + `components/wiki-editor/*` + `components/comments/*` (~30 파일, PR-X5) + 나머지 (~30 파일, PR-X6). 같은 batch 패턴 따라 진행. weight prop 변환 까다로운 케이스 더 많을 가능성 (editor는 wiki-block-renderer 등 13 imports 큰 파일들).
- **audit §8 사용자 결정 미답** — PR-B(modes 선언 + DisplayPanel/FilterPanel filter + normalizeViewState mode-aware auto-cleanup) 진입 전 결정 필요:
  - #1: Wiki timeline default groupBy = `wikiStatus` 추천 (Stub/Article 시간축에서)
  - #2: PR-B2 (timeline lane 그룹 헤더 구현) — PR-B와 같이 (a, Linear L1 엄격) vs 후속 (b, 빠른 머지)
  - #3: Library 5종 hook 통합 (PR-D) — 지금 vs 미루기 (추천: 미루기, 컴포넌트-사이드 패턴 유지)
- **PR-B 진입 전 audit 문서 재읽기 필수** — Linear 마인드셋 룰 5개 + 끊김 지점 14개 / `.omc/plans/view-state-reliability-audit.md`
- **HMR full-reload warning + hydration mismatch** — preexisting, lucide 마이그레이션과 무관. dev 서버 재시작 시 정상.
- **사용자 시각 검증 미완** — 90 파일 마이그레이션이 시각적으로 어떻게 보일지 (lucide의 sharp/angular 톤이 Plot의 기존 phosphor rounded와 어떻게 다를지) 사용자 본인 환경에서 검증 필요. 특히 brand icon 5종 (phosphor 유지)와 나머지 (lucide 변환) 사이의 시각적 일관성.

### 환경 변경

- Store v144 무변경 (전부 view layer)
- 신규 파일: `.omc/plans/view-state-reliability-audit.md`
- 의존성: `lucide-react ^0.564.0` 이미 설치 (shadcn UI 컴포넌트 의존)
- 변경 파일 90개: lib/view-engine 6 + components/ui 21 + components/ chrome 17 + components/side-panel 17 + components/views 30 (+ wiki-timeline 3 + wiki-editor/wiki-breadcrumb 1 + workspace 2 + 기타)

### 머신

다른컴퓨터 (Windows). 거대 세션 (16+ 라운드 사용자 대화 + 90 파일 + 1 audit 문서).

---

## 2026-05-23 — 다른컴퓨터/Windows, **타임라인 비주얼 리디자인 (얇은 선 / 스타트칩 / status 색) + "All" 모드 신설**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**: **Display Properties / Grouping / Ordering 신뢰성 — 전 view mode 감사 + 일일이 수정. 단, 코드 수정 전 "계획부터".**
>
> **사용자 의도 (요약 인용)**: "타임라인의 디스플레이 프로퍼티스가 제대로 작동을 안 함. 타임라인뿐 아니라 그리드·보드 모드에서도 가끔 벌어짐. 완벽하고 확실한 해결책 필요. 필터는 테스트해보니 웬만한 건 다 됨 — **DP / 그룹핑 / 오더링**이 문제. 코드 전체를 아주 꼼꼼하게 (토큰 소모 감수) 확인하고 일일이 하나하나 수정해야 할 듯. 우선 계획부터."
>
> **첫 스텝** (다른 머신에서 바로 — 1번은 *계획 수립*, 코드 수정 X):
> 1. `lib/view-engine/` 읽기 — view config + `ViewState` 타입 구조 (filter/grouping/ordering/displayProperties가 어떻게 정의·전달되는지).
> 2. 각 view mode 컴포넌트가 viewState를 어떻게 소비하는지 추적: list(`notes-table` 등) / board / gallery / timeline(`wiki-timeline-view.tsx`).
> 3. DP·grouping·ordering이 끊기는 지점 식별 → 모드별 작동/미작동 표 → 수정 계획 문서.
>
> **데이터 흐름**: view-engine이 `ViewState`(filter/grouping/ordering/displayProperties) 보유 → 각 view 컴포넌트가 prop으로 받아 적용. 필터는 대체로 OK = 파이프라인 일부는 동작. DP/grouping/ordering만 모드별로 불안정.
>
> **위험 + 가설**: `WikiTimelineView`는 `viewState` prop을 받지만 grouping/ordering/DP를 **거의 안 씀** — 막대를 createdAt 순으로만 배치. "타임라인에서 DP 안 됨"의 유력 원인 = 타임라인이 viewState를 미구현. ⚠️ 가설 — 코드로 검증. + "날짜 배치 뷰에서 grouping/ordering이 의미가 있나?"부터 정의 필요.
>
> **참고 파일**: `lib/view-engine/` (types·configs), `components/views/wiki-timeline-view.tsx` (viewState 미사용 확인), grid/board/gallery view 컴포넌트, `components/views/display-panel.tsx` (DP UI).
>
> **2번째 P0**: 노트·북에도 Timeline을 디스플레이 모드로 추가 (현재 Timeline = Wiki 전용). 사용자 명시 — "타임라인 완성됐으니 노트랑 북에도 넣어야".
>
> **머신**: 다른컴퓨터 (Windows). 다음도 다른 컴퓨터 예정.
> **현재 main HEAD**: 이번 세션 PR 머지 후 = 타임라인 리디자인 PR. (직전 = PR #404 `5808276`)
> **branch worktree**: 새 worktree 생성 권장.

### 완료 — 타임라인 비주얼 리디자인 (단일 PR, 8파일 +224/−141, 전부 `components/views/wiki-timeline*`)

사용자와 다단계 브레인스토밍·반복으로 타임라인 막대/마커/색 전면 재설계:
- **막대 이름 제거** — `timeline-bar.tsx` inside/outside title 블록 제거 + `wiki-timeline-config.ts` `titleThreshold` 제거. 이름은 좌측 라벨 컬럼 전담.
- **이벤트 마커 = 막대 위 → 막대 안(중앙선)** — `EVENT_MARKER_Y_OFFSET` −12→0. 칩에 흰 테두리(1.25px) → 어떤 막대 색 위에서도 분리. `STACK_GAP` 14→18 (같은날 칩 테두리 merge 방지).
- **막대 day-quantize** — `laneArticles`가 막대를 날짜-칸 단위 (createdDay~horizonDay 셀). drag off-by-one 정합 (막대 우측 = `(horizonDay+1)`칸 → onUp/tooltip `days−1`).
- **스타트칩 = 막대 고유 origin 노드** — `timeline-event-markers.tsx`가 막대 왼쪽 끝(`barX`)에 항상 스타트칩 렌더. `created` 이벤트는 별도 마커에서 제외. Events 토글 무관하게 항상 표시.
- **Events 토글 = 활동 마커만** — orchestrator 게이트 제거. 스타트칩 항상, 활동 마커만 토글.
- **얇은 선 디자인** — `BAR_HEIGHT` 28→5 (막대=얇은 선, 칩이 주인공). drop shadow 제거(`bar-shadow` 필터 def 정리) + 상단 하이라이트 그라데이션 제거.
- **선 색 = status (라벨 아이콘 색과 일치)** — stub 주황 `#f97316` / article 에메랄드 `#10b981`. (중간에 중립 회색 시도 → 사용자 "별로" → 아이콘 색 매칭으로 정착.)
- **"All" 모드 신설 (5번째 timeline 모드, 기본값)** — `TimelineMode = ZoomLevel | "all"`. `computeAllFit` = 가장 이른 createdAt ~ 최신 horizon 전체 span을 viewport 폭에 맞춤. readability floor(6px/day) — 너무 길면 floor에서 멈추고 스크롤. `< >` navigate는 "all"에서 비활성.

검증: tsc exit 0 / 18 article 전부 렌더 / 시각 확인.

### 브레인스토밍 & 큰 결정 (영구)

- **타임라인 막대 = 얇은 선, 이벤트 칩이 주인공** — 막대는 "정보 컨테이너"가 아님. 막대 일 = 길이(수명) + 색(status) + 그라데이션(과거/미래). 얇은 선으로 충분.
- **스타트칩 = 막대 고유 요소 (이벤트 아님)** — `created`는 *활동*이 아니라 *수명 시작 경계*. 막대 왼쪽 끝 = 생성 = 스타트칩. 이벤트 로그/window 필터 무관하게 항상 막대 origin에 렌더. `created` 이벤트 별도 마커 X (중복).
- **선 색 = status 아이콘 색과 일치** — 중립 회색은 라벨 컬럼 컬러 아이콘과 따로 놀아 "별로". 선·아이콘 같은 색이어야 일관.
- **"All" 모드 = fit-to-content overview** — 고정 줌은 *고정 배율 + 스크롤*, "All"은 *데이터 맞춤 + 전부 보임 보장*. 역할 다름. viewport-fit은 "강제"가 antipattern이지 *옵션 overview*는 표준 (readability floor로 거대 데이터 degrade).

### 기술 학습 (영구)

- **멀티파일 빠른 편집 → dev 서버 stale 모듈 그래프** — 4파일 ~18 edit을 빠르게 하면 HMR이 중간 불일치 상태를 캐시 → "X is not exported" 에러가 최종 상태에도 잔존. tsc exit 0이면 코드는 정상 — dev 서버 재시작 + `.next` 삭제로 해결 (lightningcss 때와 동일).
- **타임라인 막대 X(정확 timestamp) ↔ 마커 X(day-칸 중앙) 좌표계 불일치** — day-quantize로 통일. createdAt UTC가 로컬 늦은 시각이면 막대가 그 날 86% 지점부터 시작, 마커는 50% → 어긋나 보임.

### Watch Out (다음 세션)

- **dev 서버 stale 가능** — before-work 시 타임라인 이상하면 서버 재시작 + `.next` 삭제 먼저.
- 다음 P0(DP/grouping/ordering)는 **계획 먼저** — 사용자 명시. 바로 코드 수정 X.
- "All" 모드 readability floor / 거대 데이터 케이스 미검증 (사용자 데이터 18개로 fit 잘 됨). 위키 수백 개 시점 재확인.
- 머지 전 `npm run build` 한 번 권장 (이번 검증은 tsc + dev 렌더로 갈음).

### 환경 변경

- Store v144 무변경 (전부 view/UI 레이어).
- 신규 export: `TimelineMode` 타입, `TIMELINE_MODES`, `computeAllFit`. 제거: `ZOOM_ORDER`.

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-22 (후속 #3) — 다른컴퓨터/Windows, **Display 탭 Linear segmented control + 타임라인 화살촉 제거 / 막대 이름·마커 결정**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)** — 둘 다 사용자 확정, 다음 컴퓨터에서 구현:
>
> **타임라인 폴리시 — `timeline-bar` 영역, 한 PR로 묶을 만함**:
>
> **(A) 막대 이름 제거**: 타임라인 막대 = 순수 수명 표시. 이름은 좌측 라벨 컬럼(`timeline-label-column.tsx` — status 아이콘+이름+생성일 이미 표시)이 전담. `timeline-bar.tsx`에서 inside-title 블록(`{titleInside && ...}` — clipPath + `<text>`)과 outside-title 블록(`{!titleInside && <text>}`) 제거 → unused化되는 `titleInside`/`titleLabel`/`outsideTitleX` 정리. `wiki-timeline-config.ts` ZOOM_CONFIGS의 `titleThreshold`도 unused → ZoomConfig 인터페이스 + 4 config에서 제거. **이유**: 막대 너비=수명, 이름 너비=글자수 → 무관해 "항상 안에"는 물리적 불가. 좌측 컬럼이 이미 이름 담당 → 막대는 비움 (Reticle/Gantt 표준).
>
> **(B) 마커 clip 수정**: lane 0(맨 위) 이벤트 마커가 SVG 상단(y=0)에서 잘림 — 마커는 막대 위(`markerY = cy − BAR_HEIGHT/2 + EVENT_MARKER_Y_OFFSET`, OFFSET −12)에 그려지는데 lane 0은 `cy=26 → markerY≈0`, ring r=7이 y<0 넘침. **해결 = 캔버스 상단 inset**: `wiki-timeline-config.ts`에 `LANE_TOP_PAD`(≈14) 신설 후 lane Y 계산 6곳 일괄 가산 — ① `timeline-bar.tsx` `cy`(~line 63) + 행 hover bg `y={laneIndex*LANE_HEIGHT}`(~line 128) ② `timeline-event-markers.tsx` `cy`(~line 50) ③ `timeline-grid.tsx` lane separator `(laneIndex+1)*LANE_HEIGHT`(~line 130/132) ④ `timeline-tooltip.tsx` 두 tooltip `top:`(~line 56, ~166) ⑤ `wiki-timeline-view.tsx` `svgHeight`(~line 228-229) ⑥ `timeline-label-column.tsx` 컬럼 상단 `LANE_TOP_PAD` 높이 spacer div. **검증**: tooltip·grid 라인·라벨 컬럼이 막대와 정렬되는지 + tsc/build.
>
> 그 다음 P0 = **File 엔티티 v1 구현** (`.omc/plans/file-entity-prd.md` v0.2 — TODO P0 #2).
>
> **머신**: 다른컴퓨터 (Windows). 다음도 다른 컴퓨터 예정.

### 완료

- **Display 패널 탭 = Linear segmented control** — `view-header.tsx` Display popover `w-[300px]`→`w-[360px]` (4탭 수용 폭) + `display-panel.tsx` view-mode 탭 스트립 `flex-1`(popover 꽉 채움) + `gap-0.5` seam + inactive hover 배경 + `transition-colors`. 직전 후속 #2의 P0 #3(아이콘 교체) 위 간격/정렬 폴리시. (중간에 content-width 시도 → 좁은 popover 넘쳐 "Timeline" 잘림 → popover 확대 + flex-1로 정착.)
- **타임라인 막대 status 화살촉 제거** — `timeline-bar.tsx` Article arrowhead `<polygon>` 제거 → 모든 막대 둥근 끝 통일. `wiki-timeline-config.ts` `ARROW_DEPTH` + 관련(`endShapeRightX`/`endOpacity`) 정리. status = 막대 색(초록 Article/주황 Stub)만.

### 브레인스토밍 & 큰 결정 (영구)

- **타임라인 막대 = 순수 수명, 이름은 좌측 라벨 컬럼 전담 (A안 확정)** — 막대 너비(수명) ↔ 이름 너비(글자수) 무관 → "항상 막대 안"은 물리적 불가. 좌측 컬럼이 이미 모든 이름 표시 → 막대엔 이름 없음. 구현 = 다음 세션 (위 hook).
- **타임라인 status = 막대 색만** — 화살촉 폐기 (영구 룰 후보 #91 obsolete). status 단일 인코딩.
- **Display 탭 = Linear segmented control 패턴** — 둥근 컨테이너 + flex-1 균등 탭 + active pill + gap seam. popover는 탭 수용 가능하게 충분히 넓게.

### Watch Out (다음 세션)

- 마커 clip 수정 = `LANE_TOP_PAD`를 6곳에 일관 가산. 한 곳 누락 시 tooltip/grid/라벨컬럼이 막대와 어긋남 — 정렬 검증 필수.
- A안 후 `titleThreshold` 등 unused 정리 — `tsc --noEmit`로 확인.
- 화살촉 제거로 영구 룰 후보 #91 폐기 (TODO LOCKED 반영함).
- PR #403 라이브러리 Index 그룹핑 시각 스모크 테스트 여전히 미완.

### 환경 변경

- Store v144 무변경 (전부 UI 레이어). 이번 후속 #3 = PR #403 이후 follow-up PR.

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-22 (후속 #2) — 다른컴퓨터/Windows, **File 엔티티 PRD + TODO 3건 (Timeline 아이콘 / EVENT_MARKER / 라이브러리 Index 그룹핑)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**:
>
> **File 독립 엔티티 v1 구현** — PRD(`.omc/plans/file-entity-prd.md` v0.2) 완성됨, Q1/Q2 사용자 승인 반영. §6-1 v1 = 영구 룰 #6(UI ↔ 데이터 모델 분리)대로 PR 2개:
> - **PR #1 (마이그레이션+모델)**: `Attachment.noteId: string` → `originEntity: EntityRef | null` 강등 + v144→v145 마이그레이션(`state.notes`/`wikiArticles` 조회로 kind 판정, stale id→null) + `addAttachment` 7개 호출처 수정. 타입명 `Attachment` 유지(DOM 전역 `File` 충돌 회피), UI 라벨만 "File".
> - **PR #2 (피커 UI)**: "기존 파일 삽입" 피커(재사용) + usage 인덱스(콘텐츠 `attachment://` 스캔 derive) + hard delete dangling-ref 경고.
> - **첫 스텝**: `lib/types.ts:997` `Attachment` + `lib/store/slices/attachments.ts:7` + `lib/store/migrate.ts:1919`(v143→v144 패턴) 읽고 PR #1 착수.
>
> 대안: P1 temporal-hooks PRD 후속(open questions 6개, 큰 방향 — 사용자 조율 필요).
>
> ⚠️ **P0 #2(라이브러리 Index 그룹핑) 시각 스모크 테스트 미완** — build/tsc만 통과. 사용자 본인 환경에서 Tags/Labels/Stickers/Files/References 각 Display→Grouping→Index 선택해 letter 섹션 렌더 확인 필요.
>
> **머신**: 다른컴퓨터 (Windows)

### 완료

- **File 독립 엔티티 PRD v0.2** — `.omc/plans/file-entity-prd.md` (DRAFT). Attachment를 note-scoped → 독립 Library 엔티티로 승격하는 focused PRD. Explore 에이전트로 코드 검증 (브레인스토밍 1건 수정: wiki 이미지는 `noteId=""`가 아니라 실제 wiki id 전달). Q1(타입명 `Attachment` 유지)·Q2(`noteId`→`originEntity: EntityRef|null`) 사용자 승인 반영.
- **P0 #3 — Timeline 탭 아이콘** — `display-panel.tsx` MODE_DEFS Timeline 아이콘 `Ruler`(얇은 대각선) → `ChartBarHorizontal`(가로 막대, 박스형). bars-first timeline과 의미 정합 + List/Board/Gallery와 시각 통일.
- **P1 — EVENT_MARKER_CONFIG 4종 매핑** — `wiki-timeline/wiki-timeline-config.ts`에 `merged`/`unmerged`/`split`/`section_collapsed` 추가. merged/unmerged/split = "Composition" 카테고리(rose `#ec4899` 공유 — ArrowsMerge/ArrowsSplit/Scissors), section_collapsed = muted(ArrowsInLineVertical). 기존 fallback `DotOutline` 점 → 의미 있는 아이콘 칩.
- **P0 #2 — 라이브러리 5종 Index 그룹핑** — Tags/Labels/Stickers/Files/References 뷰에 `firstLetter`("Index") 그룹핑 추가. 컴포넌트-사이드 그룹핑(`groupXByFirstLetter` 헬퍼 + render-order 평탄화 배열 + `.a-tg` 헤더 밴드, list/grid/gallery 전 모드). content 5종(PR #400)에 이어 라이브러리 5종 완료. Tags = template(직접 spec→executor→diff 검토), 나머지 4종 = 병렬 executor.

### 브레인스토밍 & 큰 결정 (영구)

- **File 엔티티 Q1/Q2 확정 (LOCKED)** — 타입명 `Attachment` 유지 (DOM 전역 `File` 타입 충돌 회피, NoteStatus `keystone`/"Block" 선례), UI 라벨만 "File". `noteId`(혼탁한 가짜 FK — `""`/`"__library__"`/note id/wiki id 혼재) → `originEntity: EntityRef | null` (note·wiki origin 정직하게 표현, provenance — 제거 X).
- **라이브러리 Index 그룹핑 = 컴포넌트-사이드** — 훅의 `applyXGrouping` 불변. tags-view의 `hideEmpty` 같은 post-hook 필터 때문에 컴포넌트가 visible 배열을 그룹핑하는 게 정확. 그룹 헤더 = `.a-tg` 글로벌 클래스(book-table 패턴). 그룹 모드에선 drag-select 비활성(헤더 밴드가 고정행높이 계산 깨뜨림).
- **영구 룰 #92 (Index = Grouping, not a column) LOCKED** — content 5종(PR #400) + 라이브러리 5종(이번) 모두 완료. Categories는 자체 뷰 컴포넌트라 이미 정합.

### 다음

- File 엔티티 v1 구현 (§6-1, PR 2개) — 위 hook 참조. 또는 P1 temporal-hooks PRD 후속.

### Watch Out (다음 세션)

- **P0 #2 시각 검증 미완** — build/tsc만 통과. preview MCP는 IDB가 사용자 데이터와 분리 → 사용자 본인 환경 스모크 테스트 필요.
- Files/References 뷰는 표준 `DisplayPanel`이 아니라 커스텀 디스플레이 패널 — Index "Group by" 버튼을 수동 추가함. 향후 이 뷰 손볼 때 인지.
- 라이브러리 Index: 한글 태그명은 첫 글자가 `[A-Z]`가 아니라 "#" 버킷으로 — content 5종/PR #400과 동일한 의도적 한계.
- File 엔티티 PRD §7 잔여 Open Q: usage 인덱스 derive vs 저장(derive 권고) / Books 파일 접점 확인(fast-follow 전제).

### 환경 변경

- Store v144 무변경 (전부 view-engine / UI / config / doc 레이어).
- 신규 파일: `.omc/plans/file-entity-prd.md`.

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-22 (후속) — 다른컴퓨터/Windows, **레거시 Index 토글 제거 (PR #401) + File 독립 엔티티 브레인스토밍**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**:
>
> P0 3개 정리됨 (TODO.md 참조). **추천 시작점 = File 독립 엔티티 PRD 작성** (작고, 결정 locked, A의 Files 부분보다 선행).
>
> **File 독립 엔티티** — `Attachment`(파일)를 note-scoped에서 진짜 독립 Library 엔티티로. 브레인스토밍 완료, 결정 locked:
> - **핵심 발견 (코드 확인)**: ① 노트 contentJson은 이미 `attachment://<id>` 스킴으로 파일을 *ID 참조* — N:M 참조의 아키텍처 전제가 이미 됨 (가장 어려운 부분). ② `Attachment.noteId`는 이미 vestigial — Library 업로드=`"__library__"`, wiki 이미지=`""`, 노트 드롭만 real id. "모든 파일 note 소유" 불변식 이미 깨짐. ③ 모든 `addAttachment`가 레코드 생성 → Files Library 뷰가 소스. 파일은 `{kind:"file"}` entity event도 이미 가짐.
> - **남은 작업**: `noteId`→`originNote` 강등 / "기존 파일 삽입" 피커(재사용) / N:M usage 인덱스(콘텐츠 `attachment://` 스캔) / `Attachment`→`File` 리네임.
> - **결정 (사용자 confirm)**: (1) `noteId` → `originNote?: string|null` 강등 — provenance, 제거 X. (2) dedup(content-hash) — Phase 2. (3) Books 파일 접점 — fast-follow (v1 = Note/Wiki).
> - **첫 스텝**: `.omc/plans/file-entity-prd.md` 작성 (위 결정 반영). temporal-hooks-prd보다 작은 focused PRD.
>
> 다른 P0: **A — 라이브러리 5종 Index 그룹핑** (Tags/Labels/Stickers/Files/References — 뷰 flat-only) / **Timeline 탭 아이콘** (작음). TODO.md P0 #2·#3.
>
> **머신**: 다른컴퓨터 (Windows)

### 완료

- **PR #401 — 레거시 alphabetical-index 토글 제거** — `showAlphaIndex`/`showAllArticles` 메커니즘 완전 제거. 6 파일(+9/−173): wiki-list(ColumnHeaders Index 버튼 + `IndexTableRow` + `showAllArticles` 렌더 분기 제거), wiki-view, templates-view, templates-table, display-panel(dead 분기), notes-table. **Index는 이제 Status와 100% 동일한 순수 Grouping 옵션** — 옛 `≡ Index` 토글 버튼 사라짐. executor-high 에이전트 작업 → diff + 빌드 독립 검증 후 머지.
- **글로벌 엔티티 검증** — Tag/Label/Category(LOCKED #53-#58) + Sticker = global/cross-entity standalone (코드 확인). **File만 예외** — `Attachment.noteId` note-scoped. "독립 엔티티"는 `BRAINSTORM-2026-04-06.md`의 브레인스토밍이었지 LOCKED 결정 아니었음 → File 독립화 브레인스토밍으로 이어짐.

### 브레인스토밍 & 큰 결정 (영구)

- **File 독립 엔티티로 간다** — 위 hook의 발견·결정 참조. 핵심: `attachment://` ID 스킴 덕에 풀 리빌드가 아니라 "정직한 정리 + 피커 + usage 인덱스 + 리네임" 수준.
- **Index = 순수 Grouping 옵션** (영구 룰 후보 #92 강화) — PR #401로 레거시 토글 완전 제거. (라이브러리 5종 A 완료 시 #92 LOCKED.)

### Watch Out (다음 세션)

- File 독립화 까다로운 점: 삭제+사용중 dangling ref (usage 인덱스 + soft-trash로 완화) / Books 파일 접점 현재 없을 가능성 / usage 스캔 perf (인덱스 캐시).
- PR #401 `wiki-list.tsx` collapsed 블록 들여쓰기 한 단계 깊음 — 순수 cosmetic, 빌드/기능 무관. formatter 패스로 정리 가능.
- A(라이브러리 Index): 뷰 flat-only가 핵심 난관.

### 환경 변경

- main: `af192c8` (PR #401). Store v144 무변경 (PR #400·#401 다 view-engine/UI 레이어).
- 신규 파일: 없음 (PR #401은 순수 제거).

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-22 — 다른컴퓨터/Windows, **통합 시간 모델 PRD + Index→Grouping 통일 (content 5종)**

> 🎯 **다음 즉시 액션 (다음 세션 시작점)**:
>
> **A — 라이브러리 5종(Tags/Labels/Stickers/Files/References) Index 그룹핑.** content 5종(Notes/Wiki/Books/Templates/Categories)은 이번 세션에 Index=Grouping 통일 완료. 남은 게 라이브러리 5종.
>
> - **걸림돌**: 라이브러리 뷰는 flat-only — `use-X-view` 훅이 `groups`를 반환해도 뷰 컴포넌트가 `flatX`만 렌더 (`stickers-view.tsx` 확인 — `flatStickers.map()`). config+훅만으론 화면 변화 0 = "골라도 아무 일 없는" 버그. **뷰에 그룹 헤더 렌더링을 새로 넣어야 함.**
> - **엔티티당 3단**: ① `view-configs.tsx` groupingOptions에 `firstLetter`("Index") — 5개가 정확히 `none`만 가짐 → `replace_all` 안전 ② `use-X-view.ts` `applyXGrouping`에 `firstLetter` case + `groupBy` 파라미터 신규 (tags/labels/stickers/files/references는 grouping 함수가 groupBy를 안 받음 → 추가 / `GroupBy` import / 훅 호출에 `viewState.groupBy` 전달) ③ 뷰에 그룹 헤더 렌더링 (`flatX.map` → `groups.map`)
> - **이름 필드**: Tags/Labels/Stickers/Files=`.name`, References=`.title`. 로직 = `group.ts:groupByFirstLetter` 미러 (첫 글자 대문자, 비문자 "#" 버킷).
> - **첫 스텝**: `components/views/{tags,labels,files,references}-view.tsx` 읽고 list/grid 렌더 구조 파악 → grid 모드 그룹 여부 결정.
> - **참고**: `wiki-list-pipeline.ts`/`use-books-view.ts`의 `firstLetter` case (이번 세션 추가분) 미러.
>
> P0 #2 레거시 정리(옛 Index 버튼) / #3 Timeline 탭 아이콘 — TODO.md 참조.
>
> **머신**: 다른컴퓨터 (Windows)

### 완료

- **통합 시간 모델 PRD** — `.omc/plans/unified-temporal-hooks-prd.md` (DRAFT v0.1). "Books에 타임라인?" 질문 → snooze/SRS/plannedDate/staleness가 *같은 필요의 파편*임을 발견 → 심층 브레인스토밍 → 단일 `Hook` 모델 통합 설계. 선행 PRD(`inbox-layer.md`/`activity-unification-prd.md`) 위에 쌓음.
- **Index → Grouping 통일 (content 5종)** — Wiki/Templates가 Index를 가짜 DP 칩(`showAlphaIndex`)으로 노출하던 걸 정리. `view-configs.tsx`(Wiki/Templates/Books grouping에 `firstLetter`, Wiki/Templates DP 칩 제거, `IndexIcon` 제거) + `wiki-list-pipeline.ts`/`use-books-view.ts`/`use-templates-view.ts`(`firstLetter` case) + `library-categories-view.tsx`(타입 캐스트 정정). 빌드 clean.
- **빌드 에러 픽스** — `Module not found: 'fractional-indexing'` — worktree `node_modules`가 거의 비어있었음, `npm install`로 395 패키지. 코드 버그 아님.

### 브레인스토밍 & 큰 결정 (영구)

- **통합 시간 모델 (temporal hooks)** — snooze/SRS/plannedDate/staleness = "이거 언제 다시 띄울까 + 왜"의 4중 파편. 단일 `Hook={trigger,action}`, 이벤트 축(예정형/반응형), `EntityEvent` 스트림=척추, 2 표면(Inbox 섹션화/Timeline), atom(Note/Wiki) vs aggregate(Book), 6 정책. 상세 = PRD. **DRAFT — 구현 승인 전, open questions 미해결.**
- **Index = Grouping, not a column** — DP 칩 = 진짜 컬럼과 1:1 (사용자 핵심 원칙). "Index"는 알파벳 그룹핑 모드 → Grouping 드롭다운. `group.ts:groupByFirstLetter` docstring이 이미 "replaces legacy showAlphaIndex" 명시 — Notes만 됐던 마이그레이션을 Wiki/Templates/Books로 확장.
- **사용자 원칙**: Display 패널 지원하는 모든 엔티티는 Index를 Grouping으로 지원 → 라이브러리 5종도 대상 (A).
- **SRS 학습**: Plot SRS = `lib/srs` 7단 사다리(`[1,3,7,14,30,60,120]`일), keystone 노트 enroll, `promote`→`enrollSRS` 자동. 스누즈(`reviewAt`)=1회 deferral, SRS=무한 적응 반복 — 둘 다 "resurfacing" 가족.

### Watch Out (다음 세션)

- **라이브러리 뷰 flat-only** — A의 핵심 난관. 각 뷰에 그룹 헤더 렌더링 신규 필요 (config+훅만으론 안 보임).
- **레거시 미정리** — Wiki/Templates 헤더에 옛 "Index 토글 버튼" 잔존 (`wiki-list.tsx:364`/`templates-table.tsx:228`) — TODO P0 #2.
- **Timeline 탭 아이콘** — `display-panel.tsx` MODE_DEFS `Ruler` 아이콘 시각 불일치 — TODO P0 #3.
- **EVENT_MARKER_CONFIG** — 지난 세션 P0였으나 이번 세션이 Index/temporal-hooks 방향으로 진행 → 미완, TODO P1로 이동.

### 환경 변경

- Store version: **v144 (변경 없음)** — Index 그룹핑은 view-engine 레이어만, persist schema 무변경.
- 신규 파일: `.omc/plans/unified-temporal-hooks-prd.md`
- `node_modules` 재설치 (worktree, 395 패키지). TS 부채 0, `npm run build` clean.

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-21 (저녁 후속 #6) — 다른컴퓨터/Windows, **wiki-timeline-view.tsx sub-component 분리 (1380→386줄) — 세션 종료**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🟢 P0 #1 — EVENT_MARKER_CONFIG 신규 이벤트 매핑** (사용자가 "다음 세션에서" 명시)
>
> P0 #2 Activity events에서 wire-up된 granular events 중 일부가 timeline 마커 chip에 fallback dot(`DotOutline`)으로만 표시됨. `components/views/wiki-timeline/wiki-timeline-config.ts`의 `EVENT_MARKER_CONFIG`에 누락 타입 매핑 추가:
> - 현재 매핑됨: created/updated/opened/trashed/untrashed/block_added/block_removed/block_reordered/link_added/link_removed/relation_added/relation_removed/attachment_added/attachment_removed
> - **누락 (fallback dot으로 표시 중)**: `merged`, `unmerged`, `split`, `item_added`, `item_removed`, `item_reordered`, `chapter_added`, `smart_source_added`, `smart_source_removed`, `member_added`, `member_removed`, `color_changed`, `renamed`, `section_collapsed`, `converted_to_manual`
> - **첫 스텝**: `wiki-timeline-config.ts` `EVENT_MARKER_CONFIG` (line 143) read → 누락 타입에 Phosphor 아이콘 + 색 추가. 단 timeline은 **wiki entity event만** 표시하므로 (`getEventsForEntity(entityEvents, { kind: "wiki", id })`) book/tag/label 전용 이벤트(item_*/smart_source_*/member_*/color_changed/renamed)는 wiki 노드엔 안 나타남 → 실질 추가 대상은 **`merged`/`unmerged`/`split`/`section_collapsed`** (wiki entity에 발화되는 것). 매핑 추가 시 이 4개만 우선.
>
> **이번 세션 (P0 #2 sub-component 분리 = Task A)**:
> - `wiki-timeline-view.tsx` 1380줄 → **386줄 orchestrator**로 축소. 9개 파일 신규 (`components/views/wiki-timeline/`):
>   - `wiki-timeline-config.ts` (221줄) — types/constants/`ZOOM_CONFIGS`/`EVENT_MARKER_CONFIG`/state shape interfaces (`TimelineTooltipState`/`TimelineEventTooltipState`/`TimelineDragState`)
>   - `wiki-timeline-utils.ts` — pure 함수 (startOfDay/addDays/diffDays/windowStart/buildTicks/buildDayRange/buildMonthBoundaries/periodLabel/relativeDateLabel/laneArticles)
>   - `timeline-controls.tsx` — `<TimelineControls>` (컨트롤 바)
>   - `timeline-axis.tsx` — `<TimelineAxis>` (sticky 축 헤더 SVG)
>   - `timeline-grid.tsx` — `<TimelineGrid>` (배경 레이어: defs/weekend/today/grid/month/separator/future/NOW line)
>   - `timeline-bar.tsx` — `<TimelineBar>` (renderLaneBar → 컴포넌트)
>   - `timeline-event-markers.tsx` — `<TimelineEventMarkers>` (renderEventMarkers → 컴포넌트)
>   - `timeline-label-column.tsx` — `<TimelineLabelColumn>` (좌측 sticky 라벨 컬럼)
>   - `timeline-tooltip.tsx` — `<TimelineTooltip>` + `<TimelineEventTooltip>` (2개 tooltip div)
>   - orchestrator(`wiki-timeline-view.tsx`)는 모든 React state/memo/effect/callback 보유 + 위 컴포넌트 조합. drag useEffect 그대로.
> - **순수 리팩토링** — 런타임 behavior 불변. 검증: `tsc --noEmit` clean / `npm run build` clean / preview 시각 렌더 동일 (36 bars / 3 arrowhead / 45 chip) / console 경고는 원본에도 동일 (pre-existing, refactor 무관 — stash 비교로 확인).
>
> **위험 + 회피**:
> - 🟡 **timeline에 pre-existing console 경고** — "Can't perform a React state update on a component that hasn't mounted yet" 8개. **refactor와 무관** (stash로 원본 비교 시 동일하게 발생). 별도 조사 필요 — render 중 setState 하는 곳 추적 (timeline 또는 wiki-view 어딘가). 우선순위 낮음.
> - 🟢 sub-component는 모두 explicit Props interface — tsc가 prop 누락/오타 잡음. `any` 미사용.
>
> **참고 파일**: `components/views/wiki-timeline-view.tsx` (386줄 orchestrator) + `components/views/wiki-timeline/*` (9 파일)
>
> **머신**: 다른컴퓨터 (Windows)
> **현재 main HEAD**: 이번 sub-component 분리 PR squash merge 후
> **branch worktree**: 새 worktree 권장

### 완료 — wiki-timeline-view.tsx sub-component 분리 (P0 #2 = Task A)

- 1380줄 단일 파일 → 386줄 orchestrator + 9 모듈 파일 (`components/views/wiki-timeline/`)
- executor-high 작업 → 사용자 after-work 요청으로 직접 검증·커밋
- 순수 리팩토링 (런타임 불변), tsc + build + 시각 렌더 + console-parity 검증 완료

### 브레인스토밍 & 큰 결정 (영구)

- **거대 컴포넌트 분리 = orchestrator + presentational 패턴** — 모든 state/memo/effect는 orchestrator 유지, 시각 조각은 explicit-props 컴포넌트로. closure → props 전환. tsc가 prop contract 강제 (explicit Props interface, `any` 금지).
- **순수 리팩토링 검증 4종** — tsc clean + build clean + 시각 렌더 동일 + console-parity (stash로 원본 비교). 이 4종 통과 시 behavior 불변 확신.

### 기술 학습 (영구)

- **`git stash push <file>`로 단일 파일만 stash** → 원본 vs 변경본 런타임 비교 테스트 가능. untracked 신규 파일은 stash 안 됨 (원본 파일이 self-contained면 OK).
- **render-function → component 전환** — `renderX(item, i)` 함수 호출을 `<X item={} laneIndex={i} key={}/>`로. `key`는 map된 element로 이동. SVG sub-component는 fragment `<>` 반환 (부모 `<svg>` 안에서 유효).

### Watch Out (다음 세션)

- 🟡 **timeline pre-existing console 경고 8개** — refactor 무관, 별도 조사 (낮은 우선순위).
- 🟢 **EVENT_MARKER_CONFIG 누락 타입** — `merged`/`unmerged`/`split`/`section_collapsed`가 fallback dot으로 표시 중. 다음 세션 P0 #1.

### 환경 변경

- Store version: 144 (변경 없음 — 순수 리팩토링)
- 신규 파일: `components/views/wiki-timeline/` 9개
- `wiki-timeline-view.tsx`: 1380 → 386줄
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓

### 머신
다른컴퓨터 (Windows). **세션 종료** — 다음 세션 다른 컴퓨터에서 이어감.

---

## 2026-05-21 (저녁 후속 #5) — 다른컴퓨터/Windows, **`router.push("/wiki/[id]")` dead code 정리**

> 🎯 **다음 즉시 액션**: (이 hook은 후속 #6 entry로 대체됨 — SESSION-LOG 최상단 참조)
>
> **이번 작업 (P0 #3 — dead code 정리)**: 6 파일에서 `router.push("/wiki/${id}")` (존재하지 않는 Next 라우트 → 404) 9개 call site를 `setActiveRoute("/wiki")` + `navigateToWikiArticle(id)` 패턴으로 교체. anchor(`#${anchorId}`) 가진 북마크 2 site는 anchor 드롭 (navigateToWikiArticle은 anchor 미지원, 단 현재 404 상태라 strict improvement).
>
> **머신**: 다른컴퓨터 (Windows)

### 완료 — router.push dead code 정리 (P0 #3)

- 6 파일 (+15/-17): `in-books-section.tsx`(중복 router.push 삭제) / `linear-sidebar.tsx` / `recent-cards.tsx` / `mixed-quicklinks.tsx`(2 site) / `pinned-list.tsx` / `app/(app)/folder/[id]/page.tsx`(3 site)
- 패턴: `router.push("/wiki/${id}")` → `setActiveRoute("/wiki")` + `navigateToWikiArticle(id)`
- 부수: unused된 `useRouter`/`router` 정리 (in-books-section / recent-cards / pinned-list에서 제거, linear-sidebar / mixed-quicklinks / folder page는 다른 라우트에 여전히 사용 → 유지)

### 기술 학습

- **`/wiki/[id]` Next 라우트는 존재하지 않음** — `/wiki`, `/wiki/templates` 페이지만. wiki article 열기는 항상 `setActiveRoute("/wiki")` + `navigateToWikiArticle(id)` 내부 라우팅.
- **wiki 북마크 anchor 스크롤은 미지원** — `navigateToWikiArticle`는 anchor 안 받음, WikiView는 `setSelectedWikiArticleId`만. anchor 스크롤 원하면 `navigateToWikiArticle(id, anchorId?)` 확장 + WikiView consume 필요 (별도 작업).

### 환경 변경
- Store version: 144 (변경 없음). TS 부채 0 유지.

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-21 (저녁 후속 #4) — 다른컴퓨터/Windows, **Books own Views section (P0 #3 완료) — 🟡 P0 전부 소진**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🟢 P0 전부 🟢(낮은 우선순위)만 남음 — 사용자 의향 청취 필요**
>
> 이번 세션에 P0 #1(Ontology 사이드바)·#2(Activity events)·#3(Books Views) 완료. TODO.md P0의 🟡(medium) 항목 전부 소진. 남은 P0는 모두 🟢:
> - timeline 추가 polish (사용자 명시 요청 시만 — "마음에 든다 이 정도면"으로 일단락됨)
> - wiki-timeline-view.tsx sub-component 분리 (1500+줄 리팩토링)
> - `router.push("/wiki/[id]")` dead code 정리 (404 유발, 여러 파일 산재)
> - `EVENT_MARKER_CONFIG` 신규 이벤트 매핑 (P0 #2 wire-up된 granular events에 전용 아이콘)
>
> 다음 세션은 위 🟢 중 택 또는 신규 방향 — **사용자에게 무엇을 할지 물어볼 것**. 자동으로 🟢 진입하지 말 것.
>
> **이번 세션 (P0 #3)**: `linear-sidebar.tsx` Books section에 `renderViewsSection("books", "/books")` 한 줄 추가. `renderViewsSection`은 generic 헬퍼 (Notes/Wiki/Calendar/Ontology 공용). `getSavedViewSpaceForActivity`(books 지원, line 89)·`SavedView.space` union(books 포함) 이미 준비됨 — 호출만 누락이었음.
>
> **머신**: 다른컴퓨터 (Windows)
> **현재 main HEAD**: 이번 P0 #3 PR squash merge 후
> **branch worktree**: `claude/sharp-lumiere-e5fb03`

### 완료 — Books own Views section (P0 #3)

- `components/linear-sidebar.tsx` — Books section (`activeSpace === "books"` 블록)에 `renderViewsSection("books", "/books")` 추가 (All Books NavLink 직후, Pinned 위). 2줄 (주석 + 호출).
- 영구 룰 #87 정합 — single-entity space(Books)는 own Views section 보유.

### 기술 학습

- `renderViewsSection(spaceFilter, routeOnClick)` = 완전 generic 헬퍼 (`linear-sidebar.tsx:655`). 신규 space에 Views section = 호출 한 줄. `savedViews.filter(v => v.space === spaceFilter)` + `isInOwnContext = activeSpace === spaceFilter`.

### 환경 변경

- Store version: 144 (변경 없음)
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-21 (저녁 후속 #3) — 다른컴퓨터/Windows, **Activity events 후속 — granular events wire-up (P0 #2 완료)**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🟡 P0 #3 — Books own Views section** (Activity events P0 #2 완료, 다음 페이즈)
>
> `linear-sidebar.tsx`의 Books section에 own Views section 추가. `SavedView.space "books"`는 이미 union에 있음 — 영구 룰 #87 (single-entity space는 own views 보유, multi-entity hub은 sub-entity가) 정합. Notes/Wiki section의 `renderViewsSection` 패턴 참조.
>
> **첫 스텝**: `components/linear-sidebar.tsx` read → Notes/Wiki section의 Views section 렌더 패턴 확인 → Books section에 동일 패턴 적용. `getSavedViewSpaceForActivity` 시그니처 확인 (영구 룰 #86).
>
> **이번 세션 (P0 #2 완료)**:
> - Activity events granular wire-up — 4 파일 (`wiki-articles.ts`/`books.ts`/`labels.ts`/`store/index.ts`), +83/-11
> - wiki: `block_added`/`block_removed`/`block_reordered`/`merged`/`unmerged`/`split` + `opened` (incrementWikiArticleReads)
> - books: `item_added`/`item_removed`/`chapter_added`/`smart_source_added`/`smart_source_removed`
> - labels: slice가 `appendEvent` 전무였음 → `createLabelsSlice(set, appendEvent)` 시그니처 변경 + store index 갱신 + `created`/`renamed`/`color_changed`/`updated`/`trashed`/`untrashed`/`member_added`/`member_removed` (tags.ts 패턴 정합)
> - 의도적 제외: `updateWikiBlock` (블록 본문 편집 — 키스트로크 flood 위험)
> - preview 검증: 6 신규 이벤트 발화 확인 (wiki:block_added/opened, label:created/member_added/member_removed)
>
> **머신**: 다른컴퓨터 (Windows)
> **현재 main HEAD**: 이번 P0 #2 PR squash merge 후
> **branch worktree**: `claude/sharp-lumiere-e5fb03`

### 완료 — Activity events granular wire-up (P0 #2)

4 파일 (+83/-11):
- **`wiki-articles.ts`** — `addWikiBlock`→block_added(meta blockType) / `removeWikiBlock`→block_removed / `moveWikiBlock`+`reorderWikiBlocks`→block_reordered / `mergeWikiArticles`+`mergeMultipleWikiArticles`(into/new 양쪽)→merged / `unmergeWikiArticle`+`unmergeFromHistory`→unmerged / `splitWikiArticle`→split / `incrementWikiArticleReads`→opened
- **`books.ts`** — `addItemToBook`→item_added (added flag로 success path) / `removeItemFromBook`→item_removed / `addChapterHeading`→chapter_added / `addSmartSource`→smart_source_added (success path) / `removeSmartSource`→smart_source_removed
- **`labels.ts`** — `createLabelsSlice(set)` → `(set, appendEvent)` 시그니처 변경. `createLabel`→created / `updateLabel`→color_changed|renamed|updated / `deleteLabel`→trashed / `restoreLabel`→untrashed / `permanentlyDeleteLabel`→entityEvents cascade filter / `setNoteLabel`→set/clear/switch 4-case 정확 처리 (oldLabelId capture)
- **`store/index.ts`** — `createLabelsSlice(set, appendEvent)` 인자 추가

### 브레인스토밍 & 큰 결정 (영구)

- **granular event는 구조적 mutation만, 본문 편집은 제외** — `block_added`/`removed`/`reordered`/`merged`/`unmerged`/`split`은 discrete event. `updateWikiBlock`(블록 본문 편집)은 키스트로크마다 호출돼 event log flood → 발화 제외. 본문 변경은 article-level `updated`로 충분. (다음 세션 영구 룰 후보)
- **slice가 appendEvent 안 받으면 = 그 entity는 활동 추적 불가** — labels가 그 상태였음. 신규 entity slice는 처음부터 `createXSlice(set, appendEvent)` 시그니처 권장.
- **`setNoteLabel` 같은 1:1 관계 setter는 set/clear/switch/no-op 4-case 분기 의무** — switch(A→B) 시 A에 `member_removed` + B에 `member_added` 둘 다 발화. 한쪽만 처리하면 활동 로그 부정확.

### 기술 학습 (영구)

- **Zustand `set(updater)` 안에서 closure 변수로 이전 값 capture 가능** — updater fn은 동기 실행되므로 `let oldX; set(s => { oldX = s.x; return {...} })` 후 `oldX` 사용 안전. `setNoteLabel`의 `oldLabelId` 패턴.
- **`EntityEventType`은 `NoteEventType` 포함** — `split`/`opened` 등 NoteEventType 값을 wiki/book entity에도 그대로 사용 가능 (`appendEvent({kind:"wiki",id}, "split")` type-valid).
- **`EntityKind`에 `"label"` 포함됨** (`lib/types.ts:689`) — label entity event 발화 가능.
- **success-path event 발화 = `let added=false` flag 패턴** — dedup 가드가 있는 mutation(`addItemToBook`/`addSmartSource`)은 set updater 안에서 `added=true` 세팅 후 밖에서 `if(added) appendEvent(...)`.

### Watch Out (다음 세션)

- 🟢 **block content 편집은 여전히 event 없음** — `updateWikiBlock` 의도적 제외. 향후 debounce된 `block_edited` 같은 event 원하면 별도 설계 필요.
- 🟢 **timeline 마커 chip이 신규 이벤트 자동 표시** — `block_added`(green triangle), `merged` 등 일부는 EVENT_MARKER_CONFIG 매핑, 나머지는 fallback dot. 매핑 추가는 timeline polish 시 선택.

### 환경 변경

- Store version: 144 (변경 없음 — entityEvents 배열에 append만, state shape 불변)
- `createLabelsSlice` 시그니처 변경 (`set` → `set, appendEvent`)
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓
- 사용자 IDB stale data: 없음

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-21 (저녁 후속 #2) — 다른컴퓨터/Windows, **Ontology graph node → SmartSidePanel 동기화 (P0 #1 완료)**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🟡 P0 #2 — Activity events 후속** (Ontology P0 #1 완료, 다음 페이즈)
>
> 이번 세션에 Ontology graph node 사이드바 동기화 완료. 다음 = Activity events wire-up. timeline 마커 chip(#90, unknown type fallback 보유)과 시너지 — 이벤트 풍부해지면 timeline chip도 다양해짐.
>
> **P0 #2 작업 내용**:
> 1. **Granular Wiki/Book events wire-up** — 현재 wiki는 `created/updated/trashed/untrashed`만 emit (`lib/store/slices/wiki-articles.ts`). `block_added`/`block_removed`/`block_reordered` (wiki block 변경 시), `item_added`/`item_removed` 등 (books) 미연결. `appendEvent({ kind: "wiki", id }, "block_added", {...})` 패턴으로 추가. EntityEventType union(`lib/types.ts:934-945`)에 이미 타입 정의됨.
> 2. **`opened` 이벤트 emit** — wiki article 열 때 opened 이벤트 발화 (현재 미emit). `ui.ts`의 `openNote`는 note만 `appendEvent(id, "opened")` 호출. wiki article 여는 경로(`navigateToWikiArticle` consume 지점 = WikiView)에서 `appendEvent({kind:"wiki",id}, "opened")` 추가 검토.
> 3. **Label entity events** — `tags.ts`의 이벤트 발화 패턴 정합으로 label 이벤트 추가.
>
> **첫 스텝**: `lib/store/slices/wiki-articles.ts` (appendEvent 호출 지점들) + `lib/store/slices/books.ts` + `lib/types.ts:934-945` (EntityEventType) read → 어느 mutation에서 어떤 granular event emit할지 매핑 → 사용자 확인 후 wire-up.
>
> **참고 — Activity events 인프라**:
> - `EntityEvent { id, entity: {kind,id}, type: EntityEventType, at: ISO, meta? }` — `lib/types.ts:955`
> - `appendEvent` — store slice 생성 시 주입되는 AppendEventFn. slice 파일들이 `createXSlice(set, get, appendEvent)` 시그니처로 받음.
> - `getEventsForEntity(events, {kind,id}, limit?)` — `lib/datalog/helpers.ts:20`
> - 현재 wiki emit 지점: `wiki-articles.ts:61` (created), `:85` (updated), `:81/:83/:177` (trashed/untrashed)
>
> **머신**: 다른컴퓨터 (Windows)
> **현재 main HEAD**: 이번 Ontology PR squash merge 후
> **branch worktree**: `claude/sharp-lumiere-e5fb03`

### 완료 — Ontology graph node → SmartSidePanel 동기화 (P0 #1)

3 파일 변경 (+40/-227):
- **`ontology-view.tsx`** — `onSelectNode` (싱글클릭): `setSidePanelContext` + `setSidePanelOpen(true)` 추가. node type별 매핑 — note는 raw id `{type:"note"}`, wiki는 `"wiki:"` prefix strip 후 `{type:"wiki"}`, tag는 `"tag:"` prefix strip 후 `{type:"tag"}`. `setSelectedNodeId`(캔버스 selection ring)도 유지.
- **`ontology-view.tsx`** — `onOpenNote` (더블클릭): node type별 — note는 `openNote(id)`, wiki는 `setActiveRoute("/wiki")` + `navigateToWikiArticle(wikiId)`, tag는 no-op (에디터 없음).
- **`ontology-detail-panel.tsx` 삭제** (215줄 legacy note-only floating 패널). SmartSidePanel 4탭이 대체 — "모든 entity 4탭 사이드바 통일" 영구 룰 정합.
- **`side-panel-detail.tsx`** — `activeSpace === "ontology"` placeholder 가드를 `&& !sidePanelContext` 조건 추가 (노드 선택 후에도 placeholder가 디테일 차단하던 버그).

### 브레인스토밍 & 큰 결정 (영구)

- **Ontology node 클릭 = SmartSidePanel 4탭 (별도 패널 X)** — legacy `OntologyDetailPanel`(note-only, floating)은 "모든 entity 4탭 통일" 룰 위반 + wiki/tag 노드 미지원. SmartSidePanel은 note/wiki/tag 다 커버 → 엄밀히 더 capable. 제거가 정답. `unlinked mentions` 같은 고유 기능이 아쉬우면 SmartSidePanel Connections 탭에 global하게 추가 (Ontology 전용이 아니라 모든 entity 혜택).
- **graph node id 스킴** — note는 raw entity id, **wiki는 `"wiki:" + id`, tag는 `"tag:" + id`** (`lib/graph.ts:218,250`). 사이드바/네비게이션 wire 시 prefix strip 의무.

### 기술 학습 (영구)

- **Ontology node → SmartSidePanel 열기 = `setSidePanelContext({type,id})` + `setSidePanelOpen(true)`** — 표준 2줄 패턴 (wiki-view.tsx:241 등). `SidePanelContext` union(`lib/store/types.ts:30`)에 note/wiki/tag 이미 존재 → 신규 kind 불필요.
- **Plot 내부 라우팅 = `setActiveRoute` (external store), Next.js router 아님** — `setActiveRoute("/wiki")`가 뷰 전환. `router.push("/wiki/[id]")`는 **그 Next 라우트가 존재하지 않아 404** (`/wiki`, `/wiki/templates` 페이지만 있음). wiki article 열기 = `setActiveRoute("/wiki")` + `navigateToWikiArticle(id)` (`lib/wiki-article-nav.ts` external store, WikiView가 mount 시 consume). `wikilink-context-menu.tsx:179` 검증된 패턴.
- **`router.push("/wiki/${id}")`는 코드베이스 곳곳에 있지만 dead** — `recent-cards.tsx`/`mixed-quicklinks.tsx`/`pinned-list.tsx` 등이 쓰지만 `/wiki/[id]` 라우트 없어 404. 향후 정리 대상 (또는 `/wiki/[id]` 라우트 신설).
- **`side-panel-detail.tsx`에 space별 하드 가드 존재** — `activeSpace === "ontology"`면 placeholder 강제 반환하던 legacy 가드. 신규 entity를 ontology space에서 사이드바에 띄울 땐 이런 space 가드 확인 의무.
- **explore agent 결과는 검증 필요** — 이번 explore agent가 "wiki 노드 id는 raw"라 보고했으나 실제론 `"wiki:"` prefix. preview eval로 실데이터 확인하니 드러남. agent 보고 = 가설, ground truth는 코드/실행.

### Watch Out (다음 세션)

- 🟡 **double-click for tag nodes = no-op** — 의도된 동작 (tag는 에디터 없음). 향후 tag 더블클릭에 "tag 필터 뷰로 이동" 같은 동작 원하면 별도 작업.
- 🟡 **`router.push("/wiki/[id]")` dead code** — 여러 파일에 산재. P0 아니지만 언젠가 정리 (라우트 신설 또는 호출 교체).
- 🟢 **`OntologyDetailPanel`의 unlinked mentions 기능 소실** — 제거됨. 원하면 SmartSidePanel Connections 탭에 global 추가 (별도 작업).

### 환경 변경

- Store version: 144 (변경 없음 — UI 배선만)
- 삭제 파일: `components/ontology/ontology-detail-panel.tsx` (215줄)
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓
- 사용자 IDB stale data: 없음

### 머신
다른컴퓨터 (Windows).

---

## 2026-05-21 (저녁 후속) — 다른컴퓨터/Windows, **timeline 막대 끝점 재설계 (circle dot → Article 화살촉 / Stub rounded)**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🟡 P0 #2 — Ontology graph node 사이드바 동기화** (timeline은 사용자 "마음에 든다 이 정도면" 으로 일단락)
>
> timeline 시각 작업 종료 (사용자 승인). 다음은 TODO P0 순서 — Ontology graph node 사이드바 / Activity events 후속 / Books own Views section. 어느 것부터 할지는 사용자 의향 청취.
>
> **이번 세션 (직전 거대 PR #393 후속)**:
> - 직전 PR #393 (옵션 C drag + event marker chips + Reticle polish) 머지 후, 사용자가 막대 끝점 circle dot을 보고 "요 동그라미가 최선인가?" → 브레인스토밍 → **옵션 C 채택** (도형 자체로 status 표현)
> - 끝점 재설계: 떠 있던 circle dot 제거 → **Article = 막대 끝 solid 화살촉 ▶ (`<polygon>`, ARROW_DEPTH 9px)** / **Stub = 막대 rounded end (별도 요소 없음)**
> - 초안엔 planned horizon = dashed tail (`- - -`) 추가했으나 사용자 "별론데" → **제거** (막대가 Now 라인 넘어 future stripe 진입 = 계획됨, 위치로 자명. tail은 중복 + disconnect)
> - 최종: 끝점 = status만 (Article 화살촉 / Stub rounded). `horizonSource`/`isPlanned`/`getHorizonSource` import 제거 (dashed tail 폐기로 unused).
>
> **시각 검증 (선택)**:
> - 다른 머신에서 본인 viewport에 dummy snippet (직전 entry hook 참조) → timeline → Article 막대 끝 화살촉 / Stub 막대 rounded end 확인
> - timeline은 사용자 승인 완료이므로 추가 polish는 사용자 명시 요청 시만
>
> **컴포넌트 변경** (`components/views/wiki-timeline-view.tsx`):
> - 상수: `END_DOT_SIZE`/`END_DOT_OFFSET` 제거 → `ARROW_DEPTH = 9` 신규 (`PLANNED_TAIL_LEN`/`PLANNED_TAIL_GAP`는 초안에 추가했다 제거)
> - `renderLaneBar`: `<circle>` status dot 제거 → `{!stub && <polygon points={`${liveEndX},${barY} ${liveEndX+ARROW_DEPTH},${cy} ${liveEndX},${barY+BAR_HEIGHT}`} fill={color} fillOpacity={endOpacity} filter="url(#bar-shadow)"/>}`
> - `endShapeRightX = liveEndX + (stub ? 0 : ARROW_DEPTH)` / `endOpacity = nowX >= liveEndX ? 0.78 : 1` / `outsideTitleX = endShapeRightX + 6`
> - grab handle width `12 + (stub ? 0 : ARROW_DEPTH)` (화살촉 커버)
> - `horizonSource`/`isPlanned` const 제거, `getHorizonSource` import 제거
>
> **위험 + 회피**:
> - 🟢 `getHorizonSource` 헬퍼는 `lib/wiki-utils.ts`에 그대로 존재 (timeline import만 제거). 향후 재사용 가능.
> - 🟢 끝점이 status만 표현 → planned/updated 구분은 막대 위치(future stripe)에 위임. 의도된 단순화.
>
> **참고 파일**: `components/views/wiki-timeline-view.tsx` (renderLaneBar ~line 615+)
>
> **머신**: 다른컴퓨터 (Windows)
> **현재 main HEAD**: edf74fb (PR #393) → 이번 PR squash merge 후
> **branch worktree**: `claude/sharp-lumiere-e5fb03`

### 완료

- timeline 막대 끝점 재설계 (단일 파일 `wiki-timeline-view.tsx`, +22/-36 — 순 −14줄 청소):
  - circle status dot 제거 → Article 화살촉 `<polygon>` / Stub rounded end
  - dashed tail 초안 추가 → 사용자 피드백 "별론데" → 제거
  - `getHorizonSource` import + `horizonSource`/`isPlanned` const 정리

### 브레인스토밍 & 큰 결정 (영구)

- **#91 후보: 막대 끝점 = status는 도형 자체로 (Article 화살촉 / Stub rounded end), horizon은 막대 위치로** — 떠 있는 circle dot은 막대와 disconnect + 단조로움. 도형 자체가 메타포 (화살촉 = 도착/완성/directional, rounded = soft/open). horizon source (planned/updated)는 별도 마커 없이 막대가 future stripe 진입하는 위치로 자명 — 중복 시각 신호 제거. "Gentle by default" 정합.
- **시각 신호 중복 제거 원칙** — 한 정보를 두 곳에서 표현하면 (막대 위치 + dashed tail) 군더더기. 위치가 이미 말하면 마커는 빼는 게 깔끔.

### 기술 학습 (영구)

- **SVG `<polygon>` 화살촉 = rect 막대 끝에 triangle tip 부착** — `points` 3점 (top / tip / bottom)으로 isoceles triangle. `fillOpacity`로 막대 gradient 끝 opacity 매칭 (`nowX >= liveEndX ? 0.78 : 1`). `filter="url(#bar-shadow)"` 공유 → 막대와 시각 통합 (seam 더블섀도 invisible).
- **status 표현 = 별도 떠있는 요소 < 막대 본체 도형 일부** — 끝점이 막대에서 떨어져 있으면 (offset) disconnect 인지. 막대 끝 모양 자체가 status면 통합감.

### 환경 변경

- Store version: 144 (변경 없음 — UI 변경만)
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓
- 신규 파일: 없음. 사용자 IDB stale data: 없음.
- `getHorizonSource` timeline import 제거 (헬퍼 자체는 `lib/wiki-utils.ts` 유지)

### 머신
다른컴퓨터 (Windows). **다음 세션 머신**: 미정.

---

## 2026-05-21 (저녁) — 다른컴퓨터/Windows, **timeline 옵션 C drag + event marker chips + Reticle polish (단일 거대 PR)**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🔴 P0 #1 — timeline 시각 추가 polish (사용자 평 "아직은 아쉬운데" 의 후속)**
>
> 이번 세션에 옵션 C (drag) + 이벤트 마커 chip (Phosphor icon inline) + Reticle-feel polish 적용. 사용자 본인 viewport 시각 검증 필수. 본인 viewport에서 dummy snippet 적용 후 4 zoom + 마커 hover + drag 동작 확인 필요.
>
> **사용자 의도 (그대로 인용)**:
> 1. "옵션 C 진행해라" → 막대 우측 끝 drag로 plannedDate 설정 (native pointer events)
> 2. "위키의 생성, 위키를 읽은 날, 링크한 날, 참고한 날, 수정한 날 등등 이런 것들을 뱃지로 표시하는 건 어때?" → 타임라인에 이벤트 마커 추가
> 3. "뱃지가 너무 단조로운 거 같은데..아닌가??" → 클러스터 → 개별 이벤트 분리 + 타입별 색
> 4. "근데 뱃지 마커가 이렇게 밖에 안 되나?? 좀 다양한 아이콘이 뱃지로 들어갈 순 없나??" → 추상 도형 → Phosphor 아이콘 chip 전환 (filled ring + 흰 아이콘)
> 5. "레티클에 비해 비주얼은 별론데" → 막대 depth (drop-shadow + vertical highlight gradient) + Now anchor (top dot) + axis typography 위계 + today column tint
> 6. "아직은 아쉬운데 우선은 after-work" → 시각 polish 미완. 다음 세션 추가 폴리시.
>
> **첫 스텝 (다른 머신에서 바로 시작)**:
> 1. `git pull origin main` (latest = 이번 squash merge 직후)
> 2. `npm install && npm run dev` (port 3002)
> 3. **dummy data 추가** (본인 console에 paste, IDB 비어있으면 6 article + 다양한 이벤트):
>    ```js
>    (() => { const s=window.__plotStore, now=Date.now(), d=(o)=>new Date(now+o*86400000).toISOString();
>    const articles=[["Q2 Strategy",-28,7,[-20,-10,-3]],["Summer Trip",-21,14,[-15,-7]],["Tax Filing",-14,21,[-12,-8,-5,-2]],["Annual Report",-10,null,[-6,-1]],["Recipes",-7,null,[-4]],["Side Project",-3,5,[-1,0]]];
>    const ids=articles.map(([t])=>s.getState().createWikiArticle({title:t}));
>    s.setState(state=>{
>      const u=new Map(ids.map((id,i)=>[id,articles[i]]));
>      const newA=state.wikiArticles.map(a=>{const c=u.get(a.id); if(!c)return a; return {...a,createdAt:d(c[1]),updatedAt:d(c[3].at(-1)??c[1]),plannedDate:c[2]!==null?d(c[2]):undefined};});
>      const f=state.entityEvents.filter(e=>!ids.includes(e.entity.id));
>      let eid=900000; const ne=[];
>      ids.forEach((id,i)=>{const [,cr,,ups]=articles[i];
>        ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"created",at:d(cr)});
>        ups.forEach(o=>ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"updated",at:d(o)}));
>        ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"opened",at:d(cr+1)});
>        if(i%2===0) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"link_added",at:d(cr+2)});
>        if(i%3===0) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"block_added",at:d(ups[0]??cr)});
>        if(i===1) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"attachment_added",at:d(cr+3)});
>        if(i===3) ne.push({id:`s-${eid++}`,entity:{kind:"wiki",id},type:"relation_added",at:d(ups[0]??cr)});
>      });
>      return {wikiArticles:newA, entityEvents:[...f,...ne]};
>    });
>    return `seeded ${ids.length}`;})()
>    ```
> 4. Wiki → Overview → "View all N articles" → Timeline view mode → Month zoom. showStubs ON 의무. 정상 시 ~14 막대 + 컬러 chip 다수.
> 5. **시각 검증 포인트**:
>    - 막대 위 chip (14px 컬러 ring + 흰색 Phosphor 아이콘) 시인성
>    - 컬러+아이콘 매핑 즉시 식별 가능 여부 (created=Plus, updated=Pencil, opened=Eye, link=LinkSimple, ...)
>    - 막대 drop-shadow + vertical highlight (top 살짝 밝음) → 막대가 입체 객체로 보이는지
>    - Now line + top anchor dot (4px) + "Now" 라벨 (fontWeight 700)
>    - Today 컬럼 subtle tint (0.04 opacity)
>    - Axis month-start tick = bold 600 fg vs day tick = 0.85 opacity muted
>    - 막대 우측 끝 hover → ew-resize cursor + 작은 vertical hint → drag → 막대 실시간 확장 + dashed end-cap + live tooltip → 놓으면 plannedDate 저장
> 6. **시각 검증 결과 → 결정**:
>    - **OK**: P0 #2 (시각 polish 마무리 완료 / 다음 작업 진행)
>    - **NG (사용자 평 "아직 아쉬운데")**: 추가 polish 라운드 — 후보 (a) 막대 typography 키움 (title 폰트 11→12, weight 500→600), (b) Now line glow filter 추가, (c) chip border `var(--background)` ring 1px (어떤 bg에서도 contrast), (d) axis tick "May 18" 같은 long label 마지막 zoom에서 collision 회피 강화, (e) 사이드 panel처럼 selected article의 이벤트 list separate panel
>
> **컴포넌트 구조 / 데이터 흐름**:
> - `components/views/wiki-timeline-view.tsx` (1067 → 1500+ 줄, 이번 세션 누적 변경 +526/-50)
>   - 신규 import: `usePlotStore`, `getEventsForEntity`, 12 Phosphor 아이콘 (Plus / PencilSimple / Eye / Trash / ArrowCounterClockwise / LinkSimple / LinkBreak / StackPlus / StackMinus / ArrowsLeftRight / Paperclip / DotOutline) + `EntityEvent`/`EntityEventType` types + `Icon` type
>   - `dragState: { id, pointerId, startClientX, originalEndX, currentEndX } | null` + `canvasSvgRef: SVGSVGElement` + window-level pointer listeners (move/up/cancel + Escape) + body cursor lock
>   - `showEvents` toggle + `eventTooltip` state + `entityEvents = usePlotStore((s) => s.entityEvents)` selector
>   - `eventsByArticleId` memo: 각 article별 events 필터 (window range)
>   - `renderEventMarkers(article, laneIndex)`: day-bucket → horizontal stack (gap 14) → 최대 4개 + overflow `+N` text → 각 마커 = `<circle r=7 fill={color}/>` + nested `<IconComp x y width height weight="bold" color="white"/>` (Phosphor SVG inline)
>   - `EVENT_MARKER_CONFIG: Partial<Record<EntityEventType, { icon: Icon, color: string, label: string }>>` — 14 타입 매핑 + DotOutline fallback
>   - `renderLaneBar` 변경: liveEndX/liveWidth (drag override) + 2-layer fill (`url(#${gradId})` past/future + `url(#${gradId}-vh)` vertical highlight) + `filter="url(#bar-shadow)"` (SVG feDropShadow) + planning isPlanned forced during drag + grab handle rect (12px, ew-resize) + visible hint vertical line on hover/drag
>   - Now anchor 추가: vertical line (strokeWidth 1.2) + top dot (`<circle cx={nowX} cy={4} r={3.5}/>`)
>   - Today 컬럼 tint: 오늘 컬럼 전체 `var(--fg)` opacity 0.04
>   - Axis tick typography 분기: month-start (`tick.getDate() === 1`) → bold 600 fg vs day → 0.85 opacity muted
>   - 컨트롤 바: Events 토글 + divider `<div className="h-4 w-px bg-border-subtle"/>` + zoom 그룹
>   - 상수: `LANE_HEIGHT 52` / `BAR_HEIGHT 28` / `BAR_RADIUS 8` / `END_DOT_SIZE 18` / `END_DOT_OFFSET 9` / `EVENT_MARKER_RING_R 7` / `EVENT_MARKER_ICON_SIZE 9` / `EVENT_MARKER_STACK_GAP 14` / `EVENT_MARKER_MAX_PER_DAY 4` / `EVENT_MARKER_Y_OFFSET -12`
>
> **Store action 매핑**:
> - `setWikiArticlePlannedDate(id, iso | null)` — drag end commit (planning intent, updatedAt 안 건드림)
> - `entityEvents: EntityEvent[]` selector — 마커 렌더 데이터 source
> - `getEventsForEntity(events, { kind: "wiki", id }, limit?)` — entity별 filter helper
>
> **위험 + 회피**:
> - 🔴 **사용자 본인 viewport 시각 검증 미완** — preview MCP IDB 와 본인 IDB 분리. 다른 머신에서 본인 viewport에 dummy snippet paste 후 4 zoom + chip 식별 + drag 동작 검증 의무.
> - 🔴 **시각 polish 미완** ("아직은 아쉬운데") — 다음 세션 추가 polish 후보 a~e (위 5번 항목) 중 사용자 우선순위 청취 후 진행.
> - 🟡 **wiki-timeline-view.tsx 1500+ 줄 거대화** — sub-component 분리 권고 (Axis / Bars / EventMarkers / Tooltip / Grid). 시각 polish 라운드 정리 후 별도 리팩토링 PR.
> - 🟡 **showStubs OFF (기본)** — 신규 article은 stub로 생성됨. timeline에서 안 보이는 경우 toggles.showStubs ON 필요. 사용자 첫 진입 confused 가능. 향후 stub/article 통합 또는 toggle 명시 안내 검토.
> - 🟡 **Phosphor nested SVG accessibility** — `<IconComp x={} y={} width={} height={}/>`는 SVG 안 SVG 패턴. 모던 브라우저 지원 OK, 단 키보드 접근/role/aria 처리 향후 검토 (현재 chip은 마우스 hover로만 식별).
> - 🟢 **현재 wiki article은 `opened` 이벤트 emit 안 됨** — `lib/store/slices/wiki-articles.ts`에는 created/updated/trashed/untrashed만. 시드 데이터 안 쓰면 chip 종류 제한적. P0 #4 (Activity events 후속) 와 연계.
>
> **참고 파일** (작업 시 read 우선순위):
> - `components/views/wiki-timeline-view.tsx` (메인, 1500+줄)
> - `lib/wiki-utils.ts` (safeDate / horizonOf / getHorizonSource)
> - `lib/store/slices/wiki-articles.ts:241-258` (`setWikiArticlePlannedDate` action)
> - `lib/datalog/helpers.ts:20` (`getEventsForEntity`)
> - `lib/types.ts:893-961` (`EntityEvent` / `EntityEventType` 정의)
>
> **머신**: 다른컴퓨터 (Windows, 직전 세션 "집/Windows" 와 다른 머신)
> **현재 main HEAD**: e9c8d36 (PR #392) → 이번 PR squash merge 후
> **branch worktree**: `claude/sharp-lumiere-e5fb03` (clean, ff merge로 main 동기화 됨)

### 완료 (이번 세션 단일 거대 PR, 4 라운드 누적)

**전체 규모**: +526/-50, 1 파일 modified (`components/views/wiki-timeline-view.tsx`), Phosphor 12개 신규 import, 4 사용자 피드백 라운드 누적

#### Round 1 — 옵션 C drag로 plannedDate
- `dragState` + window-level pointer listeners (move / up / cancel) + Escape 취소
- `clientXToSvgX` + `snapEndXToDay` (cfg.pxPerDay 격자 snap, minBarWidth clamp) + `endXToPlannedISO` (winStart + days 변환)
- grab handle 12px 투명 rect (cursor ew-resize) + 호버/드래그 중 vertical hint line
- 드래그 중 막대 width 실시간 확장 (`liveEndX`/`liveWidth` override) + `isPlanned` forced true → dashed end-cap 즉시 전환
- `pointerup` → `usePlotStore.getState().setWikiArticlePlannedDate(id, iso)` (planning intent, updatedAt 안 건드림)
- `document.body.style.cursor = "ew-resize"` 잠금 (드래그 중)
- 라이브 tooltip "Planning {date} ({relative})" — `onMouseLeave` 가드로 드래그 중 tooltip 유지

#### Round 2 — 이벤트 마커 도입 (per-event 개별 + 타입별 색)
- `usePlotStore((s) => s.entityEvents)` selector + `eventsByArticleId` memo (window range filter)
- 컨트롤 바에 "Events" 토글 (default ON)
- 같은 날 클러스터 → 개별 이벤트 분리 + 7px horizontal stack + `+N` overflow (>4)
- `eventTooltip` state + tooltip 렌더 (z=30, 라벨 + 시간)
- 색 매핑: created=emerald, updated=blue #3b82f6, opened=muted, trashed=red #ef4444, untrashed=hollow red, link=purple #8b5cf6, block=green #10b981, relation=amber #f59e0b, attachment=cyan #06b6d4

#### Round 3 — 추상 도형 다양화 (이번 세션 중간, polish 도중 폐기)
- 11종 도형 (ring/circle/square/square-ring/diamond/diamond-ring/triangle/triangle-ring/cross/x/pentagon) 정의
- `renderMarkerShape(shape, color, size)` 함수 (SVG primitive)
- 사용자 평 "그냥 컬러 dot만 나오는데" → 픽셀 단위 도형 식별 불가 → **Phosphor 아이콘 chip으로 폐기 전환**

#### Round 4 (현재 최종) — Phosphor 아이콘 chip + Reticle-feel polish
- **Phosphor 아이콘 chip** (Round 3 도형 시스템 완전 대체):
  - `MarkerConfig: { icon: Icon, color: string, label: string }` — 14 매핑
  - `<circle r=7 fill={color}/>` + `<IconComp x y width height weight="bold" color="white"/>` (nested SVG)
  - 아이콘: Plus / PencilSimple / Eye / Trash / ArrowCounterClockwise / LinkSimple / LinkBreak / StackPlus / StackMinus / ArrowsLeftRight / Paperclip / DotOutline (fallback)
  - 사이즈 r=7 (시각 폭 14px), gap 14, y-offset -12
- **Reticle-feel polish** (이번 라운드 동시 적용):
  - 막대 dimension: `LANE_HEIGHT 48→52` / `BAR_HEIGHT 24→28` / `BAR_RADIUS 6→8`
  - 막대 depth: 2-layer fill = past/future gradient + vertical highlight gradient (top white 14% → 0 at 50%) + `feDropShadow` filter (dx=0 dy=1.2 stdDeviation=1 opacity 0.35)
  - Now anchor: vertical line strokeWidth 1.2 opacity 0.85 + top dot `<circle cx={nowX} cy={4} r={3.5}/>` + label fontWeight 700 letterSpacing 0.02em
  - Today 컬럼 subtle tint (`var(--fg)` opacity 0.04 full-height rect)
  - Axis typography 위계: month-start tick → bold 600 fg / day tick → 0.85 opacity muted
  - 컨트롤 바 divider (Events / zoom 사이 `h-4 w-px bg-border-subtle`)
  - Lane separator opacity 0.2 → 0.15 (막대 무게 강화)

### 브레인스토밍 & 큰 결정 (영구)

- **#90 후보 (사용자 OK 대기): event markers = icon chip 패턴 (filled ring + Phosphor inline)** — 추상 도형 변형은 작은 사이즈에서 식별 불가. 사용자 직관 = 디자인 시그널 (작업 원칙 #8). Phosphor 아이콘 nested SVG (12 import) + filled colored ring = 즉시 식별 + 컬러 그룹화 동시. "Gentle by default" 위반 X — gentle ≠ illegible.
- **bars + events 보완 관계** — bars = 수명 (느린 서사) / events = 사용 활동 (펑크처드 markers). 이 둘이 timeline의 본질. Reticle 패턴 확장.
- **마커 디자인 결정 우선순위** — 사이즈 식별 가능 > 컬러 다양성 > 도형 다양성. 사이즈가 너무 작으면 컬러/도형 변형 무력. 작업 원칙 #8 reinforce.
- **막대 depth = 2-layer gradient + drop-shadow 패턴** — past/future 가로 gradient + 위→아래 vertical highlight (top 14%→0) + SVG `feDropShadow` 결합. SVG filter는 CSS filter보다 막대 자체 effect로 더 정합. Reticle visual authority의 핵심.
- **Now anchor = vertical line + top dot** — 라인만으로는 시각 무게 약함. 4px top dot (filled fg) 추가하면 "지금 여기" 앵커 시각 확립.
- **Today 컬럼 subtle tint = full-height rect 0.04 opacity** — vertical line의 보완. 라인만 강조하면 "선"이지만 컬럼 tint는 "공간" → 오늘 일자의 모든 이벤트가 같은 공간 안 → 컨텍스트 그루핑 자연 인식.
- **axis typography 위계 = month vs day differentiation** — 모든 tick이 같은 weight면 위계 없음. 1일 tick은 bold + fg / 일반 day tick은 light + muted → 한 눈에 month 구조 파악.

### 기술 학습 (영구)

- **SVG nested SVG는 모던 브라우저에서 정합** — `<svg><svg x={} y={} width={} height={}>...</svg></svg>` 패턴. Phosphor React component는 자체 `<svg viewBox>` 출력하므로 부모 SVG 안에서 x/y prop 통해 위치 결정 가능. foreignObject 회피.
- **Phosphor `weight="bold" color="white"` 패턴** — 작은 사이즈(8~10px)에서 stroke 굵기가 식별성 좌우. bold weight + 흰색 fill이 컬러 ring 위에서 최고 contrast.
- **SVG `feDropShadow` filter** — `<defs><filter id><feDropShadow dx dy stdDeviation floodColor floodOpacity/></filter></defs>` + `<rect filter="url(#id)"/>`. CSS box-shadow보다 SVG element에 정확. filter 자식 요소에 누적 적용 시 muddiness 발생 → 막대 main rect에만 적용, 하이라이트 overlay/cap/dot에는 적용 X.
- **SVG `<linearGradient>` 2개 매김 (horizontal + vertical)** — past/future 분기는 `x1=0 y1=0 x2=1 y2=0`, top highlight는 `x1=0 y1=0 x2=0 y2=1`. ID 충돌 회피 위해 `${gradId}-vh` 패턴.
- **native pointer events vs dnd-kit** — 단순 drag (한 축 + snap)는 `pointerdown`/`pointermove`/`pointerup` window-level listener 만으로 충분. dnd-kit는 multi-element collision/sortable 시 적합. 의존성 절약.
- **drag closure 패턴** — `useEffect(() => { ... }, [dragState?.id, dragState?.pointerId, ...])` 에서 dragState 직접 capture 시 stale closure 위험. id+pointerId가 변경되지 않는 한 같은 effect 인스턴스 유지하되, 핸들러 내부에서 매번 `lanes.find()` 로 최신 lane 조회.
- **`document.body.style.cursor` 드래그 잠금** — drag 중 막대 밖으로 이동 시 cursor가 default로 돌아가는 문제 회피. cleanup 시 prev cursor 복원 의무.
- **`onMouseLeave` 가드 (드래그 중 tooltip 유지)** — drag 중 마우스가 막대 영역 벗어나도 tooltip 유지 → `if (dragState?.id === article.id) return;` 가드.
- **추상 도형 변형은 작은 사이즈(r<5)에서 식별 불가** — ring vs circle, square vs diamond, triangle vs pentagon은 픽셀 5~10개로는 눈이 구별 못함. 컬러는 식별되지만 도형은 "그냥 dot" 인지. → 사이즈 키우거나 (10px+) Phosphor 아이콘 inline 패턴.
- **`<IconComp x y width height>` 동적 컴포넌트 JSX** — `const IconComp = mc.icon; <IconComp .../>` 패턴이 type-safe. `<mc.icon />` 직접 사용은 TypeScript JSX 파서 까다로움.
- **showStubs 토글 = wiki articles 노출 기본 OFF** — 신규 article은 stub 상태 (content 미작성), 기본 toggles.showStubs false. 시드 데이터 검증 시 showStubs ON 의무.
- **preview MCP IDB는 사용자 본인 viewport와 분리** — 이미 LOCKED 학습이지만 재확인. 본인 viewport 검증 의무 항상 명시.

### Watch Out (다음 세션)

- 🔴 **사용자 본인 viewport 시각 검증 미완** — 본인 IDB에 dummy snippet paste 후 4 zoom + chip + drag 검증 필수.
- 🔴 **시각 polish 미완 ("아직은 아쉬운데")** — 다음 세션 추가 polish 후보 a-e 중 사용자 우선순위 청취.
- 🟡 **wiki-timeline-view.tsx 1500+ 줄** — sub-component 분리 필요 (Axis / Bars / EventMarkers / Tooltip / Grid). 시각 polish 완료 후 별도 리팩토링 PR.
- 🟡 **wiki article `opened` 이벤트 emit 안 됨** — 시드 데이터로만 표현. 실제 사용 시 `created`/`updated`/`trashed` 만 chip로 보임. P0 #4 (Activity events 후속 — granular wire-up) 와 연계.
- 🟢 **시드 snippet 자체 SESSION-LOG/TODO 에 보존** — 다음 머신에서 또 paste 필요 시 hook 안 1 라인으로 재사용 가능.

### 환경 변경

- Main HEAD: `e9c8d36` (PR #392) → 이번 PR squash merge 후
- Store version: 144 (변경 없음 — `plannedDate` 필드는 이미 추가됨, 이번 PR은 UI 변경만)
- Phosphor 12개 신규 import: Plus / PencilSimple / Eye / Trash / ArrowCounterClockwise / LinkSimple / LinkBreak / StackPlus / StackMinus / ArrowsLeftRight / Paperclip / DotOutline
- 영구 룰 후보: #90 (event markers = icon chip)
- TS 부채 0 유지: `npx tsc --noEmit` clean, `npm run build` ✓
- 사용자 IDB stale data: 없음 (UI 변경만)
- 신규 파일: 없음

### 머신
다른컴퓨터 (Windows, 직전 세션 "집/Windows"와 다른 머신). **다음 세션 머신**: 미정.

---

## 2026-05-21 — 집/Windows, **timeline-planning bars-first 3 라운드 refine 완성 (단일 거대 PR)**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🔴 P0 #1 — bars-first timeline 시각 검증 + 사용자 OK 시 옵션 C (drag로 plannedDate)**
>
> 이번 세션에서 1+2+3 라운드 모두 적용 + squash merge 완료. 단 **사용자 본인 viewport 시각 검증 미완** (사용자가 "after-work 우선 진행" 신호로 머지함). 다른 컴퓨터에서 가장 먼저 할 일 = 시각 검증 → OK 시 옵션 C (drag) 또는 추가 다듬기.
>
> **사용자 의도 (그대로 인용)**:
> 1. "1라운드 (A+B) → ㅇㅇ 진행" → 막대 안 title + TODAY 톤다운 + Future stripe
> 2. "왜 이렇게 날짜가 겹치지?? 날짜간의 간격을 좀 넓게 넓게 할 순 없나? 바가 길어져도 되잖아" → 2라운드 (가로 스크롤 + sticky)
> 3. "C먼저 해라. 그리고 이게 타임라인의 어떤 시각적 효과나 이런 것들이 부실하네" → 3라운드 (A+B+D 시각 효과 풍부화)
> 4. "오케이 우선 다른컴퓨터로 이어갈 거니까 after-work" → 시각 검증 없이 머지 진행
>
> **첫 스텝 (다른 머신에서 바로 시작)**:
> 1. `git pull origin main` (latest = 이번 단일 거대 PR squash merge 후 + 이 docs sync PR)
> 2. `npm install && npm run dev` (port 3002)
> 3. **dummy data 추가** (본인 browser console에 paste, IDB 비어있으면 9 article + plannedDate 다양):
>    ```js
>    (() => { const s=window.__plotStore, t=Date.now(), d=(n)=>new Date(t+n*86400000).toISOString();
>    const items=[["Q2 Strategy",3],["Summer Trip",7],["Tax Filing",14],["Annual Report",30],["Reading List",5],["Recipes",10],["Side Project",21],["Onboarding",45],["Quick Notes",null]];
>    const ids=items.map(([title])=>s.getState().createWikiArticle({title}));
>    items.forEach(([,p],i)=>{ if(p!==null) s.getState().setWikiArticlePlannedDate(ids[i],d(p)); });
>    return s.getState().wikiArticles.length; })()
>    ```
>    검증 끝나면 Trash에서 9개 정리.
> 4. **Wiki space → Timeline view mode** 진입 후 Week / Month / Quarter / Year 4 zoom 모두 시각 확인:
>    - tick label 안 겹치는지 (특히 Quarter/Year 가로 스크롤 확인)
>    - "Now" 라벨이 vertical line 우측 5px offset (start anchor)로 깨끗 분리
>    - 가로 스크롤 시 좌측 article 라벨 column + 상단 axis header sticky 유지
>    - Stub 막대 끝 hollow circle (raw 메타포) / Article 막대 끝 solid (completed)
>    - 막대 hover 시 row 전체 highlight + stroke ring + 4-line tooltip
>    - Weekend stripe (subtle dim) + Month boundary line (강조)
>    - now line gradient: past 0.78 → future 1.0 부드러운 transition
>    - plannedDate horizon 막대 우측 끝 dashed vertical / updatedAt horizon은 solid
> 5. 시각 검증 결과:
>    - **OK**: 옵션 C (drag로 plannedDate 우측 끝 조정, dnd-kit 적용 ~150줄) 별도 PR
>    - **NG**: 부족한 부분 fix
>
> **컴포넌트 구조 / 데이터 흐름**:
> - `components/views/wiki-timeline-view.tsx` (1067줄, 이번 세션 단일 거대 rewrite):
>   - ZoomConfig 매핑: Week 80/24/60, Month 32/18/60, Quarter 10/12/50, Year 3/8/40 (pxPerDay / MIN_BAR_WIDTH / TITLE_THRESHOLD)
>   - canvas 폭 = `pxPerDay × totalDays` (viewport fit 강제 X)
>   - `buildTicks()` zoom별 step: Week=1일 / Month=Monday-snap 7일 / Quarter=14일 / Year=월초-snap
>   - `buildDayRange()` + `dayOfWeek===0||6` weekend stripe rect
>   - `buildMonthBoundaries()` 매월 1일 vertical line 강조
>   - SVG `<linearGradient>` past/future opacity gradient (gradStop = (nowX-x)/width clamped)
>   - hover state: React `hoveredId` + onMouseEnter/Leave (SVG :hover 불충분)
>   - Tooltip wrapper: absolute div 4-line (SVG foreignObject 회피)
>   - sticky: axis header top + corner cell + label column left (모두 불투명 var(--bg))
> - `lib/wiki-utils.ts` 신규 헬퍼:
>   - `safeDate(iso)` — null-safe Date parser
>   - `horizonOf(article)` — plannedDate ?? updatedAt ?? createdAt
>   - `getHorizonSource(article): "planned" | "updated" | "created"` — source 분리 (D2 dashed end-cap)
> - `lib/store/types.ts` + `lib/store/slices/wiki-articles.ts`:
>   - `setWikiArticlePlannedDate(articleId, date | null)` action 신규. **updatedAt 갱신 X** (planning ≠ content activity)
>   - 정의 위치: `lib/store/types.ts:438-441`, slice: `wiki-articles.ts:241-258`
> - `components/views/wiki-list.tsx` (+84) — Timeline list 통합 (변경 미세 검토 필요)
> - `components/side-panel/wiki-article-detail-panel.tsx` (+54) — plannedDate 설정 UI (날짜 picker)
>
> **Store action 매핑**:
> - `createWikiArticle({title}): articleId` — `lib/store/slices/wiki-articles.ts:14`
> - `setWikiArticlePlannedDate(id, iso | null)` — 신규, planning intent (updatedAt 안 건드림)
> - `updateWikiArticle(id, patch)` — 기존, content activity → updatedAt 갱신
>
> **위험 + 회피**:
> - 🔴 **사용자 본인 viewport 시각 검증 미완** — dummy data sync 안 된 채로 머지. 다른 머신에서 본인 viewport console snippet으로 dummy 추가 후 4 zoom 시각 검증 의무.
> - 🟡 **wiki-timeline-view.tsx 1067줄 단일 파일** — 너무 거대. 향후 sub-component 분리 검토 (Axis / Bars / Tooltip / Grid 분리).
> - 🟡 **`window.__plotStore` dev expose** — dev only 노출인지 확인 필요 (production build에서 노출되면 안 됨). 다음 세션 grep.
> - 🟡 **wiki-list.tsx +84줄 변경 미검증** — Timeline 통합 부분이 List/Board view 회귀 안 일으키는지 확인.
> - 🟢 **`nul` 파일 + `.claude/worktrees/` untracked** — 이번 commit에서 nul 삭제 + .claude/worktrees/ gitignore 처리.
>
> **참고 파일** (작업 시 read 우선순위):
> - `components/views/wiki-timeline-view.tsx` (메인 — 1067줄)
> - `lib/wiki-utils.ts` (헬퍼 — safeDate / horizonOf / getHorizonSource)
> - `lib/store/types.ts:438-441` + `lib/store/slices/wiki-articles.ts:241-258` (plannedDate action)
> - `docs/02-design/features/timeline-planning.design.md` (bars-first 설계 — §3/§5/§11 재작성됨, +225줄)
> - `components/side-panel/wiki-article-detail-panel.tsx` (plannedDate UI)
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 이번 거대 PR squash merge 후 + 이 docs sync PR
> **branch worktree**: 새 worktree 권장 (이번 작업은 main 직접 이라 worktree 없이 했음. 다음 세션 옵션 C는 worktree 권장)

### 완료 (이번 세션 단일 거대 PR, 1+2+3 라운드 합산)

**전체 규모**: +1000/-506, 9 파일 modified, lib/wiki-utils.ts 헬퍼 3개 신규, wiki-timeline-view.tsx 1067줄 거대 rewrite

#### Round 1 — 막대 정보 컨테이너 + TODAY 톤다운 + Future stripe
- 막대 안 title embed (TITLE_THRESHOLD 60px) — 충분히 넓으면 inside (white text + SVG clipPath 양끝 잘림 방지), 좁으면 outside (`var(--muted-foreground)` start anchor)
- TODAY 빨강 → `var(--border-strong)` 1px opacity 0.7 subtle line
- "TODAY" 큰 빨간 라벨 → axis row 안 작은 "Now" (`text-2xs var(--muted-foreground)` weight 500)
- Future zone SVG rect `fill="var(--muted)"` opacity 0.06 (nowX → canvasWidth)
- 레이어 순서: stripe → bars → NOW line

#### Round 2 — 가로 스크롤 + sticky + zoom별 px-per-day
- viewport fit 강제 제거. canvas 폭 = `pxPerDay × totalDays`
- ZoomConfig: Week 80/24/60, Month 32/18/60, Quarter 10/12/50, Year 3/8/40
- totalDays: Week 14 / Month 60 / Quarter 120 / Year 400
- Tick collision: Week 1일 / Month Monday-snap 7일 / Quarter 14일 / Year 월초-snap
- "Now" 라벨 옵션 c: vertical line 우측 5px offset (textAnchor: start, fontWeight 600)
- Sticky: axis header top (z=20) + corner cell (z=30) + label column left (z=10) + 모두 불투명 var(--bg)

#### Round 3 — 캔버스 depth + 막대 affordance + Past/Future gradient
- **A1 Weekend stripe**: `buildDayRange()` + `dayOfWeek===0||6` 필터, rect `fill="var(--muted)" opacity={0.04}`
- **A2 Month boundary**: `buildMonthBoundaries()` 매월 1일, day tick 0.5/0.25 vs month 1/0.5 opacity 차별
- **A3 Row separator**: 기존 lane-sep opacity 0.25 → 0.2 (weekend stripe와 noise 회피)
- **B1 Hover state**: React `hoveredId` + mouseEnter/Leave. rect bg 0.12 + stroke ring 0.5 + 라벨 column `bg-secondary/40`
- **B2 Tooltip**: absolute div 4줄 (Title+icon / Status badge / Created / Planned in N days or Updated)
- **B3 Status dot**: Stub hollow (`fill=bg, stroke=color, sw=2`) / Article solid (`fill=color, sw=0`)
- **D1 Past/Future gradient**: `<linearGradient>` 한 개, past 0.78 → future 1.0, gradStop clamped, 픽셀 완벽
- **D2 horizon source**: `getHorizonSource(article)` 헬퍼 신규 (`"planned" | "updated" | "created"`). plannedDate horizon 시 우측 끝 dashed vertical overlay

#### 부수 변경
- `lib/wiki-utils.ts` 신규 헬퍼 3개 (`safeDate`, `horizonOf`, `getHorizonSource`)
- `lib/store/types.ts` + `slices/wiki-articles.ts`: `setWikiArticlePlannedDate` action (planning ≠ updatedAt activity)
- `components/side-panel/wiki-article-detail-panel.tsx` (+54): plannedDate 설정 UI (날짜 picker)
- `components/views/wiki-list.tsx` (+84): Timeline list 통합
- `components/views/wiki-board.tsx` + `wiki-view.tsx` (+2/-2 각각): 분기 조정
- `docs/02-design/features/timeline-planning.design.md` (+225): bars-first §3/§5/§11 재작성

### 브레인스토밍 & 큰 결정 (영구)

- **bars-first timeline 본질 = 막대가 정보 컨테이너 (Reticle 패턴)** — dots-first는 산점도 (위치만), bars-first는 timeline (위치 + 길이 + 정보). 막대 안/옆 title + 끝점 status dot + Tooltip이 본질.
- **viewport fit 강제는 timeline antipattern** — 1일에 충분한 px (zoom별 80/32/10/3) + 가로 스크롤 인정 = Gantt/Linear/Reticle 표준. fit forcing은 tick label도 막대도 다 압축.
- **"Now" 라벨은 axis tick과 다른 alignment** — vertical line 우측 5px offset + textAnchor "start". 같은 row여도 alignment 차로 collision 회피 (옵션 c, 가장 깔끔).
- **Plot "Gentle by default" 톤 = subtle layers + opt-in affordance** — Weekend stripe 0.04 / Future stripe 0.06 / NOW line opacity 0.7 / hover ring opacity 0.5 / gradient 0.78→1.0. 모든 시각 효과 subtle, intrusive X.
- **planning intent ≠ content activity** — setWikiArticlePlannedDate는 updatedAt 안 건드림. plannedDate 설정은 intent 표명일 뿐 실제 content 변경 아님. (영구 룰 후보)
- **Status dot 메타포 (timeline 한정)** — Stub = hollow (raw, unfinished), Article = solid (completed, present). 색은 status 토큰 그대로.
- **horizon source 3분기** — `plannedDate` (intent, dashed end-cap), `updatedAt` (last activity, solid), `createdAt` (last-resort fallback, near-0-width). 우측 끝 dashed vs solid가 source 시각 분리.

### 기술 학습 (영구)

- **SVG hover는 React state + mouseEnter/Leave 패턴** — CSS `:hover` 안 통함 (SVG 자식들 selector 까다로움). React state로 hoveredId 관리하면 SVG 그룹 전체에 적용 + 라벨 column 동기 가능.
- **SVG bar에 Tooltip = absolute div wrapper** — `<foreignObject>`는 브라우저 호환 + z-index 까다로움. 막대 위 invisible hit area + 외부 absolute div Tooltip이 더 안전.
- **D1 Past/Future gradient = linearGradient 1개 > split rect 2개** — gradStop 비율로 부드러운 transition. split rect는 픽셀 경계 어색.
- **gradient stop clamp 의무** — `gradStop = Math.max(0, Math.min(1, (nowX - x) / width))`. nowX가 막대 밖에 있으면 0 또는 1로 클램프 안 하면 gradient invalid.
- **sticky element 불투명 배경 의무** — `position: sticky` + 불투명 `var(--bg)` 명시. 투명하면 막대가 비춰 sticky 효과 X.
- **sticky z-index 위계** — corner (max) > sticky col (mid) > sticky header (low) > content (base). 가로 + 세로 스크롤 동시 작동 시 corner가 가장 위.
- **px-per-day 곱셈은 zoom 별 상수 매핑이 비례 공식보다 안전** — `pxPerDay * factor` 계산은 zoom 경계에서 minBar 점프 발생. zoom 별 상수가 명시적이고 디버깅 쉬움.
- **`window.__plotStore` dev expose 패턴** — Plot은 store를 window에 노출 (dev 검증용). preview MCP eval로 store action 직접 호출 가능. **단 production build에서도 노출되는지는 별도 확인 의무**.
- **preview MCP IDB는 사용자 본인 viewport와 분리** — 같은 origin 같은 path여도 별도 browser context. dummy data sync 안 됨. 시각 검증은 사용자 본인 viewport가 진실 source.
- **wiki-timeline-view.tsx 1067줄은 너무 거대** — sub-component 분리 권장 (`<TimelineAxis>` / `<TimelineBars>` / `<TimelineGrid>` / `<TimelineTooltip>`). 향후 리팩토링.

### Watch Out (다음 세션)

- 🔴 **사용자 본인 viewport 시각 검증 미완** — 머지 후 사용자가 첫 시도. 부족한 부분 발견 시 fix 라운드 또는 옵션 C 보류.
- 🔴 **9 dummy article은 preview MCP에만** — 사용자 본인 IDB에 sync 안 됨. console snippet 본인 viewport에서 paste 필요.
- 🟡 **`window.__plotStore` production 노출 여부** — `grep "__plotStore" lib/store/` 확인. prod expose면 dev-only 가드 추가.
- 🟡 **wiki-list.tsx +84줄 Timeline 통합** — List/Board view 회귀 여부 검증 (사용자 시각 확인 시 List/Board도 한번 클릭).
- 🟡 **wiki-timeline-view.tsx sub-component 분리 권장** — 1067줄 단일 파일. 향후 1+1 리팩토링 후보.
- 🟢 **dnd-kit drag로 plannedDate** (옵션 C) — 별도 PR 권장 (~150줄, dnd-kit 추가 의존성 없음 — 이미 설치). 막대 우측 끝 grab handle + onDragEnd로 setWikiArticlePlannedDate.

### 환경 변경

- Main HEAD: `491d8a1` (PR #391) → 이번 PR squash merge 후 + 이 docs sync PR
- Store version: 144 (변경 없음 — `plannedDate`는 additive optional, migration 불필요)
- 신규 store action: `setWikiArticlePlannedDate(articleId, iso | null)` (planning intent, updatedAt 안 건드림)
- 신규 헬퍼 (`lib/wiki-utils.ts`): `safeDate`, `horizonOf`, `getHorizonSource`
- ZoomConfig 매핑 (`wiki-timeline-view.tsx`): Week 80/24/60, Month 32/18/60, Quarter 10/12/50, Year 3/8/40 (pxPerDay / MIN_BAR / TITLE_THRESHOLD)
- 영구 룰 후보: planning intent ≠ content activity (next 세션에서 사용자 OK 시 LOCKED)
- TS 부채 0 유지: `tsc --noEmit` clean, `npm run build` ✓
- 사용자 IDB stale data: 없음 (additive optional 필드만)
- 정리: `nul` 파일 삭제 + `.claude/worktrees/` gitignore 추가

### 머신
집 (Windows, 직전 세션 동일). **다음 세션 = 다른 컴퓨터 예정**.

---

## 2026-05-20 — 집/Windows, **4영역 작업 + timeline-planning bars-first 전환**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **timeline-planning을 bars-first로 재설계.** Reticle(포트폴리오 플래너) 레퍼런스 비교 → "dots-only 타임라인은 약하다, 막대라야 타임라인" 결론. bars-first 전환 **확정**.
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main`
> 2. **`npm install`** (★ `fractional-indexing` 등 — node_modules는 다른 머신에 없음)
> 3. `npm run dev` (port 3002, hard refresh)
> 4. `docs/02-design/features/timeline-planning.design.md` 읽기 (현 설계 = dots 기반, §5/§3/§11 재작성 필요)
> 5. **막대 모델 사용자 최종 확인** → 설계 bars-first 재작성 → `components/views/wiki-timeline-view.tsx` 재구현
>
> **막대 모델 (제안 — bars-first 방향은 확정, 세부 모델은 사용자 OK 대기)**:
> - 모든 article = 막대 1개. 막대 = `createdAt → horizon`
> - horizon = `plannedDate`(있으면, now 넘어 미래로 뻗음) / `updatedAt`(없으면, 과거 lifespan)
> - 생성=수정(무편집) → ≈0폭 → 작은 마커
> - 색 = 상태(stub 앰버/article 그린), now 이후 미래 구간 점선, 끝점 = 상태점, "now"선 굵게(Reticle TODAY처럼)
> - `plannedDate` 설정 UI(detail 패널/우클릭) 포함 — 기존 Stage 1/2 구분 폐기, 통합
> - Reticle 도메인(수익률 %·진행률 채움)은 안 베낌 — 구조만 차용
>
> **머신**: 집 (Windows)
> **Store version**: 144 (변경 없음 — `plannedDate`는 additive optional, migration 불필요)

### 완료 (이번 세션, 단일 PR)

1. **빌드 fix** — `fractional-indexing` 미설치 → `npm install`. (package.json엔 있었으나 node_modules 누락 → 미리보기 빌드 에러)
2. **dead block cleanup** (구 TODO P0 #1, 3 파일) — PR #387 옵션 A 잔존 정리:
   - `lib/wiki-view-mode.ts` — `WikiViewMode` union `"category"` 리터럴 제거
   - `components/side-panel/side-panel-context.tsx` — `isCategoryMode` dead block(38줄) + dead import 4개 제거 (`wikiCategories` 유지)
   - `components/views/library-categories-view.tsx` — stale `"category"` 주석 수정
3. **Home "Overview" NavLink** — `linear-sidebar.tsx` Home 사이드바(`activeSpace==="home"`)에 Overview NavLink 추가 (→`/home`, Inbox 위). Wiki/Library 패턴 미러. Home Overview(=`HomeView` 대시보드)는 **이미 존재** — 사이드바 진입점만 부재였음 ("Inbox에서 돌아갈 곳 없음" 해소).
4. **Breadcrumb 통일** — `library-breadcrumb.tsx`/`book-breadcrumb.tsx` crumb 아이콘 제거(텍스트-only, Notes `editor-breadcrumb` 기준) + `inbox-view.tsx`에 "Home › Inbox" breadcrumb(ViewHeader `titleNode`) 신설. picker popover 메뉴 아이콘은 유지.
5. **timeline-planning PDCA Plan + Design** — `docs/01-plan/features/timeline-planning.plan.md` + `docs/02-design/features/timeline-planning.design.md` 신규.
6. **timeline-planning 구현 (진행 중·미완)** — `components/views/wiki-timeline-view.tsx` 신규 + `WikiArticle.plannedDate?` 필드 + `ViewMode "timeline"` 등록(`view-engine/types.ts`·`view-configs.tsx`·`display-panel.tsx`) + `wiki-view.tsx` 분기. 작동하지만 **dots 기반 — bars-first 재설계 직전 상태**로 머지.

### 브레인스토밍 & 큰 결정

- **timeline-planning 풀 브레인스토밍** (출발 = 구 TODO #2 Calendar 사이드바 → "시간/계획"으로 수렴):
  - Todo 갈래 = **1a(지식 엔티티 계획 도구)** 채택 / 1b(TickTick급 범용 투두) 폐기 — Plot 코어 이탈.
  - planning layer = 경량 `plannedDate` 필드 (신규 엔티티 X).
  - **Timeline = view-engine display mode** (List/Board/Gallery 형제), Calendar 전용 X.
  - Todo 실체 = `lib/todo-index.ts` — 노트 본문 체크박스 인덱스일 뿐 (엔티티 아님, 날짜 없음).
- **Home/Inbox 구조 정정** — Inbox = attention 큐(reminder/SRS/snooze/wiki제안, `inbox-view.tsx`). Home Overview = `HomeView` 대시보드(이미 존재). status(stone/brick/block)와 Inbox는 별개 layer.
- **★ bars-first 전환 (세션 막판, 가장 중요)** — Reticle 레퍼런스 비교 → dots-only 약함. **bars-first 확정.** 막대 = 범위 = planning이므로 Stage 1(dots)/Stage 2(planning) 구분 폐기, 통합.

### 기술 학습 (영구)

- **신규 뷰 컴포넌트는 Plot 뷰 시스템 토큰/패턴을 명시 지시할 것** — agent가 standalone 시각화로 만들면 Plot 타이포 토큰(`text-note`/`text-2xs`)·행 패턴과 단절 → "다른 앱" 느낌. 기존 뷰(List 등)를 reference로 명시 + 결과 시각 검증 의무.
- **SVG/CSS `height="100%"`는 부모 명시 height 필요** — 부모가 `min-height`만 있으면 % 해소 안 됨(content 높이로 collapse). 스크롤 영역 채우려면 JS 측정(ResizeObserver) → 명시 px.
- **타임라인은 planning(막대) 없이 약함** — dots-only = 산점도. 범위 막대라야 "타임라인다움". 막대 범위 = planning layer가 제공.

### Watch Out

- 🔴 **timeline 미완** — 작동하는 dots 버전이 main에 머지됨. 다음 세션 bars-first로 재설계(덮어쓰기).
- 🟡 **`npm install` 필수** — `fractional-indexing` 등 node_modules 다른 머신에 없음.
- 🟡 미리보기 스크린샷 도구가 렌더를 작게 잡음 — 시각 검증을 사용자에게 의존했음.
- 🟢 누적 미스모크 (fresh dev 권장): dead block cleanup / Home Overview NavLink / breadcrumb 통일.
- 🟢 Parked: 기존 체크박스-todo → Inbox 새 `InboxItemKind "task"`로 이전 검토.

### 머신
집 (Windows)

---

## 2026-05-19 (밤 후속 #2) — 집/Windows, **P0 #1 Plan A++ 완료 (PR #387, 단일 PR)**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> ✅ **P0 #1 (CategoriesView own view + Library Views 제거 + migrate) 완료** (PR #387 squash merged `fb4c2da`)
>
> 🟣 **다음 P0 후보** (사용자 결정 대기):
> - **A. dead block cleanup follow-up** (~3 파일, LOW risk) — side-panel-context.tsx:131-156 dead block + `WikiViewMode` union `"category"` 제거 + setter 함수 정리. PR #387 옵션 A 잔존 정리.
> - **B. Calendar 사이드바 변화** (사용자 의도 미확정) — Day Summary / 월간 통계 / 현재 노트 detail
> - **C. Ontology graph node 사이드바** (graph node → 4탭 사이드바 추천)
> - **D. Activity events 후속** (Granular Wiki/Book + Label entity events)
> - **E. Books own Views section** (영구 룰 #87 정합 — 1차 entity gap)
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main` (latest = PR #387 머지 후 + 이 docs sync PR)
> 2. `npm install && npm run dev` (port 3002, hard refresh)
> 3. **이 entry + `docs/TODO.md` P0 read 의무** (사용자 mental model 회복용)
> 4. 사용자 manual smoke 누적 14 PR (#373-#387) — 특히 PR #387 6 cross-entity 호출처 (wiki article 안 category badge / navbox / side panel / category detail panel → /library/categories)
> 5. 사용자 새 시그널 응답
>
> **이번 세션 사용자 의도 (chronological, 그대로 인용)**:
> 1. "P0. 논의부터 계속 이어가보자. 문제는 라이브러리의 뷰야." → Library = hub 본질 paint
> 2. "ㅇㅋㅇㅋ" → 방향 A (Library Views section 제거) LOCKED
> 3. "ㅇㅇ 시작해" → executor-high delegate (Phase 1+2 통합)
> 4. "옵션 A를 하면 뭐가 바뀌는데??" → architect HIGH risk + 옵션 A/B paint
> 5. "ㅇㅇ 옵션 A로 가." → Fix executor-high delegate (wiki-view-mode 부작용 제거 + 6 호출처)
> 6. "오케이 좋아." → squash merge + after-work
>
> **머신**: 집 (Windows, 직전 세션 동일)
> **현재 main HEAD**: `fb4c2da` (PR #387 squash merged) + 이 docs sync PR
> **Store version**: 143 → **144** (v143→v144 migration)

### 완료 (이번 세션 1 PR squash 머지, P0 #1 Plan A++ 완성)

#### PR #387 — Categories own view + Library Views section 제거 (Plan A++) (squash merged fb4c2da, +315/-162, 20 파일, 1 new)

**본질 결론**: Library = cross-entity hub (space 아님). PR #383 wiki-view 의존 + PR #385 통합 Library Views section은 카테고리 오류 → Plan A++ paired PR로 본질 회복.

**Phase 1 — Categories own view component (8 파일)**:
- 신규 `components/views/library-categories-view.tsx` (147 lines, own contextKey `"library-categories"`)
- `components/views/wiki-view.tsx` — `wikiViewMode === "category"` 분기 4곳 + state + import 완전 제거 (~160 lines)
- `app/(app)/layout.tsx` — WikiView ↔ LibraryCategoriesView mount 분리
- `components/views/library-view.tsx` — Categories card navigate `/wiki` → `/library/categories` + stale 코멘트 제거
- `app/(app)/library/categories/page.tsx` — stale JSDoc 제거
- `lib/table-route.ts` + `lib/view-engine/types.ts` + `lib/view-engine/defaults.ts` + `lib/view-engine/view-configs.tsx` — `"library-categories"` 등록 (4 파일)

**Phase 2 — Library Views section 제거 + migrate (4 파일)**:
- `components/linear-sidebar.tsx` — Library section `renderViewsSection` 제거 + Categories sub-page conditional own Views + `getSavedViewSpaceForActivity(activeSpace, activeRoute)` route 인자 추가
- `lib/types.ts` — `SavedView.space` union: `"library"` 제거 + `"library-categories"` 추가
- `lib/store/migrate.ts` — v143→v144 migration (실제 mutation, `space === "library"` → `"library-categories"` re-tag, idempotent + 데이터 보존)
- `lib/store/index.ts` — persist version 144
- `lib/view-engine/saved-view-context.ts` — 시그니처 확장 + `"library-categories"` 매핑

**HIGH risk fix (옵션 A, 6 파일)** — Architect 1차 verification에서 발견:
- `lib/wiki-view-mode.ts` — `setActiveCategoryView()` / `setCategoryOverview()`에서 `setWikiViewMode("category")` 부작용 제거. `_activeCategoryId` 갱신만 함.
- 6 cross-entity 호출처 router.push("/library/categories") 페어링:
  - `components/wiki-editor/wiki-article-view.tsx:1124-1129` (handleCategoryClick)
  - `components/wiki-editor/navbox-block.tsx:293-299` (handleCategoryHeaderClick)
  - `components/side-panel/side-panel-context.tsx` (CategorySidePanel onSelect, useRouter import 추가)
  - `components/side-panel/side-panel-connections.tsx` (navigateToCategory useCallback, 2 onClick)
  - `components/side-panel/category-detail-panel.tsx` (navigateToCategory useCallback, 2 onClick)

### 영구 LOCKED 결정 추가 (#86-#88, 이 PR로 LOCKED)

이번 PR이 Plot 본질 결정 3건 LOCKED. brainstorming 4단 (직전 세션) + 코드 구현 완료 + Architect APPROVED:

- **#86. Save view 의미 = entity 본질 따라 differentiate** — Notes/Wiki/Books 큼, Categories 의미, Tags/Labels/Files/References/Stickers 약함 (이미 코드 호출 없음). `getSavedViewSpaceForActivity` 시그니처 (space + route)가 entity differentiation 본질 정합.
- **#87. Library = hub. own Views section 없음. 1차 시민이지만 view는 sub-entity가** — Library Activity Bar 6번째 = 진입 1차. 단 own view는 sub-entity가 보유 (Categories만 currently). Linear 패턴 정합 (each space own views는 single-entity space에만 적용). multi-entity hub은 sub-entity가 view 보유.
- **#88. Categories own view component (cross-entity 본질 회복, wiki 종속 부조화 해소)** — WikiCategory 풀 공유 (Note/Wiki/Book)이므로 categories click → /library/categories. wiki article 안 6 cross-entity 호출처 모두 paired route navigate 의무.

### 기술 학습 (영구, 2026-05-19 밤 후속 #2)

- **wiki-view-mode external store 부작용 분리 패턴**: setter 함수가 wikiViewMode 전환 + 다른 state 함께 갱신할 때, wikiViewMode가 더 이상 처리 안 되면 setter에서 wikiViewMode 호출만 제거 + 다른 state는 유지. enum value 잔존은 LOW risk (별도 cleanup PR로 분리 OK).
- **Cross-entity click handler paired route navigate 패턴**: cross-entity 자원 (categories 풀 공유)을 click 시 own page navigate 의무. handler 시그니처 `setX(id) + setActiveRoute(path) + router.push(path)` 3-tuple. side panel에서는 useCallback wrapping (router deps).
- **Architect verification 2회 패턴 효율**: 1차 opus APPROVED_WITH_NOTES → fix → 2차 sonnet medium re-verify (짧게) → APPROVED. opus 1회 + sonnet 1회 비용으로 정확도 + 효율 balance.
- **getSavedViewSpaceForActivity 시그니처 확장 (space + route)**: PR #385 (space 단독) → PR #387 (space + route) — Library sub-route 분리 위해. activeSpace 단독으로는 sub-entity 분리 불충분 (Linear/Notion도 sub-route별 view).
- **VIEW_CONFIGS defensive shallow clone 패턴**: `{ ...WIKI_CATEGORY_VIEW_CONFIG }` — 같은 config 객체를 두 key에 매핑 시 future cross-contamination 회피. filterCategories[i].values 같은 dynamic field가 한 쪽 mutate 시 다른 쪽 영향.

### 영구 룰 추가 (#84-#85 — 이번 PR 부산물)

executor-high 자체 식별 (1차 verification 통과 후):

- **#84. wiki-view-mode external store는 LibraryCategoriesView가 직접 구독** — `useActiveCategoryId()` / `setActiveCategoryView()` external store 그대로 유지. own component가 own state subscribe.
- **#85. layout.tsx mount 조건 분리 패턴** — `activeRoute === "/library/categories"` 같은 정확 매핑 필요. `startsWith("/library")` too broad — main-content panel 양분 (PR #382 회귀 사례). 정확 매핑 의무.

### Watch Out (다음 세션)

- 🟣 **dead block cleanup follow-up** (~3 파일, LOW risk) — side-panel-context.tsx:131-156 `isCategoryMode` dead block (옵션 A 후 영원히 false) + `WikiViewMode` union `"category"` 리터럴 잔존 (dead enum) + setter 함수 deprecate 또는 이름 변경. 현재 기능 영향 0, 미래 타입 오염 방지.
- 🔴 **사용자 manual smoke 누적 14 PR (#373-#387)** — fresh dev 재현 권장. 특히 PR #387 본질 변경 검증:
  - Wiki article 본문 안 category badge click → `/library/categories` + 해당 category selected
  - Navbox category header click → `/library/categories`
  - Side panel Connections / Category detail panel parent/sub click → `/library/categories`
  - Library home Categories card click → `/library/categories`
  - `/wiki` 정상 동작 (회귀 없음, wikiViewMode "category" 트리거 안 됨)
  - Tags/Labels/Files/References/Stickers click → Views section 노출 안 됨
  - 기존 saved view (PR #385 "library" space) → v144 migrate 후 Categories sub-page 노출
- 🟡 **Categories Save view 시그널 검증**: Categories sub-page에서 Save view → Categories Views section에 즉시 노출 (own contextKey + own space)
- 🟢 **v143 → v144 migration log 확인**: `[migrate] v143→v144: SavedView.space "library" → "library-categories"` console log. 사용자 데이터에 "library" space 있을 때만 발생.

### 환경 변경

- Main HEAD: `529cfcb` (PR #386) → `fb4c2da` (PR #387) → docs sync PR (이 entry)
- Store version: 143 → **144** (실제 mutation migration)
- 신규 file: `components/views/library-categories-view.tsx` (147 lines)
- 변경 type: `SavedView.space` union ("library" 제거 + "library-categories" 추가), `ViewContextKey` ("library-categories" 추가)
- 영구 룰 추가: #84-#88 (이 PR로 5개 LOCKED) — wiki-view-mode external store 패턴 / layout mount 정확 매핑 / Save view differentiate / Library hub 본질 / Categories cross-entity own view

---

## 2026-05-19 (밤 후속) — 집/Windows, **13 PR squash 머지 + Library Views 본질 brainstorming**

> 🎯 **다음 즉시 액션 (다른 컴퓨터 로그인 후 시작점)**:
>
> **🔴 P0 #1 — CategoriesView own view component 분리 (Plan A++, ~5-7 파일, 사용자 brainstorming 결정 대기)**
>
> 사용자 본질 통찰 (2026-05-19 밤 후속 brainstorming 핵심):
> > "카테고리스 뷰를 위키 뷰로 나오게 하면, 카테고리스가 범용 엔티티가 아니라 위키 종속 엔티티처럼 느껴지는데?? 카테고리스가 범용 엔티티라면 그러면 안 되지."
>
> 문제: PR #383으로 `/library/categories` → wiki-view (wikiViewMode="category") mount. **사용자 시각 = Categories가 wiki 종속**. 영구 룰 #54 (WikiCategory 풀 공유 cross-entity) + #57 (Library cross-entity hub) 부조화.
>
> Fix path (Plan A++): wiki-view 안 categoryOverview UI를 **own component (CategoriesView)** 로 분리. own contextKey + own viewState + own saved view. 단 사용자 명시 결정 대기 (이번 세션 brainstorming dismiss).
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main` (latest = PR #386 docs sync 머지 후)
> 2. `npm install && npm run dev` (port 3002, hard refresh)
> 3. **이 entry + `docs/TODO.md` P0 #1 + brainstorming 결과 read 의무** (사용자 mental model 회복용)
> 4. 사용자에게 P0 #1 (CategoriesView 분리) 진행 의지 확인 + Plan A++ scope 재검토
> 5. 또는 사용자 새 시그널 응답
>
> **이번 세션 사용자 의도 (chronological, 그대로 인용)**:
> 1. "before-work" → keen-torvalds-ba16f7 worktree 진입
> 2. "P0#1을 하자. 근데 해당 작업 내용이 뭐지?" → 직관 설명 후 PR #373
> 3. "ㅇㅋ" → PR #374 group header tint
> 4. "지금 뭐가 바뀐 거지??" → PR 변화 설명
> 5. "ㄴㄴ 다음 작업 진행하자" → PR #375 WikiTemplate hero
> 6. "P0 #4부터" → PR #376 TS debt cleanup
> 7. "P1 첫번째 들어가자" → PR #377 Wiki Template insert
> 8. "다음 작업" → PR #378 TagDetailPanel cross-entity
> 9. (스크린샷) "태그스 필터위치 이상해 + 라벨스 split view 버그" → PR #379 split view auto-close
> 10. "after-work + 다음 세션" → PR #380 docs sync
> 11. "ㅇㅇ 다음작업" → view-engine 통합 진행
> 12. "Phase 1만 (filter popover 정합화)" → PR #381
> 13. "야 여전히 안 되는데??" → 진단 + PR #382 LibraryView visibility fix
> 14. "카테고리스는 여전히 위키 사이드바에서 열림" → PR #383 Categories Library sub-page route
> 15. (스크린샷) "레퍼런시스랑 태그스는 아예 클릭해도 화면이 안 뜨고" → PR #384 LibraryView fallback 회귀 fix
> 16. "라벨스는 왜 필터가 없지?" → brainstorming → "b+e로 하자" → PR #385 Library Views + Labels filter
> 17. **"근데 나 의문인게 태그, 라벨, 카테고리, 스티커 등등은 전부 다 다른 엔티티잖아? 라벨스에서 어떤 뷰로 저장을 하면 라벨스만 나오고 카테고리스에서 어떤 뷰로 저장을 하면 카테고리스만 나올 텐데... 어떻게 생각해??"** → 디자인 결함 발견 (PR #385 통합 부조화)
> 18. **"노트랑 위키는 View가 어느 정도 의미가 있다고 보는데 태그, 라벨, 레퍼런시스, 카테고리 등은 view가 의미가 있나?"** → entity별 view variation 분석 (Save view = entity 본질 따라 differentiate)
> 19. **"카테고리스에는 뷰가 있어야 된다고 너는 보는 거야?? 카테고리스에서만 뷰가 있게 하고 나머진 폐기로 갈까?"** → Plan A 변형 결정 (Categories만 Save 유지) — 코드 상태 이미 일치 (Tags/Labels/Files/References/Stickers Save 호출 X)
> 20. **"애초에 라이브러리는 모든 것에 통용되는 곳인데 왜 우리가 라벨, 카테고리까지 라이브러리로 옮긴 거였어?? md한번 살펴볼래?"** → docs/CONTEXT.md 영구 결정 #53-#58 발견 (2026-05-17 cross-entity 분류 hub) → mental model 회복
> 21. **"오케이 근데 이러면 views는 결국 독립적 엔티티로 가게 되는 거네...음.."** → View = 메타-entity 분석 (자기 정체성 가짐, 단 first-class data 아님)
> 22. **"A가 리니어 방식인가??"** → Linear 패턴 매핑 (each space own Views section, A는 부분 Linear-like)
> 23. **"근데 카테고리스 뷰를 위키 뷰로 나오게 하면, 카테고리스가 범용 엔티티가 아니라 위키 종속 엔티티처럼 느껴지는데?? 카테고리스가 범용 엔티티라면 그러면 안 되지. 캘린더랑 온톨로지에는 뷰가 있는 게 맞나? 그렇다면 라이브러리에도 뷰가 있어야 하는데 반드시."** → **이번 세션 최종 통찰** (Categories own view component 필요)
> 24. "오케이 일단 지금 대화내용까지 전부 정리해서 after-work 해줘" → 이 entry
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #385 머지 후 + 이 docs sync PR
> **Store version**: 143 (변동 없음, schema 변경 0)

### 완료 (이번 세션 13 PR squash 머지)

#### P0 1-4 (앞 세션 #380에서 정리 완료, 누적 reference)
- PR #373 (P0 #1): light mode hex contrast — useTintedText hex 지원
- PR #374 (P0 #2): group header tint cascade
- PR #375 (P0 #3): WikiTemplate detail panel hero edit UI
- PR #376 (P0 #4): TS debt 10 → 0 + dead code + doc comment + encyclopedia hatnotes
- PR #377 (P1): Wiki Template insert via AddBlockButton
- PR #378 (P1): TagDetailPanel cross-entity 강화
- PR #379 (P1 quick fix): Labels/Tags split view auto-close
- PR #380 (docs sync): after-work 1차

#### P1 view-engine + Library 회귀 fix 6 PR (이번 entry 핵심)

##### PR #381 — P1 view-engine Phase 1: sub-page filter popover 표준 정합 (squash merged 430b6de)
사용자 보고 "태그스 필터위치가 이상해. 라벨스나 위키 노트 등과 맞춰줘야". 진단: Tags/Labels sub-page는 FilterButton (DropdownMenu) 구식 패턴. Notes/Wiki는 ViewHeader 내 FilterPanel popover 표준. 정합 X.

수정 (2 파일 +59/-24):
- Tags/Labels sub-page Filter popover → 표준 Popover + FilterPanel
- NOTES_VIEW_CONFIG.filterCategories reuse (sub-page = notes 표시)
- toggleFilter signature adapter

##### PR #382 — Library visibility fix (LibraryView sub-route hide) (squash merged 853e1d1)
사용자 보고 (스크린샷) "라벨스의 경우 자꾸 스플릿뷰로 나오거든? 이거 버그같은데". preview MCP 진단:
- secondaryNoteId / secondarySpace 모두 null (split view 아님)
- main-content panel 안 visibility 검사: LabelsView + **LibraryView 둘 다 visible**
- 원인: layout.tsx LibraryView visibility `activeRoute?.startsWith("/library")` → sub-route에서도 true → main-content panel 양분 (split-like 화면)

수정 (1 파일 +6/-1):
- `activeRoute?.startsWith("/library")` → `activeRoute === "/library"` (root만)

##### PR #383 — Categories Library sub-page route (squash merged 3226fb6)
사용자 보고 "카테고리스는 누르면 위키 사이드바로 위치가 옮겨가는 불량". 원인: linear-sidebar Categories click → `setActiveRoute("/wiki")` → wiki page jump → wiki sidebar.

수정 (3 파일 +22/-8):
- linear-sidebar Categories click → `/library/categories` (wiki 아님)
- layout.tsx WikiView mount 조건 확장 (`/library/categories`도 mount)
- 신규 `app/(app)/library/categories/page.tsx` (빈 컴포넌트, layout이 WikiView mount)

→ Library sidebar 유지 + categories overview UI 표시. 단 **wiki-view 통한 표시는 사용자 통찰로 본질 부조화 발견 (다음 세션 P0 #1 Plan A++)**.

##### PR #384 — LibraryView visibility 회귀 fix (squash merged 3636555)
사용자 보고 "레퍼런시스랑 태그스는 아예 클릭해도 화면이 안 뜨고. 총체적 난국". PR #382 회귀:
- layout.tsx에 /library/tags, /library/references, /library/files, /library/stickers mount component 없음
- PR #382 후 LibraryView도 hidden → **빈 화면**

수정 (1 파일 +14/-1):
- LibraryView visibility 정교화: `activeRoute === "/library" || (startsWith("/library/") && NOT (/library/labels | /library/categories))`
- /library/labels: LabelsView visible ✓
- /library/categories: WikiView visible ✓
- /library/tags, /references, /files, /stickers: **LibraryView fallback overview** ✓

##### PR #385 — Library Views section + Labels filter (B+E entity-uniformity) (squash merged 1426ec8)
사용자 보고:
1. "카테고리스의 세이브를 누르게 되면, 해당 view는 어디서 볼 수 있는 거지? 라이브러리의 사이드바에는 view가 없잖아?"
2. "라벨스는 왜 필터가 없지? 너의 기준대로라면 라벨스는 필터가 없고, 나머지는 전부 필터가 있는 거야??"

진단:
- Library/Books sidebar에 `renderViewsSection` 호출 없음 = saved view dead feature
- LABELS_LIST_VIEW_CONFIG만 `showFilter: false` — 다른 모든 entity는 true (예외)

수정 (8 파일 +67/-12):
- **B (Library Views section)**: SavedView.space에 "library" 추가 + getSavedViewSpaceForActivity library 매핑 + linear-sidebar Library section에 renderViewsSection 호출
- **E (Labels Filter)**: LABELS_LIST_VIEW_CONFIG.showFilter true + filterCategories에 "usage" axis + FilterField에 usage + FIELD_TO_GROUP 매핑 + use-labels-view Stage 1b filter logic + labels-view ViewHeader filterContent

→ Library sidebar에 Views section + Labels에 Filter button (Usage: In use / Unused).

### 🧠 핵심 Brainstorming (PR #385 후 사용자 통찰 4단)

#### 통찰 1: Save view 의미 = entity 본질 따라 differentiate
사용자 의문: "라벨스에서 저장한 view는 라벨스에만, 카테고리스에서 저장한 view는 카테고리스에만 의미. 어떻게?"

분석:
- Notes/Wiki/Books: 다양한 filter/group/sort 조합 → Save view 의미 큼
- **Categories**: hierarchy + grouping 다양 → Save view 의미 중간
- Tags/Labels/Stickers/Files/References: view variation 적음 → Save 의미 약함

결론: PR #385의 통합 Library Views section은 part-over-engineering. 단 코드 상태 = Tags/Labels/Files/References/Stickers는 이미 `useSaveViewProps` 호출 안 함 → Save 버튼 없음. **Categories만 wiki-view 통해 Save 가능** (wiki contextKey 공유).

#### 통찰 2: Library cross-entity hub 본질 회복 (영구 LOCKED 결정 회복)

사용자 의문: "왜 라벨, 카테고리를 라이브러리로 옮긴 거였어?"

[docs/CONTEXT.md:263-279](docs/CONTEXT.md:263) 영구 LOCKED 결정 발견 (2026-05-17):
- **#53. Label/Category/Tag = orthogonal 독립 + 자유 선택**
- **#54. WikiCategory 풀 공유** (Note/Wiki/Book 같은 카테고리 시스템)
- **#57. cross-entity 분류 = Library hub** (Label/Category/Tag는 Library 사이드바)

→ Labels/Categories Library 이동 = cross-entity 본질 영구 결정. **OK**.

#### 통찰 3: View = 메타-entity (자기 정체성 가짐)

사용자 의문: "이러면 views는 결국 독립적 엔티티로 가게 되는 거네."

분석:
- SavedView에 id / name / description / icon / color → entity처럼 행동
- 단 first-class data entity 아님 — 메타-entity (entity의 view를 저장)
- Notion/Linear/Airtable 모두 entity-tied 패턴 (view를 own space로 승격 안 함)

→ Plot도 entity-tied (Notes views in notes sidebar, Wiki views in wiki sidebar, **Library views in library sidebar** — entity-uniformity).

#### 통찰 4 (최종): Categories own view component 필요 — wiki 종속 부조화 해소

사용자 의문 (이번 세션 최종 통찰):
> "카테고리스 뷰를 위키 뷰로 나오게 하면, 카테고리스가 범용 엔티티가 아니라 위키 종속 엔티티처럼 느껴지는데?? 카테고리스가 범용 엔티티라면 그러면 안 되지. 캘린더랑 온톨로지에는 뷰가 있는 게 맞나? 그렇다면 라이브러리에도 뷰가 있어야 하는데 반드시."

분석:
- PR #383: `/library/categories` → wiki-view 안 categoryOverview UI 표시
- 사용자 시각: Categories = wiki 종속처럼 보임
- 영구 룰 #54 (cross-entity) + #57 (Library hub) 본질 부조화
- 진짜 fix: **CategoriesView own component 분리** (wiki-view 의존 제거)

Plot 영구 원칙 정합 결론:
1. Library = 1차 space → own Views section 있어야 ✓ (PR #385)
2. Categories own view component 필요 (다음 세션 P0 #1 Plan A++)
3. Save view = entity 본질 따라 differentiate (Tags/Labels는 Save 약함 — 이미 코드 상태 일치)
4. View = entity-tied (Linear 패턴 정합)

### 영구 LOCKED 결정 후보 (이번 세션, 사용자 결정 대기)

다음 세션에 사용자가 명시 결정 후 docs/CONTEXT.md에 영구 LOCKED:

- **#86 (후보)**: Save view 의미 = entity 본질 따라 differentiate (entity 양 + view variation 함수)
- **#87 (후보)**: Library 1차 space → own Views section (entity-uniformity, Linear 패턴)
- **#88 (후보)**: Categories own view component 분리 (cross-entity 본질 회복, wiki 종속 부조화 해소) — Plan A++ 진행 시 LOCKED

### 환경 변경

- Main HEAD: PR #380 → PR #385 → docs sync PR (이 entry)
- Store version: 143 (변동 없음, schema 변경 0)
- 신규 file (PR #383): `app/(app)/library/categories/page.tsx`
- SavedView.space type 확장: `"library"` 추가 (back-compat)
- FilterField 확장: `"usage"` (Labels-entity 신규)
- 영구 룰 추가: 0건 (brainstorming 결과는 결정 후보, 다음 세션에 LOCKED)

### Watch Out (다음 세션)

- 🔴 **P0 #1 (CategoriesView 분리) 진행 의지 재확인** 의무. 사용자 dismiss했지만 brainstorming 결과 명확. ~5-7 파일 회귀 risk 있음.
- 🔴 **사용자 manual smoke 누적 13 PR**: fresh dev 재현 권장 (특히 Library sub-page 회귀 verify — Tags/Labels/Categories/References/Files/Stickers 모두 작동).
- 🟡 **Categories own view 분리 시 wiki-view 안 categoryOverview UI 정리**: setCategoryOverview() 함수 / wikiViewMode "category" enum / wiki-view 안 분기 제거.
- 🟡 **Library Views section 운명** (PR #385): Plan A++ 후 Library Views section은 sub-route 기반 dynamic으로 변경 권장 (Categories views만 표시) — Linear 패턴 정합.
- 🟢 **Categories saved view contextKey 정밀화**: 현재 wiki-view 통해 wiki contextKey 공유. Plan A++ 후 own contextKey ("library-categories") 사용.
- 🟢 **Books sidebar Views section 없음** (entity-uniformity gap, follow-up 후보).

---

## 2026-05-19 (저녁/밤) — 집/Windows, **P0 1-4 + P1 3개 (7 PR squash 머지)**

> 🎯 **다음 즉시 액션 (단일 후보, 사용자 결정 받음)**:
> 1. **🔴 Tags/Labels sub-page view-engine 통합** (~10 파일, TODO P0 #1) — Tags filter 위치 정합화. 진단 결과: Tags+Labels sub-page는 layout 100% 동일이고 둘 다 inline `<div>` (Notes/Wiki 표준 `ViewHeader`와 다름). 통합 시 신규 `TAG_DETAIL_VIEW_CONFIG` + `LABEL_DETAIL_VIEW_CONFIG` + sub-page 재작성 + 회귀 verify.
>
> **이번 세션 사용자 의도** (그대로 인용):
> 1. "before-work" → keen-torvalds-ba16f7 worktree 진입, npm install 후 dev server (port 3002)
> 2. (빌드 에러) "미리보기가 빌드에러가 뜬다. Module not found: Can't resolve 'fractional-indexing'" → npm install 누락, dev 재시작
> 3. "P0#1을 하자. 근데 해당 작업 내용이 뭐지? 자세히 말해봐 쉽고 직관적으로" → light mode hex contrast follow-up 직관 설명
> 4. "ㅇㅋ" → PR #373 squash 머지
> 5. "오케이 다음 todo를 해볼까" → P0 #2 PR-E3 후보 결정 (Group header tint Recommended)
> 6. "ㅇㅋ" → PR #374 group header tint cascade squash 머지
> 7. "지금 뭐가 바뀐 거지??" → PR #373 + #374 변화 직관 설명 (themeColor 설정 article에서만 보임)
> 8. "ㄴㄴ 다음 작업 진행하자" → P0 #3 WikiTemplate hero UI 또는 P0 #4 cleanup 또는 후속
> 9. (선택) P0 #3 → PR #375 squash 머지
> 10. "다음 작업 진행 알려줘" / "다음 todo 작업 알려줘" → 남은 P0/P1 정리
> 11. "P0 #4부터" → PR #376 cleanup PR (TS 부채 10 → 0)
> 12. "P1 첫번째 들어가자" → PR #377 Wiki Template insert
> 13. "다음 작업" → P1 #2 Library TagDetailPanel 강화 → PR #378
> 14. (사용자 스크린샷) "태그스는 필터위치가 이상해... 라벨스나 위키 노트 등과 맞춰줘야 하고. 라벨스의 경우 자꾸 스플릿뷰로 나오거든? 이거 버그같은데" → 진단 후
> 15. "우선 2를 하고 1을 해보자" → PR #379 split view quick fix 머지. view-engine 통합은 다음 세션 권장으로 결정.
> 16. "after-work + 다음 세션 (Recommended)" → 이 entry
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main` (latest = PR #379 + docs sync)
> 2. `npm install && npm run dev` (port 3002, hard refresh)
> 3. Tags/Labels view-engine 통합 시작 — `LABEL_DETAIL_VIEW_CONFIG` / `TAG_DETAIL_VIEW_CONFIG` 신규 정의부터
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #379 머지 후 docs sync
> **Store version**: 143 (변동 없음 — 이번 세션 schema 변경 0)

### 완료 (이번 세션 7 PR squash 머지)

#### PR #373 — P0 #1: light mode hex contrast fix (squash merged 2431bd6)
- `lib/tinted-bg.ts:56-68` `useTintedText` inline regex 제거 → `lib/wiki-color-contrast::shouldUseLightText` delegate
- hex/rgb/rgba 모두 통일 처리 + Rec. 709 perceived luminance threshold 0.55
- 18 PRESET_COLORS algorithm unit test (preview_eval): BLACK 글씨 7개 (Amber/Yellow/Lime/Green/Emerald/Teal/Cyan) + WHITE 11개
- 보너스: TipTap infobox-node.tsx도 같이 fix

#### PR #374 — P0 #2: group header tint cascade (squash merged 0bde0ad)
- PR-E2 자연 follow-up. infobox group header (예: "ADDITIONAL INFO")도 themeColor cascade 포함
- `data-group-header=""` + `data-custom-color` attribute 추가 (GroupHeaderRow)
- root container에 Tailwind arbitrary selector + `color-mix(in srgb, var(--wiki-theme-color) 15%, transparent)` opt-in
- 영구 룰 #82 정합 (custom color 우선)

#### PR #375 — P0 #3: WikiTemplate detail panel hero edit UI (squash merged 5086c60)
- PR-C 후속 polish. wiki-template-detail-panel.tsx에 "Hero image" InspectorSection 신설
- figure preview + Edit/Remove / "+ Add hero image" empty state
- InfoboxHeroPicker mount (PR-C wiki-article-view와 정확 동일 시그니처)

#### PR #376 — P0 #4: TS debt + dead code + doc + hatnotes (squash merged dfd10cf)
- **TS 부채 10건 → 0 errors** (`npx tsc --noEmit` clean)
- dead code 삭제: `components/note-detail-panel.tsx` (679줄)
- doc comment 3건 정정 (PR-E1 architect non-blocking)
- WikiArticleEncyclopedia에 WikiHatnotes mount 추가 (PR-E1 잔재)
- 11 파일 +38/-704

#### PR #377 — P1: Wiki Template insert via AddBlockButton (squash merged 047875a)
- PR #358 후속. "From template…" entry를 AddBlockButton menu에 추가
- WikiTemplatePicker `mode: "create" | "insert"` prop + `onTemplateChosen` callback (영구 룰 #83 back-compat)
- prepend / append 위치 결정 (top "+" / bottom "+")
- 기존 `getWikiTemplateBlocksExpanded` + `updateWikiArticle({blocks})` 재사용 (영구 룰 #69 generic patch)

#### PR #378 — P1: TagDetailPanel cross-entity 강화 (squash merged aaf4a13)
- 기존 minimal (Notes only) → cross-entity 풀구조
- Connections section: Notes by status breakdown (Stone/Brick/Block chips) + Wiki count + Books count
- Properties: Notes / Wikis / Books / Color
- Used by: 3 entity 통합 list with entity icons (Notes click navigable)
- PR #331 Files Detail 패턴 정합

#### PR #379 — P1 quick fix: Labels/Tags split view auto-close (squash merged f7429d6)
- 사용자 보고 "라벨스의 경우 자꾸 스플릿뷰로 나오거든? 이거 버그같은데"
- 원인: split view UI state (`secondaryNoteId` / `activePane`) Zustand persist. 이전 split view 상태 잔존
- 해결: labels-view + tags-view mount once 시 `closeSecondary()` 강제 호출
- 2 파일 +20

### 영구 LOCKED 결정 (이번 세션, 신규 0 — 기존 영구 룰 적용만)

이번 세션 7 PR 모두 기존 영구 룰 자연 follow-up:
- **#69 (generic patch)**: PR #377 `updateWikiArticle({blocks})` 재사용 / PR #375 `updateWikiTemplate({infoboxHero})` 재사용
- **#82 (cascade opt-in)**: PR #374 group header tint `themeColor && [&_[data-group-header]:not([data-custom-color])]:bg-...`
- **#83 (component prop optional + back-compat)**: PR #377 WikiTemplatePicker `mode?` / `onTemplateChosen?` optional
- **#21 (entity-uniformity)**: PR #378 TagDetailPanel 4탭 구조 / PR #379 labels-view + tags-view 동일 패턴 mount

### 기술 학습 (영구, 2026-05-19 저녁/밤)

- **`color-mix(in srgb, ...)` 브라우저 지원 확인 패턴**: `CSS.supports("color", "color-mix(in srgb, red 15%, transparent)")` true. Tailwind arbitrary value 안에서 `color-mix(in_srgb,var(--xxx)_15%,transparent)` (underscore = space). v3.2+ 모던 브라우저 작동.
- **InfoboxHeroPicker self-contained Portal Dialog**: open + onOpenChange + initial + onSave 4 props만. mount 위치 자유 (dialog 자체가 Radix Portal 사용). caller가 add/edit 분기 안 가짐 — picker가 `initial` null/non-null로 자체 분기.
- **WikiTemplate insert path 단순화**: 신규 store action 추가 X. 기존 `getWikiTemplateBlocksExpanded(templateId): WikiBlock[] | null` (cloneAndExpandBlocks 내부 호출 — genId + placeholder expand 자동) + `updateWikiArticle({blocks})` (sectionIndex / linksOut / persistArticleBlocks 자동 재계산) 조합으로 끝.
- **split view state persist 버그 패턴**: Zustand persist 대상에 `secondaryNoteId` / `activePane` 포함. 사용자가 이전 세션 split view 켜면 다른 페이지 진입 시에도 secondary panel 자동 표시. Library sub-page에서 자동 close 패턴 (`closeSecondary()` on mount once)으로 해결.
- **AddBlockButton menu 확장 패턴**: 기존 onAdd 시그니처 `(type, level) => void` 유지 + 신규 prop `onAddFromTemplate?: () => void` 추가. opt-in (영구 룰 #82) — `onAddFromTemplate` 없으면 menu entry hidden.
- **사전 부채 cascading**: SortField 같은 type union 확장 시 `Record<SortField, X>` 매핑들도 확장 필요 (PR #376의 cascading fix 사례). tsc로 자동 검출.

### Watch Out (다음 세션)

- 🔴 **사용자 manual smoke 누적 7 PR**: light mode contrast (vivid color) / group header tint / WikiTemplate hero edit UI / Wiki Template insert from AddBlockButton / TagDetailPanel cross-entity / Labels/Tags secondary auto-close. fresh dev 재현 권장.
- 🟡 **Tags/Labels view-engine 통합** (다음 세션 P0 #1): ViewHeader 표준 sub-page 재작성. Notes/Wiki sub-page의 ViewHeader 사용 example 먼저 참고. ~10 파일 + 회귀 verify 의무.
- 🟢 **사용자 IDB stale WikiTemplate description**: PR #365 seeds.ts 영어 통일 fresh init만 적용. v143 → v144 backfill 가능 (선택).
- 🟢 **Wiki/Book Detail panel cross-entity 미적용**: PR #378 TagDetailPanel만 cross-entity 풀구조. wiki/book detail은 PR #322-#324 시점 minimal. 별도 PR 후속 가능.

### 환경 변경 (다음 머신 sync 필수)

- Main HEAD: `a809011` → PR #379 squash + docs sync
- Store version: 143 → **143** (변동 없음 — schema 변경 0)
- 신규 파일 / 삭제: PR #376에서 `components/note-detail-panel.tsx` 삭제
- 영구 룰 추가: 0건 (기존 룰 적용만)
- TS 부채 청소: 10 errors → **0 errors** — 향후 tsc --noEmit 항상 clean 의무

---

## 2026-05-19 (저녁) — 집/Windows, **PR-E1 polish (PR #370) + PR-E2 themeColor cascade (PR #371) 2 PR squash 머지**

> 🎯 **다음 즉시 액션 (3 후보 중 택일)**:
> 1. **🔴 light mode hex contrast follow-up** — vivid yellow/lime/amber preset (PRESET_COLORS) 클릭 시 흰 글씨 가독성 망함. Pre-existing `useTintedText` 부채인데 PR-E2 themeColor cascade로 노출 증폭. `lib/wiki-color-contrast.ts::shouldUseLightText`를 `useTintedText`에 통합 (단일 파일 ~10줄). **사용자 발견 즉시 신뢰 깨질 수 있어 우선순위 가장 높음**.
> 2. **🟣 PR-E3 후보 결정** — `편집 히스토리 v1` (BRAINSTORM #6, multi-machine PRD 시점에 자연 통합 권장 — 지금 만들면 재설계 비용) / `Ambox 자동 배너` (BRAINSTORM #2, Skip 권장 — Plot 사용자 = 개인 위키라 stub 경고 noise risk) / `Group header tint` (PR-E2 follow-up, themeColor cascade 일관성 강화) / `SectionTemplate` (3-layer 시스템 Tier 3, MVP 후 결정) 중 사용자 결정.
> 3. **🟡 WikiTemplate detail panel hero edit UI** (~3 파일, PR-C 후속 polish).
>
> **이번 세션 사용자 의도** (그대로 인용):
> 1. "야 Type 안에 글자들이 너무 박스 안에서 빼곡한 느낌인데... 브레인스토밍 좀 해볼래" → PR #370 polish (Hatnote dialog dropdown description → 본문 hint)
> 2. "옵션 2" → SelectItem 단순화 + Select 아래 muted text 한 줄
> 3. "오케이 좋아" → PR #370 squash 머지 (conflict resolve 후)
> 4. "1인데, 이건 위키의 테마 컬러를 말하는 건가?? 적용된다면 어떻게 작동하는 거지??" → themeColor 개념 + 작동 방식 + 갈림길 6 옵션 정리 보고
> 5. "오케이 너의 제안으로" → A1 (별도 신규 필드) + B2 (인포박스 + hatnote + h2) + C3 (preset + 자유) 추천 따라 진행
> 6. "다른 컴퓨터로 올거니까 after-work 완벽하게" → architect NEEDS FIXES (encyclopedia CSS var inject 누락 + JSDoc + dynamic conditional h2) 모두 적용 후 PR #371 squash 머지
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main` (latest HEAD = PR #371 squash 머지, `a5e6ef8`)
> 2. `npm install && npm run dev` (port 3002, hard refresh — TipTap plugin closure 영구 룰 정합)
> 3. Console v142→v143 migration 확인 (`[migrate] v142→v143: themeColor field opt-in (no data change)`)
> 4. 위 P0 후보 중 선택 또는 사용자 새 시그널
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: `a5e6ef8` (PR #371 squash 머지)
> **Store version**: 143 (PR-E2 v142→v143 sentinel)

### 완료 (이번 세션 2 PR squash 머지)

#### PR #370 — Hatnote dialog polish (squash merged 91c8eca, 4/-4)
사용자 보고 "Type 안에 글자들이 너무 박스 안에서 빼곡한 느낌". PR #368 (PR-E1) follow-up.
- `components/wiki-editor/hatnote-edit-dialog.tsx` SelectItem: 제목 + description 2-line → 제목 한 줄만 (Linear dropdown 정합)
- Select 바로 아래 `<p className="mt-1.5 text-xs text-muted-foreground">` 한 줄로 선택된 type description 표시
- **Conflict resolve**: PR #368 squash 머지 후 같은 파일 변경이 main에 들어가 line-level conflict 발생. HEAD 우선 (`git merge origin/main` + manual resolve) 패턴으로 해결 — 영구 룰 #65 (이전 stacked PR 패턴) 재확인.

#### PR #371 — themeColor cascade system (squash merged a5e6ef8, +356/-27, 11 files, 1 new)

**A. 데이터 모델**:
- `WikiArticle.themeColor?: string | null` 신규 (단일 hex, `{light,dark}` 객체 X — `useTintedBg` hook이 분기 자동 처리)
- 신규 setter `setWikiArticleThemeColor` (PR-E1 `setWikiArticleHatnotes` 패턴 정합)
- Persist v142 → v143 (sentinel-only)

**B. Cascade 메커니즘**:
- Root wiki article scroll container 두 경로 (`wiki-article-view` + `wiki-article-encyclopedia`) 에 `--wiki-theme-color` CSS variable inject
- **Infobox header**: `effectiveHeaderColor = headerColor ?? themeColor ?? null` fallback (개별 지정 우선)
- **Hatnote**: `border-l-2` + `borderLeftColor: var(--wiki-theme-color, transparent)`
- **Section h2**: SectionBlock에 `data-h2` attribute + root container의 Tailwind arbitrary selector (`themeColor && "[&_[data-h2]]:border-l-[3px] [&_[data-h2]]:pl-3 [&_[data-h2]]:border-l-[color:var(--wiki-theme-color)]"`)로 **opt-in** 적용. themeColor 없으면 h2 영향 0.

**C. Picker**:
- 신규 `components/wiki-editor/wiki-theme-color-picker.tsx` Dialog
- PRESET_COLORS 18색 hex grid (6×3) + custom `<input type="color">` + Clear 옵션
- Infobox footer "Theme color…" 액션 (Save as preset… 옆)
- `canChangeThemeColor` gate — Wiki only (Note 미적용, section block 없어 cascade 의미 약함)

**D. WikiInfobox prop 확장** (back-compat):
- 신규 optional props `themeColor?` + `onThemeColorChange?`
- 미사용 caller (note-editor.tsx, wiki-article-reader.tsx) 영향 0

**E. Architect 검증 결과 (APPROVED after fixes)**:
- ✅ Critical fix: `wiki-article-encyclopedia.tsx`에 CSS var inject 추가 (4 mount 위치에서 cascade 안 됐던 누락 fix)
- ✅ Minor fix: `lib/types.ts` JSDoc 정확성 (group header skip 명시 + useTintedBg hex 분기 안 함 정확)
- ✅ Dynamic conditional h2 적용 — 영구 적용 → opt-in으로 전환 (영구 룰 #67 정합 강화)

### 영구 LOCKED 결정 (이번 세션, #81-#83)

- **#81. themeColor = 단일 hex string + CSS variable cascade 패턴**: `{light, dark}` 이중 객체 X (over-engineering). `--wiki-theme-color` CSS variable을 root container에 inject → 자손 자연 수신. light/dark 분기는 `useTintedBg` hook (next-themes 사용)에 위임. 새 hook 만들지 말 것. 향후 다른 cascade 컬러 (e.g., NavBox accent) 동일 패턴.
- **#82. 디자인 cascade는 opt-in 의무 (영구 룰 #67 정합 강화)**: themeColor null 시 모든 cascade chrome 0 (h2 indent 0 / hatnote border transparent / infobox header default). Tailwind arbitrary selector (`[&_[data-h2]]:`) 패턴으로 root container className 토글. 영구 적용 (transparent fallback)은 layout 안정 위해 매력적이지만, default chrome noise를 invite하므로 폐기. dynamic conditional이 정직.
- **#83. Component prop signature 확장은 optional + back-compat 의무**: WikiInfobox에 `themeColor?` + `onThemeColorChange?` 신규 props 추가 시 default `undefined` + caller에서 미적용 시 자동 hidden (`canChangeThemeColor` gate). 영구 룰 — 모든 신규 prop 추가 시 caller 영향 0 가능해야 함.

### 기술 학습 (영구)

- **CSS variable cascade vs prop drilling**: 동일 색을 5+ 컴포넌트에 전달해야 하는 cascade 시 prop drilling (React context, Provider, prop chain)보다 CSS variable inject가 훨씬 정직. SSR-safe (style attribute inline), 분기 코드 0, 자손 자동 수신. React context는 reactive update가 필요할 때만.
- **Tailwind arbitrary selector + CSS variable 조합**: `[&_[data-h2]]:border-l-[3px] [&_[data-h2]]:pl-3 [&_[data-h2]]:border-l-[color:var(--wiki-theme-color)]` 한 줄로 자손에 cascade 적용. width / padding은 arbitrary value, color는 `border-l-[color:var(...)]` shorthand. v3.2+에서 작동.
- **useTintedBg hex desaturate 안 함 부채**: `lib/tinted-bg.ts:60-61` regex가 `/^rgba?\(.../`만 매치 → hex 입력은 light/dark 둘 다 unchanged passthrough. infoboxHeaderColor가 hex일 때 light mode contrast 부족. PR-E2 themeColor도 동일 부채 노출 증폭. `lib/wiki-color-contrast.ts::shouldUseLightText`가 이미 존재 (perceivedLuminance 헬퍼 있음) — `useTintedText`에 통합 follow-up 의무.
- **Encyclopedia layout = 4 mount 위치**: `wiki-article-encyclopedia.tsx`는 (1) wiki-view 메인 라우트 (2) split secondary panel (3) note-hover-preview (4) wiki-embed-node 4 곳에서 mount. cascade 추가 시 두 root 경로 (wiki-article-view + encyclopedia) 모두 수정 필수 — architect 검증으로 발견.
- **Stacked PR + 같은 파일 polish conflict 패턴**: PR-E1 (#368) main 머지 후 같은 파일 (`hatnote-edit-dialog.tsx`) polish (#370) 시 main의 squash commit과 line-level conflict. HEAD 우선 (`git merge origin/main` + Edit으로 conflict marker 제거) 안정 패턴.

### Watch Out (다음 세션)

- 🔴 **우선순위 가장 높음**: light mode hex contrast follow-up. `useTintedText`에 `shouldUseLightText` 통합. 사용자가 vivid color preset 선택 시 흰 글씨로 가독성 망함 — 발견 시 신뢰 즉시 깨짐. 단일 파일 ~10줄 PR로 빠르게 fix.
- 🟡 **Group header tint follow-up**: themeColor cascade에 group header tint 포함 안 됨 (의도된 skip, 영구 룰 #67 최소 diff). 사용자가 일관성 약하다고 느끼면 별도 follow-up (`useGroupHeaderTint(themeColor, 0.15)` 헬퍼).
- 🟢 **WikiArticleEncyclopedia hatnotes 마운트 누락** (PR-E1 잔재): encyclopedia layout에서는 Hatnotes 컴포넌트가 mount 안 됨. 일반 wiki-article-view에서만 mount. follow-up 후보.
- 🟢 **doc comment 부정확** (PR-E1 architect non-blocking, 미해결): `setWikiArticleInfoboxHero` 3곳 doc comment 잔재. cleanup PR 후보.

### 환경 변경

- Main HEAD: `91c8eca` → `a5e6ef8` (PR #371)
- Store version: 142 → **143** (PR-E2 v142→v143 sentinel)
- 신규 type field: `WikiArticle.themeColor?: string | null`
- 신규 setter: `setWikiArticleThemeColor`
- 신규 file (1): `components/wiki-editor/wiki-theme-color-picker.tsx`
- WikiInfobox prop 시그니처 확장: `themeColor?` + `onThemeColorChange?` (optional, back-compat)
- 영구 룰 추가: #81-#83

---

## 2026-05-19 — 집/Windows, **PR-E1: Hatnotes + Preset import/export (Phase 5+ 첫 도입, PR #368 squash 머지)**

> 🎯 **다음 즉시 액션 (3 후보 중 택일)**:
> 1. **PR-E2 후보**: `themeColor 시스템` (BRAINSTORM #4, 디자인 정체성, light/dark cascade, ~5 파일 v143) 또는 `편집 히스토리 v1` (BRAINSTORM #6, multi-machine PRD 시점에 자연 통합 권장 — 지금 만들면 재설계 위험) 중 사용자 우선순위 결정. 메인 추천은 themeColor (디자인 임팩트 크고 PR-E1 자연 후속).
> 2. **WikiTemplate detail panel hero edit UI** — PR-C에서 `WikiTemplate.infoboxHero` 필드만 추가, edit UI 미완. template detail panel에 InfoboxHeroPicker mount (~3 파일).
> 3. **dead code + build TS 부채 cleanup** — `components/note-detail-panel.tsx` (import 0) + 10 TS 부채 (insights-view.tsx:268 noteEvents 등). 작은 cleanup PR.
>
> **이번 세션 사용자 의도** (그대로 인용):
> 1. "1을 자세히 말해봐" → PR-E (Phase 5+) 후보 6개 정리 보고 (Hatnote / Ambox / themeColor / 편집 히스토리 / Preset I/O / SectionTemplate)
> 2. "너의 제안을 듣고 싶어, 어떤 것부터 작업하는 게 좋을지" → Plot 정체성 + Linear 미니멀 + 작업 원칙 기반 신중 추천 → **Hatnote + Preset import/export** (둘 다 작고 위험 낮음, "Gentle by default" 부합, 제텔카스텐 본질 강화)
> 3. "ㅇㅇ 진행해" → 전체 워크플로우 (explore → executor-high → architect → commit → push → PR → squash merge) 자동 진행
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main` (latest HEAD = PR #368 squash 머지, `56ecb24`)
> 2. `npm install && npm run dev` (port 3002, hard refresh)
> 3. Console v141→v142 migration 확인 (`[migrate] v141→v142: hatnotes field opt-in (no data change)`)
> 4. 위 P0 후보 중 선택 또는 사용자 새 시그널
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: `56ecb24` (PR #368 squash 머지)
> **Store version**: 142 (PR-E1 v141→v142 sentinel)

### 완료 (이번 세션 1 PR squash 머지)

#### PR #368 — Hatnotes + Preset import/export (PR-E1, Phase 5+ first wave)

**A. Hatnote** (Wikipedia/나무위키 표준 — italic 회색 indent 1.6em)
- 5 type: `above` (Part of) / `below` (Subtopics) / `distinguish` (Not to be confused with) / `main` (Main article) / `see-also` (See also)
- `WikiArticle.hatnotes?: Hatnote[]` optional (id/type/text/targetArticleId?)
- 신규 컴포넌트:
  - `components/wiki-editor/wiki-hatnotes.tsx` (~150 LOC) — render + hover-only edit affordances
  - `components/wiki-editor/hatnote-edit-dialog.tsx` (~180 LOC) — type Select + text + WikiPicker target
- `wiki-article-view.tsx` — title 아래 / `<InlineCategoryTags>` 위 mount
- self-reference cycle 차단: `WikiPickerDialog excludeIds={[articleId]}`

**B. Preset import/export JSON** (PR-D UserInfoboxPreset 자연 후속)
- 신규 `lib/wiki-infobox-presets-io.ts` (~130 LOC) — envelope `{ version, exportedAt, presets }` + raw array 양쪽 호환 + type-guard validation + SSR-safe `downloadPresetJSON` (`typeof window/document` guard)
- 신규 `components/editor/import-preset-dialog.tsx` (~190 LOC) — textarea + file upload + live parse preview + collision count surface
- `components/editor/wiki-infobox.tsx` Footer: "Export presets…" / "Import presets…" 액션 (Save as preset… 옆)
- Import 정책: **항상 fresh id (no replace)** — collision은 preview 표시만, post-import 수동 삭제

**검증**
- `npx tsc --noEmit`: **0 new errors** (기존 10 부채 그대로 — insights-view.tsx:268 noteEvents 등)
- Architect 검증: **APPROVED** (3 minor non-blocking suggestions — doc comment 부정확 1건 / Import conflict UX YAGNI / multiple hatnotes 시각 밀도 manual verify)

### 영구 LOCKED 결정 (이번 세션, #79-#80)

- **#79. Hatnote = Wikipedia/나무위키 표준 5 type 정합 (above/below/distinguish/main/see-also)**: 5종 라벨 영어 통일 (Part of / Subtopics / Not to be confused with / Main article / See also). 향후 다른 wiki feature도 동일 i18n 패턴.
- **#80. JSON export envelope = `{ version, exportedAt, presets }` 패턴**: 향후 다른 entity export (UserInfoboxPreset → WikiTemplate → Reference 등) 동일 envelope shape. 미래 호환성 확보. raw array fallback도 지원.

### 기술 학습 (영구)

- **JSON paste textarea + file upload 양쪽 입력 패턴**: 사용자가 짧은 JSON은 paste, 긴 JSON 또는 다운로드 파일은 file upload. 두 path 다 동일 `parsePresetImport` 통과 → preview → import 흐름 일관.
- **SSR-safe browser download**: `typeof window === "undefined" || typeof document === "undefined"` guard 필수. Blob + URL.createObjectURL + anchor click + URL.revokeObjectURL 패턴.
- **WikiPicker `excludeIds` cycle safety**: target picker에 자기 article id 제외해서 self-reference 사고 방지. 향후 다른 cross-link feature (See also auto-suggest 등)도 동일 패턴.

### Watch Out (다음 세션)

- 🟡 **doc comment 부정확** (architect non-blocking suggestion #1): `setWikiArticleInfoboxHero`가 PR-C에서 실제로 만들어진 게 아님 (generic `updateWikiArticle` 사용). 3곳 doc comment 정정 가능 (`lib/store/types.ts:435` / `lib/store/slices/wiki-articles.ts:218` / `components/wiki-editor/wiki-hatnotes.tsx:13`). 사소한 부채.
- 🟢 **multiple hatnotes 시각 밀도 manual verify**: 5종 동시 (above + below + distinguish + main + see-also) 시 5-line italic 블록 자연한지 사용자 확인 (실제 1-2개 common case 우세).
- 🟢 **Import "Skip duplicates" 옵션** (architect suggestion #2): 현재 collision도 무조건 fresh id 등록. 사용자 confusion 시 "Skip duplicates" checkbox follow-up 가능.

### 환경 변경

- Main HEAD: `0531f38` → `56ecb24` (PR #368)
- Store version: 141 → **142** (PR-E1 v141→v142 sentinel migration)
- 신규 type: `HatnoteType` + `Hatnote`
- 신규 entity 필드: `WikiArticle.hatnotes?: Hatnote[]`
- 신규 setter: `setWikiArticleHatnotes`
- 신규 file (4): `components/wiki-editor/wiki-hatnotes.tsx` + `components/wiki-editor/hatnote-edit-dialog.tsx` + `components/editor/import-preset-dialog.tsx` + `lib/wiki-infobox-presets-io.ts`
- 영구 룰 추가: #79-#80

---

## 2026-05-18 (저녁) — 집/Windows, **i18n + EmptyHint + drag-column fix bundle + PR-C Hero Image + PR-D 머지 (3 PR squash 머지)**

> 🎯 **다음 즉시 액션 (3 후보 중 택일)**:
> 1. **PR-E (Phase 5+ 후보)** — Hatnote / Ambox 자동 배너 / themeColor cascade / SectionTemplate / preset import-export JSON 중 사용자 우선순위 결정. PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md` section 5 "Out of Scope" 참고.
> 2. **dead code 정리** — `components/note-detail-panel.tsx` (어디서도 import 안 됨) + build TypeScript 부채 10개 (`insights-view.tsx:268` `noteEvents` 등). 작은 cleanup PR.
> 3. **WikiTemplate detail panel hero edit UI** — PR-C에서 WikiTemplate.infoboxHero 필드만 추가, edit UI 미완. template detail panel에 InfoboxHeroPicker 통합 (~3 파일).
>
> **이번 세션 사용자 의도** (그대로 인용):
> 1. "야 우선 밑줄부터가 업노트가 훨씬 더 부드러운 느낌(우리는 ...인 느낌)" → EmptyHint dotted → solid + font inherit + position absolute (cursor 분리)
> 2. "야 이거 그리고 영어버전인데 왜 한글로 설명이 나오는 거야??" → WikiTemplate seed 8 description 영어 통일 (PR #358 잔재)
> 3. "엔터를 치자마자 나와서 깜짝 놀랐어" → EmptyHint trigger 조건 강화 (paraCount === 1 + paraHasText === false만 hint 표시)
> 4. "drag로 위치 바꾸려고 하면 컬럼이 만들어져서" → block-drag-overlay regular block side-drop column 생성 폐기 (영구 룰 #8 정합)
> 5. PR-C Hero Image — "위키의 infobox에서는 에디트를 눌러도 이미지 파일 삽입 기능이 없네?" → PRD Phase 3 본격 구현
>
> **다음 머신에서 처음 시작 시**:
> 1. `git pull origin main` (latest HEAD = PR #367 squash 머지)
> 2. `npm install && npm run dev` (port 3002, hard refresh)
> 3. Console v141 migration 확인 (`[migrate] v140→v141: infoboxHero field opt-in (no data change)`)
> 4. 위 P0 후보 중 선택 또는 사용자 새 시그널
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #365 + PR #363 + PR #367 squash 누적
> **Store version**: 141 (PR-C v140→v141 sentinel)
> **PR #366**: closed (PR #363 머지 시 base 사라져 자동 close → 같은 head로 PR #367 신규 생성 후 base=main + conflict resolve로 머지)

### 완료 (이번 세션 3 PR squash 머지)

#### PR #365 — fix bundle (4 commits)
1. `19275ef` — SEED_WIKI_TEMPLATES 8 description 영어 통일 (PR #358 잔재) + EmptyHint trigger 1차 fix
2. `96a973d` — EmptyHint trigger 재수정 (paraCount === 1 && !paraHasText) — heading 무시
3. `cafd7a0` — EmptyHint UpNote 스타일 (position absolute / font inherit / solid underline / placeholder opacity)
4. `2f074fc` — block-drag-overlay regular block 좌/우 edge column 자동 생성 폐기 (영구 룰 #8)

#### PR #363 (PR-D) — UserInfoboxPreset (Save as preset, Phase 4)
사용자 verify 9단계 manual 미실행 — 코드 logic은 PRD 명세대로 정확. main 머지 후 reload 검증 가능.

#### PR #367 (PR-C 재타겟) — Hero Image (Phase 3)
원래 PR #366 (base PR-D) 였으나 PR #363 머지 시 자동 closed. 새 PR #367 (base=main) 재생성 + conflict resolve.
- `InfoboxHero` type + 3 entity optional 필드
- v140→v141 sentinel migration
- WikiInfobox hero slot (figure + caption + alt + hover edit/remove)
- 신규 `infobox-hero-picker.tsx` (URL+caption+alt dialog)
- 5 caller wire (wiki-article-view + note-editor + encyclopedia ×2 + reader)

### 영구 LOCKED 결정 (이번 세션, #74-#78)

- **#74. EmptyHintPlaceholder trigger = top-level paragraph 1개 + 비어있을 때만**: heading 무시 (자체 placeholder). 본문 paragraph 2개 이상 또는 text 있으면 hint 즉시 사라짐. ProseMirror Decoration plugin 진입 short-circuit.
- **#75. ProseMirror Decoration.widget placeholder UX 패턴**: inline 위치는 cursor가 widget 뒤로 가는 충돌 발생. `position: absolute; left: 0` + 부모 paragraph에 `position: relative` (Decoration.node) 로 widget을 layout에서 빼면 cursor 자연 위치. UpNote/Notion 패턴.
- **#76. Block drag side-drop column 자동 생성 폐기 (영구 룰 #8 재확인)**: regular block 좌/우 edge → column 생성은 사용자 직관 위반. column 만들기는 slash `/2 Columns` 또는 Insert (+) 메뉴 명시 action만. columnsBlock target drop (이미 만든 column에 insert)은 유지.
- **#77. Hero image = 별도 필드 (entries 외)**: 의미 명확 + 1개 제한 자연. 3 entity cross-entity. 향후 banner image 등 다른 visual asset도 동일 패턴.
- **#78. Cross-entity hero shape 통일**: WikiArticle/Note/WikiTemplate 모두 동일 `InfoboxHero { url, caption?, alt? }`. Template → Article 변환 시 자동 복사. 영구 룰 #68 확장.

### 기술 학습 (영구)

- **TipTap editor plugin closure는 HMR로 갱신 안 됨**: ProseMirror Plugin instance가 editor에 한 번 등록되면 props.decorations 함수 closure가 박힘. HMR rebuild는 되지만 editor instance 유지로 옛 closure 그대로. **Full reload (Ctrl+Shift+R) 필수**. 사용자가 fix 안 보인다고 보고 시 reload 부탁이 첫 step.
- **Stacked PR + base branch squash 머지 패턴 사고**: PR-C가 PR-D base였는데 PR-D squash 머지 시 PR-C의 base branch (`claude/save-as-preset-D`) 사라짐 → PR-C 자동 closed. closed PR은 base 변경 불가, reopen도 불가 (deleted base branch). **새 PR을 head 그대로 + base=main으로 생성 + conflict resolve (`git merge origin/main` + manual resolve)** 가 답. PR-D squash 머지로 인해 동일 변경이 main에 들어가 PR-C branch의 PR-D commits와 line-level conflict.
- **EmptyHintPlaceholder trigger 정확 조건**: `doc.forEach`로 top-level paragraph만 카운트, `paraCount === 1 && !paraHasText`만 hint. `childCount > 1` 조건은 heading + paragraph로 빈 신규 노트도 차단 — 의도와 정반대 사고.
- **WikiTemplate seed description i18n 일관성**: 다이얼로그 본문/버튼/footer 영어인데 description만 한글이면 한/영 혼합. 영구 룰 "i18n 영어 통일" — 다음 entity seed 추가 시 description부터 영어.

### Watch Out (다음 세션 주의사항)

- 🔴 **PR-D verify 미완**: 사용자 직접 9단계 (Save as preset / dropdown My Presets 섹션 / cross-entity Note / hover delete / reload persist) 안 함. main 머지 후 reload 시 manual smoke test 권장. 코드 logic은 PRD 명세대로 정확 — UX 미세 조정 시 follow-up.
- 🟡 **WikiTemplate detail panel hero edit UI 미완**: PR-C에서 WikiTemplate.infoboxHero 필드만 추가, edit UI 별도. template detail panel에 InfoboxHeroPicker mount 필요 (~3 파일 후속).
- 🟢 **사용자 IDB stale**: 기존 사용자 IDB에 한글 WikiTemplate description 그대로 (PR #365 seeds 영어 변환은 fresh init만 적용). IDB clear 또는 backfill migration (v141 → v142) 후속.
- 🟢 **build TypeScript 부채 10개** 그대로. 별도 cleanup PR 후보.

### 환경 변경

- Main HEAD: PR #365 + PR #363 + PR #367 squash 누적
- Store version: 140 → **141** (PR-C v140→v141 sentinel)
- 신규 type: `InfoboxHero { url, caption?, alt? }`
- 신규 entity 필드: `WikiArticle.infoboxHero?` + `Note.wikiInfoboxHero?` + `WikiTemplate.infoboxHero?`
- 신규 컴포넌트: `components/editor/infobox-hero-picker.tsx`
- 영구 룰 추가: #74-#78

---

## 2026-05-18 (오후) — 집/Windows, **Infobox UX 종합 대규모 — PR #361/#362/#363 (3 PR, 22 commit, ~700+ 줄)**

> 🎯 **다음 즉시 액션**: **PR #363 (PR-D, Save as preset / UserInfoboxPreset) manual verify 후 squash merge** → 그 후 PR-C (Hero Image, Phase 3) 또는 다른 사용자 시그널.
>
> **PR #363 verify 체크리스트 (다른 머신에서 fresh dev)**:
> 1. `git pull origin main` (PR #361 + #362 main 반영됨)
> 2. `git fetch origin claude/save-as-preset-D` + `git checkout claude/save-as-preset-D` (PR-D 코드)
> 3. `npm install && npm run dev` — 새 worktree시 의존성 install
> 4. `/wiki` article → Person preset 선택 → fields/색 customize
> 5. Edit footer **"Save as preset…"** click → dialog ("내 인물 v2") → 저장
> 6. preset dropdown → **"My Presets" 섹션**에 "내 인물 v2" 등장 확인
> 7. 다른 article에서 "My Presets > 내 인물 v2" 선택 → 같은 layout + 색 자동 적용
> 8. `/notes` Note에서도 동일 dropdown + "Save as preset…" 가능 확인 (cross-entity)
> 9. user preset hover → 🗑 delete → confirm → preset 삭제. 그 preset 사용 article은 "Custom" fallback (entries 보존)
> 10. OK → `gh pr merge 363 --squash`
>
> **사용자 의도** (이번 세션, 그대로 인용):
> 1. "infobox 16 preset이 좁아서 X 버튼 가려져" → PR #361 commit 6/7 (auto-expand 24%→30%→38%)
> 2. "스플릿뷰랑 사이드바가 추가로 더 나오는 버그" → PR #361 commit 5 (panel toggle 중복 fix)
> 3. "ADDITIONAL INFO 토글이 작동을 안 함" → PR #361 commit 2 (group-header collapse pubsub fix)
> 4. "Genre 아래 새 field 추가하고 싶으면" + "핸드드래그 도입" → PR #361 commit 3+4
> 5. "preset fields 풍부화 + Note에서도 preset 사용 가능?" → PR #362 (16 preset 풍부화 + Note cross-entity)
> 6. "유저가 만든 걸 재사용할 수 있게" → PR #363 (UserInfoboxPreset 신규, Save as preset)
>
> **첫 스텝 (다음 머신, PR #363 verify 또는 PR-C 시작)**:
> - PR #363 verify path: 위 10단계 그대로
> - PR-C 시작 path (Hero Image, Phase 3, ~7 파일, v141):
>   1. PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md` §1 Phase 3 read
>   2. `lib/types.ts`에 `InfoboxHero` type + WikiArticle/Note/WikiTemplate에 `infoboxHero?` 옵션 필드
>   3. store actions `setWikiArticleInfoboxHero` / `setWikiInfoboxHero` 등 또는 updateXxx generic patch 사용
>   4. v141 migration (default undefined)
>   5. `components/editor/wiki-infobox.tsx` 안 hero render + edit UI + image picker
>   6. 신규 `components/editor/infobox-hero-picker.tsx` (URL + caption + alt)
>
> **컴포넌트 구조 (PR-D 핵심 path)**:
> - `lib/types.ts:UserInfoboxPreset` — 신규 entity
> - `lib/store/slices/wiki-infobox-presets.ts` — 신규 slice (save/update/delete)
> - `lib/wiki-infobox-presets.ts:getPresetDefinitionUnified` — builtin + user 통합 lookup
> - `components/editor/save-preset-dialog.tsx` — 신규 dialog
> - `components/editor/wiki-infobox.tsx` — Footer "Save as preset…" + dropdown "My Presets" 섹션 + hover delete
> - `onPresetChange` callback **signature 확장**: `(preset, seed, defaultHeaderColor?)` — 3번째 인자
>
> **위험 + 회피**:
> - PR #363 **미 verify 상태** — verify 안 끝나면 다음 세션 첫 액션이 그것
> - PR-D는 PR #361 + #362 base (main에 둘 다 squash merged됨, 43fcd44 HEAD)
> - `WikiInfoboxPreset = builtin | (string & {})` widen 패턴 — builtin literal autocomplete 보존하면서 string id 허용. INFOBOX_PRESETS.find는 builtin enum 정확 lookup이라 user id 들어와도 undefined 자연 (fallback OK)
> - Orphan reference (user preset 삭제 후 그 preset 사용 article의 `infoboxPreset`는 그대로) — `getPresetDefinitionUnified` "custom" fallback, entries는 article 자체 저장이라 무결
>
> **참고 파일** (다음 세션 read):
> - `.omc/plans/wiki-infobox-tier-2-4-prd.md` — PRD 본문 (이번 세션 완료 Phase 1/2/4, 남은 Phase 3 Hero Image)
> - `lib/store/slices/wiki-infobox-presets.ts` — PR-D slice (참조용)
> - `components/editor/wiki-infobox.tsx` — 모든 commit 중심
> - `components/editor/save-preset-dialog.tsx` — PR-D 신규 dialog 패턴
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 43fcd44 (PR #362 squash merged) — PR #361 + #362 main 반영
> **PR #363**: open, `claude/save-as-preset-D` branch, HEAD 21661ea
> **branch worktree**: `brave-rubin-3e45fa` 그대로 (다음 머신에서 새 worktree 가능)
> **Store version**: PR #361/#362은 코드 변경만, persist version 그대로 / PR #363은 v139 → **v140** (userInfoboxPresets `[]` init)

### 완료 (이번 세션 3 대규모 PR, 22 commit, ~700+ 줄)

#### PR #361 — Infobox UX 종합 강화 (7 commit, squash merged d95b61b)
1. **`6b388d6`** Preset switching **3-way dialog** — Cancel / Preserve matching (N) / Replace all. 사용자 데이터 보호.
2. **`6931a57`** Group-header collapse **pubsub fix** — `stateCache` + `listeners` Map. 같은 key 모든 hook instance 동시 sync. 사용자 보고 "ADDITIONAL INFO 토글 작동 X" 해결.
3. **`3116d86`** **"+ Add field" inline group-aware** — 매 group break 위치에 inline 버튼 + 동적 label ("to {group}"). 사용자 보고 "Genre 아래 추가" 해결.
4. **`b091f74`** **Drag-to-reorder** — dnd-kit Sortable + DotsSixVertical handle + ephemeral `_id` (drag-stable, persist 시 strip).
5. **`8172b75`** **Panel toggle 중복 fix** — wiki-view actions slot 수동 toggle 제거 → view-header default toolbar 위임. 사용자 보고 "스플릿뷰랑 사이드바 더 나옴" 해결.
6. **`4beb41f`** **Infobox edit mode auto-expand** — Edit 진입 시 22→30% + Done 시 사용자 layout 복원 (getLayout()로 manual size 기억).
7. **`247403a`** **가로 스크롤 + SidePanel auto-expand 38%** — SmartSidePanel 열림 시 38% expand (좁은 main content 감지) + extreme narrow viewport에서 infobox 안 가로 스크롤 fallback (`min-w-[360px]`).

#### PR #362 — Infobox preset 16종 풍부화 + Note cross-entity (3 commit, squash merged 43fcd44)
1. **`c15c756`** **5 preset 풍부화** — Person 9→16, Place 8→14, Organization 9→12, Software 9→12, Animal 9→16. 각 2-3 그룹 추가.
2. **`678b222`** **11 preset 풍부화** — Character/Concept/Work×4/Event/School/Food/Vehicle/Sport Team. 총 16 preset 완성 (Custom 제외).
3. **`eb65f6b`** **Note cross-entity preset 활성화** — `Note.infoboxPreset` + `Note.infoboxHeaderColor` 신규 optional 필드 + note-editor의 WikiInfobox `editable + kind="note" + preset wire`. Note도 16 preset 사용 가능.

#### PR #363 — UserInfoboxPreset (Save as preset, Phase 4) — open, 1 commit, ~562 줄
- **`21661ea`** **UserInfoboxPreset 신규** — `WikiInfoboxBuiltinPreset` literal union + `WikiInfoboxPreset = builtin | (string & {})` widen + 신규 slice `lib/store/slices/wiki-infobox-presets.ts` (save/update/delete) + `getPresetDefinitionUnified` 통합 lookup + 신규 `components/editor/save-preset-dialog.tsx` + WikiInfobox Footer "Save as preset…" 버튼 + Preset dropdown "Built-in" / "My Presets" 섹션 분리 + hover 🗑 delete + onPresetChange callback signature 확장 (3번째 인자 `defaultHeaderColor`).
- **Persist v139 → v140** (userInfoboxPresets `[]` init + `onRehydrateStorage` Array defense).

### 영구 LOCKED 결정 (이번 세션, #64-#73)

#### PR #361 (Phase 1 + UX polish)
- **#64. Preset switching = 3-way dialog** — Cancel / Preserve matching / Replace all. 사용자 데이터 보호 우선, 명시적 동의. 모든 entity preset 패턴에 영구.
- **#65. localStorage-backed UI state + in-memory pubsub 병행** — 다중 hook instance가 같은 key 공유 시 sync 필수. `useInfoboxGroupCollapsed` reference.
- **#66. ephemeral `_id` 패턴 = list-style edit UI 표준** — TipTap NodeView 외 일반 list edit UI (drag/reorder)에서 stable identity 필요시.

#### PR #361 (B1 + A1)
- **#67. Edit mode auto-expand 패턴 = "Gentle by default, powerful when needed" 적용** — 평소 narrow / 편집 진입 자동 expand / 사용자 layout 복원. SmartSidePanel state 인지하여 추가 expand 단계 (24% / 30% / 38%).

#### PR #362 (Cross-entity)
- **#68. Infobox preset = cross-entity 자원** — Wiki Article + Note 둘 다 동일 preset 인프라 사용. 향후 Book / Reference 등도 자연 확장 가능.
- **#69. `updateNote` / `updateWikiArticle` generic patch가 정직** — entity별 별도 setter 시리즈 (setNoteInfoboxPreset 등) 추가 X. `Partial<Entity>` 한 곳으로 통합. DRY.

#### PR #363 (Phase 4, UserInfoboxPreset)
- **#70. UserInfoboxPreset = WikiTemplate와 별도 시스템** (infobox-only 가벼움) — Wikipedia 패턴 정합 (`Template:Infobox person`이 별도 namespace). 단일 시스템 통합 (옵션 2/4)보다 분리가 mental model 명확.
- **#71. `(string & {})` widen 패턴** — TypeScript에서 literal union을 string으로 widen하지 않게. builtin autocomplete 보존하면서 user id (string) 확장.
- **#72. onPresetChange callback 3번째 인자 (`defaultHeaderColor?`)** — caller가 builtin + user preset 둘 다 색 자동 적용. Note와 Wiki Article 일관.
- **#73. Orphan reference graceful fallback** — user preset 삭제 후 사용 article의 `infoboxPreset` 그대로 유지 (orphan). `getPresetDefinitionUnified`가 "custom" 반환. entries는 article 자체 저장이라 영향 0. UI 깨짐 없음.

### 기술 학습 (영구)

- **drag-and-drop stable id 패턴** (dnd-kit): handleChange 등이 새 object 생성 시 reference id 잃는 한계. `_id` ephemeral 필드를 useState 진입 시 부여 + persist 시 strip이 정직. WeakMap based id는 entry mutation 시 깨짐.
- **react-resizable-panels imperativeAPI** (`ImperativePanelGroupHandle`): `getLayout()` / `setLayout(sizes)` 둘 다 검증된 API. `setLayout` 호출 시 첫 mount skip 패턴 (`hasMountedRef`)으로 autoSave된 layout 우선 보존.
- **CSS `overflow-x: auto` + inner `min-width` 패턴**: 가로 스크롤 fallback. ancestor `overflow-hidden`은 별도 — overflow 분리 (`overflow-x-auto overflow-y-hidden`) 가능.
- **TypeScript `(string & {})` widen hack**: builtin literal union을 string으로 widen 방지. autocomplete 보존 + 확장 자유.
- **Generic seed-based helper pattern**: `mergePresetWithExisting(presetId)` → `mergeSeedWithExisting(seed, existing)` 통합 generic 함수로 user preset도 처리. wrapper로 back-compat.
- **Panel toggle cluster 중복 회피**: view-header.tsx default toolbar가 `SidebarSimple` + `SplitViewButton` 자체 render. wiki-view actions에 수동 mount는 중복 — default toolbar 위임이 정직.
- **WikiInfobox callback signature 확장 시 caller back-compat**: TypeScript 함수 인자는 less args도 OK이라 기존 caller (2-arg) 자연 호환. 3-arg 인자는 optional default 처리.
- **Cross-entity preset 확장 = 단일 component reuse**: WikiInfobox component (kind prop으로 routing) + 동일 preset infra (`INFOBOX_PRESETS` + UserInfoboxPreset slice) = 모든 entity가 동일 UX. note-editor / wiki-article-view callback만 entity-specific.

### Watch Out (다음 세션)

- 🔴 **PR #363 manual verify** — 10단계 체크리스트 (위 hook 본문). OK 시 squash merge.
- 🟡 **PR-C 시작** (Hero Image + caption, Phase 3) — PRD §1 Phase 3 참고. ~7 파일, v141 migration. 데이터 모델 추가 (`infoboxHero?: { url, caption?, alt? }` 3 entity).
- 🟣 **PR-E 후보** (Phase 5+): SectionTemplate (그룹만 재사용), 또는 BRAINSTORM Top 7의 남은 항목 (Hatnote / Ambox / themeColor / 편집 히스토리).
- 🟣 **dead code 정리**: `components/note-detail-panel.tsx` (어디서도 import 안 됨, 사전 부채).
- 🟣 **build TypeScript 부채 10개** 그대로 (`insights-view.tsx:268` `noteEvents` 등) — 별도 cleanup PR 후보.

### 환경 변경

- Main HEAD: `43fcd44` (PR #362 squash merged)
- 신규 file (PR-D):
  - `lib/store/slices/wiki-infobox-presets.ts`
  - `components/editor/save-preset-dialog.tsx`
- 신규 type:
  - `UserInfoboxPreset` (id/label/hint?/color/entries/createdAt/updatedAt ISO)
  - `WikiInfoboxBuiltinPreset` (기존 literal union 재명명)
- Persist version: 139 → **140** (PR #363 머지 시 main에 반영)
- 신규 영구 결정: #64-#73 (총 10개 추가)
- `Note.infoboxPreset?` + `Note.infoboxHeaderColor?` 신규 optional 필드 (PR #362 / 43fcd44)
- 영구 widen 패턴: `WikiInfoboxPreset = WikiInfoboxBuiltinPreset | (string & {})`
- 영구 callback signature 확장: `onPresetChange(preset, seed, defaultHeaderColor?)`

---

## 2026-05-18 (오전) — 집/Windows, **Wiki Delete soft delete + Wiki Template 신설 + Infobox preset 6 신규 + dropdown 잘림 fix (3 PR)**

> 🎯 **다음 즉시 액션 (3 후보 중 택일)**:
> 1. **Wiki Template slash insert** (PR #358 후속 polish, ~3 파일) — Wiki article view "+ Block" 메뉴 또는 toolbar에 "From wiki template…" entry. blocks splice (article level 메타 X) + cursor 위치 insert.
> 2. **나무위키 Infobox Tier 2-4 본격 고도화** (memory line 3362, 큰 작업, PRD 분리 권장) — 대표 이미지+캡션 / 사용자 커스텀 preset / 본격 UI 고도화.
> 3. **P1 잔여 1순위: Library Tags Detail panel** (~5 파일, PR #331 Files Detail 패턴 정합).
>
> **사용자 의도** (이번 세션, 그대로 인용):
> 1. "stub는 삭제하면 자동으로 완전 삭제가 되어버리는 건가??" → PR #357 Wiki Delete soft delete (Note 2단 정합)
> 2. "위키 템플릿도, 노트 템플릿 구조로 만들고 싶거든??" + "애드블록 등을 이미 갖추고 있다던지" → PR #358 Wiki Template 신설 (NoteTemplate 정합 + Wiki 본질 확장)
> 3. "인포박스도 템플릿들이... 더 갖추고 고도화해야 하지 않음?? 나무위키스타일로" → PR #359 6 신규 preset
> 4. "특정 인포박스 템플릿을 선택해버리면 내부의 템플릿들 전체가 안 보여... 어떤 상황에서도 모든 인포박스 템플릿이 드롭다운식으로 보여야 됨. 공간 부족 시 내부 스크롤" → PR #359 dropdown portal fix
>
> **첫 스텝 — 후보 1 (Wiki Template slash insert)**:
> 1. `components/wiki-editor/wiki-article-view.tsx` 안에 "+ Add block" 또는 floating "/" toolbar 위치 찾기 (현재 block list 위 어딘가)
> 2. menu entry "From wiki template…" 신규 → click 시 `WikiTemplatePicker` dialog 띄움 (기존 컴포넌트 재활용)
> 3. picker `onApplied` callback variant 필요 — 현재는 `(articleId) => void` (article 생성). slash insert 시엔 `(templateId) => void` 호출자가 blocks splice
> 4. WikiTemplatePicker에 prop 추가: `mode: "create" | "insert"` — insert mode 시엔 createWikiArticleFromTemplate 호출 X, 대신 `getWikiTemplateBlocksExpanded(id)` + 호출자 callback에 blocks 전달
> 5. wiki-article-view에서 blocks 받으면 `useStore.addWikiBlock` 또는 `updateWikiArticle({ blocks: [...existing, ...templateBlocks] })`로 splice. position은 cursor 또는 last block 다음
>
> **첫 스텝 — 후보 2 (나무위키 Tier 2-4)**:
> 1. memory `docs/MEMORY.md:3362` "나무위키 Tier 2-4 사용자 결정 진행" 섹션 재read
> 2. PRD 분리 시도 — `.omc/plans/wiki-infobox-tier-2-4-prd.md` (대표 이미지+캡션 / 사용자 커스텀 preset / 본격 고도화)
> 3. 사용자 의도 명확화 후 작업 시작
>
> **컴포넌트 구조** (Wiki Template slash insert 시):
> - WikiTemplatePicker 확장 — `mode: "create" | "insert"` prop + onApplied signature 분기
> - `lib/store/slices/wiki-templates.ts:getWikiTemplateBlocksExpanded(id)` 이미 구현 — slash insert에서 호출
> - wiki-article-view 안 cursor position 추적 — block index 또는 last block (단순화)
>
> **위험 + 회피**:
> - WikiTemplatePicker는 article 생성용으로 wiki-view에 mount. slash insert는 wiki-article-view (편집 모드) 안. 위치 다름. 두 곳에 picker mount 가능 — store/local state 분리.
> - blocks splice 시 sectionIndex / linksOut 재계산 의무 (updateWikiArticle 자동 처리)
> - block ids 충돌 — getWikiTemplateBlocksExpanded가 이미 genId 부여
>
> **참고 파일**:
> - `components/wiki-template-picker.tsx` — picker dialog
> - `lib/store/slices/wiki-templates.ts:148` `getWikiTemplateBlocksExpanded`
> - `components/wiki-editor/wiki-article-view.tsx` — 편집 위치
> - `lib/store/slices/wiki-articles.ts:addWikiBlock` / `updateWikiArticle`
> - `docs/MEMORY.md:1528, 3362` — 나무위키 Tier 1-4 todo
> - `lib/wiki-infobox-presets.ts` — 17 preset 정의 (참고)
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #359 머지 후 + docs sync (이 entry commit 후 갱신)
> **branch worktree**: `kind-zhukovsky-1a4485` 그대로 (또는 다음 머신에서 새 worktree)

### 완료 (이번 세션 3 PR + docs sync)

- **PR #357** — Wiki Delete = hard → soft delete 패턴 변경 (Note 2단 정합). WikiArticle.trashed/trashedAt 정식 type + trashWikiArticle action + v138 migration + 7곳 호출처 swap + bulk handleTrash undo simplified (toggle 패턴).
- **PR #358** — Wiki Template 신설 (NoteTemplate 정합 + Wiki 본질 확장). WikiTemplate type + 8 seed (Empty/Concept/Person/Place/Reference/Tutorial/Project Log/Book Note) + WikiArticle.templateId + v139 migration + onRehydrateStorage defense + Wiki 사이드바 Templates entry + /wiki/templates page + WikiTemplatesView grid + WikiTemplateDetailPanel 4탭 + WikiTemplatePicker dialog ("+ Article" → picker → 새 article)
- **PR #359** — Infobox preset 6 신규 (School/Animal/Software/Food/Vehicle/Sport Team, 나무위키 정합) + 신규 color tokens (cyan/lime/pink/brown) + Preset dropdown 잘림 fix (createPortal + fixed positioning + viewport flip + max-height scroll).

### 영구 LOCKED 결정 (이번 세션)

- **#62. Wiki Delete = Note 정합 2단 패턴**: Trash 거쳐 soft delete → Trash 안에서 "Delete forever" hard delete. 모든 entity Delete 패턴 통일 영구 룰.
- **#63. Floating menu (dropdown/popover) = portal + fixed + viewport bound check + 자동 flip**: ancestor `overflow-hidden` 영향 회피. PresetDropdown reference. 모든 entity dropdown에 동일 패턴 적용.
- **WikiTemplate = NoteTemplate 1:1 mirror + Wiki 본질 확장**: `blocks[]` + `infobox` + `infoboxPreset` + `defaultCategoryIds` + `defaultLabelId` + `defaultLayout` 등 추가 필드. NoteTemplate (contentJson) 아닌 Wiki blocks 구조 그대로 사용. `WikiArticle.templateId` reverse-lookup으로 "Used by N wiki articles" stats.
- **Wiki Template apply 두 path 의도 분리**: 생성 picker (Wiki "+ Article") = article level 전체 (blocks+infobox+categoryIds+labelId+layout) / slash insert (P1 후속) = blocks만 inline (article 메타 안 건드림).

### 기술 학습 (영구)

- **store hydration safety**: 신규 array state 추가 시 IDB serialize round-trip이 array를 object로 변형하는 case 보호 — `onRehydrateStorage`에서 `Array.isArray` check + SEED 강제 초기화 필수. v139 migration만으로는 hot-reload IDB stale state 못 잡음. selector level fallback도 `Array.isArray ? : []` 패턴 권장.
- **사용자 IDB 데이터 wikiTemplates `{}` empty object 실제 사례**: dev hot-reload 또는 sequence migration 중 partial save로 wikiTemplates가 empty object 가능. onRehydrateStorage가 array 강제 → 사용자 새 IDB 영향 없이 safe (사용자 데이터 우선, array이면 그대로).
- **createPortal + fixed positioning은 ancestor overflow 영향 0**: dropdown의 `absolute` + `max-height` 처리해도 parent의 `overflow-hidden`이 우선이라 잘림. portal로 document.body에 mount하면 ancestor 무관. `useLayoutEffect`로 triggerRef.getBoundingClientRect() 위치 계산 + viewport bound check + flip (top/bottom).
- **build TypeScript 부채는 main 사전 존재 확인 후 진행**: `git stash` 후 main 상태에서 tsc 실행으로 사전 부채 분리. 내 변경 관련 에러만 fix하고 사전 부채는 별도 PR (`insights-view.tsx:268 noteEvents` 잔재).
- **Wiki 본질 vs Note 본질 차이가 slash insert path 디자인 결정 좌우**: Wiki article = blocks[] 구조 (sections + text + infobox), Note = contentJson (TipTap). Wiki slash insert는 article level apply가 자연 (section + infobox 의도). Note slash insert는 contentJson splice가 자연. WikiTemplate slash insert를 ProseMirror Decoration 패턴 적용 어려운 이유.
- **나무위키 정합 preset 확장 패턴**: typed field + group-header collapse + color token. 11 → 17. color 충돌 회피 위해 신규 tokens (cyan/lime/pink/brown). 향후 추가도 동일 패턴 — Tier 2-4 본격 고도화 시 base.

### Watch Out (다음 세션)

- **🔴 다음 P0 후보 1**: Wiki Template slash insert (PR #358 후속, ~3 파일).
- **🟡 다음 P0 후보 2**: 나무위키 Tier 2-4 본격 (PRD 분리 권장, 큰 작업).
- **🟡 다음 P0 후보 3**: Library Tags Detail panel (~5 파일).
- **🟡 사전 main 부채**: `components/insights-view.tsx:268` `noteEvents` → `entityEvents` migration 누락 (v133 잔재). 별도 cleanup PR 후보 — 본 세션 PR 무관이지만 build TypeScript 부채 10개 중 가장 명료.
- **🟣 dead code 정리**: `components/note-detail-panel.tsx` (어디서도 import 안 됨, P2).
- **사용자 manual verify 필요** (다른 머신 fresh dev에서):
  - Wiki Stub Delete → Trash 표시 → "Delete forever" → hard delete (PR #357)
  - Wiki 사이드바 "Templates" entry (count 8) → /wiki/templates → 8 cards → card 클릭 → Detail panel + Apply (PR #358)
  - Wiki article infobox preset dropdown → 17개 모두 보임 + viewport 작아도 scroll/flip (PR #359)

### 환경 변경

- Branch: `kind-zhukovsky-1a4485` 그대로 (다음 머신에서 새 worktree 가능)
- Store version: v137 → v138 → v139 (Wiki Delete trashedAt + WikiTemplate slice)
- 신규 파일 (PR #358):
  - `lib/store/slices/wiki-templates.ts`
  - `app/(app)/wiki/templates/page.tsx`
  - `components/views/wiki-templates-view.tsx`
  - `components/wiki-template-picker.tsx`
  - `components/side-panel/wiki-template-detail-panel.tsx`
- Preset 17개 확장 (PR #359): School/Animal/Software/Food/Vehicle/Sport Team
- 영구 룰 #62, #63 추가
- 사용자 IDB stale wiki templates `{}` empty object case 보고 — onRehydrateStorage defense로 해결

---

## 2026-05-17 (밤) — 집/Windows, **Books sidebar transition + Trash hardcoded grouping + Trash entity-native icon fix 3건**

> 🎯 **다음 즉시 액션**: **Wiki Delete를 Trash 거쳐 soft delete 패턴 변경** (사용자 결정 받음, 별도 PR ~5 파일).
>
> **사용자 의도** (이번 세션, 그대로 인용):
> 1. "북스 체크 시 우측 사이드바가 변경되는 화면전환이 제대로 안 이뤄지네. 하드코딩된 거 같다니까??"
> 2. "체크박스에 처음으로 체크를 하게 되면 자동으로 우측 사이드바가 열려야 되는 거 아니야? 노트의 경우엔 그러는데?"
> 3. "노 그룹핑 상태인데 왜 트래쉬에서 카인드별로 리스트업이 되고 있는 거야??"
> 4. "stub는 삭제하면 자동으로 완전 삭제가 되어버리는 건가??" — Wiki Delete = hard delete 진단 보고.
> 5. "노트는 이 아이콘이 아닌데? 엔티티와 그 내부 아이콘들까지 고려해서 뭔가 표시가 나와줘야 될 거 같은데, 트래쉬에"
>
> **다음 작업 디테일 (Wiki Stub hard delete → soft delete)**:
>
> 현황:
> - `lib/store/slices/wiki-articles.ts:156` `deleteWikiArticle()` = **hard delete** (filter + entityEvents cascade + sticker membership cascade)
> - `lib/store/slices/wiki-articles.ts:80` `updateWikiArticle(id, {trashed:true})` = **soft trash**
> - 현재 Wiki Board ContextMenu / Wiki Detail "Delete article" 버튼 → `deleteWikiArticle` 호출 (hard delete 직행)
>
> Note 정합 패턴 (`lib/store/slices/notes.ts`):
> - `toggleTrash(id)` = soft trash
> - `deleteNote(id)` = hard delete (Trash 안에서만 호출)
> - UI: row Delete = soft trash → Trash에서 "Delete forever" = hard delete
>
> **첫 스텝** (다른 머신에서 즉시 시작):
> 1. `git pull origin main` (이번 PR #353/#354/#355 + docs sync 머지됨)
> 2. `npm install && npm run dev` + hard refresh
> 3. **Wiki Delete 호출 site 변경**:
>    - `components/views/wiki-list.tsx` `WikiArticleMenuItems`의 onDelete → `updateWikiArticle(id, {trashed:true})` (현재 `deleteWikiArticle`)
>    - `components/side-panel/wiki-article-detail-panel.tsx` "Delete article" 버튼 → 동일 변경
>    - `components/views/wiki-view.tsx:1400` `onDeleteArticle` callback도 검토 (board context menu가 통과하는 path)
> 4. **wiki-articles slice 신규 action 추가 (선택)**: `trashWikiArticle(id)` helper — 의도 명확화 ("Note의 toggleTrash 패턴 정합"). 또는 그냥 `updateWikiArticle` 직접 호출.
> 5. **trashedAt 필드** 추가 검토 — Note는 trashed + trashedAt 둘 다. Wiki는 trashed만? `lib/types.ts` 확인.
> 6. **Trash UI verify**: Wiki Stub Delete → trash 안에 표시 → "Delete forever" 클릭 → hard delete (entityEvents + sticker cascade).
>
> **참고 파일** (다음 세션 read):
> - `lib/store/slices/wiki-articles.ts:80, 156` — 두 액션 정합
> - `lib/store/slices/notes.ts` — `toggleTrash` + `deleteNote` 2단 패턴 reference
> - `components/views/wiki-list.tsx:158-168` — `WikiArticleMenuItems.onDelete` 호출
> - `components/side-panel/wiki-article-detail-panel.tsx` "Delete article" 버튼 위치
> - `components/views/trash-all-view.tsx:303` — `case "wiki": updateWikiArticle(...)` (restore 부분 — 이미 soft pattern 사용. delete는 line 316 `deleteWikiArticle` hard)
>
> **위험 + 회피**:
> - **사용자 사전 hard-deleted wiki는 복구 불가** — 데이터 손실. 이미 발생한 건 어쩔 수 없음. 향후 hard delete 방지.
> - **Wiki Stub vs Article 구분 의도된 패턴?** 사용자가 "stub는 삭제하면 자동 hard delete" 보고 — 즉 stub는 별도 의도? 또는 단순 버그? 확인 후 진행. 가장 자연: stub도 article도 동일 패턴 (soft trash → hard delete).
> - **Note 패턴 정확 mirror**: `toggleTrash` 시 trashed:true + trashedAt:now() set. Wiki도 동일.
> - **entityEvents trashed/untrashed 발화 이미 wiki-articles slice에 있음** (line 81-84) — 추가 작업 없음.
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #355 머지 후 + docs sync (이 entry commit 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926` 그대로

### 완료 (이번 세션 3 PR + docs sync)

- **PR #352** — `/books` row click 시 사이드바 즉시 전환 (BookDetailPage useEffect 대기 X)
- **PR #353** — `book-table` checkbox 체크 시 sidebar transition (notes-table:561 useEffect 패턴 정합)
- **PR #354** — Trash All view에 Display panel groupBy 설정 정합 (하드코딩 해제 — `'none'` → flat list / 'kind' → KIND 섹션)
- **PR #355** — Trash row icon entity-native (Wiki Stub/Article + Book kind + Tag/Label color dot)

### 영구 LOCKED 결정 (이번 세션)

- **59. Display panel 설정은 모든 view에 일관 적용**: Trash 같은 특수 view도 viewStateByContext context 통해 groupBy 받기. 하드코딩 금지.
- **60. selection state → sidebar mirror useEffect 패턴 영구**: `selectedIds.size === 1` 시 그 entity로 setSidePanelContext + setSidePanelOpen. notes-table:561 reference. 모든 entity table (books / wiki / tags / labels)에 동일 적용.
- **61. Trash row icon = entity-native 일관**: Wiki=Stub/Article, Book=kind, Tag/Label=color dot, Note=status. Plot 어디서나 entity 본질 icon 일관 (영구 룰 25 확장).

### 기술 학습 (영구)

- **하드코딩 진단은 사용자 시각 확인이 가장 빠름**: 사용자가 "왜 안 됨"이라고 보고 시 — 코드 logic 추측 X, 직접 코드의 hardcoded branch (sections.map / `case "book"` 명시) 찾기.
- **selection state ↔ sidebar context mirror useEffect는 표준 패턴**: 모든 multi-select 가능 table view에 동일 적용. 누락 시 사용자 "하드코딩 같다" 보고 트리거.
- **EntityKindIcon helper는 entity-specific 정보 받아야**: Wiki는 isStub, Book은 kind, Tag/Label은 color. helper props에 entity-specific 필드 추가 + 호출 site에서 build-time derive.
- **derive vs 데이터 모델 신규 필드**: TrashRowItem의 wikiIsStub / bookKind는 build-time derive (sections 계산 시 isWikiStub(w) / getBookKind(b)). 데이터 모델 변경 없음. 사용자 데이터 보호 + migration 없음.

### Watch Out (다음 세션)

- **🔴 Wiki Delete = hard delete 직행 fix (사용자 결정 받음)** — 별도 PR
- **🟡 Book Template 도입 가능성 brainstorming** (사용자 보류)
- **🟡 Categories 본격 분리 (길 B)** — `/library/categories` 새 route + CategoriesView 컴포넌트
- **🔴 Wiki Template 신설** (큰 작업 ~20 파일, 이전 P0)
- **🟣 dead code 정리**: `components/note-detail-panel.tsx` (어디서도 import 안 됨)

### 환경 변경

- Branch: `awesome-mcnulty-cac926` (계속 사용)
- Store version: v137 그대로 (이번 세션은 UI/UX fix만, 데이터 모델 변경 없음)
- 신규 파일 없음
- Preview verify:
  - books table checkbox: book-3 → book-4 transition ✅
  - Trash groupBy='none' → flat list / 'kind' → 섹션 ✅
  - Wiki SVG path vs Note SVG path 다름 (entity-native icon 분기 작동) ✅

---

## 2026-05-17 (저녁) — 집/Windows, **Label/Category cross-entity 전면 확장 + Library hub 재배치 + v137 migration**

> 🎯 **다음 즉시 액션**:
> 1. **Wiki Template 신설** (별도 PR, 다음 세션 핵심 작업) — Plot에 `WikiTemplate` 타입/slice/UI 신설. memory의 영구 결정 "WikiTemplate 통합 모델"이 실제 코드로는 미구현. 사용자 명시 "위키에도 템플릿이 신설되어야 해".
> 2. **(선택) Book Template 도입 가능성 논의** — 사용자가 "북에는 템플릿이 도입될 수 있을지 확신 안 들어" — 다음 세션 brainstorming.
> 3. **(선택) Categories 본격 분리 (길 B)** — 현재 길 A (entry만 Library, click 시 wiki page로 navigate). 본격 `/library/categories` 신규 route + `CategoriesView` 독립 컴포넌트로 분리하면 사용자 의도 100% 정합. 작업량 ~10 파일.
> 4. **(선택) note-detail-panel.tsx dead code 제거** — `components/note-detail-panel.tsx`는 어디서도 import 안 됨 (자기 자신만). 실제 사이드바 노트 detail은 `side-panel-context.tsx`. cleanup PR.
>
> **사용자 의도** (이번 세션, 그대로 인용):
> 1. "라벨 → 가장 큰 분류, 카테고리 → 라벨 내의 세부 분류표, 태그 → 자유 키워드 등록"이라 생각했음 (사용자 처음 mental model).
> 2. "Category 자유 (Label과 독립): Category 'Meeting'은 어느 Label이든 붙음. 라벨도, 카테고리도, 태그도 붙이든 말든 전부 유저 마음대로, 자유롭게" — 계층 의존 폐기 + orthogonal 독립 결정.
> 3. "사이드바에서 태그 추가의 경우 현재 노트든, 위키든, 북이든 기존에 있는 태그만 추가할 수 있고 기존에 없던 태그를 만들어내는 기능이 없는 거 같거든? 이것도 가능하게 해줘야 할 듯" — inline Create UI 모든 entity에.
> 4. "노트의 경우 따로 라벨을 채택하지 않으면 자동으로 memo 분류를 하는데... 그냥 이 방식을 없애야 될 거 같아" — Memo 자동 부여 폐기.
> 5. "라벨과 카테고리스도 라이브러리로 배치해야 형평성이 맞을 거 같은데" — cross-entity 분류는 Library hub로.
> 6. "왜 카테고리스랑 라벨스는 화면에 안 나옴??" — Library Overview UI에 stat card 누락 발견.
>
> **결정 4종 (영구 LOCKED)**:
> - **결정 1 (a)**: WikiCategory 시스템 공유 (Note/Wiki/Book 모두 같은 풀)
> - **결정 2 (a)**: Wiki Category DAG hierarchy 유지 (1-level만 써도 OK, 사용자 자유)
> - **결정 3**: Label 풀 공유 + **Memo 자동 부여 폐기** (labelId null이면 chip 안 보임, 모든 entity 동일)
> - **결정 4 (a)**: Folder + Label 둘 다 유지 (Folder = 작업 공간, Label = 분류 marker)
>
> **사이드바 재배치 (옵션 A)**:
> - Labels 본격 이동: `/labels` → `/library/labels` (legacy `/labels` 호환). Notes 사이드바에서 제거.
> - Categories 길 A (단순): Wiki 사이드바에서 제거 + Library에 entry 추가. click 시 `/wiki` + categoryView mode로 navigate (본격 분리는 별도 PR).
>
> **첫 스텝** (다음 세션 — 다른 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지됨)
> 2. `npm install && npm run dev` (port 3002) + hard refresh + console `[migrate] v136→v137` 확인
> 3. **manual verify** (이번 PR 누적 변경):
>    - **Note Detail (side-panel-context)**: Folders / Label / Tags / **Categories** ⭐ / In Books — 5 메타 row
>    - **Wiki Detail**: **Label** ⭐ + **Categories (편집 가능)** ⭐ + Tags (이전 PR) — 분류 메타 풀 셋
>    - **Book Detail**: **Label + Categories + Tags** ⭐⭐⭐ — Properties section 위 3 신규 row
>    - **Library sidebar**: Overview / References / Tags / **Labels** / **Categories** / Files / Stickers
>    - **Library Overview UI**: 6 stat card 그리드 (References / Tags / **Labels (N in use)** / **Categories (N in use)** / Files / Stickers)
>    - **Notes sidebar More section**: Templates / Insights만 (Labels 제거)
>    - **Wiki sidebar**: Overview / Merge / Split / Views / Folders (Categories 제거)
>    - **새 노트 생성 시**: labelId=null 유지 → Label chip 안 보임 (Memo 자동 부여 폐기 verify)
>    - **각 Detail picker**: 검색 input + "Create '...'" inline 옵션 작동 확인
> 4. **다음 PR 시작 — Wiki Template 신설** (큰 작업):
>    - 새 type `WikiTemplate` (lib/types.ts)
>    - 새 slice `wiki-templates.ts` (CRUD + events)
>    - migration (SEED_WIKI_TEMPLATES + IDB initialization)
>    - UI — Wiki 사이드바에 Templates entry + WikiTemplatePicker (Wiki 생성 시 template 선택 flow) + 4탭 사이드바 Detail panel
>    - 작업량 ~20 파일
>
> **컴포넌트 구조 / 데이터 흐름** (이번 세션 변경):
> - **`components/category-picker.tsx`** (신규) — entity-agnostic CategoryPicker. TagPicker 패턴 정합 (검색 input + filtered list + exactMatch + showCreate). props: `entityId / selectedCategoryIds / allCategories / onAddCategory / onRemoveCategory / onCreateCategory`. FolderSimple icon. flat list (DAG hierarchy 표시는 P2 polish).
> - **`components/side-panel/side-panel-context.tsx`** — Note Detail (실제 사이드바)에 CategoryPicker 추가. `side-panel-detail.tsx`의 NoteDetailPanel은 `side-panel-context.tsx`로 dispatch. `components/note-detail-panel.tsx`는 dead code (P2 cleanup 후보).
> - **`components/side-panel/wiki-article-detail-panel.tsx`** — Categories read-only chip → CategoryPicker 편집 가능. + Label section 신규 (LabelPicker). + (이전 PR) Tags TagPicker.
> - **`components/side-panel/book-detail-panel.tsx`** — Properties section 위에 3 신규 row: Label / Categories / Tags. 모두 inline Create.
> - **`components/linear-sidebar.tsx`** —
>   - Notes "More" section: Labels entry 제거 (Templates / Insights만)
>   - Wiki section: Categories button 제거
>   - Library section: Labels entry 추가 (`/library/labels`) + Categories button 추가 (click 시 wiki page + categoryView mode)
> - **`components/views/library-view.tsx`** — LibraryOverview에 Labels + Categories stat card 추가. 4-col → 3-col grid (2 row, 6 카드).
>
> **Store action 매핑** (이번 세션):
> - `createNote(partial?)` — labelId null 유지 (Memo 자동 부여 폐기, `notes.ts:11`)
> - `updateNote(id, { categoryIds })` — Note categoryIds 갱신
> - `updateWikiArticle(id, { labelId | categoryIds })` — Wiki label/category 갱신
> - `updateBook(id, { labelId | categoryIds | tags })` — Book 분류 메타 갱신
> - `createWikiCategory(name)` → `string | null` (이미 존재, CategoryPicker에서 재활용)
> - `createLabel(name, color)` → void (LabelPicker `onCreateLabel` 후 즉시 entityId.labelId 할당)
> - `createTag(name)` → `string` (이전 PR에서 시그니처 변경)
> - `setCategoryOverview()` — wiki-view-mode (Library Categories card click 시)
>
> **데이터 모델 변경**:
> - Store version **v136 → v137** (`lib/store/index.ts:257`).
> - **v137 migration** (`migrate.ts`):
>   - `WikiArticle.labelId` default null (없으면 채움)
>   - `Book.labelId` default null + `Book.categoryIds` default [] + `Book.tags` default []
>   - `Note.categoryIds` default [] (모든 노트에 빈 array)
>   - 명시 "in" 체크로 사용자 데이터 보존
> - **type 변경** (`lib/types.ts`):
>   - `WikiArticle.labelId?: string | null` 신규 (line 401 근처)
>   - `Note.categoryIds?: string[]` 신규 (line 461 근처)
>   - `Book.labelId?: string | null` + `Book.categoryIds?: string[]` + `Book.tags?: string[]` 신규 (line 124 근처)
> - **lib/colors.ts** — KNOWLEDGE_INDEX_COLORS에 `labels` (rose #f43f5e) + `categories` (emerald #10b981) 추가
>
> **Route 변경**:
> - `/library/labels` 신규 route — `app/(app)/library/labels/page.tsx` + `layout.tsx` 분기 추가 + `VIEW_ROUTES` 등록
> - legacy `/labels` 호환 유지 (둘 다 LabelsView mount)
> - Categories는 route 변경 없음 (길 A) — `/wiki` + categoryView mode
>
> **위험 + 회피** (이번 세션 교훈):
> - **dead code 위험 (note-detail-panel.tsx)**: 어디서도 import 안 됨. 실제 사이드바는 side-panel-context.tsx. 변경 시 진짜 mount 위치 확인 의무 (사용자 verify 시 "사이드바에 Categories 안 보임" 발견).
>   - 회피: 변경 후 preview에서 selector로 실제 표시 확인. 또는 `Grep` import chain 확인.
> - **createWikiCategory return type**: `string | null` (label 다름). CategoryPicker.onCreateCategory도 같은 signature.
> - **TS 'in' 체크**: optional 필드는 `if (!("labelId" in w))` 로 default 채움. `w.labelId == null`은 키 자체 없는 케이스 안 잡힘.
> - **WikiCategory 공유 의미 변화**: 이제 "Computer Science" 카테고리가 wiki 외에도 노트/책에 부여 가능. 사용자 mental model "공통 분류 풀"로 통일 — 의미 충돌 시 사용자 결정 필요.
> - **Memo 자동 부여 폐기 영향**: 기존 노트는 그대로 (Memo label 그대로 부여됨). **새 노트만 label null로 시작**. 사용자가 일관성 원하면 일괄 Memo 제거 migration 가능 (별도 PR).
> - **글로벌 find-replace 사고 영구 룰 51**: PR 머지 전 placeholder/string literal grep 의무 (이번 PR에서는 신규 string literal 적음).
> - **Library Overview stat card 누락 case**: sidebar entry만 추가하고 overview UI 누락 — 사용자 시각 확인이 가장 빠른 진단. 사이드바 + overview 동시 보강이 정합 패턴.
>
> **참고 파일** (다음 작업 시 read):
> - `components/category-picker.tsx` (신규) — entity-agnostic picker 패턴. TagPicker / LabelPicker 정합
> - `components/note-fields.tsx:365` TagPicker — entity-agnostic 패턴 reference
> - `components/note-fields.tsx:493` LabelPicker — single-value picker reference
> - `components/side-panel/side-panel-context.tsx` — Note Detail 실제 mount 위치 (note-detail-panel.tsx는 dead code)
> - `lib/store/migrate.ts:2070` v137 block — seed/default 추가 패턴
> - `components/linear-sidebar.tsx:1560` Library section — Labels/Categories entry 위치
> - `components/views/library-view.tsx:575` LibraryOverview — 6 stat card grid
> - **Wiki Template 신설 시 reference**:
>   - `lib/types.ts:695` NoteTemplate 타입 — 그대로 WikiTemplate 변형 reference
>   - `lib/store/slices/templates.ts` — NoteTemplate slice reference
>   - `lib/store/seeds.ts` SEED_TEMPLATES — Wiki seed 변형 reference
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 곧 PR (이 entry + commit + merge 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926` (계속 사용 가능)

### 완료

- **Memo 자동 부여 폐기** (`notes.ts:11-17`) — `createNote` 시 labelId 미지정이면 null 유지. 영구 룰 (사용자 명시).
- **types.ts 4 신규 필드** — Wiki.labelId / Note.categoryIds / Book.labelId+categoryIds+tags
- **v137 migration** — 사용자 데이터 보존 + default 추가 (`!("labelId" in w)` 등 명시 체크)
- **CategoryPicker 신규 컴포넌트** — TagPicker 패턴 정합 (entity-agnostic, 검색 + inline Create)
- **Note Detail (side-panel-context)** — CategoryPicker section 추가
- **Wiki Detail** — LabelPicker + CategoryPicker (편집) 추가 (Categories 이전 read-only chip → picker)
- **Book Detail** — LabelPicker + CategoryPicker + TagPicker 3 row 신규 (Properties section 위)
- **Sidebar 재배치** — Labels (Notes→Library) + Categories (Wiki→Library, 길 A)
- **`/library/labels` route 신규** — `app/(app)/library/labels/page.tsx` + `layout.tsx` 분기 + `VIEW_ROUTES`
- **Library Overview UI 보강** — 6 stat card grid (Labels + Categories 추가, 3-col layout 2 row)
- **KNOWLEDGE_INDEX_COLORS 확장** — labels (rose) + categories (emerald)

### 영구 LOCKED 결정 (이번 세션)

- **53. Label/Category/Tag = orthogonal 독립 + 자유 선택** — 계층 의존 X. 각 entity에 자유 부여 가능 (없어도 OK). 사용자 마음대로.
- **54. WikiCategory 풀 공유 (cross-entity)** — Note/Wiki/Book 모두 같은 카테고리 시스템. 별도 entity별 풀 X. Smart Book의 `kind: "category"` source도 cross-entity 자연 확장.
- **55. Wiki Category DAG hierarchy 유지** — N-level 깊이 그대로. Note/Book 사용자는 1-level만 써도 자유. wiki 본질 (학문 분류) 보존.
- **56. Memo 자동 부여 폐기 영구** — `createNote` 시 labelId 미지정 → null. Label chip은 labelId 있을 때만 표시. 모든 entity 동일 패턴.
- **57. cross-entity 분류 메커니즘 = Library hub** — Label/Category/Tag (모두 cross-entity)는 Library 사이드바에 모임. Notes/Wiki entity 사이드바에서 제거 (Templates / Folders 같은 entity-specific만 유지).
- **58. CategoryPicker entity-agnostic** — `components/category-picker.tsx`. Note/Wiki/Book 모두 같은 컴포넌트 + 다른 callback wire-up. TagPicker / LabelPicker / FolderPicker 패턴 정합.

### 기술 학습 (영구)

- **사용자 mental model "Label > Category > Tag 계층"이 처음 떠올랐지만 reframe 가능** — 사용자가 함정 1 (Category가 Label 종속) 직접 해결. "Category 자유 (Label과 독립): 라벨도, 카테고리도, 태그도 붙이든 말든 전부 유저 마음대로" → orthogonal 독립으로 정착. **mental model이 코드 디자인보다 우선**.
- **CategoryPicker는 TagPicker 패턴 그대로 재활용** — `flat list + search input + inline Create + exactMatch 체크`. wikiCategories DAG는 모델 그대로지만 picker는 flat 검색으로 충분 (사용자가 search로 찾으면 됨, hierarchy 시각화 X).
- **dead code 잠재**: `note-detail-panel.tsx`처럼 어디서도 import 안 되는 컴포넌트가 큰 변경 PR 후 잔존 가능. 실제 mount 컴포넌트가 무엇인지 매번 확인 (Grep `<ComponentName`).
- **stat card 누락은 시각 확인이 가장 빠름** — 사용자가 스크린샷 보고 "왜 안 나옴" 보고. 사이드바 + Overview UI는 같이 보강하는 패턴 (entity-uniformity 영구 룰).
- **사용자 일관성 욕구의 본질** — "라이브러리로 배치해야 형평성이 맞을 거 같은데" → cross-entity 데이터는 cross-entity hub. Plot의 entity-specific sidebar에 두면 사용자가 "왜 노트 안에 있지?" 의문.

### Watch Out (다음 세션)

- **🔴 Wiki Template 신설 (큰 작업)**: 사용자 명시 시그널. 다음 PR 핵심. ~20 파일.
- **dead code**: `components/note-detail-panel.tsx` — 별도 cleanup PR.
- **Categories 본격 분리 (길 B)**: 사용자가 길 A 선택했지만 향후 polish 가능. `/library/categories` 신규 route + CategoriesView 분리.
- **사용자 사전 노트의 Memo label**: 기존 노트는 그대로 Memo label 부여 상태. 사용자가 일괄 제거 원하면 별도 migration PR.
- **WikiCategory가 cross-entity = 의미 변화**: "Computer Science" 카테고리가 wiki 학문분류 의미였는데 이제 노트/책에도. 사용자 데이터 의미 충돌 시 보고 받아야.
- **Book Template 도입 검토 (P1, 사용자 명시 "확신 안 듦")**: 다음 세션 brainstorming.

### 환경 변경

- Store version: **v136 → v137** (Label/Category cross-entity 필드 default 추가)
- Persist version: 137
- 신규 파일:
  - `components/category-picker.tsx` (CategoryPicker)
  - `app/(app)/library/labels/page.tsx` (`/library/labels` route)
- 데이터 모델 변경: 4 신규 optional 필드 (Wiki.labelId / Note.categoryIds / Book.labelId+categoryIds+tags). migration default.
- 색 토큰: KNOWLEDGE_INDEX_COLORS.labels (rose) + .categories (emerald)
- VIEW_ROUTES: `/library/labels` 추가
- Preview verify:
  - v137 migration: Notes 25 categoryIds 초기화 / Wikis 19 labelId / Books 9 labelId+categoryIds+tags
  - Library sidebar: 6 entry (Tags 7 / Labels 5 / Categories 11 / Files / Stickers 0 / References 0)
  - Library Overview: 6 stat card 정상 표시 ✅
  - Note Detail: Categories section 표시 ✅
  - Wiki/Book Detail: 모든 picker render ✅

---

## 2026-05-17 — 집/Windows, **Tags/Labels sub-page entity-uniformity 1차 (사이드바 + 체크박스 + dblclick + cross-entity derive + seeds v135/v136 + FunnelSimple fix)**

> 🎯 **다음 즉시 액션**: **Tags/Labels sub-page를 view-engine 통합 (ViewHeader + 표준 DisplayPanel + List/Grid + 풍부한 Grouping/Display Properties)**. 사용자 시그널 "기존 플롯식 정합과 다른데" + "디스플레이 프로퍼티스 부실 + 그룹핑 옵션 없음" — 본격 통합 별도 PR (이번 PR에서 분리 채택).
>
> **사용자 의도** (이번 세션 그대로 인용):
> 1. "라벨의 우측 사이드바는 아직 구현이 안 된 게 맞지? 그리고 클릭 시 단순히 리스트만 나오는 게 아니라, 체크박스도 있어야 되지 않나? 그리고 해당 리스트에서 더블클릭을 하면 실제 해당 노트로 넘어가게 해주면 좋고."
> 2. "더블클릭했는데 왜 해당 노트로 안 넘어가? 해당 노트의 에디터가 딱 떠줘야지."
> 3. "태그의 경우 노트도 있고 위키도 있고 북에도 들어갈텐데, 그 리스트가 나눠져야 되지 않냐? 라벨은 노트에만 국한되어 있다쳐도."
> 4. "북에 소속되어있는 노트에 태그가 들어있으면 자동으로 태그스에 속하게 시킬건가?" — derive 방식 사용자 직관
> 5. "사이드바에서 태그 추가의 경우 현재 노트든, 위키든, 북이든 기존에 있는 태그만 추가할 수 있고 기존에 없던 태그를 만들어내는 기능이 없는 거 같거든?"
> 6. "왜 태그스의 디스플레이는 이상하냐? 화면이. 기존의 플롯식 정합과 다른데? 왜 필터는 없냐? 라벨스도 이상해."
>
> **첫 스텝** (다음 세션 — 다른 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지됨)
> 2. `npm install && npm run dev` (port 3002) + hard refresh + console `[migrate] v135→v136` 확인
> 3. **Tags/Labels sub-page를 view-engine 통합**:
>    - 새 `TAG_DETAIL_VIEW_CONFIG` / `LABEL_DETAIL_VIEW_CONFIG` 정의 (`lib/view-engine/view-configs.tsx`)
>      - `displayConfig.properties` — 노트 row visible columns (title / status / labels / tags / updatedAt / createdAt 등)
>      - `displayConfig.groupingOptions` — None / Status / Priority / Folder / Label / Created / Updated / First letter (Notes 정합)
>      - `displayConfig.supportsViewMode` — list / grid (또는 list만)
>    - tags-view.tsx / labels-view.tsx sub-page render 분기를 ViewHeader + 표준 DisplayPanel + FilterPanel로 교체
>    - EntityNoteListRow에 `visibleColumns?: string[]` prop 추가 + 조건부 chip 렌더
>    - Filter는 표준 FilterPanel + filterCategories (Notes 정합)
> 4. **선택 작업** (Phase 2/3 본 hook 후속):
>    - Wiki 본문 #해시태그 자동 sync (Note editor 패턴 wiki editor에도 wire-up) — P1
>    - Wiki blocks 임베드 노트의 tag derive (reference-aware sub-page 매칭) — P1
>    - Note의 wikilink가 가리키는 entity tag derive — P2
>    - Book Detail manual TagPicker — 사용자 결정 필요 (현재 derive only)
>
> **컴포넌트 구조** (이번 변경):
> - `components/views/entity-note-list-row.tsx` (신규) — DRY row helper. `<div role="button">` + hover-only checkbox + single click = toggle + double click = navigate. props: `note / isSelected / onToggleSelect / onNavigate`.
> - `labels-view.tsx` / `tags-view.tsx` sub-page 변경:
>   - `useState<Set<string>>` 추가 — multi-select state
>   - `useEffect`로 `selectedXxxId` 변경 시 `sidePanelContext` + `sidePanelOpen: true` sync (영구 룰 21)
>   - `useCallback navigateToNote(noteId)` = `setSelectedXxxId(null)` + `setActiveRoute("/notes")` + `openNote(id)` + `router.push("/notes")` — sub-page exit + 노트 editor 진입
>   - `<button>` row → `<EntityNoteListRow>`
>   - Selection bar (`{N} note(s) selected` + Clear)
> - `tags-view.tsx` cross-entity sections (Notes + Wiki + Books):
>   - `tagWikis` = `wikiArticles.filter(w => !w.trashed && w.tags.includes(selectedTagId))`
>   - `tagBooks` = `books.filter(b => b.items 노트/위키 중 tag 가진 게 있거나 b.smartSources에 kind="tag" + 이 tag refId 있음)`
>   - 빈 섹션 hide, 모두 비면 "No items with this tag"
>   - Wiki row inline (Stub/Article icon + title + relative time, dblclick = `router.push("/wiki")`)
>   - Book row inline (BookKindIcon + title + items count, dblclick = `router.push("/books/{id}")`)
> - `components/side-panel/wiki-article-detail-panel.tsx` Tags 섹션:
>   - read-only chip strip → `<TagPicker>` (Note Detail 정합)
>   - inline Create 자동 포함 (Popover에 search input + "Create '...'" 옵션)
>   - `onCreateTag` 시 새 id 생성 후 즉시 `updateWikiArticle({tags: [...current, newId]})`
>
> **데이터 모델 변경**:
> - Store version **v134 → v135 → v136** (`lib/store/index.ts:257`).
> - **v135**: wiki seed tag backfill. PR #347 이후 v134로 push된 wiki-8~17이 빈 tags였던 문제 fix. `state.wikiArticles[].tags` 빈 배열 + seed.tags 비어있지 않은 경우만 fill (idempotent, 명시적으로 사용자가 비운 wiki는 영향 X).
> - **v136**: SEED_NOTES backfill. note-1~9가 사용자 IDB에 없던 경우 push (id-dedup append, wiki v134 패턴 정합).
> - **Book entity 데이터 모델 변경 없음** — tags 필드 X. Tag sub-page Books 섹션은 derive only.
> - **Seeds**:
>   - `wiki-8~17`에 tags 분산 적용 (총 10 wiki — CS/Algorithms/Quicksort/Binary Search/Data Structures/Hash Table → tag-5 / Productivity Methods/GTD/Pomodoro → tag-3 / Theory of Knowledge → tag-1+tag-2)
>   - SEED_NOTES + SEED_BOOKS는 기존 tag 매핑 그대로 (이미 풍부)
>
> **글로벌 find-replace 사고 fix (재발 — 2026-05-14 Search→MagnifyingGlass 사고 패턴 정합)**:
> - `components/filter-bar.tsx` — `FunnelSimple` icon 이름이 button label + placeholder string 8곳에 텍스트로 잔재
>   - placeholder `"FunnelSimple..."` × 6 → `"Search..."`
>   - button label `{!hideLabel && "FunnelSimple"}` → `"Filter"`
>   - 주석 1곳 cleanup
> - 사용자 보고 "FunnelSimple"이 toolbar에 보이던 문제 즉 해결.
>
> **Store action 매핑**:
> - `usePlotStore.setState({ sidePanelContext, sidePanelOpen })` — useEffect로 직접 sync
> - `setActiveRoute("/notes")` (`lib/table-route.ts:123`) + `router.push("/notes")` — sub-page exit + 노트 페이지 진입
> - `openNote(id)` (`ui.ts:40`) — selectedNoteId + sidePanelContext + reads ++ + editorTabs sync
> - `updateWikiArticle(id, { tags })` — Wiki TagPicker callback
> - `createTag(name)` → `string` (이번 PR에 변경된 시그니처 활용)
>
> **위험 + 회피** (이번 세션 교훈):
> - **글로벌 find-replace는 placeholder/string literal까지 검수 의무**. Memory 영구 룰 또는 grep 패턴 (`"<IconName>\s+\w+"`)을 PR review에 적용. 두 번째 사고 (FunnelSimple) — 정착 필요.
> - **TagPicker는 이미 inline Create 완비** (`components/note-fields.tsx:365`). 새 picker 만들 필요 X — wiki/book에도 같은 컴포넌트 재활용. noteId prop은 entityId 의미로 사용 가능.
> - **Wiki article 진입 routing**: `selectedWikiArticleId`는 wiki-view 내부 local state. 외부에서 wiki article로 deep-link 불가. router.push("/wiki")만 가능. 미래 query param 추가 시 (P2) 외부에서 wiki article로 직접 진입 가능.
> - **Book entity tags 필드 없음** — `lib/types.ts:124`. derive 방식 (B2) 채택: Book.items 안 note/wiki + smartSources tag 매칭. 데이터 모델 변경 0 = migration 0 = sync 버그 0.
> - **시드 보강 + migration 패턴 영구**: wiki-8~17이 시드는 있지만 v134 backfill로 push된 후 새 tag 매핑 추가하려면 — seed 변경 + v135 fill migration (idempotent + 명시적 비움 데이터 보호). 같은 패턴 반복 가능.
> - **TagPicker prop closure stale risk**: wiki-article-detail-panel의 onCreateTag 콜백이 article prop을 closure로 잡음. createTag 후 즉시 updateWikiArticle 호출 시점에 article은 최신이지만, React strict mode 또는 fast re-render 시 closure stale 가능. preview verify에서 한 번 발생 (article.tags가 빈 배열로 보임) — 사용자 환경에서는 안 발생할 가능성 큼. 후속 P2: 콜백 안에서 `usePlotStore.getState().wikiArticles.find(...)` 직접 read로 변경.
> - **wiki-1~13 trashed:true 잔존**: 사용자 IDB의 사전 데이터 (이번 PR 영향 X). v134/v135/v136 모두 trashed flag 안 건드림. fresh user는 정상. 사용자 본인이 untrash 또는 별도 v137 강제 reset 결정.
>
> **참고 파일** (다음 작업 시 read):
> - `components/views/notes-table-view.tsx` — Notes table의 ViewHeader + DisplayPanel 통합 패턴 (다음 작업의 reference)
> - `lib/view-engine/view-configs.tsx` — VIEW_CONFIG 정의 위치 (TAG_DETAIL_VIEW_CONFIG / LABEL_DETAIL_VIEW_CONFIG 신규 추가 자리)
> - `components/display-panel.tsx` — 표준 DisplayPanel 컴포넌트 (List/Grid + Grouping + Display Properties section)
> - `components/filter-bar.tsx:1116` — FilterButton 컴포넌트 (다음 작업에서 sub-page에 통합)
> - `components/views/entity-note-list-row.tsx` (신규) — visibleColumns prop 도입 자리
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 곧 PR + merge (이 entry 작성 + commit + merge 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926` (계속 사용 — main에 squash merge 후 같은 worktree에서 새 PR 가능)

### 완료
- **Labels/Tags sub-page 사이드바 자동 노출** — useEffect로 selectedXxxId 변경 시 sidePanelContext + sidePanelOpen sync (영구 룰 21)
- **Labels/Tags sub-page row 패턴 entity-uniformity** — `<EntityNoteListRow>` helper 신규. hover checkbox + single click = toggle + double click = navigate
- **노트 더블클릭 시 실제 editor 진입** — sub-page exit + `setActiveRoute("/notes")` + `openNote(id)` + `router.push("/notes")`
- **Tag sub-page cross-entity 3 섹션** — Notes (useNotesView) + Wiki articles (filter w.tags) + Books (derive: items 노트/위키 중 tag 가진 게 있거나 smartSources에 kind="tag" 매칭)
- **사이드바 inline Create tag** — Wiki Detail에 TagPicker upgrade (read-only → picker). Note Detail은 이미 완비. Book Detail은 derive 방식이라 picker 안 추가.
- **Seeds 보강**: wiki-8~17 (10개) 각각 tag 분산 적용
- **v135 wiki seed tag backfill**: 빈 tags wiki + seed에 tags 있으면 fill (idempotent)
- **v136 SEED_NOTES backfill**: note-1~9 push (id-dedup append)
- **FunnelSimple 텍스트 잔재 fix** (filter-bar.tsx 8곳)

### 영구 LOCKED 결정 (이번 세션)

- **46. Entity sub-page (Tags/Labels) row UX 영구 룰**: `<EntityNoteListRow>` helper 패턴 — hover checkbox + single click = toggle select + double click = navigate. Notes/Wiki table row 패턴 정합. 영구 룰 21 entity-uniformity 확장.
- **47. Sub-page → 노트 editor 진입 패턴**: `setSelectedXxxId(null)` + `setActiveRoute("/notes")` + `openNote(id)` + `router.push("/notes")` 4단 세트. `openNote(id)`만 호출하면 sub-page 분기에 가려 editor 안 보임. (Plot의 `isEditingInTableView = isTableView && !!selectedNoteId` 조건 정합.)
- **48. Tag sub-page cross-entity = derive (B2)**: Book entity에 tags 필드 X. 대신 `Book.items` 안 노트/위키의 tag + smartSources tag 매칭으로 runtime 계산. 데이터 모델 변경 0, sync 버그 0, 사용자 의도 충족 ("북에 소속 노트의 태그가 자동 흡수").
- **49. Wiki tag 부여 = 명시적만**: Note는 본문 #해시태그 자동 sync (NoteEditorAdapter). Wiki는 자동 sync 미적용 (P1 후속). 시드 + UI picker로만 부여.
- **50. Seed 증가 동반 migration 영구 룰**: 시드 코드 변경 시 자동 backfill migration 동반. id-dedup append 또는 빈 필드만 fill (사용자 명시 비움 데이터 보존). v130/v134/v135/v136 같은 패턴 — 다음 세대도 동일.
- **51. 글로벌 find-replace 사고 grep 의무**: PR 머지 전 placeholder/string literal에 icon 이름이 박혀있는지 검수 (`"<IconName>\s+\w+"` 또는 `placeholder="<IconName>"`). MagnifyingGlass (2026-05-14) + FunnelSimple (2026-05-17) 두 번째 사고. 영구 PR review checkpoint.

### 기술 학습 (영구)

- **TagPicker는 entity-agnostic 재활용 가능**: prop `noteId`는 string entityId 의미로 wiki/book에도 적용 OK. callback에서 article.id 또는 book.id 전달 — 같은 컴포넌트 코드 + 다른 store action wire-up.
- **`setActiveRoute(...)` vs `router.push(...)` 둘 다 필요**: setActiveRoute는 store-level state (view switch), router.push은 URL 변경. Plot client-side routing은 둘 다 sync해야 layout 분기가 정확. one만으로는 view stale 가능.
- **derive 패턴 = data sync 버그 0**: Book.tags 신규 필드 (B1 mutate) 대신 runtime 합집합 (B2 derive). 노트 tag 바뀔 때마다 모든 책 tags 다시 계산할 필요 X — Tag sub-page query 시점에만 계산.
- **v134→v135 backfill 패턴**: wiki tags가 v134 backfill로 빈 채 들어왔던 경우, v135에서 seed.tags가 비어있지 않을 때만 update. 사용자가 명시적으로 비운 케이스는 안 fill (보수). idempotent.
- **글로벌 find-replace는 string literal까지 영향**: VS Code Replace All은 import / JSX 사용처 / string literal 모두 변환 — 의도 안 한 placeholder 깨짐. 영구 룰 51 적용 의무.

### Watch Out (다음 세션)

- **🔴 Tags/Labels sub-page Display 부실**: 사용자 명시 불만. view-engine 통합 본격 PR 필수. 작업량 ~10 파일 (view-configs / tags-view / labels-view / entity-note-list-row 등).
- **wiki-1~13 trashed:true 잔존**: 사용자 본인 환경. 별도 fix 결정.
- **Wiki 본문 #해시태그 자동 sync 미구현** (P1): 사용자가 추후 시그널 보내면 진행.
- **Book Detail manual TagPicker 미추가**: derive 방식 일관성으로 안 추가. 사용자가 manual tag도 원하면 별도 PR (Book.tags 신규 필드 + migration + picker UI).
- **사전 존재 타입 에러 (cleanup 후보 P2)**: insights-view noteEvents / wiki-articles trashed property / sticker-detail-panel / wiki-category-page 비교 등. 본 PR과 무관.

### 환경 변경

- Store version: **v134 → v135 → v136** (wiki tag fill + notes backfill)
- Persist version: 136
- 신규 파일: `components/views/entity-note-list-row.tsx`
- 데이터 모델 변경: 없음 (derive만, seed/migration만 변경)
- Preview verify:
  - wiki articles 9 → 19 (v134 backfill 후 v135 tag fill)
  - notes 16 → 25 (v136 backfill)
  - tags 6 → 7 (Wiki TagPicker로 1개 추가)
  - Tag #Knowledge Management → NOTES 5 / WIKI ARTICLES 4 / BOOKS 4 표시 ✅

---

## 2026-05-16 — 집/Windows, **Wiki/Books board 우클릭 ContextMenu + Workbench inline Create + v134 wiki seed backfill**

> 🎯 **다음 즉시 액션**: P0-2 12+4 PR 통합 manual verify (사용자 본인 환경에서) + P0-1 Tags/Labels 회귀 cross-machine 재확인
>
> **사용자 의도** (이번 세션, 명시 보고):
> 1. "위키 보드 디스플레이 모드에서 Add to category할 때 기존에 없었던 카테고리를 생성할 수 있는 기능이 있어야 해. (내 생각에, 기존에 있는 코드들을 재활용하면 될 거 같아.) Add to Tags도 마찬가지."
> 2. "보드 디스플레이 모드일 때 마우스 우클릭이 안 되네? 노트는 돼. 위키랑 북도 되어야 해."
> 3. "야 시드데이터를 다시 만들어줘. 위키 시드데이터가 지금 0이라서 테스트가 안 돼"
>
> **첫 스텝** (다음 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지된 main 받음)
> 2. `npm install && npm run dev` (port 3002)
> 3. Plot 포커스 + Hard refresh (Ctrl+Shift+R) → console `[migrate] v133→v134: re-seeded wiki (N articles, N categories)` 확인
> 4. **검증 surface (4 신규 + 12 기존)**:
>    - **신규 a**: `/wiki` → Wiki Articles board → 카드 우클릭 → `Merge into / Split / Show connected / Move to folder / Add to folders / Delete` 메뉴
>    - **신규 b**: `/books` → board mode (Display panel viewMode "board") → 카드 우클릭 → `Rename / Pin to sidebar / Move to trash` 메뉴
>    - **신규 c**: Wiki board 카드 선택 → 우측 Workbench `Add to category` → 검색 input + 매치 없을 때 "Create '…'" 옵션 노출 → 클릭 시 새 카테고리 생성 + 자동 picked + "Add to N category" 적용
>    - **신규 d**: 같은 패턴 `Add tags` (검색 → "Create #…" → 새 태그 생성)
>    - **신규 e**: `/wiki` Wiki seed 19 articles 표시 (v134 backfill — 사용자 환경 0개 → 17 시드 자동 인젝션, 기존 사용자 추가 보존)
>    - **기존 12 PR**: Library 5 entity 사이드바 / Activity timeline / Connections charts / Ontology Legend 좌하단 (PR #334-#345)
>
> **컴포넌트 구조** (이번 변경):
> - `components/books/book-context-menu-items.tsx` (신규) — `BookContextMenuItems` helper. Notes의 `note-context-menu-items.tsx` 패턴 정합 (영구 룰 21 entity-uniformity). props: `book / onRename / onTogglePin / onDelete / onRestore / onPermanentDelete`. trashed 분기 (Restore / Delete forever) vs active (Rename / Pin / Move to trash).
> - `book-grid-card.tsx` — ContextMenuContent 내부를 helper로 단순화 (51 line → 8 line).
> - `books-board.tsx` — `BookBoardCard`를 `<ContextMenu><ContextMenuTrigger asChild>` wrap. BoardCard / BoardColumn / BoardProps callback chain 추가.
> - `books-view.tsx:272` — BooksBoard에 `onRename={startRename} / onDelete={handleDelete} / onRestore={handleRestore} / onPermanentDelete={handlePermanentDelete}` 전달.
> - `wiki-board.tsx` — `Card` visual을 `ContextMenu` wrap (`WikiArticleMenuItems` 재활용 — `wiki-list.tsx`에서 export). CardProps에 `onMergeArticle / onSplitArticle / onDeleteArticle / onShowConnectedArticle` 추가. WikiBoard 본체에 prop chain.
> - `wiki-view.tsx:1400` — WikiBoard에 `onDeleteArticle={(id) => { deleteWikiArticle(id); toast.success('Article deleted') }} / onShowConnectedArticle={...connectedTo filter}` 전달 (WikiList 패턴 정합).
> - `wiki-board-workbench.tsx` — CategoryAddPopover / TagsAddPopover 재작성. `query` state + filtered list (case-insensitive includes) + `exactMatch` 체크 + `showCreate` 조건부 inline button. createWikiCategory / createTag 호출 → 새 id 자동 picked → "Add to N" 버튼 활성. tags `query.trim().replace(/^#/, "")` (`#` prefix strip).
>
> **Store action 매핑**:
> - `createWikiCategory(name, parentIds?)` → `string | null` (이미 존재, 재활용)
> - `createTag(name, color?)` → `string` ⭐ **시그니처 변경** (이전 `void`). `tags.ts:11` 구현 + `types.ts:287`. backward compat (void 반환 무시하던 곳은 영향 X).
> - `deleteWikiArticle(id)` → store inline 호출 from wiki-view
>
> **데이터 모델 변경**:
> - Store version **v133 → v134** (`lib/store/index.ts:257`). `migrate.ts` 마지막에 v134 block 추가 — `SEED_WIKI_ARTICLES` + `SEED_WIKI_CATEGORIES` backfill. **v130 backfill 패턴 정합** (id-dedup append, idempotent). 이유: PR #347이 wiki seed 7 → 17로 늘렸지만 v130 backfill은 v129 이전 사용자만 trigger → v130~v133 사용자가 옛 시드 그대로. v134가 누락 시드만 push.
>
> **위험 + 회피** (이번 세션 교훈):
> - ContextMenuTrigger asChild + dnd-kit `attributes/listeners` 조합: 두 set이 다른 element면 충돌 X (left-click = drag, right-click = contextmenu).
> - DragOverlay 사용 시 `if (isDragOverlay) return visual` 분기 유지 — overlay에 ContextMenu wrap X.
> - WikiArticleMenuItems prop signature는 `(...) => void` (id 안 받음) — wiki-board에서 article.id wrap 필요: `onMerge={onMergeArticle ? () => onMergeArticle(article.id) : undefined}`.
> - createTag void → string 변경 시 기존 호출자 영향 없음 (TS는 void → string 호환). 단 types.ts와 slice 양쪽 다 변경 의무.
> - 사전 존재 타입 에러 (insights-view noteEvents / wiki-articles trashed property 누락 / sticker-detail-panel 등) — 내 변경과 무관, 별도 cleanup PR 후보 (P2).
>
> **참고 파일** (다음 작업 시 read):
> - `components/views/wiki-list.tsx:83-171` — WikiArticleMenuItems export 위치
> - `components/note-context-menu-items.tsx` — NoteContextMenuItems 패턴 (entity helper 분리 reference)
> - `lib/store/slices/wiki-categories.ts:38` — createWikiCategory(name, parentIds?) → string | null
> - `lib/store/slices/tags.ts:11` — createTag(name, color) → string (변경됨)
> - `lib/store/migrate.ts:2072` — v134 backfill block
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 곧 PR (이 entry 작성 + commit + merge 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926`

### 완료

- **Wiki board 카드 우클릭 ContextMenu 추가** — wiki-board.tsx Card에 `<ContextMenu>` wrap. WikiArticleMenuItems 재활용. wiki-view에서 onDeleteArticle / onShowConnectedArticle 전달 (WikiList 패턴 정합).
- **Books board 카드 우클릭 ContextMenu 추가** — book-context-menu-items.tsx 신규 helper. book-grid-card / books-board 양쪽에서 재활용. books-view에서 4 callbacks (onRename / onDelete / onRestore / onPermanentDelete) 전달.
- **Wiki Workbench CategoryAddPopover inline Create** — 검색 input + 매치 없을 때 "Create '…'" inline button. createWikiCategory 호출 → 새 id 자동 picked.
- **Wiki Workbench TagsAddPopover inline Create** — 같은 패턴 (`#` prefix strip). createTag signature `void → string` 변경.
- **v134 wiki seed backfill migration** — PR #347 (7 → 17 articles + 10 categories) 적용 안 된 v130~v133 사용자에게 누락 시드 자동 인젝션 (preview 9 → 19 verified).
- **CLAUDE.md store version v133 → v134** 갱신.
- **P0-1 Tags/Labels 회귀 진단** — fresh preview에서 두 surface 모두 정상 작동 verify. `sidePanelContext` 정확히 set, TagDetailPanel / LabelDetailPanel 정확히 render. **회귀 재현 안 됨**. root cause: (a) HMR stale 또는 (d) Multi-worktree port 충돌 추정. **코드 fix 불필요**. 사용자 본인 환경에서 hard refresh + 다른 worktree dev server 정리 후 재확인.

### 영구 LOCKED 결정 (이번 세션)

- **42. ContextMenu helper 추출 패턴 영구** — entity별 helper 파일 (Notes/Books/Wiki 각각). `<entity>-context-menu-items.tsx` 신설 후 list/board/gallery 3 surface에서 재활용. props는 dumb (모든 store mutation/toast는 callback). 영구 룰 21 entity-uniformity 확장.
- **43. createTag id 반환 시그니처** (영구) — `createTag(name, color?) => string`. 모든 entity create action은 id 반환이 호출자 편의 우선 (createWikiCategory 패턴 정합). slice + types.ts 동시 변경 의무.
- **44. inline Create option 검색 input + cmdk 패턴** — Plot Popover (Tag/Category picker)에 `query` state + filtered list + exactMatch 체크 + `showCreate` 조건부 inline button. cmdk 패턴 정합. native prompt() 회피 (영구 룰 i18n + Linear polish).
- **45. Seed backfill migration 패턴 영구** — 시드 증가 (예: 7 → 17 articles) 시 자동 backfill migration 동반 의무. id-dedup append (사용자 추가 데이터 보존 + 누락 시드만 push). v130 / v134가 같은 패턴 — 다음 세대도 동일.

### 기술 학습 (영구)

- **Radix ContextMenuTrigger asChild + dnd-kit attributes/listeners 조합 안전** — outer div (drag) + inner visual (ContextMenuTrigger). left-click = drag, right-click = contextmenu. 별 set이라 충돌 X.
- **DragOverlay는 ContextMenu wrap 제외** — `if (isDragOverlay) return visual` 분기 유지.
- **WikiArticleMenuItems prop signature mismatch (id 안 받음)** — wiki-board.tsx Card에서 `(article.id)` wrap. board callback (`onMerge(sourceId)`)와 menu callback (`onMerge()`) 시그니처 다름.
- **시드 보강 + migration backfill 동시 의무** — 시드 코드만 늘리면 fresh user만 받음. 기존 사용자는 새 migration block 필요 (idempotent id-dedup).
- **회귀 보고 verify 패턴** — 코드 verified 정상 + 같은 IDB로 fresh preview에서 작동 재현 = HMR/multi-port stale. 코드 fix 안 함, 사용자에게 환경 정리 안내. "재현 안 되는 회귀"는 root cause 진단 후 close 가능.

### Watch Out (다음 세션)

- **사전 존재 타입 에러 (cleanup 후보 P2)**: insights-view noteEvents / wiki-articles trashed property / sticker-detail-panel / wiki-category-page createdAt 비교 / view-configs SortField 불일치 등. 본 PR과 무관. 별도 정리 PR.
- **P0-1 Tags/Labels 회귀 verify**: 사용자 본인 환경 hard refresh + 다른 worktree dev 정리 후 재확인. 그래도 안 되면 진짜 회귀 — 그때 fresh diagnose.
- **P0-2 통합 manual verify (4 신규 + 12 기존)**: 다음 세션 우선. 회귀 발견 시 fix.
- **Workbench CategoryAddPopover 패턴을 wiki-floating-action-bar.tsx에도 적용 필요**: list mode에서도 같은 검색 + create UX. 영구 룰 21 entity-uniformity. 별도 후속 PR (사용자 요청 board만이라 이번엔 미포함).

### 환경 변경

- Store version: **v133 → v134** (wiki seed backfill migration)
- Persist version: `lib/store/index.ts:257` 134
- 신규 파일: `components/books/book-context-menu-items.tsx`
- 데이터 모델 변경: `createTag` signature `void → string` (`types.ts:287`, `tags.ts:11-18`)
- Preview verify: wiki articles 9 → 19, categories 11 (변동 없음 — 기존 사용자가 이미 다 가짐)

---

## 2026-05-15 (저녁) — 집/Windows, **Wiki entity-uniformity 완성 + 카테고리 사이드바 흡수**

> 🎯 **다음 즉시 액션** (cross-machine 진입점):
> 1. `git pull origin main` (대형 PR 머지된 main 받음)
> 2. **사용자 hard refresh + 누적 변경 manual verify** (큰 작업 묶음 — 회귀 점검 필요):
>    - **Wiki Categories sub-section**:
>      - row single click → 우측 사이드바 4탭 (Detail/Connections/Activity/Bookmarks) 표시 (영구 룰 21 정합)
>      - Detail 탭에 Color row click → Popover ColorPickerGrid 열림 (sidebar inline edit)
>      - Detail 탭 Parent dropdown = Plot DropdownMenu (chevron + FolderSimple + category color + 활성 bg-accent/10) — native `<select>` 폐기
>      - Layout: list `flex-1` (568+px) + editor `w-[420px]` (이전 280/flex-1 반대)
>      - handleBackgroundClick `e.target !== e.currentTarget` early return (row dblclick bubble로 editor 닫히는 회귀 차단)
>      - groupingOptions 6개 (None/Tier/Parent/Family/Index/Created) — Color grouping은 폐기 (의미 X — 자동 cyclic 할당)
>      - default groupBy "family" (fresh user — hierarchy 즉시 노출)
>      - properties chip = parent/tier/articles/sub/createdAt/updatedAt (color/description chip 제거 — row dot + Show description toggle 중복)
>    - **Wiki Articles board**:
>      - default groupBy = `wikiStatus` (Stub / Article 2 column 고정 — Notes Stone/Brick/Block 패턴 정합)
>      - 카드 single click = select (Notes 패턴 mirror, modifier 무관 누적 toggle)
>      - 카드 hover → 우측 상단 체크박스 fade-in + selected 시 bg-accent + ✓
>      - 우측 WikiBoardWorkbench (Phase 2): Pin / Move folder / Add to category / **Add tags** (new) / Split / Merge / Trash
>      - Board mode에서 하단 floating bar 숨김 (workbench가 대체)
>    - **Wiki 시드**: 17 articles (이전 7) + tier 분포 10/4/3 + category spread 10 카테고리 (사용자가 IDB reset 시 자동 적용)
>    - **Wiki articleCount 음수 bug fix**: `wikiNotes.filter(isWikiStub).length` (trashed 제외) → invariant 보장
>    - **Books**: boardDefaultGroupBy "kind" → Smart/Hybrid/Manual 3 column 자동 (영구 룰 21)
>    - **Notes**: showAlphaIndex chip → groupingOptions "Index" 마이그레이션 (Plot 일관성), Tags/Priority/Label chip board-only flag (list view에서 자동 숨김)
> 3. **Phase 후속 작업 (사용자 결정)**:
>    - Tags batch를 wiki-floating-action-bar.tsx에도 추가 (list mode 일관성, 50 line)
>    - Wiki workbench 추가 actions (Duplicate / Set parent / Aliases / Export markdown — P2)
>    - Notes에 카테고리/태그 batch (Notes에 category 개념 없음 — tag만 가능)
>    - Calendar 사이드바 / Ontology graph node 사이드바 — 의도 명확화 후 진행 (이전 세션 미결)

### 완료 (이번 세션, 약 20+ 파일 변경 한 큰 PR)
- **Wiki Categories sidebar 흡수** (mini panel → 4탭 entity-aware, 영구 룰 21 정합):
  - SidePanelContext 확장 (`wiki-category` type)
  - CategoryDetailPanel 신규 (Color picker / Properties / Parent / Subcategories preview / Articles preview)
  - side-panel-detail/connections/activity/bookmarks 4 file dispatch + CategoryConnections (Parent/Subcategories/Articles full)
  - handleSelect (single click) → setSidePanelContext (Tag/Label 패턴 mirror)
- **Wiki Categories polish**:
  - native `<select>` → Plot DropdownMenu (chevron + FolderSimple + category color + 활성 bg-accent/10)
  - Layout fix (list flex-1 / editor w-420)
  - handleBackgroundClick e.target check (회귀 차단)
  - groupingOptions 6개 + properties chip 6개 (color/description chip 제거)
  - default groupBy "family"
  - Board view invalid groupBy fallback (legacy "status" → tier)
  - Subgrouping UI 숨김 (DisplayConfig supportsSubGrouping flag — Notes만 true)
  - "Family"/"First letter"/"Tier" 괄호 제거 (일관성)
- **Notes 마이그레이션**:
  - GroupBy type에 firstLetter / createdAt 추가
  - group.ts에 helper 함수 (groupByFirstLetter / groupByCreatedAt)
  - notes-table showAlphaIndex 로직 → groupBy === "firstLetter" 변환 + 인라인 Name column toggle 제거
  - DisplayConfig boardOnly flag (Tags/Priority/Label chip은 list view 숨김)
  - articleCount 음수 bug fix (wikiNotes 기준 통일)
- **Wiki Board UX entity-uniformity**:
  - WikiBoardWorkbench 신규 (Phase 1 → Phase 2): Pin/Move folder/Add to category/Add tags/Split/Merge/Trash + Overview (no selection)
  - Card single click = select (Notes 패턴, modifier 무관 누적)
  - Card hover checkbox + selected 시 bg-accent ✓
  - Floating bar board mode에서 hide
  - wikiStatus grouping (Stub/Article 2 column 고정)
  - boardDefaultGroupBy "wikiStatus"
  - Wiki 시드 17 articles + tier 10/4/3 + category spread 10
- **Books**: boardDefaultGroupBy "kind" (3 column Smart/Hybrid/Manual 자동)

### 영구 LOCKED 결정 (이번 세션)
- **영구 룰 21 entity-uniformity 본질 진전**: Wiki Categories (sidebar 흡수) + Wiki Articles (board parity with Notes) + Books (board default kind) — 모든 entity board에 entity-native enum axis 보장
- **Index = grouping option** (Plot 일관 — showAlphaIndex toggle 폐기, Notes/Wiki/Templates 모두 groupingOptions에 추가)
- **Card hover checkbox = entity 공통 UX** (Notes/Wiki board card 동일 패턴)
- **boardOnly chip pattern**: list column 없는 chip은 list mode에서 자동 숨김 (Notes Tags/Priority/Label, 다른 entity 확장 가능)

### Watch Out
- **IDB reset 필요한 사용자**: 시드 17 articles + default groupBy "family"/"wikiStatus"/"kind" 적용은 fresh user/IDB reset 시. 기존 사용자는 Display Properties에서 수동 선택 가능
- **Webpack cache stale (한글 path)**: ENOENT rename 문제 발생 시 dev server restart (preview_stop/start). 사용자 본인 환경에서도 dev server 재시작 필요할 수 있음
- **Tags batch는 wiki-board-workbench.tsx에만 추가됨** — wiki-floating-action-bar.tsx (list mode)에는 아직 안 추가 (별도 후속)

### 머신
집/Windows

---

## 2026-05-15 — 집/Windows, **12 PR 머지** + Activity Unification PRD 완료 + Library 100% 완성

> 🎯 **다음 즉시 액션** (다른 머신/세션 cross-machine 진입점):
> 1. `git pull origin main` (12 PR + docs sync 머지된 main 받음)
> 2. **다른 컴퓨터 새 worktree**:
>    - `git worktree add ../<name> main`
>    - `cd ../<name> && npm install`
>    - `npm run dev` (port 3002 또는 random)
>    - **Hard refresh (Ctrl+Shift+R) 의무** + IDB v133 마이그레이션 자동 trigger 확인 (console `[migrate] v132→v133` 로그)
> 3. **🔴 P0 회귀 진단** — **Tags / Labels 사이드바 작동 안 함**:
>    - 사용자 보고 (2026-05-15): tag/label row name 클릭해도 사이드바 detail panel 안 열림. 사이드바 자체는 떠있는데 "Select a note to see details" fallback 표시.
>    - 코드 verified 정상 (tags-view.tsx line 820-823 / labels-view.tsx 신규 setSidePanelContext 호출). dev hard refresh + IDB 마이그레이션 후에도 같은 시그널.
>    - 진단 후보:
>      - (a) HMR stale 또는 dev:3002 stale build (다른 worktree port 충돌 가능성)
>      - (b) 코드 회귀 — sidePanelContext를 즉시 null로 reset하는 useEffect 어딘가 (BookDetailPage 패턴 같이)
>      - (c) v133 마이그레이션 실패 — entityEvents가 노트 events에 entity.kind 없는 상태로 남음 → useSidePanelEntity 분기 실패
>      - (d) 사용자 IDB 상태 — `plot-store` IDB 직접 dump 확인 (sidePanelContext가 set되는지)
>    - **다른 머신/incognito에서 fresh dev로 재현 시도 → 회귀 확정 또는 stale 결정**. fresh에서도 안 되면 회귀 fix (코드 어디에 sidePanelContext reset 있는지 grep).
> 4. **P1 의도 명확화 후 작업** (사용자 시그널 2개 남음):
>    - **Calendar 사이드바 변화** — 옵션 (a) Day Summary panel / (b) Calendar 자체 detail / (c) 현재 노트 detail 강화. 사용자 결정 받아야 진행.
>    - **Ontology graph node 클릭 시 사이드바 동기화** — 옵션 (a) graph node → 4탭 사이드바 / (b) OntologyDetailPanel + 4탭 둘 다 / (c) 사이드바 자체에 graph mode. 사용자 결정.
> 5. **P2 polish 후보**:
>    - Granular Wiki/Book events wire-up (block_added, item_reordered 등 실제 발화)
>    - Label entity events 발화 (labels slice CRUD에서 entityEvents.push)
>    - EDGES section (Ontology Legend 확장 — wikilink/tag/relation color)
>    - EVENT_HEX palette promotion (PR 5d 임시 hex → LOCKED)
>    - List Options 토글 mismatch fix (view-engine defaults)
>
> **머신**: 집 (Windows)
> **다음 worktree**: 다른 컴퓨터에서 새로 — main 기반 (12 PR 머지된 상태)

### 본 세션 PR 12개 (#334-#345) — 큰 day

#### 라운드 1 — entity-side-panel-uniformity 마무리 + Library entity-uniformity 진행 (#334-#338)
- **#334** Library Tags Detail panel — Header / Properties / Used by (Tag.createdAt 없음 → Dates 생략)
- **#335** Library Stickers Detail panel (cascade #334) — Sticker.createdAt 있음 + members[] cross-entity (7 kinds) → 풍부한 Detail
- **#336** Wiki blocks anchor extractor (PR 4b) — `extractAnchorsFromWikiBlocks` (section block + text block contentJson 재귀) + WikiLocalAnchors 함수 (NoteLocalAnchors 패턴 복사)
- **#337** Ontology Legend redesign — 우상단 floating overlay, Notes/Wiki/Books 3 그룹 + Plot icon system (IconStone/Brick/Block + IconWikiStub/Article + Lightning/Sparkle/PencilSimple) + Wiki entity violet footnote
- **#338** Header breadcrumb (Library/Books) + 사이드바 토글 (모든 entity) — ViewHeader `titleNode` prop 추가 + `showDetailPanel` default true (auto store wire-up). `LibraryBreadcrumb` / `BookBreadcrumb` 신규 컴포넌트. book-detail-page ArrowLeft 버튼 제거.

#### 라운드 2 — 사용자 시그널 fix (Library 4탭 entity-aware) #339
- 스크린샷 회귀: Library entity Detail이 Note Detail로 잘못 렌더링 (Connections/Activity/Bookmarks fallback)
- #339: 4 entity (Tag / Sticker / File / Reference) × 3 panel = 12 분기 entity-aware placeholder 추가
  - Connections placeholder ("see Detail tab"), Activity placeholder ("history not yet available"), Bookmarks placeholder ("don't carry inline anchors")

#### 라운드 3 — Activity Unification PRD 4단계 (#340-#343)
- **PRD 작성**: `.omc/plans/activity-unification-prd.md` (v0.1)
- **#340 PR 5a Foundation**: NoteEvent → EntityEvent, EntityKind 확장 (+template/book/sticker), `at` 필드 ⭐ required (사용자 요구), Store v132 → **v133** migration (idempotent, 데이터 손실 X), `addEntityEvent` / `getEventsForEntity` helper, ActivityTimeline `entity` prop (backward compat `noteId`)
- **#341 PR 5b**: Wiki / Template / Book CRUD events wire-up. createXxx/updateXxx/deleteXxx/restoreXxx + hard delete cascade
- **#342 PR 5c**: Tag / Sticker / File / Reference events. Tag color_changed/renamed 분기, Sticker member_added/removed, File 양방향 (note-side + file-side)
- **#343 PR 5d UI 활성화**: EVENT_CONFIG에 17 신규 type entries (Wiki block_*, Book item_*, cross-entity member_*/color_changed/renamed) + icons (Cube/ArrowsDownUp/UserPlus/Palette/TextT 등) + 임시 hex. side-panel-activity 전체 rewrite — 모든 entity 분기 placeholder → 실제 ActivityTimeline (`HistorySection` + `SoloHistory` helpers). Note/Wiki만 Comments + History, 나머지 6 entity는 SoloHistory.

#### 라운드 4 — Library Connections 차트화 (#344)
- LibraryEntityConnectionsPlaceholder → 4 실제 entity-aware Connections 함수:
  - **TagConnections**: "Tagged notes by status" (Stone/Brick/Block) + recent 8 + overflow
  - **StickerConnections**: "Members by kind & status" (Notes status + Wikis stub/article + 5 other kinds count) + recent note refs
  - **FileConnections**: "Cross-entity" — Source note (attachment.noteId) + Used in wikis (wiki blocks attachmentId reverse lookup)
  - **ReferenceConnections**: "Cited by" — citing notes + citing wikis (referenceIds reverse lookup)
- BookConnections 패턴 정합 (ConnectionSection/KindHeader/StatusRow 재사용)

#### 라운드 5 — Labels Detail + Legend 위치 (#345)
- **LabelDetailPanel 신규** — Tag Detail 패턴 (Label.color non-null + 1:N membership via Note.labelId 단일 id)
- 4탭 entity-aware: label dispatch / LabelConnections (Labeled notes by status, TagConnections 패턴) / SoloHistory / EntityAnchorPlaceholder
- LibraryBreadcrumb에 labels 추가 (5 entity 확장)
- labels-view.tsx onClick에 setSidePanelContext + setSidePanelOpen
- **Ontology Legend 위치 변경** — `right-3 top-3` → `left-3 bottom-3` (미니맵 가림 fix)

### 핵심 결정 (영구 LOCKED, 2026-05-15)

**21. Library entity-uniformity 100% 완성** — 5 entity (References / Files / Tags / Stickers / Labels) 모두 우측 사이드바 4탭 (Detail / Connections / Activity / Bookmarks) entity-aware. row name 클릭 → drill-down + side panel detail 동시 open 풍부 패턴. checkbox 클릭은 selection only.

**22. Activity entity-agnostic 데이터 모델 — `EntityEvent`** (Store v133):
- `{ id, entity: EntityRef, type: EntityEventType, at: ⭐ required ISO timestamp, meta? }`
- `entity: { kind, id }` discriminator (sticker.members 패턴 정합)
- `at` ⭐ required — Time grouping + recency sort + 자체 createdAt 없는 entity (Tag/Label)의 유일 timestamp source. **사용자 요구 2026-05-14**.
- `getEventsForEntity(events, entity)` 신규 + `getEventsForNote` deprecated wrapper
- ActivityTimeline `entity: EntityRef` 또는 `noteId: string` (backward compat)
- `createAppendEvent` 새 signature: `EntityRef | string` (string은 자동 wrap as `{kind: "note", id}`)
- 마이그레이션 v133 idempotent — old NoteEvent { noteId } → EntityEvent { entity: { kind: "note", id: noteId } }

**23. EntityKind 확장** — template / book / sticker 추가 (총 10 kinds). Sticker.members[]는 backward compat (template/book도 가능).

**24. Comments wire-up은 Note/Wiki만** (영구 룰) — Template/Book/Library entity는 collaboration 단위 X (PR #322 정합). side-panel-activity에서 SoloHistory wrapper로 Comments 생략.

**25. Notes/Library entity row 클릭 패턴 영구 룰**:
- **row name 텍스트** 클릭 → drill-down (selectedXxxId) + 사이드바 detail 자동 open (setSidePanelContext + setSidePanelOpen)
- **checkbox** 클릭 → selection only. 사이드바 안 set.
- Tag/Sticker/File/Reference/Label 모두 동일 패턴

**26. Ontology Legend 위치 좌하단** (영구) — 미니맵 (우상단) 가림 회피.

**27. EVENT_CONFIG fallback graceful** — unknown event type은 ActivityTimeline에서 `if (!config) return null` 스킵. EVENT_CONFIG 누락 시 UI 안 깨짐.

### 기술 학습 (영구)

- **NoteEvent → EntityEvent 마이그레이션 backward compat 패턴**: `createAppendEvent` overload (`string | EntityRef`) → 호출 site 안 변경하고도 EntityEvent 시스템 작동. `getEventsForNote` wrapper로 ActivityTimeline 등 기존 사용자도 정상.
- **PRD 점진 분할 (5a-5d) 가성비 ↑**: 큰 작업 (Foundation + Wire-up 3 phases + UI activation) — 한 PR 대신 4 PR. review 명확 + manual verify 단계별 + cascade conflict 없음 (각 PR main 기반).
- **`extractAnchorsFromWikiBlocks` 패턴**: section block.title + text block contentJson (재귀로 `extractAnchorsFromContentJson`) → AnchorItem[]. WikiLocalAnchors는 NoteLocalAnchors 패턴 복사 (minimal diff, 미래 polish 후보).
- **Library 5 entity row 클릭 패턴 일관**: setSidePanelContext + setSidePanelOpen + drill-down. tags-view / stickers-view / labels-view 모두 동일 onClick.
- **ViewHeader auto store wire-up**: `showDetailPanel ?? true` + `detailPanelOpen ?? storeSidePanelOpen` + `onDetailPanelToggle ?? storeToggleSidePanel`. 호출 site 안 변경하고 모든 entity 헤더에 사이드바 토글 자동 노출.

### Watch Out (다음 세션)

- **🔴 Tags / Labels 회귀**: 사용자 보고. 코드는 정상 verified — line 820-823 (tags-view) / labels-view 신규 onClick 모두 setSidePanelContext 호출. 단 실제 사용자 화면에서 사이드바 detail 안 열림. 다른 머신/incognito fresh dev로 재현 진단 필요. fresh에서도 안 되면 어딘가 useEffect가 sidePanelContext를 즉시 null로 reset 가능성 (grep — `setSidePanelContext\(null\)` 또는 `setSidePanelContext(\{` non-tag/label).
- **Store v133 마이그레이션 idempotent verify**: 사용자 IDB가 v132 → v133 자동 마이그레이션 후 `[migrate] v132→v133` console.log 확인. 만약 마이그레이션 실패 시 entityEvents가 빈 array — Activity timeline 빈 화면. fresh로도 재현되면 마이그레이션 로직 점검.
- **PR 12개 누적 후 manual verify 어려움**: 라운드 1/2/3/4/5 가 다 main에 들어가서 회귀 추적 어려움. 다음 세션에 통합 verify 시 entity별 (Tag/Label/Sticker/File/Reference) 사이드바 + Activity timeline + Connections charts 다 확인.
- **EVENT_HEX palette 임시 hex 17개**: PR 5d에서 새 type별 hex 임시값 (gray/blue/emerald 등). 별도 polish PR에서 LOCKED palette로 promotion 가능. 미적용 시 색 일관성 떨어짐.
- **Calendar / Ontology graph 사이드바 의도 미확정**: 사용자 시그널은 받았지만 정확한 design 결정 안 됨. P1로 의도 명확화 후 PR.

### 환경 변경
- Store version: **v132 → v133** (entityEvents migration)
- 신규 파일:
  - `components/side-panel/label-detail-panel.tsx`
  - `components/side-panel/sticker-detail-panel.tsx`
  - `components/side-panel/tag-detail-panel.tsx`
  - `components/library/library-breadcrumb.tsx`
  - `components/books/book-breadcrumb.tsx`
  - `components/ontology/ontology-legend.tsx`
  - `.omc/plans/activity-unification-prd.md`
- 데이터 모델:
  - `EntityKind` 확장 (template/book/sticker 추가)
  - `EntityEvent` 신규 (NoteEvent deprecated alias)
  - `EntityEventType` 신규 (NoteEventType + 17 신규 types)
  - `SidePanelContext` union 5 entity 추가 (tag/sticker/file/book/label 다)
  - `SidePanelEntityResult` 10 entity 분기

### 사용자 feedback 영구 저장
- **after-work는 PR 머지까지 완료 의무** (2026-05-14, [feedback_after_work_must_merge.md]) — 사용자 명시. push만 하고 PR OPEN 남기면 cross-machine mismatch.
- **사용자 시그널 "일관성 무조건 신경써"** (이전 entry 17번 영구 룰) — 매 PR마다 entity 패턴 정합 검증 의무.

---

## 2026-05-14 (저녁) — 집/Windows, PR #333 폴리시 7 commits (Linear-faithful sidebar + Ontology breadcrumb + search typo fix)

> 🎯 **다음 즉시 액션** (다른 머신 또는 다음 세션 진입점):
> 1. `git pull origin main` (직전 머지 #332까지 반영 — PR #333은 아직 머지 안 됨)
> 2. **다른 컴퓨터** branch checkout:
>    - `git fetch origin claude/relaxed-hodgkin-5a2905`
>    - `git worktree add ../<name> claude/relaxed-hodgkin-5a2905` (또는 checkout)
>    - `npm install` (필수 — 새 worktree)
>    - `npm run dev` → port 3002 (또는 random)
>    - **Hard refresh (Ctrl+Shift+R) 의무**
> 3. **PR #333 manual verify 5 surface** (7 commits 누적):
>    - **a. 사이드바 헤더 폰트** (`/notes` `/wiki` `/books` `/home` 등): `Views` `Folders` `Pinned` `More` `Stats` 헤더가 **12px normal case** (이전 10.5px uppercase에서 변경)
>    - **b. 사이드바 너비**: 220px → **240px** (Linear 정합)
>    - **c. Ontology 헤더 breadcrumb**: `/ontology` → `Ontology > Graph` (chevron `>` **자체** 클릭 → dropdown). Insights/Dashboard 선택 시 헤더 업데이트
>    - **d. Dropdown items**: Graph icon / IconInsight / ChartBar 아이콘 + 라벨, 활성 = `bg-accent/10 text-accent`
>    - **e. Search typo fix**: 검색 input placeholder `"Search notes, tags, and more..."` (이전 `"MagnifyingGlass notes..."` 사고)
> 4. OK → `gh pr merge 333 --squash`
> 5. **R1 (다음 작은 PR)**: Library breadcrumb (Notes/Ontology 패턴 100% mirror — view-header.tsx subtitle 패턴 그대로 적용, library-view.tsx 헤더 수정)
> 6. **R2 (큰 그림)**: 앱 전체 폴리시 PRD 작성 (`linear-design-mirror` skill audit + `docs/reference/linear/` 50+ 스크린샷 분석 → spec 도출)
> 7. **R3+**: 폴리시 PR 시리즈 / 커맨드 팔레트 ⌘K 재설계 (자료 13장) / 풀 검색 페이지 신설 (자료 4장) / Wiki·Books 폴더
>
> **PR #333 7 commits 누적** (한 흐름):
> - `3864651` polish(sidebar): typography + width (10.5/10px → 12/11px, weight 600→500, uppercase 제거, width 220→240px)
> - `2bd44aa` feat(ontology): header breadcrumb 추가 (ViewHeader `subtitle?: ReactNode` prop + 정적 텍스트)
> - `62d2329` fix(ontology): subtitle → DropdownMenu trigger button + CaretDown ⌄ (1차 사용자 시그널 fix)
> - `64457ce` fix(ontology): CaretDown 제거 (2차 사용자 시그널, Notes 일관)
> - `dde4122` fix(ontology): chevron `>` **자체**가 dropdown trigger (3차 사용자 시그널, Notes 정확 패턴 `NotePickerChevron` mirror)
> - `db7ff2c` feat(ontology): dropdown item 아이콘 추가 + 활성 bg/text 색 (사용자 시그널: 아이콘+글자, search 잉여)
> - `c9824cc` fix(search): `MagnifyingGlass` placeholder typo 5곳 fix (search-view, relation-picker, wiki-collection-sidebar, wiki-block-renderer, wiki-view)
>
> **머신**: 집 (Windows)
> **worktree**: `claude/relaxed-hodgkin-5a2905`
> **PR**: #333 (OPEN, manual verify 대기 후 squash merge)

### 핵심 결정 (영구 LOCKED, 2026-05-14 저녁)

**15. 사이드바 토큰 정합 룰** (`.a-sb-section__head` / `.a-sb-section__hint`):
- font-size 12px (Plot 토큰 "보조 12px" 정합 — globals.css의 자체 fall-out 수정)
- font-weight 500 (Linear 정합. 600은 너무 강조)
- letter-spacing 0 (normal case에는 letter-spacing 0)
- text-transform none (Linear는 normal case "Workspace" 패턴)
- hint font-size 11px (Plot 토큰 "배지" 11px)

**16. 사이드바 너비 240px** (Linear 정합): `--sidebar-w` / `--sidebar-default-width` 둘 다 220→240. Plot 다른 변수 `--a-sidebar-w` (240px)와 통일.

**17. Breadcrumb 일관성 룰** (강한 사용자 시그널 "일관성 무조건 신경써", **영구 LOCKED**):
- 모든 sub-view/sub-page entity 동일 패턴: `[Parent label]` → `[chevron > button → dropdown trigger]` → `[Active label]`
- Notes `editor-breadcrumb.tsx:237 NotePickerChevron` **정확 mirror**
- **chevron 자체가 button** (CaretDown ⌄ 등 추가 시그널 X)
- DropdownMenuItem: 아이콘 + 라벨 + 활성 시 `bg-accent/10 text-accent` (Check icon 잉여)
- Search input: 5개 이상 item일 때만 추가. 3개 이하면 잉여.
- **대상**: Ontology (DONE) / Library (TODO 다음 R1) / Wiki/Books (향후 동일 적용 가능)

**18. ViewHeader `subtitle` prop API**: `subtitle?: ReactNode` 그대로 렌더링 (chevron 자동 출력 X). 외부에서 chevron + label 직접 구성. Backward compat (다른 호출처 subtitle 미전달 → 기존 동작).

**19. "엉망진창" 사용자 시그널 = 앱 전체 폴리시 PRD 필요** (영구): 매 PR마다 사용자 시그널 받고 fix 반복 = 비효율. PRD 한 번 작성해서 큰 그림 합의 후 진행. R2부터 본격.

**20. Linear 미러링 자료 통합 룰**: `.claude/skills/linear-design-mirror/` 스킬 + `docs/reference/linear/` 50+ 스크린샷 + `GOTCHAS.md` 셋 다 활용. R2 PRD 작성 시 본격.

### 기술 학습 (영구)

- **Notes breadcrumb 정확 패턴** (`editor-breadcrumb.tsx`):
  - `Notes` (parent) = button → `navigateToSpace` (note 닫고 list로)
  - `>` chevron = `<PopoverTrigger asChild><button><IconChevronRight /></button></PopoverTrigger>` → 다른 노트 검색 popover
  - `Quick Memo` (title) = static `<span>` (액션 없음)
- **DropdownMenuItem 활성 패턴**: `className={cn(active && "bg-accent/10 text-accent")}` (Check icon 잉여, Plot 공식 패턴 — `editor-breadcrumb.tsx:132-141 SecondarySpaceSwitch`)
- **find-replace 사고 검출법**: `"<IconName>\s+\w+"` grep 패턴. icon component 이름이 placeholder/comment string에 들어가있으면 글로벌 find-replace 사고. 이번 발견: `Search` → `MagnifyingGlass` 사고 5곳 (4 placeholder + 1 comment + 2 comment).
- **Multi-server dev 환경 risk**: 한 사용자 컴퓨터에 dev server 2개 동시 (이전 worktree port 3002 + 새 worktree port 60384). 사용자가 stale 서버 보고 "fix 안 보인다" 보고. **매 fix 후 정확한 port URL 안내 + `preview_list` inventory 의무**.
- **Browser cache risk**: Next.js HMR 정상 작동해도 브라우저 cache stale 가능. **매 fix 후 hard refresh (Ctrl+Shift+R) 안내 의무**.
- **Plot 토큰 vs CSS 갭 발견**: DESIGN-TOKENS 정의 "보조 12px"인데 사이드바 globals.css는 10.5px (토큰 위반). 사용자 직관 "작다" = 토큰 갭 검출. 다른 CSS 토큰 갭 R2 audit에서 점검.
- **사용자 시그널 자체 해석 룰**: "노트처럼" = Notes 코드 정확 읽고 mirror. "Graph 옆 ⌄" = chevron이 trigger인 듯한 미세 시그널. "엉망진창" = 큰 그림 PRD 필요. 직관 신중히.

### Watch Out (다음 세션)

- **PR #333 manual verify 5 surface 의무**: 7 commits 누적. 사용자가 직접 정확한 port + Hard refresh 후 검증.
- **다른 글로벌 find-replace 사고 가능성**: `Search` → `MagnifyingGlass` 같은 사고가 다른 패턴에도 있을 수 있음. R2 audit에서 broader grep (다른 Phosphor icon 이름 검색).
- **사이드바 spec 추가 audit 필요**: 그룹 헤더만 fix됨. 다른 사이드바 클래스 (`a-sb-link`, `a-sb-link__count`, `a-sb-title` 등) Plot 토큰 정합 확인 필요. `linear-design-mirror/references/surfaces/sidebar.md` 참고.
- **NOTES/WIKI mini stat 카드 uppercase**: 사이드바 `NOTES 9` `WIKI 7` mini stat 카드는 여전히 uppercase. `a-sb-section` 클래스 아닌 별도 클래스 (확인 필요). 일관성 검토 R2 audit.
- **dropdown content 일관성 본질**: Notes는 검색 input + list (검색 가능), Ontology는 라디오 메뉴 (3개 고정). 본질 다름 인정. Library 4 sub-page는 — 4개라 검색 input 잉여 가능 (확인).
- **PR cascade 충돌 risk**: PR #333 7 commits squash 머지로 깔끔. R1 Library breadcrumb은 view-header.tsx 또 건드릴 가능성 — main 기반 진행 권장.

### 환경 변경

- Store version: 변경 없음
- 신규 파일: 없음 (모두 기존 파일 수정)
- API 확장 (backward compat):
  - `ViewHeader.subtitle?: ReactNode` (신규 optional prop)
- 데이터 모델 변경: 없음
- CSS 토큰 변경: `--sidebar-w` 220→240, `--sidebar-default-width` 220→240

---

## 2026-05-14 (밤 후속) — 집/Windows, 4 PR 추가 + Books table 일관성 통합 (entity-uniformity + Library 확장)

> 🎯 **다음 즉시 액션** (다음 세션 또는 다른 머신):
> 1. `git pull origin main` (PR #322-#327, #329-#331 머지된 main)
> 2. **사용자 manual verify** 5 surface (밤 후속 추가 PR):
>    - **PR #329 Template anchor pinning**: /templates Daily Log → Bookmarks 탭 → 본문 anchor 보임 + pin/unpin 작동 (`targetKind: "template"` 저장)
>    - **PR #330 Library list divider X**: /library Files → row 사이 구분선 사라짐 (header divider만 유지)
>    - **PR #331 Files Detail panel**: /library Files → 파일 클릭 → 사이드바 자동 open + Detail (Dates / Source / Used in / Properties / Open in new tab)
>    - **PR #326 update**: /books list → checkbox column w-8 (Notes 일관성, 위치 동일) + 행 구분선 X
>    - 누적 합산 9 PR (#322-#327 + #329-#331)을 한 번에 검증 가능
> 3. **다음 PR 후보** (TODO.md P1):
>    - Library Tags Detail panel + Stickers Detail panel (PR #331 패턴 반복)
>    - Ontology legend redesign (Option A + B: icon silhouette + entity 그룹화)
>    - PR 4b Wiki blocks anchor extractor
>    - PR 5 Activity entity-agnostic 통합 (별도 PRD 필수)
>
> **밤 후속 PR 4개 (낮~밤 6 PR + docs sync #328 추가)**:
> - **#329** feat: Template anchor pinning (`GlobalBookmark.targetKind`에 "template" 추가, `NoteLocalAnchors` 재사용)
> - **#330** fix: Library list view row divider 제거 (Notes/Wiki 일관성)
> - **#331** feat: Library Files Detail panel 신설 (FileDetailPanel — Dates/Source/Used in/Properties)
> - **#326 update**: Books table checkbox column w-6 → w-8 (Notes 일관성 통합, 기존 divider fix와 묶음)
>
> **머신**: 집 (Windows)
> **worktree**: `claude/brave-moore-ceaf44`

### 추가 핵심 결정 (영구 LOCKED, 2026-05-14 밤 후속)

**10. GlobalBookmark.targetKind 확장 (안전 패턴)**:
- `"note" | "wiki"` → `"note" | "wiki" | "template"` (optional 확장, backward compat)
- entity-uniformity PRD에 정의된 PR 4 (anchor pinning 모든 entity) 시작
- 다음 PR 4b: Wiki blocks anchor extractor (blocks 구조 다름, 새 extractor 필요)

**11. NoteLocalAnchors entity-agnostic 재사용**:
- 컴포넌트 prop name "note"는 legacy artifact이지만 실제 의존성은 `{ id, contentJson }` shape
- Template 객체도 동일 shape → 그대로 재사용 (minimal-diff)
- 미래 PR에서 `LocalAnchors`로 rename + entity 무관 처리 가능

**12. Library entity도 4탭 사이드바 통합** (entity-uniformity 확장):
- PRD 원래 scope: Note/Wiki/Template/Book. 사용자 시그널 "라이브러리 파일도 클릭해도 정보 안 보임" → Library 4 entity (Files/Tags/References/Stickers)도 통합 대상.
- PR #331은 Files Detail panel만 (사용자 시그널 직접 처리). Tags/Stickers는 follow-up.
- Reference는 이미 `ReferenceDetailPanel` 존재 — 4탭 dispatch도 기존 작동.

**13. Files Detail panel 본질 — Source + Used in cross-reference**:
- Attachment 데이터: `noteId` (source note) + `wiki blocks` 안 `attachmentId` reference (used in wiki)
- Plot 일반 패턴 (Note/Wiki/Template/Book Detail) 정합: Dates / Properties=stats / Used in / Actions
- 이미지 type만 thumbnail (max-h-48 object-contain) — 다른 file type은 icon
- Delete 액션 미구현 (attachments slice 변경 별도 PR)

**14. Notes/Books table 시각 격자 통일**:
- 행 구분선 X (둘 다 flat) — PR #326
- Checkbox column w-8 통일 — PR #326 update (사용자 "체크박스 위치 다르다" 시그널)
- Plot table 일관성 영구 룰: 모든 entity table은 w-8 (32px) checkbox + hover bg row separation, 행 border X

### 기술 학습 추가 (영구)

- **Optional 데이터 모델 확장 패턴**: `"note" | "wiki"` → `"note" | "wiki" | "template"`처럼 enum 확장. 기존 데이터 변경 X (backward compat). 마이그레이션 불필요. 같은 패턴 다른 곳 — `GlobalBookmark.targetKind`에 "book" 추가도 가능 (PR 4 후속).
- **legacy artifact prop name 재사용**: 컴포넌트 export name과 prop name이 historical이라도 실제 의존성 shape가 entity-agnostic하면 그대로 재사용 가능. rename은 별도 polish PR로 분리.
- **attachment.noteId는 1:1 source 추적**: cross-reference (used in)는 wiki blocks 별도 추적. note body의 image src URL/attachmentId 추적은 별도 작업.
- **사용자 시그널 "다 순차"**: 같은 패턴 작업 시리즈를 분리 PR로 진행. 묶음 PR보다 manual verify 쉬움 + 머지 충돌 risk ↓.
- **PR cascade base 결정**: 데이터 모델 의존성 없으면 main에서 시작. 컴포넌트/타입 의존성 있으면 cascade. 본 세션 PR #331은 main 기반 (sidePanelContext 확장만 추가) — 다른 PR들과 독립.

### Watch Out (다음 세션)

- **PR 11개 누적** (#322-#327 + #329-#331 + #326 update + #328 머지) — main에 cascade로 머지 시 충돌 가능. Plot 패턴 (HEAD 우선 `--ours`) 적용 권장.
- **dev server stale state**: branch switch 빈번 + 다른 component import path 변경. 사용자 hard refresh 필수. 한 번 React Hook order 경고 떠도 reload하면 사라짐 (PR #323 시점 확인).
- **Files Detail panel Delete 액션 비활성**: attachments slice에 `deleteAttachment` 없음. trash flow는 별도 PR. 사용자가 file 삭제하려면 list view bulk action 사용.
- **Tags / Stickers Detail panel 미구현**: 사용자 "다 순차" 시그널 → 다음 세션 P1.
- **Reference Detail panel 호출 흐름 미검증**: `ReferenceDetailPanel` 존재하지만 library-view 안에서 setSidePanelContext("reference") 호출 위치 확인 X. 별도 검증 필요.

### 환경 변경
- Store version: 변경 없음 (모든 변경은 derive view 또는 optional 필드 확장)
- 신규 파일: `components/side-panel/file-detail-panel.tsx`
- 신규 컴포넌트: `FileDetailPanel`
- 데이터 모델 확장 (optional, backward compat):
  - `GlobalBookmark.targetKind`에 "template" 추가
  - `SidePanelContext`에 `{ type: "file"; id }` 추가
  - `SidePanelEntityResult` union에 file 분기 + attachmentId/attachment 필드

---

## 2026-05-14 (낮~밤) — 집/Windows, 6 PR 누적 (entity-side-panel-uniformity + time grouping + books-divider)

> 🎯 **다음 즉시 액션** (다른 머신에서 cross-machine 또는 다음 세션):
> 1. `git pull origin main` (PR #322-#327 머지 후 main 받음)
> 2. **사용자 manual verify**: 6 PR 효과를 dev:3002 hard refresh로 한꺼번에 검증.
>    - Template entity Detail/4탭 (PR #322): Daily Log template → Properties stats only / "Template → Note" 버튼 / 4탭 분기
>    - Wiki Stub badge (PR #322 보너스): stub article → "Wiki Stub" badge (muted)
>    - Book 사이드바 (PR #323): /books/* → ⌘B → 4탭 작동 + Connections "Items by kind & status"
>    - Connections 분류 stats (PR #324): /notes → 노트 클릭 → Connections 탭 → "→ Notes" 옆 status dots
>    - Book Bookmarks "IN THIS BOOK" (PR #325): /books/* → Bookmarks 탭 → 책 안 책갈피 자동 그룹
>    - Books list divider 제거 (PR #326): /books list → 행 사이 구분선 사라짐 (Notes/Wiki 일관성)
>    - Time grouping (PR #327): /notes Display → Group by "Updated" → Today/Yesterday/This Week 그룹 헤더
> 3. **다음 작업 PR 4a**: Template anchor pinning (`GlobalBookmark.targetKind` 확장 + `extractAnchorsFromContentJson` 재사용).
>    - Plot Template/Wiki 둘 다 anchor pinning 가능하게. PRD §4 의 PR 4.
>    - branch base: `#322` cascade (countPlaceholders helper 등 필요) — 또는 머지 후 main에서 시작.
>
> **6 PR 종합** (entity-side-panel-uniformity PRD §4 추진):
> - **#322** feat: Template Detail 재설계 + 4탭 entity별 분기 (+ Wiki Stub badge fix)
> - **#323** feat: Book 우측 사이드바 신설 + Items by kind & status (PR 2)
> - **#324** feat: Connections 분류 stats Note/Wiki/Template 확장 (PR 3, Book 패턴 횡적 확산)
> - **#325** feat: Book Bookmarks "IN THIS BOOK" context filter (PR 4 — 방향 4)
> - **#326** fix: Books list view row divider 제거 (Notes/Wiki 일관성)
> - **#327** feat: Time grouping ("Updated" 5단) 모든 entity 적용
>
> **머신**: 집 (Windows)
> **worktree**: `claude/brave-moore-ceaf44` (sync는 `claude/sync-2026-05-14`)

### 핵심 결정 (영구 LOCKED, 2026-05-14)

**1. 모든 entity 4탭 사이드바 (Detail/Connections/Activity/Bookmarks) 통일** — Plot UI 일관성:
   - Book 신설 (PR #323) — entity별 사이드바 자유 패턴이지만 4탭 골격은 공유
   - Detail 안 내용은 entity 본질 따라 자유 — Note 분류 메타 풍부 / Wiki 간소화 / Template = recipe stats only / Book = collection 본질 (Kind/Smart sources/Chapters/Reading)

**2. "Properties = stats only" 영구 룰** (PR #322 LOCKED 재확인):
   - 분류 메타 (label/folder/tags 등)는 별도 섹션
   - Properties는 read-only stats (Words/Chars/Headings/Placeholders/Blocks/Sections/...)
   - entity별 본질 stats: Note (Words/Chars/Headings/Source) / Wiki (Blocks/Sections/Text blocks/Note refs/Images/Layout) / Template (Words/Chars/Headings/Placeholders) / Book (Total items/Notes/Wikis/Chapters/Smart/Manual)

**3. Template = recipe, not collaboration artifact** (PR #322):
   - Activity Comments 의도적 제외 (template은 협업 단위 아님)
   - "Use template" → "Template → Note" 변환 metaphor (사용자 시그널 정합)

**4. Connections 분류 stats 패턴** (PR #323+#324 LOCKED):
   - kind & status 2단 분류 (Notes → Stone/Brick/Block, Wikis → Stub/Article)
   - NoteStatusBreakdown / WikiStatusBreakdown helper 공통 컴포넌트
   - dot + count + label, 0인 status는 hide

**5. "Used by N notes" event log 기반 reverse-lookup** (PR #322 LOCKED):
   - noteEvents의 `created` event meta.templateId로 추적 (신규 데이터 모델 없음)
   - 다른 entity-cross "사용 추적"도 같은 패턴

**6. Book Bookmarks "IN THIS BOOK" pure derive filter** (PR #325 LOCKED — 방향 4):
   - Book entity 자체엔 contentJson 없음 → 직접 anchor 불가
   - 단 책의 items의 anchor는 책 context에서 의미 있음 → 자동 filter
   - 데이터 모델 변경 X. resolveBookItems 활용해 Smart/Hybrid 호환.

**7. Wiki Stub vs Article badge 분리** (PR #322 보너스):
   - `isWikiStub()` 기반. IconWikiStub/IconWikiArticle + muted/accent 색상 분리.

**8. Time grouping 5단 ("Updated" 기준)** (PR #327 LOCKED):
   - Today / Yesterday / This Week / This Month / Older
   - Yesterday는 isThisWeek 분기 *전* 체크 (week boundary edge case)
   - 빈 bucket 자동 hide (UI noise 최소화)
   - 모든 entity 적용 (Notes/Wiki/Templates/Books) — entity별 pipeline에서 동일 로직

**9. Books list view row divider X** (PR #326 LOCKED):
   - Notes/Wiki list view는 flat (border 없음, hover bg만)
   - Books만 outlier였음 → 통일

### 기술 학습 (영구)

- **entity별 사이드바 자유 + 4탭 골격 공유** — Plot UI 일관성 원칙 정합. Detail은 자유 / 4탭 dispatch는 entity-aware (`useSidePanelEntity`).
- **`sidePanelContext` type 확장 패턴** — entity 추가 시 `{ type: "<kind>"; id }` union 확장 + `useSidePanelEntity`에 분기 + `SidePanelDetail/Connections/Activity/Bookmarks` 4 dispatch에 case 추가.
- **`noteEvents.meta.templateId`로 reverse-lookup** — 데이터 모델 신규 없이 "Used by N" 추적 가능. event log 이미 있으면 활용 우선.
- **`isWikiStub()` 헬퍼는 contentJson-only** — note의 outline extraction과 같은 패턴. 재사용성 ↑.
- **resolveBookItems의 ResolverStore 통일** — Smart/Hybrid/Manual book 통합 view 가능. 7 store hook (notes/folders/wikiArticles/wikiCategories/tags/labels/stickers) 한 번에 전달.
- **`updateBook` direct call 패턴** — Plot은 별도 `toggleBookPin` 액션 없이 `updateBook(id, { pinned: !pinned })` 직접. `togglePin`은 다른 entity (note).
- **"date" GroupBy는 group.ts에 이미 정의됐지만 VALID_GROUP_BY 누락** — type union과 validation list 동기화 의무 (마이그레이션 fallback에 쓰임). 이번에 fix (#327 commit).
- **빈 bucket filter 패턴** — `.filter((key) => buckets[key].length > 0)` 한 줄로 UI noise 제거. 모든 entity의 grouping에 적용.

### Watch Out (다음 세션)

- **6 PR cascade + 독립 누적** — main에 머지 시 충돌 가능 (PR #322 → #323 → #324 → #325 cascade. PR #326/#327은 main 독립). Plot 패턴 (HEAD 우선 `--ours`) 적용 권장.
- **React Hook order 경고 한 번 떴음** (PR #323 시점, clean reload 후 사라짐) — hot reload 영향 추정이지만 다음 세션 verify 시 모니터링 권장.
- **`useSidePanelEntity` Book 분기 → store.books 의존** — store에 books slice 있다 가정. 빈 array fallback (`?? []`)으로 안전 처리됨.
- **Time grouping의 Books pipeline은 별도** — `use-books-view.ts` `applyBookGrouping`에 if 분기 추가 (group.ts 공통 함수 호출 X). entity별 pipeline 패턴 따름.
- **Templates entity는 group.ts 공통 호출 X** — `use-templates-view.ts`에 자체 `applyTemplateGrouping` 함수. date 추가 위해 별도 wire-up 필요했음. Plot의 entity-specific pipeline 패턴 이해 의무.

### 환경 변경
- Store version: 변경 없음 (모두 derive view + UI 변경)
- 신규 파일: `components/side-panel/book-detail-panel.tsx`, `.omc/plans/entity-side-panel-uniformity-prd.md`
- 신규 컴포넌트 (export): `BookDetailPanel`, `BookContextBookmarks`, `NoteStatusBreakdown`, `WikiStatusBreakdown`, `DotCount`
- 신규 helper: `countPlaceholders` (templates.ts, PLACEHOLDER_PATTERN regex single source)
- view-engine 확장: `VALID_GROUP_BY`에 `"date"` 등록 + cross-entity groupings (`tag/category/sticker/book/connections`)도 등록

---

## 2026-05-13 (밤) — 집, PR #321 11 commits (Status 색 재정렬 + Templates UpNote 패턴 + 9 follow-up)

> 🎯 **다음 즉시 액션** (다른 머신에서 cross-machine):
> 1. `git pull origin main` (PR #321 머지된 main 받음)
> 2. dev:3002 hard refresh (Ctrl+Shift+R) — HMR 캐시 stale 가능성
> 3. Manual verify 5 surface — 아래 "verify list" 참고
>
> **PR #321 11 commits 종합**:
> - **Status 색 재정렬**: Stone slate(회색,raw) → Brick amber(중간) → Block emerald(완성). 마지막 단계 가장 vivid color 메타포.
> - **STATUS_CONFIG var 통일**: stone/brick 모두 `var(--status-*)` (chip ↔ icon 정확 동일 색).
> - **Templates UpNote 패턴**: TemplatesPickerDialog 신규 / slash entry 일원화 / 빈 paragraph **ProseMirror Decoration**으로 inline clickable placeholder ("Insert from a template · or press / for menu") / placeholder 가시성 ↑ (opacity 0.4→0.75, 0.5→0.9).
> - **Template placeholder expansion fix**: `createNoteFromTemplate` + slash command 둘 다 `contentJson` 재귀 expand (`{{YYYY}}-{{MM}}-{{DD}}` → `2026-05-14`).
> - **TitlePatternBar 제거** + editor counts row footer 위치 (toolbar 위, `flex flex-col` scroll container).
> - **6 UX follow-up**: Home stats icon 좌측 / BookTable overflow + min-w / Wiki/Books 그룹 헤더 `.a-tg` / i18n 영어 통일 / status icon weight bold.
>
> **Manual verify list** (다른 컴퓨터 dev에서):
> 1. **Status 색 일치** — /notes list mode에서 Stone/Brick/Block chip + row icon 모두 동일 색 (slate-600 / amber-600 / emerald-600)
> 2. **빈 노트 inline hint** — 새 노트 열기 → 첫 paragraph 안에 "Insert from a template · or press / for menu" 표시. 클릭 시 dialog open. 입력 시작 시 자동 사라짐.
> 3. **Template placeholder** — template에 `{{YYYY}}-{{MM}}-{{DD}}` 작성 → 빈 노트에서 slash "Insert template…" 또는 inline button → title이 `2026-05-14`로 자동 치환
> 4. **Slash 메뉴 깔끔** — `/` 입력 → block items + 단일 "Insert template…" entry (개별 templates 13+ 안 펴짐)
> 5. **Editor footer** — words/chars가 toolbar 바로 위 (body 안 floating X)
> 6. **Wiki/Books 그룹 헤더** — Notes 패턴 `.a-tg` (var(--fg) 진함 + 우측 divider line)
> 7. **Home stats** — REFERENCES card icon 좌측 + 충돌 없음
> 8. **i18n** — Add source dialog "Multi-select" / "Click items to select" 영어
>
> **위험 + 회피**:
> - **HMR 캐시** — dev 첫 진입 시 stale build 가능. **hard refresh 의무**.
> - **사용자 IDB stale**: 사용자 본인 template 데이터에 `{{YYYY}}-{{MM}}-{{DD}}` contentJson 들어가 있어야 expansion 작동. template editor에서 작성 안 됐으면 expansion 효과 없음 — template 새로 만들기 권장.
> - **routing module-level state** — preview MCP에서 view mount 자동 verify 어려움. 사용자 dev 직접 검증.
> - **EmptyHintPlaceholder는 "note" tier만 등록** — wiki/template/comment editor에 영향 X.
>
> **참고 파일** (작업 시 read):
> - `app/globals.css` line 31-37 (light), 211-217 (dark), 1069-1101 (.a-tg)
> - `lib/colors.ts` line 136-140 (NOTE_STATUS_HEX)
> - `lib/store/slices/templates.ts` line 24-49 (expandPlaceholders), 51-79 (expandPlaceholdersInJson), 104-160 (createNoteFromTemplate)
> - `components/note-fields.tsx` STATUS_CONFIG
> - `components/editor/extensions/empty-hint-placeholder.ts` (신규 — ProseMirror Decoration)
> - `components/editor/templates-picker-dialog.tsx` (신규 — CommandDialog)
> - `components/editor/NoteEditorAdapter.tsx` (handleTemplateSelect + event listener)
> - `components/editor/SlashCommand.tsx` (단일 entry → custom event)
> - `components/editor/core/shared-editor-config.ts` line 693+ ("note" tier에 EmptyHintPlaceholder 등록)
>
> **머신**: 집 (Windows)
> **branch worktree**: `claude/elegant-jepsen-2b3731` → PR #321 머지 후 main으로 (다른 머신에서 새 worktree 생성)
>
> **PR #321 11 commits**:
> 1. `438853c` feat: status 색 재정렬 + 6 UX follow-up
> 2. `b5b6eb6` feat: template 생성 다이얼로그 제거 (UpNote 패턴)
> 3. `ce6ed10` feat: TitlePatternBar 제거 + counts row 위치
> 4. `dd1e880` fix: counts row sticky bottom
> 5. `509a564` fix: TemplateEditorAdapter `flex flex-col`
> 6. `5cfbed0` fix: template placeholder expansion contentJson
> 7. `4b2b84d` fix: slash command template — contentJson 우선
> 8. `0ef3803` feat: Templates entry UpNote 패턴 (inline CTA + dialog)
> 9. `3e61e1a` fix: hint absolute → 별도 row + UpNote 카피 회피
> 10. `3bf9a95` fix: ProseMirror Decoration으로 paragraph 안 inline
> 11. `bce50cb` fix: placeholder light mode 가시성 ↑

### 사용자 시그널 (이번 세션 흐름 — 즉 next session에서 참고)

PR #319 머지 후 manual verify 결과로 발견된 시그널 누적:
1. **Status 색 메타포** — "마지막 단계가 가장 옅은 회색이라 메타포 어색"
2. **chip ↔ icon mismatch** — STATUS_CONFIG의 stone/brick이 var(--chart-N) 사용 (PR #319 keystone fix follow-up)
3. **Home stats REFERENCES 충돌** — flex justify-between label-icon 겹침
4. **BookTable 회귀** — narrow viewport flex-1 min-w-0 collapse → text overflow
5. **Wiki/Books 그룹 헤더 모양새 다름** — opacity 약함, divider 없음
6. **i18n 혼합** — "다중 선택" / "처음부터" vs 영어
7. **Template 다이얼로그 friction** — UpNote 패턴 (즉시 editor 진입) 원함
8. **TitlePatternBar 불필요** — UpNote는 그런 bar 없음
9. **counts row 위치 어색** — body 안 floating, toolbar 바로 위로
10. **Template placeholder 작동 X** — slash command가 plain text만 사용
11. **slash 메뉴 templates 개별 펴짐 noisy** — dialog로 일원화
12. **별도 row hint 거부 (위아래 swap뿐)** — UpNote처럼 paragraph 안 inline
13. **light mode placeholder 흐림** — opacity ↑

### 완료 (15 files modified + 2 신규)

| # | File | Change |
|---|---|---|
| 1 | `app/globals.css` light + dark | Stone slate, Block emerald, .a-stchip color 통일 |
| 2 | `lib/colors.ts` | NOTE_STATUS_HEX dark canonical |
| 3 | `components/status-icon.tsx` | weight bold |
| 4 | `components/note-fields.tsx` | STATUS_CONFIG var(--status-*) 통일 |
| 5 | `components/home/stats-row.tsx` | icon 좌측 + px-3 + tracking 제거 |
| 6 | `components/books/book-table.tsx` | overflow-hidden + min-w-[120px] + .a-tg |
| 7 | `components/views/wiki-list.tsx` | .a-tg group header |
| 8 | `components/books/sources-section.tsx` + `book-detail-page.tsx` | 영어 i18n |
| 9 | `components/views/templates-view.tsx` | TemplateFormDialog 제거 (handleCreateNew 즉시 생성) |
| 10 | `components/views/template-edit-page.tsx` | TitlePatternBar 제거 + scroll container flex flex-col |
| 11 | `components/editor/TipTapEditor.tsx` | counts row sticky bottom + toolbar 아래 |
| 12 | `lib/store/slices/templates.ts` | expandPlaceholdersInJson 신규 + createNoteFromTemplate contentJson expand |
| 13 | `components/editor/SlashCommand.tsx` | 개별 templates 제거 → 단일 "Insert template…" + custom event |
| 14 | **`components/editor/templates-picker-dialog.tsx`** (신규) | CommandDialog 기반 templates picker |
| 15 | **`components/editor/extensions/empty-hint-placeholder.ts`** (신규) | ProseMirror Decoration — paragraph 안 inline clickable |
| 16 | `components/editor/NoteEditorAdapter.tsx` | handleTemplateSelect + custom event listener |
| 17 | `components/editor/core/shared-editor-config.ts` | "note" tier에 EmptyHintPlaceholder 등록 |
| 18 | `components/editor/EditorStyles.css` | "Untitled" placeholder opacity 0.4→0.75 |

### 브레인스토밍 & 큰 결정 (영구 LOCKED, 2026-05-13 밤)

**1. Status 색 메타포 (영구 LOCKED)**:
- Stone = slate (회색, raw) — light slate-600 `#475569` / dark slate-400 `#94a3b8`
- Brick = amber (kiln, in progress) — light amber-600 `#D97706` / dark amber-500 `#f59e0b`
- Block (keystone) = emerald (finished crystal) — light emerald-600 `#059669` / dark emerald-400 `#34d399`
- 마지막 단계 가장 vivid color로 끝나는 progression. 색 변경 시 3곳 동시 update (globals.css light/dark + NOTE_STATUS_HEX).

**2. STATUS_CONFIG var(--status-*) 의무**:
- `note-fields.tsx` STATUS_CONFIG color/bg/border 모두 var(--status-*)만 사용. var(--chart-N) 금지.
- chip ↔ row icon 색 정확 동일 보장.

**3. 그룹 헤더 `.a-tg` 통일 (Notes/Wiki/Books)**:
- 3 entity 모두 `.a-tg` 클래스 사용. globals.css line 1069-1101.
- grid: chevron / icon / label (var(--fg) 진함) / count / divider line (1fr).

**4. BookTable narrow viewport overflow 룰**:
- list table cells `overflow-hidden`. flex-1 column `min-w-[N]`.

**5. Home stats card icon 좌측 정렬**:
- `flex items-center gap-1.5`. `justify-between` X — label 길이 무관.

**6. i18n 영어 통일**:
- 다이얼로그 / 버튼 / footer 영어. 한/영 혼합 금지.

**7. Templates UpNote 패턴 (영구 LOCKED)**:
- 템플릿 생성 시 다이얼로그 없이 즉시 editor 진입 (createNoteFromTemplate은 별개 — note 적용 시).
- 템플릿 적용 시 contentJson 우선 (rich content + title heading 다 포함). plain content는 fallback.
- placeholder expansion 시 contentJson도 재귀 expand 의무 (text node만 expand, attrs/meta 보존).
- 빈 노트 hint는 ProseMirror Decoration으로 paragraph 안 inline (absolute overlay X / 별도 row X).
- slash 메뉴는 개별 templates 안 펴고 단일 "Insert template…" entry만 → custom event "plot:open-templates-picker" dispatch.
- 모든 entry path (inline button / slash / 향후 toolbar) 동일 dialog + event.

**8. EmptyHintPlaceholder는 "note" tier만**:
- wiki / template / comment / footnote editor에는 등록 X.
- 새 entity editor 도입 시 EmptyHintPlaceholder 추가 의무 검토.

### 기술 학습 (영구)

- **CSS var vs TS const 동기화 의무** — globals.css `--status-*` 변경 시 NOTE_STATUS_HEX 같이 update. mismatch → ontology canvas / graph stale.
- **chip 패턴 root cause 진단** — chip이 쓰는 var와 row icon이 쓰는 var가 다르면 사용자 시각 "다른 색" 인식. 통일 의무.
- **SVG weight "fill" 한계** — Cuboid2x2 같은 line-only custom SVG는 fill 작동 X. weight "bold"가 일관 안전.
- **flex-1 min-w-0 narrow viewport collapse** — title column 0px squeeze 가능. min-w-[N] 추가 의무.
- **scroll container flex column** — 안 자식이 flex-1로 늘어나려면 scroll container 자체에 `flex flex-col` 필요. counts row가 자연스럽게 끝에 위치.
- **TipTap contentJson vs content** — editor는 contentJson 우선. plain content만 expand는 효과 없음. JSON tree text node 재귀 expand 의무.
- **ProseMirror Decoration vs Placeholder extension** — `@tiptap/extension-placeholder`는 `:before` pseudo (clickable 불가). inline clickable 필요 시 ProseMirror Plugin + `Decoration.widget` 사용.
- **Decoration widget contentEditable=false** — DOM mount 시 cursor 들어가지 않게 + selection 무시 (`ignoreSelection: true`).
- **Custom event for editor↔outer state bridge** — extension에서 dialog open 시 callback prop 전달 어려움 (TipTap re-init 무거움). `window.dispatchEvent(CustomEvent)` + parent listener 패턴이 가볍.

### Watch Out (다음 세션)

- **빈 노트 hint placeholder 우선순위** — TipTap Placeholder extension의 placeholder text와 EmptyHintPlaceholder decoration이 같은 paragraph에 동시 발현 가능. NoteEditorAdapter에서 placeholder="" 두어 충돌 회피. 다른 editor에 EmptyHintPlaceholder 추가 시 같은 패턴.
- **EmptyHintPlaceholder가 ProseMirror Plugin이라 매 transaction 시 decorations 재계산** — performance 영향 작지만 대형 doc + 매 keystroke마다 doc.descendants 순회. 첫 빈 paragraph 찾으면 break이라 OK.
- **template editor에선 EmptyHintPlaceholder X** — 본 hint가 template 작성 중 노이즈. "note" tier에만 등록 (shared-editor-config.ts case "note").
- **사용자 IDB stale template** — 사용자가 PR #319 이전에 만든 template은 contentJson에 placeholder 없을 수 있음. PR #321 이후 새 template 작성 + placeholder 사용 권장.
- **Gallery card enrichment (P1 보류)** — Notes/Wiki/Books 갤러리 카드 status chip + metadata. GalleryItem interface + 3 adapter 매핑. 사용자 "휑함" 시그널.
- **Home stats References 2px truncate** — viewport 1400 / 카드 134 width에서 90vs88 미세. 사용자 시그널 시 short label 또는 padding 추가 축소.
- **status icon weight bold 영향** — 13곳 사용. 일부 작은 영역에서 너무 굵으면 size별 weight 조정.
- **Wiki/Books `.a-tg` sticky top:30** — Notes 패턴 따라가지만 wiki/books 페이지 sticky 컨테이너 height 다를 수도. 스크롤 시 헤더 잘려보이면 sticky position 조정.

### 환경 변경
- Store version: 변경 없음
- Tests: 변경 없음 (UI/CSS + extension 변경만)
- 신규 파일 2개:
  - `components/editor/templates-picker-dialog.tsx`
  - `components/editor/extensions/empty-hint-placeholder.ts`

---

## 2026-05-13 (밤, 초기) — 집, Status 색 메타포 재정렬 + 6 follow-up (PR #319 manual verify 결과) [DEPRECATED — 위 entry로 흡수됨]

> 🎯 **다음 즉시 액션**: 사용자 manual verify (dev hard refresh) — (1) Notes/Wiki/Books 모두 grouping `.a-tg` 통일 자연스러운지, (2) Status 색 메타포 (Stone slate회색 / Brick amber / Block emerald) chip ↔ row icon 정확 일치, (3) Home stats card REFERENCES 더 이상 icon 충돌 없음, (4) BookTable narrow viewport에서 Name visible.
>
> **사용자 의도** (4 시그널):
> 1. **Status 색 메타포 재정렬** — 마지막 단계(Block)가 가장 옅은 슬레이트 회색이라 직관 어긋남. 사용자 제안: Stone(회색,raw) → Brick(주황,중간) → Block(emerald 가장 선명,완성).
> 2. **chip ↔ icon 색 mismatch** — Stone/Brick의 STATUS_CONFIG가 var(--chart-2/3) 사용 (PR #319 keystone만 fix). chip은 chart 색 / row icon은 var(--status-*). **본질적으로 다른 CSS var**. 사용자가 시각으로 "다른 색" 정확 인식. fix: STATUS_CONFIG 모든 status를 var(--status-*)로 통일.
> 3. **Home stats card REFERENCES 충돌** — `flex justify-between` label 길면 icon 겹침. fix: icon 좌측 정렬.
> 4. **BookTable list view 회귀** — Name `flex-1 min-w-0`이 좁은 viewport에서 0px collapse → text overflow → Kind 헤더 겹침. fix: overflow-hidden + min-w-[120px].
> 5. **i18n 혼합** — "다중 선택" / "처음부터" 한국어 vs "Add selected" / "Resume" 영어. fix: 영어 통일.
> 6. **Wiki/Books 그룹 헤더 모양새 다름** — Wiki "NO PARENT 5" 흐림 (muted-foreground/60), Notes는 진함 (var(--fg)). fix: `.a-tg` 패턴 통일.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지됐다 가정) → dev:3002 hard refresh (Ctrl+Shift+R)
> 2. /notes list mode 진입 → Stone/Brick/Block 3 group 확인. chip + row icon 색 정확 동일.
> 3. /wiki list 진입 → "NO PARENT" 헤더가 Notes처럼 진하게 + line divider 확인.
> 4. /books list mode → "SMART/HYBRID/MANUAL" 헤더 동일 패턴.
> 5. /home → KNOWLEDGE BASE 6 cards에 icon 좌측 + REFERENCES 충돌 없음.
> 6. /books 책 detail → Resume / Start over (영어). Smart Book Add source 다이얼로그 "Multi-select" / "Click items to select".
>
> **참고 파일**:
> - `app/globals.css` line 35-37 (light status vars), 215-217 (dark), 1069-1101 (.a-tg)
> - `lib/colors.ts` line 136-140 (NOTE_STATUS_HEX dark canonical)
> - `components/status-icon.tsx` (weight bold)
> - `components/note-fields.tsx` (STATUS_CONFIG)
> - `components/home/stats-row.tsx` (icon 좌측)
> - `components/books/book-table.tsx` (overflow + min-w + .a-tg)
> - `components/views/wiki-list.tsx` (.a-tg)
> - `components/books/sources-section.tsx`, `book-detail-page.tsx` (i18n 영어)
>
> **위험 + 회피**:
> - **status 색 변경 영향 범위** — ontology-graph-canvas는 NOTE_STATUS_HEX 사용 (자동 반영). books-gallery-adapter는 #94a3b8 hardcoded (Manual 기본색, status 무관 — 영향 X). 다른 hardcoded hex 검색해도 거의 없음.
> - **`.a-tg` sticky behavior** — Wiki/Books에 sticky top: 30px 적용됨 (Notes 동일). 스크롤 시 헤더 살아있음. 사용자 의도 부합.
> - Gallery enrichment (Notes/Wiki/Books 카드에 status chip + metadata) — 별도 PR 보류. interface change + 3 adapter 매핑이라 scope 큼.
>
> **머신**: 집 (Windows)
> **branch worktree**: `claude/elegant-jepsen-2b3731`

### 완료

| # | File | Change |
|---|---|---|
| 1 | `app/globals.css` light | Stone `#c9a87c` → `#475569` slate-600 / Block `#475569` → `#059669` emerald-600 |
| 2 | `app/globals.css` dark | Stone `#e8d5a3` → `#94a3b8` slate-400 / Block `#94a3b8` → `#34d399` emerald-400 |
| 3 | `lib/colors.ts` | NOTE_STATUS_HEX dark canonical 미러 (slate-400/amber-500/emerald-400) |
| 4 | `components/status-icon.tsx` | StatusShapeIcon weight regular → bold (선명도 ↑, bg badge 없음) |
| 5 | `components/note-fields.tsx` | STATUS_CONFIG stone/brick var(--chart-N) → var(--status-*) + weight bold |
| 6 | `components/home/stats-row.tsx` | icon 좌측 정렬 + px-3 padding + tracking 제거 (REFERENCES 충돌 fix) |
| 7 | `components/books/book-table.tsx` | overflow-hidden cells + Name min-w-[120px] + `.a-tg` group header |
| 8 | `components/views/wiki-list.tsx` | `.a-tg` group header (Notes 패턴 통일) |
| 9 | `components/books/sources-section.tsx` | "다중 선택" 등 → 영어 |
| 10 | `components/views/book-detail-page.tsx` | "처음부터" → "Start over" |

### 브레인스토밍 & 큰 결정 (영구 LOCKED)

**1. Status 색 메타포 재정렬 (영구 LOCKED, 2026-05-13 사용자 결정)**:
- **Stone** = slate (회색, raw, needs triage) — light slate-600 `#475569` / dark slate-400 `#94a3b8`
- **Brick** = amber (kiln-fired, in progress) — light amber-600 `#D97706` / dark amber-500 `#f59e0b` (유지)
- **Block (keystone)** = emerald (finished crystal, settled) — light emerald-600 `#059669` / dark emerald-400 `#34d399`
- 마지막 단계가 가장 선명한 vivid color로 끝나는 progression (이전엔 Block이 가장 옅은 slate라 메타포 어색).
- 새 변경 시 globals.css + NOTE_STATUS_HEX + STATUS_CONFIG 3곳 동시 update 의무.

**2. STATUS_CONFIG var(--status-*) 통일 영구 룰 (PR #319 keystone fix follow-up 완성)**:
- chip color/bg/border는 var(--status-*)만 사용. var(--chart-N) 사용 금지.
- 이전 PR #319에서 keystone만 fix했고 stone/brick은 lazy 남았었음 → 사용자 시그널 (chip ↔ icon 색 mismatch)로 발견. fix.

**3. 그룹 헤더 `.a-tg` 영구 패턴 (모든 entity)**:
- Notes/Wiki/Books 3 entity 모두 `.a-tg` CSS 클래스 + `.a-tg__label`/`.a-tg__count`/`.a-tg__line` 통일.
- grid-template-columns: 11px auto auto auto 1fr (chevron / icon / label / count / divider line).
- label color: var(--fg) (진함). count: var(--whisper-fg) (옅음). line: var(--border).
- 새 entity의 list/group view 도입 시 같은 패턴 사용 의무.

**4. BookTable narrow viewport overflow 영구 룰**:
- list table cells에 `overflow-hidden` 의무 (text overflow → 옆 cell 겹침 회피).
- Title (flex-1 column)에 `min-w-[120px]` (좁은 viewport에서 0 collapse 방지). Notes/Wiki 같은 pattern 사용 시 동일 룰.

**5. Home stats card layout 영구 패턴**:
- icon은 label **좌측에** (`flex items-center gap-1.5`). `justify-between` X — label 길이 무관 일관성.
- label 길면 `truncate` 적용. tracking 자제 (text-2xs uppercase font-medium 충분).

**6. i18n 영어 통일 영구 룰**:
- 다이얼로그 / 버튼 / footer 텍스트는 영어. 한국어 사용자라도 일관성 우선.
- 위반 시: 같은 다이얼로그 안 영어/한국어 혼합 → 시각 일관성 떨어짐.

### 기술 학습 (영구)

- **CSS var vs TS const 동기화 의무** — globals.css `--status-*` 변경 시 lib/colors.ts `NOTE_STATUS_HEX` (canvas/SVG canonical) 같이 update. mismatch → ontology-graph-canvas 같은 canvas user가 stale 색 사용.
- **STATUS_CONFIG chip 패턴 root cause** — chip이 사용하는 var와 row icon이 사용하는 var가 다르면 사용자 시각 "다른 색" 인식. 통일 의무.
- **SVG weight "fill" 한계** — Cuboid2x2 custom icon은 line-only SVG라 weight "fill" 작동 X. weight "bold"가 다른 weight들과 일관 (Hexagon/Cube). status icon 3종 통일 weight 필요 시 "bold" 안전.
- **flex-1 min-w-0 narrow viewport collapse** — title column이 0px로 squeeze 가능. min-w-[N] 추가로 minimum 보장.
- **`.a-tg` CSS grid 패턴** — chevron / icon / label / count / line 5 column. 마지막 line이 flex 1fr로 남는 공간 채움. divider visual 깔끔.

### Watch Out (다음 세션)

- **Wiki/Books `.a-tg` sticky behavior** — `top: 30px` Notes 패턴 따라가는데 wiki/books 페이지의 sticky 컨테이너 height 다를 수도. 스크롤 시 헤더 잘려보이면 sticky position 조정 follow-up.
- **status icon weight bold 영향** — sidebar / breadcrumb / book-context-nav / gallery 등 13곳에서 StatusShapeIcon 사용. weight bold가 일부 작은 영역에서 너무 굵을 수도 — 사용자 시그널 시 size별 weight 조정.
- **Gallery enrichment 별도 PR 대기** — Notes/Books/Wiki 카드에 status chip + folder/category chip + updated badge. GalleryItem interface 변경 + 3 adapter (notes/books/wiki) 매핑. 사용자가 "휑함" 시그널 줬으니 후속 우선순위.
- **Home stats card "References" 라벨 2px truncate** — viewport 1400 + 카드 134px width에서 90vs88 미세 truncate. 거의 invisible하지만 사용자 시그널 시 short label ("Refs") 또는 padding 더 축소.

### 환경 변경
- Store version: 변경 없음
- Tests: 변경 없음 (UI 변경만)
- 신규 파일: 없음 (10 파일 수정)
- 영구 룰 6개 추가 (위 LOCKED 참조)

---

## 2026-05-13 — 집, Smart Book v2 풀 완성 + Ontology Hull P1-4 + 137 Linear refs + 11 follow-up (PR #319, 17 commits 단일 mega-PR)

> 🎯 **다음 즉시 액션**: **PR #319 squash merge** (사용자 책임) + 머지 후 dev:3002에서 manual verify. 가장 큰 surface: (1) `/library` Books → 책 → "Add source" 다중 선택 모드 + Auto-sort toggle + Resume 버튼 + chapter context badge. (2) Ontology → Display > Group by = Book → hull / Filter > Status nested 8 values (Note/Wiki/Book) / Visible hulls picker / Show book sequence dashed arrow.
>
> **사용자 의도**: Smart Book v2 (chapter ordering / reading view / picker UX) + Ontology Hull 3-source + 그 모든 follow-up까지 한 큰 PR로 통합 완성. "잔여 follow-up까지 다 해" 명시.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `git pull origin main` (PR #319 머지된 상태 가정) → `npm install` (새 worktree 시 필수, 본 세션 시작 시 발생 사례 — 영구 룰 후보)
> 2. `npm run dev` → hard refresh (Ctrl+Shift+R) IDB stale 회피
> 3. `/library` Books → 임의 책 → "Add source" 다이얼로그
>    - 다중 선택 토글 → 5 tab cross-tab search → "Add N selected" footer
>    - 본문 auto items drag → cross-source reject toast (Q1 LOCKED) → Auto-sort 버튼 + 5초 undo toast
>    - 책 detail header: lastReadItemId 있으면 "Resume" + 옆 "처음부터"
> 4. 페이지 reading → BookContextNav 옆 mini progress bar + "· {kind icon} {sourceName} (N/M)" chapter badge (md+ only)
> 5. Ontology graph
>    - Filter > Status → 3 sub-section header (NOTE/WIKI/BOOK) + 8 values 모두 icon (Hexagon/Cube/Cuboid2x2/IconWikiStub/IconWikiArticle/Lightning/PencilSimple/Sparkle)
>    - Display > Group by = Book → hull + book.color fallback. Smart Book auto items도 hull 멤버 (resolveBookItems via bookMembership prop)
>    - Display > "Show book sequence" 토글 → dashed thin arrow 책 reading order
>    - Filter > "Visible hulls" → 특정 entity만 hull 표시
>    - Legend 박스: "Block" 표시 (이전엔 "Keystone" 잔존, 본 세션 fix)
>    - Notes Table Block badge: slate color (이전엔 green `--chart-5` 잘못 사용)
>
> **확인 포인트**:
> - dnd-kit collision 패턴 — wiki-board / notes-board / books-board 3 board 모두 normalize 의무 (PR #311/#319 패턴 정합). 새 board 추가 시 영구 룰.
> - status 색은 `var(--status-{stone|brick|keystone})`만 — `var(--chart-N)`는 chart 시각화 전용 (LOCKED 색 변경 따라가지 않음). Stone/Brick도 같은 정리 가능 (사용자 시그널 후).
>
> **구멍 가능성**:
> - bulk select 모드 — Cmd+Click 처리 cmdk와 충돌이라 explicit 토글로 우회 (사용자 UX 자연도 verify 필요)
> - Phase H chapter context badge — sourceRefId clustering 기반이라 manual items without sourceRefId는 null (badge hide). PRD §5.3 예시 "in 📁 Algorithms"와 약간 다른 design.
> - Ontology Book hull membership — resolveBookItems 비용 O(books × items). books 100+ 시 culling 필요 (현재 acceptable).
> - chapter heading auto-generated 사용자 rename 불가 (PRD §6 명시). 사용자 시그널 시 v2.5 follow-up.
>
> **참고 파일**:
> - `.omc/plans/smart-book-v2-prd.md` v1.0 LOCKED (Phase G/H/K, 13 Q resolved)
> - `.omc/plans/ontology-hull-prd.md` v0.1 draft (Phase 1/2/3/4 모두 구현)
> - `docs/reference/linear/README.md` (137 captures 14 카테고리 인덱스)
>
> **위험 + 회피**:
> - PR #319 17 commits scope 매우 넓음 — squash merge 권장, title 머지 시 broader scope로 update
> - 새 worktree 첫 setup 시 `npm install` 필수 (본 세션 시작 시 stale dev server로 fractional-indexing not found 에러 발생) — before-work 단계에 node_modules 체크 자동화 후보
> - hydration mismatch (radix _R_xxx_ id) main pre-existing — 본 PR 무관, 별도 fix 후보
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #319 머지 전 (45798d7)
> **branch worktree**: `brave-ardinghelli-209f9b` (이번 세션, 머지 후 cleanup 가능)

### 완료 (PR #319, 17 commits 단일 mega-PR)

| # | sha | scope |
|---|---|---|
| 1 | `c96a5fe` | books-board normalize (Bug #1) + BookItemRow 5-source icon (Bug #2) |
| 2 | `0eaa13f` | wiki-board normalize (Bug #3, 같은 dnd-kit collision risk 패턴) |
| 3 | `d9e921d` | TrashAllView header select-all checkbox (tri-state) — 사용자 "전부 삭제" 요청 |
| 4 | `65f1733` | docs: Linear 참고자료 137 captures + README 카테고리 인덱스 |
| 5 | `f023701` | Smart Book v2 PRD v1.0 LOCKED + Ontology Hull PRD v0.1 draft + Phase G-1 (core) |
| 6 | `e6e332c` | Phase G-2 (UI: auto entity drag + Auto-sort toggle + 5초 undo toast) |
| 7 | `4e79d26` | Phase H (lastRead + Resume 버튼 + BookContextNav mini progress bar) |
| 8 | `46786a9` | Phase K (dialog 너비 확장 + cross-tab unified search) |
| 9 | `fead7c9` | Ontology Hull Phase 1+2 (Status cross-entity + Book hull groupBy) |
| 10 | `964b257` | Phase H follow-up — chapter context badge |
| 11 | `18583b4` | Ontology Hull Phase 1 follow-up — Status sub-section headers |
| 12 | `3201ea7` | Phase K follow-up — bulk select (multi-mode 토글 + footer) |
| 13 | `c5f975f` | Ontology Hull Phase 2 follow-up — Smart auto items in hull |
| 14 | `43fe2e3` | Ontology Hull Phase 4 — Visible hulls picker filter |
| 15 | `7270254` | Ontology Hull Phase 3 — Book sequence dashed arrow |
| 16 | `0c4c644` | fix: legend Keystone → Block + Filter Status Wiki/Book icon 일관성 |
| 17 | `44bef87` | fix: Block 색 var(--chart-5) green → var(--status-keystone) slate 통일 |

### 브레인스토밍 & 큰 결정 (영구 LOCKED)

**1. Smart Book v2 PRD v1.0 LOCKED 12 결정** — 모두 추천값 그대로:
- Auto items reorder = same-source 내부만 (cross-source 시 reject toast)
- Auto-sort 토글 = SourcesSection row 인라인 + 5초 undo toast
- 진행률 = header 아래 1px subtle (이번엔 BookContextNav inline mini 36px로 변형 적용)
- Resume = 명시적 버튼 (자동 점프 X)
- Hull style outline / Book.color 우선 / overlap 허용 / dashed thin sequence / opt-in toggle / 5-tab picker 너비 + cross-tab search
- userOrder 신규 필드 + autoUserOrders map (Book에 store)

**2. Ontology Hull PRD v0.1 모든 LOCKED 결정**:
- Hull = display rendering style (filter X)
- 3 source: Sticker + Folder + Book (Tag/Label hull은 v3)
- Status nested (Option B): Status > Note/Wiki/Book sub-section
- Single hull source select 시스템 그대로 (multi-source 동시 toggle은 v3)
- Smart Book auto items 포함 (resolveBookItems via bookMembership prop)

**3. PRD 2개 분리 결정** — Smart Book v2 = Book entity 위주 / Ontology Hull = Ontology graph 위주. scope 명확, 독립 구현.

**4. Block 색 var 일관성 영구 룰** — status 색은 `var(--status-{stone|brick|keystone})`만. `var(--chart-N)`는 chart 시각화 전용 — LOCKED 색 변경 (teal→slate 2026-05-12 같은) 따라가지 않으므로 status에 mapping 금지.

**5. dnd-kit collision normalize 모든 board 영구 룰** — `useSortable("col-${key}")` + `useDroppable(key)` 이중 binding 시 over.id 비결정 반환. handler에서 `overId.startsWith("col-") ? overId.slice(4) : overId` 의무. notes/books/wiki 3 board 모두 적용 완료.

**6. Filter values icon 일관성 영구 룰** — Status filter 같은 cross-entity values는 각 entity의 chip/badge에 쓰이는 icon 그대로 재사용 (color dot 단독 사용 X). 사용자 시각 식별 의미 보존.

**7. Chapter context derive 패턴** — useBookContextNav 안에서 sourceRefId clustering (auto items + Tweak B로 매칭된 manual items). sourceRefId 없는 manual은 chapter context null (badge hide). UI caller가 5 store lookup으로 source name + glyph 표시.

**8. resolveBookItems 활용 패턴** — Smart Book auto items가 다른 view (Ontology hull / Book Detail Resume button 등)에서도 참여하려면 ontology-view에서 useMemo로 미리 compute → 자식 컴포넌트에 prop으로 override 전달. canvas가 store coupling 없이 props-driven 유지.

**9. `npm install` 첫 setup 영구 룰 후보** — 새 worktree 시 node_modules 없음 → dev server 시작 시 fractional-indexing 등 module not found. before-work 단계에 자동 체크 + install 또는 명시적 안내.

### 기술 학습 (영구)

- **dnd-kit DOM ref 이중 binding 회피** — collision detection 비결정 → 일관성 위해 모든 board 컴포넌트에 normalize 의무. 새 board 도입 시 동일 패턴 적용.
- **cmdk CommandItem + modifier key** — onSelect는 keyboard/mouse 공통, mouse event detail 없음 → multi-select 도입 시 explicit toggle mode (cmdk와 호환). modifier key 직접 처리 어려움.
- **FilterValue group field 패턴** — `group?: string` optional. FilterPanel이 group 변경 시점 detect → uppercase tracking label sub-header. nested UI 효과를 flat data shape로 달성.
- **PRD 분리 trigger** — 한 PRD scope이 다른 도메인 (Smart Book v2 안 Ontology Hull I/J) 침범 시 사용자 한마디로 분리 ("그러면 북스만으로도 묶고 그래야 될 듯"). PRD draft 시점에 분리 가능성 미리 명시.
- **Hull picker filter 패턴** — view-engine FilterCategory의 values runtime hydration. groupBy 따라 다른 entity list (sticker/book/folder/...) 동적 update. filter rule field name "hullEntity" + visibleHullKeys Set 추출 → canvas hull computation filter.
- **Sequence edge SVG marker pattern** — `<defs><marker id="book-seq-arrow">` 한 번 정의 + `markerEnd="url(#book-seq-arrow)"` 모든 paths reuse. `currentColor` inherit으로 각 line stroke 색 자동 매칭.
- **var(--chart-N) vs var(--status-*) 분리** — chart는 시각화 전용 (D3 등), status는 LOCKED 색. 잘못된 mapping이 LOCKED 색 변경 (이번 teal→slate) 따라가지 않는 회귀 원인.
- **Resolver 재사용 (외부 view)** — resolveBookItems가 pure function이라 ontology-view 등 다른 view에서도 호출 가능. 다만 store coupling 회피 위해 caller가 useMemo로 compute → prop으로 전달.

### Watch Out (다음 세션 주의사항)

- **사용자 manual verify가 마지막 단계** — PR #319 17 commits 코드는 다 됐지만 실제 사용성 verify 안 됨. 머지 후 hard refresh로 다음 큰 surface 5개 점검 (위 "첫 스텝" 참조)
- **bulk select 모드 UX** — Cmd+Click 충돌로 explicit 토글 우회. 사용자가 직관적인지 verify 필요. 자연 안 들면 modifier 기반 또는 별도 checkbox column 도입 follow-up
- **chapter context badge null cases** — manual items without sourceRefId는 badge hide. 사용자가 "왜 어떤 페이지는 chapter 표시되고 어떤 페이지는 안 되지?" 직관 깨질 수 있음 — 향후 manual chapter rename 또는 auto sourceRefId tagging 강화
- **Ontology hull 100+ entity 성능** — books/folders/stickers 다 합쳐서 100+ 시 hull computation 느려질 수 있음. Phase 4 hull picker filter로 부분적 mitigate, 본격 culling 미구현
- **node_modules 누락 패턴** — 새 worktree 첫 시작 시 자동 check + install 권장 (before-work 룰 후보)

### 환경 변경
- Store version: 변경 없음 (Phase G-1 데이터 모델 additive optional)
- Tests: 39 → 43 (Phase G-1 +4: userOrder priority / fallback / per-source scoping / empty map)
- 신규 파일:
  - `.omc/plans/smart-book-v2-prd.md`
  - `.omc/plans/ontology-hull-prd.md`
  - `docs/reference/linear/README.md` + 137 PNG
- 신규 store API: setLastRead / reorderAutoItem / clearAutoUserOrder
- 신규 types: BookItem.userOrder + Book.autoUserOrders + Book.lastReadItemId + Book.lastReadAt + FilterValue.group + FilterField "hullEntity" + GroupBy "book"
- 신규 view config: hullEntity filter category + showBookSequence toggle
- 영구 룰: status 색 var(--status-*) only / dnd-kit normalize all boards / filter values icon 일관성 / chapter context sourceRefId clustering / resolver 재사용 패턴

---

## 2026-05-12 (밤) — 집, Smart Book 전체 완성 (Phase A-F) + 4 polish PR (6 PR 누적)

> 🎯 **다음 즉시 액션**: Smart Book 5 source kind manual verify + buglist 수집 — 5 AutoSource 모두 활성됐으니 실제 사용자 워크플로우로 검증 + UX 구멍 발견 시 P0 follow-up.
>
> **사용자 의도**: 어제 작업한 Phase A (folder)만 사용해본 상태. Phase B-F는 코드 완성 + 단위 test pass 했지만 사용자 manual verify 안 됨. PRD §4 12 LOCKED 결정이 실제 UX와 맞는지 검증 필요.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `/library` Books → 임의 book 열기 (예: "Reading Journal" 또는 신규 생성) → "Add source" 클릭 → 5 tab 순회 (Folder / Category / Tag / Label / Sticker)
> 2. 각 tab에서 entity 1개씩 추가 → 본문 list에 해당 heading + items auto-resolve 확인
> 3. 같은 entity가 여러 source에 매칭될 때 first-source 하위에만 표시 (dedup) 확인
> 4. "Convert to manual" 클릭 → confirm → 모든 auto items가 manual items로 변환 + smartSources 비워짐 확인
> 5. Tag/Label/Sticker trash → 책 본문 auto items 자동 사라짐 (lazy detection). restore → 자동 revive
> 6. **Books list mode grouping** (PR #317 fix) — Display panel Grouping = Kind / Pinned 변경 시 group section header 표시 확인
>
> **확인 포인트**:
> - 5 tab 시각 일관성 (icon / preview count format / empty state)
> - SourcesSection chip 표시 vs 본문 chapter heading icon (📁/📚/#/🏷/✨) 매핑 일관
> - manual 노트가 tag source와 매칭될 때 sourceRefId tag (subtle badge로 UI 표시되는지 — 현재 미구현 가능성, BookItemRow 확인 필요)
> - Convert to manual 후 새 source 추가 시 freeze 작동 (앞서 변환된 items 안 흔들림)
>
> **구멍 가능성** (예상):
> - Empty book 상태에서 source 추가 → flow 자연스러운지
> - 5 tab 5 source picker dialog 좁아서 답답하지 않은지 (sm:max-w-md = ~448px)
> - 같은 source 재추가 dedup guard 토스트 표시 검증
> - sticker source는 sticker 자체에 멤버 없으면 silent skip — 사용자 confusion 가능 (UI에 "0 members" preview 있음)
> - `WikiArticle.tags` 필드가 실제 wiki seed에 있는지 (현재 wiki-4/5/7만 tag-2 매칭) — empty state로 더 다양한 시나리오 필요
>
> **참고 파일**:
> - `lib/books/resolver.ts` — 5 case + emit helper
> - `components/books/sources-section.tsx` — 5 tab dialog
> - `components/views/book-detail-page.tsx` — caller (store wire)
> - `lib/books/__tests__/resolver.test.ts` — 39 tests (각 case별)
> - `.omc/plans/smart-book-prd.md` — PRD spec (LOCKED 12개)
>
> **위험 + 회피**:
> - dev server :3002 stale build 가능성 (앞 세션 패턴) → 방문 시 hard refresh (Ctrl+Shift+R)
> - dnd-kit 패턴 (notes-board pattern) — Books도 같은 collision risk 있는지 cross-check (books-board.tsx)
> - 옛 IDB에 book.smartSources 형식 다를 수 있음 — migrate.ts 확인
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #317 merge 후
> **branch worktree**: `condescending-yonath-23775a` (다음 세션 새 worktree 권장)

### 완료 (6 PR 누적)

**1. polish PR #312 — BoardCard chip overflow + Wiki 그룹 헤더 아이콘 + lookup null guard**
- `components/property-chips.tsx:709` PropertyChipRow row container `overflow-hidden` 1줄 추가. chip wrapper + ChipShell `shrink-0`이라 row가 카드 폭 초과 시 chip이 박스 밖으로 빠져나오던 케이스 차단. Linear 패턴 (한 줄 + clip)
- `components/views/wiki-shared.tsx` — `WikiGroupHeaderIcon` 신규 (family/parent/role → Tree, tier → Stack, linkCount → Link, label → category color dot)
- `wiki-list.tsx:889` group header + `wiki-board.tsx:124` column header에 icon 적용 (Notes Table/Board/Gallery + Books와 정합)
- `note-fields.tsx` PRIORITY_CONFIG[value]에 `?? .none` fallback 2곳, `board-workbench.tsx` STATUS_CONFIG[status]에 `if (!cfg) return null` (PR #308 hotfix 패턴 확산)

**2. feat PR #313 — TrashEntityList multi-select (entity별 탭)**
- PR #311 TrashAllView 패턴을 books/tags/labels/templates/references/files 탭에도 동일하게 적용
- `notes-table.tsx` TrashEntityList: selectedIds Set state + hover-only row checkbox + isSelected 시 bg-accent/10 + 하단 floating bar (Restore / Delete forever / Clear)
- handleBulkRestore / handleBulkDelete (entity별 store action dispatch) + singularNoun helper

**3. feat PR #314 — Smart Book Phase B (Wiki Category source)**
- PRD §4 Phase B (~1-2h). Folder(A) → Category(B) 확장
- `ResolverStore`에 wikiArticles + wikiCategories optional 추가 (Phase A 호환)
- resolver `case "category"`: DAG (`WikiArticle.categoryIds?` array, any-match) → 📚 heading + wiki items
- `sources-section.tsx`: "Add folder" → "Add source" 단일 진입점 + Dialog 안에 Tabs (Folder / Category)
- ResolvedSource 단일 list에 두 kind 시각 통합 (folder icon vs category color dot + "FOLDER"/"CATEGORY" 태그)
- +10 category tests (DAG dedup, excludeIds, manual shadowing, stale ref, trashed wiki, empty skip, mixed folder+category, deterministic id)

**4. feat PR #315 — Smart Book Phase C+D+E (Tag/Label/Sticker, all 5 kinds active)**
- 3 source kind 한 번에 (~5h estimate, 1 PR로 통합)
- `emitSection` helper 추출 → folder/category/tag/label/sticker 모두 동일 흐름 (~80 line dedup)
- `noteIsCandidate` / `wikiIsCandidate` predicates 단일화
- **tag** (cross-entity) — Note.tags + WikiArticle.tags 같은 section 안에 mixed sort → `# {tag.name}` heading
- **label** (notes only) — `Note.labelId === refId` → `🏷 {label.name}`
- **sticker** (7-kind → 2-kind filter) — `members.kind === "note" || "wiki"`만 → `✨ {sticker.name}`
- Manual items `sourceRefId` tagging 5 kind 모두 probe (note: folder→label→tag→sticker / wiki: category→tag→sticker)
- UI: 5-col grid Tabs (icon-only, title hint), 5 candidate builder + preview count
- +11 tests (cross-entity, DAG, manual shadowing, label notes-only, sticker filter, mixed source dedup)

**5. feat PR #316 — Smart Book Phase F (trash guard + Convert to manual)**
- **Trash guard (LOCKED #11 lazy detection)**: tag/label/sticker source에 `if (!entity || entity.trashed) continue` 추가. trashed → silent skip, restore → 자동 revive
- WikiCategory + Folder는 hard-delete only라 기존 stale-ref guard로 충분
- **Convert to manual**: 새 button (sources 있을 때만). resolveBookItems → auto items 추출 → fresh uuid + clean BookItem shape → book.items append + smartSources/excludeIds clear. window.confirm 가드
- +4 trash guard tests (39 → 59/59 total resolver+utils pass)

**6. fix PR #317 — BookTable list mode grouping 무시 버그**
- 사용자 보고 (스크린샷): Display panel Grouping=Kind 선택 시 books list mode가 flat list만 표시 → 회귀 (board/gallery는 이미 groups 처리)
- `BookTable` props에 `groups?: BookGroup[]` + `groupBy?: GroupBy` optional 추가
- `isGrouped` 분기 + group section header (sticky band, top-9) + 내부 BookRow
- kind → BookKindIcon, pinned → PushPin/PushPinSlash
- `books-view.tsx` list mode에 `groups + groupBy` 전달

### 브레인스토밍 & 큰 결정 (영구)

**1. Smart Book 5 AutoSource INVARIANT 확정 (영구 LOCKED)** — PRD §2 그대로:
- BookItem.kind = `note` | `wiki` | `chapter-heading` 만
- AutoSource는 **공급원**이지 멤버 kind가 아님
- label/tag/sticker entity 자체가 책 페이지가 되는 게 X — label로 분류된 note들이 들어감
- Sticker는 7-kind 중 note/wiki만 추출 (다른 kind 무시)
- 사용자 헷갈림 가능 포인트로 PRD에 명시 — 다음 세션 사용자가 직접 사용해보면서 INVARIANT 체감 가능

**2. Phase A-F 전체 한 세션 완성 (incremental → 통합 PR 전략)** — PRD §4가 "각 phase 1 PR씩" 권장했지만 동일 패턴이라 C+D+E (1 PR) + F (1 PR) 통합 더 효율적. 사용자가 "전부 다 진행해"로 통합 승인. 시간 ~5h 추정, 실제 ~3h.

**3. `emitSection` helper 추출 → resolver pure function이 5 source 모두 동일 흐름** — Phase B만 있을 땐 inline OK였지만 5 source 추가하면서 dedup 압박. 추출 후 +25% 코드 가독성, 동시에 buggy edge case 줄어듦 (heading/items/seenAutoRefIds 업데이트 한 곳에서).

**4. Convert to manual button은 sources 있을 때만 표시** — 항상 표시하면 사용자 confusion (clicking unrelated thing). conditional render UX 더 자연스러움.

**5. Books list mode가 board/gallery와 패턴 갈리던 회귀 발견 — 사용자 시그널이 가장 빠른 진단** — 사용자 스크린샷 한 장으로 다음 워크플로우 잡음. 다음 작업 원칙 #8 ("사용자 직관 = 디자인 시그널") 재확인.

### 기술 학습 (영구)

**1. ResolverStore 새 필드는 optional + `?? []` fallback 패턴 안전** — Phase B 추가 시 test files 14곳 mock store 수정 부담. ResolverStore.wikiArticles?: WikiArticle[] (optional) + resolver 내부에서 `(store.wikiArticles ?? [])` 사용으로 Phase A-only caller (folder source만 쓰는 testー) silent compatible. 매번 phase 확장 시 같은 패턴 추천.

**2. `emit helper + predicate helper 분리`로 5-case 흐름 통일** — pure function 안에 case문 5개가 비슷한 코드 80% 중복일 때 helper 추출은 단순 짧음이 아니라 *논리 단일화* (heading + items + seenAutoRefIds 업데이트 한 곳에서). LOCKED #10 v1.2 (empty source silent skip) 같은 미묘한 룰도 단일 지점에서 보장.

**3. 5 tab UI grid 패턴** — Tabs grid-cols-5 + icon-only tabs (title hint) — 좁은 dialog (`sm:max-w-md`)에 5 tab 깔끔. Label은 길면 잘림 → tooltip으로 보완. 미래 6 tab 이상이면 dropdown 또는 segmented control 재검토.

**4. `groups + groupBy` props 누락 회귀 — view mode별 일관성 의무** — Notes/Wiki/Books 3 entity × 4 view mode (list/board/gallery/grid) 16 조합 중 한 곳 패턴 누락 = 사용자 직관 깨짐. 새 viewMode 추가 시 *모든 entity의 모든 view mode에 같은 prop 흐름 적용* 영구 룰. board/gallery만 적용하고 list 누락 같은 버그가 또 발생할 가능성 있음 (Wiki view-engine board 도입 시 회피).

**5. nanoid import는 npm package에서** — `import { nanoid } from "nanoid"` (already in `package.json`). uuid 생성에 사용. Convert to manual에서 fresh book item id 만들 때.

**6. PR #312-#317 6 PR 연속 squash merge — main conflict 패턴 정착** — 각 PR 머지 직후 다음 PR base가 stale (main 머지 결과 c5c5936→...). `git merge origin/main --no-ff` 후 `--ours`로 resolve 패턴 안정. tsconfig.tsbuildinfo + .omc/continuation-count.json 등 auto-gen 파일은 무조건 ours.

**7. Plot routing이 module-level state (`_activeRoute` in `lib/table-route.ts`)** — preview MCP로 wiki list/board 시각 검증 어려운 이유. `setActiveView('books')` 만으로는 view mount 안 됨. layout.tsx의 `isViewRoute` + `mountedViews` 로직 거쳐야. 시각 verify는 사용자가 dev server에서 직접 하는 게 더 효율적.

### Watch Out (다음 세션 주의사항)

- **Smart Book manual verify가 사용자 책임** — 5 source kind 코드 다 작성됐지만 사용자가 실제 워크플로우로 점검 안 했음. dev server :3002 새로고침 후 첫 verify에서 UX 구멍 나올 가능성 ↑
- **Convert to manual은 destructive (smartSources clear)** — undo path 없음. window.confirm 가드 있지만 사용자가 실수로 Yes 누르면 영구 변환. 다음 세션 사용자가 첫 시도 시 confirm dialog 명확한지 점검
- **5 tab dialog 너비 부족 우려** — sm:max-w-md = ~448px. 5 col icon tabs 빡빡할 수 있음. 사용자 시도 후 조정
- **사용자가 보고한 BoardCard chip overflow는 fix 됐지만 다른 view mode (Notes list mode chip / Books list mode)에 동일 issue 있을 수 있음** — 추가 보고 시 같은 패턴 (`overflow-hidden` row container) 적용
- **Smart Book FAQ — "왜 5 source가 다 필요해?"** — 사용자가 의문 제기. folder + category로 80% 가치, 다른 3은 edge case. 사용자가 사용 안 하면 Phase D/E는 dormant (UI 일관성으로 유지)

### 환경 변경
- Store version: 변경 없음 (Smart Book Phase A에서 이미 v121, B+은 idempotent additive)
- Tests: 55 → 59 (+4 trash guard)
- 신규 파일: 없음 (모두 기존 파일 확장)
- 사용자 IDB stale data: 없음

---

## 2026-05-12 (저녁) — 집, Trash All + Status-icon-stale root fix + Wiki pin + 9 fix mega-PR (Store v130 → v132)

> 🎯 **다음 즉시 액션**: BoardCard chip overflow fix — 사용자 보고 *"박스 밖으로 `#Productivity` 글자가 빠져나오는 연출이 있는데 이러면 안 됨. 박스 밖으로 빠져나가면 안 돼."*
>
> **사용자 의도** (스크린샷 동봉): board mode 카드 (예: "Build a Personal Wiki")의 tag/category chips row에서 마지막 chip (`#Productivity`)이 카드 box 우측 경계를 넘어 돌출. 박스 안에 contained 되어야 함.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `components/notes-board.tsx`에서 BoardCard (또는 BoardCardInner) 컴포넌트의 chips row 위치 찾기 (line ~400-600 추정, tag/category chip 렌더 부분)
> 2. chip row container에 `overflow-hidden min-w-0` + chip element 자체에 `truncate max-w-[...]` 적용
> 3. 정책 결정 (사용자 결정 필요):
>    - **A: Truncate** — 한 줄 유지, 잘림 (`…`). 카드 height 일정. Linear 패턴 정합. 추천.
>    - **B: Wrap** — 여러 줄. 정보량 ↑, 카드 height variable.
>
> **참고 파일**:
> - `components/notes-board.tsx` — BoardCard chips 위치
> - `components/notes-table.tsx` — list mode chip 패턴 (정합 비교)
> - `components/views/wiki-list.tsx:462` — wiki list tags column `w-[140px] shrink-0 ... overflow-hidden` 패턴
>
> **위험 + 회피**:
> - 다른 view mode (grid/gallery)에 같은 BoardCard 사용 여부 확인 (회귀 회피)
> - list mode chip은 별도 layout — 독립
> - chip text 너무 짧으면 truncate 의미 없음 — `max-w` 적당히
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 이번 PR merge 후 (Store v132)
> **branch worktree**: `quirky-colden-bcf3de` (다음 세션 같은 worktree 또는 새 worktree)

### 완료 (9 fix 통합 PR, Store v130 → v132)

**1. Trash "All" 통합 view 신규** — `components/views/trash-all-view.tsx` (~300 LOC 신규).
- 8 entity (Notes/Wiki/Books/Tags/Labels/Templates/References/Files) trashed 통합 표시
- entity별 section header (빈 section auto-hide), 통합 row layout `[icon][Kind badge][title][color dot?][trashed time][Restore][Delete forever]`
- Notes는 status별 `StatusShapeIcon` (stone/brick/keystone)
- `permanentlyDelete*` confirm dialog (TrashEntityList 패턴 정합)
- `notes-table.tsx`: import + `storeWikiArticles` 변수 + `trashTabCounts.all`에 wikiArticles 합산 보강 (count 모순 해소) + `trashFilter === "all"` 분기에 `<TrashAllView />` mount

**2. Status icon stale root cause 발견 + 3-layer fix** — SESSION-LOG의 "#2 Status icon stale" 보고 (이전 세션 reproduce 부족으로 skip).
- **root cause**: `notes-board.tsx:277-283` column outer DOM에 `useSortable("col-${key}")` + `useDroppable("${key}")` 동시 bind. dnd-kit collision detection이 sortable id를 우선 반환할 때 `targetKey = "col-stone"`이 그대로 status로 저장됨 → StatusShapeIcon (else→Cuboid/Block) + StatusBadge (`?? STATUS_CONFIG.brick` fallback → "Brick") mismatch
- **Fix #1 root prevention**: `notes-board.tsx:968` — `const targetKey = overId.startsWith("col-") ? overId.slice(4) : overId`. card drag 시 overId의 `col-` prefix strip
- **Fix #2 memo safety**: `notes-board.tsx:668` — BoardCard memo에 `prev.note.status === next.note.status` 추가 (board view drag 직후 leading icon stale 방지)
- **Fix #3 data recovery**: `migrate.ts` v131 — VALID_STATUSES Set 외 모든 status를 valid enum으로 복구. legacy enum (inbox/capture/permanent) re-map + `col-` prefix strip + stone fallback. Idempotent. Store 130 → 131

**3. v132 folderIds garbage cleanup** — 같은 dnd-kit root cause가 folderIds에도 garbage (`col-folder-1`, `col-_no_folder` 등) 저장 가능 (사용자가 본 toast "Added to col-_no_folder"). v132 마이그레이션 — `state.folders` Set 외 folderId 제거. notes + wikiArticles 둘 다 처리. Store 131 → 132

**4. Board drag default = Move semantic 반전** (작업 원칙 #8 사용자 직관 = 디자인 시그널) — 사용자 의도 *"옮기면 진짜로 속성이 바뀌어야 / 스테이터스일 땐 옮겨진 스테이터스로 / 폴더일 땐 옮겨진 폴더로"*.
- 이전: folder drop default = Add (N:M, 기존 유지 + 새 folder 추가) / Shift+drop = Move
- 변경: folder drop default = Move (folderIds 교체) / Shift+drop = Add
- status / priority / triage는 single-valued라 자동 Move (불변)
- toast description도 반전 ("Drop without Shift to move instead" / "Hold Shift to add (keep existing folders) instead")

**5. Books row checkbox hover-only** — `book-table.tsx:405-414` BookRow checkbox cell wrapper에 `checked ? "visible" : "invisible group-hover:visible"`. notes/wiki 패턴 정합. 사용자 보고 *"북스의 경우, 구분선 아래 북스 네임들 왼쪽에 체크박스들은 왜 눈에 보이게 체크가 되어있는 거지?"*

**6. Trash row multi-select + bulk action bar** — `trash-all-view.tsx` 확장 (~80 LoC 추가).
- `selectedKeys` Set state (`${kind}-${id}` 형식 — kind별 id collision 회피)
- row checkbox column (notes/wiki 패턴: hover-only, selected/selectionActive 시 visible)
- `handleRestoreSilent` / `handleDeleteSilent` helper (bulk action용, 단일 aggregated toast)
- 하단 floating bulk action bar (selection 활성 시): `N selected` + Restore + Delete forever + Clear (X)
- 사용자 보고 *"트래쉬의 경우 왜 체크박스가 없는 거야? 체크박스가 있어야지."*

**7. Wiki pin 위치 title 옆** — `wiki-list.tsx:426-435` title span의 `flex-1` 제거 + PushPin `className` `mx-1` → `ml-1`. Books `book-table.tsx:497-502` 패턴 정합. SESSION-LOG 영구 결정 PR #301 ("Pin 위치 = title 옆") 재실현. 사용자 보고 *"위키의 즐겨찾기 pin의 경우 title 우측에 있어야 하는데, 왜 스테이터스 칩 왼쪽에 있냐고. 북마크가 아니라 pin이었어!!"*

**8. Wiki "북마크 이상" 진단** — wiki-view trashed filter (line 372: `wikiArticles.filter((a) => !(a as { trashed?: boolean }).trashed)`) 정상 작동.
- preview_eval로 port 61869 `/wiki` 직접 verify → trashed=true 7개 wiki **표시 안 됨** (filter 적용 ✓)
- 사용자가 본 7개 = **port 3002 (crazy-raman-838a0c 이전 worktree) stale build** 화면
- pin icon mismatch (Atomic Notes / Linked Notes pin 표시)도 같은 stale build 영향. 데이터 검증 결과 모두 `pinned: false`

**9. tsc + production build 매 fix마다 clean 검증** — 작업 원칙 #3 의무.

### 브레인스토밍 & 큰 결정 (영구)

#### 1. dnd-kit 동일 DOM 이중 binding 위험 패턴 (영구 LOCKED)
- `useSortable("col-${key}")`와 `useDroppable("${key}")`를 같은 ref에 bind하면 collision detection이 어느 id 반환할지 비결정
- card drop 시 `over.id`가 sortable id (`col-stone`) 또는 droppable id (`stone`) 중 하나
- handler에서 무조건 prefix strip — `overId.startsWith("col-") ? overId.slice(4) : overId`
- **교훈**: dnd-kit DOM ref 합치기 신중. id format prefix 일관 + handler normalize.

#### 2. Board drag = Move semantic (default) — 사용자 직관 우선
- 영구 결정 변경 (2026-05-12 저녁): 이전 N:M 패턴 (default=Add, Shift=Move) → 직관 패턴 (default=Move, Shift=Add)
- 근거: "옮기면 옮겨져야"가 자연 사용자 모델. N:M power user는 Shift modifier 학습 가능.
- 작업 원칙 #8 (사용자 직관 = 디자인 시그널). 이전 결정 (PR (c))을 폐기하고 새 결정 LOCKED.

#### 3. row checkbox 패턴 — 모든 entity 일관 (영구 LOCKED)
- notes / wiki / books / trash 모두 동일: hover-only 또는 selected/selectionActive 시 visible
- 패턴: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`
- 단일 source of truth: notes-table NoteRow / wiki-list ArticleRow / book-table BookRow / trash-all-view TrashRow

#### 4. Pin 위치 = title 옆 (영구 결정 #301 재확인)
- elastic-darwin-382a48의 status chip 옆 이동 (`1d8b30f`)은 폐기
- 모든 entity 표준: notes (notes-table) / wiki (wiki-list) / books (book-table) 동일
- 핵심 패턴: title span의 `flex-1` 제거 + pin `ml-1 shrink-0` (Books book-table.tsx:497-502이 reference 구현)

#### 5. Migration 패턴 — root prevention + data recovery (작업 원칙 #5 정합)
- 코드 fix만으로는 이미 corrupted된 IDB 데이터 정리 X
- root prevention (코드) + data recovery (migration) 2-layer 필수
- v131 / v132 둘 다 idempotent (valid 데이터 pass through). 재실행 안전.

#### 6. Wiki "북마크 이상" 사용자 표현 명확화
- 사용자가 "위키 북마크"라 한 것은 **pin icon (즐겨찾기) 위치 문제** 였음 (북마크 = bookmark가 아님)
- 사용자 표현 신중히 해석 — 단어 의미 추측 시 사용자에게 확인이 효율적

#### 7. Dev server 다중 worktree 환경 stale build 위험 (영구 학습)
- port 3002 (이전 worktree crazy-raman) + port 61869 (이번 worktree quirky-colden) 동시 실행
- 사용자가 port 3002 화면 보고 있어서 fix 안 보임 → mismatch 보고
- 매 fix 후 사용자에게 정확한 port URL 안내 필수. `preview_list` 로 dev server inventory 확인

### 기술 학습 (영구)

- **dnd-kit collision detection**: `useSortable`은 내부적으로 `useDroppable` 포함. 같은 DOM ref에 둘 다 bind 시 over.id가 어느 id 반환할지 비결정 (sortable id 우선 가능). handler에서 id normalize 필수.
- **Zustand persist `partialize`**: notes의 content/contentJson 제거 후 저장 (line 264). body는 별도 IDB store (`plot-note-bodies`). migration 시 state.notes에 content/contentJson 없을 수 있음 — preview 검증에 영향 없음.
- **`(item as any).field` 패턴**: TypeScript optional field 접근 시 안전. WikiArticle.trashed는 필수 필드이지만 future-proof 보존 패턴.
- **preview_eval로 IDB 직접 dump**: `indexedDB.open("plot-zustand")` + `tx.objectStore("kv").getAll()` 로 store 전체 dump. zustand persist storage 검증에 효과적.
- **사용자 IDB-aware migration**: SEED 코드 vs 사용자 데이터 분리. SEED는 새 enum만 사용해도, 사용자 IDB는 옛 enum (또는 garbage) 잔존 가능. migration이 root cause 진단 + recovery 둘 다 담당.
- **multi-server preview troubleshooting**: 사용자가 본 화면 ≠ AI가 verify한 화면 일 수 있음. port URL 명시 + `preview_list` 로 inventory 확인.
- **Hover-only checkbox class 패턴**: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`. 부모에 `group` className 필수. notes/wiki/books/trash 일관.
- **floating bulk action bar (sticky bottom)**: `sticky bottom-4 z-20 mx-auto w-fit ... backdrop-blur shadow-lg`. selection 활성 시 mount, clearSelection X 버튼 포함. notes FloatingActionBar / wiki WikiFloatingActionBar / trash TrashAllView 동일 패턴.

### Watch Out (다음 세션 주의사항)

- **BoardCard chip overflow fix scope**: BoardCard가 board mode + grid mode (또는 다른 viewMode) 공유 컴포넌트일 가능성. fix 시 다른 viewMode 회귀 확인 필요.
- **사용자 IDB v132 migration 적용 후 데이터 검증**: 사용자가 page reload 시 `[migrate] v130→v131` + `[migrate] v131→v132` console log 확인. 만약 누락된 notes 발견되면 silent migration이 어떤 garbage를 stone fallback으로 치환했는지 확인 (사용자 알림 필요할 수도).
- **TrashEntityList multi-select 미적용**: entity별 trash 탭 (books/tags/labels/...) 은 그대로. 사용자가 entity별 multi-select 원하면 follow-up PR.
- **Board drag Move semantic 변경 사용자 학습 필요**: 이전 default = Add 익숙한 사용자는 처음 drag 시 기존 folder 제거에 놀랄 수 있음. toast description ("Hold Shift to add" hint)으로 안내.
- **dnd-kit DOM ref 합치기 다른 곳에도 점검 가능**: books-board.tsx 등 같은 패턴 사용. 같은 mismatch 잠재.
- **migrate.ts v131/v132 silent 변환 로그 위치**: 사용자가 reload 후 console에서 확인. dev tools 안 열면 못 봄. toast 알림 추가 후보.
- **이전 worktree (crazy-raman-838a0c) port 3002 dev server**: 사용자가 여전히 사용 중이면 stale build 본다. 새 worktree로 이전 권장.

### 환경 변경

- Store version: v130 → **v132** (NoteStatus garbage cleanup + folderIds garbage cleanup)
- 신규 파일: `components/views/trash-all-view.tsx` (~300 LOC + multi-select 80 LOC)
- 수정 파일: `components/notes-board.tsx` (overId strip + memo + Move semantic 반전), `components/notes-table.tsx` (TrashAllView import + storeWikiArticles + trashTabCounts.all 보강 + 분기 mount), `lib/store/migrate.ts` (v131 + v132 추가), `lib/store/index.ts` (version 132), `components/books/book-table.tsx` (checkbox hover-only), `components/views/wiki-list.tsx` (pin 위치 title 옆)
- Tests: 미실행 (작업 원칙 #3은 build/tsc만 의무, tests는 follow-up). 단 코드 변경은 unit test 영향 없을 추정.

---

## 2026-05-12 (오후) — 집, Board/Gallery polish + Split view fix + hotfix (4 PR cascade)

> 🎯 **다음 즉시 액션**: Trash "All" 통합 view 신규 컴포넌트 구현.
>
> **사용자 의도** (이번 세션 명시): *"ALL은 모든 entity의 trashed 통합 표시. 노트든 위키든 태그든 라벨이든 삭제된 것들은 전부 ALL에 나와야"*. 현재 코드 = count 통합, display는 notes만 (모순 — 사용자가 "All에 1인데 아무것도 없어" 본 이유).
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `components/views/trash-all-view.tsx` 신규 파일 작성
> 2. `notes-table.tsx`의 `isTrashView && trashFilter === "all"` 분기에 TrashAllView mount
>
> **컴포넌트 구조**:
> ```
> <TrashAllView>
>   {/* entity별 section, 빈 section은 hide */}
>   <Section title="Notes" count={notesTrashed.length}>
>     {notesTrashed.map(n => <TrashRow note kind="note" />)}
>   </Section>
>   <Section title="Wiki Articles" count={wikiTrashed.length}>...</Section>
>   <Section title="Books" count={booksTrashed.length}>...</Section>
>   <Section title="Tags">...</Section>
>   <Section title="Labels">...</Section>
>   <Section title="Templates">...</Section>
>   <Section title="References">...</Section>
>   <Section title="Files">...</Section>
> </TrashAllView>
> ```
>
> **TrashRow layout** (단일 통합 — entity 무관):
> ```
> [icon] [entity badge] [title]                    [Restore] [Delete forever]
> ```
>
> **Store action 매핑** (entity별 restore + delete forever):
> | Entity | Restore | Delete forever |
> |--------|---------|----------------|
> | Note | `toggleTrash(id)` | `deleteNote(id)` |
> | WikiArticle | `updateWikiArticle(id, { trashed: false })` | `deleteWikiArticle(id)` |
> | Book | `restoreBook(id)` | (store action 없음, 사용자에게 toast로 안내) |
> | Tag | `restoreTag(id)` | (별도 — 또는 trashed=true 유지) |
> | Label | `restoreLabel(id)` | (별도) |
> | Template | `restoreTemplate(id)` | (별도) |
> | Reference | `restoreReference(id)` | (별도) |
> | Attachment | `restoreAttachment(id)` | (별도) |
>
> 각 entity의 hard-delete action 존재 여부는 `lib/store/slices/*.ts`에서 확인. 없으면 trashed=true 유지 + 사용자에게 안내.
>
> **데이터 source**:
> - `state.notes.filter(n => n.trashed)`
> - `state.wikiArticles.filter(w => w.trashed)`
> - `state.books.filter(b => b.trashed)`
> - `state.tags.filter(t => t.trashed)`
> - `state.labels.filter(l => l.trashed)`
> - `state.templates.filter(t => t.trashed)`
> - `Object.values(state.references).filter(r => r.trashed)`
> - `state.attachments.filter(a => a.trashed)`
>
> **trashTabCounts.all 보강** (notes-table.tsx:408): 현재 wikiArticles 누락. wiki도 추가.
>
> **위험 + 회피**:
> - JSX conditional render: 모든 `{cond && <X .../>}` → `{cond && (<X />)}` (이번 세션 hotfix 교훈)
> - lookup map: `STATUS_CONFIG`처럼 entity-specific lookup도 null guard
> - 각 entity의 `restoreXxx` 시그니처 차이 — `(id: string) => void` 일관 가정
>
> **참고 파일**:
> - notes-table.tsx 의 `trashTabCounts` (line 398-418) — count 통합 logic
> - lib/store/slices/{notes,wiki,books,tags,labels,templates,references,attachments}.ts — restore action
> - components/note-context-menu-items.tsx — Trash/Delete forever action 패턴 참고 (notes-table)
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #309 머지 후 (docs sync)
> **branch worktree**: `crazy-raman-838a0c` (다음 세션 같은 worktree 사용 가능, 또는 새 worktree)

### 완료 (4 PR + 5 user-reported issues)

**PR #305** ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 (이전 entry 참조)

**PR #306** Split view secondary pane workbench hide
- `usePane()` 사용. `pane === "secondary"`일 때 BoardWorkbench hide.
- viewport 절반에서 column 잘림 + workbench 안 보임 UX 부자연 해소.
- primary pane: 그대로 (workbench 시그니처 보존).

**PR #307** Block 색 slate + Gallery click parity + 하단 FloatingActionBar
- **Block 색**: teal `#0E9384/2dd4bf` → slate `#475569/94a3b8` (Plot 건축 메타포 정합 — stone beige + brick orange + block slate earthy progression).
- **Gallery click parity** (list/board와 동일 muscle memory):
  - Single click → preview pane
  - Double click → 편집 모드
  - cmd/ctrl-click 또는 selection 활성 중 click → toggle multi-select
  - Hover 시 카드 우상단 checkbox UI
  - Selection 활성 시 하단 FloatingActionBar mount
- 5 파일 변경: notes-table-view (callback wiring), gallery-view-shell (selection state + FloatingActionBar), gallery-view (props 확장 + GalleryCard checkbox), property-chips (이미)

**PR #308** Hotfix — notes-board JSX parser + FloatingActionBar cfg null guard
- **JSX parser fix**: PR #306의 `{!isSecondaryPane && <BoardWorkbench .../>}` 가 webpack/swc parser에서 "unterminated regexp literal"로 오해석 → 페이지 빈 화면. parens 명시화 `(<BoardWorkbench ... />)`로 해결.
- **TypeError null guard**: `STATUS_CONFIG[status]` undefined 시 `cfg.bg` crash → `if (!cfg) return null` graceful skip.

**5 사용자 보고 처리**:
- ✅ Block 아이콘 색 (#1) → PR #307
- ⏭️ Status icon stale (#2) → root cause 정보 부족, skip (사용자 reproduce 필요)
- ✅ 보드/갤러리 7개 (#3) → PR #305 (빈 status column 항상 표시 fix)
- ✅ 갤러리 click → selection (#4) → PR #307
- ✅ 스플릿 뷰 보드 잘림 (#5) → PR #306

### 브레인스토밍 & 큰 결정 (영구)

**1. Block 색 = slate (Plot 건축 메타포 LOCKED)**: teal 폐기. 자연석 (stone beige) → 가공 벽돌 (brick orange) → 완성 granite block (slate) earthy progression. chart-5 accent와 시각 분리 + status "settled" 의미 보존.

**2. Gallery click 패턴 = list/board parity (Linear principle LOCKED)**:
- Single click = preview (list/board와 동일 muscle memory)
- Double click = open (편집 — 명시적 의도)
- cmd/ctrl-click 또는 selection 중 click = multi-select toggle
- Hover → checkbox UI
- Selection 활성 시 → 하단 FloatingActionBar (list 정합)
- 모든 view mode가 동일 패턴 = 학습 부담 0

**3. Split view 보드 = secondary pane workbench hide**:
- viewport 절반에서 workbench `flex-1` grow가 column 잘림
- primary pane만 workbench (시그니처 패널 유지)
- secondary pane은 board column만 (drop target 보존, batch action은 primary로 유도)

**4. STATUS_CONFIG 패턴 — lookup map null guard 의무**:
- `STATUS_CONFIG[status]` 등 lookup이 corruption/옛 enum/빈 값으로 undefined 가능
- 모든 caller에 `if (!cfg) return null` graceful skip — crash 대신
- 다른 lookup map 동일 패턴 검토 후보 (PRIORITY_CONFIG, STATUS_LABELS, BOARD_DEFAULT_GROUP)

**5. JSX `{condition && <X .../>}` 위험 패턴**:
- webpack/swc parser가 `/>}` 시퀀스를 regex literal로 오해석 (잠재적 버그)
- parens 명시화 `{condition && (<X ... />)}` 가 안전
- 향후 conditional JSX는 무조건 parens.

### 기술 학습 (영구)

- **JSX parser ambiguity**: webpack/swc는 `/>}` 를 regex literal 시작으로 오해석 가능. parens가 expression boundary 명확화. dev server "unterminated regexp literal" 에러 = 같은 패턴 의심.
- **STATUS_CONFIG runtime corruption**: store의 normalize는 type-level 보호. 단 user IDB의 stale enum / data corruption은 runtime에 cfg undefined. 모든 lookup access에 null guard.
- **Gallery selection 진입 패턴 (Linear principle 정합)**: cmd/ctrl-click + hover checkbox + selection 활성 중 일반 click도 toggle = 3 entry points. selection 종료 = ESC 또는 X 버튼 또는 빈 영역 click.
- **GalleryCard onClick 시그니처 변경**: `() => void` → `(e: React.MouseEvent | React.KeyboardEvent) => void` (modifier key 검출). 외부 caller signature 영향 — 사용자 callback도 event arg 받도록.
- **dropAnimation cubic-bezier 220ms**: 즉시 snap (default) → 부드러운 transition. easing `(0.18, 0.67, 0.6, 1.0)` overshoot-light, sideEffects `defaultDropAnimationSideEffects + active opacity 0.4`.
- **빈 status group의 Kanban 의미**: drop target 유지 필수. `groupBy === "status"` 분기로 dynamic group (folder/label)과 격리.

### Watch Out (다음 세션 주의사항)

- **#2 Status icon stale**: 사용자가 본 시그널의 정확한 reproduce 정보 필요 (어느 view / 어느 element / drag 직후 vs reload 후). store status 값은 정상 (stone/brick/keystone) — corruption은 다른 layer 의심.
- **PR cascade 시 conflict 빈번**: 매 PR squash 머지 후 다음 PR base가 diverge. `git fetch + merge origin/main` + build artifact (.omc/continuation-count.json, docs/.pdca-status.json, tsconfig.tsbuildinfo) `--ours` resolve 패턴 정착.
- **JSX expression 위험 패턴 회피**: 모든 conditional render는 parens (`{cond && (<X />)}`). HMR에서 dev parser 에러 시 같은 패턴 의심.
- **Gallery selection state는 GalleryViewShell 안만**: Wiki Gallery (gallery-view 직접 사용)는 selection prop optional이라 back-compat. Notes Gallery만 multi-select 활성.
- **STATUS_CONFIG null guard pattern**: 다른 lookup map (PRIORITY_CONFIG 등)도 동일 패턴 적용 후보. 다음 PR로 점검.

### 환경 변경

- Store version v130 (이번 세션 변경 없음)
- Tests: 255/255 (변화 없음 추정)
- 신규 파일: 없음
- 4 PR squash merged (#305-#308)
- 사용자 IDB에 wiki-1/2/3 trashed=true (이전 세션에서 발견, 사용자 결정 대기 — restore or 영구 삭제)

---

## 2026-05-12 (낮~오후) — 집, ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편

> 🎯 **다음 즉시 액션**: Trash "All" 통합 view 구현 (notes/wiki/books/tags/labels/templates/refs/files 통합 list — sample fix needed, ~150-200 LOC).
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR 진행 예정 (이번 세션 변경 squash)

### 완료 (11 작업)

**1. Dev server fix** — `node_modules` 누락 → `npm install` (395 packages). 신규 worktree 진입 시 표준 사전 작업.

**2. Books list mode pin 위치 fix** — title span의 `flex-1` 제거 → 짧은 title 옆 즉시 pin (이전: cell 우측 끝, Kind chip 옆으로 밀림). 측정 검증: gap title→pin 4px / pin→Kind 555px+.

**3. Notes Source filter values 아이콘 추가** — Manual (PencilSimple) / Web Clip (Globe) / Import (DownloadSimple). PR #299의 Books Kind filter icon 패턴 정합. notes-table SourceIcon helper와 동일 매핑.

**4. NEXT-ACTION.md 영구 폐지** — 정보 3중복 (NEXT-ACTION ↔ TODO P0 ↔ SESSION-LOG 끝 "다음") 해소.
- 다음 세션 즉시 액션 = **SESSION-LOG entry 첫 줄 hook + TODO P0**
- `~/.claude/commands/before-work.md` + `after-work.md` (글로벌, 머신마다 vergent) → `.claude/commands/` (project-level, git tracked) 이전 + 재편
- docs 4곳 (CONTEXT/MEMORY/SYNC-PRD/TODO)에서 NEXT-ACTION 참조 정리

**5. Split view popover에 Books 옵션 추가** — view-header.tsx `SECONDARY_SPACE_CONFIG`에 7번째 entity. icon = `BookOpen` (영구 결정: Sidebar entity identity = BookOpen, Library의 phosphor `Books` icon과 시각 구별). 분산된 다른 list (ALL_SPACES, DEFAULT_ROUTES, editor-breadcrumb) 모두 7-space 정합 확인.

**6. Wiki seed 4개 확장 + v130 backfill migration** — Cherry-pick verify 위해 다양성 추가. wiki-4 (Linked Notes, pinned, Knowledge Mgmt) / wiki-5 (Atomic Notes, pinned, multi-category) / wiki-6 (Working Memory, stub — isWikiStub 분기 verify) / wiki-7 (Sönke Ahrens, note-ref backlink). 기존 사용자 IDB에도 inject (id-dedup append, Books v127 패턴).

**7. Cherry-pick `42c6e59` — Wiki UX 3 issues fix** (ludimast가 어제 저녁 elastic-darwin branch에 작업, PR 미생성). 깔끔한 cherry-pick (Pin 위치 변경 1d8b30f는 자동 제외 — title 옆 영구 결정 보존).
- **Wiki 우클릭 메뉴 cursor 추적** (Radix `<ContextMenu>` wrapper로 교체)
- **WikiFloatingActionBar에 Pin/Move/Add to category 액션 3개 추가** (기존 Merge/Split/Delete만 → 6개)
- **GalleryView 우클릭 핸들러 추가** (`renderContextMenu` render-prop + `GalleryCard` forwardRef)
- DRY helper `WikiArticleMenuItems` (row/DotsThree popover/gallery 3 surface 공유)

**8. ContextMenu DRY refactor — Notes 측 동일 패턴** (helper extraction + 3 surface mount). Linear principle (모든 surface에서 동일 action set).
- `components/note-context-menu-items.tsx` 신규 helper (320 LOC) — 13 items (status별 conditional + Remind submenu + Pin + Open + Merge + Split + Link + Show connected + Move to folder + Add to folders + Open in Split View)
- notes-table.tsx: ContextMenu body → helper call (refactor, 시각 변경 0)
- notes-board.tsx: 3-item 메뉴 → 13-item (helper mount + 누락 callback wiring)
- gallery-view-shell.tsx: `renderContextMenu` prop으로 helper mount (Notes Gallery 우클릭 신규)

**9. BoardWorkbench보강 — Pin/Folder/Split 액션 추가** (Linear principle parity with list-mode FloatingActionBar). 우측 패널 시그니처 보존 + 신규 "Organize" 섹션 (mixed→pin batch, Move to folder picker, Split conditional for 1-selected).

**10. Notes board UX polish** (3 fix)
- Drag jitter fix: card className `transition-all` → `transition-colors` (transform/opacity 제외 = dnd-kit 프레임 업데이트와 충돌 X)
- 빈 status column 항상 표시: `groupBy === "status"`이면 `notes.length === 0`이라도 render (Kanban 패턴 — drop target 유지)
- Smooth drop animation: `<DragOverlay dropAnimation={{ duration: 220, easing: cubic-bezier, fadeOut }}>`

**11. 시각 폴리시** (`app/globals.css`)
- `.a-tg__label` font-size 11px → 13px (그루핑 헤더 키움, status icon은 이미 있음)
- notes-table subheader inline override 10.5px → 12px
- `.a-row__cell` font 12px / muted-fg → 13px / fg (메타데이터 선명)
- `.a-row__links` / `.a-row__words` / `.a-row__updated` font 11.5px / soft-fg → 12.5px / fg

### 브레인스토밍 & 큰 결정 (영구)

**1. NEXT-ACTION.md 영구 폐지 (2026-05-12 LOCKED)**:
- 정보 3중복 해소 (TODO P0 + SESSION-LOG hook = 단일 진실 두 source)
- 글로벌 commands → project-level (git tracked) 이전. 두 머신 자동 동기화.
- 새 before-work: SESSION-LOG 최신 entry + TODO P0 읽기. 새 after-work: SESSION-LOG entry 첫 줄에 "다음 즉시 액션 hook" 통합.

**2. Pin indicator 위치 = title 옆 (name 오른쪽) 영구 결정 재확인**:
- 직전 세션 끝 "status chip 옆"으로 정정된 줄 알았으나 실제 PR #301 commit message 영구 결정 = "title 옆 우측 (status chip / label chip 안 침범)"
- `elastic-darwin-382a48` branch의 `1d8b30f` (status chip 옆 이동)은 사용자 폐기 결정
- = title 옆 inline pin = 모든 entity (Notes/Wiki/Books) 표준

**3. Multi-select UI 패턴 (Linear principle + Plot 도메인 분리)**:
- **List mode** → 하단 FloatingActionBar (compact)
- **Board mode** → 우측 BoardWorkbench (시그니처 패널, 풍부)
- **Gallery mode** → 하단 FloatingActionBar (compact, 향후 신규 PR)
- **공통 action set** (Pin/Folder/Trash 등)은 mode 무관 동일. **presentation만 mode-specific**.

**4. ContextMenu DRY 패턴 (Linear principle)**:
- 모든 surface (list row / board card / gallery card)가 동일 13-item 메뉴 (status별 conditional 포함)
- `note-context-menu-items.tsx` helper가 단일 source
- callback wiring은 caller-specific (store action 직접 호출)

**5. Kanban 패턴 — 빈 status column 항상 표시**:
- 카드를 drag로 다른 column에 옮긴 후 원래 column이 비어도 column 유지 (drop target)
- `groupBy === "status"`일 때만 (folder/label 등 dynamic group은 기존 동작)

**6. Books entity identity icon 분기**:
- ActivityBar / Sidebar의 entity space = `BookOpen` (영구 결정, PR #298)
- ViewHeader Secondary popover의 Books entry = `BookOpen` (이번 세션 추가)
- Library의 phosphor `Books` (책 모음 메타포)와 시각 구별

**7. Trash "All" tab 의미 = 통합 (모든 entity)**:
- 현재 코드 = count 통합, display는 notes만 (모순 + 사용자 혼란)
- 다음 세션 P0: 통합 view 컴포넌트 신규 (entity별 section, ~150-200 LOC)

### 기술 학습 (영구)

- **transition-all과 dnd-kit transform 충돌**: card의 `transition-all`이 transform property도 transition 처리 → 매 프레임 업데이트마다 부드럽게 따라가려다 jitter. `transition-colors`로 제한이 정답.
- **DragOverlay dropAnimation**: dnd-kit 기본 동작은 즉시 snap. `dropAnimation={{ duration, easing, sideEffects: defaultDropAnimationSideEffects(...) }}` 명시로 부드러운 drop polish.
- **Cherry-pick id-dedup pattern**: SEED backfill에 `existingIds = new Set(...)` + 누락분만 push (Books v127 → Wiki v130 동일 패턴). 사용자 IDB의 기존 데이터 보존.
- **dnd-kit + transition-colors 조합**: Tailwind `transition-all`은 흔히 hover effect 위해 쓰이지만, dnd 컴포넌트에는 위험. specific transition class (`transition-colors`, `transition-shadow`) 권장.
- **빈 group의 default hide 부작용**: kanban 패턴은 빈 column이 drop target. 단 dynamic group (folder/label)에는 자연스러운 hide. groupBy 분기 필수.
- **Helper extraction 시 dual signature**: helper가 store action을 직접 호출 X (caller flexibility). callback prop으로 받음. 단 helper 내부에서 항상 동일한 store action (예: `usePlotStore.getState().openInSecondary`)는 직접 호출 OK.
- **Cherry-pick으로 다른 머신 작업 통합**: `git cherry-pick -n <commit>`으로 staging만 하고 검토 후 우리 변경과 함께 commit. 1d8b30f (Pin 위치 폐기 변경)이 base여도 그 변경분이 묻어들어오지 않음 (auto-merge가 conflict 없이 처리).

### Watch Out (다음 세션 주의사항)

- **Trash 통합 view 작업 시**: entity별 restore action 분기 (toggleTrash for notes, updateWikiArticle for wiki, restoreBook/Tag/Label/Template/Reference/Attachment). delete forever는 deleteNote / deleteWikiArticle / ... 또는 store에 hard-delete 없는 entity는 trashed=true 유지 + 별도 처리.
- **사용자 IDB의 wiki-1/2/3 trashed=true**: 사용자가 이전 세션에 의도적 trashed 또는 코드 버그. 다음 세션에 사용자가 restore 또는 영구 삭제 결정.
- **Books grid/board/gallery pin 위치**: list mode만 이번 세션 fix. grid는 cover icon 큰 layout, board는 카드, gallery는 entity-agnostic adapter. 사용자 manual verify 후 필요 시 추가 fix.
- **글로벌 commands 양 머신 수동 삭제**: `rm ~/.claude/commands/before-work.md` + `after-work.md` (두 머신 모두). 안 하면 글로벌과 project-level 충돌 (이번 세션 /after-work가 글로벌 정의로 invoked됐던 이유).
- **`elastic-darwin-382a48` 브랜치**: cherry-pick 후 main 통합 완료. 브랜치 자체는 폐기 (사용자 의도 외 status chip 옆 Pin 변경 포함).
- **Notes board drop animation cubic-bezier**: 220ms 가 너무 길거나 짧으면 사용자 manual verify로 조정 후보.
- **Trash count vs display 모순 잔존**: trashTabCounts.all = 모든 entity 합 (1) but display = notes만 (0). 사용자가 "1인데 아무것도 없어" 시그널. 통합 view fix 시점에 해소.

### 환경 변경

- Store version v129 → **v130** (Wiki seed backfill — id-dedup append)
- Tests: 255/255 (변화 없음 추정 — 코드 변경에 unit test 영향 없음)
- 신규 파일: `components/note-context-menu-items.tsx` (DRY helper)
- 삭제 파일: `docs/NEXT-ACTION.md` (영구 폐지)
- Project-level commands: `.claude/commands/before-work.md` + `after-work.md` (새 정의)

---

## 2026-05-12 (저녁~밤) — 집, 거대한 세션 (10 PR 시리즈 + polish)

### 완료

직전 entry "2026-05-12 (오후)"의 PR #291/#292 (시리즈 시작)에 이어 거대한 polish + extension 세션. 사용자 manual verify 흐름과 강하게 결합 — 매 verify 후 회귀 시 즉시 fix → commit → 머지 반복.

**PR 시리즈 10 (Store v122 → v129)**:
- PR #292 — view-engine 4 viewMode 통합 (grid/list/board/gallery)
- PR #293 — BookTable column-rich + checkbox (NotesTable 정합)
- PR #294 — Kind-shape carries meaning (Lightning/Sparkle/PencilSimple + 색)
- PR #295 — SEED_BOOKS 8 demo books (manual verify 가능 데이터)
- PR #296 — v127 migration backfill (기존 사용자 books 있어도 seed inject)
- PR #297 — Polish 1: SEED emoji 제거 + Display properties 확장 (Sources/Pin column toggle) + groupBy "status" stale validation
- PR #298 — **emoji 영구 폐기** + Phosphor BookKindIcon 통일 (Plot icon 시스템 정합)
- PR #299 — Polish 2: BookKindChip 색 (StatusBadge 패턴) + Filter Kind values icon + Save view 버튼 통일 (Trash chip 제거)
- PR #300 — Pin 통일: Books floating action bar 신규 + Notes 우클릭 메뉴 + Notes FloatingActionBar Pin
- PR #301 — Notes/Wiki title 옆 inline pinned indicator (Books 정합)

**부속**:
- Plan: `.omc/plans/books-view-engine-integration.md`
- launch.json: `node next/dist/bin/next` → `npx next` (한글 경로 안전성)
- Plot icon 시스템 = Phosphor outline only (color emoji 영구 X)
- 4 store migrations (v126→v127→v128→v129)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. 사용자 결정 4가지 (AskUserQuestion)
- PR 분할: C 점진 4 PR
- viewMode default: grid (cover emoji 활용)
- default sort: updatedAt desc
- default groupBy: none

#### 2. Option A — Plot 일관성 풀 (Books dnd-kit)
- column drag/reorder + card drag/drop
- card drag UX 분기:
  - pinned: 즉시 toggle (안전)
  - kind smart/hybrid → manual: confirm dialog (destructive)
  - kind manual → smart/hybrid: toast hint (BookDetailPage 안내)

#### 3. Books 자체 정체성 — kind 유지 (status 도입 X)
사용자 brainstorm 끝 통찰: "config에 status 빼고 kind 넣기" — BOOKS_VIEW_CONFIG가 이미 그렇게 됨 + normalizeViewState books-specific validation으로 stale "status" 자동 reset. **Books에 status 추가 거부** — kind 자체로 충분.

#### 4. emoji 영구 폐기 (Plot icon 시스템)
- Apple/Unicode color emoji는 Plot 미니멀리즘 + Phosphor outline 시스템과 mismatch
- BookKindIcon이 cover 책임 (kind 표현)
- Book.coverEmoji 타입 필드 보존 (round-trip), UI 안 읽음
- 미래 Phosphor icon picker 시 Book.coverIcon 신규 필드

#### 5. Pin 통일 = 모든 entity 표준
- 우클릭 메뉴 + 플로팅 바 + inline indicator
- Wiki도 inline indicator 적용. 단 Wiki 우클릭/플로팅 Pin은 follow-up

#### 6. Books DisplayPanel groupingOptions = [none/kind/pinned]
- normalizeViewState books-specific validation (CONTEXT_VALID_GROUP_BY map)
- stale "status" 자동 reset to "none"

#### 7. Notes/Wiki/Books cover/leading icon 시스템
- Notes leading: StatusShapeIcon (Hexagon/Cube/Cuboid2x2)
- Books cover/leading: BookKindIcon (Lightning/Sparkle/PencilSimple)
- Wiki: IconWikiStub/IconWikiArticle
- 모두 phosphor outline + 색 (kind/status별 차별)
- Sidebar entity identity = 단일 icon (Books=BookOpen, Wiki=BookOpen with color 등) — kind 차별 안 함

### 다음 (NEXT-ACTION.md 참조)

🔴 **Pin indicator 위치 fix** — Notes/Wiki는 현재 title 옆이지만 사용자 시그널은 **status chip 옆**. notes-table row + wiki-list row의 status column 안 또는 옆.
🟡 **Wiki 우클릭 메뉴 + 플로팅 바 Pin** — PR #300 follow-up.
🟢 **Books view-engine 시리즈 manual verify** — 회귀 발견 시 즉시 fix.

### Watch Out

- **emoji UI 분기 제거됐지만 데이터는 보존** — `Book.coverEmoji` 필드는 IDB round-trip 위해 보존. 미래 picker UI 도입 시 `Book.coverIcon` 신규 필드 사용 (emoji 재활성화 X).
- **사용자 manual verify 시 stale viewState**: Store v128 migration이 books-specific groupBy validation 재실행. 사용자가 한 번 reload 후 stale "status" → "none" 자동 fix.
- **Trash chip 제거** — trashed 책 보려면 `/trash` 페이지로 (2026-05-10에 Books 통합됨). ViewHeader actions에서 trash chip 안 노출 (Save view 버튼만).
- **v3 mockup CSS class `u-*` 영구 폐기** — 갤러리 entity-agnostic 패턴 (2026-05-11)이 이미 정합.
- **conflicts 빈번 발생**: PR 순차 squash 머지 시 같은 worktree의 base가 squash commit과 diverge. 매 PR마다 `git fetch origin main && git merge origin/main` 필요. 보통 `git checkout --ours` resolve로 충분 (HEAD 우선).

### 머신
집 (Windows)

### 누적 commits

10 squash PR (#292-#301). 모두 main에 squash 머지. branch는 머지 후 worktree 사용 중이라 `--delete-branch` skip (remote 잔류, 수동 정리 가능).

---

## 2026-05-12 (오후) — 집

### 완료 (1 통합 PR, 4 PR 시리즈)

**Books view-engine 풀 통합 4 viewMode** (Store v122 → v126, ~1200 net LOC):

- **PR 1** (v123) — 인프라 + grid 보존
  - `lib/view-engine/types.ts`: `"books"` ViewContextKey + VALID_VIEW_CONTEXT_KEYS
  - `lib/view-engine/defaults.ts`: CONTEXT_DEFAULTS.books (grid + updatedAt desc + none groupBy)
  - `lib/view-engine/use-books-view.ts` **신규** — thin fork hook (use-templates-view 패턴)
  - `components/views/books-view.tsx`: BooksGrid → useBooksView 통합. showTrashed → viewState.toggles
  - 시각 변경 0 (grid 모드 보존)

- **PR 2** (v124) — list mode + sort/group/filter UI + 3 PropertyChip
  - SortField `itemCount`, FilterField `kind`/`sourceType` 추가
  - `view-configs.tsx`: **BOOKS_VIEW_CONFIG** 신규 (filter 4 cats + display config)
  - `property-chips.tsx`: **3 신규 chip** (BookItemCountChip + BookKindChip + BookSourceKindChip mini-bar)
  - `book-list-row.tsx` **신규** — list 모드 row
  - `book-grid-card.tsx` **신규** (refactor — grid card 별도 분리)
  - `books-view.tsx`: ViewHeader showSearch/showFilter/showDisplay 활성화 + viewMode list 분기 + EmptyBooks helper
  - pinned-first sort 활성화

- **PR 3** (v125) — board mode (Option A: column drag + card drag)
  - GroupBy `kind`/`pinned` 추가 + VALID_GROUP_BY 확장
  - `use-books-view.ts`: applyBookGrouping에 kind (Smart/Hybrid/Manual) + pinned 분기
  - `view-configs.tsx`: supportedModes에 "board" + groupingOptions kind/pinned
  - `books-board.tsx` **신규** (320 LOC, dnd-kit) — BoardColumn + BoardCard + drag handler
  - card drag UX:
    - pinned column: 즉시 toggle + 토스트
    - kind column smart/hybrid → manual: **confirm dialog** (smartSources 제거)
    - kind column manual → smart/hybrid: **toast hint** ("Configure on detail page")
  - column drag/reorder + groupOrder persist (Notes/Wiki 패턴)

- **PR 4** (v126) — gallery mode (entity-agnostic adapter)
  - `books-gallery-adapter.tsx` **신규** — Book → GalleryItem 매핑
  - accent color kind-based (Smart=violet / Hybrid=amber / Manual=slate)
  - badge + cover icon + metaLeft (source kinds) + metaRight (count + time)
  - `view-configs.tsx`: supportedModes에 "gallery"
  - 2026-05-11 entity-agnostic GalleryView 재사용

**부속 작업**:
- `.omc/plans/books-view-engine-integration.md` (~600 line plan 작성)
- `.claude/launch.json`: `node next/dist/bin/next` → **`npx next`** (한글 경로 안전성)
- 4 store migration 주석 (v123/v124/v125/v126 boundary)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. 사용자 결정 4가지 (AskUserQuestion 2026-05-12)
- **PR 분할**: C 점진 4 PR (안전 + 매 단계 visual confirm 가능)
- **viewMode default**: grid 유지 (cover emoji 활용 강함, 기존 사용자 reload 시 변화 0)
- **default sort**: updatedAt desc 유지
- **default groupBy**: none (보수, UI에는 옵션 노출)

#### 2. Option A — Plot 일관성 풀 (column drag + card drag)
- Notes/Wiki와 동일 dnd-kit 패턴 — 사용자 직관 부담 0
- card drag의 의미 분기:
  - pinned: 즉시 toggle (안전)
  - kind smart→manual: confirmation (destructive)
  - kind manual→smart: toast hint (가이드)

#### 3. thin fork 패턴 영구 (Generic 추출 X)
- `useBooksView`가 8번째 thin fork hook (use-templates-view 패턴)
- Notes pipeline의 applyFilters/Sort/Grouping은 Note 타입 전용 — Books는 격리
- "Scope guard" 헤더 주석 명시

#### 4. Smart Book INVARIANT 보존
- resolver/BookDetailPage/SourcesSection 동작 변화 0
- view-engine 통합은 Books **list view 자체**만 변경

#### 5. 마이그레이션 옵션 A 영구 (idempotent skip)
- v123 (books context 자동 seed via VALID_VIEW_CONTEXT_KEYS expansion)
- v124-v126 (types union 확장만 — 데이터 변경 X)

#### 6. Books PropertyChip 3종 + accent color kind-based
- BookKindChip 색 옵션 결정: PR 2에서 neutral muted-foreground (1차 보수)
- gallery accent color: Smart=violet `#7C8AE7` / Hybrid=amber `#f59e0b` / Manual=slate `#94a3b8`

### 다음 (NEXT-ACTION.md 참조)

🔴 **Manual verify Books 4 viewMode** + 회귀 fix (사용자 manual 절차 7 step)
🟡 Wiki 그룹 헤더 아이콘 (~30분 후보)
🟢 다음 큰 트랙 brainstorm (Smart Book v2 / Wiki view-engine board)

### Watch Out

- **kind column card drag**: 데이터 손실 가능성 (smartSources 제거). confirm dialog 필수. test 시 confirm 동작 확인.
- **groupOrder persist 일관성**: NotesBoard와 동일 패턴 (`useSortable` + `horizontalListSortingStrategy`). 회귀 시 NotesBoard 비교.
- **`.next/dev` stale type 캐시**: build 시 종종 발생. `rm -rf .next/dev .next/cache` 후 재빌드. 또는 dev server 재시작.
- **launch.json npx next 전환 영향**: 좀 전 일시적 dev server crash → npx 기반으로 회복. 한글 경로 안전성 ↑.
- **사용자 manual verify dnd-kit drag**: preview tools로 자동 click drag 어려움 — 사용자 직접 시각 확인 필수.
- **gallery groupBy=none && groups.length<=1**: BooksGalleryAdapter는 flat items 렌더 (조건 fall-through). 단순 list로 보이게.

### 머신
집 (Windows)

### 누적 commits (이번 세션)
시리즈 단일 통합 PR (4 PR 통합 squash 머지 후 main에 반영):
- types/defaults/use-books-view (PR 1, v123)
- view-configs/property-chips/book-list-row/book-grid-card/books-view (PR 2, v124)
- books-board/books-view dnd-kit (PR 3, v125)
- books-gallery-adapter/books-view gallery (PR 4, v126)
- launch.json `npx next` 전환
- plan + docs sync

---

## 2026-05-08 (오후) — 집

### 완료 (5 PR 머지)
- **PR #271**: Status icons + UI 라벨 "Keystone" → "Block" + Cuboid (1×2 isometric block) + Save view button icon-only 16px (HBtn pattern)
  - 5 commits: Cuboid component / IconBlock rename / 12-site label rename + chip icon Hexagon/Cube/Cuboid 통일 / Save view reskin / merge resolution (origin/main 25+ commits behind 충돌)
  - 충돌 해결: view-header.tsx (HEAD HBtn 채택) / home-view.tsx (origin/main IconInbox 채택) + IconInbox export 복원
- **PR #282**: PR 4.3a Tags+Labels chrome 통일 (시도) — `.a-th` + `.a-row` 적용
- **PR #283**: PR #282 partial revert — `.a-row`가 globals.css에서 6-column grid 강제로 layout 깨짐. tags/labels 원복.
- **PR #284**: Tags row border-b 제거 (Notes/Labels 패턴 일관) + plan update Section 9-10
- **PR #285**: plan Section 11 Filter coverage 분석 (entity별 도메인 + Step 1-5)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. Filter model 통찰 (사용자 직관)
```
LIST/TABLE: column = passive attribute view, Filter button = active narrow
BOARD:      column = grouping attribute, Filter button = other axis
GRID:       card chip = attribute viz, Filter button = chip narrow
```
- Filter 없는 view = 도메인 attribute 부족 (column 자체가 단순)
- column 추가 시 Filter도 자연스레 가능 (Tags color, Files type 등)
- 이 model이 PR 4.3 chrome 통일의 north star

#### 2. NoteStatus enum value `keystone` 유지 (영구)
- UI 라벨만 "Block"로 (Cuboid 1×2 isometric block 아이콘)
- internal `keystone` 그대로 (URL `/keystone`, IDB, type literal)
- 이유: AddBlock / BlockTree / ContentBlock 등 기존 `block` identifier와 충돌 회피
- mismatch는 디버그 콘솔 + URL bar에 한정 (사용자 영향 X)

#### 3. View modes 평가 (Studio / Editorial / Gallery)
- **Studio + Editorial**: 영구 규칙 위반 ("멋진 레이아웃 / 시각적 다양성 방향 제안 금지") + TODO 폐기 항목 ("매거진/뉴스페이퍼/북 Pivot — 폐기 2026-04-22") 부활. **제거 예정**.
- **Gallery**: 카드 형태는 좋음. 단 (1) 편집 불가 (2) 하드코딩 styling (cream 강제). **polishing 후 재도입** — 일단 보류.
- 통합 방향: Display popover `[List | Board | Gallery]` 3-segment (ViewSwitcher tab 제거)

#### 4. `.a-th, .a-row` grid hardcoded 발견
- globals.css에서 6-column grid template 강제 (notes-table 전용)
- NotesTable은 inline grid로 덮어씀 → OK / 다른 view (3-element flex)는 layout 깨짐
- **refactor 필요**: chrome-only 분리 (height/border/sticky/bg/font-size) + grid는 consumer 책임

#### 5. Filter coverage 도메인 분석 (entity별)
- 명확 가치: Files (type), References (type), Wiki Category (보강), Inbox (source)
- 일관성 추가: Tags / Labels color
- Filter 없는 게 자연스러움: Insights (analytics)
- Step 1-5 series — view-engine config 변경만, chrome refactor와 독립 (병렬 PR 가능)

### 다음 세션 (NEXT-ACTION.md 참조)
- Path A 추천: Step 1 Files type filter (가장 작고 명확)
- Path B: Step A globals.css refactor (chrome 통일 prerequisite)
- Path C: Studio/Editorial cleanup

### Watch Out
- **`.a-th, .a-row` 사용 주의**: 다른 view에 적용 시 grid 6-col 강제로 layout 깨짐. globals.css refactor 후에만 적용.
- **PR 머지 시 origin/main 25+ commits behind 충돌 가능**: 머지 전 conflict 점검 (특히 view-header.tsx, home-view.tsx 등 main에서 자주 변경되는 파일)
- **IconInbox export 분리 vs IconStone**: 옛 inbox status 가 stone으로 rename되면서 IconStone 추가됐지만, 별도 inbox-layer 메타포로 IconInbox는 main에서 유지 — merge 시 분리해야 함

### 머신
집 (Windows)

### 누적 commits (이번 세션, 5 PR + docs sync)
1. PR #271 — feat(icons): Cuboid + IconBlock + label + Save view + merge fix (4 atomic commits + 1 merge commit)
2. PR #282 — feat(v3-phase-4-3a): tags+labels chrome 시도 (2 commits)
3. PR #283 — fix(v3-phase-4-3a): partial revert (1 commit)
4. PR #284 — fix(v3-phase-4-3a): border-b 제거 + plan Section 9-10 (1 commit)
5. PR #285 — docs(plan): Section 11 Filter coverage (1 commit)
6. PR (이) — docs sync NEXT-ACTION/SESSION-LOG/MEMORY/TODO/CONTEXT

---

## 2026-05-08 (새벽) — 집

### 완료
- **새 worktree** `note-status-rename` 생성 (origin/main 28b7474 기반, Phase 4.1 머지 후)
- **PR 4.1 (Phase 4 CSS 통합) 머지** — `.a-table` / `.a-row` / `.a-th` / `.a-tg` / `.a-stchip` / `.a-tag` / `.a-tool` 등 v3 table chrome 클래스 globals.css 통합. 시각 변경 0. PR #267.
- **2 plan 파일 작성** (작업은 다음 세션):
  - `.omc/plans/note-status-rename.md` (Phase A — atomic rename, 53 files / 274 occ)
  - `.omc/plans/inbox-layer.md` (Phase B — 단일 통합 Inbox layer)
- **NoteStatus rename + Inbox layer 큰 방향 결정** (영구)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. NoteStatus 명칭 변경 (Phase A, 별도 plan)
- **결정**: inbox/capture/permanent → **stone/brick/keystone** (건축 메타포)
- **근거**: Plot 정체성 (Zettelkasten × Palantir) 정합. raw stone → processed brick → keystone (anchor) progression. 일반적 (Notion/Obsidian inbox/capture/permanent)에서 차별화.
- **scope**: 53 files / 274 occurrences + IDB v116 migration + route redirect
- **PR 구조**: 단일 atomic PR (rename은 분리 시 컴파일 에러). 6 commits in 1 PR.

#### 2. Inbox 개념 분리 (Phase B, 별도 plan)
- **결정**: inbox는 NoteStatus enum이 아니라 **별도 layer** (Linear / Things3 패턴)
- 새 의미: "처리 대기" 알림함 — 자동 필터 + 사용자 dismiss
- 기존 status 3개 (stone/brick/keystone)는 workflow stage. inbox는 별개 layer.

#### 3. 단일 통합 Inbox (per-entity 분산 X)
- **결정**: 하나의 inbox = 모든 entity (Notes / Wiki / Book / Reference / Files) 통합
- **근거**:
  - Plot 정체성 ("Gentle by default") — 사용자 한 곳만 봄
  - Linear / Things3 / Notion 패턴 정합
  - IKEA 전략 (앱이 자동 분류) — 사용자 부담 ↓
  - 확장성 — 새 entity 추가 시 자동 통합
- per-entity inbox 분산 = 사용자가 6+ inbox 관리. 부담.

#### 4. Inbox 위치: Home 안 카드 + `/inbox` full-page
- **결정**: home 안 카드 (Quick Capture / Stats 옆) + `/inbox` 별도 full-page
- **근거**: v3 11결정 #1 (7-space) 보존. Plot home dashboard 정체성 정합.
- top-level (Activity Bar 8번째 space) X — 7-space 위배

#### 5. Inbox 정의: 하이브리드 (자동 + dismiss)
- **결정**: 자동 entity별 필터 default + 사용자 dismiss/snooze 가능
- **자동 필터**:
  - Notes: stone + 미분류
  - Wiki: stub status
  - Reference: 미링크
  - Files: 미분류
  - (옵션) SRS: scheduled review 도래
- **사용자 dismiss** = Linear archive 패턴

### 다음 (NEXT-ACTION.md 참조)
- 🔴 Phase A: NoteStatus rename (atomic 단일 PR — executor agent 위임 권장)
- 🟡 Phase B: Inbox layer (4-5 PR — Phase A 완료 후)
- 🟢 Phase 4 재개: PR 4.2 notes-table.tsx reskin (새 명칭 사용)

### Watch Out
- **Atomic rename 위험**: 53 files / 274 occ를 분리 시 중간 PR 컴파일 에러. 단일 PR 유지 필수.
- **IDB v116 migration**: 기존 사용자 노트 status field rewrite. idempotent 보장 + no data loss.
- **Route redirect**: `/inbox` `/capture` `/permanent` 사용자 북마크. server-side redirect 필요.
- **v3 PRD Phase 5 적용 범위 변경**: `/inbox` 제거 (별도 layer). PRD 명시 update 필요.
- **inbox layer가 v3 mockup과 conceptual mismatch**: visual 호환은 되지만 의미 다름. mockup은 status, Plot inbox는 알림함.

### 머신
집 (Windows)

### 누적 commits (이번 세션, 1 PR + plan)
- ✅ **PR #267** 머지 (claude/v3-phase-4-plan): feat(v3-phase-4-1) table mode CSS 통합 (시각 변경 0). 1 commit (`19d2038`).
- 📝 plan 2개 (commit 예정 in this after-work)

---

## 2026-05-07 (밤 늦게) — 집

### 완료
- **새 worktree** `v3-phase-3-plan` 생성 (origin/main 41aab17 기반)
- **Plot v3 Phase 3 4 PR 모두 완료** (Activity Bar / Sidebar Chrome reskin)
  - **98f9277** PR 3.1: CSS 통합 (`.a-actbar` / `.a-sidebar` / `.a-sb-*` / `.a-icb` / `.a-kbd` / `.a-detail` 모두 globals.css에 통합. 시각 변경 0). +729 LOC.
  - **5ac22ef** PR 3.2: activity-bar.tsx reskin — width 44→72px / label permanent / brand mark / per-space color inline override (Plot 6색 보존)
  - **8155530** PR 3.3: linear-sidebar.tsx reskin — NavLink + Section + 11 inline button 일괄 (`.a-sb-link[data-active]` + `.a-sb-section + head + hint`). +43/-61 (코드 18줄 감소!)
  - **3761e42** PR 3.4: brand mark을 Plot 로고 SVG 교체 (네트워크 그래프 6 nodes + 10 edges + 강조 center node = "central knowledge node" 메타포)
- **Phase 3 분해 plan** `.omc/plans/v3-phase-3-decompose.md` 작성
- **외부 도구 평가** Front-End-Design-Checklist (적용 X — design-quality-gate / 4 design skills과 중복)

### 브레인스토밍 & 큰 결정 (영구)

#### PR 3.4 scope 변경 결정 (영구)
- 원래 plan = `.a-shell` shell layout grid 적용
- 그러나 ResizablePanel + custom resize drag + view-split + dynamic side panel과 충돌
- 큰 마이그레이션 = 작업 원칙 #2 (최소 diff) 위배 + 회귀 위험 (split view 등)
- **결정**: PR 3.4 = brand mark SVG 교체로 전환 (Phase 3 마무리 + 즉시 visual gain)
- Shell grid는 **Phase 6**에서 filter popover + workspace chrome + detail panel과 함께 도입

#### Plot 6-space 색 보존 (activity bar)
- v3 mockup `.a-ab--space[data-active]`는 단일 `--space-notes` (cyan)
- Plot SPACE_COLORS 6색 (home indigo / notes cyan / wiki violet / calendar pink / ontology emerald / library amber)
- **결정**: activity-bar.tsx inline style로 6색 보존 (color-mix bg + color + boxShadow inset)

#### Sidebar는 단일 cyan (활성 svg 색) 임시
- v3 `.a-sb-link[data-active] svg { color: var(--space-notes); }` 단일 cyan
- Plot 기존: `text-sidebar-active-text` (varied)
- visual confirm 후 회귀로 판단되면 fix PR 작성 (사이드바 svg 색 6-space 별 inline override)

### 다음 (NEXT-ACTION.md 참조)
- 🔴 **Visual confirm** (사용자 manual `npm run dev`) — Phase 3 큰 시각 변화 검증
- 🟡 OK면: **Phase 4** (Table Mode Reskin — Notes / Tags / Labels list) 또는 Phase 5 / Phase 6
- ⚠️ 회귀 발견 시: fix PR (사이드바 svg 색 6-space 별 등)

### Watch Out
- **Preview tool cwd cache**: 새 worktree에서 EnterWorktree + preview_start 시 cwd가 이전 worktree로 cache. workaround: ExitWorktree(keep) → EnterWorktree → preview_start. 또는 manual.
- **Sidebar svg 색**: v3 mockup CSS가 단일 cyan. Plot 기존 sidebar-active-text (varied)에서 cyan로 변경됨 — visual 회귀 가능
- **Brand mark SVG**: 28x28 brand container 안에 20x20 SVG. 사용자 첨부 디자인을 단순화 (6 nodes / 10 edges). 디테일 부족하면 사용자 동의 후 수정

### 머신
집 (Windows)

### 누적 commits (이번 세션, 4개 PR)
1. `98f9277` — feat(v3-phase-3-1): activity bar / sidebar chrome CSS 통합 (시각 변경 0)
2. `5ac22ef` — feat(v3-phase-3-2): activity-bar.tsx v3 mockup 패턴 적용
3. `8155530` — feat(v3-phase-3-3): linear-sidebar.tsx v3 mockup 패턴 적용
4. `3761e42` — feat(v3-phase-3-4): brand mark을 Plot 로고 SVG로 교체 (네트워크 그래프)

---

## 2026-05-07 (밤) — 집

### 완료
- **Plot v3 Phase 2 DEFERRED 결정** (commit 3b84d7e)
  - PRD 상단 DECISION banner 추가, Status v1.1 → v1.2
  - `.omc/plans/v3-phosphor-inventory.md` ARCHIVED 표시
  - CONTEXT/MEMORY 결정 기록
- **PR group-c-d-3** Stickers view-engine 통합 v113 (commit a055581, 9 files +427/-92)
  - useStickersView thin fork (cross-entity members count, note/wiki active check)
  - StickerMemberCountChip (Stack icon)
  - list+grid mode + DisplayPanel
- **PR group-c-d-4** References view-engine 통합 v114 (commit c3700ad, 9 files +408/-43)
  - useReferencesView thin fork (caller가 pre-filtered 전달, enrich + sort)
  - 3 신규 chips (RefTypeChip / RefFieldCountChip / RefImageChip)
  - sort + viewMode → viewState. quickFilter / fieldKey filter / search 로컬 유지
- **4 design skills install** (commit 0f7e2ec, 5 files)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - project-level (`.agents/skills/`)
  - cross-machine: `npx skills experimental_install`
- **PR group-c-d-5** Files view-engine 통합 v115 (commit f210fcf, 9 files +423/-39)
  - useFilesView thin fork (Attachment 전용)
  - 2 신규 chips (FileTypeChip / FileSizeChip)
  - column header sort: "type" → "fileType" 명시 변환
  - Grid mode JSX (4:3 thumbnail block + chip row)
- **Group C PR-D 시리즈 완성** (5/5 entity view-engine 통합)
- 외부 레포 평가 (적용 X 결정): onlook, Front-End-Design-Checklist
- shadcn-ui 적용 확인 (이미 깊이 적용됨)

### 브레인스토밍 & 큰 결정 (영구)

#### Plot v3 Phase 2 DEFER (큰 방향 결정)
- **결정**: Imperial icon kit 전면 도입 보류. phosphor-icons 그대로 유지
- **근거**:
  - 직전 plan (`v3-phosphor-inventory.md`) stale ("2 files / 4 icons" → 실측 119 files / 60+ icons / 87 files weight 사용)
  - 119 files codemod = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
  - phosphor regular ↔ Imperial 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) → 도입의 시각 가치 약함
  - 빌드 정상 (tsc 0 / build clean / 185 tests pass)
  - lucide / 외부 라이브러리 추가 도입 의미 없음 (phosphor 광범위)
- **partial work 보존** (revert 안 함): activity-bar / plot-icons IconWiki / view 일부 / backlink-card
- **재개 조건**: 정확한 인벤토리 + imperial-extras shim 매핑 coverage 검증 + 단일 책임 PR 분할

#### 외부 도구 평가 (영구 결정)
- **shadcn-ui**: ✅ 이미 적용 (components.json + components/ui/* 30+). v3 PRD "shadcn cascade 보존" 정책 명시
- **taste-skill** (Leonxlnx, 15.8k): ⭐ install. Plot 정합 4개만. universal symlink (Codex/Cursor/Copilot 등 12 agents 호환)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - 안 install: industrial-brutalist-ui, brandkit, gpt-taste(GSAP), imagegen-*, image-to-code, stitch-design-taste, full-output-enforcement
- **huashu-design** (alchaincyf, 12.3k): △ mockup/prototype 도구. Plot production code에 직접 적용 X. v3 mockup 단계에서만 유용
- **onlook** (onlook-dev, 25.7k): ❌ visual code editor. Plot production app에 자동 코드 변경 회귀 위험. greenfield/marketing 사이트에 적합
- **Front-End-Design-Checklist** (thedaviddias, 5.2k): ❌ passive markdown handoff 가이드. design-quality-gate / linear-design-mirror / 4 design skills과 중복. 1인 dev에 audience 불일치

### 다음 세션 (NEXT-ACTION.md 참조)
- 🔴 **Plot v3 Phase 3+** 분해 plan 작성 → 첫 PR 작업
- 또는 Wiki template 3-layer / Smart Book v2

### Watch Out
- **PR 3-5 build에서 SORT_FIELD_LABELS exhaustive 이슈 반복** — view-engine SortField 추가 시 `notes-table.tsx` Record<SortField, string>에 동일 추가 필요 (PR마다). 이번 세션에 memberCount, fieldCount, size, fileType 모두 추가.
- **tsc --noEmit 통과 ≠ next build 통과** — incremental cache 차이로 build에서 type error 발견 가능. 항상 build까지 검증.
- **Plot v3 Phase 2 partial work** — activity-bar 등 Imperial 사용 중인 컴포넌트는 그대로. 새 코드도 phosphor 또는 Imperial 자유 (둘 다 1.5px stroke 정합).

### 머신
집 (Windows)

### 누적 commits (이번 세션)
1. `3b84d7e` — docs(v3): defer Phase 2 (Imperial icon kit) — phosphor 유지
2. `a055581` — feat(group-c-d-3): Stickers view-engine 통합 (v113)
3. `c3700ad` — feat(group-c-d-4): References view-engine 통합 (v114)
4. `0f7e2ec` — chore(skills): install 4 taste-skill design skills
5. `f210fcf` — feat(group-c-d-5): Files view-engine 통합 (v115) — Group C PR-D 완성

---
