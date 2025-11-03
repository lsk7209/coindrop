/**
 * Collector Worker
 * DeFiLlama API에서 에어드랍 후보 수집
 */

import { collectAndSave } from '../lib/collector';

export interface Env {
  DB: D1Database;
  R2_CONTENTS: R2Bucket;
  KV_CACHE: KVNamespace;
  q: Queue;
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(collectAndEnqueue(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    // 수동 트리거용
    if (request.method === 'POST') {
      const result = await collectAndEnqueue(env);
      return new Response(
        JSON.stringify({
          success: true,
          ...result,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response('Method not allowed', { status: 405 });
  },
};

async function collectAndEnqueue(env: Env): Promise<{
  processed: number;
  newProjects: number;
  newAirdrops: number;
}> {
  try {
    console.log('Collector: Starting collection...');

    const result = await collectAndSave(env.DB, env.KV_CACHE, env.q);

    console.log(
      `Collector: Processed ${result.processed} protocols, ` +
        `${result.newProjects} new projects, ` +
        `${result.newAirdrops} new airdrops`
    );

    return result;
  } catch (error) {
    console.error('Collector error:', error);
    throw error;
  }
}

