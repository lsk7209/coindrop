# ⚠️ 필수: Cloudflare Dashboard 빌드 설정

## 현재 상황

`pages.json` 파일이 있지만 Cloudflare Pages가 빌드 명령어를 자동으로 감지하지 못하고 있습니다.

**로그 확인:**
```
No build command specified. Skipping build step.
Error: Output directory ".next" not found.
```

## 해결 방법 (필수)

### Cloudflare Dashboard에서 직접 설정

**이 방법이 가장 확실합니다.** 파일 설정으로는 해결되지 않으므로 반드시 Dashboard에서 설정해야 합니다.

### 단계별 가이드

#### 1. Cloudflare Dashboard 접속
- https://dash.cloudflare.com/
- 로그인

#### 2. Pages 프로젝트로 이동
- 좌측 메뉴: **Workers & Pages** 클릭
- **Pages** 탭 선택
- `coindrop-kr` 프로젝트 클릭

#### 3. Settings → Builds & deployments
- 상단 **Settings** 탭 클릭
- **Builds & deployments** 섹션 찾기
- 스크롤 다운하여 빌드 설정 섹션 확인

#### 4. 빌드 설정 입력
다음 값들을 **정확히** 입력하세요:

```
Build command: npm ci && npm run build
Build output directory: .next
Root directory: / (또는 비워두기)
Node.js version: 18
```

#### 5. 저장
- **Save** 버튼 클릭
- 성공 메시지 확인

#### 6. 재배포
- **Deployments** 탭으로 이동
- 가장 최근 배포 항목에서 **"Retry deployment"** 클릭
- 또는 새로운 커밋 푸시 시 자동 재배포

## 예상 결과

설정 후 다음 배포:
1. ✅ 저장소 클론
2. ✅ `npm ci` 실행 (의존성 설치)
3. ✅ `npm run build` 실행 (Next.js 빌드)
4. ✅ `.next` 디렉토리 생성 확인
5. ✅ 정상 배포 완료

## 참고사항

- `pages.json` 파일은 참고용이지만 Dashboard 설정이 우선순위가 높습니다
- Dashboard 설정이 있으면 항상 그 설정을 사용합니다
- 현재는 빌드 없이 배포되어 빈 사이트일 가능성이 높습니다

## 스크린샷 가이드 (참고)

1. Settings 탭에서 "Builds & deployments" 섹션 찾기
2. "Build command" 필드에 `npm ci && npm run build` 입력
3. "Build output directory" 필드에 `.next` 입력
4. Node.js version 드롭다운에서 `18` 선택

**이 설정만 완료하면 모든 문제가 해결됩니다!**

