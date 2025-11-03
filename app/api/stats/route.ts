import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/db';
import { getCache, setCache, CacheKey, CACHE_TTL } from '@/lib/kv';
import { getCloudflareEnv } from '@/lib/cf-bindings';

export const runtime = 'edge';

/**
 * GET /api/stats
 * 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    // Cloudflare 바인딩 접근
    const env = getCloudflareEnv(request);
    const { DB, KV_CACHE } = env;

    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // 캐시 확인
    const cacheKey = CacheKey.stats();
    let cached: any = null;
    if (KV_CACHE) {
      cached = await getCache<any>(KV_CACHE, cacheKey);
    }

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    }

    const stats = await getStats(DB);

    // 캐시 저장
    if (KV_CACHE) {
      await setCache(KV_CACHE, cacheKey, stats, CACHE_TTL.LIST);
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
