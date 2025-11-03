# Cloudflare Pages 빌드 문제 해결

## 현재 문제

배포 로그에서 확인된 문제:
```
A wrangler.toml file was found but it does not appear to be valid.
Did you mean to use wrangler.toml to configure Pages? 
If so, then make sure the file is valid and contains the `pages_build_output_dir` property.
No build command specified. Skipping build step.
```

**원인**: `pages_build_output_dir`이 주석 처리되어 wrangler.toml이 무효로 판단됨

## 해결 방법

### 1. wrangler.toml 복원
`pages_build_output_dir = ".next"`를 다시 활성화했습니다.

### 2. 빌드 설정 확인

Cloudflare Pages는 다음 순서로 빌드 설정을 확인합니다:
1. Dashboard 설정 (최우선)
2. `pages.json` 파일
3. `wrangler.toml`의 `pages_build_output_dir`

### 3. Dashboard에서 빌드 명령어 설정 (권장)

**방법 1: Dashboard 설정** (가장 확실함)
1. Cloudflare Dashboard → Workers & Pages → Pages → 프로젝트
2. Settings → Builds & deployments
3. Build command: `npm run build`
4. Build output directory: `.next`
5. Node.js version: `18`

**방법 2: pages.json 사용**
- 이미 생성된 `pages.json` 파일이 있으면 자동 감지
- `wrangler.toml`에 `pages_build_output_dir`이 있어야 인식됨

## 현재 상태

✅ `wrangler.toml`: `pages_build_output_dir` 복원 완료
✅ `pages.json`: 빌드 설정 포함
⏳ Dashboard에서 빌드 명령어 설정 필요

## 다음 배포

다음 배포 시:
1. `wrangler.toml`이 유효하게 인식됨
2. Dashboard에서 빌드 명령어 설정하면 빌드 실행
3. `.next` 디렉토리 생성 및 배포

**중요**: 현재는 빌드가 실행되지 않아 빈 사이트가 배포되었을 수 있습니다.
Dashboard에서 빌드 명령어를 설정하면 정상적으로 빌드됩니다.

