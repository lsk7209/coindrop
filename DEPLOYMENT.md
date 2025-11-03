# 배포 가이드

## 사전 준비

1. Cloudflare 계정 생성 및 로그인
2. Node.js 18+ 설치 확인

## 1. Cloudflare 리소스 생성

### D1 데이터베이스 생성

```bash
wrangler d1 create coindrop-db
```

생성된 `database_id`를 `wrangler.toml`의 `database_id`에 입력합니다.

### KV Namespace 생성

```bash
wrangler kv:namespace create "KV_CACHE"
wrangler kv:namespace create "KV_CACHE" --preview
```

생성된 ID를 `wrangler.toml`에 입력합니다.

### R2 Bucket 생성

```bash
wrangler r2 bucket create coindrop-contents
wrangler r2 bucket create coindrop-backups
```

### Queue 생성

```bash
wrangler queues create q.generate
```

## 2. 환경 변수 설정

### Secrets 설정

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put REVALIDATE_TOKEN  # ISR 재검증용 토큰
wrangler secret put MAKE_WEBHOOK_URL  # 선택사항
wrangler secret put TELEGRAM_BOT_TOKEN  # 선택사항
wrangler secret put TELEGRAM_CHAT_ID  # 선택사항
wrangler secret put SENTRY_DSN  # 선택사항
```

## 3. 데이터베이스 마이그레이션

```bash
# 프로덕션
npm run db:migrate

# 로컬 개발
npm run db:migrate:local
```

## 4. Workers 배포

### Collector Worker (Cron 설정)

`wrangler.toml`에 다음을 추가:

```toml
[[triggers.crons]]
cron = "0 */3 * * *"  # 3시간마다 실행
```

배포:

```bash
wrangler deploy --name collector
```

### Consumer Worker

`wrangler.toml`에 Queue 설정이 이미 되어 있으므로, 자동으로 배포됩니다.

### Newsletter Worker (Cron 설정)

```toml
[[triggers.crons]]
cron = "0 0 * * *"  # 매일 자정 (KST 09:00)
```

## 5. Next.js Pages 배포

```bash
npm run build
npm run wrangler:deploy
```

## 6. 도메인 연결

Cloudflare Pages에서 도메인을 연결합니다.

## 7. DNS 설정

도메인의 DNS 레코드를 Cloudflare로 변경합니다.

## 8. SSL/TLS 설정

Cloudflare에서 SSL/TLS 모드를 "Full" 또는 "Full (strict)"로 설정합니다.

## 개발 환경 설정

`.dev.vars` 파일 생성:

```
OPENAI_API_KEY=your_key
RESEND_API_KEY=your_key
REVALIDATE_TOKEN=your_token
```

로컬 개발:

```bash
npm run dev
```

Cloudflare Pages 로컬 테스트:

```bash
npm run wrangler:dev
```

