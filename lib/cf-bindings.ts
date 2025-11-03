/**
 * Cloudflare Pages 바인딩 접근 헬퍼
 * Edge Runtime 환경에서 Cloudflare 바인딩에 안전하게 접근
 * 
 * Next.js on Cloudflare Pages에서는 바인딩이 자동으로 주입됩니다.
 * wrangler.toml에 정의된 바인딩이 globalThis를 통해 접근 가능합니다.
 */

/**
 * Cloudflare Pages Edge Runtime에서 바인딩 접근
 * Next.js API Routes에서는 globalThis를 통해 접근
 */
export function getCloudflareEnv(request: Request): {
  DB?: D1Database;
  KV_CACHE?: KVNamespace;
  R2_CONTENTS?: R2Bucket;
  R2_BACKUPS?: R2Bucket;
} {
  // Cloudflare Pages의 Next.js Edge Runtime에서는 globalThis에 바인딩이 주입됨
  // wrangler.toml의 binding 이름과 동일하게 접근
  // 타입 안전성을 위해 명시적 타입 캐스팅 사용
  
  return {
    // @ts-ignore - Cloudflare Pages 전용 바인딩
    DB: (globalThis as any).DB as D1Database | undefined,
    // @ts-ignore - Cloudflare Pages 전용 바인딩
    KV_CACHE: (globalThis as any).KV_CACHE as KVNamespace | undefined,
    // @ts-ignore - Cloudflare Pages 전용 바인딩
    R2_CONTENTS: (globalThis as any).R2_CONTENTS as R2Bucket | undefined,
    // @ts-ignore - Cloudflare Pages 전용 바인딩
    R2_BACKUPS: (globalThis as any).R2_BACKUPS as R2Bucket | undefined,
  };
}

/**
 * 환경이 Cloudflare Pages인지 확인
 */
export function isCloudflarePages(): boolean {
  // Cloudflare Pages 환경 감지
  return (
    typeof globalThis !== 'undefined' &&
    (typeof (globalThis as any).DB !== 'undefined' ||
     typeof (globalThis as any).KV_CACHE !== 'undefined')
  );
}

/**
 * 안전한 환경 변수 접근 (deprecated - getEnv 사용 권장)
 * @deprecated Use getEnv from lib/edge-compat.ts instead
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  // Cloudflare Workers/Pages 환경
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore - Cloudflare 환경 변수
    const cfEnv = (globalThis as any)[key] || (globalThis as any).env?.[key];
    if (cfEnv) return String(cfEnv);
  }

  // Node.js 환경 (로컬 개발)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }

  return defaultValue;
}

