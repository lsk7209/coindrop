# DeFiLlama 수집 가이드

## 개요

DeFiLlama Open API를 통해 프로토콜 데이터를 수집하고 에어드랍 후보를 탐지합니다.

## API 엔드포인트

- **프로토콜 목록**: `https://api.llama.fi/protocols`
- **응답 형식**: 배열로 직접 반환 (각 프로토콜 객체 포함)
- **ETag 지원**: `If-None-Match` 헤더로 변경 감지 가능

## 수집 프로세스

1. **API 호출**: ETag를 사용해 변경분만 처리
2. **토큰리스 탐지**: 토큰이 없는 프로토콜 중 에어드랍 후보 추출
3. **데이터 저장**: D1에 프로젝트 및 에어드랍 정보 저장
4. **Queue 발행**: 신규 에어드랍을 Queue에 추가하여 콘텐츠 생성 트리거

## 테스트 방법

### 1. API 테스트

```bash
npm run test:api
```

실제 DeFiLlama API 응답을 확인하고 데이터 구조를 검증합니다.

### 2. 로컬 수집 테스트

**방법 1: wrangler pages dev 사용**

```bash
# 터미널 1: Cloudflare Pages 개발 서버 실행
npm run wrangler:dev

# 터미널 2: 수집 트리거
curl -X POST http://localhost:8788/api/admin/collect \
  -H "Authorization: Bearer default-collect-token" \
  -H "Content-Type: application/json"
```

**방법 2: 스크립트 직접 실행 (wrangler 환경 필요)**

```bash
npm run collect:local
```

⚠️ **주의**: 이 방법은 wrangler 로컬 환경에서 실행되어야 합니다.

### 3. 프로덕션 수집

**수동 트리거 (API)**

```bash
curl -X POST https://coindrop.kr/api/admin/collect \
  -H "Authorization: Bearer YOUR_COLLECT_TOKEN" \
  -H "Content-Type: application/json"
```

**환경 변수 설정**

`.dev.vars` 또는 Cloudflare Secrets에:
```
COLLECT_TOKEN=your-secret-token
```

**Cron 자동 실행**

`wrangler.collector.toml`의 Cron 설정으로 자동 실행:
```toml
[[triggers.crons]]
cron = "0 */3 * * *"  # 3시간마다
```

## 수집 결과 확인

### D1 데이터베이스 확인

```bash
# 프로젝트 수 확인
wrangler d1 execute coindrop-db --local --command "SELECT COUNT(*) FROM projects"

# 에어드랍 수 확인
wrangler d1 execute coindrop-db --local --command "SELECT COUNT(*) FROM airdrops"

# 최근 프로젝트 확인
wrangler d1 execute coindrop-db --local --command "SELECT name, slug, tvl_usd, tokenless_confidence FROM projects ORDER BY updated_at DESC LIMIT 10"
```

### API로 확인

```bash
# 통계 확인
curl http://localhost:8788/api/stats

# 에어드랍 목록 확인
curl http://localhost:8788/api/airdrops?limit=10
```

## 토큰리스 탐지 로직

에어드랍 후보는 다음 조건을 만족해야 합니다:

1. **토큰 없음**: `tokenSymbol`이 없거나 빈 문자열
2. **TVL 기준**: 
   - 1000만 달러 이상: +0.4 신뢰도
   - 100만 달러 이상: +0.3 신뢰도
   - 10만 달러 이상: +0.2 신뢰도
3. **주요 체인**: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, Solana
4. **최소 TVL**: 5만 달러 이상

**신뢰도 0.6 이상**인 프로토콜만 에어드랍으로 등록됩니다.

## 로깅 및 디버깅

### 로그 확인

Worker 로그는 Cloudflare 대시보드에서 확인:
- Workers → coindrop-collector → Logs

### 주요 로그 메시지

- `Collector: Starting collection...` - 수집 시작
- `Processing X protocols...` - 처리 중
- `Progress: X/Y processed` - 진행 상황 (100개마다)
- `Collection complete: X new projects, Y new airdrops, Z errors` - 완료

### 에러 처리

- 개별 프로토콜 처리 실패 시에도 계속 진행
- 전체 실패 시 HTTP 500 반환
- 에러는 `errorCount`에 집계됨

## 성능 최적화

### 배치 처리

현재는 순차 처리하지만, 향후 배치 처리로 개선 가능:
- 100개씩 묶어서 처리
- 병렬 처리 고려 (D1 동시 쿼리 제한 주의)

### ETag 활용

- 변경이 없으면 304 응답으로 빠르게 종료
- KV에 ETag 저장하여 다음 수집 시 활용

## 문제 해결

### API 호출 실패

```
Error: DeFiLlama API error: 429
```

→ Rate Limit 초과. 잠시 대기 후 재시도

### Queue 발행 실패

```
Queue send error for ...
```

→ Queue 바인딩 확인. 로컬에서는 무시 가능 (로그만 기록)

### D1 쿼리 실패

```
Error: Database not available
```

→ wrangler.toml의 D1 바인딩 확인

