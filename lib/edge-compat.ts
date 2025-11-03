/**
 * Edge Runtime 호환성 유틸리티
 * Cloudflare Workers/Edge Runtime에서 안전하게 사용할 수 있는 헬퍼
 */

/**
 * 환경 변수 안전 접근
 * Edge Runtime과 Node.js 모두 지원
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
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

/**
 * Queue 안전 접근
 */
export function getQueue(): { send: (message: unknown) => Promise<void> } | null {
  try {
    // @ts-ignore - Cloudflare 바인딩
    const q = (globalThis as any).q || (globalThis as any).QUEUE;
    if (q && typeof q.send === 'function') {
      return q;
    }
  } catch {
    // 접근 실패
  }
  return null;
}

/**
 * Edge Runtime에서 사용 가능한지 확인
 */
export function isEdgeRuntime(): boolean {
  return (
    typeof navigator !== 'undefined' && navigator.userAgent === 'cloudflare-workers' ||
    typeof (globalThis as any).DB !== 'undefined' ||
    typeof (globalThis as any).EdgeRuntime !== 'undefined'
  );
}

/**
 * 날짜 포맷팅 (Edge Runtime 호환)
 * date-fns 대신 Intl API 사용
 */
export function formatDate(
  date: Date,
  options: {
    timeZone?: string;
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
  } = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: options.timeZone || 'UTC',
    year: options.year || 'numeric',
    month: options.month || '2-digit',
    day: options.day || '2-digit',
    hour: options.hour || '2-digit',
    minute: options.minute || '2-digit',
    second: options.second || '2-digit',
    hour12: false,
  };

  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', defaultOptions);
    return formatter.format(date);
  } catch {
    // 폴백
    return date.toISOString();
  }
}

