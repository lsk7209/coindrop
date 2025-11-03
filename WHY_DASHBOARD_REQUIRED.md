# 왜 Dashboard 설정이 필수인가?

## 기술적 이유

### 1. Cloudflare Pages 아키텍처

Cloudflare Pages는 빌드 설정을 다음 순서로 확인합니다:

```
1순위: Dashboard 설정 (최우선)
2순위: pages.json 파일 (자동 감지 시도)
3순위: 프레임워크 자동 감지
```

**현재 상황**: 1순위가 비어있어서 2순위로 넘어갔지만, `pages.json`이 감지되지 않음

### 2. wrangler.toml의 한계

`wrangler.toml`은 Cloudflare **Workers**용 설정 파일입니다.
Cloudflare **Pages**에서는 제한적으로만 사용됩니다:

- ✅ 지원: `pages_build_output_dir`
- ❌ 미지원: 빌드 명령어 (`build_command` 필드 없음)
- ❌ 미지원: Node.js 버전 지정
- ❌ 미지원: 설치 명령어

이것이 Cloudflare Pages의 의도된 설계입니다.

### 3. pages.json 베타 기능

`pages.json` 파일은 비교적 최근에 추가된 기능입니다:
- 베타 단계일 수 있음
- 모든 프로젝트에서 작동하지 않을 수 있음
- Dashboard 설정이 있으면 우선되어 무시됨

## 해결 불가능한 이유

### 코드로 해결할 수 없는 이유

1. **wrangler.toml에 빌드 명령어 필드가 없음**
   ```toml
   # 이런 필드는 존재하지 않습니다
   # build_command = "npm run build"  ❌
   ```

2. **Cloudflare Pages 정책**
   - 사용자 제어를 위한 설계
   - Dashboard 설정이 항상 우선
   - 코드만으로 강제 불가

3. **자동 감지의 한계**
   - 프레임워크마다 다름
   - Next.js는 Edge Runtime 사용 시 특별한 설정 필요
   - 자동 감지가 실패할 수 있음

## 올바른 접근 방법

### ✅ 권장: Dashboard 설정

1. **명확성**: 설정이 명확하게 표시됨
2. **안정성**: 항상 작동함
3. **유연성**: 프로젝트별로 다르게 설정 가능
4. **제어**: 언제든지 변경 가능

### ❌ 비권장: 코드만 의존

1. **불안정**: 자동 감지 실패 가능
2. **제한적**: 모든 설정을 코드로 할 수 없음
3. **복잡성**: 여러 파일 수정 필요

## 결론

**Dashboard 설정은 "우회 방법"이 아닙니다.**
**Cloudflare Pages의 정식 사용 방법입니다.**

코드는 모두 준비되어 있습니다.
Dashboard에서 빌드 명령어만 설정하면 됩니다.

---

**⏱️ 예상 소요 시간: 3분**

1. Dashboard 접속 (30초)
2. 빌드 설정 입력 (1분)
3. 저장 및 재배포 (1분)
4. 완료 (30초)

**지금 바로 Dashboard에서 설정해주세요!**

