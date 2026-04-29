# Plot Sync — Product Requirements Document (v2.0 Spec)

> **⚠️ 상태 변경 (2026-04-29 오후 후반)**: 이 PRD는 **v2.0 미래 작업 가이드**.
> 결정 #3 변경: (a) Sync 포함 출시 → **(c) Free 출시 후 6개월~1년 후 Sync 도입**.
> **즉시 작업은 [`docs/NEXT-ACTION.md`](./NEXT-ACTION.md) — 출시 준비 + 폴리시 (1~2개월).**
> 이 문서는 Sync v2.0 진입 시점에 다시 활성화되며, 그 시점에 사용자 피드백 반영해서 보강.
>
> **참조**: [`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md) — 6개 결정 + 옵션 비교
> **현재 작업 추적**: [`docs/TODO.md`](./TODO.md) → "출시 준비" 섹션

---

## 1. Goals

### 1.1 핵심 목표

1. **다중 기기 sync** — 사용자가 여러 기기(데스크톱 + 모바일)에서 같은 노트/위키/메타데이터 사용
2. **수익 모델 도입** — Sync = 유료 ($5/월), Pro = $10/월
3. **프라이버시 보장** — E2E 암호화, 서버는 노트 내용 못 봄
4. **출시 포함** — Sync는 출시 핵심 기능, "그냥 노트앱"이 아닌 **Obsidian 대체재** 포지셔닝

### 1.2 성공 지표 (출시 6개월 후)

- 활성 사용자: **500+**
- 유료 전환율: **3%** (15+ paid)
- 월 매출 (MRR): **$75+**
- 데이터 손실 incident: **0건**
- E2E 키 분실 incident: **<5%** (recovery phrase 안내 효과)

---

## 2. Non-Goals (의도적 제외)

- ❌ **다중 사용자 협업** — Plot은 1인 도구. 협업 모드 안 만듦 (Notion/Coda와 다른 포지셔닝)
- ❌ **실시간 공동 편집** — sync ≠ collab. 같은 사용자의 다중 기기만 sync
- ❌ **AI/LLM** — 영구 규칙 유지 (sync 도입과 무관)
- ❌ **공유 vault** — 가족 공유는 Phase 5+ 검토 (Pro tier 옵션이지만 우선순위 낮음)
- ❌ **공개 페이지** (Obsidian Publish 같은) — Plot 정체성 X
- ❌ **자체 서버 운영** — Supabase로 시작. 1만+ 사용자 도달 시 마이그레이션 검토

---

## 3. User Stories

### 3.1 Free 사용자 (현재 Plot 그대로)

```
A. 데스크톱에서 Plot을 무료로 사용한다.
B. 노트, 위키, 태그 모두 IDB에 로컬 저장.
C. 단일 기기, sync 없음.
D. Plot 코어 기능 (제텔카스텐, 온톨로지, 인사이트) 모두 제공.
```

### 3.2 Sync 사용자 ($5/월)

```
A. 매직 링크 또는 Google/Kakao로 로그인.
B. 마스터 비밀번호 설정 (E2E 암호화 키 derivation).
C. 다른 기기 (모바일/태블릿)에서도 같은 계정으로 로그인.
D. 자동으로 모든 노트/위키/메타가 양방향 sync.
E. 충돌 시 Yjs CRDT가 자동 해결, 데이터 손실 없음.
F. 인터넷 없을 때도 로컬에서 작동, 다시 연결되면 자동 sync.
G. vault 크기 5GB까지.
```

### 3.3 Pro 사용자 ($10/월)

```
A. Sync 모든 기능 +
B. vault 크기 무제한.
C. 일일 자동 클라우드 백업 (Supabase Storage).
D. 30일 이전 버전 복원 가능.
E. (Phase 5+) 가족 공유 옵션 (별도 vault).
```

---

## 4. Technical Architecture

### 4.1 Stack 결정

| Layer | 선택 | 이유 |
|-------|------|------|
| Backend | **Supabase** | Postgres + Auth + Storage + Realtime 통합. Free tier 50K MAU |
| 인증 | **Supabase Auth** | Magic link + Google OAuth 기본 제공. Kakao는 Custom Provider |
| Storage | **Supabase Storage** | 사용자별 vault 저장 (암호화된 chunks) |
| Realtime | **Supabase Realtime + Yjs** | Postgres CDC + Y.Doc binary 전송 |
| E2E 암호화 | **libsodium-wrappers** | NaCl 기반, 신뢰도 높음. Web Crypto API보다 휴대성 좋음 |
| CRDT | **Yjs** | TipTap collaboration extension 이미 지원. Plot 이전 PoC 경험 있음 |
| Y-IndexedDB | **y-indexeddb** | Phase 1에서 이미 일부 도입 (PR #218) |
| 결제 | **Lemon Squeezy** (잠정) | Phase 4 시점 재결정 |

### 4.2 데이터 모델

#### 4.2.1 클라이언트 (현재 + 추가)

```typescript
// 기존 IDB stores 유지
plot-zustand-store          // 메타 (notes, tags, folders, etc.)
plot-note-bodies            // 노트 본문 (Y.Doc binary)
plot-wiki-block-bodies      // 위키 블록 본문
plot-wiki-block-meta        // 위키 블록 메타
plot-mention-index          // mention 인덱스

// 신규
plot-sync-state             // sync 상태 (lastSyncedAt, pendingOps, deviceId)
plot-encryption-keys        // E2E 키 (마스터 키에서 derived, 메모리만 + 세션 키)
```

#### 4.2.2 서버 (Supabase)

```sql
-- 사용자
auth.users                     -- Supabase 기본 (id, email, created_at)
public.profiles                -- 프로필 확장 (id FK to auth.users, tier, vault_size_bytes)

-- 결제
public.subscriptions           -- Lemon Squeezy webhook 받은 구독 상태
  (user_id, tier, status, current_period_end, lemon_subscription_id)

-- E2E 키
public.user_encryption         -- 사용자 마스터 키 정보 (서버는 못 풀음)
  (user_id, salt, kdf_params, public_key, encrypted_master_key)
  -- encrypted_master_key는 마스터 비번에서 derived된 키로 암호화됨

-- Vault 객체 (모두 E2E 암호화)
public.vault_objects           -- 노트, 위키, 메타 등 모든 객체
  (id, user_id, object_type, encrypted_content, version_clock,
   created_at, updated_at)

-- Yjs 업데이트 (incremental)
public.yjs_updates             -- 노트 본문 Y.Doc 업데이트
  (id, user_id, doc_id, encrypted_update, clock, created_at)

-- 기기
public.devices                 -- 등록된 기기
  (id, user_id, device_name, last_seen, public_key)

-- 메타 sync (LWW for tags/folders)
public.metadata_changes        -- 태그/폴더/라벨 등 LWW 메타 변경 큐
  (id, user_id, entity_type, entity_id, encrypted_payload,
   clock, created_at)
```

### 4.3 E2E 암호화 흐름

```
1. 사용자 가입:
   - 이메일 입력 → Magic link 또는 OAuth
   - 첫 로그인 시 마스터 비밀번호 설정
   - libsodium argon2id로 KDF (salt + iterations)
   - 마스터 키 → 메모리만 보관, 서버 X
   - encrypted_master_key = 마스터 키로 user_master_key 암호화 → 서버 저장
   - Recovery Phrase (BIP39 단어 12개) 화면에 표시 + 사용자가 안전하게 보관

2. 로그인 (다른 기기):
   - 이메일 + Magic link 또는 OAuth
   - 마스터 비밀번호 입력 (or Recovery Phrase)
   - 서버에서 encrypted_master_key + salt 받음
   - argon2id로 KDF → 마스터 키 복원
   - encrypted_master_key 풀어서 user_master_key 추출

3. 노트 저장:
   - Y.Doc binary update 생성
   - user_master_key로 XChaCha20-Poly1305 암호화
   - encrypted_update를 Supabase에 푸시

4. 노트 로드:
   - Supabase에서 encrypted_update 받음
   - user_master_key로 복호화
   - Y.Doc에 적용
```

### 4.4 Sync 프로토콜

```
[A] 푸시 (로컬 → 서버):
  1. 로컬 변경 발생 → debounce 300ms
  2. 변경된 객체 list:
     - Y.Doc 노트: getY.encodeStateAsUpdate(doc, lastSyncedClock)
     - 메타 (LWW): JSON diff
  3. 각각 암호화 → batch insert into yjs_updates / metadata_changes
  4. 성공 시 lastSyncedClock 업데이트

[B] 풀 (서버 → 로컬):
  1. Supabase Realtime 구독 (user_id 필터)
  2. INSERT 이벤트 받음 → 복호화 → Y.Doc.applyUpdate or LWW merge
  3. 또는 polling fallback (5분 간격, 백그라운드)

[C] 충돌:
  - Y.Doc: CRDT가 자동 해결 (commutative)
  - LWW 메타: clock 큰 게 이김 (clock = device_id + timestamp)
  - 두 개의 동일 시점 변경: 서버 wall clock으로 tiebreak

[D] 오프라인 처리:
  - pendingOps queue (IDB)
  - 복귀 시 순서대로 푸시
  - 중간 실패 시 retry with exponential backoff
```

### 4.5 결제 흐름 (Lemon Squeezy 잠정)

```
1. /pricing 페이지에서 "Sync $5" 클릭
2. Lemon Squeezy hosted checkout 리다이렉트
3. 결제 완료 → webhook → Supabase edge function
4. public.subscriptions 업데이트
5. 클라이언트 polling/realtime으로 tier 업데이트
6. UI에서 sync 기능 활성화
```

---

## 5. Phase 분할

### Phase 1: 인증 + 기본 sync 인프라 (3~4주)

**목표**: 단일 방향 백업 + 인증

- [ ] Supabase 프로젝트 셋업 (개발/스테이징/프로덕션 3개 환경)
- [ ] Auth UI (Magic link + Google OAuth + Kakao Custom Provider)
- [ ] 마스터 비번 설정 + KDF + Recovery Phrase 화면
- [ ] E2E 암호화 lib 통합 (`libsodium-wrappers`)
- [ ] IDB → Supabase Storage 단방향 백업 (수동 트리거 먼저)
- [ ] 기기 등록 (deviceId + 표시 이름)
- [ ] Settings → Sync 섹션 (로그인 상태, 마지막 sync, 기기 목록)

**Exit criteria**: 사용자가 가입 후 데스크톱 vault → 클라우드 백업 가능. 다른 기기에서 로그인 후 복원 가능.

### Phase 2: 양방향 sync + Yjs 본 통합 (4~5주)

**목표**: 자동 양방향 sync + 충돌 해결

- [ ] Yjs `@tiptap/extension-collaboration` 본 통합 (PoC 활용)
- [ ] y-indexeddb provider 모든 노트에 적용
- [ ] Yjs update → Supabase yjs_updates 테이블 푸시
- [ ] Supabase Realtime 구독 → 다른 기기에서 받은 update 적용
- [ ] LWW 메타 sync (태그, 폴더, 라벨, 워크플로우)
- [ ] Sync 상태 UI (실시간 indicator, 오프라인 표시, 충돌 알림)
- [ ] 오프라인 큐 + retry
- [ ] Apple OAuth 추가 (iOS 출시 준비)

**Exit criteria**: 두 기기에서 동시 편집 → 30초 이내 자동 sync, 데이터 손실 0건. 오프라인 → 온라인 복귀 시 pending ops 자동 처리.

### Phase 3: 다중 기기 + 백업 + Pro 기능 (2~3주)

**목표**: 사용자 보호 + Pro tier 차별화

- [ ] 기기 관리 UI (기기 해제, 원격 로그아웃)
- [ ] 일일 자동 백업 (Supabase Storage, 30일 보관)
- [ ] 버전 복원 UI (Pro tier)
- [ ] vault 크기 모니터링 + 경고 (Sync 5GB / Pro 무제한)
- [ ] Recovery Phrase 재확인 flow (분실 시)
- [ ] 데이터 export (zip + JSON)

**Exit criteria**: Pro 사용자가 30일 전 노트 복원 가능. vault 크기 limit 도달 시 명확한 안내.

### Phase 4: 결제 + 출시 준비 (2~3주)

**목표**: 수익 모델 활성화 + 출시

- [ ] **결제 시스템 결정** (Lemon Squeezy / Stripe / Paddle)
- [ ] /pricing 페이지 (Free / Sync $5 / Pro $10)
- [ ] Free → Sync 업그레이드 flow
- [ ] Sync → Pro 업그레이드 flow
- [ ] 결제 webhook → tier 업데이트
- [ ] 환불 정책 + Privacy Policy + Terms of Service
- [ ] 마케팅 사이트 sync 섹션 (별도 워크트리)
- [ ] Google Play Store TWA 빌드
- [ ] 앱 스토어 자산 (스크린샷, 설명, 아이콘)

**Exit criteria**: 사용자가 $5 결제 후 즉시 sync 활성화. 환불 처리 가능. Privacy Policy 한국 개인정보보호법 부합.

---

**총 예상 기간**: 11~15주 ≈ **3~4개월** (1인 개발 기준).

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Yjs CRDT 충돌 해결 버그 → 데이터 손실 | 치명적 | Phase 2 종료 시 충돌 시나리오 100+ 자동 테스트, 베타 기간 |
| 마스터 비번 분실 → 데이터 복구 불가 | 사용자 이탈 | Recovery Phrase 가입 시 강제 표시 + 백업 권장 + 재확인 flow |
| Supabase 다운타임 | sync 일시 중단 | 오프라인 우선 설계 → 사용자 영향 최소. 24/7 모니터링 |
| Vendor lock-in (Supabase) | 마이그레이션 작업 | Postgres 표준 SQL + ORM. 1만 사용자 도달 시 자체 서버 검토 |
| 결제 분쟁 | 환불 비용 + 평판 | 7일 환불 정책 + 명확한 utilisé 안내. Lemon Squeezy MoR이 1차 처리 |
| 한국 개인정보보호법 위반 | 법적 위험 | Privacy Policy 변호사 검토. 메타데이터(이메일, 결제) 처리 명시 |
| GDPR (EU 사용자) | 법적 위험 | Right to Forget API + Data Export. Supabase 데이터 EU region 옵션 |
| KakaoTalk OAuth 정책 변경 | 한국 사용자 로그인 | Magic link fallback 항상 유지 |
| 1인 개발 부담 | 출시 지연 | Phase 분할 + agent 위임 활용 |

---

## 7. Open Questions

다음 phase 진입 전에 결정할 항목:

1. **Phase 4 결제 시스템 최종 결정** (Lemon Squeezy vs Stripe)
2. **무료 trial** 제공? (예: 30일 무료 → 자동 결제) — Phase 4 결정
3. **Annual 할인** 비율? (예: $50/년 = 17% 할인) — Phase 4 결정
4. **Lifetime** 옵션? (예: $99) — Phase 5+ 검토
5. **Family plan** (가족 공유 vault) — Phase 5+
6. **Self-host 옵션** 제공? (Pro tier에 BYOC) — Phase 5+ 사용자 요청 기반
7. **모바일 앱**: PWA → TWA OK? 또는 React Native? — Phase 4

---

## 8. Success Metrics — 출시 후 추적

### 8.1 Acquisition

- 가입 수 / 월
- Free → Sync 전환율 (목표 3%)
- Sync → Pro 업그레이드율 (목표 10%)

### 8.2 Engagement

- DAU / MAU 비율 (목표 30%+)
- 다중 기기 사용자 비율 (Sync tier 중)
- 평균 vault 크기

### 8.3 Reliability

- Sync 성공률 (목표 99.9%)
- 데이터 손실 incident 수 (목표 0)
- 평균 sync latency (목표 <5초)

### 8.4 Revenue

- MRR (목표 6개월 $75+)
- ARR
- Churn (목표 <5%/월)
- LTV / CAC

---

## 9. 참조 문서

- [`docs/SYNC-DESIGN-DECISIONS.md`](./SYNC-DESIGN-DECISIONS.md) — 6개 결정 + 옵션 비교
- [`docs/CONTEXT.md`](./CONTEXT.md) — 현재 Plot 상태
- [`docs/MEMORY.md`](./MEMORY.md) — 전체 PR 히스토리
- [`docs/TODO.md`](./TODO.md) — Phase 진행 추적

### 외부 참조

- [Obsidian Sync](https://obsidian.md/sync) — 가격 모델 + E2E 패턴
- [Standard Notes](https://standardnotes.com) — E2E 노트앱 기술 모델
- [Supabase Docs](https://supabase.com/docs)
- [Yjs Docs](https://yjs.dev)
- [TipTap Collaboration](https://tiptap.dev/docs/editor/extensions/functionality/collaboration)
- [Lemon Squeezy](https://lemonsqueezy.com)
- [libsodium-wrappers](https://github.com/jedisct1/libsodium.js)

---

## 10. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-04-29 | 초안 작성 (6개 결정 후) |
