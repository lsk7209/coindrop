/**
 * 로컬 환경에서 DeFiLlama 수집 테스트
 * 
 * 사용법:
 * 1. wrangler 로컬 D1 설정 확인
 * 2. npm run collect:local
 */

import { collectAndSave } from '../lib/collector';

// 로컬 환경에서는 wrangler를 통해 바인딩 접근
// 이 스크립트는 wrangler dev 또는 wrangler pages dev 환경에서 실행되어야 함

async function main() {
  console.log('🚀 DeFiLlama 수집 시작...\n');

  try {
    // @ts-ignore - Cloudflare 로컬 환경 전용
    const db = (globalThis as any).DB;
    // @ts-ignore
    const kv = (globalThis as any).KV_CACHE;
    // @ts-ignore
    const queue = (globalThis as any).q;

    if (!db || !kv) {
      console.error('❌ DB or KV not available. Run with: wrangler pages dev');
      console.log('\n💡 로컬 테스트 방법:');
      console.log('   1. wrangler pages dev');
      console.log('   2. 다른 터미널에서: curl http://localhost:8788/api/admin/collect -X POST -H "Authorization: Bearer default-collect-token"');
      process.exit(1);
    }

    const mockQueue = {
      send: async (message: unknown) => {
        if (queue) {
          await queue.send(message);
          console.log('✅ Queue message sent:', JSON.stringify(message));
        } else {
          console.log('⚠️  Queue not available, message:', JSON.stringify(message));
        }
      },
    };

    const startTime = Date.now();
    const result = await collectAndSave(db, kv, mockQueue);
    const duration = Date.now() - startTime;

    console.log('\n📊 수집 결과:');
    console.log(`   처리된 프로토콜: ${result.processed}개`);
    console.log(`   신규 프로젝트: ${result.newProjects}개`);
    console.log(`   신규 에어드랍: ${result.newAirdrops}개`);
    console.log(`   소요 시간: ${duration}ms`);
    console.log('\n✅ 수집 완료!');
  } catch (error) {
    console.error('\n❌ 수집 실패:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// 실행
main();

