import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getEnv } from '@/lib/edge-compat';

/**
 * POST /api/revalidate
 * ISR 재검증 웹훅
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    const expectedToken = getEnv('REVALIDATE_TOKEN', 'default-token');

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { path } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Next.js revalidatePath 호출
    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
