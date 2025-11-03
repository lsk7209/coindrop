/**
 * Newsletter Worker
 * 매일 09:00 KST에 뉴스레터 발송
 */

import { Resend } from 'resend';

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(sendNewsletter(env));
  },
};

async function sendNewsletter(env: Env): Promise<void> {
  try {
    console.log('Newsletter: Starting digest...');

    // 24h 신규 콘텐츠 집계 (UTC 기준)
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - 86400; // 24시간 전

    const newContents = await env.DB.prepare(`
      SELECT 
        c.id,
        c.title,
        c.summary,
        c.slug,
        p.name as project_name,
        p.chains,
        a.status,
        a.deadline_at
      FROM contents c
      INNER JOIN airdrops a ON c.airdrop_id = a.id
      INNER JOIN projects p ON a.project_id = p.id
      WHERE c.published_at >= ? AND c.published_at < ?
      ORDER BY c.published_at DESC
      LIMIT 20
    `)
      .bind(yesterday, now)
      .all<{
        id: number;
        title: string;
        summary: string;
        slug: string;
        project_name: string;
        chains: string;
        status: string;
        deadline_at: number | null;
      }>();

    if (!newContents.results || newContents.results.length === 0) {
      console.log('Newsletter: No new contents, skipping');
      return;
    }

    // 활성 구독자 목록 조회
    const subscribers = await env.DB.prepare(`
      SELECT id, email, interests
      FROM subscribers
      WHERE is_active = 1
      ORDER BY id ASC
    `).all<{
      id: number;
      email: string;
      interests: string;
    }>();

    if (!subscribers.results || subscribers.results.length === 0) {
      console.log('Newsletter: No active subscribers');
      return;
    }

    // Resend 클라이언트 초기화
    const resend = new Resend(env.RESEND_API_KEY);

    // HTML 템플릿 생성
    const htmlContent = generateNewsletterHTML(newContents.results);
    const textContent = generateNewsletterText(newContents.results);

    let successCount = 0;
    let failCount = 0;

    // 각 구독자에게 발송
    for (const subscriber of subscribers.results) {
      try {
        const result = await resend.emails.send({
          from: 'CoinDrop.kr <newsletter@coindrop.kr>',
          to: subscriber.email,
          subject: `[CoinDrop.kr] 오늘의 신규 에어드랍 ${newContents.results.length}개`,
          html: htmlContent,
          text: textContent,
        });

        if (result.error) {
          console.error(`Failed to send to ${subscriber.email}:`, result.error);
          failCount++;
        } else {
          successCount++;
          // 발송 로그 기록
          await env.DB.prepare(`
            UPDATE subscribers
            SET last_sent_at = ?
            WHERE id = ?
          `)
            .bind(now, subscriber.id)
            .run();
        }
      } catch (error) {
        console.error(`Error sending to ${subscriber.email}:`, error);
        failCount++;
      }
    }

    console.log(
      `Newsletter: Sent ${successCount} emails, ${failCount} failed`
    );
  } catch (error) {
    console.error('Newsletter error:', error);
    throw error;
  }
}

function generateNewsletterHTML(
  contents: Array<{
    id: number;
    title: string;
    summary: string;
    slug: string;
    project_name: string;
    chains: string;
    status: string;
    deadline_at: number | null;
  }>
): string {
  const baseUrl = 'https://coindrop.kr';
  const items = contents
    .map((content) => {
      const chains = JSON.parse(content.chains);
      const chain = chains[0] || 'unknown';
      const url = `${baseUrl}/airdrops/${chain}/${content.slug}/airdrop-guide`;
      const deadline = content.deadline_at
        ? new Date(content.deadline_at * 1000).toLocaleDateString('ko-KR')
        : null;

      return `
        <div style="margin-bottom: 2rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="margin-top: 0;">
            <a href="${url}" style="color: #0066cc; text-decoration: none;">${content.title}</a>
          </h3>
          <p style="color: #666; margin: 0.5rem 0;">${content.summary}</p>
          <div style="font-size: 0.875rem; color: #999;">
            <span>프로젝트: ${content.project_name}</span>
            ${deadline ? ` | <span>마감: ${deadline}</span>` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h1 style="color: #0066cc;">CoinDrop.kr 뉴스레터</h1>
        <p>오늘 신규로 추가된 에어드랍 ${contents.length}개를 알려드립니다.</p>
        ${items}
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 0.875rem; color: #999;">
          <a href="${baseUrl}/newsletter/unsubscribe">구독 해지</a> | 
          <a href="${baseUrl}">CoinDrop.kr 방문</a>
        </p>
      </body>
    </html>
  `;
}

function generateNewsletterText(
  contents: Array<{
    id: number;
    title: string;
    summary: string;
    slug: string;
    project_name: string;
    chains: string;
    status: string;
    deadline_at: number | null;
  }>
): string {
  const baseUrl = 'https://coindrop.kr';
  const items = contents
    .map((content, idx) => {
      const chains = JSON.parse(content.chains);
      const chain = chains[0] || 'unknown';
      const url = `${baseUrl}/airdrops/${chain}/${content.slug}/airdrop-guide`;
      const deadline = content.deadline_at
        ? new Date(content.deadline_at * 1000).toLocaleDateString('ko-KR')
        : null;

      return `
${idx + 1}. ${content.title}
   ${content.summary}
   프로젝트: ${content.project_name}
   ${deadline ? `마감: ${deadline}` : ''}
   ${url}
      `;
    })
    .join('\n\n');

  return `
CoinDrop.kr 뉴스레터

오늘 신규로 추가된 에어드랍 ${contents.length}개를 알려드립니다.

${items}

---
구독 해지: ${baseUrl}/newsletter/unsubscribe
CoinDrop.kr 방문: ${baseUrl}
  `.trim();
}
