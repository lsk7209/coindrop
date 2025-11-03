import { NextRequest, NextResponse } from 'next/server';
import { collectAndSave } from '@/lib/collector';
import { getCloudflareEnv } from '@/lib/cf-bindings';
import { getEnv, getQueue } from '@/lib/edge-compat';

export const runtime = 'edge';

/**
 * POST /api/admin/collect
 * DeFiLlama 수집 수동 트리거
 * 
 * 인증: 간단한 토큰 검증
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const expectedToken = getEnv('COLLECT_TOKEN', 'default-collect-token');

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cloudflare 바인딩 접근
    const env = getCloudflareEnv(request);
    const { DB, KV_CACHE } = env;

    if (!DB || !KV_CACHE) {
      return NextResponse.json(
        { error: 'Database or KV not available' },
        { status: 500 }
      );
    }

    // Queue 접근
    const queueInstance = getQueue();
    const queue = queueInstance || {
      send: async (message: unknown) => {
        console.warn('Queue not available, message:', JSON.stringify(message));
        // 개발 환경에서는 로그만 기록, 수집은 계속 진행
      },
    };

    // 수집 실행
    const startTime = Date.now();
    const result = await collectAndSave(DB, KV_CACHE, queue);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Collect error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/collect
 * 수집 상태 확인
 */
export async function GET() {
  try {
    // 간단한 상태 확인 (KV에서 ETag 조회)
    // 실제로는 환경 변수로 KV 접근이 어려울 수 있음
    return NextResponse.json({
      status: 'ready',
      message: 'Use POST /api/admin/collect to trigger collection',
      note: 'Requires Bearer token authentication',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

