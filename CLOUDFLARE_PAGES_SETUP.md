# Cloudflare Pages 배포 설정 가이드

## 현재 문제점

Cloudflare Pages 빌드 시 다음 에러가 발생:
```
Error: Output directory ".next" not found.
No build command specified. Skipping build step.
```

## 해결 방법

### 1. Cloudflare Dashboard에서 빌드 설정

Cloudflare Dashboard → Workers & Pages → Pages → 프로젝트 → Settings → Builds & deployments

**빌드 설정:**
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (기본값)
- **Node.js version**: `18` 또는 `20`

### 2. 또는 pages.json 파일 사용 (권장)

프로젝트 루트에 `pages.json` 파일을 생성했습니다:

```json
{
  "buildCommand": "npm run build",
  "buildOutputDirectory": ".next",
  "nodeVersion": "18"
}
```

이 파일이 있으면 Cloudflare Pages가 자동으로 빌드 설정을 읽습니다.

### 3. package.json 확인

`package.json`에 빌드 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "build": "next build"
  }
}
```

✅ 현재 `package.json`에 이미 포함되어 있습니다.

## 배포 체크리스트

### 필수 설정 (Dashboard에서)
- [ ] Build command: `npm run build`
- [ ] Build output directory: `.next`
- [ ] Node.js version: `18` 또는 `20`

### 선택적 설정 (나중에 추가)
- [ ] D1 Database ID 입력 (데이터베이스 사용 시)
- [ ] KV Namespace ID 입력 (캐싱 사용 시)
- [ ] 환경 변수 설정 (OPENAI_API_KEY 등)

## 빌드 프로세스

1. ✅ Git 저장소 클론
2. ✅ `npm install` (자동 실행)
3. ⏳ `npm run build` 실행 (설정 필요)
4. ⏳ `.next` 디렉토리 생성 확인
5. ⏳ 배포

## 문제 해결

### "No build command specified"

**원인**: Cloudflare Pages Dashboard에서 빌드 명령어가 설정되지 않음

**해결**: 
- Dashboard → Builds & deployments → Build command에 `npm run build` 입력
- 또는 `pages.json` 파일 사용 (자동 감지)

### "Output directory .next not found"

**원인**: 빌드 명령어가 실행되지 않아서 `.next` 폴더가 생성되지 않음

**해결**: 
- 빌드 명령어를 먼저 설정
- 빌드가 성공하면 `.next` 폴더가 자동 생성됨

## 빠른 설정

1. Cloudflare Dashboard 접속
2. Workers & Pages → Pages → 프로젝트 선택
3. Settings → Builds & deployments
4. Build command: `npm run build` 입력
5. Build output directory: `.next` 입력
6. Save

이제 다음 배포부터 자동으로 빌드가 실행됩니다!

