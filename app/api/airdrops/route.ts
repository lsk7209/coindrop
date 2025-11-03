import { NextRequest, NextResponse } from 'next/server';
import { getAirdrops } from '@/lib/db';
import { getCache, setCache, CacheKey, CACHE_TTL } from '@/lib/kv';
import { getCloudflareEnv } from '@/lib/cf-bindings';

export const runtime = 'edge';

/**
 * GET /api/airdrops
 * 목록 조회 (커서 페이징)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || undefined;
    const status = searchParams.get('status') || undefined;
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 캐시 키 생성
    const cacheKey = CacheKey.airdropList(
      JSON.stringify({ chain, status, cursor, limit })
    );

    // Cloudflare 바인딩 접근
    const env = getCloudflareEnv(request);
    const { DB, KV_CACHE } = env;

    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // KV 캐시 확인
    let cached: { data: unknown[]; nextCursor: number | null } | null = null;
    if (KV_CACHE) {
      cached = await getCache<{ data: unknown[]; nextCursor: number | null }>(
        KV_CACHE,
        cacheKey
      );
    }

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    }

    const result = await getAirdrops(DB, {
      chain,
      status,
      limit,
      cursor,
    });

    // 프로젝트 정보 포함 (JOIN 필요 시 별도 처리)
    const dataWithProjects = await Promise.all(
      result.data.map(async (airdrop) => {
        const project = await DB.prepare('SELECT * FROM projects WHERE id = ?')
          .bind(airdrop.project_id)
          .first<{
            slug: string;
            name: string;
            chains: string;
            tvl_usd: number | null;
          }>();

        return {
          ...airdrop,
          project: project
            ? {
                slug: project.slug,
                name: project.name,
                chains: JSON.parse(project.chains),
                tvl_usd: project.tvl_usd,
              }
            : null,
        };
      })
    );

    const response = {
      data: dataWithProjects,
      nextCursor: result.nextCursor,
      hasMore: result.nextCursor !== null,
    };

    // 캐시 저장
    if (KV_CACHE) {
      await setCache(KV_CACHE, cacheKey, response, CACHE_TTL.LIST);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching airdrops:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
