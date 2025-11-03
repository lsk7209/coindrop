# 🚨 긴급 빌드 문제 해결 가이드

## 현재 문제

Cloudflare Pages가 빌드 명령어를 실행하지 않습니다:
```
No build command specified. Skipping build step.
Error: Output directory ".next" not found.
```

## 즉시 해결 방법

### 방법 1: Cloudflare Dashboard에서 직접 설정 (가장 확실함) ⭐

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/

2. **Pages 프로젝트 설정**
   - Workers & Pages → Pages
   - `coindrop-kr` 프로젝트 클릭

3. **Builds & Deployments 설정**
   - Settings 탭 클릭
   - Builds & deployments 섹션 찾기

4. **빌드 설정 입력**
   ```
   Build command: npm ci && npm run build
   Build output directory: .next
   Root directory: / (기본값)
   Node.js version: 18
   Environment variables: (필요시 추가)
   ```

5. **저장 후 재배포**
   - Save 클릭
   - Deployments 탭에서 "Retry deployment" 클릭

### 방법 2: pages.json 파일 확인 (이미 업데이트됨)

`pages.json` 파일이 프로젝트 루트에 있는지 확인:
```json
{
  "buildCommand": "npm ci && npm run build",
  "buildOutputDirectory": ".next",
  "nodeVersion": "18",
  "installCommand": "npm ci"
}
```

**중요**: Cloudflare Pages가 `pages.json`을 자동으로 감지하지 못할 수 있습니다.
Dashboard에서 직접 설정하는 것이 더 확실합니다.

## 최종 체크리스트

- [x] `wrangler.toml`에 `pages_build_output_dir = ".next"` 있음
- [x] `pages.json` 파일 존재 및 업데이트됨
- [x] `package.json`에 `"build": "next build"` 스크립트 있음
- [ ] **Dashboard에서 빌드 명령어 설정** (필수!)

## 예상 결과

설정 후 다음 배포 시:
1. ✅ 저장소 클론
2. ✅ `npm ci` 실행 (의존성 설치)
3. ✅ `npm run build` 실행 (Next.js 빌드)
4. ✅ `.next` 디렉토리 생성
5. ✅ 정상 배포

## 참고

- `pages.json` 파일이 있어도 Dashboard 설정이 우선순위가 높을 수 있습니다
- 빌드 명령어는 반드시 Dashboard에서 설정하는 것을 권장합니다
- 현재 빌드 없이 배포되어 빈 사이트일 수 있습니다

