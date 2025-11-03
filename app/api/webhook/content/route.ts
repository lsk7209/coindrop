import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhook/content
 * Make.com 배포용 웹훅
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, content_id, slug, chain, title, url } = body;

    // TODO: Make.com 웹훅 처리 로직
    // 실제로는 Make.com에서 호출하는 엔드포인트
    // 여기서는 로그만 기록

    console.log('Content webhook:', {
      event,
      content_id,
      slug,
      chain,
      title,
      url,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing content webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

