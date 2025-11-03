import { NextRequest, NextResponse } from 'next/server';
import { getContentBySlug } from '@/lib/db';
import { getCache, setCache, CacheKey, CACHE_TTL } from '@/lib/kv';
import { safeJsonParse } from '@/lib/utils';
import { getCloudflareEnv } from '@/lib/cf-bindings';

export const runtime = 'edge';

/**
 * GET /api/airdrops/:chain/:slug
 * 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string; slug: string } }
) {
  try {
    const { chain, slug } = params;

    // Cloudflare 바인딩 접근
    const env = getCloudflareEnv(request);
    const { DB, KV_CACHE, R2_CONTENTS } = env;

    if (!DB || !R2_CONTENTS) {
      return NextResponse.json(
        { error: 'Database or storage not available' },
        { status: 500 }
      );
    }

    // 캐시 키 생성
    const cacheKey = CacheKey.airdropDetail(chain, slug);

    // KV 캐시 확인
    let cached: any = null;
    if (KV_CACHE) {
      cached = await getCache<any>(KV_CACHE, cacheKey);
    }

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        },
      });
    }

    // D1에서 content 메타데이터 조회
    const contentSlug = `${slug}-${chain}-guide`;
    const content = await getContentBySlug(DB, contentSlug);

    if (!content) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // R2에서 본문 JSON 조회
    const r2Object = await R2_CONTENTS.get(content.r2_key || '');
    if (!r2Object) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const r2Content = await r2Object.json();

    // Airdrop 정보 조회
    const airdrop = await DB.prepare('SELECT * FROM airdrops WHERE id = ?')
      .bind(content.airdrop_id)
      .first<{
        status: string;
        reward_type: string | null;
        snapshot_at: number | null;
        deadline_at: number | null;
        tasks_json: string | null;
        claim_links_json: string | null;
      }>();

    // Project 정보 조회
    const project = await DB.prepare(
      `SELECT p.* FROM projects p
       INNER JOIN airdrops a ON p.id = a.project_id
       WHERE a.id = ?`
    )
      .bind(content.airdrop_id)
      .first<{
        slug: string;
        name: string;
        chains: string;
        website: string | null;
        twitter: string | null;
        discord: string | null;
        tvl_usd: number | null;
      }>();

    const response = {
      content: {
        ...content,
        quality_scores: safeJsonParse(content.quality_scores, {}),
        lint_errors: safeJsonParse(content.lint_errors, []),
        hashtags: safeJsonParse(content.hashtags, []),
      },
      airdrop: airdrop
        ? {
            ...airdrop,
            tasks: safeJsonParse(airdrop.tasks_json, []),
            claim_links: safeJsonParse(airdrop.claim_links_json, []),
          }
        : null,
      project: project
        ? {
            ...project,
            chains: safeJsonParse(project.chains, []),
          }
        : null,
      generated: r2Content.generated,
      jsonld: r2Content.jsonld,
    };

    // 캐시 저장
    if (KV_CACHE) {
      await setCache(KV_CACHE, cacheKey, response, CACHE_TTL.DETAIL);
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching airdrop detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
