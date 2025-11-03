# ⚠️ 즉시 해결 방법 - Dashboard 설정

## 문제 상황

로그를 보면:
```
No build command specified. Skipping build step.
Error: Output directory ".next" not found.
```

**원인**: Cloudflare Pages가 빌드 명령어를 찾지 못하고 있습니다.
`pages.json` 파일이 있어도 자동 감지가 안 될 수 있습니다.

## 해결 방법 (5분 소요)

### 1단계: Cloudflare Dashboard 접속
- https://dash.cloudflare.com/
- 로그인

### 2단계: Pages 프로젝트 찾기
- 좌측 메뉴: **Workers & Pages** 클릭
- **Pages** 탭 클릭
- `coindrop-kr` 프로젝트 클릭

### 3단계: Settings → Builds & deployments
- 프로젝트 페이지에서 **Settings** 탭 클릭
- 스크롤 다운하여 **Builds & deployments** 섹션 찾기

### 4단계: 빌드 설정 입력

**아래 값들을 정확히 입력:**

| 필드 | 값 |
|------|-----|
| **Build command** | `npm ci && npm run build` |
| **Build output directory** | `.next` |
| **Root directory** | `/` (또는 비워두기) |
| **Node.js version** | `18` |

### 5단계: 저장
- 페이지 하단의 **Save** 버튼 클릭
- 성공 메시지 확인

### 6단계: 재배포
- **Deployments** 탭으로 이동
- 가장 최근 배포 항목 찾기
- **"Retry deployment"** 또는 **"Retry build"** 버튼 클릭

## 예상 결과

설정 후 배포 로그:
```
✅ Cloning repository...
✅ npm ci 실행...
✅ npm run build 실행...
✅ .next 디렉토리 생성 확인
✅ 배포 완료
```

## 중요

- `pages.json` 파일은 참고용일 뿐입니다
- Dashboard 설정이 **항상 우선순위**입니다
- 현재는 빌드 없이 배포되어 빈 사이트일 수 있습니다
- **이 설정만 완료하면 모든 문제가 해결됩니다!**

## 확인 방법

설정 완료 후:
1. Deployments 탭에서 빌드 로그 확인
2. "npm ci" 또는 "npm run build" 로그가 보이면 성공
3. 빌드 성공 후 사이트가 정상 작동하는지 확인

---

**⏰ 이제 Dashboard에서 설정해주세요. 코드는 모두 준비되어 있습니다!**

