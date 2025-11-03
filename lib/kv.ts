/**
 * Cloudflare KV 캐시 헬퍼
 */

export interface KVEnv {
  KV_CACHE: KVNamespace;
}

const CACHE_TTL = {
  DETAIL: 600, // 10분
  LIST: 300, // 5분
  SITEMAP: 300, // 5분
} as const;

/**
 * KV에 데이터 저장
 */
export async function setCache(
  kv: KVNamespace,
  key: string,
  data: any,
  ttl: number = CACHE_TTL.DETAIL
): Promise<void> {
  await kv.put(key, JSON.stringify(data), {
    expirationTtl: ttl,
  });
}

/**
 * KV에서 데이터 조회
 */
export async function getCache<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const value = await kv.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * KV 캐시 삭제
 */
export async function deleteCache(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

/**
 * 패턴으로 캐시 삭제 (최대 1000개)
 */
export async function deleteCacheByPattern(
  kv: KVNamespace,
  prefix: string
): Promise<number> {
  const keys = await kv.list({ prefix });
  let deleted = 0;
  for (const key of keys.keys) {
    await kv.delete(key.name);
    deleted++;
    if (deleted >= 1000) break; // 제한
  }
  return deleted;
}

/**
 * 캐시 키 생성 헬퍼
 */
export const CacheKey = {
  airdropDetail: (chain: string, slug: string) =>
    `airdrop:${chain}:${slug}`,
  airdropList: (params: string) => `airdrop:list:${params}`,
  sitemap: (path: string) => `sitemap:${path}`,
  stats: () => 'stats:global',
} as const;

export { CACHE_TTL };

