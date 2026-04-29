# Plot — 다중 기기 Sync 설계 결정 (2026-04-29 결정 완료)

> 큰 방향 전환. 영구 규칙 "큰 방향 전환 전 전체 설계 확정" 적용.
> **결정 완료 일자: 2026-04-29 세션 (다른 컴퓨터)**
> 다음 단계: PRD 작성 → Phase 분할 → 구현 시작.
> 자세한 PRD: [`docs/SYNC-PRD.md`](./SYNC-PRD.md) ★

---

## ✅ 6개 결정 LOCKED (2026-04-29)

| # | 항목 | 결정 |
|---|------|------|
| 1 | Sync 옵션 | **B. Supabase + E2E 암호화** |
| 2 | 가격 모델 | **Free / Sync $5 / Pro $10** (Obsidian 동일) |
| 3 | 출시 시점 | **(c) v2.0 — Free 출시 후 6개월~1년 후 Sync 도입** ⚠️ 변경됨 (2026-04-29 오후 후반) |
| 4 | CRDT/Y.Doc | **노트 본문 + 메타 모두 Yjs** |
| 5 | 결제 시스템 | **결정 보류** (Sync v2.0 출시 시점 재검토) |
| 6 | 인증 (Sync 출시 시) | **Magic link + Google OAuth + Kakao OAuth** |

### 결정 #3 변경 이유 (2026-04-29 오후 후반)

사용자 재고: "꼭 페이즈 1부터 해야 되나? 우선은 앱부터 다듬고 출시 계획을 제대로 진행하고 싶은데?"

**(a) → (c) 변경 근거**:
- Sync = 3~4개월 작업, 그 동안 사용자 facing 개선이 멈춤
- 앱 폴리시 빚 있는 채로 sync 인프라 쌓는 건 위험
- 출시 후 실제 사용자 피드백 반영해서 sync 설계 보강 가능
- 1인 개발 부담 분산

**즉시 작업**: 출시 준비 + 폴리시 (1~2개월) → Free 출시
**미래 v2.0**: Sync Phase 1~4 (출시 후 6개월~1년)
**PRD 보존**: [`docs/SYNC-PRD.md`](./SYNC-PRD.md)는 v2.0 가이드로 그대로 유지

**Apple OAuth는 iOS 출시 시 Phase 2에서 추가** (App Store 정책).
**SMS 인증은 영구 폐기** (비용 + 보안 이슈, Magic link로 동일 UX).

---

---

## 🎯 사용자 의향 (2026-04-29 명시)

> "다중 기기 sync가 필요해. 옵시디언도 이걸로 유료 구독료를 받잖아."

→ **수익 모델 + 다중 기기 sync** 도입 결정. Plot "비용 0" 영구 결정 → "구독 모델"로 변경 의향. 그러나 프라이버시(E2E 암호화) + 오프라인 우선 + 단일 사용자 도구 정체성은 유지.

---

## 📚 Obsidian Sync 모델 (참고)

- **$5/월 Standard / $8/월 Plus** (vault 크기/기기 수)
- **E2E 암호화** — Obsidian 직원도 노트 내용 못 봄 (사용자 키 보유)
- vault 단위 sync, file-level 충돌 해결
- Obsidian 자체가 서버 운영
- 평균 사용자 ~15GB

---

## 🔍 Plot 영구 규칙과의 관계 검증

| 영구 규칙 | sync 도입 시 | 평가 |
|----------|-------------|------|
| 프라이버시 | E2E 암호화로 **유지** | ✅ |
| 비용 0 | **수익 모델로 변경** (사용자 OK) | ✅ 의도된 변경 |
| 오프라인 | sync는 옵션, 오프라인 우선 **유지** | ✅ |
| 단순성 | sync 인프라 = 큰 복잡도 | ⚠️ trade-off |
| LLM X | 무관 | ✅ |
| 1인 도구 | 다중 기기 ≠ 다중 사용자 협업, **유지** | ✅ |

→ **영구 규칙 위반 X**. Obsidian 패턴이 fit. 단 단순성은 깨짐 (불가피).

---

## 🗂️ 6개 옵션 비교

| 옵션 | E2E | 운영비 | 작업량 | 출시 일정 영향 | 적합도 |
|------|-----|--------|--------|---------------|--------|
| **A. 자체 서버 + E2E** (Obsidian 100% 모방) | ✓ | 높음 (인프라 + 결제) | 매우 큼 (2~3개월) | 큰 폭 ↑ | Obsidian 그대로 |
| **B. Supabase + E2E** ★ | ✓ | 낮음 (~$25/월부터) | 큼 (1~2개월) | 중간 ↑ | **균형 추천** |
| C. Supabase + 평문 | ✗ | 낮음 | 중간 (2~4주) | 작음 | 프라이버시 위반 |
| D. iCloud/Drive vault (BYOC) | 사용자 책임 | 0 | 작음 (1~2주) | 작음 | 모바일 어려움 |
| E. CRDT P2P (Yjs + WebRTC) | 사용자 키 | 0 | 큼 | 큼 | 두 기기 동시 온라인 필요 |
| F. GitHub vault | 사용자 책임 | 0 | 작음 | 작음 | binary(이미지) 비효율 |

### 옵션 상세

#### A. 자체 서버 + E2E (Obsidian 그대로)
- 기술: Node.js/Go 서버 + Postgres + Redis + 자체 인증/결제
- 장점: 풀 컨트롤, 마진 최대화
- 단점: 운영 부담 (24/7 모니터링, 백업, 장애 대응)
- **출시 모드에 비추**: 작업 너무 큼

#### B. Supabase + E2E ★ 추천
- 기술: Supabase (Postgres + Storage + Auth) + 클라이언트 E2E 암호화 (libsodium / Web Crypto API)
- 사용자 마스터 비밀번호 → 키 derivation → 노트 암호화 → 서버는 암호 텍스트만
- 장점: 인프라 자동 관리, 빠른 구현, 마이그레이션 가능
- 단점: Supabase 의존성 (vendor lock-in 약간)
- **추천 이유**: 출시 일정 + 프라이버시 + 비용 균형

#### C. Supabase + 평문
- 가장 단순. 단 Plot 프라이버시 정체성 위반
- 출시 빠름이 핵심이면 임시 옵션 가능 (단 마케팅 시 명확히 표시)
- **비추**: 사용자가 Plot에 기대하는 프라이버시 깨짐

#### D. iCloud/Drive vault (BYOC, Bring Your Own Cloud)
- Obsidian 무료 sync 패턴
- 사용자 vault를 iCloud Drive / Google Drive / Dropbox에 저장
- 장점: 운영비 0, 사용자 자기 책임
- 단점:
  - 모바일 (iOS/Android)에서 file system 접근 어려움
  - PWA/TWA 환경에서 IDB → 사용자 클라우드 sync 자동화 어려움
- **비추**: 모바일 우선 출시 의향과 맞지 않음

#### E. CRDT P2P (Yjs + WebRTC)
- 두 기기가 직접 통신, 서버 거의 없음 (signaling만)
- 장점: 운영비 거의 0, 진정한 P2P
- 단점:
  - 두 기기 모두 동시 온라인 필요
  - 한 기기에서 변경 후 다른 기기 켤 때까지 동기화 X
  - 모바일 백그라운드 제약
- **비추**: 사용자 워크플로우 (회사+집)와 맞지 않음

#### F. GitHub vault
- 사용자 GitHub 개인 repo에 vault commit/pull
- 장점: 무료, 버전 관리 자동
- 단점:
  - binary (이미지/첨부) 비효율
  - 모바일 git 어려움
  - 일반 사용자 진입 장벽 매우 높음
- **비추**: 개발자 외에는 진입 불가

---

## 💰 추천 가격 모델 (B 옵션 기반)

| Tier | 월 가격 | 내용 |
|------|--------|------|
| **Free** | $0 | 단일 기기, 무제한 노트 (현재 Plot 그대로) |
| **Sync** | $4/월 | 다중 기기 sync, E2E 암호화, ~5GB |
| **Pro** | $8/월 | + 무제한 vault 크기, 자동 백업, 가족 공유 옵션 |

비교:
- Obsidian Sync: $5 (Standard) / $8 (Plus)
- Standard Notes: $90/년 ($7.5/월) — Pro
- Notion: $8/월 (개인)

→ **$4 entry / $8 pro**가 경쟁력 있음.

---

## 📌 Y.Doc 폐기 결정 재검토

이전 (2026-04-27) "Wiki Y.Doc 폐기"는 **단일 사용자 + 단일 IDB**라는 전제. 다중 기기 sync 도입 시:
- **CRDT (Yjs)가 충돌 해결의 표준**
- file-level Last-Write-Wins는 데이터 손실 위험 (예: 두 기기에서 같은 노트 동시 수정)
- TipTap이 이미 Yjs collaboration extension 지원 (`@tiptap/extension-collaboration`)
- 노트 본문은 Yjs / 메타(folder/tag/label)는 Last-Write-Wins 절충 가능

**즉 sync 도입 = Y.Doc 재활용 결정**. 이전 폐기를 sync 컨텍스트로 재검토 필요.

---

## 🤔 결정해야 할 항목 6개

다음 세션 시작 시 사용자와 결정:

### 1. 옵션 선택
- A (자체 서버 + E2E) / **B (Supabase + E2E)** / C (평문) / D (BYOC) / E (P2P) / F (GitHub)
- **추천**: B
- 다른 의견 있으면?

### 2. 가격 모델
- 제안: Free / Sync $4 / Pro $8
- 다른 가격? Annual 할인? Lifetime? Free trial?

### 3. 출시 시점과 관계
- (a) Sync 포함 출시 (1~2개월 추가 일정) — 첫인상에 sync 가치 어필
- (b) 출시 후 추가 (출시 빠름, 사용자 데이터 마이그레이션 부담)
- (c) Sync는 v2.0으로 출시 (Free 출시 후 6개월~1년 후 Sync 도입)
- **추천**: (a) 또는 (c). (b)는 사용자 마이그레이션 cost 큼.

### 4. CRDT/Y.Doc 재활용
- 이전 폐기 결정 뒤집을 것인가?
- 노트 본문만 Y.Doc 사용 vs 메타까지 vs 안 함

### 5. 결제 시스템
- **Lemon Squeezy** (글로벌 세금/VAT 자동 처리, Merchant of Record)
- **Stripe** (수수료 낮음, 세금 직접)
- **Paddle** (Lemon Squeezy 유사)
- **추천**: 한국 사업자 미신고 단계 → Lemon Squeezy (세금/VAT 자동)

### 6. 인증 방식
- 이메일 + 비밀번호
- Magic link (이메일로 로그인 링크)
- OAuth (Google / Apple)
- 모두 지원
- **추천**: Magic link + OAuth (Google + Apple) — 비번 관리 부담 X, 모바일 친화

---

## 🔧 구현 단계 (옵션 B 선택 시 임시 phase 안)

1. **Phase 1: 인증 + 기본 sync (2~3주)**
   - Supabase Auth (Magic link + OAuth)
   - 사용자별 IDB → Supabase Storage 단방향 backup
   - E2E 암호화 (마스터 비밀번호 → key derivation)
   - 결제 플로우 (Lemon Squeezy)

2. **Phase 2: 양방향 sync + 충돌 해결 (3~4주)**
   - Supabase Realtime 구독
   - Last-Write-Wins for 메타데이터
   - 노트 본문 = Yjs CRDT (재활용)
   - 충돌 해결 UX

3. **Phase 3: 다중 기기 + 백업 (1~2주)**
   - 기기 등록 / 해제 UI
   - 자동 백업 + 복원
   - vault 크기 모니터링

4. **Phase 4: 출시 (1~2주)**
   - Free → Sync upgrade flow
   - 마케팅 사이트 sync 섹션
   - Privacy Policy + Terms

**총 7~11주 = 약 2~3개월** (Phase 1만 출시 포함이면 단축 가능)

---

## ⚠️ 큰 위험

1. **데이터 손실**: 충돌 해결 잘못하면 사용자 노트 사라짐. 충분한 테스트 필수
2. **E2E 키 분실**: 사용자가 마스터 비번 잊으면 데이터 복구 불가. 명시적 안내 + 백업 권장
3. **Vendor lock-in (Supabase)**: 마이그레이션 가능하지만 작업
4. **결제 분쟁**: 환불 정책 사전 정의 필요
5. **GDPR / 한국 개인정보보호법**: E2E라 데이터 자체는 못 보지만 메타데이터 처리 규제 있음

---

## 📚 참조 (사용자 결정 시 참고할 자료)

- **Obsidian Sync**: https://obsidian.md/sync
- **Standard Notes** (E2E 노트앱): https://standardnotes.com — 기술 모델 참고
- **Anytype** (P2P 노트앱): https://anytype.io — D + E 옵션 절충
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Lemon Squeezy**: https://lemonsqueezy.com — Merchant of Record
- **Yjs**: https://yjs.dev — CRDT 라이브러리
- **TipTap Collaboration**: https://tiptap.dev/docs/editor/extensions/functionality/collaboration

---

## ✅ 결정 완료 → 다음 단계

영구 규칙: "큰 방향 전환 전 전체 설계 확정". **6개 항목 결정 완료 (2026-04-29)** → 코드 시작 가능.

다음 단계:
1. ✅ /before-work 실행 (2026-04-29)
2. ✅ 사용자와 결정 6개 받음 (2026-04-29)
3. ✅ PRD 작성 → [`docs/SYNC-PRD.md`](./SYNC-PRD.md)
4. ⏭️ Phase 1 구현 시작 (Supabase 프로젝트 셋업 + 인증)

---

## 🚨 결정 후 핵심 위험 (Phase 1 시작 전 재확인)

1. **데이터 손실**: Yjs CRDT 충돌 해결 잘못 시 노트 사라짐. **Phase 1 종료 시 backup-restore 시나리오 충분 테스트 필수**
2. **E2E 키 분실**: 사용자가 마스터 비번 잊으면 데이터 복구 불가. **명시적 안내 + 키 백업 권장 + Recovery Phrase**
3. **Vendor lock-in (Supabase)**: Postgres 베이스라 마이그레이션 가능. 큰 위험 아님
4. **결제 분쟁**: Phase 4에서 환불 정책 사전 정의
5. **GDPR / 한국 개인정보보호법**: E2E라 데이터 자체는 못 보지만 메타데이터(이메일, 결제 내역) 처리 규제 있음. **Privacy Policy 사전 검토 필요**

---

## 📌 변경 가능성 / 보류 사항

- **결제 시스템 (Lemon Squeezy / Stripe / Paddle)**: Phase 4 진입 시점에 한국 사업자 신고 상태 + 글로벌 출시 우선순위 보고 결정
- **Apple OAuth**: iOS 출시 시점에 추가 (Phase 2 후반)
- **추가 OAuth (Naver / Microsoft 등)**: 사용자 피드백 기반으로 Phase 5+에 추가
