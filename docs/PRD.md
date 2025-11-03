# 프로젝트: **CoinDrop.kr — 코인 에어드랍 자동 수집·생성·발행 플랫폼**

버전: **v1.1 (보완반영)** · 작성일: 2025-11-02

## 1) 목표 & KPI

* **핵심가치**: 신뢰(데이터 출처 명시) · 속도(엣지 캐시/큐) · 확장(수만 페이지) · 한국어 품질(GenEO·AEO 규격)

* **KPI**: Lighthouse SEO ≥ 92, LCP < 2.5s, 색인율 ≥ 85%, CTR ≥ 7%, 구독 전환 ≥ 4%

## 2) 아키텍처(개요)

* **수집(Collector Worker)** → **Cloudflare Queues** → **생성(Generator Worker)** → **저장(D1+R2)** → **캐시(KV)**

* **배포**: Next.js 14(App Router) on Pages · ISR 재검증 웹훅 · Make.com 자동 배포

* **데이터 저장 전략**

  * **D1**: 인덱스/검색용 메타
  * **R2**: 본문 JSON/OG 이미지 등 오브젝트
  * **KV**: 응답 캐시(상세 600s, 목록 300s, sitemap 300s)

## 3) 데이터 소스

* **DeFiLlama Open API**: 프로토콜/체인 TVL, Yields, Bridges, Stablecoins 등

* **토큰리스 후보 탐지**: `/api/protocols` 기준 **token_present=false** 휴리스틱 + `tokenless_confidence` 스코어

## 4) 스키마(보완 반영)

### 공통 규칙

* **시간대**: 저장 UTC(초), UI KST 렌더. "09:00~09:00" 윈도우 함수화.
* **슬러그**: `kebab-case [a-z0-9-], ≤60자`, 보조키 `slug_crc`(UINT).
* **버저닝**: `schema_version`(예: 101 = v1.01).
* **멱등성**: `idempotency_key = hash(source_payload)`.

### D1 테이블

**projects**

* id (PK), slug (UNIQUE), name, chains(JSON), website/twitter/discord, tvl_usd(REAL)
* token_present(BOOL) default 0, **tokenless_confidence(REAL 0~1)**
* created_at(INT), updated_at(INT), **schema_version(INT)**

**airdrops**

* id (PK), project_id(FK), status('planned|ongoing|ended'), reward_type('token|nft|points|null')
* snapshot_at(INT?) / deadline_at(INT?)
* tasks_json(TEXT), claim_links_json(TEXT), source(TEXT), source_ref(TEXT)
* new_flag(INT default 1), updated_at(INT), **idempotency_key(TEXT UNIQUE)**

**contents**

* id (PK), airdrop_id(FK), **slug (UNIQUE)**, title, summary, hashtags(JSON)
* **quality_scores(JSON: {seo, aeo, geneo})**, **lint_errors(JSON)**
* r2_key(TEXT), published_at(INT), updated_at(INT), schema_version(INT)

**subscribers**

* id, email(UNIQUE), interests(JSON), is_active(BOOL), last_sent_at(INT)

**posts_log**

* id, content_id, platform(Twitter/Threads/Telegram), status, ext_post_id, created_at
* UNIQUE(content_id, platform)

## 5) 오브젝트 포맷(R2)

`contents/airdrop/{chain}/{slug}.json`

```json
{
  "project": {"slug":"...","name":"...","chains":["ethereum"],"tvl_usd":123456789},
  "airdrop": {"status":"planned","reward_type":null,"snapshot_at":null,"deadline_at":null,"tasks":[...]},
  "generated": {"title":"...","summary":"...","howto":[...],"tips":[...],"faq":[...],"viral":"...","hashtags":["#airdrop"]},
  "jsonld": [ { /* BlogPosting */ }, { /* HowTo */ }, { /* FAQPage */ } ],
  "meta": {"lang":"ko","created_at":"...","updated_at":"...","schema_version":101}
}
```

## 6) 파이프라인(Queues 도입)

**Collector (3h Cron/수동 트리거)**

1. ETag/`If-None-Match` 사용해 DeFiLlama 호출 → 변경분만 처리
2. 정규화/정책: tokenless 후보 추출, 상태/일정 정리
3. **idempotency_key** 계산 후 업서트(D1)
4. 신규/갱신 건 → **Queue `q.generate`**에 메시지 발행

**Generator (Queue consumer)**

1. 메시지 수신 → Zod 스키마 검증(하드)
2. ChatGPT API 프롬프트(근거 URL 강제 포함) → 생성
3. Lint(길이/금칙어/링크/JSON-LD 유무) → **quality_scores** 계산
4. 본문 JSON을 R2 저장, D1 `contents` 인덱스 갱신
5. KV 무효화 → ISR 재검증 웹훅 → **Make.com 웹훅** 발행
6. 실패: 지수 백오프 재시도(3·9·27분) → **Dead Letter(R2)**

**Digest (매일 09:00 KST)**

* 24h 신규 콘텐츠 집계 → Resend API로 뉴스레터 전송 → 바운스/스팸 웹훅 반영

## 7) API(공개/내부)

**Public**

* `GET /api/airdrops?chain&status&cursor` — 목록(커서 페이징)
* `GET /api/airdrops/:chain/:slug` — 상세 JSON
* `GET /api/calendar?from&to` — 스냅샷/마감 일정
* `GET /api/search?q` — 프로젝트명/체인 검색
* `GET /api/stats` — 프로젝트/체인 분포, 신규 수

**Internal**

* `POST /api/webhook/content` — content.published (Make.com 배포용)
* `POST /api/revalidate` — ISR 재검증
* `POST /api/newsletter/test` — 템플릿 미리보기

## 8) 프론트 IA & 컴포넌트

```
/ (Hero·오늘의 신규·체인 탭·구독)
/airdrops/ (FilterBar·CardGrid·Pager)
/airdrops/[chain]/[slug]/airdrop-guide (Hero·HowToSteps·FAQ·ClaimEvidence·Tips·Related·CTA)
/blog/ (주간 Top10·가이드)
/newsletter/ (Turnstile+Double Opt-in)
/about /privacy
```

* **접근성**: HowTo/FAQ에 `aria-*` 라벨, 키보드 포커스 순서 보장
* **폴백 UI**: 생성 실패 시 "요약 카드 + 공식 링크 + 구독 CTA" 노출

## 9) SEO·AEO·GenEO 정책(강제)

* **직답(≤110자)** + **Claim–Evidence(수치·날짜 포함) 1쌍 이상**
* **HowTo 3–5단계**, **FAQ ≥3**
* **JSON-LD 3종**: BlogPosting/HowTo/FAQPage(필수 필드: `dateModified`, `author`, `publisher.logo`)
* **내부링크**: 본문 300자 내 1개, H2당 ≥1, 허브↔상세 양방향
* **중복 방지**: 파라미터/필터 페이지 `noindex, follow` + Canonical
* **Sitemap**: 체인×연도 분할, 50k URL 이하/파일, gzip, `lastmod=published_at`
* **IndexNow + GSC 핑** 자동

## 10) 캐시/성능

* **KV TTL**: 상세 600s, 목록 300s, sitemap 300s (SWR)
* **페이로드 압축**: JSON Gzip, 이미지 WebP 우선
* **OG 이미지**: 제목·체인·TVL 포함 자동 생성(Workers AI/Vercel OG)
* **Rate Limit**: IP당 60 req/min(Cloudflare Rules)

## 11) 보안·컴플라이언스

* **구독 폼**: Cloudflare Turnstile + Double Opt-in
* **발송 도메인**: SPF/DKIM/DMARC 설정, 뉴스레터 전용 서브도메인
* **CSP**: `default-src 'self'; img-src 'self' data: https:; connect-src https://*.llama.fi https://api.openai.com ...`
* **보안 헤더**: HSTS, Referrer-Policy, COOP/COEP
* **고지**: 키/시드 금지, 세무 안내(국내 기타소득 가능성), 스캠 신고 링크

## 12) 관측성 & 백업

* **Sentry**(프론트/워커), Cloudflare Logpush→R2, 대시보드(에러율·큐 적체·색인수·CTR)
* **백업**: D1 → R2 스냅샷(일 1회), R2 버전닝 30일 보관

## 13) 운영 시나리오

* Make.com 장애 시 **대체 경로**: Telegram Bot API 직접 호출(트윗/스레드 지연 전송)
* 생성 실패 3회 초과 → **Lite 게시** 유지 + 재시도 큐

## 14) 디렉토리 구조(요약)

```
/app/(site)/
/app/[chain]/[slug]/airdrop-guide/page.tsx
/app/api/* (public/internal)
/lib/{collector.ts,generator.ts,jsonld.ts,schema.ts,kv.ts}
/workers/{collector.ts,consumer.ts,newsletter.ts}
/content/ (개발용 샘플)
/scripts/{migrate.sql,seed.ts}
```

---

# 🔎 체크리스트(릴리즈 전)

* [ ] 마이그레이션(v1→v1.1) · 롤백 경로 마련(`schema_version`)
* [ ] Queues 재시도(3·9·27분) · Dead Letter 알림(텔레그램)
* [ ] JSON-LD 유효성 100% / Lighthouse SEO ≥ 92 / LCP < 2.5s
* [ ] Sitemap index + 분할 수량 자동 점검, IndexNow/GSC 핑 OK
* [ ] 뉴스레터 바운스/스팸 웹훅 처리, 냉각 로직
* [ ] 슬러그 충돌·내부링크 중복 자동 테스트

---

# 🔁 대체안(1개)

* **본문 전부 D1 저장(초기 단순화)** → 트래픽 증가 시 90일 경과 문서부터 **R2로 아카이브**.

  * 장점: 개발 단순/일관 쿼리
  * 단점: I/O 부담↑, 대용량 시 확장성 열위 → **장기적으로 R2 분리 권장**

---

# 📌 근거(요약)

* **Queues+멱등성**으로 중복/폭주/부분 실패를 흡수, 안정적 확장 확보
* **GenEO·AEO 규격 강제**(직답/증거/HowTo/FAQ/JSON-LD)로 생성/검색 엔진 동시 최적화
* **ETag·KV·ISR** 3중 캐싱으로 비용↓·속도↑, 색인율과 체류시간 개선

---

## 기술 스택 요약

* **Frontend**: Next.js 14 (App Router)
* **Backend**: Cloudflare Workers + Pages
* **Database**: Cloudflare D1 (SQLite)
* **Storage**: Cloudflare R2 (S3-compatible)
* **Cache**: Cloudflare KV
* **Queue**: Cloudflare Queues
* **Email**: Resend (기본) / SendGrid (대체)
* **AI**: OpenAI ChatGPT API
* **Automation**: Make.com
* **Monitoring**: Sentry
* **Language**: 한국어 전용

