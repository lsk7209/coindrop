# Cloudflare 호스팅 최적화 체크리스트

## ✅ 완료된 최적화

### 1. 바인딩 접근 방식
- [x] `lib/cf-bindings.ts` 헬퍼 함수 생성
- [x] 모든 API Routes에서 표준화된 바인딩 접근
- [x] 타입 안전성 보장 (`@ts-expect-error` 사용)

### 2. Edge Runtime 설정
- [x] 모든 API Routes에 `export const runtime = 'edge'` 추가
- [x] Next.js Edge Runtime에서 실행 보장
- [x] Cloudflare Pages Functions 자동 변환

### 3. 서버 컴포넌트 최적화
- [x] 직접 DB 접근 제거, API Route를 통한 접근
- [x] ISR 캐싱 활용 (`next: { revalidate }`)
- [x] 로컬 개발 환경 호환성 유지

### 4. Workers 구조 개선
- [x] 별도 wrangler 설정 파일 생성:
  - `wrangler.consumer.toml` - Queue Consumer
  - `wrangler.collector.toml` - Collector (Cron)
  - `wrangler.newsletter.toml` - Newsletter (Cron)
- [x] 각 Worker별 독립 배포 가능

### 5. 캐싱 전략
- [x] KV 캐시 TTL 설정 (상세 600s, 목록 300s)
- [x] HTTP Cache Headers (`Cache-Control`)
- [x] ISR 재검증 (`stale-while-revalidate`)

### 6. 보안 설정
- [x] CSP 헤더 설정
- [x] HSTS, COOP/COEP 설정
- [x] Cloudflare Turnstile 도메인 허용

## 📋 배포 전 확인사항

### Cloudflare 리소스 생성
- [ ] D1 데이터베이스 생성 및 `database_id` 설정
- [ ] KV Namespace 생성 및 `id` 설정
- [ ] R2 Bucket 생성 확인
- [ ] Queue 생성 (`q.generate`)

### 환경 변수 설정
- [ ] Secrets 설정 (`wrangler secret put`)
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY`
  - `REVALIDATE_TOKEN`
  - `MAKE_WEBHOOK_URL` (선택)
  - `TELEGRAM_BOT_TOKEN` (선택)
  - `TELEGRAM_CHAT_ID` (선택)

### 마이그레이션
- [ ] D1 마이그레이션 실행 (`npm run db:migrate`)

### Workers 배포 순서
1. [ ] Queue Consumer Worker 배포
2. [ ] Collector Worker 배포 (Cron)
3. [ ] Newsletter Worker 배포 (Cron)
4. [ ] Next.js Pages 배포

## 🚀 성능 최적화 확인

### Edge Runtime 활용
- [x] 모든 API Routes가 Edge Runtime에서 실행
- [x] 글로벌 저지연 제공

### 캐싱 확인
- [ ] KV 캐시 히트율 모니터링
- [ ] HTTP 캐시 헤더 확인
- [ ] ISR 재검증 작동 확인

### Queue 처리
- [ ] 배치 크기 적절성 (현재 10개)
- [ ] 타임아웃 설정 (현재 30초)
- [ ] 재시도 로직 작동 확인

## 🔍 테스트 체크리스트

### API Routes 테스트
- [ ] `/api/airdrops` - 목록 조회
- [ ] `/api/airdrops/:chain/:slug` - 상세 조회
- [ ] `/api/stats` - 통계 조회
- [ ] `/api/revalidate` - ISR 재검증

### Workers 테스트
- [ ] Collector 수동 트리거 테스트
- [ ] Queue 메시지 처리 테스트
- [ ] Newsletter 발송 테스트

### 에러 처리
- [ ] Dead Letter 저장 확인
- [ ] 재시도 로직 작동 확인
- [ ] 에러 로깅 확인

## 📊 모니터링 설정

### Cloudflare Analytics
- [ ] Workers Analytics 활성화
- [ ] D1 Query Analytics 확인
- [ ] KV Analytics 확인
- [ ] Queue Metrics 확인

### 알림 설정 (선택)
- [ ] Telegram 알림 설정 (Dead Letter)
- [ ] Sentry 에러 추적 설정

## ⚠️ 주의사항

### Edge Runtime 제한사항
- ❌ Node.js 전용 모듈 사용 불가
- ❌ 파일 시스템 접근 불가
- ❌ 동적 `require()` 사용 불가
- ✅ Web API만 사용 가능

### 바인딩 접근
- `globalThis.DB`, `globalThis.KV_CACHE` 등은 Cloudflare Pages에서만 사용 가능
- 로컬 개발 시에는 별도 처리 필요 (현재 API Route 사용)

### 배포 환경
- 로컬: `npm run dev` (일반 Next.js)
- Cloudflare Pages: 자동 배포 또는 `npm run wrangler:deploy`

