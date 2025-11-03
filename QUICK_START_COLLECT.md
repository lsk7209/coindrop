# DeFiLlama 수집 빠른 시작 가이드

## 🚀 3단계로 수집 시작하기

### 1단계: API 테스트

실제 DeFiLlama API가 작동하는지 확인:

```bash
npm run test:api
```

예상 출력:
```
✅ Status: 200
📦 Headers: {...}
🔄 ETag: "abc123..."
📊 응답 구조:
- 타입: 배열
- 항목 수: 3000개 이상
```

### 2단계: 데이터베이스 준비

```bash
# 마이그레이션 실행 (로컬)
npm run db:migrate:local
```

### 3단계: 수집 실행

**옵션 A: wrangler pages dev 사용 (권장)**

```bash
# 터미널 1: 개발 서버 시작
npm run wrangler:dev

# 터미널 2: 수집 트리거
curl -X POST http://localhost:8788/api/admin/collect \
  -H "Authorization: Bearer default-collect-token"
```

**옵션 B: API 테스트 (프로덕션/스테이징)**

```bash
curl -X POST https://your-domain.com/api/admin/collect \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ 수집 성공 확인

### API로 확인

```bash
# 통계 확인
curl http://localhost:8788/api/stats

# 에어드랍 목록
curl http://localhost:8788/api/airdrops?limit=5
```

### D1 데이터베이스 확인

```bash
# 프로젝트 수
wrangler d1 execute coindrop-db --local \
  --command "SELECT COUNT(*) as count FROM projects"

# 에어드랍 수
wrangler d1 execute coindrop-db --local \
  --command "SELECT COUNT(*) as count FROM airdrops"

# 최근 프로젝트
wrangler d1 execute coindrop-db --local \
  --command "SELECT name, slug, tvl_usd, tokenless_confidence FROM projects ORDER BY updated_at DESC LIMIT 10"
```

## 📊 예상 결과

첫 수집 시:
- **처리된 프로토콜**: 3000개 이상
- **신규 프로젝트**: 3000개 이상 (첫 실행)
- **신규 에어드랍**: 100-500개 (토큰리스 후보)

## ⚠️ 주의사항

1. **첫 실행은 시간이 걸립니다**: 3000개 이상 프로토콜 처리
2. **Rate Limit**: DeFiLlama API는 Rate Limit이 있을 수 있음
3. **Queue 설정**: Queue가 설정되지 않으면 로그만 기록됨

## 🔧 문제 해결

### "Database not available" 에러

```bash
# wrangler.toml 확인
# database_id 또는 preview_database_id 설정 확인
```

### "Unauthorized" 에러

```bash
# 환경 변수 확인
echo $COLLECT_TOKEN

# 또는 .dev.vars 파일에 설정
COLLECT_TOKEN=your-token
```

### 수집이 너무 느림

- 첫 수집은 정상입니다 (3000개 이상 처리)
- 이후 수집은 ETag로 빠르게 종료됩니다

