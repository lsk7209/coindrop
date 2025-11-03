# Cloudflare 리소스 설정 가이드

## 배포 전 필수 설정

Cloudflare Pages 배포 전에 다음 리소스들을 생성하고 `wrangler.toml`에 ID를 입력해야 합니다.

### 1. D1 데이터베이스 생성

```bash
# Cloudflare Dashboard에서 생성하거나
wrangler d1 create coindrop-db

# 생성 후 출력된 database_id를 wrangler.toml에 입력
# [[env.production.d1_databases]]의 database_id 필드
```

**wrangler.toml 설정 위치:**
```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "coindrop-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← 여기에 입력
```

### 2. KV Namespace 생성

```bash
# Cloudflare Dashboard에서 생성하거나
wrangler kv:namespace create "KV_CACHE"

# 생성 후 출력된 id를 wrangler.toml에 입력
```

**wrangler.toml 설정 위치:**
```toml
[[env.production.kv_namespaces]]
binding = "KV_CACHE"
id = "YOUR_KV_ID_HERE"  # ← 여기에 입력 (빈 문자열이면 에러 발생)
```

⚠️ **중요**: `id` 필드는 빈 문자열이면 안됩니다. 반드시 실제 KV Namespace ID를 입력해야 합니다.

### 3. R2 Bucket 생성

R2 Bucket은 이름만 설정하면 자동으로 연결됩니다:

```bash
# Cloudflare Dashboard에서 생성:
# - coindrop-contents
# - coindrop-backups
```

Bucket 이름이 `wrangler.toml`에 설정된 이름과 일치하면 자동 연결됩니다.

### 4. Queue 생성

```bash
# Cloudflare Dashboard에서 Queue 생성:
# - Queue 이름: q.generate
```

Queue 이름이 `wrangler.toml`에 설정된 이름과 일치하면 자동 연결됩니다.

## 빠른 설정 방법

### Cloudflare Dashboard 사용

1. **D1 데이터베이스**:
   - Dashboard → Workers & Pages → D1
   - "Create database" 클릭
   - 이름: `coindrop-db`
   - Database ID 복사 → `wrangler.toml`의 `database_id`에 붙여넣기

2. **KV Namespace**:
   - Dashboard → Workers & Pages → KV
   - "Create a namespace" 클릭
   - 이름: `KV_CACHE`
   - Namespace ID 복사 → `wrangler.toml`의 `id`에 붙여넣기

3. **R2 Bucket**:
   - Dashboard → R2
   - "Create bucket" 클릭
   - 이름: `coindrop-contents`
   - 다시 "Create bucket" 클릭
   - 이름: `coindrop-backups`

4. **Queue**:
   - Dashboard → Workers & Pages → Queues
   - "Create queue" 클릭
   - 이름: `q.generate`

## 배포 순서

1. ✅ D1, KV, R2, Queue 리소스 생성
2. ✅ `wrangler.toml`에 실제 ID 입력
3. ✅ GitHub에 푸시
4. ✅ Cloudflare Pages에서 자동 배포 확인

## 에러 해결

### "kv_namespaces[0] bindings should have a string 'id' field"

**원인**: KV Namespace의 `id` 필드가 빈 문자열입니다.

**해결**: 
1. KV Namespace를 생성하고 실제 ID를 복사
2. `wrangler.toml`의 `[[env.production.kv_namespaces]]` 섹션에 `id` 값 입력
3. 빈 문자열(`""`)이 아닌 실제 ID 문자열이어야 합니다

### "vars is not inherited by environments"

**해결**: `env.production` 섹션에 모든 설정을 복사했습니다. 이제 환경별로 독립적으로 설정됩니다.

