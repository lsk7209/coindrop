# 🚨 먼저 읽어주세요 - 필수 설정 가이드

## 현재 상황

모든 코드와 설정 파일은 정상입니다. 하지만 **Cloudflare Pages Dashboard에서 빌드 명령어를 설정하지 않으면 배포가 실패합니다.**

## ⚡ 빠른 해결 (3분)

### 1단계: Cloudflare Dashboard 접속
👉 https://dash.cloudflare.com/

### 2단계: Pages 프로젝트 찾기
1. 좌측 메뉴: **Workers & Pages** 클릭
2. **Pages** 탭 클릭
3. `coindrop-kr` 프로젝트 클릭

### 3단계: 빌드 설정
1. 상단 **Settings** 탭 클릭
2. **Builds & deployments** 섹션 찾기 (스크롤 다운)
3. 다음 값 입력:

```
Build command: npm ci && npm run build
Build output directory: .next
Node.js version: 18
```

### 4단계: 저장 및 재배포
1. **Save** 버튼 클릭
2. **Deployments** 탭으로 이동
3. 최신 배포에서 **"Retry deployment"** 클릭

## ✅ 예상 결과

설정 후 배포 로그:
```
✅ Cloning repository...
✅ Found wrangler.toml file. Reading build configuration...
✅ Successfully read wrangler.toml file.
✅ Running build command: npm ci && npm run build
✅ npm ci 완료
✅ npm run build 완료
✅ Output directory ".next" found.
✅ 배포 성공
```

## 왜 Dashboard 설정이 필요한가?

1. **Cloudflare Pages 정책**: Dashboard 설정이 최우선
2. **pages.json 한계**: 자동 감지가 실패할 수 있음 (베타 기능)
3. **wrangler.toml 한계**: 빌드 명령어 필드가 없음

## 코드 상태 ✅

모든 파일이 준비되어 있습니다:
- ✅ `pages.json` - 빌드 명령어 포함
- ✅ `wrangler.toml` - 출력 디렉토리 설정
- ✅ `package.json` - 빌드 스크립트 있음

**Dashboard 설정만 하면 즉시 해결됩니다!**

---

⏱️ 예상 소요 시간: **3분**

지금 바로 Dashboard에서 설정해주세요!

