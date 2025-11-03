# Cloudflare 호스팅 최적화 가이드

## 완료된 최적화 사항

### 1. **바인딩 접근 최적화**
- ✅ `lib/cf-bindings.ts`: 안전한 바인딩 접근 헬퍼 함수 생성
- ✅ 모든 API Routes에서 표준화된 방식으로 D1/KV/R2 접근
- ✅ 타입 안전성 보장 (`@ts-expect-error` 주석 사용)

### 2. **API Routes 최적화**
- ✅ 모든 API Routes에 `export const runtime = 'edge'` 설정
- ✅ Cloudflare Pages Edge Runtime에서 실행 보장
- ✅ Request를 통한 바인딩 접근 (Next.js 표준)

### 3. **서버 컴포넌트 최적화**
- ✅ `app/page.tsx`: 직접 DB 접근 대신 API Route를 통한 접근
- ✅ ISR 캐싱 활용 (`next: { revalidate: 300 }`)
- ✅ 로컬 개발 환경 호환성 유지

### 4. **Workers 배포 구조 개선**
- ✅ 별도 `wrangler.*.toml` 파일로 Worker 분리:
  - `wrangler.toml`: Next.js Pages 메인 설정
  - `wrangler.consumer.toml`: Queue Consumer Worker
  - `wrangler.collector.toml`: Collector Worker (Cron)
  - `wrangler.newsletter.toml`: Newsletter Worker (Cron)

### 5. **캐싱 전략**
- ✅ KV 캐시: 상세 600s, 목록 300s
- ✅ HTTP Cache Headers: `Cache-Control` 설정
- ✅ ISR 재검증: `stale-while-revalidate` 패턴

### 6. **보안 헤더**
- ✅ CSP, HSTS, COOP/COEP 설정 완료
- ✅ Cloudflare Turnstile 도메인 허용

## 배포 시나리오

### Next.js Pages 배포
```bash
npm run build
npm run wrangler:deploy
```

### Queue Consumer Worker 배포
```bash
wrangler deploy --config wrangler.consumer.toml workers/consumer.ts
```

### Collector Worker 배포 (Cron)
```bash
wrangler deploy --config wrangler.collector.toml workers/collector.ts
```

### Newsletter Worker 배포 (Cron)
```bash
wrangler deploy --config wrangler.newsletter.toml workers/newsletter.ts
```

## 성능 최적화 팁

### 1. Edge Runtime 활용
- 모든 API Routes는 Edge Runtime에서 실행되어 글로벌 저지연 제공
- D1 쿼리는 가장 가까운 리전으로 라우팅

### 2. 캐싱 전략
- **KV 캐시**: 빈번한 조회에 대한 응답 캐시
- **HTTP 캐시**: Cloudflare CDN 레벨 캐싱
- **ISR**: Next.js 레벨 정적 생성 + 재검증

### 3. Queue 처리
- 배치 크기: 10개 메시지
- 타임아웃: 30초
- 재시도: 지수 백오프 (3분, 9분, 27분)

### 4. R2 접근 최적화
- 오브젝트 메타데이터 캐싱
- Gzip 압축 사용
- CDN 엣지에서 직접 서빙 가능

## 모니터링

### 필수 메트릭
- API 응답 시간 (P95, P99)
- D1 쿼리 성능
- Queue 처리량 및 적체 시간
- KV 캐시 히트율
- 에러율 (4xx, 5xx)

### Cloudflare 대시보드 확인
- Workers Analytics
- D1 Query Analytics
- KV Analytics
- Queue Metrics

## 문제 해결

### 바인딩이 undefined인 경우
1. `wrangler.toml`의 바인딩 이름 확인
2. Cloudflare Pages 프로젝트에서 바인딩 연결 확인
3. 배포 후 환경 변수 확인

### Edge Runtime 에러
1. Node.js 전용 모듈 사용 금지
2. 파일 시스템 접근 불가
3. 동적 require 사용 불가

### Queue 메시지 처리 실패
1. Dead Letter 확인 (R2 `dead-letters/`)
2. 재시도 로그 확인
3. Worker 로그 분석

