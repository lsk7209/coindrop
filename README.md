# CoinDrop.kr

코인 에어드랍 자동 수집·생성·발행 플랫폼

## ⚠️ 배포 전 필수 설정

**Cloudflare Pages 배포 시 반드시 Dashboard에서 빌드 설정을 해야 합니다:**

1. Cloudflare Dashboard → Workers & Pages → Pages → 프로젝트
2. Settings → Builds & deployments
3. 설정:
   - Build command: `npm ci && npm run build`
   - Build output directory: `.next`
   - Node.js version: `18`
4. Save 후 재배포

자세한 내용: `READ_THIS_FIRST.md` 참고

## 기술 스택

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Cloudflare Workers + Pages
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Cloudflare KV
- **Queue**: Cloudflare Queues
- **Email**: Resend
- **AI**: OpenAI ChatGPT API

## 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.dev.vars` 파일을 생성하고 다음 변수들을 설정하세요:

```
OPENAI_API_KEY=your_key
RESEND_API_KEY=your_key
SENTRY_DSN=your_dsn
MAKE_WEBHOOK_URL=your_url
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. D1 데이터베이스 생성

```bash
# 프로덕션 데이터베이스 생성
wrangler d1 create coindrop-db

# 생성된 database_id를 wrangler.toml에 추가
```

### 4. KV Namespace 생성

```bash
wrangler kv:namespace create "KV_CACHE"
wrangler kv:namespace create "KV_CACHE" --preview
```

### 5. R2 Bucket 생성

```bash
wrangler r2 bucket create coindrop-contents
wrangler r2 bucket create coindrop-backups
```

### 6. 마이그레이션 실행

```bash
# 로컬 개발
npm run db:migrate:local

# 프로덕션
npm run db:migrate
```

### 7. 개발 서버 실행

```bash
npm run dev
```

## 프로젝트 구조

```
/
├── app/              # Next.js App Router
│   ├── (site)/       # 메인 사이트 페이지
│   ├── [chain]/      # 체인별 페이지
│   ├── api/          # API 라우트
│   └── layout.tsx
├── lib/              # 유틸리티 및 핵심 로직
│   ├── collector.ts  # DeFiLlama 수집 로직
│   ├── generator.ts  # 콘텐츠 생성 로직
│   ├── jsonld.ts     # JSON-LD 생성
│   ├── schema.ts     # Zod 스키마
│   └── kv.ts         # KV 캐시 헬퍼
├── workers/          # Cloudflare Workers
│   ├── collector.ts  # 수집 워커
│   ├── consumer.ts   # Queue 소비자
│   └── newsletter.ts # 뉴스레터 워커
├── scripts/          # 유틸리티 스크립트
│   ├── migrate.sql   # D1 마이그레이션
│   └── seed.ts       # 시드 데이터
└── docs/             # 문서
    └── PRD.md        # 프로젝트 요구사항 문서
```

## 배포

### Cloudflare Pages 배포

```bash
npm run build
npm run wrangler:deploy
```

## 주요 기능

- ✅ DeFiLlama API 기반 자동 에어드랍 탐지
- ✅ AI 기반 한국어 콘텐츠 생성
- ✅ SEO/AEO/GenEO 최적화
- ✅ Cloudflare Queues 기반 비동기 처리
- ✅ ISR 및 KV 캐싱
- ✅ 뉴스레터 발송 (Resend)

## 문서

자세한 내용은 [PRD 문서](./docs/PRD.md)를 참조하세요.

