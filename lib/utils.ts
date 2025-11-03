/**
 * UTC 타임스탬프(초)를 KST 날짜 문자열로 변환
 * Edge Runtime 호환: Intl.DateTimeFormat 사용
 */
export function utcToKSTString(timestamp: number, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const date = new Date(timestamp * 1000);
  
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const second = parts.find(p => p.type === 'second')?.value;
    
    // yyyy-MM-dd HH:mm:ss 형식
    if (formatStr.includes('yyyy')) {
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    
    return formatter.format(date);
  } catch {
    // 폴백: ISO 문자열 반환
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }
}

/**
 * 현재 UTC 타임스탬프(초) 반환
 */
export function nowUTC(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 슬러그 생성 (kebab-case, max 60자)
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백/언더스코어를 하이픈으로
    .replace(/^-+|-+$/g, '') // 앞뒤 하이픈 제거
    .slice(0, 60); // 최대 60자
}

/**
 * idempotency_key 생성 (SHA-256 해시)
 */
export async function createIdempotencyKey(payload: string | object): Promise<string> {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * slug_crc 계산 (CRC32 해시, UINT32)
 */
export function slugCRC(slug: string): number {
  // 간단한 CRC32 구현
  let crc = 0xffffffff;
  for (let i = 0; i < slug.length; i++) {
    crc ^= slug.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0; // UINT32
}

/**
 * JSON 안전 파싱
 */
export function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 에러를 안전하게 문자열로 변환
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

