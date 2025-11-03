/**
 * Queue Consumer Worker
 * Generator 메시지 처리
 */

import { QueueGenerateMessageSchema } from '../lib/schema';
import OpenAI from 'openai';
import {
  getAirdropById,
  getProjectBySlug,
  upsertContent,
} from '../lib/db';
import {
  generateContent,
  lintContent,
  calculateQualityScores,
  createR2Content,
} from '../lib/generator';
import { createSlug, nowUTC } from '../lib/utils';
import { deleteCache, CacheKey } from '../lib/kv';
import type { Content } from '../lib/schema';

export interface Env {
  DB: D1Database;
  R2_CONTENTS: R2Bucket;
  KV_CACHE: KVNamespace;
  OPENAI_API_KEY: string;
  MAKE_WEBHOOK_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  REVALIDATE_TOKEN?: string;
  BASE_URL?: string;
}

export default {
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        // 스키마 검증
        const payload = QueueGenerateMessageSchema.parse(
          JSON.parse(message.body as string)
        );

        // 재시도 횟수 확인
        if (payload.retry_count >= 3) {
          // Dead Letter로 이동
          console.error(
            `Message failed after 3 retries: ${message.id}`,
            payload
          );
          await saveDeadLetter(env, message.id, payload, 'Max retries exceeded');
          message.ack();
          continue;
        }

        // 데이터 조회
        const airdrop = await getAirdropById(env.DB, payload.airdrop_id);
        if (!airdrop) {
          throw new Error(`Airdrop not found: ${payload.airdrop_id}`);
        }

        const project = await getProjectBySlug(env.DB, payload.project_slug);
        if (!project) {
          throw new Error(`Project not found: ${payload.project_slug}`);
        }

        // OpenAI 클라이언트 초기화
        const openai = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        });

        // 콘텐츠 생성
        const generated = await generateContent(
          openai,
          project,
          airdrop,
          airdrop.source_ref || ''
        );

        // Lint 검사
        const lintErrors = lintContent(generated);

        // 품질 점수 계산
        const qualityScores = calculateQualityScores(generated, lintErrors);

        // R2Content 생성
        // Base URL은 환경 변수 또는 기본값 사용
        let baseUrl = env.BASE_URL || 'https://coindrop.kr';
        if (env.MAKE_WEBHOOK_URL && !env.BASE_URL) {
          try {
            baseUrl = new URL(env.MAKE_WEBHOOK_URL).origin;
          } catch {
            // URL 파싱 실패 시 기본값 사용
          }
        }
        const r2Content = createR2Content(
          project,
          airdrop,
          generated,
          baseUrl
        );

        // R2 키 생성
        const chain = payload.chain;
        const slug = createSlug(`${project.slug}-${chain}`);
        const r2Key = `contents/airdrop/${chain}/${slug}.json`;

        // R2에 저장
        await env.R2_CONTENTS.put(r2Key, JSON.stringify(r2Content), {
          httpMetadata: {
            contentType: 'application/json',
            cacheControl: 'public, max-age=3600',
          },
        });

        // D1 contents 테이블 업데이트
        const now = nowUTC();
        const contentSlug = createSlug(`${project.slug}-${chain}-guide`);
        const contentId = await upsertContent(env.DB, {
          airdrop_id: airdrop.id,
          slug: contentSlug,
          title: generated.title,
          summary: generated.summary,
          hashtags: JSON.stringify(generated.hashtags),
          quality_scores: JSON.stringify(qualityScores),
          lint_errors:
            lintErrors.length > 0 ? JSON.stringify(lintErrors) : null,
          r2_key: r2Key,
          published_at: now,
          updated_at: now,
          schema_version: 101,
        });

        // KV 캐시 무효화
        await deleteCache(env.KV_CACHE, CacheKey.airdropDetail(chain, slug));
        await deleteCache(env.KV_CACHE, CacheKey.airdropList(''));

        // ISR 재검증 웹훅 호출 (Next.js)
        try {
          const revalidateToken = env.REVALIDATE_TOKEN || 'default-token';
          const revalidateUrl = `${baseUrl}/api/revalidate`;
          await fetch(revalidateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${revalidateToken}`,
            },
            body: JSON.stringify({
              path: `/airdrops/${chain}/${slug}/airdrop-guide`,
            }),
          });
        } catch (error) {
          console.error('Revalidate error:', error);
          // 계속 진행
        }

        // Make.com 웹훅 발행 (선택적)
        if (env.MAKE_WEBHOOK_URL) {
          try {
            await fetch(env.MAKE_WEBHOOK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                event: 'content.published',
                content_id: contentId,
                slug: contentSlug,
                chain,
                title: generated.title,
                url: `${baseUrl}/airdrops/${chain}/${slug}/airdrop-guide`,
              }),
            });
          } catch (error) {
            console.error('Make.com webhook error:', error);
            // 계속 진행
          }
        }

        console.log(
          `Content generated successfully: ${contentSlug} (quality: ${qualityScores.seo}/${qualityScores.aeo}/${qualityScores.geneo})`
        );

        message.ack();
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);

        // 지수 백오프 재시도 (3, 9, 27분)
        const retryDelays = [180, 540, 1620]; // 초 단위
        const messageBody = JSON.parse(message.body as string);
        const retryCount = (messageBody.retry_count || 0) + 1;

        if (retryCount < retryDelays.length) {
          // Cloudflare Queue는 retry 시 메시지 본문을 변경할 수 없음
          // 재시도 횟수는 큐 시스템이 자동으로 관리
          message.retry({
            delaySeconds: retryDelays[retryCount - 1],
          });
        } else {
          // 최대 재시도 초과 - Dead Letter로 저장
          await saveDeadLetter(
            env,
            message.id,
            messageBody,
            errorToString(error)
          );
          message.ack();
        }
      }
    }
  },
};

async function saveDeadLetter(
  env: Env,
  messageId: string,
  payload: unknown,
  error: string
): Promise<void> {
  try {
    const key = `dead-letters/${Date.now()}-${messageId}.json`;
    await env.R2_CONTENTS.put(
      key,
      JSON.stringify({
        message_id: messageId,
        payload,
        error,
        timestamp: new Date().toISOString(),
      }),
      {
        httpMetadata: {
          contentType: 'application/json',
        },
      }
    );

    // Telegram 알림 (선택적)
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try {
        await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: env.TELEGRAM_CHAT_ID,
              text: `🚨 Dead Letter: ${messageId}\nError: ${error}`,
            }),
          }
        );
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
      }
    }
  } catch (saveError) {
    console.error('Failed to save dead letter:', saveError);
  }
}

function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}
